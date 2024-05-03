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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/common/types", "vs/base/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/base/common/errors"], function (require, exports, nls, uri_1, uuid_1, Types, Platform, workspace_1, tasks_1, taskService_1, extHostCustomers_1, extHost_protocol_1, configurationResolver_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTask = void 0;
    var TaskExecutionDTO;
    (function (TaskExecutionDTO) {
        function from(value) {
            return {
                id: value.id,
                task: TaskDTO.from(value.task)
            };
        }
        TaskExecutionDTO.from = from;
    })(TaskExecutionDTO || (TaskExecutionDTO = {}));
    var TaskProcessStartedDTO;
    (function (TaskProcessStartedDTO) {
        function from(value, processId) {
            return {
                id: value.id,
                processId
            };
        }
        TaskProcessStartedDTO.from = from;
    })(TaskProcessStartedDTO || (TaskProcessStartedDTO = {}));
    var TaskProcessEndedDTO;
    (function (TaskProcessEndedDTO) {
        function from(value, exitCode) {
            return {
                id: value.id,
                exitCode
            };
        }
        TaskProcessEndedDTO.from = from;
    })(TaskProcessEndedDTO || (TaskProcessEndedDTO = {}));
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            const result = Object.assign(Object.create(null), value);
            delete result._key;
            return result;
        }
        TaskDefinitionDTO.from = from;
        function to(value, executeOnly) {
            let result = tasks_1.TaskDefinition.createTaskIdentifier(value, console);
            if (result === undefined && executeOnly) {
                result = {
                    _key: (0, uuid_1.generateUuid)(),
                    type: '$executeOnly'
                };
            }
            return result;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO || (TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return Object.assign(Object.create(null), value);
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.PresentationOptions.defaults;
            }
            return Object.assign(Object.create(null), tasks_1.PresentationOptions.defaults, value);
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO || (TaskPresentationOptionsDTO = {}));
    var RunOptionsDTO;
    (function (RunOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return Object.assign(Object.create(null), value);
        }
        RunOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.RunOptions.defaults;
            }
            return Object.assign(Object.create(null), tasks_1.RunOptions.defaults, value);
        }
        RunOptionsDTO.to = to;
    })(RunOptionsDTO || (RunOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return {
                cwd: value.cwd,
                env: value.env
            };
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return tasks_1.CommandOptions.defaults;
            }
            return {
                cwd: value.cwd || tasks_1.CommandOptions.defaults.cwd,
                env: value.env
            };
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO || (ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && !!candidate.process;
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            const process = Types.isString(value.name) ? value.name : value.name.value;
            const args = value.args ? value.args.map(value => Types.isString(value) ? value : value.value) : [];
            const result = {
                process: process,
                args: args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            const result = {
                runtime: tasks_1.RuntimeType.Process,
                name: value.process,
                args: value.args,
                presentation: undefined
            };
            result.options = ProcessExecutionOptionsDTO.to(value.options);
            return result;
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO || (ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                cwd: value.cwd || tasks_1.CommandOptions.defaults.cwd,
                env: value.env
            };
            if (value.shell) {
                result.executable = value.shell.executable;
                result.shellArgs = value.shell.args;
                result.shellQuoting = value.shell.quoting;
            }
            return result;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                cwd: value.cwd,
                env: value.env
            };
            if (value.executable) {
                result.shell = {
                    executable: value.executable
                };
                if (value.shellArgs) {
                    result.shell.args = value.shellArgs;
                }
                if (value.shellQuoting) {
                    result.shell.quoting = value.shellQuoting;
                }
            }
            return result;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO || (ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && (!!candidate.commandLine || !!candidate.command);
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            const result = {};
            if (value.name && Types.isString(value.name) && (value.args === undefined || value.args === null || value.args.length === 0)) {
                result.commandLine = value.name;
            }
            else {
                result.command = value.name;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            const result = {
                runtime: tasks_1.RuntimeType.Shell,
                name: value.commandLine ? value.commandLine : value.command,
                args: value.args,
                presentation: undefined
            };
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.to(value.options);
            }
            return result;
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO || (ShellExecutionDTO = {}));
    var CustomExecutionDTO;
    (function (CustomExecutionDTO) {
        function is(value) {
            const candidate = value;
            return candidate && candidate.customExecution === 'customExecution';
        }
        CustomExecutionDTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution'
            };
        }
        CustomExecutionDTO.from = from;
        function to(value) {
            return {
                runtime: tasks_1.RuntimeType.CustomExecution,
                presentation: undefined
            };
        }
        CustomExecutionDTO.to = to;
    })(CustomExecutionDTO || (CustomExecutionDTO = {}));
    var TaskSourceDTO;
    (function (TaskSourceDTO) {
        function from(value) {
            const result = {
                label: value.label
            };
            if (value.kind === tasks_1.TaskSourceKind.Extension) {
                result.extensionId = value.extension;
                if (value.workspaceFolder) {
                    result.scope = value.workspaceFolder.uri;
                }
                else {
                    result.scope = value.scope;
                }
            }
            else if (value.kind === tasks_1.TaskSourceKind.Workspace) {
                result.extensionId = '$core';
                result.scope = value.config.workspaceFolder ? value.config.workspaceFolder.uri : 1 /* TaskScope.Global */;
            }
            return result;
        }
        TaskSourceDTO.from = from;
        function to(value, workspace) {
            let scope;
            let workspaceFolder;
            if ((value.scope === undefined) || ((typeof value.scope === 'number') && (value.scope !== 1 /* TaskScope.Global */))) {
                if (workspace.getWorkspace().folders.length === 0) {
                    scope = 1 /* TaskScope.Global */;
                    workspaceFolder = undefined;
                }
                else {
                    scope = 3 /* TaskScope.Folder */;
                    workspaceFolder = workspace.getWorkspace().folders[0];
                }
            }
            else if (typeof value.scope === 'number') {
                scope = value.scope;
            }
            else {
                scope = 3 /* TaskScope.Folder */;
                workspaceFolder = workspace.getWorkspaceFolder(uri_1.URI.revive(value.scope)) ?? undefined;
            }
            const result = {
                kind: tasks_1.TaskSourceKind.Extension,
                label: value.label,
                extension: value.extensionId,
                scope,
                workspaceFolder
            };
            return result;
        }
        TaskSourceDTO.to = to;
    })(TaskSourceDTO || (TaskSourceDTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function is(value) {
            const candidate = value;
            return candidate && Types.isString(candidate.id) && !!candidate.workspaceFolder;
        }
        TaskHandleDTO.is = is;
    })(TaskHandleDTO || (TaskHandleDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function from(task) {
            if (task === undefined || task === null || (!tasks_1.CustomTask.is(task) && !tasks_1.ContributedTask.is(task) && !tasks_1.ConfiguringTask.is(task))) {
                return undefined;
            }
            const result = {
                _id: task._id,
                name: task.configurationProperties.name,
                definition: TaskDefinitionDTO.from(task.getDefinition(true)),
                source: TaskSourceDTO.from(task._source),
                execution: undefined,
                presentationOptions: !tasks_1.ConfiguringTask.is(task) && task.command ? TaskPresentationOptionsDTO.from(task.command.presentation) : undefined,
                isBackground: task.configurationProperties.isBackground,
                problemMatchers: [],
                hasDefinedMatchers: tasks_1.ContributedTask.is(task) ? task.hasDefinedMatchers : false,
                runOptions: RunOptionsDTO.from(task.runOptions),
            };
            result.group = TaskGroupDTO.from(task.configurationProperties.group);
            if (task.configurationProperties.detail) {
                result.detail = task.configurationProperties.detail;
            }
            if (!tasks_1.ConfiguringTask.is(task) && task.command) {
                switch (task.command.runtime) {
                    case tasks_1.RuntimeType.Process:
                        result.execution = ProcessExecutionDTO.from(task.command);
                        break;
                    case tasks_1.RuntimeType.Shell:
                        result.execution = ShellExecutionDTO.from(task.command);
                        break;
                    case tasks_1.RuntimeType.CustomExecution:
                        result.execution = CustomExecutionDTO.from(task.command);
                        break;
                }
            }
            if (task.configurationProperties.problemMatchers) {
                for (const matcher of task.configurationProperties.problemMatchers) {
                    if (Types.isString(matcher)) {
                        result.problemMatchers.push(matcher);
                    }
                }
            }
            return result;
        }
        TaskDTO.from = from;
        function to(task, workspace, executeOnly, icon, hide) {
            if (!task || (typeof task.name !== 'string')) {
                return undefined;
            }
            let command;
            if (task.execution) {
                if (ShellExecutionDTO.is(task.execution)) {
                    command = ShellExecutionDTO.to(task.execution);
                }
                else if (ProcessExecutionDTO.is(task.execution)) {
                    command = ProcessExecutionDTO.to(task.execution);
                }
                else if (CustomExecutionDTO.is(task.execution)) {
                    command = CustomExecutionDTO.to(task.execution);
                }
            }
            if (!command) {
                return undefined;
            }
            command.presentation = TaskPresentationOptionsDTO.to(task.presentationOptions);
            const source = TaskSourceDTO.to(task.source, workspace);
            const label = nls.localize('task.label', '{0}: {1}', source.label, task.name);
            const definition = TaskDefinitionDTO.to(task.definition, executeOnly);
            const id = (CustomExecutionDTO.is(task.execution) && task._id) ? task._id : `${task.source.extensionId}.${definition._key}`;
            const result = new tasks_1.ContributedTask(id, // uuidMap.getUUID(identifier)
            source, label, definition.type, definition, command, task.hasDefinedMatchers, RunOptionsDTO.to(task.runOptions), {
                name: task.name,
                identifier: label,
                group: task.group,
                isBackground: !!task.isBackground,
                problemMatchers: task.problemMatchers.slice(),
                detail: task.detail,
                icon,
                hide
            });
            return result;
        }
        TaskDTO.to = to;
    })(TaskDTO || (TaskDTO = {}));
    var TaskGroupDTO;
    (function (TaskGroupDTO) {
        function from(value) {
            if (value === undefined) {
                return undefined;
            }
            return {
                _id: (typeof value === 'string') ? value : value._id,
                isDefault: (typeof value === 'string') ? false : ((typeof value.isDefault === 'string') ? false : value.isDefault)
            };
        }
        TaskGroupDTO.from = from;
    })(TaskGroupDTO || (TaskGroupDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            return value;
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO || (TaskFilterDTO = {}));
    let MainThreadTask = class MainThreadTask {
        constructor(extHostContext, _taskService, _workspaceContextServer, _configurationResolverService) {
            this._taskService = _taskService;
            this._workspaceContextServer = _workspaceContextServer;
            this._configurationResolverService = _configurationResolverService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTask);
            this._providers = new Map();
            this._taskService.onDidStateChange(async (event) => {
                if (event.kind === "changed" /* TaskEventKind.Changed */) {
                    return;
                }
                const task = event.__task;
                if (event.kind === "start" /* TaskEventKind.Start */) {
                    const execution = TaskExecutionDTO.from(task.getTaskExecution());
                    let resolvedDefinition = execution.task.definition;
                    if (execution.task?.execution && CustomExecutionDTO.is(execution.task.execution) && event.resolvedVariables) {
                        const dictionary = {};
                        for (const [key, value] of event.resolvedVariables.entries()) {
                            dictionary[key] = value;
                        }
                        resolvedDefinition = await this._configurationResolverService.resolveAnyAsync(task.getWorkspaceFolder(), execution.task.definition, dictionary);
                    }
                    this._proxy.$onDidStartTask(execution, event.terminalId, resolvedDefinition);
                }
                else if (event.kind === "processStarted" /* TaskEventKind.ProcessStarted */) {
                    this._proxy.$onDidStartTaskProcess(TaskProcessStartedDTO.from(task.getTaskExecution(), event.processId));
                }
                else if (event.kind === "processEnded" /* TaskEventKind.ProcessEnded */) {
                    this._proxy.$onDidEndTaskProcess(TaskProcessEndedDTO.from(task.getTaskExecution(), event.exitCode));
                }
                else if (event.kind === "end" /* TaskEventKind.End */) {
                    this._proxy.$OnDidEndTask(TaskExecutionDTO.from(task.getTaskExecution()));
                }
            });
        }
        dispose() {
            for (const value of this._providers.values()) {
                value.disposable.dispose();
            }
            this._providers.clear();
        }
        $createTaskId(taskDTO) {
            return new Promise((resolve, reject) => {
                const task = TaskDTO.to(taskDTO, this._workspaceContextServer, true);
                if (task) {
                    resolve(task._id);
                }
                else {
                    reject(new Error('Task could not be created from DTO'));
                }
            });
        }
        $registerTaskProvider(handle, type) {
            const provider = {
                provideTasks: (validTypes) => {
                    return Promise.resolve(this._proxy.$provideTasks(handle, validTypes)).then((value) => {
                        const tasks = [];
                        for (const dto of value.tasks) {
                            const task = TaskDTO.to(dto, this._workspaceContextServer, true);
                            if (task) {
                                tasks.push(task);
                            }
                            else {
                                console.error(`Task System: can not convert task: ${JSON.stringify(dto.definition, undefined, 0)}. Task will be dropped`);
                            }
                        }
                        return {
                            tasks,
                            extension: value.extension
                        };
                    });
                },
                resolveTask: (task) => {
                    const dto = TaskDTO.from(task);
                    if (dto) {
                        dto.name = ((dto.name === undefined) ? '' : dto.name); // Using an empty name causes the name to default to the one given by the provider.
                        return Promise.resolve(this._proxy.$resolveTask(handle, dto)).then(resolvedTask => {
                            if (resolvedTask) {
                                return TaskDTO.to(resolvedTask, this._workspaceContextServer, true, task.configurationProperties.icon, task.configurationProperties.hide);
                            }
                            return undefined;
                        });
                    }
                    return Promise.resolve(undefined);
                }
            };
            const disposable = this._taskService.registerTaskProvider(provider, type);
            this._providers.set(handle, { disposable, provider });
            return Promise.resolve(undefined);
        }
        $unregisterTaskProvider(handle) {
            const provider = this._providers.get(handle);
            if (provider) {
                provider.disposable.dispose();
                this._providers.delete(handle);
            }
            return Promise.resolve(undefined);
        }
        $fetchTasks(filter) {
            return this._taskService.tasks(TaskFilterDTO.to(filter)).then((tasks) => {
                const result = [];
                for (const task of tasks) {
                    const item = TaskDTO.from(task);
                    if (item) {
                        result.push(item);
                    }
                }
                return result;
            });
        }
        getWorkspace(value) {
            let workspace;
            if (typeof value === 'string') {
                workspace = value;
            }
            else {
                const workspaceObject = this._workspaceContextServer.getWorkspace();
                const uri = uri_1.URI.revive(value);
                if (workspaceObject.configuration?.toString() === uri.toString()) {
                    workspace = workspaceObject;
                }
                else {
                    workspace = this._workspaceContextServer.getWorkspaceFolder(uri);
                }
            }
            return workspace;
        }
        async $getTaskExecution(value) {
            if (TaskHandleDTO.is(value)) {
                const workspace = this.getWorkspace(value.workspaceFolder);
                if (workspace) {
                    const task = await this._taskService.getTask(workspace, value.id, true);
                    if (task) {
                        return {
                            id: task._id,
                            task: TaskDTO.from(task)
                        };
                    }
                    throw new Error('Task not found');
                }
                else {
                    throw new Error('No workspace folder');
                }
            }
            else {
                const task = TaskDTO.to(value, this._workspaceContextServer, true);
                return {
                    id: task._id,
                    task: TaskDTO.from(task)
                };
            }
        }
        // Passing in a TaskHandleDTO will cause the task to get re-resolved, which is important for tasks are coming from the core,
        // such as those gotten from a fetchTasks, since they can have missing configuration properties.
        $executeTask(value) {
            return new Promise((resolve, reject) => {
                if (TaskHandleDTO.is(value)) {
                    const workspace = this.getWorkspace(value.workspaceFolder);
                    if (workspace) {
                        this._taskService.getTask(workspace, value.id, true).then((task) => {
                            if (!task) {
                                reject(new Error('Task not found'));
                            }
                            else {
                                const result = {
                                    id: value.id,
                                    task: TaskDTO.from(task)
                                };
                                this._taskService.run(task).then(summary => {
                                    // Ensure that the task execution gets cleaned up if the exit code is undefined
                                    // This can happen when the task has dependent tasks and one of them failed
                                    if ((summary?.exitCode === undefined) || (summary.exitCode !== 0)) {
                                        this._proxy.$OnDidEndTask(result);
                                    }
                                }, reason => {
                                    // eat the error, it has already been surfaced to the user and we don't care about it here
                                });
                                resolve(result);
                            }
                        }, (_error) => {
                            reject(new Error('Task not found'));
                        });
                    }
                    else {
                        reject(new Error('No workspace folder'));
                    }
                }
                else {
                    const task = TaskDTO.to(value, this._workspaceContextServer, true);
                    this._taskService.run(task).then(undefined, reason => {
                        // eat the error, it has already been surfaced to the user and we don't care about it here
                    });
                    const result = {
                        id: task._id,
                        task: TaskDTO.from(task)
                    };
                    resolve(result);
                }
            });
        }
        $customExecutionComplete(id, result) {
            return new Promise((resolve, reject) => {
                this._taskService.getActiveTasks().then((tasks) => {
                    for (const task of tasks) {
                        if (id === task._id) {
                            this._taskService.extensionCallbackTaskComplete(task, result).then((value) => {
                                resolve(undefined);
                            }, (error) => {
                                reject(error);
                            });
                            return;
                        }
                    }
                    reject(new Error('Task to mark as complete not found'));
                });
            });
        }
        $terminateTask(id) {
            return new Promise((resolve, reject) => {
                this._taskService.getActiveTasks().then((tasks) => {
                    for (const task of tasks) {
                        if (id === task._id) {
                            this._taskService.terminate(task).then((value) => {
                                resolve(undefined);
                            }, (error) => {
                                reject(undefined);
                            });
                            return;
                        }
                    }
                    reject(new errors_1.ErrorNoTelemetry('Task to terminate not found'));
                });
            });
        }
        $registerTaskSystem(key, info) {
            let platform;
            switch (info.platform) {
                case 'Web':
                    platform = 0 /* Platform.Platform.Web */;
                    break;
                case 'win32':
                    platform = 3 /* Platform.Platform.Windows */;
                    break;
                case 'darwin':
                    platform = 1 /* Platform.Platform.Mac */;
                    break;
                case 'linux':
                    platform = 2 /* Platform.Platform.Linux */;
                    break;
                default:
                    platform = Platform.platform;
            }
            this._taskService.registerTaskSystem(key, {
                platform: platform,
                uriProvider: (path) => {
                    return uri_1.URI.from({ scheme: info.scheme, authority: info.authority, path });
                },
                context: this._extHostContext,
                resolveVariables: (workspaceFolder, toResolve, target) => {
                    const vars = [];
                    toResolve.variables.forEach(item => vars.push(item));
                    return Promise.resolve(this._proxy.$resolveVariables(workspaceFolder.uri, { process: toResolve.process, variables: vars })).then(values => {
                        const partiallyResolvedVars = Array.from(Object.values(values.variables));
                        return new Promise((resolve, reject) => {
                            this._configurationResolverService.resolveWithInteraction(workspaceFolder, partiallyResolvedVars, 'tasks', undefined, target).then(resolvedVars => {
                                if (!resolvedVars) {
                                    resolve(undefined);
                                }
                                const result = {
                                    process: undefined,
                                    variables: new Map()
                                };
                                for (let i = 0; i < partiallyResolvedVars.length; i++) {
                                    const variableName = vars[i].substring(2, vars[i].length - 1);
                                    if (resolvedVars && values.variables[vars[i]] === vars[i]) {
                                        const resolved = resolvedVars.get(variableName);
                                        if (typeof resolved === 'string') {
                                            result.variables.set(variableName, resolved);
                                        }
                                    }
                                    else {
                                        result.variables.set(variableName, partiallyResolvedVars[i]);
                                    }
                                }
                                if (Types.isString(values.process)) {
                                    result.process = values.process;
                                }
                                resolve(result);
                            }, reason => {
                                reject(reason);
                            });
                        });
                    });
                },
                findExecutable: (command, cwd, paths) => {
                    return this._proxy.$findExecutable(command, cwd, paths);
                }
            });
        }
        async $registerSupportedExecutions(custom, shell, process) {
            return this._taskService.registerSupportedExecutions(custom, shell, process);
        }
    };
    exports.MainThreadTask = MainThreadTask;
    exports.MainThreadTask = MainThreadTask = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTask),
        __param(1, taskService_1.ITaskService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configurationResolver_1.IConfigurationResolverService)
    ], MainThreadTask);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFRhc2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkVGFzay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQ2hHLElBQVUsZ0JBQWdCLENBT3pCO0lBUEQsV0FBVSxnQkFBZ0I7UUFDekIsU0FBZ0IsSUFBSSxDQUFDLEtBQXFCO1lBQ3pDLE9BQU87Z0JBQ04sRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUNaLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7YUFDOUIsQ0FBQztRQUNILENBQUM7UUFMZSxxQkFBSSxPQUtuQixDQUFBO0lBQ0YsQ0FBQyxFQVBTLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFPekI7SUFFRCxJQUFVLHFCQUFxQixDQU85QjtJQVBELFdBQVUscUJBQXFCO1FBQzlCLFNBQWdCLElBQUksQ0FBQyxLQUFxQixFQUFFLFNBQWlCO1lBQzVELE9BQU87Z0JBQ04sRUFBRSxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUNaLFNBQVM7YUFDVCxDQUFDO1FBQ0gsQ0FBQztRQUxlLDBCQUFJLE9BS25CLENBQUE7SUFDRixDQUFDLEVBUFMscUJBQXFCLEtBQXJCLHFCQUFxQixRQU85QjtJQUVELElBQVUsbUJBQW1CLENBTzVCO0lBUEQsV0FBVSxtQkFBbUI7UUFDNUIsU0FBZ0IsSUFBSSxDQUFDLEtBQXFCLEVBQUUsUUFBNEI7WUFDdkUsT0FBTztnQkFDTixFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ1osUUFBUTthQUNSLENBQUM7UUFDSCxDQUFDO1FBTGUsd0JBQUksT0FLbkIsQ0FBQTtJQUNGLENBQUMsRUFQUyxtQkFBbUIsS0FBbkIsbUJBQW1CLFFBTzVC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