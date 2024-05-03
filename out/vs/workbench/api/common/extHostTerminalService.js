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
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri", "vs/workbench/api/common/extHostRpcService", "vs/base/common/lifecycle", "./extHostTypes", "vs/nls", "vs/base/common/errors", "vs/platform/terminal/common/environmentVariableShared", "vs/base/common/cancellation", "vs/base/common/uuid", "vs/platform/terminal/common/terminalDataBuffering", "vs/base/common/themables", "vs/base/common/async", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostCommands"], function (require, exports, event_1, extHost_protocol_1, instantiation_1, uri_1, extHostRpcService_1, lifecycle_1, extHostTypes_1, nls_1, errors_1, environmentVariableShared_1, cancellation_1, uuid_1, terminalDataBuffering_1, themables_1, async_1, extHostTypeConverters_1, extHostCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkerExtHostTerminalService = exports.BaseExtHostTerminalService = exports.ExtHostTerminal = exports.IExtHostTerminalService = void 0;
    exports.IExtHostTerminalService = (0, instantiation_1.createDecorator)('IExtHostTerminalService');
    class ExtHostTerminal extends lifecycle_1.Disposable {
        constructor(_proxy, _id, _creationOptions, _name) {
            super();
            this._proxy = _proxy;
            this._id = _id;
            this._creationOptions = _creationOptions;
            this._name = _name;
            this._disposed = false;
            this._state = { isInteractedWith: false };
            this.isOpen = false;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            this._creationOptions = Object.freeze(this._creationOptions);
            this._pidPromise = new Promise(c => this._pidPromiseComplete = c);
            const that = this;
            this.value = {
                get name() {
                    return that._name || '';
                },
                get processId() {
                    return that._pidPromise;
                },
                get creationOptions() {
                    return that._creationOptions;
                },
                get exitStatus() {
                    return that._exitStatus;
                },
                get state() {
                    return that._state;
                },
                get selection() {
                    return that._selection;
                },
                get shellIntegration() {
                    return that.shellIntegration;
                },
                sendText(text, shouldExecute = true) {
                    that._checkDisposed();
                    that._proxy.$sendText(that._id, text, shouldExecute);
                },
                show(preserveFocus) {
                    that._checkDisposed();
                    that._proxy.$show(that._id, preserveFocus);
                },
                hide() {
                    that._checkDisposed();
                    that._proxy.$hide(that._id);
                },
                dispose() {
                    if (!that._disposed) {
                        that._disposed = true;
                        that._proxy.$dispose(that._id);
                    }
                },
                get dimensions() {
                    if (that._cols === undefined || that._rows === undefined) {
                        return undefined;
                    }
                    return {
                        columns: that._cols,
                        rows: that._rows
                    };
                }
            };
        }
        dispose() {
            this._onWillDispose.fire();
            super.dispose();
        }
        async create(options, internalOptions) {
            if (typeof this._id !== 'string') {
                throw new Error('Terminal has already been created');
            }
            await this._proxy.$createTerminal(this._id, {
                name: options.name,
                shellPath: options.shellPath ?? undefined,
                shellArgs: options.shellArgs ?? undefined,
                cwd: options.cwd ?? internalOptions?.cwd ?? undefined,
                env: options.env ?? undefined,
                icon: asTerminalIcon(options.iconPath) ?? undefined,
                color: themables_1.ThemeColor.isThemeColor(options.color) ? options.color.id : undefined,
                initialText: options.message ?? undefined,
                strictEnv: options.strictEnv ?? undefined,
                hideFromUser: options.hideFromUser ?? undefined,
                forceShellIntegration: internalOptions?.forceShellIntegration ?? undefined,
                isFeatureTerminal: internalOptions?.isFeatureTerminal ?? undefined,
                isExtensionOwnedTerminal: true,
                useShellEnvironment: internalOptions?.useShellEnvironment ?? undefined,
                location: internalOptions?.location || this._serializeParentTerminal(options.location, internalOptions?.resolvedExtHostIdentifier),
                isTransient: options.isTransient ?? undefined,
            });
        }
        async createExtensionTerminal(location, internalOptions, parentTerminal, iconPath, color) {
            if (typeof this._id !== 'string') {
                throw new Error('Terminal has already been created');
            }
            await this._proxy.$createTerminal(this._id, {
                name: this._name,
                isExtensionCustomPtyTerminal: true,
                icon: iconPath,
                color: themables_1.ThemeColor.isThemeColor(color) ? color.id : undefined,
                location: internalOptions?.location || this._serializeParentTerminal(location, parentTerminal),
                isTransient: true
            });
            // At this point, the id has been set via `$acceptTerminalOpened`
            if (typeof this._id === 'string') {
                throw new Error('Terminal creation failed');
            }
            return this._id;
        }
        _serializeParentTerminal(location, parentTerminal) {
            if (typeof location === 'object') {
                if ('parentTerminal' in location && location.parentTerminal && parentTerminal) {
                    return { parentTerminal };
                }
                if ('viewColumn' in location) {
                    return { viewColumn: extHostTypeConverters_1.ViewColumn.from(location.viewColumn), preserveFocus: location.preserveFocus };
                }
                return undefined;
            }
            return location;
        }
        _checkDisposed() {
            if (this._disposed) {
                throw new Error('Terminal has already been disposed');
            }
        }
        set name(name) {
            this._name = name;
        }
        setExitStatus(code, reason) {
            this._exitStatus = Object.freeze({ code, reason });
        }
        setDimensions(cols, rows) {
            if (cols === this._cols && rows === this._rows) {
                // Nothing changed
                return false;
            }
            if (cols === 0 || rows === 0) {
                return false;
            }
            this._cols = cols;
            this._rows = rows;
            return true;
        }
        setInteractedWith() {
            if (!this._state.isInteractedWith) {
                this._state = { isInteractedWith: true };
                return true;
            }
            return false;
        }
        setSelection(selection) {
            this._selection = selection;
        }
        _setProcessId(processId) {
            // The event may fire 2 times when the panel is restored
            if (this._pidPromiseComplete) {
                this._pidPromiseComplete(processId);
                this._pidPromiseComplete = undefined;
            }
            else {
                // Recreate the promise if this is the nth processId set (e.g. reused task terminals)
                this._pidPromise.then(pid => {
                    if (pid !== processId) {
                        this._pidPromise = Promise.resolve(processId);
                    }
                });
            }
        }
    }
    exports.ExtHostTerminal = ExtHostTerminal;
    class ExtHostPseudoterminal {
        get onProcessReady() { return this._onProcessReady.event; }
        constructor(_pty) {
            this._pty = _pty;
            this.id = 0;
            this.shouldPersist = false;
            this._onProcessData = new event_1.Emitter();
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = new event_1.Emitter();
            this._onDidChangeProperty = new event_1.Emitter();
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = new event_1.Emitter();
            this.onProcessExit = this._onProcessExit.event;
        }
        refreshProperty(property) {
            throw new Error(`refreshProperty is not suppported in extension owned terminals. property: ${property}`);
        }
        updateProperty(property, value) {
            throw new Error(`updateProperty is not suppported in extension owned terminals. property: ${property}, value: ${value}`);
        }
        async start() {
            return undefined;
        }
        shutdown() {
            this._pty.close();
        }
        input(data) {
            this._pty.handleInput?.(data);
        }
        resize(cols, rows) {
            this._pty.setDimensions?.({ columns: cols, rows });
        }
        clearBuffer() {
            // no-op
        }
        async processBinary(data) {
            // No-op, processBinary is not supported in extension owned terminals.
        }
        acknowledgeDataEvent(charCount) {
            // No-op, flow control is not supported in extension owned terminals. If this is ever
            // implemented it will need new pause and resume VS Code APIs.
        }
        async setUnicodeVersion(version) {
            // No-op, xterm-headless isn't used for extension owned terminals.
        }
        getInitialCwd() {
            return Promise.resolve('');
        }
        getCwd() {
            return Promise.resolve('');
        }
        startSendingEvents(initialDimensions) {
            // Attach the listeners
            this._pty.onDidWrite(e => this._onProcessData.fire(e));
            this._pty.onDidClose?.((e = undefined) => {
                this._onProcessExit.fire(e === void 0 ? undefined : e);
            });
            this._pty.onDidOverrideDimensions?.(e => {
                if (e) {
                    this._onDidChangeProperty.fire({ type: "overrideDimensions" /* ProcessPropertyType.OverrideDimensions */, value: { cols: e.columns, rows: e.rows } });
                }
            });
            this._pty.onDidChangeName?.(title => {
                this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: title });
            });
            this._pty.open(initialDimensions ? initialDimensions : undefined);
            if (initialDimensions) {
                this._pty.setDimensions?.(initialDimensions);
            }
            this._onProcessReady.fire({ pid: -1, cwd: '', windowsPty: undefined });
        }
    }
    let nextLinkId = 1;
    let BaseExtHostTerminalService = class BaseExtHostTerminalService extends lifecycle_1.Disposable {
        get activeTerminal() { return this._activeTerminal?.value; }
        get terminals() { return this._terminals.map(term => term.value); }
        constructor(supportsProcesses, _extHostCommands, extHostRpc) {
            super();
            this._extHostCommands = _extHostCommands;
            this._terminals = [];
            this._terminalProcesses = new Map();
            this._terminalProcessDisposables = {};
            this._extensionTerminalAwaitingStart = {};
            this._getTerminalPromises = {};
            this._environmentVariableCollections = new Map();
            this._lastQuickFixCommands = this._register(new lifecycle_1.MutableDisposable());
            this._linkProviders = new Set();
            this._profileProviders = new Map();
            this._quickFixProviders = new Map();
            this._terminalLinkCache = new Map();
            this._terminalLinkCancellationSource = new Map();
            this._onDidCloseTerminal = new event_1.Emitter();
            this.onDidCloseTerminal = this._onDidCloseTerminal.event;
            this._onDidOpenTerminal = new event_1.Emitter();
            this.onDidOpenTerminal = this._onDidOpenTerminal.event;
            this._onDidChangeActiveTerminal = new event_1.Emitter();
            this.onDidChangeActiveTerminal = this._onDidChangeActiveTerminal.event;
            this._onDidChangeTerminalDimensions = new event_1.Emitter();
            this.onDidChangeTerminalDimensions = this._onDidChangeTerminalDimensions.event;
            this._onDidChangeTerminalState = new event_1.Emitter();
            this.onDidChangeTerminalState = this._onDidChangeTerminalState.event;
            this._onDidChangeShell = new event_1.Emitter();
            this.onDidChangeShell = this._onDidChangeShell.event;
            this._onDidWriteTerminalData = new event_1.Emitter({
                onWillAddFirstListener: () => this._proxy.$startSendingDataEvents(),
                onDidRemoveLastListener: () => this._proxy.$stopSendingDataEvents()
            });
            this.onDidWriteTerminalData = this._onDidWriteTerminalData.event;
            this._onDidExecuteCommand = new event_1.Emitter({
                onWillAddFirstListener: () => this._proxy.$startSendingCommandEvents(),
                onDidRemoveLastListener: () => this._proxy.$stopSendingCommandEvents()
            });
            this.onDidExecuteTerminalCommand = this._onDidExecuteCommand.event;
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTerminalService);
            this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer(this._proxy.$sendProcessData);
            this._proxy.$registerProcessSupport(supportsProcesses);
            this._extHostCommands.registerArgumentProcessor({
                processArgument: arg => {
                    const deserialize = (arg) => {
                        const cast = arg;
                        return this.getTerminalById(cast.instanceId)?.value;
                    };
                    switch (arg?.$mid) {
                        case 15 /* MarshalledId.TerminalContext */: return deserialize(arg);
                        default: {
                            // Do array transformation in place as this is a hot path
                            if (Array.isArray(arg)) {
                                for (let i = 0; i < arg.length; i++) {
                                    if (arg[i].$mid === 15 /* MarshalledId.TerminalContext */) {
                                        arg[i] = deserialize(arg[i]);
                                    }
                                    else {
                                        // Probably something else, so exit early
                                        break;
                                    }
                                }
                            }
                            return arg;
                        }
                    }
                }
            });
            this._register({
                dispose: () => {
                    for (const [_, terminalProcess] of this._terminalProcesses) {
                        terminalProcess.shutdown(true);
                    }
                }
            });
        }
        getDefaultShell(useAutomationShell) {
            const profile = useAutomationShell ? this._defaultAutomationProfile : this._defaultProfile;
            return profile?.path || '';
        }
        getDefaultShellArgs(useAutomationShell) {
            const profile = useAutomationShell ? this._defaultAutomationProfile : this._defaultProfile;
            return profile?.args || [];
        }
        createExtensionTerminal(options, internalOptions) {
            const terminal = new ExtHostTerminal(this._proxy, (0, uuid_1.generateUuid)(), options, options.name);
            const p = new ExtHostPseudoterminal(options.pty);
            terminal.createExtensionTerminal(options.location, internalOptions, this._serializeParentTerminal(options, internalOptions).resolvedExtHostIdentifier, asTerminalIcon(options.iconPath), asTerminalColor(options.color)).then(id => {
                const disposable = this._setupExtHostProcessListeners(id, p);
                this._terminalProcessDisposables[id] = disposable;
            });
            this._terminals.push(terminal);
            return terminal.value;
        }
        _serializeParentTerminal(options, internalOptions) {
            internalOptions = internalOptions ? internalOptions : {};
            if (options.location && typeof options.location === 'object' && 'parentTerminal' in options.location) {
                const parentTerminal = options.location.parentTerminal;
                if (parentTerminal) {
                    const parentExtHostTerminal = this._terminals.find(t => t.value === parentTerminal);
                    if (parentExtHostTerminal) {
                        internalOptions.resolvedExtHostIdentifier = parentExtHostTerminal._id;
                    }
                }
            }
            else if (options.location && typeof options.location !== 'object') {
                internalOptions.location = options.location;
            }
            else if (internalOptions.location && typeof internalOptions.location === 'object' && 'splitActiveTerminal' in internalOptions.location) {
                internalOptions.location = { splitActiveTerminal: true };
            }
            return internalOptions;
        }
        attachPtyToTerminal(id, pty) {
            const terminal = this.getTerminalById(id);
            if (!terminal) {
                throw new Error(`Cannot resolve terminal with id ${id} for virtual process`);
            }
            const p = new ExtHostPseudoterminal(pty);
            const disposable = this._setupExtHostProcessListeners(id, p);
            this._terminalProcessDisposables[id] = disposable;
        }
        async $acceptActiveTerminalChanged(id) {
            const original = this._activeTerminal;
            if (id === null) {
                this._activeTerminal = undefined;
                if (original !== this._activeTerminal) {
                    this._onDidChangeActiveTerminal.fire(this._activeTerminal);
                }
                return;
            }
            const terminal = this.getTerminalById(id);
            if (terminal) {
                this._activeTerminal = terminal;
                if (original !== this._activeTerminal) {
                    this._onDidChangeActiveTerminal.fire(this._activeTerminal.value);
                }
            }
        }
        async $acceptTerminalProcessData(id, data) {
            const terminal = this.getTerminalById(id);
            if (terminal) {
                this._onDidWriteTerminalData.fire({ terminal: terminal.value, data });
            }
        }
        async $acceptTerminalDimensions(id, cols, rows) {
            const terminal = this.getTerminalById(id);
            if (terminal) {
                if (terminal.setDimensions(cols, rows)) {
                    this._onDidChangeTerminalDimensions.fire({
                        terminal: terminal.value,
                        dimensions: terminal.value.dimensions
                    });
                }
            }
        }
        async $acceptDidExecuteCommand(id, command) {
            const terminal = this.getTerminalById(id);
            if (terminal) {
                this._onDidExecuteCommand.fire({ terminal: terminal.value, ...command });
            }
        }
        async $acceptTerminalMaximumDimensions(id, cols, rows) {
            // Extension pty terminal only - when virtual process resize fires it means that the
            // terminal's maximum dimensions changed
            this._terminalProcesses.get(id)?.resize(cols, rows);
        }
        async $acceptTerminalTitleChange(id, name) {
            const terminal = this.getTerminalById(id);
            if (terminal) {
                terminal.name = name;
            }
        }
        async $acceptTerminalClosed(id, exitCode, exitReason) {
            const index = this._getTerminalObjectIndexById(this._terminals, id);
            if (index !== null) {
                const terminal = this._terminals.splice(index, 1)[0];
                terminal.setExitStatus(exitCode, exitReason);
                this._onDidCloseTerminal.fire(terminal.value);
            }
        }
        $acceptTerminalOpened(id, extHostTerminalId, name, shellLaunchConfigDto) {
            if (extHostTerminalId) {
                // Resolve with the renderer generated id
                const index = this._getTerminalObjectIndexById(this._terminals, extHostTerminalId);
                if (index !== null) {
                    // The terminal has already been created (via createTerminal*), only fire the event
                    this._terminals[index]._id = id;
                    this._onDidOpenTerminal.fire(this.terminals[index]);
                    this._terminals[index].isOpen = true;
                    return;
                }
            }
            const creationOptions = {
                name: shellLaunchConfigDto.name,
                shellPath: shellLaunchConfigDto.executable,
                shellArgs: shellLaunchConfigDto.args,
                cwd: typeof shellLaunchConfigDto.cwd === 'string' ? shellLaunchConfigDto.cwd : uri_1.URI.revive(shellLaunchConfigDto.cwd),
                env: shellLaunchConfigDto.env,
                hideFromUser: shellLaunchConfigDto.hideFromUser
            };
            const terminal = new ExtHostTerminal(this._proxy, id, creationOptions, name);
            this._terminals.push(terminal);
            this._onDidOpenTerminal.fire(terminal.value);
            terminal.isOpen = true;
        }
        async $acceptTerminalProcessId(id, processId) {
            const terminal = this.getTerminalById(id);
            terminal?._setProcessId(processId);
        }
        async $startExtensionTerminal(id, initialDimensions) {
            // Make sure the ExtHostTerminal exists so onDidOpenTerminal has fired before we call
            // Pseudoterminal.start
            const terminal = this.getTerminalById(id);
            if (!terminal) {
                return { message: (0, nls_1.localize)('launchFail.idMissingOnExtHost', "Could not find the terminal with id {0} on the extension host", id) };
            }
            // Wait for onDidOpenTerminal to fire
            if (!terminal.isOpen) {
                await new Promise(r => {
                    // Ensure open is called after onDidOpenTerminal
                    const listener = this.onDidOpenTerminal(async (e) => {
                        if (e === terminal.value) {
                            listener.dispose();
                            r();
                        }
                    });
                });
            }
            const terminalProcess = this._terminalProcesses.get(id);
            if (terminalProcess) {
                terminalProcess.startSendingEvents(initialDimensions);
            }
            else {
                // Defer startSendingEvents call to when _setupExtHostProcessListeners is called
                this._extensionTerminalAwaitingStart[id] = { initialDimensions };
            }
            return undefined;
        }
        _setupExtHostProcessListeners(id, p) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(p.onProcessReady(e => this._proxy.$sendProcessReady(id, e.pid, e.cwd, e.windowsPty)));
            disposables.add(p.onDidChangeProperty(property => this._proxy.$sendProcessProperty(id, property)));
            // Buffer data events to reduce the amount of messages going to the renderer
            this._bufferer.startBuffering(id, p.onProcessData);
            disposables.add(p.onProcessExit(exitCode => this._onProcessExit(id, exitCode)));
            this._terminalProcesses.set(id, p);
            const awaitingStart = this._extensionTerminalAwaitingStart[id];
            if (awaitingStart && p instanceof ExtHostPseudoterminal) {
                p.startSendingEvents(awaitingStart.initialDimensions);
                delete this._extensionTerminalAwaitingStart[id];
            }
            return disposables;
        }
        $acceptProcessAckDataEvent(id, charCount) {
            this._terminalProcesses.get(id)?.acknowledgeDataEvent(charCount);
        }
        $acceptProcessInput(id, data) {
            this._terminalProcesses.get(id)?.input(data);
        }
        $acceptTerminalInteraction(id) {
            const terminal = this.getTerminalById(id);
            if (terminal?.setInteractedWith()) {
                this._onDidChangeTerminalState.fire(terminal.value);
            }
        }
        $acceptTerminalSelection(id, selection) {
            this.getTerminalById(id)?.setSelection(selection);
        }
        $acceptProcessResize(id, cols, rows) {
            try {
                this._terminalProcesses.get(id)?.resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
        }
        $acceptProcessShutdown(id, immediate) {
            this._terminalProcesses.get(id)?.shutdown(immediate);
        }
        $acceptProcessRequestInitialCwd(id) {
            this._terminalProcesses.get(id)?.getInitialCwd().then(initialCwd => this._proxy.$sendProcessProperty(id, { type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: initialCwd }));
        }
        $acceptProcessRequestCwd(id) {
            this._terminalProcesses.get(id)?.getCwd().then(cwd => this._proxy.$sendProcessProperty(id, { type: "cwd" /* ProcessPropertyType.Cwd */, value: cwd }));
        }
        $acceptProcessRequestLatency(id) {
            return Promise.resolve(id);
        }
        registerLinkProvider(provider) {
            this._linkProviders.add(provider);
            if (this._linkProviders.size === 1) {
                this._proxy.$startLinkProvider();
            }
            return new extHostTypes_1.Disposable(() => {
                this._linkProviders.delete(provider);
                if (this._linkProviders.size === 0) {
                    this._proxy.$stopLinkProvider();
                }
            });
        }
        registerProfileProvider(extension, id, provider) {
            if (this._profileProviders.has(id)) {
                throw new Error(`Terminal profile provider "${id}" already registered`);
            }
            this._profileProviders.set(id, provider);
            this._proxy.$registerProfileProvider(id, extension.identifier.value);
            return new extHostTypes_1.Disposable(() => {
                this._profileProviders.delete(id);
                this._proxy.$unregisterProfileProvider(id);
            });
        }
        registerTerminalQuickFixProvider(id, extensionId, provider) {
            if (this._quickFixProviders.has(id)) {
                throw new Error(`Terminal quick fix provider "${id}" is already registered`);
            }
            this._quickFixProviders.set(id, provider);
            this._proxy.$registerQuickFixProvider(id, extensionId);
            return new extHostTypes_1.Disposable(() => {
                this._quickFixProviders.delete(id);
                this._proxy.$unregisterQuickFixProvider(id);
            });
        }
        async $provideTerminalQuickFixes(id, matchResult) {
            const token = new cancellation_1.CancellationTokenSource().token;
            if (token.isCancellationRequested) {
                return;
            }
            const provider = this._quickFixProviders.get(id);
            if (!provider) {
                return;
            }
            const quickFixes = await provider.provideTerminalQuickFixes(matchResult, token);
            if (quickFixes === null || (Array.isArray(quickFixes) && quickFixes.length === 0)) {
                return undefined;
            }
            const store = new lifecycle_1.DisposableStore();
            this._lastQuickFixCommands.value = store;
            // Single
            if (!Array.isArray(quickFixes)) {
                return quickFixes ? extHostTypeConverters_1.TerminalQuickFix.from(quickFixes, this._extHostCommands.converter, store) : undefined;
            }
            // Many
            const result = [];
            for (const fix of quickFixes) {
                const converted = extHostTypeConverters_1.TerminalQuickFix.from(fix, this._extHostCommands.converter, store);
                if (converted) {
                    result.push(converted);
                }
            }
            return result;
        }
        async $createContributedProfileTerminal(id, options) {
            const token = new cancellation_1.CancellationTokenSource().token;
            let profile = await this._profileProviders.get(id)?.provideTerminalProfile(token);
            if (token.isCancellationRequested) {
                return;
            }
            if (profile && !('options' in profile)) {
                profile = { options: profile };
            }
            if (!profile || !('options' in profile)) {
                throw new Error(`No terminal profile options provided for id "${id}"`);
            }
            if ('pty' in profile.options) {
                this.createExtensionTerminal(profile.options, options);
                return;
            }
            this.createTerminalFromOptions(profile.options, options);
        }
        async $provideLinks(terminalId, line) {
            const terminal = this.getTerminalById(terminalId);
            if (!terminal) {
                return [];
            }
            // Discard any cached links the terminal has been holding, currently all links are released
            // when new links are provided.
            this._terminalLinkCache.delete(terminalId);
            const oldToken = this._terminalLinkCancellationSource.get(terminalId);
            oldToken?.dispose(true);
            const cancellationSource = new cancellation_1.CancellationTokenSource();
            this._terminalLinkCancellationSource.set(terminalId, cancellationSource);
            const result = [];
            const context = { terminal: terminal.value, line };
            const promises = [];
            for (const provider of this._linkProviders) {
                promises.push(async_1.Promises.withAsyncBody(async (r) => {
                    cancellationSource.token.onCancellationRequested(() => r({ provider, links: [] }));
                    const links = (await provider.provideTerminalLinks(context, cancellationSource.token)) || [];
                    if (!cancellationSource.token.isCancellationRequested) {
                        r({ provider, links });
                    }
                }));
            }
            const provideResults = await Promise.all(promises);
            if (cancellationSource.token.isCancellationRequested) {
                return [];
            }
            const cacheLinkMap = new Map();
            for (const provideResult of provideResults) {
                if (provideResult && provideResult.links.length > 0) {
                    result.push(...provideResult.links.map(providerLink => {
                        const link = {
                            id: nextLinkId++,
                            startIndex: providerLink.startIndex,
                            length: providerLink.length,
                            label: providerLink.tooltip
                        };
                        cacheLinkMap.set(link.id, {
                            provider: provideResult.provider,
                            link: providerLink
                        });
                        return link;
                    }));
                }
            }
            this._terminalLinkCache.set(terminalId, cacheLinkMap);
            return result;
        }
        $activateLink(terminalId, linkId) {
            const cachedLink = this._terminalLinkCache.get(terminalId)?.get(linkId);
            if (!cachedLink) {
                return;
            }
            cachedLink.provider.handleTerminalLink(cachedLink.link);
        }
        _onProcessExit(id, exitCode) {
            this._bufferer.stopBuffering(id);
            // Remove process reference
            this._terminalProcesses.delete(id);
            delete this._extensionTerminalAwaitingStart[id];
            // Clean up process disposables
            const processDiposable = this._terminalProcessDisposables[id];
            if (processDiposable) {
                processDiposable.dispose();
                delete this._terminalProcessDisposables[id];
            }
            // Send exit event to main side
            this._proxy.$sendProcessExit(id, exitCode);
        }
        getTerminalById(id) {
            return this._getTerminalObjectById(this._terminals, id);
        }
        getTerminalIdByApiObject(terminal) {
            const index = this._terminals.findIndex(item => {
                return item.value === terminal;
            });
            return index >= 0 ? index : null;
        }
        _getTerminalObjectById(array, id) {
            const index = this._getTerminalObjectIndexById(array, id);
            return index !== null ? array[index] : null;
        }
        _getTerminalObjectIndexById(array, id) {
            const index = array.findIndex(item => {
                return item._id === id;
            });
            return index >= 0 ? index : null;
        }
        getEnvironmentVariableCollection(extension) {
            let collection = this._environmentVariableCollections.get(extension.identifier.value);
            if (!collection) {
                collection = new UnifiedEnvironmentVariableCollection();
                this._setEnvironmentVariableCollection(extension.identifier.value, collection);
            }
            return collection.getScopedEnvironmentVariableCollection(undefined);
        }
        _syncEnvironmentVariableCollection(extensionIdentifier, collection) {
            const serialized = (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(collection.map);
            const serializedDescription = (0, environmentVariableShared_1.serializeEnvironmentDescriptionMap)(collection.descriptionMap);
            this._proxy.$setEnvironmentVariableCollection(extensionIdentifier, collection.persistent, serialized.length === 0 ? undefined : serialized, serializedDescription);
        }
        $initEnvironmentVariableCollections(collections) {
            collections.forEach(entry => {
                const extensionIdentifier = entry[0];
                const collection = new UnifiedEnvironmentVariableCollection(entry[1]);
                this._setEnvironmentVariableCollection(extensionIdentifier, collection);
            });
        }
        $acceptDefaultProfile(profile, automationProfile) {
            const oldProfile = this._defaultProfile;
            this._defaultProfile = profile;
            this._defaultAutomationProfile = automationProfile;
            if (oldProfile?.path !== profile.path) {
                this._onDidChangeShell.fire(profile.path);
            }
        }
        _setEnvironmentVariableCollection(extensionIdentifier, collection) {
            this._environmentVariableCollections.set(extensionIdentifier, collection);
            collection.onDidChangeCollection(() => {
                // When any collection value changes send this immediately, this is done to ensure
                // following calls to createTerminal will be created with the new environment. It will
                // result in more noise by sending multiple updates when called but collections are
                // expected to be small.
                this._syncEnvironmentVariableCollection(extensionIdentifier, collection);
            });
        }
    };
    exports.BaseExtHostTerminalService = BaseExtHostTerminalService;
    exports.BaseExtHostTerminalService = BaseExtHostTerminalService = __decorate([
        __param(1, extHostCommands_1.IExtHostCommands),
        __param(2, extHostRpcService_1.IExtHostRpcService)
    ], BaseExtHostTerminalService);
    /**
     * Unified environment variable collection carrying information for all scopes, for a specific extension.
     */
    class UnifiedEnvironmentVariableCollection {
        get persistent() { return this._persistent; }
        set persistent(value) {
            this._persistent = value;
            this._onDidChangeCollection.fire();
        }
        get onDidChangeCollection() { return this._onDidChangeCollection && this._onDidChangeCollection.event; }
        constructor(serialized) {
            this.map = new Map();
            this.scopedCollections = new Map();
            this.descriptionMap = new Map();
            this._persistent = true;
            this._onDidChangeCollection = new event_1.Emitter();
            this.map = new Map(serialized);
        }
        getScopedEnvironmentVariableCollection(scope) {
            const scopedCollectionKey = this.getScopeKey(scope);
            let scopedCollection = this.scopedCollections.get(scopedCollectionKey);
            if (!scopedCollection) {
                scopedCollection = new ScopedEnvironmentVariableCollection(this, scope);
                this.scopedCollections.set(scopedCollectionKey, scopedCollection);
                scopedCollection.onDidChangeCollection(() => this._onDidChangeCollection.fire());
            }
            return scopedCollection;
        }
        replace(variable, value, options, scope) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Replace, options: options ?? { applyAtProcessCreation: true }, scope });
        }
        append(variable, value, options, scope) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Append, options: options ?? { applyAtProcessCreation: true }, scope });
        }
        prepend(variable, value, options, scope) {
            this._setIfDiffers(variable, { value, type: extHostTypes_1.EnvironmentVariableMutatorType.Prepend, options: options ?? { applyAtProcessCreation: true }, scope });
        }
        _setIfDiffers(variable, mutator) {
            if (mutator.options && mutator.options.applyAtProcessCreation === false && !mutator.options.applyAtShellIntegration) {
                throw new Error('EnvironmentVariableMutatorOptions must apply at either process creation or shell integration');
            }
            const key = this.getKey(variable, mutator.scope);
            const current = this.map.get(key);
            const newOptions = mutator.options ? {
                applyAtProcessCreation: mutator.options.applyAtProcessCreation ?? false,
                applyAtShellIntegration: mutator.options.applyAtShellIntegration ?? false,
            } : {
                applyAtProcessCreation: true
            };
            if (!current ||
                current.value !== mutator.value ||
                current.type !== mutator.type ||
                current.options?.applyAtProcessCreation !== newOptions.applyAtProcessCreation ||
                current.options?.applyAtShellIntegration !== newOptions.applyAtShellIntegration ||
                current.scope?.workspaceFolder?.index !== mutator.scope?.workspaceFolder?.index) {
                const key = this.getKey(variable, mutator.scope);
                const value = {
                    variable,
                    ...mutator,
                    options: newOptions
                };
                this.map.set(key, value);
                this._onDidChangeCollection.fire();
            }
        }
        get(variable, scope) {
            const key = this.getKey(variable, scope);
            const value = this.map.get(key);
            // TODO: Set options to defaults if needed
            return value ? convertMutator(value) : undefined;
        }
        getKey(variable, scope) {
            const scopeKey = this.getScopeKey(scope);
            return scopeKey.length ? `${variable}:::${scopeKey}` : variable;
        }
        getScopeKey(scope) {
            return this.getWorkspaceKey(scope?.workspaceFolder) ?? '';
        }
        getWorkspaceKey(workspaceFolder) {
            return workspaceFolder ? workspaceFolder.uri.toString() : undefined;
        }
        getVariableMap(scope) {
            const map = new Map();
            for (const [_, value] of this.map) {
                if (this.getScopeKey(value.scope) === this.getScopeKey(scope)) {
                    map.set(value.variable, convertMutator(value));
                }
            }
            return map;
        }
        delete(variable, scope) {
            const key = this.getKey(variable, scope);
            this.map.delete(key);
            this._onDidChangeCollection.fire();
        }
        clear(scope) {
            if (scope?.workspaceFolder) {
                for (const [key, mutator] of this.map) {
                    if (mutator.scope?.workspaceFolder?.index === scope.workspaceFolder.index) {
                        this.map.delete(key);
                    }
                }
                this.clearDescription(scope);
            }
            else {
                this.map.clear();
                this.descriptionMap.clear();
            }
            this._onDidChangeCollection.fire();
        }
        setDescription(description, scope) {
            const key = this.getScopeKey(scope);
            const current = this.descriptionMap.get(key);
            if (!current || current.description !== description) {
                let descriptionStr;
                if (typeof description === 'string') {
                    descriptionStr = description;
                }
                else {
                    // Only take the description before the first `\n\n`, so that the description doesn't mess up the UI
                    descriptionStr = description?.value.split('\n\n')[0];
                }
                const value = { description: descriptionStr, scope };
                this.descriptionMap.set(key, value);
                this._onDidChangeCollection.fire();
            }
        }
        getDescription(scope) {
            const key = this.getScopeKey(scope);
            return this.descriptionMap.get(key)?.description;
        }
        clearDescription(scope) {
            const key = this.getScopeKey(scope);
            this.descriptionMap.delete(key);
        }
    }
    class ScopedEnvironmentVariableCollection {
        get persistent() { return this.collection.persistent; }
        set persistent(value) {
            this.collection.persistent = value;
        }
        get onDidChangeCollection() { return this._onDidChangeCollection && this._onDidChangeCollection.event; }
        constructor(collection, scope) {
            this.collection = collection;
            this.scope = scope;
            this._onDidChangeCollection = new event_1.Emitter();
        }
        getScoped(scope) {
            return this.collection.getScopedEnvironmentVariableCollection(scope);
        }
        replace(variable, value, options) {
            this.collection.replace(variable, value, options, this.scope);
        }
        append(variable, value, options) {
            this.collection.append(variable, value, options, this.scope);
        }
        prepend(variable, value, options) {
            this.collection.prepend(variable, value, options, this.scope);
        }
        get(variable) {
            return this.collection.get(variable, this.scope);
        }
        forEach(callback, thisArg) {
            this.collection.getVariableMap(this.scope).forEach((value, variable) => callback.call(thisArg, variable, value, this), this.scope);
        }
        [Symbol.iterator]() {
            return this.collection.getVariableMap(this.scope).entries();
        }
        delete(variable) {
            this.collection.delete(variable, this.scope);
            this._onDidChangeCollection.fire(undefined);
        }
        clear() {
            this.collection.clear(this.scope);
        }
        set description(description) {
            this.collection.setDescription(description, this.scope);
        }
        get description() {
            return this.collection.getDescription(this.scope);
        }
    }
    let WorkerExtHostTerminalService = class WorkerExtHostTerminalService extends BaseExtHostTerminalService {
        constructor(extHostCommands, extHostRpc) {
            super(false, extHostCommands, extHostRpc);
        }
        createTerminal(name, shellPath, shellArgs) {
            throw new errors_1.NotSupportedError();
        }
        createTerminalFromOptions(options, internalOptions) {
            throw new errors_1.NotSupportedError();
        }
    };
    exports.WorkerExtHostTerminalService = WorkerExtHostTerminalService;
    exports.WorkerExtHostTerminalService = WorkerExtHostTerminalService = __decorate([
        __param(0, extHostCommands_1.IExtHostCommands),
        __param(1, extHostRpcService_1.IExtHostRpcService)
    ], WorkerExtHostTerminalService);
    function asTerminalIcon(iconPath) {
        if (!iconPath || typeof iconPath === 'string') {
            return undefined;
        }
        if (!('id' in iconPath)) {
            return iconPath;
        }
        return {
            id: iconPath.id,
            color: iconPath.color
        };
    }
    function asTerminalColor(color) {
        return themables_1.ThemeColor.isThemeColor(color) ? color : undefined;
    }
    function convertMutator(mutator) {
        const newMutator = { ...mutator };
        delete newMutator.scope;
        newMutator.options = newMutator.options ?? undefined;
        delete newMutator.variable;
        return newMutator;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRlcm1pbmFsU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9jb21tb24vZXh0SG9zdFRlcm1pbmFsU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwRW5GLFFBQUEsdUJBQXVCLEdBQUcsSUFBQSwrQkFBZSxFQUEwQix5QkFBeUIsQ0FBQyxDQUFDO0lBRTNHLE1BQWEsZUFBZ0IsU0FBUSxzQkFBVTtRQW1COUMsWUFDUyxNQUFzQyxFQUN2QyxHQUE4QixFQUNwQixnQkFBMEUsRUFDbkYsS0FBYztZQUV0QixLQUFLLEVBQUUsQ0FBQztZQUxBLFdBQU0sR0FBTixNQUFNLENBQWdDO1lBQ3ZDLFFBQUcsR0FBSCxHQUFHLENBQTJCO1lBQ3BCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBMEQ7WUFDbkYsVUFBSyxHQUFMLEtBQUssQ0FBUztZQXRCZixjQUFTLEdBQVksS0FBSyxDQUFDO1lBTTNCLFdBQU0sR0FBeUIsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsQ0FBQztZQUs1RCxXQUFNLEdBQVksS0FBSyxDQUFDO1lBSVosbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMvRCxrQkFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO1lBVWxELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxPQUFPLENBQXFCLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBRXRGLE1BQU0s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