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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyHistoryTracker", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/platform/files/common/files", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/resources", "vs/workbench/services/environment/common/environmentService", "vs/base/common/hash", "vs/base/common/extpath", "vs/base/common/cancellation", "vs/base/common/map", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/label/common/label", "vs/base/common/buffer", "vs/platform/log/common/log", "vs/workbench/common/editor", "vs/platform/configuration/common/configuration", "vs/base/common/arrays", "vs/base/common/strings"], function (require, exports, nls_1, event_1, types_1, platform_1, contributions_1, lifecycle_1, workingCopyHistoryTracker_1, lifecycle_2, workingCopyHistory_1, files_1, remoteAgentService_1, uri_1, async_1, resources_1, environmentService_1, hash_1, extpath_1, cancellation_1, map_1, uriIdentity_1, label_1, buffer_1, log_1, editor_1, configuration_1, arrays_1, strings_1) {
    "use strict";
    var WorkingCopyHistoryService_1, NativeWorkingCopyHistoryService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkingCopyHistoryService = exports.WorkingCopyHistoryService = exports.WorkingCopyHistoryModel = void 0;
    class WorkingCopyHistoryModel {
        static { this.ENTRIES_FILE = 'entries.json'; }
        static { this.FILE_SAVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('default.source', (0, nls_1.localize)('default.source', "File Saved")); }
        static { this.SETTINGS = {
            MAX_ENTRIES: 'workbench.localHistory.maxFileEntries',
            MERGE_PERIOD: 'workbench.localHistory.mergeWindow'
        }; }
        constructor(workingCopyResource, historyHome, entryAddedEmitter, entryChangedEmitter, entryReplacedEmitter, entryRemovedEmitter, options, fileService, labelService, logService, configurationService) {
            this.historyHome = historyHome;
            this.entryAddedEmitter = entryAddedEmitter;
            this.entryChangedEmitter = entryChangedEmitter;
            this.entryReplacedEmitter = entryReplacedEmitter;
            this.entryRemovedEmitter = entryRemovedEmitter;
            this.options = options;
            this.fileService = fileService;
            this.labelService = labelService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.entries = [];
            this.whenResolved = undefined;
            this.workingCopyResource = undefined;
            this.workingCopyName = undefined;
            this.historyEntriesFolder = undefined;
            this.historyEntriesListingFile = undefined;
            this.historyEntriesNameMatcher = undefined;
            this.versionId = 0;
            this.storedVersionId = this.versionId;
            this.storeLimiter = new async_1.Limiter(1);
            this.setWorkingCopy(workingCopyResource);
        }
        setWorkingCopy(workingCopyResource) {
            // Update working copy
            this.workingCopyResource = workingCopyResource;
            this.workingCopyName = this.labelService.getUriBasenameLabel(workingCopyResource);
            this.historyEntriesNameMatcher = new RegExp(`[A-Za-z0-9]{4}${(0, strings_1.escapeRegExpCharacters)((0, resources_1.extname)(workingCopyResource))}`);
            // Update locations
            this.historyEntriesFolder = this.toHistoryEntriesFolder(this.historyHome, workingCopyResource);
            this.historyEntriesListingFile = (0, resources_1.joinPath)(this.historyEntriesFolder, WorkingCopyHistoryModel.ENTRIES_FILE);
            // Reset entries and resolved cache
            this.entries = [];
            this.whenResolved = undefined;
        }
        toHistoryEntriesFolder(historyHome, workingCopyResource) {
            return (0, resources_1.joinPath)(historyHome, (0, hash_1.hash)(workingCopyResource.toString()).toString(16));
        }
        async addEntry(source = WorkingCopyHistoryModel.FILE_SAVED_SOURCE, timestamp = Date.now(), token) {
            let entryToReplace = undefined;
            // Figure out if the last entry should be replaced based
            // on settings that can define a interval for when an
            // entry is not added as new entry but should replace.
            // However, when save source is different, never replace.
            const lastEntry = (0, arrays_1.lastOrDefault)(this.entries);
            if (lastEntry && lastEntry.source === source) {
                const configuredReplaceInterval = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MERGE_PERIOD, { resource: this.workingCopyResource });
                if (timestamp - lastEntry.timestamp <= (configuredReplaceInterval * 1000 /* convert to millies */)) {
                    entryToReplace = lastEntry;
                }
            }
            let entry;
            // Replace lastest entry in history
            if (entryToReplace) {
                entry = await this.doReplaceEntry(entryToReplace, timestamp, token);
            }
            // Add entry to history
            else {
                entry = await this.doAddEntry(source, timestamp, token);
            }
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
            return entry;
        }
        async doAddEntry(source, timestamp, token) {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const workingCopyName = (0, types_1.assertIsDefined)(this.workingCopyName);
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            // Perform a fast clone operation with minimal overhead to a new random location
            const id = `${(0, extpath_1.randomPath)(undefined, undefined, 4)}${(0, resources_1.extname)(workingCopyResource)}`;
            const location = (0, resources_1.joinPath)(historyEntriesFolder, id);
            await this.fileService.cloneFile(workingCopyResource, location);
            // Add to list of entries
            const entry = {
                id,
                workingCopy: { resource: workingCopyResource, name: workingCopyName },
                location,
                timestamp,
                source
            };
            this.entries.push(entry);
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryAddedEmitter.fire({ entry });
            return entry;
        }
        async doReplaceEntry(entry, timestamp, token) {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            // Perform a fast clone operation with minimal overhead to the existing location
            await this.fileService.cloneFile(workingCopyResource, entry.location);
            // Update entry
            entry.timestamp = timestamp;
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryReplacedEmitter.fire({ entry });
            return entry;
        }
        async removeEntry(entry, token) {
            // Make sure to await resolving when removing entries
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return false;
            }
            const index = this.entries.indexOf(entry);
            if (index === -1) {
                return false;
            }
            // Delete from disk
            await this.deleteEntry(entry);
            // Remove from model
            this.entries.splice(index, 1);
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryRemovedEmitter.fire({ entry });
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
            return true;
        }
        async updateEntry(entry, properties, token) {
            // Make sure to await resolving when updating entries
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return;
            }
            const index = this.entries.indexOf(entry);
            if (index === -1) {
                return;
            }
            // Update entry
            entry.source = properties.source;
            // Update version ID of model to use for storing later
            this.versionId++;
            // Events
            this.entryChangedEmitter.fire({ entry });
            // Flush now if configured
            if (this.options.flushOnChange && !token.isCancellationRequested) {
                await this.store(token);
            }
        }
        async getEntries() {
            // Make sure to await resolving when all entries are asked for
            await this.resolveEntriesOnce();
            // Return as many entries as configured by user settings
            const configuredMaxEntries = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MAX_ENTRIES, { resource: this.workingCopyResource });
            if (this.entries.length > configuredMaxEntries) {
                return this.entries.slice(this.entries.length - configuredMaxEntries);
            }
            return this.entries;
        }
        async hasEntries(skipResolve) {
            // Make sure to await resolving unless explicitly skipped
            if (!skipResolve) {
                await this.resolveEntriesOnce();
            }
            return this.entries.length > 0;
        }
        resolveEntriesOnce() {
            if (!this.whenResolved) {
                this.whenResolved = this.doResolveEntries();
            }
            return this.whenResolved;
        }
        async doResolveEntries() {
            // Resolve from disk
            const entries = await this.resolveEntriesFromDisk();
            // We now need to merge our in-memory entries with the
            // entries we have found on disk because it is possible
            // that new entries have been added before the entries
            // listing file was updated
            for (const entry of this.entries) {
                entries.set(entry.id, entry);
            }
            // Set as entries, sorted by timestamp
            this.entries = Array.from(entries.values()).sort((entryA, entryB) => entryA.timestamp - entryB.timestamp);
        }
        async resolveEntriesFromDisk() {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const workingCopyName = (0, types_1.assertIsDefined)(this.workingCopyName);
            const [entryListing, entryStats] = await Promise.all([
                // Resolve entries listing file
                this.readEntriesFile(),
                // Resolve children of history folder
                this.readEntriesFolder()
            ]);
            // Add from raw folder children
            const entries = new Map();
            if (entryStats) {
                for (const entryStat of entryStats) {
                    entries.set(entryStat.name, {
                        id: entryStat.name,
                        workingCopy: { resource: workingCopyResource, name: workingCopyName },
                        location: entryStat.resource,
                        timestamp: entryStat.mtime,
                        source: WorkingCopyHistoryModel.FILE_SAVED_SOURCE
                    });
                }
            }
            // Update from listing (to have more specific metadata)
            if (entryListing) {
                for (const entry of entryListing.entries) {
                    const existingEntry = entries.get(entry.id);
                    if (existingEntry) {
                        entries.set(entry.id, {
                            ...existingEntry,
                            timestamp: entry.timestamp,
                            source: entry.source ?? existingEntry.source
                        });
                    }
                }
            }
            return entries;
        }
        async moveEntries(targetWorkingCopyResource, source, token) {
            // Ensure model stored so that any pending data is flushed
            await this.store(token);
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Rename existing entries folder
            const sourceHistoryEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            const targetHistoryFolder = this.toHistoryEntriesFolder(this.historyHome, targetWorkingCopyResource);
            try {
                await this.fileService.move(sourceHistoryEntriesFolder, targetHistoryFolder, true);
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            // Update our associated working copy
            this.setWorkingCopy(targetWorkingCopyResource);
            // Add entry for the move
            await this.addEntry(source, undefined, token);
            // Store model again to updated location
            await this.store(token);
        }
        async store(token) {
            if (!this.shouldStore()) {
                return;
            }
            // Use a `Limiter` to prevent multiple `store` operations
            // potentially running at the same time
            await this.storeLimiter.queue(async () => {
                if (token.isCancellationRequested || !this.shouldStore()) {
                    return;
                }
                return this.doStore(token);
            });
        }
        shouldStore() {
            return this.storedVersionId !== this.versionId;
        }
        async doStore(token) {
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            // Make sure to await resolving when persisting
            await this.resolveEntriesOnce();
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Cleanup based on max-entries setting
            await this.cleanUpEntries();
            // Without entries, remove the history folder
            const storedVersion = this.versionId;
            if (this.entries.length === 0) {
                try {
                    await this.fileService.del(historyEntriesFolder, { recursive: true });
                }
                catch (error) {
                    this.traceError(error);
                }
            }
            // If we still have entries, update the entries meta file
            else {
                await this.writeEntriesFile();
            }
            // Mark as stored version
            this.storedVersionId = storedVersion;
        }
        async cleanUpEntries() {
            const configuredMaxEntries = this.configurationService.getValue(WorkingCopyHistoryModel.SETTINGS.MAX_ENTRIES, { resource: this.workingCopyResource });
            if (this.entries.length <= configuredMaxEntries) {
                return; // nothing to cleanup
            }
            const entriesToDelete = this.entries.slice(0, this.entries.length - configuredMaxEntries);
            const entriesToKeep = this.entries.slice(this.entries.length - configuredMaxEntries);
            // Delete entries from disk as instructed
            for (const entryToDelete of entriesToDelete) {
                await this.deleteEntry(entryToDelete);
            }
            // Make sure to update our in-memory model as well
            // because it will be persisted right after
            this.entries = entriesToKeep;
            // Events
            for (const entry of entriesToDelete) {
                this.entryRemovedEmitter.fire({ entry });
            }
        }
        async deleteEntry(entry) {
            try {
                await this.fileService.del(entry.location);
            }
            catch (error) {
                this.traceError(error);
            }
        }
        async writeEntriesFile() {
            const workingCopyResource = (0, types_1.assertIsDefined)(this.workingCopyResource);
            const historyEntriesListingFile = (0, types_1.assertIsDefined)(this.historyEntriesListingFile);
            const serializedModel = {
                version: 1,
                resource: workingCopyResource.toString(),
                entries: this.entries.map(entry => {
                    return {
                        id: entry.id,
                        source: entry.source !== WorkingCopyHistoryModel.FILE_SAVED_SOURCE ? entry.source : undefined,
                        timestamp: entry.timestamp
                    };
                })
            };
            await this.fileService.writeFile(historyEntriesListingFile, buffer_1.VSBuffer.fromString(JSON.stringify(serializedModel)));
        }
        async readEntriesFile() {
            const historyEntriesListingFile = (0, types_1.assertIsDefined)(this.historyEntriesListingFile);
            let serializedModel = undefined;
            try {
                serializedModel = JSON.parse((await this.fileService.readFile(historyEntriesListingFile)).value.toString());
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            return serializedModel;
        }
        async readEntriesFolder() {
            const historyEntriesFolder = (0, types_1.assertIsDefined)(this.historyEntriesFolder);
            const historyEntriesNameMatcher = (0, types_1.assertIsDefined)(this.historyEntriesNameMatcher);
            let rawEntries = undefined;
            // Resolve children of folder on disk
            try {
                rawEntries = (await this.fileService.resolve(historyEntriesFolder, { resolveMetadata: true })).children;
            }
            catch (error) {
                if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */)) {
                    this.traceError(error);
                }
            }
            if (!rawEntries) {
                return undefined;
            }
            // Skip entries that do not seem to have valid file name
            return rawEntries.filter(entry => !(0, resources_1.isEqual)(entry.resource, this.historyEntriesListingFile) && // not the listings file
                historyEntriesNameMatcher.test(entry.name) // matching our expected file pattern for entries
            );
        }
        traceError(error) {
            this.logService.trace('[Working Copy History Service]', error);
        }
    }
    exports.WorkingCopyHistoryModel = WorkingCopyHistoryModel;
    let WorkingCopyHistoryService = class WorkingCopyHistoryService extends lifecycle_2.Disposable {
        static { WorkingCopyHistoryService_1 = this; }
        static { this.FILE_MOVED_SOURCE = editor_1.SaveSourceRegistry.registerSource('moved.source', (0, nls_1.localize)('moved.source', "File Moved")); }
        static { this.FILE_RENAMED_SOURCE = editor_1.SaveSourceRegistry.registerSource('renamed.source', (0, nls_1.localize)('renamed.source', "File Renamed")); }
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService) {
            super();
            this.fileService = fileService;
            this.remoteAgentService = remoteAgentService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
            this.labelService = labelService;
            this.logService = logService;
            this.configurationService = configurationService;
            this._onDidAddEntry = this._register(new event_1.Emitter());
            this.onDidAddEntry = this._onDidAddEntry.event;
            this._onDidChangeEntry = this._register(new event_1.Emitter());
            this.onDidChangeEntry = this._onDidChangeEntry.event;
            this._onDidReplaceEntry = this._register(new event_1.Emitter());
            this.onDidReplaceEntry = this._onDidReplaceEntry.event;
            this._onDidMoveEntries = this._register(new event_1.Emitter());
            this.onDidMoveEntries = this._onDidMoveEntries.event;
            this._onDidRemoveEntry = this._register(new event_1.Emitter());
            this.onDidRemoveEntry = this._onDidRemoveEntry.event;
            this._onDidRemoveEntries = this._register(new event_1.Emitter());
            this.onDidRemoveEntries = this._onDidRemoveEntries.event;
            this.localHistoryHome = new async_1.DeferredPromise();
            this.models = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.resolveLocalHistoryHome();
        }
        async resolveLocalHistoryHome() {
            let historyHome = undefined;
            // Prefer history to be stored in the remote if we are connected to a remote
            try {
                const remoteEnv = await this.remoteAgentService.getEnvironment();
                if (remoteEnv) {
                    historyHome = remoteEnv.localHistoryHome;
                }
            }
            catch (error) {
                this.logService.trace(error); // ignore and fallback to local
            }
            // But fallback to local if there is no remote
            if (!historyHome) {
                historyHome = this.environmentService.localHistoryHome;
            }
            this.localHistoryHome.complete(historyHome);
        }
        async moveEntries(source, target) {
            const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
            const promises = [];
            for (const [resource, model] of this.models) {
                if (!this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                    continue; // model does not match moved resource
                }
                // Determine new resulting target resource
                let targetResource;
                if (this.uriIdentityService.extUri.isEqual(source, resource)) {
                    targetResource = target; // file got moved
                }
                else {
                    const index = (0, extpath_1.indexOfPath)(resource.path, source.path);
                    targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                }
                // Figure out save source
                let saveSource;
                if (this.uriIdentityService.extUri.isEqual((0, resources_1.dirname)(resource), (0, resources_1.dirname)(targetResource))) {
                    saveSource = WorkingCopyHistoryService_1.FILE_RENAMED_SOURCE;
                }
                else {
                    saveSource = WorkingCopyHistoryService_1.FILE_MOVED_SOURCE;
                }
                // Move entries to target queued
                promises.push(limiter.queue(() => this.doMoveEntries(model, saveSource, resource, targetResource)));
            }
            if (!promises.length) {
                return [];
            }
            // Await move operations
            const resources = await Promise.all(promises);
            // Events
            this._onDidMoveEntries.fire();
            return resources;
        }
        async doMoveEntries(model, source, sourceWorkingCopyResource, targetWorkingCopyResource) {
            // Move to target via model
            await model.moveEntries(targetWorkingCopyResource, source, cancellation_1.CancellationToken.None);
            // Update model in our map
            this.models.delete(sourceWorkingCopyResource);
            this.models.set(targetWorkingCopyResource, model);
            return targetWorkingCopyResource;
        }
        async addEntry({ resource, source, timestamp }, token) {
            if (!this.fileService.hasProvider(resource)) {
                return undefined; // we require the working copy resource to be file service accessible
            }
            // Resolve history model for working copy
            const model = await this.getModel(resource);
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Add to model
            return model.addEntry(source, timestamp, token);
        }
        async updateEntry(entry, properties, token) {
            // Resolve history model for working copy
            const model = await this.getModel(entry.workingCopy.resource);
            if (token.isCancellationRequested) {
                return;
            }
            // Rename in model
            return model.updateEntry(entry, properties, token);
        }
        async removeEntry(entry, token) {
            // Resolve history model for working copy
            const model = await this.getModel(entry.workingCopy.resource);
            if (token.isCancellationRequested) {
                return false;
            }
            // Remove from model
            return model.removeEntry(entry, token);
        }
        async removeAll(token) {
            const historyHome = await this.localHistoryHome.p;
            if (token.isCancellationRequested) {
                return;
            }
            // Clear models
            this.models.clear();
            // Remove from disk
            await this.fileService.del(historyHome, { recursive: true });
            // Events
            this._onDidRemoveEntries.fire();
        }
        async getEntries(resource, token) {
            const model = await this.getModel(resource);
            if (token.isCancellationRequested) {
                return [];
            }
            const entries = await model.getEntries();
            return entries ?? [];
        }
        async getAll(token) {
            const historyHome = await this.localHistoryHome.p;
            if (token.isCancellationRequested) {
                return [];
            }
            const all = new map_1.ResourceMap();
            // Fill in all known model resources (they might not have yet persisted to disk)
            for (const [resource, model] of this.models) {
                const hasInMemoryEntries = await model.hasEntries(true /* skip resolving because we resolve below from disk */);
                if (hasInMemoryEntries) {
                    all.set(resource, true);
                }
            }
            // Resolve all other resources by iterating the history home folder
            try {
                const resolvedHistoryHome = await this.fileService.resolve(historyHome);
                if (resolvedHistoryHome.children) {
                    const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
                    const promises = [];
                    for (const child of resolvedHistoryHome.children) {
                        promises.push(limiter.queue(async () => {
                            if (token.isCancellationRequested) {
                                return;
                            }
                            try {
                                const serializedModel = JSON.parse((await this.fileService.readFile((0, resources_1.joinPath)(child.resource, WorkingCopyHistoryModel.ENTRIES_FILE))).value.toString());
                                if (serializedModel.entries.length > 0) {
                                    all.set(uri_1.URI.parse(serializedModel.resource), true);
                                }
                            }
                            catch (error) {
                                // ignore - model might be missing or corrupt, but we need it
                            }
                        }));
                    }
                    await Promise.all(promises);
                }
            }
            catch (error) {
                // ignore - history might be entirely empty
            }
            return Array.from(all.keys());
        }
        async getModel(resource) {
            const historyHome = await this.localHistoryHome.p;
            let model = this.models.get(resource);
            if (!model) {
                model = new WorkingCopyHistoryModel(resource, historyHome, this._onDidAddEntry, this._onDidChangeEntry, this._onDidReplaceEntry, this._onDidRemoveEntry, this.getModelOptions(), this.fileService, this.labelService, this.logService, this.configurationService);
                this.models.set(resource, model);
            }
            return model;
        }
    };
    exports.WorkingCopyHistoryService = WorkingCopyHistoryService;
    exports.WorkingCopyHistoryService = WorkingCopyHistoryService = WorkingCopyHistoryService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, configuration_1.IConfigurationService)
    ], WorkingCopyHistoryService);
    let NativeWorkingCopyHistoryService = class NativeWorkingCopyHistoryService extends WorkingCopyHistoryService {
        static { NativeWorkingCopyHistoryService_1 = this; }
        static { this.STORE_ALL_INTERVAL = 5 * 60 * 1000; } // 5min
        constructor(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, lifecycleService, logService, configurationService) {
            super(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, logService, configurationService);
            this.lifecycleService = lifecycleService;
            this.isRemotelyStored = typeof this.environmentService.remoteAuthority === 'string';
            this.storeAllCts = this._register(new cancellation_1.CancellationTokenSource());
            this.storeAllScheduler = this._register(new async_1.RunOnceScheduler(() => this.storeAll(this.storeAllCts.token), NativeWorkingCopyHistoryService_1.STORE_ALL_INTERVAL));
            this.registerListeners();
        }
        registerListeners() {
            if (!this.isRemotelyStored) {
                // Local: persist all on shutdown
                this._register(this.lifecycleService.onWillShutdown(e => this.onWillShutdown(e)));
                // Local: schedule persist on change
                this._register(event_1.Event.any(this.onDidAddEntry, this.onDidChangeEntry, this.onDidReplaceEntry, this.onDidRemoveEntry)(() => this.onDidChangeModels()));
            }
        }
        getModelOptions() {
            return { flushOnChange: this.isRemotelyStored /* because the connection might drop anytime */ };
        }
        onWillShutdown(e) {
            // Dispose the scheduler...
            this.storeAllScheduler.dispose();
            this.storeAllCts.dispose(true);
            // ...because we now explicitly store all models
            e.join(this.storeAll(e.token), { id: 'join.workingCopyHistory', label: (0, nls_1.localize)('join.workingCopyHistory', "Saving local history") });
        }
        onDidChangeModels() {
            if (!this.storeAllScheduler.isScheduled()) {
                this.storeAllScheduler.schedule();
            }
        }
        async storeAll(token) {
            const limiter = new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS);
            const promises = [];
            const models = Array.from(this.models.values());
            for (const model of models) {
                promises.push(limiter.queue(async () => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    try {
                        await model.store(token);
                    }
                    catch (error) {
                        this.logService.trace(error);
                    }
                }));
            }
            await Promise.all(promises);
        }
    };
    exports.NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService;
    exports.NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService = NativeWorkingCopyHistoryService_1 = __decorate([
        __param(0, files_1.IFileService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, uriIdentity_1.IUriIdentityService),
        __param(4, label_1.ILabelService),
        __param(5, lifecycle_1.ILifecycleService),
        __param(6, log_1.ILogService),
        __param(7, configuration_1.IConfigurationService)
    ], NativeWorkingCopyHistoryService);
    // Register History Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(workingCopyHistoryTracker_1.WorkingCopyHistoryTracker, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlIaXN0b3J5U2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3dvcmtpbmdDb3B5L2NvbW1vbi93b3JraW5nQ29weUhpc3RvcnlTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxRGhHLE1BQWEsdUJBQXVCO2lCQUVuQixpQkFBWSxHQUFHLGNBQWMsQUFBakIsQ0FBa0I7aUJBRXRCLHNCQUFpQixHQUFHLDJCQUFrQixDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQyxBQUFoRyxDQUFpRztpQkFFbEgsYUFBUSxHQUFHO1lBQ2xDLFdBQVcsRUFBRSx1Q0FBdUM7WUFDcEQsWUFBWSxFQUFFLG9DQUFvQztTQUNsRCxBQUgrQixDQUc5QjtRQW1CRixZQUNDLG1CQUF3QixFQUNQLFdBQWdCLEVBQ2hCLGlCQUFvRCxFQUNwRCxtQkFBc0QsRUFDdEQsb0JBQXVELEVBQ3ZELG1CQUFzRCxFQUN0RCxPQUF3QyxFQUN4QyxXQUF5QixFQUN6QixZQUEyQixFQUMzQixVQUF1QixFQUN2QixvQkFBMkM7WUFUM0MsZ0JBQVcsR0FBWCxXQUFXLENBQUs7WUFDaEIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQztZQUNwRCx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQW1DO1lBQ3RELHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBbUM7WUFDdkQsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFtQztZQUN0RCxZQUFPLEdBQVAsT0FBTyxDQUFpQztZQUN4QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN6QixpQkFBWSxHQUFaLFlBQVksQ0FBZTtZQUMzQixlQUFVLEdBQVYsVUFBVSxD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