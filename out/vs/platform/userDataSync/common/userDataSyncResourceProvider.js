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
define(["require", "exports", "vs/base/common/uri", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataProfilesManifestSync", "vs/base/common/jsonFormatter", "vs/base/common/strings"], function (require, exports, uri_1, nls_1, environment_1, files_1, serviceMachineId_1, storage_1, uriIdentity_1, userDataSync_1, userDataProfile_1, abstractSynchronizer_1, snippetsSync_1, settingsSync_1, keybindingsSync_1, configuration_1, tasksSync_1, extensionsSync_1, globalStateSync_1, instantiation_1, userDataProfilesManifestSync_1, jsonFormatter_1, strings_1) {
    "use strict";
    var UserDataSyncResourceProviderService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncResourceProviderService = void 0;
    let UserDataSyncResourceProviderService = class UserDataSyncResourceProviderService {
        static { UserDataSyncResourceProviderService_1 = this; }
        static { this.NOT_EXISTING_RESOURCE = 'not-existing-resource'; }
        static { this.REMOTE_BACKUP_AUTHORITY = 'remote-backup'; }
        static { this.LOCAL_BACKUP_AUTHORITY = 'local-backup'; }
        constructor(userDataSyncStoreService, userDataSyncLocalStoreService, logService, uriIdentityService, environmentService, storageService, fileService, userDataProfilesService, configurationService, instantiationService) {
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncLocalStoreService = userDataSyncLocalStoreService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.fileService = fileService;
            this.userDataProfilesService = userDataProfilesService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.extUri = uriIdentityService.extUri;
        }
        async getRemoteSyncedProfiles() {
            const userData = await this.userDataSyncStoreService.readResource("profiles" /* SyncResource.Profiles */, null, undefined);
            if (userData.content) {
                const syncData = this.parseSyncData(userData.content, "profiles" /* SyncResource.Profiles */);
                return (0, userDataProfilesManifestSync_1.parseUserDataProfilesManifest)(syncData);
            }
            return [];
        }
        async getLocalSyncedProfiles(location) {
            const refs = await this.userDataSyncLocalStoreService.getAllResourceRefs("profiles" /* SyncResource.Profiles */, undefined, location);
            if (refs.length) {
                const content = await this.userDataSyncLocalStoreService.resolveResourceContent("profiles" /* SyncResource.Profiles */, refs[0].ref, undefined, location);
                if (content) {
                    const syncData = this.parseSyncData(content, "profiles" /* SyncResource.Profiles */);
                    return (0, userDataProfilesManifestSync_1.parseUserDataProfilesManifest)(syncData);
                }
            }
            return [];
        }
        async getLocalSyncedMachines(location) {
            const refs = await this.userDataSyncLocalStoreService.getAllResourceRefs('machines', undefined, location);
            if (refs.length) {
                const content = await this.userDataSyncLocalStoreService.resolveResourceContent('machines', refs[0].ref, undefined, location);
                if (content) {
                    const machinesData = JSON.parse(content);
                    return machinesData.machines.map(m => ({ ...m, isCurrent: false }));
                }
            }
            return [];
        }
        async getRemoteSyncResourceHandles(syncResource, profile) {
            const handles = await this.userDataSyncStoreService.getAllResourceRefs(syncResource, profile?.collection);
            return handles.map(({ created, ref }) => ({
                created,
                uri: this.toUri({
                    remote: true,
                    syncResource,
                    profile: profile?.id ?? this.userDataProfilesService.defaultProfile.id,
                    location: undefined,
                    collection: profile?.collection,
                    ref,
                    node: undefined,
                })
            }));
        }
        async getLocalSyncResourceHandles(syncResource, profile, location) {
            const handles = await this.userDataSyncLocalStoreService.getAllResourceRefs(syncResource, profile?.collection, location);
            return handles.map(({ created, ref }) => ({
                created,
                uri: this.toUri({
                    remote: false,
                    syncResource,
                    profile: profile?.id ?? this.userDataProfilesService.defaultProfile.id,
                    collection: profile?.collection,
                    ref,
                    node: undefined,
                    location,
                })
            }));
        }
        resolveUserDataSyncResource({ uri }) {
            const resolved = this.resolveUri(uri);
            const profile = resolved ? this.userDataProfilesService.profiles.find(p => p.id === resolved.profile) : undefined;
            return resolved && profile ? { profile, syncResource: resolved?.syncResource } : undefined;
        }
        async getAssociatedResources({ uri }) {
            const resolved = this.resolveUri(uri);
            if (!resolved) {
                return [];
            }
            const profile = this.userDataProfilesService.profiles.find(p => p.id === resolved.profile);
            switch (resolved.syncResource) {
                case "settings" /* SyncResource.Settings */: return this.getSettingsAssociatedResources(uri, profile);
                case "keybindings" /* SyncResource.Keybindings */: return this.getKeybindingsAssociatedResources(uri, profile);
                case "tasks" /* SyncResource.Tasks */: return this.getTasksAssociatedResources(uri, profile);
                case "snippets" /* SyncResource.Snippets */: return this.getSnippetsAssociatedResources(uri, profile);
                case "globalState" /* SyncResource.GlobalState */: return this.getGlobalStateAssociatedResources(uri, profile);
                case "extensions" /* SyncResource.Extensions */: return this.getExtensionsAssociatedResources(uri, profile);
                case "profiles" /* SyncResource.Profiles */: return this.getProfilesAssociatedResources(uri, profile);
                case "workspaceState" /* SyncResource.WorkspaceState */: return [];
            }
        }
        async getMachineId({ uri }) {
            const resolved = this.resolveUri(uri);
            if (!resolved) {
                return undefined;
            }
            if (resolved.remote) {
                if (resolved.ref) {
                    const { content } = await this.getUserData(resolved.syncResource, resolved.ref, resolved.collection);
                    if (content) {
                        const syncData = this.parseSyncData(content, resolved.syncResource);
                        return syncData?.machineId;
                    }
                }
                return undefined;
            }
            if (resolved.location) {
                if (resolved.ref) {
                    const content = await this.userDataSyncLocalStoreService.resolveResourceContent(resolved.syncResource, resolved.ref, resolved.collection, resolved.location);
                    if (content) {
                        const syncData = this.parseSyncData(content, resolved.syncResource);
                        return syncData?.machineId;
                    }
                }
                return undefined;
            }
            return (0, serviceMachineId_1.getServiceMachineId)(this.environmentService, this.fileService, this.storageService);
        }
        async resolveContent(uri) {
            const resolved = this.resolveUri(uri);
            if (!resolved) {
                return null;
            }
            if (resolved.node === UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE) {
                return null;
            }
            if (resolved.ref) {
                const content = await this.getContentFromStore(resolved.remote, resolved.syncResource, resolved.collection, resolved.ref, resolved.location);
                if (resolved.node && content) {
                    return this.resolveNodeContent(resolved.syncResource, content, resolved.node);
                }
                return content;
            }
            if (!resolved.remote && !resolved.node) {
                return this.resolveLatestContent(resolved.syncResource, resolved.profile);
            }
            return null;
        }
        async getContentFromStore(remote, syncResource, collection, ref, location) {
            if (remote) {
                const { content } = await this.getUserData(syncResource, ref, collection);
                return content;
            }
            return this.userDataSyncLocalStoreService.resolveResourceContent(syncResource, ref, collection, location);
        }
        resolveNodeContent(syncResource, content, node) {
            const syncData = this.parseSyncData(content, syncResource);
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return this.resolveSettingsNodeContent(syncData, node);
                case "keybindings" /* SyncResource.Keybindings */: return this.resolveKeybindingsNodeContent(syncData, node);
                case "tasks" /* SyncResource.Tasks */: return this.resolveTasksNodeContent(syncData, node);
                case "snippets" /* SyncResource.Snippets */: return this.resolveSnippetsNodeContent(syncData, node);
                case "globalState" /* SyncResource.GlobalState */: return this.resolveGlobalStateNodeContent(syncData, node);
                case "extensions" /* SyncResource.Extensions */: return this.resolveExtensionsNodeContent(syncData, node);
                case "profiles" /* SyncResource.Profiles */: return this.resolveProfileNodeContent(syncData, node);
                case "workspaceState" /* SyncResource.WorkspaceState */: return null;
            }
        }
        async resolveLatestContent(syncResource, profileId) {
            const profile = this.userDataProfilesService.profiles.find(p => p.id === profileId);
            if (!profile) {
                return null;
            }
            switch (syncResource) {
                case "globalState" /* SyncResource.GlobalState */: return this.resolveLatestGlobalStateContent(profile);
                case "extensions" /* SyncResource.Extensions */: return this.resolveLatestExtensionsContent(profile);
                case "profiles" /* SyncResource.Profiles */: return this.resolveLatestProfilesContent(profile);
                case "settings" /* SyncResource.Settings */: return null;
                case "keybindings" /* SyncResource.Keybindings */: return null;
                case "tasks" /* SyncResource.Tasks */: return null;
                case "snippets" /* SyncResource.Snippets */: return null;
                case "workspaceState" /* SyncResource.WorkspaceState */: return null;
            }
        }
        getSettingsAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'settings.json');
            const comparableResource = profile ? profile.settingsResource : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveSettingsNodeContent(syncData, node) {
            switch (node) {
                case 'settings.json':
                    return (0, settingsSync_1.parseSettingsSyncContent)(syncData.content).settings;
            }
            return null;
        }
        getKeybindingsAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'keybindings.json');
            const comparableResource = profile ? profile.keybindingsResource : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveKeybindingsNodeContent(syncData, node) {
            switch (node) {
                case 'keybindings.json':
                    return (0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(syncData.content, !!this.configurationService.getValue(userDataSync_1.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM), this.logService);
            }
            return null;
        }
        getTasksAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'tasks.json');
            const comparableResource = profile ? profile.tasksResource : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveTasksNodeContent(syncData, node) {
            switch (node) {
                case 'tasks.json':
                    return (0, tasksSync_1.getTasksContentFromSyncContent)(syncData.content, this.logService);
            }
            return null;
        }
        async getSnippetsAssociatedResources(uri, profile) {
            const content = await this.resolveContent(uri);
            if (content) {
                const syncData = this.parseSyncData(content, "snippets" /* SyncResource.Snippets */);
                if (syncData) {
                    const snippets = (0, snippetsSync_1.parseSnippets)(syncData);
                    const result = [];
                    for (const snippet of Object.keys(snippets)) {
                        const resource = this.extUri.joinPath(uri, snippet);
                        const comparableResource = profile ? this.extUri.joinPath(profile.snippetsHome, snippet) : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
                        result.push({ resource, comparableResource });
                    }
                    return result;
                }
            }
            return [];
        }
        resolveSnippetsNodeContent(syncData, node) {
            return (0, snippetsSync_1.parseSnippets)(syncData)[node] || null;
        }
        getExtensionsAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'extensions.json');
            const comparableResource = profile
                ? this.toUri({
                    remote: false,
                    syncResource: "extensions" /* SyncResource.Extensions */,
                    profile: profile.id,
                    location: undefined,
                    collection: undefined,
                    ref: undefined,
                    node: undefined,
                })
                : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveExtensionsNodeContent(syncData, node) {
            switch (node) {
                case 'extensions.json':
                    return (0, extensionsSync_1.stringify)((0, extensionsSync_1.parseExtensions)(syncData), true);
            }
            return null;
        }
        async resolveLatestExtensionsContent(profile) {
            const { localExtensions } = await this.instantiationService.createInstance(extensionsSync_1.LocalExtensionsProvider).getLocalExtensions(profile);
            return (0, extensionsSync_1.stringify)(localExtensions, true);
        }
        getGlobalStateAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'globalState.json');
            const comparableResource = profile
                ? this.toUri({
                    remote: false,
                    syncResource: "globalState" /* SyncResource.GlobalState */,
                    profile: profile.id,
                    location: undefined,
                    collection: undefined,
                    ref: undefined,
                    node: undefined,
                })
                : this.extUri.joinPath(uri, UserDataSyncResourceProviderService_1.NOT_EXISTING_RESOURCE);
            return [{ resource, comparableResource }];
        }
        resolveGlobalStateNodeContent(syncData, node) {
            switch (node) {
                case 'globalState.json':
                    return (0, globalStateSync_1.stringify)(JSON.parse(syncData.content), true);
            }
            return null;
        }
        async resolveLatestGlobalStateContent(profile) {
            const localGlobalState = await this.instantiationService.createInstance(globalStateSync_1.LocalGlobalStateProvider).getLocalGlobalState(profile);
            return (0, globalStateSync_1.stringify)(localGlobalState, true);
        }
        getProfilesAssociatedResources(uri, profile) {
            const resource = this.extUri.joinPath(uri, 'profiles.json');
            const comparableResource = this.toUri({
                remote: false,
                syncResource: "profiles" /* SyncResource.Profiles */,
                profile: this.userDataProfilesService.defaultProfile.id,
                location: undefined,
                collection: undefined,
                ref: undefined,
                node: undefined,
            });
            return [{ resource, comparableResource }];
        }
        resolveProfileNodeContent(syncData, node) {
            switch (node) {
                case 'profiles.json':
                    return (0, jsonFormatter_1.toFormattedString)(JSON.parse(syncData.content), {});
            }
            return null;
        }
        async resolveLatestProfilesContent(profile) {
            return (0, userDataProfilesManifestSync_1.stringifyLocalProfiles)(this.userDataProfilesService.profiles.filter(p => !p.isDefault && !p.isTransient), true);
        }
        toUri(syncResourceUriInfo) {
            const authority = syncResourceUriInfo.remote ? UserDataSyncResourceProviderService_1.REMOTE_BACKUP_AUTHORITY : UserDataSyncResourceProviderService_1.LOCAL_BACKUP_AUTHORITY;
            const paths = [];
            if (syncResourceUriInfo.location) {
                paths.push(`scheme:${syncResourceUriInfo.location.scheme}`);
                paths.push(`authority:${syncResourceUriInfo.location.authority}`);
                paths.push((0, strings_1.trim)(syncResourceUriInfo.location.path, '/'));
            }
            paths.push(`syncResource:${syncResourceUriInfo.syncResource}`);
            paths.push(`profile:${syncResourceUriInfo.profile}`);
            if (syncResourceUriInfo.collection) {
                paths.push(`collection:${syncResourceUriInfo.collection}`);
            }
            if (syncResourceUriInfo.ref) {
                paths.push(`ref:${syncResourceUriInfo.ref}`);
            }
            if (syncResourceUriInfo.node) {
                paths.push(syncResourceUriInfo.node);
            }
            return this.extUri.joinPath(uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority, path: `/`, query: syncResourceUriInfo.location?.query, fragment: syncResourceUriInfo.location?.fragment }), ...paths);
        }
        resolveUri(uri) {
            if (uri.scheme !== userDataSync_1.USER_DATA_SYNC_SCHEME) {
                return undefined;
            }
            const paths = [];
            while (uri.path !== '/') {
                paths.unshift(this.extUri.basename(uri));
                uri = this.extUri.dirname(uri);
            }
            if (paths.length < 2) {
                return undefined;
            }
            const remote = uri.authority === UserDataSyncResourceProviderService_1.REMOTE_BACKUP_AUTHORITY;
            let scheme;
            let authority;
            const locationPaths = [];
            let syncResource;
            let profile;
            let collection;
            let ref;
            let node;
            while (paths.length) {
                const path = paths.shift();
                if (path.startsWith('scheme:')) {
                    scheme = path.substring('scheme:'.length);
                }
                else if (path.startsWith('authority:')) {
                    authority = path.substring('authority:'.length);
                }
                else if (path.startsWith('syncResource:')) {
                    syncResource = path.substring('syncResource:'.length);
                }
                else if (path.startsWith('profile:')) {
                    profile = path.substring('profile:'.length);
                }
                else if (path.startsWith('collection:')) {
                    collection = path.substring('collection:'.length);
                }
                else if (path.startsWith('ref:')) {
                    ref = path.substring('ref:'.length);
                }
                else if (!syncResource) {
                    locationPaths.push(path);
                }
                else {
                    node = path;
                }
            }
            return {
                remote,
                syncResource: syncResource,
                profile: profile,
                collection,
                ref,
                node,
                location: scheme && authority !== undefined ? this.extUri.joinPath(uri_1.URI.from({ scheme, authority, query: uri.query, fragment: uri.fragment, path: '/' }), ...locationPaths) : undefined
            };
        }
        parseSyncData(content, syncResource) {
            try {
                const syncData = JSON.parse(content);
                if ((0, abstractSynchronizer_1.isSyncData)(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('incompatible sync data', "Cannot parse sync data as it is not compatible with the current version."), "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */, syncResource);
        }
        async getUserData(syncResource, ref, collection) {
            const content = await this.userDataSyncStoreService.resolveResourceContent(syncResource, ref, collection);
            return { ref, content };
        }
    };
    exports.UserDataSyncResourceProviderService = UserDataSyncResourceProviderService;
    exports.UserDataSyncResourceProviderService = UserDataSyncResourceProviderService = UserDataSyncResourceProviderService_1 = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(2, userDataSync_1.IUserDataSyncLogService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, files_1.IFileService),
        __param(7, userDataProfile_1.IUserDataProfilesService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, instantiation_1.IInstantiationService)
    ], UserDataSyncResourceProviderService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jUmVzb3VyY2VQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmNSZXNvdXJjZVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFvQ3pGLElBQU0sbUNBQW1DLEdBQXpDLE1BQU0sbUNBQW1DOztpQkFJdkIsMEJBQXFCLEdBQUcsdUJBQXVCLEFBQTFCLENBQTJCO2lCQUNoRCw0QkFBdUIsR0FBRyxlQUFlLEFBQWxCLENBQW1CO2lCQUMxQywyQkFBc0IsR0FBRyxjQUFjLEFBQWpCLENBQWtCO1FBSWhFLFlBQzZDLHdCQUFtRCxFQUM5Qyw2QkFBNkQsRUFDbEUsVUFBbUMsRUFDMUQsa0JBQXVDLEVBQ3RCLGtCQUF1QyxFQUMzQyxjQUErQixFQUNsQyxXQUF5QixFQUNiLHVCQUFpRCxFQUNwRCxvQkFBMkMsRUFDM0Msb0JBQTJDO1lBVHZDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFDOUMsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUNsRSxlQUFVLEdBQVYsVUFBVSxDQUF5QjtZQUV6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNsQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNiLDRCQUF1QixHQUF2Qix1QkFBdUIsQ0FBMEI7WUFDcEQseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUMzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRW5GLElBQUksQ0FBQyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxDQUFDO1FBQ3pDLENBQUM7UUFFRCxLQUFLLENBQUMsdUJBQXVCO1lBQzVCLE1BQU0s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