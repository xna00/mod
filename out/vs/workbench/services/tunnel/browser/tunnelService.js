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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/workbench/services/environment/common/environmentService"], function (require, exports, configuration_1, extensions_1, log_1, tunnel_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelService = void 0;
    let TunnelService = class TunnelService extends tunnel_1.AbstractTunnelService {
        constructor(logService, environmentService, configurationService) {
            super(logService, configurationService);
            this.environmentService = environmentService;
        }
        isPortPrivileged(_port) {
            return false;
        }
        retainOrCreateTunnel(tunnelProvider, remoteHost, remotePort, _localHost, localPort, elevateIfNeeded, privacy, protocol) {
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            if ((0, tunnel_1.isTunnelProvider)(tunnelProvider)) {
                return this.createWithProvider(tunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol);
            }
            return undefined;
        }
        canTunnel(uri) {
            return super.canTunnel(uri) && !!this.environmentService.remoteAuthority;
        }
    };
    exports.TunnelService = TunnelService;
    exports.TunnelService = TunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, configuration_1.IConfigurationService)
    ], TunnelService);
    (0, extensions_1.registerSingleton)(tunnel_1.ITunnelService, TunnelService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3R1bm5lbC9icm93c2VyL3R1bm5lbFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBVXpGLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWMsU0FBUSw4QkFBcUI7UUFDdkQsWUFDYyxVQUF1QixFQUNFLGtCQUFnRCxFQUMvRCxvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLFVBQVUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBSEYsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtRQUl2RixDQUFDO1FBRU0sZ0JBQWdCLENBQUMsS0FBYTtZQUNwQyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFUyxvQkFBb0IsQ0FBQyxjQUFrRCxFQUFFLFVBQWtCLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUFFLFNBQTZCLEVBQUUsZUFBd0IsRUFBRSxPQUFnQixFQUFFLFFBQWlCO1lBQzFPLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDL0QsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3BCLE9BQU8sUUFBUSxDQUFDLEtBQUssQ0FBQztZQUN2QixDQUFDO1lBRUQsSUFBSSxJQUFBLHlCQUFnQixFQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZILENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRVEsU0FBUyxDQUFDLEdBQVE7WUFDMUIsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO1FBQzFFLENBQUM7S0FDRCxDQUFBO0lBN0JZLHNDQUFhOzRCQUFiLGFBQWE7UUFFdkIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLHFDQUFxQixDQUFBO09BSlgsYUFBYSxDQTZCekI7SUFFRCxJQUFBLDhCQUFpQixFQUFDLHVCQUFjLEVBQUUsYUFBYSxvQ0FBNEIsQ0FBQyJ9