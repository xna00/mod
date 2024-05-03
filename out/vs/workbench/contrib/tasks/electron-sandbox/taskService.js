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
define(["require", "exports", "vs/nls", "vs/base/common/semver/semver", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/tasks/common/tasks", "vs/workbench/contrib/tasks/browser/abstractTaskService", "vs/workbench/contrib/tasks/common/taskService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/tasks/browser/terminalTaskSystem", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/markers/common/markers", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/services/output/common/output", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/path/common/pathService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/textfile/common/textfiles", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/accessibilitySignal/browser/accessibilitySignalService"], function (require, exports, nls, semver, workspace_1, tasks_1, abstractTaskService_1, taskService_1, extensions_1, terminalTaskSystem_1, dialogs_1, model_1, resolverService_1, commands_1, configuration_1, contextkey_1, files_1, log_1, markers_1, notification_1, opener_1, progress_1, quickInput_1, storage_1, telemetry_1, views_1, viewsService_1, output_1, terminal_1, configurationResolver_1, editorService_1, environmentService_1, extensions_2, lifecycle_1, pathService_1, preferences_1, textfiles_1, workspaceTrust_1, terminal_2, panecomposite_1, themeService_1, instantiation_1, remoteAgentService_1, accessibilitySignalService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TaskService = void 0;
    let TaskService = class TaskService extends abstractTaskService_1.AbstractTaskService {
        constructor(configurationService, markerService, outputService, paneCompositeService, viewsService, commandService, editorService, fileService, contextService, telemetryService, textFileService, lifecycleService, modelService, extensionService, quickInputService, configurationResolverService, terminalService, terminalGroupService, storageService, progressService, openerService, dialogService, notificationService, contextKeyService, environmentService, terminalProfileResolverService, pathService, textModelResolverService, preferencesService, viewDescriptorService, workspaceTrustRequestService, workspaceTrustManagementService, logService, themeService, instantiationService, remoteAgentService, accessibilitySignalService) {
            super(configurationService, markerService, outputService, paneCompositeService, viewsService, commandService, editorService, fileService, contextService, telemetryService, textFileService, modelService, extensionService, quickInputService, configurationResolverService, terminalService, terminalGroupService, storageService, progressService, openerService, dialogService, notificationService, contextKeyService, environmentService, terminalProfileResolverService, pathService, textModelResolverService, preferencesService, viewDescriptorService, workspaceTrustRequestService, workspaceTrustManagementService, logService, themeService, lifecycleService, remoteAgentService, instantiationService);
            this._register(lifecycleService.onBeforeShutdown(event => event.veto(this.beforeShutdown(), 'veto.tasks')));
        }
        _getTaskSystem() {
            if (this._taskSystem) {
                return this._taskSystem;
            }
            const taskSystem = this._createTerminalTaskSystem();
            this._taskSystem = taskSystem;
            this._taskSystemListeners =
                [
                    this._taskSystem.onDidStateChange((event) => {
                        this._taskRunningState.set(this._taskSystem.isActiveSync());
                        this._onDidStateChange.fire(event);
                    })
                ];
            return this._taskSystem;
        }
        _computeLegacyConfiguration(workspaceFolder) {
            const { config, hasParseErrors } = this._getConfiguration(workspaceFolder);
            if (hasParseErrors) {
                return Promise.resolve({ workspaceFolder: workspaceFolder, hasErrors: true, config: undefined });
            }
            if (config) {
                return Promise.resolve({ workspaceFolder, config, hasErrors: false });
            }
            else {
                return Promise.resolve({ workspaceFolder: workspaceFolder, hasErrors: true, config: undefined });
            }
        }
        _versionAndEngineCompatible(filter) {
            const range = filter && filter.version ? filter.version : undefined;
            const engine = this.executionEngine;
            return (range === undefined) || ((semver.satisfies('0.1.0', range) && engine === tasks_1.ExecutionEngine.Process) || (semver.satisfies('2.0.0', range) && engine === tasks_1.ExecutionEngine.Terminal));
        }
        beforeShutdown() {
            if (!this._taskSystem) {
                return false;
            }
            if (!this._taskSystem.isActiveSync()) {
                return false;
            }
            // The terminal service kills all terminal on shutdown. So there
            // is nothing we can do to prevent this here.
            if (this._taskSystem instanceof terminalTaskSystem_1.TerminalTaskSystem) {
                return false;
            }
            let terminatePromise;
            if (this._taskSystem.canAutoTerminate()) {
                terminatePromise = Promise.resolve({ confirmed: true });
            }
            else {
                terminatePromise = this._dialogService.confirm({
                    message: nls.localize('TaskSystem.runningTask', 'There is a task running. Do you want to terminate it?'),
                    primaryButton: nls.localize({ key: 'TaskSystem.terminateTask', comment: ['&& denotes a mnemonic'] }, "&&Terminate Task")
                });
            }
            return terminatePromise.then(res => {
                if (res.confirmed) {
                    return this._taskSystem.terminateAll().then((responses) => {
                        let success = true;
                        let code = undefined;
                        for (const response of responses) {
                            success = success && response.success;
                            // We only have a code in the old output runner which only has one task
                            // So we can use the first code.
                            if (code === undefined && response.code !== undefined) {
                                code = response.code;
                            }
                        }
                        if (success) {
                            this._taskSystem = undefined;
                            this._disposeTaskSystemListeners();
                            return false; // no veto
                        }
                        else if (code && code === 3 /* TerminateResponseCode.ProcessNotFound */) {
                            return this._dialogService.confirm({
                                message: nls.localize('TaskSystem.noProcess', 'The launched task doesn\'t exist anymore. If the task spawned background processes exiting VS Code might result in orphaned processes. To avoid this start the last background process with a wait flag.'),
                                primaryButton: nls.localize({ key: 'TaskSystem.exitAnyways', comment: ['&& denotes a mnemonic'] }, "&&Exit Anyways"),
                                type: 'info'
                            }).then(res => !res.confirmed);
                        }
                        return true; // veto
                    }, (err) => {
                        return true; // veto
                    });
                }
                return true; // veto
            });
        }
    };
    exports.TaskService = TaskService;
    exports.TaskService = TaskService = __decorate([
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
        __param(11, lifecycle_1.ILifecycleService),
        __param(12, model_1.IModelService),
        __param(13, extensions_2.IExtensionService),
        __param(14, quickInput_1.IQuickInputService),
        __param(15, configurationResolver_1.IConfigurationResolverService),
        __param(16, terminal_1.ITerminalService),
        __param(17, terminal_1.ITerminalGroupService),
        __param(18, storage_1.IStorageService),
        __param(19, progress_1.IProgressService),
        __param(20, opener_1.IOpenerService),
        __param(21, dialogs_1.IDialogService),
        __param(22, notification_1.INotificationService),
        __param(23, contextkey_1.IContextKeyService),
        __param(24, environmentService_1.IWorkbenchEnvironmentService),
        __param(25, terminal_2.ITerminalProfileResolverService),
        __param(26, pathService_1.IPathService),
        __param(27, resolverService_1.ITextModelService),
        __param(28, preferences_1.IPreferencesService),
        __param(29, views_1.IViewDescriptorService),
        __param(30, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(31, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(32, log_1.ILogService),
        __param(33, themeService_1.IThemeService),
        __param(34, instantiation_1.IInstantiationService),
        __param(35, remoteAgentService_1.IRemoteAgentService),
        __param(36, accessibilitySignalService_1.IAccessibilitySignalService)
    ], TaskService);
    (0, extensions_1.registerSingleton)(taskService_1.ITaskService, TaskService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rhc2tzL2VsZWN0cm9uLXNhbmRib3gvdGFza1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBc0R6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEseUNBQW1CO1FBQ25ELFlBQW1DLG9CQUEyQyxFQUM3RCxhQUE2QixFQUM3QixhQUE2QixFQUNsQixvQkFBK0MsRUFDM0QsWUFBMkIsRUFDekIsY0FBK0IsRUFDaEMsYUFBNkIsRUFDL0IsV0FBeUIsRUFDYixjQUF3QyxFQUMvQyxnQkFBbUMsRUFDcEMsZUFBaUMsRUFDaEMsZ0JBQW1DLEVBQ3ZDLFlBQTJCLEVBQ3ZCLGdCQUFtQyxFQUNsQyxpQkFBcUMsRUFDMUIsNEJBQTJELEVBQ3hFLGVBQWlDLEVBQzVCLG9CQUEyQyxFQUNqRCxjQUErQixFQUM5QixlQUFpQyxFQUNuQyxhQUE2QixFQUM3QixhQUE2QixFQUN2QixtQkFBeUMsRUFDM0MsaUJBQXFDLEVBQzNCLGtCQUFnRCxFQUM3Qyw4QkFBK0QsRUFDbEYsV0FBeUIsRUFDcEIsd0JBQTJDLEVBQ3pDLGtCQUF1QyxFQUNwQyxxQkFBNkMsRUFDdEMsNEJBQTJELEVBQ3hELCtCQUFpRSxFQUN0RixVQUF1QixFQUNyQixZQUEyQixFQUNuQixvQkFBMkMsRUFDN0Msa0JBQXVDLEVBQy9CLDBCQUF1RDtZQUVwRixLQUFLLENBQUMsb0JBQW9CLEVBQ3pCLGFBQWEsRUFDYixhQUFhLEVBQ2Isb0JBQW9CLEVBQ3BCLFlBQVksRUFDWixjQUFjLEVBQ2QsYUFBYSxFQUNiLFdBQVcsRUFDWCxjQUFjLEVBQ2QsZ0JBQWdCLEVBQ2hCLGVBQWUsRUFDZixZQUFZLEVBQ1osZ0JBQWdCLEVB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