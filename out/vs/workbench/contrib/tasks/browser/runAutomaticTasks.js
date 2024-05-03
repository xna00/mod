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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/tasks", "vs/platform/quickinput/common/quickInput", "vs/platform/actions/common/actions", "vs/platform/workspace/common/workspaceTrust", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/platform/log/common/log"], function (require, exports, nls, resources, lifecycle_1, taskService_1, tasks_1, quickInput_1, actions_1, workspaceTrust_1, configuration_1, event_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ManageAutomaticTaskRunning = exports.RunAutomaticTasks = void 0;
    const ALLOW_AUTOMATIC_TASKS = 'task.allowAutomaticTasks';
    let RunAutomaticTasks = class RunAutomaticTasks extends lifecycle_1.Disposable {
        constructor(_taskService, _configurationService, _workspaceTrustManagementService, _logService) {
            super();
            this._taskService = _taskService;
            this._configurationService = _configurationService;
            this._workspaceTrustManagementService = _workspaceTrustManagementService;
            this._logService = _logService;
            this._hasRunTasks = false;
            if (this._taskService.isReconnected) {
                this._tryRunTasks();
            }
            else {
                this._register(event_1.Event.once(this._taskService.onDidReconnectToTasks)(async () => await this._tryRunTasks()));
            }
            this._register(this._workspaceTrustManagementService.onDidChangeTrust(async () => await this._tryRunTasks()));
        }
        async _tryRunTasks() {
            if (!this._workspaceTrustManagementService.isWorkspaceTrusted()) {
                return;
            }
            if (this._hasRunTasks || this._configurationService.getValue(ALLOW_AUTOMATIC_TASKS) === 'off') {
                return;
            }
            this._hasRunTasks = true;
            this._logService.trace('RunAutomaticTasks: Trying to run tasks.');
            // Wait until we have task system info (the extension host and workspace folders are available).
            if (!this._taskService.hasTaskSystemInfo) {
                this._logService.trace('RunAutomaticTasks: Awaiting task system info.');
                await event_1.Event.toPromise(event_1.Event.once(this._taskService.onDidChangeTaskSystemInfo));
            }
            let workspaceTasks = await this._taskService.getWorkspaceTasks(2 /* TaskRunSource.FolderOpen */);
            this._logService.trace(`RunAutomaticTasks: Found ${workspaceTasks.size} automatic tasks`);
            let autoTasks = this._findAutoTasks(this._taskService, workspaceTasks);
            this._logService.trace(`RunAutomaticTasks: taskNames=${JSON.stringify(autoTasks.taskNames)}`);
            // As seen in some cases with the Remote SSH extension, the tasks configuration is loaded after we have come
            // to this point. Let's give it some extra time.
            if (autoTasks.taskNames.length === 0) {
                const updatedWithinTimeout = await Promise.race([
                    new Promise((resolve) => {
                        event_1.Event.toPromise(event_1.Event.once(this._taskService.onDidChangeTaskConfig)).then(() => resolve(true));
                    }),
                    new Promise((resolve) => {
                        const timer = setTimeout(() => { clearTimeout(timer); resolve(false); }, 10000);
                    })
                ]);
                if (!updatedWithinTimeout) {
                    this._logService.trace(`RunAutomaticTasks: waited some extra time, but no update of tasks configuration`);
                    return;
                }
                workspaceTasks = await this._taskService.getWorkspaceTasks(2 /* TaskRunSource.FolderOpen */);
                autoTasks = this._findAutoTasks(this._taskService, workspaceTasks);
                this._logService.trace(`RunAutomaticTasks: updated taskNames=${JSON.stringify(autoTasks.taskNames)}`);
            }
            this._runWithPermission(this._taskService, this._configurationService, autoTasks.tasks, autoTasks.taskNames);
        }
        _runTasks(taskService, tasks) {
            tasks.forEach(task => {
                if (task instanceof Promise) {
                    task.then(promiseResult => {
                        if (promiseResult) {
                            taskService.run(promiseResult);
                        }
                    });
                }
                else {
                    taskService.run(task);
                }
            });
        }
        _getTaskSource(source) {
            const taskKind = tasks_1.TaskSourceKind.toConfigurationTarget(source.kind);
            switch (taskKind) {
                case 6 /* ConfigurationTarget.WORKSPACE_FOLDER */: {
                    return resources.joinPath(source.config.workspaceFolder.uri, source.config.file);
                }
                case 5 /* ConfigurationTarget.WORKSPACE */: {
                    return source.config.workspace?.configuration ?? undefined;
                }
            }
            return undefined;
        }
        _findAutoTasks(taskService, workspaceTaskResult) {
            const tasks = new Array();
            const taskNames = new Array();
            const locations = new Map();
            if (workspaceTaskResult) {
                workspaceTaskResult.forEach(resultElement => {
                    if (resultElement.set) {
                        resultElement.set.tasks.forEach(task => {
                            if (task.runOptions.runOn === tasks_1.RunOnOptions.folderOpen) {
                                tasks.push(task);
                                taskNames.push(task._label);
                                const location = this._getTaskSource(task._source);
                                if (location) {
                                    locations.set(location.fsPath, location);
                                }
                            }
                        });
                    }
                    if (resultElement.configurations) {
                        for (const configuredTask of Object.values(resultElement.configurations.byIdentifier)) {
                            if (configuredTask.runOptions.runOn === tasks_1.RunOnOptions.folderOpen) {
                                tasks.push(new Promise(resolve => {
                                    taskService.getTask(resultElement.workspaceFolder, configuredTask._id, true).then(task => resolve(task));
                                }));
                                if (configuredTask._label) {
                                    taskNames.push(configuredTask._label);
                                }
                                else {
                                    taskNames.push(configuredTask.configures.task);
                                }
                                const location = this._getTaskSource(configuredTask._source);
                                if (location) {
                                    locations.set(location.fsPath, location);
                                }
                            }
                        }
                    }
                });
            }
            return { tasks, taskNames, locations };
        }
        async _runWithPermission(taskService, configurationService, tasks, taskNames) {
            if (taskNames.length === 0) {
                return;
            }
            if (configurationService.getValue(ALLOW_AUTOMATIC_TASKS) === 'off') {
                return;
            }
            this._runTasks(taskService, tasks);
        }
    };
    exports.RunAutomaticTasks = RunAutomaticTasks;
    exports.RunAutomaticTasks = RunAutomaticTasks = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, log_1.ILogService)
    ], RunAutomaticTasks);
    class ManageAutomaticTaskRunning extends actions_1.Action2 {
        static { this.ID = 'workbench.action.tasks.manageAutomaticRunning'; }
        static { this.LABEL = nls.localize('workbench.action.tasks.manageAutomaticRunning', "Manage Automatic Tasks"); }
        constructor() {
            super({
                id: ManageAutomaticTaskRunning.ID,
                title: ManageAutomaticTaskRunning.LABEL,
                category: tasks_1.TASKS_CATEGORY
            });
        }
        async run(accessor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const allowItem = { label: nls.localize('workbench.action.tasks.allowAutomaticTasks', "Allow Automatic Tasks") };
            const disallowItem = { label: nls.localize('workbench.action.tasks.disallowAutomaticTasks', "Disallow Automatic Tasks") };
            const value = await quickInputService.pick([allowItem, disallowItem], { canPickMany: false });
            if (!value) {
                return;
            }
            configurationService.updateValue(ALLOW_AUTOMATIC_TASKS, value === allowItem ? 'on' : 'off', 2 /* ConfigurationTarget.USER */);
        }
    }
    exports.ManageAutomaticTaskRunning = ManageAutomaticTaskRunning;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVuQXV0b21hdGljVGFza3MuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2Jyb3dzZXIvcnVuQXV0b21hdGljVGFza3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJoRyxNQUFNLHFCQUFxQixHQUFHLDBCQUEwQixDQUFDO0lBRWxELElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWtCLFNBQVEsc0JBQVU7UUFFaEQsWUFDZSxZQUEyQyxFQUNsQyxxQkFBNkQsRUFDbEQsZ0NBQW1GLEVBQ3hHLFdBQXlDO1lBQ3RELEtBQUssRUFBRSxDQUFDO1lBSnVCLGlCQUFZLEdBQVosWUFBWSxDQUFjO1lBQ2pCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDakMscUNBQWdDLEdBQWhDLGdDQUFnQyxDQUFrQztZQUN2RixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUwvQyxpQkFBWSxHQUFZLEtBQUssQ0FBQztZQU9yQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNyQixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMscUJBQXFCLENBQUMsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDLE1BQU0sSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1RyxDQUFDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FB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