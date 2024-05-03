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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/workbench/contrib/markers/common/markers", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/markers/common/markers", "vs/workbench/services/views/common/viewsService", "vs/platform/storage/common/storage", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/workbench/contrib/debug/browser/debugCommands", "vs/platform/commands/common/commands"], function (require, exports, nls, severity_1, markers_1, taskService_1, configuration_1, dialogs_1, markers_2, viewsService_1, storage_1, errorMessage_1, actions_1, debugCommands_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugTaskRunner = exports.TaskRunResult = void 0;
    function once(match, event) {
        return (listener, thisArgs = null, disposables) => {
            const result = event(e => {
                if (match(e)) {
                    result.dispose();
                    return listener.call(thisArgs, e);
                }
            }, null, disposables);
            return result;
        };
    }
    var TaskRunResult;
    (function (TaskRunResult) {
        TaskRunResult[TaskRunResult["Failure"] = 0] = "Failure";
        TaskRunResult[TaskRunResult["Success"] = 1] = "Success";
    })(TaskRunResult || (exports.TaskRunResult = TaskRunResult = {}));
    const DEBUG_TASK_ERROR_CHOICE_KEY = 'debug.taskerrorchoice';
    let DebugTaskRunner = class DebugTaskRunner {
        constructor(taskService, markerService, configurationService, viewsService, dialogService, storageService, commandService) {
            this.taskService = taskService;
            this.markerService = markerService;
            this.configurationService = configurationService;
            this.viewsService = viewsService;
            this.dialogService = dialogService;
            this.storageService = storageService;
            this.commandService = commandService;
            this.canceled = false;
        }
        cancel() {
            this.canceled = true;
        }
        async runTaskAndCheckErrors(root, taskId) {
            try {
                this.canceled = false;
                const taskSummary = await this.runTask(root, taskId);
                if (this.canceled || (taskSummary && taskSummary.exitCode === undefined)) {
                    // User canceled, either debugging, or the prelaunch task
                    return 0 /* TaskRunResult.Failure */;
                }
                const errorCount = taskId ? this.markerService.read({ severities: markers_2.MarkerSeverity.Error, take: 2 }).length : 0;
                const successExitCode = taskSummary && taskSummary.exitCode === 0;
                const failureExitCode = taskSummary && taskSummary.exitCode !== 0;
                const onTaskErrors = this.configurationService.getValue('debug').onTaskErrors;
                if (successExitCode || onTaskErrors === 'debugAnyway' || (errorCount === 0 && !failureExitCode)) {
                    return 1 /* TaskRunResult.Success */;
                }
                if (onTaskErrors === 'showErrors') {
                    await this.viewsService.openView(markers_1.Markers.MARKERS_VIEW_ID, true);
                    return Promise.resolve(0 /* TaskRunResult.Failure */);
                }
                if (onTaskErrors === 'abort') {
                    return Promise.resolve(0 /* TaskRunResult.Failure */);
                }
                const taskLabel = typeof taskId === 'string' ? taskId : taskId ? taskId.name : '';
                const message = errorCount > 1
                    ? nls.localize('preLaunchTaskErrors', "Errors exist after running preLaunchTask '{0}'.", taskLabel)
                    : errorCount === 1
                        ? nls.localize('preLaunchTaskError', "Error exists after running preLaunchTask '{0}'.", taskLabel)
                        : taskSummary && typeof taskSummary.exitCode === 'number'
                            ? nls.localize('preLaunchTaskExitCode', "The preLaunchTask '{0}' terminated with exit code {1}.", taskLabel, taskSummary.exitCode)
                            : nls.localize('preLaunchTaskTerminated', "The preLaunchTask '{0}' terminated.", taskLabel);
                let DebugChoice;
                (function (DebugChoice) {
                    DebugChoice[DebugChoice["DebugAnyway"] = 1] = "DebugAnyway";
                    DebugChoice[DebugChoice["ShowErrors"] = 2] = "ShowErrors";
                    DebugChoice[DebugChoice["Cancel"] = 0] = "Cancel";
                })(DebugChoice || (DebugChoice = {}));
                const { result, checkboxChecked } = await this.dialogService.prompt({
                    type: severity_1.default.Warning,
                    message,
                    buttons: [
                        {
                            label: nls.localize({ key: 'debugAnyway', comment: ['&& denotes a mnemonic'] }, "&&Debug Anyway"),
                            run: () => DebugChoice.DebugAnyway
                        },
                        {
                            label: nls.localize({ key: 'showErrors', comment: ['&& denotes a mnemonic'] }, "&&Show Errors"),
                            run: () => DebugChoice.ShowErrors
                        }
                    ],
                    cancelButton: {
                        label: nls.localize('abort', "Abort"),
                        run: () => DebugChoice.Cancel
                    },
                    checkbox: {
                        label: nls.localize('remember', "Remember my choice in user settings"),
                    }
                });
                const debugAnyway = result === DebugChoice.DebugAnyway;
                const abort = result === DebugChoice.Cancel;
                if (checkboxChecked) {
                    this.configurationService.updateValue('debug.onTaskErrors', result === DebugChoice.DebugAnyway ? 'debugAnyway' : abort ? 'abort' : 'showErrors');
                }
                if (abort) {
                    return Promise.resolve(0 /* TaskRunResult.Failure */);
                }
                if (debugAnyway) {
                    return 1 /* TaskRunResult.Success */;
                }
                await this.viewsService.openView(markers_1.Markers.MARKERS_VIEW_ID, true);
                return Promise.resolve(0 /* TaskRunResult.Failure */);
            }
            catch (err) {
                const taskConfigureAction = this.taskService.configureAction();
                const choiceMap = JSON.parse(this.storageService.get(DEBUG_TASK_ERROR_CHOICE_KEY, 1 /* StorageScope.WORKSPACE */, '{}'));
                let choice = -1;
                let DebugChoice;
                (function (DebugChoice) {
                    DebugChoice[DebugChoice["DebugAnyway"] = 0] = "DebugAnyway";
                    DebugChoice[DebugChoice["ConfigureTask"] = 1] = "ConfigureTask";
                    DebugChoice[DebugChoice["Cancel"] = 2] = "Cancel";
                })(DebugChoice || (DebugChoice = {}));
                if (choiceMap[err.message] !== undefined) {
                    choice = choiceMap[err.message];
                }
                else {
                    const { result, checkboxChecked } = await this.dialogService.prompt({
                        type: severity_1.default.Error,
                        message: err.message,
                        buttons: [
                            {
                                label: nls.localize({ key: 'debugAnyway', comment: ['&& denotes a mnemonic'] }, "&&Debug Anyway"),
                                run: () => DebugChoice.DebugAnyway
                            },
                            {
                                label: taskConfigureAction.label,
                                run: () => DebugChoice.ConfigureTask
                            }
                        ],
                        cancelButton: {
                            run: () => DebugChoice.Cancel
                        },
                        checkbox: {
                            label: nls.localize('rememberTask', "Remember my choice for this task")
                        }
                    });
                    choice = result;
                    if (checkboxChecked) {
                        choiceMap[err.message] = choice;
                        this.storageService.store(DEBUG_TASK_ERROR_CHOICE_KEY, JSON.stringify(choiceMap), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    }
                }
                if (choice === DebugChoice.ConfigureTask) {
                    await taskConfigureAction.run();
                }
                return choice === DebugChoice.DebugAnyway ? 1 /* TaskRunResult.Success */ : 0 /* TaskRunResult.Failure */;
            }
        }
        async runTask(root, taskId) {
            if (!taskId) {
                return Promise.resolve(null);
            }
            if (!root) {
                return Promise.reject(new Error(nls.localize('invalidTaskReference', "Task '{0}' can not be referenced from a launch configuration that is in a different workspace folder.", typeof taskId === 'string' ? taskId : taskId.type)));
            }
            // run a task before starting a debug session
            const task = await this.taskService.getTask(root, taskId);
            if (!task) {
                const errorMessage = typeof taskId === 'string'
                    ? nls.localize('DebugTaskNotFoundWithTaskId', "Could not find the task '{0}'.", taskId)
                    : nls.localize('DebugTaskNotFound', "Could not find the specified task.");
                return Promise.reject((0, errorMessage_1.createErrorWithActions)(errorMessage, [new actions_1.Action(debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID, debugCommands_1.DEBUG_CONFIGURE_LABEL, undefined, true, () => this.commandService.executeCommand(debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID))]));
            }
            // If a task is missing the problem matcher the promise will never complete, so we need to have a workaround #35340
            let taskStarted = false;
            const getTaskKey = (t) => t.getKey() ?? t.getMapKey();
            const taskKey = getTaskKey(task);
            const inactivePromise = new Promise((c) => once(e => {
                // When a task isBackground it will go inactive when it is safe to launch.
                // But when a background task is terminated by the user, it will also fire an inactive event.
                // This means that we will not get to see the real exit code from running the task (undefined when terminated by the user).
                // Catch the ProcessEnded event here, which occurs before inactive, and capture the exit code to prevent this.
                return (e.kind === "inactive" /* TaskEventKind.Inactive */
                    || (e.kind === "processEnded" /* TaskEventKind.ProcessEnded */ && e.exitCode === undefined))
                    && getTaskKey(e.__task) === taskKey;
            }, this.taskService.onDidStateChange)(e => {
                taskStarted = true;
                c(e.kind === "processEnded" /* TaskEventKind.ProcessEnded */ ? { exitCode: e.exitCode } : null);
            }));
            const promise = this.taskService.getActiveTasks().then(async (tasks) => {
                if (tasks.find(t => getTaskKey(t) === taskKey)) {
                    // Check that the task isn't busy and if it is, wait for it
                    const busyTasks = await this.taskService.getBusyTasks();
                    if (busyTasks.find(t => getTaskKey(t) === taskKey)) {
                        taskStarted = true;
                        return inactivePromise;
                    }
                    // task is already running and isn't busy - nothing to do.
                    return Promise.resolve(null);
                }
                once(e => ((e.kind === "active" /* TaskEventKind.Active */) || (e.kind === "dependsOnStarted" /* TaskEventKind.DependsOnStarted */)) && getTaskKey(e.__task) === taskKey, this.taskService.onDidStateChange)(() => {
                    // Task is active, so everything seems to be fine, no need to prompt after 10 seconds
                    // Use case being a slow running task should not be prompted even though it takes more than 10 seconds
                    taskStarted = true;
                });
                const taskPromise = this.taskService.run(task);
                if (task.configurationProperties.isBackground) {
                    return inactivePromise;
                }
                return taskPromise.then(x => x ?? null);
            });
            return new Promise((c, e) => {
                const waitForInput = new Promise(resolve => once(e => (e.kind === "acquiredInput" /* TaskEventKind.AcquiredInput */) && getTaskKey(e.__task) === taskKey, this.taskService.onDidStateChange)(() => {
                    resolve();
                }));
                promise.then(result => {
                    taskStarted = true;
                    c(result);
                }, error => e(error));
                waitForInput.then(() => {
                    const waitTime = task.configurationProperties.isBackground ? 5000 : 10000;
                    setTimeout(() => {
                        if (!taskStarted) {
                            const errorMessage = typeof taskId === 'string'
                                ? nls.localize('taskNotTrackedWithTaskId', "The task '{0}' cannot be tracked. Make sure to have a problem matcher defined.", taskId)
                                : nls.localize('taskNotTracked', "The task '{0}' cannot be tracked. Make sure to have a problem matcher defined.", JSON.stringify(taskId));
                            e({ severity: severity_1.default.Error, message: errorMessage });
                        }
                    }, waitTime);
                });
            });
        }
    };
    exports.DebugTaskRunner = DebugTaskRunner;
    exports.DebugTaskRunner = DebugTaskRunner = __decorate([
        __param(0, taskService_1.ITaskService),
        __param(1, markers_2.IMarkerService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, viewsService_1.IViewsService),
        __param(4, dialogs_1.IDialogService),
        __param(5, storage_1.IStorageService),
        __param(6, commands_1.ICommandService)
    ], DebugTaskRunner);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdUYXNrUnVubmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnVGFza1J1bm5lci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFvQmhHLFNBQVMsSUFBSSxDQUFDLEtBQWlDLEVBQUUsS0FBd0I7UUFDeEUsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEdBQUcsSUFBSSxFQUFFLFdBQVksRUFBRSxFQUFFO1lBQ2xELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDZCxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pCLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLENBQUM7WUFDRixDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3RCLE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQyxDQUFDO0lBQ0gsQ0FBQztJQUVELElBQWtCLGFBR2pCO0lBSEQsV0FBa0IsYUFBYTtRQUM5Qix1REFBTyxDQUFBO1FBQ1AsdURBQU8sQ0FBQTtJQUNSLENBQUMsRUFIaUIsYUFBYSw2QkFBYixhQUFhLFFBRzlCO0lBRUQsTUFBTSwyQkFBMkIsR0FBRyx1QkFBdUIsQ0FBQztJQUVyRCxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO1FBSTNCLFlBQ2UsV0FBMEMsRUFDeEMsYUFBOEMsRUFDdkMsb0JBQTRELEVBQ3BFLFlBQTRDLEVBQzNDLGFBQThDLEVBQzdDLGNBQWdELEVBQ2hELGNBQWdEO1lBTmxDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ3ZCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUN0Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ25ELGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQzFCLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBVDFELGFBQVEsR0FBRyxLQUFLLENBQUM7UUFVckIsQ0FBQztRQUVMLE1BQU07WUFDTCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO1FBRUQsS0FBSyxDQUFDLHFCQUFxQixDQUFDLElBQStDLEVBQUUsTUFBNEM7WUFDeEgsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsS0FBSyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUMxRSx5REFBeUQ7b0JBQ3pELHFDQUE2QjtnQkFDOUIsQ0FBQztnQkFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLHdCQUFjLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RyxNQUFNLGVBQWUsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsS0FBSyxDQUFDLENBQUM7Z0JBQ2xFLE1BQU0sZUFBZSxHQUFHLFdBQVcsSUFBSSxXQUFXLENBQUMsUUFBUSxLQUFLLENBQUMsQ0FBQztnQkFDbEUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBc0IsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDO2dCQUNuRyxJQUFJLGVBQWUsSUFBSSxZQUFZLEtBQUssYUFBYSxJQUFJLENBQUMsVUFBVSxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7b0JBQ2pHLHFDQUE2QjtnQkFDOUIsQ0FBQztnQkFDRCxJQUFJLFlBQVksS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDbkMsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxpQkFBTyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDaEUsT0FBTyxPQUFPLENBQUMsT0FBTywrQkFBdUIsQ0FBQztnQkFDL0MsQ0FBQztnQkFDRCxJQUFJLFlBQVksS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDOUIsT0FBTyxPQUFPLENBQUMsT0FBTywrQkFBdUIsQ0FBQztnQkFDL0MsQ0FBQztnQkFFRCxNQUFNLFNBQVMsR0FBRyxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2xGLE1BQU0sT0FBTyxHQUFHLFVBQVUsR0FBRyxDQUFDO29CQUM3QixDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxpREFBaUQsRUFBRSxTQUFTLENBQUM7b0JBQ25HLENBQUMsQ0FBQyxVQUFVLEtBQUssQ0FBQzt3QkFDakIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLEVBQUUsaURBQWlELEVBQUUsU0FBUyxDQUFDO3dCQUNsRyxDQUFDLENBQUMsV0FBVyxJQUFJLE9BQU8sV0FBVyxDQUFDLFFBQVEsS0FBSyxRQUFROzRCQUN4RCxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsRUFBRSx3REFBd0QsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQzs0QkFDbEksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMseUJBQXlCLEVBQUUscUNBQXFDLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRS9GLElBQUssV0FJSjtnQkFKRCxXQUFLLFdBQVc7b0JBQ2YsMkRBQWUsQ0FBQTtvQkFDZix5REFBYyxDQUFBO29CQUNkLGlEQUFVLENBQUE7Z0JBQ1gsQ0FBQyxFQUpJLFdBQVcsS0FBWCxXQUFXLFFBSWY7Z0JBQ0QsTUFBTSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFjO29CQUNoRixJQUFJLEVBQUUsa0JBQVEsQ0FBQyxPQUFPO29CQUN0QixPQUFPO29CQUNQLE9BQU8sRUFBRTt3QkFDUjs0QkFDQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDOzRCQUNqRyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLFdBQVc7eUJBQ2xDO3dCQUNEOzRCQUNDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsZUFBZSxDQUFDOzRCQUMvRixHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLFVBQVU7eUJBQ2pDO3FCQUNEO29CQUNELFlBQVksRUFBRTt3QkFDYixLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO3dCQUNyQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU07cUJBQzdCO29CQUNELFFBQVEsRUFBRTt3QkFDVCxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUscUNBQXFDLENBQUM7cUJBQ3RFO2lCQUNELENBQUMsQ0FBQztnQkFHSCxNQUFNLFdBQVcsR0FBRyxNQUFNLEtBQUssV0FBVyxDQUFDLFdBQVcsQ0FBQztnQkFDdkQsTUFBTSxLQUFLLEdBQUcsTUFBTSxLQUFLLFdBQVcsQ0FBQyxNQUFNLENBQUM7Z0JBQzVDLElBQUksZUFBZSxFQUFFLENBQUM7b0JBQ3JCLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxLQUFLLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNsSixDQUFDO2dCQUVELElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1gsT0FBTyxPQUFPLENBQUMsT0FBTywrQkFBdUIsQ0FBQztnQkFDL0MsQ0FBQztnQkFDRCxJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUNqQixxQ0FBNkI7Z0JBQzlCLENBQUM7Z0JBRUQsTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxpQkFBTyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDaEUsT0FBTyxPQUFPLENBQUMsT0FBTywrQkFBdUIsQ0FBQztZQUMvQyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDZCxNQUFNLG1CQUFtQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQy9ELE1BQU0sU0FBUyxHQUE4QixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLDJCQUEyQixrQ0FBMEIsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFNUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hCLElBQUssV0FJSjtnQkFKRCxXQUFLLFdBQVc7b0JBQ2YsMkRBQWUsQ0FBQTtvQkFDZiwrREFBaUIsQ0FBQTtvQkFDakIsaURBQVUsQ0FBQTtnQkFDWCxDQUFDLEVBSkksV0FBVyxLQUFYLFdBQVcsUUFJZjtnQkFDRCxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQzFDLE1BQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNqQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFjO3dCQUNoRixJQUFJLEVBQUUsa0JBQVEsQ0FBQyxLQUFLO3dCQUNwQixPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU87d0JBQ3BCLE9BQU8sRUFBRTs0QkFDUjtnQ0FDQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDO2dDQUNqRyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLFdBQVc7NkJBQ2xDOzRCQUNEO2dDQUNDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxLQUFLO2dDQUNoQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLGFBQWE7NkJBQ3BDO3lCQUNEO3dCQUNELFlBQVksRUFBRTs0QkFDYixHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU07eUJBQzdCO3dCQUNELFFBQVEsRUFBRTs0QkFDVCxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsa0NBQWtDLENBQUM7eUJBQ3ZFO3FCQUNELENBQUMsQ0FBQztvQkFDSCxNQUFNLEdBQUcsTUFBTSxDQUFDO29CQUNoQixJQUFJLGVBQWUsRUFBRSxDQUFDO3dCQUNyQixTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sQ0FBQzt3QkFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsZ0VBQWdELENBQUM7b0JBQ2xJLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLE1BQU0sS0FBSyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUM7b0JBQzFDLE1BQU0sbUJBQW1CLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2pDLENBQUM7Z0JBRUQsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDLCtCQUF1QixDQUFDLDhCQUFzQixDQUFDO1lBQzNGLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUErQyxFQUFFLE1BQTRDO1lBQzFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsRUFBRSx1R0FBdUcsRUFBRSxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwTyxDQUFDO1lBQ0QsNkNBQTZDO1lBQzdDLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzFELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDWCxNQUFNLFlBQVksR0FBRyxPQUFPLE1BQU0sS0FBSyxRQUFRO29CQUM5QyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsRUFBRSxnQ0FBZ0MsRUFBRSxNQUFNLENBQUM7b0JBQ3ZGLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLG1CQUFtQixFQUFFLG9DQUFvQyxDQUFDLENBQUM7Z0JBQzNFLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFBLHFDQUFzQixFQUFDLFlBQVksRUFBRSxDQUFDLElBQUksZ0JBQU0sQ0FBQywwQ0FBMEIsRUFBRSxxQ0FBcUIsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLDBDQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyTixDQUFDO1lBRUQsbUhBQW1IO1lBQ25ILElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN4QixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUM1RCxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDakMsTUFBTSxlQUFlLEdBQWlDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ2pGLDBFQUEwRTtnQkFDMUUsNkZBQTZGO2dCQUM3RiwySEFBMkg7Z0JBQzNILDhHQUE4RztnQkFDOUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLDRDQUEyQjt1QkFDckMsQ0FBQyxDQUFDLENBQUMsSUFBSSxvREFBK0IsSUFBSSxDQUFDLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxDQUFDO3VCQUNwRSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLE9BQU8sQ0FBQztZQUN0QyxDQUFDLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN6QyxXQUFXLEdBQUcsSUFBSSxDQUFDO2dCQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksb0RBQStCLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sT0FBTyxHQUFpQyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFnQyxFQUFFO2dCQUNsSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDaEQsMkRBQTJEO29CQUMzRCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ3hELElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsRUFBRSxDQUFDO3dCQUNwRCxXQUFXLEdBQUcsSUFBSSxDQUFDO3dCQUNuQixPQUFPLGVBQWUsQ0FBQztvQkFDeEIsQ0FBQztvQkFDRCwwREFBMEQ7b0JBQzFELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksd0NBQXlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLDREQUFtQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxFQUFFO29CQUN6SyxxRkFBcUY7b0JBQ3JGLHNHQUFzRztvQkFDdEcsV0FBVyxHQUFHLElBQUksQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLElBQUksSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksRUFBRSxDQUFDO29CQUMvQyxPQUFPLGVBQWUsQ0FBQztnQkFDeEIsQ0FBQztnQkFFRCxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7WUFDekMsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMzQixNQUFNLFlBQVksR0FBRyxJQUFJLE9BQU8sQ0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksc0RBQWdDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLE9BQU8sRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxFQUFFO29CQUNqTCxPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7b0JBQ3JCLFdBQVcsR0FBRyxJQUFJLENBQUM7b0JBQ25CLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDWCxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFFdEIsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ3RCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUUxRSxVQUFVLENBQUMsR0FBRyxFQUFFO3dCQUNmLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs0QkFDbEIsTUFBTSxZQUFZLEdBQUcsT0FBTyxNQUFNLEtBQUssUUFBUTtnQ0FDOUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsZ0ZBQWdGLEVBQUUsTUFBTSxDQUFDO2dDQUNwSSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxnRkFBZ0YsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7NEJBQzVJLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxrQkFBUSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQzt3QkFDeEQsQ0FBQztvQkFDRixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ2QsQ0FBQyxDQUFDLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7S0FDRCxDQUFBO0lBL05ZLDBDQUFlOzhCQUFmLGVBQWU7UUFLekIsV0FBQSwwQkFBWSxDQUFBO1FBQ1osV0FBQSx3QkFBYyxDQUFBO1FBQ2QsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLDRCQUFhLENBQUE7UUFDYixXQUFBLHdCQUFjLENBQUE7UUFDZCxXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLDBCQUFlLENBQUE7T0FYTCxlQUFlLENBK04zQiJ9