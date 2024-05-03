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
define(["require", "exports", "vs/base/common/event", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-sandbox/localPty", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/electron-sandbox/shellEnvironmentService", "vs/workbench/services/history/common/history", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/platform/product/common/productService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/browser/baseTerminalBackend", "vs/platform/native/common/native", "vs/base/parts/ipc/common/ipc.mp", "vs/base/parts/ipc/electron-sandbox/ipc.mp", "vs/base/parts/ipc/common/ipc", "vs/base/common/performance", "vs/workbench/services/lifecycle/common/lifecycle", "vs/base/common/async", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/decorators", "vs/base/common/stopwatch", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, event_1, platform_1, configuration_1, instantiation_1, label_1, platform_2, storage_1, terminal_1, workspace_1, terminal_2, terminal_3, localPty_1, configurationResolver_1, shellEnvironmentService_1, history_1, terminalEnvironment, productService_1, environmentVariable_1, baseTerminalBackend_1, native_1, ipc_mp_1, ipc_mp_2, ipc_1, performance_1, lifecycle_1, async_1, statusbar_1, decorators_1, stopwatch_1, remoteAgentService_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalTerminalBackendContribution = void 0;
    let LocalTerminalBackendContribution = class LocalTerminalBackendContribution {
        static { this.ID = 'workbench.contrib.localTerminalBackend'; }
        constructor(instantiationService, terminalInstanceService) {
            const backend = instantiationService.createInstance(LocalTerminalBackend);
            platform_2.Registry.as(terminal_1.TerminalExtensions.Backend).registerTerminalBackend(backend);
            terminalInstanceService.didRegisterBackend(backend.remoteAuthority);
        }
    };
    exports.LocalTerminalBackendContribution = LocalTerminalBackendContribution;
    exports.LocalTerminalBackendContribution = LocalTerminalBackendContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, terminal_2.ITerminalInstanceService)
    ], LocalTerminalBackendContribution);
    let LocalTerminalBackend = class LocalTerminalBackend extends baseTerminalBackend_1.BaseTerminalBackend {
        /**
         * Communicate to the direct proxy (renderer<->ptyhost) if it's available, otherwise use the
         * indirect proxy (renderer<->main<->ptyhost). The latter may not need to actually launch the
         * pty host, for example when detecting profiles.
         */
        get _proxy() { return this._directProxy || this._localPtyService; }
        get whenReady() { return this._whenReady.p; }
        setReady() { this._whenReady.complete(); }
        constructor(workspaceContextService, _lifecycleService, logService, _localPtyService, _labelService, _shellEnvironmentService, _storageService, _configurationResolverService, _configurationService, _productService, _historyService, _terminalProfileResolverService, _environmentVariableService, historyService, _nativeHostService, statusBarService, _remoteAgentService) {
            super(_localPtyService, logService, historyService, _configurationResolverService, statusBarService, workspaceContextService);
            this._lifecycleService = _lifecycleService;
            this._localPtyService = _localPtyService;
            this._labelService = _labelService;
            this._shellEnvironmentService = _shellEnvironmentService;
            this._storageService = _storageService;
            this._configurationResolverService = _configurationResolverService;
            this._configurationService = _configurationService;
            this._productService = _productService;
            this._historyService = _historyService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._environmentVariableService = _environmentVariableService;
            this._nativeHostService = _nativeHostService;
            this._remoteAgentService = _remoteAgentService;
            this.remoteAuthority = undefined;
            this._ptys = new Map();
            this._whenReady = new async_1.DeferredPromise();
            this._onDidRequestDetach = this._register(new event_1.Emitter());
            this.onDidRequestDetach = this._onDidRequestDetach.event;
            this._register(this.onPtyHostRestart(() => {
                this._directProxy = undefined;
                this._directProxyClientEventually = undefined;
                this._connectToDirectProxy();
            }));
        }
        /**
         * Request a direct connection to the pty host, this will launch the pty host process if necessary.
         */
        async _connectToDirectProxy() {
            // Check if connecting is in progress
            if (this._directProxyClientEventually) {
                await this._directProxyClientEventually.p;
                return;
            }
            this._logService.debug('Starting pty host');
            const directProxyClientEventually = new async_1.DeferredPromise();
            this._directProxyClientEventually = directProxyClientEventually;
            const directProxy = ipc_1.ProxyChannel.toService((0, ipc_1.getDelayedChannel)(this._directProxyClientEventually.p.then(client => client.getChannel(terminal_1.TerminalIpcChannels.PtyHostWindow))));
            this._directProxy = directProxy;
            // The pty host should not get launched until at least the window restored phase
            // if remote auth exists, don't await
            if (!this._remoteAgentService.getConnection()?.remoteAuthority) {
                await this._lifecycleService.when(3 /* LifecyclePhase.Restored */);
            }
            (0, performance_1.mark)('code/terminal/willConnectPtyHost');
            this._logService.trace('Renderer->PtyHost#connect: before acquirePort');
            (0, ipc_mp_2.acquirePort)('vscode:createPtyHostMessageChannel', 'vscode:createPtyHostMessageChannelResult').then(port => {
                (0, performance_1.mark)('code/terminal/didConnectPtyHost');
                this._logService.trace('Renderer->PtyHost#connect: connection established');
                // There are two connections to the pty host; one to the regular shared process
                // _localPtyService, and one directly via message port _ptyHostDirectProxy. The former is
                // used for pty host management messages, it would make sense in the future to use a
                // separate interface/service for this one.
                const client = new ipc_mp_1.Client(port, `window:${this._nativeHostService.windowId}`);
                directProxyClientEventually.complete(client);
                this._onPtyHostConnected.fire();
                // Attach process listeners
                directProxy.onProcessData(e => this._ptys.get(e.id)?.handleData(e.event));
                directProxy.onDidChangeProperty(e => this._ptys.get(e.id)?.handleDidChangeProperty(e.property));
                directProxy.onProcessExit(e => {
                    const pty = this._ptys.get(e.id);
                    if (pty) {
                        pty.handleExit(e.event);
                        this._ptys.delete(e.id);
                    }
                });
                directProxy.onProcessReady(e => this._ptys.get(e.id)?.handleReady(e.event));
                directProxy.onProcessReplay(e => this._ptys.get(e.id)?.handleReplay(e.event));
                directProxy.onProcessOrphanQuestion(e => this._ptys.get(e.id)?.handleOrphanQuestion());
                directProxy.onDidRequestDetach(e => this._onDidRequestDetach.fire(e));
                // Listen for config changes
                const initialConfig = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
                for (const match of Object.keys(initialConfig.autoReplies)) {
                    // Ensure the reply is value
                    const reply = initialConfig.autoReplies[match];
                    if (reply) {
                        directProxy.installAutoReply(match, reply);
                    }
                }
                // TODO: Could simplify update to a single call
                this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                    if (e.affectsConfiguration("terminal.integrated.autoReplies" /* TerminalSettingId.AutoReplies */)) {
                        directProxy.uninstallAllAutoReplies();
                        const config = this._configurationService.getValue(terminal_3.TERMINAL_CONFIG_SECTION);
                        for (const match of Object.keys(config.autoReplies)) {
                            // Ensure the reply is value
                            const reply = config.autoReplies[match];
                            if (reply) {
                                this._proxy.installAutoReply(match, reply);
                            }
                        }
                    }
                }));
                // Eagerly fetch the backend's environment for memoization
                this.getEnvironment();
            });
        }
        async requestDetachInstance(workspaceId, instanceId) {
            return this._proxy.requestDetachInstance(workspaceId, instanceId);
        }
        async acceptDetachInstanceReply(requestId, persistentProcessId) {
            if (!persistentProcessId) {
                this._logService.warn('Cannot attach to feature terminals, custom pty terminals, or those without a persistentProcessId');
                return;
            }
            return this._proxy.acceptDetachInstanceReply(requestId, persistentProcessId);
        }
        async persistTerminalState() {
            const ids = Array.from(this._ptys.keys());
            const serialized = await this._proxy.serializeTerminalState(ids);
            this._storageService.store("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async updateTitle(id, title, titleSource) {
            await this._proxy.updateTitle(id, title, titleSource);
        }
        async updateIcon(id, userInitiated, icon, color) {
            await this._proxy.updateIcon(id, userInitiated, icon, color);
        }
        async updateProperty(id, property, value) {
            return this._proxy.updateProperty(id, property, value);
        }
        async createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, options, shouldPersist) {
            await this._connectToDirectProxy();
            const executableEnv = await this._shellEnvironmentService.getShellEnv();
            const id = await this._proxy.createProcess(shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, executableEnv, options, shouldPersist, this._getWorkspaceId(), this._getWorkspaceName());
            const pty = new localPty_1.LocalPty(id, shouldPersist, this._proxy);
            this._ptys.set(id, pty);
            return pty;
        }
        async attachToProcess(id) {
            await this._connectToDirectProxy();
            try {
                await this._proxy.attachToProcess(id);
                const pty = new localPty_1.LocalPty(id, true, this._proxy);
                this._ptys.set(id, pty);
                return pty;
            }
            catch (e) {
                this._logService.warn(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async attachToRevivedProcess(id) {
            await this._connectToDirectProxy();
            try {
                const newId = await this._proxy.getRevivedPtyNewId(this._getWorkspaceId(), id) ?? id;
                return await this.attachToProcess(newId);
            }
            catch (e) {
                this._logService.warn(`Couldn't attach to process ${e.message}`);
            }
            return undefined;
        }
        async listProcesses() {
            await this._connectToDirectProxy();
            return this._proxy.listProcesses();
        }
        async getLatency() {
            const measurements = [];
            const sw = new stopwatch_1.StopWatch();
            if (this._directProxy) {
                await this._directProxy.getLatency();
                sw.stop();
                measurements.push({
                    label: 'window<->ptyhost (message port)',
                    latency: sw.elapsed()
                });
                sw.reset();
            }
            const results = await this._localPtyService.getLatency();
            sw.stop();
            measurements.push({
                label: 'window<->ptyhostservice<->ptyhost',
                latency: sw.elapsed()
            });
            return [
                ...measurements,
                ...results
            ];
        }
        async getPerformanceMarks() {
            return this._proxy.getPerformanceMarks();
        }
        async reduceConnectionGraceTime() {
            this._proxy.reduceConnectionGraceTime();
        }
        async getDefaultSystemShell(osOverride) {
            return this._proxy.getDefaultSystemShell(osOverride);
        }
        async getProfiles(profiles, defaultProfile, includeDetectedProfiles) {
            return this._localPtyService.getProfiles(this._workspaceContextService.getWorkspace().id, profiles, defaultProfile, includeDetectedProfiles) || [];
        }
        async getEnvironment() {
            return this._proxy.getEnvironment();
        }
        async getShellEnvironment() {
            return this._shellEnvironmentService.getShellEnv();
        }
        async getWslPath(original, direction) {
            return this._proxy.getWslPath(original, direction);
        }
        async setTerminalLayoutInfo(layoutInfo) {
            const args = {
                workspaceId: this._getWorkspaceId(),
                tabs: layoutInfo ? layoutInfo.tabs : []
            };
            await this._proxy.setTerminalLayoutInfo(args);
            // Store in the storage service as well to be used when reviving processes as normally this
            // is stored in memory on the pty host
            this._storageService.store("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, JSON.stringify(args), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async getTerminalLayoutInfo() {
            const workspaceId = this._getWorkspaceId();
            const layoutArgs = { workspaceId };
            // Revive processes if needed
            const serializedState = this._storageService.get("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
            const reviveBufferState = this._deserializeTerminalState(serializedState);
            if (reviveBufferState && reviveBufferState.length > 0) {
                try {
                    // Create variable resolver
                    const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
                    const lastActiveWorkspace = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) ?? undefined : undefined;
                    const variableResolver = terminalEnvironment.createVariableResolver(lastActiveWorkspace, await this._terminalProfileResolverService.getEnvironment(this.remoteAuthority), this._configurationResolverService);
                    // Re-resolve the environments and replace it on the state so local terminals use a fresh
                    // environment
                    (0, performance_1.mark)('code/terminal/willGetReviveEnvironments');
                    await Promise.all(reviveBufferState.map(state => new Promise(r => {
                        this._resolveEnvironmentForRevive(variableResolver, state.shellLaunchConfig).then(freshEnv => {
                            state.processLaunchConfig.env = freshEnv;
                            r();
                        });
                    })));
                    (0, performance_1.mark)('code/terminal/didGetReviveEnvironments');
                    (0, performance_1.mark)('code/terminal/willReviveTerminalProcesses');
                    await this._proxy.reviveTerminalProcesses(workspaceId, reviveBufferState, Intl.DateTimeFormat().resolvedOptions().locale);
                    (0, performance_1.mark)('code/terminal/didReviveTerminalProcesses');
                    this._storageService.remove("terminal.integrated.bufferState" /* TerminalStorageKeys.TerminalBufferState */, 1 /* StorageScope.WORKSPACE */);
                    // If reviving processes, send the terminal layout info back to the pty host as it
                    // will not have been persisted on application exit
                    const layoutInfo = this._storageService.get("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    if (layoutInfo) {
                        (0, performance_1.mark)('code/terminal/willSetTerminalLayoutInfo');
                        await this._proxy.setTerminalLayoutInfo(JSON.parse(layoutInfo));
                        (0, performance_1.mark)('code/terminal/didSetTerminalLayoutInfo');
                        this._storageService.remove("terminal.integrated.layoutInfo" /* TerminalStorageKeys.TerminalLayoutInfo */, 1 /* StorageScope.WORKSPACE */);
                    }
                }
                catch (e) {
                    this._logService.warn('LocalTerminalBackend#getTerminalLayoutInfo Error', e && typeof e === 'object' && 'message' in e ? e.message : e);
                }
            }
            return this._proxy.getTerminalLayoutInfo(layoutArgs);
        }
        async _resolveEnvironmentForRevive(variableResolver, shellLaunchConfig) {
            const platformKey = platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
            const envFromConfigValue = this._configurationService.getValue(`terminal.integrated.env.${platformKey}`);
            const baseEnv = await (shellLaunchConfig.useShellEnvironment ? this.getShellEnvironment() : this.getEnvironment());
            const env = await terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, envFromConfigValue, variableResolver, this._productService.version, this._configurationService.getValue("terminal.integrated.detectLocale" /* TerminalSettingId.DetectLocale */), baseEnv);
            if ((0, terminalEnvironment_1.shouldUseEnvironmentVariableCollection)(shellLaunchConfig)) {
                const workspaceFolder = terminalEnvironment.getWorkspaceForTerminal(shellLaunchConfig.cwd, this._workspaceContextService, this._historyService);
                await this._environmentVariableService.mergedCollection.applyToProcessEnvironment(env, { workspaceFolder }, variableResolver);
            }
            return env;
        }
        _getWorkspaceName() {
            return this._labelService.getWorkspaceLabel(this._workspaceContextService.getWorkspace());
        }
    };
    __decorate([
        decorators_1.memoize
    ], LocalTerminalBackend.prototype, "getEnvironment", null);
    __decorate([
        decorators_1.memoize
    ], LocalTerminalBackend.prototype, "getShellEnvironment", null);
    LocalTerminalBackend = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, lifecycle_1.ILifecycleService),
        __param(2, terminal_1.ITerminalLogService),
        __param(3, terminal_1.ILocalPtyService),
        __param(4, label_1.ILabelService),
        __param(5, shellEnvironmentService_1.IShellEnvironmentService),
        __param(6, storage_1.IStorageService),
        __param(7, configurationResolver_1.IConfigurationResolverService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, productService_1.IProductService),
        __param(10, history_1.IHistoryService),
        __param(11, terminal_3.ITerminalProfileResolverService),
        __param(12, environmentVariable_1.IEnvironmentVariableService),
        __param(13, history_1.IHistoryService),
        __param(14, native_1.INativeHostService),
        __param(15, statusbar_1.IStatusbarService),
        __param(16, remoteAgentService_1.IRemoteAgentService)
    ], LocalTerminalBackend);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWxUZXJtaW5hbEJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2VsZWN0cm9uLXNhbmRib3gvbG9jYWxUZXJtaW5hbEJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0N6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFnQztpQkFFNUIsT0FBRSxHQUFHLHdDQUF3QyxBQUEzQyxDQUE0QztRQUU5RCxZQUN3QixvQkFBMkMsRUFDeEMsdUJBQWlEO1lBRTNFLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQzFFLG1CQUFRLENBQUMsRUFBRSxDQUEyQiw2QkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuRyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDckUsQ0FBQzs7SUFYVyw0RUFBZ0M7K0NBQWhDLGdDQUFnQztRQUsxQyxXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsbUNBQXdCLENBQUE7T0FOZCxnQ0FBZ0MsQ0FZNUM7SUFFRCxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFxQixTQUFRLHlDQUFtQjtRQU9yRDs7OztXQUlHO1FBQ0gsSUFBWSxNQUFNLEtBQWtCLE9BQU8sSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBR3hGLElBQUksU0FBUyxLQUFvQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RCxRQUFRLEtBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFLaEQsWUFDMkIsdUJBQWlELEVBQ3hELGlCQUFxRCxFQUNuRCxVQUErQixFQUNsQyxnQkFBbUQsRUFDdEQsYUFBNkMsRUFDbEMsd0JBQW1FLEVBQzVFLGVBQWlELEVBQ25DLDZCQUE2RSxFQUNyRixxQkFBNkQsRUFDbkUsZUFBaUQsRUFDakQsZUFBaUQsRUFDakMsK0JBQWlGLEVBQ3JGLDJCQUF5RSxFQUNyRixjQUErQixFQUM1QixrQkFBdUQsRUFDeEQsZ0JBQW1DLEVBQ2pDLG1CQUF5RDtZQUU5RSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSw2QkFBNkIsRUFBRSxnQkFBZ0IsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1lBakIxRixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBRXJDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0I7WUFDckMsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFDakIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUMzRCxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDbEIsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUNwRSwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ2xELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUNoQyxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFDaEIsb0NBQStCLEdBQS9CLCtCQUErQixDQUFpQztZQUNwRSxnQ0FBMkIsR0FBM0IsMkJBQTJCLENBQTZCO1lBRWpFLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFFckMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQXJDdEUsb0JBQWUsR0FBRyxTQUFTLENBQUM7WUFFcEIsVUFBSyxHQUEwQixJQUFJLEdBQUcsRUFBRSxDQUFDO1lBV3pDLGVBQVUsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztZQUl6Qyx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFrRSxDQUFDLENBQUM7WUFDNUgsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztZQXVCNUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFO2dCQUN6QyxJQUFJLENBQUMsWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLDRCQUE0QixHQUFHLFNBQVMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRDs7V0FFRztRQUNLLEtBQUssQ0FBQyxxQkFBcUI7WUFDbEMscUNBQXFDO1lBQ3JDLElBQUksSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ3ZDLE1BQU0sSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQztnQkFDMUMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sMkJBQTJCLEdBQUcsSUFBSSx1QkFBZSxFQUFxQixDQUFDO1lBQzdFLElBQUksQ0FBQyw0QkFBNEIsR0FBRywyQkFBMkIsQ0FBQztZQUNoRSxNQUFNLFdBQVcsR0FBRyxrQkFBWSxDQUFDLFNBQVMsQ0FBYyxJQUFBLHVCQUFpQixFQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyw4QkFBbUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyTCxJQUFJLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQztZQUVoQyxnRkFBZ0Y7WUFDaEYscUNBQXFDO1lBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsYUFBYSxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUM7Z0JBQ2hFLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksaUNBQXlCLENBQUM7WUFDNUQsQ0FBQztZQUVELElBQUEsa0JBQUksRUFBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7WUFDeEUsSUFBQSxvQkFBVyxFQUFDLG9DQUFvQyxFQUFFLDBDQUEwQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6RyxJQUFBLGtCQUFJLEVBQUMsaUNBQWlDLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztnQkFDNUUsK0VBQStFO2dCQUMvRSx5RkFBeUY7Z0JBQ3pGLG9GQUFvRjtnQkFDcEYsMkNBQTJDO2dCQUMzQyxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQWlCLENBQUMsSUFBSSxFQUFFLFVBQVUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3pGLDJCQUEyQixDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDN0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxDQUFDO2dCQUVoQywyQkFBMkI7Z0JBQzNCLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUMxRSxXQUFXLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hHLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDakMsSUFBSSxHQUFHLEVBQUUsQ0FBQzt3QkFDVCxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN6QixDQUFDO2dCQUNGLENBQUMsQ0FBQyxDQUFDO2dCQUNILFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM1RSxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDOUUsV0FBVyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLENBQUMsQ0FBQztnQkFDdkYsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV0RSw0QkFBNEI7Z0JBQzVCLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQXlCLGtDQUF1QixDQUFDLENBQUM7Z0JBQzNHLEtBQUssTUFBTSxLQUFLLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztvQkFDNUQsNEJBQTRCO29CQUM1QixNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBa0IsQ0FBQztvQkFDaEUsSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDWCxXQUFXLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUM1QyxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsK0NBQStDO2dCQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUMsQ0FBQyxFQUFDLEVBQUU7b0JBQzVFLElBQUksQ0FBQyxDQUFDLG9CQUFvQix1RUFBK0IsRUFBRSxDQUFDO3dCQUMzRCxXQUFXLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzt3QkFDdEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBeUIsa0NBQXVCLENBQUMsQ0FBQzt3QkFDcEcsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDOzRCQUNyRCw0QkFBNEI7NEJBQzVCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFrQixDQUFDOzRCQUN6RCxJQUFJLEtBQUssRUFBRSxDQUFDO2dDQUNYLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDOzRCQUM1QyxDQUFDO3dCQUNGLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLDBEQUEwRDtnQkFDMUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxXQUFtQixFQUFFLFVBQWtCO1lBQ2xFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxTQUFpQixFQUFFLG1CQUE0QjtZQUM5RSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsa0dBQWtHLENBQUMsQ0FBQztnQkFDMUgsT0FBTztZQUNSLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMseUJBQXlCLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDOUUsQ0FBQztRQUVELEtBQUssQ0FBQyxvQkFBb0I7WUFDekIsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7WUFDMUMsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pFLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxrRkFBMEMsVUFBVSxnRUFBZ0QsQ0FBQztRQUNoSSxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFVLEVBQUUsS0FBYSxFQUFFLFdBQTZCO1lBQ3pFLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFVLEVBQUUsYUFBc0IsRUFBRSxJQUE4RSxFQUFFLEtBQWM7WUFDbEosTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBZ0MsRUFBVSxFQUFFLFFBQTZCLEVBQUUsS0FBNkI7WUFDM0gsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hELENBQUM7UUFFRCxLQUFLLENBQUMsYUFBYSxDQUNsQixpQkFBcUMsRUFDckMsR0FBVyxFQUNYLElBQVksRUFDWixJQUFZLEVBQ1osY0FBMEIsRUFDMUIsR0FBd0IsRUFDeEIsT0FBZ0MsRUFDaEMsYUFBc0I7WUFFdEIsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUNuQyxNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN4RSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7WUFDN0wsTUFBTSxHQUFHLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pELElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN4QixPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZSxDQUFDLEVBQVU7WUFDL0IsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLE9BQU8sR0FBRyxDQUFDO1lBQ1osQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2xFLENBQUM7WUFDRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsS0FBSyxDQUFDLHNCQUFzQixDQUFDLEVBQVU7WUFDdEMsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUNuQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3JGLE9BQU8sTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNsRSxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDbkMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ3BDLENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVTtZQUNmLE1BQU0sWUFBWSxHQUFpQyxFQUFFLENBQUM7WUFDdEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxxQkFBUyxFQUFFLENBQUM7WUFDM0IsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDckMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNWLFlBQVksQ0FBQyxJQUFJLENBQUM7b0JBQ2pCLEtBQUssRUFBRSxpQ0FBaUM7b0JBQ3hDLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFO2lCQUNyQixDQUFDLENBQUM7Z0JBQ0gsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1osQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ3pELEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0JBQ2pCLEtBQUssRUFBRSxtQ0FBbUM7Z0JBQzFDLE9BQU8sRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFO2FBQ3JCLENBQUMsQ0FBQztZQUNILE9BQU87Z0JBQ04sR0FBRyxZQUFZO2dCQUNmLEdBQUcsT0FBTzthQUNWLENBQUM7UUFDSCxDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQjtZQUN4QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUMxQyxDQUFDO1FBRUQsS0FBSyxDQUFDLHlCQUF5QjtZQUM5QixJQUFJLENBQUMsTUFBTSxDQUFDLHlCQUF5QixFQUFFLENBQUM7UUFDekMsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxVQUE0QjtZQUN2RCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBaUIsRUFBRSxjQUF1QixFQUFFLHVCQUFpQztZQUM5RixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksRUFBRSxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3BKLENBQUM7UUFHSyxBQUFOLEtBQUssQ0FBQyxjQUFjO1lBQ25CLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQyxDQUFDO1FBR0ssQUFBTixLQUFLLENBQUMsbUJBQW1CO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BELENBQUM7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLFFBQWdCLEVBQUUsU0FBd0M7WUFDMUUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxVQUFxQztZQUNoRSxNQUFNLElBQUksR0FBK0I7Z0JBQ3hDLFdBQVcsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUNuQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO2FBQ3ZDLENBQUM7WUFDRixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUMsMkZBQTJGO1lBQzNGLHNDQUFzQztZQUN0QyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssZ0ZBQXlDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdFQUFnRCxDQUFDO1FBQ3pJLENBQUM7UUFFRCxLQUFLLENBQUMscUJBQXFCO1lBQzFCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUMzQyxNQUFNLFVBQVUsR0FBK0IsRUFBRSxXQUFXLEVBQUUsQ0FBQztZQUUvRCw2QkFBNkI7WUFDN0IsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLGlIQUFpRSxDQUFDO1lBQ2xILE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzFFLElBQUksaUJBQWlCLElBQUksaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxJQUFJLENBQUM7b0JBQ0osMkJBQTJCO29CQUMzQixNQUFNLHNCQUFzQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztvQkFDakYsTUFBTSxtQkFBbUIsR0FBRyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixDQUFDLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ3ZKLE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUMsc0JBQXNCLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxJQUFJLENBQUMsK0JBQStCLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLENBQUMsNkJBQTZCLENBQUMsQ0FBQztvQkFFOU0seUZBQXlGO29CQUN6RixjQUFjO29CQUNkLElBQUEsa0JBQUksRUFBQyx5Q0FBeUMsQ0FBQyxDQUFDO29CQUNoRCxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUU7d0JBQ3RFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7NEJBQzVGLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDOzRCQUN6QyxDQUFDLEVBQUUsQ0FBQzt3QkFDTCxDQUFDLENBQUMsQ0FBQztvQkFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ0wsSUFBQSxrQkFBSSxFQUFDLHdDQUF3QyxDQUFDLENBQUM7b0JBRS9DLElBQUEsa0JBQUksRUFBQywyQ0FBMkMsQ0FBQyxDQUFDO29CQUNsRCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLGlCQUFpQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDMUgsSUFBQSxrQkFBSSxFQUFDLDBDQUEwQyxDQUFDLENBQUM7b0JBQ2pELElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxpSEFBaUUsQ0FBQztvQkFDN0Ysa0ZBQWtGO29CQUNsRixtREFBbUQ7b0JBQ25ELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRywrR0FBZ0UsQ0FBQztvQkFDNUcsSUFBSSxVQUFVLEVBQUUsQ0FBQzt3QkFDaEIsSUFBQSxrQkFBSSxFQUFDLHlDQUF5QyxDQUFDLENBQUM7d0JBQ2hELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7d0JBQ2hFLElBQUEsa0JBQUksRUFBQyx3Q0FBd0MsQ0FBQyxDQUFDO3dCQUMvQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sK0dBQWdFLENBQUM7b0JBQzdGLENBQUM7Z0JBQ0YsQ0FBQztnQkFBQyxPQUFPLENBQVUsRUFBRSxDQUFDO29CQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxrREFBa0QsRUFBRSxDQUFDLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6SSxDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRU8sS0FBSyxDQUFDLDRCQUE0QixDQUFDLGdCQUFrRSxFQUFFLGlCQUFxQztZQUNuSixNQUFNLFdBQVcsR0FBRyxvQkFBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsc0JBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM1RSxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLENBQW1DLDJCQUEyQixXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQzNJLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ25ILE1BQU0sR0FBRyxHQUFHLE1BQU0sbUJBQW1CLENBQUMseUJBQXlCLENBQUMsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEseUVBQWdDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDck8sSUFBSSxJQUFBLDREQUFzQyxFQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQztnQkFDL0QsTUFBTSxlQUFlLEdBQUcsbUJBQW1CLENBQUMsdUJBQXVCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ2hKLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDLEdBQUcsRUFBRSxFQUFFLGVBQWUsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDL0gsQ0FBQztZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ1osQ0FBQztRQUVPLGlCQUFpQjtZQUN4QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDM0YsQ0FBQztLQUNELENBQUE7SUFyRk07UUFETCxvQkFBTzs4REFHUDtJQUdLO1FBREwsb0JBQU87bUVBR1A7SUE3UEksb0JBQW9CO1FBc0J2QixXQUFBLG9DQUF3QixDQUFBO1FBQ3hCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsV0FBQSw4QkFBbUIsQ0FBQTtRQUNuQixXQUFBLDJCQUFnQixDQUFBO1FBQ2hCLFdBQUEscUJBQWEsQ0FBQTtRQUNiLFdBQUEsa0RBQXdCLENBQUE7UUFDeEIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSxxREFBNkIsQ0FBQTtRQUM3QixXQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFdBQUEsZ0NBQWUsQ0FBQTtRQUNmLFlBQUEseUJBQWUsQ0FBQTtRQUNmLFlBQUEsMENBQStCLENBQUE7UUFDL0IsWUFBQSxpREFBMkIsQ0FBQTtRQUMzQixZQUFBLHlCQUFlLENBQUE7UUFDZixZQUFBLDJCQUFrQixDQUFBO1FBQ2xCLFlBQUEsNkJBQWlCLENBQUE7UUFDakIsWUFBQSx3Q0FBbUIsQ0FBQTtPQXRDaEIsb0JBQW9CLENBMlV6QiJ9