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
define(["require", "exports", "vs/base/common/buffer", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, userDataProfile_1, abstractSynchronizer_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TasksInitializer = exports.TasksSynchroniser = void 0;
    exports.getTasksContentFromSyncContent = getTasksContentFromSyncContent;
    function getTasksContentFromSyncContent(syncContent, logService) {
        try {
            const parsed = JSON.parse(syncContent);
            return parsed.tasks ?? null;
        }
        catch (e) {
            logService.error(e);
            return null;
        }
    }
    let TasksSynchroniser = class TasksSynchroniser extends abstractSynchronizer_1.AbstractFileSynchroniser {
        constructor(profile, collection, userDataSyncStoreService, userDataSyncLocalStoreService, logService, configurationService, userDataSyncEnablementService, fileService, environmentService, storageService, telemetryService, uriIdentityService) {
            super(profile.tasksResource, { syncResource: "tasks" /* SyncResource.Tasks */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.version = 1;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'tasks.json');
            this.baseResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' });
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration) {
            const remoteContent = remoteUserData.syncData ? getTasksContentFromSyncContent(remoteUserData.syncData.content, this.logService) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncContent = lastSyncUserData?.syncData ? getTasksContentFromSyncContent(lastSyncUserData.syncData.content, this.logService) : null;
            // Get file content last to get the latest
            const fileContent = await this.getLocalFileContent();
            let content = null;
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            if (remoteUserData.syncData) {
                const localContent = fileContent ? fileContent.value.toString() : null;
                if (!lastSyncContent // First time sync
                    || lastSyncContent !== localContent // Local has forwarded
                    || lastSyncContent !== remoteContent // Remote has forwarded
                ) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote tasks with local tasks...`);
                    const result = merge(localContent, remoteContent, lastSyncContent);
                    content = result.content;
                    hasConflicts = result.hasConflicts;
                    hasLocalChanged = result.hasLocalChanged;
                    hasRemoteChanged = result.hasRemoteChanged;
                }
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote tasks does not exist. Synchronizing tasks for the first time.`);
                content = fileContent.value.toString();
                hasRemoteChanged = true;
            }
            const previewResult = {
                content: hasConflicts ? lastSyncContent : content,
                localChange: hasLocalChanged ? fileContent ? 2 /* Change.Modified */ : 1 /* Change.Added */ : 0 /* Change.None */,
                remoteChange: hasRemoteChanged ? 2 /* Change.Modified */ : 0 /* Change.None */,
                hasConflicts
            };
            const localContent = fileContent ? fileContent.value.toString() : null;
            return [{
                    fileContent,
                    baseResource: this.baseResource,
                    baseContent: lastSyncContent,
                    localResource: this.localResource,
                    localContent,
                    localChange: previewResult.localChange,
                    remoteResource: this.remoteResource,
                    remoteContent,
                    remoteChange: previewResult.remoteChange,
                    previewResource: this.previewResource,
                    previewResult,
                    acceptedResource: this.acceptedResource,
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncContent = lastSyncUserData?.syncData ? getTasksContentFromSyncContent(lastSyncUserData.syncData.content, this.logService) : null;
            if (lastSyncContent === null) {
                return true;
            }
            const fileContent = await this.getLocalFileContent();
            const localContent = fileContent ? fileContent.value.toString() : null;
            const result = merge(localContent, lastSyncContent, lastSyncContent);
            return result.hasLocalChanged || result.hasRemoteChanged;
        }
        async getMergeResult(resourcePreview, token) {
            return resourcePreview.previewResult;
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqual(resource, this.localResource)) {
                return {
                    content: resourcePreview.fileContent ? resourcePreview.fileContent.value.toString() : null,
                    localChange: 0 /* Change.None */,
                    remoteChange: 2 /* Change.Modified */,
                };
            }
            /* Accept remote resource */
            if (this.extUri.isEqual(resource, this.remoteResource)) {
                return {
                    content: resourcePreview.remoteContent,
                    localChange: 2 /* Change.Modified */,
                    remoteChange: 0 /* Change.None */,
                };
            }
            /* Accept preview resource */
            if (this.extUri.isEqual(resource, this.previewResource)) {
                if (content === undefined) {
                    return {
                        content: resourcePreview.previewResult.content,
                        localChange: resourcePreview.previewResult.localChange,
                        remoteChange: resourcePreview.previewResult.remoteChange,
                    };
                }
                else {
                    return {
                        content,
                        localChange: 2 /* Change.Modified */,
                        remoteChange: 2 /* Change.Modified */,
                    };
                }
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            const { fileContent } = resourcePreviews[0][0];
            const { content, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing tasks.`);
            }
            if (localChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating local tasks...`);
                if (fileContent) {
                    await this.backupLocal(JSON.stringify(this.toTasksSyncContent(fileContent.value.toString())));
                }
                if (content) {
                    await this.updateLocalFileContent(content, fileContent, force);
                }
                else {
                    await this.deleteLocalFile();
                }
                this.logService.info(`${this.syncResourceLogLabel}: Updated local tasks`);
            }
            if (remoteChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote tasks...`);
                const remoteContents = JSON.stringify(this.toTasksSyncContent(content));
                remoteUserData = await this.updateRemoteUserData(remoteContents, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote tasks`);
            }
            // Delete the preview
            try {
                await this.fileService.del(this.previewResource);
            }
            catch (e) { /* ignore */ }
            if (lastSyncUserData?.ref !== remoteUserData.ref) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized tasks...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized tasks`);
            }
        }
        async hasLocalData() {
            return this.fileService.exists(this.file);
        }
        async resolveContent(uri) {
            if (this.extUri.isEqual(this.remoteResource, uri)
                || this.extUri.isEqual(this.baseResource, uri)
                || this.extUri.isEqual(this.localResource, uri)
                || this.extUri.isEqual(this.acceptedResource, uri)) {
                return this.resolvePreviewContent(uri);
            }
            return null;
        }
        toTasksSyncContent(tasks) {
            return tasks ? { tasks } : {};
        }
    };
    exports.TasksSynchroniser = TasksSynchroniser;
    exports.TasksSynchroniser = TasksSynchroniser = __decorate([
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, files_1.IFileService),
        __param(8, environment_1.IEnvironmentService),
        __param(9, storage_1.IStorageService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], TasksSynchroniser);
    let TasksInitializer = class TasksInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService) {
            super("tasks" /* SyncResource.Tasks */, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService);
            this.tasksResource = this.userDataProfilesService.defaultProfile.tasksResource;
        }
        async doInitialize(remoteUserData) {
            const tasksContent = remoteUserData.syncData ? getTasksContentFromSyncContent(remoteUserData.syncData.content, this.logService) : null;
            if (!tasksContent) {
                this.logService.info('Skipping initializing tasks because remote tasks does not exist.');
                return;
            }
            const isEmpty = await this.isEmpty();
            if (!isEmpty) {
                this.logService.info('Skipping initializing tasks because local tasks exist.');
                return;
            }
            await this.fileService.writeFile(this.tasksResource, buffer_1.VSBuffer.fromString(tasksContent));
            await this.updateLastSyncUserData(remoteUserData);
        }
        async isEmpty() {
            return this.fileService.exists(this.tasksResource);
        }
    };
    exports.TasksInitializer = TasksInitializer;
    exports.TasksInitializer = TasksInitializer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, storage_1.IStorageService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], TasksInitializer);
    function merge(originalLocalContent, originalRemoteContent, baseContent) {
        /* no changes */
        if (originalLocalContent === null && originalRemoteContent === null && baseContent === null) {
            return { content: null, hasLocalChanged: false, hasRemoteChanged: false, hasConflicts: false };
        }
        /* no changes */
        if (originalLocalContent === originalRemoteContent) {
            return { content: null, hasLocalChanged: false, hasRemoteChanged: false, hasConflicts: false };
        }
        const localForwarded = baseContent !== originalLocalContent;
        const remoteForwarded = baseContent !== originalRemoteContent;
        /* no changes */
        if (!localForwarded && !remoteForwarded) {
            return { content: null, hasLocalChanged: false, hasRemoteChanged: false, hasConflicts: false };
        }
        /* local has changed and remote has not */
        if (localForwarded && !remoteForwarded) {
            return { content: originalLocalContent, hasRemoteChanged: true, hasLocalChanged: false, hasConflicts: false };
        }
        /* remote has changed and local has not */
        if (remoteForwarded && !localForwarded) {
            return { content: originalRemoteContent, hasLocalChanged: true, hasRemoteChanged: false, hasConflicts: false };
        }
        return { content: originalLocalContent, hasLocalChanged: true, hasRemoteChanged: true, hasConflicts: true };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFza3NTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL3Rhc2tzU3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLHdFQVFDO0lBUkQsU0FBZ0IsOEJBQThCLENBQUMsV0FBbUIsRUFBRSxVQUF1QjtRQUMxRixJQUFJLENBQUM7WUFDSixNQUFNLE1BQU0sR0FBc0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxRCxPQUFPLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO1FBQzdCLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7SUFDRixDQUFDO0lBRU0sSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBa0IsU0FBUSwrQ0FBd0I7UUFTOUQsWUFDQyxPQUF5QixFQUN6QixVQUE4QixFQUNILHdCQUFtRCxFQUM5Qyw2QkFBNkQsRUFDcEUsVUFBbUMsRUFDckMsb0JBQTJDLEVBQ2xDLDZCQUE2RCxFQUMvRSxXQUF5QixFQUNsQixrQkFBdUMsRUFDM0MsY0FBK0IsRUFDN0IsZ0JBQW1DLEVBQ2pDLGtCQUF1QztZQUU1RCxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLFlBQVksa0NBQW9CLEVBQUUsT0FBTyxFQUFFLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsd0JBQXdCLEVBQUUsNkJBQTZCLEVBQUUsNkJBQTZCLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLG9CQUFvQixFQUFFLGtCQUFrQixDQUFDLENB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