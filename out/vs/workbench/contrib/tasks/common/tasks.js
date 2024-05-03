/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/base/common/objects", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry"], function (require, exports, nls, Types, resources, Objects, contextkey_1, taskDefinitionRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskDefinition = exports.TasksSchemaProperties = exports.TaskSettingId = exports.KeyedTaskIdentifier = exports.TaskEvent = exports.TaskRunSource = exports.TaskRunType = exports.TaskEventKind = exports.TaskSorter = exports.JsonSchemaVersion = exports.ExecutionEngine = exports.InMemoryTask = exports.ContributedTask = exports.ConfiguringTask = exports.CustomTask = exports.CommonTask = exports.RunOptions = exports.RunOnOptions = exports.DependsOrder = exports.TaskSourceKind = exports.TaskScope = exports.TaskGroup = exports.CommandString = exports.RuntimeType = exports.PresentationOptions = exports.PanelKind = exports.RevealProblemKind = exports.RevealKind = exports.CommandOptions = exports.CUSTOMIZED_TASK_TYPE = exports.ShellQuoting = exports.TASKS_CATEGORY = exports.TASK_RUNNING_STATE = exports.USER_TASKS_GROUP_KEY = void 0;
    exports.USER_TASKS_GROUP_KEY = 'settings';
    exports.TASK_RUNNING_STATE = new contextkey_1.RawContextKey('taskRunning', false, nls.localize('tasks.taskRunningContext', "Whether a task is currently running."));
    exports.TASKS_CATEGORY = nls.localize2('tasksCategory', "Tasks");
    var ShellQuoting;
    (function (ShellQuoting) {
        /**
         * Use character escaping.
         */
        ShellQuoting[ShellQuoting["Escape"] = 1] = "Escape";
        /**
         * Use strong quoting
         */
        ShellQuoting[ShellQuoting["Strong"] = 2] = "Strong";
        /**
         * Use weak quoting.
         */
        ShellQuoting[ShellQuoting["Weak"] = 3] = "Weak";
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    exports.CUSTOMIZED_TASK_TYPE = '$customized';
    (function (ShellQuoting) {
        function from(value) {
            if (!value) {
                return ShellQuoting.Strong;
            }
            switch (value.toLowerCase()) {
                case 'escape':
                    return ShellQuoting.Escape;
                case 'strong':
                    return ShellQuoting.Strong;
                case 'weak':
                    return ShellQuoting.Weak;
                default:
                    return ShellQuoting.Strong;
            }
        }
        ShellQuoting.from = from;
    })(ShellQuoting || (exports.ShellQuoting = ShellQuoting = {}));
    var CommandOptions;
    (function (CommandOptions) {
        CommandOptions.defaults = { cwd: '${workspaceFolder}' };
    })(CommandOptions || (exports.CommandOptions = CommandOptions = {}));
    var RevealKind;
    (function (RevealKind) {
        /**
         * Always brings the terminal to front if the task is executed.
         */
        RevealKind[RevealKind["Always"] = 1] = "Always";
        /**
         * Only brings the terminal to front if a problem is detected executing the task
         * e.g. the task couldn't be started,
         * the task ended with an exit code other than zero,
         * or the problem matcher found an error.
         */
        RevealKind[RevealKind["Silent"] = 2] = "Silent";
        /**
         * The terminal never comes to front when the task is executed.
         */
        RevealKind[RevealKind["Never"] = 3] = "Never";
    })(RevealKind || (exports.RevealKind = RevealKind = {}));
    (function (RevealKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'always':
                    return RevealKind.Always;
                case 'silent':
                    return RevealKind.Silent;
                case 'never':
                    return RevealKind.Never;
                default:
                    return RevealKind.Always;
            }
        }
        RevealKind.fromString = fromString;
    })(RevealKind || (exports.RevealKind = RevealKind = {}));
    var RevealProblemKind;
    (function (RevealProblemKind) {
        /**
         * Never reveals the problems panel when this task is executed.
         */
        RevealProblemKind[RevealProblemKind["Never"] = 1] = "Never";
        /**
         * Only reveals the problems panel if a problem is found.
         */
        RevealProblemKind[RevealProblemKind["OnProblem"] = 2] = "OnProblem";
        /**
         * Never reveals the problems panel when this task is executed.
         */
        RevealProblemKind[RevealProblemKind["Always"] = 3] = "Always";
    })(RevealProblemKind || (exports.RevealProblemKind = RevealProblemKind = {}));
    (function (RevealProblemKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'always':
                    return RevealProblemKind.Always;
                case 'never':
                    return RevealProblemKind.Never;
                case 'onproblem':
                    return RevealProblemKind.OnProblem;
                default:
                    return RevealProblemKind.OnProblem;
            }
        }
        RevealProblemKind.fromString = fromString;
    })(RevealProblemKind || (exports.RevealProblemKind = RevealProblemKind = {}));
    var PanelKind;
    (function (PanelKind) {
        /**
         * Shares a panel with other tasks. This is the default.
         */
        PanelKind[PanelKind["Shared"] = 1] = "Shared";
        /**
         * Uses a dedicated panel for this tasks. The panel is not
         * shared with other tasks.
         */
        PanelKind[PanelKind["Dedicated"] = 2] = "Dedicated";
        /**
         * Creates a new panel whenever this task is executed.
         */
        PanelKind[PanelKind["New"] = 3] = "New";
    })(PanelKind || (exports.PanelKind = PanelKind = {}));
    (function (PanelKind) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'shared':
                    return PanelKind.Shared;
                case 'dedicated':
                    return PanelKind.Dedicated;
                case 'new':
                    return PanelKind.New;
                default:
                    return PanelKind.Shared;
            }
        }
        PanelKind.fromString = fromString;
    })(PanelKind || (exports.PanelKind = PanelKind = {}));
    var PresentationOptions;
    (function (PresentationOptions) {
        PresentationOptions.defaults = {
            echo: true, reveal: RevealKind.Always, revealProblems: RevealProblemKind.Never, focus: false, panel: PanelKind.Shared, showReuseMessage: true, clear: false
        };
    })(PresentationOptions || (exports.PresentationOptions = PresentationOptions = {}));
    var RuntimeType;
    (function (RuntimeType) {
        RuntimeType[RuntimeType["Shell"] = 1] = "Shell";
        RuntimeType[RuntimeType["Process"] = 2] = "Process";
        RuntimeType[RuntimeType["CustomExecution"] = 3] = "CustomExecution";
    })(RuntimeType || (exports.RuntimeType = RuntimeType = {}));
    (function (RuntimeType) {
        function fromString(value) {
            switch (value.toLowerCase()) {
                case 'shell':
                    return RuntimeType.Shell;
                case 'process':
                    return RuntimeType.Process;
                case 'customExecution':
                    return RuntimeType.CustomExecution;
                default:
                    return RuntimeType.Process;
            }
        }
        RuntimeType.fromString = fromString;
        function toString(value) {
            switch (value) {
                case RuntimeType.Shell: return 'shell';
                case RuntimeType.Process: return 'process';
                case RuntimeType.CustomExecution: return 'customExecution';
                default: return 'process';
            }
        }
        RuntimeType.toString = toString;
    })(RuntimeType || (exports.RuntimeType = RuntimeType = {}));
    var CommandString;
    (function (CommandString) {
        function value(value) {
            if (Types.isString(value)) {
                return value;
            }
            else {
                return value.value;
            }
        }
        CommandString.value = value;
    })(CommandString || (exports.CommandString = CommandString = {}));
    var TaskGroup;
    (function (TaskGroup) {
        TaskGroup.Clean = { _id: 'clean', isDefault: false };
        TaskGroup.Build = { _id: 'build', isDefault: false };
        TaskGroup.Rebuild = { _id: 'rebuild', isDefault: false };
        TaskGroup.Test = { _id: 'test', isDefault: false };
        function is(value) {
            return value === TaskGroup.Clean._id || value === TaskGroup.Build._id || value === TaskGroup.Rebuild._id || value === TaskGroup.Test._id;
        }
        TaskGroup.is = is;
        function from(value) {
            if (value === undefined) {
                return undefined;
            }
            else if (Types.isString(value)) {
                if (is(value)) {
                    return { _id: value, isDefault: false };
                }
                return undefined;
            }
            else {
                return value;
            }
        }
        TaskGroup.from = from;
    })(TaskGroup || (exports.TaskGroup = TaskGroup = {}));
    var TaskScope;
    (function (TaskScope) {
        TaskScope[TaskScope["Global"] = 1] = "Global";
        TaskScope[TaskScope["Workspace"] = 2] = "Workspace";
        TaskScope[TaskScope["Folder"] = 3] = "Folder";
    })(TaskScope || (exports.TaskScope = TaskScope = {}));
    var TaskSourceKind;
    (function (TaskSourceKind) {
        TaskSourceKind.Workspace = 'workspace';
        TaskSourceKind.Extension = 'extension';
        TaskSourceKind.InMemory = 'inMemory';
        TaskSourceKind.WorkspaceFile = 'workspaceFile';
        TaskSourceKind.User = 'user';
        function toConfigurationTarget(kind) {
            switch (kind) {
                case TaskSourceKind.User: return 2 /* ConfigurationTarget.USER */;
                case TaskSourceKind.WorkspaceFile: return 5 /* ConfigurationTarget.WORKSPACE */;
                default: return 6 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
        }
        TaskSourceKind.toConfigurationTarget = toConfigurationTarget;
    })(TaskSourceKind || (exports.TaskSourceKind = TaskSourceKind = {}));
    var DependsOrder;
    (function (DependsOrder) {
        DependsOrder["parallel"] = "parallel";
        DependsOrder["sequence"] = "sequence";
    })(DependsOrder || (exports.DependsOrder = DependsOrder = {}));
    var RunOnOptions;
    (function (RunOnOptions) {
        RunOnOptions[RunOnOptions["default"] = 1] = "default";
        RunOnOptions[RunOnOptions["folderOpen"] = 2] = "folderOpen";
    })(RunOnOptions || (exports.RunOnOptions = RunOnOptions = {}));
    var RunOptions;
    (function (RunOptions) {
        RunOptions.defaults = { reevaluateOnRerun: true, runOn: RunOnOptions.default, instanceLimit: 1 };
    })(RunOptions || (exports.RunOptions = RunOptions = {}));
    class CommonTask {
        constructor(id, label, type, runOptions, configurationProperties, source) {
            /**
             * The cached label.
             */
            this._label = '';
            this._id = id;
            if (label) {
                this._label = label;
            }
            if (type) {
                this.type = type;
            }
            this.runOptions = runOptions;
            this.configurationProperties = configurationProperties;
            this._source = source;
        }
        getDefinition(useSource) {
            return undefined;
        }
        getMapKey() {
            return this._id;
        }
        getKey() {
            return undefined;
        }
        getCommonTaskId() {
            const key = { folder: this.getFolderId(), id: this._id };
            return JSON.stringify(key);
        }
        clone() {
            return this.fromObject(Object.assign({}, this));
        }
        getWorkspaceFolder() {
            return undefined;
        }
        getWorkspaceFileName() {
            return undefined;
        }
        getTelemetryKind() {
            return 'unknown';
        }
        matches(key, compareId = false) {
            if (key === undefined) {
                return false;
            }
            if (Types.isString(key)) {
                return key === this._label || key === this.configurationProperties.identifier || (compareId && key === this._id);
            }
            const identifier = this.getDefinition(true);
            return identifier !== undefined && identifier._key === key._key;
        }
        getQualifiedLabel() {
            const workspaceFolder = this.getWorkspaceFolder();
            if (workspaceFolder) {
                return `${this._label} (${workspaceFolder.name})`;
            }
            else {
                return this._label;
            }
        }
        getTaskExecution() {
            const result = {
                id: this._id,
                task: this
            };
            return result;
        }
        addTaskLoadMessages(messages) {
            if (this._taskLoadMessages === undefined) {
                this._taskLoadMessages = [];
            }
            if (messages) {
                this._taskLoadMessages = this._taskLoadMessages.concat(messages);
            }
        }
        get taskLoadMessages() {
            return this._taskLoadMessages;
        }
    }
    exports.CommonTask = CommonTask;
    /**
     * For tasks of type shell or process, this is created upon parse
     * of the tasks.json or workspace file.
     * For ContributedTasks of all other types, this is the result of
     * resolving a ConfiguringTask.
     */
    class CustomTask extends CommonTask {
        constructor(id, source, label, type, command, hasDefinedMatchers, runOptions, configurationProperties) {
            super(id, label, undefined, runOptions, configurationProperties, source);
            /**
             * The command configuration
             */
            this.command = {};
            this._source = source;
            this.hasDefinedMatchers = hasDefinedMatchers;
            if (command) {
                this.command = command;
            }
        }
        clone() {
            return new CustomTask(this._id, this._source, this._label, this.type, this.command, this.hasDefinedMatchers, this.runOptions, this.configurationProperties);
        }
        customizes() {
            if (this._source && this._source.customizes) {
                return this._source.customizes;
            }
            return undefined;
        }
        getDefinition(useSource = false) {
            if (useSource && this._source.customizes !== undefined) {
                return this._source.customizes;
            }
            else {
                let type;
                const commandRuntime = this.command ? this.command.runtime : undefined;
                switch (commandRuntime) {
                    case RuntimeType.Shell:
                        type = 'shell';
                        break;
                    case RuntimeType.Process:
                        type = 'process';
                        break;
                    case RuntimeType.CustomExecution:
                        type = 'customExecution';
                        break;
                    case undefined:
                        type = '$composite';
                        break;
                    default:
                        throw new Error('Unexpected task runtime');
                }
                const result = {
                    type,
                    _key: this._id,
                    id: this._id
                };
                return result;
            }
        }
        static is(value) {
            return value instanceof CustomTask;
        }
        getMapKey() {
            const workspaceFolder = this._source.config.workspaceFolder;
            return workspaceFolder ? `${workspaceFolder.uri.toString()}|${this._id}|${this.instance}` : `${this._id}|${this.instance}`;
        }
        getFolderId() {
            return this._source.kind === TaskSourceKind.User ? exports.USER_TASKS_GROUP_KEY : this._source.config.workspaceFolder?.uri.toString();
        }
        getCommonTaskId() {
            return this._source.customizes ? super.getCommonTaskId() : (this.getKey() ?? super.getCommonTaskId());
        }
        /**
         * @returns A key representing the task
         */
        getKey() {
            const workspaceFolder = this.getFolderId();
            if (!workspaceFolder) {
                return undefined;
            }
            let id = this.configurationProperties.identifier;
            if (this._source.kind !== TaskSourceKind.Workspace) {
                id += this._source.kind;
            }
            const key = { type: exports.CUSTOMIZED_TASK_TYPE, folder: workspaceFolder, id };
            return JSON.stringify(key);
        }
        getWorkspaceFolder() {
            return this._source.config.workspaceFolder;
        }
        getWorkspaceFileName() {
            return (this._source.config.workspace && this._source.config.workspace.configuration) ? resources.basename(this._source.config.workspace.configuration) : undefined;
        }
        getTelemetryKind() {
            if (this._source.customizes) {
                return 'workspace>extension';
            }
            else {
                return 'workspace';
            }
        }
        fromObject(object) {
            return new CustomTask(object._id, object._source, object._label, object.type, object.command, object.hasDefinedMatchers, object.runOptions, object.configurationProperties);
        }
    }
    exports.CustomTask = CustomTask;
    /**
     * After a contributed task has been parsed, but before
     * the task has been resolved via the extension, its properties
     * are stored in this
     */
    class ConfiguringTask extends CommonTask {
        constructor(id, source, label, type, configures, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this._source = source;
            this.configures = configures;
        }
        static is(value) {
            return value instanceof ConfiguringTask;
        }
        fromObject(object) {
            return object;
        }
        getDefinition() {
            return this.configures;
        }
        getWorkspaceFileName() {
            return (this._source.config.workspace && this._source.config.workspace.configuration) ? resources.basename(this._source.config.workspace.configuration) : undefined;
        }
        getWorkspaceFolder() {
            return this._source.config.workspaceFolder;
        }
        getFolderId() {
            return this._source.kind === TaskSourceKind.User ? exports.USER_TASKS_GROUP_KEY : this._source.config.workspaceFolder?.uri.toString();
        }
        getKey() {
            const workspaceFolder = this.getFolderId();
            if (!workspaceFolder) {
                return undefined;
            }
            let id = this.configurationProperties.identifier;
            if (this._source.kind !== TaskSourceKind.Workspace) {
                id += this._source.kind;
            }
            const key = { type: exports.CUSTOMIZED_TASK_TYPE, folder: workspaceFolder, id };
            return JSON.stringify(key);
        }
    }
    exports.ConfiguringTask = ConfiguringTask;
    /**
     * A task from an extension created via resolveTask or provideTask
     */
    class ContributedTask extends CommonTask {
        constructor(id, source, label, type, defines, command, hasDefinedMatchers, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this.defines = defines;
            this.hasDefinedMatchers = hasDefinedMatchers;
            this.command = command;
            this.icon = configurationProperties.icon;
            this.hide = configurationProperties.hide;
        }
        clone() {
            return new ContributedTask(this._id, this._source, this._label, this.type, this.defines, this.command, this.hasDefinedMatchers, this.runOptions, this.configurationProperties);
        }
        getDefinition() {
            return this.defines;
        }
        static is(value) {
            return value instanceof ContributedTask;
        }
        getMapKey() {
            const workspaceFolder = this._source.workspaceFolder;
            return workspaceFolder
                ? `${this._source.scope.toString()}|${workspaceFolder.uri.toString()}|${this._id}|${this.instance}`
                : `${this._source.scope.toString()}|${this._id}|${this.instance}`;
        }
        getFolderId() {
            if (this._source.scope === 3 /* TaskScope.Folder */ && this._source.workspaceFolder) {
                return this._source.workspaceFolder.uri.toString();
            }
            return undefined;
        }
        getKey() {
            const key = { type: 'contributed', scope: this._source.scope, id: this._id };
            key.folder = this.getFolderId();
            return JSON.stringify(key);
        }
        getWorkspaceFolder() {
            return this._source.workspaceFolder;
        }
        getTelemetryKind() {
            return 'extension';
        }
        fromObject(object) {
            return new ContributedTask(object._id, object._source, object._label, object.type, object.defines, object.command, object.hasDefinedMatchers, object.runOptions, object.configurationProperties);
        }
    }
    exports.ContributedTask = ContributedTask;
    class InMemoryTask extends CommonTask {
        constructor(id, source, label, type, runOptions, configurationProperties) {
            super(id, label, type, runOptions, configurationProperties, source);
            this._source = source;
        }
        clone() {
            return new InMemoryTask(this._id, this._source, this._label, this.type, this.runOptions, this.configurationProperties);
        }
        static is(value) {
            return value instanceof InMemoryTask;
        }
        getTelemetryKind() {
            return 'composite';
        }
        getMapKey() {
            return `${this._id}|${this.instance}`;
        }
        getFolderId() {
            return undefined;
        }
        fromObject(object) {
            return new InMemoryTask(object._id, object._source, object._label, object.type, object.runOptions, object.configurationProperties);
        }
    }
    exports.InMemoryTask = InMemoryTask;
    var ExecutionEngine;
    (function (ExecutionEngine) {
        ExecutionEngine[ExecutionEngine["Process"] = 1] = "Process";
        ExecutionEngine[ExecutionEngine["Terminal"] = 2] = "Terminal";
    })(ExecutionEngine || (exports.ExecutionEngine = ExecutionEngine = {}));
    (function (ExecutionEngine) {
        ExecutionEngine._default = ExecutionEngine.Terminal;
    })(ExecutionEngine || (exports.ExecutionEngine = ExecutionEngine = {}));
    var JsonSchemaVersion;
    (function (JsonSchemaVersion) {
        JsonSchemaVersion[JsonSchemaVersion["V0_1_0"] = 1] = "V0_1_0";
        JsonSchemaVersion[JsonSchemaVersion["V2_0_0"] = 2] = "V2_0_0";
    })(JsonSchemaVersion || (exports.JsonSchemaVersion = JsonSchemaVersion = {}));
    class TaskSorter {
        constructor(workspaceFolders) {
            this._order = new Map();
            for (let i = 0; i < workspaceFolders.length; i++) {
                this._order.set(workspaceFolders[i].uri.toString(), i);
            }
        }
        compare(a, b) {
            const aw = a.getWorkspaceFolder();
            const bw = b.getWorkspaceFolder();
            if (aw && bw) {
                let ai = this._order.get(aw.uri.toString());
                ai = ai === undefined ? 0 : ai + 1;
                let bi = this._order.get(bw.uri.toString());
                bi = bi === undefined ? 0 : bi + 1;
                if (ai === bi) {
                    return a._label.localeCompare(b._label);
                }
                else {
                    return ai - bi;
                }
            }
            else if (!aw && bw) {
                return -1;
            }
            else if (aw && !bw) {
                return +1;
            }
            else {
                return 0;
            }
        }
    }
    exports.TaskSorter = TaskSorter;
    var TaskEventKind;
    (function (TaskEventKind) {
        TaskEventKind["DependsOnStarted"] = "dependsOnStarted";
        TaskEventKind["AcquiredInput"] = "acquiredInput";
        TaskEventKind["Start"] = "start";
        TaskEventKind["ProcessStarted"] = "processStarted";
        TaskEventKind["Active"] = "active";
        TaskEventKind["Inactive"] = "inactive";
        TaskEventKind["Changed"] = "changed";
        TaskEventKind["Terminated"] = "terminated";
        TaskEventKind["ProcessEnded"] = "processEnded";
        TaskEventKind["End"] = "end";
    })(TaskEventKind || (exports.TaskEventKind = TaskEventKind = {}));
    var TaskRunType;
    (function (TaskRunType) {
        TaskRunType["SingleRun"] = "singleRun";
        TaskRunType["Background"] = "background";
    })(TaskRunType || (exports.TaskRunType = TaskRunType = {}));
    var TaskRunSource;
    (function (TaskRunSource) {
        TaskRunSource[TaskRunSource["System"] = 0] = "System";
        TaskRunSource[TaskRunSource["User"] = 1] = "User";
        TaskRunSource[TaskRunSource["FolderOpen"] = 2] = "FolderOpen";
        TaskRunSource[TaskRunSource["ConfigurationChange"] = 3] = "ConfigurationChange";
        TaskRunSource[TaskRunSource["Reconnect"] = 4] = "Reconnect";
    })(TaskRunSource || (exports.TaskRunSource = TaskRunSource = {}));
    var TaskEvent;
    (function (TaskEvent) {
        function common(task) {
            return {
                taskId: task._id,
                taskName: task.configurationProperties.name,
                runType: task.configurationProperties.isBackground ? "background" /* TaskRunType.Background */ : "singleRun" /* TaskRunType.SingleRun */,
                group: task.configurationProperties.group,
                __task: task,
            };
        }
        function start(task, terminalId, resolvedVariables) {
            return {
                ...common(task),
                kind: "start" /* TaskEventKind.Start */,
                terminalId,
                resolvedVariables,
            };
        }
        TaskEvent.start = start;
        function processStarted(task, terminalId, processId) {
            return {
                ...common(task),
                kind: "processStarted" /* TaskEventKind.ProcessStarted */,
                terminalId,
                processId,
            };
        }
        TaskEvent.processStarted = processStarted;
        function processEnded(task, terminalId, exitCode) {
            return {
                ...common(task),
                kind: "processEnded" /* TaskEventKind.ProcessEnded */,
                terminalId,
                exitCode,
            };
        }
        TaskEvent.processEnded = processEnded;
        function terminated(task, terminalId, exitReason) {
            return {
                ...common(task),
                kind: "terminated" /* TaskEventKind.Terminated */,
                exitReason,
                terminalId,
            };
        }
        TaskEvent.terminated = terminated;
        function general(kind, task, terminalId) {
            return {
                ...common(task),
                kind,
                terminalId,
            };
        }
        TaskEvent.general = general;
        function changed() {
            return { kind: "changed" /* TaskEventKind.Changed */ };
        }
        TaskEvent.changed = changed;
    })(TaskEvent || (exports.TaskEvent = TaskEvent = {}));
    var KeyedTaskIdentifier;
    (function (KeyedTaskIdentifier) {
        function sortedStringify(literal) {
            const keys = Object.keys(literal).sort();
            let result = '';
            for (const key of keys) {
                let stringified = literal[key];
                if (stringified instanceof Object) {
                    stringified = sortedStringify(stringified);
                }
                else if (typeof stringified === 'string') {
                    stringified = stringified.replace(/,/g, ',,');
                }
                result += key + ',' + stringified + ',';
            }
            return result;
        }
        function create(value) {
            const resultKey = sortedStringify(value);
            const result = { _key: resultKey, type: value.taskType };
            Object.assign(result, value);
            return result;
        }
        KeyedTaskIdentifier.create = create;
    })(KeyedTaskIdentifier || (exports.KeyedTaskIdentifier = KeyedTaskIdentifier = {}));
    var TaskSettingId;
    (function (TaskSettingId) {
        TaskSettingId["AutoDetect"] = "task.autoDetect";
        TaskSettingId["SaveBeforeRun"] = "task.saveBeforeRun";
        TaskSettingId["ShowDecorations"] = "task.showDecorations";
        TaskSettingId["ProblemMatchersNeverPrompt"] = "task.problemMatchers.neverPrompt";
        TaskSettingId["SlowProviderWarning"] = "task.slowProviderWarning";
        TaskSettingId["QuickOpenHistory"] = "task.quickOpen.history";
        TaskSettingId["QuickOpenDetail"] = "task.quickOpen.detail";
        TaskSettingId["QuickOpenSkip"] = "task.quickOpen.skip";
        TaskSettingId["QuickOpenShowAll"] = "task.quickOpen.showAll";
        TaskSettingId["AllowAutomaticTasks"] = "task.allowAutomaticTasks";
        TaskSettingId["Reconnection"] = "task.reconnection";
        TaskSettingId["VerboseLogging"] = "task.verboseLogging";
    })(TaskSettingId || (exports.TaskSettingId = TaskSettingId = {}));
    var TasksSchemaProperties;
    (function (TasksSchemaProperties) {
        TasksSchemaProperties["Tasks"] = "tasks";
        TasksSchemaProperties["SuppressTaskName"] = "tasks.suppressTaskName";
        TasksSchemaProperties["Windows"] = "tasks.windows";
        TasksSchemaProperties["Osx"] = "tasks.osx";
        TasksSchemaProperties["Linux"] = "tasks.linux";
        TasksSchemaProperties["ShowOutput"] = "tasks.showOutput";
        TasksSchemaProperties["IsShellCommand"] = "tasks.isShellCommand";
        TasksSchemaProperties["ServiceTestSetting"] = "tasks.service.testSetting";
    })(TasksSchemaProperties || (exports.TasksSchemaProperties = TasksSchemaProperties = {}));
    var TaskDefinition;
    (function (TaskDefinition) {
        function createTaskIdentifier(external, reporter) {
            const definition = taskDefinitionRegistry_1.TaskDefinitionRegistry.get(external.type);
            if (definition === undefined) {
                // We have no task definition so we can't sanitize the literal. Take it as is
                const copy = Objects.deepClone(external);
                delete copy._key;
                return KeyedTaskIdentifier.create(copy);
            }
            const literal = Object.create(null);
            literal.type = definition.taskType;
            const required = new Set();
            definition.required.forEach(element => required.add(element));
            const properties = definition.properties;
            for (const property of Object.keys(properties)) {
                const value = external[property];
                if (value !== undefined && value !== null) {
                    literal[property] = value;
                }
                else if (required.has(property)) {
                    const schema = properties[property];
                    if (schema.default !== undefined) {
                        literal[property] = Objects.deepClone(schema.default);
                    }
                    else {
                        switch (schema.type) {
                            case 'boolean':
                                literal[property] = false;
                                break;
                            case 'number':
                            case 'integer':
                                literal[property] = 0;
                                break;
                            case 'string':
                                literal[property] = '';
                                break;
                            default:
                                reporter.error(nls.localize('TaskDefinition.missingRequiredProperty', 'Error: the task identifier \'{0}\' is missing the required property \'{1}\'. The task identifier will be ignored.', JSON.stringify(external, undefined, 0), property));
                                return undefined;
                        }
                    }
                }
            }
            return KeyedTaskIdentifier.create(literal);
        }
        TaskDefinition.createTaskIdentifier = createTaskIdentifier;
    })(TaskDefinition || (exports.TaskDefinition = TaskDefinition = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2NvbW1vbi90YXNrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtQm5GLFFBQUEsb0JBQW9CLEdBQUcsVUFBVSxDQUFDO0lBRWxDLFFBQUEsa0JBQWtCLEdBQUcsSUFBSSwwQkFBYSxDQUFVLGFBQWEsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxzQ0FBc0MsQ0FBQyxDQUFDLENBQUM7SUFDeEosUUFBQSxjQUFjLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFdEUsSUFBWSxZQWVYO0lBZkQsV0FBWSxZQUFZO1FBQ3ZCOztXQUVHO1FBQ0gsbURBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gsbURBQVUsQ0FBQTtRQUVWOztXQUVHO1FBQ0gsK0NBQVEsQ0FBQTtJQUNULENBQUMsRUFmVyxZQUFZLDRCQUFaLFlBQVksUUFldkI7SUFFWSxRQUFBLG9CQUFvQixHQUFHLGFBQWEsQ0FBQztJQUVsRCxXQUFpQixZQUFZO1FBQzVCLFNBQWdCLElBQUksQ0FBYSxLQUFhO1lBQzdDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFDNUIsQ0FBQztZQUNELFFBQVEsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7Z0JBQzdCLEtBQUssUUFBUTtvQkFDWixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUM7Z0JBQzVCLEtBQUssUUFBUTtvQkFDWixPQUFPLFlBQVksQ0FBQyxNQUFNLENBQUM7Z0JBQzVCLEtBQUssTUFBTTtvQkFDVixPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUM7Z0JB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