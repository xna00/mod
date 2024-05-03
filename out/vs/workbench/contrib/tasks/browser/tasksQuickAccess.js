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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/filters", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/tasks/common/taskService", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/browser/taskQuickPick", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage"], function (require, exports, nls_1, quickInput_1, pickerQuickAccess_1, filters_1, extensions_1, taskService_1, tasks_1, taskQuickPick_1, configuration_1, types_1, notification_1, dialogs_1, themeService_1, storage_1) {
    "use strict";
    var TasksQuickAccessProvider_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TasksQuickAccessProvider = void 0;
    let TasksQuickAccessProvider = class TasksQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        static { TasksQuickAccessProvider_1 = this; }
        static { this.PREFIX = 'task '; }
        constructor(extensionService, _taskService, _configurationService, _quickInputService, _notificationService, _dialogService, _themeService, _storageService) {
            super(TasksQuickAccessProvider_1.PREFIX, {
                noResultsPick: {
                    label: (0, nls_1.localize)('noTaskResults', "No matching tasks")
                }
            });
            this._taskService = _taskService;
            this._configurationService = _configurationService;
            this._quickInputService = _quickInputService;
            this._notificationService = _notificationService;
            this._dialogService = _dialogService;
            this._themeService = _themeService;
            this._storageService = _storageService;
        }
        async _getPicks(filter, disposables, token) {
            if (token.isCancellationRequested) {
                return [];
            }
            const taskQuickPick = new taskQuickPick_1.TaskQuickPick(this._taskService, this._configurationService, this._quickInputService, this._notificationService, this._themeService, this._dialogService, this._storageService);
            const topLevelPicks = await taskQuickPick.getTopLevelEntries();
            const taskPicks = [];
            for (const entry of topLevelPicks.entries) {
                const highlights = (0, filters_1.matchesFuzzy)(filter, entry.label);
                if (!highlights) {
                    continue;
                }
                if (entry.type === 'separator') {
                    taskPicks.push(entry);
                }
                const task = entry.task;
                const quickAccessEntry = entry;
                quickAccessEntry.highlights = { label: highlights };
                quickAccessEntry.trigger = (index) => {
                    if ((index === 1) && (quickAccessEntry.buttons?.length === 2)) {
                        const key = (task && !(0, types_1.isString)(task)) ? task.getKey() : undefined;
                        if (key) {
                            this._taskService.removeRecentlyUsedTask(key);
                        }
                        return pickerQuickAccess_1.TriggerAction.REFRESH_PICKER;
                    }
                    else {
                        if (tasks_1.ContributedTask.is(task)) {
                            this._taskService.customize(task, undefined, true);
                        }
                        else if (tasks_1.CustomTask.is(task)) {
                            this._taskService.openConfig(task);
                        }
                        return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                    }
                };
                quickAccessEntry.accept = async () => {
                    if ((0, types_1.isString)(task)) {
                        // switch to quick pick and show second level
                        const showResult = await taskQuickPick.show((0, nls_1.localize)('TaskService.pickRunTask', 'Select the task to run'), undefined, task);
                        if (showResult) {
                            this._taskService.run(showResult, { attachProblemMatcher: true });
                        }
                    }
                    else {
                        this._taskService.run(await this._toTask(task), { attachProblemMatcher: true });
                    }
                };
                taskPicks.push(quickAccessEntry);
            }
            return taskPicks;
        }
        async _toTask(task) {
            if (!tasks_1.ConfiguringTask.is(task)) {
                return task;
            }
            return this._taskService.tryResolveTask(task);
        }
    };
    exports.TasksQuickAccessProvider = TasksQuickAccessProvider;
    exports.TasksQuickAccessProvider = TasksQuickAccessProvider = TasksQuickAccessProvider_1 = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, taskService_1.ITaskService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, dialogs_1.IDialogService),
        __param(6, themeService_1.IThemeService),
        __param(7, storage_1.IStorageService)
    ], TasksQuickAccessProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza3NRdWlja0FjY2Vzcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGFza3MvYnJvd3Nlci90YXNrc1F1aWNrQWNjZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFtQnpGLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsNkNBQWlEOztpQkFFdkYsV0FBTSxHQUFHLE9BQU8sQUFBVixDQUFXO1FBRXhCLFlBQ29CLGdCQUFtQyxFQUNoQyxZQUEwQixFQUNqQixxQkFBNEMsRUFDL0Msa0JBQXNDLEVBQ3BDLG9CQUEwQyxFQUNoRCxjQUE4QixFQUMvQixhQUE0QixFQUMxQixlQUFnQztZQUV6RCxLQUFLLENBQUMsMEJBQXdCLENBQUMsTUFBTSxFQUFFO2dCQUN0QyxhQUFhLEVBQUU7b0JBQ2QsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxtQkFBbUIsQ0FBQztpQkFDckQ7YUFDRCxDQUFDLENBQUM7WUFabUIsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDakIsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUMvQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3BDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBc0I7WUFDaEQsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1lBQy9CLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQzFCLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtRQU8xRCxDQUFDO1FBRVMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFjLEVBQUUsV0FBNEIsRUFBRSxLQUF3QjtZQUMvRixJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFN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