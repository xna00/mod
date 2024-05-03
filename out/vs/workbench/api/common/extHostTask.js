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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostConfiguration", "vs/base/common/cancellation", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostInitDataService", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/base/common/platform", "vs/platform/log/common/log", "vs/workbench/api/common/extHostApiDeprecationService", "vs/workbench/contrib/tasks/common/tasks", "vs/base/common/errors"], function (require, exports, uri_1, async_1, event_1, extHost_protocol_1, types, extHostWorkspace_1, extHostDocumentsAndEditors_1, extHostConfiguration_1, cancellation_1, extHostTerminalService_1, extHostRpcService_1, extHostInitDataService_1, instantiation_1, network_1, Platform, log_1, extHostApiDeprecationService_1, tasks_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostTask = exports.WorkerExtHostTask = exports.ExtHostTaskBase = exports.TaskDTO = exports.TaskHandleDTO = exports.CustomExecutionDTO = void 0;
    var TaskDefinitionDTO;
    (function (TaskDefinitionDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskDefinitionDTO.to = to;
    })(TaskDefinitionDTO || (TaskDefinitionDTO = {}));
    var TaskPresentationOptionsDTO;
    (function (TaskPresentationOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        TaskPresentationOptionsDTO.to = to;
    })(TaskPresentationOptionsDTO || (TaskPresentationOptionsDTO = {}));
    var ProcessExecutionOptionsDTO;
    (function (ProcessExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ProcessExecutionOptionsDTO.to = to;
    })(ProcessExecutionOptionsDTO || (ProcessExecutionOptionsDTO = {}));
    var ProcessExecutionDTO;
    (function (ProcessExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && !!candidate.process;
            }
            else {
                return false;
            }
        }
        ProcessExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {
                process: value.process,
                args: value.args
            };
            if (value.options) {
                result.options = ProcessExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ProcessExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return new types.ProcessExecution(value.process, value.args, value.options);
        }
        ProcessExecutionDTO.to = to;
    })(ProcessExecutionDTO || (ProcessExecutionDTO = {}));
    var ShellExecutionOptionsDTO;
    (function (ShellExecutionOptionsDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.from = from;
        function to(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return value;
        }
        ShellExecutionOptionsDTO.to = to;
    })(ShellExecutionOptionsDTO || (ShellExecutionOptionsDTO = {}));
    var ShellExecutionDTO;
    (function (ShellExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && (!!candidate.commandLine || !!candidate.command);
            }
            else {
                return false;
            }
        }
        ShellExecutionDTO.is = is;
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            const result = {};
            if (value.commandLine !== undefined) {
                result.commandLine = value.commandLine;
            }
            else {
                result.command = value.command;
                result.args = value.args;
            }
            if (value.options) {
                result.options = ShellExecutionOptionsDTO.from(value.options);
            }
            return result;
        }
        ShellExecutionDTO.from = from;
        function to(value) {
            if (value === undefined || value === null || (value.command === undefined && value.commandLine === undefined)) {
                return undefined;
            }
            if (value.commandLine) {
                return new types.ShellExecution(value.commandLine, value.options);
            }
            else {
                return new types.ShellExecution(value.command, value.args ? value.args : [], value.options);
            }
        }
        ShellExecutionDTO.to = to;
    })(ShellExecutionDTO || (ShellExecutionDTO = {}));
    var CustomExecutionDTO;
    (function (CustomExecutionDTO) {
        function is(value) {
            if (value) {
                const candidate = value;
                return candidate && candidate.customExecution === 'customExecution';
            }
            else {
                return false;
            }
        }
        CustomExecutionDTO.is = is;
        function from(value) {
            return {
                customExecution: 'customExecution'
            };
        }
        CustomExecutionDTO.from = from;
        function to(taskId, providedCustomExeutions) {
            return providedCustomExeutions.get(taskId);
        }
        CustomExecutionDTO.to = to;
    })(CustomExecutionDTO || (exports.CustomExecutionDTO = CustomExecutionDTO = {}));
    var TaskHandleDTO;
    (function (TaskHandleDTO) {
        function from(value, workspaceService) {
            let folder;
            if (value.scope !== undefined && typeof value.scope !== 'number') {
                folder = value.scope.uri;
            }
            else if (value.scope !== undefined && typeof value.scope === 'number') {
                if ((value.scope === types.TaskScope.Workspace) && workspaceService && workspaceService.workspaceFile) {
                    folder = workspaceService.workspaceFile;
                }
                else {
                    folder = tasks_1.USER_TASKS_GROUP_KEY;
                }
            }
            return {
                id: value._id,
                workspaceFolder: folder
            };
        }
        TaskHandleDTO.from = from;
    })(TaskHandleDTO || (exports.TaskHandleDTO = TaskHandleDTO = {}));
    var TaskGroupDTO;
    (function (TaskGroupDTO) {
        function from(value) {
            if (value === undefined || value === null) {
                return undefined;
            }
            return { _id: value.id, isDefault: value.isDefault };
        }
        TaskGroupDTO.from = from;
    })(TaskGroupDTO || (TaskGroupDTO = {}));
    var TaskDTO;
    (function (TaskDTO) {
        function fromMany(tasks, extension) {
            if (tasks === undefined || tasks === null) {
                return [];
            }
            const result = [];
            for (const task of tasks) {
                const converted = from(task, extension);
                if (converted) {
                    result.push(converted);
                }
            }
            return result;
        }
        TaskDTO.fromMany = fromMany;
        function from(value, extension) {
            if (value === undefined || value === null) {
                return undefined;
            }
            let execution;
            if (value.execution instanceof types.ProcessExecution) {
                execution = ProcessExecutionDTO.from(value.execution);
            }
            else if (value.execution instanceof types.ShellExecution) {
                execution = ShellExecutionDTO.from(value.execution);
            }
            else if (value.execution && value.execution instanceof types.CustomExecution) {
                execution = CustomExecutionDTO.from(value.execution);
            }
            const definition = TaskDefinitionDTO.from(value.definition);
            let scope;
            if (value.scope) {
                if (typeof value.scope === 'number') {
                    scope = value.scope;
                }
                else {
                    scope = value.scope.uri;
                }
            }
            else {
                // To continue to support the deprecated task constructor that doesn't take a scope, we must add a scope here:
                scope = types.TaskScope.Workspace;
            }
            if (!definition || !scope) {
                return undefined;
            }
            const result = {
                _id: value._id,
                definition,
                name: value.name,
                source: {
                    extensionId: extension.identifier.value,
                    label: value.source,
                    scope: scope
                },
                execution: execution,
                isBackground: value.isBackground,
                group: TaskGroupDTO.from(value.group),
                presentationOptions: TaskPresentationOptionsDTO.from(value.presentationOptions),
                problemMatchers: value.problemMatchers,
                hasDefinedMatchers: value.hasDefinedMatchers,
                runOptions: value.runOptions ? value.runOptions : { reevaluateOnRerun: true },
                detail: value.detail
            };
            return result;
        }
        TaskDTO.from = from;
        async function to(value, workspace, providedCustomExeutions) {
            if (value === undefined || value === null) {
                return undefined;
            }
            let execution;
            if (ProcessExecutionDTO.is(value.execution)) {
                execution = ProcessExecutionDTO.to(value.execution);
            }
            else if (ShellExecutionDTO.is(value.execution)) {
                execution = ShellExecutionDTO.to(value.execution);
            }
            else if (CustomExecutionDTO.is(value.execution)) {
                execution = CustomExecutionDTO.to(value._id, providedCustomExeutions);
            }
            const definition = TaskDefinitionDTO.to(value.definition);
            let scope;
            if (value.source) {
                if (value.source.scope !== undefined) {
                    if (typeof value.source.scope === 'number') {
                        scope = value.source.scope;
                    }
                    else {
                        scope = await workspace.resolveWorkspaceFolder(uri_1.URI.revive(value.source.scope));
                    }
                }
                else {
                    scope = types.TaskScope.Workspace;
                }
            }
            if (!definition || !scope) {
                return undefined;
            }
            const result = new types.Task(definition, scope, value.name, value.source.label, execution, value.problemMatchers);
            if (value.isBackground !== undefined) {
                result.isBackground = value.isBackground;
            }
            if (value.group !== undefined) {
                result.group = types.TaskGroup.from(value.group._id);
                if (result.group && value.group.isDefault) {
                    result.group = new types.TaskGroup(result.group.id, result.group.label);
                    if (value.group.isDefault === true) {
                        result.group.isDefault = value.group.isDefault;
                    }
                }
            }
            if (value.presentationOptions) {
                result.presentationOptions = TaskPresentationOptionsDTO.to(value.presentationOptions);
            }
            if (value._id) {
                result._id = value._id;
            }
            if (value.detail) {
                result.detail = value.detail;
            }
            return result;
        }
        TaskDTO.to = to;
    })(TaskDTO || (exports.TaskDTO = TaskDTO = {}));
    var TaskFilterDTO;
    (function (TaskFilterDTO) {
        function from(value) {
            return value;
        }
        TaskFilterDTO.from = from;
        function to(value) {
            if (!value) {
                return undefined;
            }
            return Object.assign(Object.create(null), value);
        }
        TaskFilterDTO.to = to;
    })(TaskFilterDTO || (TaskFilterDTO = {}));
    class TaskExecutionImpl {
        #tasks;
        constructor(tasks, _id, _task) {
            this._id = _id;
            this._task = _task;
            this.#tasks = tasks;
        }
        get task() {
            return this._task;
        }
        terminate() {
            this.#tasks.terminateTask(this);
        }
        fireDidStartProcess(value) {
        }
        fireDidEndProcess(value) {
        }
    }
    let ExtHostTaskBase = class ExtHostTaskBase {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService) {
            this._onDidExecuteTask = new event_1.Emitter();
            this._onDidTerminateTask = new event_1.Emitter();
            this._onDidTaskProcessStarted = new event_1.Emitter();
            this._onDidTaskProcessEnded = new event_1.Emitter();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTask);
            this._workspaceProvider = workspaceService;
            this._editorService = editorService;
            this._configurationService = configurationService;
            this._terminalService = extHostTerminalService;
            this._handleCounter = 0;
            this._handlers = new Map();
            this._taskExecutions = new Map();
            this._taskExecutionPromises = new Map();
            this._providedCustomExecutions2 = new Map();
            this._notProvidedCustomExecutions = new Set();
            this._activeCustomExecutions2 = new Map();
            this._logService = logService;
            this._deprecationService = deprecationService;
            this._proxy.$registerSupportedExecutions(true);
        }
        registerTaskProvider(extension, type, provider) {
            if (!provider) {
                return new types.Disposable(() => { });
            }
            const handle = this.nextHandle();
            this._handlers.set(handle, { type, provider, extension });
            this._proxy.$registerTaskProvider(handle, type);
            return new types.Disposable(() => {
                this._handlers.delete(handle);
                this._proxy.$unregisterTaskProvider(handle);
            });
        }
        registerTaskSystem(scheme, info) {
            this._proxy.$registerTaskSystem(scheme, info);
        }
        fetchTasks(filter) {
            return this._proxy.$fetchTasks(TaskFilterDTO.from(filter)).then(async (values) => {
                const result = [];
                for (const value of values) {
                    const task = await TaskDTO.to(value, this._workspaceProvider, this._providedCustomExecutions2);
                    if (task) {
                        result.push(task);
                    }
                }
                return result;
            });
        }
        get taskExecutions() {
            const result = [];
            this._taskExecutions.forEach(value => result.push(value));
            return result;
        }
        terminateTask(execution) {
            if (!(execution instanceof TaskExecutionImpl)) {
                throw new Error('No valid task execution provided');
            }
            return this._proxy.$terminateTask(execution._id);
        }
        get onDidStartTask() {
            return this._onDidExecuteTask.event;
        }
        async $onDidStartTask(execution, terminalId, resolvedDefinition) {
            const customExecution = this._providedCustomExecutions2.get(execution.id);
            if (customExecution) {
                // Clone the custom execution to keep the original untouched. This is important for multiple runs of the same task.
                this._activeCustomExecutions2.set(execution.id, customExecution);
                this._terminalService.attachPtyToTerminal(terminalId, await customExecution.callback(resolvedDefinition));
            }
            this._lastStartedTask = execution.id;
            this._onDidExecuteTask.fire({
                execution: await this.getTaskExecution(execution)
            });
        }
        get onDidEndTask() {
            return this._onDidTerminateTask.event;
        }
        async $OnDidEndTask(execution) {
            if (!this._taskExecutionPromises.has(execution.id)) {
                // Event already fired by the main thread
                // See https://github.com/microsoft/vscode/commit/aaf73920aeae171096d205efb2c58804a32b6846
                return;
            }
            const _execution = await this.getTaskExecution(execution);
            this._taskExecutionPromises.delete(execution.id);
            this._taskExecutions.delete(execution.id);
            this.customExecutionComplete(execution);
            this._onDidTerminateTask.fire({
                execution: _execution
            });
        }
        get onDidStartTaskProcess() {
            return this._onDidTaskProcessStarted.event;
        }
        async $onDidStartTaskProcess(value) {
            const execution = await this.getTaskExecution(value.id);
            this._onDidTaskProcessStarted.fire({
                execution: execution,
                processId: value.processId
            });
        }
        get onDidEndTaskProcess() {
            return this._onDidTaskProcessEnded.event;
        }
        async $onDidEndTaskProcess(value) {
            const execution = await this.getTaskExecution(value.id);
            this._onDidTaskProcessEnded.fire({
                execution: execution,
                exitCode: value.exitCode
            });
        }
        $provideTasks(handle, validTypes) {
            const handler = this._handlers.get(handle);
            if (!handler) {
                return Promise.reject(new Error('no handler found'));
            }
            // Set up a list of task ID promises that we can wait on
            // before returning the provided tasks. The ensures that
            // our task IDs are calculated for any custom execution tasks.
            // Knowing this ID ahead of time is needed because when a task
            // start event is fired this is when the custom execution is called.
            // The task start event is also the first time we see the ID from the main
            // thread, which is too late for us because we need to save an map
            // from an ID to the custom execution function. (Kind of a cart before the horse problem).
            const taskIdPromises = [];
            const fetchPromise = (0, async_1.asPromise)(() => handler.provider.provideTasks(cancellation_1.CancellationToken.None)).then(value => {
                return this.provideTasksInternal(validTypes, taskIdPromises, handler, value);
            });
            return new Promise((resolve) => {
                fetchPromise.then((result) => {
                    Promise.all(taskIdPromises).then(() => {
                        resolve(result);
                    });
                });
            });
        }
        async $resolveTask(handle, taskDTO) {
            const handler = this._handlers.get(handle);
            if (!handler) {
                return Promise.reject(new Error('no handler found'));
            }
            if (taskDTO.definition.type !== handler.type) {
                throw new Error(`Unexpected: Task of type [${taskDTO.definition.type}] cannot be resolved by provider of type [${handler.type}].`);
            }
            const task = await TaskDTO.to(taskDTO, this._workspaceProvider, this._providedCustomExecutions2);
            if (!task) {
                throw new Error('Unexpected: Task cannot be resolved.');
            }
            const resolvedTask = await handler.provider.resolveTask(task, cancellation_1.CancellationToken.None);
            if (!resolvedTask) {
                return;
            }
            this.checkDeprecation(resolvedTask, handler);
            const resolvedTaskDTO = TaskDTO.from(resolvedTask, handler.extension);
            if (!resolvedTaskDTO) {
                throw new Error('Unexpected: Task cannot be resolved.');
            }
            if (resolvedTask.definition !== task.definition) {
                throw new Error('Unexpected: The resolved task definition must be the same object as the original task definition. The task definition cannot be changed.');
            }
            if (CustomExecutionDTO.is(resolvedTaskDTO.execution)) {
                await this.addCustomExecution(resolvedTaskDTO, resolvedTask, true);
            }
            return await this.resolveTaskInternal(resolvedTaskDTO);
        }
        nextHandle() {
            return this._handleCounter++;
        }
        async addCustomExecution(taskDTO, task, isProvided) {
            const taskId = await this._proxy.$createTaskId(taskDTO);
            if (!isProvided && !this._providedCustomExecutions2.has(taskId)) {
                this._notProvidedCustomExecutions.add(taskId);
                // Also add to active executions when not coming from a provider to prevent timing issue.
                this._activeCustomExecutions2.set(taskId, task.execution);
            }
            this._providedCustomExecutions2.set(taskId, task.execution);
        }
        async getTaskExecution(execution, task) {
            if (typeof execution === 'string') {
                const taskExecution = this._taskExecutionPromises.get(execution);
                if (!taskExecution) {
                    throw new errors_1.ErrorNoTelemetry('Unexpected: The specified task is missing an execution');
                }
                return taskExecution;
            }
            const result = this._taskExecutionPromises.get(execution.id);
            if (result) {
                return result;
            }
            let executionPromise;
            if (!task) {
                executionPromise = TaskDTO.to(execution.task, this._workspaceProvider, this._providedCustomExecutions2).then(t => {
                    if (!t) {
                        throw new errors_1.ErrorNoTelemetry('Unexpected: Task does not exist.');
                    }
                    return new TaskExecutionImpl(this, execution.id, t);
                });
            }
            else {
                executionPromise = Promise.resolve(new TaskExecutionImpl(this, execution.id, task));
            }
            this._taskExecutionPromises.set(execution.id, executionPromise);
            return executionPromise.then(taskExecution => {
                this._taskExecutions.set(execution.id, taskExecution);
                return taskExecution;
            });
        }
        checkDeprecation(task, handler) {
            const tTask = task;
            if (tTask._deprecated) {
                this._deprecationService.report('Task.constructor', handler.extension, 'Use the Task constructor that takes a `scope` instead.');
            }
        }
        customExecutionComplete(execution) {
            const extensionCallback2 = this._activeCustomExecutions2.get(execution.id);
            if (extensionCallback2) {
                this._activeCustomExecutions2.delete(execution.id);
            }
            // Technically we don't really need to do this, however, if an extension
            // is executing a task through "executeTask" over and over again
            // with different properties in the task definition, then the map of executions
            // could grow indefinitely, something we don't want.
            if (this._notProvidedCustomExecutions.has(execution.id) && (this._lastStartedTask !== execution.id)) {
                this._providedCustomExecutions2.delete(execution.id);
                this._notProvidedCustomExecutions.delete(execution.id);
            }
            const iterator = this._notProvidedCustomExecutions.values();
            let iteratorResult = iterator.next();
            while (!iteratorResult.done) {
                if (!this._activeCustomExecutions2.has(iteratorResult.value) && (this._lastStartedTask !== iteratorResult.value)) {
                    this._providedCustomExecutions2.delete(iteratorResult.value);
                    this._notProvidedCustomExecutions.delete(iteratorResult.value);
                }
                iteratorResult = iterator.next();
            }
        }
    };
    exports.ExtHostTaskBase = ExtHostTaskBase;
    exports.ExtHostTaskBase = ExtHostTaskBase = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService),
        __param(6, log_1.ILogService),
        __param(7, extHostApiDeprecationService_1.IExtHostApiDeprecationService)
    ], ExtHostTaskBase);
    let WorkerExtHostTask = class WorkerExtHostTask extends ExtHostTaskBase {
        constructor(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService) {
            super(extHostRpc, initData, workspaceService, editorService, configurationService, extHostTerminalService, logService, deprecationService);
            this.registerTaskSystem(network_1.Schemas.vscodeRemote, {
                scheme: network_1.Schemas.vscodeRemote,
                authority: '',
                platform: Platform.PlatformToString(0 /* Platform.Platform.Web */)
            });
        }
        async executeTask(extension, task) {
            if (!task.execution) {
                throw new Error('Tasks to execute must include an execution');
            }
            const dto = TaskDTO.from(task, extension);
            if (dto === undefined) {
                throw new Error('Task is not valid');
            }
            // If this task is a custom execution, then we need to save it away
            // in the provided custom execution map that is cleaned up after the
            // task is executed.
            if (CustomExecutionDTO.is(dto.execution)) {
                await this.addCustomExecution(dto, task, false);
            }
            else {
                throw new errors_1.NotSupportedError();
            }
            // Always get the task execution first to prevent timing issues when retrieving it later
            const execution = await this.getTaskExecution(await this._proxy.$getTaskExecution(dto), task);
            this._proxy.$executeTask(dto).catch(error => { throw new Error(error); });
            return execution;
        }
        provideTasksInternal(validTypes, taskIdPromises, handler, value) {
            const taskDTOs = [];
            if (value) {
                for (const task of value) {
                    this.checkDeprecation(task, handler);
                    if (!task.definition || !validTypes[task.definition.type]) {
                        const source = task.source ? task.source : 'No task source';
                        this._logService.warn(`The task [${source}, ${task.name}] uses an undefined task type. The task will be ignored in the future.`);
                    }
                    const taskDTO = TaskDTO.from(task, handler.extension);
                    if (taskDTO && CustomExecutionDTO.is(taskDTO.execution)) {
                        taskDTOs.push(taskDTO);
                        // The ID is calculated on the main thread task side, so, let's call into it here.
                        // We need the task id's pre-computed for custom task executions because when OnDidStartTask
                        // is invoked, we have to be able to map it back to our data.
                        taskIdPromises.push(this.addCustomExecution(taskDTO, task, true));
                    }
                    else {
                        this._logService.warn('Only custom execution tasks supported.');
                    }
                }
            }
            return {
                tasks: taskDTOs,
                extension: handler.extension
            };
        }
        async resolveTaskInternal(resolvedTaskDTO) {
            if (CustomExecutionDTO.is(resolvedTaskDTO.execution)) {
                return resolvedTaskDTO;
            }
            else {
                this._logService.warn('Only custom execution tasks supported.');
            }
            return undefined;
        }
        async $resolveVariables(uriComponents, toResolve) {
            const result = {
                process: undefined,
                variables: Object.create(null)
            };
            return result;
        }
        async $jsonTasksSupported() {
            return false;
        }
        async $findExecutable(command, cwd, paths) {
            return undefined;
        }
    };
    exports.WorkerExtHostTask = WorkerExtHostTask;
    exports.WorkerExtHostTask = WorkerExtHostTask = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostWorkspace_1.IExtHostWorkspace),
        __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
        __param(4, extHostConfiguration_1.IExtHostConfiguration),
        __param(5, extHostTerminalService_1.IExtHostTerminalService),
        __param(6, log_1.ILogService),
        __param(7, extHostApiDeprecationService_1.IExtHostApiDeprecationService)
    ], WorkerExtHostTask);
    exports.IExtHostTask = (0, instantiation_1.createDecorator)('IExtHostTask');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdFRhc2suanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RUYXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZDaEcsSUFBVSxpQkFBaUIsQ0FhMUI7SUFiRCxXQUFVLGlCQUFpQjtRQUMxQixTQUFnQixJQUFJLENBQUMsS0FBNEI7WUFDaEQsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUxlLHNCQUFJLE9BS25CLENBQUE7UUFDRCxTQUFnQixFQUFFLENBQUMsS0FBK0I7WUFDakQsSUFBSSxLQUFLLEtBQUssU0FBUyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztnQkFDM0MsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUxlLG9CQUFFLEtBS2pCLENBQUE7SUFDRixDQUFDLEVBYlMsaUJBQWlCLEtBQWpCLGlCQUFpQixRQWExQjtJQUVELElBQVUsMEJBQTBCLENBYW5DO0lBYkQsV0FBVSwwQkFBMEI7UUFDbkMsU0FBZ0IsSUFBSSxDQUFDLEtBQXFDO1lBQ3pELElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzNDLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFMZSwrQkFBSSxPQUtuQixDQUFBO1FBQ0QsU0FBZ0IsRUFBRSxDQUFDLEtBQXdDO1lBQzFELElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxL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