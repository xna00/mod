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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/extensions", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/platform/remote/common/sharedProcessTunnelService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/base/common/platform", "vs/platform/configuration/common/configuration"], function (require, exports, log_1, environmentService_1, extensions_1, tunnel_1, lifecycle_1, sharedProcessTunnelService_1, lifecycle_2, remoteAuthorityResolver_1, instantiation_1, environmentService_2, platform_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelService = void 0;
    let SharedProcessTunnel = class SharedProcessTunnel extends lifecycle_1.Disposable {
        constructor(_id, _addressProvider, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort, localAddress, _onBeforeDispose, _sharedProcessTunnelService, _remoteAuthorityResolverService) {
            super();
            this._id = _id;
            this._addressProvider = _addressProvider;
            this.tunnelRemoteHost = tunnelRemoteHost;
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelLocalPort = tunnelLocalPort;
            this.localAddress = localAddress;
            this._onBeforeDispose = _onBeforeDispose;
            this._sharedProcessTunnelService = _sharedProcessTunnelService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this.privacy = tunnel_1.TunnelPrivacyId.Private;
            this.protocol = undefined;
            this._updateAddress();
            this._register(this._remoteAuthorityResolverService.onDidChangeConnectionData(() => this._updateAddress()));
        }
        _updateAddress() {
            this._addressProvider.getAddress().then((address) => {
                this._sharedProcessTunnelService.setAddress(this._id, address);
            });
        }
        async dispose() {
            this._onBeforeDispose();
            super.dispose();
            await this._sharedProcessTunnelService.destroyTunnel(this._id);
        }
    };
    SharedProcessTunnel = __decorate([
        __param(7, sharedProcessTunnelService_1.ISharedProcessTunnelService),
        __param(8, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], SharedProcessTunnel);
    let TunnelService = class TunnelService extends tunnel_1.AbstractTunnelService {
        constructor(logService, _environmentService, _sharedProcessTunnelService, _instantiationService, lifecycleService, _nativeWorkbenchEnvironmentService, configurationService) {
            super(logService, configurationService);
            this._environmentService = _environmentService;
            this._sharedProcessTunnelService = _sharedProcessTunnelService;
            this._instantiationService = _instantiationService;
            this._nativeWorkbenchEnvironmentService = _nativeWorkbenchEnvironmentService;
            this._activeSharedProcessTunnels = new Set();
            // Destroy any shared process tunnels that might still be active
            lifecycleService.onDidShutdown(() => {
                this._activeSharedProcessTunnels.forEach((id) => {
                    this._sharedProcessTunnelService.destroyTunnel(id);
                });
            });
        }
        isPortPrivileged(port) {
            return (0, tunnel_1.isPortPrivileged)(port, this.defaultTunnelHost, platform_1.OS, this._nativeWorkbenchEnvironmentService.os.release);
        }
        retainOrCreateTunnel(addressOrTunnelProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol) {
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            if ((0, tunnel_1.isTunnelProvider)(addressOrTunnelProvider)) {
                return this.createWithProvider(addressOrTunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
            }
            else {
                this.logService.trace(`ForwardedPorts: (TunnelService) Creating tunnel without provider ${remoteHost}:${remotePort} on local port ${localPort}.`);
                const tunnel = this._createSharedProcessTunnel(addressOrTunnelProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded);
                this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created without provider.');
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                return tunnel;
            }
        }
        async _createSharedProcessTunnel(addressProvider, tunnelRemoteHost, tunnelRemotePort, tunnelLocalHost, tunnelLocalPort, elevateIfNeeded) {
            const { id } = await this._sharedProcessTunnelService.createTunnel();
            this._activeSharedProcessTunnels.add(id);
            const authority = this._environmentService.remoteAuthority;
            const result = await this._sharedProcessTunnelService.startTunnel(authority, id, tunnelRemoteHost, tunnelRemotePort, tunnelLocalHost, tunnelLocalPort, elevateIfNeeded);
            const tunnel = this._instantiationService.createInstance(SharedProcessTunnel, id, addressProvider, tunnelRemoteHost, tunnelRemotePort, result.tunnelLocalPort, result.localAddress, () => {
                this._activeSharedProcessTunnels.delete(id);
            });
            return tunnel;
        }
        canTunnel(uri) {
            return super.canTunnel(uri) && !!this._environmentService.remoteAuthority;
        }
    };
    exports.TunnelService = TunnelService;
    exports.TunnelService = TunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, sharedProcessTunnelService_1.ISharedProcessTunnelService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, environmentService_2.INativeWorkbenchEnvironmentService),
        __param(6, configuration_1.IConfigurationService)
    ], TunnelService);
    (0, extensions_1.registerSingleton)(tunnel_1.ITunnelService, TunnelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3R1bm5lbC9lbGVjdHJvbi1zYW5kYm94L3R1bm5lbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBSzNDLFlBQ2tCLEdBQVcsRUFDWCxnQkFBa0MsRUFDbkMsZ0JBQXdCLEVBQ3hCLGdCQUF3QixFQUN4QixlQUFtQyxFQUNuQyxZQUFvQixFQUNuQixnQkFBNEIsRUFDaEIsMkJBQXlFLEVBQ3JFLCtCQUFpRjtZQUVsSCxLQUFLLEVBQUUsQ0FBQztZQVZTLFFBQUcsR0FBSCxHQUFHLENBQVE7WUFDWCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO1lBQ25DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUTtZQUN4QixxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQW9CO1lBQ25DLGlCQUFZLEdBQVosWUFBWSxDQUFRO1lBQ25CLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBWTtZQUNDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBNkI7WUFDcEQsb0NBQStCLEdBQS9CLCtCQUErQixDQUFpQztZQVpuRyxZQUFPLEdBQUcsd0JBQWUsQ0FBQyxPQUFPLENBQUM7WUFDbEMsYUFBUSxHQUF1QixTQUFTLENBQUM7WUFjeEQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFD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