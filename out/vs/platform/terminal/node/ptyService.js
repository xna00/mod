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
define(["require", "exports", "child_process", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/node/shell", "vs/platform/log/common/log", "vs/platform/terminal/common/requestStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalDataBuffering", "vs/platform/terminal/common/terminalEnvironment", "@xterm/headless", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/terminal/node/terminalProcess", "vs/nls", "vs/platform/terminal/node/childProcessMonitor", "vs/platform/terminal/common/terminalAutoResponder", "vs/base/common/errors", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/terminal/common/terminalStrings", "path", "vs/base/common/decorators", "vs/base/common/performance"], function (require, exports, child_process_1, async_1, event_1, lifecycle_1, platform_1, shell_1, log_1, requestStore_1, terminal_1, terminalDataBuffering_1, terminalEnvironment_1, headless_1, terminalEnvironment_2, terminalProcess_1, nls_1, childProcessMonitor_1, terminalAutoResponder_1, errors_1, shellIntegrationAddon_1, terminalStrings_1, path_1, decorators_1, performance) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PtyService = void 0;
    exports.traceRpc = traceRpc;
    function traceRpc(_target, key, descriptor) {
        if (typeof descriptor.value !== 'function') {
            throw new Error('not supported');
        }
        const fnKey = 'value';
        const fn = descriptor.value;
        descriptor[fnKey] = async function (...args) {
            if (this.traceRpcArgs.logService.getLevel() === log_1.LogLevel.Trace) {
                this.traceRpcArgs.logService.trace(`[RPC Request] PtyService#${fn.name}(${args.map(e => JSON.stringify(e)).join(', ')})`);
            }
            if (this.traceRpcArgs.simulatedLatency) {
                await (0, async_1.timeout)(this.traceRpcArgs.simulatedLatency);
            }
            let result;
            try {
                result = await fn.apply(this, args);
            }
            catch (e) {
                this.traceRpcArgs.logService.error(`[RPC Response] PtyService#${fn.name}`, e);
                throw e;
            }
            if (this.traceRpcArgs.logService.getLevel() === log_1.LogLevel.Trace) {
                this.traceRpcArgs.logService.trace(`[RPC Response] PtyService#${fn.name}`, result);
            }
            return result;
        };
    }
    let SerializeAddon;
    let Unicode11Addon;
    class PtyService extends lifecycle_1.Disposable {
        _traceEvent(name, event) {
            event(e => {
                if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                    this._logService.trace(`[RPC Event] PtyService#${name}.fire(${JSON.stringify(e)})`);
                }
            });
            return event;
        }
        get traceRpcArgs() {
            return {
                logService: this._logService,
                simulatedLatency: this._simulatedLatency
            };
        }
        constructor(_logService, _productService, _reconnectConstants, _simulatedLatency) {
            super();
            this._logService = _logService;
            this._productService = _productService;
            this._reconnectConstants = _reconnectConstants;
            this._simulatedLatency = _simulatedLatency;
            this._ptys = new Map();
            this._workspaceLayoutInfos = new Map();
            this._revivedPtyIdMap = new Map();
            this._autoReplies = new Map();
            this._lastPtyId = 0;
            this._onHeartbeat = this._register(new event_1.Emitter());
            this.onHeartbeat = this._traceEvent('_onHeartbeat', this._onHeartbeat.event);
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._traceEvent('_onProcessData', this._onProcessData.event);
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._traceEvent('_onProcessReplay', this._onProcessReplay.event);
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._traceEvent('_onProcessReady', this._onProcessReady.event);
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._traceEvent('_onProcessExit', this._onProcessExit.event);
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._traceEvent('_onProcessOrphanQuestion', this._onProcessOrphanQuestion.event);
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._traceEvent('_onDidRequestDetach', this._onDidRequestDetach.event);
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._traceEvent('_onDidChangeProperty', this._onDidChangeProperty.event);
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const pty of this._ptys.values()) {
                    pty.shutdown(true);
                }
                this._ptys.clear();
            }));
            this._detachInstanceRequestStore = this._register(new requestStore_1.RequestStore(undefined, this._logService));
            this._detachInstanceRequestStore.onCreateRequest(this._onDidRequestDetach.fire, this._onDidRequestDetach);
        }
        async refreshIgnoreProcessNames(names) {
            childProcessMonitor_1.ignoreProcessNames.length = 0;
            childProcessMonitor_1.ignoreProcessNames.push(...names);
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._detachInstanceRequestStore.createRequest({ workspaceId, instanceId });
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            let processDetails = undefined;
            const pty = this._ptys.get(persistentProcessId);
            if (pty) {
                processDetails = await this._buildProcessDetails(persistentProcessId, pty);
            }
            this._detachInstanceRequestStore.acceptReply(requestId, processDetails);
        }
        async freePortKillProcess(port) {
            const stdout = await new Promise((resolve, reject) => {
                (0, child_process_1.exec)(platform_1.isWindows ? `netstat -ano | findstr "${port}"` : `lsof -nP -iTCP -sTCP:LISTEN | grep ${port}`, {}, (err, stdout) => {
                    if (err) {
                        return reject('Problem occurred when listing active processes');
                    }
                    resolve(stdout);
                });
            });
            const processesForPort = stdout.split(/\r?\n/).filter(s => !!s.trim());
            if (processesForPort.length >= 1) {
                const capturePid = /\s+(\d+)(?:\s+|$)/;
                const processId = processesForPort[0].match(capturePid)?.[1];
                if (processId) {
                    try {
                        process.kill(Number.parseInt(processId));
                    }
                    catch { }
                }
                else {
                    throw new Error(`Processes for port ${port} were not found`);
                }
                return { port, processId };
            }
            throw new Error(`Could not kill process with port ${port}`);
        }
        async serializeTerminalState(ids) {
            const promises = [];
            for (const [persistentProcessId, persistentProcess] of this._ptys.entries()) {
                // Only serialize persistent processes that have had data written or performed a replay
                if (persistentProcess.hasWrittenData && ids.indexOf(persistentProcessId) !== -1) {
                    promises.push(async_1.Promises.withAsyncBody(async (r) => {
                        r({
                            id: persistentProcessId,
                            shellLaunchConfig: persistentProcess.shellLaunchConfig,
                            processDetails: await this._buildProcessDetails(persistentProcessId, persistentProcess),
                            processLaunchConfig: persistentProcess.processLaunchOptions,
                            unicodeVersion: persistentProcess.unicodeVersion,
                            replayEvent: await persistentProcess.serializeNormalBuffer(),
                            timestamp: Date.now()
                        });
                    }));
                }
            }
            const serialized = {
                version: 1,
                state: await Promise.all(promises)
            };
            return JSON.stringify(serialized);
        }
        async reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocale) {
            const promises = [];
            for (const terminal of state) {
                promises.push(this._reviveTerminalProcess(workspaceId, terminal));
            }
            await Promise.all(promises);
        }
        async _reviveTerminalProcess(workspaceId, terminal) {
            const restoreMessage = (0, nls_1.localize)('terminal-history-restored', "History restored");
            // TODO: We may at some point want to show date information in a hover via a custom sequence:
            //   new Date(terminal.timestamp).toLocaleDateString(dateTimeFormatLocale)
            //   new Date(terminal.timestamp).toLocaleTimeString(dateTimeFormatLocale)
            const newId = await this.createProcess({
                ...terminal.shellLaunchConfig,
                cwd: terminal.processDetails.cwd,
                color: terminal.processDetails.color,
                icon: terminal.processDetails.icon,
                name: terminal.processDetails.titleSource === terminal_1.TitleEventSource.Api ? terminal.processDetails.title : undefined,
                initialText: terminal.replayEvent.events[0].data + (0, terminalStrings_1.formatMessageForTerminal)(restoreMessage, { loudFormatting: true })
            }, terminal.processDetails.cwd, terminal.replayEvent.events[0].cols, terminal.replayEvent.events[0].rows, terminal.unicodeVersion, terminal.processLaunchConfig.env, terminal.processLaunchConfig.executableEnv, terminal.processLaunchConfig.options, true, terminal.processDetails.workspaceId, terminal.processDetails.workspaceName, true, terminal.replayEvent.events[0].data);
            // Don't start the process here as there's no terminal to answer CPR
            const oldId = this._getRevivingProcessId(workspaceId, terminal.id);
            this._revivedPtyIdMap.set(oldId, { newId, state: terminal });
            this._logService.info(`Revived process, old id ${oldId} -> new id ${newId}`);
        }
        async shutdownAll() {
            this.dispose();
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName, isReviving, rawReviveBuffer) {
            if (shellLaunchConfig.attachPersistentProcess) {
                throw new Error('Attempt to create a process when attach object was provided');
            }
            const id = ++this._lastPtyId;
            const process = new terminalProcess_1.TerminalProcess(shellLaunchConfig, cwd, cols, rows, env, executableEnv, options, this._logService, this._productService);
            const processLaunchOptions = {
                env,
                executableEnv,
                options
            };
            const persistentProcess = new PersistentTerminalProcess(id, process, workspaceId, workspaceName, shouldPersist, cols, rows, processLaunchOptions, unicodeVersion, this._reconnectConstants, this._logService, isReviving && typeof shellLaunchConfig.initialText === 'string' ? shellLaunchConfig.initialText : undefined, rawReviveBuffer, shellLaunchConfig.icon, shellLaunchConfig.color, shellLaunchConfig.name, shellLaunchConfig.fixedDimensions);
            process.onProcessExit(event => {
                persistentProcess.dispose();
                this._ptys.delete(id);
                this._onProcessExit.fire({ id, event });
            });
            persistentProcess.onProcessData(event => this._onProcessData.fire({ id, event }));
            persistentProcess.onProcessReplay(event => this._onProcessReplay.fire({ id, event }));
            persistentProcess.onProcessReady(event => this._onProcessReady.fire({ id, event }));
            persistentProcess.onProcessOrphanQuestion(() => this._onProcessOrphanQuestion.fire({ id }));
            persistentProcess.onDidChangeProperty(property => this._onDidChangeProperty.fire({ id, property }));
            persistentProcess.onPersistentProcessReady(() => {
                for (const e of this._autoReplies.entries()) {
                    persistentProcess.installAutoReply(e[0], e[1]);
                }
            });
            this._ptys.set(id, persistentProcess);
            return id;
        }
        async attachToProcess(id) {
            try {
                await this._throwIfNoPty(id).attach();
                this._logService.info(`Persistent process reconnection "${id}"`);
            }
            catch (e) {
                this._logService.warn(`Persistent process reconnection "${id}" failed`, e.message);
                throw e;
            }
        }
        async updateTitle(id, title, titleSource) {
            this._throwIfNoPty(id).setTitle(title, titleSource);
        }
        async updateIcon(id, userInitiated, icon, color) {
            this._throwIfNoPty(id).setIcon(userInitiated, icon, color);
        }
        async clearBuffer(id) {
            this._throwIfNoPty(id).clearBuffer();
        }
        async refreshProperty(id, type) {
            return this._throwIfNoPty(id).refreshProperty(type);
        }
        async updateProperty(id, type, value) {
            return this._throwIfNoPty(id).updateProperty(type, value);
        }
        async detachFromProcess(id, forcePersist) {
            return this._throwIfNoPty(id).detach(forcePersist);
        }
        async reduceConnectionGraceTime() {
            for (const pty of this._ptys.values()) {
                pty.reduceGraceTime();
            }
        }
        async listProcesses() {
            const persistentProcesses = Array.from(this._ptys.entries()).filter(([_, pty]) => pty.shouldPersistTerminal);
            this._logService.info(`Listing ${persistentProcesses.length} persistent terminals, ${this._ptys.size} total terminals`);
            const promises = persistentProcesses.map(async ([id, terminalProcessData]) => this._buildProcessDetails(id, terminalProcessData));
            const allTerminals = await Promise.all(promises);
            return allTerminals.filter(entry => entry.isOrphan);
        }
        async getPerformanceMarks() {
            return performance.getMarks();
        }
        async start(id) {
            const pty = this._ptys.get(id);
            return pty ? pty.start() : { message: `Could not find pty with id "${id}"` };
        }
        async shutdown(id, immediate) {
            // Don't throw if the pty is already shutdown
            return this._ptys.get(id)?.shutdown(immediate);
        }
        async input(id, data) {
            return this._throwIfNoPty(id).input(data);
        }
        async processBinary(id, data) {
            return this._throwIfNoPty(id).writeBinary(data);
        }
        async resize(id, cols, rows) {
            return this._throwIfNoPty(id).resize(cols, rows);
        }
        async getInitialCwd(id) {
            return this._throwIfNoPty(id).getInitialCwd();
        }
        async getCwd(id) {
            return this._throwIfNoPty(id).getCwd();
        }
        async acknowledgeDataEvent(id, charCount) {
            return this._throwIfNoPty(id).acknowledgeDataEvent(charCount);
        }
        async setUnicodeVersion(id, version) {
            return this._throwIfNoPty(id).setUnicodeVersion(version);
        }
        async getLatency() {
            return [];
        }
        async orphanQuestionReply(id) {
            return this._throwIfNoPty(id).orphanQuestionReply();
        }
        async installAutoReply(match, reply) {
            this._autoReplies.set(match, reply);
            // If the auto reply exists on any existing terminals it will be overridden
            for (const p of this._ptys.values()) {
                p.installAutoReply(match, reply);
            }
        }
        async uninstallAllAutoReplies() {
            for (const match of this._autoReplies.keys()) {
                for (const p of this._ptys.values()) {
                    p.uninstallAutoReply(match);
                }
            }
        }
        async uninstallAutoReply(match) {
            for (const p of this._ptys.values()) {
                p.uninstallAutoReply(match);
            }
        }
        async getDefaultSystemShell(osOverride = platform_1.OS) {
            return (0, shell_1.getSystemShell)(osOverride, process.env);
        }
        async getEnvironment() {
            return { ...process.env };
        }
        async getWslPath(original, direction) {
            if (direction === 'win-to-unix') {
                if (!platform_1.isWindows) {
                    return original;
                }
                if ((0, terminalEnvironment_2.getWindowsBuildNumber)() < 17063) {
                    return original.replace(/\\/g, '/');
                }
                const wslExecutable = this._getWSLExecutablePath();
                if (!wslExecutable) {
                    return original;
                }
                return new Promise(c => {
                    const proc = (0, child_process_1.execFile)(wslExecutable, ['-e', 'wslpath', original], {}, (error, stdout, stderr) => {
                        c(error ? original : (0, terminalEnvironment_1.escapeNonWindowsPath)(stdout.trim()));
                    });
                    proc.stdin.end();
                });
            }
            if (direction === 'unix-to-win') {
                // The backend is Windows, for example a local Windows workspace with a wsl session in
                // the terminal.
                if (platform_1.isWindows) {
                    if ((0, terminalEnvironment_2.getWindowsBuildNumber)() < 17063) {
                        return original;
                    }
                    const wslExecutable = this._getWSLExecutablePath();
                    if (!wslExecutable) {
                        return original;
                    }
                    return new Promise(c => {
                        const proc = (0, child_process_1.execFile)(wslExecutable, ['-e', 'wslpath', '-w', original], {}, (error, stdout, stderr) => {
                            c(error ? original : stdout.trim());
                        });
                        proc.stdin.end();
                    });
                }
            }
            // Fallback just in case
            return original;
        }
        _getWSLExecutablePath() {
            const useWSLexe = (0, terminalEnvironment_2.getWindowsBuildNumber)() >= 16299;
            const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
            const systemRoot = process.env['SystemRoot'];
            if (systemRoot) {
                return (0, path_1.join)(systemRoot, is32ProcessOn64Windows ? 'Sysnative' : 'System32', useWSLexe ? 'wsl.exe' : 'bash.exe');
            }
            return undefined;
        }
        async getRevivedPtyNewId(workspaceId, id) {
            try {
                return this._revivedPtyIdMap.get(this._getRevivingProcessId(workspaceId, id))?.newId;
            }
            catch (e) {
                this._logService.warn(`Couldn't find terminal ID ${workspaceId}-${id}`, e.message);
            }
            return undefined;
        }
        async setTerminalLayoutInfo(args) {
            this._workspaceLayoutInfos.set(args.workspaceId, args);
        }
        async getTerminalLayoutInfo(args) {
            performance.mark('code/willGetTerminalLayoutInfo');
            const layout = this._workspaceLayoutInfos.get(args.workspaceId);
            if (layout) {
                const doneSet = new Set();
                const expandedTabs = await Promise.all(layout.tabs.map(async (tab) => this._expandTerminalTab(args.workspaceId, tab, doneSet)));
                const tabs = expandedTabs.filter(t => t.terminals.length > 0);
                performance.mark('code/didGetTerminalLayoutInfo');
                return { tabs };
            }
            performance.mark('code/didGetTerminalLayoutInfo');
            return undefined;
        }
        async _expandTerminalTab(workspaceId, tab, doneSet) {
            const expandedTerminals = (await Promise.all(tab.terminals.map(t => this._expandTerminalInstance(workspaceId, t, doneSet))));
            const filtered = expandedTerminals.filter(term => term.terminal !== null);
            return {
                isActive: tab.isActive,
                activePersistentProcessId: tab.activePersistentProcessId,
                terminals: filtered
            };
        }
        async _expandTerminalInstance(workspaceId, t, doneSet) {
            try {
                const oldId = this._getRevivingProcessId(workspaceId, t.terminal);
                const revivedPtyId = this._revivedPtyIdMap.get(oldId)?.newId;
                this._logService.info(`Expanding terminal instance, old id ${oldId} -> new id ${revivedPtyId}`);
                this._revivedPtyIdMap.delete(oldId);
                const persistentProcessId = revivedPtyId ?? t.terminal;
                if (doneSet.has(persistentProcessId)) {
                    throw new Error(`Terminal ${persistentProcessId} has already been expanded`);
                }
                doneSet.add(persistentProcessId);
                const persistentProcess = this._throwIfNoPty(persistentProcessId);
                const processDetails = persistentProcess && await this._buildProcessDetails(t.terminal, persistentProcess, revivedPtyId !== undefined);
                return {
                    terminal: { ...processDetails, id: persistentProcessId },
                    relativeSize: t.relativeSize
                };
            }
            catch (e) {
                this._logService.warn(`Couldn't get layout info, a terminal was probably disconnected`, e.message);
                this._logService.debug('Reattach to wrong terminal debug info - layout info by id', t);
                this._logService.debug('Reattach to wrong terminal debug info - _revivePtyIdMap', Array.from(this._revivedPtyIdMap.values()));
                this._logService.debug('Reattach to wrong terminal debug info - _ptys ids', Array.from(this._ptys.keys()));
                // this will be filtered out and not reconnected
                return {
                    terminal: null,
                    relativeSize: t.relativeSize
                };
            }
        }
        _getRevivingProcessId(workspaceId, ptyId) {
            return `${workspaceId}-${ptyId}`;
        }
        async _buildProcessDetails(id, persistentProcess, wasRevived = false) {
            performance.mark(`code/willBuildProcessDetails/${id}`);
            // If the process was just revived, don't do the orphan check as it will
            // take some time
            const [cwd, isOrphan] = await Promise.all([persistentProcess.getCwd(), wasRevived ? true : persistentProcess.isOrphaned()]);
            const result = {
                id,
                title: persistentProcess.title,
                titleSource: persistentProcess.titleSource,
                pid: persistentProcess.pid,
                workspaceId: persistentProcess.workspaceId,
                workspaceName: persistentProcess.workspaceName,
                cwd,
                isOrphan,
                icon: persistentProcess.icon,
                color: persistentProcess.color,
                fixedDimensions: persistentProcess.fixedDimensions,
                environmentVariableCollections: persistentProcess.processLaunchOptions.options.environmentVariableCollections,
                reconnectionProperties: persistentProcess.shellLaunchConfig.reconnectionProperties,
                waitOnExit: persistentProcess.shellLaunchConfig.waitOnExit,
                hideFromUser: persistentProcess.shellLaunchConfig.hideFromUser,
                isFeatureTerminal: persistentProcess.shellLaunchConfig.isFeatureTerminal,
                type: persistentProcess.shellLaunchConfig.type,
                hasChildProcesses: persistentProcess.hasChildProcesses,
                shellIntegrationNonce: persistentProcess.processLaunchOptions.options.shellIntegration.nonce
            };
            performance.mark(`code/didBuildProcessDetails/${id}`);
            return result;
        }
        _throwIfNoPty(id) {
            const pty = this._ptys.get(id);
            if (!pty) {
                throw new errors_1.ErrorNoTelemetry(`Could not find pty on pty host`);
            }
            return pty;
        }
    }
    exports.PtyService = PtyService;
    __decorate([
        decorators_1.memoize
    ], PtyService.prototype, "traceRpcArgs", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "refreshIgnoreProcessNames", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "requestDetachInstance", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "acceptDetachInstanceReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "freePortKillProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "serializeTerminalState", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "reviveTerminalProcesses", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "shutdownAll", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "createProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "attachToProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "updateTitle", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "updateIcon", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "clearBuffer", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "refreshProperty", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "updateProperty", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "detachFromProcess", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "reduceConnectionGraceTime", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "listProcesses", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getPerformanceMarks", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "start", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "shutdown", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "input", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "processBinary", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "resize", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getInitialCwd", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getCwd", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "acknowledgeDataEvent", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "setUnicodeVersion", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getLatency", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "orphanQuestionReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "installAutoReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "uninstallAllAutoReplies", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "uninstallAutoReply", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getDefaultSystemShell", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getEnvironment", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getWslPath", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getRevivedPtyNewId", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "setTerminalLayoutInfo", null);
    __decorate([
        traceRpc
    ], PtyService.prototype, "getTerminalLayoutInfo", null);
    var InteractionState;
    (function (InteractionState) {
        /** The terminal has not been interacted with. */
        InteractionState["None"] = "None";
        /** The terminal has only been interacted with by the replay mechanism. */
        InteractionState["ReplayOnly"] = "ReplayOnly";
        /** The terminal has been directly interacted with this session. */
        InteractionState["Session"] = "Session";
    })(InteractionState || (InteractionState = {}));
    class PersistentTerminalProcess extends lifecycle_1.Disposable {
        get pid() { return this._pid; }
        get shellLaunchConfig() { return this._terminalProcess.shellLaunchConfig; }
        get hasWrittenData() { return this._interactionState.value !== "None" /* InteractionState.None */; }
        get title() { return this._title || this._terminalProcess.currentTitle; }
        get titleSource() { return this._titleSource; }
        get icon() { return this._icon; }
        get color() { return this._color; }
        get fixedDimensions() { return this._fixedDimensions; }
        get hasChildProcesses() { return this._terminalProcess.hasChildProcesses; }
        setTitle(title, titleSource) {
            if (titleSource === terminal_1.TitleEventSource.Api) {
                this._interactionState.setValue("Session" /* InteractionState.Session */, 'setTitle');
                this._serializer.freeRawReviveBuffer();
            }
            this._title = title;
            this._titleSource = titleSource;
        }
        setIcon(userInitiated, icon, color) {
            if (!this._icon || 'id' in icon && 'id' in this._icon && icon.id !== this._icon.id ||
                !this.color || color !== this._color) {
                this._serializer.freeRawReviveBuffer();
                if (userInitiated) {
                    this._interactionState.setValue("Session" /* InteractionState.Session */, 'setIcon');
                }
            }
            this._icon = icon;
            this._color = color;
        }
        _setFixedDimensions(fixedDimensions) {
            this._fixedDimensions = fixedDimensions;
        }
        constructor(_persistentProcessId, _terminalProcess, workspaceId, workspaceName, shouldPersistTerminal, cols, rows, processLaunchOptions, unicodeVersion, reconnectConstants, _logService, reviveBuffer, rawReviveBuffer, _icon, _color, name, fixedDimensions) {
            super();
            this._persistentProcessId = _persistentProcessId;
            this._terminalProcess = _terminalProcess;
            this.workspaceId = workspaceId;
            this.workspaceName = workspaceName;
            this.shouldPersistTerminal = shouldPersistTerminal;
            this.processLaunchOptions = processLaunchOptions;
            this.unicodeVersion = unicodeVersion;
            this._logService = _logService;
            this._icon = _icon;
            this._color = _color;
            this._autoReplies = new Map();
            this._pendingCommands = new Map();
            this._isStarted = false;
            this._orphanRequestQueue = new async_1.Queue();
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onPersistentProcessReady = this._register(new event_1.Emitter());
            /** Fired when the persistent process has a ready process and has finished its replay. */
            this.onPersistentProcessReady = this._onPersistentProcessReady.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._inReplay = false;
            this._pid = -1;
            this._cwd = '';
            this._titleSource = terminal_1.TitleEventSource.Process;
            this._interactionState = new MutationLogger(`Persistent process "${this._persistentProcessId}" interaction state`, "None" /* InteractionState.None */, this._logService);
            this._wasRevived = reviveBuffer !== undefined;
            this._serializer = new XtermSerializer(cols, rows, reconnectConstants.scrollback, unicodeVersion, reviveBuffer, processLaunchOptions.options.shellIntegration.nonce, shouldPersistTerminal ? rawReviveBuffer : undefined, this._logService);
            if (name) {
                this.setTitle(name, terminal_1.TitleEventSource.Api);
            }
            this._fixedDimensions = fixedDimensions;
            this._orphanQuestionBarrier = null;
            this._orphanQuestionReplyTime = 0;
            this._disconnectRunner1 = this._register(new async_1.ProcessTimeRunOnceScheduler(() => {
                this._logService.info(`Persistent process "${this._persistentProcessId}": The reconnection grace time of ${printTime(reconnectConstants.graceTime)} has expired, shutting down pid "${this._pid}"`);
                this.shutdown(true);
            }, reconnectConstants.graceTime));
            this._disconnectRunner2 = this._register(new async_1.ProcessTimeRunOnceScheduler(() => {
                this._logService.info(`Persistent process "${this._persistentProcessId}": The short reconnection grace time of ${printTime(reconnectConstants.shortGraceTime)} has expired, shutting down pid ${this._pid}`);
                this.shutdown(true);
            }, reconnectConstants.shortGraceTime));
            this._register(this._terminalProcess.onProcessExit(() => this._bufferer.stopBuffering(this._persistentProcessId)));
            this._register(this._terminalProcess.onProcessReady(e => {
                this._pid = e.pid;
                this._cwd = e.cwd;
                this._onProcessReady.fire(e);
            }));
            this._register(this._terminalProcess.onDidChangeProperty(e => {
                this._onDidChangeProperty.fire(e);
            }));
            // Data buffering to reduce the amount of messages going to the renderer
            this._bufferer = new terminalDataBuffering_1.TerminalDataBufferer((_, data) => this._onProcessData.fire(data));
            this._register(this._bufferer.startBuffering(this._persistentProcessId, this._terminalProcess.onProcessData));
            // Data recording for reconnect
            this._register(this.onProcessData(e => this._serializer.handleData(e)));
            // Clean up other disposables
            this._register((0, lifecycle_1.toDisposable)(() => {
                for (const e of this._autoReplies.values()) {
                    e.dispose();
                }
                this._autoReplies.clear();
            }));
        }
        async attach() {
            if (!this._disconnectRunner1.isScheduled() && !this._disconnectRunner2.isScheduled()) {
                this._logService.warn(`Persistent process "${this._persistentProcessId}": Process had no disconnect runners but was an orphan`);
            }
            this._disconnectRunner1.cancel();
            this._disconnectRunner2.cancel();
        }
        async detach(forcePersist) {
            // Keep the process around if it was indicated to persist and it has had some iteraction or
            // was replayed
            if (this.shouldPersistTerminal && (this._interactionState.value !== "None" /* InteractionState.None */ || forcePersist)) {
                this._disconnectRunner1.schedule();
            }
            else {
                this.shutdown(true);
            }
        }
        serializeNormalBuffer() {
            return this._serializer.generateReplayEvent(true, this._interactionState.value !== "Session" /* InteractionState.Session */);
        }
        async refreshProperty(type) {
            return this._terminalProcess.refreshProperty(type);
        }
        async updateProperty(type, value) {
            if (type === "fixedDimensions" /* ProcessPropertyType.FixedDimensions */) {
                return this._setFixedDimensions(value);
            }
        }
        async start() {
            if (!this._isStarted) {
                const result = await this._terminalProcess.start();
                if (result && 'message' in result) {
                    // it's a terminal launch error
                    return result;
                }
                this._isStarted = true;
                // If the process was revived, trigger a replay on first start. An alternative approach
                // could be to start it on the pty host before attaching but this fails on Windows as
                // conpty's inherit cursor option which is required, ends up sending DSR CPR which
                // causes conhost to hang when no response is received from the terminal (which wouldn't
                // be attached yet). https://github.com/microsoft/terminal/issues/11213
                if (this._wasRevived) {
                    this.triggerReplay();
                }
                else {
                    this._onPersistentProcessReady.fire();
                }
                return result;
            }
            this._onProcessReady.fire({ pid: this._pid, cwd: this._cwd, windowsPty: this._terminalProcess.getWindowsPty() });
            this._onDidChangeProperty.fire({ type: "title" /* ProcessPropertyType.Title */, value: this._terminalProcess.currentTitle });
            this._onDidChangeProperty.fire({ type: "shellType" /* ProcessPropertyType.ShellType */, value: this._terminalProcess.shellType });
            this.triggerReplay();
            return undefined;
        }
        shutdown(immediate) {
            return this._terminalProcess.shutdown(immediate);
        }
        input(data) {
            this._interactionState.setValue("Session" /* InteractionState.Session */, 'input');
            this._serializer.freeRawReviveBuffer();
            if (this._inReplay) {
                return;
            }
            for (const listener of this._autoReplies.values()) {
                listener.handleInput();
            }
            return this._terminalProcess.input(data);
        }
        writeBinary(data) {
            return this._terminalProcess.processBinary(data);
        }
        resize(cols, rows) {
            if (this._inReplay) {
                return;
            }
            this._serializer.handleResize(cols, rows);
            // Buffered events should flush when a resize occurs
            this._bufferer.flushBuffer(this._persistentProcessId);
            for (const listener of this._autoReplies.values()) {
                listener.handleResize();
            }
            return this._terminalProcess.resize(cols, rows);
        }
        async clearBuffer() {
            this._serializer.clearBuffer();
            this._terminalProcess.clearBuffer();
        }
        setUnicodeVersion(version) {
            this.unicodeVersion = version;
            this._serializer.setUnicodeVersion?.(version);
            // TODO: Pass in unicode version in ctor
        }
        acknowledgeDataEvent(charCount) {
            if (this._inReplay) {
                return;
            }
            return this._terminalProcess.acknowledgeDataEvent(charCount);
        }
        getInitialCwd() {
            return this._terminalProcess.getInitialCwd();
        }
        getCwd() {
            return this._terminalProcess.getCwd();
        }
        async triggerReplay() {
            if (this._interactionState.value === "None" /* InteractionState.None */) {
                this._interactionState.setValue("ReplayOnly" /* InteractionState.ReplayOnly */, 'triggerReplay');
            }
            const ev = await this._serializer.generateReplayEvent();
            let dataLength = 0;
            for (const e of ev.events) {
                dataLength += e.data.length;
            }
            this._logService.info(`Persistent process "${this._persistentProcessId}": Replaying ${dataLength} chars and ${ev.events.length} size events`);
            this._onProcessReplay.fire(ev);
            this._terminalProcess.clearUnacknowledgedChars();
            this._onPersistentProcessReady.fire();
        }
        installAutoReply(match, reply) {
            this._autoReplies.get(match)?.dispose();
            this._autoReplies.set(match, new terminalAutoResponder_1.TerminalAutoResponder(this._terminalProcess, match, reply, this._logService));
        }
        uninstallAutoReply(match) {
            const autoReply = this._autoReplies.get(match);
            autoReply?.dispose();
            this._autoReplies.delete(match);
        }
        sendCommandResult(reqId, isError, serializedPayload) {
            const data = this._pendingCommands.get(reqId);
            if (!data) {
                return;
            }
            this._pendingCommands.delete(reqId);
        }
        orphanQuestionReply() {
            this._orphanQuestionReplyTime = Date.now();
            if (this._orphanQuestionBarrier) {
                const barrier = this._orphanQuestionBarrier;
                this._orphanQuestionBarrier = null;
                barrier.open();
            }
        }
        reduceGraceTime() {
            if (this._disconnectRunner2.isScheduled()) {
                // we are disconnected and already running the short reconnection timer
                return;
            }
            if (this._disconnectRunner1.isScheduled()) {
                // we are disconnected and running the long reconnection timer
                this._disconnectRunner2.schedule();
            }
        }
        async isOrphaned() {
            return await this._orphanRequestQueue.queue(async () => this._isOrphaned());
        }
        async _isOrphaned() {
            // The process is already known to be orphaned
            if (this._disconnectRunner1.isScheduled() || this._disconnectRunner2.isScheduled()) {
                return true;
            }
            // Ask whether the renderer(s) whether the process is orphaned and await the reply
            if (!this._orphanQuestionBarrier) {
                // the barrier opens after 4 seconds with or without a reply
                this._orphanQuestionBarrier = new async_1.AutoOpenBarrier(4000);
                this._orphanQuestionReplyTime = 0;
                this._onProcessOrphanQuestion.fire();
            }
            await this._orphanQuestionBarrier.wait();
            return (Date.now() - this._orphanQuestionReplyTime > 500);
        }
    }
    class MutationLogger {
        get value() { return this._value; }
        setValue(value, reason) {
            if (this._value !== value) {
                this._value = value;
                this._log(reason);
            }
        }
        constructor(_name, _value, _logService) {
            this._name = _name;
            this._value = _value;
            this._logService = _logService;
            this._log('initialized');
        }
        _log(reason) {
            this._logService.debug(`MutationLogger "${this._name}" set to "${this._value}", reason: ${reason}`);
        }
    }
    class XtermSerializer {
        constructor(cols, rows, scrollback, unicodeVersion, reviveBufferWithRestoreMessage, shellIntegrationNonce, _rawReviveBuffer, logService) {
            this._rawReviveBuffer = _rawReviveBuffer;
            this._xterm = new headless_1.Terminal({
                cols,
                rows,
                scrollback,
                allowProposedApi: true
            });
            if (reviveBufferWithRestoreMessage) {
                this._xterm.writeln(reviveBufferWithRestoreMessage);
            }
            this.setUnicodeVersion(unicodeVersion);
            this._shellIntegrationAddon = new shellIntegrationAddon_1.ShellIntegrationAddon(shellIntegrationNonce, true, undefined, logService);
            this._xterm.loadAddon(this._shellIntegrationAddon);
        }
        freeRawReviveBuffer() {
            // Free the memory of the terminal if it will need to be re-serialized
            this._rawReviveBuffer = undefined;
        }
        handleData(data) {
            this._xterm.write(data);
        }
        handleResize(cols, rows) {
            this._xterm.resize(cols, rows);
        }
        clearBuffer() {
            this._xterm.clear();
        }
        async generateReplayEvent(normalBufferOnly, restoreToLastReviveBuffer) {
            const serialize = new (await this._getSerializeConstructor());
            this._xterm.loadAddon(serialize);
            const options = {
                scrollback: this._xterm.options.scrollback
            };
            if (normalBufferOnly) {
                options.excludeAltBuffer = true;
                options.excludeModes = true;
            }
            let serialized;
            if (restoreToLastReviveBuffer && this._rawReviveBuffer) {
                serialized = this._rawReviveBuffer;
            }
            else {
                serialized = serialize.serialize(options);
            }
            return {
                events: [
                    {
                        cols: this._xterm.cols,
                        rows: this._xterm.rows,
                        data: serialized
                    }
                ],
                commands: this._shellIntegrationAddon.serialize()
            };
        }
        async setUnicodeVersion(version) {
            if (this._xterm.unicode.activeVersion === version) {
                return;
            }
            if (version === '11') {
                this._unicodeAddon = new (await this._getUnicode11Constructor());
                this._xterm.loadAddon(this._unicodeAddon);
            }
            else {
                this._unicodeAddon?.dispose();
                this._unicodeAddon = undefined;
            }
            this._xterm.unicode.activeVersion = version;
        }
        async _getUnicode11Constructor() {
            if (!Unicode11Addon) {
                Unicode11Addon = (await new Promise((resolve_1, reject_1) => { require(['@xterm/addon-unicode11'], resolve_1, reject_1); })).Unicode11Addon;
            }
            return Unicode11Addon;
        }
        async _getSerializeConstructor() {
            if (!SerializeAddon) {
                SerializeAddon = (await new Promise((resolve_2, reject_2) => { require(['@xterm/addon-serialize'], resolve_2, reject_2); })).SerializeAddon;
            }
            return SerializeAddon;
        }
    }
    function printTime(ms) {
        let h = 0;
        let m = 0;
        let s = 0;
        if (ms >= 1000) {
            s = Math.floor(ms / 1000);
            ms -= s * 1000;
        }
        if (s >= 60) {
            m = Math.floor(s / 60);
            s -= m * 60;
        }
        if (m >= 60) {
            h = Math.floor(m / 60);
            m -= h * 60;
        }
        const _h = h ? `${h}h` : ``;
        const _m = m ? `${m}m` : ``;
        const _s = s ? `${s}s` : ``;
        const _ms = ms ? `${ms}ms` : ``;
        return `${_h}${_m}${_s}${_ms}`;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdGVybWluYWwvbm9kZS9wdHlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7OztJQWdDaEcsNEJBeUJDO0lBekJELFNBQWdCLFFBQVEsQ0FBQyxPQUFZLEVBQUUsR0FBVyxFQUFFLFVBQWU7UUFDbEUsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLENBQUM7WUFDNUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDO1FBQ3RCLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFDNUIsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssV0FBVyxHQUFHLElBQVc7WUFDakQsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hFLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0gsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QyxNQUFNLElBQUEsZUFBTyxFQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQ0QsSUFBSSxNQUFXLENBQUM7WUFDaEIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxNQUFNLENBQUMsQ0FBQztZQUNULENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxLQUFLLGNBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEYsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztJQUlELElBQUksY0FBMEMsQ0FBQztJQUMvQyxJQUFJLGNBQTBDLENBQUM7SUFFL0MsTUFBYSxVQUFXLFNBQVEsc0JBQVU7UUE2QmpDLFdBQVcsQ0FBSSxJQUFZLEVBQUUsS0FBZTtZQUNuRCxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1QsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxLQUFLLGNBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDcEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLElBQUksU0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDckYsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBR0QsSUFBSSxZQUFZO1lBQ2YsT0FBTztnQkFDTixVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVc7Z0JBQzVCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7YUFDeEMsQ0FBQztRQUNILENBQUM7UUFFRCxZQUNrQixXQUF3QixFQUN4QixlQUFnQyxFQUNoQyxtQkFBd0MsRUFDeEMsaUJBQXlCO1lBRTFDLEtBQUssRUFBRSxDQUFDO1lBTFMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFDeEIsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ2hDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDeEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFRO1lBL0MxQixVQUFLLEdBQTJDLElBQUksR0FBRyxFQUFFLENBQUM7WUFDMUQsMEJBQXFCLEdBQUcsSUFBSSxHQUFHLEVBQTJDLENBQUM7WUFFM0UscUJBQWdCLEdBQW9FLElBQUksR0FBRyxFQUFFLENBQUM7WUFDOUYsaUJBQVksR0FBd0IsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUV2RCxlQUFVLEdBQVcsQ0FBQyxDQUFDO1lBRWQsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFaEUsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFxRCxDQUFDLENBQUM7WUFDMUcsa0JBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEUscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBcUQsQ0FBQyxDQUFDO1lBQzVHLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUUsb0JBQWUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE2QyxDQUFDLENBQUM7WUFDbkcsbUJBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekUsbUJBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE2QyxDQUFDLENBQUM7WUFDbEcsa0JBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEUsNkJBQXdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBa0IsQ0FBQyxDQUFDO1lBQ2pGLDRCQUF1QixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BHLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWtFLENBQUMsQ0FBQztZQUM1SCx1QkFBa0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRix5QkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFtRCxDQUFDLENBQUM7WUFDOUcsd0JBQW1CLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7WUEyQnhHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ3ZDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BCLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRUosSUFBSSxDQUFDLDJCQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNqRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDM0csQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLHlCQUF5QixDQUFDLEtBQWU7WUFDOUMsd0NBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUM5Qix3Q0FBa0IsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMscUJBQXFCLENBQUMsV0FBbUIsRUFBRSxVQUFrQjtZQUNsRSxPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxhQUFhLENBQUMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMseUJBQXlCLENBQUMsU0FBaUIsRUFBRSxtQkFBMkI7WUFDN0UsSUFBSSxjQUFjLEdBQWdDLFNBQVMsQ0FBQztZQUM1RCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2hELElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1QsY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzVFLENBQUM7WUFDRCxJQUFJLENBQUMsMkJBQTJCLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBWTtZQUNyQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksT0FBTyxDQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUM1RCxJQUFBLG9CQUFJLEVBQUMsb0JBQVMsQ0FBQyxDQUFDLENBQUMsMkJBQTJCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxzQ0FBc0MsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN2SCxJQUFJLEdBQUcsRUFBRSxDQUFDO3dCQUNULE9BQU8sTUFBTSxDQUFDLGdEQUFnRCxDQUFDLENBQUM7b0JBQ2pFLENBQUM7b0JBQ0QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNqQixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUN2RSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUM7Z0JBQ3ZDLE1BQU0sU0FBUyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3RCxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUNmLElBQUksQ0FBQzt3QkFDSixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDMUMsQ0FBQztvQkFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNaLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixJQUFJLGlCQUFpQixDQUFDLENBQUM7Z0JBQzlELENBQUM7Z0JBQ0QsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQztZQUM1QixDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM3RCxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsc0JBQXNCLENBQUMsR0FBYTtZQUN6QyxNQUFNLFFBQVEsR0FBd0MsRUFBRSxDQUFDO1lBQ3pELEtBQUssTUFBTSxDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDO2dCQUM3RSx1RkFBdUY7Z0JBQ3ZGLElBQUksaUJBQWlCLENBQUMsY0FBYyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNqRixRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsYUFBYSxDQUEyQixLQUFLLEVBQUMsQ0FBQyxFQUFDLEVBQUU7d0JBQ3hFLENBQUMsQ0FBQzs0QkFDRCxFQUFFLEVBQUUsbUJBQW1COzRCQUN2QixpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxpQkFBaUI7NEJBQ3RELGNBQWMsRUFBRSxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsRUFBRSxpQkFBaUIsQ0FBQzs0QkFDdkYsbUJBQW1CLEVBQUUsaUJBQWlCLENBQUMsb0JBQW9COzRCQUMzRCxjQUFjLEVBQUUsaUJBQWlCLENBQUMsY0FBYzs0QkFDaEQsV0FBVyxFQUFFLE1BQU0saUJBQWlCLENBQUMscUJBQXFCLEVBQUU7NEJBQzVELFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFO3lCQUNyQixDQUFDLENBQUM7b0JBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDTCxDQUFDO1lBQ0YsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUF5QztnQkFDeEQsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsS0FBSyxFQUFFLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7YUFDbEMsQ0FBQztZQUNGLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsdUJBQXVCLENBQUMsV0FBbUIsRUFBRSxLQUFpQyxFQUFFLG9CQUE0QjtZQUNqSCxNQUFNLFFBQVEsR0FBb0IsRUFBRSxDQUFDO1lBQ3JDLEtBQUssTUFBTSxRQUFRLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ25FLENBQUM7WUFDRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVPLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxXQUFtQixFQUFFLFFBQWtDO1lBQzNGLE1BQU0sY0FBYyxHQUFHLElBQUEsY0FBUSxFQUFDLDJCQUEyQixFQUFFLGtCQUFrQixDQUFDLENBQUM7WUFDakYsNkZBQTZGO1lBQzdGLDBFQUEwRTtZQUMxRSwwRUFBMEU7WUFDMUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsYUFBYSxDQUNyQztnQkFDQyxHQUFHLFFBQVEsQ0FBQyxpQkFBaUI7Z0JBQzdCLEdBQUcsRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUc7Z0JBQ2hDLEtBQUssRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUs7Z0JBQ3BDLElBQUksRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUk7Z0JBQ2xDLElBQUksRUFBRSxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsS0FBSywyQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTO2dCQUM5RyxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUEsMENBQXdCLEVBQUMsY0FBYyxFQUFFLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDO2FBQ3JILEVBQ0QsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQzNCLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFDbkMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUNuQyxRQUFRLENBQUMsY0FBYyxFQUN2QixRQUFRLENBQUMsbUJBQW1CLENBQUMsR0FBRyxFQUNoQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsYUFBYSxFQUMxQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUNwQyxJQUFJLEVBQ0osUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQ25DLFFBQVEsQ0FBQyxjQUFjLENBQUMsYUFBYSxFQUNyQyxJQUFJLEVBQ0osUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNuQyxDQUFDO1lBQ0Ysb0VBQW9FO1lBQ3BFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLDJCQUEyQixLQUFLLGNBQWMsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsV0FBVztZQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLGFBQWEsQ0FDbEIsaUJBQXFDLEVBQ3JDLEdBQVcsRUFDWCxJQUFZLEVBQ1osSUFBWSxFQUNaLGNBQTBCLEVBQzFCLEdBQXdCLEVBQ3hCLGFBQWtDLEVBQ2xDLE9BQWdDLEVBQ2hDLGFBQXNCLEVBQ3RCLFdBQW1CLEVBQ25CLGFBQXFCLEVBQ3JCLFVBQW9CLEVBQ3BCLGVBQXdCO1lBRXhCLElBQUksaUJBQWlCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxJQUFJLEtBQUssQ0FBQyw2REFBNkQsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFDRCxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxpQ0FBZSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzdJLE1BQU0sb0JBQW9CLEdBQTJDO2dCQUNwRSxHQUFHO2dCQUNILGFBQWE7Z0JBQ2IsT0FBTzthQUNQLENBQUM7WUFDRixNQUFNLGlCQUFpQixHQUFHLElBQUkseUJBQXlCLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxXQUFXLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxlQUFlLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDeGIsT0FBTyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDN0IsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN0QixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1lBQ0gsaUJBQWlCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RGLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwRixpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVGLGlCQUFpQixDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEcsaUJBQWlCLENBQUMsd0JBQXdCLENBQUMsR0FBRyxFQUFFO2dCQUMvQyxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztvQkFDN0MsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBVTtZQUMvQixJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNuRixNQUFNLENBQUMsQ0FBQztZQUNULENBQUM7UUFDRixDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsV0FBVyxDQUFDLEVBQVUsRUFBRSxLQUFhLEVBQUUsV0FBNkI7WUFDekUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBVSxFQUFFLGFBQXNCLEVBQUUsSUFBOEUsRUFBRSxLQUFjO1lBQ2xKLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFVO1lBQzNCLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdEMsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLGVBQWUsQ0FBZ0MsRUFBVSxFQUFFLElBQU87WUFDdkUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsY0FBYyxDQUFnQyxFQUFVLEVBQUUsSUFBTyxFQUFFLEtBQTZCO1lBQ3JHLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxFQUFVLEVBQUUsWUFBc0I7WUFDekQsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMseUJBQXlCO1lBQzlCLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUN2QyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRTdHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsbUJBQW1CLENBQUMsTUFBTSwwQkFBMEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGtCQUFrQixDQUFDLENBQUM7WUFDeEgsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUNsSSxNQUFNLFlBQVksR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsT0FBTyxZQUFZLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxtQkFBbUI7WUFDeEIsT0FBTyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0IsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFVO1lBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLCtCQUErQixFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQzlFLENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBVSxFQUFFLFNBQWtCO1lBQzVDLDZDQUE2QztZQUM3QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRUssQUFBTixLQUFLLENBQUMsS0FBSyxDQUFDLEVBQVUsRUFBRSxJQUFZO1lBQ25DLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVLLEFBQU4sS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFVLEVBQUUsSUFBWTtZQUMzQyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFSyxBQUFOLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBVSxFQUFFLElBQVksRUFBRSxJQUFZO1lBQ2xELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xELENBQUM7UUFFSyxBQUFOLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBVTtZQUM3QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYSxFQUFFLENBQUM7UUFDL0MsQ0FBQztRQUVLLEFBQU4sS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFVO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUN4QyxDQUFDO1FBRUssQUFBTixLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBVSxFQUFFLFNBQWlCO1lBQ3ZELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUssQUFBTixLQUFLLENBQUMsaUJBQWlCLENBQUMsRUFBVSxFQUFFLE9BQW1CO1lBQ3RELE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUssQUFBTixLQUFLLENBQUMsVUFBVTtZQUNmLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztRQUVLLEFBQU4sS0FBSyxDQUFDLG1CQUFtQixDQUFDLEVBQVU7WUFDbkMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDckQsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLGdCQUFnQixDQUFDLEtBQWEsRUFBRSxLQUFhO1lBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNwQywyRUFBMkU7WUFDM0UsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsQ0FBQztRQUNGLENBQUM7UUFFSyxBQUFOLEtBQUssQ0FBQyx1QkFBdUI7WUFDNUIsS0FBSyxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQzlDLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO29CQUNyQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVLLEFBQU4sS0FBSyxDQUFDLGtCQUFrQixDQUFDLEtBQWE7WUFDckMsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3JDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM3QixDQUFDO1FBQ0YsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLHFCQUFxQixDQUFDLGFBQThCLGFBQUU7WUFDM0QsT0FBTyxJQUFBLHNCQUFjLEVBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsY0FBYztZQUNuQixPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDM0IsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFnQixFQUFFLFNBQWtEO1lBQ3BGLElBQUksU0FBUyxLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsb0JBQVMsRUFBRSxDQUFDO29CQUNoQixPQUFPLFFBQVEsQ0FBQztnQkFDakIsQ0FBQztnQkFDRCxJQUFJLElBQUEsMkNBQXFCLEdBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQztvQkFDckMsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDckMsQ0FBQztnQkFDRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO29CQUNwQixPQUFPLFFBQVEsQ0FBQztnQkFDakIsQ0FBQztnQkFDRCxPQUFPLElBQUksT0FBTyxDQUFTLENBQUMsQ0FBQyxFQUFFO29CQUM5QixNQUFNLElBQUksR0FBRyxJQUFBLHdCQUFRLEVBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFO3dCQUMvRixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsMENBQW9CLEVBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDM0QsQ0FBQyxDQUFDLENBQUM7b0JBQ0gsSUFBSSxDQUFDLEtBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDO1lBQ0QsSUFBSSxTQUFTLEtBQUssYUFBYSxFQUFFLENBQUM7Z0JBQ2pDLHNGQUFzRjtnQkFDdEYsZ0JBQWdCO2dCQUNoQixJQUFJLG9CQUFTLEVBQUUsQ0FBQztvQkFDZixJQUFJLElBQUEsMkNBQXFCLEdBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQzt3QkFDckMsT0FBTyxRQUFRLENBQUM7b0JBQ2pCLENBQUM7b0JBQ0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7b0JBQ25ELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDcEIsT0FBTyxRQUFRLENBQUM7b0JBQ2pCLENBQUM7b0JBQ0QsT0FBTyxJQUFJLE9BQU8sQ0FBUyxDQUFDLENBQUMsRUFBRTt3QkFDOUIsTUFBTSxJQUFJLEdBQUcsSUFBQSx3QkFBUSxFQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUU7NEJBQ3JHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7d0JBQ3JDLENBQUMsQ0FBQyxDQUFDO3dCQUNILElBQUksQ0FBQyxLQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ25CLENBQUMsQ0FBQyxDQUFDO2dCQUNKLENBQUM7WUFDRixDQUFDO1lBQ0Qsd0JBQXdCO1lBQ3hCLE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7UUFFTyxxQkFBcUI7WUFDNUIsTUFBTSxTQUFTLEdBQUcsSUFBQSwyQ0FBcUIsR0FBRSxJQUFJLEtBQUssQ0FBQztZQUNuRCxNQUFNLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDcEYsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUM3QyxJQUFJLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixPQUFPLElBQUEsV0FBSSxFQUFDLFVBQVUsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hILENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsa0JBQWtCLENBQUMsV0FBbUIsRUFBRSxFQUFVO1lBQ3ZELElBQUksQ0FBQztnQkFDSixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztZQUN0RixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsV0FBVyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUdLLEFBQU4sS0FBSyxDQUFDLHFCQUFxQixDQUFDLElBQWdDO1lBQzNELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMscUJBQXFCLENBQUMsSUFBZ0M7WUFDM0QsV0FBVyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hFLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1osTUFBTSxPQUFPLEdBQWdCLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sWUFBWSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUMsR0FBRyxFQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5SCxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzlELFdBQVcsQ0FBQyxJQUFJLENBQUMsK0JBQStCLENBQUMsQ0FBQztnQkFDbEQsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ2pCLENBQUM7WUFDRCxXQUFXLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUM7WUFDbEQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxXQUFtQixFQUFFLEdBQStCLEVBQUUsT0FBb0I7WUFDMUcsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdILE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUFzRCxDQUFDO1lBQy9ILE9BQU87Z0JBQ04sUUFBUSxFQUFFLEdBQUcsQ0FBQyxRQUFRO2dCQUN0Qix5QkFBeUIsRUFBRSxHQUFHLENBQUMseUJBQXlCO2dCQUN4RCxTQUFTLEVBQUUsUUFBUTthQUNuQixDQUFDO1FBQ0gsQ0FBQztRQUVPLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxXQUFtQixFQUFFLENBQWtDLEVBQUUsT0FBb0I7WUFDbEgsSUFBSSxDQUFDO2dCQUNKLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNsRSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDN0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsdUNBQXVDLEtBQUssY0FBYyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNoRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLG1CQUFtQixHQUFHLFlBQVksSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDO2dCQUN2RCxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDO29CQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksbUJBQW1CLDRCQUE0QixDQUFDLENBQUM7Z0JBQzlFLENBQUM7Z0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxjQUFjLEdBQUcsaUJBQWlCLElBQUksTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEtBQUssU0FBUyxDQUFDLENBQUM7Z0JBQ3ZJLE9BQU87b0JBQ04sUUFBUSxFQUFFLEVBQUUsR0FBRyxjQUFjLEVBQUUsRUFBRSxFQUFFLG1CQUFtQixFQUFFO29CQUN4RCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVk7aUJBQzVCLENBQUM7WUFDSCxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnRUFBZ0UsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ25HLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLDJEQUEyRCxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyx5REFBeUQsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzlILElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNHLGdEQUFnRDtnQkFDaEQsT0FBTztvQkFDTixRQUFRLEVBQUUsSUFBSTtvQkFDZCxZQUFZLEVBQUUsQ0FBQyxDQUFDLFlBQVk7aUJBQzVCLENBQUM7WUFDSCxDQUFDO1FBQ0YsQ0FBQztRQUVPLHFCQUFxQixDQUFDLFdBQW1CLEVBQUUsS0FBYTtZQUMvRCxPQUFPLEdBQUcsV0FBVyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFFTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBVSxFQUFFLGlCQUE0QyxFQUFFLGFBQXNCLEtBQUs7WUFDdkgsV0FBVyxDQUFDLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN2RCx3RUFBd0U7WUFDeEUsaUJBQWlCO1lBQ2pCLE1BQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1SCxNQUFNLE1BQU0sR0FBRztnQkFDZCxFQUFFO2dCQUNGLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxLQUFLO2dCQUM5QixXQUFXLEVBQUUsaUJBQWlCLENBQUMsV0FBVztnQkFDMUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLEdBQUc7Z0JBQzFCLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxXQUFXO2dCQUMxQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsYUFBYTtnQkFDOUMsR0FBRztnQkFDSCxRQUFRO2dCQUNSLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxJQUFJO2dCQUM1QixLQUFLLEVBQUUsaUJBQWlCLENBQUMsS0FBSztnQkFDOUIsZUFBZSxFQUFFLGlCQUFpQixDQUFDLGVBQWU7Z0JBQ2xELDhCQUE4QixFQUFFLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyw4QkFBOEI7Z0JBQzdHLHNCQUFzQixFQUFFLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLHNCQUFzQjtnQkFDbEYsVUFBVSxFQUFFLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLFVBQVU7Z0JBQzFELFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZO2dCQUM5RCxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUI7Z0JBQ3hFLElBQUksRUFBRSxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJO2dCQUM5QyxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxpQkFBaUI7Z0JBQ3RELHFCQUFxQixFQUFFLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLO2FBQzVGLENBQUM7WUFDRixXQUFXLENBQUMsSUFBSSxDQUFDLCtCQUErQixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVPLGFBQWEsQ0FBQyxFQUFVO1lBQy9CLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDVixNQUFNLElBQUkseUJBQWdCLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO0tBQ0Q7SUEzaEJELGdDQTJoQkM7SUFwZkE7UUFEQyxvQkFBTztrREFNUDtJQXNCSztRQURMLFFBQVE7K0RBSVI7SUFHSztRQURMLFFBQVE7MkRBR1I7SUFHSztRQURMLFFBQVE7K0RBUVI7SUFHSztRQURMLFFBQVE7eURBd0JSO0lBR0s7UUFETCxRQUFROzREQXdCUjtJQUdLO1FBREwsUUFBUTs2REFPUjtJQW9DSztRQURMLFFBQVE7aURBR1I7SUFHSztRQURMLFFBQVE7bURBNENSO0lBR0s7UUFETCxRQUFRO3FEQVNSO0lBR0s7UUFETCxRQUFRO2lEQUdSO0lBR0s7UUFETCxRQUFRO2dEQUdSO0lBR0s7UUFETCxRQUFRO2lEQUdSO0lBR0s7UUFETCxRQUFRO3FEQUdSO0lBR0s7UUFETCxRQUFRO29EQUdSO0lBR0s7UUFETCxRQUFRO3VEQUdSO0lBR0s7UUFETCxRQUFROytEQUtSO0lBR0s7UUFETCxRQUFRO21EQVFSO0lBR0s7UUFETCxRQUFRO3lEQUdSO0lBR0s7UUFETCxRQUFROzJDQUlSO0lBR0s7UUFETCxRQUFROzhDQUlSO0lBRUs7UUFETCxRQUFROzJDQUdSO0lBRUs7UUFETCxRQUFRO21EQUdSO0lBRUs7UUFETCxRQUFROzRDQUdSO0lBRUs7UUFETCxRQUFRO21EQUdSO0lBRUs7UUFETCxRQUFROzRDQUdSO0lBRUs7UUFETCxRQUFROzBEQUdSO0lBRUs7UUFETCxRQUFRO3VEQUdSO0lBRUs7UUFETCxRQUFRO2dEQUdSO0lBRUs7UUFETCxRQUFRO3lEQUdSO0lBR0s7UUFETCxRQUFRO3NEQU9SO0lBRUs7UUFETCxRQUFROzZEQU9SO0lBRUs7UUFETCxRQUFRO3dEQUtSO0lBR0s7UUFETCxRQUFROzJEQUdSO0lBR0s7UUFETCxRQUFRO29EQUdSO0lBR0s7UUFETCxRQUFRO2dEQXlDUjtJQWFLO1FBREwsUUFBUTt3REFRUjtJQUdLO1FBREwsUUFBUTsyREFHUjtJQUdLO1FBREwsUUFBUTsyREFhUjtJQXFGRixJQUFXLGdCQU9WO0lBUEQsV0FBVyxnQkFBZ0I7UUFDMUIsaURBQWlEO1FBQ2pELGlDQUFhLENBQUE7UUFDYiwwRUFBMEU7UUFDMUUsNkNBQXlCLENBQUE7UUFDekIsbUVBQW1FO1FBQ25FLHVDQUFtQixDQUFBO0lBQ3BCLENBQUMsRUFQVSxnQkFBZ0IsS0FBaEIsZ0JBQWdCLFFBTzFCO0lBRUQsTUFBTSx5QkFBMEIsU0FBUSxzQkFBVTtRQXdDakQsSUFBSSxHQUFHLEtBQWEsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN2QyxJQUFJLGlCQUFpQixLQUF5QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFDL0YsSUFBSSxjQUFjLEtBQWMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyx1Q0FBMEIsQ0FBQyxDQUFDLENBQUM7UUFDaEcsSUFBSSxLQUFLLEtBQWEsT0FBTyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLElBQUksV0FBVyxLQUF1QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksSUFBSSxLQUErQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksS0FBSyxLQUF5QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksZUFBZSxLQUEyQyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDN0YsSUFBSSxpQkFBaUIsS0FBYyxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7UUFFcEYsUUFBUSxDQUFDLEtBQWEsRUFBRSxXQUE2QjtZQUNwRCxJQUFJLFdBQVcsS0FBSywyQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsMkNBQTJCLFVBQVUsQ0FBQyxDQUFDO2dCQUN0RSxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDeEMsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxPQUFPLENBQUMsYUFBc0IsRUFBRSxJQUFrQixFQUFFLEtBQWM7WUFDakUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsRUFBRSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDakYsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBRXZDLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxhQUFhLEVBQUUsQ0FBQztvQkFDbkIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsMkNBQTJCLFNBQVMsQ0FBQyxDQUFDO2dCQUN0RSxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7UUFFTyxtQkFBbUIsQ0FBQyxlQUEwQztZQUNyRSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxZQUNTLG9CQUE0QixFQUNuQixnQkFBaUMsRUFDekMsV0FBbUIsRUFDbkIsYUFBcUIsRUFDckIscUJBQThCLEVBQ3ZDLElBQVksRUFDWixJQUFZLEVBQ0gsb0JBQTRELEVBQzlELGNBQTBCLEVBQ2pDLGtCQUF1QyxFQUN0QixXQUF3QixFQUN6QyxZQUFnQyxFQUNoQyxlQUFtQyxFQUMzQixLQUFvQixFQUNwQixNQUFlLEVBQ3ZCLElBQWEsRUFDYixlQUEwQztZQUUxQyxLQUFLLEVBQUUsQ0FBQztZQWxCQSx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQVE7WUFDbkIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFpQjtZQUN6QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUTtZQUNuQixrQkFBYSxHQUFiLGFBQWEsQ0FBUTtZQUNyQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQVM7WUFHOUIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF3QztZQUM5RCxtQkFBYyxHQUFkLGNBQWMsQ0FBWTtZQUVoQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUdqQyxVQUFLLEdBQUwsS0FBSyxDQUFlO1lBQ3BCLFdBQU0sR0FBTixNQUFNLENBQVM7WUF4RlAsaUJBQVksR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUU3RCxxQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBd0UsQ0FBQztZQUU1RyxlQUFVLEdBQVksS0FBSyxDQUFDO1lBSzVCLHdCQUFtQixHQUFHLElBQUksYUFBSyxFQUFXLENBQUM7WUFJbEMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBOEIsQ0FBQyxDQUFDO1lBQ3JGLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUN0QyxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUM1RSxtQkFBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQ3BDLDhCQUF5QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pGLHlGQUF5RjtZQUNoRiw2QkFBd0IsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDO1lBQ3hELG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDL0Qsa0JBQWEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUNsQyw2QkFBd0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUN2RSw0QkFBdUIsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDO1lBQ3RELHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXlCLENBQUMsQ0FBQztZQUNwRix3QkFBbUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDO1lBRXZELGNBQVMsR0FBRyxLQUFLLENBQUM7WUFFbEIsU0FBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ1YsU0FBSSxHQUFHLEVBQUUsQ0FBQztZQUVWLGlCQUFZLEdBQXFCLDJCQUFnQixDQUFDLE9BQU8sQ0FBQztZQTZEakUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksY0FBYyxDQUFDLHVCQUF1QixJQUFJLENBQUMsb0JBQW9CLHFCQUFxQixzQ0FBeUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzVKLElBQUksQ0FBQyxXQUFXLEdBQUcsWUFBWSxLQUFLLFNBQVMsQ0FBQztZQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksZUFBZSxDQUNyQyxJQUFJLEVBQ0osSUFBSSxFQUNKLGtCQUFrQixDQUFDLFVBQVUsRUFDN0IsY0FBYyxFQUNkLFlBQVksRUFDWixvQkFBb0IsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUNuRCxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQ25ELElBQUksQ0FBQyxXQUFXLENBQ2hCLENBQUM7WUFDRixJQUFJLElBQUksRUFBRSxDQUFDO2dCQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDJCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFDRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7WUFDbkMsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLG1DQUEyQixDQUFDLEdBQUcsRUFBRTtnQkFDN0UsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLElBQUksQ0FBQyxvQkFBb0IscUNBQXFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsb0NBQW9DLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDO2dCQUNwTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JCLENBQUMsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksbUNBQTJCLENBQUMsR0FBRyxFQUFFO2dCQUM3RSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLG9CQUFvQiwyQ0FBMkMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxtQ0FBbUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQzdNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckIsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuSCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZELElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO2dCQUNsQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ0osSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLHdFQUF3RTtZQUN4RSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksNENBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBRTlHLCtCQUErQjtZQUMvQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFeEUsNkJBQTZCO1lBQzdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDaEMsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQzVDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDYixDQUFDO2dCQUNELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTTtZQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDdEYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLElBQUksQ0FBQyxvQkFBb0Isd0RBQXdELENBQUMsQ0FBQztZQUNqSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFzQjtZQUNsQywyRkFBMkY7WUFDM0YsZUFBZTtZQUNmLElBQUksSUFBSSxDQUFDLHFCQUFxQixJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssdUNBQTBCLElBQUksWUFBWSxDQUFDLEVBQUUsQ0FBQztnQkFDNUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JCLENBQUM7UUFDRixDQUFDO1FBRUQscUJBQXFCO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssNkNBQTZCLENBQUMsQ0FBQztRQUM5RyxDQUFDO1FBRUQsS0FBSyxDQUFDLGVBQWUsQ0FBZ0MsSUFBTztZQUMzRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQWdDLElBQU8sRUFBRSxLQUE2QjtZQUN6RixJQUFJLElBQUksZ0VBQXdDLEVBQUUsQ0FBQztnQkFDbEQsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBaUUsQ0FBQyxDQUFDO1lBQ3BHLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLEtBQUs7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUN0QixNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxNQUFNLElBQUksU0FBUyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNuQywrQkFBK0I7b0JBQy9CLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBRXZCLHVGQUF1RjtnQkFDdkYscUZBQXFGO2dCQUNyRixrRkFBa0Y7Z0JBQ2xGLHdGQUF3RjtnQkFDeEYsdUVBQXVFO2dCQUN2RSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztvQkFDdEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN0QixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxDQUFDLHlCQUF5QixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN2QyxDQUFDO2dCQUNELE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakgsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUkseUNBQTJCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1lBQy9HLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLGlEQUErQixFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckIsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUNELFFBQVEsQ0FBQyxTQUFrQjtZQUMxQixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUNELEtBQUssQ0FBQyxJQUFZO1lBQ2pCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLDJDQUEyQixPQUFPLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsV0FBVyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDdkMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3BCLE9BQU87WUFDUixDQUFDO1lBQ0QsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ25ELFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN4QixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFDRCxXQUFXLENBQUMsSUFBWTtZQUN2QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbEQsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFZLEVBQUUsSUFBWTtZQUNoQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFMUMsb0RBQW9EO1lBQ3BELElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBRXRELEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNuRCxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDekIsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUNELEtBQUssQ0FBQyxXQUFXO1lBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDL0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3JDLENBQUM7UUFDRCxpQkFBaUIsQ0FBQyxPQUFtQjtZQUNwQyxJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sQ0FBQztZQUM5QixJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsd0NBQXdDO1FBQ3pDLENBQUM7UUFDRCxvQkFBb0IsQ0FBQyxTQUFpQjtZQUNyQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDcEIsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ0QsYUFBYTtZQUNaLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzlDLENBQUM7UUFDRCxNQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhO1lBQ2xCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssdUNBQTBCLEVBQUUsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsaURBQThCLGVBQWUsQ0FBQyxDQUFDO1lBQy9FLENBQUM7WUFDRCxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUN4RCxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7WUFDbkIsS0FBSyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzNCLFVBQVUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUM3QixDQUFDO1lBQ0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLElBQUksQ0FBQyxvQkFBb0IsZ0JBQWdCLFVBQVUsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sY0FBYyxDQUFDLENBQUM7WUFDOUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUNqRCxJQUFJLENBQUMseUJBQXlCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdkMsQ0FBQztRQUVELGdCQUFnQixDQUFDLEtBQWEsRUFBRSxLQUFhO1lBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLDZDQUFxQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ2hILENBQUM7UUFFRCxrQkFBa0IsQ0FBQyxLQUFhO1lBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsaUJBQWlCLENBQUMsS0FBYSxFQUFFLE9BQWdCLEVBQUUsaUJBQXNCO1lBQ3hFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNYLE9BQU87WUFDUixDQUFDO1lBQ0QsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxDQUFDO1FBRUQsbUJBQW1CO1lBQ2xCLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDM0MsSUFBSSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDO2dCQUM1QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO2dCQUNuQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEIsQ0FBQztRQUNGLENBQUM7UUFFRCxlQUFlO1lBQ2QsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDM0MsdUVBQXVFO2dCQUN2RSxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLDhEQUE4RDtnQkFDOUQsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3BDLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVU7WUFDZixPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVztZQUN4Qiw4Q0FBOEM7WUFDOUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQ3BGLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUVELGtGQUFrRjtZQUNsRixJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ2xDLDREQUE0RDtnQkFDNUQsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksdUJBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQztnQkFDbEMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RDLENBQUM7WUFFRCxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN6QyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxHQUFHLENBQUMsQ0FBQztRQUMzRCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLGNBQWM7UUFDbkIsSUFBSSxLQUFLLEtBQVEsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUN0QyxRQUFRLENBQUMsS0FBUSxFQUFFLE1BQWM7WUFDaEMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztnQkFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQixDQUFDO1FBQ0YsQ0FBQztRQUVELFlBQ2tCLEtBQWEsRUFDdEIsTUFBUyxFQUNBLFdBQXdCO1lBRnhCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDdEIsV0FBTSxHQUFOLE1BQU0sQ0FBRztZQUNBLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBRXpDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUIsQ0FBQztRQUVPLElBQUksQ0FBQyxNQUFjO1lBQzFCLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLENBQUMsS0FBSyxhQUFhLElBQUksQ0FBQyxNQUFNLGNBQWMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNyRyxDQUFDO0tBQ0Q7SUFFRCxNQUFNLGVBQWU7UUFLcEIsWUFDQyxJQUFZLEVBQ1osSUFBWSxFQUNaLFVBQWtCLEVBQ2xCLGNBQTBCLEVBQzFCLDhCQUFrRCxFQUNsRCxxQkFBNkIsRUFDckIsZ0JBQW9DLEVBQzVDLFVBQXVCO1lBRGYscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFvQjtZQUc1QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksbUJBQWEsQ0FBQztnQkFDL0IsSUFBSTtnQkFDSixJQUFJO2dCQUNKLFVBQVU7Z0JBQ1YsZ0JBQWdCLEVBQUUsSUFBSTthQUN0QixDQUFDLENBQUM7WUFDSCxJQUFJLDhCQUE4QixFQUFFLENBQUM7Z0JBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUM7WUFDckQsQ0FBQztZQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSw2Q0FBcUIsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzVHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxtQkFBbUI7WUFDbEIsc0VBQXNFO1lBQ3RFLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7UUFDbkMsQ0FBQztRQUVELFVBQVUsQ0FBQyxJQUFZO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxZQUFZLENBQUMsSUFBWSxFQUFFLElBQVk7WUFDdEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxXQUFXO1lBQ1YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQixDQUFDLGdCQUEwQixFQUFFLHlCQUFtQztZQUN4RixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sT0FBTyxHQUFzQjtnQkFDbEMsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVU7YUFDMUMsQ0FBQztZQUNGLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztnQkFDaEMsT0FBTyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDN0IsQ0FBQztZQUNELElBQUksVUFBa0IsQ0FBQztZQUN2QixJQUFJLHlCQUF5QixJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4RCxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1lBQ3BDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxVQUFVLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBQ0QsT0FBTztnQkFDTixNQUFNLEVBQUU7b0JBQ1A7d0JBQ0MsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTt3QkFDdEIsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTt3QkFDdEIsSUFBSSxFQUFFLFVBQVU7cUJBQ2hCO2lCQUNEO2dCQUNELFFBQVEsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFO2FBQ2pELENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQW1CO1lBQzFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUNuRCxPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksT0FBTyxLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN0QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQyxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUM7WUFDaEMsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUM7UUFDN0MsQ0FBQztRQUVELEtBQUssQ0FBQyx3QkFBd0I7WUFDN0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNyQixjQUFjLEdBQUcsQ0FBQyxzREFBYSx3QkFBd0IsMkJBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztZQUMxRSxDQUFDO1lBQ0QsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztRQUVELEtBQUssQ0FBQyx3QkFBd0I7WUFDN0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNyQixjQUFjLEdBQUcsQ0FBQyxzREFBYSx3QkFBd0IsMkJBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztZQUMxRSxDQUFDO1lBQ0QsT0FBTyxjQUFjLENBQUM7UUFDdkIsQ0FBQztLQUNEO0lBRUQsU0FBUyxTQUFTLENBQUMsRUFBVTtRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNoQixDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDMUIsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2IsQ0FBQztRQUNELE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzVCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzVCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQzVCLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ2hDLE9BQU8sR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNoQyxDQUFDIn0=