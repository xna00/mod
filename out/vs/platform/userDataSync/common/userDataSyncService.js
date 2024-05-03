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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uuid", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/userDataSync/common/globalStateSync", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/settingsSync", "vs/platform/userDataSync/common/snippetsSync", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/userDataProfilesManifestSync", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, arrays_1, async_1, cancellation_1, errorMessage_1, event_1, lifecycle_1, resources_1, types_1, uuid_1, configuration_1, extensionManagement_1, files_1, instantiation_1, storage_1, telemetry_1, userDataProfile_1, extensionsSync_1, globalStateSync_1, keybindingsSync_1, settingsSync_1, snippetsSync_1, tasksSync_1, userDataProfilesManifestSync_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncService = void 0;
    const LAST_SYNC_TIME_KEY = 'sync.lastSyncTime';
    let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        get lastSyncTime() { return this._lastSyncTime; }
        constructor(fileService, userDataSyncStoreService, userDataSyncStoreManagementService, instantiationService, logService, telemetryService, storageService, userDataSyncEnablementService, userDataProfilesService, userDataSyncResourceProviderService, userDataSyncLocalStoreService) {
            super();
            this.fileService = fileService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataProfilesService = userDataProfilesService;
            this.userDataSyncResourceProviderService = userDataSyncResourceProviderService;
            this.userDataSyncLocalStoreService = userDataSyncLocalStoreService;
            this._status = "uninitialized" /* SyncStatus.Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._syncErrors = [];
            this._onSyncErrors = this._register(new event_1.Emitter());
            this.onSyncErrors = this._onSyncErrors.event;
            this._lastSyncTime = undefined;
            this._onDidChangeLastSyncTime = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncTime = this._onDidChangeLastSyncTime.event;
            this._onDidResetLocal = this._register(new event_1.Emitter());
            this.onDidResetLocal = this._onDidResetLocal.event;
            this._onDidResetRemote = this._register(new event_1.Emitter());
            this.onDidResetRemote = this._onDidResetRemote.event;
            this.activeProfileSynchronizers = new Map();
            this._status = userDataSyncStoreManagementService.userDataSyncStore ? "idle" /* SyncStatus.Idle */ : "uninitialized" /* SyncStatus.Uninitialized */;
            this._lastSyncTime = this.storageService.getNumber(LAST_SYNC_TIME_KEY, -1 /* StorageScope.APPLICATION */, undefined);
            this._register((0, lifecycle_1.toDisposable)(() => this.clearActiveProfileSynchronizers()));
        }
        async createSyncTask(manifest, disableCache) {
            this.checkEnablement();
            this.logService.info('Sync started.');
            const startTime = new Date().getTime();
            const executionId = (0, uuid_1.generateUuid)();
            try {
                const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
                if (disableCache) {
                    syncHeaders['Cache-Control'] = 'no-cache';
                }
                manifest = await this.userDataSyncStoreService.manifest(manifest, syncHeaders);
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                throw userDataSyncError;
            }
            const executed = false;
            const that = this;
            let cancellablePromise;
            return {
                manifest,
                async run() {
                    if (executed) {
                        throw new Error('Can run a task only once');
                    }
                    cancellablePromise = (0, async_1.createCancelablePromise)(token => that.sync(manifest, false, executionId, token));
                    await cancellablePromise.finally(() => cancellablePromise = undefined);
                    that.logService.info(`Sync done. Took ${new Date().getTime() - startTime}ms`);
                    that.updateLastSyncTime();
                },
                stop() {
                    cancellablePromise?.cancel();
                    return that.stop();
                }
            };
        }
        async createManualSyncTask() {
            this.checkEnablement();
            if (this.userDataSyncEnablementService.isEnabled()) {
                throw new userDataSync_1.UserDataSyncError('Cannot start manual sync when sync is enabled', "LocalError" /* UserDataSyncErrorCode.LocalError */);
            }
            this.logService.info('Sync started.');
            const startTime = new Date().getTime();
            const executionId = (0, uuid_1.generateUuid)();
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
            let manifest;
            try {
                manifest = await this.userDataSyncStoreService.manifest(null, syncHeaders);
            }
            catch (error) {
                const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
                reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                throw userDataSyncError;
            }
            /* Manual sync shall start on clean local state */
            await this.resetLocal();
            const that = this;
            const cancellableToken = new cancellation_1.CancellationTokenSource();
            return {
                id: executionId,
                async merge() {
                    return that.sync(manifest, true, executionId, cancellableToken.token);
                },
                async apply() {
                    try {
                        try {
                            await that.applyManualSync(manifest, executionId, cancellableToken.token);
                        }
                        catch (error) {
                            if (userDataSync_1.UserDataSyncError.toUserDataSyncError(error).code === "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */) {
                                that.logService.info('Client is making invalid requests. Cleaning up data...');
                                await that.cleanUpRemoteData();
                                that.logService.info('Applying manual sync again...');
                                await that.applyManualSync(manifest, executionId, cancellableToken.token);
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                    catch (error) {
                        that.logService.error(error);
                        throw error;
                    }
                    that.logService.info(`Sync done. Took ${new Date().getTime() - startTime}ms`);
                    that.updateLastSyncTime();
                },
                async stop() {
                    cancellableToken.cancel();
                    await that.stop();
                    await that.resetLocal();
                }
            };
        }
        async sync(manifest, merge, executionId, token) {
            this._syncErrors = [];
            try {
                if (this.status !== "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.setStatus("syncing" /* SyncStatus.Syncing */);
                }
                // Sync Default Profile First
                const defaultProfileSynchronizer = this.getOrCreateActiveProfileSynchronizer(this.userDataProfilesService.defaultProfile, undefined);
                this._syncErrors.push(...await this.syncProfile(defaultProfileSynchronizer, manifest, merge, executionId, token));
                // Sync other profiles
                const userDataProfileManifestSynchronizer = defaultProfileSynchronizer.enabled.find(s => s.resource === "profiles" /* SyncResource.Profiles */);
                if (userDataProfileManifestSynchronizer) {
                    const syncProfiles = (await userDataProfileManifestSynchronizer.getLastSyncedProfiles()) || [];
                    if (token.isCancellationRequested) {
                        return;
                    }
                    await this.syncRemoteProfiles(syncProfiles, manifest, merge, executionId, token);
                }
            }
            finally {
                if (this.status !== "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.setStatus("idle" /* SyncStatus.Idle */);
                }
                this._onSyncErrors.fire(this._syncErrors);
            }
        }
        async syncRemoteProfiles(remoteProfiles, manifest, merge, executionId, token) {
            for (const syncProfile of remoteProfiles) {
                if (token.isCancellationRequested) {
                    return;
                }
                const profile = this.userDataProfilesService.profiles.find(p => p.id === syncProfile.id);
                if (!profile) {
                    this.logService.error(`Profile with id:${syncProfile.id} and name: ${syncProfile.name} does not exist locally to sync.`);
                    continue;
                }
                this.logService.info('Syncing profile.', syncProfile.name);
                const profileSynchronizer = this.getOrCreateActiveProfileSynchronizer(profile, syncProfile);
                this._syncErrors.push(...await this.syncProfile(profileSynchronizer, manifest, merge, executionId, token));
            }
            // Dispose & Delete profile synchronizers which do not exist anymore
            for (const [key, profileSynchronizerItem] of this.activeProfileSynchronizers.entries()) {
                if (this.userDataProfilesService.profiles.some(p => p.id === profileSynchronizerItem[0].profile.id)) {
                    continue;
                }
                profileSynchronizerItem[1].dispose();
                this.activeProfileSynchronizers.delete(key);
            }
        }
        async applyManualSync(manifest, executionId, token) {
            const profileSynchronizers = this.getActiveProfileSynchronizers();
            for (const profileSynchronizer of profileSynchronizers) {
                if (token.isCancellationRequested) {
                    return;
                }
                await profileSynchronizer.apply(executionId, token);
            }
            const defaultProfileSynchronizer = profileSynchronizers.find(s => s.profile.isDefault);
            if (!defaultProfileSynchronizer) {
                return;
            }
            const userDataProfileManifestSynchronizer = defaultProfileSynchronizer.enabled.find(s => s.resource === "profiles" /* SyncResource.Profiles */);
            if (!userDataProfileManifestSynchronizer) {
                return;
            }
            // Sync remote profiles which are not synced locally
            const remoteProfiles = (await userDataProfileManifestSynchronizer.getRemoteSyncedProfiles(manifest?.latest ?? null)) || [];
            const remoteProfilesToSync = remoteProfiles.filter(remoteProfile => profileSynchronizers.every(s => s.profile.id !== remoteProfile.id));
            if (remoteProfilesToSync.length) {
                await this.syncRemoteProfiles(remoteProfilesToSync, manifest, false, executionId, token);
            }
        }
        async syncProfile(profileSynchronizer, manifest, merge, executionId, token) {
            const errors = await profileSynchronizer.sync(manifest, merge, executionId, token);
            return errors.map(([syncResource, error]) => ({ profile: profileSynchronizer.profile, syncResource, error }));
        }
        async stop() {
            if (this.status !== "idle" /* SyncStatus.Idle */) {
                await Promise.allSettled(this.getActiveProfileSynchronizers().map(profileSynchronizer => profileSynchronizer.stop()));
            }
        }
        async resolveContent(resource) {
            const content = await this.userDataSyncResourceProviderService.resolveContent(resource);
            if (content) {
                return content;
            }
            for (const profileSynchronizer of this.getActiveProfileSynchronizers()) {
                for (const synchronizer of profileSynchronizer.enabled) {
                    const content = await synchronizer.resolveContent(resource);
                    if (content) {
                        return content;
                    }
                }
            }
            return null;
        }
        async replace(syncResourceHandle) {
            this.checkEnablement();
            const profileSyncResource = this.userDataSyncResourceProviderService.resolveUserDataSyncResource(syncResourceHandle);
            if (!profileSyncResource) {
                return;
            }
            const content = await this.resolveContent(syncResourceHandle.uri);
            if (!content) {
                return;
            }
            await this.performAction(profileSyncResource.profile, async (synchronizer) => {
                if (profileSyncResource.syncResource === synchronizer.resource) {
                    await synchronizer.replace(content);
                    return true;
                }
                return undefined;
            });
            return;
        }
        async accept(syncResource, resource, content, apply) {
            this.checkEnablement();
            await this.performAction(syncResource.profile, async (synchronizer) => {
                if (syncResource.syncResource === synchronizer.resource) {
                    await synchronizer.accept(resource, content);
                    if (apply) {
                        await synchronizer.apply((0, types_1.isBoolean)(apply) ? false : apply.force, (0, userDataSync_1.createSyncHeaders)((0, uuid_1.generateUuid)()));
                    }
                    return true;
                }
                return undefined;
            });
        }
        async hasLocalData() {
            const result = await this.performAction(this.userDataProfilesService.defaultProfile, async (synchronizer) => {
                // skip global state synchronizer
                if (synchronizer.resource !== "globalState" /* SyncResource.GlobalState */ && await synchronizer.hasLocalData()) {
                    return true;
                }
                return undefined;
            });
            return !!result;
        }
        async hasPreviouslySynced() {
            const result = await this.performAction(this.userDataProfilesService.defaultProfile, async (synchronizer) => {
                if (await synchronizer.hasPreviouslySynced()) {
                    return true;
                }
                return undefined;
            });
            return !!result;
        }
        async reset() {
            this.checkEnablement();
            await this.resetRemote();
            await this.resetLocal();
        }
        async resetRemote() {
            this.checkEnablement();
            try {
                await this.userDataSyncStoreService.clear();
                this.logService.info('Cleared data on server');
            }
            catch (e) {
                this.logService.error(e);
            }
            this._onDidResetRemote.fire();
        }
        async resetLocal() {
            this.checkEnablement();
            this._lastSyncTime = undefined;
            this.storageService.remove(LAST_SYNC_TIME_KEY, -1 /* StorageScope.APPLICATION */);
            for (const [synchronizer] of this.activeProfileSynchronizers.values()) {
                try {
                    await synchronizer.resetLocal();
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            this.clearActiveProfileSynchronizers();
            this._onDidResetLocal.fire();
            this.logService.info('Did reset the local sync state.');
        }
        async cleanUpRemoteData() {
            const remoteProfiles = await this.userDataSyncResourceProviderService.getRemoteSyncedProfiles();
            const remoteProfileCollections = remoteProfiles.map(profile => profile.collection);
            const allCollections = await this.userDataSyncStoreService.getAllCollections();
            const redundantCollections = allCollections.filter(c => !remoteProfileCollections.includes(c));
            if (redundantCollections.length) {
                this.logService.info(`Deleting ${redundantCollections.length} redundant collections on server`);
                await Promise.allSettled(redundantCollections.map(collectionId => this.userDataSyncStoreService.deleteCollection(collectionId)));
                this.logService.info(`Deleted redundant collections on server`);
            }
            const updatedRemoteProfiles = remoteProfiles.filter(profile => allCollections.includes(profile.collection));
            if (updatedRemoteProfiles.length !== remoteProfiles.length) {
                const profileManifestSynchronizer = this.instantiationService.createInstance(userDataProfilesManifestSync_1.UserDataProfilesManifestSynchroniser, this.userDataProfilesService.defaultProfile, undefined);
                try {
                    this.logService.info('Resetting the last synced state of profiles');
                    await profileManifestSynchronizer.resetLocal();
                    this.logService.info('Did reset the last synced state of profiles');
                    this.logService.info(`Updating remote profiles with invalid collections on server`);
                    await profileManifestSynchronizer.updateRemoteProfiles(updatedRemoteProfiles, null);
                    this.logService.info(`Updated remote profiles on server`);
                }
                finally {
                    profileManifestSynchronizer.dispose();
                }
            }
        }
        async saveRemoteActivityData(location) {
            this.checkEnablement();
            const data = await this.userDataSyncStoreService.getActivityData();
            await this.fileService.writeFile(location, data);
        }
        async extractActivityData(activityDataResource, location) {
            const content = (await this.fileService.readFile(activityDataResource)).value.toString();
            const activityData = JSON.parse(content);
            if (activityData.resources) {
                for (const resource in activityData.resources) {
                    for (const version of activityData.resources[resource]) {
                        await this.userDataSyncLocalStoreService.writeResource(resource, version.content, new Date(version.created * 1000), undefined, location);
                    }
                }
            }
            if (activityData.collections) {
                for (const collection in activityData.collections) {
                    for (const resource in activityData.collections[collection].resources) {
                        for (const version of activityData.collections[collection].resources?.[resource] ?? []) {
                            await this.userDataSyncLocalStoreService.writeResource(resource, version.content, new Date(version.created * 1000), collection, location);
                        }
                    }
                }
            }
        }
        async performAction(profile, action) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const activeProfileSyncronizer = this.activeProfileSynchronizers.get(profile.id);
                if (activeProfileSyncronizer) {
                    const result = await this.performActionWithProfileSynchronizer(activeProfileSyncronizer[0], action, disposables);
                    return (0, types_1.isUndefined)(result) ? null : result;
                }
                if (profile.isDefault) {
                    const defaultProfileSynchronizer = disposables.add(this.instantiationService.createInstance(ProfileSynchronizer, profile, undefined));
                    const result = await this.performActionWithProfileSynchronizer(defaultProfileSynchronizer, action, disposables);
                    return (0, types_1.isUndefined)(result) ? null : result;
                }
                if (this.userDataProfilesService.isEnabled()) {
                    return null;
                }
                const userDataProfileManifestSynchronizer = disposables.add(this.instantiationService.createInstance(userDataProfilesManifestSync_1.UserDataProfilesManifestSynchroniser, profile, undefined));
                const manifest = await this.userDataSyncStoreService.manifest(null);
                const syncProfiles = (await userDataProfileManifestSynchronizer.getRemoteSyncedProfiles(manifest?.latest ?? null)) || [];
                const syncProfile = syncProfiles.find(syncProfile => syncProfile.id === profile.id);
                if (syncProfile) {
                    const profileSynchronizer = disposables.add(this.instantiationService.createInstance(ProfileSynchronizer, profile, syncProfile.collection));
                    const result = await this.performActionWithProfileSynchronizer(profileSynchronizer, action, disposables);
                    return (0, types_1.isUndefined)(result) ? null : result;
                }
                return null;
            }
            finally {
                disposables.dispose();
            }
        }
        async performActionWithProfileSynchronizer(profileSynchronizer, action, disposables) {
            const allSynchronizers = [...profileSynchronizer.enabled, ...profileSynchronizer.disabled.reduce((synchronizers, syncResource) => {
                    if (syncResource !== "workspaceState" /* SyncResource.WorkspaceState */) {
                        synchronizers.push(disposables.add(profileSynchronizer.createSynchronizer(syncResource)));
                    }
                    return synchronizers;
                }, [])];
            for (const synchronizer of allSynchronizers) {
                const result = await action(synchronizer);
                if (!(0, types_1.isUndefined)(result)) {
                    return result;
                }
            }
            return undefined;
        }
        setStatus(status) {
            const oldStatus = this._status;
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
                if (oldStatus === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.updateLastSyncTime();
                }
            }
        }
        updateConflicts() {
            const conflicts = this.getActiveProfileSynchronizers().map(synchronizer => synchronizer.conflicts).flat();
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => a.profile.id === b.profile.id && a.syncResource === b.syncResource && (0, arrays_1.equals)(a.conflicts, b.conflicts, (a, b) => (0, resources_1.isEqual)(a.previewResource, b.previewResource)))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        updateLastSyncTime() {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                this._lastSyncTime = new Date().getTime();
                this.storageService.store(LAST_SYNC_TIME_KEY, this._lastSyncTime, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                this._onDidChangeLastSyncTime.fire(this._lastSyncTime);
            }
        }
        getOrCreateActiveProfileSynchronizer(profile, syncProfile) {
            let activeProfileSynchronizer = this.activeProfileSynchronizers.get(profile.id);
            if (activeProfileSynchronizer && activeProfileSynchronizer[0].collection !== syncProfile?.collection) {
                this.logService.error('Profile synchronizer collection does not match with the remote sync profile collection');
                activeProfileSynchronizer[1].dispose();
                activeProfileSynchronizer = undefined;
                this.activeProfileSynchronizers.delete(profile.id);
            }
            if (!activeProfileSynchronizer) {
                const disposables = new lifecycle_1.DisposableStore();
                const profileSynchronizer = disposables.add(this.instantiationService.createInstance(ProfileSynchronizer, profile, syncProfile?.collection));
                disposables.add(profileSynchronizer.onDidChangeStatus(e => this.setStatus(e)));
                disposables.add(profileSynchronizer.onDidChangeConflicts(conflicts => this.updateConflicts()));
                disposables.add(profileSynchronizer.onDidChangeLocal(e => this._onDidChangeLocal.fire(e)));
                this.activeProfileSynchronizers.set(profile.id, activeProfileSynchronizer = [profileSynchronizer, disposables]);
            }
            return activeProfileSynchronizer[0];
        }
        getActiveProfileSynchronizers() {
            const profileSynchronizers = [];
            for (const [profileSynchronizer] of this.activeProfileSynchronizers.values()) {
                profileSynchronizers.push(profileSynchronizer);
            }
            return profileSynchronizers;
        }
        clearActiveProfileSynchronizers() {
            this.activeProfileSynchronizers.forEach(([, disposable]) => disposable.dispose());
            this.activeProfileSynchronizers.clear();
        }
        checkEnablement() {
            if (!this.userDataSyncStoreManagementService.userDataSyncStore) {
                throw new Error('Not enabled');
            }
        }
    };
    exports.UserDataSyncService = UserDataSyncService;
    exports.UserDataSyncService = UserDataSyncService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataSync_1.IUserDataSyncStoreService),
        __param(2, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, userDataProfile_1.IUserDataProfilesService),
        __param(9, userDataSync_1.IUserDataSyncResourceProviderService),
        __param(10, userDataSync_1.IUserDataSyncLocalStoreService)
    ], UserDataSyncService);
    let ProfileSynchronizer = class ProfileSynchronizer extends lifecycle_1.Disposable {
        get enabled() { return this._enabled.sort((a, b) => a[1] - b[1]).map(([synchronizer]) => synchronizer); }
        get disabled() { return userDataSync_1.ALL_SYNC_RESOURCES.filter(syncResource => !this.userDataSyncEnablementService.isResourceEnabled(syncResource)); }
        get status() { return this._status; }
        get conflicts() { return this._conflicts; }
        constructor(profile, collection, userDataSyncEnablementService, instantiationService, extensionGalleryService, userDataSyncStoreManagementService, telemetryService, logService, userDataProfilesService, configurationService) {
            super();
            this.profile = profile;
            this.collection = collection;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.instantiationService = instantiationService;
            this.extensionGalleryService = extensionGalleryService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.userDataProfilesService = userDataProfilesService;
            this.configurationService = configurationService;
            this._enabled = [];
            this._status = "idle" /* SyncStatus.Idle */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this._register(userDataSyncEnablementService.onDidChangeResourceEnablement(([syncResource, enablement]) => this.onDidChangeResourceEnablement(syncResource, enablement)));
            this._register((0, lifecycle_1.toDisposable)(() => this._enabled.splice(0, this._enabled.length).forEach(([, , disposable]) => disposable.dispose())));
            for (const syncResource of userDataSync_1.ALL_SYNC_RESOURCES) {
                if (userDataSyncEnablementService.isResourceEnabled(syncResource)) {
                    this.registerSynchronizer(syncResource);
                }
            }
        }
        onDidChangeResourceEnablement(syncResource, enabled) {
            if (enabled) {
                this.registerSynchronizer(syncResource);
            }
            else {
                this.deRegisterSynchronizer(syncResource);
            }
        }
        registerSynchronizer(syncResource) {
            if (this._enabled.some(([synchronizer]) => synchronizer.resource === syncResource)) {
                return;
            }
            if (syncResource === "extensions" /* SyncResource.Extensions */ && !this.extensionGalleryService.isEnabled()) {
                this.logService.info('Skipping extensions sync because gallery is not configured');
                return;
            }
            if (syncResource === "profiles" /* SyncResource.Profiles */) {
                if (!this.profile.isDefault) {
                    return;
                }
                if (!this.userDataProfilesService.isEnabled()) {
                    return;
                }
            }
            if (syncResource === "workspaceState" /* SyncResource.WorkspaceState */) {
                return;
            }
            if (syncResource !== "profiles" /* SyncResource.Profiles */ && this.profile.useDefaultFlags?.[syncResource]) {
                this.logService.debug(`Skipping syncing ${syncResource} in ${this.profile.name} because it is already synced by default profile`);
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const synchronizer = disposables.add(this.createSynchronizer(syncResource));
            disposables.add(synchronizer.onDidChangeStatus(() => this.updateStatus()));
            disposables.add(synchronizer.onDidChangeConflicts(() => this.updateConflicts()));
            disposables.add(synchronizer.onDidChangeLocal(() => this._onDidChangeLocal.fire(syncResource)));
            const order = this.getOrder(syncResource);
            this._enabled.push([synchronizer, order, disposables]);
        }
        deRegisterSynchronizer(syncResource) {
            const index = this._enabled.findIndex(([synchronizer]) => synchronizer.resource === syncResource);
            if (index !== -1) {
                const [[synchronizer, , disposable]] = this._enabled.splice(index, 1);
                disposable.dispose();
                this.updateStatus();
                Promise.allSettled([synchronizer.stop(), synchronizer.resetLocal()])
                    .then(null, error => this.logService.error(error));
            }
        }
        createSynchronizer(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return this.instantiationService.createInstance(settingsSync_1.SettingsSynchroniser, this.profile, this.collection);
                case "keybindings" /* SyncResource.Keybindings */: return this.instantiationService.createInstance(keybindingsSync_1.KeybindingsSynchroniser, this.profile, this.collection);
                case "snippets" /* SyncResource.Snippets */: return this.instantiationService.createInstance(snippetsSync_1.SnippetsSynchroniser, this.profile, this.collection);
                case "tasks" /* SyncResource.Tasks */: return this.instantiationService.createInstance(tasksSync_1.TasksSynchroniser, this.profile, this.collection);
                case "globalState" /* SyncResource.GlobalState */: return this.instantiationService.createInstance(globalStateSync_1.GlobalStateSynchroniser, this.profile, this.collection);
                case "extensions" /* SyncResource.Extensions */: return this.instantiationService.createInstance(extensionsSync_1.ExtensionsSynchroniser, this.profile, this.collection);
                case "profiles" /* SyncResource.Profiles */: return this.instantiationService.createInstance(userDataProfilesManifestSync_1.UserDataProfilesManifestSynchroniser, this.profile, this.collection);
            }
        }
        async sync(manifest, merge, executionId, token) {
            // Return if cancellation is requested
            if (token.isCancellationRequested) {
                return [];
            }
            const synchronizers = this.enabled;
            if (!synchronizers.length) {
                return [];
            }
            try {
                const syncErrors = [];
                const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
                const resourceManifest = (this.collection ? manifest?.collections?.[this.collection]?.latest : manifest?.latest) ?? null;
                const userDataSyncConfiguration = merge ? await this.getUserDataSyncConfiguration(resourceManifest) : {};
                for (const synchroniser of synchronizers) {
                    // Return if cancellation is requested
                    if (token.isCancellationRequested) {
                        return [];
                    }
                    // Return if resource is not enabled
                    if (!this.userDataSyncEnablementService.isResourceEnabled(synchroniser.resource)) {
                        return [];
                    }
                    try {
                        if (merge) {
                            const preview = await synchroniser.preview(resourceManifest, userDataSyncConfiguration, syncHeaders);
                            if (preview) {
                                for (const resourcePreview of preview.resourcePreviews) {
                                    if ((resourcePreview.localChange !== 0 /* Change.None */ || resourcePreview.remoteChange !== 0 /* Change.None */) && resourcePreview.mergeState === "preview" /* MergeState.Preview */) {
                                        await synchroniser.merge(resourcePreview.previewResource);
                                    }
                                }
                            }
                        }
                        else {
                            await synchroniser.sync(resourceManifest, syncHeaders);
                        }
                    }
                    catch (e) {
                        const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(e);
                        reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                        if (canBailout(e)) {
                            throw userDataSyncError;
                        }
                        // Log and and continue
                        this.logService.error(e);
                        this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                        syncErrors.push([synchroniser.resource, userDataSyncError]);
                    }
                }
                return syncErrors;
            }
            finally {
                this.updateStatus();
            }
        }
        async apply(executionId, token) {
            const syncHeaders = (0, userDataSync_1.createSyncHeaders)(executionId);
            for (const synchroniser of this.enabled) {
                if (token.isCancellationRequested) {
                    return;
                }
                try {
                    await synchroniser.apply(false, syncHeaders);
                }
                catch (e) {
                    const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(e);
                    reportUserDataSyncError(userDataSyncError, executionId, this.userDataSyncStoreManagementService, this.telemetryService);
                    if (canBailout(e)) {
                        throw userDataSyncError;
                    }
                    // Log and and continue
                    this.logService.error(e);
                    this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                }
            }
        }
        async stop() {
            for (const synchroniser of this.enabled) {
                try {
                    if (synchroniser.status !== "idle" /* SyncStatus.Idle */) {
                        await synchroniser.stop();
                    }
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
        }
        async resetLocal() {
            for (const synchroniser of this.enabled) {
                try {
                    await synchroniser.resetLocal();
                }
                catch (e) {
                    this.logService.error(`${synchroniser.resource}: ${(0, errorMessage_1.toErrorMessage)(e)}`);
                    this.logService.error(e);
                }
            }
        }
        async getUserDataSyncConfiguration(manifest) {
            if (!this.profile.isDefault) {
                return {};
            }
            const local = this.configurationService.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
            const settingsSynchronizer = this.enabled.find(synchronizer => synchronizer instanceof settingsSync_1.SettingsSynchroniser);
            if (settingsSynchronizer) {
                const remote = await settingsSynchronizer.getRemoteUserDataSyncConfiguration(manifest);
                return { ...local, ...remote };
            }
            return local;
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
            }
        }
        updateStatus() {
            this.updateConflicts();
            if (this.enabled.some(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)) {
                return this.setStatus("hasConflicts" /* SyncStatus.HasConflicts */);
            }
            if (this.enabled.some(s => s.status === "syncing" /* SyncStatus.Syncing */)) {
                return this.setStatus("syncing" /* SyncStatus.Syncing */);
            }
            return this.setStatus("idle" /* SyncStatus.Idle */);
        }
        updateConflicts() {
            const conflicts = this.enabled.filter(s => s.status === "hasConflicts" /* SyncStatus.HasConflicts */)
                .filter(s => s.conflicts.conflicts.length > 0)
                .map(s => s.conflicts);
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => a.syncResource === b.syncResource && (0, arrays_1.equals)(a.conflicts, b.conflicts, (a, b) => (0, resources_1.isEqual)(a.previewResource, b.previewResource)))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(conflicts);
            }
        }
        getOrder(syncResource) {
            switch (syncResource) {
                case "settings" /* SyncResource.Settings */: return 0;
                case "keybindings" /* SyncResource.Keybindings */: return 1;
                case "snippets" /* SyncResource.Snippets */: return 2;
                case "tasks" /* SyncResource.Tasks */: return 3;
                case "globalState" /* SyncResource.GlobalState */: return 4;
                case "extensions" /* SyncResource.Extensions */: return 5;
                case "profiles" /* SyncResource.Profiles */: return 6;
                case "workspaceState" /* SyncResource.WorkspaceState */: return 7;
            }
        }
    };
    ProfileSynchronizer = __decorate([
        __param(2, userDataSync_1.IUserDataSyncEnablementService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, extensionManagement_1.IExtensionGalleryService),
        __param(5, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, userDataSync_1.IUserDataSyncLogService),
        __param(8, userDataProfile_1.IUserDataProfilesService),
        __param(9, configuration_1.IConfigurationService)
    ], ProfileSynchronizer);
    function canBailout(e) {
        if (e instanceof userDataSync_1.UserDataSyncError) {
            switch (e.code) {
                case "MethodNotFound" /* UserDataSyncErrorCode.MethodNotFound */:
                case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                case "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */:
                case "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */:
                case "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */:
                case "LocalTooManyProfiles" /* UserDataSyncErrorCode.LocalTooManyProfiles */:
                case "Gone" /* UserDataSyncErrorCode.Gone */:
                case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */:
                case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                    return true;
            }
        }
        return false;
    }
    function reportUserDataSyncError(userDataSyncError, executionId, userDataSyncStoreManagementService, telemetryService) {
        telemetryService.publicLog2('sync/error', {
            code: userDataSyncError.code,
            serverCode: userDataSyncError instanceof userDataSync_1.UserDataSyncStoreError ? String(userDataSyncError.serverCode) : undefined,
            url: userDataSyncError instanceof userDataSync_1.UserDataSyncStoreError ? userDataSyncError.url : undefined,
            resource: userDataSyncError.resource,
            executionId,
            service: userDataSyncStoreManagementService.userDataSyncStore.url.toString()
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vdXNlckRhdGFTeW5jL2NvbW1vbi91c2VyRGF0YVN5bmNTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRDaEcsTUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztJQUV4QyxJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBS2xELElBQUksTUFBTSxLQUFpQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBUWpELElBQUksU0FBUyxLQUF1QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBUzdFLElBQUksWUFBWSxLQUF5QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBWXJFLFlBQ2UsV0FBMEMsRUFDN0Isd0JBQW9FLEVBQzFELGtDQUF3RixFQUN0RyxvQkFBNEQsRUFDMUQsVUFBb0QsRUFDMUQsZ0JBQW9ELEVBQ3RELGNBQWdELEVBQ2pDLDZCQUE4RSxFQUNwRix1QkFBa0UsRUFDdEQsbUNBQTBGLEVBQ2hHLDZCQUE4RTtZQUU5RyxLQUFLLEVBQUUsQ0FBQztZQVp1QixnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNaLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMkI7WUFDekMsdUNBQWtDLEdBQWxDLGtDQUFrQyxDQUFxQztZQUNyRix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQ3pDLGVBQVUsR0FBVixVQUFVLENBQXlCO1lBQ3pDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDckMsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2hCLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFD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