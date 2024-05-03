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
define(["require", "exports", "net", "os", "vs/base/node/ports", "vs/base/parts/ipc/node/ipc.net", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteAgentConnection", "vs/platform/remote/common/remoteSocketFactoryService", "vs/platform/sign/common/sign", "vs/platform/tunnel/common/tunnel", "vs/base/common/buffer"], function (require, exports, net, os, ports_1, ipc_net_1, async_1, lifecycle_1, platform_1, configuration_1, log_1, productService_1, remoteAgentConnection_1, remoteSocketFactoryService_1, sign_1, tunnel_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedTunnelsService = exports.TunnelService = exports.BaseTunnelService = exports.NodeRemoteTunnel = void 0;
    async function createRemoteTunnel(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort) {
        let readyTunnel;
        for (let attempts = 3; attempts; attempts--) {
            readyTunnel?.dispose();
            const tunnel = new NodeRemoteTunnel(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, tunnelLocalPort);
            readyTunnel = await tunnel.waitForReady();
            if ((tunnelLocalPort && ports_1.BROWSER_RESTRICTED_PORTS[tunnelLocalPort]) || !ports_1.BROWSER_RESTRICTED_PORTS[readyTunnel.tunnelLocalPort]) {
                break;
            }
        }
        return readyTunnel;
    }
    class NodeRemoteTunnel extends lifecycle_1.Disposable {
        constructor(options, defaultTunnelHost, tunnelRemoteHost, tunnelRemotePort, suggestedLocalPort) {
            super();
            this.defaultTunnelHost = defaultTunnelHost;
            this.suggestedLocalPort = suggestedLocalPort;
            this.privacy = tunnel_1.TunnelPrivacyId.Private;
            this._socketsDispose = new Map();
            this._options = options;
            this._server = net.createServer();
            this._barrier = new async_1.Barrier();
            this._listeningListener = () => this._barrier.open();
            this._server.on('listening', this._listeningListener);
            this._connectionListener = (socket) => this._onConnection(socket);
            this._server.on('connection', this._connectionListener);
            // If there is no error listener and there is an error it will crash the whole window
            this._errorListener = () => { };
            this._server.on('error', this._errorListener);
            this.tunnelRemotePort = tunnelRemotePort;
            this.tunnelRemoteHost = tunnelRemoteHost;
        }
        async dispose() {
            super.dispose();
            this._server.removeListener('listening', this._listeningListener);
            this._server.removeListener('connection', this._connectionListener);
            this._server.removeListener('error', this._errorListener);
            this._server.close();
            const disposers = Array.from(this._socketsDispose.values());
            disposers.forEach(disposer => {
                disposer();
            });
        }
        async waitForReady() {
            const startPort = this.suggestedLocalPort ?? this.tunnelRemotePort;
            const hostname = (0, tunnel_1.isAllInterfaces)(this.defaultTunnelHost) ? '0.0.0.0' : '127.0.0.1';
            // try to get the same port number as the remote port number...
            let localPort = await (0, ports_1.findFreePortFaster)(startPort, 2, 1000, hostname);
            // if that fails, the method above returns 0, which works out fine below...
            let address = null;
            this._server.listen(localPort, this.defaultTunnelHost);
            await this._barrier.wait();
            address = this._server.address();
            // It is possible for findFreePortFaster to return a port that there is already a server listening on. This causes the previous listen call to error out.
            if (!address) {
                localPort = 0;
                this._server.listen(localPort, this.defaultTunnelHost);
                await this._barrier.wait();
                address = this._server.address();
            }
            this.tunnelLocalPort = address.port;
            this.localAddress = `${this.tunnelRemoteHost === '127.0.0.1' ? '127.0.0.1' : 'localhost'}:${address.port}`;
            return this;
        }
        async _onConnection(localSocket) {
            // pause reading on the socket until we have a chance to forward its data
            localSocket.pause();
            const tunnelRemoteHost = ((0, tunnel_1.isLocalhost)(this.tunnelRemoteHost) || (0, tunnel_1.isAllInterfaces)(this.tunnelRemoteHost)) ? 'localhost' : this.tunnelRemoteHost;
            const protocol = await (0, remoteAgentConnection_1.connectRemoteAgentTunnel)(this._options, tunnelRemoteHost, this.tunnelRemotePort);
            const remoteSocket = protocol.getSocket();
            const dataChunk = protocol.readEntireBuffer();
            protocol.dispose();
            if (dataChunk.byteLength > 0) {
                localSocket.write(dataChunk.buffer);
            }
            localSocket.on('end', () => {
                if (localSocket.localAddress) {
                    this._socketsDispose.delete(localSocket.localAddress);
                }
                remoteSocket.end();
            });
            localSocket.on('close', () => remoteSocket.end());
            localSocket.on('error', () => {
                if (localSocket.localAddress) {
                    this._socketsDispose.delete(localSocket.localAddress);
                }
                if (remoteSocket instanceof ipc_net_1.NodeSocket) {
                    remoteSocket.socket.destroy();
                }
                else {
                    remoteSocket.end();
                }
            });
            if (remoteSocket instanceof ipc_net_1.NodeSocket) {
                this._mirrorNodeSocket(localSocket, remoteSocket);
            }
            else {
                this._mirrorGenericSocket(localSocket, remoteSocket);
            }
            if (localSocket.localAddress) {
                this._socketsDispose.set(localSocket.localAddress, () => {
                    // Need to end instead of unpipe, otherwise whatever is connected locally could end up "stuck" with whatever state it had until manually exited.
                    localSocket.end();
                    remoteSocket.end();
                });
            }
        }
        _mirrorGenericSocket(localSocket, remoteSocket) {
            remoteSocket.onClose(() => localSocket.destroy());
            remoteSocket.onEnd(() => localSocket.end());
            remoteSocket.onData(d => localSocket.write(d.buffer));
            localSocket.on('data', d => remoteSocket.write(buffer_1.VSBuffer.wrap(d)));
            localSocket.resume();
        }
        _mirrorNodeSocket(localSocket, remoteNodeSocket) {
            const remoteSocket = remoteNodeSocket.socket;
            remoteSocket.on('end', () => localSocket.end());
            remoteSocket.on('close', () => localSocket.end());
            remoteSocket.on('error', () => {
                localSocket.destroy();
            });
            remoteSocket.pipe(localSocket);
            localSocket.pipe(remoteSocket);
        }
    }
    exports.NodeRemoteTunnel = NodeRemoteTunnel;
    let BaseTunnelService = class BaseTunnelService extends tunnel_1.AbstractTunnelService {
        constructor(remoteSocketFactoryService, logService, signService, productService, configurationService) {
            super(logService, configurationService);
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this.signService = signService;
            this.productService = productService;
        }
        isPortPrivileged(port) {
            return (0, tunnel_1.isPortPrivileged)(port, this.defaultTunnelHost, platform_1.OS, os.release());
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
                const options = {
                    commit: this.productService.commit,
                    quality: this.productService.quality,
                    addressProvider: addressOrTunnelProvider,
                    remoteSocketFactoryService: this.remoteSocketFactoryService,
                    signService: this.signService,
                    logService: this.logService,
                    ipcLogger: null
                };
                const tunnel = createRemoteTunnel(options, localHost, remoteHost, remotePort, localPort);
                this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created without provider.');
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                return tunnel;
            }
        }
    };
    exports.BaseTunnelService = BaseTunnelService;
    exports.BaseTunnelService = BaseTunnelService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, log_1.ILogService),
        __param(2, sign_1.ISignService),
        __param(3, productService_1.IProductService),
        __param(4, configuration_1.IConfigurationService)
    ], BaseTunnelService);
    let TunnelService = class TunnelService extends BaseTunnelService {
        constructor(remoteSocketFactoryService, logService, signService, productService, configurationService) {
            super(remoteSocketFactoryService, logService, signService, productService, configurationService);
        }
    };
    exports.TunnelService = TunnelService;
    exports.TunnelService = TunnelService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, log_1.ILogService),
        __param(2, sign_1.ISignService),
        __param(3, productService_1.IProductService),
        __param(4, configuration_1.IConfigurationService)
    ], TunnelService);
    let SharedTunnelsService = class SharedTunnelsService extends lifecycle_1.Disposable {
        constructor(remoteSocketFactoryService, logService, productService, signService, configurationService) {
            super();
            this.remoteSocketFactoryService = remoteSocketFactoryService;
            this.logService = logService;
            this.productService = productService;
            this.signService = signService;
            this.configurationService = configurationService;
            this._tunnelServices = new Map();
        }
        async openTunnel(authority, addressProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (SharedTunnelService) openTunnel request for ${remoteHost}:${remotePort} on local port ${localPort}.`);
            if (!this._tunnelServices.has(authority)) {
                const tunnelService = new TunnelService(this.remoteSocketFactoryService, this.logService, this.signService, this.productService, this.configurationService);
                this._register(tunnelService);
                this._tunnelServices.set(authority, tunnelService);
                tunnelService.onTunnelClosed(async () => {
                    if ((await tunnelService.tunnels).length === 0) {
                        tunnelService.dispose();
                        this._tunnelServices.delete(authority);
                    }
                });
            }
            return this._tunnelServices.get(authority).openTunnel(addressProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol);
        }
    };
    exports.SharedTunnelsService = SharedTunnelsService;
    exports.SharedTunnelsService = SharedTunnelsService = __decorate([
        __param(0, remoteSocketFactoryService_1.IRemoteSocketFactoryService),
        __param(1, log_1.ILogService),
        __param(2, productService_1.IProductService),
        __param(3, sign_1.ISignService),
        __param(4, configuration_1.IConfigurationService)
    ], SharedTunnelsService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdHVubmVsL25vZGUvdHVubmVsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLEtBQUssVUFBVSxrQkFBa0IsQ0FBQyxPQUEyQixFQUFFLGlCQUF5QixFQUFFLGdCQUF3QixFQUFFLGdCQUF3QixFQUFFLGVBQXdCO1FBQ3JLLElBQUksV0FBeUMsQ0FBQztRQUM5QyxLQUFLLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQztZQUM3QyxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDckgsV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxlQUFlLElBQUksZ0NBQXdCLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLGdDQUF3QixDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO2dCQUM5SCxNQUFNO1lBQ1AsQ0FBQztRQUNGLENBQUM7UUFDRCxPQUFPLFdBQVksQ0FBQztJQUNyQixDQUFDO0lBRUQsTUFBYSxnQkFBaUIsU0FBUSxzQkFBVTtRQWtCL0MsWUFBWSxPQUEyQixFQUFtQixpQkFBeUIsRUFBRSxnQkFBd0IsRUFBRSxnQkFBd0IsRUFBbUIsa0JBQTJCO1lBQ3BMLEtBQUssRUFBRSxDQUFDO1lBRGlELHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQUF1RSx1QkFBa0IsR0FBbEIsa0JB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