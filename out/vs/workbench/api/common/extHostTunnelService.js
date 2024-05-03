/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypes"], function (require, exports, cancellation_1, event_1, lifecycle_1, nls, instantiation_1, log_1, tunnel_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1, types) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTunnelService = exports.IExtHostTunnelService = exports.TunnelDtoConverter = void 0;
    class ExtensionTunnel extends tunnel_1.DisposableTunnel {
    }
    var TunnelDtoConverter;
    (function (TunnelDtoConverter) {
        function fromApiTunnel(tunnel) {
            return {
                remoteAddress: tunnel.remoteAddress,
                localAddress: tunnel.localAddress,
                public: !!tunnel.public,
                privacy: tunnel.privacy ?? (tunnel.public ? tunnel_1.TunnelPrivacyId.Public : tunnel_1.TunnelPrivacyId.Private),
                protocol: tunnel.protocol
            };
        }
        TunnelDtoConverter.fromApiTunnel = fromApiTunnel;
        function fromServiceTunnel(tunnel) {
            return {
                remoteAddress: {
                    host: tunnel.tunnelRemoteHost,
                    port: tunnel.tunnelRemotePort
                },
                localAddress: tunnel.localAddress,
                public: tunnel.privacy !== tunnel_1.TunnelPrivacyId.ConstantPrivate && tunnel.privacy !== tunnel_1.TunnelPrivacyId.ConstantPrivate,
                privacy: tunnel.privacy,
                protocol: tunnel.protocol
            };
        }
        TunnelDtoConverter.fromServiceTunnel = fromServiceTunnel;
    })(TunnelDtoConverter || (exports.TunnelDtoConverter = TunnelDtoConverter = {}));
    exports.IExtHostTunnelService = (0, instantiation_1.createDecorator)('IExtHostTunnelService');
    let ExtHostTunnelService = class ExtHostTunnelService extends lifecycle_1.Disposable {
        constructor(extHostRpc, initData, logService) {
            super();
            this.logService = logService;
            this._showCandidatePort = () => { return Promise.resolve(true); };
            this._extensionTunnels = new Map();
            this._onDidChangeTunnels = new event_1.Emitter();
            this.onDidChangeTunnels = this._onDidChangeTunnels.event;
            this._providerHandleCounter = 0;
            this._portAttributesProviders = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTunnelService);
        }
        async openTunnel(extension, forward) {
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) ${extension.identifier.value} called openTunnel API for ${forward.remoteAddress.host}:${forward.remoteAddress.port}.`);
            const tunnel = await this._proxy.$openTunnel(forward, extension.displayName);
            if (tunnel) {
                const disposableTunnel = new ExtensionTunnel(tunnel.remoteAddress, tunnel.localAddress, () => {
                    return this._proxy.$closeTunnel(tunnel.remoteAddress);
                });
                this._register(disposableTunnel);
                return disposableTunnel;
            }
            return undefined;
        }
        async getTunnels() {
            return this._proxy.$getTunnels();
        }
        nextPortAttributesProviderHandle() {
            return this._providerHandleCounter++;
        }
        registerPortsAttributesProvider(portSelector, provider) {
            if (portSelector.portRange === undefined && portSelector.commandPattern === undefined) {
                this.logService.error('PortAttributesProvider must specify either a portRange or a commandPattern');
            }
            const providerHandle = this.nextPortAttributesProviderHandle();
            this._portAttributesProviders.set(providerHandle, { selector: portSelector, provider });
            this._proxy.$registerPortsAttributesProvider(portSelector, providerHandle);
            return new types.Disposable(() => {
                this._portAttributesProviders.delete(providerHandle);
                this._proxy.$unregisterPortsAttributesProvider(providerHandle);
            });
        }
        async $providePortAttributes(handles, ports, pid, commandLine, cancellationToken) {
            const providedAttributes = [];
            for (const handle of handles) {
                const provider = this._portAttributesProviders.get(handle);
                if (!provider) {
                    return [];
                }
                providedAttributes.push(...(await Promise.all(ports.map(async (port) => {
                    let providedAttributes;
                    try {
                        providedAttributes = await provider.provider.providePortAttributes({ port, pid, commandLine }, cancellationToken);
                    }
                    catch (e) {
                        // Call with old signature for breaking API change
                        providedAttributes = await provider.provider.providePortAttributes(port, pid, commandLine, cancellationToken);
                    }
                    return { providedAttributes, port };
                }))));
            }
            const allAttributes = providedAttributes.filter(attribute => !!attribute.providedAttributes);
            return (allAttributes.length > 0) ? allAttributes.map(attributes => {
                return {
                    autoForwardAction: attributes.providedAttributes.autoForwardAction,
                    port: attributes.port
                };
            }) : [];
        }
        async $registerCandidateFinder(_enable) { }
        registerTunnelProvider(provider, information) {
            if (this._forwardPortProvider) {
                throw new Error('A tunnel provider has already been registered. Only the first tunnel provider to be registered will be used.');
            }
            this._forwardPortProvider = async (tunnelOptions, tunnelCreationOptions) => {
                const result = await provider.provideTunnel(tunnelOptions, tunnelCreationOptions, cancellation_1.CancellationToken.None);
                return result ?? undefined;
            };
            const tunnelFeatures = information.tunnelFeatures ? {
                elevation: !!information.tunnelFeatures?.elevation,
                privacyOptions: information.tunnelFeatures?.privacyOptions,
                protocol: information.tunnelFeatures.protocol === undefined ? true : information.tunnelFeatures.protocol,
            } : undefined;
            this._proxy.$setTunnelProvider(tunnelFeatures);
            return Promise.resolve((0, lifecycle_1.toDisposable)(() => {
                this._forwardPortProvider = undefined;
                this._proxy.$setTunnelProvider(undefined);
            }));
        }
        /**
         * Applies the tunnel metadata and factory found in the remote authority
         * resolver to the tunnel system.
         *
         * `managedRemoteAuthority` should be be passed if the resolver returned on.
         * If this is the case, the tunnel cannot be connected to via a websocket from
         * the share process, so a synethic tunnel factory is used as a default.
         */
        async setTunnelFactory(provider, managedRemoteAuthority) {
            // Do not wait for any of the proxy promises here.
            // It will delay startup and there is nothing that needs to be waited for.
            if (provider) {
                if (provider.candidatePortSource !== undefined) {
                    this._proxy.$setCandidatePortSource(provider.candidatePortSource);
                }
                if (provider.showCandidatePort) {
                    this._showCandidatePort = provider.showCandidatePort;
                    this._proxy.$setCandidateFilter();
                }
                const tunnelFactory = provider.tunnelFactory ?? (managedRemoteAuthority ? this.makeManagedTunnelFactory(managedRemoteAuthority) : undefined);
                if (tunnelFactory) {
                    this._forwardPortProvider = tunnelFactory;
                    let privacyOptions = provider.tunnelFeatures?.privacyOptions ?? [];
                    if (provider.tunnelFeatures?.public && (privacyOptions.length === 0)) {
                        privacyOptions = [
                            {
                                id: 'private',
                                label: nls.localize('tunnelPrivacy.private', "Private"),
                                themeIcon: 'lock'
                            },
                            {
                                id: 'public',
                                label: nls.localize('tunnelPrivacy.public', "Public"),
                                themeIcon: 'eye'
                            }
                        ];
                    }
                    const tunnelFeatures = provider.tunnelFeatures ? {
                        elevation: !!provider.tunnelFeatures?.elevation,
                        public: !!provider.tunnelFeatures?.public,
                        privacyOptions,
                        protocol: true
                    } : undefined;
                    this._proxy.$setTunnelProvider(tunnelFeatures);
                }
            }
            else {
                this._forwardPortProvider = undefined;
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this._forwardPortProvider = undefined;
            });
        }
        makeManagedTunnelFactory(_authority) {
            return undefined; // may be overridden
        }
        async $closeTunnel(remote, silent) {
            if (this._extensionTunnels.has(remote.host)) {
                const hostMap = this._extensionTunnels.get(remote.host);
                if (hostMap.has(remote.port)) {
                    if (silent) {
                        hostMap.get(remote.port).disposeListener.dispose();
                    }
                    await hostMap.get(remote.port).tunnel.dispose();
                    hostMap.delete(remote.port);
                }
            }
        }
        async $onDidTunnelsChange() {
            this._onDidChangeTunnels.fire();
        }
        async $forwardPort(tunnelOptions, tunnelCreationOptions) {
            if (this._forwardPortProvider) {
                try {
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Getting tunnel from provider.');
                    const providedPort = this._forwardPortProvider(tunnelOptions, tunnelCreationOptions);
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Got tunnel promise from provider.');
                    if (providedPort !== undefined) {
                        const tunnel = await providedPort;
                        this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Successfully awaited tunnel from provider.');
                        if (tunnel === undefined) {
                            this.logService.error('ForwardedPorts: (ExtHostTunnelService) Resolved tunnel is undefined');
                            return undefined;
                        }
                        if (!this._extensionTunnels.has(tunnelOptions.remoteAddress.host)) {
                            this._extensionTunnels.set(tunnelOptions.remoteAddress.host, new Map());
                        }
                        const disposeListener = this._register(tunnel.onDidDispose(() => {
                            this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Extension fired tunnel\'s onDidDispose.');
                            return this._proxy.$closeTunnel(tunnel.remoteAddress);
                        }));
                        this._extensionTunnels.get(tunnelOptions.remoteAddress.host).set(tunnelOptions.remoteAddress.port, { tunnel, disposeListener });
                        return TunnelDtoConverter.fromApiTunnel(tunnel);
                    }
                    else {
                        this.logService.trace('ForwardedPorts: (ExtHostTunnelService) Tunnel is undefined');
                    }
                }
                catch (e) {
                    this.logService.trace('ForwardedPorts: (ExtHostTunnelService) tunnel provider error');
                    if (e instanceof Error) {
                        return e.message;
                    }
                }
            }
            return undefined;
        }
        async $applyCandidateFilter(candidates) {
            const filter = await Promise.all(candidates.map(candidate => this._showCandidatePort(candidate.host, candidate.port, candidate.detail ?? '')));
            const result = candidates.filter((candidate, index) => filter[index]);
            this.logService.trace(`ForwardedPorts: (ExtHostTunnelService) filtered from ${candidates.map(port => port.port).join(', ')} to ${result.map(port => port.port).join(', ')}`);
            return result;
        }
    };
    exports.ExtHostTunnelService = ExtHostTunnelService;
    exports.ExtHostTunnelService = ExtHostTunnelService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, log_1.ILogService)
    ], ExtHostTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFR1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUdW5uZWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWlCaEcsTUFBTSxlQUFnQixTQUFRLHlCQUFnQjtLQUE2QjtJQUUzRSxJQUFpQixrQkFBa0IsQ0FzQmxDO0lBdEJELFdBQWlCLGtCQUFrQjtRQUNsQyxTQUFnQixhQUFhLENBQUMsTUFBcUI7WUFDbEQsT0FBTztnQkFDTixhQUFhLEVBQUUsTUFBTSxDQUFDLGFBQWE7Z0JBQ25DLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTtnQkFDakMsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTTtnQkFDdkIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyx3QkFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsd0JBQWUsQ0FBQyxPQUFPLENBQUM7Z0JBQzdGLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTthQUN6QixDQUFDO1FBQ0gsQ0FBQztRQVJlLGdDQUFhLGdCQVE1QixDQUFBO1FBQ0QsU0FBZ0IsaUJBQWlCLENBQUMsTUFBb0I7WUFDckQsT0FBTztnQkFDTixhQUFhLEVBQUU7b0JBQ2QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0I7b0JBQzdCLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCO2lCQUM3QjtnQkFDRCxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7Z0JBQ2pDLE1BQU0sRUFBRSxNQUFNLENBQUMsT0FBTyxLQUFLLHdCQUFlLENBQUMsZUFBZSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssd0JBQWUs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