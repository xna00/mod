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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/contrib/debug/common/abstractDebugAdapter", "vs/workbench/contrib/debug/common/debugUtils", "../common/extHostConfiguration", "./extHostVariableResolverService", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTypeConverters"], function (require, exports, async_1, event_1, uri_1, extensions_1, instantiation_1, extHost_protocol_1, extHostEditorTabs_1, extHostExtensionService_1, extHostRpcService_1, extHostTypes_1, extHostWorkspace_1, abstractDebugAdapter_1, debugUtils_1, extHostConfiguration_1, extHostVariableResolverService_1, lifecycle_1, themables_1, extHostCommands_1, Convert) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerExtHostDebugService = exports.ExtHostDebugConsole = exports.ExtHostDebugSession = exports.ExtHostDebugServiceBase = exports.IExtHostDebugService = void 0;
    exports.IExtHostDebugService = (0, instantiation_1.createDecorator)('IExtHostDebugService');
    let ExtHostDebugServiceBase = class ExtHostDebugServiceBase {
        get onDidStartDebugSession() { return this._onDidStartDebugSession.event; }
        get onDidTerminateDebugSession() { return this._onDidTerminateDebugSession.event; }
        get onDidChangeActiveDebugSession() { return this._onDidChangeActiveDebugSession.event; }
        get activeDebugSession() { return this._activeDebugSession?.api; }
        get onDidReceiveDebugSessionCustomEvent() { return this._onDidReceiveDebugSessionCustomEvent.event; }
        get activeDebugConsole() { return this._activeDebugConsole.value; }
        constructor(extHostRpcService, _workspaceService, _extensionService, _configurationService, _editorTabs, _variableResolver, _commands) {
            this._workspaceService = _workspaceService;
            this._extensionService = _extensionService;
            this._configurationService = _configurationService;
            this._editorTabs = _editorTabs;
            this._variableResolver = _variableResolver;
            this._commands = _commands;
            this._debugSessions = new Map();
            this._debugVisualizationTreeItemIdsCounter = 0;
            this._debugVisualizationProviders = new Map();
            this._debugVisualizationTrees = new Map();
            this._debugVisualizationTreeItemIds = new WeakMap();
            this._debugVisualizationElements = new Map();
            this._visualizers = new Map();
            this._visualizerIdCounter = 0;
            this._configProviderHandleCounter = 0;
            this._configProviders = [];
            this._adapterFactoryHandleCounter = 0;
            this._adapterFactories = [];
            this._trackerFactoryHandleCounter = 0;
            this._trackerFactories = [];
            this._debugAdapters = new Map();
            this._debugAdaptersTrackers = new Map();
            this._onDidStartDebugSession = new event_1.Emitter();
            this._onDidTerminateDebugSession = new event_1.Emitter();
            this._onDidChangeActiveDebugSession = new event_1.Emitter();
            this._onDidReceiveDebugSessionCustomEvent = new event_1.Emitter();
            this._debugServiceProxy = extHostRpcService.getProxy(extHost_protocol_1.MainContext.MainThreadDebugService);
            this._onDidChangeBreakpoints = new event_1.Emitter();
            this._onDidChangeActiveStackItem = new event_1.Emitter();
            this._activeDebugConsole = new ExtHostDebugConsole(this._debugServiceProxy);
            this._breakpoints = new Map();
            this._extensionService.getExtensionRegistry().then((extensionRegistry) => {
                extensionRegistry.onDidChange(_ => {
                    this.registerAllDebugTypes(extensionRegistry);
                });
                this.registerAllDebugTypes(extensionRegistry);
            });
        }
        async $getVisualizerTreeItem(treeId, element) {
            const context = this.hydrateVisualizationContext(element);
            if (!context) {
                return undefined;
            }
            const item = await this._debugVisualizationTrees.get(treeId)?.getTreeItem?.(context);
            return item ? this.convertVisualizerTreeItem(treeId, item) : undefined;
        }
        registerDebugVisualizationTree(manifest, id, provider) {
            const extensionId = extensions_1.ExtensionIdentifier.toKey(manifest.identifier);
            const key = this.extensionVisKey(extensionId, id);
            if (this._debugVisualizationProviders.has(key)) {
                throw new Error(`A debug visualization provider with id '${id}' is already registered`);
            }
            this._debugVisualizationTrees.set(key, provider);
            this._debugServiceProxy.$registerDebugVisualizerTree(key, !!provider.editItem);
            return (0, lifecycle_1.toDisposable)(() => {
                this._debugServiceProxy.$unregisterDebugVisualizerTree(key);
                this._debugVisualizationTrees.delete(id);
            });
        }
        async $getVisualizerTreeItemChildren(treeId, element) {
            const item = this._debugVisualizationElements.get(element)?.item;
            if (!item) {
                return [];
            }
            const children = await this._debugVisualizationTrees.get(treeId)?.getChildren?.(item);
            return children?.map(i => this.convertVisualizerTreeItem(treeId, i)) || [];
        }
        async $editVisualizerTreeItem(element, value) {
            const e = this._debugVisualizationElements.get(element);
            if (!e) {
                return undefined;
            }
            const r = await this._debugVisualizationTrees.get(e.provider)?.editItem?.(e.item, value);
            return this.convertVisualizerTreeItem(e.provider, r || e.item);
        }
        $disposeVisualizedTree(element) {
            const root = this._debugVisualizationElements.get(element);
            if (!root) {
                return;
            }
            const queue = [root.children];
            for (const children of queue) {
                if (children) {
                    for (const child of children) {
                        queue.push(this._debugVisualizationElements.get(child)?.children);
                        this._debugVisualizationElements.delete(child);
                    }
                }
            }
        }
        convertVisualizerTreeItem(treeId, item) {
            let id = this._debugVisualizationTreeItemIds.get(item);
            if (!id) {
                id = this._debugVisualizationTreeItemIdsCounter++;
                this._debugVisualizationTreeItemIds.set(item, id);
                this._debugVisualizationElements.set(id, { provider: treeId, item });
            }
            return Convert.DebugTreeItem.from(item, id);
        }
        asDebugSourceUri(src, session) {
            const source = src;
            if (typeof source.sourceReference === 'number' && source.sourceReference > 0) {
                // src can be retrieved via DAP's "source" request
                let debug = `debug:${encodeURIComponent(source.path || '')}`;
                let sep = '?';
                if (session) {
                    debug += `${sep}session=${encodeURIComponent(session.id)}`;
                    sep = '&';
                }
                debug += `${sep}ref=${source.sourceReference}`;
                return uri_1.URI.parse(debug);
            }
            else if (source.path) {
                // src is just a local file path
                return uri_1.URI.file(source.path);
            }
            else {
                throw new Error(`cannot create uri from DAP 'source' object; properties 'path' and 'sourceReference' are both missing.`);
            }
        }
        registerAllDebugTypes(extensionRegistry) {
            const debugTypes = [];
            for (const ed of extensionRegistry.getAllExtensionDescriptions()) {
                if (ed.contributes) {
                    const debuggers = ed.contributes['debuggers'];
                    if (debuggers && debuggers.length > 0) {
                        for (const dbg of debuggers) {
                            if ((0, debugUtils_1.isDebuggerMainContribution)(dbg)) {
                                debugTypes.push(dbg.type);
                            }
                        }
                    }
                }
            }
            this._debugServiceProxy.$registerDebugTypes(debugTypes);
        }
        // extension debug API
        get activeStackItem() {
            return this._activeStackItem;
        }
        get onDidChangeActiveStackItem() {
            return this._onDidChangeActiveStackItem.event;
        }
        get onDidChangeBreakpoints() {
            return this._onDidChangeBreakpoints.event;
        }
        get breakpoints() {
            const result = [];
            this._breakpoints.forEach(bp => result.push(bp));
            return result;
        }
        async $resolveDebugVisualizer(id, token) {
            const visualizer = this._visualizers.get(id);
            if (!visualizer) {
                throw new Error(`No debug visualizer found with id '${id}'`);
            }
            let { v, provider, extensionId } = visualizer;
            if (!v.visualization) {
                v = await provider.resolveDebugVisualization?.(v, token) || v;
                visualizer.v = v;
            }
            if (!v.visualization) {
                throw new Error(`No visualization returned from resolveDebugVisualization in '${provider}'`);
            }
            return this.serializeVisualization(extensionId, v.visualization);
        }
        async $executeDebugVisualizerCommand(id) {
            const visualizer = this._visualizers.get(id);
            if (!visualizer) {
                throw new Error(`No debug visualizer found with id '${id}'`);
            }
            const command = visualizer.v.visualization;
            if (command && 'command' in command) {
                this._commands.executeCommand(command.command, ...(command.arguments || []));
            }
        }
        hydrateVisualizationContext(context) {
            const session = this._debugSessions.get(context.sessionId);
            return session && {
                session: session.api,
                variable: context.variable,
                containerId: context.containerId,
                frameId: context.frameId,
                threadId: context.threadId,
            };
        }
        async $provideDebugVisualizers(extensionId, id, context, token) {
            const contextHydrated = this.hydrateVisualizationContext(context);
            const key = this.extensionVisKey(extensionId, id);
            const provider = this._debugVisualizationProviders.get(key);
            if (!contextHydrated || !provider) {
                return []; // probably ended in the meantime
            }
            const visualizations = await provider.provideDebugVisualization(contextHydrated, token);
            if (!visualizations) {
                return [];
            }
            return visualizations.map(v => {
                const id = ++this._visualizerIdCounter;
                this._visualizers.set(id, { v, provider, extensionId });
                const icon = v.iconPath ? this.getIconPathOrClass(v.iconPath) : undefined;
                return {
                    id,
                    name: v.name,
                    iconClass: icon?.iconClass,
                    iconPath: icon?.iconPath,
                    visualization: this.serializeVisualization(extensionId, v.visualization),
                };
            });
        }
        $disposeDebugVisualizers(ids) {
            for (const id of ids) {
                this._visualizers.delete(id);
            }
        }
        registerDebugVisualizationProvider(manifest, id, provider) {
            if (!manifest.contributes?.debugVisualizers?.some(r => r.id === id)) {
                throw new Error(`Extensions may only call registerDebugVisualizationProvider() for renderers they contribute (got ${id})`);
            }
            const extensionId = extensions_1.ExtensionIdentifier.toKey(manifest.identifier);
            const key = this.extensionVisKey(extensionId, id);
            if (this._debugVisualizationProviders.has(key)) {
                throw new Error(`A debug visualization provider with id '${id}' is already registered`);
            }
            this._debugVisualizationProviders.set(key, provider);
            this._debugServiceProxy.$registerDebugVisualizer(extensionId, id);
            return (0, lifecycle_1.toDisposable)(() => {
                this._debugServiceProxy.$unregisterDebugVisualizer(extensionId, id);
                this._debugVisualizationProviders.delete(id);
            });
        }
        addBreakpoints(breakpoints0) {
            // filter only new breakpoints
            const breakpoints = breakpoints0.filter(bp => {
                const id = bp.id;
                if (!this._breakpoints.has(id)) {
                    this._breakpoints.set(id, bp);
                    return true;
                }
                return false;
            });
            // send notification for added breakpoints
            this.fireBreakpointChanges(breakpoints, [], []);
            // convert added breakpoints to DTOs
            const dtos = [];
            const map = new Map();
            for (const bp of breakpoints) {
                if (bp instanceof extHostTypes_1.SourceBreakpoint) {
                    let dto = map.get(bp.location.uri.toString());
                    if (!dto) {
                        dto = {
                            type: 'sourceMulti',
                            uri: bp.location.uri,
                            lines: []
                        };
                        map.set(bp.location.uri.toString(), dto);
                        dtos.push(dto);
                    }
                    dto.lines.push({
                        id: bp.id,
                        enabled: bp.enabled,
                        condition: bp.condition,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        line: bp.location.range.start.line,
                        character: bp.location.range.start.character,
                        mode: bp.mode,
                    });
                }
                else if (bp instanceof extHostTypes_1.FunctionBreakpoint) {
                    dtos.push({
                        type: 'function',
                        id: bp.id,
                        enabled: bp.enabled,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        condition: bp.condition,
                        functionName: bp.functionName,
                        mode: bp.mode,
                    });
                }
            }
            // send DTOs to VS Code
            return this._debugServiceProxy.$registerBreakpoints(dtos);
        }
        removeBreakpoints(breakpoints0) {
            // remove from array
            const breakpoints = breakpoints0.filter(b => this._breakpoints.delete(b.id));
            // send notification
            this.fireBreakpointChanges([], breakpoints, []);
            // unregister with VS Code
            const ids = breakpoints.filter(bp => bp instanceof extHostTypes_1.SourceBreakpoint).map(bp => bp.id);
            const fids = breakpoints.filter(bp => bp instanceof extHostTypes_1.FunctionBreakpoint).map(bp => bp.id);
            const dids = breakpoints.filter(bp => bp instanceof extHostTypes_1.DataBreakpoint).map(bp => bp.id);
            return this._debugServiceProxy.$unregisterBreakpoints(ids, fids, dids);
        }
        startDebugging(folder, nameOrConfig, options) {
            return this._debugServiceProxy.$startDebugging(folder ? folder.uri : undefined, nameOrConfig, {
                parentSessionID: options.parentSession ? options.parentSession.id : undefined,
                lifecycleManagedByParent: options.lifecycleManagedByParent,
                repl: options.consoleMode === extHostTypes_1.DebugConsoleMode.MergeWithParent ? 'mergeWithParent' : 'separate',
                noDebug: options.noDebug,
                compact: options.compact,
                suppressSaveBeforeStart: options.suppressSaveBeforeStart,
                // Check debugUI for back-compat, #147264
                suppressDebugStatusbar: options.suppressDebugStatusbar ?? options.debugUI?.simple,
                suppressDebugToolbar: options.suppressDebugToolbar ?? options.debugUI?.simple,
                suppressDebugView: options.suppressDebugView ?? options.debugUI?.simple,
            });
        }
        stopDebugging(session) {
            return this._debugServiceProxy.$stopDebugging(session ? session.id : undefined);
        }
        registerDebugConfigurationProvider(type, provider, trigger) {
            if (!provider) {
                return new extHostTypes_1.Disposable(() => { });
            }
            const handle = this._configProviderHandleCounter++;
            this._configProviders.push({ type, handle, provider });
            this._debugServiceProxy.$registerDebugConfigurationProvider(type, trigger, !!provider.provideDebugConfigurations, !!provider.resolveDebugConfiguration, !!provider.resolveDebugConfigurationWithSubstitutedVariables, handle);
            return new extHostTypes_1.Disposable(() => {
                this._configProviders = this._configProviders.filter(p => p.provider !== provider); // remove
                this._debugServiceProxy.$unregisterDebugConfigurationProvider(handle);
            });
        }
        registerDebugAdapterDescriptorFactory(extension, type, factory) {
            if (!factory) {
                return new extHostTypes_1.Disposable(() => { });
            }
            // a DebugAdapterDescriptorFactory can only be registered in the extension that contributes the debugger
            if (!this.definesDebugType(extension, type)) {
                throw new Error(`a DebugAdapterDescriptorFactory can only be registered from the extension that defines the '${type}' debugger.`);
            }
            // make sure that only one factory for this type is registered
            if (this.getAdapterDescriptorFactoryByType(type)) {
                throw new Error(`a DebugAdapterDescriptorFactory can only be registered once per a type.`);
            }
            const handle = this._adapterFactoryHandleCounter++;
            this._adapterFactories.push({ type, handle, factory });
            this._debugServiceProxy.$registerDebugAdapterDescriptorFactory(type, handle);
            return new extHostTypes_1.Disposable(() => {
                this._adapterFactories = this._adapterFactories.filter(p => p.factory !== factory); // remove
                this._debugServiceProxy.$unregisterDebugAdapterDescriptorFactory(handle);
            });
        }
        registerDebugAdapterTrackerFactory(type, factory) {
            if (!factory) {
                return new extHostTypes_1.Disposable(() => { });
            }
            const handle = this._trackerFactoryHandleCounter++;
            this._trackerFactories.push({ type, handle, factory });
            return new extHostTypes_1.Disposable(() => {
                this._trackerFactories = this._trackerFactories.filter(p => p.factory !== factory); // remove
            });
        }
        // RPC methods (ExtHostDebugServiceShape)
        async $runInTerminal(args, sessionId) {
            return Promise.resolve(undefined);
        }
        async $substituteVariables(folderUri, config) {
            let ws;
            const folder = await this.getFolder(folderUri);
            if (folder) {
                ws = {
                    uri: folder.uri,
                    name: folder.name,
                    index: folder.index,
                    toResource: () => {
                        throw new Error('Not implemented');
                    }
                };
            }
            const variableResolver = await this._variableResolver.getResolver();
            return variableResolver.resolveAnyAsync(ws, config);
        }
        createDebugAdapter(adapter, session) {
            if (adapter.type === 'implementation') {
                return new DirectDebugAdapter(adapter.implementation);
            }
            return undefined;
        }
        createSignService() {
            return undefined;
        }
        async $startDASession(debugAdapterHandle, sessionDto) {
            const mythis = this;
            const session = await this.getSession(sessionDto);
            return this.getAdapterDescriptor(this.getAdapterDescriptorFactoryByType(session.type), session).then(daDescriptor => {
                if (!daDescriptor) {
                    throw new Error(`Couldn't find a debug adapter descriptor for debug type '${session.type}' (extension might have failed to activate)`);
                }
                const adapterDescriptor = this.convertToDto(daDescriptor);
                const da = this.createDebugAdapter(adapterDescriptor, session);
                if (!da) {
                    throw new Error(`Couldn't create a debug adapter for type '${session.type}'.`);
                }
                const debugAdapter = da;
                this._debugAdapters.set(debugAdapterHandle, debugAdapter);
                return this.getDebugAdapterTrackers(session).then(tracker => {
                    if (tracker) {
                        this._debugAdaptersTrackers.set(debugAdapterHandle, tracker);
                    }
                    debugAdapter.onMessage(async (message) => {
                        if (message.type === 'request' && message.command === 'handshake') {
                            const request = message;
                            const response = {
                                type: 'response',
                                seq: 0,
                                command: request.command,
                                request_seq: request.seq,
                                success: true
                            };
                            if (!this._signService) {
                                this._signService = this.createSignService();
                            }
                            try {
                                if (this._signService) {
                                    const signature = await this._signService.sign(request.arguments.value);
                                    response.body = {
                                        signature: signature
                                    };
                                    debugAdapter.sendResponse(response);
                                }
                                else {
                                    throw new Error('no signer');
                                }
                            }
                            catch (e) {
                                response.success = false;
                                response.message = e.message;
                                debugAdapter.sendResponse(response);
                            }
                        }
                        else {
                            if (tracker && tracker.onDidSendMessage) {
                                tracker.onDidSendMessage(message);
                            }
                            // DA -> VS Code
                            message = (0, debugUtils_1.convertToVSCPaths)(message, true);
                            mythis._debugServiceProxy.$acceptDAMessage(debugAdapterHandle, message);
                        }
                    });
                    debugAdapter.onError(err => {
                        if (tracker && tracker.onError) {
                            tracker.onError(err);
                        }
                        this._debugServiceProxy.$acceptDAError(debugAdapterHandle, err.name, err.message, err.stack);
                    });
                    debugAdapter.onExit((code) => {
                        if (tracker && tracker.onExit) {
                            tracker.onExit(code ?? undefined, undefined);
                        }
                        this._debugServiceProxy.$acceptDAExit(debugAdapterHandle, code ?? undefined, undefined);
                    });
                    if (tracker && tracker.onWillStartSession) {
                        tracker.onWillStartSession();
                    }
                    return debugAdapter.startSession();
                });
            });
        }
        $sendDAMessage(debugAdapterHandle, message) {
            // VS Code -> DA
            message = (0, debugUtils_1.convertToDAPaths)(message, false);
            const tracker = this._debugAdaptersTrackers.get(debugAdapterHandle); // TODO@AW: same handle?
            if (tracker && tracker.onWillReceiveMessage) {
                tracker.onWillReceiveMessage(message);
            }
            const da = this._debugAdapters.get(debugAdapterHandle);
            da?.sendMessage(message);
        }
        $stopDASession(debugAdapterHandle) {
            const tracker = this._debugAdaptersTrackers.get(debugAdapterHandle);
            this._debugAdaptersTrackers.delete(debugAdapterHandle);
            if (tracker && tracker.onWillStopSession) {
                tracker.onWillStopSession();
            }
            const da = this._debugAdapters.get(debugAdapterHandle);
            this._debugAdapters.delete(debugAdapterHandle);
            if (da) {
                return da.stopSession();
            }
            else {
                return Promise.resolve(void 0);
            }
        }
        $acceptBreakpointsDelta(delta) {
            const a = [];
            const r = [];
            const c = [];
            if (delta.added) {
                for (const bpd of delta.added) {
                    const id = bpd.id;
                    if (id && !this._breakpoints.has(id)) {
                        let bp;
                        if (bpd.type === 'function') {
                            bp = new extHostTypes_1.FunctionBreakpoint(bpd.functionName, bpd.enabled, bpd.condition, bpd.hitCondition, bpd.logMessage, bpd.mode);
                        }
                        else if (bpd.type === 'data') {
                            bp = new extHostTypes_1.DataBreakpoint(bpd.label, bpd.dataId, bpd.canPersist, bpd.enabled, bpd.hitCondition, bpd.condition, bpd.logMessage, bpd.mode);
                        }
                        else {
                            const uri = uri_1.URI.revive(bpd.uri);
                            bp = new extHostTypes_1.SourceBreakpoint(new extHostTypes_1.Location(uri, new extHostTypes_1.Position(bpd.line, bpd.character)), bpd.enabled, bpd.condition, bpd.hitCondition, bpd.logMessage, bpd.mode);
                        }
                        (0, extHostTypes_1.setBreakpointId)(bp, id);
                        this._breakpoints.set(id, bp);
                        a.push(bp);
                    }
                }
            }
            if (delta.removed) {
                for (const id of delta.removed) {
                    const bp = this._breakpoints.get(id);
                    if (bp) {
                        this._breakpoints.delete(id);
                        r.push(bp);
                    }
                }
            }
            if (delta.changed) {
                for (const bpd of delta.changed) {
                    if (bpd.id) {
                        const bp = this._breakpoints.get(bpd.id);
                        if (bp) {
                            if (bp instanceof extHostTypes_1.FunctionBreakpoint && bpd.type === 'function') {
                                const fbp = bp;
                                fbp.enabled = bpd.enabled;
                                fbp.condition = bpd.condition;
                                fbp.hitCondition = bpd.hitCondition;
                                fbp.logMessage = bpd.logMessage;
                                fbp.functionName = bpd.functionName;
                            }
                            else if (bp instanceof extHostTypes_1.SourceBreakpoint && bpd.type === 'source') {
                                const sbp = bp;
                                sbp.enabled = bpd.enabled;
                                sbp.condition = bpd.condition;
                                sbp.hitCondition = bpd.hitCondition;
                                sbp.logMessage = bpd.logMessage;
                                sbp.location = new extHostTypes_1.Location(uri_1.URI.revive(bpd.uri), new extHostTypes_1.Position(bpd.line, bpd.character));
                            }
                            c.push(bp);
                        }
                    }
                }
            }
            this.fireBreakpointChanges(a, r, c);
        }
        async $acceptStackFrameFocus(focusDto) {
            let focus;
            if (focusDto) {
                const session = await this.getSession(focusDto.sessionId);
                if (focusDto.kind === 'thread') {
                    focus = new extHostTypes_1.Thread(session.api, focusDto.threadId);
                }
                else {
                    focus = new extHostTypes_1.StackFrame(session.api, focusDto.threadId, focusDto.frameId);
                }
            }
            this._activeStackItem = focus;
            this._onDidChangeActiveStackItem.fire(this._activeStackItem);
        }
        $provideDebugConfigurations(configProviderHandle, folderUri, token) {
            return (0, async_1.asPromise)(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.provideDebugConfigurations) {
                    throw new Error('DebugConfigurationProvider has no method provideDebugConfigurations');
                }
                const folder = await this.getFolder(folderUri);
                return provider.provideDebugConfigurations(folder, token);
            }).then(debugConfigurations => {
                if (!debugConfigurations) {
                    throw new Error('nothing returned from DebugConfigurationProvider.provideDebugConfigurations');
                }
                return debugConfigurations;
            });
        }
        $resolveDebugConfiguration(configProviderHandle, folderUri, debugConfiguration, token) {
            return (0, async_1.asPromise)(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.resolveDebugConfiguration) {
                    throw new Error('DebugConfigurationProvider has no method resolveDebugConfiguration');
                }
                const folder = await this.getFolder(folderUri);
                return provider.resolveDebugConfiguration(folder, debugConfiguration, token);
            });
        }
        $resolveDebugConfigurationWithSubstitutedVariables(configProviderHandle, folderUri, debugConfiguration, token) {
            return (0, async_1.asPromise)(async () => {
                const provider = this.getConfigProviderByHandle(configProviderHandle);
                if (!provider) {
                    throw new Error('no DebugConfigurationProvider found');
                }
                if (!provider.resolveDebugConfigurationWithSubstitutedVariables) {
                    throw new Error('DebugConfigurationProvider has no method resolveDebugConfigurationWithSubstitutedVariables');
                }
                const folder = await this.getFolder(folderUri);
                return provider.resolveDebugConfigurationWithSubstitutedVariables(folder, debugConfiguration, token);
            });
        }
        async $provideDebugAdapter(adapterFactoryHandle, sessionDto) {
            const adapterDescriptorFactory = this.getAdapterDescriptorFactoryByHandle(adapterFactoryHandle);
            if (!adapterDescriptorFactory) {
                return Promise.reject(new Error('no adapter descriptor factory found for handle'));
            }
            const session = await this.getSession(sessionDto);
            return this.getAdapterDescriptor(adapterDescriptorFactory, session).then(adapterDescriptor => {
                if (!adapterDescriptor) {
                    throw new Error(`Couldn't find a debug adapter descriptor for debug type '${session.type}'`);
                }
                return this.convertToDto(adapterDescriptor);
            });
        }
        async $acceptDebugSessionStarted(sessionDto) {
            const session = await this.getSession(sessionDto);
            this._onDidStartDebugSession.fire(session.api);
        }
        async $acceptDebugSessionTerminated(sessionDto) {
            const session = await this.getSession(sessionDto);
            if (session) {
                this._onDidTerminateDebugSession.fire(session.api);
                this._debugSessions.delete(session.id);
            }
        }
        async $acceptDebugSessionActiveChanged(sessionDto) {
            this._activeDebugSession = sessionDto ? await this.getSession(sessionDto) : undefined;
            this._onDidChangeActiveDebugSession.fire(this._activeDebugSession?.api);
        }
        async $acceptDebugSessionNameChanged(sessionDto, name) {
            const session = await this.getSession(sessionDto);
            session?._acceptNameChanged(name);
        }
        async $acceptDebugSessionCustomEvent(sessionDto, event) {
            const session = await this.getSession(sessionDto);
            const ee = {
                session: session.api,
                event: event.event,
                body: event.body
            };
            this._onDidReceiveDebugSessionCustomEvent.fire(ee);
        }
        // private & dto helpers
        convertToDto(x) {
            if (x instanceof extHostTypes_1.DebugAdapterExecutable) {
                return {
                    type: 'executable',
                    command: x.command,
                    args: x.args,
                    options: x.options
                };
            }
            else if (x instanceof extHostTypes_1.DebugAdapterServer) {
                return {
                    type: 'server',
                    port: x.port,
                    host: x.host
                };
            }
            else if (x instanceof extHostTypes_1.DebugAdapterNamedPipeServer) {
                return {
                    type: 'pipeServer',
                    path: x.path
                };
            }
            else if (x instanceof extHostTypes_1.DebugAdapterInlineImplementation) {
                return {
                    type: 'implementation',
                    implementation: x.implementation
                };
            }
            else {
                throw new Error('convertToDto unexpected type');
            }
        }
        getAdapterDescriptorFactoryByType(type) {
            const results = this._adapterFactories.filter(p => p.type === type);
            if (results.length > 0) {
                return results[0].factory;
            }
            return undefined;
        }
        getAdapterDescriptorFactoryByHandle(handle) {
            const results = this._adapterFactories.filter(p => p.handle === handle);
            if (results.length > 0) {
                return results[0].factory;
            }
            return undefined;
        }
        getConfigProviderByHandle(handle) {
            const results = this._configProviders.filter(p => p.handle === handle);
            if (results.length > 0) {
                return results[0].provider;
            }
            return undefined;
        }
        definesDebugType(ed, type) {
            if (ed.contributes) {
                const debuggers = ed.contributes['debuggers'];
                if (debuggers && debuggers.length > 0) {
                    for (const dbg of debuggers) {
                        // only debugger contributions with a "label" are considered a "defining" debugger contribution
                        if (dbg.label && dbg.type) {
                            if (dbg.type === type) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        getDebugAdapterTrackers(session) {
            const config = session.configuration;
            const type = config.type;
            const promises = this._trackerFactories
                .filter(tuple => tuple.type === type || tuple.type === '*')
                .map(tuple => (0, async_1.asPromise)(() => tuple.factory.createDebugAdapterTracker(session.api)).then(p => p, err => null));
            return Promise.race([
                Promise.all(promises).then(result => {
                    const trackers = result.filter(t => !!t); // filter null
                    if (trackers.length > 0) {
                        return new MultiTracker(trackers);
                    }
                    return undefined;
                }),
                new Promise(resolve => setTimeout(() => resolve(undefined), 1000)),
            ]).catch(err => {
                // ignore errors
                return undefined;
            });
        }
        async getAdapterDescriptor(adapterDescriptorFactory, session) {
            // a "debugServer" attribute in the launch config takes precedence
            const serverPort = session.configuration.debugServer;
            if (typeof serverPort === 'number') {
                return Promise.resolve(new extHostTypes_1.DebugAdapterServer(serverPort));
            }
            if (adapterDescriptorFactory) {
                const extensionRegistry = await this._extensionService.getExtensionRegistry();
                return (0, async_1.asPromise)(() => adapterDescriptorFactory.createDebugAdapterDescriptor(session.api, this.daExecutableFromPackage(session, extensionRegistry))).then(daDescriptor => {
                    if (daDescriptor) {
                        return daDescriptor;
                    }
                    return undefined;
                });
            }
            // fallback: use executable information from package.json
            const extensionRegistry = await this._extensionService.getExtensionRegistry();
            return Promise.resolve(this.daExecutableFromPackage(session, extensionRegistry));
        }
        daExecutableFromPackage(session, extensionRegistry) {
            return undefined;
        }
        fireBreakpointChanges(added, removed, changed) {
            if (added.length > 0 || removed.length > 0 || changed.length > 0) {
                this._onDidChangeBreakpoints.fire(Object.freeze({
                    added,
                    removed,
                    changed,
                }));
            }
        }
        async getSession(dto) {
            if (dto) {
                if (typeof dto === 'string') {
                    const ds = this._debugSessions.get(dto);
                    if (ds) {
                        return ds;
                    }
                }
                else {
                    let ds = this._debugSessions.get(dto.id);
                    if (!ds) {
                        const folder = await this.getFolder(dto.folderUri);
                        const parent = dto.parent ? this._debugSessions.get(dto.parent) : undefined;
                        ds = new ExtHostDebugSession(this._debugServiceProxy, dto.id, dto.type, dto.name, folder, dto.configuration, parent?.api);
                        this._debugSessions.set(ds.id, ds);
                        this._debugServiceProxy.$sessionCached(ds.id);
                    }
                    return ds;
                }
            }
            throw new Error('cannot find session');
        }
        getFolder(_folderUri) {
            if (_folderUri) {
                const folderURI = uri_1.URI.revive(_folderUri);
                return this._workspaceService.resolveWorkspaceFolder(folderURI);
            }
            return Promise.resolve(undefined);
        }
        extensionVisKey(extensionId, id) {
            return `${extensionId}\0${id}`;
        }
        serializeVisualization(extensionId, viz) {
            if (!viz) {
                return undefined;
            }
            if ('title' in viz && 'command' in viz) {
                return { type: 0 /* DebugVisualizationType.Command */ };
            }
            if ('treeId' in viz) {
                return { type: 1 /* DebugVisualizationType.Tree */, id: `${extensionId}\0${viz.treeId}` };
            }
            throw new Error('Unsupported debug visualization type');
        }
        getIconPathOrClass(icon) {
            const iconPathOrIconClass = this.getIconUris(icon);
            let iconPath;
            let iconClass;
            if ('id' in iconPathOrIconClass) {
                iconClass = themables_1.ThemeIcon.asClassName(iconPathOrIconClass);
            }
            else {
                iconPath = iconPathOrIconClass;
            }
            return {
                iconPath,
                iconClass
            };
        }
        getIconUris(iconPath) {
            if (iconPath instanceof extHostTypes_1.ThemeIcon) {
                return { id: iconPath.id };
            }
            const dark = typeof iconPath === 'object' && 'dark' in iconPath ? iconPath.dark : iconPath;
            const light = typeof iconPath === 'object' && 'light' in iconPath ? iconPath.light : iconPath;
            return {
                dark: (typeof dark === 'string' ? uri_1.URI.file(dark) : dark),
                light: (typeof light === 'string' ? uri_1.URI.file(light) : light),
            };
        }
    };
    exports.ExtHostDebugServiceBase = ExtHostDebugServiceBase;
    exports.ExtHostDebugServiceBase = ExtHostDebugServiceBase = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostExtensionService_1.IExtHostExtensionService),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostEditorTabs_1.IExtHostEditorTabs),
        __param(5, extHostVariableResolverService_1.IExtHostVariableResolverProvider),
        __param(6, extHostCommands_1.IExtHostCommands)
    ], ExtHostDebugServiceBase);
    class ExtHostDebugSession {
        constructor(_debugServiceProxy, _id, _type, _name, _workspaceFolder, _configuration, _parentSession) {
            this._debugServiceProxy = _debugServiceProxy;
            this._id = _id;
            this._type = _type;
            this._name = _name;
            this._workspaceFolder = _workspaceFolder;
            this._configuration = _configuration;
            this._parentSession = _parentSession;
        }
        get api() {
            const that = this;
            return this.apiSession ??= Object.freeze({
                id: that._id,
                type: that._type,
                get name() {
                    return that._name;
                },
                set name(name) {
                    that._name = name;
                    that._debugServiceProxy.$setDebugSessionName(that._id, name);
                },
                parentSession: that._parentSession,
                workspaceFolder: that._workspaceFolder,
                configuration: that._configuration,
                customRequest(command, args) {
                    return that._debugServiceProxy.$customDebugAdapterRequest(that._id, command, args);
                },
                getDebugProtocolBreakpoint(breakpoint) {
                    return that._debugServiceProxy.$getDebugProtocolBreakpoint(that._id, breakpoint.id);
                }
            });
        }
        get id() {
            return this._id;
        }
        get type() {
            return this._type;
        }
        _acceptNameChanged(name) {
            this._name = name;
        }
        get configuration() {
            return this._configuration;
        }
    }
    exports.ExtHostDebugSession = ExtHostDebugSession;
    class ExtHostDebugConsole {
        constructor(proxy) {
            this.value = Object.freeze({
                append(value) {
                    proxy.$appendDebugConsole(value);
                },
                appendLine(value) {
                    this.append(value + '\n');
                }
            });
        }
    }
    exports.ExtHostDebugConsole = ExtHostDebugConsole;
    class MultiTracker {
        constructor(trackers) {
            this.trackers = trackers;
        }
        onWillStartSession() {
            this.trackers.forEach(t => t.onWillStartSession ? t.onWillStartSession() : undefined);
        }
        onWillReceiveMessage(message) {
            this.trackers.forEach(t => t.onWillReceiveMessage ? t.onWillReceiveMessage(message) : undefined);
        }
        onDidSendMessage(message) {
            this.trackers.forEach(t => t.onDidSendMessage ? t.onDidSendMessage(message) : undefined);
        }
        onWillStopSession() {
            this.trackers.forEach(t => t.onWillStopSession ? t.onWillStopSession() : undefined);
        }
        onError(error) {
            this.trackers.forEach(t => t.onError ? t.onError(error) : undefined);
        }
        onExit(code, signal) {
            this.trackers.forEach(t => t.onExit ? t.onExit(code, signal) : undefined);
        }
    }
    /*
     * Call directly into a debug adapter implementation
     */
    class DirectDebugAdapter extends abstractDebugAdapter_1.AbstractDebugAdapter {
        constructor(implementation) {
            super();
            this.implementation = implementation;
            implementation.onDidSendMessage((message) => {
                this.acceptMessage(message);
            });
        }
        startSession() {
            return Promise.resolve(undefined);
        }
        sendMessage(message) {
            this.implementation.handleMessage(message);
        }
        stopSession() {
            this.implementation.dispose();
            return Promise.resolve(undefined);
        }
    }
    let WorkerExtHostDebugService = class WorkerExtHostDebugService extends ExtHostDebugServiceBase {
        constructor(extHostRpcService, workspaceService, extensionService, configurationService, editorTabs, variableResolver, commands) {
            super(extHostRpcService, workspaceService, extensionService, configurationService, editorTabs, variableResolver, commands);
        }
    };
    exports.WorkerExtHostDebugService = WorkerExtHostDebugService;
    exports.WorkerExtHostDebugService = WorkerExtHostDebugService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostWorkspace_1.IExtHostWorkspace),
        __param(2, extHostExtensionService_1.IExtHostExtensionService),
        __param(3, extHostConfiguration_1.IExtHostConfiguration),
        __param(4, extHostEditorTabs_1.IExtHostEditorTabs),
        __param(5, extHostVariableResolverService_1.IExtHostVariableResolverProvider),
        __param(6, extHostCommands_1.IExtHostCommands)
    ], WorkerExtHostDebugService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERlYnVnU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdERlYnVnU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE2Qm5GLFFBQUEsb0JBQW9CLEdBQUcsSUFBQSwrQkFBZSxFQUF1QixzQkFBc0IsQ0FBQyxDQUFDO0lBNkIzRixJQUFlLHVCQUF1QixHQUF0QyxNQUFlLHVCQUF1QjtRQWlCNUMsSUFBSSxzQkFBc0IsS0FBaUMsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUd2RyxJQUFJLDBCQUEwQixLQUFpQyxPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRy9HLElBQUksNkJBQTZCLEtBQTZDLE9BQU8sSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHakksSUFBSSxrQkFBa0IsS0FBc0MsT0FBTyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUduRyxJQUFJLG1DQUFtQyxLQUE0QyxPQUFPLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRzVJLElBQUksa0JBQWtCLEtBQTBCLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUF1QnhGLFlBQ3FCLGlCQUFxQyxFQUN0QyxpQkFBOEMsRUFDdkMsaUJBQW1ELEVBQ3RELHFCQUFzRCxFQUN6RCxXQUF5QyxFQUMzQixpQkFBMkQsRUFDM0UsU0FBbUM7WUFMeEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtZQUMvQixzQkFBaUIsR0FBakIsaUJB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