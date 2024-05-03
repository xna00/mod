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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/base/common/async"], function (require, exports, log_1, tunnel_1, lifecycle_1, errors_1, async_1) {
    "use strict";
    var SharedProcessTunnelService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessTunnelService = void 0;
    class TunnelData extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._address = null;
            this._addressPromise = null;
        }
        async getAddress() {
            if (this._address) {
                // address is resolved
                return this._address;
            }
            if (!this._addressPromise) {
                this._addressPromise = new async_1.DeferredPromise();
            }
            return this._addressPromise.p;
        }
        setAddress(address) {
            this._address = address;
            if (this._addressPromise) {
                this._addressPromise.complete(address);
                this._addressPromise = null;
            }
        }
        setTunnel(tunnel) {
            this._register(tunnel);
        }
    }
    let SharedProcessTunnelService = class SharedProcessTunnelService extends lifecycle_1.Disposable {
        static { SharedProcessTunnelService_1 = this; }
        static { this._lastId = 0; }
        constructor(_tunnelService, _logService) {
            super();
            this._tunnelService = _tunnelService;
            this._logService = _logService;
            this._tunnels = new Map();
            this._disposedTunnels = new Set();
        }
        dispose() {
            super.dispose();
            this._tunnels.forEach((tunnel) => tunnel.dispose());
        }
        async createTunnel() {
            const id = String(++SharedProcessTunnelService_1._lastId);
            return { id };
        }
        async startTunnel(authority, id, tunnelRemoteHost, tunnelRemotePort, tunnelLocalHost, tunnelLocalPort, elevateIfNeeded) {
            const tunnelData = new TunnelData();
            const tunnel = await Promise.resolve(this._tunnelService.openTunnel(authority, tunnelData, tunnelRemoteHost, tunnelRemotePort, tunnelLocalHost, tunnelLocalPort, elevateIfNeeded));
            if (!tunnel || (typeof tunnel === 'string')) {
                this._logService.info(`[SharedProcessTunnelService] Could not create a tunnel to ${tunnelRemoteHost}:${tunnelRemotePort} (remote).`);
                tunnelData.dispose();
                throw new Error(`Could not create tunnel`);
            }
            if (this._disposedTunnels.has(id)) {
                // This tunnel was disposed in the meantime
                this._disposedTunnels.delete(id);
                tunnelData.dispose();
                await tunnel.dispose();
                throw (0, errors_1.canceled)();
            }
            tunnelData.setTunnel(tunnel);
            this._tunnels.set(id, tunnelData);
            this._logService.info(`[SharedProcessTunnelService] Created tunnel ${id}: ${tunnel.localAddress} (local) to ${tunnelRemoteHost}:${tunnelRemotePort} (remote).`);
            const result = {
                tunnelLocalPort: tunnel.tunnelLocalPort,
                localAddress: tunnel.localAddress
            };
            return result;
        }
        async setAddress(id, address) {
            const tunnel = this._tunnels.get(id);
            if (!tunnel) {
                return;
            }
            tunnel.setAddress(address);
        }
        async destroyTunnel(id) {
            const tunnel = this._tunnels.get(id);
            if (tunnel) {
                this._logService.info(`[SharedProcessTunnelService] Disposing tunnel ${id}.`);
                this._tunnels.delete(id);
                await tunnel.dispose();
                return;
            }
            // Looks like this tunnel is still starting, mark the id as disposed
            this._disposedTunnels.add(id);
        }
    };
    exports.SharedProcessTunnelService = SharedProcessTunnelService;
    exports.SharedProcessTunnelService = SharedProcessTunnelService = SharedProcessTunnelService_1 = __decorate([
        __param(0, tunnel_1.ISharedTunnelsService),
        __param(1, log_1.ILogService)
    ], SharedProcessTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkUHJvY2Vzc1R1bm5lbFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3R1bm5lbC9ub2RlL3NoYXJlZFByb2Nlc3NUdW5uZWxTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFVaEcsTUFBTSxVQUFXLFNBQVEsc0JBQVU7UUFLbEM7WUFDQyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVTtZQUNmLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNuQixzQkFBc0I7Z0JBQ3RCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN0QixDQUFDO1lBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLHVCQUFlLEVBQVksQ0FBQztZQUN4RCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBRUQsVUFBVSxDQUFDLE9BQWlCO1lBQzNCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUMxQixJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDN0IsQ0FBQztRQUNGLENBQUM7UUFFRCxTQUFTLENBQUMsTUFBb0I7WUFDN0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMs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