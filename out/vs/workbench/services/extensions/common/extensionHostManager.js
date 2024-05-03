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
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/extensions/common/extensionHostKind", "vs/workbench/services/extensions/common/rpcProtocol"], function (require, exports, async_1, buffer_1, errors, event_1, lifecycle_1, stopwatch_1, nls, actionCommonCategories_1, actions_1, instantiation_1, log_1, remoteAuthorityResolver_1, telemetry_1, editorService_1, environmentService_1, extHostCustomers_1, extensionHostKind_1, rpcProtocol_1) {
    "use strict";
    var ExtensionHostManager_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostManager = void 0;
    exports.friendlyExtHostName = friendlyExtHostName;
    // Enable to see detailed message communication between window and extension host
    const LOG_EXTENSION_HOST_COMMUNICATION = false;
    const LOG_USE_COLORS = true;
    let ExtensionHostManager = ExtensionHostManager_1 = class ExtensionHostManager extends lifecycle_1.Disposable {
        get pid() {
            return this._extensionHost.pid;
        }
        get kind() {
            return this._extensionHost.runningLocation.kind;
        }
        get startup() {
            return this._extensionHost.startup;
        }
        get friendyName() {
            return friendlyExtHostName(this.kind, this.pid);
        }
        constructor(extensionHost, initialActivationEvents, _internalExtensionService, _instantiationService, _environmentService, _telemetryService, _logService) {
            super();
            this._internalExtensionService = _internalExtensionService;
            this._instantiationService = _instantiationService;
            this._environmentService = _environmentService;
            this._telemetryService = _telemetryService;
            this._logService = _logService;
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._hasStarted = false;
            this._cachedActivationEvents = new Map();
            this._resolvedActivationEvents = new Set();
            this._rpcProtocol = null;
            this._customers = [];
            this._extensionHost = extensionHost;
            this.onDidExit = this._extensionHost.onExit;
            const startingTelemetryEvent = {
                time: Date.now(),
                action: 'starting',
                kind: (0, extensionHostKind_1.extensionHostKindToString)(this.kind)
            };
            this._telemetryService.publicLog2('extensionHostStartup', startingTelemetryEvent);
            this._proxy = this._extensionHost.start().then((protocol) => {
                this._hasStarted = true;
                // Track healthy extension host startup
                const successTelemetryEvent = {
                    time: Date.now(),
                    action: 'success',
                    kind: (0, extensionHostKind_1.extensionHostKindToString)(this.kind)
                };
                this._telemetryService.publicLog2('extensionHostStartup', successTelemetryEvent);
                return this._createExtensionHostCustomers(this.kind, protocol);
            }, (err) => {
                this._logService.error(`Error received from starting extension host (kind: ${(0, extensionHostKind_1.extensionHostKindToString)(this.kind)})`);
                this._logService.error(err);
                // Track errors during extension host startup
                const failureTelemetryEvent = {
                    time: Date.now(),
                    action: 'error',
                    kind: (0, extensionHostKind_1.extensionHostKindToString)(this.kind)
                };
                if (err && err.name) {
                    failureTelemetryEvent.errorName = err.name;
                }
                if (err && err.message) {
                    failureTelemetryEvent.errorMessage = err.message;
                }
                if (err && err.stack) {
                    failureTelemetryEvent.errorStack = err.stack;
                }
                this._telemetryService.publicLog2('extensionHostStartup', failureTelemetryEvent);
                return null;
            });
            this._proxy.then(() => {
                initialActivationEvents.forEach((activationEvent) => this.activateByEvent(activationEvent, 0 /* ActivationKind.Normal */));
                this._register(registerLatencyTestProvider({
                    measure: () => this.measure()
                }));
            });
        }
        dispose() {
            if (this._extensionHost) {
                this._extensionHost.dispose();
            }
            if (this._rpcProtocol) {
                this._rpcProtocol.dispose();
            }
            for (let i = 0, len = this._customers.length; i < len; i++) {
                const customer = this._customers[i];
                try {
                    customer.dispose();
                }
                catch (err) {
                    errors.onUnexpectedError(err);
                }
            }
            this._proxy = null;
            super.dispose();
        }
        async measure() {
            const proxy = await this._proxy;
            if (!proxy) {
                return null;
            }
            const latency = await this._measureLatency(proxy);
            const down = await this._measureDown(proxy);
            const up = await this._measureUp(proxy);
            return {
                remoteAuthority: this._extensionHost.remoteAuthority,
                latency,
                down,
                up
            };
        }
        async ready() {
            await this._proxy;
        }
        async _measureLatency(proxy) {
            const COUNT = 10;
            let sum = 0;
            for (let i = 0; i < COUNT; i++) {
                const sw = stopwatch_1.StopWatch.create();
                await proxy.test_latency(i);
                sw.stop();
                sum += sw.elapsed();
            }
            return (sum / COUNT);
        }
        static _convert(byteCount, elapsedMillis) {
            return (byteCount * 1000 * 8) / elapsedMillis;
        }
        async _measureUp(proxy) {
            const SIZE = 10 * 1024 * 1024; // 10MB
            const buff = buffer_1.VSBuffer.alloc(SIZE);
            const value = Math.ceil(Math.random() * 256);
            for (let i = 0; i < buff.byteLength; i++) {
                buff.writeUInt8(i, value);
            }
            const sw = stopwatch_1.StopWatch.create();
            await proxy.test_up(buff);
            sw.stop();
            return ExtensionHostManager_1._convert(SIZE, sw.elapsed());
        }
        async _measureDown(proxy) {
            const SIZE = 10 * 1024 * 1024; // 10MB
            const sw = stopwatch_1.StopWatch.create();
            await proxy.test_down(SIZE);
            sw.stop();
            return ExtensionHostManager_1._convert(SIZE, sw.elapsed());
        }
        _createExtensionHostCustomers(kind, protocol) {
            let logger = null;
            if (LOG_EXTENSION_HOST_COMMUNICATION || this._environmentService.logExtensionHostCommunication) {
                logger = new RPCLogger(kind);
            }
            else if (TelemetryRPCLogger.isEnabled()) {
                logger = new TelemetryRPCLogger(this._telemetryService);
            }
            this._rpcProtocol = new rpcProtocol_1.RPCProtocol(protocol, logger);
            this._register(this._rpcProtocol.onDidChangeResponsiveState((responsiveState) => this._onDidChangeResponsiveState.fire(responsiveState)));
            let extensionHostProxy = null;
            let mainProxyIdentifiers = [];
            const extHostContext = {
                remoteAuthority: this._extensionHost.remoteAuthority,
                extensionHostKind: this.kind,
                getProxy: (identifier) => this._rpcProtocol.getProxy(identifier),
                set: (identifier, instance) => this._rpcProtocol.set(identifier, instance),
                dispose: () => this._rpcProtocol.dispose(),
                assertRegistered: (identifiers) => this._rpcProtocol.assertRegistered(identifiers),
                drain: () => this._rpcProtocol.drain(),
                //#region internal
                internalExtensionService: this._internalExtensionService,
                _setExtensionHostProxy: (value) => {
                    extensionHostProxy = value;
                },
                _setAllMainProxyIdentifiers: (value) => {
                    mainProxyIdentifiers = value;
                },
                //#endregion
            };
            // Named customers
            const namedCustomers = extHostCustomers_1.ExtHostCustomersRegistry.getNamedCustomers();
            for (let i = 0, len = namedCustomers.length; i < len; i++) {
                const [id, ctor] = namedCustomers[i];
                try {
                    const instance = this._instantiationService.createInstance(ctor, extHostContext);
                    this._customers.push(instance);
                    this._rpcProtocol.set(id, instance);
                }
                catch (err) {
                    this._logService.error(`Cannot instantiate named customer: '${id.sid}'`);
                    this._logService.error(err);
                    errors.onUnexpectedError(err);
                }
            }
            // Customers
            const customers = extHostCustomers_1.ExtHostCustomersRegistry.getCustomers();
            for (const ctor of customers) {
                try {
                    const instance = this._instantiationService.createInstance(ctor, extHostContext);
                    this._customers.push(instance);
                }
                catch (err) {
                    this._logService.error(err);
                    errors.onUnexpectedError(err);
                }
            }
            if (!extensionHostProxy) {
                throw new Error(`Missing IExtensionHostProxy!`);
            }
            // Check that no named customers are missing
            this._rpcProtocol.assertRegistered(mainProxyIdentifiers);
            return extensionHostProxy;
        }
        async activate(extension, reason) {
            const proxy = await this._proxy;
            if (!proxy) {
                return false;
            }
            return proxy.activate(extension, reason);
        }
        activateByEvent(activationEvent, activationKind) {
            if (activationKind === 1 /* ActivationKind.Immediate */ && !this._hasStarted) {
                return Promise.resolve();
            }
            if (!this._cachedActivationEvents.has(activationEvent)) {
                this._cachedActivationEvents.set(activationEvent, this._activateByEvent(activationEvent, activationKind));
            }
            return this._cachedActivationEvents.get(activationEvent);
        }
        activationEventIsDone(activationEvent) {
            return this._resolvedActivationEvents.has(activationEvent);
        }
        async _activateByEvent(activationEvent, activationKind) {
            if (!this._proxy) {
                return;
            }
            const proxy = await this._proxy;
            if (!proxy) {
                // this case is already covered above and logged.
                // i.e. the extension host could not be started
                return;
            }
            if (!this._extensionHost.extensions.containsActivationEvent(activationEvent)) {
                this._resolvedActivationEvents.add(activationEvent);
                return;
            }
            await proxy.activateByEvent(activationEvent, activationKind);
            this._resolvedActivationEvents.add(activationEvent);
        }
        async getInspectPort(tryEnableInspector) {
            if (this._extensionHost) {
                if (tryEnableInspector) {
                    await this._extensionHost.enableInspectPort();
                }
                const port = this._extensionHost.getInspectPort();
                if (port) {
                    return port;
                }
            }
            return 0;
        }
        async resolveAuthority(remoteAuthority, resolveAttempt) {
            const sw = stopwatch_1.StopWatch.create(false);
            const prefix = () => `[${(0, extensionHostKind_1.extensionHostKindToString)(this._extensionHost.runningLocation.kind)}${this._extensionHost.runningLocation.affinity}][resolveAuthority(${(0, remoteAuthorityResolver_1.getRemoteAuthorityPrefix)(remoteAuthority)},${resolveAttempt})][${sw.elapsed()}ms] `;
            const logInfo = (msg) => this._logService.info(`${prefix()}${msg}`);
            const logError = (msg, err = undefined) => this._logService.error(`${prefix()}${msg}`, err);
            logInfo(`obtaining proxy...`);
            const proxy = await this._proxy;
            if (!proxy) {
                logError(`no proxy`);
                return {
                    type: 'error',
                    error: {
                        message: `Cannot resolve authority`,
                        code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown,
                        detail: undefined
                    }
                };
            }
            logInfo(`invoking...`);
            const intervalLogger = new async_1.IntervalTimer();
            try {
                intervalLogger.cancelAndSet(() => logInfo('waiting...'), 1000);
                const resolverResult = await proxy.resolveAuthority(remoteAuthority, resolveAttempt);
                intervalLogger.dispose();
                if (resolverResult.type === 'ok') {
                    logInfo(`returned ${resolverResult.value.authority.connectTo}`);
                }
                else {
                    logError(`returned an error`, resolverResult.error);
                }
                return resolverResult;
            }
            catch (err) {
                intervalLogger.dispose();
                logError(`returned an error`, err);
                return {
                    type: 'error',
                    error: {
                        message: err.message,
                        code: remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown,
                        detail: err
                    }
                };
            }
        }
        async getCanonicalURI(remoteAuthority, uri) {
            const proxy = await this._proxy;
            if (!proxy) {
                throw new Error(`Cannot resolve canonical URI`);
            }
            return proxy.getCanonicalURI(remoteAuthority, uri);
        }
        async start(extensionRegistryVersionId, allExtensions, myExtensions) {
            const proxy = await this._proxy;
            if (!proxy) {
                return;
            }
            const deltaExtensions = this._extensionHost.extensions.set(extensionRegistryVersionId, allExtensions, myExtensions);
            return proxy.startExtensionHost(deltaExtensions);
        }
        async extensionTestsExecute() {
            const proxy = await this._proxy;
            if (!proxy) {
                throw new Error('Could not obtain Extension Host Proxy');
            }
            return proxy.extensionTestsExecute();
        }
        representsRunningLocation(runningLocation) {
            return this._extensionHost.runningLocation.equals(runningLocation);
        }
        async deltaExtensions(incomingExtensionsDelta) {
            const proxy = await this._proxy;
            if (!proxy) {
                return;
            }
            const outgoingExtensionsDelta = this._extensionHost.extensions.delta(incomingExtensionsDelta);
            if (!outgoingExtensionsDelta) {
                // The extension host already has this version of the extensions.
                return;
            }
            return proxy.deltaExtensions(outgoingExtensionsDelta);
        }
        containsExtension(extensionId) {
            return this._extensionHost.extensions?.containsExtension(extensionId) ?? false;
        }
        async setRemoteEnvironment(env) {
            const proxy = await this._proxy;
            if (!proxy) {
                return;
            }
            return proxy.setRemoteEnvironment(env);
        }
    };
    exports.ExtensionHostManager = ExtensionHostManager;
    exports.ExtensionHostManager = ExtensionHostManager = ExtensionHostManager_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, log_1.ILogService)
    ], ExtensionHostManager);
    function friendlyExtHostName(kind, pid) {
        if (pid) {
            return `${(0, extensionHostKind_1.extensionHostKindToString)(kind)} pid: ${pid}`;
        }
        return `${(0, extensionHostKind_1.extensionHostKindToString)(kind)}`;
    }
    const colorTables = [
        ['#2977B1', '#FC802D', '#34A13A', '#D3282F', '#9366BA'],
        ['#8B564C', '#E177C0', '#7F7F7F', '#BBBE3D', '#2EBECD']
    ];
    function prettyWithoutArrays(data) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data && typeof data === 'object' && typeof data.toString === 'function') {
            const result = data.toString();
            if (result !== '[object Object]') {
                return result;
            }
        }
        return data;
    }
    function pretty(data) {
        if (Array.isArray(data)) {
            return data.map(prettyWithoutArrays);
        }
        return prettyWithoutArrays(data);
    }
    class RPCLogger {
        constructor(_kind) {
            this._kind = _kind;
            this._totalIncoming = 0;
            this._totalOutgoing = 0;
        }
        _log(direction, totalLength, msgLength, req, initiator, str, data) {
            data = pretty(data);
            const colorTable = colorTables[initiator];
            const color = LOG_USE_COLORS ? colorTable[req % colorTable.length] : '#000000';
            let args = [`%c[${(0, extensionHostKind_1.extensionHostKindToString)(this._kind)}][${direction}]%c[${String(totalLength).padStart(7)}]%c[len: ${String(msgLength).padStart(5)}]%c${String(req).padStart(5)} - ${str}`, 'color: darkgreen', 'color: grey', 'color: grey', `color: ${color}`];
            if (/\($/.test(str)) {
                args = args.concat(data);
                args.push(')');
            }
            else {
                args.push(data);
            }
            console.log.apply(console, args);
        }
        logIncoming(msgLength, req, initiator, str, data) {
            this._totalIncoming += msgLength;
            this._log('Ext \u2192 Win', this._totalIncoming, msgLength, req, initiator, str, data);
        }
        logOutgoing(msgLength, req, initiator, str, data) {
            this._totalOutgoing += msgLength;
            this._log('Win \u2192 Ext', this._totalOutgoing, msgLength, req, initiator, str, data);
        }
    }
    let TelemetryRPCLogger = class TelemetryRPCLogger {
        static isEnabled() {
            // this will be a very high frequency event, so we only log a small percentage of them
            return Math.trunc(Math.random() * 1000) < 0.5;
        }
        constructor(_telemetryService) {
            this._telemetryService = _telemetryService;
            this._pendingRequests = new Map();
        }
        logIncoming(msgLength, req, initiator, str) {
            if (initiator === 0 /* RequestInitiator.LocalSide */ && /^receiveReply(Err)?:/.test(str)) {
                // log the size of reply messages
                const requestStr = this._pendingRequests.get(req) ?? 'unknown_reply';
                this._pendingRequests.delete(req);
                this._telemetryService.publicLog2('extensionhost.incoming', {
                    type: `${str} ${requestStr}`,
                    length: msgLength
                });
            }
            if (initiator === 1 /* RequestInitiator.OtherSide */ && /^receiveRequest /.test(str)) {
                // incoming request
                this._telemetryService.publicLog2('extensionhost.incoming', {
                    type: `${str}`,
                    length: msgLength
                });
            }
        }
        logOutgoing(msgLength, req, initiator, str) {
            if (initiator === 0 /* RequestInitiator.LocalSide */ && str.startsWith('request: ')) {
                this._pendingRequests.set(req, str);
                this._telemetryService.publicLog2('extensionhost.outgoing', {
                    type: str,
                    length: msgLength
                });
            }
        }
    };
    TelemetryRPCLogger = __decorate([
        __param(0, telemetry_1.ITelemetryService)
    ], TelemetryRPCLogger);
    const providers = [];
    function registerLatencyTestProvider(provider) {
        providers.push(provider);
        return {
            dispose: () => {
                for (let i = 0; i < providers.length; i++) {
                    if (providers[i] === provider) {
                        providers.splice(i, 1);
                        return;
                    }
                }
            }
        };
    }
    function getLatencyTestProviders() {
        return providers.slice(0);
    }
    (0, actions_1.registerAction2)(class MeasureExtHostLatencyAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'editor.action.measureExtHostLatency',
                title: nls.localize2('measureExtHostLatency', "Measure Extension Host Latency"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const measurements = await Promise.all(getLatencyTestProviders().map(provider => provider.measure()));
            editorService.openEditor({ resource: undefined, contents: measurements.map(MeasureExtHostLatencyAction._print).join('\n\n'), options: { pinned: true } });
        }
        static _print(m) {
            if (!m) {
                return '';
            }
            return `${m.remoteAuthority ? `Authority: ${m.remoteAuthority}\n` : ``}Roundtrip latency: ${m.latency.toFixed(3)}ms\nUp: ${MeasureExtHostLatencyAction._printSpeed(m.up)}\nDown: ${MeasureExtHostLatencyAction._printSpeed(m.down)}\n`;
        }
        static _printSpeed(n) {
            if (n <= 1024) {
                return `${n} bps`;
            }
            if (n < 1024 * 1024) {
                return `${(n / 1024).toFixed(1)} kbps`;
            }
            return `${(n / 1024 / 1024).toFixed(1)} Mbps`;
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uSG9zdE1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9leHRlbnNpb25zL2NvbW1vbi9leHRlbnNpb25Ib3N0TWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbWRoRyxrREFLQztJQTFiRCxpRkFBaUY7SUFDakYsTUFBTSxnQ0FBZ0MsR0FBRyxLQUFLLENBQUM7SUFDL0MsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO0lBc0JyQixJQUFNLG9CQUFvQiw0QkFBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBVTtRQWtCbkQsSUFBVyxHQUFHO1lBQ2IsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQztRQUNoQyxDQUFDO1FBRUQsSUFBVyxJQUFJO1lBQ2QsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUM7UUFDakQsQ0FBQztRQUVELElBQVcsT0FBTztZQUNqQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFXLFdBQVc7WUFDckIsT0FBTyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsWUFDQyxhQUE2QixFQUM3Qix1QkFBaUMsRUFDaEIseUJBQW9ELEVBQzlDLHFCQUE2RCxFQUN0RCxtQkFBa0UsRUFDN0UsaUJBQXFELEVBQzNELFdBQXlDO1lBRXRELEtBQUssRUFBRSxDQUFDO1lBTlMsOEJBQXlCLEdBQXpCLHlCQUF5QixDQUEyQjtZQUM3QiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3JDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBOEI7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