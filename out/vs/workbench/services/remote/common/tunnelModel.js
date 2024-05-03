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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/tunnel/common/tunnel", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/base/common/cancellation", "vs/base/common/types", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, arrays_1, decorators_1, event_1, hash_1, lifecycle_1, uri_1, configuration_1, dialogs_1, log_1, remoteAuthorityResolver_1, storage_1, tunnel_1, workspace_1, environmentService_1, extensions_1, cancellation_1, types_1, objects_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TunnelModel = exports.PortsAttributes = exports.OnPortForward = exports.AutoTunnelSource = exports.UserTunnelSource = exports.TunnelSource = exports.TunnelCloseReason = exports.forwardedPortsViewEnabled = exports.ACTIVATION_EVENT = void 0;
    exports.parseAddress = parseAddress;
    exports.mapHasAddress = mapHasAddress;
    exports.mapHasAddressLocalhostOrAllInterfaces = mapHasAddressLocalhostOrAllInterfaces;
    exports.makeAddress = makeAddress;
    exports.isCandidatePort = isCandidatePort;
    const MISMATCH_LOCAL_PORT_COOLDOWN = 10 * 1000; // 10 seconds
    const TUNNELS_TO_RESTORE = 'remote.tunnels.toRestore';
    const TUNNELS_TO_RESTORE_EXPIRATION = 'remote.tunnels.toRestoreExpiration';
    const RESTORE_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 14; // 2 weeks
    exports.ACTIVATION_EVENT = 'onTunnel';
    exports.forwardedPortsViewEnabled = new contextkey_1.RawContextKey('forwardedPortsViewEnabled', false, nls.localize('tunnel.forwardedPortsViewEnabled', "Whether the Ports view is enabled."));
    function parseAddress(address) {
        const matches = address.match(/^([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*:)?([0-9]+)$/);
        if (!matches) {
            return undefined;
        }
        return { host: matches[1]?.substring(0, matches[1].length - 1) || 'localhost', port: Number(matches[2]) };
    }
    var TunnelCloseReason;
    (function (TunnelCloseReason) {
        TunnelCloseReason["Other"] = "Other";
        TunnelCloseReason["User"] = "User";
        TunnelCloseReason["AutoForwardEnd"] = "AutoForwardEnd";
    })(TunnelCloseReason || (exports.TunnelCloseReason = TunnelCloseReason = {}));
    var TunnelSource;
    (function (TunnelSource) {
        TunnelSource[TunnelSource["User"] = 0] = "User";
        TunnelSource[TunnelSource["Auto"] = 1] = "Auto";
        TunnelSource[TunnelSource["Extension"] = 2] = "Extension";
    })(TunnelSource || (exports.TunnelSource = TunnelSource = {}));
    exports.UserTunnelSource = {
        source: TunnelSource.User,
        description: nls.localize('tunnel.source.user', "User Forwarded")
    };
    exports.AutoTunnelSource = {
        source: TunnelSource.Auto,
        description: nls.localize('tunnel.source.auto', "Auto Forwarded")
    };
    function mapHasAddress(map, host, port) {
        const initialAddress = map.get(makeAddress(host, port));
        if (initialAddress) {
            return initialAddress;
        }
        if ((0, tunnel_1.isLocalhost)(host)) {
            // Do localhost checks
            for (const testHost of tunnel_1.LOCALHOST_ADDRESSES) {
                const testAddress = makeAddress(testHost, port);
                if (map.has(testAddress)) {
                    return map.get(testAddress);
                }
            }
        }
        else if ((0, tunnel_1.isAllInterfaces)(host)) {
            // Do all interfaces checks
            for (const testHost of tunnel_1.ALL_INTERFACES_ADDRESSES) {
                const testAddress = makeAddress(testHost, port);
                if (map.has(testAddress)) {
                    return map.get(testAddress);
                }
            }
        }
        return undefined;
    }
    function mapHasAddressLocalhostOrAllInterfaces(map, host, port) {
        const originalAddress = mapHasAddress(map, host, port);
        if (originalAddress) {
            return originalAddress;
        }
        const otherHost = (0, tunnel_1.isAllInterfaces)(host) ? 'localhost' : ((0, tunnel_1.isLocalhost)(host) ? '0.0.0.0' : undefined);
        if (otherHost) {
            return mapHasAddress(map, otherHost, port);
        }
        return undefined;
    }
    function makeAddress(host, port) {
        return host + ':' + port;
    }
    var OnPortForward;
    (function (OnPortForward) {
        OnPortForward["Notify"] = "notify";
        OnPortForward["OpenBrowser"] = "openBrowser";
        OnPortForward["OpenBrowserOnce"] = "openBrowserOnce";
        OnPortForward["OpenPreview"] = "openPreview";
        OnPortForward["Silent"] = "silent";
        OnPortForward["Ignore"] = "ignore";
    })(OnPortForward || (exports.OnPortForward = OnPortForward = {}));
    function isCandidatePort(candidate) {
        return candidate && 'host' in candidate && typeof candidate.host === 'string'
            && 'port' in candidate && typeof candidate.port === 'number'
            && (!('detail' in candidate) || typeof candidate.detail === 'string')
            && (!('pid' in candidate) || typeof candidate.pid === 'string');
    }
    class PortsAttributes extends lifecycle_1.Disposable {
        static { this.SETTING = 'remote.portsAttributes'; }
        static { this.DEFAULTS = 'remote.otherPortsAttributes'; }
        static { this.RANGE = /^(\d+)\-(\d+)$/; }
        static { this.HOST_AND_PORT = /^([a-z0-9\-]+):(\d{1,5})$/; }
        constructor(configurationService) {
            super();
            this.configurationService = configurationService;
            this.portsAttributes = [];
            this._onDidChangeAttributes = new event_1.Emitter();
            this.onDidChangeAttributes = this._onDidChangeAttributes.event;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(PortsAttributes.SETTING) || e.affectsConfiguration(PortsAttributes.DEFAULTS)) {
                    this.updateAttributes();
                }
            }));
            this.updateAttributes();
        }
        updateAttributes() {
            this.portsAttributes = this.readSetting();
            this._onDidChangeAttributes.fire();
        }
        getAttributes(port, host, commandLine) {
            let index = this.findNextIndex(port, host, commandLine, this.portsAttributes, 0);
            const attributes = {
                label: undefined,
                onAutoForward: undefined,
                elevateIfNeeded: undefined,
                requireLocalPort: undefined,
                protocol: undefined
            };
            while (index >= 0) {
                const found = this.portsAttributes[index];
                if (found.key === port) {
                    attributes.onAutoForward = found.onAutoForward ?? attributes.onAutoForward;
                    attributes.elevateIfNeeded = (found.elevateIfNeeded !== undefined) ? found.elevateIfNeeded : attributes.elevateIfNeeded;
                    attributes.label = found.label ?? attributes.label;
                    attributes.requireLocalPort = found.requireLocalPort;
                    attributes.protocol = found.protocol;
                }
                else {
                    // It's a range or regex, which means that if the attribute is already set, we keep it
                    attributes.onAutoForward = attributes.onAutoForward ?? found.onAutoForward;
                    attributes.elevateIfNeeded = (attributes.elevateIfNeeded !== undefined) ? attributes.elevateIfNeeded : found.elevateIfNeeded;
                    attributes.label = attributes.label ?? found.label;
                    attributes.requireLocalPort = (attributes.requireLocalPort !== undefined) ? attributes.requireLocalPort : undefined;
                    attributes.protocol = attributes.protocol ?? found.protocol;
                }
                index = this.findNextIndex(port, host, commandLine, this.portsAttributes, index + 1);
            }
            if (attributes.onAutoForward !== undefined || attributes.elevateIfNeeded !== undefined
                || attributes.label !== undefined || attributes.requireLocalPort !== undefined
                || attributes.protocol !== undefined) {
                return attributes;
            }
            // If we find no matches, then use the other port attributes.
            return this.getOtherAttributes();
        }
        hasStartEnd(value) {
            return (value.start !== undefined) && (value.end !== undefined);
        }
        hasHostAndPort(value) {
            return (value.host !== undefined) && (value.port !== undefined)
                && (0, types_1.isString)(value.host) && (0, types_1.isNumber)(value.port);
        }
        findNextIndex(port, host, commandLine, attributes, fromIndex) {
            if (fromIndex >= attributes.length) {
                return -1;
            }
            const shouldUseHost = !(0, tunnel_1.isLocalhost)(host) && !(0, tunnel_1.isAllInterfaces)(host);
            const sliced = attributes.slice(fromIndex);
            const foundIndex = sliced.findIndex((value) => {
                if ((0, types_1.isNumber)(value.key)) {
                    return shouldUseHost ? false : value.key === port;
                }
                else if (this.hasStartEnd(value.key)) {
                    return shouldUseHost ? false : (port >= value.key.start && port <= value.key.end);
                }
                else if (this.hasHostAndPort(value.key)) {
                    return (port === value.key.port) && (host === value.key.host);
                }
                else {
                    return commandLine ? value.key.test(commandLine) : false;
                }
            });
            return foundIndex >= 0 ? foundIndex + fromIndex : -1;
        }
        readSetting() {
            const settingValue = this.configurationService.getValue(PortsAttributes.SETTING);
            if (!settingValue || !(0, types_1.isObject)(settingValue)) {
                return [];
            }
            const attributes = [];
            for (const attributesKey in settingValue) {
                if (attributesKey === undefined) {
                    continue;
                }
                const setting = settingValue[attributesKey];
                let key = undefined;
                if (Number(attributesKey)) {
                    key = Number(attributesKey);
                }
                else if ((0, types_1.isString)(attributesKey)) {
                    if (PortsAttributes.RANGE.test(attributesKey)) {
                        const match = attributesKey.match(PortsAttributes.RANGE);
                        key = { start: Number(match[1]), end: Number(match[2]) };
                    }
                    else if (PortsAttributes.HOST_AND_PORT.test(attributesKey)) {
                        const match = attributesKey.match(PortsAttributes.HOST_AND_PORT);
                        key = { host: match[1], port: Number(match[2]) };
                    }
                    else {
                        let regTest = undefined;
                        try {
                            regTest = RegExp(attributesKey);
                        }
                        catch (e) {
                            // The user entered an invalid regular expression.
                        }
                        if (regTest) {
                            key = regTest;
                        }
                    }
                }
                if (!key) {
                    continue;
                }
                attributes.push({
                    key: key,
                    elevateIfNeeded: setting.elevateIfNeeded,
                    onAutoForward: setting.onAutoForward,
                    label: setting.label,
                    requireLocalPort: setting.requireLocalPort,
                    protocol: setting.protocol
                });
            }
            const defaults = this.configurationService.getValue(PortsAttributes.DEFAULTS);
            if (defaults) {
                this.defaultPortAttributes = {
                    elevateIfNeeded: defaults.elevateIfNeeded,
                    label: defaults.label,
                    onAutoForward: defaults.onAutoForward,
                    requireLocalPort: defaults.requireLocalPort,
                    protocol: defaults.protocol
                };
            }
            return this.sortAttributes(attributes);
        }
        sortAttributes(attributes) {
            function getVal(item, thisRef) {
                if ((0, types_1.isNumber)(item.key)) {
                    return item.key;
                }
                else if (thisRef.hasStartEnd(item.key)) {
                    return item.key.start;
                }
                else if (thisRef.hasHostAndPort(item.key)) {
                    return item.key.port;
                }
                else {
                    return Number.MAX_VALUE;
                }
            }
            return attributes.sort((a, b) => {
                return getVal(a, this) - getVal(b, this);
            });
        }
        getOtherAttributes() {
            return this.defaultPortAttributes;
        }
        static providedActionToAction(providedAction) {
            switch (providedAction) {
                case tunnel_1.ProvidedOnAutoForward.Notify: return OnPortForward.Notify;
                case tunnel_1.ProvidedOnAutoForward.OpenBrowser: return OnPortForward.OpenBrowser;
                case tunnel_1.ProvidedOnAutoForward.OpenBrowserOnce: return OnPortForward.OpenBrowserOnce;
                case tunnel_1.ProvidedOnAutoForward.OpenPreview: return OnPortForward.OpenPreview;
                case tunnel_1.ProvidedOnAutoForward.Silent: return OnPortForward.Silent;
                case tunnel_1.ProvidedOnAutoForward.Ignore: return OnPortForward.Ignore;
                default: return undefined;
            }
        }
        async addAttributes(port, attributes, target) {
            const settingValue = this.configurationService.inspect(PortsAttributes.SETTING);
            const remoteValue = settingValue.userRemoteValue;
            let newRemoteValue;
            if (!remoteValue || !(0, types_1.isObject)(remoteValue)) {
                newRemoteValue = {};
            }
            else {
                newRemoteValue = (0, objects_1.deepClone)(remoteValue);
            }
            if (!newRemoteValue[`${port}`]) {
                newRemoteValue[`${port}`] = {};
            }
            for (const attribute in attributes) {
                newRemoteValue[`${port}`][attribute] = attributes[attribute];
            }
            return this.configurationService.updateValue(PortsAttributes.SETTING, newRemoteValue, target);
        }
    }
    exports.PortsAttributes = PortsAttributes;
    let TunnelModel = class TunnelModel extends lifecycle_1.Disposable {
        constructor(tunnelService, storageService, configurationService, environmentService, remoteAuthorityResolverService, workspaceContextService, logService, dialogService, extensionService, contextKeyService) {
            super();
            this.tunnelService = tunnelService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.workspaceContextService = workspaceContextService;
            this.logService = logService;
            this.dialogService = dialogService;
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.inProgress = new Map();
            this._onForwardPort = new event_1.Emitter();
            this.onForwardPort = this._onForwardPort.event;
            this._onClosePort = new event_1.Emitter();
            this.onClosePort = this._onClosePort.event;
            this._onPortName = new event_1.Emitter();
            this.onPortName = this._onPortName.event;
            this._onCandidatesChanged = new event_1.Emitter();
            // onCandidateChanged returns the removed candidates
            this.onCandidatesChanged = this._onCandidatesChanged.event;
            this._onEnvironmentTunnelsSet = new event_1.Emitter();
            this.onEnvironmentTunnelsSet = this._onEnvironmentTunnelsSet.event;
            this._environmentTunnelsSet = false;
            this.restoreListener = undefined;
            this.restoreComplete = false;
            this.onRestoreComplete = new event_1.Emitter();
            this.unrestoredExtensionTunnels = new Map();
            this.sessionCachedProperties = new Map();
            this.portAttributesProviders = [];
            this.mismatchCooldown = new Date();
            this.configPortsAttributes = new PortsAttributes(configurationService);
            this.tunnelRestoreValue = this.getTunnelRestoreValue();
            this._register(this.configPortsAttributes.onDidChangeAttributes(this.updateAttributes, this));
            this.forwarded = new Map();
            this.remoteTunnels = new Map();
            this.tunnelService.tunnels.then(async (tunnels) => {
                const attributes = await this.getAttributes(tunnels.map(tunnel => {
                    return { port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost };
                }));
                for (const tunnel of tunnels) {
                    if (tunnel.localAddress) {
                        const key = makeAddress(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                        const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces(this._candidates ?? new Map(), tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                        this.forwarded.set(key, {
                            remotePort: tunnel.tunnelRemotePort,
                            remoteHost: tunnel.tunnelRemoteHost,
                            localAddress: tunnel.localAddress,
                            protocol: attributes?.get(tunnel.tunnelRemotePort)?.protocol ?? tunnel_1.TunnelProtocol.Http,
                            localUri: await this.makeLocalUri(tunnel.localAddress, attributes?.get(tunnel.tunnelRemotePort)),
                            localPort: tunnel.tunnelLocalPort,
                            runningProcess: matchingCandidate?.detail,
                            hasRunningProcess: !!matchingCandidate,
                            pid: matchingCandidate?.pid,
                            privacy: tunnel.privacy,
                            source: exports.UserTunnelSource,
                        });
                        this.remoteTunnels.set(key, tunnel);
                    }
                }
            });
            this.detected = new Map();
            this._register(this.tunnelService.onTunnelOpened(async (tunnel) => {
                const key = makeAddress(tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                if (!mapHasAddressLocalhostOrAllInterfaces(this.forwarded, tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort)
                    && !mapHasAddressLocalhostOrAllInterfaces(this.detected, tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort)
                    && !mapHasAddressLocalhostOrAllInterfaces(this.inProgress, tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort)
                    && tunnel.localAddress) {
                    const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces(this._candidates ?? new Map(), tunnel.tunnelRemoteHost, tunnel.tunnelRemotePort);
                    const attributes = (await this.getAttributes([{ port: tunnel.tunnelRemotePort, host: tunnel.tunnelRemoteHost }]))?.get(tunnel.tunnelRemotePort);
                    this.forwarded.set(key, {
                        remoteHost: tunnel.tunnelRemoteHost,
                        remotePort: tunnel.tunnelRemotePort,
                        localAddress: tunnel.localAddress,
                        protocol: attributes?.protocol ?? tunnel_1.TunnelProtocol.Http,
                        localUri: await this.makeLocalUri(tunnel.localAddress, attributes),
                        localPort: tunnel.tunnelLocalPort,
                        closeable: true,
                        runningProcess: matchingCandidate?.detail,
                        hasRunningProcess: !!matchingCandidate,
                        pid: matchingCandidate?.pid,
                        privacy: tunnel.privacy,
                        source: exports.UserTunnelSource,
                    });
                }
                await this.storeForwarded();
                this.remoteTunnels.set(key, tunnel);
                this._onForwardPort.fire(this.forwarded.get(key));
            }));
            this._register(this.tunnelService.onTunnelClosed(address => {
                return this.onTunnelClosed(address, TunnelCloseReason.Other);
            }));
            this.checkExtensionActivationEvents();
        }
        extensionHasActivationEvent() {
            if (this.extensionService.extensions.find(extension => extension.activationEvents?.includes(exports.ACTIVATION_EVENT))) {
                this.contextKeyService.createKey(exports.forwardedPortsViewEnabled.key, true);
                return true;
            }
            return false;
        }
        checkExtensionActivationEvents() {
            if (this.extensionHasActivationEvent()) {
                return;
            }
            const activationDisposable = this._register(this.extensionService.onDidRegisterExtensions(() => {
                if (this.extensionHasActivationEvent()) {
                    activationDisposable.dispose();
                }
            }));
        }
        async onTunnelClosed(address, reason) {
            const key = makeAddress(address.host, address.port);
            if (this.forwarded.has(key)) {
                this.forwarded.delete(key);
                await this.storeForwarded();
                this._onClosePort.fire(address);
            }
        }
        makeLocalUri(localAddress, attributes) {
            if (localAddress.startsWith('http')) {
                return uri_1.URI.parse(localAddress);
            }
            const protocol = attributes?.protocol ?? 'http';
            return uri_1.URI.parse(`${protocol}://${localAddress}`);
        }
        async addStorageKeyPostfix(prefix) {
            const workspace = this.workspaceContextService.getWorkspace();
            const workspaceHash = workspace.configuration ? (0, hash_1.hash)(workspace.configuration.path) : (workspace.folders.length > 0 ? (0, hash_1.hash)(workspace.folders[0].uri.path) : undefined);
            if (workspaceHash === undefined) {
                this.logService.debug('Could not get workspace hash for forwarded ports storage key.');
                return undefined;
            }
            return `${prefix}.${this.environmentService.remoteAuthority}.${workspaceHash}`;
        }
        async getTunnelRestoreStorageKey() {
            return this.addStorageKeyPostfix(TUNNELS_TO_RESTORE);
        }
        async getRestoreExpirationStorageKey() {
            return this.addStorageKeyPostfix(TUNNELS_TO_RESTORE_EXPIRATION);
        }
        async getTunnelRestoreValue() {
            const deprecatedValue = this.storageService.get(TUNNELS_TO_RESTORE, 1 /* StorageScope.WORKSPACE */);
            if (deprecatedValue) {
                this.storageService.remove(TUNNELS_TO_RESTORE, 1 /* StorageScope.WORKSPACE */);
                await this.storeForwarded();
                return deprecatedValue;
            }
            const storageKey = await this.getTunnelRestoreStorageKey();
            if (!storageKey) {
                return undefined;
            }
            return this.storageService.get(storageKey, 0 /* StorageScope.PROFILE */);
        }
        async restoreForwarded() {
            this.cleanupExpiredTunnelsForRestore();
            if (this.configurationService.getValue('remote.restoreForwardedPorts')) {
                const tunnelRestoreValue = await this.tunnelRestoreValue;
                if (tunnelRestoreValue && (tunnelRestoreValue !== this.knownPortsRestoreValue)) {
                    const tunnels = JSON.parse(tunnelRestoreValue) ?? [];
                    this.logService.trace(`ForwardedPorts: (TunnelModel) restoring ports ${tunnels.map(tunnel => tunnel.remotePort).join(', ')}`);
                    for (const tunnel of tunnels) {
                        const alreadyForwarded = mapHasAddressLocalhostOrAllInterfaces(this.detected, tunnel.remoteHost, tunnel.remotePort);
                        // Extension forwarded ports should only be updated, not restored.
                        if ((tunnel.source.source !== TunnelSource.Extension && !alreadyForwarded) || (tunnel.source.source === TunnelSource.Extension && alreadyForwarded)) {
                            await this.doForward({
                                remote: { host: tunnel.remoteHost, port: tunnel.remotePort },
                                local: tunnel.localPort,
                                name: tunnel.name,
                                elevateIfNeeded: true,
                                source: tunnel.source
                            });
                        }
                        else if (tunnel.source.source === TunnelSource.Extension && !alreadyForwarded) {
                            this.unrestoredExtensionTunnels.set(makeAddress(tunnel.remoteHost, tunnel.remotePort), tunnel);
                        }
                    }
                }
            }
            this.restoreComplete = true;
            this.onRestoreComplete.fire();
            if (!this.restoreListener) {
                // It's possible that at restore time the value hasn't synced.
                const key = await this.getTunnelRestoreStorageKey();
                this.restoreListener = this._register(new lifecycle_1.DisposableStore());
                this.restoreListener.add(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this.restoreListener)(async (e) => {
                    if (e.key === key) {
                        this.tunnelRestoreValue = Promise.resolve(this.storageService.get(key, 0 /* StorageScope.PROFILE */));
                        await this.restoreForwarded();
                    }
                }));
            }
        }
        cleanupExpiredTunnelsForRestore() {
            const keys = this.storageService.keys(0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */).filter(key => key.startsWith(TUNNELS_TO_RESTORE_EXPIRATION));
            for (const key of keys) {
                const expiration = this.storageService.getNumber(key, 0 /* StorageScope.PROFILE */);
                if (expiration && expiration < Date.now()) {
                    this.tunnelRestoreValue = Promise.resolve(undefined);
                    const storageKey = key.replace(TUNNELS_TO_RESTORE_EXPIRATION, TUNNELS_TO_RESTORE);
                    this.storageService.remove(key, 0 /* StorageScope.PROFILE */);
                    this.storageService.remove(storageKey, 0 /* StorageScope.PROFILE */);
                }
            }
        }
        async storeForwarded() {
            if (this.configurationService.getValue('remote.restoreForwardedPorts')) {
                const forwarded = Array.from(this.forwarded.values());
                const restorableTunnels = forwarded.map(tunnel => {
                    return {
                        remoteHost: tunnel.remoteHost,
                        remotePort: tunnel.remotePort,
                        localPort: tunnel.localPort,
                        name: tunnel.name,
                        localAddress: tunnel.localAddress,
                        localUri: tunnel.localUri,
                        protocol: tunnel.protocol,
                        source: tunnel.source,
                    };
                });
                let valueToStore;
                if (forwarded.length > 0) {
                    valueToStore = JSON.stringify(restorableTunnels);
                }
                const key = await this.getTunnelRestoreStorageKey();
                const expirationKey = await this.getRestoreExpirationStorageKey();
                if (!valueToStore && key && expirationKey) {
                    this.storageService.remove(key, 0 /* StorageScope.PROFILE */);
                    this.storageService.remove(expirationKey, 0 /* StorageScope.PROFILE */);
                }
                else if ((valueToStore !== this.knownPortsRestoreValue) && key && expirationKey) {
                    this.storageService.store(key, valueToStore, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                    this.storageService.store(expirationKey, Date.now() + RESTORE_EXPIRATION_TIME, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                }
                this.knownPortsRestoreValue = valueToStore;
            }
        }
        async showPortMismatchModalIfNeeded(tunnel, expectedLocal, attributes) {
            if (!tunnel.tunnelLocalPort || !attributes?.requireLocalPort) {
                return;
            }
            if (tunnel.tunnelLocalPort === expectedLocal) {
                return;
            }
            const newCooldown = new Date();
            if ((this.mismatchCooldown.getTime() + MISMATCH_LOCAL_PORT_COOLDOWN) > newCooldown.getTime()) {
                return;
            }
            this.mismatchCooldown = newCooldown;
            const mismatchString = nls.localize('remote.localPortMismatch.single', "Local port {0} could not be used for forwarding to remote port {1}.\n\nThis usually happens when there is already another process using local port {0}.\n\nPort number {2} has been used instead.", expectedLocal, tunnel.tunnelRemotePort, tunnel.tunnelLocalPort);
            return this.dialogService.info(mismatchString);
        }
        async forward(tunnelProperties, attributes) {
            if (!this.restoreComplete && this.environmentService.remoteAuthority) {
                await event_1.Event.toPromise(this.onRestoreComplete.event);
            }
            return this.doForward(tunnelProperties, attributes);
        }
        async doForward(tunnelProperties, attributes) {
            await this.extensionService.activateByEvent(exports.ACTIVATION_EVENT);
            const existingTunnel = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, tunnelProperties.remote.host, tunnelProperties.remote.port);
            attributes = attributes ??
                ((attributes !== null)
                    ? (await this.getAttributes([tunnelProperties.remote]))?.get(tunnelProperties.remote.port)
                    : undefined);
            const localPort = (tunnelProperties.local !== undefined) ? tunnelProperties.local : tunnelProperties.remote.port;
            let noTunnelValue;
            if (!existingTunnel) {
                const authority = this.environmentService.remoteAuthority;
                const addressProvider = authority ? {
                    getAddress: async () => { return (await this.remoteAuthorityResolverService.resolveAuthority(authority)).authority; }
                } : undefined;
                const key = makeAddress(tunnelProperties.remote.host, tunnelProperties.remote.port);
                this.inProgress.set(key, true);
                tunnelProperties = this.mergeCachedAndUnrestoredProperties(key, tunnelProperties);
                const tunnel = await this.tunnelService.openTunnel(addressProvider, tunnelProperties.remote.host, tunnelProperties.remote.port, undefined, localPort, (!tunnelProperties.elevateIfNeeded) ? attributes?.elevateIfNeeded : tunnelProperties.elevateIfNeeded, tunnelProperties.privacy, attributes?.protocol);
                if (typeof tunnel === 'string') {
                    // There was an error  while creating the tunnel.
                    noTunnelValue = tunnel;
                }
                else if (tunnel && tunnel.localAddress) {
                    const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces(this._candidates ?? new Map(), tunnelProperties.remote.host, tunnelProperties.remote.port);
                    const protocol = (tunnel.protocol ?
                        ((tunnel.protocol === tunnel_1.TunnelProtocol.Https) ? tunnel_1.TunnelProtocol.Https : tunnel_1.TunnelProtocol.Http)
                        : (attributes?.protocol ?? tunnel_1.TunnelProtocol.Http));
                    const newForward = {
                        remoteHost: tunnel.tunnelRemoteHost,
                        remotePort: tunnel.tunnelRemotePort,
                        localPort: tunnel.tunnelLocalPort,
                        name: attributes?.label ?? tunnelProperties.name,
                        closeable: true,
                        localAddress: tunnel.localAddress,
                        protocol,
                        localUri: await this.makeLocalUri(tunnel.localAddress, attributes),
                        runningProcess: matchingCandidate?.detail,
                        hasRunningProcess: !!matchingCandidate,
                        pid: matchingCandidate?.pid,
                        source: tunnelProperties.source ?? exports.UserTunnelSource,
                        privacy: tunnel.privacy,
                    };
                    this.forwarded.set(key, newForward);
                    this.remoteTunnels.set(key, tunnel);
                    this.inProgress.delete(key);
                    await this.storeForwarded();
                    await this.showPortMismatchModalIfNeeded(tunnel, localPort, attributes);
                    this._onForwardPort.fire(newForward);
                    return tunnel;
                }
                this.inProgress.delete(key);
            }
            else {
                return this.mergeAttributesIntoExistingTunnel(existingTunnel, tunnelProperties, attributes);
            }
            return noTunnelValue;
        }
        mergeCachedAndUnrestoredProperties(key, tunnelProperties) {
            const map = this.unrestoredExtensionTunnels.has(key) ? this.unrestoredExtensionTunnels : (this.sessionCachedProperties.has(key) ? this.sessionCachedProperties : undefined);
            if (map) {
                const updateProps = map.get(key);
                map.delete(key);
                if (updateProps) {
                    tunnelProperties.name = updateProps.name ?? tunnelProperties.name;
                    tunnelProperties.local = (('local' in updateProps) ? updateProps.local : (('localPort' in updateProps) ? updateProps.localPort : undefined)) ?? tunnelProperties.local;
                    tunnelProperties.privacy = tunnelProperties.privacy;
                }
            }
            return tunnelProperties;
        }
        async mergeAttributesIntoExistingTunnel(existingTunnel, tunnelProperties, attributes) {
            const newName = attributes?.label ?? tunnelProperties.name;
            let MergedAttributeAction;
            (function (MergedAttributeAction) {
                MergedAttributeAction[MergedAttributeAction["None"] = 0] = "None";
                MergedAttributeAction[MergedAttributeAction["Fire"] = 1] = "Fire";
                MergedAttributeAction[MergedAttributeAction["Reopen"] = 2] = "Reopen";
            })(MergedAttributeAction || (MergedAttributeAction = {}));
            let mergedAction = MergedAttributeAction.None;
            if (newName !== existingTunnel.name) {
                existingTunnel.name = newName;
                mergedAction = MergedAttributeAction.Fire;
            }
            // Source of existing tunnel wins so that original source is maintained
            if ((attributes?.protocol || (existingTunnel.protocol !== tunnel_1.TunnelProtocol.Http)) && (attributes?.protocol !== existingTunnel.protocol)) {
                tunnelProperties.source = existingTunnel.source;
                mergedAction = MergedAttributeAction.Reopen;
            }
            // New privacy value wins
            if (tunnelProperties.privacy && (existingTunnel.privacy !== tunnelProperties.privacy)) {
                mergedAction = MergedAttributeAction.Reopen;
            }
            switch (mergedAction) {
                case MergedAttributeAction.Fire: {
                    this._onForwardPort.fire();
                    break;
                }
                case MergedAttributeAction.Reopen: {
                    await this.close(existingTunnel.remoteHost, existingTunnel.remotePort, TunnelCloseReason.User);
                    await this.doForward(tunnelProperties, attributes);
                }
            }
            return mapHasAddressLocalhostOrAllInterfaces(this.remoteTunnels, tunnelProperties.remote.host, tunnelProperties.remote.port);
        }
        async name(host, port, name) {
            const existingForwarded = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, host, port);
            const key = makeAddress(host, port);
            if (existingForwarded) {
                existingForwarded.name = name;
                await this.storeForwarded();
                this._onPortName.fire({ host, port });
                return;
            }
            else if (this.detected.has(key)) {
                this.detected.get(key).name = name;
                this._onPortName.fire({ host, port });
            }
        }
        async close(host, port, reason) {
            const key = makeAddress(host, port);
            const oldTunnel = this.forwarded.get(key);
            if ((reason === TunnelCloseReason.AutoForwardEnd) && oldTunnel && (oldTunnel.source.source === TunnelSource.Auto)) {
                this.sessionCachedProperties.set(key, {
                    local: oldTunnel.localPort,
                    name: oldTunnel.name,
                    privacy: oldTunnel.privacy,
                });
            }
            await this.tunnelService.closeTunnel(host, port);
            return this.onTunnelClosed({ host, port }, reason);
        }
        address(host, port) {
            const key = makeAddress(host, port);
            return (this.forwarded.get(key) || this.detected.get(key))?.localAddress;
        }
        get environmentTunnelsSet() {
            return this._environmentTunnelsSet;
        }
        addEnvironmentTunnels(tunnels) {
            if (tunnels) {
                for (const tunnel of tunnels) {
                    const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces(this._candidates ?? new Map(), tunnel.remoteAddress.host, tunnel.remoteAddress.port);
                    const localAddress = typeof tunnel.localAddress === 'string' ? tunnel.localAddress : makeAddress(tunnel.localAddress.host, tunnel.localAddress.port);
                    this.detected.set(makeAddress(tunnel.remoteAddress.host, tunnel.remoteAddress.port), {
                        remoteHost: tunnel.remoteAddress.host,
                        remotePort: tunnel.remoteAddress.port,
                        localAddress: localAddress,
                        protocol: tunnel_1.TunnelProtocol.Http,
                        localUri: this.makeLocalUri(localAddress),
                        closeable: false,
                        runningProcess: matchingCandidate?.detail,
                        hasRunningProcess: !!matchingCandidate,
                        pid: matchingCandidate?.pid,
                        privacy: tunnel_1.TunnelPrivacyId.ConstantPrivate,
                        source: {
                            source: TunnelSource.Extension,
                            description: nls.localize('tunnel.staticallyForwarded', "Statically Forwarded")
                        }
                    });
                    this.tunnelService.setEnvironmentTunnel(tunnel.remoteAddress.host, tunnel.remoteAddress.port, localAddress, tunnel_1.TunnelPrivacyId.ConstantPrivate, tunnel_1.TunnelProtocol.Http);
                }
            }
            this._environmentTunnelsSet = true;
            this._onEnvironmentTunnelsSet.fire();
            this._onForwardPort.fire();
        }
        setCandidateFilter(filter) {
            this._candidateFilter = filter;
        }
        async setCandidates(candidates) {
            let processedCandidates = candidates;
            if (this._candidateFilter) {
                // When an extension provides a filter, we do the filtering on the extension host before the candidates are set here.
                // However, when the filter doesn't come from an extension we filter here.
                processedCandidates = await this._candidateFilter(candidates);
            }
            const removedCandidates = this.updateInResponseToCandidates(processedCandidates);
            this.logService.trace(`ForwardedPorts: (TunnelModel) removed candidates ${Array.from(removedCandidates.values()).map(candidate => candidate.port).join(', ')}`);
            this._onCandidatesChanged.fire(removedCandidates);
        }
        // Returns removed candidates
        updateInResponseToCandidates(candidates) {
            const removedCandidates = this._candidates ?? new Map();
            const candidatesMap = new Map();
            this._candidates = candidatesMap;
            candidates.forEach(value => {
                const addressKey = makeAddress(value.host, value.port);
                candidatesMap.set(addressKey, {
                    host: value.host,
                    port: value.port,
                    detail: value.detail,
                    pid: value.pid
                });
                if (removedCandidates.has(addressKey)) {
                    removedCandidates.delete(addressKey);
                }
                const forwardedValue = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, value.host, value.port);
                if (forwardedValue) {
                    forwardedValue.runningProcess = value.detail;
                    forwardedValue.hasRunningProcess = true;
                    forwardedValue.pid = value.pid;
                }
            });
            removedCandidates.forEach((_value, key) => {
                const parsedAddress = parseAddress(key);
                if (!parsedAddress) {
                    return;
                }
                const forwardedValue = mapHasAddressLocalhostOrAllInterfaces(this.forwarded, parsedAddress.host, parsedAddress.port);
                if (forwardedValue) {
                    forwardedValue.runningProcess = undefined;
                    forwardedValue.hasRunningProcess = false;
                    forwardedValue.pid = undefined;
                }
                const detectedValue = mapHasAddressLocalhostOrAllInterfaces(this.detected, parsedAddress.host, parsedAddress.port);
                if (detectedValue) {
                    detectedValue.runningProcess = undefined;
                    detectedValue.hasRunningProcess = false;
                    detectedValue.pid = undefined;
                }
            });
            return removedCandidates;
        }
        get candidates() {
            return this._candidates ? Array.from(this._candidates.values()) : [];
        }
        get candidatesOrUndefined() {
            return this._candidates ? this.candidates : undefined;
        }
        async updateAttributes() {
            // If the label changes in the attributes, we should update it.
            const tunnels = Array.from(this.forwarded.values());
            const allAttributes = await this.getAttributes(tunnels.map(tunnel => {
                return { port: tunnel.remotePort, host: tunnel.remoteHost };
            }), false);
            if (!allAttributes) {
                return;
            }
            for (const forwarded of tunnels) {
                const attributes = allAttributes.get(forwarded.remotePort);
                if ((attributes?.protocol || (forwarded.protocol !== tunnel_1.TunnelProtocol.Http)) && (attributes?.protocol !== forwarded.protocol)) {
                    await this.doForward({
                        remote: { host: forwarded.remoteHost, port: forwarded.remotePort },
                        local: forwarded.localPort,
                        name: forwarded.name,
                        source: forwarded.source
                    }, attributes);
                }
                if (!attributes) {
                    continue;
                }
                if (attributes.label && attributes.label !== forwarded.name) {
                    await this.name(forwarded.remoteHost, forwarded.remotePort, attributes.label);
                }
            }
        }
        async getAttributes(forwardedPorts, checkProviders = true) {
            const matchingCandidates = new Map();
            const pidToPortsMapping = new Map();
            forwardedPorts.forEach(forwardedPort => {
                const matchingCandidate = mapHasAddressLocalhostOrAllInterfaces(this._candidates ?? new Map(), tunnel_1.LOCALHOST_ADDRESSES[0], forwardedPort.port) ?? forwardedPort;
                if (matchingCandidate) {
                    matchingCandidates.set(forwardedPort.port, matchingCandidate);
                    const pid = isCandidatePort(matchingCandidate) ? matchingCandidate.pid : undefined;
                    if (!pidToPortsMapping.has(pid)) {
                        pidToPortsMapping.set(pid, []);
                    }
                    pidToPortsMapping.get(pid)?.push(forwardedPort.port);
                }
            });
            const configAttributes = new Map();
            forwardedPorts.forEach(forwardedPort => {
                const attributes = this.configPortsAttributes.getAttributes(forwardedPort.port, forwardedPort.host, matchingCandidates.get(forwardedPort.port)?.detail);
                if (attributes) {
                    configAttributes.set(forwardedPort.port, attributes);
                }
            });
            if ((this.portAttributesProviders.length === 0) || !checkProviders) {
                return (configAttributes.size > 0) ? configAttributes : undefined;
            }
            // Group calls to provide attributes by pid.
            const allProviderResults = await Promise.all((0, arrays_1.flatten)(this.portAttributesProviders.map(provider => {
                return Array.from(pidToPortsMapping.entries()).map(entry => {
                    const portGroup = entry[1];
                    const matchingCandidate = matchingCandidates.get(portGroup[0]);
                    return provider.providePortAttributes(portGroup, matchingCandidate?.pid, matchingCandidate?.detail, cancellation_1.CancellationToken.None);
                });
            })));
            const providedAttributes = new Map();
            allProviderResults.forEach(attributes => attributes.forEach(attribute => {
                if (attribute) {
                    providedAttributes.set(attribute.port, attribute);
                }
            }));
            if (!configAttributes && !providedAttributes) {
                return undefined;
            }
            // Merge. The config wins.
            const mergedAttributes = new Map();
            forwardedPorts.forEach(forwardedPorts => {
                const config = configAttributes.get(forwardedPorts.port);
                const provider = providedAttributes.get(forwardedPorts.port);
                mergedAttributes.set(forwardedPorts.port, {
                    elevateIfNeeded: config?.elevateIfNeeded,
                    label: config?.label,
                    onAutoForward: config?.onAutoForward ?? PortsAttributes.providedActionToAction(provider?.autoForwardAction),
                    requireLocalPort: config?.requireLocalPort,
                    protocol: config?.protocol
                });
            });
            return mergedAttributes;
        }
        addAttributesProvider(provider) {
            this.portAttributesProviders.push(provider);
        }
    };
    exports.TunnelModel = TunnelModel;
    __decorate([
        (0, decorators_1.debounce)(1000)
    ], TunnelModel.prototype, "storeForwarded", null);
    exports.TunnelModel = TunnelModel = __decorate([
        __param(0, tunnel_1.ITunnelService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, log_1.ILogService),
        __param(7, dialogs_1.IDialogService),
        __param(8, extensions_1.IExtensionService),
        __param(9, contextkey_1.IContextKeyService)
    ], TunnelModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHVubmVsTW9kZWwuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9yZW1vdGUvY29tbW9uL3R1bm5lbE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdFaEcsb0NBTUM7SUF1QkQsc0NBeUJDO0lBRUQsc0ZBVUM7SUFHRCxrQ0FFQztJQThDRCwwQ0FLQztJQWxLRCxNQUFNLDRCQUE0QixHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxhQUFhO0lBQzdELE1BQU0sa0JBQWtCLEdBQUcsMEJBQTBCLENBQUM7SUFDdEQsTUFBTSw2QkFBNkIsR0FBRyxvQ0FBb0MsQ0FBQztJQUMzRSxNQUFNLHVCQUF1QixHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxVQUFVO0lBQ3ZELFFBQUEsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDO0lBQzlCLFFBQUEseUJBQXlCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLDJCQUEyQixFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLGtDQUFrQyxFQUFFLG9DQUFvQyxDQUFDLENBQUMsQ0FBQztJQW1DaE0sU0FBZ0IsWUFBWSxDQUFDLE9BQWU7UUFDM0MsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO1FBQ25GLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNkLE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFDRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksV0FBVyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMzRyxDQUFDO0lBRUQsSUFBWSxpQkFJWDtJQUpELFdBQVksaUJBQWlCO1FBQzVCLG9DQUFlLENBQUE7UUFDZixrQ0FBYSxDQUFBO1FBQ2Isc0RBQWlDLENBQUE7SUFDbEMsQ0FBQyxFQUpXLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBSTVCO0lBRUQsSUFBWSxZQUlYO0lBSkQsV0FBWSxZQUFZO1FBQ3ZCLCtDQUFJLENBQUE7UUFDSiwrQ0FBSSxDQUFBO1FBQ0oseURBQVMsQ0FBQTtJQUNWLENBQUMsRUFKVyxZQUFZLDRCQUFaLFlBQVksUUFJdkI7SUFFWSxRQUFBLGdCQUFnQixHQUFHO1FBQy9CLE1BQU0sRUFBRSxZQUFZLENBQUMsSUFBSTtRQUN6QixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxnQkFBZ0IsQ0FBQztLQUNqRSxDQUFDO0lBQ1csUUFBQSxnQkFBZ0IsR0FBRztRQUMvQixNQUFNLEVBQUUsWUFBWSxDQUFDLElBQUk7UUFDekIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLENBQUM7S0FDakUsQ0FBQztJQUVGLFNBQWdCLGFBQWEsQ0FBSSxHQUFtQixFQUFFLElBQVksRUFBRSxJQUFZO1FBQy9FLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVELElBQUksSUFBQSxvQkFBVyxFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdkIsc0JBQXNCO1lBQ3RCLEtBQUssTUFBTSxRQUFRLElBQUksNEJBQW1CLEVBQUUsQ0FBQztnQkFDNUMsTUFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7b0JBQzFCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO2FBQU0sSUFBSSxJQUFBLHdCQUFlLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNsQywyQkFBMkI7WUFDM0IsS0FBSyxNQUFNLFFBQVEsSUFBSSxpQ0FBd0IsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUM3QixDQUFDO1lBQ0YsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLFNBQVMsQ0FBQztJQUNsQixDQUFDO0lBRUQsU0FBZ0IscUNBQXFDLENBQUksR0FBbUIsRUFBRSxJQUFZLEVBQUUsSUFBWTtRQUN2RyxNQUFNLGVBQWUsR0FBRyxhQUFhLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQ3JCLE9BQU8sZUFBZSxDQUFDO1FBQ3hCLENBQUM7UUFDRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHdCQUFlLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU8sYUFBYSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELE9BQU8sU0FBUyxDQUFDO0lBQ2xCLENBQUM7SUFHRCxTQUFnQixXQUFXLENBQUMsSUFBWSxFQUFFLElBQVk7UUFDckQsT0FBTyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQztJQUMxQixDQUFDO0lBeUJELElBQVksYUFPWDtJQVBELFdBQVksYUFBYTtRQUN4QixrQ0FBaUIsQ0FBQTtRQUNqQiw0Q0FBMkIsQ0FBQTtRQUMzQixvREFBbUMsQ0FBQTtRQUNuQyw0Q0FBMkIsQ0FBQTtRQUMzQixrQ0FBaUIsQ0FBQTtRQUNqQixrQ0FBaUIsQ0FBQTtJQUNsQixDQUFDLEVBUFcsYUFBYSw2QkFBYixhQUFhLFFBT3hCO0lBY0QsU0FBZ0IsZUFBZSxDQUFDLFNBQWM7UUFDN0MsT0FBTyxTQUFTLElBQUksTUFBTSxJQUFJLFNBQVMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxJQUFJLEtBQUssUUFBUTtlQUN6RSxNQUFNLElBQUksU0FBUyxJQUFJLE9BQU8sU0FBUyxDQUFDLElBQUksS0FBSyxRQUFRO2VBQ3pELENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDO2VBQ2xFLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQUMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtpQkFDL0IsWUFBTyxHQUFHLHdCQUF3QixBQUEzQixDQUE0QjtpQkFDbkMsYUFBUSxHQUFHLDZCQUE2QixBQUFoQyxDQUFpQztpQkFDekMsVUFBSyxHQUFHLGdCQUFnQixBQUFuQixDQUFvQjtpQkFDekIsa0JBQWEsR0FBRywyQkFBMkIsQUFBOUIsQ0FBK0I7UUFNM0QsWUFBNkIsb0JBQTJDO1lBQ3ZFLEtBQUssRUFBRSxDQUFDO1lBRG9CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFMaEUsb0JBQWUsR0FBcUIsRUFBRSxDQUFDO1lBRXZDLDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUFRLENBQUM7WUFDckMsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUl6RSxJQUFJLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUNoRSxJQUFJLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO29CQUN6RyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDekIsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRU8sZ0JBQWdCO1lBQ3ZCLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQyxDQUFDO1FBRUQsYUFBYSxDQUFDLElBQVksRUFBRSxJQUFZLEVBQUUsV0FBb0I7WUFDN0QsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLE1BQU0sVUFBVSxHQUFlO2dCQUM5QixLQUFLLEVBQUUsU0FBUztnQkFDaEIsYUFBYSxFQUFFLFNBQVM7Z0JBQ3hCLGVBQWUsRUFBRSxTQUFTO2dCQUMxQixnQkFBZ0IsRUFBRSxTQUFTO2dCQUMzQixRQUFRLEVBQUUsU0FBUzthQUNuQixDQUFDO1lBQ0YsT0FBTyxLQUFLLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFDLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztvQkFDeEIsVUFBVSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUM7b0JBQzNFLFVBQVUsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxLQUFLLENBQUMsZUFBZSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDO29CQUN4SCxVQUFVLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQztvQkFDbkQsVUFBVSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDckQsVUFBVSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO2dCQUN0QyxDQUFDO3FCQUFNLENBQUM7b0JBQ1Asc0ZBQXNGO29CQUN0RixVQUFVLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQztvQkFDM0UsVUFBVSxDQUFDLGVBQWUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxlQUFlLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUM7b0JBQzdILFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDO29CQUNuRCxVQUFVLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUNwSCxVQUFVLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQztnQkFDN0QsQ0FBQztnQkFDRCxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN0RixDQUFDO1lBQ0QsSUFBSSxVQUFVLENBQUMsYUFBYSxLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsZUFBZSxLQUFLLFNBQVM7bUJBQ2xGLFVBQVUsQ0FBQyxLQUFLLEtBQUssU0FBUyxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTO21CQUMzRSxVQUFVLENBQUMsUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUN2QyxPQUFPLFVBQVUsQ0FBQztZQUNuQixDQUFDO1lBRUQsNkRBQTZEO1lBQzdELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUVPLFdBQVcsQ0FBQyxLQUFnRDtZQUNuRSxPQUFPLENBQU8sS0FBTSxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFPLEtBQU0sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVPLGNBQWMsQ0FBQyxLQUFnRDtZQUN0RSxPQUFPLENBQU8sS0FBTSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFPLEtBQU0sQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDO21CQUN6RSxJQUFBLGdCQUFRLEVBQU8sS0FBTSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUEsZ0JBQVEsRUFBTyxLQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEUsQ0FBQztRQUVPLGFBQWEsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLFdBQStCLEVBQUUsVUFBNEIsRUFBRSxTQUFpQjtZQUNqSSxJQUFJLFNBQVMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3BDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDWCxDQUFDO1lBQ0QsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFBLG9CQUFXLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFBLHdCQUFlLEVBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkUsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMzQyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzdDLElBQUksSUFBQSxnQkFBUSxFQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN6QixPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQztnQkFDbkQsQ0FBQztxQkFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3hDLE9BQU8sYUFBYSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRixDQUFDO3FCQUFNLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDM0MsT0FBTyxDQUFDLElBQUksS0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9ELENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDMUQsQ0FBQztZQUVGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxVQUFVLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU8sV0FBVztZQUNsQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRixJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBQSxnQkFBUSxFQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFxQixFQUFFLENBQUM7WUFDeEMsS0FBSyxNQUFNLGFBQWEsSUFBSSxZQUFZLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ2pDLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxNQUFNLE9BQU8sR0FBUyxZQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ25ELElBQUksR0FBRyxHQUEwRCxTQUFTLENBQUM7Z0JBQzNFLElBQUksTUFBTSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUM7b0JBQzNCLEdBQUcsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzdCLENBQUM7cUJBQU0sSUFBSSxJQUFBLGdCQUFRLEVBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO3dCQUMvQyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDekQsR0FBRyxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzVELENBQUM7eUJBQU0sSUFBSSxlQUFlLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO3dCQUM5RCxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDakUsR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3BELENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxJQUFJLE9BQU8sR0FBdUIsU0FBUyxDQUFDO3dCQUM1QyxJQUFJLENBQUM7NEJBQ0osT0FBTyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDakMsQ0FBQzt3QkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDOzRCQUNaLGtEQUFrRDt3QkFDbkQsQ0FBQzt3QkFDRCxJQUFJLE9BQU8sRUFBRSxDQUFDOzRCQUNiLEdBQUcsR0FBRyxPQUFPLENBQUM7d0JBQ2YsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNWLFNBQVM7Z0JBQ1YsQ0FBQztnQkFDRCxVQUFVLENBQUMsSUFBSSxDQUFDO29CQUNmLEdBQUcsRUFBRSxHQUFHO29CQUNSLGVBQWUsRUFBRSxPQUFPLENBQUMsZUFBZTtvQkFDeEMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxhQUFhO29CQUNwQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7b0JBQ3BCLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxnQkFBZ0I7b0JBQzFDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtpQkFDMUIsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFRLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25GLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQ2QsSUFBSSxDQUFDLHFCQUFxQixHQUFHO29CQUM1QixlQUFlLEVBQUUsUUFBUSxDQUFDLGVBQWU7b0JBQ3pDLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztvQkFDckIsYUFBYSxFQUFFLFFBQVEsQ0FBQyxhQUFhO29CQUNyQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsZ0JBQWdCO29CQUMzQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVE7aUJBQzNCLENBQUM7WUFDSCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFFTyxjQUFjLENBQUMsVUFBNEI7WUFDbEQsU0FBUyxNQUFNLENBQUMsSUFBb0IsRUFBRSxPQUF3QjtnQkFDN0QsSUFBSSxJQUFBLGdCQUFRLEVBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDakIsQ0FBQztxQkFBTSxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFDLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZCLENBQUM7cUJBQU0sSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUM3QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUN0QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUN6QixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0IsT0FBTyxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU8sa0JBQWtCO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDO1FBQ25DLENBQUM7UUFFRCxNQUFNLENBQUMsc0JBQXNCLENBQUMsY0FBaUQ7WUFDOUUsUUFBUSxjQUFjLEVBQUUsQ0FBQztnQkFDeEIsS0FBSyw4QkFBcUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLGFBQWEsQ0FBQyxNQUFNLENBQUM7Z0JBQy9ELEtBQUssOEJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBTyxhQUFhLENBQUMsV0FBVyxDQUFDO2dCQUN6RSxLQUFLLDhCQUFxQixDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sYUFBYSxDQUFDLGVBQWUsQ0FBQztnQkFDakYsS0FBSyw4QkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLGFBQWEsQ0FBQyxXQUFXLENBQUM7Z0JBQ3pFLEtBQUssOEJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxhQUFhLENBQUMsTUFBTSxDQUFDO2dCQUMvRCxLQUFLLDhCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQztnQkFDL0QsT0FBTyxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7UUFFTSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQVksRUFBRSxVQUErQixFQUFFLE1BQTJCO1lBQ3BHLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sV0FBVyxHQUFRLFlBQVksQ0FBQyxlQUFlLENBQUM7WUFDdEQsSUFBSSxjQUFtQixDQUFDO1lBQ3hCLElBQUksQ0FBQyxXQUFXLElBQUksQ0FBQyxJQUFBLGdCQUFRLEVBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDNUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztZQUNyQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsY0FBYyxHQUFHLElBQUEsbUJBQVMsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBRUQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsY0FBYyxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDaEMsQ0FBQztZQUNELEtBQUssTUFBTSxTQUFTLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ3BDLGNBQWMsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQVMsVUFBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDL0YsQ0FBQzs7SUE3TUYsMENBOE1DO0lBRU0sSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHNCQUFVO1FBOEIxQyxZQUNpQixhQUE4QyxFQUM3QyxjQUFnRCxFQUMxQyxvQkFBNEQsRUFDckQsa0JBQWlFLEVBQzlELDhCQUFnRixFQUN2Rix1QkFBa0UsRUFDL0UsVUFBd0MsRUFDckMsYUFBOEMsRUFDM0MsZ0JBQW9ELEVBQ25ELGlCQUFzRDtZQUUxRSxLQUFLLEVBQUUsQ0FBQztZQVh5QixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDNUIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ3pCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDcEMsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUM3QyxtQ0FBOEIsR0FBOUIsOEJBQThCLENBQWlDO1lBQ3RFLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDOUQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNwQixrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNsQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBdEMxRCxlQUFVLEdBQXNCLElBQUksR0FBRyxFQUFFLENBQUM7WUFHbkQsbUJBQWMsR0FBMkIsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQUN4RCxrQkFBYSxHQUF5QixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUMvRCxpQkFBWSxHQUE0QyxJQUFJLGVBQU8sRUFBRSxDQUFDO1lBQ3ZFLGdCQUFXLEdBQTBDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBQzVFLGdCQUFXLEdBQTRDLElBQUksZUFBTyxFQUFFLENBQUM7WUFDdEUsZUFBVSxHQUEwQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUUxRSx5QkFBb0IsR0FBeUQsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQUNuRyxvREFBb0Q7WUFDN0Msd0JBQW1CLEdBQXVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7WUFHekcsNkJBQXdCLEdBQWtCLElBQUksZUFBTyxFQUFFLENBQUM7WUFDekQsNEJBQXVCLEdBQWdCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUM7WUFDMUUsMkJBQXNCLEdBQVksS0FBSyxDQUFDO1lBRXhDLG9CQUFlLEdBQWdDLFNBQVMsQ0FBQztZQUV6RCxvQkFBZSxHQUFHLEtBQUssQ0FBQztZQUN4QixzQkFBaUIsR0FBa0IsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQUNqRCwrQkFBMEIsR0FBa0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN0RSw0QkFBdUIsR0FBMkMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUU1RSw0QkFBdUIsR0FBNkIsRUFBRSxDQUFDO1lBNk92RCxxQkFBZ0IsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBOU5yQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxlQUFlLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN2RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDdkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO2dCQUNqRCxNQUFNLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDaEUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN6RSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNKLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQzlCLElBQUksTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUN6QixNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUMxRSxNQUFNLGlCQUFpQixHQUFHLHFDQUFxQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7d0JBQ2pKLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTs0QkFDdkIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0I7NEJBQ25DLFVBQVUsRUFBRSxNQUFNLENBQUMsZ0JBQWdCOzRCQUNuQyxZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7NEJBQ2pDLFFBQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLFFBQVEsSUFBSSx1QkFBYyxDQUFDLElBQUk7NEJBQ25GLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzRCQUNoRyxTQUFTLEVBQUUsTUFBTSxDQUFDLGVBQWU7NEJBQ2pDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxNQUFNOzRCQUN6QyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsaUJBQWlCOzRCQUN0QyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsR0FBRzs0QkFDM0IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPOzRCQUN2QixNQUFNLEVBQUUsd0JBQWdCO3lCQUN4QixDQUFDLENBQUM7d0JBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO29CQUNyQyxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUMxQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDakUsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDMUUsSUFBSSxDQUFDLHFDQUFxQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQzt1QkFDeEcsQ0FBQyxxQ0FBcUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7dUJBQ3ZHLENBQUMscUNBQXFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDO3VCQUN6RyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3pCLE1BQU0saUJBQWlCLEdBQUcscUNBQXFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDakosTUFBTSxVQUFVLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztvQkFDaEosSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO3dCQUN2QixVQUFVLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjt3QkFDbkMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0I7d0JBQ25DLFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWTt3QkFDakMsUUFBUSxFQUFFLFVBQVUsRUFBRSxRQUFRLElBQUksdUJBQWMsQ0FBQyxJQUFJO3dCQUNyRCxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDO3dCQUNsRSxTQUFTLEVBQUUsTUFBTSxDQUFDLGVBQWU7d0JBQ2pDLFNBQVMsRUFBRSxJQUFJO3dCQUNmLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxNQUFNO3dCQUN6QyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsaUJBQWlCO3dCQUN0QyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsR0FBRzt3QkFDM0IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO3dCQUN2QixNQUFNLEVBQUUsd0JBQWdCO3FCQUN4QixDQUFDLENBQUM7Z0JBQ0osQ0FBQztnQkFDRCxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFDO1lBQ3BELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUMxRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDSixJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztRQUN2QyxDQUFDO1FBRU8sMkJBQTJCO1lBQ2xDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLHdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUNoSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLGlDQUF5QixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEUsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU8sOEJBQThCO1lBQ3JDLElBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFLEVBQUUsQ0FBQztnQkFDeEMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLG9CQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDOUYsSUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDO29CQUN4QyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU8sS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUF1QyxFQUFFLE1BQXlCO1lBQzlGLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDakMsQ0FBQztRQUNGLENBQUM7UUFFTyxZQUFZLENBQUMsWUFBb0IsRUFBRSxVQUF1QjtZQUNqRSxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2hDLENBQUM7WUFDRCxNQUFNLFFBQVEsR0FBRyxVQUFVLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQztZQUNoRCxPQUFPLFNBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxRQUFRLE1BQU0sWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRU8sS0FBSyxDQUFDLG9CQUFvQixDQUFDLE1BQWM7WUFDaEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzlELE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLFdBQUksRUFBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEssSUFBSSxhQUFhLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7Z0JBQ3ZGLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLEdBQUcsTUFBTSxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLElBQUksYUFBYSxFQUFFLENBQUM7UUFDaEYsQ0FBQztRQUVPLEtBQUssQ0FBQywwQkFBMEI7WUFDdkMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU8sS0FBSyxDQUFDLDhCQUE4QjtZQUMzQyxPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ2pFLENBQUM7UUFFTyxLQUFLLENBQUMscUJBQXFCO1lBQ2xDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGtCQUFrQixpQ0FBeUIsQ0FBQztZQUM1RixJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsaUNBQXlCLENBQUM7Z0JBQ3ZFLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLGVBQWUsQ0FBQztZQUN4QixDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztZQUMzRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQ2pCLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFVBQVUsK0JBQXVCLENBQUM7UUFDbEUsQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0I7WUFDckIsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQztnQkFDeEUsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDekQsSUFBSSxrQkFBa0IsSUFBSSxDQUFDLGtCQUFrQixLQUFLLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUM7b0JBQ2hGLE1BQU0sT0FBTyxHQUFtQyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO29CQUNyRixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxpREFBaUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUM5SCxLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUM5QixNQUFNLGdCQUFnQixHQUFHLHFDQUFxQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7d0JBQ3BILGtFQUFrRTt3QkFDbEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLFlBQVksQ0FBQyxTQUFTLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssWUFBWSxDQUFDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7NEJBQ3JKLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQztnQ0FDcEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUU7Z0NBQzVELEtBQUssRUFBRSxNQUFNLENBQUMsU0FBUztnQ0FDdkIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO2dDQUNqQixlQUFlLEVBQUUsSUFBSTtnQ0FDckIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNOzZCQUNyQixDQUFDLENBQUM7d0JBQ0osQ0FBQzs2QkFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLFlBQVksQ0FBQyxTQUFTLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOzRCQUNqRixJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQzt3QkFDaEcsQ0FBQztvQkFDRixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1lBRTlCLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzNCLDhEQUE4RDtnQkFDOUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7Z0JBQzdELElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLCtCQUF1QixTQUFTLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDaEksSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRSxDQUFDO3dCQUNuQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLCtCQUF1QixDQUFDLENBQUM7d0JBQzlGLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQy9CLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBRU8sK0JBQStCO1lBQ3RDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSwwREFBMEMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQztZQUM3SSxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxHQUFHLCtCQUF1QixDQUFDO2dCQUM1RSxJQUFJLFVBQVUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7b0JBQzNDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNyRCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLDZCQUE2QixFQUFFLGtCQUFrQixDQUFDLENBQUM7b0JBQ2xGLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsK0JBQXVCLENBQUM7b0JBQ3RELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFVBQVUsK0JBQXVCLENBQUM7Z0JBQzlELENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUdhLEFBQU4sS0FBSyxDQUFDLGNBQWM7WUFDM0IsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLDhCQUE4QixDQUFDLEVBQUUsQ0FBQztnQkFDeEUsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3RELE1BQU0saUJBQWlCLEdBQXVCLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3BFLE9BQU87d0JBQ04sVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO3dCQUM3QixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7d0JBQzdCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUzt3QkFDM0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO3dCQUNqQixZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVk7d0JBQ2pDLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTt3QkFDekIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO3dCQUN6QixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU07cUJBQ3JCLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsSUFBSSxZQUFnQyxDQUFDO2dCQUNyQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQzFCLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2xELENBQUM7Z0JBRUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztnQkFDcEQsTUFBTSxhQUFhLEdBQUcsTUFBTSxJQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztnQkFDbEUsSUFBSSxDQUFDLFlBQVksSUFBSSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQzNDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsK0JBQXVCLENBQUM7b0JBQ3RELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLGFBQWEsK0JBQXVCLENBQUM7Z0JBQ2pFLENBQUM7cUJBQU0sSUFBSSxDQUFDLFlBQVksS0FBSyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7b0JBQ25GLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxZQUFZLDJEQUEyQyxDQUFDO29CQUN2RixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLHVCQUF1QiwyREFBMkMsQ0FBQztnQkFDMUgsQ0FBQztnQkFDRCxJQUFJLENBQUMsc0JBQXNCLEdBQUcsWUFBWSxDQUFDO1lBQzVDLENBQUM7UUFDRixDQUFDO1FBR08sS0FBSyxDQUFDLDZCQUE2QixDQUFDLE1BQW9CLEVBQUUsYUFBcUIsRUFBRSxVQUFrQztZQUMxSCxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsSUFBSSxDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDO2dCQUM5RCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksTUFBTSxDQUFDLGVBQWUsS0FBSyxhQUFhLEVBQUUsQ0FBQztnQkFDOUMsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEdBQUcsNEJBQTRCLENBQUMsR0FBRyxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztnQkFDOUYsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDO1lBQ3BDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsaUNBQWlDLEVBQUUsbU1BQW1NLEVBQ3pRLGFBQWEsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEQsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWtDLEVBQUUsVUFBOEI7WUFDL0UsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsRUFBRSxDQUFDO2dCQUN0RSxNQUFNLGFBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVPLEtBQUssQ0FBQyxTQUFTLENBQUMsZ0JBQWtDLEVBQUUsVUFBOEI7WUFDekYsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLHdCQUFnQixDQUFDLENBQUM7WUFFOUQsTUFBTSxjQUFjLEdBQUcscUNBQXFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN6SSxVQUFVLEdBQUcsVUFBVTtnQkFDdEIsQ0FBQyxDQUFDLFVBQVUsS0FBSyxJQUFJLENBQUM7b0JBQ3JCLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDMUYsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2YsTUFBTSxTQUFTLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNqSCxJQUFJLGFBQWlDLENBQUM7WUFDdEMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNyQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO2dCQUMxRCxNQUFNLGVBQWUsR0FBaUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDakUsVUFBVSxFQUFFLEtBQUssSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLDhCQUE4QixDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztpQkFDckgsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUVkLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDcEYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvQixnQkFBZ0IsR0FBRyxJQUFJLENBQUMsa0NBQWtDLENBQUMsR0FBRyxFQUFFLGdCQUFnQixDQUFDLENBQUM7Z0JBRWxGLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsZUFBZSxFQUFFLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzVTLElBQUksT0FBTyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ2hDLGlEQUFpRDtvQkFDakQsYUFBYSxHQUFHLE1BQU0sQ0FBQztnQkFDeEIsQ0FBQztxQkFBTSxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQzFDLE1BQU0saUJBQWlCLEdBQUcscUNBQXFDLENBQWdCLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDMUssTUFBTSxRQUFRLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ2xDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLHVCQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLHVCQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyx1QkFBYyxDQUFDLElBQUksQ0FBQzt3QkFDekYsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLFFBQVEsSUFBSSx1QkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xELE1BQU0sVUFBVSxHQUFXO3dCQUMxQixVQUFVLEVBQUUsTUFBTSxDQUFDLGdCQUFnQjt3QkFDbkMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0I7d0JBQ25DLFNBQVMsRUFBRSxNQUFNLENBQUMsZUFBZTt3QkFDakMsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLElBQUksZ0JBQWdCLENBQUMsSUFBSTt3QkFDaEQsU0FBUyxFQUFFLElBQUk7d0JBQ2YsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZO3dCQUNqQyxRQUFRO3dCQUNSLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUM7d0JBQ2xFLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxNQUFNO3dCQUN6QyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsaUJBQWlCO3dCQUN0QyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsR0FBRzt3QkFDM0IsTUFBTSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sSUFBSSx3QkFBZ0I7d0JBQ25ELE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTztxQkFDdkIsQ0FBQztvQkFDRixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQzVCLE1BQU0sSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUM1QixNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUN4RSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDckMsT0FBTyxNQUFNLENBQUM7Z0JBQ2YsQ0FBQztnQkFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxJQUFJLENBQUMsaUNBQWlDLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzdGLENBQUM7WUFFRCxPQUFPLGFBQWEsQ0FBQztRQUN0QixDQUFDO1FBRU8sa0NBQWtDLENBQUMsR0FBVyxFQUFFLGdCQUFrQztZQUN6RixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM1SyxJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNULE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUM7Z0JBQ2xDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hCLElBQUksV0FBVyxFQUFFLENBQUM7b0JBQ2pCLGdCQUFnQixDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsSUFBSSxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQztvQkFDbEUsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDO29CQUN2SyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO2dCQUNyRCxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sZ0JBQWdCLENBQUM7UUFDekIsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxjQUFzQixFQUFFLGdCQUFrQyxFQUFFLFVBQWtDO1lBQzdJLE1BQU0sT0FBTyxHQUFHLFVBQVUsRUFBRSxLQUFLLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDO1lBQzNELElBQUsscUJBSUo7WUFKRCxXQUFLLHFCQUFxQjtnQkFDekIsaUVBQVEsQ0FBQTtnQkFDUixpRUFBUSxDQUFBO2dCQUNSLHFFQUFVLENBQUE7WUFDWCxDQUFDLEVBSkkscUJBQXFCLEtBQXJCLHFCQUFxQixRQUl6QjtZQUNELElBQUksWUFBWSxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQztZQUM5QyxJQUFJLE9BQU8sS0FBSyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDO2dCQUM5QixZQUFZLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDO1lBQzNDLENBQUM7WUFDRCx1RUFBdUU7WUFDdkUsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxLQUFLLHVCQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLEtBQUssY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZJLGdCQUFnQixDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFDO2dCQUNoRCxZQUFZLEdBQUcscUJBQXFCLENBQUMsTUFBTSxDQUFDO1lBQzdDLENBQUM7WUFDRCx5QkFBeUI7WUFDekIsSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxLQUFLLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ3ZGLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLENBQUM7WUFDN0MsQ0FBQztZQUNELFFBQVEsWUFBWSxFQUFFLENBQUM7Z0JBQ3RCLEtBQUsscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDakMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztvQkFDM0IsTUFBTTtnQkFDUCxDQUFDO2dCQUNELEtBQUsscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztvQkFDbkMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDL0YsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNwRCxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8scUNBQXFDLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5SCxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLElBQVk7WUFDbEQsTUFBTSxpQkFBaUIsR0FBRyxxQ0FBcUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1RixNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BDLElBQUksaUJBQWlCLEVBQUUsQ0FBQztnQkFDdkIsaUJBQWlCLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDOUIsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3RDLE9BQU87WUFDUixDQUFDO2lCQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFDcEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2QyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBWSxFQUFFLElBQVksRUFBRSxNQUF5QjtZQUNoRSxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBQzNDLElBQUksQ0FBQyxNQUFNLEtBQUssaUJBQWlCLENBQUMsY0FBYyxDQUFDLElBQUksU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25ILElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO29CQUNyQyxLQUFLLEVBQUUsU0FBUyxDQUFDLFNBQVM7b0JBQzFCLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSTtvQkFDcEIsT0FBTyxFQUFFLFNBQVMsQ0FBQyxPQUFPO2lCQUMxQixDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLElBQVk7WUFDakMsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUM7UUFDMUUsQ0FBQztRQUVELElBQVcscUJBQXFCO1lBQy9CLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDO1FBQ3BDLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxPQUF3QztZQUM3RCxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNiLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQzlCLE1BQU0saUJBQWlCLEdBQUcscUNBQXFDLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3JKLE1BQU0sWUFBWSxHQUFHLE9BQU8sTUFBTSxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO29CQUNySixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDcEYsVUFBVSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSTt3QkFDckMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSTt3QkFDckMsWUFBWSxFQUFFLFlBQVk7d0JBQzFCLFFBQVEsRUFBRSx1QkFBYyxDQUFDLElBQUk7d0JBQzdCLFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQzt3QkFDekMsU0FBUyxFQUFFLEtBQUs7d0JBQ2hCLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxNQUFNO3dCQUN6QyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsaUJBQWlCO3dCQUN0QyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsR0FBRzt3QkFDM0IsT0FBTyxFQUFFLHdCQUFlLENBQUMsZUFBZTt3QkFDeEMsTUFBTSxFQUFFOzRCQUNQLE1BQU0sRUFBRSxZQUFZLENBQUMsU0FBUzs0QkFDOUIsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsNEJBQTRCLEVBQUUsc0JBQXNCLENBQUM7eUJBQy9FO3FCQUNELENBQUMsQ0FBQztvQkFDSCxJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSx3QkFBZSxDQUFDLGVBQWUsRUFBRSx1QkFBYyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuSyxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7WUFDbkMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUVELGtCQUFrQixDQUFDLE1BQStFO1lBQ2pHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUM7UUFDaEMsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBMkI7WUFDOUMsSUFBSSxtQkFBbUIsR0FBRyxVQUFVLENBQUM7WUFDckMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDM0IscUhBQXFIO2dCQUNySCwwRUFBMEU7Z0JBQzFFLG1CQUFtQixHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFDRCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLG9EQUFvRCxLQUFLLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDaEssSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFRCw2QkFBNkI7UUFDckIsNEJBQTRCLENBQUMsVUFBMkI7WUFDL0QsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7WUFDeEQsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLGFBQWEsQ0FBQztZQUNqQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMxQixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3ZELGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFO29CQUM3QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7b0JBQ2hCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtvQkFDaEIsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO29CQUNwQixHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUc7aUJBQ2QsQ0FBQyxDQUFDO2dCQUNILElBQUksaUJBQWlCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztnQkFDRCxNQUFNLGNBQWMsR0FBRyxxQ0FBcUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNyRyxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUNwQixjQUFjLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7b0JBQzdDLGNBQWMsQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7b0JBQ3hDLGNBQWMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztnQkFDaEMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFO2dCQUN6QyxNQUFNLGFBQWEsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztvQkFDcEIsT0FBTztnQkFDUixDQUFDO2dCQUNELE1BQU0sY0FBYyxHQUFHLHFDQUFxQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JILElBQUksY0FBYyxFQUFFLENBQUM7b0JBQ3BCLGNBQWMsQ0FBQyxjQUFjLEdBQUcsU0FBUyxDQUFDO29CQUMxQyxjQUFjLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO29CQUN6QyxjQUFjLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQztnQkFDaEMsQ0FBQztnQkFDRCxNQUFNLGFBQWEsR0FBRyxxQ0FBcUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuSCxJQUFJLGFBQWEsRUFBRSxDQUFDO29CQUNuQixhQUFhLENBQUMsY0FBYyxHQUFHLFNBQVMsQ0FBQztvQkFDekMsYUFBYSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztvQkFDeEMsYUFBYSxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8saUJBQWlCLENBQUM7UUFDMUIsQ0FBQztRQUVELElBQUksVUFBVTtZQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUN0RSxDQUFDO1FBRUQsSUFBSSxxQkFBcUI7WUFDeEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdkQsQ0FBQztRQUVPLEtBQUssQ0FBQyxnQkFBZ0I7WUFDN0IsK0RBQStEO1lBQy9ELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNuRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUM3RCxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNYLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFDRCxLQUFLLE1BQU0sU0FBUyxJQUFJLE9BQU8sRUFBRSxDQUFDO2dCQUNqQyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxLQUFLLHVCQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLEtBQUssU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBQzdILE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQzt3QkFDcEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxVQUFVLEVBQUU7d0JBQ2xFLEtBQUssRUFBRSxTQUFTLENBQUMsU0FBUzt3QkFDMUIsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO3dCQUNwQixNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU07cUJBQ3hCLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ2hCLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNqQixTQUFTO2dCQUNWLENBQUM7Z0JBQ0QsSUFBSSxVQUFVLENBQUMsS0FBSyxJQUFJLFVBQVUsQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUM3RCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDL0UsQ0FBQztZQUVGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxjQUFnRCxFQUFFLGlCQUEwQixJQUFJO1lBQ25HLE1BQU0sa0JBQWtCLEdBQStCLElBQUksR0FBRyxFQUFFLENBQUM7WUFDakUsTUFBTSxpQkFBaUIsR0FBc0MsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUN2RSxjQUFjLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUN0QyxNQUFNLGlCQUFpQixHQUFHLHFDQUFxQyxDQUFnQixJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksR0FBRyxFQUFFLEVBQUUsNEJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQWEsQ0FBQztnQkFDM0ssSUFBSSxpQkFBaUIsRUFBRSxDQUFDO29CQUN2QixrQkFBa0IsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO29CQUM5RCxNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ25GLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDakMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztvQkFDRCxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxnQkFBZ0IsR0FBNEIsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUM1RCxjQUFjLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUN0QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUN4SixJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDdEQsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDcEUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNuRSxDQUFDO1lBRUQsNENBQTRDO1lBQzVDLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUEsZ0JBQU8sRUFBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNoRyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQzFELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDM0IsTUFBTSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQy9ELE9BQU8sUUFBUSxDQUFDLHFCQUFxQixDQUFDLFNBQVMsRUFDOUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0UsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTCxNQUFNLGtCQUFrQixHQUF3QyxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzFFLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ3ZFLElBQUksU0FBUyxFQUFFLENBQUM7b0JBQ2Ysa0JBQWtCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ25ELENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLGdCQUFnQixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDOUMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUVELDBCQUEwQjtZQUMxQixNQUFNLGdCQUFnQixHQUE0QixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQzVELGNBQWMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUU7Z0JBQ3ZDLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3pELE1BQU0sUUFBUSxHQUFHLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdELGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFO29CQUN6QyxlQUFlLEVBQUUsTUFBTSxFQUFFLGVBQWU7b0JBQ3hDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSztvQkFDcEIsYUFBYSxFQUFFLE1BQU0sRUFBRSxhQUFhLElBQUksZUFBZSxDQUFDLHNCQUFzQixDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQztvQkFDM0csZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLGdCQUFnQjtvQkFDMUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRO2lCQUMxQixDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUVILE9BQU8sZ0JBQWdCLENBQUM7UUFDekIsQ0FBQztRQUVELHFCQUFxQixDQUFDLFFBQWdDO1lBQ3JELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0MsQ0FBQztLQUNELENBQUE7SUF0bkJZLGtDQUFXO0lBd09UO1FBRGIsSUFBQSxxQkFBUSxFQUFDLElBQUksQ0FBQztxREFnQ2Q7MEJBdlFXLFdBQVc7UUErQnJCLFdBQUEsdUJBQWMsQ0FBQTtRQUNkLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSxpREFBNEIsQ0FBQTtRQUM1QixXQUFBLHlEQUErQixDQUFBO1FBQy9CLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxpQkFBVyxDQUFBO1FBQ1gsV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLCtCQUFrQixDQUFBO09BeENSLFdBQVcsQ0FzbkJ2QiJ9