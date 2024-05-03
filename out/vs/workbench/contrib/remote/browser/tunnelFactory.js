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
define(["require", "exports", "vs/nls", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/workbench/services/environment/browser/environmentService", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/services/remote/common/remoteExplorerService", "vs/platform/log/common/log", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/remote/common/tunnelModel"], function (require, exports, nls, tunnel_1, lifecycle_1, environmentService_1, opener_1, uri_1, remoteExplorerService_1, log_1, contextkey_1, tunnelModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelFactoryContribution = void 0;
    let TunnelFactoryContribution = class TunnelFactoryContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.tunnelFactory'; }
        constructor(tunnelService, environmentService, openerService, remoteExplorerService, logService, contextKeyService) {
            super();
            this.openerService = openerService;
            const tunnelFactory = environmentService.options?.tunnelProvider?.tunnelFactory;
            if (tunnelFactory) {
                // At this point we clearly want the ports view/features since we have a tunnel factory
                contextKeyService.createKey(tunnelModel_1.forwardedPortsViewEnabled.key, true);
                let privacyOptions = environmentService.options?.tunnelProvider?.features?.privacyOptions ?? [];
                if (environmentService.options?.tunnelProvider?.features?.public
                    && (privacyOptions.length === 0)) {
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
                this._register(tunnelService.setTunnelProvider({
                    forwardPort: async (tunnelOptions, tunnelCreationOptions) => {
                        let tunnelPromise;
                        try {
                            tunnelPromise = tunnelFactory(tunnelOptions, tunnelCreationOptions);
                        }
                        catch (e) {
                            logService.trace('tunnelFactory: tunnel provider error');
                        }
                        if (!tunnelPromise) {
                            return undefined;
                        }
                        let tunnel;
                        try {
                            tunnel = await tunnelPromise;
                        }
                        catch (e) {
                            logService.trace('tunnelFactory: tunnel provider promise error');
                            if (e instanceof Error) {
                                return e.message;
                            }
                            return undefined;
                        }
                        const localAddress = tunnel.localAddress.startsWith('http') ? tunnel.localAddress : `http://${tunnel.localAddress}`;
                        const remoteTunnel = {
                            tunnelRemotePort: tunnel.remoteAddress.port,
                            tunnelRemoteHost: tunnel.remoteAddress.host,
                            // The tunnel factory may give us an inaccessible local address.
                            // To make sure this doesn't happen, resolve the uri immediately.
                            localAddress: await this.resolveExternalUri(localAddress),
                            privacy: tunnel.privacy ?? (tunnel.public ? tunnel_1.TunnelPrivacyId.Public : tunnel_1.TunnelPrivacyId.Private),
                            protocol: tunnel.protocol ?? tunnel_1.TunnelProtocol.Http,
                            dispose: async () => { await tunnel.dispose(); }
                        };
                        return remoteTunnel;
                    }
                }));
                const tunnelInformation = environmentService.options?.tunnelProvider?.features ?
                    {
                        features: {
                            elevation: !!environmentService.options?.tunnelProvider?.features?.elevation,
                            public: !!environmentService.options?.tunnelProvider?.features?.public,
                            privacyOptions,
                            protocol: environmentService.options?.tunnelProvider?.features?.protocol === undefined ? true : !!environmentService.options?.tunnelProvider?.features?.protocol
                        }
                    } : undefined;
                remoteExplorerService.setTunnelInformation(tunnelInformation);
            }
        }
        async resolveExternalUri(uri) {
            try {
                return (await this.openerService.resolveExternalUri(uri_1.URI.parse(uri))).resolved.toString();
            }
            catch {
                return uri;
            }
        }
    };
    exports.TunnelFactoryContribution = TunnelFactoryContribution;
    exports.TunnelFactoryContribution = TunnelFactoryContribution = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, opener_1.IOpenerService),
        __param(3, remoteExplorerService_1.IRemoteExplorerService),
        __param(4, log_1.ILogService),
        __param(5, contextkey_1.IContextKeyService)
    ], TunnelFactoryContribution);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsRmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvcmVtb3RlL2Jyb3dzZXIvdHVubmVsRmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFjekYsSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtpQkFFeEMsT0FBRSxHQUFHLGlDQUFpQyxBQUFwQyxDQUFxQztRQUV2RCxZQUNpQixhQUE2QixFQUNSLGtCQUF1RCxFQUNwRSxhQUE2QixFQUM3QixxQkFBNkMsRUFDeEQsVUFBdUIsRUFDaEIsaUJBQXFDO1lBRXpELEtBQUssRUFBRSxDQUFDO1lBTGdCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQU1yRCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLGFBQWEsQ0FBQztZQUNoRixJQUFJLGFBQWEsRUFBRSxDQUFDO2dCQUNuQix1RkFBdUY7Z0JBQ3ZGLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyx1Q0FBeUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2pFLElBQUksY0FBYyxHQUFHLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFFLGNBQWMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hHLElBQUksa0JBQWtCLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsTUFBTTt1QkFDNUQsQ0FBQyxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ25DLGNBQWMsR0FBRzt3QkFDaEI7NEJBQ0MsRUFBRSxFQUFFLFNBQVM7NEJBQ2IsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsU0FB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