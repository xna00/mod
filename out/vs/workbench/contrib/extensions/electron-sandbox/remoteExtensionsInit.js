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
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/ignoredExtensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, cancellation_1, environment_1, extensionManagement_1, extensionManagementUtil_1, files_1, instantiation_1, serviceCollection_1, log_1, remoteAuthorityResolver_1, storage_1, uriIdentity_1, userDataProfile_1, extensionsSync_1, ignoredExtensions_1, userDataSync_1, userDataSyncStoreService_1, authentication_1, extensionManagement_2, extensionManifestPropertiesService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionsInitializerContribution = void 0;
    let RemoteExtensionsInitializerContribution = class RemoteExtensionsInitializerContribution {
        constructor(extensionManagementServerService, storageService, remoteAgentService, userDataSyncStoreManagementService, instantiationService, logService, authenticationService, remoteAuthorityResolverService, userDataSyncEnablementService) {
            this.extensionManagementServerService = extensionManagementServerService;
            this.storageService = storageService;
            this.remoteAgentService = remoteAgentService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.authenticationService = authenticationService;
            this.remoteAuthorityResolverService = remoteAuthorityResolverService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.initializeRemoteExtensions();
        }
        async initializeRemoteExtensions() {
            const connection = this.remoteAgentService.getConnection();
            const localExtensionManagementServer = this.extensionManagementServerService.localExtensionManagementServer;
            const remoteExtensionManagementServer = this.extensionManagementServerService.remoteExtensionManagementServer;
            // Skip: Not a remote window
            if (!connection || !remoteExtensionManagementServer) {
                return;
            }
            // Skip: Not a native window
            if (!localExtensionManagementServer) {
                return;
            }
            // Skip: No UserdataSyncStore is configured
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                return;
            }
            const newRemoteConnectionKey = `${storage_1.IS_NEW_KEY}.${connection.remoteAuthority}`;
            // Skip: Not a new remote connection
            if (!this.storageService.getBoolean(newRemoteConnectionKey, -1 /* StorageScope.APPLICATION */, true)) {
                this.logService.trace(`Skipping initializing remote extensions because the window with this remote authority was opened before.`);
                return;
            }
            this.storageService.store(newRemoteConnectionKey, false, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            // Skip: Not a new workspace
            if (!this.storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                this.logService.trace(`Skipping initializing remote extensions because this workspace was opened before.`);
                return;
            }
            // Skip: Settings Sync is disabled
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            // Skip: No account is provided to initialize
            const resolvedAuthority = await this.remoteAuthorityResolverService.resolveAuthority(connection.remoteAuthority);
            if (!resolvedAuthority.options?.authenticationSession) {
                return;
            }
            const sessions = await this.authenticationService.getSessions(resolvedAuthority.options?.authenticationSession.providerId);
            const session = sessions.find(s => s.id === resolvedAuthority.options?.authenticationSession?.id);
            // Skip: Session is not found
            if (!session) {
                this.logService.info('Skipping initializing remote extensions because the account with given session id is not found', resolvedAuthority.options.authenticationSession.id);
                return;
            }
            const userDataSyncStoreClient = this.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreClient, this.userDataSyncStoreManagementService.userDataSyncStore.url);
            userDataSyncStoreClient.setAuthToken(session.accessToken, resolvedAuthority.options.authenticationSession.providerId);
            const userData = await userDataSyncStoreClient.readResource("extensions" /* SyncResource.Extensions */, null);
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            serviceCollection.set(extensionManagement_1.IExtensionManagementService, remoteExtensionManagementServer.extensionManagementService);
            const instantiationService = this.instantiationService.createChild(serviceCollection);
            const extensionsToInstallInitializer = instantiationService.createInstance(RemoteExtensionsInitializer);
            await extensionsToInstallInitializer.initialize(userData);
        }
    };
    exports.RemoteExtensionsInitializerContribution = RemoteExtensionsInitializerContribution;
    exports.RemoteExtensionsInitializerContribution = RemoteExtensionsInitializerContribution = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService),
        __param(1, storage_1.IStorageService),
        __param(2, remoteAgentService_1.IRemoteAgentService),
        __param(3, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, log_1.ILogService),
        __param(6, authentication_1.IAuthenticationService),
        __param(7, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService)
    ], RemoteExtensionsInitializerContribution);
    let RemoteExtensionsInitializer = class RemoteExtensionsInitializer extends extensionsSync_1.AbstractExtensionsInitializer {
        constructor(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, uriIdentityService, extensionGalleryService, storageService, extensionManifestPropertiesService) {
            super(extensionManagementService, ignoredExtensionsManagementService, fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService);
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
        }
        async doInitialize(remoteUserData) {
            const remoteExtensions = await this.parseExtensions(remoteUserData);
            if (!remoteExtensions) {
                this.logService.info('No synced extensions exist while initializing remote extensions.');
                return;
            }
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const { newExtensions } = this.generatePreview(remoteExtensions, installedExtensions);
            if (!newExtensions.length) {
                this.logService.trace('No new remote extensions to install.');
                return;
            }
            const targetPlatform = await this.extensionManagementService.getTargetPlatform();
            const extensionsToInstall = await this.extensionGalleryService.getExtensions(newExtensions, { targetPlatform, compatible: true }, cancellation_1.CancellationToken.None);
            if (extensionsToInstall.length) {
                await Promise.allSettled(extensionsToInstall.map(async (e) => {
                    const manifest = await this.extensionGalleryService.getManifest(e, cancellation_1.CancellationToken.None);
                    if (manifest && this.extensionManifestPropertiesService.canExecuteOnWorkspace(manifest)) {
                        const syncedExtension = remoteExtensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, e.identifier));
                        await this.extensionManagementService.installFromGallery(e, { installPreReleaseVersion: syncedExtension?.preRelease, donotIncludePackAndDependencies: true });
                    }
                }));
            }
        }
    };
    RemoteExtensionsInitializer = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, ignoredExtensions_1.IIgnoredExtensionsManagementService),
        __param(2, files_1.IFileService),
        __param(3, userDataProfile_1.IUserDataProfilesService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, log_1.ILogService),
        __param(6, uriIdentity_1.IUriIdentityService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, storage_1.IStorageService),
        __param(9, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService)
    ], RemoteExtensionsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3RlRXh0ZW5zaW9uc0luaXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2V4dGVuc2lvbnMvZWxlY3Ryb24tc2FuZGJveC9yZW1vdGVFeHRlbnNpb25zSW5pdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sdUNBQXVDLEdBQTdDLE1BQU0sdUNBQXVDO1FBQ25ELFlBQ3FELGdDQUFtRSxFQUNyRixjQUErQixFQUMzQixrQkFBdUMsRUFDdkIsa0NBQXVFLEVBQ3JGLG9CQUEyQyxFQUNyRCxVQUF1QixFQUNaLHFCQUE2QyxFQUNwQyw4QkFBK0QsRUFDaEUsNkJBQTZEO1lBUjFELHFDQUFnQyxHQUFoQyxnQ0FBZ0MsQ0FBbUM7WUFDckYsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQzNCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDdkIsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQUNyRix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3JELGVBQVUsR0FBVixVQUFVLENBQWE7WUFDWiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXdCO1lBQ3BDLG1DQUE4QixHQUE5Qiw4QkFBOEIsQ0FBaUM7WUFDaEUsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUU5RyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztRQUNuQyxDQUFDO1FBRU8sS0FBSyxDQUFDLDBCQUEwQjtZQUN2QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDM0QsTUFBTSw4QkFBOEIsR0FBRyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsOEJBQThCLENBQUM7WUFDNUcsTUFBTSwrQkFBK0IsR0FBRyxJQUFJLENB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