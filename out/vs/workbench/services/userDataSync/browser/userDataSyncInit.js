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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/platform", "vs/base/common/async", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/environment/common/environment", "vs/workbench/services/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/userDataSync/common/ignoredExtensions", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/workbench/services/environment/browser/environmentService", "vs/platform/secrets/common/secrets"], function (require, exports, storage_1, extensionsSync_1, globalStateSync_1, keybindingsSync_1, settingsSync_1, snippetsSync_1, files_1, log_1, userDataSyncStoreService_1, productService_1, request_1, userDataSync_1, authenticationService_1, userDataSync_2, platform_1, async_1, extensionManagement_1, environment_1, extensions_1, extensionManagementUtil_1, ignoredExtensions_1, lifecycle_1, resources_1, cancellation_1, uriIdentity_1, extensionStorage_1, tasksSync_1, userDataProfile_1, environmentService_1, secrets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncInitializer = void 0;
    let UserDataSyncInitializer = class UserDataSyncInitializer {
        constructor(environmentService, secretStorageService, userDataSyncStoreManagementService, fileService, userDataProfilesService, storageService, productService, requestService, logService, uriIdentityService) {
            this.environmentService = environmentService;
            this.secretStorageService = secretStorageService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.fileService = fileService;
            this.userDataProfilesService = userDataProfilesService;
            this.storageService = storageService;
            this.productService = productService;
            this.requestService = requestService;
            this.logService = logService;
            this.uriIdentityService = uriIdentityService;
            this.initialized = [];
            this.initializationFinished = new async_1.Barrier();
            this.globalStateUserData = null;
            this.createUserDataSyncStoreClient().then(userDataSyncStoreClient => {
                if (!userDataSyncStoreClient) {
                    this.initializationFinished.open();
                }
            });
        }
        createUserDataSyncStoreClient() {
            if (!this._userDataSyncStoreClientPromise) {
                this._userDataSyncStoreClientPromise = (async () => {
                    try {
                        if (!platform_1.isWeb) {
                            this.logService.trace(`Skipping initializing user data in desktop`);
                            return;
                        }
                        if (!this.storageService.isNew(-1 /* StorageScope.APPLICATION */)) {
                            this.logService.trace(`Skipping initializing user data as application was opened before`);
                            return;
                        }
                        if (!this.storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                            this.logService.trace(`Skipping initializing user data as workspace was opened before`);
                            return;
                        }
                        if (this.environmentService.options?.settingsSyncOptions?.authenticationProvider && !this.environmentService.options.settingsSyncOptions.enabled) {
                            this.logService.trace(`Skipping initializing user data as settings sync is disabled`);
                            return;
                        }
                        let authenticationSession;
                        try {
                            authenticationSession = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.secretStorageService, this.productService);
                        }
                        catch (error) {
                            this.logService.error(error);
                        }
                        if (!authenticationSession) {
                            this.logService.trace(`Skipping initializing user data as authentication session is not set`);
                            return;
                        }
                        await this.initializeUserDataSyncStore(authenticationSession);
                        const userDataSyncStore = this.userDataSyncStoreManagementService.userDataSyncStore;
                        if (!userDataSyncStore) {
                            this.logService.trace(`Skipping initializing user data as sync service is not provided`);
                            return;
                        }
                        const userDataSyncStoreClient = new userDataSyncStoreService_1.UserDataSyncStoreClient(userDataSyncStore.url, this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService);
                        userDataSyncStoreClient.setAuthToken(authenticationSession.accessToken, authenticationSession.providerId);
                        const manifest = await userDataSyncStoreClient.manifest(null);
                        if (manifest === null) {
                            userDataSyncStoreClient.dispose();
                            this.logService.trace(`Skipping initializing user data as there is no data`);
                            return;
                        }
                        this.logService.info(`Using settings sync service ${userDataSyncStore.url.toString()} for initialization`);
                        return userDataSyncStoreClient;
                    }
                    catch (error) {
                        this.logService.error(error);
                        return;
                    }
                })();
            }
            return this._userDataSyncStoreClientPromise;
        }
        async initializeUserDataSyncStore(authenticationSession) {
            const userDataSyncStore = this.userDataSyncStoreManagementService.userDataSyncStore;
            if (!userDataSyncStore?.canSwitch) {
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const userDataSyncStoreClient = disposables.add(new userDataSyncStoreService_1.UserDataSyncStoreClient(userDataSyncStore.url, this.productService, this.requestService, this.logService, this.environmentService, this.fileService, this.storageService));
                userDataSyncStoreClient.setAuthToken(authenticationSession.accessToken, authenticationSession.providerId);
                // Cache global state data for global state initialization
                this.globalStateUserData = await userDataSyncStoreClient.readResource("globalState" /* SyncResource.GlobalState */, null);
                if (this.globalStateUserData) {
                    const userDataSyncStoreType = new globalStateSync_1.UserDataSyncStoreTypeSynchronizer(userDataSyncStoreClient, this.storageService, this.environmentService, this.fileService, this.logService).getSyncStoreType(this.globalStateUserData);
                    if (userDataSyncStoreType) {
                        await this.userDataSyncStoreManagementService.switch(userDataSyncStoreType);
                        // Unset cached global state data if urls are changed
                        if (!(0, resources_1.isEqual)(userDataSyncStore.url, this.userDataSyncStoreManagementService.userDataSyncStore?.url)) {
                            this.logService.info('Switched settings sync store');
                            this.globalStateUserData = null;
                        }
                    }
                }
            }
            finally {
                disposables.dispose();
            }
        }
        async whenInitializationFinished() {
            await this.initializationFinished.wait();
        }
        async requiresInitialization() {
            this.logService.trace(`UserDataInitializationService#requiresInitialization`);
            const userDataSyncStoreClient = await this.createUserDataSyncStoreClient();
            return !!userDataSyncStoreClient;
        }
        async initializeRequiredResources() {
            this.logService.trace(`UserDataInitializationService#initializeRequiredResources`);
            return this.initialize(["settings" /* SyncResource.Settings */, "globalState" /* SyncResource.GlobalState */]);
        }
        async initializeOtherResources(instantiationService) {
            try {
                this.logService.trace(`UserDataInitializationService#initializeOtherResources`);
                await Promise.allSettled([this.initialize(["keybindings" /* SyncResource.Keybindings */, "snippets" /* SyncResource.Snippets */, "tasks" /* SyncResource.Tasks */]), this.initializeExtensions(instantiationService)]);
            }
            finally {
                this.initializationFinished.open();
            }
        }
        async initializeExtensions(instantiationService) {
            try {
                await Promise.all([this.initializeInstalledExtensions(instantiationService), this.initializeNewExtensions(instantiationService)]);
            }
            finally {
                this.initialized.push("extensions" /* SyncResource.Extensions */);
            }
        }
        async initializeInstalledExtensions(instantiationService) {
            if (!this.initializeInstalledExtensionsPromise) {
                this.initializeInstalledExtensionsPromise = (async () => {
                    this.logService.trace(`UserDataInitializationService#initializeInstalledExtensions`);
                    const extensionsPreviewInitializer = await this.getExtensionsPreviewInitializer(instantiationService);
                    if (extensionsPreviewInitializer) {
                        await instantiationService.createInstance(InstalledExtensionsInitializer, extensionsPreviewInitializer).initialize();
                    }
                })();
            }
            return this.initializeInstalledExtensionsPromise;
        }
        async initializeNewExtensions(instantiationService) {
            if (!this.initializeNewExtensionsPromise) {
                this.initializeNewExtensionsPromise = (async () => {
                    this.logService.trace(`UserDataInitializationService#initializeNewExtensions`);
                    const extensionsPreviewInitializer = await this.getExtensionsPreviewInitializer(instantiationService);
                    if (extensionsPreviewInitializer) {
                        await instantiationService.createInstance(NewExtensionsInitializer, extensionsPreviewInitializer).initialize();
                    }
                })();
            }
            return this.initializeNewExtensionsPromise;
        }
        getExtensionsPreviewInitializer(instantiationService) {
            if (!this.extensionsPreviewInitializerPromise) {
                this.extensionsPreviewInitializerPromise = (async () => {
                    const userDataSyncStoreClient = await this.createUserDataSyncStoreClient();
                    if (!userDataSyncStoreClient) {
                        return null;
                    }
                    const userData = await userDataSyncStoreClient.readResource("extensions" /* SyncResource.Extensions */, null);
                    return instantiationService.createInstance(ExtensionsPreviewInitializer, userData);
                })();
            }
            return this.extensionsPreviewInitializerPromise;
        }
        async initialize(syncResources) {
            const userDataSyncStoreClient = await this.createUserDataSyncStoreClient();
            if (!userDataSyncStoreClient) {
                return;
            }
            await async_1.Promises.settled(syncResources.map(async (syncResource) => {
                try {
                    if (this.initialized.includes(syncResource)) {
                        this.logService.info(`${(0, userDataSync_2.getSyncAreaLabel)(syncResource)} initialized already.`);
                        return;
                    }
                    this.initialized.push(syncResource);
                    this.logService.trace(`Initializing ${(0, userDataSync_2.getSyncAreaLabel)(syncResource)}`);
                    const initializer = this.createSyncResourceInitializer(syncResource);
                    const userData = await userDataSyncStoreClient.readResource(syncResource, syncResource === "globalState" /* SyncResource.GlobalState */ ? this.globalStateUserData : null);
                    await initializer.initialize(userData);
                    this.logService.info(`Initialized ${(0, userDataSync_2.getSyncAreaLabel)(syncResource)}`);
                }
                catch (error) {
                    this.logService.info(`Error while initializing ${(0, userDataSync_2.getSyncAreaLabel)(syncResource)}`);
                    this.logService.error(error);
                }
            }));
        }
        createSyncResourceInitializer(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return new settingsSync_1.SettingsInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "keybindings" /* SyncResource.Keybindings */: return new keybindingsSync_1.KeybindingsInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "tasks" /* SyncResource.Tasks */: return new tasksSync_1.TasksInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "snippets" /* SyncResource.Snippets */: return new snippetsSync_1.SnippetsInitializer(this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.storageService, this.uriIdentityService);
                case "globalState" /* SyncResource.GlobalState */: return new globalStateSync_1.GlobalStateInitializer(this.storageService, this.fileService, this.userDataProfilesService, this.environmentService, this.logService, this.uriIdentityService);
            }
            throw new Error(`Cannot create initializer for ${syncResource}`);
        }
    };
    exports.UserDataSyncInitializer = UserDataSyncInitializer;
    exports.UserDataSyncInitializer = UserDataSyncInitializer = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, secrets_1.ISecretStorageService),
        __param(2, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(3, files_1.IFileService),
        __param(4, userDataProfile_1.IUserDataProfilesService),
        __param(5, storage_1.IStorageService),
        __param(6, productService_1.IProductService),
        __param(7, request_1.IRequestService),
        __param(8, log_1.ILogService),
        __param(9, uriIdentity_1.IUriIdentityService)
    ], UserDataSyncInitializer);
    let ExtensionsPreviewInitializer = class ExtensionsPreviewInitializer extends extensionsSync_1.AbstractExtensionsInitializer {
        constructor(extensionsData, extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService) {
            super(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService);
            this.extensionsData = extensionsData;
            this.preview = null;
        }
        getPreview() {
            if (!this.previewPromise) {
                this.previewPromise = super.initialize(this.extensionsData).then(() => this.preview);
            }
            return this.previewPromise;
        }
        initialize() {
            throw new Error('should not be called directly');
        }
        async doInitialize(remoteUserData) {
            const remoteExtensions = await this.parseExtensions(remoteUserData);
            if (!remoteExtensions) {
                this.logService.info('Skipping initializing extensions because remote extensions does not exist.');
                return;
            }
            const installedExtensions = await this.extensionManagementService.getInstalled();
            this.preview = this.generatePreview(remoteExtensions, installedExtensions);
        }
    };
    ExtensionsPreviewInitializer = __decorate([
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(3, files_1.IFileService),
        __param(4, userDataProfile_1.IUserDataProfilesService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, userDataSync_1.IUserDataSyncLogService),
        __param(7, storage_1.IStorageService),
        __param(8, uriIdentity_1.IUriIdentityService)
    ], ExtensionsPreviewInitializer);
    let InstalledExtensionsInitializer = class InstalledExtensionsInitializer {
        constructor(extensionsPreviewInitializer, extensionEnablementService, extensionStorageService, logService) {
            this.extensionsPreviewInitializer = extensionsPreviewInitializer;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionStorageService = extensionStorageService;
            this.logService = logService;
        }
        async initialize() {
            const preview = await this.extensionsPreviewInitializer.getPreview();
            if (!preview) {
                return;
            }
            // 1. Initialise already installed extensions state
            for (const installedExtension of preview.installedExtensions) {
                const syncExtension = preview.remoteExtensions.find(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, installedExtension.identifier));
                if (syncExtension?.state) {
                    const extensionState = this.extensionStorageService.getExtensionState(installedExtension, true) || {};
                    Object.keys(syncExtension.state).forEach(key => extensionState[key] = syncExtension.state[key]);
                    this.extensionStorageService.setExtensionState(installedExtension, extensionState, true);
                }
            }
            // 2. Initialise extensions enablement
            if (preview.disabledExtensions.length) {
                for (const identifier of preview.disabledExtensions) {
                    this.logService.trace(`Disabling extension...`, identifier.id);
                    await this.extensionEnablementService.disableExtension(identifier);
                    this.logService.info(`Disabling extension`, identifier.id);
                }
            }
        }
    };
    InstalledExtensionsInitializer = __decorate([
        __param(1, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(2, extensionStorage_1.IExtensionStorageService),
        __param(3, userDataSync_1.IUserDataSyncLogService)
    ], InstalledExtensionsInitializer);
    let NewExtensionsInitializer = class NewExtensionsInitializer {
        constructor(extensionsPreviewInitializer, extensionService, extensionStorageService, galleryService, extensionManagementService, logService) {
            this.extensionsPreviewInitializer = extensionsPreviewInitializer;
            this.extensionService = extensionService;
            this.extensionStorageService = extensionStorageService;
            this.galleryService = galleryService;
            this.extensionManagementService = extensionManagementService;
            this.logService = logService;
        }
        async initialize() {
            const preview = await this.extensionsPreviewInitializer.getPreview();
            if (!preview) {
                return;
            }
            const newlyEnabledExtensions = [];
            const targetPlatform = await this.extensionManagementService.getTargetPlatform();
            const galleryExtensions = await this.galleryService.getExtensions(preview.newExtensions, { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            for (const galleryExtension of galleryExtensions) {
                try {
                    const extensionToSync = preview.remoteExtensions.find(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, galleryExtension.identifier));
                    if (!extensionToSync) {
                        continue;
                    }
                    if (extensionToSync.state) {
                        this.extensionStorageService.setExtensionState(galleryExtension, extensionToSync.state, true);
                    }
                    this.logService.trace(`Installing extension...`, galleryExtension.identifier.id);
                    const local = await this.extensionManagementService.installFromGallery(galleryExtension, {
                        isMachineScoped: false, /* set isMachineScoped to prevent install and sync dialog in web */
                        donotIncludePackAndDependencies: true,
                        installGivenVersion: !!extensionToSync.version,
                        installPreReleaseVersion: extensionToSync.preRelease
                    });
                    if (!preview.disabledExtensions.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, galleryExtension.identifier))) {
                        newlyEnabledExtensions.push(local);
                    }
                    this.logService.info(`Installed extension.`, galleryExtension.identifier.id);
                }
                catch (error) {
                    this.logService.error(error);
                }
            }
            const canEnabledExtensions = newlyEnabledExtensions.filter(e => this.extensionService.canAddExtension((0, extensions_1.toExtensionDescription)(e)));
            if (!(await this.areExtensionsRunning(canEnabledExtensions))) {
                await new Promise((c, e) => {
                    const disposable = this.extensionService.onDidChangeExtensions(async () => {
                        try {
                            if (await this.areExtensionsRunning(canEnabledExtensions)) {
                                disposable.dispose();
                                c();
                            }
                        }
                        catch (error) {
                            e(error);
                        }
                    });
                });
            }
        }
        async areExtensionsRunning(extensions) {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const runningExtensions = this.extensionService.extensions;
            return extensions.every(e => runningExtensions.some(r => (0, extensionManagementUtil_1.areSameExtensions)({ id: r.identifier.value }, e.identifier)));
        }
    };
    NewExtensionsInitializer = __decorate([
        __param(1, extensions_1.IExtensionService),
        __param(2, extensionStorage_1.IExtensionStorageService),
        __param(3, extensionManagement_1.IExtensionGalleryService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, userDataSync_1.IUserDataSyncLogService)
    ], NewExtensionsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jSW5pdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3VzZXJEYXRhU3luYy9icm93c2VyL3VzZXJEYXRhU3luY0luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBbUN6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF1QjtRQVFuQyxZQUNzQyxrQkFBd0UsRUFDdEYsb0JBQTRELEVBQzlDLGtDQUF3RixFQUMvRyxXQUEwQyxFQUM5Qix1QkFBa0UsRUFDM0UsY0FBZ0QsRUFDaEQsY0FBZ0QsRUFDaEQsY0FBZ0QsRUFDcEQsVUFBd0MsRUFDaEMsa0JBQXdEO1lBVHZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUM7WUFDckUseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qix1Q0FBa0MsR0FBbEMsa0NBQWtDLENBQXFDO1lBQzlGLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2IsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUMxRCxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDL0IsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNuQyxlQUFVLEdBQVYsVUFBVSxDQUFhO1lBQ2YsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQWQ3RCxnQkFBVyxHQUFtQixFQUFFLENBQUM7WUFDakMsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQUUsQ0FBQztZQUNoRCx3QkFBbUIsR0FBcUIsSUFBSSxDQUFDO1lBY3BELElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFO2dCQUNuRSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDOUIs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