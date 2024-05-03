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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/parsers", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/severity", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/markers/common/markers", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/workbench/services/extensions/common/extensions", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/editor/common/services/model", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/markers/common/markers", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/output/common/output", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/taskSystem", "vs/workbench/contrib/tasks/common/taskTemplates", "../common/taskConfiguration", "./terminalTaskSystem", "vs/platform/quickinput/common/quickInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/jsonFormatter", "vs/base/common/network", "vs/base/common/themables", "vs/editor/common/services/resolverService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/terminal/common/terminal", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/tasks/browser/taskQuickPick", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/path/common/pathService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, actions_1, event_1, glob, json, lifecycle_1, map_1, Objects, parsers_1, Platform, resources, severity_1, Types, uri_1, UUID, nls, commands_1, configuration_1, files_1, markers_1, progress_1, storage_1, telemetry_1, problemMatcher_1, extensions_1, dialogs_1, notification_1, opener_1, model_1, workspace_1, markers_2, configurationResolver_1, editorService_1, output_1, textfiles_1, terminal_1, terminal_2, tasks_1, taskService_1, taskSystem_1, taskTemplates_1, TaskConfig, terminalTaskSystem_1, quickInput_1, contextkey_1, taskDefinitionRegistry_1, async_1, cancellation_1, jsonFormatter_1, network_1, themables_1, resolverService_1, instantiation_1, log_1, terminal_3, themeService_1, workspaceTrust_1, contextkeys_1, editor_1, views_1, viewsService_1, taskQuickPick_1, environmentService_1, lifecycle_2, panecomposite_1, pathService_1, preferences_1, remoteAgentService_1) {
    "use strict";
    var AbstractTaskService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractTaskService = exports.ConfigureTaskAction = void 0;
    const QUICKOPEN_HISTORY_LIMIT_CONFIG = 'task.quickOpen.history';
    const PROBLEM_MATCHER_NEVER_CONFIG = 'task.problemMatchers.neverPrompt';
    const USE_SLOW_PICKER = 'task.quickOpen.showAll';
    var ConfigureTaskAction;
    (function (ConfigureTaskAction) {
        ConfigureTaskAction.ID = 'workbench.action.tasks.configureTaskRunner';
        ConfigureTaskAction.TEXT = nls.localize2('ConfigureTaskRunnerAction.label', "Configure Task");
    })(ConfigureTaskAction || (exports.ConfigureTaskAction = ConfigureTaskAction = {}));
    class ProblemReporter {
        constructor(_outputChannel) {
            this._outputChannel = _outputChannel;
            this._validationStatus = new parsers_1.ValidationStatus();
        }
        info(message) {
            this._validationStatus.state = 1 /* ValidationState.Info */;
            this._outputChannel.append(message + '\n');
        }
        warn(message) {
            this._validationStatus.state = 2 /* ValidationState.Warning */;
            this._outputChannel.append(message + '\n');
        }
        error(message) {
            this._validationStatus.state = 3 /* ValidationState.Error */;
            this._outputChannel.append(message + '\n');
        }
        fatal(message) {
            this._validationStatus.state = 4 /* ValidationState.Fatal */;
            this._outputChannel.append(message + '\n');
        }
        get status() {
            return this._validationStatus;
        }
    }
    class TaskMap {
        constructor() {
            this._store = new Map();
        }
        forEach(callback) {
            this._store.forEach(callback);
        }
        static getKey(workspaceFolder) {
            let key;
            if (Types.isString(workspaceFolder)) {
                key = workspaceFolder;
            }
            else {
                const uri = (0, taskQuickPick_1.isWorkspaceFolder)(workspaceFolder) ? workspaceFolder.uri : workspaceFolder.configuration;
                key = uri ? uri.toString() : '';
            }
            return key;
        }
        get(workspaceFolder) {
            const key = TaskMap.getKey(workspaceFolder);
            let result = this._store.get(key);
            if (!result) {
                result = [];
                this._store.set(key, result);
            }
            return result;
        }
        add(workspaceFolder, ...task) {
            const key = TaskMap.getKey(workspaceFolder);
            let values = this._store.get(key);
            if (!values) {
                values = [];
                this._store.set(key, values);
            }
            values.push(...task);
        }
        all() {
            const result = [];
            this._store.forEach((values) => result.push(...values));
            return result;
        }
    }
    let AbstractTaskService = class AbstractTaskService extends lifecycle_1.Disposable {
        static { AbstractTaskService_1 = this; }
        // private static autoDetectTelemetryName: string = 'taskServer.autoDetect';
        static { this.RecentlyUsedTasks_Key = 'workbench.tasks.recentlyUsedTasks'; }
        static { this.RecentlyUsedTasks_KeyV2 = 'workbench.tasks.recentlyUsedTasks2'; }
        static { this.PersistentTasks_Key = 'workbench.tasks.persistentTasks'; }
        static { this.IgnoreTask010DonotShowAgain_key = 'workbench.tasks.ignoreTask010Shown'; }
        static { this.OutputChannelId = 'tasks'; }
        static { this.OutputChannelLabel = nls.localize('tasks', "Tasks"); }
        static { this._nextHandle = 0; }
        get isReconnected() { return this._tasksReconnected; }
        constructor(_configurationService, _markerService, _outputService, _paneCompositeService, _viewsService, _commandService, _editorService, _fileService, _contextService, _telemetryService, _textFileService, _modelService, _extensionService, _quickInputService, _configurationResolverService, _terminalService, _terminalGroupService, _storageService, _progressService, _openerService, _dialogService, _notificationService, _contextKeyService, _environmentService, _terminalProfileResolverService, _pathService, _textModelResolverService, _preferencesService, _viewDescriptorService, _workspaceTrustRequestService, _workspaceTrustManagementService, _logService, _themeService, _lifecycleService, remoteAgentService, _instantiationService) {
            super();
            this._configurationService = _configurationService;
            this._markerService = _markerService;
            this._outputService = _outputService;
            this._paneCompositeService = _paneCompositeService;
            this._viewsService = _viewsService;
            this._commandService = _commandService;
            this._editorService = _editorService;
            this._fileService = _fileService;
            this._contextService = _contextService;
            this._telemetryService = _telemetryService;
            this._textFileService = _textFileService;
            this._modelService = _modelService;
            this._extensionService = _extensionService;
            this._quickInputService = _quickInputService;
            this._configurationResolverService = _configurationResolverService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._storageService = _storageService;
            this._progressService = _progressService;
            this._openerService = _openerService;
            this._dialogService = _dialogService;
            this._notificationService = _notificationService;
            this._contextKeyService = _contextKeyService;
            this._environmentService = _environmentService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._pathService = _pathService;
            this._textModelResolverService = _textModelResolverService;
            this._preferencesService = _preferencesService;
            this._viewDescriptorService = _viewDescriptorService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._logService = _logService;
            this._themeService = _themeService;
            this._lifecycleService = _lifecycleService;
            this._instantiationService = _instantiationService;
            this._tasksReconnected = false;
            this._taskSystemListeners = [];
            this._onDidRegisterSupportedExecutions = new event_1.Emitter();
            this._onDidRegisterAllSupportedExecutions = new event_1.Emitter();
            this._onDidChangeTaskSystemInfo = new event_1.Emitter();
            this._willRestart = false;
            this.onDidChangeTaskSystemInfo = this._onDidChangeTaskSystemInfo.event;
            this._onDidReconnectToTasks = new event_1.Emitter();
            this.onDidReconnectToTasks = this._onDidReconnectToTasks.event;
            this._onDidChangeTaskConfig = new event_1.Emitter();
            this.onDidChangeTaskConfig = this._onDidChangeTaskConfig.event;
            this._whenTaskSystemReady = event_1.Event.toPromise(this.onDidChangeTaskSystemInfo);
            this._workspaceTasksPromise = undefined;
            this._taskSystem = undefined;
            this._taskSystemListeners = undefined;
            this._outputChannel = this._outputService.getChannel(AbstractTaskService_1.OutputChannelId);
            this._providers = new Map();
            this._providerTypes = new Map();
            this._taskSystemInfos = new Map();
            this._register(this._contextService.onDidChangeWorkspaceFolders(() => {
                const folderSetup = this._computeWorkspaceFolderSetup();
                if (this.executionEngine !== folderSetup[2]) {
                    this._disposeTaskSystemListeners();
                    this._taskSystem = undefined;
                }
                this._updateSetup(folderSetup);
                return this._updateWorkspaceTasks(2 /* TaskRunSource.FolderOpen */);
            }));
            this._register(this._configurationService.onDidChangeConfiguration(async (e) => {
                if (!e.affectsConfiguration('tasks') || (!this._taskSystem && !this._workspaceTasksPromise)) {
                    return;
                }
                if (!this._taskSystem || this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                    this._outputChannel.clear();
                }
                if (e.affectsConfiguration("task.reconnection" /* TaskSettingId.Reconnection */)) {
                    if (!this._configurationService.getValue("task.reconnection" /* TaskSettingId.Reconnection */)) {
                        this._persistentTasks?.clear();
                        this._storageService.remove(AbstractTaskService_1.PersistentTasks_Key, 1 /* StorageScope.WORKSPACE */);
                    }
                }
                this._setTaskLRUCacheLimit();
                await this._updateWorkspaceTasks(3 /* TaskRunSource.ConfigurationChange */);
                this._onDidChangeTaskConfig.fire();
            }));
            this._taskRunningState = tasks_1.TASK_RUNNING_STATE.bindTo(_contextKeyService);
            this._onDidStateChange = this._register(new event_1.Emitter());
            this._registerCommands().then(() => taskService_1.TaskCommandsRegistered.bindTo(this._contextKeyService).set(true));
            taskService_1.ServerlessWebContext.bindTo(this._contextKeyService).set(Platform.isWeb && !remoteAgentService.getConnection()?.remoteAuthority);
            this._configurationResolverService.contributeVariable('defaultBuildTask', async () => {
                let tasks = await this._getTasksForGroup(tasks_1.TaskGroup.Build);
                if (tasks.length > 0) {
                    const defaults = this._getDefaultTasks(tasks);
                    if (defaults.length === 1) {
                        return defaults[0]._label;
                    }
                    else if (defaults.length) {
                        tasks = defaults;
                    }
                }
                let entry;
                if (tasks && tasks.length > 0) {
                    entry = await this._showQuickPick(tasks, nls.localize('TaskService.pickBuildTaskForLabel', 'Select the build task (there is no default build task defined)'));
                }
                const task = entry ? entry.task : undefined;
                if (!task) {
                    return undefined;
                }
                return task._label;
            });
            this._lifecycleService.onBeforeShutdown(e => {
                this._willRestart = e.reason !== 3 /* ShutdownReason.RELOAD */;
            });
            this._register(this.onDidStateChange(e => {
                this._log(nls.localize('taskEvent', 'Task Event kind: {0}', e.kind), true);
                if (e.kind === "changed" /* TaskEventKind.Changed */) {
                    // no-op
                }
                else if ((this._willRestart || (e.kind === "terminated" /* TaskEventKind.Terminated */ && e.exitReason === terminal_3.TerminalExitReason.User)) && e.taskId) {
                    const key = e.__task.getKey();
                    if (key) {
                        this.removePersistentTask(key);
                    }
                }
                else if (e.kind === "start" /* TaskEventKind.Start */ && e.__task && e.__task.getWorkspaceFolder()) {
                    this._setPersistentTask(e.__task);
                }
            }));
            this._waitForAllSupportedExecutions = new Promise(resolve => {
                event_1.Event.once(this._onDidRegisterAllSupportedExecutions.event)(() => resolve());
            });
            if (this._terminalService.getReconnectedTerminals('Task')?.length) {
                this._attemptTaskReconnection();
            }
            else {
                this._terminalService.whenConnected.then(() => {
                    if (this._terminalService.getReconnectedTerminals('Task')?.length) {
                        this._attemptTaskReconnection();
                    }
                    else {
                        this._tasksReconnected = true;
                        this._onDidReconnectToTasks.fire();
                    }
                });
            }
            this._upgrade();
        }
        registerSupportedExecutions(custom, shell, process) {
            if (custom !== undefined) {
                const customContext = taskService_1.CustomExecutionSupportedContext.bindTo(this._contextKeyService);
                customContext.set(custom);
            }
            const isVirtual = !!contextkeys_1.VirtualWorkspaceContext.getValue(this._contextKeyService);
            if (shell !== undefined) {
                const shellContext = taskService_1.ShellExecutionSupportedContext.bindTo(this._contextKeyService);
                shellContext.set(shell && !isVirtual);
            }
            if (process !== undefined) {
                const processContext = taskService_1.ProcessExecutionSupportedContext.bindTo(this._contextKeyService);
                processContext.set(process && !isVirtual);
            }
            // update tasks so an incomplete list isn't returned when getWorkspaceTasks is called
            this._workspaceTasksPromise = undefined;
            this._onDidRegisterSupportedExecutions.fire();
            if (custom && shell && process) {
                this._onDidRegisterAllSupportedExecutions.fire();
            }
        }
        _attemptTaskReconnection() {
            if (this._lifecycleService.startupKind !== 3 /* StartupKind.ReloadedWindow */) {
                this._log(nls.localize('TaskService.skippingReconnection', 'Startup kind not window reload, setting connected and removing persistent tasks'), true);
                this._tasksReconnected = true;
                this._storageService.remove(AbstractTaskService_1.PersistentTasks_Key, 1 /* StorageScope.WORKSPACE */);
            }
            if (!this._configurationService.getValue("task.reconnection" /* TaskSettingId.Reconnection */) || this._tasksReconnected) {
                this._log(nls.localize('TaskService.notConnecting', 'Setting tasks connected configured value {0}, tasks were already reconnected {1}', this._configurationService.getValue("task.reconnection" /* TaskSettingId.Reconnection */), this._tasksReconnected), true);
                this._tasksReconnected = true;
                return;
            }
            this._log(nls.localize('TaskService.reconnecting', 'Reconnecting to running tasks...'), true);
            this.getWorkspaceTasks(4 /* TaskRunSource.Reconnect */).then(async () => {
                this._tasksReconnected = await this._reconnectTasks();
                this._log(nls.localize('TaskService.reconnected', 'Reconnected to running tasks.'), true);
                this._onDidReconnectToTasks.fire();
            });
        }
        async _reconnectTasks() {
            const tasks = await this.getSavedTasks('persistent');
            if (!tasks.length) {
                this._log(nls.localize('TaskService.noTasks', 'No persistent tasks to reconnect.'), true);
                return true;
            }
            const taskLabels = tasks.map(task => task._label).join(', ');
            this._log(nls.localize('TaskService.reconnectingTasks', 'Reconnecting to {0} tasks...', taskLabels), true);
            for (const task of tasks) {
                if (tasks_1.ConfiguringTask.is(task)) {
                    const resolved = await this.tryResolveTask(task);
                    if (resolved) {
                        this.run(resolved, undefined, 4 /* TaskRunSource.Reconnect */);
                    }
                }
                else {
                    this.run(task, undefined, 4 /* TaskRunSource.Reconnect */);
                }
            }
            return true;
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        get supportsMultipleTaskExecutions() {
            return this.inTerminal();
        }
        async _registerCommands() {
            commands_1.CommandsRegistry.registerCommand({
                id: 'workbench.action.tasks.runTask',
                handler: async (accessor, arg) => {
                    if (await this._trust()) {
                        await this._runTaskCommand(arg);
                    }
                },
                metadata: {
                    description: 'Run Task',
                    args: [{
                            name: 'args',
                            isOptional: true,
                            description: nls.localize('runTask.arg', "Filters the tasks shown in the quickpick"),
                            schema: {
                                anyOf: [
                                    {
                                        type: 'string',
                                        description: nls.localize('runTask.label', "The task's label or a term to filter by")
                                    },
                                    {
                                        type: 'object',
                                        properties: {
                                            type: {
                                                type: 'string',
                                                description: nls.localize('runTask.type', "The contributed task type")
                                            },
                                            task: {
                                                type: 'string',
                                                description: nls.localize('runTask.task', "The task's label or a term to filter by")
                                            }
                                        }
                                    }
                                ]
                            }
                        }]
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.reRunTask', async (accessor, arg) => {
                if (await this._trust()) {
                    this._reRunTaskCommand();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.restartTask', async (accessor, arg) => {
                if (await this._trust()) {
                    this._runRestartTaskCommand(arg);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.terminate', async (accessor, arg) => {
                if (await this._trust()) {
                    this._runTerminateCommand(arg);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showLog', () => {
                this._showOutput(undefined, true);
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.build', async () => {
                if (await this._trust()) {
                    this._runBuildCommand();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.test', async () => {
                if (await this._trust()) {
                    this._runTestCommand();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureTaskRunner', async () => {
                if (await this._trust()) {
                    this._runConfigureTasks();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultBuildTask', async () => {
                if (await this._trust()) {
                    this._runConfigureDefaultBuildTask();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.configureDefaultTestTask', async () => {
                if (await this._trust()) {
                    this._runConfigureDefaultTestTask();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.showTasks', async () => {
                if (await this._trust()) {
                    return this.runShowTasks();
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.toggleProblems', () => this._commandService.executeCommand(markers_2.Markers.TOGGLE_MARKERS_VIEW_ACTION_ID));
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.openUserTasks', async () => {
                const resource = this._getResourceForKind(tasks_1.TaskSourceKind.User);
                if (resource) {
                    this._openTaskFile(resource, tasks_1.TaskSourceKind.User);
                }
            });
            commands_1.CommandsRegistry.registerCommand('workbench.action.tasks.openWorkspaceFileTasks', async () => {
                const resource = this._getResourceForKind(tasks_1.TaskSourceKind.WorkspaceFile);
                if (resource) {
                    this._openTaskFile(resource, tasks_1.TaskSourceKind.WorkspaceFile);
                }
            });
        }
        get workspaceFolders() {
            if (!this._workspaceFolders) {
                this._updateSetup();
            }
            return this._workspaceFolders;
        }
        get ignoredWorkspaceFolders() {
            if (!this._ignoredWorkspaceFolders) {
                this._updateSetup();
            }
            return this._ignoredWorkspaceFolders;
        }
        get executionEngine() {
            if (this._executionEngine === undefined) {
                this._updateSetup();
            }
            return this._executionEngine;
        }
        get schemaVersion() {
            if (this._schemaVersion === undefined) {
                this._updateSetup();
            }
            return this._schemaVersion;
        }
        get showIgnoreMessage() {
            if (this._showIgnoreMessage === undefined) {
                this._showIgnoreMessage = !this._storageService.getBoolean(AbstractTaskService_1.IgnoreTask010DonotShowAgain_key, 1 /* StorageScope.WORKSPACE */, false);
            }
            return this._showIgnoreMessage;
        }
        _getActivationEvents(type) {
            const result = [];
            result.push('onCommand:workbench.action.tasks.runTask');
            if (type) {
                // send a specific activation event for this task type
                result.push(`onTaskType:${type}`);
            }
            else {
                // send activation events for all task types
                for (const definition of taskDefinitionRegistry_1.TaskDefinitionRegistry.all()) {
                    result.push(`onTaskType:${definition.taskType}`);
                }
            }
            return result;
        }
        async _activateTaskProviders(type) {
            // We need to first wait for extensions to be registered because we might read
            // the `TaskDefinitionRegistry` in case `type` is `undefined`
            await this._extensionService.whenInstalledExtensionsRegistered();
            await (0, async_1.raceTimeout)(Promise.all(this._getActivationEvents(type).map(activationEvent => this._extensionService.activateByEvent(activationEvent))), 5000, () => console.warn('Timed out activating extensions for task providers'));
        }
        _updateSetup(setup) {
            if (!setup) {
                setup = this._computeWorkspaceFolderSetup();
            }
            this._workspaceFolders = setup[0];
            if (this._ignoredWorkspaceFolders) {
                if (this._ignoredWorkspaceFolders.length !== setup[1].length) {
                    this._showIgnoreMessage = undefined;
                }
                else {
                    const set = new Set();
                    this._ignoredWorkspaceFolders.forEach(folder => set.add(folder.uri.toString()));
                    for (const folder of setup[1]) {
                        if (!set.has(folder.uri.toString())) {
                            this._showIgnoreMessage = undefined;
                            break;
                        }
                    }
                }
            }
            this._ignoredWorkspaceFolders = setup[1];
            this._executionEngine = setup[2];
            this._schemaVersion = setup[3];
            this._workspace = setup[4];
        }
        _showOutput(runSource = 1 /* TaskRunSource.User */, userRequested) {
            if (!contextkeys_1.VirtualWorkspaceContext.getValue(this._contextKeyService) && ((runSource === 1 /* TaskRunSource.User */) || (runSource === 3 /* TaskRunSource.ConfigurationChange */))) {
                if (userRequested) {
                    this._outputService.showChannel(this._outputChannel.id, true);
                }
                else {
                    this._notificationService.prompt(severity_1.default.Warning, nls.localize('taskServiceOutputPrompt', 'There are task errors. See the output for details.'), [{
                            label: nls.localize('showOutput', "Show output"),
                            run: () => {
                                this._outputService.showChannel(this._outputChannel.id, true);
                            }
                        }]);
                }
            }
        }
        _disposeTaskSystemListeners() {
            if (this._taskSystemListeners) {
                (0, lifecycle_1.dispose)(this._taskSystemListeners);
                this._taskSystemListeners = undefined;
            }
        }
        registerTaskProvider(provider, type) {
            if (!provider) {
                return {
                    dispose: () => { }
                };
            }
            const handle = AbstractTaskService_1._nextHandle++;
            this._providers.set(handle, provider);
            this._providerTypes.set(handle, type);
            return {
                dispose: () => {
                    this._providers.delete(handle);
                    this._providerTypes.delete(handle);
                }
            };
        }
        get hasTaskSystemInfo() {
            const infosCount = Array.from(this._taskSystemInfos.values()).flat().length;
            // If there's a remoteAuthority, then we end up with 2 taskSystemInfos,
            // one for each extension host.
            if (this._environmentService.remoteAuthority) {
                return infosCount > 1;
            }
            return infosCount > 0;
        }
        registerTaskSystem(key, info) {
            // Ideally the Web caller of registerRegisterTaskSystem would use the correct key.
            // However, the caller doesn't know about the workspace folders at the time of the call, even though we know about them here.
            if (info.platform === 0 /* Platform.Platform.Web */) {
                key = this.workspaceFolders.length ? this.workspaceFolders[0].uri.scheme : key;
            }
            if (!this._taskSystemInfos.has(key)) {
                this._taskSystemInfos.set(key, [info]);
            }
            else {
                const infos = this._taskSystemInfos.get(key);
                if (info.platform === 0 /* Platform.Platform.Web */) {
                    // Web infos should be pushed last.
                    infos.push(info);
                }
                else {
                    infos.unshift(info);
                }
            }
            if (this.hasTaskSystemInfo) {
                this._onDidChangeTaskSystemInfo.fire();
            }
        }
        _getTaskSystemInfo(key) {
            const infos = this._taskSystemInfos.get(key);
            return (infos && infos.length) ? infos[0] : undefined;
        }
        extensionCallbackTaskComplete(task, result) {
            if (!this._taskSystem) {
                return Promise.resolve();
            }
            return this._taskSystem.customExecutionComplete(task, result);
        }
        /**
         * Get a subset of workspace tasks that match a certain predicate.
         */
        async _findWorkspaceTasks(predicate) {
            const result = [];
            const tasks = await this.getWorkspaceTasks();
            for (const [, workspaceTasks] of tasks) {
                if (workspaceTasks.configurations) {
                    for (const taskName in workspaceTasks.configurations.byIdentifier) {
                        const task = workspaceTasks.configurations.byIdentifier[taskName];
                        if (predicate(task, workspaceTasks.workspaceFolder)) {
                            result.push(task);
                        }
                    }
                }
                if (workspaceTasks.set) {
                    for (const task of workspaceTasks.set.tasks) {
                        if (predicate(task, workspaceTasks.workspaceFolder)) {
                            result.push(task);
                        }
                    }
                }
            }
            return result;
        }
        async _findWorkspaceTasksInGroup(group, isDefault) {
            return this._findWorkspaceTasks((task) => {
                const taskGroup = task.configurationProperties.group;
                if (taskGroup && typeof taskGroup !== 'string') {
                    return (taskGroup._id === group._id && (!isDefault || !!taskGroup.isDefault));
                }
                return false;
            });
        }
        async getTask(folder, identifier, compareId = false, type = undefined) {
            if (!(await this._trust())) {
                return;
            }
            const name = Types.isString(folder) ? folder : (0, taskQuickPick_1.isWorkspaceFolder)(folder) ? folder.name : folder.configuration ? resources.basename(folder.configuration) : undefined;
            if (this.ignoredWorkspaceFolders.some(ignored => ignored.name === name)) {
                return Promise.reject(new Error(nls.localize('TaskServer.folderIgnored', 'The folder {0} is ignored since it uses task version 0.1.0', name)));
            }
            const key = !Types.isString(identifier)
                ? tasks_1.TaskDefinition.createTaskIdentifier(identifier, console)
                : identifier;
            if (key === undefined) {
                return Promise.resolve(undefined);
            }
            // Try to find the task in the workspace
            const requestedFolder = TaskMap.getKey(folder);
            const matchedTasks = await this._findWorkspaceTasks((task, workspaceFolder) => {
                const taskFolder = TaskMap.getKey(workspaceFolder);
                if (taskFolder !== requestedFolder && taskFolder !== tasks_1.USER_TASKS_GROUP_KEY) {
                    return false;
                }
                return task.matches(key, compareId);
            });
            matchedTasks.sort(task => task._source.kind === tasks_1.TaskSourceKind.Extension ? 1 : -1);
            if (matchedTasks.length > 0) {
                // Nice, we found a configured task!
                const task = matchedTasks[0];
                if (tasks_1.ConfiguringTask.is(task)) {
                    return this.tryResolveTask(task);
                }
                else {
                    return task;
                }
            }
            // We didn't find the task, so we need to ask all resolvers about it
            const map = await this._getGroupedTasks({ type });
            let values = map.get(folder);
            values = values.concat(map.get(tasks_1.USER_TASKS_GROUP_KEY));
            if (!values) {
                return undefined;
            }
            values = values.filter(task => task.matches(key, compareId)).sort(task => task._source.kind === tasks_1.TaskSourceKind.Extension ? 1 : -1);
            return values.length > 0 ? values[0] : undefined;
        }
        async tryResolveTask(configuringTask) {
            if (!(await this._trust())) {
                return;
            }
            await this._activateTaskProviders(configuringTask.type);
            let matchingProvider;
            let matchingProviderUnavailable = false;
            for (const [handle, provider] of this._providers) {
                const providerType = this._providerTypes.get(handle);
                if (configuringTask.type === providerType) {
                    if (providerType && !this._isTaskProviderEnabled(providerType)) {
                        matchingProviderUnavailable = true;
                        continue;
                    }
                    matchingProvider = provider;
                    break;
                }
            }
            if (!matchingProvider) {
                if (matchingProviderUnavailable) {
                    this._log(nls.localize('TaskService.providerUnavailable', 'Warning: {0} tasks are unavailable in the current environment.', configuringTask.configures.type));
                }
                return;
            }
            // Try to resolve the task first
            try {
                const resolvedTask = await matchingProvider.resolveTask(configuringTask);
                if (resolvedTask && (resolvedTask._id === configuringTask._id)) {
                    return TaskConfig.createCustomTask(resolvedTask, configuringTask);
                }
            }
            catch (error) {
                // Ignore errors. The task could not be provided by any of the providers.
            }
            // The task couldn't be resolved. Instead, use the less efficient provideTask.
            const tasks = await this.tasks({ type: configuringTask.type });
            for (const task of tasks) {
                if (task._id === configuringTask._id) {
                    return TaskConfig.createCustomTask(task, configuringTask);
                }
            }
            return;
        }
        async tasks(filter) {
            if (!(await this._trust())) {
                return [];
            }
            if (!this._versionAndEngineCompatible(filter)) {
                return Promise.resolve([]);
            }
            return this._getGroupedTasks(filter).then((map) => {
                if (!filter || !filter.type) {
                    return map.all();
                }
                const result = [];
                map.forEach((tasks) => {
                    for (const task of tasks) {
                        if (tasks_1.ContributedTask.is(task) && ((task.defines.type === filter.type) || (task._source.label === filter.type))) {
                            result.push(task);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            if (task.type === filter.type) {
                                result.push(task);
                            }
                            else {
                                const customizes = task.customizes();
                                if (customizes && customizes.type === filter.type) {
                                    result.push(task);
                                }
                            }
                        }
                    }
                });
                return result;
            });
        }
        taskTypes() {
            const types = [];
            if (this._isProvideTasksEnabled()) {
                for (const definition of taskDefinitionRegistry_1.TaskDefinitionRegistry.all()) {
                    if (this._isTaskProviderEnabled(definition.taskType)) {
                        types.push(definition.taskType);
                    }
                }
            }
            return types;
        }
        createSorter() {
            return new tasks_1.TaskSorter(this._contextService.getWorkspace() ? this._contextService.getWorkspace().folders : []);
        }
        _isActive() {
            if (!this._taskSystem) {
                return Promise.resolve(false);
            }
            return this._taskSystem.isActive();
        }
        async getActiveTasks() {
            if (!this._taskSystem) {
                return [];
            }
            return this._taskSystem.getActiveTasks();
        }
        async getBusyTasks() {
            if (!this._taskSystem) {
                return [];
            }
            return this._taskSystem.getBusyTasks();
        }
        getRecentlyUsedTasksV1() {
            if (this._recentlyUsedTasksV1) {
                return this._recentlyUsedTasksV1;
            }
            const quickOpenHistoryLimit = this._configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            this._recentlyUsedTasksV1 = new map_1.LRUCache(quickOpenHistoryLimit);
            const storageValue = this._storageService.get(AbstractTaskService_1.RecentlyUsedTasks_Key, 1 /* StorageScope.WORKSPACE */);
            if (storageValue) {
                try {
                    const values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (const value of values) {
                            this._recentlyUsedTasksV1.set(value, value);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._recentlyUsedTasksV1;
        }
        _getTasksFromStorage(type) {
            return type === 'persistent' ? this._getPersistentTasks() : this._getRecentTasks();
        }
        _getRecentTasks() {
            if (this._recentlyUsedTasks) {
                return this._recentlyUsedTasks;
            }
            const quickOpenHistoryLimit = this._configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            this._recentlyUsedTasks = new map_1.LRUCache(quickOpenHistoryLimit);
            const storageValue = this._storageService.get(AbstractTaskService_1.RecentlyUsedTasks_KeyV2, 1 /* StorageScope.WORKSPACE */);
            if (storageValue) {
                try {
                    const values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (const value of values) {
                            this._recentlyUsedTasks.set(value[0], value[1]);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._recentlyUsedTasks;
        }
        _getPersistentTasks() {
            if (this._persistentTasks) {
                this._log(nls.localize('taskService.gettingCachedTasks', 'Returning cached tasks {0}', this._persistentTasks.size), true);
                return this._persistentTasks;
            }
            //TODO: should this # be configurable?
            this._persistentTasks = new map_1.LRUCache(10);
            const storageValue = this._storageService.get(AbstractTaskService_1.PersistentTasks_Key, 1 /* StorageScope.WORKSPACE */);
            if (storageValue) {
                try {
                    const values = JSON.parse(storageValue);
                    if (Array.isArray(values)) {
                        for (const value of values) {
                            this._persistentTasks.set(value[0], value[1]);
                        }
                    }
                }
                catch (error) {
                    // Ignore. We use the empty result
                }
            }
            return this._persistentTasks;
        }
        _getFolderFromTaskKey(key) {
            const keyValue = JSON.parse(key);
            return {
                folder: keyValue.folder, isWorkspaceFile: keyValue.id?.endsWith(tasks_1.TaskSourceKind.WorkspaceFile)
            };
        }
        async getSavedTasks(type) {
            const folderMap = Object.create(null);
            this.workspaceFolders.forEach(folder => {
                folderMap[folder.uri.toString()] = folder;
            });
            const folderToTasksMap = new Map();
            const workspaceToTaskMap = new Map();
            const storedTasks = this._getTasksFromStorage(type);
            const tasks = [];
            this._log(nls.localize('taskService.getSavedTasks', 'Fetching tasks from task storage.'), true);
            function addTaskToMap(map, folder, task) {
                if (folder && !map.has(folder)) {
                    map.set(folder, []);
                }
                if (folder && (folderMap[folder] || (folder === tasks_1.USER_TASKS_GROUP_KEY)) && task) {
                    map.get(folder).push(task);
                }
            }
            for (const entry of storedTasks.entries()) {
                try {
                    const key = entry[0];
                    const task = JSON.parse(entry[1]);
                    const folderInfo = this._getFolderFromTaskKey(key);
                    this._log(nls.localize('taskService.getSavedTasks.reading', 'Reading tasks from task storage, {0}, {1}, {2}', key, task, folderInfo.folder), true);
                    addTaskToMap(folderInfo.isWorkspaceFile ? workspaceToTaskMap : folderToTasksMap, folderInfo.folder, task);
                }
                catch (error) {
                    this._log(nls.localize('taskService.getSavedTasks.error', 'Fetching a task from task storage failed: {0}.', error), true);
                }
            }
            const readTasksMap = new Map();
            async function readTasks(that, map, isWorkspaceFile) {
                for (const key of map.keys()) {
                    const custom = [];
                    const customized = Object.create(null);
                    const taskConfigSource = (folderMap[key]
                        ? (isWorkspaceFile
                            ? TaskConfig.TaskConfigSource.WorkspaceFile : TaskConfig.TaskConfigSource.TasksJson)
                        : TaskConfig.TaskConfigSource.User);
                    await that._computeTasksForSingleConfig(folderMap[key] ?? await that._getAFolder(), {
                        version: '2.0.0',
                        tasks: map.get(key)
                    }, 0 /* TaskRunSource.System */, custom, customized, taskConfigSource, true);
                    custom.forEach(task => {
                        const taskKey = task.getKey();
                        if (taskKey) {
                            readTasksMap.set(taskKey, task);
                        }
                    });
                    for (const configuration in customized) {
                        const taskKey = customized[configuration].getKey();
                        if (taskKey) {
                            readTasksMap.set(taskKey, customized[configuration]);
                        }
                    }
                }
            }
            await readTasks(this, folderToTasksMap, false);
            await readTasks(this, workspaceToTaskMap, true);
            for (const key of storedTasks.keys()) {
                if (readTasksMap.has(key)) {
                    tasks.push(readTasksMap.get(key));
                    this._log(nls.localize('taskService.getSavedTasks.resolved', 'Resolved task {0}', key), true);
                }
                else {
                    this._log(nls.localize('taskService.getSavedTasks.unresolved', 'Unable to resolve task {0} ', key), true);
                }
            }
            return tasks;
        }
        removeRecentlyUsedTask(taskRecentlyUsedKey) {
            if (this._getTasksFromStorage('historical').has(taskRecentlyUsedKey)) {
                this._getTasksFromStorage('historical').delete(taskRecentlyUsedKey);
                this._saveRecentlyUsedTasks();
            }
        }
        removePersistentTask(key) {
            this._log(nls.localize('taskService.removePersistentTask', 'Removing persistent task {0}', key), true);
            if (this._getTasksFromStorage('persistent').has(key)) {
                this._getTasksFromStorage('persistent').delete(key);
                this._savePersistentTasks();
            }
        }
        _setTaskLRUCacheLimit() {
            const quickOpenHistoryLimit = this._configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            if (this._recentlyUsedTasks) {
                this._recentlyUsedTasks.limit = quickOpenHistoryLimit;
            }
        }
        async _setRecentlyUsedTask(task) {
            let key = task.getKey();
            if (!tasks_1.InMemoryTask.is(task) && key) {
                const customizations = this._createCustomizableTask(task);
                if (tasks_1.ContributedTask.is(task) && customizations) {
                    const custom = [];
                    const customized = Object.create(null);
                    await this._computeTasksForSingleConfig(task._source.workspaceFolder ?? this.workspaceFolders[0], {
                        version: '2.0.0',
                        tasks: [customizations]
                    }, 0 /* TaskRunSource.System */, custom, customized, TaskConfig.TaskConfigSource.TasksJson, true);
                    for (const configuration in customized) {
                        key = customized[configuration].getKey();
                    }
                }
                this._getTasksFromStorage('historical').set(key, JSON.stringify(customizations));
                this._saveRecentlyUsedTasks();
            }
        }
        _saveRecentlyUsedTasks() {
            if (!this._recentlyUsedTasks) {
                return;
            }
            const quickOpenHistoryLimit = this._configurationService.getValue(QUICKOPEN_HISTORY_LIMIT_CONFIG);
            // setting history limit to 0 means no LRU sorting
            if (quickOpenHistoryLimit === 0) {
                return;
            }
            let keys = [...this._recentlyUsedTasks.keys()];
            if (keys.length > quickOpenHistoryLimit) {
                keys = keys.slice(0, quickOpenHistoryLimit);
            }
            const keyValues = [];
            for (const key of keys) {
                keyValues.push([key, this._recentlyUsedTasks.get(key, 0 /* Touch.None */)]);
            }
            this._storageService.store(AbstractTaskService_1.RecentlyUsedTasks_KeyV2, JSON.stringify(keyValues), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        async _setPersistentTask(task) {
            if (!this._configurationService.getValue("task.reconnection" /* TaskSettingId.Reconnection */)) {
                return;
            }
            let key = task.getKey();
            if (!tasks_1.InMemoryTask.is(task) && key) {
                const customizations = this._createCustomizableTask(task);
                if (tasks_1.ContributedTask.is(task) && customizations) {
                    const custom = [];
                    const customized = Object.create(null);
                    await this._computeTasksForSingleConfig(task._source.workspaceFolder ?? this.workspaceFolders[0], {
                        version: '2.0.0',
                        tasks: [customizations]
                    }, 0 /* TaskRunSource.System */, custom, customized, TaskConfig.TaskConfigSource.TasksJson, true);
                    for (const configuration in customized) {
                        key = customized[configuration].getKey();
                    }
                }
                if (!task.configurationProperties.isBackground) {
                    return;
                }
                this._log(nls.localize('taskService.setPersistentTask', 'Setting persistent task {0}', key), true);
                this._getTasksFromStorage('persistent').set(key, JSON.stringify(customizations));
                this._savePersistentTasks();
            }
        }
        _savePersistentTasks() {
            this._persistentTasks = this._getTasksFromStorage('persistent');
            const keys = [...this._persistentTasks.keys()];
            const keyValues = [];
            for (const key of keys) {
                keyValues.push([key, this._persistentTasks.get(key, 0 /* Touch.None */)]);
            }
            this._log(nls.localize('savePersistentTask', 'Saving persistent tasks: {0}', keys.join(', ')), true);
            this._storageService.store(AbstractTaskService_1.PersistentTasks_Key, JSON.stringify(keyValues), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        _openDocumentation() {
            this._openerService.open(uri_1.URI.parse('https://code.visualstudio.com/docs/editor/tasks#_defining-a-problem-matcher'));
        }
        async _findSingleWorkspaceTaskOfGroup(group) {
            const tasksOfGroup = await this._findWorkspaceTasksInGroup(group, true);
            if ((tasksOfGroup.length === 1) && (typeof tasksOfGroup[0].configurationProperties.group !== 'string') && tasksOfGroup[0].configurationProperties.group?.isDefault) {
                let resolvedTask;
                if (tasks_1.ConfiguringTask.is(tasksOfGroup[0])) {
                    resolvedTask = await this.tryResolveTask(tasksOfGroup[0]);
                }
                else {
                    resolvedTask = tasksOfGroup[0];
                }
                if (resolvedTask) {
                    return this.run(resolvedTask, undefined, 1 /* TaskRunSource.User */);
                }
            }
            return undefined;
        }
        async _build() {
            const tryBuildShortcut = await this._findSingleWorkspaceTaskOfGroup(tasks_1.TaskGroup.Build);
            if (tryBuildShortcut) {
                return tryBuildShortcut;
            }
            return this._getGroupedTasksAndExecute();
        }
        async _runTest() {
            const tryTestShortcut = await this._findSingleWorkspaceTaskOfGroup(tasks_1.TaskGroup.Test);
            if (tryTestShortcut) {
                return tryTestShortcut;
            }
            return this._getGroupedTasksAndExecute(true);
        }
        async _getGroupedTasksAndExecute(test) {
            const tasks = await this._getGroupedTasks();
            const runnable = this._createRunnableTask(tasks, test ? tasks_1.TaskGroup.Test : tasks_1.TaskGroup.Build);
            if (!runnable || !runnable.task) {
                if (test) {
                    if (this.schemaVersion === 1 /* JsonSchemaVersion.V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask1', 'No test task defined. Mark a task with \'isTestCommand\' in the tasks.json file.'), 3 /* TaskErrors.NoTestTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noTestTask2', 'No test task defined. Mark a task with as a \'test\' group in the tasks.json file.'), 3 /* TaskErrors.NoTestTask */);
                    }
                }
                else {
                    if (this.schemaVersion === 1 /* JsonSchemaVersion.V0_1_0 */) {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask1', 'No build task defined. Mark a task with \'isBuildCommand\' in the tasks.json file.'), 2 /* TaskErrors.NoBuildTask */);
                    }
                    else {
                        throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskService.noBuildTask2', 'No build task defined. Mark a task with as a \'build\' group in the tasks.json file.'), 2 /* TaskErrors.NoBuildTask */);
                    }
                }
            }
            let executeTaskResult;
            try {
                executeTaskResult = await this._executeTask(runnable.task, runnable.resolver, 1 /* TaskRunSource.User */);
            }
            catch (error) {
                this._handleError(error);
                return Promise.reject(error);
            }
            return executeTaskResult;
        }
        async run(task, options, runSource = 0 /* TaskRunSource.System */) {
            if (!(await this._trust())) {
                return;
            }
            if (!task) {
                throw new taskSystem_1.TaskError(severity_1.default.Info, nls.localize('TaskServer.noTask', 'Task to execute is undefined'), 5 /* TaskErrors.TaskNotFound */);
            }
            const resolver = this._createResolver();
            let executeTaskResult;
            try {
                if (options && options.attachProblemMatcher && this._shouldAttachProblemMatcher(task) && !tasks_1.InMemoryTask.is(task)) {
                    const taskToExecute = await this._attachProblemMatcher(task);
                    if (taskToExecute) {
                        executeTaskResult = await this._executeTask(taskToExecute, resolver, runSource);
                    }
                }
                else {
                    executeTaskResult = await this._executeTask(task, resolver, runSource);
                }
                return executeTaskResult;
            }
            catch (error) {
                this._handleError(error);
                return Promise.reject(error);
            }
        }
        _isProvideTasksEnabled() {
            const settingValue = this._configurationService.getValue("task.autoDetect" /* TaskSettingId.AutoDetect */);
            return settingValue === 'on';
        }
        _isProblemMatcherPromptEnabled(type) {
            const settingValue = this._configurationService.getValue(PROBLEM_MATCHER_NEVER_CONFIG);
            if (Types.isBoolean(settingValue)) {
                return !settingValue;
            }
            if (type === undefined) {
                return true;
            }
            const settingValueMap = settingValue;
            return !settingValueMap[type];
        }
        _getTypeForTask(task) {
            let type;
            if (tasks_1.CustomTask.is(task)) {
                const configProperties = task._source.config.element;
                type = configProperties.type;
            }
            else {
                type = task.getDefinition().type;
            }
            return type;
        }
        _shouldAttachProblemMatcher(task) {
            const enabled = this._isProblemMatcherPromptEnabled(this._getTypeForTask(task));
            if (enabled === false) {
                return false;
            }
            if (!this._canCustomize(task)) {
                return false;
            }
            if (task.configurationProperties.group !== undefined && task.configurationProperties.group !== tasks_1.TaskGroup.Build) {
                return false;
            }
            if (task.configurationProperties.problemMatchers !== undefined && task.configurationProperties.problemMatchers.length > 0) {
                return false;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !task.hasDefinedMatchers && !!task.configurationProperties.problemMatchers && (task.configurationProperties.problemMatchers.length === 0);
            }
            if (tasks_1.CustomTask.is(task)) {
                const configProperties = task._source.config.element;
                return configProperties.problemMatcher === undefined && !task.hasDefinedMatchers;
            }
            return false;
        }
        async _updateNeverProblemMatcherSetting(type) {
            const current = this._configurationService.getValue(PROBLEM_MATCHER_NEVER_CONFIG);
            if (current === true) {
                return;
            }
            let newValue;
            if (current !== false) {
                newValue = current;
            }
            else {
                newValue = Object.create(null);
            }
            newValue[type] = true;
            return this._configurationService.updateValue(PROBLEM_MATCHER_NEVER_CONFIG, newValue);
        }
        async _attachProblemMatcher(task) {
            let entries = [];
            for (const key of problemMatcher_1.ProblemMatcherRegistry.keys()) {
                const matcher = problemMatcher_1.ProblemMatcherRegistry.get(key);
                if (matcher.deprecated) {
                    continue;
                }
                if (matcher.name === matcher.label) {
                    entries.push({ label: matcher.name, matcher: matcher });
                }
                else {
                    entries.push({
                        label: matcher.label,
                        description: `$${matcher.name}`,
                        matcher: matcher
                    });
                }
            }
            if (entries.length === 0) {
                return;
            }
            entries = entries.sort((a, b) => {
                if (a.label && b.label) {
                    return a.label.localeCompare(b.label);
                }
                else {
                    return 0;
                }
            });
            entries.unshift({ type: 'separator', label: nls.localize('TaskService.associate', 'associate') });
            let taskType;
            if (tasks_1.CustomTask.is(task)) {
                const configProperties = task._source.config.element;
                taskType = configProperties.type;
            }
            else {
                taskType = task.getDefinition().type;
            }
            entries.unshift({ label: nls.localize('TaskService.attachProblemMatcher.continueWithout', 'Continue without scanning the task output'), matcher: undefined }, { label: nls.localize('TaskService.attachProblemMatcher.never', 'Never scan the task output for this task'), matcher: undefined, never: true }, { label: nls.localize('TaskService.attachProblemMatcher.neverType', 'Never scan the task output for {0} tasks', taskType), matcher: undefined, setting: taskType }, { label: nls.localize('TaskService.attachProblemMatcher.learnMoreAbout', 'Learn more about scanning the task output'), matcher: undefined, learnMore: true });
            const problemMatcher = await this._quickInputService.pick(entries, { placeHolder: nls.localize('selectProblemMatcher', 'Select for which kind of errors and warnings to scan the task output') });
            if (!problemMatcher) {
                return task;
            }
            if (problemMatcher.learnMore) {
                this._openDocumentation();
                return undefined;
            }
            if (problemMatcher.never) {
                this.customize(task, { problemMatcher: [] }, true);
                return task;
            }
            if (problemMatcher.matcher) {
                const newTask = task.clone();
                const matcherReference = `$${problemMatcher.matcher.name}`;
                const properties = { problemMatcher: [matcherReference] };
                newTask.configurationProperties.problemMatchers = [matcherReference];
                const matcher = problemMatcher_1.ProblemMatcherRegistry.get(problemMatcher.matcher.name);
                if (matcher && matcher.watching !== undefined) {
                    properties.isBackground = true;
                    newTask.configurationProperties.isBackground = true;
                }
                this.customize(task, properties, true);
                return newTask;
            }
            if (problemMatcher.setting) {
                await this._updateNeverProblemMatcherSetting(problemMatcher.setting);
            }
            return task;
        }
        async _getTasksForGroup(group) {
            const groups = await this._getGroupedTasks();
            const result = [];
            groups.forEach(tasks => {
                for (const task of tasks) {
                    const configTaskGroup = tasks_1.TaskGroup.from(task.configurationProperties.group);
                    if (configTaskGroup?._id === group._id) {
                        result.push(task);
                    }
                }
            });
            return result;
        }
        needsFolderQualification() {
            return this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
        }
        _canCustomize(task) {
            if (this.schemaVersion !== 2 /* JsonSchemaVersion.V2_0_0 */) {
                return false;
            }
            if (tasks_1.CustomTask.is(task)) {
                return true;
            }
            if (tasks_1.ContributedTask.is(task)) {
                return !!task.getWorkspaceFolder();
            }
            return false;
        }
        async _formatTaskForJson(resource, task) {
            let reference;
            let stringValue = '';
            try {
                reference = await this._textModelResolverService.createModelReference(resource);
                const model = reference.object.textEditorModel;
                const { tabSize, insertSpaces } = model.getOptions();
                const eol = model.getEOL();
                let stringified = (0, jsonFormatter_1.toFormattedString)(task, { eol, tabSize, insertSpaces });
                const regex = new RegExp(eol + (insertSpaces ? ' '.repeat(tabSize) : '\\t'), 'g');
                stringified = stringified.replace(regex, eol + (insertSpaces ? ' '.repeat(tabSize * 3) : '\t\t\t'));
                const twoTabs = insertSpaces ? ' '.repeat(tabSize * 2) : '\t\t';
                stringValue = twoTabs + stringified.slice(0, stringified.length - 1) + twoTabs + stringified.slice(stringified.length - 1);
            }
            finally {
                reference?.dispose();
            }
            return stringValue;
        }
        async _openEditorAtTask(resource, task, configIndex = -1) {
            if (resource === undefined) {
                return Promise.resolve(false);
            }
            const fileContent = await this._fileService.readFile(resource);
            const content = fileContent.value;
            if (!content || !task) {
                return false;
            }
            const contentValue = content.toString();
            let stringValue;
            if (configIndex !== -1) {
                const json = this._configurationService.getValue('tasks', { resource });
                if (json.tasks && (json.tasks.length > configIndex)) {
                    stringValue = await this._formatTaskForJson(resource, json.tasks[configIndex]);
                }
            }
            if (!stringValue) {
                if (typeof task === 'string') {
                    stringValue = task;
                }
                else {
                    stringValue = await this._formatTaskForJson(resource, task);
                }
            }
            const index = contentValue.indexOf(stringValue);
            let startLineNumber = 1;
            for (let i = 0; i < index; i++) {
                if (contentValue.charAt(i) === '\n') {
                    startLineNumber++;
                }
            }
            let endLineNumber = startLineNumber;
            for (let i = 0; i < stringValue.length; i++) {
                if (stringValue.charAt(i) === '\n') {
                    endLineNumber++;
                }
            }
            const selection = startLineNumber > 1 ? { startLineNumber, startColumn: startLineNumber === endLineNumber ? 4 : 3, endLineNumber, endColumn: startLineNumber === endLineNumber ? undefined : 4 } : undefined;
            await this._editorService.openEditor({
                resource,
                options: {
                    pinned: false,
                    forceReload: true, // because content might have changed
                    selection,
                    selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */
                }
            });
            return !!selection;
        }
        _createCustomizableTask(task) {
            let toCustomize;
            const taskConfig = tasks_1.CustomTask.is(task) || tasks_1.ConfiguringTask.is(task) ? task._source.config : undefined;
            if (taskConfig && taskConfig.element) {
                toCustomize = { ...(taskConfig.element) };
            }
            else if (tasks_1.ContributedTask.is(task)) {
                toCustomize = {};
                const identifier = Object.assign(Object.create(null), task.defines);
                delete identifier['_key'];
                Object.keys(identifier).forEach(key => toCustomize[key] = identifier[key]);
                if (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length > 0 && Types.isStringArray(task.configurationProperties.problemMatchers)) {
                    toCustomize.problemMatcher = task.configurationProperties.problemMatchers;
                }
                if (task.configurationProperties.group) {
                    toCustomize.group = TaskConfig.GroupKind.to(task.configurationProperties.group);
                }
            }
            if (!toCustomize) {
                return undefined;
            }
            if (toCustomize.problemMatcher === undefined && task.configurationProperties.problemMatchers === undefined || (task.configurationProperties.problemMatchers && task.configurationProperties.problemMatchers.length === 0)) {
                toCustomize.problemMatcher = [];
            }
            if (task._source.label !== 'Workspace') {
                toCustomize.label = task.configurationProperties.identifier;
            }
            else {
                toCustomize.label = task._label;
            }
            toCustomize.detail = task.configurationProperties.detail;
            return toCustomize;
        }
        async customize(task, properties, openConfig) {
            if (!(await this._trust())) {
                return;
            }
            const workspaceFolder = task.getWorkspaceFolder();
            if (!workspaceFolder) {
                return Promise.resolve(undefined);
            }
            const configuration = this._getConfiguration(workspaceFolder, task._source.kind);
            if (configuration.hasParseErrors) {
                this._notificationService.warn(nls.localize('customizeParseErrors', 'The current task configuration has errors. Please fix the errors first before customizing a task.'));
                return Promise.resolve(undefined);
            }
            const fileConfig = configuration.config;
            const toCustomize = this._createCustomizableTask(task);
            if (!toCustomize) {
                return Promise.resolve(undefined);
            }
            const index = tasks_1.CustomTask.is(task) ? task._source.config.index : undefined;
            if (properties) {
                for (const property of Object.getOwnPropertyNames(properties)) {
                    const value = properties[property];
                    if (value !== undefined && value !== null) {
                        toCustomize[property] = value;
                    }
                }
            }
            if (!fileConfig) {
                const value = {
                    version: '2.0.0',
                    tasks: [toCustomize]
                };
                let content = [
                    '{',
                    nls.localize('tasksJsonComment', '\t// See https://go.microsoft.com/fwlink/?LinkId=733558 \n\t// for the documentation about the tasks.json format'),
                ].join('\n') + JSON.stringify(value, null, '\t').substr(1);
                const editorConfig = this._configurationService.getValue();
                if (editorConfig.editor.insertSpaces) {
                    content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + ' '.repeat(s2.length * editorConfig.editor.tabSize));
                }
                await this._textFileService.create([{ resource: workspaceFolder.toResource('.vscode/tasks.json'), value: content }]);
            }
            else {
                // We have a global task configuration
                if ((index === -1) && properties) {
                    if (properties.problemMatcher !== undefined) {
                        fileConfig.problemMatcher = properties.problemMatcher;
                        await this._writeConfiguration(workspaceFolder, 'tasks.problemMatchers', fileConfig.problemMatcher, task._source.kind);
                    }
                    else if (properties.group !== undefined) {
                        fileConfig.group = properties.group;
                        await this._writeConfiguration(workspaceFolder, 'tasks.group', fileConfig.group, task._source.kind);
                    }
                }
                else {
                    if (!Array.isArray(fileConfig.tasks)) {
                        fileConfig.tasks = [];
                    }
                    if (index === undefined) {
                        fileConfig.tasks.push(toCustomize);
                    }
                    else {
                        fileConfig.tasks[index] = toCustomize;
                    }
                    await this._writeConfiguration(workspaceFolder, 'tasks.tasks', fileConfig.tasks, task._source.kind);
                }
            }
            if (openConfig) {
                this._openEditorAtTask(this._getResourceForTask(task), toCustomize);
            }
        }
        _writeConfiguration(workspaceFolder, key, value, source) {
            let target = undefined;
            switch (source) {
                case tasks_1.TaskSourceKind.User:
                    target = 2 /* ConfigurationTarget.USER */;
                    break;
                case tasks_1.TaskSourceKind.WorkspaceFile:
                    target = 5 /* ConfigurationTarget.WORKSPACE */;
                    break;
                default: if (this._contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    target = 5 /* ConfigurationTarget.WORKSPACE */;
                }
                else if (this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                    target = 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            if (target) {
                return this._configurationService.updateValue(key, value, { resource: workspaceFolder.uri }, target);
            }
            else {
                return undefined;
            }
        }
        _getResourceForKind(kind) {
            this._updateSetup();
            switch (kind) {
                case tasks_1.TaskSourceKind.User: {
                    return resources.joinPath(resources.dirname(this._preferencesService.userSettingsResource), 'tasks.json');
                }
                case tasks_1.TaskSourceKind.WorkspaceFile: {
                    if (this._workspace && this._workspace.configuration) {
                        return this._workspace.configuration;
                    }
                }
                default: {
                    return undefined;
                }
            }
        }
        _getResourceForTask(task) {
            if (tasks_1.CustomTask.is(task)) {
                let uri = this._getResourceForKind(task._source.kind);
                if (!uri) {
                    const taskFolder = task.getWorkspaceFolder();
                    if (taskFolder) {
                        uri = taskFolder.toResource(task._source.config.file);
                    }
                    else {
                        uri = this.workspaceFolders[0].uri;
                    }
                }
                return uri;
            }
            else {
                return task.getWorkspaceFolder().toResource('.vscode/tasks.json');
            }
        }
        async openConfig(task) {
            let resource;
            if (task) {
                resource = this._getResourceForTask(task);
            }
            else {
                resource = (this._workspaceFolders && (this._workspaceFolders.length > 0)) ? this._workspaceFolders[0].toResource('.vscode/tasks.json') : undefined;
            }
            return this._openEditorAtTask(resource, task ? task._label : undefined, task ? task._source.config.index : -1);
        }
        _createRunnableTask(tasks, group) {
            const resolverData = new Map();
            const workspaceTasks = [];
            const extensionTasks = [];
            tasks.forEach((tasks, folder) => {
                let data = resolverData.get(folder);
                if (!data) {
                    data = {
                        id: new Map(),
                        label: new Map(),
                        identifier: new Map()
                    };
                    resolverData.set(folder, data);
                }
                for (const task of tasks) {
                    data.id.set(task._id, task);
                    data.label.set(task._label, task);
                    if (task.configurationProperties.identifier) {
                        data.identifier.set(task.configurationProperties.identifier, task);
                    }
                    if (group && task.configurationProperties.group === group) {
                        if (task._source.kind === tasks_1.TaskSourceKind.Workspace) {
                            workspaceTasks.push(task);
                        }
                        else {
                            extensionTasks.push(task);
                        }
                    }
                }
            });
            const resolver = {
                resolve: async (uri, alias) => {
                    const data = resolverData.get(typeof uri === 'string' ? uri : uri.toString());
                    if (!data) {
                        return undefined;
                    }
                    return data.id.get(alias) || data.label.get(alias) || data.identifier.get(alias);
                }
            };
            if (workspaceTasks.length > 0) {
                if (workspaceTasks.length > 1) {
                    this._log(nls.localize('moreThanOneBuildTask', 'There are many build tasks defined in the tasks.json. Executing the first one.'));
                }
                return { task: workspaceTasks[0], resolver };
            }
            if (extensionTasks.length === 0) {
                return undefined;
            }
            // We can only have extension tasks if we are in version 2.0.0. Then we can even run
            // multiple build tasks.
            if (extensionTasks.length === 1) {
                return { task: extensionTasks[0], resolver };
            }
            else {
                const id = UUID.generateUuid();
                const task = new tasks_1.InMemoryTask(id, { kind: tasks_1.TaskSourceKind.InMemory, label: 'inMemory' }, id, 'inMemory', { reevaluateOnRerun: true }, {
                    identifier: id,
                    dependsOn: extensionTasks.map((extensionTask) => { return { uri: extensionTask.getWorkspaceFolder().uri, task: extensionTask._id }; }),
                    name: id
                });
                return { task, resolver };
            }
        }
        _createResolver(grouped) {
            let resolverData;
            async function quickResolve(that, uri, identifier) {
                const foundTasks = await that._findWorkspaceTasks((task) => {
                    const taskUri = ((tasks_1.ConfiguringTask.is(task) || tasks_1.CustomTask.is(task)) ? task._source.config.workspaceFolder?.uri : undefined);
                    const originalUri = (typeof uri === 'string' ? uri : uri.toString());
                    if (taskUri?.toString() !== originalUri) {
                        return false;
                    }
                    if (Types.isString(identifier)) {
                        return ((task._label === identifier) || (task.configurationProperties.identifier === identifier));
                    }
                    else {
                        const keyedIdentifier = task.getDefinition(true);
                        const searchIdentifier = tasks_1.TaskDefinition.createTaskIdentifier(identifier, console);
                        return (searchIdentifier && keyedIdentifier) ? (searchIdentifier._key === keyedIdentifier._key) : false;
                    }
                });
                if (foundTasks.length === 0) {
                    return undefined;
                }
                const task = foundTasks[0];
                if (tasks_1.ConfiguringTask.is(task)) {
                    return that.tryResolveTask(task);
                }
                return task;
            }
            async function getResolverData(that) {
                if (resolverData === undefined) {
                    resolverData = new Map();
                    (grouped || await that._getGroupedTasks()).forEach((tasks, folder) => {
                        let data = resolverData.get(folder);
                        if (!data) {
                            data = { label: new Map(), identifier: new Map(), taskIdentifier: new Map() };
                            resolverData.set(folder, data);
                        }
                        for (const task of tasks) {
                            data.label.set(task._label, task);
                            if (task.configurationProperties.identifier) {
                                data.identifier.set(task.configurationProperties.identifier, task);
                            }
                            const keyedIdentifier = task.getDefinition(true);
                            if (keyedIdentifier !== undefined) {
                                data.taskIdentifier.set(keyedIdentifier._key, task);
                            }
                        }
                    });
                }
                return resolverData;
            }
            async function fullResolve(that, uri, identifier) {
                const allResolverData = await getResolverData(that);
                const data = allResolverData.get(typeof uri === 'string' ? uri : uri.toString());
                if (!data) {
                    return undefined;
                }
                if (Types.isString(identifier)) {
                    return data.label.get(identifier) || data.identifier.get(identifier);
                }
                else {
                    const key = tasks_1.TaskDefinition.createTaskIdentifier(identifier, console);
                    return key !== undefined ? data.taskIdentifier.get(key._key) : undefined;
                }
            }
            return {
                resolve: async (uri, identifier) => {
                    if (!identifier) {
                        return undefined;
                    }
                    if ((resolverData === undefined) && (grouped === undefined)) {
                        return (await quickResolve(this, uri, identifier)) ?? fullResolve(this, uri, identifier);
                    }
                    else {
                        return fullResolve(this, uri, identifier);
                    }
                }
            };
        }
        async _saveBeforeRun() {
            let SaveBeforeRunConfigOptions;
            (function (SaveBeforeRunConfigOptions) {
                SaveBeforeRunConfigOptions["Always"] = "always";
                SaveBeforeRunConfigOptions["Never"] = "never";
                SaveBeforeRunConfigOptions["Prompt"] = "prompt";
            })(SaveBeforeRunConfigOptions || (SaveBeforeRunConfigOptions = {}));
            const saveBeforeRunTaskConfig = this._configurationService.getValue("task.saveBeforeRun" /* TaskSettingId.SaveBeforeRun */);
            if (saveBeforeRunTaskConfig === SaveBeforeRunConfigOptions.Never) {
                return false;
            }
            else if (saveBeforeRunTaskConfig === SaveBeforeRunConfigOptions.Prompt && this._editorService.editors.some(e => e.isDirty())) {
                const { confirmed } = await this._dialogService.confirm({
                    message: nls.localize('TaskSystem.saveBeforeRun.prompt.title', "Save all editors?"),
                    detail: nls.localize('detail', "Do you want to save all editors before running the task?"),
                    primaryButton: nls.localize({ key: 'saveBeforeRun.save', comment: ['&& denotes a mnemonic'] }, '&&Save'),
                    cancelButton: nls.localize({ key: 'saveBeforeRun.dontSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                });
                if (!confirmed) {
                    return false;
                }
            }
            await this._editorService.saveAll({ reason: 2 /* SaveReason.AUTO */ });
            return true;
        }
        async _executeTask(task, resolver, runSource) {
            let taskToRun = task;
            if (await this._saveBeforeRun()) {
                await this._configurationService.reloadConfiguration();
                await this._updateWorkspaceTasks();
                const taskFolder = task.getWorkspaceFolder();
                const taskIdentifier = task.configurationProperties.identifier;
                const taskType = tasks_1.CustomTask.is(task) ? task.customizes()?.type : (tasks_1.ContributedTask.is(task) ? task.type : undefined);
                // Since we save before running tasks, the task may have changed as part of the save.
                // However, if the TaskRunSource is not User, then we shouldn't try to fetch the task again
                // since this can cause a new'd task to get overwritten with a provided task.
                taskToRun = ((taskFolder && taskIdentifier && (runSource === 1 /* TaskRunSource.User */))
                    ? await this.getTask(taskFolder, taskIdentifier, false, taskType) : task) ?? task;
            }
            await problemMatcher_1.ProblemMatcherRegistry.onReady();
            const executeResult = runSource === 4 /* TaskRunSource.Reconnect */ ? this._getTaskSystem().reconnect(taskToRun, resolver) : this._getTaskSystem().run(taskToRun, resolver);
            if (executeResult) {
                return this._handleExecuteResult(executeResult, runSource);
            }
            return { exitCode: 0 };
        }
        async _handleExecuteResult(executeResult, runSource) {
            if (runSource === 1 /* TaskRunSource.User */) {
                await this._setRecentlyUsedTask(executeResult.task);
            }
            if (executeResult.kind === 2 /* TaskExecuteKind.Active */) {
                const active = executeResult.active;
                if (active && active.same && runSource === 2 /* TaskRunSource.FolderOpen */ || runSource === 4 /* TaskRunSource.Reconnect */) {
                    // ignore, the task is already active, likely from being reconnected or from folder open.
                    this._logService.debug('Ignoring task that is already active', executeResult.task);
                    return executeResult.promise;
                }
                if (active && active.same) {
                    if (this._taskSystem?.isTaskVisible(executeResult.task)) {
                        const message = nls.localize('TaskSystem.activeSame.noBackground', 'The task \'{0}\' is already active.', executeResult.task.getQualifiedLabel());
                        const lastInstance = this._getTaskSystem().getLastInstance(executeResult.task) ?? executeResult.task;
                        this._notificationService.prompt(severity_1.default.Warning, message, [{
                                label: nls.localize('terminateTask', "Terminate Task"),
                                run: () => this.terminate(lastInstance)
                            },
                            {
                                label: nls.localize('restartTask', "Restart Task"),
                                run: () => this._restart(lastInstance)
                            }], { sticky: true });
                    }
                    else {
                        this._taskSystem?.revealTask(executeResult.task);
                    }
                }
                else {
                    throw new taskSystem_1.TaskError(severity_1.default.Warning, nls.localize('TaskSystem.active', 'There is already a task running. Terminate it first before executing another task.'), 1 /* TaskErrors.RunningTask */);
                }
            }
            this._setRecentlyUsedTask(executeResult.task);
            return executeResult.promise;
        }
        async _restart(task) {
            if (!this._taskSystem) {
                return;
            }
            const response = await this._taskSystem.terminate(task);
            if (response.success) {
                try {
                    await this.run(task);
                }
                catch {
                    // eat the error, we don't care about it here
                }
            }
            else {
                this._notificationService.warn(nls.localize('TaskSystem.restartFailed', 'Failed to terminate and restart task {0}', Types.isString(task) ? task : task.configurationProperties.name));
            }
        }
        async terminate(task) {
            if (!(await this._trust())) {
                return { success: true, task: undefined };
            }
            if (!this._taskSystem) {
                return { success: true, task: undefined };
            }
            return this._taskSystem.terminate(task);
        }
        _terminateAll() {
            if (!this._taskSystem) {
                return Promise.resolve([]);
            }
            return this._taskSystem.terminateAll();
        }
        _createTerminalTaskSystem() {
            return new terminalTaskSystem_1.TerminalTaskSystem(this._terminalService, this._terminalGroupService, this._outputService, this._paneCompositeService, this._viewsService, this._markerService, this._modelService, this._configurationResolverService, this._contextService, this._environmentService, AbstractTaskService_1.OutputChannelId, this._fileService, this._terminalProfileResolverService, this._pathService, this._viewDescriptorService, this._logService, this._notificationService, this._instantiationService, (workspaceFolder) => {
                if (workspaceFolder) {
                    return this._getTaskSystemInfo(workspaceFolder.uri.scheme);
                }
                else if (this._taskSystemInfos.size > 0) {
                    const infos = Array.from(this._taskSystemInfos.entries());
                    const notFile = infos.filter(info => info[0] !== network_1.Schemas.file);
                    if (notFile.length > 0) {
                        return notFile[0][1][0];
                    }
                    return infos[0][1][0];
                }
                else {
                    return undefined;
                }
            });
        }
        _isTaskProviderEnabled(type) {
            const definition = taskDefinitionRegistry_1.TaskDefinitionRegistry.get(type);
            return !definition || !definition.when || this._contextKeyService.contextMatchesRules(definition.when);
        }
        async _getGroupedTasks(filter) {
            await this._waitForAllSupportedExecutions;
            const type = filter?.type;
            const needsRecentTasksMigration = this._needsRecentTasksMigration();
            await this._activateTaskProviders(filter?.type);
            const validTypes = Object.create(null);
            taskDefinitionRegistry_1.TaskDefinitionRegistry.all().forEach(definition => validTypes[definition.taskType] = true);
            validTypes['shell'] = true;
            validTypes['process'] = true;
            const contributedTaskSets = await new Promise(resolve => {
                const result = [];
                let counter = 0;
                const done = (value) => {
                    if (value) {
                        result.push(value);
                    }
                    if (--counter === 0) {
                        resolve(result);
                    }
                };
                const error = (error) => {
                    try {
                        if (error && Types.isString(error.message)) {
                            this._log(`Error: ${error.message}\n`);
                            this._showOutput();
                        }
                        else {
                            this._log('Unknown error received while collecting tasks from providers.');
                            this._showOutput();
                        }
                    }
                    finally {
                        if (--counter === 0) {
                            resolve(result);
                        }
                    }
                };
                if (this._isProvideTasksEnabled() && (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) && (this._providers.size > 0)) {
                    let foundAnyProviders = false;
                    for (const [handle, provider] of this._providers) {
                        const providerType = this._providerTypes.get(handle);
                        if ((type === undefined) || (type === providerType)) {
                            if (providerType && !this._isTaskProviderEnabled(providerType)) {
                                continue;
                            }
                            foundAnyProviders = true;
                            counter++;
                            (0, async_1.raceTimeout)(provider.provideTasks(validTypes).then((taskSet) => {
                                // Check that the tasks provided are of the correct type
                                for (const task of taskSet.tasks) {
                                    if (task.type !== this._providerTypes.get(handle)) {
                                        this._log(nls.localize('unexpectedTaskType', "The task provider for \"{0}\" tasks unexpectedly provided a task of type \"{1}\".\n", this._providerTypes.get(handle), task.type));
                                        if ((task.type !== 'shell') && (task.type !== 'process')) {
                                            this._showOutput();
                                        }
                                        break;
                                    }
                                }
                                return done(taskSet);
                            }, error), 5000, () => {
                                // onTimeout
                                console.error('Timed out getting tasks from ', providerType);
                                done(undefined);
                            });
                        }
                    }
                    if (!foundAnyProviders) {
                        resolve(result);
                    }
                }
                else {
                    resolve(result);
                }
            });
            const result = new TaskMap();
            const contributedTasks = new TaskMap();
            for (const set of contributedTaskSets) {
                for (const task of set.tasks) {
                    const workspaceFolder = task.getWorkspaceFolder();
                    if (workspaceFolder) {
                        contributedTasks.add(workspaceFolder, task);
                    }
                }
            }
            try {
                const customTasks = await this.getWorkspaceTasks();
                const customTasksKeyValuePairs = Array.from(customTasks);
                const customTasksPromises = customTasksKeyValuePairs.map(async ([key, folderTasks]) => {
                    const contributed = contributedTasks.get(key);
                    if (!folderTasks.set) {
                        if (contributed) {
                            result.add(key, ...contributed);
                        }
                        return;
                    }
                    if (this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                        result.add(key, ...folderTasks.set.tasks);
                    }
                    else {
                        const configurations = folderTasks.configurations;
                        const legacyTaskConfigurations = folderTasks.set ? this._getLegacyTaskConfigurations(folderTasks.set) : undefined;
                        const customTasksToDelete = [];
                        if (configurations || legacyTaskConfigurations) {
                            const unUsedConfigurations = new Set();
                            if (configurations) {
                                Object.keys(configurations.byIdentifier).forEach(key => unUsedConfigurations.add(key));
                            }
                            for (const task of contributed) {
                                if (!tasks_1.ContributedTask.is(task)) {
                                    continue;
                                }
                                if (configurations) {
                                    const configuringTask = configurations.byIdentifier[task.defines._key];
                                    if (configuringTask) {
                                        unUsedConfigurations.delete(task.defines._key);
                                        result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                    }
                                    else {
                                        result.add(key, task);
                                    }
                                }
                                else if (legacyTaskConfigurations) {
                                    const configuringTask = legacyTaskConfigurations[task.defines._key];
                                    if (configuringTask) {
                                        result.add(key, TaskConfig.createCustomTask(task, configuringTask));
                                        customTasksToDelete.push(configuringTask);
                                    }
                                    else {
                                        result.add(key, task);
                                    }
                                }
                                else {
                                    result.add(key, task);
                                }
                            }
                            if (customTasksToDelete.length > 0) {
                                const toDelete = customTasksToDelete.reduce((map, task) => {
                                    map[task._id] = true;
                                    return map;
                                }, Object.create(null));
                                for (const task of folderTasks.set.tasks) {
                                    if (toDelete[task._id]) {
                                        continue;
                                    }
                                    result.add(key, task);
                                }
                            }
                            else {
                                result.add(key, ...folderTasks.set.tasks);
                            }
                            const unUsedConfigurationsAsArray = Array.from(unUsedConfigurations);
                            const unUsedConfigurationPromises = unUsedConfigurationsAsArray.map(async (value) => {
                                const configuringTask = configurations.byIdentifier[value];
                                if (type && (type !== configuringTask.configures.type)) {
                                    return;
                                }
                                let requiredTaskProviderUnavailable = false;
                                for (const [handle, provider] of this._providers) {
                                    const providerType = this._providerTypes.get(handle);
                                    if (configuringTask.type === providerType) {
                                        if (providerType && !this._isTaskProviderEnabled(providerType)) {
                                            requiredTaskProviderUnavailable = true;
                                            continue;
                                        }
                                        try {
                                            const resolvedTask = await provider.resolveTask(configuringTask);
                                            if (resolvedTask && (resolvedTask._id === configuringTask._id)) {
                                                result.add(key, TaskConfig.createCustomTask(resolvedTask, configuringTask));
                                                return;
                                            }
                                        }
                                        catch (error) {
                                            // Ignore errors. The task could not be provided by any of the providers.
                                        }
                                    }
                                }
                                if (requiredTaskProviderUnavailable) {
                                    this._log(nls.localize('TaskService.providerUnavailable', 'Warning: {0} tasks are unavailable in the current environment.', configuringTask.configures.type));
                                }
                                else {
                                    this._log(nls.localize('TaskService.noConfiguration', 'Error: The {0} task detection didn\'t contribute a task for the following configuration:\n{1}\nThe task will be ignored.', configuringTask.configures.type, JSON.stringify(configuringTask._source.config.element, undefined, 4)));
                                    this._showOutput();
                                }
                            });
                            await Promise.all(unUsedConfigurationPromises);
                        }
                        else {
                            result.add(key, ...folderTasks.set.tasks);
                            result.add(key, ...contributed);
                        }
                    }
                });
                await Promise.all(customTasksPromises);
                if (needsRecentTasksMigration) {
                    // At this point we have all the tasks and can migrate the recently used tasks.
                    await this._migrateRecentTasks(result.all());
                }
                return result;
            }
            catch {
                // If we can't read the tasks.json file provide at least the contributed tasks
                const result = new TaskMap();
                for (const set of contributedTaskSets) {
                    for (const task of set.tasks) {
                        const folder = task.getWorkspaceFolder();
                        if (folder) {
                            result.add(folder, task);
                        }
                    }
                }
                return result;
            }
        }
        _getLegacyTaskConfigurations(workspaceTasks) {
            let result;
            function getResult() {
                if (result) {
                    return result;
                }
                result = Object.create(null);
                return result;
            }
            for (const task of workspaceTasks.tasks) {
                if (tasks_1.CustomTask.is(task)) {
                    const commandName = task.command && task.command.name;
                    // This is for backwards compatibility with the 0.1.0 task annotation code
                    // if we had a gulp, jake or grunt command a task specification was a annotation
                    if (commandName === 'gulp' || commandName === 'grunt' || commandName === 'jake') {
                        const identifier = tasks_1.KeyedTaskIdentifier.create({
                            type: commandName,
                            task: task.configurationProperties.name
                        });
                        getResult()[identifier._key] = task;
                    }
                }
            }
            return result;
        }
        async getWorkspaceTasks(runSource = 1 /* TaskRunSource.User */) {
            if (!(await this._trust())) {
                return new Map();
            }
            await (0, async_1.raceTimeout)(this._waitForAllSupportedExecutions, 2000, () => {
                this._logService.warn('Timed out waiting for all supported executions');
            });
            await this._whenTaskSystemReady;
            if (this._workspaceTasksPromise) {
                return this._workspaceTasksPromise;
            }
            return this._updateWorkspaceTasks(runSource);
        }
        _updateWorkspaceTasks(runSource = 1 /* TaskRunSource.User */) {
            this._workspaceTasksPromise = this._computeWorkspaceTasks(runSource);
            return this._workspaceTasksPromise;
        }
        async _getAFolder() {
            let folder = this.workspaceFolders.length > 0 ? this.workspaceFolders[0] : undefined;
            if (!folder) {
                const userhome = await this._pathService.userHome();
                folder = new workspace_1.WorkspaceFolder({ uri: userhome, name: resources.basename(userhome), index: 0 });
            }
            return folder;
        }
        async _computeWorkspaceTasks(runSource = 1 /* TaskRunSource.User */) {
            const promises = [];
            for (const folder of this.workspaceFolders) {
                promises.push(this._computeWorkspaceFolderTasks(folder, runSource));
            }
            const values = await Promise.all(promises);
            const result = new Map();
            for (const value of values) {
                if (value) {
                    result.set(value.workspaceFolder.uri.toString(), value);
                }
            }
            const folder = await this._getAFolder();
            if (this._contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */) {
                const workspaceFileTasks = await this._computeWorkspaceFileTasks(folder, runSource);
                if (workspaceFileTasks && this._workspace && this._workspace.configuration) {
                    result.set(this._workspace.configuration.toString(), workspaceFileTasks);
                }
            }
            const userTasks = await this._computeUserTasks(folder, runSource);
            if (userTasks) {
                result.set(tasks_1.USER_TASKS_GROUP_KEY, userTasks);
            }
            return result;
        }
        get _jsonTasksSupported() {
            return taskService_1.ShellExecutionSupportedContext.getValue(this._contextKeyService) === true && taskService_1.ProcessExecutionSupportedContext.getValue(this._contextKeyService) === true;
        }
        async _computeWorkspaceFolderTasks(workspaceFolder, runSource = 1 /* TaskRunSource.User */) {
            const workspaceFolderConfiguration = (this._executionEngine === tasks_1.ExecutionEngine.Process ? await this._computeLegacyConfiguration(workspaceFolder) : await this._computeConfiguration(workspaceFolder));
            if (!workspaceFolderConfiguration || !workspaceFolderConfiguration.config || workspaceFolderConfiguration.hasErrors) {
                return Promise.resolve({ workspaceFolder, set: undefined, configurations: undefined, hasErrors: workspaceFolderConfiguration ? workspaceFolderConfiguration.hasErrors : false });
            }
            await problemMatcher_1.ProblemMatcherRegistry.onReady();
            const taskSystemInfo = this._getTaskSystemInfo(workspaceFolder.uri.scheme);
            const problemReporter = new ProblemReporter(this._outputChannel);
            const parseResult = TaskConfig.parse(workspaceFolder, undefined, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, workspaceFolderConfiguration.config, problemReporter, TaskConfig.TaskConfigSource.TasksJson, this._contextKeyService);
            let hasErrors = false;
            if (!parseResult.validationStatus.isOK() && (parseResult.validationStatus.state !== 1 /* ValidationState.Info */)) {
                hasErrors = true;
                this._showOutput(runSource);
            }
            if (problemReporter.status.isFatal()) {
                problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                return { workspaceFolder, set: undefined, configurations: undefined, hasErrors };
            }
            let customizedTasks;
            if (parseResult.configured && parseResult.configured.length > 0) {
                customizedTasks = {
                    byIdentifier: Object.create(null)
                };
                for (const task of parseResult.configured) {
                    customizedTasks.byIdentifier[task.configures._key] = task;
                }
            }
            if (!this._jsonTasksSupported && (parseResult.custom.length > 0)) {
                console.warn('Custom workspace tasks are not supported.');
            }
            return { workspaceFolder, set: { tasks: this._jsonTasksSupported ? parseResult.custom : [] }, configurations: customizedTasks, hasErrors };
        }
        _testParseExternalConfig(config, location) {
            if (!config) {
                return { config: undefined, hasParseErrors: false };
            }
            const parseErrors = config.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._log(nls.localize({ key: 'TaskSystem.invalidTaskJsonOther', comment: ['Message notifies of an error in one of several places there is tasks related json, not necessarily in a file named tasks.json'] }, 'Error: The content of the tasks json in {0} has syntax errors. Please correct them before executing a task.', location));
                    this._showOutput();
                    return { config, hasParseErrors: true };
                }
            }
            return { config, hasParseErrors: false };
        }
        _log(value, verbose) {
            if (!verbose || this._configurationService.getValue("task.verboseLogging" /* TaskSettingId.VerboseLogging */)) {
                this._outputChannel.append(value + '\n');
            }
        }
        async _computeWorkspaceFileTasks(workspaceFolder, runSource = 1 /* TaskRunSource.User */) {
            if (this._executionEngine === tasks_1.ExecutionEngine.Process) {
                return this._emptyWorkspaceTaskResults(workspaceFolder);
            }
            const workspaceFileConfig = this._getConfiguration(workspaceFolder, tasks_1.TaskSourceKind.WorkspaceFile);
            const configuration = this._testParseExternalConfig(workspaceFileConfig.config, nls.localize('TasksSystem.locationWorkspaceConfig', 'workspace file'));
            const customizedTasks = {
                byIdentifier: Object.create(null)
            };
            const custom = [];
            await this._computeTasksForSingleConfig(workspaceFolder, configuration.config, runSource, custom, customizedTasks.byIdentifier, TaskConfig.TaskConfigSource.WorkspaceFile);
            const engine = configuration.config ? TaskConfig.ExecutionEngine.from(configuration.config) : tasks_1.ExecutionEngine.Terminal;
            if (engine === tasks_1.ExecutionEngine.Process) {
                this._notificationService.warn(nls.localize('TaskSystem.versionWorkspaceFile', 'Only tasks version 2.0.0 permitted in workspace configuration files.'));
                return this._emptyWorkspaceTaskResults(workspaceFolder);
            }
            return { workspaceFolder, set: { tasks: custom }, configurations: customizedTasks, hasErrors: configuration.hasParseErrors };
        }
        async _computeUserTasks(workspaceFolder, runSource = 1 /* TaskRunSource.User */) {
            if (this._executionEngine === tasks_1.ExecutionEngine.Process) {
                return this._emptyWorkspaceTaskResults(workspaceFolder);
            }
            const userTasksConfig = this._getConfiguration(workspaceFolder, tasks_1.TaskSourceKind.User);
            const configuration = this._testParseExternalConfig(userTasksConfig.config, nls.localize('TasksSystem.locationUserConfig', 'user settings'));
            const customizedTasks = {
                byIdentifier: Object.create(null)
            };
            const custom = [];
            await this._computeTasksForSingleConfig(workspaceFolder, configuration.config, runSource, custom, customizedTasks.byIdentifier, TaskConfig.TaskConfigSource.User);
            const engine = configuration.config ? TaskConfig.ExecutionEngine.from(configuration.config) : tasks_1.ExecutionEngine.Terminal;
            if (engine === tasks_1.ExecutionEngine.Process) {
                this._notificationService.warn(nls.localize('TaskSystem.versionSettings', 'Only tasks version 2.0.0 permitted in user settings.'));
                return this._emptyWorkspaceTaskResults(workspaceFolder);
            }
            return { workspaceFolder, set: { tasks: custom }, configurations: customizedTasks, hasErrors: configuration.hasParseErrors };
        }
        _emptyWorkspaceTaskResults(workspaceFolder) {
            return { workspaceFolder, set: undefined, configurations: undefined, hasErrors: false };
        }
        async _computeTasksForSingleConfig(workspaceFolder, config, runSource, custom, customized, source, isRecentTask = false) {
            if (!config) {
                return false;
            }
            else if (!workspaceFolder) {
                this._logService.trace('TaskService.computeTasksForSingleConfig: no workspace folder for worskspace', this._workspace?.id);
                return false;
            }
            const taskSystemInfo = this._getTaskSystemInfo(workspaceFolder.uri.scheme);
            const problemReporter = new ProblemReporter(this._outputChannel);
            const parseResult = TaskConfig.parse(workspaceFolder, this._workspace, taskSystemInfo ? taskSystemInfo.platform : Platform.platform, config, problemReporter, source, this._contextKeyService, isRecentTask);
            let hasErrors = false;
            if (!parseResult.validationStatus.isOK() && (parseResult.validationStatus.state !== 1 /* ValidationState.Info */)) {
                this._showOutput(runSource);
                hasErrors = true;
            }
            if (problemReporter.status.isFatal()) {
                problemReporter.fatal(nls.localize('TaskSystem.configurationErrors', 'Error: the provided task configuration has validation errors and can\'t not be used. Please correct the errors first.'));
                return hasErrors;
            }
            if (parseResult.configured && parseResult.configured.length > 0) {
                for (const task of parseResult.configured) {
                    customized[task.configures._key] = task;
                }
            }
            if (!this._jsonTasksSupported && (parseResult.custom.length > 0)) {
                console.warn('Custom workspace tasks are not supported.');
            }
            else {
                for (const task of parseResult.custom) {
                    custom.push(task);
                }
            }
            return hasErrors;
        }
        _computeConfiguration(workspaceFolder) {
            const { config, hasParseErrors } = this._getConfiguration(workspaceFolder);
            return Promise.resolve({ workspaceFolder, config, hasErrors: hasParseErrors });
        }
        _computeWorkspaceFolderSetup() {
            const workspaceFolders = [];
            const ignoredWorkspaceFolders = [];
            let executionEngine = tasks_1.ExecutionEngine.Terminal;
            let schemaVersion = 2 /* JsonSchemaVersion.V2_0_0 */;
            let workspace;
            if (this._contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceFolder = this._contextService.getWorkspace().folders[0];
                workspaceFolders.push(workspaceFolder);
                executionEngine = this._computeExecutionEngine(workspaceFolder);
                const telemetryData = {
                    executionEngineVersion: executionEngine
                };
                /* __GDPR__
                    "taskService.engineVersion" : {
                        "owner": "alexr00",
                        "comment": "The engine version of tasks. Used to determine if a user is using a deprecated version.",
                        "executionEngineVersion" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "comment": "The engine version of tasks." }
                    }
                */
                this._telemetryService.publicLog('taskService.engineVersion', telemetryData);
                schemaVersion = this._computeJsonSchemaVersion(workspaceFolder);
            }
            else if (this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                workspace = this._contextService.getWorkspace();
                for (const workspaceFolder of this._contextService.getWorkspace().folders) {
                    if (schemaVersion === this._computeJsonSchemaVersion(workspaceFolder)) {
                        workspaceFolders.push(workspaceFolder);
                    }
                    else {
                        ignoredWorkspaceFolders.push(workspaceFolder);
                        this._log(nls.localize('taskService.ignoreingFolder', 'Ignoring task configurations for workspace folder {0}. Multi folder workspace task support requires that all folders use task version 2.0.0', workspaceFolder.uri.fsPath));
                    }
                }
            }
            return [workspaceFolders, ignoredWorkspaceFolders, executionEngine, schemaVersion, workspace];
        }
        _computeExecutionEngine(workspaceFolder) {
            const { config } = this._getConfiguration(workspaceFolder);
            if (!config) {
                return tasks_1.ExecutionEngine._default;
            }
            return TaskConfig.ExecutionEngine.from(config);
        }
        _computeJsonSchemaVersion(workspaceFolder) {
            const { config } = this._getConfiguration(workspaceFolder);
            if (!config) {
                return 2 /* JsonSchemaVersion.V2_0_0 */;
            }
            return TaskConfig.JsonSchemaVersion.from(config);
        }
        _getConfiguration(workspaceFolder, source) {
            let result;
            if ((source !== tasks_1.TaskSourceKind.User) && (this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */)) {
                result = undefined;
            }
            else {
                const wholeConfig = this._configurationService.inspect('tasks', { resource: workspaceFolder.uri });
                switch (source) {
                    case tasks_1.TaskSourceKind.User: {
                        if (wholeConfig.userValue !== wholeConfig.workspaceFolderValue) {
                            result = Objects.deepClone(wholeConfig.userValue);
                        }
                        break;
                    }
                    case tasks_1.TaskSourceKind.Workspace:
                        result = Objects.deepClone(wholeConfig.workspaceFolderValue);
                        break;
                    case tasks_1.TaskSourceKind.WorkspaceFile: {
                        if ((this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */)
                            && (wholeConfig.workspaceFolderValue !== wholeConfig.workspaceValue)) {
                            result = Objects.deepClone(wholeConfig.workspaceValue);
                        }
                        break;
                    }
                    default: result = Objects.deepClone(wholeConfig.workspaceFolderValue);
                }
            }
            if (!result) {
                return { config: undefined, hasParseErrors: false };
            }
            const parseErrors = result.$parseErrors;
            if (parseErrors) {
                let isAffected = false;
                for (const parseError of parseErrors) {
                    if (/tasks\.json$/.test(parseError)) {
                        isAffected = true;
                        break;
                    }
                }
                if (isAffected) {
                    this._log(nls.localize('TaskSystem.invalidTaskJson', 'Error: The content of the tasks.json file has syntax errors. Please correct them before executing a task.'));
                    this._showOutput();
                    return { config: undefined, hasParseErrors: true };
                }
            }
            return { config: result, hasParseErrors: false };
        }
        inTerminal() {
            if (this._taskSystem) {
                return this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem;
            }
            return this._executionEngine === tasks_1.ExecutionEngine.Terminal;
        }
        configureAction() {
            const thisCapture = this;
            return new class extends actions_1.Action {
                constructor() {
                    super(ConfigureTaskAction.ID, ConfigureTaskAction.TEXT.value, undefined, true, () => { thisCapture._runConfigureTasks(); return Promise.resolve(undefined); });
                }
            };
        }
        _handleError(err) {
            let showOutput = true;
            if (err instanceof taskSystem_1.TaskError) {
                const buildError = err;
                const needsConfig = buildError.code === 0 /* TaskErrors.NotConfigured */ || buildError.code === 2 /* TaskErrors.NoBuildTask */ || buildError.code === 3 /* TaskErrors.NoTestTask */;
                const needsTerminate = buildError.code === 1 /* TaskErrors.RunningTask */;
                if (needsConfig || needsTerminate) {
                    this._notificationService.prompt(buildError.severity, buildError.message, [{
                            label: needsConfig ? ConfigureTaskAction.TEXT.value : nls.localize('TerminateAction.label', "Terminate Task"),
                            run: () => {
                                if (needsConfig) {
                                    this._runConfigureTasks();
                                }
                                else {
                                    this._runTerminateCommand();
                                }
                            }
                        }]);
                }
                else {
                    this._notificationService.notify({ severity: buildError.severity, message: buildError.message });
                }
            }
            else if (err instanceof Error) {
                const error = err;
                this._notificationService.error(error.message);
                showOutput = false;
            }
            else if (Types.isString(err)) {
                this._notificationService.error(err);
            }
            else {
                this._notificationService.error(nls.localize('TaskSystem.unknownError', 'An error has occurred while running a task. See task log for details.'));
            }
            if (showOutput) {
                this._showOutput();
            }
        }
        _showDetail() {
            return this._configurationService.getValue(taskQuickPick_1.QUICKOPEN_DETAIL_CONFIG);
        }
        async _createTaskQuickPickEntries(tasks, group = false, sort = false, selectedEntry, includeRecents = true) {
            let encounteredTasks = {};
            if (tasks === undefined || tasks === null || tasks.length === 0) {
                return [];
            }
            const TaskQuickPickEntry = (task) => {
                const newEntry = { label: task._label, description: this.getTaskDescription(task), task, detail: this._showDetail() ? task.configurationProperties.detail : undefined };
                if (encounteredTasks[task._id]) {
                    if (encounteredTasks[task._id].length === 1) {
                        encounteredTasks[task._id][0].label += ' (1)';
                    }
                    newEntry.label = newEntry.label + ' (' + (encounteredTasks[task._id].length + 1).toString() + ')';
                }
                else {
                    encounteredTasks[task._id] = [];
                }
                encounteredTasks[task._id].push(newEntry);
                return newEntry;
            };
            function fillEntries(entries, tasks, groupLabel) {
                if (tasks.length) {
                    entries.push({ type: 'separator', label: groupLabel });
                }
                for (const task of tasks) {
                    const entry = TaskQuickPickEntry(task);
                    entry.buttons = [{ iconClass: themables_1.ThemeIcon.asClassName(taskQuickPick_1.configureTaskIcon), tooltip: nls.localize('configureTask', "Configure Task") }];
                    if (selectedEntry && (task === selectedEntry.task)) {
                        entries.unshift(selectedEntry);
                    }
                    else {
                        entries.push(entry);
                    }
                }
            }
            let entries;
            if (group) {
                entries = [];
                if (tasks.length === 1) {
                    entries.push(TaskQuickPickEntry(tasks[0]));
                }
                else {
                    const recentlyUsedTasks = await this.getSavedTasks('historical');
                    const recent = [];
                    const recentSet = new Set();
                    let configured = [];
                    let detected = [];
                    const taskMap = Object.create(null);
                    tasks.forEach(task => {
                        const key = task.getCommonTaskId();
                        if (key) {
                            taskMap[key] = task;
                        }
                    });
                    recentlyUsedTasks.reverse().forEach(recentTask => {
                        const key = recentTask.getCommonTaskId();
                        if (key) {
                            recentSet.add(key);
                            const task = taskMap[key];
                            if (task) {
                                recent.push(task);
                            }
                        }
                    });
                    for (const task of tasks) {
                        const key = task.getCommonTaskId();
                        if (!key || !recentSet.has(key)) {
                            if ((task._source.kind === tasks_1.TaskSourceKind.Workspace) || (task._source.kind === tasks_1.TaskSourceKind.User)) {
                                configured.push(task);
                            }
                            else {
                                detected.push(task);
                            }
                        }
                    }
                    const sorter = this.createSorter();
                    if (includeRecents) {
                        fillEntries(entries, recent, nls.localize('recentlyUsed', 'recently used tasks'));
                    }
                    configured = configured.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, configured, nls.localize('configured', 'configured tasks'));
                    detected = detected.sort((a, b) => sorter.compare(a, b));
                    fillEntries(entries, detected, nls.localize('detected', 'detected tasks'));
                }
            }
            else {
                if (sort) {
                    const sorter = this.createSorter();
                    tasks = tasks.sort((a, b) => sorter.compare(a, b));
                }
                entries = tasks.map(task => TaskQuickPickEntry(task));
            }
            encounteredTasks = {};
            return entries;
        }
        async _showTwoLevelQuickPick(placeHolder, defaultEntry, type, name) {
            return this._instantiationService.createInstance(taskQuickPick_1.TaskQuickPick).show(placeHolder, defaultEntry, type, name);
        }
        async _showQuickPick(tasks, placeHolder, defaultEntry, group = false, sort = false, selectedEntry, additionalEntries, name) {
            const resolvedTasks = await tasks;
            const entries = await (0, async_1.raceTimeout)(this._createTaskQuickPickEntries(resolvedTasks, group, sort, selectedEntry), 200, () => undefined);
            if (!entries) {
                return undefined;
            }
            if (entries.length === 1 && this._configurationService.getValue(taskQuickPick_1.QUICKOPEN_SKIP_CONFIG)) {
                return entries[0];
            }
            else if ((entries.length === 0) && defaultEntry) {
                entries.push(defaultEntry);
            }
            else if (entries.length > 1 && additionalEntries && additionalEntries.length > 0) {
                entries.push({ type: 'separator', label: '' });
                entries.push(additionalEntries[0]);
            }
            const picker = this._quickInputService.createQuickPick();
            picker.placeholder = placeHolder;
            picker.matchOnDescription = true;
            if (name) {
                picker.value = name;
            }
            picker.onDidTriggerItemButton(context => {
                const task = context.item.task;
                this._quickInputService.cancel();
                if (tasks_1.ContributedTask.is(task)) {
                    this.customize(task, undefined, true);
                }
                else if (tasks_1.CustomTask.is(task)) {
                    this.openConfig(task);
                }
            });
            picker.items = entries;
            picker.show();
            return new Promise(resolve => {
                this._register(picker.onDidAccept(async () => {
                    const selectedEntry = picker.selectedItems ? picker.selectedItems[0] : undefined;
                    picker.dispose();
                    if (!selectedEntry) {
                        resolve(undefined);
                    }
                    resolve(selectedEntry);
                }));
            });
        }
        _needsRecentTasksMigration() {
            return (this.getRecentlyUsedTasksV1().size > 0) && (this._getTasksFromStorage('historical').size === 0);
        }
        async _migrateRecentTasks(tasks) {
            if (!this._needsRecentTasksMigration()) {
                return;
            }
            const recentlyUsedTasks = this.getRecentlyUsedTasksV1();
            const taskMap = Object.create(null);
            tasks.forEach(task => {
                const key = task.getKey();
                if (key) {
                    taskMap[key] = task;
                }
            });
            const reversed = [...recentlyUsedTasks.keys()].reverse();
            for (const key in reversed) {
                const task = taskMap[key];
                if (task) {
                    await this._setRecentlyUsedTask(task);
                }
            }
            this._storageService.remove(AbstractTaskService_1.RecentlyUsedTasks_Key, 1 /* StorageScope.WORKSPACE */);
        }
        _showIgnoredFoldersMessage() {
            if (this.ignoredWorkspaceFolders.length === 0 || !this.showIgnoreMessage) {
                return Promise.resolve(undefined);
            }
            this._notificationService.prompt(severity_1.default.Info, nls.localize('TaskService.ignoredFolder', 'The following workspace folders are ignored since they use task version 0.1.0: {0}', this.ignoredWorkspaceFolders.map(f => f.name).join(', ')), [{
                    label: nls.localize('TaskService.notAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        this._storageService.store(AbstractTaskService_1.IgnoreTask010DonotShowAgain_key, true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                        this._showIgnoreMessage = false;
                    }
                }]);
            return Promise.resolve(undefined);
        }
        async _trust() {
            if (taskService_1.ServerlessWebContext && !taskService_1.TaskExecutionSupportedContext) {
                return false;
            }
            await this._workspaceTrustManagementService.workspaceTrustInitialized;
            if (!this._workspaceTrustManagementService.isWorkspaceTrusted()) {
                return (await this._workspaceTrustRequestService.requestWorkspaceTrust({
                    message: nls.localize('TaskService.requestTrust', "Listing and running tasks requires that some of the files in this workspace be executed as code.")
                })) === true;
            }
            return true;
        }
        async _runTaskCommand(filter) {
            if (!this._tasksReconnected) {
                return;
            }
            if (!filter) {
                return this._doRunTaskCommand();
            }
            const type = typeof filter === 'string' ? undefined : filter.type;
            const taskName = typeof filter === 'string' ? filter : filter.task;
            const grouped = await this._getGroupedTasks({ type });
            const identifier = this._getTaskIdentifier(filter);
            const tasks = grouped.all();
            const resolver = this._createResolver(grouped);
            const folderURIs = this._contextService.getWorkspace().folders.map(folder => folder.uri);
            if (this._contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                folderURIs.push(this._contextService.getWorkspace().configuration);
            }
            folderURIs.push(tasks_1.USER_TASKS_GROUP_KEY);
            if (identifier) {
                for (const uri of folderURIs) {
                    const task = await resolver.resolve(uri, identifier);
                    if (task) {
                        this.run(task);
                        return;
                    }
                }
            }
            const exactMatchTask = !taskName ? undefined : tasks.find(t => t.configurationProperties.identifier === taskName || t.getDefinition(true)?.configurationProperties?.identifier === taskName);
            if (!exactMatchTask) {
                return this._doRunTaskCommand(tasks, type, taskName);
            }
            for (const uri of folderURIs) {
                const task = await resolver.resolve(uri, taskName);
                if (task) {
                    await this.run(task, { attachProblemMatcher: true }, 1 /* TaskRunSource.User */);
                    return;
                }
            }
        }
        _tasksAndGroupedTasks(filter) {
            if (!this._versionAndEngineCompatible(filter)) {
                return { tasks: Promise.resolve([]), grouped: Promise.resolve(new TaskMap()) };
            }
            const grouped = this._getGroupedTasks(filter);
            const tasks = grouped.then((map) => {
                if (!filter || !filter.type) {
                    return map.all();
                }
                const result = [];
                map.forEach((tasks) => {
                    for (const task of tasks) {
                        if (tasks_1.ContributedTask.is(task) && task.defines.type === filter.type) {
                            result.push(task);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            if (task.type === filter.type) {
                                result.push(task);
                            }
                            else {
                                const customizes = task.customizes();
                                if (customizes && customizes.type === filter.type) {
                                    result.push(task);
                                }
                            }
                        }
                    }
                });
                return result;
            });
            return { tasks, grouped };
        }
        _doRunTaskCommand(tasks, type, name) {
            const pickThen = (task) => {
                if (task === undefined) {
                    return;
                }
                if (task === null) {
                    this._runConfigureTasks();
                }
                else {
                    this.run(task, { attachProblemMatcher: true }, 1 /* TaskRunSource.User */).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
            };
            const placeholder = nls.localize('TaskService.pickRunTask', 'Select the task to run');
            this._showIgnoredFoldersMessage().then(() => {
                if (this._configurationService.getValue(USE_SLOW_PICKER)) {
                    let taskResult = undefined;
                    if (!tasks) {
                        taskResult = this._tasksAndGroupedTasks();
                    }
                    this._showQuickPick(tasks ? tasks : taskResult.tasks, placeholder, {
                        label: '$(plus) ' + nls.localize('TaskService.noEntryToRun', 'Configure a Task'),
                        task: null
                    }, true, undefined, undefined, undefined, name).
                        then((entry) => {
                        return pickThen(entry ? entry.task : undefined);
                    });
                }
                else {
                    this._showTwoLevelQuickPick(placeholder, {
                        label: '$(plus) ' + nls.localize('TaskService.noEntryToRun', 'Configure a Task'),
                        task: null
                    }, type, name).
                        then(pickThen);
                }
            });
        }
        _reRunTaskCommand() {
            problemMatcher_1.ProblemMatcherRegistry.onReady().then(() => {
                return this._editorService.saveAll({ reason: 2 /* SaveReason.AUTO */ }).then(() => {
                    const executeResult = this._getTaskSystem().rerun();
                    if (executeResult) {
                        return this._handleExecuteResult(executeResult);
                    }
                    else {
                        if (!this._taskRunningState.get()) {
                            // No task running, prompt to ask which to run
                            this._doRunTaskCommand();
                        }
                        return Promise.resolve(undefined);
                    }
                });
            });
        }
        /**
         *
         * @param tasks - The tasks which need to be filtered
         * @param tasksInList - This tells splitPerGroupType to filter out globbed tasks (into defaults)
         * @returns
         */
        _getDefaultTasks(tasks, taskGlobsInList = false) {
            const defaults = [];
            for (const task of tasks) {
                // At this point (assuming taskGlobsInList is true) there are tasks with matching globs, so only put those in defaults
                if (taskGlobsInList && typeof task.configurationProperties.group.isDefault === 'string') {
                    defaults.push(task);
                }
                else if (!taskGlobsInList && task.configurationProperties.group.isDefault === true) {
                    defaults.push(task);
                }
            }
            return defaults;
        }
        _runTaskGroupCommand(taskGroup, strings, configure, legacyCommand) {
            if (this.schemaVersion === 1 /* JsonSchemaVersion.V0_1_0 */) {
                legacyCommand();
                return;
            }
            const options = {
                location: 10 /* ProgressLocation.Window */,
                title: strings.fetching
            };
            const promise = (async () => {
                let groupTasks = [];
                async function runSingleTask(task, problemMatcherOptions, that) {
                    that.run(task, problemMatcherOptions, 1 /* TaskRunSource.User */).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                }
                const chooseAndRunTask = (tasks) => {
                    this._showIgnoredFoldersMessage().then(() => {
                        this._showQuickPick(tasks, strings.select, {
                            label: strings.notFoundConfigure,
                            task: null
                        }, true).then((entry) => {
                            const task = entry ? entry.task : undefined;
                            if (task === undefined) {
                                return;
                            }
                            if (task === null) {
                                configure.apply(this);
                                return;
                            }
                            runSingleTask(task, { attachProblemMatcher: true }, this);
                        });
                    });
                };
                let globTasksDetected = false;
                // First check for globs before checking for the default tasks of the task group
                const absoluteURI = editor_1.EditorResourceAccessor.getOriginalUri(this._editorService.activeEditor);
                if (absoluteURI) {
                    const workspaceFolder = this._contextService.getWorkspaceFolder(absoluteURI);
                    if (workspaceFolder) {
                        const configuredTasks = this._getConfiguration(workspaceFolder)?.config?.tasks;
                        if (configuredTasks) {
                            globTasksDetected = configuredTasks.filter(task => task.group && typeof task.group !== 'string' && typeof task.group.isDefault === 'string').length > 0;
                            // This will activate extensions, so only do so if necessary #185960
                            if (globTasksDetected) {
                                // Fallback to absolute path of the file if it is not in a workspace or relative path cannot be found
                                const relativePath = workspaceFolder?.uri ? (resources.relativePath(workspaceFolder.uri, absoluteURI) ?? absoluteURI.path) : absoluteURI.path;
                                groupTasks = await this._findWorkspaceTasks((task) => {
                                    const currentTaskGroup = task.configurationProperties.group;
                                    if (currentTaskGroup && typeof currentTaskGroup !== 'string' && typeof currentTaskGroup.isDefault === 'string') {
                                        return (currentTaskGroup._id === taskGroup._id && glob.match(currentTaskGroup.isDefault, relativePath));
                                    }
                                    return false;
                                });
                            }
                        }
                    }
                }
                if (!globTasksDetected && groupTasks.length === 0) {
                    groupTasks = await this._findWorkspaceTasksInGroup(taskGroup, true);
                }
                const handleMultipleTasks = (areGlobTasks) => {
                    return this._getTasksForGroup(taskGroup).then((tasks) => {
                        if (tasks.length > 0) {
                            // If we're dealing with tasks that were chosen because of a glob match,
                            // then put globs in the defaults and everything else in none
                            const defaults = this._getDefaultTasks(tasks, areGlobTasks);
                            if (defaults.length === 1) {
                                runSingleTask(defaults[0], undefined, this);
                                return;
                            }
                            else if (defaults.length > 0) {
                                tasks = defaults;
                            }
                        }
                        // At this this point there are multiple tasks.
                        chooseAndRunTask(tasks);
                    });
                };
                const resolveTaskAndRun = (taskGroupTask) => {
                    if (tasks_1.ConfiguringTask.is(taskGroupTask)) {
                        this.tryResolveTask(taskGroupTask).then(resolvedTask => {
                            runSingleTask(resolvedTask, undefined, this);
                        });
                    }
                    else {
                        runSingleTask(taskGroupTask, undefined, this);
                    }
                };
                // A single default glob task was returned, just run it directly
                if (groupTasks.length === 1) {
                    return resolveTaskAndRun(groupTasks[0]);
                }
                // If there's multiple globs that match we want to show the quick picker for those tasks
                // We will need to call splitPerGroupType putting globs in defaults and the remaining tasks in none.
                // We don't need to carry on after here
                if (globTasksDetected && groupTasks.length > 1) {
                    return handleMultipleTasks(true);
                }
                // If no globs are found or matched fallback to checking for default tasks of the task group
                if (!groupTasks.length) {
                    groupTasks = await this._findWorkspaceTasksInGroup(taskGroup, false);
                }
                // A single default task was returned, just run it directly
                if (groupTasks.length === 1) {
                    return resolveTaskAndRun(groupTasks[0]);
                }
                // Multiple default tasks returned, show the quickPicker
                return handleMultipleTasks(false);
            })();
            this._progressService.withProgress(options, () => promise);
        }
        _runBuildCommand() {
            if (!this._tasksReconnected) {
                return;
            }
            return this._runTaskGroupCommand(tasks_1.TaskGroup.Build, {
                fetching: nls.localize('TaskService.fetchingBuildTasks', 'Fetching build tasks...'),
                select: nls.localize('TaskService.pickBuildTask', 'Select the build task to run'),
                notFoundConfigure: nls.localize('TaskService.noBuildTask', 'No build task to run found. Configure Build Task...')
            }, this._runConfigureDefaultBuildTask, this._build);
        }
        _runTestCommand() {
            return this._runTaskGroupCommand(tasks_1.TaskGroup.Test, {
                fetching: nls.localize('TaskService.fetchingTestTasks', 'Fetching test tasks...'),
                select: nls.localize('TaskService.pickTestTask', 'Select the test task to run'),
                notFoundConfigure: nls.localize('TaskService.noTestTaskTerminal', 'No test task to run found. Configure Tasks...')
            }, this._runConfigureDefaultTestTask, this._runTest);
        }
        _runTerminateCommand(arg) {
            if (arg === 'terminateAll') {
                this._terminateAll();
                return;
            }
            const runQuickPick = (promise) => {
                this._showQuickPick(promise || this.getActiveTasks(), nls.localize('TaskService.taskToTerminate', 'Select a task to terminate'), {
                    label: nls.localize('TaskService.noTaskRunning', 'No task is currently running'),
                    task: undefined
                }, false, true, undefined, [{
                        label: nls.localize('TaskService.terminateAllRunningTasks', 'All Running Tasks'),
                        id: 'terminateAll',
                        task: undefined
                    }]).then(entry => {
                    if (entry && entry.id === 'terminateAll') {
                        this._terminateAll();
                    }
                    const task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this.terminate(task);
                });
            };
            if (this.inTerminal()) {
                const identifier = this._getTaskIdentifier(arg);
                let promise;
                if (identifier !== undefined) {
                    promise = this.getActiveTasks();
                    promise.then((tasks) => {
                        for (const task of tasks) {
                            if (task.matches(identifier)) {
                                this.terminate(task);
                                return;
                            }
                        }
                        runQuickPick(promise);
                    });
                }
                else {
                    runQuickPick();
                }
            }
            else {
                this._isActive().then((active) => {
                    if (active) {
                        this._terminateAll().then((responses) => {
                            // the output runner has only one task
                            const response = responses[0];
                            if (response.success) {
                                return;
                            }
                            if (response.code && response.code === 3 /* TerminateResponseCode.ProcessNotFound */) {
                                this._notificationService.error(nls.localize('TerminateAction.noProcess', 'The launched process doesn\'t exist anymore. If the task spawned background tasks exiting VS Code might result in orphaned processes.'));
                            }
                            else {
                                this._notificationService.error(nls.localize('TerminateAction.failed', 'Failed to terminate running task'));
                            }
                        });
                    }
                });
            }
        }
        async _runRestartTaskCommand(arg) {
            const activeTasks = await this.getActiveTasks();
            if (activeTasks.length === 1) {
                this._restart(activeTasks[0]);
                return;
            }
            if (this.inTerminal()) {
                // try dispatching using task identifier
                const identifier = this._getTaskIdentifier(arg);
                if (identifier !== undefined) {
                    for (const task of activeTasks) {
                        if (task.matches(identifier)) {
                            this._restart(task);
                            return;
                        }
                    }
                }
                // show quick pick with active tasks
                const entry = await this._showQuickPick(activeTasks, nls.localize('TaskService.taskToRestart', 'Select the task to restart'), {
                    label: nls.localize('TaskService.noTaskToRestart', 'No task to restart'),
                    task: null
                }, false, true);
                if (entry && entry.task) {
                    this._restart(entry.task);
                }
            }
            else {
                if (activeTasks.length > 0) {
                    this._restart(activeTasks[0]);
                }
            }
        }
        _getTaskIdentifier(filter) {
            let result = undefined;
            if (Types.isString(filter)) {
                result = filter;
            }
            else if (filter && Types.isString(filter.type)) {
                result = tasks_1.TaskDefinition.createTaskIdentifier(filter, console);
            }
            return result;
        }
        _configHasTasks(taskConfig) {
            return !!taskConfig && !!taskConfig.tasks && taskConfig.tasks.length > 0;
        }
        _openTaskFile(resource, taskSource) {
            let configFileCreated = false;
            this._fileService.stat(resource).then((stat) => stat, () => undefined).then(async (stat) => {
                const fileExists = !!stat;
                const configValue = this._configurationService.inspect('tasks');
                let tasksExistInFile;
                let target;
                switch (taskSource) {
                    case tasks_1.TaskSourceKind.User:
                        tasksExistInFile = this._configHasTasks(configValue.userValue);
                        target = 2 /* ConfigurationTarget.USER */;
                        break;
                    case tasks_1.TaskSourceKind.WorkspaceFile:
                        tasksExistInFile = this._configHasTasks(configValue.workspaceValue);
                        target = 5 /* ConfigurationTarget.WORKSPACE */;
                        break;
                    default:
                        tasksExistInFile = this._configHasTasks(configValue.workspaceFolderValue);
                        target = 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
                let content;
                if (!tasksExistInFile) {
                    const pickTemplateResult = await this._quickInputService.pick((0, taskTemplates_1.getTemplates)(), { placeHolder: nls.localize('TaskService.template', 'Select a Task Template') });
                    if (!pickTemplateResult) {
                        return Promise.resolve(undefined);
                    }
                    content = pickTemplateResult.content;
                    const editorConfig = this._configurationService.getValue();
                    if (editorConfig.editor.insertSpaces) {
                        content = content.replace(/(\n)(\t+)/g, (_, s1, s2) => s1 + ' '.repeat(s2.length * editorConfig.editor.tabSize));
                    }
                    configFileCreated = true;
                }
                if (!fileExists && content) {
                    return this._textFileService.create([{ resource, value: content }]).then(result => {
                        return result[0].resource;
                    });
                }
                else if (fileExists && (tasksExistInFile || content)) {
                    if (content) {
                        this._configurationService.updateValue('tasks', json.parse(content), target);
                    }
                    return stat?.resource;
                }
                return undefined;
            }).then((resource) => {
                if (!resource) {
                    return;
                }
                this._editorService.openEditor({
                    resource,
                    options: {
                        pinned: configFileCreated // pin only if config file is created #8727
                    }
                });
            });
        }
        _isTaskEntry(value) {
            const candidate = value;
            return candidate && !!candidate.task;
        }
        _isSettingEntry(value) {
            const candidate = value;
            return candidate && !!candidate.settingType;
        }
        _configureTask(task) {
            if (tasks_1.ContributedTask.is(task)) {
                this.customize(task, undefined, true);
            }
            else if (tasks_1.CustomTask.is(task)) {
                this.openConfig(task);
            }
            else if (tasks_1.ConfiguringTask.is(task)) {
                // Do nothing.
            }
        }
        _handleSelection(selection) {
            if (!selection) {
                return;
            }
            if (this._isTaskEntry(selection)) {
                this._configureTask(selection.task);
            }
            else if (this._isSettingEntry(selection)) {
                const taskQuickPick = this._instantiationService.createInstance(taskQuickPick_1.TaskQuickPick);
                taskQuickPick.handleSettingOption(selection.settingType);
            }
            else if (selection.folder && (this._contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */)) {
                this._openTaskFile(selection.folder.toResource('.vscode/tasks.json'), tasks_1.TaskSourceKind.Workspace);
            }
            else {
                const resource = this._getResourceForKind(tasks_1.TaskSourceKind.User);
                if (resource) {
                    this._openTaskFile(resource, tasks_1.TaskSourceKind.User);
                }
            }
        }
        getTaskDescription(task) {
            let description;
            if (task._source.kind === tasks_1.TaskSourceKind.User) {
                description = nls.localize('taskQuickPick.userSettings', 'User');
            }
            else if (task._source.kind === tasks_1.TaskSourceKind.WorkspaceFile) {
                description = task.getWorkspaceFileName();
            }
            else if (this.needsFolderQualification()) {
                const workspaceFolder = task.getWorkspaceFolder();
                if (workspaceFolder) {
                    description = workspaceFolder.name;
                }
            }
            return description;
        }
        async _runConfigureTasks() {
            if (!(await this._trust())) {
                return;
            }
            let taskPromise;
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                taskPromise = this._getGroupedTasks();
            }
            else {
                taskPromise = Promise.resolve(new TaskMap());
            }
            const stats = this._contextService.getWorkspace().folders.map((folder) => {
                return this._fileService.stat(folder.toResource('.vscode/tasks.json')).then(stat => stat, () => undefined);
            });
            const createLabel = nls.localize('TaskService.createJsonFile', 'Create tasks.json file from template');
            const openLabel = nls.localize('TaskService.openJsonFile', 'Open tasks.json file');
            const tokenSource = new cancellation_1.CancellationTokenSource();
            const cancellationToken = tokenSource.token;
            const entries = Promise.all(stats).then((stats) => {
                return taskPromise.then((taskMap) => {
                    const entries = [];
                    let configuredCount = 0;
                    let tasks = taskMap.all();
                    if (tasks.length > 0) {
                        tasks = tasks.sort((a, b) => a._label.localeCompare(b._label));
                        for (const task of tasks) {
                            const entry = { label: taskQuickPick_1.TaskQuickPick.getTaskLabelWithIcon(task), task, description: this.getTaskDescription(task), detail: this._showDetail() ? task.configurationProperties.detail : undefined };
                            taskQuickPick_1.TaskQuickPick.applyColorStyles(task, entry, this._themeService);
                            entries.push(entry);
                            if (!tasks_1.ContributedTask.is(task)) {
                                configuredCount++;
                            }
                        }
                    }
                    const needsCreateOrOpen = (configuredCount === 0);
                    // If the only configured tasks are user tasks, then we should also show the option to create from a template.
                    if (needsCreateOrOpen || (taskMap.get(tasks_1.USER_TASKS_GROUP_KEY).length === configuredCount)) {
                        const label = stats[0] !== undefined ? openLabel : createLabel;
                        if (entries.length) {
                            entries.push({ type: 'separator' });
                        }
                        entries.push({ label, folder: this._contextService.getWorkspace().folders[0] });
                    }
                    if ((entries.length === 1) && !needsCreateOrOpen) {
                        tokenSource.cancel();
                    }
                    return entries;
                });
            });
            const timeout = await Promise.race([new Promise((resolve) => {
                    entries.then(() => resolve(false));
                }), new Promise((resolve) => {
                    const timer = setTimeout(() => {
                        clearTimeout(timer);
                        resolve(true);
                    }, 200);
                })]);
            if (!timeout && ((await entries).length === 1) && this._configurationService.getValue(taskQuickPick_1.QUICKOPEN_SKIP_CONFIG)) {
                const entry = ((await entries)[0]);
                if (entry.task) {
                    this._handleSelection(entry);
                    return;
                }
            }
            const entriesWithSettings = entries.then(resolvedEntries => {
                resolvedEntries.push(...taskQuickPick_1.TaskQuickPick.allSettingEntries(this._configurationService));
                return resolvedEntries;
            });
            this._quickInputService.pick(entriesWithSettings, { placeHolder: nls.localize('TaskService.pickTask', 'Select a task to configure') }, cancellationToken).
                then(async (selection) => {
                if (cancellationToken.isCancellationRequested) {
                    // canceled when there's only one task
                    const task = (await entries)[0];
                    if (task.task) {
                        selection = task;
                    }
                }
                this._handleSelection(selection);
            });
        }
        _runConfigureDefaultBuildTask() {
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this._runConfigureTasks();
                        return;
                    }
                    const entries = [];
                    let selectedTask;
                    let selectedEntry;
                    this._showIgnoredFoldersMessage().then(() => {
                        for (const task of tasks) {
                            const taskGroup = tasks_1.TaskGroup.from(task.configurationProperties.group);
                            if (taskGroup && taskGroup.isDefault && taskGroup._id === tasks_1.TaskGroup.Build._id) {
                                const label = nls.localize('TaskService.defaultBuildTaskExists', '{0} is already marked as the default build task', taskQuickPick_1.TaskQuickPick.getTaskLabelWithIcon(task, task.getQualifiedLabel()));
                                selectedTask = task;
                                selectedEntry = { label, task, description: this.getTaskDescription(task), detail: this._showDetail() ? task.configurationProperties.detail : undefined };
                                taskQuickPick_1.TaskQuickPick.applyColorStyles(task, selectedEntry, this._themeService);
                            }
                            else {
                                const entry = { label: taskQuickPick_1.TaskQuickPick.getTaskLabelWithIcon(task), task, description: this.getTaskDescription(task), detail: this._showDetail() ? task.configurationProperties.detail : undefined };
                                taskQuickPick_1.TaskQuickPick.applyColorStyles(task, entry, this._themeService);
                                entries.push(entry);
                            }
                        }
                        if (selectedEntry) {
                            entries.unshift(selectedEntry);
                        }
                        const tokenSource = new cancellation_1.CancellationTokenSource();
                        const cancellationToken = tokenSource.token;
                        this._quickInputService.pick(entries, { placeHolder: nls.localize('TaskService.pickTask', 'Select a task to configure') }, cancellationToken).
                            then(async (entry) => {
                            if (cancellationToken.isCancellationRequested) {
                                // canceled when there's only one task
                                const task = (await entries)[0];
                                if (task.task) {
                                    entry = task;
                                }
                            }
                            const task = entry && 'task' in entry ? entry.task : undefined;
                            if ((task === undefined) || (task === null)) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'build', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'build' }, false);
                                    }
                                });
                            }
                        });
                        this._quickInputService.pick(entries, {
                            placeHolder: nls.localize('TaskService.pickDefaultBuildTask', 'Select the task to be used as the default build task')
                        }).
                            then((entry) => {
                            const task = entry && 'task' in entry ? entry.task : undefined;
                            if ((task === undefined) || (task === null)) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'build', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'build' }, false);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this._runConfigureTasks();
            }
        }
        _runConfigureDefaultTestTask() {
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                this.tasks().then((tasks => {
                    if (tasks.length === 0) {
                        this._runConfigureTasks();
                        return;
                    }
                    let selectedTask;
                    let selectedEntry;
                    for (const task of tasks) {
                        const taskGroup = tasks_1.TaskGroup.from(task.configurationProperties.group);
                        if (taskGroup && taskGroup.isDefault && taskGroup._id === tasks_1.TaskGroup.Test._id) {
                            selectedTask = task;
                            break;
                        }
                    }
                    if (selectedTask) {
                        selectedEntry = {
                            label: nls.localize('TaskService.defaultTestTaskExists', '{0} is already marked as the default test task.', selectedTask.getQualifiedLabel()),
                            task: selectedTask,
                            detail: this._showDetail() ? selectedTask.configurationProperties.detail : undefined
                        };
                    }
                    this._showIgnoredFoldersMessage().then(() => {
                        this._showQuickPick(tasks, nls.localize('TaskService.pickDefaultTestTask', 'Select the task to be used as the default test task'), undefined, true, false, selectedEntry).then((entry) => {
                            const task = entry ? entry.task : undefined;
                            if (!task) {
                                return;
                            }
                            if (task === selectedTask && tasks_1.CustomTask.is(task)) {
                                this.openConfig(task);
                            }
                            if (!tasks_1.InMemoryTask.is(task)) {
                                this.customize(task, { group: { kind: 'test', isDefault: true } }, true).then(() => {
                                    if (selectedTask && (task !== selectedTask) && !tasks_1.InMemoryTask.is(selectedTask)) {
                                        this.customize(selectedTask, { group: 'test' }, false);
                                    }
                                });
                            }
                        });
                    });
                }));
            }
            else {
                this._runConfigureTasks();
            }
        }
        async runShowTasks() {
            const activeTasksPromise = this.getActiveTasks();
            const activeTasks = await activeTasksPromise;
            let group;
            if (activeTasks.length === 1) {
                this._taskSystem.revealTask(activeTasks[0]);
            }
            else if (activeTasks.length && activeTasks.every((task) => {
                if (tasks_1.InMemoryTask.is(task)) {
                    return false;
                }
                if (!group) {
                    group = task.command.presentation?.group;
                }
                return task.command.presentation?.group && (task.command.presentation.group === group);
            })) {
                this._taskSystem.revealTask(activeTasks[0]);
            }
            else {
                this._showQuickPick(activeTasksPromise, nls.localize('TaskService.pickShowTask', 'Select the task to show its output'), {
                    label: nls.localize('TaskService.noTaskIsRunning', 'No task is running'),
                    task: null
                }, false, true).then((entry) => {
                    const task = entry ? entry.task : undefined;
                    if (task === undefined || task === null) {
                        return;
                    }
                    this._taskSystem.revealTask(task);
                });
            }
        }
        async _createTasksDotOld(folder) {
            const tasksFile = folder.toResource('.vscode/tasks.json');
            if (await this._fileService.exists(tasksFile)) {
                const oldFile = tasksFile.with({ path: `${tasksFile.path}.old` });
                await this._fileService.copy(tasksFile, oldFile, true);
                return [oldFile, tasksFile];
            }
            return undefined;
        }
        _upgradeTask(task, suppressTaskName, globalConfig) {
            if (!tasks_1.CustomTask.is(task)) {
                return;
            }
            const configElement = {
                label: task._label
            };
            const oldTaskTypes = new Set(['gulp', 'jake', 'grunt']);
            if (Types.isString(task.command.name) && oldTaskTypes.has(task.command.name)) {
                configElement.type = task.command.name;
                configElement.task = task.command.args[0];
            }
            else {
                if (task.command.runtime === tasks_1.RuntimeType.Shell) {
                    configElement.type = tasks_1.RuntimeType.toString(tasks_1.RuntimeType.Shell);
                }
                if (task.command.name && !suppressTaskName && !globalConfig.windows?.command && !globalConfig.osx?.command && !globalConfig.linux?.command) {
                    configElement.command = task.command.name;
                }
                else if (suppressTaskName) {
                    configElement.command = task._source.config.element.command;
                }
                if (task.command.args && (!Array.isArray(task.command.args) || (task.command.args.length > 0))) {
                    if (!globalConfig.windows?.args && !globalConfig.osx?.args && !globalConfig.linux?.args) {
                        configElement.args = task.command.args;
                    }
                    else {
                        configElement.args = task._source.config.element.args;
                    }
                }
            }
            if (task.configurationProperties.presentation) {
                configElement.presentation = task.configurationProperties.presentation;
            }
            if (task.configurationProperties.isBackground) {
                configElement.isBackground = task.configurationProperties.isBackground;
            }
            if (task.configurationProperties.problemMatchers) {
                configElement.problemMatcher = task._source.config.element.problemMatcher;
            }
            if (task.configurationProperties.group) {
                configElement.group = task.configurationProperties.group;
            }
            task._source.config.element = configElement;
            const tempTask = new tasks_1.CustomTask(task._id, task._source, task._label, task.type, task.command, task.hasDefinedMatchers, task.runOptions, task.configurationProperties);
            const configTask = this._createCustomizableTask(tempTask);
            if (configTask) {
                return configTask;
            }
            return;
        }
        async _upgrade() {
            if (this.schemaVersion === 2 /* JsonSchemaVersion.V2_0_0 */) {
                return;
            }
            if (!this._workspaceTrustManagementService.isWorkspaceTrusted()) {
                this._register(event_1.Event.once(this._workspaceTrustManagementService.onDidChangeTrust)(isTrusted => {
                    if (isTrusted) {
                        this._upgrade();
                    }
                }));
                return;
            }
            const tasks = await this._getGroupedTasks();
            const fileDiffs = [];
            for (const folder of this.workspaceFolders) {
                const diff = await this._createTasksDotOld(folder);
                if (diff) {
                    fileDiffs.push(diff);
                }
                if (!diff) {
                    continue;
                }
                const configTasks = [];
                const suppressTaskName = !!this._configurationService.getValue("tasks.suppressTaskName" /* TasksSchemaProperties.SuppressTaskName */, { resource: folder.uri });
                const globalConfig = {
                    windows: this._configurationService.getValue("tasks.windows" /* TasksSchemaProperties.Windows */, { resource: folder.uri }),
                    osx: this._configurationService.getValue("tasks.osx" /* TasksSchemaProperties.Osx */, { resource: folder.uri }),
                    linux: this._configurationService.getValue("tasks.linux" /* TasksSchemaProperties.Linux */, { resource: folder.uri })
                };
                tasks.get(folder).forEach(task => {
                    const configTask = this._upgradeTask(task, suppressTaskName, globalConfig);
                    if (configTask) {
                        configTasks.push(configTask);
                    }
                });
                this._taskSystem = undefined;
                this._workspaceTasksPromise = undefined;
                await this._writeConfiguration(folder, 'tasks.tasks', configTasks);
                await this._writeConfiguration(folder, 'tasks.version', '2.0.0');
                if (this._configurationService.getValue("tasks.showOutput" /* TasksSchemaProperties.ShowOutput */, { resource: folder.uri })) {
                    await this._configurationService.updateValue("tasks.showOutput" /* TasksSchemaProperties.ShowOutput */, undefined, { resource: folder.uri });
                }
                if (this._configurationService.getValue("tasks.isShellCommand" /* TasksSchemaProperties.IsShellCommand */, { resource: folder.uri })) {
                    await this._configurationService.updateValue("tasks.isShellCommand" /* TasksSchemaProperties.IsShellCommand */, undefined, { resource: folder.uri });
                }
                if (this._configurationService.getValue("tasks.suppressTaskName" /* TasksSchemaProperties.SuppressTaskName */, { resource: folder.uri })) {
                    await this._configurationService.updateValue("tasks.suppressTaskName" /* TasksSchemaProperties.SuppressTaskName */, undefined, { resource: folder.uri });
                }
            }
            this._updateSetup();
            this._notificationService.prompt(severity_1.default.Warning, fileDiffs.length === 1 ?
                nls.localize('taskService.upgradeVersion', "The deprecated tasks version 0.1.0 has been removed. Your tasks have been upgraded to version 2.0.0. Open the diff to review the upgrade.")
                : nls.localize('taskService.upgradeVersionPlural', "The deprecated tasks version 0.1.0 has been removed. Your tasks have been upgraded to version 2.0.0. Open the diffs to review the upgrade."), [{
                    label: fileDiffs.length === 1 ? nls.localize('taskService.openDiff', "Open diff") : nls.localize('taskService.openDiffs', "Open diffs"),
                    run: async () => {
                        for (const upgrade of fileDiffs) {
                            await this._editorService.openEditor({
                                original: { resource: upgrade[0] },
                                modified: { resource: upgrade[1] }
                            });
                        }
                    }
                }]);
        }
    };
    exports.AbstractTaskService = AbstractTaskService;
    exports.AbstractTaskService = AbstractTaskService = AbstractTaskService_1 = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, markers_1.IMarkerService),
        __param(2, output_1.IOutputService),
        __param(3, panecomposite_1.IPaneCompositePartService),
        __param(4, viewsService_1.IViewsService),
        __param(5, commands_1.ICommandService),
        __param(6, editorService_1.IEditorService),
        __param(7, files_1.IFileService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, model_1.IModelService),
        __param(12, extensions_1.IExtensionService),
        __param(13, quickInput_1.IQuickInputService),
        __param(14, configurationResolver_1.IConfigurationResolverService),
        __param(15, terminal_1.ITerminalService),
        __param(16, terminal_1.ITerminalGroupService),
        __param(17, storage_1.IStorageService),
        __param(18, progress_1.IProgressService),
        __param(19, opener_1.IOpenerService),
        __param(20, dialogs_1.IDialogService),
        __param(21, notification_1.INotificationService),
        __param(22, contextkey_1.IContextKeyService),
        __param(23, environmentService_1.IWorkbenchEnvironmentService),
        __param(24, terminal_2.ITerminalProfileResolverService),
        __param(25, pathService_1.IPathService),
        __param(26, resolverService_1.ITextModelService),
        __param(27, preferences_1.IPreferencesService),
        __param(28, views_1.IViewDescriptorService),
        __param(29, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(30, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(31, log_1.ILogService),
        __param(32, themeService_1.IThemeService),
        __param(33, lifecycle_2.ILifecycleService),
        __param(34, remoteAgentService_1.IRemoteAgentService),
        __param(35, instantiation_1.IInstantiationService)
    ], AbstractTaskService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RUYXNrU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvYnJvd3Nlci9hYnN0cmFjdFRhc2tTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtRmhHLE1BQU0sOEJBQThCLEdBQUcsd0JBQXdCLENBQUM7SUFDaEUsTUFBTSw0QkFBNEIsR0FBRyxrQ0FBa0MsQ0FBQztJQUN4RSxNQUFNLGVBQWUsR0FBRyx3QkFBd0IsQ0FBQztJQUVqRCxJQUFpQixtQkFBbUIsQ0FHbkM7SUFIRCxXQUFpQixtQkFBbUI7UUFDdEIsc0JBQUUsR0FBRyw0Q0FBNEMsQ0FBQztRQUNsRCx3QkFBSSxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsaUNBQWlDLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUN4RixDQUFDLEVBSGdCLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBR25DO0lBSUQsTUFBTSxlQUFlO1FBSXBCLFlBQW9CLGNBQThCO1lBQTlCLG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUNqRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSwwQkFBZ0IsRUFBRSxDQUFDO1FBQ2pELENBQUM7UUFFTSxJQUFJLENBQUMsT0FBZTtZQUMxQixJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSywrQkFBdUIsQ0FBQztZQUNwRCxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVNLElBQUksQ0FBQyxPQUFlO1lBQzFCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLGtDQUEwQixDQUFDO1lBQ3ZELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJ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