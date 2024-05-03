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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/externalServices/common/serviceMachineId", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, event_1, json_1, lifecycle_1, strings_1, types_1, nls_1, configuration_1, environment_1, files_1, log_1, serviceMachineId_1, storage_1, telemetry_1, uriIdentity_1, userDataSync_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractInitializer = exports.AbstractJsonFileSynchroniser = exports.AbstractFileSynchroniser = exports.AbstractSynchroniser = void 0;
    exports.isRemoteUserData = isRemoteUserData;
    exports.isSyncData = isSyncData;
    exports.getSyncResourceLogLabel = getSyncResourceLogLabel;
    function isRemoteUserData(thing) {
        if (thing
            && (thing.ref !== undefined && typeof thing.ref === 'string' && thing.ref !== '')
            && (thing.syncData !== undefined && (thing.syncData === null || isSyncData(thing.syncData)))) {
            return true;
        }
        return false;
    }
    function isSyncData(thing) {
        if (thing
            && (thing.version !== undefined && typeof thing.version === 'number')
            && (thing.content !== undefined && typeof thing.content === 'string')) {
            // backward compatibility
            if (Object.keys(thing).length === 2) {
                return true;
            }
            if (Object.keys(thing).length === 3
                && (thing.machineId !== undefined && typeof thing.machineId === 'string')) {
                return true;
            }
        }
        return false;
    }
    function getSyncResourceLogLabel(syncResource, profile) {
        return `${(0, strings_1.uppercaseFirstLetter)(syncResource)}${profile.isDefault ? '' : ` (${profile.name})`}`;
    }
    let AbstractSynchroniser = class AbstractSynchroniser extends lifecycle_1.Disposable {
        get status() { return this._status; }
        get conflicts() { return { ...this.syncResource, conflicts: this._conflicts }; }
        constructor(syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService) {
            super();
            this.syncResource = syncResource;
            this.collection = collection;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.storageService = storageService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncLocalStoreService = userDataSyncLocalStoreService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.telemetryService = telemetryService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.syncPreviewPromise = null;
            this._status = "idle" /* SyncStatus.Idle */;
            this._onDidChangStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangStatus.event;
            this._conflicts = [];
            this._onDidChangeConflicts = this._register(new event_1.Emitter());
            this.onDidChangeConflicts = this._onDidChangeConflicts.event;
            this.localChangeTriggerThrottler = this._register(new async_1.ThrottledDelayer(50));
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this.lastSyncUserDataStateKey = `${this.collection ? `${this.collection}.` : ''}${this.syncResource.syncResource}.lastSyncUserData`;
            this.hasSyncResourceStateVersionChanged = false;
            this.syncHeaders = {};
            this.resource = this.syncResource.syncResource;
            this.syncResourceLogLabel = getSyncResourceLogLabel(syncResource.syncResource, syncResource.profile);
            this.extUri = uriIdentityService.extUri;
            this.syncFolder = this.extUri.joinPath(environmentService.userDataSyncHome, ...(0, userDataSync_1.getPathSegments)(syncResource.profile.isDefault ? undefined : syncResource.profile.id, syncResource.syncResource));
            this.syncPreviewFolder = this.extUri.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME);
            this.lastSyncResource = (0, userDataSync_1.getLastSyncResourceUri)(syncResource.profile.isDefault ? undefined : syncResource.profile.id, syncResource.syncResource, environmentService, this.extUri);
            this.currentMachineIdPromise = (0, serviceMachineId_1.getServiceMachineId)(environmentService, fileService, storageService);
        }
        triggerLocalChange() {
            this.localChangeTriggerThrottler.trigger(() => this.doTriggerLocalChange());
        }
        async doTriggerLocalChange() {
            // Sync again if current status is in conflicts
            if (this.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                this.logService.info(`${this.syncResourceLogLabel}: In conflicts state and local change detected. Syncing again...`);
                const preview = await this.syncPreviewPromise;
                this.syncPreviewPromise = null;
                const status = await this.performSync(preview.remoteUserData, preview.lastSyncUserData, true, this.getUserDataSyncConfiguration());
                this.setStatus(status);
            }
            // Check if local change causes remote change
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Checking for local changes...`);
                const lastSyncUserData = await this.getLastSyncUserData();
                const hasRemoteChanged = lastSyncUserData ? await this.hasRemoteChanged(lastSyncUserData) : true;
                if (hasRemoteChanged) {
                    this._onDidChangeLocal.fire();
                }
            }
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangStatus.fire(status);
            }
        }
        async sync(manifest, headers = {}) {
            await this._sync(manifest, true, this.getUserDataSyncConfiguration(), headers);
        }
        async preview(manifest, userDataSyncConfiguration, headers = {}) {
            return this._sync(manifest, false, userDataSyncConfiguration, headers);
        }
        async apply(force, headers = {}) {
            try {
                this.syncHeaders = { ...headers };
                const status = await this.doApply(force);
                this.setStatus(status);
                return this.syncPreviewPromise;
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async _sync(manifest, apply, userDataSyncConfiguration, headers) {
            try {
                this.syncHeaders = { ...headers };
                if (this.status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as there are conflicts.`);
                    return this.syncPreviewPromise;
                }
                if (this.status === "syncing" /* SyncStatus.Syncing */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is running already.`);
                    return this.syncPreviewPromise;
                }
                this.logService.trace(`${this.syncResourceLogLabel}: Started synchronizing ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* SyncStatus.Syncing */);
                let status = "idle" /* SyncStatus.Idle */;
                try {
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getLatestRemoteUserData(manifest, lastSyncUserData);
                    status = await this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                    if (status === "hasConflicts" /* SyncStatus.HasConflicts */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Detected conflicts while synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    else if (status === "idle" /* SyncStatus.Idle */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Finished synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    return this.syncPreviewPromise || null;
                }
                finally {
                    this.setStatus(status);
                }
            }
            finally {
                this.syncHeaders = {};
            }
        }
        async replace(content) {
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return false;
            }
            await this.stop();
            try {
                this.logService.trace(`${this.syncResourceLogLabel}: Started resetting ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* SyncStatus.Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getLatestRemoteUserData(null, lastSyncUserData);
                const isRemoteDataFromCurrentMachine = await this.isRemoteDataFromCurrentMachine(remoteUserData);
                /* use replace sync data */
                const resourcePreviewResults = await this.generateSyncPreview({ ref: remoteUserData.ref, syncData }, lastSyncUserData, isRemoteDataFromCurrentMachine, this.getUserDataSyncConfiguration(), cancellation_1.CancellationToken.None);
                const resourcePreviews = [];
                for (const resourcePreviewResult of resourcePreviewResults) {
                    /* Accept remote resource */
                    const acceptResult = await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.remoteResource, undefined, cancellation_1.CancellationToken.None);
                    /* compute remote change */
                    const { remoteChange } = await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.previewResource, resourcePreviewResult.remoteContent, cancellation_1.CancellationToken.None);
                    resourcePreviews.push([resourcePreviewResult, { ...acceptResult, remoteChange: remoteChange !== 0 /* Change.None */ ? remoteChange : 2 /* Change.Modified */ }]);
                }
                await this.applyResult(remoteUserData, lastSyncUserData, resourcePreviews, false);
                this.logService.info(`${this.syncResourceLogLabel}: Finished resetting ${this.resource.toLowerCase()}.`);
            }
            finally {
                this.setStatus("idle" /* SyncStatus.Idle */);
            }
            return true;
        }
        async isRemoteDataFromCurrentMachine(remoteUserData) {
            const machineId = await this.currentMachineIdPromise;
            return !!remoteUserData.syncData?.machineId && remoteUserData.syncData.machineId === machineId;
        }
        async getLatestRemoteUserData(manifest, lastSyncUserData) {
            if (lastSyncUserData) {
                const latestRef = manifest ? manifest[this.resource] : undefined;
                // Last time synced resource and latest resource on server are same
                if (lastSyncUserData.ref === latestRef) {
                    return lastSyncUserData;
                }
                // There is no resource on server and last time it was synced with no resource
                if (latestRef === undefined && lastSyncUserData.syncData === null) {
                    return lastSyncUserData;
                }
            }
            return this.getRemoteUserData(lastSyncUserData);
        }
        async performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            if (remoteUserData.syncData && remoteUserData.syncData.version > this.version) {
                // current version is not compatible with cloud version
                this.telemetryService.publicLog2('sync/incompatible', { source: this.resource });
                throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)({ key: 'incompatible', comment: ['This is an error while syncing a resource that its local version is not compatible with its remote version.'] }, "Cannot sync {0} as its local version {1} is not compatible with its remote version {2}", this.resource, this.version, remoteUserData.syncData.version), "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */, this.resource);
            }
            try {
                return await this.doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
            }
            catch (e) {
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */:
                            // Rejected as there is a new local version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize ${this.syncResourceLogLabel} as there is a new local version available. Synchronizing again...`);
                            return this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                        case "Conflict" /* UserDataSyncErrorCode.Conflict */:
                        case "PreconditionFailed" /* UserDataSyncErrorCode.PreconditionFailed */:
                            // Rejected as there is a new remote version. Syncing again...
                            this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize as there is a new remote version available. Synchronizing again...`);
                            // Avoid cache and get latest remote user data - https://github.com/microsoft/vscode/issues/90624
                            remoteUserData = await this.getRemoteUserData(null);
                            // Get the latest last sync user data. Because multiple parallel syncs (in Web) could share same last sync data
                            // and one of them successfully updated remote and last sync state.
                            lastSyncUserData = await this.getLastSyncUserData();
                            return this.performSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
                    }
                }
                throw e;
            }
        }
        async doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            try {
                const isRemoteDataFromCurrentMachine = await this.isRemoteDataFromCurrentMachine(remoteUserData);
                const acceptRemote = !isRemoteDataFromCurrentMachine && lastSyncUserData === null && this.getStoredLastSyncUserDataStateContent() !== undefined;
                const merge = apply && !acceptRemote;
                // generate or use existing preview
                if (!this.syncPreviewPromise) {
                    this.syncPreviewPromise = (0, async_1.createCancelablePromise)(token => this.doGenerateSyncResourcePreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, merge, userDataSyncConfiguration, token));
                }
                let preview = await this.syncPreviewPromise;
                if (apply && acceptRemote) {
                    this.logService.info(`${this.syncResourceLogLabel}: Accepting remote because it was synced before and the last sync data is not available.`);
                    for (const resourcePreview of preview.resourcePreviews) {
                        preview = (await this.accept(resourcePreview.remoteResource)) || preview;
                    }
                }
                this.updateConflicts(preview.resourcePreviews);
                if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                    return "hasConflicts" /* SyncStatus.HasConflicts */;
                }
                if (apply) {
                    return await this.doApply(false);
                }
                return "syncing" /* SyncStatus.Syncing */;
            }
            catch (error) {
                // reset preview on error
                this.syncPreviewPromise = null;
                throw error;
            }
        }
        async merge(resource) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const mergeResult = await this.getMergeResult(resourcePreview, cancellation_1.CancellationToken.None);
                await this.fileService.writeFile(resourcePreview.previewResource, buffer_1.VSBuffer.fromString(mergeResult?.content || ''));
                const acceptResult = mergeResult && !mergeResult.hasConflicts
                    ? await this.getAcceptResult(resourcePreview, resourcePreview.previewResource, undefined, cancellation_1.CancellationToken.None)
                    : undefined;
                resourcePreview.acceptResult = acceptResult;
                resourcePreview.mergeState = mergeResult.hasConflicts ? "conflict" /* MergeState.Conflict */ : acceptResult ? "accepted" /* MergeState.Accepted */ : "preview" /* MergeState.Preview */;
                resourcePreview.localChange = acceptResult ? acceptResult.localChange : mergeResult.localChange;
                resourcePreview.remoteChange = acceptResult ? acceptResult.remoteChange : mergeResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async accept(resource, content) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const acceptResult = await this.getAcceptResult(resourcePreview, resource, content, cancellation_1.CancellationToken.None);
                resourcePreview.acceptResult = acceptResult;
                resourcePreview.mergeState = "accepted" /* MergeState.Accepted */;
                resourcePreview.localChange = acceptResult.localChange;
                resourcePreview.remoteChange = acceptResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async discard(resource) {
            await this.updateSyncResourcePreview(resource, async (resourcePreview) => {
                const mergeResult = await this.getMergeResult(resourcePreview, cancellation_1.CancellationToken.None);
                await this.fileService.writeFile(resourcePreview.previewResource, buffer_1.VSBuffer.fromString(mergeResult.content || ''));
                resourcePreview.acceptResult = undefined;
                resourcePreview.mergeState = "preview" /* MergeState.Preview */;
                resourcePreview.localChange = mergeResult.localChange;
                resourcePreview.remoteChange = mergeResult.remoteChange;
                return resourcePreview;
            });
            return this.syncPreviewPromise;
        }
        async updateSyncResourcePreview(resource, updateResourcePreview) {
            if (!this.syncPreviewPromise) {
                return;
            }
            let preview = await this.syncPreviewPromise;
            const index = preview.resourcePreviews.findIndex(({ localResource, remoteResource, previewResource }) => this.extUri.isEqual(localResource, resource) || this.extUri.isEqual(remoteResource, resource) || this.extUri.isEqual(previewResource, resource));
            if (index === -1) {
                return;
            }
            this.syncPreviewPromise = (0, async_1.createCancelablePromise)(async (token) => {
                const resourcePreviews = [...preview.resourcePreviews];
                resourcePreviews[index] = await updateResourcePreview(resourcePreviews[index]);
                return {
                    ...preview,
                    resourcePreviews
                };
            });
            preview = await this.syncPreviewPromise;
            this.updateConflicts(preview.resourcePreviews);
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                this.setStatus("hasConflicts" /* SyncStatus.HasConflicts */);
            }
            else {
                this.setStatus("syncing" /* SyncStatus.Syncing */);
            }
        }
        async doApply(force) {
            if (!this.syncPreviewPromise) {
                return "idle" /* SyncStatus.Idle */;
            }
            const preview = await this.syncPreviewPromise;
            // check for conflicts
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */)) {
                return "hasConflicts" /* SyncStatus.HasConflicts */;
            }
            // check if all are accepted
            if (preview.resourcePreviews.some(({ mergeState }) => mergeState !== "accepted" /* MergeState.Accepted */)) {
                return "syncing" /* SyncStatus.Syncing */;
            }
            // apply preview
            await this.applyResult(preview.remoteUserData, preview.lastSyncUserData, preview.resourcePreviews.map(resourcePreview => ([resourcePreview, resourcePreview.acceptResult])), force);
            // reset preview
            this.syncPreviewPromise = null;
            // reset preview folder
            await this.clearPreviewFolder();
            return "idle" /* SyncStatus.Idle */;
        }
        async clearPreviewFolder() {
            try {
                await this.fileService.del(this.syncPreviewFolder, { recursive: true });
            }
            catch (error) { /* Ignore */ }
        }
        updateConflicts(resourcePreviews) {
            const conflicts = resourcePreviews.filter(({ mergeState }) => mergeState === "conflict" /* MergeState.Conflict */);
            if (!(0, arrays_1.equals)(this._conflicts, conflicts, (a, b) => this.extUri.isEqual(a.previewResource, b.previewResource))) {
                this._conflicts = conflicts;
                this._onDidChangeConflicts.fire(this.conflicts);
            }
        }
        async hasPreviouslySynced() {
            const lastSyncData = await this.getLastSyncUserData();
            return !!lastSyncData && lastSyncData.syncData !== null /* `null` sync data implies resource is not synced */;
        }
        async resolvePreviewContent(uri) {
            const syncPreview = this.syncPreviewPromise ? await this.syncPreviewPromise : null;
            if (syncPreview) {
                for (const resourcePreview of syncPreview.resourcePreviews) {
                    if (this.extUri.isEqual(resourcePreview.acceptedResource, uri)) {
                        return resourcePreview.acceptResult ? resourcePreview.acceptResult.content : null;
                    }
                    if (this.extUri.isEqual(resourcePreview.remoteResource, uri)) {
                        return resourcePreview.remoteContent;
                    }
                    if (this.extUri.isEqual(resourcePreview.localResource, uri)) {
                        return resourcePreview.localContent;
                    }
                    if (this.extUri.isEqual(resourcePreview.baseResource, uri)) {
                        return resourcePreview.baseContent;
                    }
                }
            }
            return null;
        }
        async resetLocal() {
            this.storageService.remove(this.lastSyncUserDataStateKey, -1 /* StorageScope.APPLICATION */);
            try {
                await this.fileService.del(this.lastSyncResource);
            }
            catch (error) {
                if ((0, files_1.toFileOperationResult)(error) !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.error(error);
                }
            }
        }
        async doGenerateSyncResourcePreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, merge, userDataSyncConfiguration, token) {
            const resourcePreviewResults = await this.generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration, token);
            const resourcePreviews = [];
            for (const resourcePreviewResult of resourcePreviewResults) {
                const acceptedResource = resourcePreviewResult.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
                /* No change -> Accept */
                if (resourcePreviewResult.localChange === 0 /* Change.None */ && resourcePreviewResult.remoteChange === 0 /* Change.None */) {
                    resourcePreviews.push({
                        ...resourcePreviewResult,
                        acceptedResource,
                        acceptResult: { content: null, localChange: 0 /* Change.None */, remoteChange: 0 /* Change.None */ },
                        mergeState: "accepted" /* MergeState.Accepted */
                    });
                }
                /* Changed -> Apply ? (Merge ? Conflict | Accept) : Preview */
                else {
                    /* Merge */
                    const mergeResult = merge ? await this.getMergeResult(resourcePreviewResult, token) : undefined;
                    if (token.isCancellationRequested) {
                        break;
                    }
                    await this.fileService.writeFile(resourcePreviewResult.previewResource, buffer_1.VSBuffer.fromString(mergeResult?.content || ''));
                    /* Conflict | Accept */
                    const acceptResult = mergeResult && !mergeResult.hasConflicts
                        /* Accept if merged and there are no conflicts */
                        ? await this.getAcceptResult(resourcePreviewResult, resourcePreviewResult.previewResource, undefined, token)
                        : undefined;
                    resourcePreviews.push({
                        ...resourcePreviewResult,
                        acceptResult,
                        mergeState: mergeResult?.hasConflicts ? "conflict" /* MergeState.Conflict */ : acceptResult ? "accepted" /* MergeState.Accepted */ : "preview" /* MergeState.Preview */,
                        localChange: acceptResult ? acceptResult.localChange : mergeResult ? mergeResult.localChange : resourcePreviewResult.localChange,
                        remoteChange: acceptResult ? acceptResult.remoteChange : mergeResult ? mergeResult.remoteChange : resourcePreviewResult.remoteChange
                    });
                }
            }
            return { syncResource: this.resource, profile: this.syncResource.profile, remoteUserData, lastSyncUserData, resourcePreviews, isLastSyncFromCurrentMachine: isRemoteDataFromCurrentMachine };
        }
        async getLastSyncUserData() {
            let storedLastSyncUserDataStateContent = this.getStoredLastSyncUserDataStateContent();
            if (!storedLastSyncUserDataStateContent) {
                storedLastSyncUserDataStateContent = await this.migrateLastSyncUserData();
            }
            // Last Sync Data state does not exist
            if (!storedLastSyncUserDataStateContent) {
                this.logService.info(`${this.syncResourceLogLabel}: Last sync data state does not exist.`);
                return null;
            }
            const lastSyncUserDataState = JSON.parse(storedLastSyncUserDataStateContent);
            const resourceSyncStateVersion = this.userDataSyncEnablementService.getResourceSyncStateVersion(this.resource);
            this.hasSyncResourceStateVersionChanged = !!lastSyncUserDataState.version && !!resourceSyncStateVersion && lastSyncUserDataState.version !== resourceSyncStateVersion;
            if (this.hasSyncResourceStateVersionChanged) {
                this.logService.info(`${this.syncResourceLogLabel}: Reset last sync state because last sync state version ${lastSyncUserDataState.version} is not compatible with current sync state version ${resourceSyncStateVersion}.`);
                await this.resetLocal();
                return null;
            }
            let syncData = undefined;
            // Get Last Sync Data from Local
            let retrial = 1;
            while (syncData === undefined && retrial++ < 6 /* Retry 5 times */) {
                try {
                    const lastSyncStoredRemoteUserData = await this.readLastSyncStoredRemoteUserData();
                    if (lastSyncStoredRemoteUserData) {
                        if (lastSyncStoredRemoteUserData.ref === lastSyncUserDataState.ref) {
                            syncData = lastSyncStoredRemoteUserData.syncData;
                        }
                        else {
                            this.logService.info(`${this.syncResourceLogLabel}: Last sync data stored locally is not same as the last sync state.`);
                        }
                    }
                    break;
                }
                catch (error) {
                    if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Last sync resource does not exist locally.`);
                        break;
                    }
                    else if (error instanceof userDataSync_1.UserDataSyncError) {
                        throw error;
                    }
                    else {
                        // log and retry
                        this.logService.error(error, retrial);
                    }
                }
            }
            // Get Last Sync Data from Remote
            if (syncData === undefined) {
                try {
                    const content = await this.userDataSyncStoreService.resolveResourceContent(this.resource, lastSyncUserDataState.ref, this.collection, this.syncHeaders);
                    syncData = content === null ? null : this.parseSyncData(content);
                    await this.writeLastSyncStoredRemoteUserData({ ref: lastSyncUserDataState.ref, syncData });
                }
                catch (error) {
                    if (error instanceof userDataSync_1.UserDataSyncError && error.code === "NotFound" /* UserDataSyncErrorCode.NotFound */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Last sync resource does not exist remotely.`);
                    }
                    else {
                        throw error;
                    }
                }
            }
            // Last Sync Data Not Found
            if (syncData === undefined) {
                return null;
            }
            return {
                ...lastSyncUserDataState,
                syncData,
            };
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            if (additionalProps['ref'] || additionalProps['version']) {
                throw new Error('Cannot have core properties as additional');
            }
            const version = this.userDataSyncEnablementService.getResourceSyncStateVersion(this.resource);
            const lastSyncUserDataState = {
                ref: lastSyncRemoteUserData.ref,
                version,
                ...additionalProps
            };
            this.storageService.store(this.lastSyncUserDataStateKey, JSON.stringify(lastSyncUserDataState), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await this.writeLastSyncStoredRemoteUserData(lastSyncRemoteUserData);
        }
        getStoredLastSyncUserDataStateContent() {
            return this.storageService.get(this.lastSyncUserDataStateKey, -1 /* StorageScope.APPLICATION */);
        }
        async readLastSyncStoredRemoteUserData() {
            const content = (await this.fileService.readFile(this.lastSyncResource)).value.toString();
            try {
                const lastSyncStoredRemoteUserData = content ? JSON.parse(content) : undefined;
                if (isRemoteUserData(lastSyncStoredRemoteUserData)) {
                    return lastSyncStoredRemoteUserData;
                }
            }
            catch (e) {
                this.logService.error(e);
            }
            return undefined;
        }
        async writeLastSyncStoredRemoteUserData(lastSyncRemoteUserData) {
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncRemoteUserData)));
        }
        async migrateLastSyncUserData() {
            try {
                const content = await this.fileService.readFile(this.lastSyncResource);
                const userData = JSON.parse(content.value.toString());
                await this.fileService.del(this.lastSyncResource);
                if (userData.ref && userData.content !== undefined) {
                    this.storageService.store(this.lastSyncUserDataStateKey, JSON.stringify({
                        ...userData,
                        content: undefined,
                    }), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
                    await this.writeLastSyncStoredRemoteUserData({ ref: userData.ref, syncData: userData.content === null ? null : JSON.parse(userData.content) });
                }
                else {
                    this.logService.info(`${this.syncResourceLogLabel}: Migrating last sync user data. Invalid data.`, userData);
                }
            }
            catch (error) {
                if (error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Migrating last sync user data. Resource does not exist.`);
                }
                else {
                    this.logService.error(error);
                }
            }
            return this.storageService.get(this.lastSyncUserDataStateKey, -1 /* StorageScope.APPLICATION */);
        }
        async getRemoteUserData(lastSyncData) {
            const { ref, content } = await this.getUserData(lastSyncData);
            let syncData = null;
            if (content !== null) {
                syncData = this.parseSyncData(content);
            }
            return { ref, syncData };
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('incompatible sync data', "Cannot parse sync data as it is not compatible with the current version."), "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */, this.resource);
        }
        async getUserData(lastSyncData) {
            const lastSyncUserData = lastSyncData ? { ref: lastSyncData.ref, content: lastSyncData.syncData ? JSON.stringify(lastSyncData.syncData) : null } : null;
            return this.userDataSyncStoreService.readResource(this.resource, lastSyncUserData, this.collection, this.syncHeaders);
        }
        async updateRemoteUserData(content, ref) {
            const machineId = await this.currentMachineIdPromise;
            const syncData = { version: this.version, machineId, content };
            try {
                ref = await this.userDataSyncStoreService.writeResource(this.resource, JSON.stringify(syncData), ref, this.collection, this.syncHeaders);
                return { ref, syncData };
            }
            catch (error) {
                if (error instanceof userDataSync_1.UserDataSyncError && error.code === "TooLarge" /* UserDataSyncErrorCode.TooLarge */) {
                    error = new userDataSync_1.UserDataSyncError(error.message, error.code, this.resource);
                }
                throw error;
            }
        }
        async backupLocal(content) {
            const syncData = { version: this.version, content };
            return this.userDataSyncLocalStoreService.writeResource(this.resource, JSON.stringify(syncData), new Date(), this.syncResource.profile.isDefault ? undefined : this.syncResource.profile.id);
        }
        async stop() {
            if (this.status === "idle" /* SyncStatus.Idle */) {
                return;
            }
            this.logService.trace(`${this.syncResourceLogLabel}: Stopping synchronizing ${this.resource.toLowerCase()}.`);
            if (this.syncPreviewPromise) {
                this.syncPreviewPromise.cancel();
                this.syncPreviewPromise = null;
            }
            this.updateConflicts([]);
            await this.clearPreviewFolder();
            this.setStatus("idle" /* SyncStatus.Idle */);
            this.logService.info(`${this.syncResourceLogLabel}: Stopped synchronizing ${this.resource.toLowerCase()}.`);
        }
        getUserDataSyncConfiguration() {
            return this.configurationService.getValue(userDataSync_1.USER_DATA_SYNC_CONFIGURATION_SCOPE);
        }
    };
    exports.AbstractSynchroniser = AbstractSynchroniser;
    exports.AbstractSynchroniser = AbstractSynchroniser = __decorate([
        __param(2, files_1.IFileService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, userDataSync_1.IUserDataSyncLogService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], AbstractSynchroniser);
    let AbstractFileSynchroniser = class AbstractFileSynchroniser extends AbstractSynchroniser {
        constructor(file, syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService) {
            super(syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.file = file;
            this._register(this.fileService.watch(this.extUri.dirname(file)));
            this._register(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
        }
        async getLocalFileContent() {
            try {
                return await this.fileService.readFile(this.file);
            }
            catch (error) {
                return null;
            }
        }
        async updateLocalFileContent(newContent, oldContent, force) {
            try {
                if (oldContent) {
                    // file exists already
                    await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(newContent), force ? undefined : oldContent);
                }
                else {
                    // file does not exist
                    await this.fileService.createFile(this.file, buffer_1.VSBuffer.fromString(newContent), { overwrite: force });
                }
            }
            catch (e) {
                if ((e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) ||
                    (e instanceof files_1.FileOperationError && e.fileOperationResult === 3 /* FileOperationResult.FILE_MODIFIED_SINCE */)) {
                    throw new userDataSync_1.UserDataSyncError(e.message, "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */);
                }
                else {
                    throw e;
                }
            }
        }
        async deleteLocalFile() {
            try {
                await this.fileService.del(this.file);
            }
            catch (e) {
                if (!(e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    throw e;
                }
            }
        }
        onFileChanges(e) {
            if (!e.contains(this.file)) {
                return;
            }
            this.triggerLocalChange();
        }
    };
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser;
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser = __decorate([
        __param(3, files_1.IFileService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, userDataSync_1.IUserDataSyncStoreService),
        __param(7, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, userDataSync_1.IUserDataSyncLogService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, uriIdentity_1.IUriIdentityService)
    ], AbstractFileSynchroniser);
    let AbstractJsonFileSynchroniser = class AbstractJsonFileSynchroniser extends AbstractFileSynchroniser {
        constructor(file, syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService, uriIdentityService) {
            super(file, syncResource, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.userDataSyncUtilService = userDataSyncUtilService;
            this._formattingOptions = undefined;
        }
        hasErrors(content, isArray) {
            const parseErrors = [];
            const result = (0, json_1.parse)(content, parseErrors, { allowEmptyContent: true, allowTrailingComma: true });
            return parseErrors.length > 0 || (!(0, types_1.isUndefined)(result) && isArray !== Array.isArray(result));
        }
        getFormattingOptions() {
            if (!this._formattingOptions) {
                this._formattingOptions = this.userDataSyncUtilService.resolveFormattingOptions(this.file);
            }
            return this._formattingOptions;
        }
    };
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser;
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser = __decorate([
        __param(3, files_1.IFileService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, storage_1.IStorageService),
        __param(6, userDataSync_1.IUserDataSyncStoreService),
        __param(7, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(8, userDataSync_1.IUserDataSyncEnablementService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, userDataSync_1.IUserDataSyncLogService),
        __param(11, userDataSync_1.IUserDataSyncUtilService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, uriIdentity_1.IUriIdentityService)
    ], AbstractJsonFileSynchroniser);
    let AbstractInitializer = class AbstractInitializer {
        constructor(resource, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService) {
            this.resource = resource;
            this.userDataProfilesService = userDataProfilesService;
            this.environmentService = environmentService;
            this.logService = logService;
            this.fileService = fileService;
            this.storageService = storageService;
            this.extUri = uriIdentityService.extUri;
            this.lastSyncResource = (0, userDataSync_1.getLastSyncResourceUri)(undefined, this.resource, environmentService, this.extUri);
        }
        async initialize({ ref, content }) {
            if (!content) {
                this.logService.info('Remote content does not exist.', this.resource);
                return;
            }
            const syncData = this.parseSyncData(content);
            if (!syncData) {
                return;
            }
            try {
                await this.doInitialize({ ref, syncData });
            }
            catch (error) {
                this.logService.error(error);
            }
        }
        parseSyncData(content) {
            try {
                const syncData = JSON.parse(content);
                if (isSyncData(syncData)) {
                    return syncData;
                }
            }
            catch (error) {
                this.logService.error(error);
            }
            this.logService.info('Cannot parse sync data as it is not compatible with the current version.', this.resource);
            return undefined;
        }
        async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
            if (additionalProps['ref'] || additionalProps['version']) {
                throw new Error('Cannot have core properties as additional');
            }
            const lastSyncUserDataState = {
                ref: lastSyncRemoteUserData.ref,
                version: undefined,
                ...additionalProps
            };
            this.storageService.store(`${this.resource}.lastSyncUserData`, JSON.stringify(lastSyncUserDataState), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncRemoteUserData)));
        }
    };
    exports.AbstractInitializer = AbstractInitializer;
    exports.AbstractInitializer = AbstractInitializer = __decorate([
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, log_1.ILogService),
        __param(4, files_1.IFileService),
        __param(5, storage_1.IStorageService),
        __param(6, uriIdentity_1.IUriIdentityService)
    ], AbstractInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTeW5jaHJvbml6ZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vYWJzdHJhY3RTeW5jaHJvbml6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0NoRyw0Q0FRQztJQUVELGdDQWlCQztJQUVELDBEQUVDO0lBL0JELFNBQWdCLGdCQUFnQixDQUFDLEtBQVU7UUFDMUMsSUFBSSxLQUFLO2VBQ0wsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLFNBQVMsSUFBSSxPQUFPLEtBQUssQ0FBQyxHQUFHLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDO2VBQzlFLENBQUMsS0FBSyxDQUFDLFFBQVEsS0FBSyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxLQUFLLElBQUksSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQy9GLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELFNBQWdCLFVBQVUsQ0FBQyxLQUFVO1FBQ3BDLElBQUksS0FBSztlQUNMLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQztlQUNsRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssU0FBUyxJQUFJLE9BQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBRXhFLHlCQUF5QjtZQUN6QixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUM7bUJBQy9CLENBQUMsS0FBSyxDQUFDLFNBQVMsS0FBSyxTQUFTLElBQUksT0FBTyxLQUFLLENBQUMsU0FBUyxLQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzVFLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxZQUEwQixFQUFFLE9BQXlCO1FBQzVGLE9BQU8sR0FBRyxJQUFBLDhCQUFvQixFQUFDLFlBQVksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNoRyxDQUFDO0lBZ0RNLElBQWUsb0JBQW9CLEdBQW5DLE1BQWUsb0JBQXFCLFNBQVEsc0JBQVU7UUFVNUQsSUFBSSxNQUFNLEtBQWlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFLakQsSUFBSSxTQUFTLEtBQXFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFpQmhILFlBQ1UsWUFBbUMsRUFDbkMsVUFBOEIsRUFDekIsV0FBNEMsRUFDckMsa0JBQTBELEVBQzlELGNBQWtELEVBQ3hDLHdCQUFzRSxFQUNqRSw2QkFBZ0YsRUFDaEYsNkJBQWdGLEVBQzdGLGdCQUFzRCxFQUNoRCxVQUFzRCxFQUN4RCxvQkFBOEQsRUFDaEUsa0JBQXVDO1lBRTVELEtBQUssRUFBRSxDQUFDO1lBYkMsaUJBQVksR0FBWixZQUFZLENBQXVCO1lBQ25DLGVBQVUsR0FBVixVQUFVLENBQW9CO1lBQ04sZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDbEIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUMzQyxtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDckIsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEyQjtZQUM5QyxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBQzdELGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBZ0M7WUFDMUUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUM3QixlQUFVLEdBQVYsVUFBVSxDQUF5QjtZQUNyQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBekM5RSx1QkFBa0IsR0FBbUQsSUFBSSxDQUFDO1lBTzFFLFlBQU8sZ0NBQStCO1lBRXRDLHNCQUFpQixHQUF3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFjLENBQUMsQ0FBQztZQUNsRixzQkFBaUIsR0FBc0IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUVyRSxlQUFVLEdBQTJCLEVBQUUsQ0FBQztZQUV4QywwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFrQyxDQUFDLENBQUM7WUFDckYseUJBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQUVoRCxnQ0FBMkIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3RSxzQkFBaUIsR0FBa0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDL0UscUJBQWdCLEdBQWdCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7WUFHckQsNkJBQXdCLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxtQkFBbUIsQ0FBQztZQUN4SSx1Q0FBa0MsR0FBWSxLQUFLLENBQUM7WUFHbEQsZ0JBQVcsR0FBYSxFQUFFLENBQUM7WUFFNUIsYUFBUSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDO1lBaUJsRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsdUJBQXVCLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckcsSUFBSSxDQUFDLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7WUFDeEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLElBQUEsOEJBQWUsRUFBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNqTSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSwrQkFBZ0IsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFBLHFDQUFzQixFQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFlBQVksQ0FBQyxZQUFZLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pMLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFBLHNDQUFtQixFQUFDLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNyRyxDQUFDO1FBRVMsa0JBQWtCO1lBQzNCLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRVMsS0FBSyxDQUFDLG9CQUFvQjtZQUVuQywrQ0FBK0M7WUFDL0MsSUFBSSxJQUFJLENBQUMsTUFBTSxpREFBNEIsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0Isa0VBQWtFLENBQUMsQ0FBQztnQkFDckgsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQW1CLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQztnQkFDbkksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4QixDQUFDO1lBRUQsNkNBQTZDO2lCQUN4QyxDQUFDO2dCQUNMLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixpQ0FBaUMsQ0FBQyxDQUFDO2dCQUNyRixNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzFELE1BQU0sZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDakcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO29CQUN0QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQy9CLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVTLFNBQVMsQ0FBQyxNQUFrQjtZQUNyQyxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO2dCQUN0QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUEwQyxFQUFFLFVBQW9CLEVBQUU7WUFDNUUsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBMEMsRUFBRSx5QkFBcUQsRUFBRSxVQUFvQixFQUFFO1lBQ3RJLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQWMsRUFBRSxVQUFvQixFQUFFO1lBQ2pELElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsR0FBRyxPQUFPLEVBQUUsQ0FBQztnQkFFbEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN6QyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUV2QixPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztZQUNoQyxDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQTBDLEVBQUUsS0FBYyxFQUFFLHlCQUFxRCxFQUFFLE9BQWlCO1lBQ3ZKLElBQUksQ0FBQztnQkFDSixJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsR0FBRyxPQUFPLEVBQUUsQ0FBQztnQkFFbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxpREFBNEIsRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsMkJBQTJCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLDBCQUEwQixDQUFDLENBQUM7b0JBQ25JLE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO2dCQUNoQyxDQUFDO2dCQUVELElBQUksSUFBSSxDQUFDLE1BQU0sdUNBQXVCLEVBQUUsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLDJCQUEyQixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO29CQUNySSxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztnQkFDaEMsQ0FBQztnQkFFRCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsMkJBQTJCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMvRyxJQUFJLENBQUMsU0FBUyxvQ0FBb0IsQ0FBQztnQkFFbkMsSUFBSSxNQUFNLCtCQUE4QixDQUFDO2dCQUN6QyxJQUFJLENBQUM7b0JBQ0osTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO29CQUMxRCxNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztvQkFDdEYsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixDQUFDLENBQUM7b0JBQ3BHLElBQUksTUFBTSxpREFBNEIsRUFBRSxDQUFDO3dCQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsNENBQTRDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUM5SCxDQUFDO3lCQUFNLElBQUksTUFBTSxpQ0FBb0IsRUFBRSxDQUFDO3dCQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsNEJBQTRCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMvRyxDQUFDO29CQUNELE9BQU8sSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUksQ0FBQztnQkFDeEMsQ0FBQzt3QkFBUyxDQUFDO29CQUNWLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7WUFDRixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDdkIsQ0FBQztRQUNGLENBQUM7UUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQWU7WUFDNUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFbEIsSUFBSSxDQUFDO2dCQUNKLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQix1QkFBdUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNHLElBQUksQ0FBQyxTQUFTLG9DQUFvQixDQUFDO2dCQUNuQyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7Z0JBQzFELE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUNsRixNQUFNLDhCQUE4QixHQUFHLE1BQU0sSUFBSSxDQUFDLDhCQUE4QixDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUVqRywyQkFBMkI7Z0JBQzNCLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxHQUFHLEVBQUUsY0FBYyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSw4QkFBOEIsRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFcE4sTUFBTSxnQkFBZ0IsR0FBd0MsRUFBRSxDQUFDO2dCQUNqRSxLQUFLLE1BQU0scUJBQXFCLElBQUksc0JBQXNCLEVBQUUsQ0FBQztvQkFDNUQsNEJBQTRCO29CQUM1QixNQUFNLFlBQVksR0FBa0IsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLHFCQUFxQixFQUFFLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQy9KLDJCQUEyQjtvQkFDM0IsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxxQkFBcUIsQ0FBQyxlQUFlLEVBQUUscUJBQXFCLENBQUMsYUFBYSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUMvSyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLEdBQUcsWUFBWSxFQUFFLFlBQVksRUFBRSxZQUFZLHdCQUFnQixDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyx3QkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbEosQ0FBQztnQkFFRCxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNsRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0Isd0JBQXdCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQzFHLENBQUM7b0JBQVMsQ0FBQztnQkFDVixJQUFJLENBQUMsU0FBUyw4QkFBaUIsQ0FBQztZQUNqQyxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU8sS0FBSyxDQUFDLDhCQUE4QixDQUFDLGNBQStCO1lBQzNFLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDO1lBQ3JELE9BQU8sQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQztRQUNoRyxDQUFDO1FBRVMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLFFBQTBDLEVBQUUsZ0JBQXdDO1lBQzNILElBQUksZ0JBQWdCLEVBQUUsQ0FBQztnQkFFdEIsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7Z0JBRWpFLG1FQUFtRTtnQkFDbkUsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssU0FBUyxFQUFFLENBQUM7b0JBQ3hDLE9BQU8sZ0JBQWdCLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsOEVBQThFO2dCQUM5RSxJQUFJLFNBQVMsS0FBSyxTQUFTLElBQUksZ0JBQWdCLENBQUMsUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO29CQUNuRSxPQUFPLGdCQUFnQixDQUFDO2dCQUN6QixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVPLEtBQUssQ0FBQyxXQUFXLENBQUMsY0FBK0IsRUFBRSxnQkFBd0MsRUFBRSxLQUFjLEVBQUUseUJBQXFEO1lBQ3pLLElBQUksY0FBYyxDQUFDLFFBQVEsSUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQy9FLHVEQUF1RDtnQkFDdkQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBMkQsbUJBQW1CLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzNJLE1BQU0sSUFBSSxnQ0FBaUIsQ0FBQyxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLENBQUMsNkdBQTZHLENBQUMsRUFBRSxFQUFFLHdGQUF3RixFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxtRkFBa0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2paLENBQUM7WUFFRCxJQUFJLENBQUM7Z0JBQ0osT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQzlGLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxZQUFZLGdDQUFpQixFQUFFLENBQUM7b0JBQ3BDLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO3dCQUVoQjs0QkFDQyw2REFBNkQ7NEJBQzdELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQiwyQkFBMkIsSUFBSSxDQUFDLG9CQUFvQixvRUFBb0UsQ0FBQyxDQUFDOzRCQUMzSyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO3dCQUU3RixxREFBb0M7d0JBQ3BDOzRCQUNDLDhEQUE4RDs0QkFDOUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLDRGQUE0RixDQUFDLENBQUM7NEJBRS9JLGlHQUFpRzs0QkFDakcsY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUVwRCwrR0FBK0c7NEJBQy9HLG1FQUFtRTs0QkFDbkUsZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzs0QkFFcEQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLGNBQWMsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUseUJBQXlCLENBQUMsQ0FBQztvQkFDOUYsQ0FBQztnQkFDRixDQUFDO2dCQUNELE1BQU0sQ0FBQyxDQUFDO1lBQ1QsQ0FBQztRQUNGLENBQUM7UUFFUyxLQUFLLENBQUMsTUFBTSxDQUFDLGNBQStCLEVBQUUsZ0JBQXdDLEVBQUUsS0FBYyxFQUFFLHlCQUFxRDtZQUN0SyxJQUFJLENBQUM7Z0JBRUosTUFBTSw4QkFBOEIsR0FBRyxNQUFNLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDakcsTUFBTSxZQUFZLEdBQUcsQ0FBQyw4QkFBOEIsSUFBSSxnQkFBZ0IsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLHFDQUFxQyxFQUFFLEtBQUssU0FBUyxDQUFDO2dCQUNoSixNQUFNLEtBQUssR0FBRyxLQUFLLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBRXJDLG1DQUFtQztnQkFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUM5QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBQSwrQkFBdUIsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsOEJBQThCLEVBQUUsS0FBSyxFQUFFLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzNNLENBQUM7Z0JBRUQsSUFBSSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUM7Z0JBRTVDLElBQUksS0FBSyxJQUFJLFlBQVksRUFBRSxDQUFDO29CQUMzQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsMEZBQTBGLENBQUMsQ0FBQztvQkFDN0ksS0FBSyxNQUFNLGVBQWUsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzt3QkFDeEQsT0FBTyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLE9BQU8sQ0FBQztvQkFDMUUsQ0FBQztnQkFDRixDQUFDO2dCQUVELElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQy9DLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDLFVBQVUseUNBQXdCLENBQUMsRUFBRSxDQUFDO29CQUMzRixvREFBK0I7Z0JBQ2hDLENBQUM7Z0JBRUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxPQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEMsQ0FBQztnQkFFRCwwQ0FBMEI7WUFFM0IsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBRWhCLHlCQUF5QjtnQkFDekIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztnQkFFL0IsTUFBTSxLQUFLLENBQUM7WUFDYixDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBYTtZQUN4QixNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxFQUFFO2dCQUN4RSxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2RixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNuSCxNQUFNLFlBQVksR0FBOEIsV0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVk7b0JBQ3ZGLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxlQUFlLEVBQUUsU0FBUyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQztvQkFDakgsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDYixlQUFlLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztnQkFDNUMsZUFBZSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsc0NBQXFCLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxzQ0FBcUIsQ0FBQyxtQ0FBbUIsQ0FBQztnQkFDdEksZUFBZSxDQUFDLFdBQVcsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUM7Z0JBQ2hHLGVBQWUsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO2dCQUNuRyxPQUFPLGVBQWUsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQWEsRUFBRSxPQUF1QjtZQUNsRCxNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxFQUFFO2dCQUN4RSxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsZ0NBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVHLGVBQWUsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO2dCQUM1QyxlQUFlLENBQUMsVUFBVSx1Q0FBc0IsQ0FBQztnQkFDakQsZUFBZSxDQUFDLFdBQVcsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDO2dCQUN2RCxlQUFlLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUM7Z0JBQ3pELE9BQU8sZUFBZSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUM7UUFDaEMsQ0FBQztRQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBYTtZQUMxQixNQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxFQUFFO2dCQUN4RSxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2RixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsSCxlQUFlLENBQUMsWUFBWSxHQUFHLFNBQVMsQ0FBQztnQkFDekMsZUFBZSxDQUFDLFVBQVUscUNBQXFCLENBQUM7Z0JBQ2hELGVBQWUsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQztnQkFDdEQsZUFBZSxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO2dCQUN4RCxPQUFPLGVBQWUsQ0FBQztZQUN4QixDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2hDLENBQUM7UUFFTyxLQUFLLENBQUMseUJBQXlCLENBQUMsUUFBYSxFQUFFLHFCQUF1RztZQUM3SixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUM7WUFDNUMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsRUFBRSxFQUFFLENBQ3ZHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEosSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbEIsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBQSwrQkFBdUIsRUFBQyxLQUFLLEVBQUMsS0FBSyxFQUFDLEVBQUU7Z0JBQy9ELE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUN2RCxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQy9FLE9BQU87b0JBQ04sR0FBRyxPQUFPO29CQUNWLGdCQUFnQjtpQkFDaEIsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDO1lBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDL0MsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUMsVUFBVSx5Q0FBd0IsQ0FBQyxFQUFFLENBQUM7Z0JBQzNGLElBQUksQ0FBQyxTQUFTLDhDQUF5QixDQUFDO1lBQ3pDLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxvQ0FBb0IsQ0FBQztZQUNwQyxDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBYztZQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzlCLG9DQUF1QjtZQUN4QixDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUM7WUFFOUMsc0JBQXNCO1lBQ3RCLElBQUksT0FBTyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxDQUFDLFVBQVUseUNBQXdCLENBQUMsRUFBRSxDQUFDO2dCQUMzRixvREFBK0I7WUFDaEMsQ0FBQztZQUVELDRCQUE0QjtZQUM1QixJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxVQUFVLHlDQUF3QixDQUFDLEVBQUUsQ0FBQztnQkFDM0YsMENBQTBCO1lBQzNCLENBQUM7WUFFRCxnQkFBZ0I7WUFDaEIsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxZQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFckwsZ0JBQWdCO1lBQ2hCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFFL0IsdUJBQXVCO1lBQ3ZCLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFFaEMsb0NBQXVCO1FBQ3hCLENBQUM7UUFFTyxLQUFLLENBQUMsa0JBQWtCO1lBQy9CLElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVPLGVBQWUsQ0FBQyxnQkFBNEM7WUFDbkUsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLENBQUMsVUFBVSx5Q0FBd0IsQ0FBQyxDQUFDO1lBQ2xHLElBQUksQ0FBQyxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDOUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pELENBQUM7UUFDRixDQUFDO1FBRUQsS0FBSyxDQUFDLG1CQUFtQjtZQUN4QixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQ3RELE9BQU8sQ0FBQyxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxxREFBcUQsQ0FBQztRQUMvRyxDQUFDO1FBRVMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEdBQVE7WUFDN0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25GLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLEtBQUssTUFBTSxlQUFlLElBQUksV0FBVyxDQUFDLGdCQUFnQixFQUFFLENBQUM7b0JBQzVELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ2hFLE9BQU8sZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDbkYsQ0FBQztvQkFDRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQzt3QkFDOUQsT0FBTyxlQUFlLENBQUMsYUFBYSxDQUFDO29CQUN0QyxDQUFDO29CQUNELElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUM3RCxPQUFPLGVBQWUsQ0FBQyxZQUFZLENBQUM7b0JBQ3JDLENBQUM7b0JBQ0QsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQzVELE9BQU8sZUFBZSxDQUFDLFdBQVcsQ0FBQztvQkFDcEMsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUVELEtBQUssQ0FBQyxVQUFVO1lBQ2YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLHdCQUF3QixvQ0FBMkIsQ0FBQztZQUNwRixJQUFJLENBQUM7Z0JBQ0osTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNuRCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFBLDZCQUFxQixFQUFDLEtBQUssQ0FBQywrQ0FBdUMsRUFBRSxDQUFDO29CQUN6RSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUIsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sS0FBSyxDQUFDLDZCQUE2QixDQUFDLGNBQStCLEVBQUUsZ0JBQXdDLEVBQUUsOEJBQXVDLEVBQUUsS0FBYyxFQUFFLHlCQUFxRCxFQUFFLEtBQXdCO1lBQzlQLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLDhCQUE4QixFQUFFLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWxLLE1BQU0sZ0JBQWdCLEdBQStCLEVBQUUsQ0FBQztZQUN4RCxLQUFLLE1BQU0scUJBQXFCLElBQUksc0JBQXNCLEVBQUUsQ0FBQztnQkFDNUQsTUFBTSxnQkFBZ0IsR0FBRyxxQkFBcUIsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLG9DQUFxQixFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO2dCQUU5SCx5QkFBeUI7Z0JBQ3pCLElBQUkscUJBQXFCLENBQUMsV0FBVyx3QkFBZ0IsSUFBSSxxQkFBcUIsQ0FBQyxZQUFZLHdCQUFnQixFQUFFLENBQUM7b0JBQzdHLGdCQUFnQixDQUFDLElBQUksQ0FBQzt3QkFDckIsR0FBRyxxQkFBcUI7d0JBQ3hCLGdCQUFnQjt3QkFDaEIsWUFBWSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLHFCQUFhLEVBQUUsWUFBWSxxQkFBYSxFQUFFO3dCQUNwRixVQUFVLHNDQUFxQjtxQkFDL0IsQ0FBQyxDQUFDO2dCQUNKLENBQUM7Z0JBRUQsOERBQThEO3FCQUN6RCxDQUFDO29CQUNMLFdBQVc7b0JBQ1gsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztvQkFDaEcsSUFBSSxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzt3QkFDbkMsTUFBTTtvQkFDUCxDQUFDO29CQUNELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsZUFBZSxFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFFekgsdUJBQXVCO29CQUN2QixNQUFNLFlBQVksR0FBRyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWTt3QkFDNUQsaURBQWlEO3dCQUNqRCxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLHFCQUFxQixFQUFFLHFCQUFxQixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDO3dCQUM1RyxDQUFDLENBQUMsU0FBUyxDQUFDO29CQUViLGdCQUFnQixDQUFDLElBQUksQ0FBQzt3QkFDckIsR0FBRyxxQkFBcUI7d0JBQ3hCLFlBQVk7d0JBQ1osVUFBVSxFQUFFLFdBQVcsRUFBRSxZQUFZLENBQUMsQ0FBQyxzQ0FBcUIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLHNDQUFxQixDQUFDLG1DQUFtQjt3QkFDckgsV0FBVyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXO3dCQUNoSSxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLFlBQVk7cUJBQ3BJLENBQUMsQ0FBQztnQkFDSixDQUFDO1lBQ0YsQ0FBQztZQUVELE9BQU8sRUFBRSxZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLDRCQUE0QixFQUFFLDhCQUE4QixFQUFFLENBQUM7UUFDOUwsQ0FBQztRQUVELEtBQUssQ0FBQyxtQkFBbUI7WUFDeEIsSUFBSSxrQ0FBa0MsR0FBRyxJQUFJLENBQUMscUNBQXFDLEVBQUUsQ0FBQztZQUN0RixJQUFJLENBQUMsa0NBQWtDLEVBQUUsQ0FBQztnQkFDekMsa0NBQWtDLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUMzRSxDQUFDO1lBRUQsc0NBQXNDO1lBQ3RDLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO2dCQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0Isd0NBQXdDLENBQUMsQ0FBQztnQkFDM0YsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsTUFBTSxxQkFBcUIsR0FBMkIsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQ3JHLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMvRyxJQUFJLENBQUMsa0NBQWtDLEdBQUcsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsd0JBQXdCLElBQUkscUJBQXFCLENBQUMsT0FBTyxLQUFLLHdCQUF3QixDQUFDO1lBQ3RLLElBQUksSUFBSSxDQUFDLGtDQUFrQyxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQiwyREFBMkQscUJBQXFCLENBQUMsT0FBTyxzREFBc0Qsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDO2dCQUM1TixNQUFNLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsSUFBSSxRQUFRLEdBQWlDLFNBQVMsQ0FBQztZQUV2RCxnQ0FBZ0M7WUFDaEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLE9BQU8sUUFBUSxLQUFLLFNBQVMsSUFBSSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDcEUsSUFBSSxDQUFDO29CQUNKLE1BQU0sNEJBQTRCLEdBQUcsTUFBTSxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztvQkFDbkYsSUFBSSw0QkFBNEIsRUFBRSxDQUFDO3dCQUNsQyxJQUFJLDRCQUE0QixDQUFDLEdBQUcsS0FBSyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDcEUsUUFBUSxHQUFHLDRCQUE0QixDQUFDLFFBQVEsQ0FBQzt3QkFDbEQsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixxRUFBcUUsQ0FBQyxDQUFDO3dCQUN6SCxDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTTtnQkFDUCxDQUFDO2dCQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7b0JBQ2hCLElBQUksS0FBSyxZQUFZLDBCQUFrQixJQUFJLEtBQUssQ0FBQyxtQkFBbUIsK0NBQXVDLEVBQUUsQ0FBQzt3QkFDN0csSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLDhDQUE4QyxDQUFDLENBQUM7d0JBQ2pHLE1BQU07b0JBQ1AsQ0FBQzt5QkFBTSxJQUFJLEtBQUssWUFBWSxnQ0FBaUIsRUFBRSxDQUFDO3dCQUMvQyxNQUFNLEtBQUssQ0FBQztvQkFDYixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsZ0JBQWdCO3dCQUNoQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7b0JBQ3ZDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7WUFFRCxpQ0FBaUM7WUFDakMsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQztvQkFDSixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDeEosUUFBUSxHQUFHLE9BQU8sS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDakUsTUFBTSxJQUFJLENBQUMsaUNBQWlDLENBQUMsRUFBRSxHQUFHLEVBQUUscUJBQXFCLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzVGLENBQUM7Z0JBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztvQkFDaEIsSUFBSSxLQUFLLFlBQVksZ0NBQWlCLElBQUksS0FBSyxDQUFDLElBQUksb0RBQW1DLEVBQUUsQ0FBQzt3QkFDekYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLCtDQUErQyxDQUFDLENBQUM7b0JBQ25HLENBQUM7eUJBQU0sQ0FBQzt3QkFDUCxNQUFNLEtBQUssQ0FBQztvQkFDYixDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1lBRUQsMkJBQTJCO1lBQzNCLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFFRCxPQUFPO2dCQUNOLEdBQUcscUJBQXFCO2dCQUN4QixRQUFRO2FBQ0gsQ0FBQztRQUNSLENBQUM7UUFFUyxLQUFLLENBQUMsc0JBQXNCLENBQUMsc0JBQXVDLEVBQUUsa0JBQTBDLEVBQUU7WUFDM0gsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksZUFBZSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQzFELE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUM5RCxDQUFDO1lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLDZCQUE2QixDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RixNQUFNLHFCQUFxQixHQUEyQjtnQkFDckQsR0FBRyxFQUFFLHNCQUFzQixDQUFDLEdBQUc7Z0JBQy9CLE9BQU87Z0JBQ1AsR0FBRyxlQUFlO2FBQ2xCLENBQUM7WUFFRixJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsQ0FBQyxtRUFBa0QsQ0FBQztZQUNqSixNQUFNLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFTyxxQ0FBcUM7WUFDNUMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLG9DQUEyQixDQUFDO1FBQ3pGLENBQUM7UUFFTyxLQUFLLENBQUMsZ0NBQWdDO1lBQzdDLE1BQU0sT0FBTyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMxRixJQUFJLENBQUM7Z0JBQ0osTUFBTSw0QkFBNEIsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztnQkFDL0UsSUFBSSxnQkFBZ0IsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUM7b0JBQ3BELE9BQU8sNEJBQTRCLENBQUM7Z0JBQ3JDLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDWixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVPLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxzQkFBdUM7WUFDdEYsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsaUJBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0SCxDQUFDO1FBRU8sS0FBSyxDQUFDLHVCQUF1QjtZQUNwQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDdkUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQ3RELE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBQ2xELElBQUksUUFBUSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNwRCxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQzt3QkFDdkUsR0FBRyxRQUFRO3dCQUNYLE9BQU8sRUFBRSxTQUFTO3FCQUNsQixDQUFDLG1FQUFrRCxDQUFDO29CQUNyRCxNQUFNLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hKLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsZ0RBQWdELEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQzlHLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxLQUFLLFlBQVksMEJBQWtCLElBQUksS0FBSyxDQUFDLG1CQUFtQiwrQ0FBdUMsRUFBRSxDQUFDO29CQUM3RyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsMkRBQTJELENBQUMsQ0FBQztnQkFDL0csQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QixDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLHdCQUF3QixvQ0FBMkIsQ0FBQztRQUN6RixDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFlBQW9DO1lBQzNELE1BQU0sRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlELElBQUksUUFBUSxHQUFxQixJQUFJLENBQUM7WUFDdEMsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFLENBQUM7Z0JBQ3RCLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFDRCxPQUFPLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDO1FBQzFCLENBQUM7UUFFUyxhQUFhLENBQUMsT0FBZTtZQUN0QyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxRQUFRLEdBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxRQUFRLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELE1BQU0sSUFBSSxnQ0FBaUIsQ0FBQyxJQUFBLGNBQVEsRUFBQyx3QkFBd0IsRUFBRSwwRUFBMEUsQ0FBQyxxRkFBbUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdNLENBQUM7UUFFTyxLQUFLLENBQUMsV0FBVyxDQUFDLFlBQW9DO1lBQzdELE1BQU0sZ0JBQWdCLEdBQXFCLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsWUFBWSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUssT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkgsQ0FBQztRQUVTLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxPQUFlLEVBQUUsR0FBa0I7WUFDdkUsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUM7WUFDckQsTUFBTSxRQUFRLEdBQWMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDMUUsSUFBSSxDQUFDO2dCQUNKLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDekksT0FBTyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxLQUFLLFlBQVksZ0NBQWlCLElBQUksS0FBSyxDQUFDLElBQUksb0RBQW1DLEVBQUUsQ0FBQztvQkFDekYsS0FBSyxHQUFHLElBQUksZ0NBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDekUsQ0FBQztnQkFDRCxNQUFNLEtBQUssQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBRVMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFlO1lBQzFDLE1BQU0sUUFBUSxHQUFjLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUM7WUFDL0QsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM5TCxDQUFDO1FBRUQsS0FBSyxDQUFDLElBQUk7WUFDVCxJQUFJLElBQUksQ0FBQyxNQUFNLGlDQUFvQixFQUFFLENBQUM7Z0JBQ3JDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsb0JBQW9CLDRCQUE0QixJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM5RyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDaEMsQ0FBQztZQUVELElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDekIsTUFBTSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUVoQyxJQUFJLENBQUMsU0FBUyw4QkFBaUIsQ0FBQztZQUNoQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsMkJBQTJCLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdHLENBQUM7UUFFTyw0QkFBNEI7WUFDbkMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLGlEQUFrQyxDQUFDLENBQUM7UUFDL0UsQ0FBQztLQVdELENBQUE7SUFsckJxQixvREFBb0I7bUNBQXBCLG9CQUFvQjtRQW1DdkMsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHdDQUF5QixDQUFBO1FBQ3pCLFdBQUEsNkNBQThCLENBQUE7UUFDOUIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFdBQUEsc0NBQXVCLENBQUE7UUFDdkIsWUFBQSxxQ0FBcUIsQ0FBQTtRQUNyQixZQUFBLGlDQUFtQixDQUFBO09BNUNBLG9CQUFvQixDQWtyQnpDO0lBTU0sSUFBZSx3QkFBd0IsR0FBdkMsTUFBZSx3QkFBeUIsU0FBUSxvQkFBb0I7UUFFMUUsWUFDb0IsSUFBUyxFQUM1QixZQUFtQyxFQUNuQyxVQUE4QixFQUNoQixXQUF5QixFQUNsQixrQkFBdUMsRUFDM0MsY0FBK0IsRUFDckIsd0JBQW1ELEVBQzlDLDZCQUE2RCxFQUM3RCw2QkFBNkQsRUFDMUUsZ0JBQW1DLEVBQzdCLFVBQW1DLEVBQ3JDLG9CQUEyQyxFQUM3QyxrQkFBdUM7WUFFNUQsS0FBSyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSw2QkFBNkIsRUFBRSw2QkFBNkIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQWQ5TixTQUFJLEdBQUosSUFBSSxDQUFLO1lBZTVCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFUyxLQUFLLENBQUMsbUJBQW1CO1lBQ2xDLElBQUksQ0FBQztnQkFDSixPQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25ELENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7UUFDRixDQUFDO1FBRVMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLFVBQWtCLEVBQUUsVUFBK0IsRUFBRSxLQUFjO1lBQ3pHLElBQUksQ0FBQztnQkFDSixJQUFJLFVBQVUsRUFBRSxDQUFDO29CQUNoQixzQkFBc0I7b0JBQ3RCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzlHLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxzQkFBc0I7b0JBQ3RCLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxpQkFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRyxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1osSUFBSSxDQUFDLENBQUMsWUFBWSwwQkFBa0IsSUFBSSxDQUFDLENBQUMsbUJBQW1CLCtDQUF1QyxDQUFDO29CQUNwRyxDQUFDLENBQUMsWUFBWSwwQkFBa0IsSUFBSSxDQUFDLENBQUMsbUJBQW1CLG9EQUE0QyxDQUFDLEVBQUUsQ0FBQztvQkFDekcsTUFBTSxJQUFJLGdDQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLGdGQUFnRCxDQUFDO2dCQUN2RixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsTUFBTSxDQUFDLENBQUM7Z0JBQ1QsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRVMsS0FBSyxDQUFDLGVBQWU7WUFDOUIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZDLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSwwQkFBa0IsSUFBSSxDQUFDLENBQUMsbUJBQW1CLCtDQUF1QyxDQUFDLEVBQUUsQ0FBQztvQkFDeEcsTUFBTSxDQUFDLENBQUM7Z0JBQ1QsQ0FBQztZQUNGLENBQUM7UUFDRixDQUFDO1FBRU8sYUFBYSxDQUFDLENBQW1CO1lBQ3hDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUM1QixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQzNCLENBQUM7S0FFRCxDQUFBO0lBbEVxQiw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQU0zQyxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEseUJBQWUsQ0FBQTtRQUNmLFdBQUEsd0NBQXlCLENBQUE7UUFDekIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLDZDQUE4QixDQUFBO1FBQzlCLFdBQUEsNkJBQWlCLENBQUE7UUFDakIsWUFBQSxzQ0FBdUIsQ0FBQTtRQUN2QixZQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFlBQUEsaUNBQW1CLENBQUE7T0FmQSx3QkFBd0IsQ0FrRTdDO0lBRU0sSUFBZSw0QkFBNEIsR0FBM0MsTUFBZSw0QkFBNkIsU0FBUSx3QkFBd0I7UUFFbEYsWUFDQyxJQUFTLEVBQ1QsWUFBbUMsRUFDbkMsVUFBOEIsRUFDaEIsV0FBeUIsRUFDbEIsa0JBQXVDLEVBQzNDLGNBQStCLEVBQ3JCLHdCQUFtRCxFQUM5Qyw2QkFBNkQsRUFDN0QsNkJBQTZELEVBQzFFLGdCQUFtQyxFQUM3QixVQUFtQyxFQUNsQyx1QkFBb0UsRUFDdkUsb0JBQTJDLEVBQzdDLGtCQUF1QztZQUU1RCxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSw2QkFBNkIsRUFBRSw2QkFBNkIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUoxTSw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBYXZGLHVCQUFrQixHQUEyQyxTQUFTLENBQUM7UUFSL0UsQ0FBQztRQUVTLFNBQVMsQ0FBQyxPQUFlLEVBQUUsT0FBZ0I7WUFDcEQsTUFBTSxXQUFXLEdBQWlCLEVBQUUsQ0FBQztZQUNyQyxNQUFNLE1BQU0sR0FBRyxJQUFBLFlBQUssRUFBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbEcsT0FBTyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBQSxtQkFBVyxFQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sS0FBSyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQUdTLG9CQUFvQjtZQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNoQyxDQUFDO0tBRUQsQ0FBQTtJQW5DcUIsb0VBQTRCOzJDQUE1Qiw0QkFBNEI7UUFNL0MsV0FBQSxvQkFBWSxDQUFBO1FBQ1osV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLHdDQUF5QixDQUFBO1FBQ3pCLFdBQUEsNkNBQThCLENBQUE7UUFDOUIsV0FBQSw2Q0FBOEIsQ0FBQTtRQUM5QixXQUFBLDZCQUFpQixDQUFBO1FBQ2pCLFlBQUEsc0NBQXVCLENBQUE7UUFDdkIsWUFBQSx1Q0FBd0IsQ0FBQTtRQUN4QixZQUFBLHFDQUFxQixDQUFBO1FBQ3JCLFlBQUEsaUNBQW1CLENBQUE7T0FoQkEsNEJBQTRCLENBbUNqRDtJQUVNLElBQWUsbUJBQW1CLEdBQWxDLE1BQWUsbUJBQW1CO1FBS3hDLFlBQ1UsUUFBc0IsRUFDYyx1QkFBaUQsRUFDdEQsa0JBQXVDLEVBQy9DLFVBQXVCLEVBQ3RCLFdBQXlCLEVBQ3RCLGNBQStCLEVBQzlDLGtCQUF1QztZQU5uRCxhQUFRLEdBQVIsUUFBUSxDQUFjO1lBQ2MsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN0RCx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQy9DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdEIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFDdEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBR25FLElBQUksQ0FBQyxNQUFNLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFBLHFDQUFzQixFQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRyxDQUFDO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQWE7WUFDM0MsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNkLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEUsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzdDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksQ0FBQztnQkFDSixNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztRQUNGLENBQUM7UUFFTyxhQUFhLENBQUMsT0FBZTtZQUNwQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxRQUFRLEdBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxRQUFRLENBQUM7Z0JBQ2pCLENBQUM7WUFDRixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLDBFQUEwRSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNoSCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRVMsS0FBSyxDQUFDLHNCQUFzQixDQUFDLHNCQUF1QyxFQUFFLGtCQUEwQyxFQUFFO1lBQzNILElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUMxRCxNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7WUFDOUQsQ0FBQztZQUVELE1BQU0scUJBQXFCLEdBQTJCO2dCQUNyRCxHQUFHLEVBQUUsc0JBQXNCLENBQUMsR0FBRztnQkFDL0IsT0FBTyxFQUFFLFNBQVM7Z0JBQ2xCLEdBQUcsZUFBZTthQUNsQixDQUFDO1lBRUYsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLG1FQUFrRCxDQUFDO1lBQ3ZKLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGlCQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEgsQ0FBQztLQUlELENBQUE7SUFsRXFCLGtEQUFtQjtrQ0FBbkIsbUJBQW1CO1FBT3RDLFdBQUEsMENBQXdCLENBQUE7UUFDeEIsV0FBQSxpQ0FBbUIsQ0FBQTtRQUNuQixXQUFBLGlCQUFXLENBQUE7UUFDWCxXQUFBLG9CQUFZLENBQUE7UUFDWixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLGlDQUFtQixDQUFBO09BWkEsbUJBQW1CLENBa0V4QyJ9