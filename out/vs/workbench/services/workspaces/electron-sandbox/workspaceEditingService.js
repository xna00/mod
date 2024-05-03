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
define(["require", "exports", "vs/nls", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/uri", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/commands/common/commands", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService", "vs/platform/native/common/native", "vs/base/common/platform", "vs/workbench/services/workingCopy/common/workingCopyBackupService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/configuration/common/configuration", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, nls_1, workspaceEditing_1, uri_1, workspace_1, jsonEditing_1, workspaces_1, storage_1, extensions_1, workingCopyBackup_1, commands_1, resources_1, notification_1, files_1, environmentService_1, lifecycle_1, dialogs_1, extensions_2, label_1, textfiles_1, host_1, abstractWorkspaceEditingService_1, native_1, platform_1, workingCopyBackupService_1, uriIdentity_1, workspaceTrust_1, configuration_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkspaceEditingService = void 0;
    let NativeWorkspaceEditingService = class NativeWorkspaceEditingService extends abstractWorkspaceEditingService_1.AbstractWorkspaceEditingService {
        constructor(jsonEditingService, contextService, nativeHostService, configurationService, storageService, extensionService, workingCopyBackupService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, lifecycleService, labelService, hostService, uriIdentityService, workspaceTrustManagementService, userDataProfilesService, userDataProfileService) {
            super(jsonEditingService, contextService, configurationService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService, uriIdentityService, workspaceTrustManagementService, userDataProfilesService, userDataProfileService);
            this.nativeHostService = nativeHostService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.lifecycleService = lifecycleService;
            this.labelService = labelService;
            this.registerListeners();
        }
        registerListeners() {
            this.lifecycleService.onBeforeShutdown(e => {
                const saveOperation = this.saveUntitledBeforeShutdown(e.reason);
                e.veto(saveOperation, 'veto.untitledWorkspace');
            });
        }
        async saveUntitledBeforeShutdown(reason) {
            if (reason !== 4 /* ShutdownReason.LOAD */ && reason !== 1 /* ShutdownReason.CLOSE */) {
                return false; // only interested when window is closing or loading
            }
            const workspaceIdentifier = this.getCurrentWorkspaceIdentifier();
            if (!workspaceIdentifier || !(0, workspace_1.isUntitledWorkspace)(workspaceIdentifier.configPath, this.environmentService)) {
                return false; // only care about untitled workspaces to ask for saving
            }
            const windowCount = await this.nativeHostService.getWindowCount();
            if (reason === 1 /* ShutdownReason.CLOSE */ && !platform_1.isMacintosh && windowCount === 1) {
                return false; // Windows/Linux: quits when last window is closed, so do not ask then
            }
            const confirmSaveUntitledWorkspace = this.configurationService.getValue('window.confirmSaveUntitledWorkspace') !== false;
            if (!confirmSaveUntitledWorkspace) {
                await this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                return false; // no confirmation configured
            }
            let canceled = false;
            const { result, checkboxChecked } = await this.dialogService.prompt({
                type: notification_1.Severity.Warning,
                message: (0, nls_1.localize)('saveWorkspaceMessage', "Do you want to save your workspace configuration as a file?"),
                detail: (0, nls_1.localize)('saveWorkspaceDetail', "Save your workspace if you plan to open it again."),
                buttons: [
                    {
                        label: (0, nls_1.localize)({ key: 'save', comment: ['&& denotes a mnemonic'] }, "&&Save"),
                        run: async () => {
                            const newWorkspacePath = await this.pickNewWorkspacePath();
                            if (!newWorkspacePath || !(0, workspace_1.hasWorkspaceFileExtension)(newWorkspacePath)) {
                                return true; // keep veto if no target was provided
                            }
                            try {
                                await this.saveWorkspaceAs(workspaceIdentifier, newWorkspacePath);
                                // Make sure to add the new workspace to the history to find it again
                                const newWorkspaceIdentifier = await this.workspacesService.getWorkspaceIdentifier(newWorkspacePath);
                                await this.workspacesService.addRecentlyOpened([{
                                        label: this.labelService.getWorkspaceLabel(newWorkspaceIdentifier, { verbose: 2 /* Verbosity.LONG */ }),
                                        workspace: newWorkspaceIdentifier,
                                        remoteAuthority: this.environmentService.remoteAuthority // remember whether this was a remote window
                                    }]);
                                // Delete the untitled one
                                await this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                            }
                            catch (error) {
                                // ignore
                            }
                            return false;
                        }
                    },
                    {
                        label: (0, nls_1.localize)({ key: 'doNotSave', comment: ['&& denotes a mnemonic'] }, "Do&&n't Save"),
                        run: async () => {
                            await this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                            return false;
                        }
                    }
                ],
                cancelButton: {
                    run: () => {
                        canceled = true;
                        return true; // veto
                    }
                },
                checkbox: {
                    label: (0, nls_1.localize)('doNotAskAgain', "Always discard untitled workspaces without asking")
                }
            });
            if (!canceled && checkboxChecked) {
                await this.configurationService.updateValue('window.confirmSaveUntitledWorkspace', false, 2 /* ConfigurationTarget.USER */);
            }
            return result;
        }
        async isValidTargetWorkspacePath(workspaceUri) {
            const windows = await this.nativeHostService.getWindows({ includeAuxiliaryWindows: false });
            // Prevent overwriting a workspace that is currently opened in another window
            if (windows.some(window => (0, workspace_1.isWorkspaceIdentifier)(window.workspace) && this.uriIdentityService.extUri.isEqual(window.workspace.configPath, workspaceUri))) {
                await this.dialogService.info((0, nls_1.localize)('workspaceOpenedMessage', "Unable to save workspace '{0}'", (0, resources_1.basename)(workspaceUri)), (0, nls_1.localize)('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again."));
                return false;
            }
            return true; // OK
        }
        async enterWorkspace(workspaceUri) {
            const stopped = await this.extensionService.stopExtensionHosts((0, nls_1.localize)('restartExtensionHost.reason', "Opening a multi-root workspace."));
            if (!stopped) {
                return;
            }
            const result = await this.doEnterWorkspace(workspaceUri);
            if (result) {
                // Migrate storage to new workspace
                await this.storageService.switch(result.workspace, true /* preserve data */);
                // Reinitialize backup service
                if (this.workingCopyBackupService instanceof workingCopyBackupService_1.WorkingCopyBackupService) {
                    const newBackupWorkspaceHome = result.backupPath ? uri_1.URI.file(result.backupPath).with({ scheme: this.environmentService.userRoamingDataHome.scheme }) : undefined;
                    this.workingCopyBackupService.reinitialize(newBackupWorkspaceHome);
                }
            }
            // TODO@aeschli: workaround until restarting works
            if (this.environmentService.remoteAuthority) {
                this.hostService.reload();
            }
            // Restart the extension host: entering a workspace means a new location for
            // storage and potentially a change in the workspace.rootPath property.
            else {
                this.extensionService.startExtensionHosts();
            }
        }
    };
    exports.NativeWorkspaceEditingService = NativeWorkspaceEditingService;
    exports.NativeWorkspaceEditingService = NativeWorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, native_1.INativeHostService),
        __param(3, configuration_1.IWorkbenchConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, extensions_1.IExtensionService),
        __param(6, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(7, notification_1.INotificationService),
        __param(8, commands_1.ICommandService),
        __param(9, files_1.IFileService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, workspaces_1.IWorkspacesService),
        __param(12, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(13, dialogs_1.IFileDialogService),
        __param(14, dialogs_1.IDialogService),
        __param(15, lifecycle_1.ILifecycleService),
        __param(16, label_1.ILabelService),
        __param(17, host_1.IHostService),
        __param(18, uriIdentity_1.IUriIdentityService),
        __param(19, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(20, userDataProfile_1.IUserDataProfilesService),
        __param(21, userDataProfile_2.IUserDataProfileService)
    ], NativeWorkspaceEditingService);
    (0, extensions_2.registerSingleton)(workspaceEditing_1.IWorkspaceEditingService, NativeWorkspaceEditingService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlRWRpdGluZ1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy93b3Jrc3BhY2VzL2VsZWN0cm9uLXNhbmRib3gvd29ya3NwYWNlRWRpdGluZ1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0N6RixJQUFNLDZCQUE2QixHQUFuQyxNQUFNLDZCQUE4QixTQUFRLGlFQUErQjtRQUVqRixZQUNzQixrQkFBdUMsRUFDbEMsY0FBZ0MsRUFDOUIsaUJBQXFDLEVBQ2pDLG9CQUFvRCxFQUMzRCxjQUErQixFQUM3QixnQkFBbUMsRUFDM0Isd0JBQW1ELEVBQ2hFLG1CQUF5QyxFQUM5QyxjQUErQixFQUNsQyxXQUF5QixFQUNyQixlQUFpQyxFQUMvQixpQkFBcUMsRUFDckIsa0JBQXNELEVBQ3RFLGlCQUFxQyxFQUN6QyxhQUE2QixFQUNULGdCQUFtQyxFQUN2QyxZQUEyQixFQUM3QyxXQUF5QixFQUNsQixrQkFBdUMsRUFDMUIsK0JBQWlFLEVBQ3pFLHVCQUFpRCxFQUNsRCxzQkFBK0M7WUFFeEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLCtCQUErQixFQUFFLHVCQUF1QixFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFyQm5TLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFFeEMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzdCLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDM0IsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQVNsRCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQW1CO1lBQ3ZDLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBUzNELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFTyxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUMxQyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoRSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVPLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxNQUFzQjtZQUM5RCxJQUFJLE1BQU0sZ0NBQXdCLElBQUksTUFBTSxpQ0FBeUIsRUFBRSxDQUFDO2dCQUN2RSxPQUFPLEtBQUssQ0FBQyxDQUFDLG9EQUFvRDtZQUNuRSxDQUFDO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsQ0FBQztZQUNqRSxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFBLCtCQUFtQixFQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO2dCQUMzRyxPQUFPLEtBQUssQ0FBQyxDQUFDLHdEQUF3RDtZQUN2RSxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbEUsSUFBSSxNQUFNLGlDQUF5QixJQUFJLENBQUMsc0JBQVcsSUFBSSxXQUFXLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzFFLE9BQU8sS0FBSyxDQUFDLENBQUMsc0VBQXNFO1lBQ3JGLENBQUM7WUFFRCxNQUFNLDRCQUE0QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUscUNBQXFDLENBQUMsS0FBSyxLQUFLLENBQUM7WUFDbEksSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7Z0JBQ25DLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLG1CQUFtQixDQUFDLENBQUM7Z0JBRTFFLE9BQU8sS0FBSyxDQUFDLENBQUMsNkJBQTZCO1lBQzVDLENBQUM7WUFFRCxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDckIsTUFBTSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFVO2dCQUM1RSxJQUFJLEVBQUUsdUJBQVEsQ0FBQyxPQUFPO2dCQUN0QixPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsNkRBQTZELENBQUM7Z0JBQ3hHLE1BQU0sRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxtREFBbUQsQ0FBQztnQkFDNUYsT0FBTyxFQUFFO29CQUNSO3dCQUNDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQzt3QkFDOUUsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFOzRCQUNmLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQzs0QkFDM0QsSUFBSSxDQUFDLGdCQUFnQixJQUFJLENBQUMsSUFBQSxxQ0FBeUIsRUFBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7Z0NBQ3ZFLE9BQU8sSUFBSSxDQUFDLENBQUMsc0NBQXNDOzRCQUNwRCxDQUFDOzRCQUVELElBQUksQ0FBQztnQ0FDSixNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztnQ0FFbEUscUVBQXFFO2dDQUNyRSxNQUFNLHNCQUFzQixHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0NBQ3JHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixDQUFDLENBQUM7d0NBQy9DLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLHNCQUFzQixFQUFFLEVBQUUsT0FBTyx3QkFBZ0IsRUFBRSxDQUFDO3dDQUMvRixTQUFTLEVBQUUsc0JBQXNCO3dDQUNqQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyw0Q0FBNEM7cUNBQ3JHLENBQUMsQ0FBQyxDQUFDO2dDQUVKLDBCQUEwQjtnQ0FDMUIsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs0QkFDM0UsQ0FBQzs0QkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dDQUNoQixTQUFTOzRCQUNWLENBQUM7NEJBRUQsT0FBTyxLQUFLLENBQUM7d0JBQ2QsQ0FBQztxQkFDRDtvQkFDRDt3QkFDQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxjQUFjLENBQUM7d0JBQ3pGLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRTs0QkFDZixNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyx1QkFBdUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOzRCQUUxRSxPQUFPLEtBQUssQ0FBQzt3QkFDZCxDQUFDO3FCQUNEO2lCQUNEO2dCQUNELFlBQVksRUFBRTtvQkFDYixHQUFHLEVBQUUsR0FBRyxFQUFFO3dCQUNULFFBQVEsR0FBRyxJQUFJLENBQUM7d0JBRWhCLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTztvQkFDckIsQ0FBQztpQkFDRDtnQkFDRCxRQUFRLEVBQUU7b0JBQ1QsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxtREFBbUQsQ0FBQztpQkFDckY7YUFDRCxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsUUFBUSxJQUFJLGVBQWUsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMscUNBQXFDLEVBQUUsS0FBSyxtQ0FBMkIsQ0FBQztZQUNySCxDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO1FBRVEsS0FBSyxDQUFDLDBCQUEwQixDQUFDLFlBQWlCO1lBQzFELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxFQUFFLHVCQUF1QixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFFNUYsNkVBQTZFO1lBQzdFLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsaUNBQXFCLEVBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDMUosTUFBTSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FDNUIsSUFBQSxjQUFRLEVBQUMsd0JBQXdCLEVBQUUsZ0NBQWdDLEVBQUUsSUFBQSxvQkFBUSxFQUFDLFlBQVksQ0FBQyxDQUFDLEVBQzVGLElBQUEsY0FBUSxFQUFDLHVCQUF1QixFQUFFLHVHQUF1RyxDQUFDLENBQzFJLENBQUM7Z0JBRUYsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLO1FBQ25CLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQWlCO1lBQ3JDLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLGlDQUFpQyxDQUFDLENBQUMsQ0FBQztZQUMzSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN6RCxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUVaLG1DQUFtQztnQkFDbkMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUU3RSw4QkFBOEI7Z0JBQzlCLElBQUksSUFBSSxDQUFDLHdCQUF3QixZQUFZLG1EQUF3QixFQUFFLENBQUM7b0JBQ3ZFLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7b0JBQ2hLLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDcEUsQ0FBQztZQUNGLENBQUM7WUFFRCxrREFBa0Q7WUFDbEQsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZUFBZSxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUVELDRFQUE0RTtZQUM1RSx1RUFBdUU7aUJBQ2xFLENBQUM7Z0JBQ0wsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDN0MsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFBO0lBeEtZLHNFQUE2Qjs0Q0FBN0IsNkJBQTZCO1FBR3ZDLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxvQ0FBd0IsQ0FBQTtRQUN4QixXQUFBLDJCQUFrQixDQUFBO1FBQ2xCLFdBQUEsOENBQThCLENBQUE7UUFDOUIsV0FBQSx5QkFBZSxDQUFBO1FBQ2YsV0FBQSw4QkFBaUIsQ0FBQTtRQUNqQixXQUFBLDZDQUF5QixDQUFBO1FBQ3pCLFdBQUEsbUNBQW9CLENBQUE7UUFDcEIsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxvQkFBWSxDQUFBO1FBQ1osWUFBQSw0QkFBZ0IsQ0FBQTtRQUNoQixZQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFlBQUEsdURBQWtDLENBQUE7UUFDbEMsWUFBQSw0QkFBa0IsQ0FBQTtRQUNsQixZQUFBLHdCQUFjLENBQUE7UUFDZCxZQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFlBQUEscUJBQWEsQ0FBQTtRQUNiLFlBQUEsbUJBQVksQ0FBQTtRQUNaLFlBQUEsaUNBQW1CLENBQUE7UUFDbkIsWUFBQSxpREFBZ0MsQ0FBQTtRQUNoQyxZQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFlBQUEseUNBQXVCLENBQUE7T0F4QmIsNkJBQTZCLENBd0t6QztJQUVELElBQUEsOEJBQWlCLEVBQUMsMkNBQXdCLEVBQUUsNkJBQTZCLG9DQUE0QixDQUFDIn0=