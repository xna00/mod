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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, event_1, uri_1, configuration_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTunnelService = exports.DisposableTunnel = exports.ALL_INTERFACES_ADDRESSES = exports.LOCALHOST_ADDRESSES = exports.ProvidedOnAutoForward = exports.TunnelPrivacyId = exports.TunnelProtocol = exports.ISharedTunnelsService = exports.ITunnelService = void 0;
    exports.isTunnelProvider = isTunnelProvider;
    exports.extractLocalHostUriMetaDataForPortMapping = extractLocalHostUriMetaDataForPortMapping;
    exports.extractQueryLocalHostUriMetaDataForPortMapping = extractQueryLocalHostUriMetaDataForPortMapping;
    exports.isLocalhost = isLocalhost;
    exports.isAllInterfaces = isAllInterfaces;
    exports.isPortPrivileged = isPortPrivileged;
    exports.ITunnelService = (0, instantiation_1.createDecorator)('tunnelService');
    exports.ISharedTunnelsService = (0, instantiation_1.createDecorator)('sharedTunnelsService');
    var TunnelProtocol;
    (function (TunnelProtocol) {
        TunnelProtocol["Http"] = "http";
        TunnelProtocol["Https"] = "https";
    })(TunnelProtocol || (exports.TunnelProtocol = TunnelProtocol = {}));
    var TunnelPrivacyId;
    (function (TunnelPrivacyId) {
        TunnelPrivacyId["ConstantPrivate"] = "constantPrivate";
        TunnelPrivacyId["Private"] = "private";
        TunnelPrivacyId["Public"] = "public";
    })(TunnelPrivacyId || (exports.TunnelPrivacyId = TunnelPrivacyId = {}));
    function isTunnelProvider(addressOrTunnelProvider) {
        return !!addressOrTunnelProvider.forwardPort;
    }
    var ProvidedOnAutoForward;
    (function (ProvidedOnAutoForward) {
        ProvidedOnAutoForward[ProvidedOnAutoForward["Notify"] = 1] = "Notify";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenBrowser"] = 2] = "OpenBrowser";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenPreview"] = 3] = "OpenPreview";
        ProvidedOnAutoForward[ProvidedOnAutoForward["Silent"] = 4] = "Silent";
        ProvidedOnAutoForward[ProvidedOnAutoForward["Ignore"] = 5] = "Ignore";
        ProvidedOnAutoForward[ProvidedOnAutoForward["OpenBrowserOnce"] = 6] = "OpenBrowserOnce";
    })(ProvidedOnAutoForward || (exports.ProvidedOnAutoForward = ProvidedOnAutoForward = {}));
    function extractLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https') {
            return undefined;
        }
        const localhostMatch = /^(localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)$/.exec(uri.authority);
        if (!localhostMatch) {
            return undefined;
        }
        return {
            address: localhostMatch[1],
            port: +localhostMatch[2],
        };
    }
    function extractQueryLocalHostUriMetaDataForPortMapping(uri) {
        if (uri.scheme !== 'http' && uri.scheme !== 'https' || !uri.query) {
            return undefined;
        }
        const keyvalues = uri.query.split('&');
        for (const keyvalue of keyvalues) {
            const value = keyvalue.split('=')[1];
            if (/^https?:/.exec(value)) {
                const result = extractLocalHostUriMetaDataForPortMapping(uri_1.URI.parse(value));
                if (result) {
                    return result;
                }
            }
        }
        return undefined;
    }
    exports.LOCALHOST_ADDRESSES = ['localhost', '127.0.0.1', '0:0:0:0:0:0:0:1', '::1'];
    function isLocalhost(host) {
        return exports.LOCALHOST_ADDRESSES.indexOf(host) >= 0;
    }
    exports.ALL_INTERFACES_ADDRESSES = ['0.0.0.0', '0:0:0:0:0:0:0:0', '::'];
    function isAllInterfaces(host) {
        return exports.ALL_INTERFACES_ADDRESSES.indexOf(host) >= 0;
    }
    function isPortPrivileged(port, host, os, osRelease) {
        if (os === 1 /* OperatingSystem.Windows */) {
            return false;
        }
        if (os === 2 /* OperatingSystem.Macintosh */) {
            if (isAllInterfaces(host)) {
                const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(osRelease);
                if (osVersion?.length === 4) {
                    const major = parseInt(osVersion[1]);
                    if (major >= 18 /* since macOS Mojave, darwin version 18.0.0 */) {
                        return false;
                    }
                }
            }
        }
        return port < 1024;
    }
    class DisposableTunnel {
        constructor(remoteAddress, localAddress, _dispose) {
            this.remoteAddress = remoteAddress;
            this.localAddress = localAddress;
            this._dispose = _dispose;
            this._onDispose = new event_1.Emitter();
            this.onDidDispose = this._onDispose.event;
        }
        dispose() {
            this._onDispose.fire();
            return this._dispose();
        }
    }
    exports.DisposableTunnel = DisposableTunnel;
    let AbstractTunnelService = class AbstractTunnelService {
        constructor(logService, configurationService) {
            this.logService = logService;
            this.configurationService = configurationService;
            this._onTunnelOpened = new event_1.Emitter();
            this.onTunnelOpened = this._onTunnelOpened.event;
            this._onTunnelClosed = new event_1.Emitter();
            this.onTunnelClosed = this._onTunnelClosed.event;
            this._onAddedTunnelProvider = new event_1.Emitter();
            this.onAddedTunnelProvider = this._onAddedTunnelProvider.event;
            this._tunnels = new Map();
            this._canElevate = false;
            this._canChangeProtocol = true;
            this._privacyOptions = [];
            this._factoryInProgress = new Set();
        }
        get hasTunnelProvider() {
            return !!this._tunnelProvider;
        }
        get defaultTunnelHost() {
            const settingValue = this.configurationService.getValue('remote.localPortHost');
            return (!settingValue || settingValue === 'localhost') ? '127.0.0.1' : '0.0.0.0';
        }
        setTunnelProvider(provider) {
            this._tunnelProvider = provider;
            if (!provider) {
                // clear features
                this._canElevate = false;
                this._privacyOptions = [];
                this._onAddedTunnelProvider.fire();
                return {
                    dispose: () => { }
                };
            }
            this._onAddedTunnelProvider.fire();
            return {
                dispose: () => {
                    this._tunnelProvider = undefined;
                    this._canElevate = false;
                    this._privacyOptions = [];
                }
            };
        }
        setTunnelFeatures(features) {
            this._canElevate = features.elevation;
            this._privacyOptions = features.privacyOptions;
            this._canChangeProtocol = features.protocol;
        }
        get canChangeProtocol() {
            return this._canChangeProtocol;
        }
        get canElevate() {
            return this._canElevate;
        }
        get canChangePrivacy() {
            return this._privacyOptions.length > 0;
        }
        get privacyOptions() {
            return this._privacyOptions;
        }
        get tunnels() {
            return this.getTunnels();
        }
        async getTunnels() {
            const tunnels = [];
            const tunnelArray = Array.from(this._tunnels.values());
            for (const portMap of tunnelArray) {
                const portArray = Array.from(portMap.values());
                for (const x of portArray) {
                    const tunnelValue = await x.value;
                    if (tunnelValue && (typeof tunnelValue !== 'string')) {
                        tunnels.push(tunnelValue);
                    }
                }
            }
            return tunnels;
        }
        async dispose() {
            for (const portMap of this._tunnels.values()) {
                for (const { value } of portMap.values()) {
                    await value.then(tunnel => typeof tunnel !== 'string' ? tunnel?.dispose() : undefined);
                }
                portMap.clear();
            }
            this._tunnels.clear();
        }
        setEnvironmentTunnel(remoteHost, remotePort, localAddress, privacy, protocol) {
            this.addTunnelToMap(remoteHost, remotePort, Promise.resolve({
                tunnelRemoteHost: remoteHost,
                tunnelRemotePort: remotePort,
                localAddress,
                privacy,
                protocol,
                dispose: () => Promise.resolve()
            }));
        }
        async getExistingTunnel(remoteHost, remotePort) {
            if (isAllInterfaces(remoteHost) || isLocalhost(remoteHost)) {
                remoteHost = exports.LOCALHOST_ADDRESSES[0];
            }
            const existing = this.getTunnelFromMap(remoteHost, remotePort);
            if (existing) {
                ++existing.refcount;
                return existing.value;
            }
            return undefined;
        }
        openTunnel(addressProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded = false, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (TunnelService) openTunnel request for ${remoteHost}:${remotePort} on local port ${localPort}.`);
            const addressOrTunnelProvider = this._tunnelProvider ?? addressProvider;
            if (!addressOrTunnelProvider) {
                return undefined;
            }
            if (!remoteHost) {
                remoteHost = 'localhost';
            }
            if (!localHost) {
                localHost = this.defaultTunnelHost;
            }
            // Prevent tunnel factories from calling openTunnel from within the factory
            if (this._tunnelProvider && this._factoryInProgress.has(remotePort)) {
                this.logService.debug(`ForwardedPorts: (TunnelService) Another call to create a tunnel with the same address has occurred before the last one completed. This call will be ignored.`);
                return;
            }
            const resolvedTunnel = this.retainOrCreateTunnel(addressOrTunnelProvider, remoteHost, remotePort, localHost, localPort, elevateIfNeeded, privacy, protocol);
            if (!resolvedTunnel) {
                this.logService.trace(`ForwardedPorts: (TunnelService) Tunnel was not created.`);
                return resolvedTunnel;
            }
            return resolvedTunnel.then(tunnel => {
                if (!tunnel) {
                    this.logService.trace('ForwardedPorts: (TunnelService) New tunnel is undefined.');
                    this.removeEmptyOrErrorTunnelFromMap(remoteHost, remotePort);
                    return undefined;
                }
                else if (typeof tunnel === 'string') {
                    this.logService.trace('ForwardedPorts: (TunnelService) The tunnel provider returned an error when creating the tunnel.');
                    this.removeEmptyOrErrorTunnelFromMap(remoteHost, remotePort);
                    return tunnel;
                }
                this.logService.trace('ForwardedPorts: (TunnelService) New tunnel established.');
                const newTunnel = this.makeTunnel(tunnel);
                if (tunnel.tunnelRemoteHost !== remoteHost || tunnel.tunnelRemotePort !== remotePort) {
                    this.logService.warn('ForwardedPorts: (TunnelService) Created tunnel does not match requirements of requested tunnel. Host or port mismatch.');
                }
                if (privacy && tunnel.privacy !== privacy) {
                    this.logService.warn('ForwardedPorts: (TunnelService) Created tunnel does not match requirements of requested tunnel. Privacy mismatch.');
                }
                this._onTunnelOpened.fire(newTunnel);
                return newTunnel;
            });
        }
        makeTunnel(tunnel) {
            return {
                tunnelRemotePort: tunnel.tunnelRemotePort,
                tunnelRemoteHost: tunnel.tunnelRemoteHost,
                tunnelLocalPort: tunnel.tunnelLocalPort,
                localAddress: tunnel.localAddress,
                privacy: tunnel.privacy,
                protocol: tunnel.protocol,
                dispose: async () => {
                    this.logService.trace(`ForwardedPorts: (TunnelService) dispose request for ${tunnel.tunnelRemoteHost}:${tunnel.tunnelRemotePort} `);
                    const existingHost = this._tunnels.get(tunnel.tunnelRemoteHost);
                    if (existingHost) {
                        const existing = existingHost.get(tunnel.tunnelRemotePort);
                        if (existing) {
                            existing.refcount--;
                            await this.tryDisposeTunnel(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort, existing);
                        }
                    }
                }
            };
        }
        async tryDisposeTunnel(remoteHost, remotePort, tunnel) {
            if (tunnel.refcount <= 0) {
                this.logService.trace(`ForwardedPorts: (TunnelService) Tunnel is being disposed ${remoteHost}:${remotePort}.`);
                const disposePromise = tunnel.value.then(async (tunnel) => {
                    if (tunnel && (typeof tunnel !== 'string')) {
                        await tunnel.dispose(true);
                        this._onTunnelClosed.fire({ host: tunnel.tunnelRemoteHost, port: tunnel.tunnelRemotePort });
                    }
                });
                if (this._tunnels.has(remoteHost)) {
                    this._tunnels.get(remoteHost).delete(remotePort);
                }
                return disposePromise;
            }
        }
        async closeTunnel(remoteHost, remotePort) {
            this.logService.trace(`ForwardedPorts: (TunnelService) close request for ${remoteHost}:${remotePort} `);
            const portMap = this._tunnels.get(remoteHost);
            if (portMap && portMap.has(remotePort)) {
                const value = portMap.get(remotePort);
                value.refcount = 0;
                await this.tryDisposeTunnel(remoteHost, remotePort, value);
            }
        }
        addTunnelToMap(remoteHost, remotePort, tunnel) {
            if (!this._tunnels.has(remoteHost)) {
                this._tunnels.set(remoteHost, new Map());
            }
            this._tunnels.get(remoteHost).set(remotePort, { refcount: 1, value: tunnel });
        }
        async removeEmptyOrErrorTunnelFromMap(remoteHost, remotePort) {
            const hostMap = this._tunnels.get(remoteHost);
            if (hostMap) {
                const tunnel = hostMap.get(remotePort);
                const tunnelResult = tunnel ? await tunnel.value : undefined;
                if (!tunnelResult || (typeof tunnelResult === 'string')) {
                    hostMap.delete(remotePort);
                }
                if (hostMap.size === 0) {
                    this._tunnels.delete(remoteHost);
                }
            }
        }
        getTunnelFromMap(remoteHost, remotePort) {
            const hosts = [remoteHost];
            // Order matters. We want the original host to be first.
            if (isLocalhost(remoteHost)) {
                hosts.push(...exports.LOCALHOST_ADDRESSES);
                // For localhost, we add the all interfaces hosts because if the tunnel is already available at all interfaces,
                // then of course it is available at localhost.
                hosts.push(...exports.ALL_INTERFACES_ADDRESSES);
            }
            else if (isAllInterfaces(remoteHost)) {
                hosts.push(...exports.ALL_INTERFACES_ADDRESSES);
            }
            const existingPortMaps = hosts.map(host => this._tunnels.get(host));
            for (const map of existingPortMaps) {
                const existingTunnel = map?.get(remotePort);
                if (existingTunnel) {
                    return existingTunnel;
                }
            }
            return undefined;
        }
        canTunnel(uri) {
            return !!extractLocalHostUriMetaDataForPortMapping(uri);
        }
        createWithProvider(tunnelProvider, remoteHost, remotePort, localPort, elevateIfNeeded, privacy, protocol) {
            this.logService.trace(`ForwardedPorts: (TunnelService) Creating tunnel with provider ${remoteHost}:${remotePort} on local port ${localPort}.`);
            const key = remotePort;
            this._factoryInProgress.add(key);
            const preferredLocalPort = localPort === undefined ? remotePort : localPort;
            const creationInfo = { elevationRequired: elevateIfNeeded ? this.isPortPrivileged(preferredLocalPort) : false };
            const tunnelOptions = { remoteAddress: { host: remoteHost, port: remotePort }, localAddressPort: localPort, privacy, public: privacy ? (privacy !== TunnelPrivacyId.Private) : undefined, protocol };
            const tunnel = tunnelProvider.forwardPort(tunnelOptions, creationInfo);
            if (tunnel) {
                this.addTunnelToMap(remoteHost, remotePort, tunnel);
                tunnel.finally(() => {
                    this.logService.trace('ForwardedPorts: (TunnelService) Tunnel created by provider.');
                    this._factoryInProgress.delete(key);
                });
            }
            else {
                this._factoryInProgress.delete(key);
            }
            return tunnel;
        }
    };
    exports.AbstractTunnelService = AbstractTunnelService;
    exports.AbstractTunnelService = AbstractTunnelService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, configuration_1.IConfigurationService)
    ], AbstractTunnelService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS90dW5uZWwvY29tbW9uL3R1bm5lbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnRWhHLDRDQUVDO0lBMEVELDhGQVlDO0lBRUQsd0dBZUM7SUFHRCxrQ0FFQztJQUdELDBDQUVDO0lBRUQsNENBZ0JDO0lBeExZLFFBQUEsY0FBYyxHQUFHLElBQUEsK0JBQWUsRUFBaUIsZUFBZSxDQUFDLENBQUM7SUFDbEUsUUFBQSxxQkFBcUIsR0FBRyxJQUFBLCtCQUFlLEVBQXdCLHNCQUFzQixDQUFDLENBQUM7SUFxQnBHLElBQVksY0FHWDtJQUhELFdBQVksY0FBYztRQUN6QiwrQkFBYSxDQUFBO1FBQ2IsaUNBQWUsQ0FBQTtJQUNoQixDQUFDLEVBSFcsY0FBYyw4QkFBZCxjQUFjLFFBR3pCO0lBRUQsSUFBWSxlQUlYO0lBSkQsV0FBWSxlQUFlO1FBQzFCLHNEQUFtQyxDQUFBO1FBQ25DLHNDQUFtQixDQUFBO1FBQ25CLG9DQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFKVyxlQUFlLCtCQUFmLGVBQWUsUUFJMUI7SUFvQkQsU0FBZ0IsZ0JBQWdCLENBQUMsdUJBQTJEO1FBQzNGLE9BQU8sQ0FBQyxDQUFFLHVCQUEyQyxDQUFDLFdBQVcsQ0FBQztJQUNuRSxDQUFDO0lBRUQsSUFBWSxxQkFPWDtJQVBELFdBQVkscUJBQXFCO1FBQ2hDLHFFQUFVLENBQUE7UUFDViwrRUFBZSxDQUFBO1FBQ2YsK0VBQWUsQ0FBQTtRQUNmLHFFQUFVLENBQUE7UUFDVixxRUFBVSxDQUFBO1FBQ1YsdUZBQW1CLENBQUE7SUFDcEIsQ0FBQyxFQVBXLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBT2hDO0lBaUVELFNBQWdCLHlDQUF5QyxDQUFDLEdBQVE7UUFD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