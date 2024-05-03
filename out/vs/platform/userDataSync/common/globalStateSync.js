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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/json", "vs/base/common/jsonFormatter", "vs/base/common/platform", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/globalStateMerge", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataProfile/common/userDataProfileStorageService", "vs/platform/instantiation/common/instantiation"], function (require, exports, buffer_1, errors_1, event_1, json_1, jsonFormatter_1, platform_1, uuid_1, configuration_1, environment_1, files_1, log_1, serviceMachineId_1, storage_1, telemetry_1, uriIdentity_1, abstractSynchronizer_1, content_1, globalStateMerge_1, userDataSync_1, userDataProfile_1, userDataProfileStorageService_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncStoreTypeSynchronizer = exports.GlobalStateInitializer = exports.LocalGlobalStateProvider = exports.GlobalStateSynchroniser = void 0;
    exports.stringify = stringify;
    const argvStoragePrefx = 'globalState.argv.';
    const argvProperties = ['locale'];
    function stringify(globalState, format) {
        const storageKeys = globalState.storage ? Object.keys(globalState.storage).sort() : [];
        const storage = {};
        storageKeys.forEach(key => storage[key] = globalState.storage[key]);
        globalState.storage = storage;
        return format ? (0, jsonFormatter_1.toFormattedString)(globalState, {}) : JSON.stringify(globalState);
    }
    const GLOBAL_STATE_DATA_VERSION = 1;
    /**
     * Synchronises global state that includes
     * 	- Global storage with user scope
     * 	- Locale from argv properties
     *
     * Global storage is synced without checking version just like other resources (settings, keybindings).
     * If there is a change in format of the value of a storage key which requires migration then
     * 		Owner of that key should remove that key from user scope and replace that with new user scoped key.
     */
    let GlobalStateSynchroniser = class GlobalStateSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(profile, collection, userDataProfileStorageService, fileService, userDataSyncStoreService, userDataSyncLocalStoreService, logService, environmentService, userDataSyncEnablementService, telemetryService, configurationService, storageService, uriIdentityService, instantiationService) {
            super({ syncResource: "globalState" /* SyncResource.GlobalState */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.version = GLOBAL_STATE_DATA_VERSION;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'globalState.json');
            this.baseResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' });
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
            this.localGlobalStateProvider = instantiationService.createInstance(LocalGlobalStateProvider);
            this._register(fileService.watch(this.extUri.dirname(this.environmentService.argvResource)));
            this._register(event_1.Event.any(
            /* Locale change */
            event_1.Event.filter(fileService.onDidFilesChange, e => e.contains(this.environmentService.argvResource)), event_1.Event.filter(userDataProfileStorageService.onDidChange, e => {
                /* StorageTarget has changed in profile storage */
                if (e.targetChanges.some(profile => this.syncResource.profile.id === profile.id)) {
                    return true;
                }
                /* User storage data has changed in profile storage */
                if (e.valueChanges.some(({ profile, changes }) => this.syncResource.profile.id === profile.id && changes.some(change => change.target === 0 /* StorageTarget.USER */))) {
                    return true;
                }
                return false;
            }))((() => this.triggerLocalChange())));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine) {
            const remoteGlobalState = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncGlobalState = lastSyncUserData && lastSyncUserData.syncData ? JSON.parse(lastSyncUserData.syncData.content) : null;
            const localGlobalState = await this.localGlobalStateProvider.getLocalGlobalState(this.syncResource.profile);
            if (remoteGlobalState) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote ui state with local ui state...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote ui state does not exist. Synchronizing ui state for the first time.`);
            }
            const storageKeys = await this.getStorageKeys(lastSyncGlobalState);
            const { local, remote } = (0, globalStateMerge_1.merge)(localGlobalState.storage, remoteGlobalState ? remoteGlobalState.storage : null, lastSyncGlobalState ? lastSyncGlobalState.storage : null, storageKeys, this.logService);
            const previewResult = {
                content: null,
                local,
                remote,
                localChange: Object.keys(local.added).length > 0 || Object.keys(local.updated).length > 0 || local.removed.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                remoteChange: remote.all !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
            };
            const localContent = stringify(localGlobalState, false);
            return [{
                    baseResource: this.baseResource,
                    baseContent: lastSyncGlobalState ? stringify(lastSyncGlobalState, false) : localContent,
                    localResource: this.localResource,
                    localContent,
                    localUserData: localGlobalState,
                    remoteResource: this.remoteResource,
                    remoteContent: remoteGlobalState ? stringify(remoteGlobalState, false) : null,
                    previewResource: this.previewResource,
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.acceptedResource,
                    storageKeys
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncGlobalState = lastSyncUserData.syncData ? JSON.parse(lastSyncUserData.syncData.content) : null;
            if (lastSyncGlobalState === null) {
                return true;
            }
            const localGlobalState = await this.localGlobalStateProvider.getLocalGlobalState(this.syncResource.profile);
            const storageKeys = await this.getStorageKeys(lastSyncGlobalState);
            const { remote } = (0, globalStateMerge_1.merge)(localGlobalState.storage, lastSyncGlobalState.storage, lastSyncGlobalState.storage, storageKeys, this.logService);
            return remote.all !== null;
        }
        async getMergeResult(resourcePreview, token) {
            return { ...resourcePreview.previewResult, hasConflicts: false };
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqual(resource, this.localResource)) {
                return this.acceptLocal(resourcePreview);
            }
            /* Accept remote resource */
            if (this.extUri.isEqual(resource, this.remoteResource)) {
                return this.acceptRemote(resourcePreview);
            }
            /* Accept preview resource */
            if (this.extUri.isEqual(resource, this.previewResource)) {
                return resourcePreview.previewResult;
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async acceptLocal(resourcePreview) {
            return {
                content: resourcePreview.localContent,
                local: { added: {}, removed: [], updated: {} },
                remote: { added: Object.keys(resourcePreview.localUserData.storage), removed: [], updated: [], all: resourcePreview.localUserData.storage },
                localChange: 0 /* Change.None */,
                remoteChange: 2 /* Change.Modified */,
            };
        }
        async acceptRemote(resourcePreview) {
            if (resourcePreview.remoteContent !== null) {
                const remoteGlobalState = JSON.parse(resourcePreview.remoteContent);
                const { local, remote } = (0, globalStateMerge_1.merge)(resourcePreview.localUserData.storage, remoteGlobalState.storage, null, resourcePreview.storageKeys, this.logService);
                return {
                    content: resourcePreview.remoteContent,
                    local,
                    remote,
                    localChange: Object.keys(local.added).length > 0 || Object.keys(local.updated).length > 0 || local.removed.length > 0 ? 2 /* Change.Modified */ : 0 /* Change.None */,
                    remoteChange: remote !== null ? 2 /* Change.Modified */ : 0 /* Change.None */,
                };
            }
            else {
                return {
                    content: resourcePreview.remoteContent,
                    local: { added: {}, removed: [], updated: {} },
                    remote: { added: [], removed: [], updated: [], all: null },
                    localChange: 0 /* Change.None */,
                    remoteChange: 0 /* Change.None */,
                };
            }
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            const { localUserData } = resourcePreviews[0][0];
            const { local, remote, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing ui state.`);
            }
            if (localChange !== 0 /* Change.None */) {
                // update local
                this.logService.trace(`${this.syncResourceLogLabel}: Updating local ui state...`);
                await this.backupLocal(JSON.stringify(localUserData));
                await this.localGlobalStateProvider.writeLocalGlobalState(local, this.syncResource.profile);
                this.logService.info(`${this.syncResourceLogLabel}: Updated local ui state`);
            }
            if (remoteChange !== 0 /* Change.None */) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote ui state...`);
                const content = JSON.stringify({ storage: remote.all });
                remoteUserData = await this.updateRemoteUserData(content, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote ui state.${remote.added.length ? ` Added: ${remote.added}.` : ''}${remote.updated.length ? ` Updated: ${remote.updated}.` : ''}${remote.removed.length ? ` Removed: ${remote.removed}.` : ''}`);
            }
            if (lastSyncUserData?.ref !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized ui state...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized ui state`);
            }
        }
        async resolveContent(uri) {
            if (this.extUri.isEqual(this.remoteResource, uri)
                || this.extUri.isEqual(this.baseResource, uri)
                || this.extUri.isEqual(this.localResource, uri)
                || this.extUri.isEqual(this.acceptedResource, uri)) {
                const content = await this.resolvePreviewContent(uri);
                return content ? stringify(JSON.parse(content), true) : content;
            }
            return null;
        }
        async hasLocalData() {
            try {
                const { storage } = await this.localGlobalStateProvider.getLocalGlobalState(this.syncResource.profile);
                if (Object.keys(storage).length > 1 || storage[`${argvStoragePrefx}.locale`]?.value !== 'en') {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async getStorageKeys(lastSyncGlobalState) {
            const storageData = await this.userDataProfileStorageService.readStorageData(this.syncResource.profile);
            const user = [], machine = [];
            for (const [key, value] of storageData) {
                if (value.target === 0 /* StorageTarget.USER */) {
                    user.push(key);
                }
                else if (value.target === 1 /* StorageTarget.MACHINE */) {
                    machine.push(key);
                }
            }
            const registered = [...user, ...machine];
            const unregistered = lastSyncGlobalState?.storage ? Object.keys(lastSyncGlobalState.storage).filter(key => !key.startsWith(argvStoragePrefx) && !registered.includes(key) && storageData.get(key) !== undefined) : [];
            if (!platform_1.isWeb) {
                // Following keys are synced only in web. Do not sync these keys in other platforms
                const keysSyncedOnlyInWeb = [...userDataSync_1.ALL_SYNC_RESOURCES.map(resource => (0, userDataSync_1.getEnablementKey)(resource)), userDataSync_1.SYNC_SERVICE_URL_TYPE];
                unregistered.push(...keysSyncedOnlyInWeb);
                machine.push(...keysSyncedOnlyInWeb);
            }
            return { user, machine, unregistered };
        }
    };
    exports.GlobalStateSynchroniser = GlobalStateSynchroniser;
    exports.GlobalStateSynchroniser = GlobalStateSynchroniser = __decorate([
        __param(2, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(3, files_1.IFileService),
        __param(4, userDataSync_1.IUserDataSyncStoreService),
        __param(5, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(6, userDataSync_1.IUserDataSyncLogService),
        __param(7, environment_1.IEnvironmentService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, storage_1.IStorageService),
        __param(12, uriIdentity_1.IUriIdentityService),
        __param(13, instantiation_1.IInstantiationService)
    ], GlobalStateSynchroniser);
    let LocalGlobalStateProvider = class LocalGlobalStateProvider {
        constructor(fileService, environmentService, userDataProfileStorageService, logService) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.userDataProfileStorageService = userDataProfileStorageService;
            this.logService = logService;
        }
        async getLocalGlobalState(profile) {
            const storage = {};
            if (profile.isDefault) {
                const argvContent = await this.getLocalArgvContent();
                const argvValue = (0, json_1.parse)(argvContent);
                for (const argvProperty of argvProperties) {
                    if (argvValue[argvProperty] !== undefined) {
                        storage[`${argvStoragePrefx}${argvProperty}`] = { version: 1, value: argvValue[argvProperty] };
                    }
                }
            }
            const storageData = await this.userDataProfileStorageService.readStorageData(profile);
            for (const [key, value] of storageData) {
                if (value.value && value.target === 0 /* StorageTarget.USER */) {
                    storage[key] = { version: 1, value: value.value };
                }
            }
            return { storage };
        }
        async getLocalArgvContent() {
            try {
                this.logService.debug('GlobalStateSync#getLocalArgvContent', this.environmentService.argvResource);
                const content = await this.fileService.readFile(this.environmentService.argvResource);
                this.logService.debug('GlobalStateSync#getLocalArgvContent - Resolved', this.environmentService.argvResource);
                return content.value.toString();
            }
            catch (error) {
                this.logService.debug((0, errors_1.getErrorMessage)(error));
            }
            return '{}';
        }
        async writeLocalGlobalState({ added, removed, updated }, profile) {
            const syncResourceLogLabel = (0, abstractSynchronizer_1.getSyncResourceLogLabel)("globalState" /* SyncResource.GlobalState */, profile);
            const argv = {};
            const updatedStorage = new Map();
            const storageData = await this.userDataProfileStorageService.readStorageData(profile);
            const handleUpdatedStorage = (keys, storage) => {
                for (const key of keys) {
                    if (key.startsWith(argvStoragePrefx)) {
                        argv[key.substring(argvStoragePrefx.length)] = storage ? storage[key].value : undefined;
                        continue;
                    }
                    if (storage) {
                        const storageValue = storage[key];
                        if (storageValue.value !== storageData.get(key)?.value) {
                            updatedStorage.set(key, storageValue.value);
                        }
                    }
                    else {
                        if (storageData.get(key) !== undefined) {
                            updatedStorage.set(key, undefined);
                        }
                    }
                }
            };
            handleUpdatedStorage(Object.keys(added), added);
            handleUpdatedStorage(Object.keys(updated), updated);
            handleUpdatedStorage(removed);
            if (Object.keys(argv).length) {
                this.logService.trace(`${syncResourceLogLabel}: Updating locale...`);
                const argvContent = await this.getLocalArgvContent();
                let content = argvContent;
                for (const argvProperty of Object.keys(argv)) {
                    content = (0, content_1.edit)(content, [argvProperty], argv[argvProperty], {});
                }
                if (argvContent !== content) {
                    this.logService.trace(`${syncResourceLogLabel}: Updating locale...`);
                    await this.fileService.writeFile(this.environmentService.argvResource, buffer_1.VSBuffer.fromString(content));
                    this.logService.info(`${syncResourceLogLabel}: Updated locale.`);
                }
                this.logService.info(`${syncResourceLogLabel}: Updated locale`);
            }
            if (updatedStorage.size) {
                this.logService.trace(`${syncResourceLogLabel}: Updating global state...`);
                await this.userDataProfileStorageService.updateStorageData(profile, updatedStorage, 0 /* StorageTarget.USER */);
                this.logService.info(`${syncResourceLogLabel}: Updated global state`, [...updatedStorage.keys()]);
            }
        }
    };
    exports.LocalGlobalStateProvider = LocalGlobalStateProvider;
    exports.LocalGlobalStateProvider = LocalGlobalStateProvider = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataProfileStorageService_1.IUserDataProfileStorageService),
        __param(3, userDataSync_1.IUserDataSyncLogService)
    ], LocalGlobalStateProvider);
    let GlobalStateInitializer = class GlobalStateInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(storageService, fileService, userDataProfilesService, environmentService, logService, uriIdentityService) {
            super("globalState" /* SyncResource.GlobalState */, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService);
        }
        async doInitialize(remoteUserData) {
            const remoteGlobalState = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
            if (!remoteGlobalState) {
                this.logService.info('Skipping initializing global state because remote global state does not exist.');
                return;
            }
            const argv = {};
            const storage = {};
            for (const key of Object.keys(remoteGlobalState.storage)) {
                if (key.startsWith(argvStoragePrefx)) {
                    argv[key.substring(argvStoragePrefx.length)] = remoteGlobalState.storage[key].value;
                }
                else {
                    if (this.storageService.get(key, 0 /* StorageScope.PROFILE */) === undefined) {
                        storage[key] = remoteGlobalState.storage[key].value;
                    }
                }
            }
            if (Object.keys(argv).length) {
                let content = '{}';
                try {
                    const fileContent = await this.fileService.readFile(this.environmentService.argvResource);
                    content = fileContent.value.toString();
                }
                catch (error) { }
                for (const argvProperty of Object.keys(argv)) {
                    content = (0, content_1.edit)(content, [argvProperty], argv[argvProperty], {});
                }
                await this.fileService.writeFile(this.environmentService.argvResource, buffer_1.VSBuffer.fromString(content));
            }
            if (Object.keys(storage).length) {
                const storageEntries = [];
                for (const key of Object.keys(storage)) {
                    storageEntries.push({ key, value: storage[key], scope: 0 /* StorageScope.PROFILE */, target: 0 /* StorageTarget.USER */ });
                }
                this.storageService.storeAll(storageEntries, true);
            }
        }
    };
    exports.GlobalStateInitializer = GlobalStateInitializer;
    exports.GlobalStateInitializer = GlobalStateInitializer = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, files_1.IFileService),
        __param(2, userDataProfile_1.IUserDataProfilesService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], GlobalStateInitializer);
    let UserDataSyncStoreTypeSynchronizer = class UserDataSyncStoreTypeSynchronizer {
        constructor(userDataSyncStoreClient, storageService, environmentService, fileService, logService) {
            this.userDataSyncStoreClient = userDataSyncStoreClient;
            this.storageService = storageService;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.logService = logService;
        }
        getSyncStoreType(userData) {
            const remoteGlobalState = this.parseGlobalState(userData);
            return remoteGlobalState?.storage[userDataSync_1.SYNC_SERVICE_URL_TYPE]?.value;
        }
        async sync(userDataSyncStoreType) {
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)());
            try {
                return await this.doSync(userDataSyncStoreType, syncHeaders);
            }
            catch (e) {
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */:
                            this.logService.info(`Failed to synchronize UserDataSyncStoreType as there is a new remote version available. Synchronizing again...`);
                            return this.doSync(userDataSyncStoreType, syncHeaders);
                    }
                }
                throw e;
            }
        }
        async doSync(userDataSyncStoreType, syncHeaders) {
            // Read the global state from remote
            const globalStateUserData = await this.userDataSyncStoreClient.readResource("globalState" /* SyncResource.GlobalState */, null, undefined, syncHeaders);
            const remoteGlobalState = this.parseGlobalState(globalStateUserData) || { storage: {} };
            // Update the sync store type
            remoteGlobalState.storage[userDataSync_1.SYNC_SERVICE_URL_TYPE] = { value: userDataSyncStoreType, version: GLOBAL_STATE_DATA_VERSION };
            // Write the global state to remote
            const machineId = await (0, serviceMachineId_1.getServiceMachineId)(this.environmentService, this.fileService, this.storageService);
            const syncDataToUpdate = { version: GLOBAL_STATE_DATA_VERSION, machineId, content: stringify(remoteGlobalState, false) };
            await this.userDataSyncStoreClient.writeResource("globalState" /* SyncResource.GlobalState */, JSON.stringify(syncDataToUpdate), globalStateUserData.ref, undefined, syncHeaders);
        }
        parseGlobalState({ content }) {
            if (!content) {
                return null;
            }
            const syncData = JSON.parse(content);
            if ((0, abstractSynchronizer_1.isSyncData)(syncData)) {
                return syncData ? JSON.parse(syncData.content) : null;
            }
            throw new Error('Invalid remote data');
        }
    };
    exports.UserDataSyncStoreTypeSynchronizer = UserDataSyncStoreTypeSynchronizer;
    exports.UserDataSyncStoreTypeSynchronizer = UserDataSyncStoreTypeSynchronizer = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, log_1.ILogService)
    ], UserDataSyncStoreTypeSynchronizer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsU3RhdGVTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL2dsb2JhbFN0YXRlU3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUE4Q2hHLDhCQU1DO0lBdEJELE1BQU0sZ0JBQWdCLEdBQUcsbUJBQW1CLENBQUM7SUFDN0MsTUFBTSxjQUFjLEdBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQWU1QyxTQUFnQixTQUFTLENBQUMsV0FBeUIsRUFBRSxNQUFlO1FBQ25FLE1BQU0sV0FBVyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDdkYsTUFBTSxPQUFPLEdBQXFDLEVBQUUsQ0FBQztRQUNyRCxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwRSxXQUFXLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUM5QixPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBQSxpQ0FBaUIsRUFBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbEYsQ0FBQztJQUVELE1BQU0seUJBQXlCLEdBQUcsQ0FBQyxDQUFDO0lBRXBDOzs7Ozs7OztPQVFHO0lBQ0ksSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSwyQ0FBb0I7UUFXaEUsWUFDQyxPQUF5QixFQUN6QixVQUE4QixFQUNFLDZCQUE4RSxFQUNoRyxXQUF5QixFQUNaLHdCQUFtRCxFQUM5Qyw2QkFBNkQsRUFDcEUsVUFBbUMsRUFDdkMsa0JBQXVDLEVBQzVCLDZCQUE2RCxFQUMxRSxnQkFBbUMsRUFDL0Isb0JBQTJDLEVBQ2pELGNBQStCLEVBQzNCLGtCQUF1QyxFQUNyQyxvQkFBMkM7WUFFbEUsS0FBSyxDQUFDLEVBQUUsWUFBWSw4Q0FBMEIsRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSw2QkFBNkIsRUFBRSw2QkFBNkIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQWJ2TyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBWjVGLFlBQU8sR0FBVyx5QkFBeUIsQ0FBQztZQUM5QyxvQkFBZSxHQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hGLGlCQUFZLEdBQVEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsb0NBQXFCLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDcEcsa0JBQWEsR0FBUSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxvQ0FBcUIsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN0RyxtQkFBYyxHQUFRLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLG9DQUFxQixFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hHLHFCQUFnQixHQUFRLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLG9DQUFxQixFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBcUI1SCxJQUFJLENBQUMsd0JBQXdCLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsSUFBSSxDQUFDLFNBQVMsQ0FDYixhQUFLLENBQUMsR0FBRztZQUNSLG1CQUFtQjtZQUNuQixhQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQ2pHLGFBQUssQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUMzRCxrREFBa0Q7Z0JBQ2xELElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQ2xGLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7Z0JBQ0Qsc0RBQXNEO2dCQUN0RCxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxPQUFPLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSwrQkFBdUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDaEssT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFDRCxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUNGLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDLENBQ3BDLENBQUM7UUFDSCxDQUFDO1FBRVMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLGNBQStCLEVBQUUsZ0JBQXdDLEVBQUUsOEJBQXVDO1lBQ3JKLE1BQU0saUJBQWlCLEdBQWlCLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRXJILDBHQUEwRztZQUMxRyxnQkFBZ0IsR0FBRyxnQkFBZ0IsS0FBSyxJQUFJLElBQUksOEJBQThCLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7WUFDbkgsTUFBTSxtQkFBbUIsR0FBd0IsZ0JBQWdCLElBQUksZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRXRKLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU1RyxJQUFJLGlCQUFpQixFQUFFLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixrREFBa0QsQ0FBQyxDQUFDO1lBQ3ZHLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsOEVBQThFLENBQUMsQ0FBQztZQUNuSSxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbkUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxJQUFBLHdCQUFLLEVBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN4TSxNQUFNLGFBQWEsR0FBb0M7Z0JBQ3RELE9BQU8sRUFBRSxJQUFJO2dCQUNiLEtBQUs7Z0JBQ0wsTUFBTTtnQkFDTixXQUFXLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLHlCQUFpQixDQUFDLG9CQUFZO2dCQUNySixZQUFZLEVBQUUsTUFBTSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyx5QkFBaUIsQ0FBQyxvQkFBWTthQUNqRSxDQUFDO1lBRUYsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE9BQU8sQ0FBQztvQkFDUCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7b0JBQy9CLFdBQVcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZO29CQUN2RixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7b0JBQ2pDLFlBQVk7b0JBQ1osYUFBYSxFQUFFLGdCQUFnQjtvQkFDL0IsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO29CQUNuQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtvQkFDN0UsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO29CQUNyQyxhQUFhO29CQUNiLFdBQVcsRUFBRSxhQUFhLENBQUMsV0FBVztvQkFDdEMsWUFBWSxFQUFFLGFBQWEsQ0FBQyxZQUFZO29CQUN4QyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO29CQUN2QyxXQUFXO2lCQUNYLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFUyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWlDO1lBQ2pFLE1BQU0sbUJBQW1CLEdBQXdCLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNsSSxJQUFJLG1CQUFtQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUNsQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDNUcsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbkUsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsd0JBQUssRUFBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsbUJBQW1CLENBQUMsT0FBTyxFQUFFLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNJLE9BQU8sTUFBTSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUM7UUFDNUIsQ0FBQztRQUVTLEtBQUssQ0FBQyxjQUFjLENBQUMsZUFBNEMsRUFBRSxLQUF3QjtZQUNwRyxPQUFPLEVBQUUsR0FBRyxlQUFlLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNsRSxDQUFDO1FBRVMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxlQUE0QyxFQUFFLFFBQWEsRUFBRSxPQUFrQyxFQUFFLEtBQXdCO1lBRXhKLDJCQUEyQjtZQUMzQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzFDLENBQUM7WUFFRCw0QkFBNEI7WUFDNUIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBRUQsNkJBQTZCO1lBQzdCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO2dCQUN6RCxPQUFPLGVBQWUsQ0FBQyxhQUFhLENBQUM7WUFDdEMsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDN0QsQ0FBQztRQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBNEM7WUFDckUsT0FBTztnQkFDTixPQUFPLEVBQUUsZUFBZSxDQUFDLFlBQVk7Z0JBQ3JDLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO2dCQUM5QyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsZUFBZSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUU7Z0JBQzNJLFdBQVcscUJBQWE7Z0JBQ3hCLFlBQVkseUJBQWlCO2FBQzdCLENBQUM7UUFDSCxDQUFDO1FBRU8sS0FBSyxDQUFDLFlBQVksQ0FBQyxlQUE0QztZQUN0RSxJQUFJLGVBQWUsQ0FBQyxhQUFhLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQzVDLE1BQU0saUJBQWlCLEdBQWlCLElBQUksQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUEsd0JBQUssRUFBQyxlQUFlLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN0SixPQUFPO29CQUNOLE9BQU8sRUFBRSxlQUFlLENBQUMsYUFBYTtvQkFDdEMsS0FBSztvQkFDTCxNQUFNO29CQUNOLFdBQVcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMseUJBQWlCLENBQUMsb0JBQVk7b0JBQ3JKLFlBQVksRUFBRSxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMseUJBQWlCLENBQUMsb0JBQVk7aUJBQzdELENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTztvQkFDTixPQUFPLEVBQUUsZUFBZSxDQUFDLGFBQWE7b0JBQ3RDLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO29CQUM5QyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO29CQUMxRCxXQUFXLHFCQUFhO29CQUN4QixZQUFZLHFCQUFhO2lCQUN6QixDQUFDO1lBQ0gsQ0FBQztRQUNGLENBQUM7UUFFUyxLQUFLLENBQUMsV0FBVyxDQUFDLGNBQStCLEVBQUUsZ0JBQXdDLEVBQUUsZ0JBQWtGLEVBQUUsS0FBYztZQUN4TSxNQUFNLEVBQUUsYUFBYSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakQsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTVFLElBQUksV0FBVyx3QkFBZ0IsSUFBSSxZQUFZLHdCQUFnQixFQUFFLENBQUM7Z0JBQ2pFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixtREFBbUQsQ0FBQyxDQUFDO1lBQ3ZHLENBQUM7WUFFRCxJQUFJLFdBQVcsd0JBQWdCLEVBQUUsQ0FBQztnQkFDakMsZUFBZTtnQkFDZixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsOEJBQThCLENBQUMsQ0FBQztnQkFDbEYsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxJQUFJLENBQUMsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzVGLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQiwwQkFBMEIsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFFRCxJQUFJLFlBQVksd0JBQWdCLEVBQUUsQ0FBQztnQkFDbEMsZ0JBQWdCO2dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsK0JBQStCLENBQUMsQ0FBQztnQkFDbkYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBZSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDdEUsY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3RixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsNkJBQTZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxXQUFXLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxhQUFhLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxhQUFhLE1BQU0sQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNwUSxDQUFDO1lBRUQsSUFBSSxnQkFBZ0IsRUFBRSxHQUFHLEtBQUssY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNsRCxtQkFBbUI7Z0JBQ25CLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQiwwQ0FBMEMsQ0FBQyxDQUFDO2dCQUM5RixNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLHNDQUFzQyxDQUFDLENBQUM7WUFDMUYsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQVE7WUFDNUIsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQzttQkFDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUM7bUJBQzNDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDO21CQUM1QyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLEVBQ2pELENBQUM7Z0JBQ0YsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RELE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxLQUFLLENBQUMsWUFBWTtZQUNqQixJQUFJLENBQUM7Z0JBQ0osTUFBTSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3ZHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLGdCQUFnQixTQUFTLENBQUMsRUFBRSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQzlGLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsa0JBQWtCO1lBQ25CLENBQUM7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFTyxLQUFLLENBQUMsY0FBYyxDQUFDLG1CQUF3QztZQUNwRSxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN4RyxNQUFNLElBQUksR0FBYSxFQUFFLEVBQUUsT0FBTyxHQUFhLEVBQUUsQ0FBQztZQUNsRCxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksS0FBSyxDQUFDLE1BQU0sK0JBQXVCLEVBQUUsQ0FBQztvQkFDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEIsQ0FBQztxQkFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLGtDQUEwQixFQUFFLENBQUM7b0JBQ25ELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDRixDQUFDO1lBQ0QsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sWUFBWSxHQUFHLG1CQUFtQixFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBRXROLElBQUksQ0FBQyxnQkFBSyxFQUFFLENBQUM7Z0JBQ1osbUZBQW1GO2dCQUNuRixNQUFNLG1CQUFtQixHQUFHLENBQUMsR0FBRyxpQ0FBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFBLCtCQUFnQixFQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsb0NBQXFCLENBQUMsQ0FBQztnQkFDdkgsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLG1CQUFtQixDQUFDLENBQUM7Z0JBQzFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3RDLENBQUM7WUFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztRQUN4QyxDQUFDO0tBQ0QsQ0FBQTtJQTdPWSwwREFBdUI7c0NBQXZCLHVCQUF1QjtRQWNqQyxXQUFBLDhEQUE4QixDQUFBO1FBQzlCLFdBQUEsb0JBQVksQ0FBQTtRQUNaLFdBQUEsd0NBQXlCLENBQUE7UUFDekIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLHNDQUF1QixDQUFBO1FBQ3ZCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFlBQUEscUNBQXFCLENBQUE7UUFDckIsWUFBQSx5QkFBZSxDQUFBO1FBQ2YsWUFBQSxpQ0FBbUIsQ0FBQTtRQUNuQixZQUFBLHFDQUFxQixDQUFBO09BekJYLHVCQUF1QixDQTZPbkM7SUFFTSxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF3QjtRQUNwQyxZQUNnQyxXQUF5QixFQUNsQixrQkFBdUMsRUFDNUIsNkJBQTZELEVBQ3BFLFVBQW1DO1lBSDlDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2xCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDNUIsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUFnQztZQUNwRSxlQUFVLEdBQVYsVUFBVSxDQUF5QjtRQUMxRSxDQUFDO1FBRUwsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE9BQXlCO1lBQ2xELE1BQU0sT0FBTyxHQUFxQyxFQUFFLENBQUM7WUFDckQsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sV0FBVyxHQUFXLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzdELE1BQU0sU0FBUyxHQUEyQixJQUFBLFlBQUssRUFBQyxXQUFXLENBQUMsQ0FBQztnQkFDN0QsS0FBSyxNQUFNLFlBQVksSUFBSSxjQUFjLEVBQUUsQ0FBQztvQkFDM0MsSUFBSSxTQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7d0JBQzNDLE9BQU8sQ0FBQyxHQUFHLGdCQUFnQixHQUFHLFlBQVksRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztvQkFDaEcsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUNELE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0RixLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ3hDLElBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSwrQkFBdUIsRUFBRSxDQUFDO29CQUN4RCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25ELENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFTyxLQUFLLENBQUMsbUJBQW1CO1lBQ2hDLElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ25HLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUN0RixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzlHLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNqQyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBQSx3QkFBZSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUE2RyxFQUFFLE9BQXlCO1lBQzVMLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSw4Q0FBdUIsZ0RBQTJCLE9BQU8sQ0FBQyxDQUFDO1lBQ3hGLE1BQU0sSUFBSSxHQUEyQixFQUFFLENBQUM7WUFDeEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQThCLENBQUM7WUFDN0QsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RGLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxJQUFjLEVBQUUsT0FBMEMsRUFBUSxFQUFFO2dCQUNqRyxLQUFLLE1BQU0sR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO29CQUN4QixJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO3dCQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO3dCQUN4RixTQUFTO29CQUNWLENBQUM7b0JBQ0QsSUFBSSxPQUFPLEVBQUUsQ0FBQzt3QkFDYixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2xDLElBQUksWUFBWSxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDOzRCQUN4RCxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQzdDLENBQUM7b0JBQ0YsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLElBQUksV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTLEVBQUUsQ0FBQzs0QkFDeEMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3BDLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDO1lBQ0Ysb0JBQW9CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRCxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BELG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTlCLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxvQkFBb0Isc0JBQXNCLENBQUMsQ0FBQztnQkFDckUsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDckQsSUFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDO2dCQUMxQixLQUFLLE1BQU0sWUFBWSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDOUMsT0FBTyxHQUFHLElBQUEsY0FBSSxFQUFDLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakUsQ0FBQztnQkFDRCxJQUFJLFdBQVcsS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxvQkFBb0Isc0JBQXNCLENBQUMsQ0FBQztvQkFDckUsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7b0JBQ3JHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQW9CLG1CQUFtQixDQUFDLENBQUM7Z0JBQ2xFLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxvQkFBb0Isa0JBQWtCLENBQUMsQ0FBQztZQUNqRSxDQUFDO1lBRUQsSUFBSSxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3pCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsb0JBQW9CLDRCQUE0QixDQUFDLENBQUM7Z0JBQzNFLE1BQU0sSUFBSSxDQUFDLDZCQUE2QixDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxjQUFjLDZCQUFxQixDQUFDO2dCQUN4RyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLG9CQUFvQix3QkFBd0IsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNuRyxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUE7SUF4RlksNERBQXdCO3VDQUF4Qix3QkFBd0I7UUFFbEMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLDhEQUE4QixDQUFBO1FBQzlCLFdBQUEsc0NBQXVCLENBQUE7T0FMYix3QkFBd0IsQ0F3RnBDO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSwwQ0FBbUI7UUFFOUQsWUFDa0IsY0FBK0IsRUFDbEMsV0FBeUIsRUFDYix1QkFBaUQsRUFDdEQsa0JBQXVDLEVBQ25DLFVBQW1DLEVBQ3ZDLGtCQUF1QztZQUU1RCxLQUFLLCtDQUEyQix1QkFBdUIsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1FBQzNJLENBQUM7UUFFUyxLQUFLLENBQUMsWUFBWSxDQUFDLGNBQStCO1lBQzNELE1BQU0saUJBQWlCLEdBQWlCLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3JILElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO2dCQUN2RyxPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUEyQixFQUFFLENBQUM7WUFDeEMsTUFBTSxPQUFPLEdBQTJCLEVBQUUsQ0FBQztZQUMzQyxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDMUQsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztvQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNyRixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxHQUFHLCtCQUF1QixLQUFLLFNBQVMsRUFBRSxDQUFDO3dCQUN0RSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztvQkFDckQsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUNuQixJQUFJLENBQUM7b0JBQ0osTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQzFGLE9BQU8sR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUN4QyxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixLQUFLLE1BQU0sWUFBWSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDOUMsT0FBTyxHQUFHLElBQUEsY0FBSSxFQUFDLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakUsQ0FBQztnQkFDRCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUN0RyxDQUFDO1lBRUQsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQyxNQUFNLGNBQWMsR0FBeUIsRUFBRSxDQUFDO2dCQUNoRCxLQUFLLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDeEMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssOEJBQXNCLEVBQUUsTUFBTSw0QkFBb0IsRUFBRSxDQUFDLENBQUM7Z0JBQzVHLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3BELENBQUM7UUFDRixDQUFDO0tBRUQsQ0FBQTtJQXJEWSx3REFBc0I7cUNBQXRCLHNCQUFzQjtRQUdoQyxXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLDBDQUF3QixDQUFBO1FBQ3hCLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxzQ0FBdUIsQ0FBQTtRQUN2QixXQUFBLGlDQUFtQixDQUFBO09BUlQsc0JBQXNCLENBcURsQztJQUVNLElBQU0saUNBQWlDLEdBQXZDLE1BQU0saUNBQWlDO1FBRTdDLFlBQ2tCLHVCQUFnRCxFQUMvQixjQUErQixFQUMzQixrQkFBdUMsRUFDOUMsV0FBeUIsRUFDMUIsVUFBdUI7WUFKcEMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUF5QjtZQUMvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDM0IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUM5QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1FBRXRELENBQUM7UUFFRCxnQkFBZ0IsQ0FBQyxRQUFtQjtZQUNuQyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxRCxPQUFPLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxvQ0FBcUIsQ0FBQyxFQUFFLEtBQThCLENBQUM7UUFDMUYsQ0FBQztRQUVELEtBQUssQ0FBQyxJQUFJLENBQUMscUJBQTRDO1lBQ3RELE1BQU0sV0FBVyxHQUFHLElBQUEsZ0NBQWlCLEVBQUMsSUFBQSxtQkFBWSxHQUFFLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUM7Z0JBQ0osT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMscUJBQXFCLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLFlBQVksZ0NBQWlCLEVBQUUsQ0FBQztvQkFDcEMsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7d0JBQ2hCOzRCQUNDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdIQUFnSCxDQUFDLENBQUM7NEJBQ3ZJLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDekQsQ0FBQztnQkFDRixDQUFDO2dCQUNELE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsTUFBTSxDQUFDLHFCQUE0QyxFQUFFLFdBQXFCO1lBQ3ZGLG9DQUFvQztZQUNwQyxNQUFNLG1CQUFtQixHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksK0NBQTJCLElBQUksRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDcEksTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FBQztZQUV4Riw2QkFBNkI7WUFDN0IsaUJBQWlCLENBQUMsT0FBTyxDQUFDLG9DQUFxQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixFQUFFLENBQUM7WUFFeEgsbUNBQW1DO1lBQ25DLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSxzQ0FBbUIsRUFBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDNUcsTUFBTSxnQkFBZ0IsR0FBYyxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3BJLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsK0NBQTJCLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQy9KLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sRUFBYTtZQUM5QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyQyxJQUFJLElBQUEsaUNBQVUsRUFBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUN2RCxDQUFDO1lBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7S0FFRCxDQUFBO0lBekRZLDhFQUFpQztnREFBakMsaUNBQWlDO1FBSTNDLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsaUNBQW1CLENBQUE7UUFDbkIsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQkFBVyxDQUFBO09BUEQsaUNBQWlDLENBeUQ3QyJ9