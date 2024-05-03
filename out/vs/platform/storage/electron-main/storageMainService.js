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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/storage/electron-main/storageMain", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/electron-main/userDataProfile", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network"], function (require, exports, uri_1, event_1, lifecycle_1, environment_1, files_1, instantiation_1, lifecycleMainService_1, log_1, storage_1, storageMain_1, userDataProfile_1, userDataProfile_2, uriIdentity_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ApplicationStorageMainService = exports.IApplicationStorageMainService = exports.StorageMainService = exports.IStorageMainService = void 0;
    //#region Storage Main Service (intent: make application, profile and workspace storage accessible to windows from main process)
    exports.IStorageMainService = (0, instantiation_1.createDecorator)('storageMainService');
    let StorageMainService = class StorageMainService extends lifecycle_1.Disposable {
        constructor(logService, environmentService, userDataProfilesService, lifecycleMainService, fileService, uriIdentityService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this.userDataProfilesService = userDataProfilesService;
            this.lifecycleMainService = lifecycleMainService;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.shutdownReason = undefined;
            this._onDidChangeProfileStorage = this._register(new event_1.Emitter());
            this.onDidChangeProfileStorage = this._onDidChangeProfileStorage.event;
            //#region Application Storage
            this.applicationStorage = this._register(this.createApplicationStorage());
            //#endregion
            //#region Profile Storage
            this.mapProfileToStorage = new Map();
            //#endregion
            //#region Workspace Storage
            this.mapWorkspaceToStorage = new Map();
            this.registerListeners();
        }
        getStorageOptions() {
            return {
                useInMemoryStorage: !!this.environmentService.extensionTestsLocationURI // no storage during extension tests!
            };
        }
        registerListeners() {
            // Application Storage: Warmup when any window opens
            (async () => {
                await this.lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */);
                this.applicationStorage.init();
            })();
            this._register(this.lifecycleMainService.onWillLoadWindow(e => {
                // Profile Storage: Warmup when related window with profile loads
                if (e.window.profile) {
                    this.profileStorage(e.window.profile).init();
                }
                // Workspace Storage: Warmup when related window with workspace loads
                if (e.workspace) {
                    this.workspaceStorage(e.workspace).init();
                }
            }));
            // All Storage: Close when shutting down
            this._register(this.lifecycleMainService.onWillShutdown(e => {
                this.logService.trace('storageMainService#onWillShutdown()');
                // Remember shutdown reason
                this.shutdownReason = e.reason;
                // Application Storage
                e.join('applicationStorage', this.applicationStorage.close());
                // Profile Storage(s)
                for (const [, profileStorage] of this.mapProfileToStorage) {
                    e.join('profileStorage', profileStorage.close());
                }
                // Workspace Storage(s)
                for (const [, workspaceStorage] of this.mapWorkspaceToStorage) {
                    e.join('workspaceStorage', workspaceStorage.close());
                }
            }));
            // Prepare storage location as needed
            this._register(this.userDataProfilesService.onWillCreateProfile(e => {
                e.join((async () => {
                    if (!(await this.fileService.exists(e.profile.globalStorageHome))) {
                        await this.fileService.createFolder(e.profile.globalStorageHome);
                    }
                })());
            }));
            // Close the storage of the profile that is being removed
            this._register(this.userDataProfilesService.onWillRemoveProfile(e => {
                const storage = this.mapProfileToStorage.get(e.profile.id);
                if (storage) {
                    e.join(storage.close());
                }
            }));
        }
        createApplicationStorage() {
            this.logService.trace(`StorageMainService: creating application storage`);
            const applicationStorage = new storageMain_1.ApplicationStorageMain(this.getStorageOptions(), this.userDataProfilesService, this.logService, this.fileService);
            this._register(event_1.Event.once(applicationStorage.onDidCloseStorage)(() => {
                this.logService.trace(`StorageMainService: closed application storage`);
            }));
            return applicationStorage;
        }
        profileStorage(profile) {
            if ((0, storage_1.isProfileUsingDefaultStorage)(profile)) {
                return this.applicationStorage; // for profiles using default storage, use application storage
            }
            let profileStorage = this.mapProfileToStorage.get(profile.id);
            if (!profileStorage) {
                this.logService.trace(`StorageMainService: creating profile storage (${profile.name})`);
                profileStorage = this._register(this.createProfileStorage(profile));
                this.mapProfileToStorage.set(profile.id, profileStorage);
                const listener = this._register(profileStorage.onDidChangeStorage(e => this._onDidChangeProfileStorage.fire({
                    ...e,
                    storage: profileStorage,
                    profile
                })));
                this._register(event_1.Event.once(profileStorage.onDidCloseStorage)(() => {
                    this.logService.trace(`StorageMainService: closed profile storage (${profile.name})`);
                    this.mapProfileToStorage.delete(profile.id);
                    listener.dispose();
                }));
            }
            return profileStorage;
        }
        createProfileStorage(profile) {
            if (this.shutdownReason === 2 /* ShutdownReason.KILL */) {
                // Workaround for native crashes that we see when
                // SQLite DBs are being created even after shutdown
                // https://github.com/microsoft/vscode/issues/143186
                return new storageMain_1.InMemoryStorageMain(this.logService, this.fileService);
            }
            return new storageMain_1.ProfileStorageMain(profile, this.getStorageOptions(), this.logService, this.fileService);
        }
        workspaceStorage(workspace) {
            let workspaceStorage = this.mapWorkspaceToStorage.get(workspace.id);
            if (!workspaceStorage) {
                this.logService.trace(`StorageMainService: creating workspace storage (${workspace.id})`);
                workspaceStorage = this._register(this.createWorkspaceStorage(workspace));
                this.mapWorkspaceToStorage.set(workspace.id, workspaceStorage);
                this._register(event_1.Event.once(workspaceStorage.onDidCloseStorage)(() => {
                    this.logService.trace(`StorageMainService: closed workspace storage (${workspace.id})`);
                    this.mapWorkspaceToStorage.delete(workspace.id);
                }));
            }
            return workspaceStorage;
        }
        createWorkspaceStorage(workspace) {
            if (this.shutdownReason === 2 /* ShutdownReason.KILL */) {
                // Workaround for native crashes that we see when
                // SQLite DBs are being created even after shutdown
                // https://github.com/microsoft/vscode/issues/143186
                return new storageMain_1.InMemoryStorageMain(this.logService, this.fileService);
            }
            return new storageMain_1.WorkspaceStorageMain(workspace, this.getStorageOptions(), this.logService, this.environmentService, this.fileService);
        }
        //#endregion
        isUsed(path) {
            const pathUri = uri_1.URI.file(path);
            for (const storage of [this.applicationStorage, ...this.mapProfileToStorage.values(), ...this.mapWorkspaceToStorage.values()]) {
                if (!storage.path) {
                    continue;
                }
                if (this.uriIdentityService.extUri.isEqualOrParent(uri_1.URI.file(storage.path), pathUri)) {
                    return true;
                }
            }
            return false;
        }
    };
    exports.StorageMainService = StorageMainService;
    exports.StorageMainService = StorageMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataProfile_2.IUserDataProfilesMainService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, files_1.IFileService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], StorageMainService);
    //#endregion
    //#region Application Main Storage Service (intent: use application storage from main process)
    exports.IApplicationStorageMainService = (0, instantiation_1.createDecorator)('applicationStorageMainService');
    let ApplicationStorageMainService = class ApplicationStorageMainService extends storage_1.AbstractStorageService {
        constructor(userDataProfilesService, storageMainService) {
            super();
            this.userDataProfilesService = userDataProfilesService;
            this.storageMainService = storageMainService;
            this.whenReady = this.storageMainService.applicationStorage.whenInit;
        }
        doInitialize() {
            // application storage is being initialized as part
            // of the first window opening, so we do not trigger
            // it here but can join it
            return this.storageMainService.applicationStorage.whenInit;
        }
        getStorage(scope) {
            if (scope === -1 /* StorageScope.APPLICATION */) {
                return this.storageMainService.applicationStorage.storage;
            }
            return undefined; // any other scope is unsupported from main process
        }
        getLogDetails(scope) {
            if (scope === -1 /* StorageScope.APPLICATION */) {
                return this.userDataProfilesService.defaultProfile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath;
            }
            return undefined; // any other scope is unsupported from main process
        }
        shouldFlushWhenIdle() {
            return false; // not needed here, will be triggered from any window that is opened
        }
        switch() {
            throw new Error('Migrating storage is unsupported from main process');
        }
        switchToProfile() {
            throw new Error('Switching storage profile is unsupported from main process');
        }
        switchToWorkspace() {
            throw new Error('Switching storage workspace is unsupported from main process');
        }
        hasScope() {
            throw new Error('Main process is never profile or workspace scoped');
        }
    };
    exports.ApplicationStorageMainService = ApplicationStorageMainService;
    exports.ApplicationStorageMainService = ApplicationStorageMainService = __decorate([
        __param(0, userDataProfile_1.IUserDataProfilesService),
        __param(1, exports.IStorageMainService)
    ], ApplicationStorageMainService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZU1haW5TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9zdG9yYWdlL2VsZWN0cm9uLW1haW4vc3RvcmFnZU1haW5TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEcsZ0lBQWdJO0lBRW5ILFFBQUEsbUJBQW1CLEdBQUcsSUFBQSwrQkFBZSxFQUFzQixvQkFBb0IsQ0FBQyxDQUFDO0lBa0R2RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFVO1FBU2pELFlBQ2MsVUFBd0MsRUFDaEMsa0JBQXdELEVBQy9DLHVCQUFzRSxFQUM3RSxvQkFBNEQsRUFDckUsV0FBMEMsRUFDbkMsa0JBQXdEO1lBRTdFLEtBQUssRUFBRSxDQUFDO1lBUHNCLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDZix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzlCLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBOEI7WUFDNUQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUNwRCxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNsQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBWHRFLG1CQUFjLEdBQStCLFNBQVMsQ0FBQztZQUU5QywrQkFBMEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUE4QixDQUFDLENBQUM7WUFDL0YsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssQ0FBQztZQWtGM0UsNkJBQTZCO1lBRXBCLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQztZQWM5RSxZQUFZO1lBRVoseUJBQXlCO1lBRVIsd0JBQW1CLEdB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