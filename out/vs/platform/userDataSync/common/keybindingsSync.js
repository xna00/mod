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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/json", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/keybindingsMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, arrays_1, buffer_1, event_1, json_1, platform_1, types_1, nls_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, userDataProfile_1, abstractSynchronizer_1, keybindingsMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsInitializer = exports.KeybindingsSynchroniser = void 0;
    exports.getKeybindingsContentFromSyncContent = getKeybindingsContentFromSyncContent;
    function getKeybindingsContentFromSyncContent(syncContent, platformSpecific, logService) {
        try {
            const parsed = JSON.parse(syncContent);
            if (!platformSpecific) {
                return (0, types_1.isUndefined)(parsed.all) ? null : parsed.all;
            }
            switch (platform_1.OS) {
                case 2 /* OperatingSystem.Macintosh */:
                    return (0, types_1.isUndefined)(parsed.mac) ? null : parsed.mac;
                case 3 /* OperatingSystem.Linux */:
                    return (0, types_1.isUndefined)(parsed.linux) ? null : parsed.linux;
                case 1 /* OperatingSystem.Windows */:
                    return (0, types_1.isUndefined)(parsed.windows) ? null : parsed.windows;
            }
        }
        catch (e) {
            logService.error(e);
            return null;
        }
    }
    let KeybindingsSynchroniser = class KeybindingsSynchroniser extends abstractSynchronizer_1.AbstractJsonFileSynchroniser {
        constructor(profile, collection, userDataSyncStoreService, userDataSyncLocalStoreService, logService, configurationService, userDataSyncEnablementService, fileService, environmentService, storageService, userDataSyncUtilService, telemetryService, uriIdentityService) {
            super(profile.keybindingsResource, { syncResource: "keybindings" /* SyncResource.Keybindings */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService, uriIdentityService);
            /* Version 2: Change settings from `sync.${setting}` to `settingsSync.{setting}` */
            this.version = 2;
            this.previewResource = this.extUri.joinPath(this.syncPreviewFolder, 'keybindings.json');
            this.baseResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' });
            this.localResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' });
            this.remoteResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' });
            this.acceptedResource = this.previewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' });
            this._register(event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('settingsSync.keybindingsPerPlatform'))(() => this.triggerLocalChange()));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine, userDataSyncConfiguration) {
            const remoteContent = remoteUserData.syncData ? getKeybindingsContentFromSyncContent(remoteUserData.syncData.content, userDataSyncConfiguration.keybindingsPerPlatform ?? this.syncKeybindingsPerPlatform(), this.logService) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncContent = lastSyncUserData ? this.getKeybindingsContentFromLastSyncUserData(lastSyncUserData) : null;
            // Get file content last to get the latest
            const fileContent = await this.getLocalFileContent();
            const formattingOptions = await this.getFormattingOptions();
            let mergedContent = null;
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            if (remoteContent) {
                let localContent = fileContent ? fileContent.value.toString() : '[]';
                localContent = localContent || '[]';
                if (this.hasErrors(localContent, true)) {
                    throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('errorInvalidSettings', "Unable to sync keybindings because the content in the file is not valid. Please open the file and correct it."), "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */, this.resource);
                }
                if (!lastSyncContent // First time sync
                    || lastSyncContent !== localContent // Local has forwarded
                    || lastSyncContent !== remoteContent // Remote has forwarded
                ) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote keybindings with local keybindings...`);
                    const result = await (0, keybindingsMerge_1.merge)(localContent, remoteContent, lastSyncContent, formattingOptions, this.userDataSyncUtilService);
                    // Sync only if there are changes
                    if (result.hasChanges) {
                        mergedContent = result.mergeContent;
                        hasConflicts = result.hasConflicts;
                        hasLocalChanged = hasConflicts || result.mergeContent !== localContent;
                        hasRemoteChanged = hasConflicts || result.mergeContent !== remoteContent;
                    }
                }
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote keybindings does not exist. Synchronizing keybindings for the first time.`);
                mergedContent = fileContent.value.toString();
                hasRemoteChanged = true;
            }
            const previewResult = {
                content: hasConflicts ? lastSyncContent : mergedContent,
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
            const lastSyncContent = this.getKeybindingsContentFromLastSyncUserData(lastSyncUserData);
            if (lastSyncContent === null) {
                return true;
            }
            const fileContent = await this.getLocalFileContent();
            const localContent = fileContent ? fileContent.value.toString() : '';
            const formattingOptions = await this.getFormattingOptions();
            const result = await (0, keybindingsMerge_1.merge)(localContent || '[]', lastSyncContent, lastSyncContent, formattingOptions, this.userDataSyncUtilService);
            return result.hasConflicts || result.mergeContent !== lastSyncContent;
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
            let { content, localChange, remoteChange } = resourcePreviews[0][1];
            if (localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing keybindings.`);
            }
            if (content !== null) {
                content = content.trim();
                content = content || '[]';
                if (this.hasErrors(content, true)) {
                    throw new userDataSync_1.UserDataSyncError((0, nls_1.localize)('errorInvalidSettings', "Unable to sync keybindings because the content in the file is not valid. Please open the file and correct it."), "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */, this.resource);
                }
            }
            if (localChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating local keybindings...`);
                if (fileContent) {
                    await this.backupLocal(this.toSyncContent(fileContent.value.toString()));
                }
                await this.updateLocalFileContent(content || '[]', fileContent, force);
                this.logService.info(`${this.syncResourceLogLabel}: Updated local keybindings`);
            }
            if (remoteChange !== 0 /* Change.None */) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote keybindings...`);
                const remoteContents = this.toSyncContent(content || '[]', remoteUserData.syncData?.content);
                remoteUserData = await this.updateRemoteUserData(remoteContents, force ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote keybindings`);
            }
            // Delete the preview
            try {
                await this.fileService.del(this.previewResource);
            }
            catch (e) { /* ignore */ }
            if (lastSyncUserData?.ref !== remoteUserData.ref) {
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized keybindings...`);
                await this.updateLastSyncUserData(remoteUserData, { platformSpecific: this.syncKeybindingsPerPlatform() });
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized keybindings`);
            }
        }
        async hasLocalData() {
            try {
                const localFileContent = await this.getLocalFileContent();
                if (localFileContent) {
                    const keybindings = (0, json_1.parse)(localFileContent.value.toString());
                    if ((0, arrays_1.isNonEmptyArray)(keybindings)) {
                        return true;
                    }
                }
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return true;
                }
            }
            return false;
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
        getKeybindingsContentFromLastSyncUserData(lastSyncUserData) {
            if (!lastSyncUserData.syncData) {
                return null;
            }
            // Return null if there is a change in platform specific property from last time sync.
            if (lastSyncUserData.platformSpecific !== undefined && lastSyncUserData.platformSpecific !== this.syncKeybindingsPerPlatform()) {
                return null;
            }
            return getKeybindingsContentFromSyncContent(lastSyncUserData.syncData.content, this.syncKeybindingsPerPlatform(), this.logService);
        }
        toSyncContent(keybindingsContent, syncContent) {
            let parsed = {};
            try {
                parsed = JSON.parse(syncContent || '{}');
            }
            catch (e) {
                this.logService.error(e);
            }
            if (this.syncKeybindingsPerPlatform()) {
                delete parsed.all;
            }
            else {
                parsed.all = keybindingsContent;
            }
            switch (platform_1.OS) {
                case 2 /* OperatingSystem.Macintosh */:
                    parsed.mac = keybindingsContent;
                    break;
                case 3 /* OperatingSystem.Linux */:
                    parsed.linux = keybindingsContent;
                    break;
                case 1 /* OperatingSystem.Windows */:
                    parsed.windows = keybindingsContent;
                    break;
            }
            return JSON.stringify(parsed);
        }
        syncKeybindingsPerPlatform() {
            return !!this.configurationService.getValue(userDataSync_1.CONFIG_SYNC_KEYBINDINGS_PER_PLATFORM);
        }
    };
    exports.KeybindingsSynchroniser = KeybindingsSynchroniser;
    exports.KeybindingsSynchroniser = KeybindingsSynchroniser = __decorate([
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, userDataSync_1.IUserDataSyncEnablementService),
        __param(7, files_1.IFileService),
        __param(8, environment_1.IEnvironmentService),
        __param(9, storage_1.IStorageService),
        __param(10, userDataSync_1.IUserDataSyncUtilService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, uriIdentity_1.IUriIdentityService)
    ], KeybindingsSynchroniser);
    let KeybindingsInitializer = class KeybindingsInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService) {
            super("keybindings" /* SyncResource.Keybindings */, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService);
        }
        async doInitialize(remoteUserData) {
            const keybindingsContent = remoteUserData.syncData ? this.getKeybindingsContentFromSyncContent(remoteUserData.syncData.content) : null;
            if (!keybindingsContent) {
                this.logService.info('Skipping initializing keybindings because remote keybindings does not exist.');
                return;
            }
            const isEmpty = await this.isEmpty();
            if (!isEmpty) {
                this.logService.info('Skipping initializing keybindings because local keybindings exist.');
                return;
            }
            await this.fileService.writeFile(this.userDataProfilesService.defaultProfile.keybindingsResource, buffer_1.VSBuffer.fromString(keybindingsContent));
            await this.updateLastSyncUserData(remoteUserData);
        }
        async isEmpty() {
            try {
                const fileContent = await this.fileService.readFile(this.userDataProfilesService.defaultProfile.settingsResource);
                const keybindings = (0, json_1.parse)(fileContent.value.toString());
                return !(0, arrays_1.isNonEmptyArray)(keybindings);
            }
            catch (error) {
                return error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */;
            }
        }
        getKeybindingsContentFromSyncContent(syncContent) {
            try {
                return getKeybindingsContentFromSyncContent(syncContent, true, this.logService);
            }
            catch (e) {
                this.logService.error(e);
                return null;
            }
        }
    };
    exports.KeybindingsInitializer = KeybindingsInitializer;
    exports.KeybindingsInitializer = KeybindingsInitializer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, storage_1.IStorageService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], KeybindingsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3NTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL2tleWJpbmRpbmdzU3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFzQ2hHLG9GQWtCQztJQWxCRCxTQUFnQixvQ0FBb0MsQ0FBQyxXQUFtQixFQUFFLGdCQUF5QixFQUFFLFVBQXVCO1FBQzNILElBQUksQ0FBQztZQUNKLE1BQU0sTUFBTSxHQUFpQixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3JELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN2QixPQUFPLElBQUEsbUJBQVcsRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztZQUNwRCxDQUFDO1lBQ0QsUUFBUSxhQUFFLEVBQUUsQ0FBQztnQkFDWjtvQkFDQyxPQUFPLElBQUEsbUJBQVcsRUFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztnQkFDcEQ7b0JBQ0MsT0FBTyxJQUFBLG1CQUFXLEVBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ3hEO29CQUNDLE9BQU8sSUFBQSxtQkFBVyxFQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQzdELENBQUM7UUFDRixDQUFDO1FBQUMsT0FBTyxDQUFD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