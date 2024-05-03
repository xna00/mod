/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/resources", "vs/base/parts/storage/common/storage", "vs/platform/storage/common/storage", "vs/platform/storage/common/storageIpc", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, async_1, lifecycle_1, network_1, resources_1, storage_1, storage_2, storageIpc_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteStorageService = void 0;
    class RemoteStorageService extends storage_2.AbstractStorageService {
        constructor(initialWorkspace, initialProfiles, remoteService, environmentService) {
            super();
            this.initialWorkspace = initialWorkspace;
            this.initialProfiles = initialProfiles;
            this.remoteService = remoteService;
            this.environmentService = environmentService;
            this.applicationStorageProfile = this.initialProfiles.defaultProfile;
            this.applicationStorage = this.createApplicationStorage();
            this.profileStorageProfile = this.initialProfiles.currentProfile;
            this.profileStorageDisposables = this._register(new lifecycle_1.DisposableStore());
            this.profileStorage = this.createProfileStorage(this.profileStorageProfile);
            this.workspaceStorageId = this.initialWorkspace?.id;
            this.workspaceStorageDisposables = this._register(new lifecycle_1.DisposableStore());
            this.workspaceStorage = this.createWorkspaceStorage(this.initialWorkspace);
        }
        createApplicationStorage() {
            const storageDataBaseClient = this._register(new storageIpc_1.ApplicationStorageDatabaseClient(this.remoteService.getChannel('storage')));
            const applicationStorage = this._register(new storage_1.Storage(storageDataBaseClient));
            this._register(applicationStorage.onDidChangeStorage(e => this.emitDidChangeValue(-1 /* StorageScope.APPLICATION */, e)));
            return applicationStorage;
        }
        createProfileStorage(profile) {
            // First clear any previously associated disposables
            this.profileStorageDisposables.clear();
            // Remember profile associated to profile storage
            this.profileStorageProfile = profile;
            let profileStorage;
            if ((0, storage_2.isProfileUsingDefaultStorage)(profile)) {
                // If we are using default profile storage, the profile storage is
                // actually the same as application storage. As such we
                // avoid creating the storage library a second time on
                // the same DB.
                profileStorage = this.applicationStorage;
            }
            else {
                const storageDataBaseClient = this.profileStorageDisposables.add(new storageIpc_1.ProfileStorageDatabaseClient(this.remoteService.getChannel('storage'), profile));
                profileStorage = this.profileStorageDisposables.add(new storage_1.Storage(storageDataBaseClient));
            }
            this.profileStorageDisposables.add(profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
            return profileStorage;
        }
        createWorkspaceStorage(workspace) {
            // First clear any previously associated disposables
            this.workspaceStorageDisposables.clear();
            // Remember workspace ID for logging later
            this.workspaceStorageId = workspace?.id;
            let workspaceStorage = undefined;
            if (workspace) {
                const storageDataBaseClient = this.workspaceStorageDisposables.add(new storageIpc_1.WorkspaceStorageDatabaseClient(this.remoteService.getChannel('storage'), workspace));
                workspaceStorage = this.workspaceStorageDisposables.add(new storage_1.Storage(storageDataBaseClient));
                this.workspaceStorageDisposables.add(workspaceStorage.onDidChangeStorage(e => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, e)));
            }
            return workspaceStorage;
        }
        async doInitialize() {
            // Init all storage locations
            await async_1.Promises.settled([
                this.applicationStorage.init(),
                this.profileStorage.init(),
                this.workspaceStorage?.init() ?? Promise.resolve()
            ]);
        }
        getStorage(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorage;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorage;
                default:
                    return this.workspaceStorage;
            }
        }
        getLogDetails(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorageProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorageProfile?.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
                default:
                    return this.workspaceStorageId ? `${(0, resources_1.joinPath)(this.environmentService.workspaceStorageHome, this.workspaceStorageId, 'state.vscdb').with({ scheme: network_1.Schemas.file }).fsPath}` : undefined;
            }
        }
        async close() {
            // Stop periodic scheduler and idle runner as we now collect state normally
            this.stopFlushWhenIdle();
            // Signal as event so that clients can still store data
            this.emitWillSaveState(storage_2.WillSaveStateReason.SHUTDOWN);
            // Do it
            await async_1.Promises.settled([
                this.applicationStorage.close(),
                this.profileStorage.close(),
                this.workspaceStorage?.close() ?? Promise.resolve()
            ]);
        }
        async switchToProfile(toProfile) {
            if (!this.canSwitchProfile(this.profileStorageProfile, toProfile)) {
                return;
            }
            const oldProfileStorage = this.profileStorage;
            const oldItems = oldProfileStorage.items;
            // Close old profile storage but only if this is
            // different from application storage!
            if (oldProfileStorage !== this.applicationStorage) {
                await oldProfileStorage.close();
            }
            // Create new profile storage & init
            this.profileStorage = this.createProfileStorage(toProfile);
            await this.profileStorage.init();
            // Handle data switch and eventing
            this.switchData(oldItems, this.profileStorage, 0 /* StorageScope.PROFILE */);
        }
        async switchToWorkspace(toWorkspace, preserveData) {
            const oldWorkspaceStorage = this.workspaceStorage;
            const oldItems = oldWorkspaceStorage?.items ?? new Map();
            // Close old workspace storage
            await oldWorkspaceStorage?.close();
            // Create new workspace storage & init
            this.workspaceStorage = this.createWorkspaceStorage(toWorkspace);
            await this.workspaceStorage.init();
            // Handle data switch and eventing
            this.switchData(oldItems, this.workspaceStorage, 1 /* StorageScope.WORKSPACE */);
        }
        hasScope(scope) {
            if ((0, userDataProfile_1.isUserDataProfile)(scope)) {
                return this.profileStorageProfile.id === scope.id;
            }
            return this.workspaceStorageId === scope.id;
        }
    }
    exports.RemoteStorageService = RemoteStorageService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3N0b3JhZ2UvY29tbW9uL3N0b3JhZ2VTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWNoRyxNQUFhLG9CQUFxQixTQUFRLGdDQUFzQjtRQWEvRCxZQUNrQixnQkFBcUQsRUFDckQsZUFBdUYsRUFDdkYsYUFBNkIsRUFDN0Isa0JBQXVDO1lBRXhELEtBQUssRUFBRSxDQUFDO1lBTFMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFxQztZQUNyRCxvQkFBZSxHQUFmLGVBQWUsQ0FBd0U7WUFDdkYsa0JBQWEsR0FBYixhQUFhLENBQWdCO1lBQzdCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFmeEMsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUM7WUFDaEUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFOUQsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUM7WUFDbkQsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBRXZFLHVCQUFrQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLENBQUM7WUFDdEMsZ0NBQTJCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQzdFLHFCQUFnQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQVM5RSxDQUFD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