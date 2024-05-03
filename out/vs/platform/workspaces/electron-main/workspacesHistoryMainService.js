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
define(["require", "exports", "electron", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/storage/electron-main/storageMainService", "vs/platform/workspaces/common/workspaces", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService", "vs/base/common/map", "vs/platform/dialogs/electron-main/dialogMainService"], function (require, exports, electron_1, arrays_1, async_1, event_1, labels_1, lifecycle_1, network_1, platform_1, resources_1, uri_1, pfs_1, nls_1, instantiation_1, lifecycleMainService_1, log_1, storageMainService_1, workspaces_1, workspace_1, workspacesManagementMainService_1, map_1, dialogMainService_1) {
    "use strict";
    var WorkspacesHistoryMainService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesHistoryMainService = exports.IWorkspacesHistoryMainService = void 0;
    exports.IWorkspacesHistoryMainService = (0, instantiation_1.createDecorator)('workspacesHistoryMainService');
    let WorkspacesHistoryMainService = class WorkspacesHistoryMainService extends lifecycle_1.Disposable {
        static { WorkspacesHistoryMainService_1 = this; }
        static { this.MAX_TOTAL_RECENT_ENTRIES = 500; }
        static { this.RECENTLY_OPENED_STORAGE_KEY = 'history.recentlyOpenedPathsList'; }
        constructor(logService, workspacesManagementMainService, lifecycleMainService, applicationStorageMainService, dialogMainService) {
            super();
            this.logService = logService;
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.applicationStorageMainService = applicationStorageMainService;
            this.dialogMainService = dialogMainService;
            this._onDidChangeRecentlyOpened = this._register(new event_1.Emitter());
            this.onDidChangeRecentlyOpened = this._onDidChangeRecentlyOpened.event;
            this.macOSRecentDocumentsUpdater = this._register(new async_1.ThrottledDelayer(800));
            this.registerListeners();
        }
        registerListeners() {
            // Install window jump list delayed after opening window
            // because perf measurements have shown this to be slow
            this.lifecycleMainService.when(4 /* LifecycleMainPhase.Eventually */).then(() => this.handleWindowsJumpList());
            // Add to history when entering workspace
            this._register(this.workspacesManagementMainService.onDidEnterWorkspace(event => this.addRecentlyOpened([{ workspace: event.workspace, remoteAuthority: event.window.remoteAuthority }])));
        }
        //#region Workspaces History
        async addRecentlyOpened(recentToAdd) {
            let workspaces = [];
            let files = [];
            for (const recent of recentToAdd) {
                // Workspace
                if ((0, workspaces_1.isRecentWorkspace)(recent)) {
                    if (!this.workspacesManagementMainService.isUntitledWorkspace(recent.workspace) && !this.containsWorkspace(workspaces, recent.workspace)) {
                        workspaces.push(recent);
                    }
                }
                // Folder
                else if ((0, workspaces_1.isRecentFolder)(recent)) {
                    if (!this.containsFolder(workspaces, recent.folderUri)) {
                        workspaces.push(recent);
                    }
                }
                // File
                else {
                    const alreadyExistsInHistory = this.containsFile(files, recent.fileUri);
                    const shouldBeFiltered = recent.fileUri.scheme === network_1.Schemas.file && WorkspacesHistoryMainService_1.COMMON_FILES_FILTER.indexOf((0, resources_1.basename)(recent.fileUri)) >= 0;
                    if (!alreadyExistsInHistory && !shouldBeFiltered) {
                        files.push(recent);
                        // Add to recent documents (Windows only, macOS later)
                        if (platform_1.isWindows && recent.fileUri.scheme === network_1.Schemas.file) {
                            electron_1.app.addRecentDocument(recent.fileUri.fsPath);
                        }
                    }
                }
            }
            const mergedEntries = await this.mergeEntriesFromStorage({ workspaces, files });
            workspaces = mergedEntries.workspaces;
            files = mergedEntries.files;
            if (workspaces.length > WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES) {
                workspaces.length = WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES;
            }
            if (files.length > WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES) {
                files.length = WorkspacesHistoryMainService_1.MAX_TOTAL_RECENT_ENTRIES;
            }
            await this.saveRecentlyOpened({ workspaces, files });
            this._onDidChangeRecentlyOpened.fire();
            // Schedule update to recent documents on macOS dock
            if (platform_1.isMacintosh) {
                this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
            }
        }
        async removeRecentlyOpened(recentToRemove) {
            const keep = (recent) => {
                const uri = this.location(recent);
                for (const resourceToRemove of recentToRemove) {
                    if (resources_1.extUriBiasedIgnorePathCase.isEqual(resourceToRemove, uri)) {
                        return false;
                    }
                }
                return true;
            };
            const mru = await this.getRecentlyOpened();
            const workspaces = mru.workspaces.filter(keep);
            const files = mru.files.filter(keep);
            if (workspaces.length !== mru.workspaces.length || files.length !== mru.files.length) {
                await this.saveRecentlyOpened({ files, workspaces });
                this._onDidChangeRecentlyOpened.fire();
                // Schedule update to recent documents on macOS dock
                if (platform_1.isMacintosh) {
                    this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
                }
            }
        }
        async clearRecentlyOpened(options) {
            if (options?.confirm) {
                const { response } = await this.dialogMainService.showMessageBox({
                    type: 'warning',
                    buttons: [
                        (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear"),
                        (0, nls_1.localize)({ key: 'cancel', comment: ['&& denotes a mnemonic'] }, "&&Cancel")
                    ],
                    message: (0, nls_1.localize)('confirmClearRecentsMessage', "Do you want to clear all recently opened files and workspaces?"),
                    detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                    cancelId: 1
                });
                if (response !== 0) {
                    return;
                }
            }
            await this.saveRecentlyOpened({ workspaces: [], files: [] });
            electron_1.app.clearRecentDocuments();
            // Event
            this._onDidChangeRecentlyOpened.fire();
        }
        async getRecentlyOpened() {
            return this.mergeEntriesFromStorage();
        }
        async mergeEntriesFromStorage(existingEntries) {
            // Build maps for more efficient lookup of existing entries that
            // are passed in by storing based on workspace/file identifier
            const mapWorkspaceIdToWorkspace = new map_1.ResourceMap(uri => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(uri));
            if (existingEntries?.workspaces) {
                for (const workspace of existingEntries.workspaces) {
                    mapWorkspaceIdToWorkspace.set(this.location(workspace), workspace);
                }
            }
            const mapFileIdToFile = new map_1.ResourceMap(uri => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(uri));
            if (existingEntries?.files) {
                for (const file of existingEntries.files) {
                    mapFileIdToFile.set(this.location(file), file);
                }
            }
            // Merge in entries from storage, preserving existing known entries
            const recentFromStorage = await this.getRecentlyOpenedFromStorage();
            for (const recentWorkspaceFromStorage of recentFromStorage.workspaces) {
                const existingRecentWorkspace = mapWorkspaceIdToWorkspace.get(this.location(recentWorkspaceFromStorage));
                if (existingRecentWorkspace) {
                    existingRecentWorkspace.label = existingRecentWorkspace.label ?? recentWorkspaceFromStorage.label;
                }
                else {
                    mapWorkspaceIdToWorkspace.set(this.location(recentWorkspaceFromStorage), recentWorkspaceFromStorage);
                }
            }
            for (const recentFileFromStorage of recentFromStorage.files) {
                const existingRecentFile = mapFileIdToFile.get(this.location(recentFileFromStorage));
                if (existingRecentFile) {
                    existingRecentFile.label = existingRecentFile.label ?? recentFileFromStorage.label;
                }
                else {
                    mapFileIdToFile.set(this.location(recentFileFromStorage), recentFileFromStorage);
                }
            }
            return {
                workspaces: [...mapWorkspaceIdToWorkspace.values()],
                files: [...mapFileIdToFile.values()]
            };
        }
        async getRecentlyOpenedFromStorage() {
            // Wait for global storage to be ready
            await this.applicationStorageMainService.whenReady;
            let storedRecentlyOpened = undefined;
            // First try with storage service
            const storedRecentlyOpenedRaw = this.applicationStorageMainService.get(WorkspacesHistoryMainService_1.RECENTLY_OPENED_STORAGE_KEY, -1 /* StorageScope.APPLICATION */);
            if (typeof storedRecentlyOpenedRaw === 'string') {
                try {
                    storedRecentlyOpened = JSON.parse(storedRecentlyOpenedRaw);
                }
                catch (error) {
                    this.logService.error('Unexpected error parsing opened paths list', error);
                }
            }
            return (0, workspaces_1.restoreRecentlyOpened)(storedRecentlyOpened, this.logService);
        }
        async saveRecentlyOpened(recent) {
            // Wait for global storage to be ready
            await this.applicationStorageMainService.whenReady;
            // Store in global storage (but do not sync since this is mainly local paths)
            this.applicationStorageMainService.store(WorkspacesHistoryMainService_1.RECENTLY_OPENED_STORAGE_KEY, JSON.stringify((0, workspaces_1.toStoreData)(recent)), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        location(recent) {
            if ((0, workspaces_1.isRecentFolder)(recent)) {
                return recent.folderUri;
            }
            if ((0, workspaces_1.isRecentFile)(recent)) {
                return recent.fileUri;
            }
            return recent.workspace.configPath;
        }
        containsWorkspace(recents, candidate) {
            return !!recents.find(recent => (0, workspaces_1.isRecentWorkspace)(recent) && recent.workspace.id === candidate.id);
        }
        containsFolder(recents, candidate) {
            return !!recents.find(recent => (0, workspaces_1.isRecentFolder)(recent) && resources_1.extUriBiasedIgnorePathCase.isEqual(recent.folderUri, candidate));
        }
        containsFile(recents, candidate) {
            return !!recents.find(recent => resources_1.extUriBiasedIgnorePathCase.isEqual(recent.fileUri, candidate));
        }
        //#endregion
        //#region macOS Dock / Windows JumpList
        static { this.MAX_MACOS_DOCK_RECENT_WORKSPACES = 7; } // prefer higher number of workspaces...
        static { this.MAX_MACOS_DOCK_RECENT_ENTRIES_TOTAL = 10; } // ...over number of files
        static { this.MAX_WINDOWS_JUMP_LIST_ENTRIES = 7; }
        // Exclude some very common files from the dock/taskbar
        static { this.COMMON_FILES_FILTER = [
            'COMMIT_EDITMSG',
            'MERGE_MSG'
        ]; }
        async handleWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            await this.updateWindowsJumpList();
            this._register(this.onDidChangeRecentlyOpened(() => this.updateWindowsJumpList()));
        }
        async updateWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            const jumpList = [];
            // Tasks
            jumpList.push({
                type: 'tasks',
                items: [
                    {
                        type: 'task',
                        title: (0, nls_1.localize)('newWindow', "New Window"),
                        description: (0, nls_1.localize)('newWindowDesc', "Opens a new window"),
                        program: process.execPath,
                        args: '-n', // force new window
                        iconPath: process.execPath,
                        iconIndex: 0
                    }
                ]
            });
            // Recent Workspaces
            if ((await this.getRecentlyOpened()).workspaces.length > 0) {
                // The user might have meanwhile removed items from the jump list and we have to respect that
                // so we need to update our list of recent paths with the choice of the user to not add them again
                // Also: Windows will not show our custom category at all if there is any entry which was removed
                // by the user! See https://github.com/microsoft/vscode/issues/15052
                const toRemove = [];
                for (const item of electron_1.app.getJumpListSettings().removedItems) {
                    const args = item.args;
                    if (args) {
                        const match = /^--(folder|file)-uri\s+"([^"]+)"$/.exec(args);
                        if (match) {
                            toRemove.push(uri_1.URI.parse(match[2]));
                        }
                    }
                }
                await this.removeRecentlyOpened(toRemove);
                // Add entries
                let hasWorkspaces = false;
                const items = (0, arrays_1.coalesce)((await this.getRecentlyOpened()).workspaces.slice(0, WorkspacesHistoryMainService_1.MAX_WINDOWS_JUMP_LIST_ENTRIES).map(recent => {
                    const workspace = (0, workspaces_1.isRecentWorkspace)(recent) ? recent.workspace : recent.folderUri;
                    const { title, description } = this.getWindowsJumpListLabel(workspace, recent.label);
                    let args;
                    if (uri_1.URI.isUri(workspace)) {
                        args = `--folder-uri "${workspace.toString()}"`;
                    }
                    else {
                        hasWorkspaces = true;
                        args = `--file-uri "${workspace.configPath.toString()}"`;
                    }
                    return {
                        type: 'task',
                        title: title.substr(0, 255), // Windows seems to be picky around the length of entries
                        description: description.substr(0, 255), // (see https://github.com/microsoft/vscode/issues/111177)
                        program: process.execPath,
                        args,
                        iconPath: 'explorer.exe', // simulate folder icon
                        iconIndex: 0
                    };
                }));
                if (items.length > 0) {
                    jumpList.push({
                        type: 'custom',
                        name: hasWorkspaces ? (0, nls_1.localize)('recentFoldersAndWorkspaces', "Recent Folders & Workspaces") : (0, nls_1.localize)('recentFolders', "Recent Folders"),
                        items
                    });
                }
            }
            // Recent
            jumpList.push({
                type: 'recent' // this enables to show files in the "recent" category
            });
            try {
                const res = electron_1.app.setJumpList(jumpList);
                if (res && res !== 'ok') {
                    this.logService.warn(`updateWindowsJumpList#setJumpList unexpected result: ${res}`);
                }
            }
            catch (error) {
                this.logService.warn('updateWindowsJumpList#setJumpList', error); // since setJumpList is relatively new API, make sure to guard for errors
            }
        }
        getWindowsJumpListLabel(workspace, recentLabel) {
            // Prefer recent label
            if (recentLabel) {
                return { title: (0, labels_1.splitRecentLabel)(recentLabel).name, description: recentLabel };
            }
            // Single Folder
            if (uri_1.URI.isUri(workspace)) {
                return { title: (0, resources_1.basename)(workspace), description: this.renderJumpListPathDescription(workspace) };
            }
            // Workspace: Untitled
            if (this.workspacesManagementMainService.isUntitledWorkspace(workspace)) {
                return { title: (0, nls_1.localize)('untitledWorkspace', "Untitled (Workspace)"), description: '' };
            }
            // Workspace: normal
            let filename = (0, resources_1.basename)(workspace.configPath);
            if (filename.endsWith(workspace_1.WORKSPACE_EXTENSION)) {
                filename = filename.substr(0, filename.length - workspace_1.WORKSPACE_EXTENSION.length - 1);
            }
            return { title: (0, nls_1.localize)('workspaceName', "{0} (Workspace)", filename), description: this.renderJumpListPathDescription(workspace.configPath) };
        }
        renderJumpListPathDescription(uri) {
            return uri.scheme === 'file' ? (0, labels_1.normalizeDriveLetter)(uri.fsPath) : uri.toString();
        }
        async updateMacOSRecentDocuments() {
            if (!platform_1.isMacintosh) {
                return;
            }
            // We clear all documents first to ensure an up-to-date view on the set. Since entries
            // can get deleted on disk, this ensures that the list is always valid
            electron_1.app.clearRecentDocuments();
            const mru = await this.getRecentlyOpened();
            // Collect max-N recent workspaces that are known to exist
            const workspaceEntries = [];
            let entries = 0;
            for (let i = 0; i < mru.workspaces.length && entries < WorkspacesHistoryMainService_1.MAX_MACOS_DOCK_RECENT_WORKSPACES; i++) {
                const loc = this.location(mru.workspaces[i]);
                if (loc.scheme === network_1.Schemas.file) {
                    const workspacePath = (0, resources_1.originalFSPath)(loc);
                    if (await pfs_1.Promises.exists(workspacePath)) {
                        workspaceEntries.push(workspacePath);
                        entries++;
                    }
                }
            }
            // Collect max-N recent files that are known to exist
            const fileEntries = [];
            for (let i = 0; i < mru.files.length && entries < WorkspacesHistoryMainService_1.MAX_MACOS_DOCK_RECENT_ENTRIES_TOTAL; i++) {
                const loc = this.location(mru.files[i]);
                if (loc.scheme === network_1.Schemas.file) {
                    const filePath = (0, resources_1.originalFSPath)(loc);
                    if (WorkspacesHistoryMainService_1.COMMON_FILES_FILTER.includes((0, resources_1.basename)(loc)) || // skip some well known file entries
                        workspaceEntries.includes(filePath) // prefer a workspace entry over a file entry (e.g. for .code-workspace)
                    ) {
                        continue;
                    }
                    if (await pfs_1.Promises.exists(filePath)) {
                        fileEntries.push(filePath);
                        entries++;
                    }
                }
            }
            // The apple guidelines (https://developer.apple.com/design/human-interface-guidelines/macos/menus/menu-anatomy/)
            // explain that most recent entries should appear close to the interaction by the user (e.g. close to the
            // mouse click). Most native macOS applications that add recent documents to the dock, show the most recent document
            // to the bottom (because the dock menu is not appearing from top to bottom, but from the bottom to the top). As such
            // we fill in the entries in reverse order so that the most recent shows up at the bottom of the menu.
            //
            // On top of that, the maximum number of documents can be configured by the user (defaults to 10). To ensure that
            // we are not failing to show the most recent entries, we start by adding files first (in reverse order of recency)
            // and then add folders (in reverse order of recency). Given that strategy, we can ensure that the most recent
            // N folders are always appearing, even if the limit is low (https://github.com/microsoft/vscode/issues/74788)
            fileEntries.reverse().forEach(fileEntry => electron_1.app.addRecentDocument(fileEntry));
            workspaceEntries.reverse().forEach(workspaceEntry => electron_1.app.addRecentDocument(workspaceEntry));
        }
    };
    exports.WorkspacesHistoryMainService = WorkspacesHistoryMainService;
    exports.WorkspacesHistoryMainService = WorkspacesHistoryMainService = WorkspacesHistoryMainService_1 = __decorate([
        __param(0, log_1.ILogService),
        __param(1, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, storageMainService_1.IApplicationStorageMainService),
        __param(4, dialogMainService_1.IDialogMainService)
    ], WorkspacesHistoryMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya3NwYWNlc0hpc3RvcnlNYWluU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vd29ya3NwYWNlcy9lbGVjdHJvbi1tYWluL3dvcmtzcGFjZXNIaXN0b3J5TWFpblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlCbkYsUUFBQSw2QkFBNkIsR0FBRyxJQUFBLCtCQUFlLEVBQWdDLDhCQUE4QixDQUFDLENBQUM7SUFjckgsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzQkFBVTs7aUJBRW5DLDZCQUF3QixHQUFHLEdBQUcsQUFBTixDQUFPO2lCQUUvQixnQ0FBMkIsR0FBRyxpQ0FBaUMsQUFBcEMsQ0FBcUM7UUFPeEYsWUFDYyxVQUF3QyxFQUNuQiwrQkFBa0YsRUFDN0Ysb0JBQTRELEVBQ25ELDZCQUE4RSxFQUMxRixpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFOc0IsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNGLG9DQUErQixHQUEvQiwrQkFBK0IsQ0FBa0M7WUFDNUUseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNsQyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQ3pFLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFSMUQsK0JBQTBCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDekUsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQztZQThQMUQsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHdCQUFnQixDQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFuUDlGLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxD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