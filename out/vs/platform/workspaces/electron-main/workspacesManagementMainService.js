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
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/resources", "vs/base/node/pfs", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/node/workspaces"], function (require, exports, electron_1, event_1, json_1, lifecycle_1, network_1, path_1, resources_1, pfs_1, nls_1, backup_1, dialogMainService_1, environmentMainService_1, instantiation_1, log_1, userDataProfile_1, windowsFinder_1, workspace_1, workspaces_1, workspaces_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesManagementMainService = exports.IWorkspacesManagementMainService = void 0;
    exports.IWorkspacesManagementMainService = (0, instantiation_1.createDecorator)('workspacesManagementMainService');
    let WorkspacesManagementMainService = class WorkspacesManagementMainService extends lifecycle_1.Disposable {
        constructor(environmentMainService, logService, userDataProfilesMainService, backupMainService, dialogMainService) {
            super();
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.userDataProfilesMainService = userDataProfilesMainService;
            this.backupMainService = backupMainService;
            this.dialogMainService = dialogMainService;
            this._onDidDeleteUntitledWorkspace = this._register(new event_1.Emitter());
            this.onDidDeleteUntitledWorkspace = this._onDidDeleteUntitledWorkspace.event;
            this._onDidEnterWorkspace = this._register(new event_1.Emitter());
            this.onDidEnterWorkspace = this._onDidEnterWorkspace.event;
            this.untitledWorkspacesHome = this.environmentMainService.untitledWorkspacesHome; // local URI that contains all untitled workspaces
            this.untitledWorkspaces = [];
        }
        async initialize() {
            // Reset
            this.untitledWorkspaces = [];
            // Resolve untitled workspaces
            try {
                const untitledWorkspacePaths = (await pfs_1.Promises.readdir(this.untitledWorkspacesHome.with({ scheme: network_1.Schemas.file }).fsPath)).map(folder => (0, resources_1.joinPath)(this.untitledWorkspacesHome, folder, workspace_1.UNTITLED_WORKSPACE_NAME));
                for (const untitledWorkspacePath of untitledWorkspacePaths) {
                    const workspace = (0, workspaces_2.getWorkspaceIdentifier)(untitledWorkspacePath);
                    const resolvedWorkspace = await this.resolveLocalWorkspace(untitledWorkspacePath);
                    if (!resolvedWorkspace) {
                        await this.deleteUntitledWorkspace(workspace);
                    }
                    else {
                        this.untitledWorkspaces.push({ workspace, remoteAuthority: resolvedWorkspace.remoteAuthority });
                    }
                }
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.logService.warn(`Unable to read folders in ${this.untitledWorkspacesHome} (${error}).`);
                }
            }
        }
        resolveLocalWorkspace(uri) {
            return this.doResolveLocalWorkspace(uri, path => pfs_1.Promises.readFile(path, 'utf8'));
        }
        doResolveLocalWorkspace(uri, contentsFn) {
            if (!this.isWorkspacePath(uri)) {
                return undefined; // does not look like a valid workspace config file
            }
            if (uri.scheme !== network_1.Schemas.file) {
                return undefined;
            }
            try {
                const contents = contentsFn(uri.fsPath);
                if (contents instanceof Promise) {
                    return contents.then(value => this.doResolveWorkspace(uri, value), error => undefined /* invalid workspace */);
                }
                else {
                    return this.doResolveWorkspace(uri, contents);
                }
            }
            catch {
                return undefined; // invalid workspace
            }
        }
        isWorkspacePath(uri) {
            return (0, workspace_1.isUntitledWorkspace)(uri, this.environmentMainService) || (0, workspace_1.hasWorkspaceFileExtension)(uri);
        }
        doResolveWorkspace(path, contents) {
            try {
                const workspace = this.doParseStoredWorkspace(path, contents);
                const workspaceIdentifier = (0, workspaces_2.getWorkspaceIdentifier)(path);
                return {
                    id: workspaceIdentifier.id,
                    configPath: workspaceIdentifier.configPath,
                    folders: (0, workspaces_1.toWorkspaceFolders)(workspace.folders, workspaceIdentifier.configPath, resources_1.extUriBiasedIgnorePathCase),
                    remoteAuthority: workspace.remoteAuthority,
                    transient: workspace.transient
                };
            }
            catch (error) {
                this.logService.warn(error.toString());
            }
            return undefined;
        }
        doParseStoredWorkspace(path, contents) {
            // Parse workspace file
            const storedWorkspace = (0, json_1.parse)(contents); // use fault tolerant parser
            // Filter out folders which do not have a path or uri set
            if (storedWorkspace && Array.isArray(storedWorkspace.folders)) {
                storedWorkspace.folders = storedWorkspace.folders.filter(folder => (0, workspaces_1.isStoredWorkspaceFolder)(folder));
            }
            else {
                throw new Error(`${path.toString(true)} looks like an invalid workspace file.`);
            }
            return storedWorkspace;
        }
        async createUntitledWorkspace(folders, remoteAuthority) {
            const { workspace, storedWorkspace } = this.newUntitledWorkspace(folders, remoteAuthority);
            const configPath = workspace.configPath.fsPath;
            await pfs_1.Promises.mkdir((0, path_1.dirname)(configPath), { recursive: true });
            await pfs_1.Promises.writeFile(configPath, JSON.stringify(storedWorkspace, null, '\t'));
            this.untitledWorkspaces.push({ workspace, remoteAuthority });
            return workspace;
        }
        newUntitledWorkspace(folders = [], remoteAuthority) {
            const randomId = (Date.now() + Math.round(Math.random() * 1000)).toString();
            const untitledWorkspaceConfigFolder = (0, resources_1.joinPath)(this.untitledWorkspacesHome, randomId);
            const untitledWorkspaceConfigPath = (0, resources_1.joinPath)(untitledWorkspaceConfigFolder, workspace_1.UNTITLED_WORKSPACE_NAME);
            const storedWorkspaceFolder = [];
            for (const folder of folders) {
                storedWorkspaceFolder.push((0, workspaces_1.getStoredWorkspaceFolder)(folder.uri, true, folder.name, untitledWorkspaceConfigFolder, resources_1.extUriBiasedIgnorePathCase));
            }
            return {
                workspace: (0, workspaces_2.getWorkspaceIdentifier)(untitledWorkspaceConfigPath),
                storedWorkspace: { folders: storedWorkspaceFolder, remoteAuthority }
            };
        }
        async getWorkspaceIdentifier(configPath) {
            return (0, workspaces_2.getWorkspaceIdentifier)(configPath);
        }
        isUntitledWorkspace(workspace) {
            return (0, workspace_1.isUntitledWorkspace)(workspace.configPath, this.environmentMainService);
        }
        async deleteUntitledWorkspace(workspace) {
            if (!this.isUntitledWorkspace(workspace)) {
                return; // only supported for untitled workspaces
            }
            // Delete from disk
            await this.doDeleteUntitledWorkspace(workspace);
            // unset workspace from profiles
            if (this.userDataProfilesMainService.isEnabled()) {
                this.userDataProfilesMainService.unsetWorkspace(workspace);
            }
            // Event
            this._onDidDeleteUntitledWorkspace.fire(workspace);
        }
        async doDeleteUntitledWorkspace(workspace) {
            const configPath = (0, resources_1.originalFSPath)(workspace.configPath);
            try {
                // Delete Workspace
                await pfs_1.Promises.rm((0, path_1.dirname)(configPath));
                // Mark Workspace Storage to be deleted
                const workspaceStoragePath = (0, path_1.join)(this.environmentMainService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, workspace.id);
                if (await pfs_1.Promises.exists(workspaceStoragePath)) {
                    await pfs_1.Promises.writeFile((0, path_1.join)(workspaceStoragePath, 'obsolete'), '');
                }
                // Remove from list
                this.untitledWorkspaces = this.untitledWorkspaces.filter(untitledWorkspace => untitledWorkspace.workspace.id !== workspace.id);
            }
            catch (error) {
                this.logService.warn(`Unable to delete untitled workspace ${configPath} (${error}).`);
            }
        }
        getUntitledWorkspaces() {
            return this.untitledWorkspaces;
        }
        async enterWorkspace(window, windows, path) {
            if (!window || !window.win || !window.isReady) {
                return undefined; // return early if the window is not ready or disposed
            }
            const isValid = await this.isValidTargetWorkspacePath(window, windows, path);
            if (!isValid) {
                return undefined; // return early if the workspace is not valid
            }
            const result = await this.doEnterWorkspace(window, (0, workspaces_2.getWorkspaceIdentifier)(path));
            if (!result) {
                return undefined;
            }
            // Emit as event
            this._onDidEnterWorkspace.fire({ window, workspace: result.workspace });
            return result;
        }
        async isValidTargetWorkspacePath(window, windows, workspacePath) {
            if (!workspacePath) {
                return true;
            }
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.configPath, workspacePath)) {
                return false; // window is already opened on a workspace with that path
            }
            // Prevent overwriting a workspace that is currently opened in another window
            if ((0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(windows, workspacePath)) {
                await this.dialogMainService.showMessageBox({
                    type: 'info',
                    buttons: [(0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK")],
                    message: (0, nls_1.localize)('workspaceOpenedMessage', "Unable to save workspace '{0}'", (0, resources_1.basename)(workspacePath)),
                    detail: (0, nls_1.localize)('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again.")
                }, electron_1.BrowserWindow.getFocusedWindow() ?? undefined);
                return false;
            }
            return true; // OK
        }
        async doEnterWorkspace(window, workspace) {
            if (!window.config) {
                return undefined;
            }
            window.focus();
            // Register window for backups and migrate current backups over
            let backupPath;
            if (!window.config.extensionDevelopmentPath) {
                if (window.config.backupPath) {
                    backupPath = await this.backupMainService.registerWorkspaceBackup({ workspace, remoteAuthority: window.remoteAuthority }, window.config.backupPath);
                }
                else {
                    backupPath = this.backupMainService.registerWorkspaceBackup({ workspace, remoteAuthority: window.remoteAuthority });
                }
            }
            // if the window was opened on an untitled workspace, delete it.
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && this.isUntitledWorkspace(window.openedWorkspace)) {
                await this.deleteUntitledWorkspace(window.openedWorkspace);
            }
            // Update window configuration properly based on transition to workspace
            window.config.workspace = workspace;
            window.config.backupPath = backupPath;
            return { workspace, backupPath };
        }
    };
    exports.WorkspacesManagementMainService = WorkspacesManagementMainService;
    exports.WorkspacesManagementMainService = WorkspacesManagementMainService = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, log_1.ILogService),
        __param(2, userDataProfile_1.IUserDataProfilesMainService),
        __param(3, backup_1.IBackupMainService),
        __param(4, dialogMainService_1.IDialogMainService)
    ], WorkspacesManagementMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc01hbmFnZW1lbnRNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlcy9lbGVjdHJvbi1tYWluL3dvcmtzcGFjZXNNYW5hZ2VtZW50TWFpblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBd0JuRixRQUFBLGdDQUFnQyxHQUFHLElBQUEsK0JBQWUsRUFBbUMsaUNBQWlDLENBQUMsQ0FBQztJQTRCOUgsSUFBTSwrQkFBK0IsR0FBckMsTUFBTSwrQkFBZ0MsU0FBUSxzQkFBVTtRQWM5RCxZQUMwQixzQkFBZ0UsRUFDNUUsVUFBd0MsRUFDdkIsMkJBQTBFLEVBQ3BGLGlCQUFzRCxFQUN0RCxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFOa0MsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtZQUMzRCxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ04sZ0NBQTJCLEdBQTNCLDJCQUEyQixDQUE4QjtZQUNuRSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ3JDLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFmMUQsa0NBQTZCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBd0IsQ0FBQyxDQUFDO1lBQzVGLGlDQUE0QixHQUFnQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsS0FBSyxDQUFDO1lBRTdGLHlCQUFvQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTBCLENBQUMsQ0FBQztZQUNyRix3QkFBbUIsR0FBa0MsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQztZQUU3RSwyQkFBc0IsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsc0JBQXNCLENBQUMsQ0FB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