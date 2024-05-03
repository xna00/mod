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
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/platform/dialogs/common/dialogs", "vs/base/common/labels", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/base/common/network", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/configuration/common/configuration", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/userDataProfile/common/userDataProfile"], function (require, exports, nls_1, workspace_1, jsonEditing_1, workspaces_1, configurationRegistry_1, platform_1, commands_1, arrays_1, resources_1, notification_1, files_1, environmentService_1, dialogs_1, labels_1, textfiles_1, host_1, network_1, uriIdentity_1, workspaceTrust_1, configuration_1, userDataProfile_1, userDataProfile_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractWorkspaceEditingService = void 0;
    let AbstractWorkspaceEditingService = class AbstractWorkspaceEditingService {
        constructor(jsonEditingService, contextService, configurationService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService, uriIdentityService, workspaceTrustManagementService, userDataProfilesService, userDataProfileService) {
            this.jsonEditingService = jsonEditingService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.workspacesService = workspacesService;
            this.environmentService = environmentService;
            this.fileDialogService = fileDialogService;
            this.dialogService = dialogService;
            this.hostService = hostService;
            this.uriIdentityService = uriIdentityService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataProfileService = userDataProfileService;
        }
        async pickNewWorkspacePath() {
            const availableFileSystems = [network_1.Schemas.file];
            if (this.environmentService.remoteAuthority) {
                availableFileSystems.unshift(network_1.Schemas.vscodeRemote);
            }
            let workspacePath = await this.fileDialogService.showSaveDialog({
                saveLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)('save', "Save")),
                title: (0, nls_1.localize)('saveWorkspace', "Save Workspace"),
                filters: workspace_1.WORKSPACE_FILTER,
                defaultUri: (0, resources_1.joinPath)(await this.fileDialogService.defaultWorkspacePath(), this.getNewWorkspaceName()),
                availableFileSystems
            });
            if (!workspacePath) {
                return; // canceled
            }
            if (!(0, workspace_1.hasWorkspaceFileExtension)(workspacePath)) {
                // Always ensure we have workspace file extension
                // (see https://github.com/microsoft/vscode/issues/84818)
                workspacePath = workspacePath.with({ path: `${workspacePath.path}.${workspace_1.WORKSPACE_EXTENSION}` });
            }
            return workspacePath;
        }
        getNewWorkspaceName() {
            // First try with existing workspace name
            const configPathURI = this.getCurrentWorkspaceIdentifier()?.configPath;
            if (configPathURI && (0, workspace_1.isSavedWorkspace)(configPathURI, this.environmentService)) {
                return (0, resources_1.basename)(configPathURI);
            }
            // Then fallback to first folder if any
            const folder = (0, arrays_1.firstOrDefault)(this.contextService.getWorkspace().folders);
            if (folder) {
                return `${(0, resources_1.basename)(folder.uri)}.${workspace_1.WORKSPACE_EXTENSION}`;
            }
            // Finally pick a good default
            return `workspace.${workspace_1.WORKSPACE_EXTENSION}`;
        }
        async updateFolders(index, deleteCount, foldersToAddCandidates, donotNotifyError) {
            const folders = this.contextService.getWorkspace().folders;
            let foldersToDelete = [];
            if (typeof deleteCount === 'number') {
                foldersToDelete = folders.slice(index, index + deleteCount).map(folder => folder.uri);
            }
            let foldersToAdd = [];
            if (Array.isArray(foldersToAddCandidates)) {
                foldersToAdd = foldersToAddCandidates.map(folderToAdd => ({ uri: (0, resources_1.removeTrailingPathSeparator)(folderToAdd.uri), name: folderToAdd.name })); // Normalize
            }
            const wantsToDelete = foldersToDelete.length > 0;
            const wantsToAdd = foldersToAdd.length > 0;
            if (!wantsToAdd && !wantsToDelete) {
                return; // return early if there is nothing to do
            }
            // Add Folders
            if (wantsToAdd && !wantsToDelete) {
                return this.doAddFolders(foldersToAdd, index, donotNotifyError);
            }
            // Delete Folders
            if (wantsToDelete && !wantsToAdd) {
                return this.removeFolders(foldersToDelete);
            }
            // Add & Delete Folders
            else {
                // if we are in single-folder state and the folder is replaced with
                // other folders, we handle this specially and just enter workspace
                // mode with the folders that are being added.
                if (this.includesSingleFolderWorkspace(foldersToDelete)) {
                    return this.createAndEnterWorkspace(foldersToAdd);
                }
                // if we are not in workspace-state, we just add the folders
                if (this.contextService.getWorkbenchState() !== 3 /* WorkbenchState.WORKSPACE */) {
                    return this.doAddFolders(foldersToAdd, index, donotNotifyError);
                }
                // finally, update folders within the workspace
                return this.doUpdateFolders(foldersToAdd, foldersToDelete, index, donotNotifyError);
            }
        }
        async doUpdateFolders(foldersToAdd, foldersToDelete, index, donotNotifyError = false) {
            try {
                await this.contextService.updateFolders(foldersToAdd, foldersToDelete, index);
            }
            catch (error) {
                if (donotNotifyError) {
                    throw error;
                }
                this.handleWorkspaceConfigurationEditingError(error);
            }
        }
        addFolders(foldersToAddCandidates, donotNotifyError = false) {
            // Normalize
            const foldersToAdd = foldersToAddCandidates.map(folderToAdd => ({ uri: (0, resources_1.removeTrailingPathSeparator)(folderToAdd.uri), name: folderToAdd.name }));
            return this.doAddFolders(foldersToAdd, undefined, donotNotifyError);
        }
        async doAddFolders(foldersToAdd, index, donotNotifyError = false) {
            const state = this.contextService.getWorkbenchState();
            const remoteAuthority = this.environmentService.remoteAuthority;
            if (remoteAuthority) {
                // https://github.com/microsoft/vscode/issues/94191
                foldersToAdd = foldersToAdd.filter(folder => folder.uri.scheme !== network_1.Schemas.file && (folder.uri.scheme !== network_1.Schemas.vscodeRemote || (0, resources_1.isEqualAuthority)(folder.uri.authority, remoteAuthority)));
            }
            // If we are in no-workspace or single-folder workspace, adding folders has to
            // enter a workspace.
            if (state !== 3 /* WorkbenchState.WORKSPACE */) {
                let newWorkspaceFolders = this.contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                newWorkspaceFolders.splice(typeof index === 'number' ? index : newWorkspaceFolders.length, 0, ...foldersToAdd);
                newWorkspaceFolders = (0, arrays_1.distinct)(newWorkspaceFolders, folder => this.uriIdentityService.extUri.getComparisonKey(folder.uri));
                if (state === 1 /* WorkbenchState.EMPTY */ && newWorkspaceFolders.length === 0 || state === 2 /* WorkbenchState.FOLDER */ && newWorkspaceFolders.length === 1) {
                    return; // return if the operation is a no-op for the current state
                }
                return this.createAndEnterWorkspace(newWorkspaceFolders);
            }
            // Delegate addition of folders to workspace service otherwise
            try {
                await this.contextService.addFolders(foldersToAdd, index);
            }
            catch (error) {
                if (donotNotifyError) {
                    throw error;
                }
                this.handleWorkspaceConfigurationEditingError(error);
            }
        }
        async removeFolders(foldersToRemove, donotNotifyError = false) {
            // If we are in single-folder state and the opened folder is to be removed,
            // we create an empty workspace and enter it.
            if (this.includesSingleFolderWorkspace(foldersToRemove)) {
                return this.createAndEnterWorkspace([]);
            }
            // Delegate removal of folders to workspace service otherwise
            try {
                await this.contextService.removeFolders(foldersToRemove);
            }
            catch (error) {
                if (donotNotifyError) {
                    throw error;
                }
                this.handleWorkspaceConfigurationEditingError(error);
            }
        }
        includesSingleFolderWorkspace(folders) {
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceFolder = this.contextService.getWorkspace().folders[0];
                return (folders.some(folder => this.uriIdentityService.extUri.isEqual(folder, workspaceFolder.uri)));
            }
            return false;
        }
        async createAndEnterWorkspace(folders, path) {
            if (path && !await this.isValidTargetWorkspacePath(path)) {
                return;
            }
            const remoteAuthority = this.environmentService.remoteAuthority;
            const untitledWorkspace = await this.workspacesService.createUntitledWorkspace(folders, remoteAuthority);
            if (path) {
                try {
                    await this.saveWorkspaceAs(untitledWorkspace, path);
                }
                finally {
                    await this.workspacesService.deleteUntitledWorkspace(untitledWorkspace); // https://github.com/microsoft/vscode/issues/100276
                }
            }
            else {
                path = untitledWorkspace.configPath;
                if (!this.userDataProfileService.currentProfile.isDefault) {
                    await this.userDataProfilesService.setProfileForWorkspace(untitledWorkspace, this.userDataProfileService.currentProfile);
                }
            }
            return this.enterWorkspace(path);
        }
        async saveAndEnterWorkspace(workspaceUri) {
            const workspaceIdentifier = this.getCurrentWorkspaceIdentifier();
            if (!workspaceIdentifier) {
                return;
            }
            // Allow to save the workspace of the current window
            // if we have an identical match on the path
            if ((0, resources_1.isEqual)(workspaceIdentifier.configPath, workspaceUri)) {
                return this.saveWorkspace(workspaceIdentifier);
            }
            // From this moment on we require a valid target that is not opened already
            if (!await this.isValidTargetWorkspacePath(workspaceUri)) {
                return;
            }
            await this.saveWorkspaceAs(workspaceIdentifier, workspaceUri);
            return this.enterWorkspace(workspaceUri);
        }
        async isValidTargetWorkspacePath(workspaceUri) {
            return true; // OK
        }
        async saveWorkspaceAs(workspace, targetConfigPathURI) {
            const configPathURI = workspace.configPath;
            const isNotUntitledWorkspace = !(0, workspace_1.isUntitledWorkspace)(targetConfigPathURI, this.environmentService);
            if (isNotUntitledWorkspace && !this.userDataProfileService.currentProfile.isDefault) {
                const newWorkspace = await this.workspacesService.getWorkspaceIdentifier(targetConfigPathURI);
                await this.userDataProfilesService.setProfileForWorkspace(newWorkspace, this.userDataProfileService.currentProfile);
            }
            // Return early if target is same as source
            if (this.uriIdentityService.extUri.isEqual(configPathURI, targetConfigPathURI)) {
                return;
            }
            const isFromUntitledWorkspace = (0, workspace_1.isUntitledWorkspace)(configPathURI, this.environmentService);
            // Read the contents of the workspace file, update it to new location and save it.
            const raw = await this.fileService.readFile(configPathURI);
            const newRawWorkspaceContents = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(raw.value.toString(), configPathURI, isFromUntitledWorkspace, targetConfigPathURI, this.uriIdentityService.extUri);
            await this.textFileService.create([{ resource: targetConfigPathURI, value: newRawWorkspaceContents, options: { overwrite: true } }]);
            // Set trust for the workspace file
            await this.trustWorkspaceConfiguration(targetConfigPathURI);
        }
        async saveWorkspace(workspace) {
            const configPathURI = workspace.configPath;
            // First: try to save any existing model as it could be dirty
            const existingModel = this.textFileService.files.get(configPathURI);
            if (existingModel) {
                await existingModel.save({ force: true, reason: 1 /* SaveReason.EXPLICIT */ });
                return;
            }
            // Second: if the file exists on disk, simply return
            const workspaceFileExists = await this.fileService.exists(configPathURI);
            if (workspaceFileExists) {
                return;
            }
            // Finally, we need to re-create the file as it was deleted
            const newWorkspace = { folders: [] };
            const newRawWorkspaceContents = (0, workspaces_1.rewriteWorkspaceFileForNewLocation)(JSON.stringify(newWorkspace, null, '\t'), configPathURI, false, configPathURI, this.uriIdentityService.extUri);
            await this.textFileService.create([{ resource: configPathURI, value: newRawWorkspaceContents }]);
        }
        handleWorkspaceConfigurationEditingError(error) {
            switch (error.code) {
                case 0 /* JSONEditingErrorCode.ERROR_INVALID_FILE */:
                    this.onInvalidWorkspaceConfigurationFileError();
                    break;
                default:
                    this.notificationService.error(error.message);
            }
        }
        onInvalidWorkspaceConfigurationFileError() {
            const message = (0, nls_1.localize)('errorInvalidTaskConfiguration', "Unable to write into workspace configuration file. Please open the file to correct errors/warnings in it and try again.");
            this.askToOpenWorkspaceConfigurationFile(message);
        }
        askToOpenWorkspaceConfigurationFile(message) {
            this.notificationService.prompt(notification_1.Severity.Error, message, [{
                    label: (0, nls_1.localize)('openWorkspaceConfigurationFile', "Open Workspace Configuration"),
                    run: () => this.commandService.executeCommand('workbench.action.openWorkspaceConfigFile')
                }]);
        }
        async doEnterWorkspace(workspaceUri) {
            if (!!this.environmentService.extensionTestsLocationURI) {
                throw new Error('Entering a new workspace is not possible in tests.');
            }
            const workspace = await this.workspacesService.getWorkspaceIdentifier(workspaceUri);
            // Settings migration (only if we come from a folder workspace)
            if (this.contextService.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                await this.migrateWorkspaceSettings(workspace);
            }
            await this.configurationService.initialize(workspace);
            return this.workspacesService.enterWorkspace(workspaceUri);
        }
        migrateWorkspaceSettings(toWorkspace) {
            return this.doCopyWorkspaceSettings(toWorkspace, setting => setting.scope === 3 /* ConfigurationScope.WINDOW */);
        }
        copyWorkspaceSettings(toWorkspace) {
            return this.doCopyWorkspaceSettings(toWorkspace);
        }
        doCopyWorkspaceSettings(toWorkspace, filter) {
            const configurationProperties = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const targetWorkspaceConfiguration = {};
            for (const key of this.configurationService.keys().workspace) {
                if (configurationProperties[key]) {
                    if (filter && !filter(configurationProperties[key])) {
                        continue;
                    }
                    targetWorkspaceConfiguration[key] = this.configurationService.inspect(key).workspaceValue;
                }
            }
            return this.jsonEditingService.write(toWorkspace.configPath, [{ path: ['settings'], value: targetWorkspaceConfiguration }], true);
        }
        async trustWorkspaceConfiguration(configPathURI) {
            if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ && this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                await this.workspaceTrustManagementService.setUrisTrust([configPathURI], true);
            }
        }
        getCurrentWorkspaceIdentifier() {
            const identifier = (0, workspace_1.toWorkspaceIdentifier)(this.contextService.getWorkspace());
            if ((0, workspace_1.isWorkspaceIdentifier)(identifier)) {
                return identifier;
            }
            return undefined;
        }
    };
    exports.AbstractWorkspaceEditingService = AbstractWorkspaceEditingService;
    exports.AbstractWorkspaceEditingService = AbstractWorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IWorkbenchConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, commands_1.ICommandService),
        __param(5, files_1.IFileService),
        __param(6, textfiles_1.ITextFileService),
        __param(7, workspaces_1.IWorkspacesService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService),
        __param(9, dialogs_1.IFileDialogService),
        __param(10, dialogs_1.IDialogService),
        __param(11, host_1.IHostService),
        __param(12, uriIdentity_1.IUriIdentityService),
        __param(13, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(14, userDataProfile_1.IUserDataProfilesService),
        __param(15, userDataProfile_2.IUserDataProfileService)
    ], AbstractWorkspaceEditingService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RXb3Jrc3BhY2VFZGl0aW5nU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtzcGFjZXMvYnJvd3Nlci9hYnN0cmFjdFdvcmtzcGFjZUVkaXRpbmdTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTZCekYsSUFBZSwrQkFBK0IsR0FBOUMsTUFBZSwrQkFBK0I7UUFJcEQsWUFDdUMsa0JBQXVDLEVBQ2hDLGNBQWdDLEVBQzFCLG9CQUFvRCxFQUNoRSxtQkFBeUMsRUFDOUMsY0FBK0IsRUFDbEMsV0FBeUIsRUFDckIsZUFBaUMsRUFDN0IsaUJBQXFDLEVBQzNCLGtCQUFnRCxFQUM1RCxpQkFBcUMsRUFDdkMsYUFBNkIsRUFDL0IsV0FBeUIsRUFDbEIsa0JBQXVDLEVBQzVCLCtCQUFpRSxFQUN6RSx1QkFBaUQsRUFDbEQsc0JBQStDO1lBZm5ELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDaEMsbUJBQWMsR0FBZCxjQUFjLENBQWtCO1lBQzFCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBZ0M7WUFDaEUsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM5QyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDbEMsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDckIsb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBQzdCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFDM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE4QjtZQUM1RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3ZDLGtCQUFhLEdBQWIsYUFBYSxDQUFnQjtZQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNsQix1QkFBa0IsR0FBbEIsa0JBQWtCLENB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