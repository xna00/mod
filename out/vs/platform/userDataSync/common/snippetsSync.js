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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/objects", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataProfile/common/userDataProfile", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/snippetsMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, event_1, objects_1, configuration_1, environment_1, files_1, storage_1, telemetry_1, uriIdentity_1, userDataProfile_1, abstractSynchronizer_1, snippetsMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetsInitializer = exports.SnippetsSynchroniser = void 0;
    exports.parseSnippets = parseSnippets;
    function parseSnippets(syncData) {
        return JSON.parse(syncData.content);
    }
    let SnippetsSynchroniser = class SnippetsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(profile, collection, environmentService, fileService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, logService, configurationService, userDataSyncEnablementService, telemetryService, uriIdentityService) {
            super({ syncResource: "snippets" /* SyncResource.Snippets */, profile }, collection, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncLocalStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService, uriIdentityService);
            this.version = 1;
            this.snippetsFolder = profile.snippetsHome;
            this._register(this.fileService.watch(environmentService.userRoamingDataHome));
            this._register(this.fileService.watch(this.snippetsFolder));
            this._register(event_1.Event.filter(this.fileService.onDidFilesChange, e => e.affects(this.snippetsFolder))(() => this.triggerLocalChange()));
        }
        async generateSyncPreview(remoteUserData, lastSyncUserData, isRemoteDataFromCurrentMachine) {
            const local = await this.getSnippetsFileContents();
            const localSnippets = this.toSnippetsContents(local);
            const remoteSnippets = remoteUserData.syncData ? this.parseSnippets(remoteUserData.syncData) : null;
            // Use remote data as last sync data if last sync data does not exist and remote data is from same machine
            lastSyncUserData = lastSyncUserData === null && isRemoteDataFromCurrentMachine ? remoteUserData : lastSyncUserData;
            const lastSyncSnippets = lastSyncUserData && lastSyncUserData.syncData ? this.parseSnippets(lastSyncUserData.syncData) : null;
            if (remoteSnippets) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote snippets with local snippets...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote snippets does not exist. Synchronizing snippets for the first time.`);
            }
            const mergeResult = (0, snippetsMerge_1.merge)(localSnippets, remoteSnippets, lastSyncSnippets);
            return this.getResourcePreviews(mergeResult, local, remoteSnippets || {}, lastSyncSnippets || {});
        }
        async hasRemoteChanged(lastSyncUserData) {
            const lastSyncSnippets = lastSyncUserData.syncData ? this.parseSnippets(lastSyncUserData.syncData) : null;
            if (lastSyncSnippets === null) {
                return true;
            }
            const local = await this.getSnippetsFileContents();
            const localSnippets = this.toSnippetsContents(local);
            const mergeResult = (0, snippetsMerge_1.merge)(localSnippets, lastSyncSnippets, lastSyncSnippets);
            return Object.keys(mergeResult.remote.added).length > 0 || Object.keys(mergeResult.remote.updated).length > 0 || mergeResult.remote.removed.length > 0 || mergeResult.conflicts.length > 0;
        }
        async getMergeResult(resourcePreview, token) {
            return resourcePreview.previewResult;
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            /* Accept local resource */
            if (this.extUri.isEqualOrParent(resource, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }))) {
                return {
                    content: resourcePreview.fileContent ? resourcePreview.fileContent.value.toString() : null,
                    localChange: 0 /* Change.None */,
                    remoteChange: resourcePreview.fileContent
                        ? resourcePreview.remoteContent !== null ? 2 /* Change.Modified */ : 1 /* Change.Added */
                        : 3 /* Change.Deleted */
                };
            }
            /* Accept remote resource */
            if (this.extUri.isEqualOrParent(resource, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }))) {
                return {
                    content: resourcePreview.remoteContent,
                    localChange: resourcePreview.remoteContent !== null
                        ? resourcePreview.fileContent ? 2 /* Change.Modified */ : 1 /* Change.Added */
                        : 3 /* Change.Deleted */,
                    remoteChange: 0 /* Change.None */,
                };
            }
            /* Accept preview resource */
            if (this.extUri.isEqualOrParent(resource, this.syncPreviewFolder)) {
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
                        localChange: content === null
                            ? resourcePreview.fileContent !== null ? 3 /* Change.Deleted */ : 0 /* Change.None */
                            : 2 /* Change.Modified */,
                        remoteChange: content === null
                            ? resourcePreview.remoteContent !== null ? 3 /* Change.Deleted */ : 0 /* Change.None */
                            : 2 /* Change.Modified */
                    };
                }
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            const accptedResourcePreviews = resourcePreviews.map(([resourcePreview, acceptResult]) => ({ ...resourcePreview, acceptResult }));
            if (accptedResourcePreviews.every(({ localChange, remoteChange }) => localChange === 0 /* Change.None */ && remoteChange === 0 /* Change.None */)) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing snippets.`);
            }
            if (accptedResourcePreviews.some(({ localChange }) => localChange !== 0 /* Change.None */)) {
                // back up all snippets
                await this.updateLocalBackup(accptedResourcePreviews);
                await this.updateLocalSnippets(accptedResourcePreviews, force);
            }
            if (accptedResourcePreviews.some(({ remoteChange }) => remoteChange !== 0 /* Change.None */)) {
                remoteUserData = await this.updateRemoteSnippets(accptedResourcePreviews, remoteUserData, force);
            }
            if (lastSyncUserData?.ref !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized snippets...`);
                await this.updateLastSyncUserData(remoteUserData);
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized snippets`);
            }
            for (const { previewResource } of accptedResourcePreviews) {
                // Delete the preview
                try {
                    await this.fileService.del(previewResource);
                }
                catch (e) { /* ignore */ }
            }
        }
        getResourcePreviews(snippetsMergeResult, localFileContent, remoteSnippets, baseSnippets) {
            const resourcePreviews = new Map();
            /* Snippets added remotely -> add locally */
            for (const key of Object.keys(snippetsMergeResult.local.added)) {
                const previewResult = {
                    content: snippetsMergeResult.local.added[key],
                    hasConflicts: false,
                    localChange: 1 /* Change.Added */,
                    remoteChange: 0 /* Change.None */,
                };
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: null,
                    fileContent: null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    localContent: null,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets updated remotely -> update locally */
            for (const key of Object.keys(snippetsMergeResult.local.updated)) {
                const previewResult = {
                    content: snippetsMergeResult.local.updated[key],
                    hasConflicts: false,
                    localChange: 2 /* Change.Modified */,
                    remoteChange: 0 /* Change.None */,
                };
                const localContent = localFileContent[key] ? localFileContent[key].value.toString() : null;
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: baseSnippets[key] ?? null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets removed remotely -> remove locally */
            for (const key of snippetsMergeResult.local.removed) {
                const previewResult = {
                    content: null,
                    hasConflicts: false,
                    localChange: 3 /* Change.Deleted */,
                    remoteChange: 0 /* Change.None */,
                };
                const localContent = localFileContent[key] ? localFileContent[key].value.toString() : null;
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: baseSnippets[key] ?? null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: null,
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets added locally -> add remotely */
            for (const key of Object.keys(snippetsMergeResult.remote.added)) {
                const previewResult = {
                    content: snippetsMergeResult.remote.added[key],
                    hasConflicts: false,
                    localChange: 0 /* Change.None */,
                    remoteChange: 1 /* Change.Added */,
                };
                const localContent = localFileContent[key] ? localFileContent[key].value.toString() : null;
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: baseSnippets[key] ?? null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: null,
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets updated locally -> update remotely */
            for (const key of Object.keys(snippetsMergeResult.remote.updated)) {
                const previewResult = {
                    content: snippetsMergeResult.remote.updated[key],
                    hasConflicts: false,
                    localChange: 0 /* Change.None */,
                    remoteChange: 2 /* Change.Modified */,
                };
                const localContent = localFileContent[key] ? localFileContent[key].value.toString() : null;
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: baseSnippets[key] ?? null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key],
                    localContent,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets removed locally -> remove remotely */
            for (const key of snippetsMergeResult.remote.removed) {
                const previewResult = {
                    content: null,
                    hasConflicts: false,
                    localChange: 0 /* Change.None */,
                    remoteChange: 3 /* Change.Deleted */,
                };
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: baseSnippets[key] ?? null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: null,
                    localContent: null,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key],
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Snippets with conflicts */
            for (const key of snippetsMergeResult.conflicts) {
                const previewResult = {
                    content: baseSnippets[key] ?? null,
                    hasConflicts: true,
                    localChange: localFileContent[key] ? 2 /* Change.Modified */ : 1 /* Change.Added */,
                    remoteChange: remoteSnippets[key] ? 2 /* Change.Modified */ : 1 /* Change.Added */
                };
                const localContent = localFileContent[key] ? localFileContent[key].value.toString() : null;
                resourcePreviews.set(key, {
                    baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                    baseContent: baseSnippets[key] ?? null,
                    localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                    fileContent: localFileContent[key] || null,
                    localContent,
                    remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                    remoteContent: remoteSnippets[key] || null,
                    previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                    previewResult,
                    localChange: previewResult.localChange,
                    remoteChange: previewResult.remoteChange,
                    acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                });
            }
            /* Unmodified Snippets */
            for (const key of Object.keys(localFileContent)) {
                if (!resourcePreviews.has(key)) {
                    const previewResult = {
                        content: localFileContent[key] ? localFileContent[key].value.toString() : null,
                        hasConflicts: false,
                        localChange: 0 /* Change.None */,
                        remoteChange: 0 /* Change.None */
                    };
                    const localContent = localFileContent[key] ? localFileContent[key].value.toString() : null;
                    resourcePreviews.set(key, {
                        baseResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }),
                        baseContent: baseSnippets[key] ?? null,
                        localResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }),
                        fileContent: localFileContent[key] || null,
                        localContent,
                        remoteResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }),
                        remoteContent: remoteSnippets[key] || null,
                        previewResource: this.extUri.joinPath(this.syncPreviewFolder, key),
                        previewResult,
                        localChange: previewResult.localChange,
                        remoteChange: previewResult.remoteChange,
                        acceptedResource: this.extUri.joinPath(this.syncPreviewFolder, key).with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })
                    });
                }
            }
            return [...resourcePreviews.values()];
        }
        async resolveContent(uri) {
            if (this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' }))
                || this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local' }))
                || this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'base' }))
                || this.extUri.isEqualOrParent(uri, this.syncPreviewFolder.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' }))) {
                return this.resolvePreviewContent(uri);
            }
            return null;
        }
        async hasLocalData() {
            try {
                const localSnippets = await this.getSnippetsFileContents();
                if (Object.keys(localSnippets).length) {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async updateLocalBackup(resourcePreviews) {
            const local = {};
            for (const resourcePreview of resourcePreviews) {
                if (resourcePreview.fileContent) {
                    local[this.extUri.basename(resourcePreview.localResource)] = resourcePreview.fileContent;
                }
            }
            await this.backupLocal(JSON.stringify(this.toSnippetsContents(local)));
        }
        async updateLocalSnippets(resourcePreviews, force) {
            for (const { fileContent, acceptResult, localResource, remoteResource, localChange } of resourcePreviews) {
                if (localChange !== 0 /* Change.None */) {
                    const key = remoteResource ? this.extUri.basename(remoteResource) : this.extUri.basename(localResource);
                    const resource = this.extUri.joinPath(this.snippetsFolder, key);
                    // Removed
                    if (localChange === 3 /* Change.Deleted */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Deleting snippet...`, this.extUri.basename(resource));
                        await this.fileService.del(resource);
                        this.logService.info(`${this.syncResourceLogLabel}: Deleted snippet`, this.extUri.basename(resource));
                    }
                    // Added
                    else if (localChange === 1 /* Change.Added */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Creating snippet...`, this.extUri.basename(resource));
                        await this.fileService.createFile(resource, buffer_1.VSBuffer.fromString(acceptResult.content), { overwrite: force });
                        this.logService.info(`${this.syncResourceLogLabel}: Created snippet`, this.extUri.basename(resource));
                    }
                    // Updated
                    else {
                        this.logService.trace(`${this.syncResourceLogLabel}: Updating snippet...`, this.extUri.basename(resource));
                        await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(acceptResult.content), force ? undefined : fileContent);
                        this.logService.info(`${this.syncResourceLogLabel}: Updated snippet`, this.extUri.basename(resource));
                    }
                }
            }
        }
        async updateRemoteSnippets(resourcePreviews, remoteUserData, forcePush) {
            const currentSnippets = remoteUserData.syncData ? this.parseSnippets(remoteUserData.syncData) : {};
            const newSnippets = (0, objects_1.deepClone)(currentSnippets);
            for (const { acceptResult, localResource, remoteResource, remoteChange } of resourcePreviews) {
                if (remoteChange !== 0 /* Change.None */) {
                    const key = localResource ? this.extUri.basename(localResource) : this.extUri.basename(remoteResource);
                    if (remoteChange === 3 /* Change.Deleted */) {
                        delete newSnippets[key];
                    }
                    else {
                        newSnippets[key] = acceptResult.content;
                    }
                }
            }
            if (!(0, snippetsMerge_1.areSame)(currentSnippets, newSnippets)) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote snippets...`);
                remoteUserData = await this.updateRemoteUserData(JSON.stringify(newSnippets), forcePush ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote snippets`);
            }
            return remoteUserData;
        }
        parseSnippets(syncData) {
            return parseSnippets(syncData);
        }
        toSnippetsContents(snippetsFileContents) {
            const snippets = {};
            for (const key of Object.keys(snippetsFileContents)) {
                snippets[key] = snippetsFileContents[key].value.toString();
            }
            return snippets;
        }
        async getSnippetsFileContents() {
            const snippets = {};
            let stat;
            try {
                stat = await this.fileService.resolve(this.snippetsFolder);
            }
            catch (e) {
                // No snippets
                if (e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    return snippets;
                }
                else {
                    throw e;
                }
            }
            for (const entry of stat.children || []) {
                const resource = entry.resource;
                const extension = this.extUri.extname(resource);
                if (extension === '.json' || extension === '.code-snippets') {
                    const key = this.extUri.relativePath(this.snippetsFolder, resource);
                    const content = await this.fileService.readFile(resource);
                    snippets[key] = content;
                }
            }
            return snippets;
        }
    };
    exports.SnippetsSynchroniser = SnippetsSynchroniser;
    exports.SnippetsSynchroniser = SnippetsSynchroniser = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, files_1.IFileService),
        __param(4, storage_1.IStorageService),
        __param(5, userDataSync_1.IUserDataSyncStoreService),
        __param(6, userDataSync_1.IUserDataSyncLocalStoreService),
        __param(7, userDataSync_1.IUserDataSyncLogService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, userDataSync_1.IUserDataSyncEnablementService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, uriIdentity_1.IUriIdentityService)
    ], SnippetsSynchroniser);
    let SnippetsInitializer = class SnippetsInitializer extends abstractSynchronizer_1.AbstractInitializer {
        constructor(fileService, userDataProfilesService, environmentService, logService, storageService, uriIdentityService) {
            super("snippets" /* SyncResource.Snippets */, userDataProfilesService, environmentService, logService, fileService, storageService, uriIdentityService);
        }
        async doInitialize(remoteUserData) {
            const remoteSnippets = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
            if (!remoteSnippets) {
                this.logService.info('Skipping initializing snippets because remote snippets does not exist.');
                return;
            }
            const isEmpty = await this.isEmpty();
            if (!isEmpty) {
                this.logService.info('Skipping initializing snippets because local snippets exist.');
                return;
            }
            for (const key of Object.keys(remoteSnippets)) {
                const content = remoteSnippets[key];
                if (content) {
                    const resource = this.extUri.joinPath(this.userDataProfilesService.defaultProfile.snippetsHome, key);
                    await this.fileService.createFile(resource, buffer_1.VSBuffer.fromString(content));
                    this.logService.info('Created snippet', this.extUri.basename(resource));
                }
            }
            await this.updateLastSyncUserData(remoteUserData);
        }
        async isEmpty() {
            try {
                const stat = await this.fileService.resolve(this.userDataProfilesService.defaultProfile.snippetsHome);
                return !stat.children?.length;
            }
            catch (error) {
                return error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */;
            }
        }
    };
    exports.SnippetsInitializer = SnippetsInitializer;
    exports.SnippetsInitializer = SnippetsInitializer = __decorate([
        __param(0, files_1.IFileService),
        __param(1, userDataProfile_1.IUserDataProfilesService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, storage_1.IStorageService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], SnippetsInitializer);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldHNTeW5jLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS91c2VyRGF0YVN5bmMvY29tbW9uL3NuaXBwZXRzU3luYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEyQmhHLHNDQUVDO0lBRkQsU0FBZ0IsYUFBYSxDQUFDLFFBQW1CO1FBQ2hELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVNLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsMkNBQW9CO1FBSzdELFlBQ0MsT0FBeUIsRUFDekIsVUFBOEIsRUFDVCxrQkFBdUMsRUFDOUMsV0FBeUIsRUFDdEIsY0FBK0IsRUFDckIsd0JBQW1ELEVBQzlDLDZCQUE2RCxFQUNwRSxVQUFtQyxFQUNyQyxvQkFBMkMsRUFDbEMsNkJBQTZELEVBQzFFLGdCQUFtQyxFQUNqQyxrQkFBdUM7WUFFNUQsS0FBSyxDQUFDLEVBQUUsWUFBWSx3Q0FBdUIsRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSx3QkFBd0IsRUFBRSw2QkFBNkIsRUFBRSw2QkFBNkIsRUFBRSxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQWpCblEsWUFBTyxHQUFXLENBQUMsQ0FBQztZQWtCdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxTQUFTLENB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