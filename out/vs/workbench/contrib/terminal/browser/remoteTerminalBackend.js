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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/marshalling", "vs/base/common/performance", "vs/base/common/stopwatch", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/baseTerminalBackend", "vs/workbench/contrib/terminal/browser/remotePty", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/remote/remoteTerminalChannel", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/statusbar/browser/statusbar"], function (require, exports, async_1, event_1, marshalling_1, performance_1, stopwatch_1, commands_1, configuration_1, instantiation_1, platform_1, remoteAuthorityResolver_1, storage_1, terminal_1, workspace_1, baseTerminalBackend_1, remotePty_1, terminal_2, remoteTerminalChannel_1, terminal_3, configurationResolver_1, history_1, remoteAgentService_1, statusbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteTerminalBackendContribution = void 0;
    let RemoteTerminalBackendContribution = class RemoteTerminalBackendContribution {
        static { this.ID = 'remoteTerminalBackend'; }
        constructor(instantiationService, remoteAgentService, terminalInstanceService) {
            const connection = remoteAgentService.getConnection();
            if (connection?.remoteAuthority) {
                const channel = instantiationService.createInstance(remoteTerminalChannel_1.RemoteTerminalChannelClient, connection.remoteAuthority, connection.getChannel(remoteTerminalChannel_1.REMOTE_TERMINAL_CHANNEL_NAME));
                const backend = instantiationService.createInstance(RemoteTerminalBackend, connection.remoteAuthority, channel);
                platform_1.Registry.as(terminal_1.TerminalExtensions.Backend).registerTerminalBackend(backend);
                terminalInstanceService.didRegisterBackend(backend.remoteAuthority);
            }
        }
    };
    exports.RemoteTerminalBackendContribution = RemoteTerminalBackendContribution;
    exports.RemoteTerminalBackendContribution = RemoteTerminalBackendContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, terminal_2.ITerminalInstanceService)
    ], RemoteTerminalBackendContribution);
    let RemoteTerminalBackend = class RemoteTerminalBackend extends baseTerminalBackend_1.BaseTerminalBackend {
        get whenReady() { return this._whenConnected.p; }
        setReady() { this._whenConnected.complete(); }
        constructor(remoteAuthority, _remoteTerminalChannel, _remoteAgentService, _instantiationService, logService, _commandService, _storageService, _remoteAuthorityResolverService, workspaceContextService, configurationResolverService, _historyService, _configurationService, statusBarService) {
            super(_remoteTerminalChannel, logService, _historyService, configurationResolverService, statusBarService, workspaceContextService);
            this.remoteAuthority = remoteAuthority;
            this._remoteTerminalChannel = _remoteTerminalChannel;
            this._remoteAgentService = _remoteAgentService;
            this._instantiationService = _instantiationService;
            this._commandService = _commandService;
            this._storageService = _storageService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._historyService = _historyService;
            this._configurationService = _configurationService;
            this._ptys = new Map();
            this._whenConnected = new async_1.DeferredPromise();
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._onRestoreCommands = this._register(new event_1.Emitter());
            this.onRestoreCommands = this._onRestoreCommands.event;
            this._remoteTerminalChannel.onProcessData(e => this._ptys.get(e.id)?.handleData(e.event));
            this._remoteTerminalChannel.onProcessReplay(e => {
                this._ptys.get(e.id)?.handleReplay(e.event);
                if (e.event.commands.commands.length > 0) {
                    this._onRestoreCommands.fire({ id: e.id, commands: e.event.commands.commands });
                }
            });
            this._remoteTerminalChannel.onProcessOrphanQuestion(e => this._ptys.get(e.id)?.handleOrphanQuestion());
            this._remoteTerminalChannel.onDidRequestDetach(e => this._onDidRequestDetach.fire(e));
            this._remoteTerminalChannel.onProcessReady(e => this._ptys.get(e.id)?.handleReady(e.event));
            this._remoteTerminalChannel.onDidChangeProperty(e => this._ptys.get(e.id)?.handleDidChangeProperty(e.property));
            this._remoteTerminalChannel.onProcessExit(e => {
                const pty = this._ptys.get(e.id);
                if (pty) {
                    pty.handleExit(e.event);
                    this._ptys.delete(e.id);
                }
            });
            const allowedCommands = ['_remoteCLI.openExternal', '_remoteCLI.windowOpen', '_remoteCLI.getSystemStatus', '_remoteCLI.manageExtensions'];
            this._remoteTerminalChannel.onExecuteCommand(async (e) => {
                // Ensure this request for for this window
                const pty = this._ptys.get(e.persistentProcessId);
                if (!pty) {
                    return;
                }
                const reqId = e.reqId;
                const commandId = e.commandId;
                if (!allowedCommands.includes(commandId)) {
                    this._remoteTerminalChannel.sendCommandResult(reqId, true, 'Invalid remote cli command: ' + commandId);
                    return;
                }
                const commandArgs = e.commandArgs.map(arg => (0, marshalling_1.revive)(arg));
                try {
                    const result = await this._commandService.executeCommand(e.commandId, ...commandArgs);
                    this._remoteTerminalChannel.sendCommandResult(reqId, false, result);
                }
                catch (err) {
                    this._remoteTerminalChannel.sendCommandResult(reqId, true, err);
                }
            });
            // Listen for config changes
            const initialConfig = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
            for (const match of Object.keys(initialConfig.autoReplies)) {
                // Ensure the value is truthy
                const reply = initialConfig.autoReplies[match];
                if (reply) {
                    this._remoteTerminalChannel.installAutoReply(match, reply);
                }
            }
            // TODO: Could simplify update to a single call
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */)) {
                    this._remoteTerminalChannel.uninstallAllAutoReplies();
                    const config = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
                    for (const match of Object.keys(config.autoReplies)) {
                        // Ensure the value is truthy
                        const reply = config.autoReplies[match];
                        if (reply) {
                            await this._remoteTerminalChannel.installAutoReply(match, reply);
                        }
                    }
                }
            }));
            this._onPtyHostConnected.fire();
        }
        async requestDetachInstance(workspaceId, instanceId) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot request detach instance when there is no remote!`);
            }
            return this._remoteTerminalChannel.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot accept detached instance when there is no remote!`);
            }
            else if (!persistentProcessId) {
                this._logService.warn('Cannot attach to feature terminals, custom pty terminals, or those without a persistentProcessId');
                return;
            }
            return this._remoteTerminalChannel.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async persistTerminalState() {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot persist terminal state when there is no remote!`);
            }
            const ids = Array.from(this._ptys.keys());
            const serialized = await this._remoteTerminalChannel.serializeTerminalState(ids);
            this._storageService.store("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async createProcess(shellLaunchConfig, cwd, // TODO: This is ignored
        cols, rows, unicodeVersion, env, // TODO: This is ignored
        options, shouldPersist) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot create remote terminal when there is no remote!`);
            }
            // Fetch the environment to check shell permissions
            const remoteEnv = await this._remoteAgentService.getEnvironment();
            if (!remoteEnv) {
                // Extension host processes are only allowed in remote extension hosts currently
                throw new Error('Could not fetch remote environment');
            }
            const terminalConfig = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
            const configuration = {
                'terminal.integrated.env.windows': this._configurationService.getValue("terminal.integrated.env.windows" /* TerminalSettingId.EnvWindows */),
                'terminal.integrated.env.osx': this._configurationService.getValue("terminal.integrated.env.osx" /* TerminalSettingId.EnvMacOs */),
                'terminal.integrated.env.linux': this._configurationService.getValue("terminal.integrated.env.linux" /* TerminalSettingId.EnvLinux */),
                'terminal.integrated.cwd': this._configurationService.getValue("terminal.integrated.cwd" /* TerminalSettingId.Cwd */),
                'terminal.integrated.detectLocale': terminalConfig.detectLocale
            };
            const shellLaunchConfigDto = {
                name: shellLaunchConfig.name,
                executable: shellLaunchConfig.executable,
                args: shellLaunchConfig.args,
                cwd: shellLaunchConfig.cwd,
                env: shellLaunchConfig.env,
                useShellEnvironment: shellLaunchConfig.useShellEnvironment,
                reconnectionProperties: shellLaunchConfig.reconnectionProperties,
                type: shellLaunchConfig.type,
                isFeatureTerminal: shellLaunchConfig.isFeatureTerminal
            };
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
            const result = await this._remoteTerminalChannel.createProcess(shellLaunchConfigDto, configuration, activeWorkspaceRootUri, options, shouldPersist, cols, rows, unicodeVersion);
            const pty = this._instantiationService.createInstance(remotePty_1.RemotePty, result.persistentTerminalId, shouldPersist, this._remoteTerminalChannel);
            this._ptys.set(result.persistentTerminalId, pty);
            return pty;
        }
        async attachToProcess(id) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot create remote terminal when there is no remote!`);
            }
            try {
                await this._remoteTerminalChannel.attachToProcess(id);
                const pty = this._instantiationService.createInstance(remotePty_1.RemotePty, id, true, this._remoteTerminalChannel);
                this._ptys.set(id, pty);
                return pty;
            }
            catch (e) {
                this._logService.trace(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async attachToRevivedProcess(id) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot create remote terminal when there is no remote!`);
            }
            try {
                const newId = await this._remoteTerminalChannel.getRevivedPtyNewId(id) ?? id;
                return await this.attachToProcess(newId);
            }
            catch (e) {
                this._logService.trace(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async listProcesses() {
            return this._remoteTerminalChannel.listProcesses();
        }
        async getLatency() {
            const sw = new stopwatch_1.StopWatch();
            const results = await this._remoteTerminalChannel.getLatency();
            sw.stop();
            return [
                {
                    label: 'window<->ptyhostservice<->ptyhost',
                    latency: sw.elapsed()
                },
                ...results
            ];
        }
        async updateProperty(id, property, value) {
            await this._remoteTerminalChannel.updateProperty(id, property, value);
        }
        async updateTitle(id, title, titleSource) {
            await this._remoteTerminalChannel.updateTitle(id, title, titleSource);
        }
        async updateIcon(id, userInitiated, icon, color) {
            await this._remoteTerminalChannel.updateIcon(id, userInitiated, icon, color);
        }
        async getDefaultSystemShell(osOverride) {
            return this._remoteTerminalChannel.getDefaultSystemShell(osOverride) || '';
        }
        async getProfiles(profiles, defaultProfile, includeDetectedProfiles) {
            return this._remoteTerminalChannel.getProfiles(profiles, defaultProfile, includeDetectedProfiles) || [];
        }
        async getEnvironment() {
            return this._remoteTerminalChannel.getEnvironment() || {};
        }
        async getShellEnvironment() {
            const connection = this._remoteAgentService.getConnection();
            if (!connection) {
                return undefined;
            }
            const resolverResult = await this._remoteAuthorityResolverService.resolveAuthority(connection.remoteAuthority);
            return resolverResult.options?.extensionHostEnv;
        }
        async getWslPath(original, direction) {
            const env = await this._remoteAgentService.getEnvironment();
            if (env?.os !== 1 /* OperatingSystem.Windows */) {
                return original;
            }
            return this._remoteTerminalChannel.getWslPath(original, direction) || original;
        }
        async setTerminalLayoutInfo(layout) {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot call setActiveInstanceId when there is no remote`);
            }
            return this._remoteTerminalChannel.setTerminalLayoutInfo(layout);
        }
        async reduceConnectionGraceTime() {
            if (!this._remoteTerminalChannel) {
                throw new Error('Cannot reduce grace time when there is no remote');
            }
            return this._remoteTerminalChannel.reduceConnectionGraceTime();
        }
        async getTerminalLayoutInfo() {
            if (!this._remoteTerminalChannel) {
                throw new Error(`Cannot call getActiveInstanceId when there is no remote`);
            }
            const workspaceId = this._getWorkspaceId();
            // Revive processes if needed
            const serializedState = this._storageService.get("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
            const reviveBufferState = this._deserializeTerminalState(serializedState);
            if (reviveBufferState && reviveBufferState.length > 0) {
                try {
                    // Note that remote terminals do not get their environment re-resolved unlike in local terminals
                    (0, performance_1.mark)('code/terminal/willReviveTerminalProcessesRemote');
                    await this._remoteTerminalChannel.reviveTerminalProcesses(workspaceId, reviveBufferState, Intl.DateTimeFormat().resolvedOptions().locale);
                    (0, performance_1.mark)('code/terminal/didReviveTerminalProcessesRemote');
                    this._storageService.remove("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
                    // If reviving processes, send the terminal layout info back to the pty host as it
                    // will not have been persisted on application exit
                    const layoutInfo = this._storageService.get("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    if (layoutInfo) {
                        (0, performance_1.mark)('code/terminal/willSetTerminalLayoutInfoRemote');
                        await this._remoteTerminalChannel.setTerminalLayoutInfo(JSON.parse(layoutInfo));
                        (0, performance_1.mark)('code/terminal/didSetTerminalLayoutInfoRemote');
                        this._storageService.remove("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    }
                }
                catch (e) {
                    this._logService.warn('RemoteTerminalBackend#getTerminalLayoutInfo Error', e && typeof e === 'object' && 'message' in e ? e.message : e);
                }
            }
            return this._remoteTerminalChannel.getTerminalLayoutInfo();
        }
        async getPerformanceMarks() {
            return this._remoteTerminalChannel.getPerformanceMarks();
        }
    };
    RemoteTerminalBackend = __decorate([
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, terminal_1.ITerminalLogService),
        __param(5, commands_1.ICommandService),
        __param(6, storage_1.IStorageService),
        __param(7, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configurationResolver_1.IConfigurationResolverService),
        __param(10, history_1.IHistoryService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, statusbar_1.IStatusbarService)
    ], RemoteTerminalBackend);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlVGVybWluYWxCYWNrZW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3JlbW90ZVRlcm1pbmFsQmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4QnpGLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWlDO2lCQUN0QyxPQUFFLEdBQUcsdUJBQXVCLEFBQTFCLENBQTJCO1FBRXBDLFlBQ3dCLG9CQUEyQyxFQUM3QyxrQkFBdUMsRUFDbEMsdUJBQWlEO1lBRTNFLE1BQU0sVUFBVSxHQUFHLGtCQUFrQixDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RELElBQUksVUFBVSxFQUFFLGVBQWUsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsbURBQTJCLEVBQUUsVUFBVSxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLG9EQUE0QixDQUFDLENBQUMsQ0FBQztnQkFDbEssTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHFCQUFxQixFQUFFLFVBQVUsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hILG1CQUFRLENBQUMsRUFBRSxDQUEyQiw2QkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkcsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3JFLENBQUM7UUFDRixDQUFDOztJQWZXLDhFQUFpQztnREFBakMsaUNBQWlDO1FBSTNDLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSx3Q0FBbUIsQ0FBQTtRQUNuQixXQUFB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