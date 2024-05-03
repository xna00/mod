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
define(["require", "exports", "vs/nls", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTunnelService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/remote/common/tunnelModel"], function (require, exports, nls, extHost_protocol_1, extHostTunnelService_1, extHostCustomers_1, remoteExplorerService_1, tunnel_1, lifecycle_1, notification_1, configuration_1, log_1, remoteAgentService_1, platform_1, configurationRegistry_1, contextkey_1, tunnelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTunnelService = void 0;
    let MainThreadTunnelService = class MainThreadTunnelService extends lifecycle_1.Disposable {
        constructor(extHostContext, remoteExplorerService, tunnelService, notificationService, configurationService, logService, remoteAgentService, contextKeyService) {
            super();
            this.remoteExplorerService = remoteExplorerService;
            this.tunnelService = tunnelService;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.remoteAgentService = remoteAgentService;
            this.contextKeyService = contextKeyService;
            this.elevateionRetry = false;
            this.portsAttributesProviders = new Map();
            this._alreadyRegistered = false;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTunnelService);
            this._register(tunnelService.onTunnelOpened(() => this._proxy.$onDidTunnelsChange()));
            this._register(tunnelService.onTunnelClosed(() => this._proxy.$onDidTunnelsChange()));
        }
        processFindingEnabled() {
            return (!!this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING) || this.tunnelService.hasTunnelProvider)
                && (this.configurationService.getValue(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING) !== remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_OUTPUT);
        }
        async $setRemoteTunnelService(processId) {
            this.remoteExplorerService.namedProcesses.set(processId, 'Code Extension Host');
            if (this.remoteExplorerService.portsFeaturesEnabled) {
                this._proxy.$registerCandidateFinder(this.processFindingEnabled());
            }
            else {
                this._register(this.remoteExplorerService.onEnabledPortsFeatures(() => this._proxy.$registerCandidateFinder(this.processFindingEnabled())));
            }
            this._register(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_FORWARD_SETTING) || e.affectsConfiguration(remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING)) {
                    return this._proxy.$registerCandidateFinder(this.processFindingEnabled());
                }
            }));
            this._register(this.tunnelService.onAddedTunnelProvider(() => {
                return this._proxy.$registerCandidateFinder(this.processFindingEnabled());
            }));
        }
        async $registerPortsAttributesProvider(selector, providerHandle) {
            this.portsAttributesProviders.set(providerHandle, selector);
            if (!this._alreadyRegistered) {
                this.remoteExplorerService.tunnelModel.addAttributesProvider(this);
                this._alreadyRegistered = true;
            }
        }
        async $unregisterPortsAttributesProvider(providerHandle) {
            this.portsAttributesProviders.delete(providerHandle);
        }
        async providePortAttributes(ports, pid, commandLine, token) {
            if (this.portsAttributesProviders.size === 0) {
                return [];
            }
            // Check all the selectors to make sure it's worth going to the extension host.
            const appropriateHandles = Array.from(this.portsAttributesProviders.entries()).filter(entry => {
                const selector = entry[1];
                const portRange = (typeof selector.portRange === 'number') ? [selector.portRange, selector.portRange + 1] : selector.portRange;
                const portInRange = portRange ? ports.some(port => portRange[0] <= port && port < portRange[1]) : true;
                const commandMatches = !selector.commandPattern || (commandLine && (commandLine.match(selector.commandPattern)));
                return portInRange && commandMatches;
            }).map(entry => entry[0]);
            if (appropriateHandles.length === 0) {
                return [];
            }
            return this._proxy.$providePortAttributes(appropriateHandles, ports, pid, commandLine, token);
        }
        async $openTunnel(tunnelOptions, source) {
            const tunnel = await this.remoteExplorerService.forward({
                remote: tunnelOptions.remoteAddress,
                local: tunnelOptions.localAddressPort,
                name: tunnelOptions.label,
                source: {
                    source: tunnelModel_1.TunnelSource.Extension,
                    description: source
                },
                elevateIfNeeded: false
            });
            if (!tunnel || (typeof tunnel === 'string')) {
                return undefined;
            }
            if (!this.elevateionRetry
                && (tunnelOptions.localAddressPort !== undefined)
                && (tunnel.tunnelLocalPort !== undefined)
                && this.tunnelService.isPortPrivileged(tunnelOptions.localAddressPort)
                && (tunnel.tunnelLocalPort !== tunnelOptions.localAddressPort)
                && this.tunnelService.canElevate) {
                this.elevationPrompt(tunnelOptions, tunnel, source);
            }
            return extHostTunnelService_1.TunnelDtoConverter.fromServiceTunnel(tunnel);
        }
        async elevationPrompt(tunnelOptions, tunnel, source) {
            return this.notificationService.prompt(notification_1.Severity.Info, nls.localize('remote.tunnel.openTunnel', "The extension {0} has forwarded port {1}. You'll need to run as superuser to use port {2} locally.", source, tunnelOptions.remoteAddress.port, tunnelOptions.localAddressPort), [{
                    label: nls.localize('remote.tunnelsView.elevationButton', "Use Port {0} as Sudo...", tunnel.tunnelRemotePort),
                    run: async () => {
                        this.elevateionRetry = true;
                        await this.remoteExplorerService.close({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort }, tunnelModel_1.TunnelCloseReason.Other);
                        await this.remoteExplorerService.forward({
                            remote: tunnelOptions.remoteAddress,
                            local: tunnelOptions.localAddressPort,
                            name: tunnelOptions.label,
                            source: {
                                source: tunnelModel_1.TunnelSource.Extension,
                                description: source
                            },
                            elevateIfNeeded: true
                        });
                        this.elevateionRetry = false;
                    }
                }]);
        }
        async $closeTunnel(remote) {
            return this.remoteExplorerService.close(remote, tunnelModel_1.TunnelCloseReason.Other);
        }
        async $getTunnels() {
            return (await this.tunnelService.tunnels).map(tunnel => {
                return {
                    remoteAddress: { port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost },
                    localAddress: tunnel.localAddress,
                    privacy: tunnel.privacy,
                    protocol: tunnel.protocol
                };
            });
        }
        async $onFoundNewCandidates(candidates) {
            this.remoteExplorerService.onFoundNewCandidates(candidates);
        }
        async $setTunnelProvider(features) {
            const tunnelProvider = {
                forwardPort: (tunnelOptions, tunnelCreationOptions) => {
                    const forward = this._proxy.$forwardPort(tunnelOptions, tunnelCreationOptions);
                    return forward.then(tunnelOrError => {
                        if (!tunnelOrError) {
                            return undefined;
                        }
                        else if (typeof tunnelOrError === 'string') {
                            return tunnelOrError;
                        }
                        const tunnel = tunnelOrError;
                        this.logService.trace(`ForwardedPorts: (MainThreadTunnelService) New tunnel established by tunnel provider: ${tunnel?.remoteAddress.host}:${tunnel?.remoteAddress.port}`);
                        return {
                            tunnelRemotePort: tunnel.remoteAddress.port,
                            tunnelRemoteHost: tunnel.remoteAddress.host,
                            localAddress: typeof tunnel.localAddress === 'string' ? tunnel.localAddress : (0, tunnelModel_1.makeAddress)(tunnel.localAddress.host, tunnel.localAddress.port),
                            tunnelLocalPort: typeof tunnel.localAddress !== 'string' ? tunnel.localAddress.port : undefined,
                            public: tunnel.public,
                            privacy: tunnel.privacy,
                            protocol: tunnel.protocol ?? tunnel_1.TunnelProtocol.Http,
                            dispose: async (silent) => {
                                this.logService.trace(`ForwardedPorts: (MainThreadTunnelService) Closing tunnel from tunnel provider: ${tunnel?.remoteAddress.host}:${tunnel?.remoteAddress.port}`);
                                return this._proxy.$closeTunnel({ host: tunnel.remoteAddress.host, port: tunnel.remoteAddress.port }, silent);
                            }
                        };
                    });
                }
            };
            if (features) {
                this.tunnelService.setTunnelFeatures(features);
            }
            this.tunnelService.setTunnelProvider(tunnelProvider);
            // At this point we clearly want the ports view/features since we have a tunnel factory
            this.contextKeyService.createKey(tunnelModel_1.forwardedPortsViewEnabled.key, true);
        }
        async $setCandidateFilter() {
            this.remoteExplorerService.setCandidateFilter((candidates) => {
                return this._proxy.$applyCandidateFilter(candidates);
            });
        }
        async $setCandidatePortSource(source) {
            // Must wait for the remote environment before trying to set settings there.
            this.remoteAgentService.getEnvironment().then(() => {
                switch (source) {
                    case extHost_protocol_1.CandidatePortSource.None: {
                        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                            .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPorts': false } }]);
                        break;
                    }
                    case extHost_protocol_1.CandidatePortSource.Output: {
                        platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
                            .registerDefaultConfigurations([{ overrides: { 'remote.autoForwardPortsSource': remoteExplorerService_1.PORT_AUTO_SOURCE_SETTING_OUTPUT } }]);
                        break;
                    }
                    default: // Do nothing, the defaults for these settings should be used.
                }
            }).catch(() => {
                // The remote failed to get setup. Errors from that area will already be surfaced to the user.
            });
        }
    };
    exports.MainThreadTunnelService = MainThreadTunnelService;
    exports.MainThreadTunnelService = MainThreadTunnelService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTunnelService),
        __param(1, remoteExplorerService_1.IRemoteExplorerService),
        __param(2, tunnel_1.ITunnelService),
        __param(3, notification_1.INotificationService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, log_1.ILogService),
        __param(6, remoteAgentService_1.IRemoteAgentService),
        __param(7, contextkey_1.IContextKeyService)
    ], MainThreadTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFR1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVHVubmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQnpGLElBQU0sdUJBQXVCLEdBQTdCLE1BQU0sdUJBQXdCLFNBQVEsc0JBQVU7UUFLdEQsWUFDQyxjQUErQixFQUNQLHFCQUE4RCxFQUN0RSxhQUE4QyxFQUN4QyxtQkFBMEQsRUFDekQsb0JBQTRELEVBQ3RFLFVBQXdDLEVBQ2hDLGtCQUF3RCxFQUN6RCxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFSaUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtZQUNyRCxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdkIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUN4Qyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3hDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFYbkUsb0JBQWUsR0FBWSxLQUFLLENBQUM7WUFDakMsNkJBQXdCLEdBQXdDLElBQUksR0FBRyxFQUFFLENBQUM7WUF3QzFFLHVCQUFrQixHQUFZLEtBQUssQ0FBQztZQTNCM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUMzRSxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FB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