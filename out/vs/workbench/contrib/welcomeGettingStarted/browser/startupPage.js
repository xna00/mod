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
define(["require", "exports", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorService", "vs/base/common/errors", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/product/common/productService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/nls", "vs/workbench/services/editor/common/editorResolverService"], function (require, exports, commands_1, arrays, instantiation_1, editorService_1, errors_1, workspace_1, configuration_1, workingCopyBackup_1, lifecycle_1, files_1, resources_1, layoutService_1, gettingStartedInput_1, environmentService_1, storage_1, telemetryUtils_1, productService_1, log_1, notification_1, nls_1, editorResolverService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartupPageRunnerContribution = exports.StartupPageEditorResolverContribution = exports.restoreWalkthroughsConfigurationKey = void 0;
    exports.restoreWalkthroughsConfigurationKey = 'workbench.welcomePage.restorableWalkthroughs';
    const configurationKey = 'workbench.startupEditor';
    const oldConfigurationKey = 'workbench.welcome.enabled';
    const telemetryOptOutStorageKey = 'workbench.telemetryOptOutShown';
    let StartupPageEditorResolverContribution = class StartupPageEditorResolverContribution {
        static { this.ID = 'workbench.contrib.startupPageEditorResolver'; }
        constructor(instantiationService, editorResolverService) {
            this.instantiationService = instantiationService;
            editorResolverService.registerEditor(`${gettingStartedInput_1.GettingStartedInput.RESOURCE.scheme}:/**`, {
                id: gettingStartedInput_1.GettingStartedInput.ID,
                label: (0, nls_1.localize)('welcome.displayName', "Welcome Page"),
                priority: editorResolverService_1.RegisteredEditorPriority.builtin,
            }, {
                singlePerResource: false,
                canSupportResource: uri => uri.scheme === gettingStartedInput_1.GettingStartedInput.RESOURCE.scheme,
            }, {
                createEditorInput: ({ resource, options }) => {
                    return {
                        editor: this.instantiationService.createInstance(gettingStartedInput_1.GettingStartedInput, options),
                        options: {
                            ...options,
                            pinned: false
                        }
                    };
                }
            });
        }
    };
    exports.StartupPageEditorResolverContribution = StartupPageEditorResolverContribution;
    exports.StartupPageEditorResolverContribution = StartupPageEditorResolverContribution = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, editorResolverService_1.IEditorResolverService)
    ], StartupPageEditorResolverContribution);
    let StartupPageRunnerContribution = class StartupPageRunnerContribution {
        static { this.ID = 'workbench.contrib.startupPageRunner'; }
        constructor(configurationService, editorService, workingCopyBackupService, fileService, contextService, lifecycleService, layoutService, productService, commandService, environmentService, storageService, logService, notificationService) {
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.fileService = fileService;
            this.contextService = contextService;
            this.lifecycleService = lifecycleService;
            this.layoutService = layoutService;
            this.productService = productService;
            this.commandService = commandService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.logService = logService;
            this.notificationService = notificationService;
            this.run().then(undefined, errors_1.onUnexpectedError);
        }
        async run() {
            // Wait for resolving startup editor until we are restored to reduce startup pressure
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // Always open Welcome page for first-launch, no matter what is open or which startupEditor is set.
            if (this.productService.enableTelemetry
                && this.productService.showTelemetryOptOut
                && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) !== 0 /* TelemetryLevel.NONE */
                && !this.environmentService.skipWelcome
                && !this.storageService.get(telemetryOptOutStorageKey, 0 /* StorageScope.PROFILE */)) {
                this.storageService.store(telemetryOptOutStorageKey, true, 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
                await this.openGettingStarted(true);
                return;
            }
            if (this.tryOpenWalkthroughForFolder()) {
                return;
            }
            const enabled = isStartupPageEnabled(this.configurationService, this.contextService, this.environmentService);
            if (enabled && this.lifecycleService.startupKind !== 3 /* StartupKind.ReloadedWindow */) {
                const hasBackups = await this.workingCopyBackupService.hasBackups();
                if (hasBackups) {
                    return;
                }
                // Open the welcome even if we opened a set of default editors
                if (!this.editorService.activeEditor || this.layoutService.openedDefaultEditors) {
                    const startupEditorSetting = this.configurationService.inspect(configurationKey);
                    const isStartupEditorReadme = startupEditorSetting.value === 'readme';
                    const isStartupEditorUserReadme = startupEditorSetting.userValue === 'readme';
                    const isStartupEditorDefaultReadme = startupEditorSetting.defaultValue === 'readme';
                    // 'readme' should not be set in workspace settings to prevent tracking,
                    // but it can be set as a default (as in codespaces or from configurationDefaults) or a user setting
                    if (isStartupEditorReadme && (!isStartupEditorUserReadme || !isStartupEditorDefaultReadme)) {
                        this.logService.warn(`Warning: 'workbench.startupEditor: readme' setting ignored due to being set somewhere other than user or default settings (user=${startupEditorSetting.userValue}, default=${startupEditorSetting.defaultValue})`);
                    }
                    const openWithReadme = isStartupEditorReadme && (isStartupEditorUserReadme || isStartupEditorDefaultReadme);
                    if (openWithReadme) {
                        await this.openReadme();
                    }
                    else if (startupEditorSetting.value === 'welcomePage' || startupEditorSetting.value === 'welcomePageInEmptyWorkbench') {
                        await this.openGettingStarted();
                    }
                    else if (startupEditorSetting.value === 'terminal') {
                        this.commandService.executeCommand("workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */);
                    }
                }
            }
        }
        tryOpenWalkthroughForFolder() {
            const toRestore = this.storageService.get(exports.restoreWalkthroughsConfigurationKey, 0 /* StorageScope.PROFILE */);
            if (!toRestore) {
                return false;
            }
            else {
                const restoreData = JSON.parse(toRestore);
                const currentWorkspace = this.contextService.getWorkspace();
                if (restoreData.folder === workspace_1.UNKNOWN_EMPTY_WINDOW_WORKSPACE.id || restoreData.folder === currentWorkspace.folders[0].uri.toString()) {
                    this.editorService.openEditor({
                        resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                        options: { selectedCategory: restoreData.category, selectedStep: restoreData.step, pinned: false },
                    });
                    this.storageService.remove(exports.restoreWalkthroughsConfigurationKey, 0 /* StorageScope.PROFILE */);
                    return true;
                }
            }
            return false;
        }
        async openReadme() {
            const readmes = arrays.coalesce(await Promise.all(this.contextService.getWorkspace().folders.map(async (folder) => {
                const folderUri = folder.uri;
                const folderStat = await this.fileService.resolve(folderUri).catch(errors_1.onUnexpectedError);
                const files = folderStat?.children ? folderStat.children.map(child => child.name).sort() : [];
                const file = files.find(file => file.toLowerCase() === 'readme.md') || files.find(file => file.toLowerCase().startsWith('readme'));
                if (file) {
                    return (0, resources_1.joinPath)(folderUri, file);
                }
                else {
                    return undefined;
                }
            })));
            if (!this.editorService.activeEditor) {
                if (readmes.length) {
                    const isMarkDown = (readme) => readme.path.toLowerCase().endsWith('.md');
                    await Promise.all([
                        this.commandService.executeCommand('markdown.showPreview', null, readmes.filter(isMarkDown), { locked: true }).catch(error => {
                            this.notificationService.error((0, nls_1.localize)('startupPage.markdownPreviewError', 'Could not open markdown preview: {0}.\n\nPlease make sure the markdown extension is enabled.', error.message));
                        }),
                        this.editorService.openEditors(readmes.filter(readme => !isMarkDown(readme)).map(readme => ({ resource: readme }))),
                    ]);
                }
                else {
                    // If no readme is found, default to showing the welcome page.
                    await this.openGettingStarted();
                }
            }
        }
        async openGettingStarted(showTelemetryNotice) {
            const startupEditorTypeID = gettingStartedInput_1.gettingStartedInputTypeId;
            const editor = this.editorService.activeEditor;
            // Ensure that the welcome editor won't get opened more than once
            if (editor?.typeId === startupEditorTypeID || this.editorService.editors.some(e => e.typeId === startupEditorTypeID)) {
                return;
            }
            const options = editor ? { pinned: false, index: 0 } : { pinned: false };
            if (startupEditorTypeID === gettingStartedInput_1.gettingStartedInputTypeId) {
                this.editorService.openEditor({
                    resource: gettingStartedInput_1.GettingStartedInput.RESOURCE,
                    options: { showTelemetryNotice, ...options },
                });
            }
        }
    };
    exports.StartupPageRunnerContribution = StartupPageRunnerContribution;
    exports.StartupPageRunnerContribution = StartupPageRunnerContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, editorService_1.IEditorService),
        __param(2, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(3, files_1.IFileService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, lifecycle_1.ILifecycleService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, productService_1.IProductService),
        __param(8, commands_1.ICommandService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, storage_1.IStorageService),
        __param(11, log_1.ILogService),
        __param(12, notification_1.INotificationService)
    ], StartupPageRunnerContribution);
    function isStartupPageEnabled(configurationService, contextService, environmentService) {
        if (environmentService.skipWelcome) {
            return false;
        }
        const startupEditor = configurationService.inspect(configurationKey);
        if (!startupEditor.userValue && !startupEditor.workspaceValue) {
            const welcomeEnabled = configurationService.inspect(oldConfigurationKey);
            if (welcomeEnabled.value !== undefined && welcomeEnabled.value !== null) {
                return welcomeEnabled.value;
            }
        }
        return startupEditor.value === 'welcomePage'
            || startupEditor.value === 'readme' && (startupEditor.userValue === 'readme' || startupEditor.defaultValue === 'readme')
            || (contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && startupEditor.value === 'welcomePageInEmptyWorkbench')
            || startupEditor.value === 'terminal';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhcnR1cFBhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3dlbGNvbWVHZXR0aW5nU3RhcnRlZC9icm93c2VyL3N0YXJ0dXBQYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZCbkYsUUFBQSxtQ0FBbUMsR0FBRyw4Q0FBOEMsQ0FBQztJQUdsRyxNQUFNLGdCQUFnQixHQUFHLHlCQUF5QixDQUFDO0lBQ25ELE1BQU0sbUJBQW1CLEdBQUcsMkJBQTJCLENBQUM7SUFDeEQsTUFBTSx5QkFBeUIsR0FBRyxnQ0FBZ0MsQ0FBQztJQUU1RCxJQUFNLHFDQUFxQyxHQUEzQyxNQUFNLHFDQUFxQztpQkFFakMsT0FBRSxHQUFHLDZDQUE2QyxBQUFoRCxDQUFpRDtRQUVuRSxZQUN5QyxvQkFBMkMsRUFDM0QscUJBQTZDO1lBRDdCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFHbkYscUJBQXFCLENBQUMsY0FBYyxDQUNuQyxHQUFHLHlDQUFtQixDQUFDLFFBQVEsQ0FBQyxNQUFNLE1BQU0sRUFDNUM7Z0JBQ0MsRUFBRSxFQUFFLHlDQUFtQixDQUFDLEVBQUU7Z0JBQzFCLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxjQUFjLENBQUM7Z0JBQ3RELFFBQVEsRUFBRSxnREFBd0IsQ0FBQyxPQUFPO2FBQzFDLEVBQ0Q7Z0JBQ0MsaUJBQWlCLEVBQUUsS0FBSztnQkFDeEIsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxLQUFLLHlDQUFtQixDQUFDLFFBQVEsQ0FBQyxNQUFNO2FBQzdFLEVBQ0Q7Z0JBQ0MsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO29C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