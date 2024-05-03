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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/parts/ipc/common/ipc", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/shell/node/shellEnv", "vs/platform/terminal/common/requestStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/terminal/node/terminalProfiles", "vs/base/node/shell", "vs/base/common/stopwatch"], function (require, exports, event_1, lifecycle_1, platform_1, ipc_1, configuration_1, log_1, logIpc_1, shellEnv_1, requestStore_1, terminal_1, terminalPlatformConfiguration_1, terminalProfiles_1, shell_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PtyHostService = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MaxRestarts"] = 5] = "MaxRestarts";
    })(Constants || (Constants = {}));
    /**
     * This service implements IPtyService by launching a pty host process, forwarding messages to and
     * from the pty host process and manages the connection.
     */
    let PtyHostService = class PtyHostService extends lifecycle_1.Disposable {
        get _connection() {
            this._ensurePtyHost();
            return this.__connection;
        }
        get _proxy() {
            this._ensurePtyHost();
            return this.__proxy;
        }
        /**
         * Get the proxy if it exists, otherwise undefined. This is used when calls are not needed to be
         * passed through to the pty host if it has not yet been spawned.
         */
        get _optionalProxy() {
            return this.__proxy;
        }
        _ensurePtyHost() {
            if (!this.__connection) {
                this._startPtyHost();
            }
        }
        constructor(_ptyHostStarter, _configurationService, _logService, _loggerService) {
            super();
            this._ptyHostStarter = _ptyHostStarter;
            this._configurationService = _configurationService;
            this._logService = _logService;
            this._loggerService = _loggerService;
            this._wasQuitRequested = false;
            this._restartCount = 0;
            this._isResponsive = true;
            this._onPtyHostExit = this._register(new event_1.Emitter());
            this.onPtyHostExit = this._onPtyHostExit.event;
            this._onPtyHostStart = this._register(new event_1.Emitter());
            this.onPtyHostStart = this._onPtyHostStart.event;
            this._onPtyHostUnresponsive = this._register(new event_1.Emitter());
            this.onPtyHostUnresponsive = this._onPtyHostUnresponsive.event;
            this._onPtyHostResponsive = this._register(new event_1.Emitter());
            this.onPtyHostResponsive = this._onPtyHostResponsive.event;
            this._onPtyHostRequestResolveVariables = this._register(new event_1.Emitter());
            this.onPtyHostRequestResolveVariables = this._onPtyHostRequestResolveVariables.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onProcessReplay = this._register(new event_1.Emitter());
            this.onProcessReplay = this._onProcessReplay.event;
            this._onProcessOrphanQuestion = this._register(new event_1.Emitter());
            this.onProcessOrphanQuestion = this._onProcessOrphanQuestion.event;
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            // Platform configuration is required on the process running the pty host (shared process or
            // remote server).
            (0, terminalPlatformConfiguration_1.registerTerminalPlatformConfiguration)();
            this._register(this._ptyHostStarter);
            this._register((0, lifecycle_1.toDisposable)(() => this._disposePtyHost()));
            this._resolveVariablesRequestStore = this._register(new requestStore_1.RequestStore(undefined, this._logService));
            this._resolveVariablesRequestStore.onCreateRequest(this._onPtyHostRequestResolveVariables.fire, this._onPtyHostRequestResolveVariables);
            // Start the pty host when a window requests a connection, if the starter has that capability.
            if (this._ptyHostStarter.onRequestConnection) {
                event_1.Event.once(this._ptyHostStarter.onRequestConnection)(() => this._ensurePtyHost());
            }
            this._ptyHostStarter.onWillShutdown?.(() => this._wasQuitRequested = true);
        }
        get _ignoreProcessNames() {
            return this._configurationService.getValue("terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */);
        }
        async _refreshIgnoreProcessNames() {
            return this._optionalProxy?.refreshIgnoreProcessNames?.(this._ignoreProcessNames);
        }
        async _resolveShellEnv() {
            if (platform_1.isWindows) {
                return process.env;
            }
            try {
                return await (0, shellEnv_1.getResolvedShellEnv)(this._configurationService, this._logService, { _: [] }, process.env);
            }
            catch (error) {
                this._logService.error('ptyHost was unable to resolve shell environment', error);
                return {};
            }
        }
        _startPtyHost() {
            const connection = this._ptyHostStarter.start();
            const client = connection.client;
            // Log a full stack trace which will tell the exact reason the pty host is starting up
            if (this._logService.getLevel() === log_1.LogLevel.Trace) {
                this._logService.trace('PtyHostService#_startPtyHost', new Error().stack?.replace(/^Error/, ''));
            }
            // Setup heartbeat service and trigger a heartbeat immediately to reset the timeouts
            const heartbeatService = ipc_1.ProxyChannel.toService(client.getChannel(terminal_1.TerminalIpcChannels.Heartbeat));
            heartbeatService.onBeat(() => this._handleHeartbeat());
            this._handleHeartbeat(true);
            // Handle exit
            this._register(connection.onDidProcessExit(e => {
                this._onPtyHostExit.fire(e.code);
                if (!this._wasQuitRequested && !this._store.isDisposed) {
                    if (this._restartCount <= Constants.MaxRestarts) {
                        this._logService.error(`ptyHost terminated unexpectedly with code ${e.code}`);
                        this._restartCount++;
                        this.restartPtyHost();
                    }
                    else {
                        this._logService.error(`ptyHost terminated unexpectedly with code ${e.code}, giving up`);
                    }
                }
            }));
            // Create proxy and forward events
            const proxy = ipc_1.ProxyChannel.toService(client.getChannel(terminal_1.TerminalIpcChannels.PtyHost));
            this._register(proxy.onProcessData(e => this._onProcessData.fire(e)));
            this._register(proxy.onProcessReady(e => this._onProcessReady.fire(e)));
            this._register(proxy.onProcessExit(e => this._onProcessExit.fire(e)));
            this._register(proxy.onDidChangeProperty(e => this._onDidChangeProperty.fire(e)));
            this._register(proxy.onProcessReplay(e => this._onProcessReplay.fire(e)));
            this._register(proxy.onProcessOrphanQuestion(e => this._onProcessOrphanQuestion.fire(e)));
            this._register(proxy.onDidRequestDetach(e => this._onDidRequestDetach.fire(e)));
            this._register(new logIpc_1.RemoteLoggerChannelClient(this._loggerService, client.getChannel(terminal_1.TerminalIpcChannels.Logger)));
            this.__connection = connection;
            this.__proxy = proxy;
            this._onPtyHostStart.fire();
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.ignoreProcessNames" /* TerminalSettingId.IgnoreProcessNames */)) {
                    await this._refreshIgnoreProcessNames();
                }
            }));
            this._refreshIgnoreProcessNames();
            return [connection, proxy];
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName) {
            const timeout = setTimeout(() => this._handleUnresponsiveCreateProcess(), terminal_1.HeartbeatConstants.CreateProcessTimeout);
            const id = await this._proxy.createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, workspaceId, workspaceName);
            clearTimeout(timeout);
            return id;
        }
        updateTitle(id, title, titleSource) {
            return this._proxy.updateTitle(id, title, titleSource);
        }
        updateIcon(id, userInitiated, icon, color) {
            return this._proxy.updateIcon(id, userInitiated, icon, color);
        }
        attachToProcess(id) {
            return this._proxy.attachToProcess(id);
        }
        detachFromProcess(id, forcePersist) {
            return this._proxy.detachFromProcess(id, forcePersist);
        }
        shutdownAll() {
            return this._proxy.shutdownAll();
        }
        listProcesses() {
            return this._proxy.listProcesses();
        }
        async getPerformanceMarks() {
            return this._optionalProxy?.getPerformanceMarks() ?? [];
        }
        async reduceConnectionGraceTime() {
            return this._optionalProxy?.reduceConnectionGraceTime();
        }
        start(id) {
            return this._proxy.start(id);
        }
        shutdown(id, immediate) {
            return this._proxy.shutdown(id, immediate);
        }
        input(id, data) {
            return this._proxy.input(id, data);
        }
        processBinary(id, data) {
            return this._proxy.processBinary(id, data);
        }
        resize(id, cols, rows) {
            return this._proxy.resize(id, cols, rows);
        }
        clearBuffer(id) {
            return this._proxy.clearBuffer(id);
        }
        acknowledgeDataEvent(id, charCount) {
            return this._proxy.acknowledgeDataEvent(id, charCount);
        }
        setUnicodeVersion(id, version) {
            return this._proxy.setUnicodeVersion(id, version);
        }
        getInitialCwd(id) {
            return this._proxy.getInitialCwd(id);
        }
        getCwd(id) {
            return this._proxy.getCwd(id);
        }
        async getLatency() {
            const sw = new stopwatch_1.StopWatch();
            const results = await this._proxy.getLatency();
            sw.stop();
            return [
                {
                    label: 'ptyhostservice<->ptyhost',
                    latency: sw.elapsed()
                },
                ...results
            ];
        }
        orphanQuestionReply(id) {
            return this._proxy.orphanQuestionReply(id);
        }
        installAutoReply(match, reply) {
            return this._proxy.installAutoReply(match, reply);
        }
        uninstallAllAutoReplies() {
            return this._proxy.uninstallAllAutoReplies();
        }
        uninstallAutoReply(match) {
            return this._proxy.uninstallAutoReply(match);
        }
        getDefaultSystemShell(osOverride) {
            return this._optionalProxy?.getDefaultSystemShell(osOverride) ?? (0, shell_1.getSystemShell)(osOverride ?? platform_1.OS, process.env);
        }
        async getProfiles(workspaceId, profiles, defaultProfile, includeDetectedProfiles = false) {
            const shellEnv = await this._resolveShellEnv();
            return (0, terminalProfiles_1.detectAvailableProfiles)(profiles, defaultProfile, includeDetectedProfiles, this._configurationService, shellEnv, undefined, this._logService, this._resolveVariables.bind(this, workspaceId));
        }
        async getEnvironment() {
            // If the pty host is yet to be launched, just return the environment of this process as it
            // is essentially the same when used to evaluate terminal profiles.
            if (!this.__proxy) {
                return { ...process.env };
            }
            return this._proxy.getEnvironment();
        }
        getWslPath(original, direction) {
            return this._proxy.getWslPath(original, direction);
        }
        getRevivedPtyNewId(workspaceId, id) {
            return this._proxy.getRevivedPtyNewId(workspaceId, id);
        }
        setTerminalLayoutInfo(args) {
            return this._proxy.setTerminalLayoutInfo(args);
        }
        async getTerminalLayoutInfo(args) {
            // This is optional as we want reconnect requests to go through only if the pty host exists.
            // Revive is handled specially as reviveTerminalProcesses is guaranteed to be called before
            // the request for layout info.
            return this._optionalProxy?.getTerminalLayoutInfo(args);
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._proxy.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            return this._proxy.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async freePortKillProcess(port) {
            if (!this._proxy.freePortKillProcess) {
                throw new Error('freePortKillProcess does not exist on the pty proxy');
            }
            return this._proxy.freePortKillProcess(port);
        }
        async serializeTerminalState(ids) {
            return this._proxy.serializeTerminalState(ids);
        }
        async reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocate) {
            return this._proxy.reviveTerminalProcesses(workspaceId, state, dateTimeFormatLocate);
        }
        async refreshProperty(id, property) {
            return this._proxy.refreshProperty(id, property);
        }
        async updateProperty(id, property, value) {
            return this._proxy.updateProperty(id, property, value);
        }
        async restartPtyHost() {
            this._disposePtyHost();
            this._isResponsive = true;
            this._startPtyHost();
        }
        _disposePtyHost() {
            this._proxy.shutdownAll();
            this._connection.store.dispose();
        }
        _handleHeartbeat(isConnecting) {
            this._clearHeartbeatTimeouts();
            this._heartbeatFirstTimeout = setTimeout(() => this._handleHeartbeatFirstTimeout(), isConnecting ? terminal_1.HeartbeatConstants.ConnectingBeatInterval : (terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier));
            if (!this._isResponsive) {
                this._isResponsive = true;
                this._onPtyHostResponsive.fire();
            }
        }
        _handleHeartbeatFirstTimeout() {
            this._logService.warn(`No ptyHost heartbeat after ${terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier / 1000} seconds`);
            this._heartbeatFirstTimeout = undefined;
            this._heartbeatSecondTimeout = setTimeout(() => this._handleHeartbeatSecondTimeout(), terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.SecondWaitMultiplier);
        }
        _handleHeartbeatSecondTimeout() {
            this._logService.error(`No ptyHost heartbeat after ${(terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier + terminal_1.HeartbeatConstants.BeatInterval * terminal_1.HeartbeatConstants.FirstWaitMultiplier) / 1000} seconds`);
            this._heartbeatSecondTimeout = undefined;
            if (this._isResponsive) {
                this._isResponsive = false;
                this._onPtyHostUnresponsive.fire();
            }
        }
        _handleUnresponsiveCreateProcess() {
            this._clearHeartbeatTimeouts();
            this._logService.error(`No ptyHost response to createProcess after ${terminal_1.HeartbeatConstants.CreateProcessTimeout / 1000} seconds`);
            if (this._isResponsive) {
                this._isResponsive = false;
                this._onPtyHostUnresponsive.fire();
            }
        }
        _clearHeartbeatTimeouts() {
            if (this._heartbeatFirstTimeout) {
                clearTimeout(this._heartbeatFirstTimeout);
                this._heartbeatFirstTimeout = undefined;
            }
            if (this._heartbeatSecondTimeout) {
                clearTimeout(this._heartbeatSecondTimeout);
                this._heartbeatSecondTimeout = undefined;
            }
        }
        _resolveVariables(workspaceId, text) {
            return this._resolveVariablesRequestStore.createRequest({ workspaceId, originalText: text });
        }
        async acceptPtyHostResolvedVariables(requestId, resolved) {
            this._resolveVariablesRequestStore.acceptReply(requestId, resolved);
        }
    };
    exports.PtyHostService = PtyHostService;
    exports.PtyHostService = PtyHostService = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, log_1.ILoggerService)
    ], PtyHostService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHR5SG9zdFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3Rlcm1pbmFsL25vZGUvcHR5SG9zdFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxJQUFLLFNBRUo7SUFGRCxXQUFLLFNBQVM7UUFDYix1REFBZSxDQUFBO0lBQ2hCLENBQUMsRUFGSSxTQUFTLEtBQVQsU0FBUyxRQUViO0lBRUQ7OztPQUdHO0lBQ0ksSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBTzdDLElBQVksV0FBVztZQUN0QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDdEIsT0FBTyxJQUFJLENBQUMsWUFBYSxDQUFDO1FBQzNCLENBQUM7UUFDRCxJQUFZLE1BQU07WUFDakIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLE9BQVEsQ0FBQztRQUN0QixDQUFDO1FBQ0Q7OztXQUdHO1FBQ0gsSUFBWSxjQUFjO1lBQ3pCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNyQixDQUFDO1FBRU8sY0FBYztZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7UUFtQ0QsWUFDa0IsZUFBZ0MsRUFDMUIscUJBQTZELEVBQ3ZFLFdBQXlDLEVBQ3RDLGNBQStDO1lBRS9ELEtBQUssRUFBRSxDQUFDO1lBTFMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQ1QsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN0RCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUNyQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFw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