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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/contrib/debug/common/debug", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/severity", "vs/workbench/contrib/debug/common/abstractDebugAdapter", "vs/workbench/contrib/debug/common/debugUtils", "vs/base/common/errors", "vs/workbench/contrib/debug/common/debugVisualizers", "vs/platform/extensions/common/extensions", "vs/base/common/event"], function (require, exports, lifecycle_1, uri_1, debug_1, extHost_protocol_1, extHostCustomers_1, severity_1, abstractDebugAdapter_1, debugUtils_1, errors_1, debugVisualizers_1, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDebugService = void 0;
    let MainThreadDebugService = class MainThreadDebugService {
        constructor(extHostContext, debugService, visualizerService) {
            this.debugService = debugService;
            this.visualizerService = visualizerService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._debugAdaptersHandleCounter = 1;
            this._visualizerHandles = new Map();
            this._visualizerTreeHandles = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDebugService);
            const sessionListeners = new lifecycle_1.DisposableMap();
            this._toDispose.add(sessionListeners);
            this._toDispose.add(debugService.onDidNewSession(session => {
                this._proxy.$acceptDebugSessionStarted(this.getSessionDto(session));
                const store = sessionListeners.get(session);
                store.add(session.onDidChangeName(name => {
                    this._proxy.$acceptDebugSessionNameChanged(this.getSessionDto(session), name);
                }));
            }));
            // Need to start listening early to new session events because a custom event can come while a session is initialising
            this._toDispose.add(debugService.onWillNewSession(session => {
                let store = sessionListeners.get(session);
                if (!store) {
                    store = new lifecycle_1.DisposableStore();
                    sessionListeners.set(session, store);
                }
                store.add(session.onDidCustomEvent(event => this._proxy.$acceptDebugSessionCustomEvent(this.getSessionDto(session), event)));
            }));
            this._toDispose.add(debugService.onDidEndSession(({ session, restart }) => {
                this._proxy.$acceptDebugSessionTerminated(this.getSessionDto(session));
                this._extHostKnownSessions.delete(session.getId());
                // keep the session listeners around since we still will get events after they restart
                if (!restart) {
                    sessionListeners.deleteAndDispose(session);
                }
                // any restarted session will create a new DA, so always throw the old one away.
                for (const [handle, value] of this._debugAdapters) {
                    if (value.session === session) {
                        this._debugAdapters.delete(handle);
                        // break;
                    }
                }
            }));
            this._toDispose.add(debugService.getViewModel().onDidFocusSession(session => {
                this._proxy.$acceptDebugSessionActiveChanged(this.getSessionDto(session));
            }));
            this._toDispose.add((0, lifecycle_1.toDisposable)(() => {
                for (const [handle, da] of this._debugAdapters) {
                    da.fireError(handle, new Error('Extension host shut down'));
                }
            }));
            this._debugAdapters = new Map();
            this._debugConfigurationProviders = new Map();
            this._debugAdapterDescriptorFactories = new Map();
            this._extHostKnownSessions = new Set();
            const viewModel = this.debugService.getViewModel();
            this._toDispose.add(event_1.Event.any(viewModel.onDidFocusStackFrame, viewModel.onDidFocusThread)(() => {
                const stackFrame = viewModel.focusedStackFrame;
                const thread = viewModel.focusedThread;
                if (stackFrame) {
                    this._proxy.$acceptStackFrameFocus({
                        kind: 'stackFrame',
                        threadId: stackFrame.thread.threadId,
                        frameId: stackFrame.frameId,
                        sessionId: stackFrame.thread.session.getId(),
                    });
                }
                else if (thread) {
                    this._proxy.$acceptStackFrameFocus({
                        kind: 'thread',
                        threadId: thread.threadId,
                        sessionId: thread.session.getId(),
                    });
                }
                else {
                    this._proxy.$acceptStackFrameFocus(undefined);
                }
            }));
            this.sendBreakpointsAndListen();
        }
        $registerDebugVisualizerTree(treeId, canEdit) {
            this.visualizerService.registerTree(treeId, {
                disposeItem: id => this._proxy.$disposeVisualizedTree(id),
                getChildren: e => this._proxy.$getVisualizerTreeItemChildren(treeId, e),
                getTreeItem: e => this._proxy.$getVisualizerTreeItem(treeId, e),
                editItem: canEdit ? ((e, v) => this._proxy.$editVisualizerTreeItem(e, v)) : undefined
            });
        }
        $unregisterDebugVisualizerTree(treeId) {
            this._visualizerTreeHandles.get(treeId)?.dispose();
            this._visualizerTreeHandles.delete(treeId);
        }
        $registerDebugVisualizer(extensionId, id) {
            const handle = this.visualizerService.register({
                extensionId: new extensions_1.ExtensionIdentifier(extensionId),
                id,
                disposeDebugVisualizers: ids => this._proxy.$disposeDebugVisualizers(ids),
                executeDebugVisualizerCommand: id => this._proxy.$executeDebugVisualizerCommand(id),
                provideDebugVisualizers: (context, token) => this._proxy.$provideDebugVisualizers(extensionId, id, context, token).then(r => r.map(debug_1.IDebugVisualization.deserialize)),
                resolveDebugVisualizer: (viz, token) => this._proxy.$resolveDebugVisualizer(viz.id, token),
            });
            this._visualizerHandles.set(`${extensionId}/${id}`, handle);
        }
        $unregisterDebugVisualizer(extensionId, id) {
            const key = `${extensionId}/${id}`;
            this._visualizerHandles.get(key)?.dispose();
            this._visualizerHandles.delete(key);
        }
        sendBreakpointsAndListen() {
            // set up a handler to send more
            this._toDispose.add(this.debugService.getModel().onDidChangeBreakpoints(e => {
                // Ignore session only breakpoint events since they should only reflect in the UI
                if (e && !e.sessionOnly) {
                    const delta = {};
                    if (e.added) {
                        delta.added = this.convertToDto(e.added);
                    }
                    if (e.removed) {
                        delta.removed = e.removed.map(x => x.getId());
                    }
                    if (e.changed) {
                        delta.changed = this.convertToDto(e.changed);
                    }
                    if (delta.added || delta.removed || delta.changed) {
                        this._proxy.$acceptBreakpointsDelta(delta);
                    }
                }
            }));
            // send all breakpoints
            const bps = this.debugService.getModel().getBreakpoints();
            const fbps = this.debugService.getModel().getFunctionBreakpoints();
            const dbps = this.debugService.getModel().getDataBreakpoints();
            if (bps.length > 0 || fbps.length > 0) {
                this._proxy.$acceptBreakpointsDelta({
                    added: this.convertToDto(bps).concat(this.convertToDto(fbps)).concat(this.convertToDto(dbps))
                });
            }
        }
        dispose() {
            this._toDispose.dispose();
        }
        // interface IDebugAdapterProvider
        createDebugAdapter(session) {
            const handle = this._debugAdaptersHandleCounter++;
            const da = new ExtensionHostDebugAdapter(this, handle, this._proxy, session);
            this._debugAdapters.set(handle, da);
            return da;
        }
        substituteVariables(folder, config) {
            return Promise.resolve(this._proxy.$substituteVariables(folder ? folder.uri : undefined, config));
        }
        runInTerminal(args, sessionId) {
            return this._proxy.$runInTerminal(args, sessionId);
        }
        // RPC methods (MainThreadDebugServiceShape)
        $registerDebugTypes(debugTypes) {
            this._toDispose.add(this.debugService.getAdapterManager().registerDebugAdapterFactory(debugTypes, this));
        }
        $registerBreakpoints(DTOs) {
            for (const dto of DTOs) {
                if (dto.type === 'sourceMulti') {
                    const rawbps = dto.lines.map(l => ({
                        id: l.id,
                        enabled: l.enabled,
                        lineNumber: l.line + 1,
                        column: l.character > 0 ? l.character + 1 : undefined, // a column value of 0 results in an omitted column attribute; see #46784
                        condition: l.condition,
                        hitCondition: l.hitCondition,
                        logMessage: l.logMessage,
                        mode: l.mode,
                    }));
                    this.debugService.addBreakpoints(uri_1.URI.revive(dto.uri), rawbps);
                }
                else if (dto.type === 'function') {
                    this.debugService.addFunctionBreakpoint(dto.functionName, dto.id, dto.mode);
                }
                else if (dto.type === 'data') {
                    this.debugService.addDataBreakpoint({
                        description: dto.label,
                        src: { type: 0 /* DataBreakpointSetType.Variable */, dataId: dto.dataId },
                        canPersist: dto.canPersist,
                        accessTypes: dto.accessTypes,
                        accessType: dto.accessType,
                        mode: dto.mode
                    });
                }
            }
            return Promise.resolve();
        }
        $unregisterBreakpoints(breakpointIds, functionBreakpointIds, dataBreakpointIds) {
            breakpointIds.forEach(id => this.debugService.removeBreakpoints(id));
            functionBreakpointIds.forEach(id => this.debugService.removeFunctionBreakpoints(id));
            dataBreakpointIds.forEach(id => this.debugService.removeDataBreakpoints(id));
            return Promise.resolve();
        }
        $registerDebugConfigurationProvider(debugType, providerTriggerKind, hasProvide, hasResolve, hasResolve2, handle) {
            const provider = {
                type: debugType,
                triggerKind: providerTriggerKind
            };
            if (hasProvide) {
                provider.provideDebugConfigurations = (folder, token) => {
                    return this._proxy.$provideDebugConfigurations(handle, folder, token);
                };
            }
            if (hasResolve) {
                provider.resolveDebugConfiguration = (folder, config, token) => {
                    return this._proxy.$resolveDebugConfiguration(handle, folder, config, token);
                };
            }
            if (hasResolve2) {
                provider.resolveDebugConfigurationWithSubstitutedVariables = (folder, config, token) => {
                    return this._proxy.$resolveDebugConfigurationWithSubstitutedVariables(handle, folder, config, token);
                };
            }
            this._debugConfigurationProviders.set(handle, provider);
            this._toDispose.add(this.debugService.getConfigurationManager().registerDebugConfigurationProvider(provider));
            return Promise.resolve(undefined);
        }
        $unregisterDebugConfigurationProvider(handle) {
            const provider = this._debugConfigurationProviders.get(handle);
            if (provider) {
                this._debugConfigurationProviders.delete(handle);
                this.debugService.getConfigurationManager().unregisterDebugConfigurationProvider(provider);
            }
        }
        $registerDebugAdapterDescriptorFactory(debugType, handle) {
            const provider = {
                type: debugType,
                createDebugAdapterDescriptor: session => {
                    return Promise.resolve(this._proxy.$provideDebugAdapter(handle, this.getSessionDto(session)));
                }
            };
            this._debugAdapterDescriptorFactories.set(handle, provider);
            this._toDispose.add(this.debugService.getAdapterManager().registerDebugAdapterDescriptorFactory(provider));
            return Promise.resolve(undefined);
        }
        $unregisterDebugAdapterDescriptorFactory(handle) {
            const provider = this._debugAdapterDescriptorFactories.get(handle);
            if (provider) {
                this._debugAdapterDescriptorFactories.delete(handle);
                this.debugService.getAdapterManager().unregisterDebugAdapterDescriptorFactory(provider);
            }
        }
        getSession(sessionId) {
            if (sessionId) {
                return this.debugService.getModel().getSession(sessionId, true);
            }
            return undefined;
        }
        async $startDebugging(folder, nameOrConfig, options) {
            const folderUri = folder ? uri_1.URI.revive(folder) : undefined;
            const launch = this.debugService.getConfigurationManager().getLaunch(folderUri);
            const parentSession = this.getSession(options.parentSessionID);
            const saveBeforeStart = typeof options.suppressSaveBeforeStart === 'boolean' ? !options.suppressSaveBeforeStart : undefined;
            const debugOptions = {
                noDebug: options.noDebug,
                parentSession,
                lifecycleManagedByParent: options.lifecycleManagedByParent,
                repl: options.repl,
                compact: options.compact,
                compoundRoot: parentSession?.compoundRoot,
                saveBeforeRestart: saveBeforeStart,
                suppressDebugStatusbar: options.suppressDebugStatusbar,
                suppressDebugToolbar: options.suppressDebugToolbar,
                suppressDebugView: options.suppressDebugView,
            };
            try {
                return this.debugService.startDebugging(launch, nameOrConfig, debugOptions, saveBeforeStart);
            }
            catch (err) {
                throw new errors_1.ErrorNoTelemetry(err && err.message ? err.message : 'cannot start debugging');
            }
        }
        $setDebugSessionName(sessionId, name) {
            const session = this.debugService.getModel().getSession(sessionId);
            session?.setName(name);
        }
        $customDebugAdapterRequest(sessionId, request, args) {
            const session = this.debugService.getModel().getSession(sessionId, true);
            if (session) {
                return session.customRequest(request, args).then(response => {
                    if (response && response.success) {
                        return response.body;
                    }
                    else {
                        return Promise.reject(new errors_1.ErrorNoTelemetry(response ? response.message : 'custom request failed'));
                    }
                });
            }
            return Promise.reject(new errors_1.ErrorNoTelemetry('debug session not found'));
        }
        $getDebugProtocolBreakpoint(sessionId, breakpoinId) {
            const session = this.debugService.getModel().getSession(sessionId, true);
            if (session) {
                return Promise.resolve(session.getDebugProtocolBreakpoint(breakpoinId));
            }
            return Promise.reject(new errors_1.ErrorNoTelemetry('debug session not found'));
        }
        $stopDebugging(sessionId) {
            if (sessionId) {
                const session = this.debugService.getModel().getSession(sessionId, true);
                if (session) {
                    return this.debugService.stopSession(session, (0, debugUtils_1.isSessionAttach)(session));
                }
            }
            else { // stop all
                return this.debugService.stopSession(undefined);
            }
            return Promise.reject(new errors_1.ErrorNoTelemetry('debug session not found'));
        }
        $appendDebugConsole(value) {
            // Use warning as severity to get the orange color for messages coming from the debug extension
            const session = this.debugService.getViewModel().focusedSession;
            session?.appendToRepl({ output: value, sev: severity_1.default.Warning });
        }
        $acceptDAMessage(handle, message) {
            this.getDebugAdapter(handle).acceptMessage((0, debugUtils_1.convertToVSCPaths)(message, false));
        }
        $acceptDAError(handle, name, message, stack) {
            this.getDebugAdapter(handle).fireError(handle, new Error(`${name}: ${message}\n${stack}`));
        }
        $acceptDAExit(handle, code, signal) {
            this.getDebugAdapter(handle).fireExit(handle, code, signal);
        }
        getDebugAdapter(handle) {
            const adapter = this._debugAdapters.get(handle);
            if (!adapter) {
                throw new Error('Invalid debug adapter');
            }
            return adapter;
        }
        // dto helpers
        $sessionCached(sessionID) {
            // remember that the EH has cached the session and we do not have to send it again
            this._extHostKnownSessions.add(sessionID);
        }
        getSessionDto(session) {
            if (session) {
                const sessionID = session.getId();
                if (this._extHostKnownSessions.has(sessionID)) {
                    return sessionID;
                }
                else {
                    // this._sessions.add(sessionID); 	// #69534: see $sessionCached above
                    return {
                        id: sessionID,
                        type: session.configuration.type,
                        name: session.name,
                        folderUri: session.root ? session.root.uri : undefined,
                        configuration: session.configuration,
                        parent: session.parentSession?.getId(),
                    };
                }
            }
            return undefined;
        }
        convertToDto(bps) {
            return bps.map(bp => {
                if ('name' in bp) {
                    const fbp = bp;
                    return {
                        type: 'function',
                        id: fbp.getId(),
                        enabled: fbp.enabled,
                        condition: fbp.condition,
                        hitCondition: fbp.hitCondition,
                        logMessage: fbp.logMessage,
                        functionName: fbp.name
                    };
                }
                else if ('src' in bp) {
                    const dbp = bp;
                    return {
                        type: 'data',
                        id: dbp.getId(),
                        dataId: dbp.src.type === 0 /* DataBreakpointSetType.Variable */ ? dbp.src.dataId : dbp.src.address,
                        enabled: dbp.enabled,
                        condition: dbp.condition,
                        hitCondition: dbp.hitCondition,
                        logMessage: dbp.logMessage,
                        accessType: dbp.accessType,
                        label: dbp.description,
                        canPersist: dbp.canPersist
                    };
                }
                else {
                    const sbp = bp;
                    return {
                        type: 'source',
                        id: sbp.getId(),
                        enabled: sbp.enabled,
                        condition: sbp.condition,
                        hitCondition: sbp.hitCondition,
                        logMessage: sbp.logMessage,
                        uri: sbp.uri,
                        line: sbp.lineNumber > 0 ? sbp.lineNumber - 1 : 0,
                        character: (typeof sbp.column === 'number' && sbp.column > 0) ? sbp.column - 1 : 0,
                    };
                }
            });
        }
    };
    exports.MainThreadDebugService = MainThreadDebugService;
    exports.MainThreadDebugService = MainThreadDebugService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadDebugService),
        __param(1, debug_1.IDebugService),
        __param(2, debugVisualizers_1.IDebugVisualizerService)
    ], MainThreadDebugService);
    /**
     * DebugAdapter that communicates via extension protocol with another debug adapter.
     */
    class ExtensionHostDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        constructor(_ds, _handle, _proxy, session) {
            super();
            this._ds = _ds;
            this._handle = _handle;
            this._proxy = _proxy;
            this.session = session;
        }
        fireError(handle, err) {
            this._onError.fire(err);
        }
        fireExit(handle, code, signal) {
            this._onExit.fire(code);
        }
        startSession() {
            return Promise.resolve(this._proxy.$startDASession(this._handle, this._ds.getSessionDto(this.session)));
        }
        sendMessage(message) {
            this._proxy.$sendDAMessage(this._handle, (0, debugUtils_1.convertToDAPaths)(message, true));
        }
        async stopSession() {
            await this.cancelPendingRequests();
            return Promise.resolve(this._proxy.$stopDASession(this._handle));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERlYnVnU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWREZWJ1Z1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0J6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUFzQjtRQVlsQyxZQUNDLGNBQStCLEVBQ2hCLFlBQTRDLEVBQ2xDLGlCQUEyRDtZQURwRCxpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUNqQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQXlCO1lBWnBFLGVBQVUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUU1QyxnQ0FBMkIsR0FBRyxDQUFDLENBQUM7WUFJdkIsdUJBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFDcEQsMkJBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQXVCLENBQUM7WUFPeEUsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUUxRSxNQUFNLGdCQUFnQixHQUFHLElBQUkseUJBQWEsRUFBa0MsQ0FBQztZQUM3RSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQzFELElBQUksQ0FBQyxNQUFNLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JB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