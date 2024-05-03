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
define(["require", "exports", "crypto", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/node/pfs", "vs/platform/backup/node/backup", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/state/node/state", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/backup/common/backup", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/node/workspaces"], function (require, exports, crypto_1, extpath_1, network_1, path_1, platform_1, resources_1, pfs_1, backup_1, configuration_1, environmentMainService_1, state_1, files_1, log_1, backup_2, workspace_1, workspaces_1) {
    "use strict";
    var BackupMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackupMainService = void 0;
    let BackupMainService = class BackupMainService {
        static { BackupMainService_1 = this; }
        static { this.backupWorkspacesMetadataStorageKey = 'backupWorkspaces'; }
        constructor(environmentMainService, configurationService, logService, stateService) {
            this.environmentMainService = environmentMainService;
            this.configurationService = configurationService;
            this.logService = logService;
            this.stateService = stateService;
            this.backupHome = this.environmentMainService.backupHome;
            this.workspaces = [];
            this.folders = [];
            this.emptyWindows = [];
            // Comparers for paths and resources that will
            // - ignore path casing on Windows/macOS
            // - respect path casing on Linux
            this.backupUriComparer = resources_1.extUriBiasedIgnorePathCase;
            this.backupPathComparer = { isEqual: (pathA, pathB) => (0, extpath_1.isEqual)(pathA, pathB, !platform_1.isLinux) };
        }
        async initialize() {
            // read backup workspaces
            const serializedBackupWorkspaces = this.stateService.getItem(BackupMainService_1.backupWorkspacesMetadataStorageKey) ?? { workspaces: [], folders: [], emptyWindows: [] };
            // validate empty workspaces backups first
            this.emptyWindows = await this.validateEmptyWorkspaces(serializedBackupWorkspaces.emptyWindows);
            // validate workspace backups
            this.workspaces = await this.validateWorkspaces((0, backup_1.deserializeWorkspaceInfos)(serializedBackupWorkspaces));
            // validate folder backups
            this.folders = await this.validateFolders((0, backup_1.deserializeFolderInfos)(serializedBackupWorkspaces));
            // store metadata in case some workspaces or folders have been removed
            this.storeWorkspacesMetadata();
        }
        getWorkspaceBackups() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.workspaces.slice(0); // return a copy
        }
        getFolderBackups() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.folders.slice(0); // return a copy
        }
        isHotExitEnabled() {
            return this.getHotExitConfig() !== files_1.HotExitConfiguration.OFF;
        }
        isHotExitOnExitAndWindowClose() {
            return this.getHotExitConfig() === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE;
        }
        getHotExitConfig() {
            const config = this.configurationService.getValue();
            return config?.files?.hotExit || files_1.HotExitConfiguration.ON_EXIT;
        }
        getEmptyWindowBackups() {
            return this.emptyWindows.slice(0); // return a copy
        }
        registerWorkspaceBackup(workspaceInfo, migrateFrom) {
            if (!this.workspaces.some(workspace => workspaceInfo.workspace.id === workspace.workspace.id)) {
                this.workspaces.push(workspaceInfo);
                this.storeWorkspacesMetadata();
            }
            const backupPath = (0, path_1.join)(this.backupHome, workspaceInfo.workspace.id);
            if (migrateFrom) {
                return this.moveBackupFolder(backupPath, migrateFrom).then(() => backupPath);
            }
            return backupPath;
        }
        async moveBackupFolder(backupPath, moveFromPath) {
            // Target exists: make sure to convert existing backups to empty window backups
            if (await pfs_1.Promises.exists(backupPath)) {
                await this.convertToEmptyWindowBackup(backupPath);
            }
            // When we have data to migrate from, move it over to the target location
            if (await pfs_1.Promises.exists(moveFromPath)) {
                try {
                    await pfs_1.Promises.rename(moveFromPath, backupPath, false /* no retry */);
                }
                catch (error) {
                    this.logService.error(`Backup: Could not move backup folder to new location: ${error.toString()}`);
                }
            }
        }
        registerFolderBackup(folderInfo) {
            if (!this.folders.some(folder => this.backupUriComparer.isEqual(folderInfo.folderUri, folder.folderUri))) {
                this.folders.push(folderInfo);
                this.storeWorkspacesMetadata();
            }
            return (0, path_1.join)(this.backupHome, this.getFolderHash(folderInfo));
        }
        registerEmptyWindowBackup(emptyWindowInfo) {
            if (!this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, emptyWindowInfo.backupFolder))) {
                this.emptyWindows.push(emptyWindowInfo);
                this.storeWorkspacesMetadata();
            }
            return (0, path_1.join)(this.backupHome, emptyWindowInfo.backupFolder);
        }
        async validateWorkspaces(rootWorkspaces) {
            if (!Array.isArray(rootWorkspaces)) {
                return [];
            }
            const seenIds = new Set();
            const result = [];
            // Validate Workspaces
            for (const workspaceInfo of rootWorkspaces) {
                const workspace = workspaceInfo.workspace;
                if (!(0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                    return []; // wrong format, skip all entries
                }
                if (!seenIds.has(workspace.id)) {
                    seenIds.add(workspace.id);
                    const backupPath = (0, path_1.join)(this.backupHome, workspace.id);
                    const hasBackups = await this.doHasBackups(backupPath);
                    // If the workspace has no backups, ignore it
                    if (hasBackups) {
                        if (workspace.configPath.scheme !== network_1.Schemas.file || await pfs_1.Promises.exists(workspace.configPath.fsPath)) {
                            result.push(workspaceInfo);
                        }
                        else {
                            // If the workspace has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateFolders(folderWorkspaces) {
            if (!Array.isArray(folderWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            for (const folderInfo of folderWorkspaces) {
                const folderURI = folderInfo.folderUri;
                const key = this.backupUriComparer.getComparisonKey(folderURI);
                if (!seenIds.has(key)) {
                    seenIds.add(key);
                    const backupPath = (0, path_1.join)(this.backupHome, this.getFolderHash(folderInfo));
                    const hasBackups = await this.doHasBackups(backupPath);
                    // If the folder has no backups, ignore it
                    if (hasBackups) {
                        if (folderURI.scheme !== network_1.Schemas.file || await pfs_1.Promises.exists(folderURI.fsPath)) {
                            result.push(folderInfo);
                        }
                        else {
                            // If the folder has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateEmptyWorkspaces(emptyWorkspaces) {
            if (!Array.isArray(emptyWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            // Validate Empty Windows
            for (const backupInfo of emptyWorkspaces) {
                const backupFolder = backupInfo.backupFolder;
                if (typeof backupFolder !== 'string') {
                    return [];
                }
                if (!seenIds.has(backupFolder)) {
                    seenIds.add(backupFolder);
                    const backupPath = (0, path_1.join)(this.backupHome, backupFolder);
                    if (await this.doHasBackups(backupPath)) {
                        result.push(backupInfo);
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async deleteStaleBackup(backupPath) {
            try {
                await pfs_1.Promises.rm(backupPath, pfs_1.RimRafMode.MOVE);
            }
            catch (error) {
                this.logService.error(`Backup: Could not delete stale backup: ${error.toString()}`);
            }
        }
        prepareNewEmptyWindowBackup() {
            // We are asked to prepare a new empty window backup folder.
            // Empty windows backup folders are derived from a workspace
            // identifier, so we generate a new empty workspace identifier
            // until we found a unique one.
            let emptyWorkspaceIdentifier = (0, workspaces_1.createEmptyWorkspaceIdentifier)();
            while (this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, emptyWorkspaceIdentifier.id))) {
                emptyWorkspaceIdentifier = (0, workspaces_1.createEmptyWorkspaceIdentifier)();
            }
            return { backupFolder: emptyWorkspaceIdentifier.id };
        }
        async convertToEmptyWindowBackup(backupPath) {
            const newEmptyWindowBackupInfo = this.prepareNewEmptyWindowBackup();
            // Rename backupPath to new empty window backup path
            const newEmptyWindowBackupPath = (0, path_1.join)(this.backupHome, newEmptyWindowBackupInfo.backupFolder);
            try {
                await pfs_1.Promises.rename(backupPath, newEmptyWindowBackupPath, false /* no retry */);
            }
            catch (error) {
                this.logService.error(`Backup: Could not rename backup folder: ${error.toString()}`);
                return false;
            }
            this.emptyWindows.push(newEmptyWindowBackupInfo);
            return true;
        }
        async getDirtyWorkspaces() {
            const dirtyWorkspaces = [];
            // Workspaces with backups
            for (const workspace of this.workspaces) {
                if ((await this.hasBackups(workspace))) {
                    dirtyWorkspaces.push(workspace);
                }
            }
            // Folders with backups
            for (const folder of this.folders) {
                if ((await this.hasBackups(folder))) {
                    dirtyWorkspaces.push(folder);
                }
            }
            return dirtyWorkspaces;
        }
        hasBackups(backupLocation) {
            let backupPath;
            // Empty
            if ((0, backup_1.isEmptyWindowBackupInfo)(backupLocation)) {
                backupPath = (0, path_1.join)(this.backupHome, backupLocation.backupFolder);
            }
            // Folder
            else if ((0, backup_2.isFolderBackupInfo)(backupLocation)) {
                backupPath = (0, path_1.join)(this.backupHome, this.getFolderHash(backupLocation));
            }
            // Workspace
            else {
                backupPath = (0, path_1.join)(this.backupHome, backupLocation.workspace.id);
            }
            return this.doHasBackups(backupPath);
        }
        async doHasBackups(backupPath) {
            try {
                const backupSchemas = await pfs_1.Promises.readdir(backupPath);
                for (const backupSchema of backupSchemas) {
                    try {
                        const backupSchemaChildren = await pfs_1.Promises.readdir((0, path_1.join)(backupPath, backupSchema));
                        if (backupSchemaChildren.length > 0) {
                            return true;
                        }
                    }
                    catch (error) {
                        // invalid folder
                    }
                }
            }
            catch (error) {
                // backup path does not exist
            }
            return false;
        }
        storeWorkspacesMetadata() {
            const serializedBackupWorkspaces = {
                workspaces: this.workspaces.map(({ workspace, remoteAuthority }) => {
                    const serializedWorkspaceBackupInfo = {
                        id: workspace.id,
                        configURIPath: workspace.configPath.toString()
                    };
                    if (remoteAuthority) {
                        serializedWorkspaceBackupInfo.remoteAuthority = remoteAuthority;
                    }
                    return serializedWorkspaceBackupInfo;
                }),
                folders: this.folders.map(({ folderUri, remoteAuthority }) => {
                    const serializedFolderBackupInfo = {
                        folderUri: folderUri.toString()
                    };
                    if (remoteAuthority) {
                        serializedFolderBackupInfo.remoteAuthority = remoteAuthority;
                    }
                    return serializedFolderBackupInfo;
                }),
                emptyWindows: this.emptyWindows.map(({ backupFolder, remoteAuthority }) => {
                    const serializedEmptyWindowBackupInfo = {
                        backupFolder
                    };
                    if (remoteAuthority) {
                        serializedEmptyWindowBackupInfo.remoteAuthority = remoteAuthority;
                    }
                    return serializedEmptyWindowBackupInfo;
                })
            };
            this.stateService.setItem(BackupMainService_1.backupWorkspacesMetadataStorageKey, serializedBackupWorkspaces);
        }
        getFolderHash(folder) {
            const folderUri = folder.folderUri;
            let key;
            if (folderUri.scheme === network_1.Schemas.file) {
                key = platform_1.isLinux ? folderUri.fsPath : folderUri.fsPath.toLowerCase(); // for backward compatibility, use the fspath as key
            }
            else {
                key = folderUri.toString().toLowerCase();
            }
            return (0, crypto_1.createHash)('md5').update(key).digest('hex'); // CodeQL [SM04514] Using MD5 to convert a file path to a fixed length
        }
    };
    exports.BackupMainService = BackupMainService;
    exports.BackupMainService = BackupMainService = BackupMainService_1 = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, state_1.IStateService)
    ], BackupMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja3VwTWFpblNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2JhY2t1cC9lbGVjdHJvbi1tYWluL2JhY2t1cE1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQnpGLElBQU0saUJBQWlCLEdBQXZCLE1BQU0saUJBQWlCOztpQkFJTCx1Q0FBa0MsR0FBRyxrQkFBa0IsQUFBckIsQ0FBc0I7UUFjaEYsWUFDMEIsc0JBQWdFLEVBQ2xFLG9CQUE0RCxFQUN0RSxVQUF3QyxFQUN0QyxZQUE0QztZQUhqQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1lBQ2pELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNyQixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQWhCbEQsZUFBVSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLENBQUM7WUFFdEQsZUFBVSxHQUEyQixFQUFFLENBQUM7WUFDeEMsWUFBTyxHQUF3QixFQUFFLENBQUM7WUFDbEMsaUJBQVksR0FBNkIsRUFBRSxDQUFDO1lBRXBELDhDQUE4QztZQUM5Qyx3Q0FBd0M7WUFDeEMsaUNBQWlDO1lBQ2hCLHNCQUFpQixHQUFHLHNDQUEwQixDQUFDO1lBQy9DLHVCQUFrQixHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsS0FBYSxFQUFFLEtBQWEsRUFBRSxFQUFFLENBQUMsSUFBQSxpQkFBTyxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxrQkFBTyxDQUFDLEVBQUUsQ0FBQztRQVFySCxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVU7WUFFZix5QkFBeUI7WUFDekIsTUFBTSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLE9B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