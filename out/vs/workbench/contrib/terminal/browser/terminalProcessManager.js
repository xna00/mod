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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/nls", "vs/platform/terminal/common/terminalStrings", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/productService", "vs/platform/remote/common/remoteHosts", "vs/platform/telemetry/common/telemetry", "vs/platform/terminal/common/capabilities/naiveCwdDetectionCapability", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalRecorder", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/environmentVariableInfo", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/platform/terminal/common/environmentVariableCollection", "vs/platform/terminal/common/environmentVariableShared", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/path/common/pathService", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/base/common/uuid", "vs/base/browser/dom", "vs/base/browser/window", "vs/platform/terminal/common/terminalEnvironment"], function (require, exports, event_1, lifecycle_1, network_1, platform_1, nls_1, terminalStrings_1, configuration_1, instantiation_1, productService_1, remoteHosts_1, telemetry_1, naiveCwdDetectionCapability_1, terminalCapabilityStore_1, terminal_1, terminalRecorder_1, workspace_1, environmentVariableInfo_1, terminal_2, environmentVariable_1, environmentVariableCollection_1, environmentVariableShared_1, terminal_3, terminalEnvironment, configurationResolver_1, environmentService_1, history_1, pathService_1, remoteAgentService_1, severity_1, notification_1, uuid_1, dom_1, window_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProcessManager = void 0;
    var ProcessConstants;
    (function (ProcessConstants) {
        /**
         * The amount of time to consider terminal errors to be related to the launch.
         */
        ProcessConstants[ProcessConstants["ErrorLaunchThresholdDuration"] = 500] = "ErrorLaunchThresholdDuration";
        /**
         * The minimum amount of time between latency requests.
         */
        ProcessConstants[ProcessConstants["LatencyMeasuringInterval"] = 1000] = "LatencyMeasuringInterval";
    })(ProcessConstants || (ProcessConstants = {}));
    var ProcessType;
    (function (ProcessType) {
        ProcessType[ProcessType["Process"] = 0] = "Process";
        ProcessType[ProcessType["PsuedoTerminal"] = 1] = "PsuedoTerminal";
    })(ProcessType || (ProcessType = {}));
    /**
     * Holds all state related to the creation and management of terminal processes.
     *
     * Internal definitions:
     * - Process: The process launched with the terminalProcess.ts file, or the pty as a whole
     * - Pty Process: The pseudoterminal parent process (or the conpty/winpty agent process)
     * - Shell Process: The pseudoterminal child process (ie. the shell)
     */
    let TerminalProcessManager = class TerminalProcessManager extends lifecycle_1.Disposable {
        get persistentProcessId() { return this._process?.id; }
        get shouldPersist() { return !!this.reconnectionProperties || (this._process ? this._process.shouldPersist : false); }
        get hasWrittenData() { return this._hasWrittenData; }
        get hasChildProcesses() { return this._hasChildProcesses; }
        get reconnectionProperties() { return this._shellLaunchConfig?.attachPersistentProcess?.reconnectionProperties || this._shellLaunchConfig?.reconnectionProperties || undefined; }
        get extEnvironmentVariableCollection() { return this._extEnvironmentVariableCollection; }
        constructor(_instanceId, _configHelper, cwd, environmentVariableCollections, shellIntegrationNonce, _historyService, _instantiationService, _logService, _workspaceContextService, _configurationResolverService, _workbenchEnvironmentService, _productService, _remoteAgentService, _pathService, _environmentVariableService, _terminalProfileResolverService, _configurationService, _terminalInstanceService, _telemetryService, _notificationService) {
            super();
            this._instanceId = _instanceId;
            this._configHelper = _configHelper;
            this._historyService = _historyService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._workspaceContextService = _workspaceContextService;
            this._configurationResolverService = _configurationResolverService;
            this._workbenchEnvironmentService = _workbenchEnvironmentService;
            this._productService = _productService;
            this._remoteAgentService = _remoteAgentService;
            this._pathService = _pathService;
            this._environmentVariableService = _environmentVariableService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._configurationService = _configurationService;
            this._terminalInstanceService = _terminalInstanceService;
            this._telemetryService = _telemetryService;
            this._notificationService = _notificationService;
            this.processState = 1 /* ProcessState.Uninitialized */;
            this.capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            this._isDisposed = false;
            this._process = null;
            this._processType = 0 /* ProcessType.Process */;
            this._preLaunchInputQueue = [];
            this._hasWrittenData = false;
            this._hasChildProcesses = false;
            this._ptyListenersAttached = false;
            this._isDisconnected = false;
            this._dimensions = { cols: 0, rows: 0 };
            this._onPtyDisconnect = this._register(new event_1.Emitter());
            this.onPtyDisconnect = this._onPtyDisconnect.event;
            this._onPtyReconnect = this._register(new event_1.Emitter());
            this.onPtyReconnect = this._onPtyReconnect.event;
            this._onProcessReady = this._register(new event_1.Emitter());
            this.onProcessReady = this._onProcessReady.event;
            this._onProcessStateChange = this._register(new event_1.Emitter());
            this.onProcessStateChange = this._onProcessStateChange.event;
            this._onBeforeProcessData = this._register(new event_1.Emitter());
            this.onBeforeProcessData = this._onBeforeProcessData.event;
            this._onProcessData = this._register(new event_1.Emitter());
            this.onProcessData = this._onProcessData.event;
            this._onProcessReplayComplete = this._register(new event_1.Emitter());
            this.onProcessReplayComplete = this._onProcessReplayComplete.event;
            this._onDidChangeProperty = this._register(new event_1.Emitter());
            this.onDidChangeProperty = this._onDidChangeProperty.event;
            this._onEnvironmentVariableInfoChange = this._register(new event_1.Emitter());
            this.onEnvironmentVariableInfoChanged = this._onEnvironmentVariableInfoChange.event;
            this._onProcessExit = this._register(new event_1.Emitter());
            this.onProcessExit = this._onProcessExit.event;
            this._onRestoreCommands = this._register(new event_1.Emitter());
            this.onRestoreCommands = this._onRestoreCommands.event;
            this._cwdWorkspaceFolder = terminalEnvironment.getWorkspaceForTerminal(cwd, this._workspaceContextService, this._historyService);
            this.ptyProcessReady = this._createPtyProcessReadyPromise();
            this._ackDataBufferer = new AckDataBufferer(e => this._process?.acknowledgeDataEvent(e));
            this._dataFilter = this._instantiationService.createInstance(SeamlessRelaunchDataFilter);
            this._dataFilter.onProcessData(ev => {
                const data = (typeof ev === 'string' ? ev : ev.data);
                const beforeProcessDataEvent = { data };
                this._onBeforeProcessData.fire(beforeProcessDataEvent);
                if (beforeProcessDataEvent.data && beforeProcessDataEvent.data.length > 0) {
                    // This event is used by the caller so the object must be reused
                    if (typeof ev !== 'string') {
                        ev.data = beforeProcessDataEvent.data;
                    }
                    this._onProcessData.fire(typeof ev !== 'string' ? ev : { data: beforeProcessDataEvent.data, trackCommit: false });
                }
            });
            if (cwd && typeof cwd === 'object') {
                this.remoteAuthority = (0, remoteHosts_1.getRemoteAuthority)(cwd);
            }
            else {
                this.remoteAuthority = this._workbenchEnvironmentService.remoteAuthority;
            }
            if (environmentVariableCollections) {
                this._extEnvironmentVariableCollection = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(environmentVariableCollections);
                this._register(this._environmentVariableService.onDidChangeCollections(newCollection => this._onEnvironmentVariableCollectionChange(newCollection)));
                this.environmentVariableInfo = this._instantiationService.createInstance(environmentVariableInfo_1.EnvironmentVariableInfoChangesActive, this._extEnvironmentVariableCollection);
                this._onEnvironmentVariableInfoChange.fire(this.environmentVariableInfo);
            }
            this.shellIntegrationNonce = shellIntegrationNonce ?? (0, uuid_1.generateUuid)();
        }
        async freePortKillProcess(port) {
            try {
                if (this._process?.freePortKillProcess) {
                    await this._process?.freePortKillProcess(port);
                }
            }
            catch (e) {
                this._notificationService.notify({ message: (0, nls_1.localize)('killportfailure', 'Could not kill process listening on port {0}, command exited with error {1}', port, e), severity: severity_1.default.Warning });
            }
        }
        dispose(immediate = false) {
            this._isDisposed = true;
            if (this._process) {
                // If the process was still connected this dispose came from
                // within VS Code, not the process, so mark the process as
                // killed by the user.
                this._setProcessState(5 /* ProcessState.KilledByUser */);
                this._process.shutdown(immediate);
                this._process = null;
            }
            super.dispose();
        }
        _createPtyProcessReadyPromise() {
            return new Promise(c => {
                const listener = this.onProcessReady(() => {
                    this._logService.debug(`Terminal process ready (shellProcessId: ${this.shellProcessId})`);
                    listener.dispose();
                    c(undefined);
                });
            });
        }
        async detachFromProcess(forcePersist) {
            await this._process?.detach?.(forcePersist);
            this._process = null;
        }
        async createProcess(shellLaunchConfig, cols, rows, reset = true) {
            this._shellLaunchConfig = shellLaunchConfig;
            this._dimensions.cols = cols;
            this._dimensions.rows = rows;
            let newProcess;
            if (shellLaunchConfig.customPtyImplementation) {
                this._processType = 1 /* ProcessType.PsuedoTerminal */;
                newProcess = shellLaunchConfig.customPtyImplementation(this._instanceId, cols, rows);
            }
            else {
                const backend = await this._terminalInstanceService.getBackend(this.remoteAuthority);
                if (!backend) {
                    throw new Error(`No terminal backend registered for remote authority '${this.remoteAuthority}'`);
                }
                this.backend = backend;
                // Create variable resolver
                const variableResolver = terminalEnvironment.createVariableResolver(this._cwdWorkspaceFolder, await this._terminalProfileResolverService.getEnvironment(this.remoteAuthority), this._configurationResolverService);
                // resolvedUserHome is needed here as remote resolvers can launch local terminals before
                // they're connected to the remote.
                this.userHome = this._pathService.resolvedUserHome?.fsPath;
                this.os = platform_1.OS;
                if (!!this.remoteAuthority) {
                    const userHomeUri = await this._pathService.userHome();
                    this.userHome = userHomeUri.path;
                    const remoteEnv = await this._remoteAgentService.getEnvironment();
                    if (!remoteEnv) {
                        throw new Error(`Failed to get remote environment for remote authority "${this.remoteAuthority}"`);
                    }
                    this.userHome = remoteEnv.userHome.path;
                    this.os = remoteEnv.os;
                    // this is a copy of what the merged environment collection is on the remote side
                    const env = await this._resolveEnvironment(backend, variableResolver, shellLaunchConfig);
                    const shouldPersist = ((this._configurationService.getValue("task.reconnection" /* TaskSettingId.Reconnection */) && shellLaunchConfig.reconnectionProperties) || !shellLaunchConfig.isFeatureTerminal) && this._configHelper.config.enablePersistentSessions && !shellLaunchConfig.isTransient;
                    if (shellLaunchConfig.attachPersistentProcess) {
                        const result = await backend.attachToProcess(shellLaunchConfig.attachPersistentProcess.id);
                        if (result) {
                            newProcess = result;
                        }
                        else {
                            // Warn and just create a new terminal if attach failed for some reason
                            this._logService.warn(`Attach to process failed for terminal`, shellLaunchConfig.attachPersistentProcess);
                            shellLaunchConfig.attachPersistentProcess = undefined;
                        }
                    }
                    if (!newProcess) {
                        await this._terminalProfileResolverService.resolveShellLaunchConfig(shellLaunchConfig, {
                            remoteAuthority: this.remoteAuthority,
                            os: this.os
                        });
                        const options = {
                            shellIntegration: {
                                enabled: this._configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */),
                                suggestEnabled: this._configurationService.getValue("terminal.integrated.shellIntegration.suggestEnabled" /* TerminalSettingId.ShellIntegrationSuggestEnabled */),
                                nonce: this.shellIntegrationNonce
                            },
                            windowsEnableConpty: this._configHelper.config.windowsEnableConpty,
                            environmentVariableCollections: this._extEnvironmentVariableCollection?.collections ? (0, environmentVariableShared_1.serializeEnvironmentVariableCollections)(this._extEnvironmentVariableCollection.collections) : undefined,
                            workspaceFolder: this._cwdWorkspaceFolder,
                        };
                        try {
                            newProcess = await backend.createProcess(shellLaunchConfig, '', // TODO: Fix cwd
                            cols, rows, this._configHelper.config.unicodeVersion, env, // TODO:
                            options, shouldPersist);
                        }
                        catch (e) {
                            if (e?.message === 'Could not fetch remote environment') {
                                this._logService.trace(`Could not fetch remote environment, silently failing`);
                                return undefined;
                            }
                            throw e;
                        }
                    }
                    if (!this._isDisposed) {
                        this._setupPtyHostListeners(backend);
                    }
                }
                else {
                    if (shellLaunchConfig.attachPersistentProcess) {
                        const result = shellLaunchConfig.attachPersistentProcess.findRevivedId ? await backend.attachToRevivedProcess(shellLaunchConfig.attachPersistentProcess.id) : await backend.attachToProcess(shellLaunchConfig.attachPersistentProcess.id);
                        if (result) {
                            newProcess = result;
                        }
                        else {
                            // Warn and just create a new terminal if attach failed for some reason
                            this._logService.warn(`Attach to process failed for terminal`, shellLaunchConfig.attachPersistentProcess);
                            shellLaunchConfig.attachPersistentProcess = undefined;
                        }
                    }
                    if (!newProcess) {
                        newProcess = await this._launchLocalProcess(backend, shellLaunchConfig, cols, rows, this.userHome, variableResolver);
                    }
                    if (!this._isDisposed) {
                        this._setupPtyHostListeners(backend);
                    }
                }
            }
            // If the process was disposed during its creation, shut it down and return failure
            if (this._isDisposed) {
                newProcess.shutdown(false);
                return undefined;
            }
            this._process = newProcess;
            this._setProcessState(2 /* ProcessState.Launching */);
            // Add any capabilities inherent to the backend
            if (this.os === 3 /* OperatingSystem.Linux */ || this.os === 2 /* OperatingSystem.Macintosh */) {
                this.capabilities.add(1 /* TerminalCapability.NaiveCwdDetection */, new naiveCwdDetectionCapability_1.NaiveCwdDetectionCapability(this._process));
            }
            this._dataFilter.newProcess(this._process, reset);
            if (this._processListeners) {
                (0, lifecycle_1.dispose)(this._processListeners);
            }
            this._processListeners = [
                newProcess.onProcessReady((e) => {
                    this.shellProcessId = e.pid;
                    this._initialCwd = e.cwd;
                    this._onDidChangeProperty.fire({ type: "initialCwd" /* ProcessPropertyType.InitialCwd */, value: this._initialCwd });
                    this._onProcessReady.fire(e);
                    if (this._preLaunchInputQueue.length > 0 && this._process) {
                        // Send any queued data that's waiting
                        newProcess.input(this._preLaunchInputQueue.join(''));
                        this._preLaunchInputQueue.length = 0;
                    }
                }),
                newProcess.onProcessExit(exitCode => this._onExit(exitCode)),
                newProcess.onDidChangeProperty(({ type, value }) => {
                    switch (type) {
                        case "hasChildProcesses" /* ProcessPropertyType.HasChildProcesses */:
                            this._hasChildProcesses = value;
                            break;
                        case "failedShellIntegrationActivation" /* ProcessPropertyType.FailedShellIntegrationActivation */:
                            this._telemetryService?.publicLog2('terminal/shellIntegrationActivationFailureCustomArgs');
                            break;
                    }
                    this._onDidChangeProperty.fire({ type, value });
                })
            ];
            if (newProcess.onProcessReplayComplete) {
                this._processListeners.push(newProcess.onProcessReplayComplete(() => this._onProcessReplayComplete.fire()));
            }
            if (newProcess.onRestoreCommands) {
                this._processListeners.push(newProcess.onRestoreCommands(e => this._onRestoreCommands.fire(e)));
            }
            setTimeout(() => {
                if (this.processState === 2 /* ProcessState.Launching */) {
                    this._setProcessState(3 /* ProcessState.Running */);
                }
            }, 500 /* ProcessConstants.ErrorLaunchThresholdDuration */);
            const result = await newProcess.start();
            if (result) {
                // Error
                return result;
            }
            // Report the latency to the pty host when idle
            (0, dom_1.runWhenWindowIdle)((0, dom_1.getActiveWindow)(), () => {
                this.backend?.getLatency().then(measurements => {
                    this._logService.info(`Latency measurements for ${this.remoteAuthority ?? 'local'} backend\n${measurements.map(e => `${e.label}: ${e.latency.toFixed(2)}ms`).join('\n')}`);
                });
            });
            return undefined;
        }
        async relaunch(shellLaunchConfig, cols, rows, reset) {
            this.ptyProcessReady = this._createPtyProcessReadyPromise();
            this._logService.trace(`Relaunching terminal instance ${this._instanceId}`);
            // Fire reconnect if needed to ensure the terminal is usable again
            if (this._isDisconnected) {
                this._isDisconnected = false;
                this._onPtyReconnect.fire();
            }
            // Clear data written flag to re-enable seamless relaunch if this relaunch was manually
            // triggered
            this._hasWrittenData = false;
            return this.createProcess(shellLaunchConfig, cols, rows, reset);
        }
        // Fetch any extension environment additions and apply them
        async _resolveEnvironment(backend, variableResolver, shellLaunchConfig) {
            const workspaceFolder = terminalEnvironment.getWorkspaceForTerminal(shellLaunchConfig.cwd, this._workspaceContextService, this._historyService);
            const platformKey = platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
            const envFromConfigValue = this._configurationService.getValue(`terminal.integrated.env.${platformKey}`);
            this._configHelper.showRecommendations(shellLaunchConfig);
            let baseEnv;
            if (shellLaunchConfig.useShellEnvironment) {
                // TODO: Avoid as any?
                baseEnv = await backend.getShellEnvironment();
            }
            else {
                baseEnv = await this._terminalProfileResolverService.getEnvironment(this.remoteAuthority);
            }
            const env = await terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, envFromConfigValue, variableResolver, this._productService.version, this._configHelper.config.detectLocale, baseEnv);
            if (!this._isDisposed && (0, terminalEnvironment_1.shouldUseEnvironmentVariableCollection)(shellLaunchConfig)) {
                this._extEnvironmentVariableCollection = this._environmentVariableService.mergedCollection;
                this._register(this._environmentVariableService.onDidChangeCollections(newCollection => this._onEnvironmentVariableCollectionChange(newCollection)));
                // For remote terminals, this is a copy of the mergedEnvironmentCollection created on
                // the remote side. Since the environment collection is synced between the remote and
                // local sides immediately this is a fairly safe way of enabling the env var diffing and
                // info widget. While technically these could differ due to the slight change of a race
                // condition, the chance is minimal plus the impact on the user is also not that great
                // if it happens - it's not worth adding plumbing to sync back the resolved collection.
                await this._extEnvironmentVariableCollection.applyToProcessEnvironment(env, { workspaceFolder }, variableResolver);
                if (this._extEnvironmentVariableCollection.getVariableMap({ workspaceFolder }).size) {
                    this.environmentVariableInfo = this._instantiationService.createInstance(environmentVariableInfo_1.EnvironmentVariableInfoChangesActive, this._extEnvironmentVariableCollection);
                    this._onEnvironmentVariableInfoChange.fire(this.environmentVariableInfo);
                }
            }
            return env;
        }
        async _launchLocalProcess(backend, shellLaunchConfig, cols, rows, userHome, variableResolver) {
            await this._terminalProfileResolverService.resolveShellLaunchConfig(shellLaunchConfig, {
                remoteAuthority: undefined,
                os: platform_1.OS
            });
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            const initialCwd = await terminalEnvironment.getCwd(shellLaunchConfig, userHome, variableResolver, activeWorkspaceRootUri, this._configHelper.config.cwd, this._logService);
            const env = await this._resolveEnvironment(backend, variableResolver, shellLaunchConfig);
            const options = {
                shellIntegration: {
                    enabled: this._configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */),
                    suggestEnabled: this._configurationService.getValue("terminal.integrated.shellIntegration.suggestEnabled" /* TerminalSettingId.ShellIntegrationSuggestEnabled */),
                    nonce: this.shellIntegrationNonce
                },
                windowsEnableConpty: this._configHelper.config.windowsEnableConpty,
                environmentVariableCollections: this._extEnvironmentVariableCollection ? (0, environmentVariableShared_1.serializeEnvironmentVariableCollections)(this._extEnvironmentVariableCollection.collections) : undefined,
                workspaceFolder: this._cwdWorkspaceFolder,
            };
            const shouldPersist = ((this._configurationService.getValue("task.reconnection" /* TaskSettingId.Reconnection */) && shellLaunchConfig.reconnectionProperties) || !shellLaunchConfig.isFeatureTerminal) && this._configHelper.config.enablePersistentSessions && !shellLaunchConfig.isTransient;
            return await backend.createProcess(shellLaunchConfig, initialCwd, cols, rows, this._configHelper.config.unicodeVersion, env, options, shouldPersist);
        }
        _setupPtyHostListeners(backend) {
            if (this._ptyListenersAttached) {
                return;
            }
            this._ptyListenersAttached = true;
            // Mark the process as disconnected is the pty host is unresponsive, the responsive event
            // will fire only when the pty host was already unresponsive
            this._register(backend.onPtyHostUnresponsive(() => {
                this._isDisconnected = true;
                this._onPtyDisconnect.fire();
            }));
            this._ptyResponsiveListener = backend.onPtyHostResponsive(() => {
                this._isDisconnected = false;
                this._onPtyReconnect.fire();
            });
            this._register((0, lifecycle_1.toDisposable)(() => this._ptyResponsiveListener?.dispose()));
            // When the pty host restarts, reconnect is no longer possible so dispose the responsive
            // listener
            this._register(backend.onPtyHostRestart(async () => {
                // When the pty host restarts, reconnect is no longer possible
                if (!this._isDisconnected) {
                    this._isDisconnected = true;
                    this._onPtyDisconnect.fire();
                }
                this._ptyResponsiveListener?.dispose();
                this._ptyResponsiveListener = undefined;
                if (this._shellLaunchConfig) {
                    if (this._shellLaunchConfig.isFeatureTerminal && !this.reconnectionProperties) {
                        // Indicate the process is exited (and gone forever) only for feature terminals
                        // so they can react to the exit, this is particularly important for tasks so
                        // that it knows that the process is not still active. Note that this is not
                        // done for regular terminals because otherwise the terminal instance would be
                        // disposed.
                        this._onExit(-1);
                    }
                    else {
                        // For normal terminals write a message indicating what happened and relaunch
                        // using the previous shellLaunchConfig
                        const message = (0, nls_1.localize)('ptyHostRelaunch', "Restarting the terminal because the connection to the shell process was lost...");
                        this._onProcessData.fire({ data: (0, terminalStrings_1.formatMessageForTerminal)(message, { loudFormatting: true }), trackCommit: false });
                        await this.relaunch(this._shellLaunchConfig, this._dimensions.cols, this._dimensions.rows, false);
                    }
                }
            }));
        }
        async getBackendOS() {
            let os = platform_1.OS;
            if (!!this.remoteAuthority) {
                const remoteEnv = await this._remoteAgentService.getEnvironment();
                if (!remoteEnv) {
                    throw new Error(`Failed to get remote environment for remote authority "${this.remoteAuthority}"`);
                }
                os = remoteEnv.os;
            }
            return os;
        }
        setDimensions(cols, rows, sync) {
            if (sync) {
                this._resize(cols, rows);
                return;
            }
            return this.ptyProcessReady.then(() => this._resize(cols, rows));
        }
        async setUnicodeVersion(version) {
            return this._process?.setUnicodeVersion(version);
        }
        _resize(cols, rows) {
            if (!this._process) {
                return;
            }
            // The child process could already be terminated
            try {
                this._process.resize(cols, rows);
            }
            catch (error) {
                // We tried to write to a closed pipe / channel.
                if (error.code !== 'EPIPE' && error.code !== 'ERR_IPC_CHANNEL_CLOSED') {
                    throw (error);
                }
            }
            this._dimensions.cols = cols;
            this._dimensions.rows = rows;
        }
        async write(data) {
            await this.ptyProcessReady;
            this._dataFilter.disableSeamlessRelaunch();
            this._hasWrittenData = true;
            if (this.shellProcessId || this._processType === 1 /* ProcessType.PsuedoTerminal */) {
                if (this._process) {
                    // Send data if the pty is ready
                    this._process.input(data);
                }
            }
            else {
                // If the pty is not ready, queue the data received to send later
                this._preLaunchInputQueue.push(data);
            }
        }
        async processBinary(data) {
            await this.ptyProcessReady;
            this._dataFilter.disableSeamlessRelaunch();
            this._hasWrittenData = true;
            this._process?.processBinary(data);
        }
        get initialCwd() {
            return this._initialCwd ?? '';
        }
        async refreshProperty(type) {
            if (!this._process) {
                throw new Error('Cannot refresh property when process is not set');
            }
            return this._process.refreshProperty(type);
        }
        async updateProperty(type, value) {
            return this._process?.updateProperty(type, value);
        }
        acknowledgeDataEvent(charCount) {
            this._ackDataBufferer.ack(charCount);
        }
        _onExit(exitCode) {
            this._process = null;
            // If the process is marked as launching then mark the process as killed
            // during launch. This typically means that there is a problem with the
            // shell and args.
            if (this.processState === 2 /* ProcessState.Launching */) {
                this._setProcessState(4 /* ProcessState.KilledDuringLaunch */);
            }
            // If TerminalInstance did not know about the process exit then it was
            // triggered by the process, not on VS Code's side.
            if (this.processState === 3 /* ProcessState.Running */) {
                this._setProcessState(6 /* ProcessState.KilledByProcess */);
            }
            this._onProcessExit.fire(exitCode);
        }
        _setProcessState(state) {
            this.processState = state;
            this._onProcessStateChange.fire();
        }
        _onEnvironmentVariableCollectionChange(newCollection) {
            const diff = this._extEnvironmentVariableCollection.diff(newCollection, { workspaceFolder: this._cwdWorkspaceFolder });
            if (diff === undefined) {
                // If there are no longer differences, remove the stale info indicator
                if (this.environmentVariableInfo instanceof environmentVariableInfo_1.EnvironmentVariableInfoStale) {
                    this.environmentVariableInfo = this._instantiationService.createInstance(environmentVariableInfo_1.EnvironmentVariableInfoChangesActive, this._extEnvironmentVariableCollection);
                    this._onEnvironmentVariableInfoChange.fire(this.environmentVariableInfo);
                }
                return;
            }
            this.environmentVariableInfo = this._instantiationService.createInstance(environmentVariableInfo_1.EnvironmentVariableInfoStale, diff, this._instanceId, newCollection);
            this._onEnvironmentVariableInfoChange.fire(this.environmentVariableInfo);
        }
        async clearBuffer() {
            this._process?.clearBuffer?.();
        }
    };
    exports.TerminalProcessManager = TerminalProcessManager;
    exports.TerminalProcessManager = TerminalProcessManager = __decorate([
        __param(5, history_1.IHistoryService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalLogService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, configurationResolver_1.IConfigurationResolverService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, productService_1.IProductService),
        __param(12, remoteAgentService_1.IRemoteAgentService),
        __param(13, pathService_1.IPathService),
        __param(14, environmentVariable_1.IEnvironmentVariableService),
        __param(15, terminal_3.ITerminalProfileResolverService),
        __param(16, configuration_1.IConfigurationService),
        __param(17, terminal_2.ITerminalInstanceService),
        __param(18, telemetry_1.ITelemetryService),
        __param(19, notification_1.INotificationService)
    ], TerminalProcessManager);
    class AckDataBufferer {
        constructor(_callback) {
            this._callback = _callback;
            this._unsentCharCount = 0;
        }
        ack(charCount) {
            this._unsentCharCount += charCount;
            while (this._unsentCharCount > 5000 /* FlowControlConstants.CharCountAckSize */) {
                this._unsentCharCount -= 5000 /* FlowControlConstants.CharCountAckSize */;
                this._callback(5000 /* FlowControlConstants.CharCountAckSize */);
            }
        }
    }
    var SeamlessRelaunchConstants;
    (function (SeamlessRelaunchConstants) {
        /**
         * How long to record data events for new terminals.
         */
        SeamlessRelaunchConstants[SeamlessRelaunchConstants["RecordTerminalDuration"] = 10000] = "RecordTerminalDuration";
        /**
         * The maximum duration after a relaunch occurs to trigger a swap.
         */
        SeamlessRelaunchConstants[SeamlessRelaunchConstants["SwapWaitMaximumDuration"] = 3000] = "SwapWaitMaximumDuration";
    })(SeamlessRelaunchConstants || (SeamlessRelaunchConstants = {}));
    /**
     * Filters data events from the process and supports seamlessly restarting swapping out the process
     * with another, delaying the swap in output in order to minimize flickering/clearing of the
     * terminal.
     */
    let SeamlessRelaunchDataFilter = class SeamlessRelaunchDataFilter extends lifecycle_1.Disposable {
        get onProcessData() { return this._onProcessData.event; }
        constructor(_logService) {
            super();
            this._logService = _logService;
            this._disableSeamlessRelaunch = false;
            this._onProcessData = this._register(new event_1.Emitter());
        }
        newProcess(process, reset) {
            // Stop listening to the old process and trigger delayed shutdown (for hang issue #71966)
            this._dataListener?.dispose();
            this._activeProcess?.shutdown(false);
            this._activeProcess = process;
            // Start firing events immediately if:
            // - there's no recorder, which means it's a new terminal
            // - this is not a reset, so seamless relaunch isn't necessary
            // - seamless relaunch is disabled because the terminal has accepted input
            if (!this._firstRecorder || !reset || this._disableSeamlessRelaunch) {
                this._firstDisposable?.dispose();
                [this._firstRecorder, this._firstDisposable] = this._createRecorder(process);
                if (this._disableSeamlessRelaunch && reset) {
                    this._onProcessData.fire('\x1bc');
                }
                this._dataListener = process.onProcessData(e => this._onProcessData.fire(e));
                this._disableSeamlessRelaunch = false;
                return;
            }
            // Trigger a swap if there was a recent relaunch
            if (this._secondRecorder) {
                this.triggerSwap();
            }
            this._swapTimeout = window_1.mainWindow.setTimeout(() => this.triggerSwap(), 3000 /* SeamlessRelaunchConstants.SwapWaitMaximumDuration */);
            // Pause all outgoing data events
            this._dataListener?.dispose();
            this._firstDisposable?.dispose();
            const recorder = this._createRecorder(process);
            [this._secondRecorder, this._secondDisposable] = recorder;
        }
        /**
         * Disables seamless relaunch for the active process
         */
        disableSeamlessRelaunch() {
            this._disableSeamlessRelaunch = true;
            this._stopRecording();
            this.triggerSwap();
        }
        /**
         * Trigger the swap of the processes if needed (eg. timeout, input)
         */
        triggerSwap() {
            // Clear the swap timeout if it exists
            if (this._swapTimeout) {
                window_1.mainWindow.clearTimeout(this._swapTimeout);
                this._swapTimeout = undefined;
            }
            // Do nothing if there's nothing being recorder
            if (!this._firstRecorder) {
                return;
            }
            // Clear the first recorder if no second process was attached before the swap trigger
            if (!this._secondRecorder) {
                this._firstRecorder = undefined;
                this._firstDisposable?.dispose();
                return;
            }
            // Generate data for each recorder
            const firstData = this._getDataFromRecorder(this._firstRecorder);
            const secondData = this._getDataFromRecorder(this._secondRecorder);
            // Re-write the terminal if the data differs
            if (firstData === secondData) {
                this._logService.trace(`Seamless terminal relaunch - identical content`);
            }
            else {
                this._logService.trace(`Seamless terminal relaunch - resetting content`);
                // Fire full reset (RIS) followed by the new data so the update happens in the same frame
                this._onProcessData.fire({ data: `\x1bc${secondData}`, trackCommit: false });
            }
            // Set up the new data listener
            this._dataListener?.dispose();
            this._dataListener = this._activeProcess.onProcessData(e => this._onProcessData.fire(e));
            // Replace first recorder with second
            this._firstRecorder = this._secondRecorder;
            this._firstDisposable?.dispose();
            this._firstDisposable = this._secondDisposable;
            this._secondRecorder = undefined;
        }
        _stopRecording() {
            // Continue recording if a swap is coming
            if (this._swapTimeout) {
                return;
            }
            // Stop recording
            this._firstRecorder = undefined;
            this._firstDisposable?.dispose();
            this._secondRecorder = undefined;
            this._secondDisposable?.dispose();
        }
        _createRecorder(process) {
            const recorder = new terminalRecorder_1.TerminalRecorder(0, 0);
            const disposable = process.onProcessData(e => recorder.handleData(typeof e === 'string' ? e : e.data));
            return [recorder, disposable];
        }
        _getDataFromRecorder(recorder) {
            return recorder.generateReplayEventSync().events.filter(e => !!e.data).map(e => e.data).join('');
        }
    };
    SeamlessRelaunchDataFilter = __decorate([
        __param(0, terminal_1.ITerminalLogService)
    ], SeamlessRelaunchDataFilter);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxQcm9jZXNzTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbFByb2Nlc3NNYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXlDaEcsSUFBVyxnQkFTVjtJQVRELFdBQVcsZ0JBQWdCO1FBQzFCOztXQUVHO1FBQ0gseUdBQWtDLENBQUE7UUFDbEM7O1dBRUc7UUFDSCxrR0FBK0IsQ0FBQTtJQUNoQyxDQUFDLEVBVFUsZ0JBQWdCLEtBQWhCLGdCQUFnQixRQVMxQjtJQUVELElBQVcsV0FHVjtJQUhELFdBQVcsV0FBVztRQUNyQixtREFBTyxDQUFBO1FBQ1AsaUVBQWMsQ0FBQTtJQUNmLENBQUMsRUFIVSxXQUFXLEtBQVgsV0FBVyxRQUdyQjtJQUVEOzs7Ozs7O09BT0c7SUFDSSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVO1FBdURyRCxJQUFJLG1CQUFtQixLQUF5QixPQUFPLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzRSxJQUFJLGFBQWEsS0FBYyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ILElBQUksY0FBYyxLQUFjLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDOUQsSUFBSSxpQkFBaUIsS0FBYyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxz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