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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/map", "vs/base/common/stream", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/hash", "vs/base/common/types", "vs/workbench/services/workingCopy/common/workingCopy"], function (require, exports, resources_1, uri_1, arrays_1, objects_1, async_1, files_1, map_1, stream_1, buffer_1, lifecycle_1, log_1, network_1, hash_1, types_1, workingCopy_1) {
    "use strict";
    var WorkingCopyBackupServiceImpl_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryWorkingCopyBackupService = exports.WorkingCopyBackupService = exports.WorkingCopyBackupsModel = void 0;
    exports.hashIdentifier = hashIdentifier;
    class WorkingCopyBackupsModel {
        static async create(backupRoot, fileService) {
            const model = new WorkingCopyBackupsModel(backupRoot, fileService);
            await model.resolve();
            return model;
        }
        constructor(backupRoot, fileService) {
            this.backupRoot = backupRoot;
            this.fileService = fileService;
            this.cache = new map_1.ResourceMap();
        }
        async resolve() {
            try {
                const backupRootStat = await this.fileService.resolve(this.backupRoot);
                if (backupRootStat.children) {
                    await async_1.Promises.settled(backupRootStat.children
                        .filter(child => child.isDirectory)
                        .map(async (backupSchemaFolder) => {
                        // Read backup directory for backups
                        const backupSchemaFolderStat = await this.fileService.resolve(backupSchemaFolder.resource);
                        // Remember known backups in our caches
                        //
                        // Note: this does NOT account for resolving
                        // associated meta data because that requires
                        // opening the backup and reading the meta
                        // preamble. Instead, when backups are actually
                        // resolved, the meta data will be added via
                        // additional `update` calls.
                        if (backupSchemaFolderStat.children) {
                            for (const backupForSchema of backupSchemaFolderStat.children) {
                                if (!backupForSchema.isDirectory) {
                                    this.add(backupForSchema.resource);
                                }
                            }
                        }
                    }));
                }
            }
            catch (error) {
                // ignore any errors
            }
        }
        add(resource, versionId = 0, meta) {
            this.cache.set(resource, {
                versionId,
                meta: (0, objects_1.deepClone)(meta)
            });
        }
        update(resource, meta) {
            const entry = this.cache.get(resource);
            if (entry) {
                entry.meta = (0, objects_1.deepClone)(meta);
            }
        }
        count() {
            return this.cache.size;
        }
        has(resource, versionId, meta) {
            const entry = this.cache.get(resource);
            if (!entry) {
                return false; // unknown resource
            }
            if (typeof versionId === 'number' && versionId !== entry.versionId) {
                return false; // different versionId
            }
            if (meta && !(0, objects_1.equals)(meta, entry.meta)) {
                return false; // different metadata
            }
            return true;
        }
        get() {
            return Array.from(this.cache.keys());
        }
        remove(resource) {
            this.cache.delete(resource);
        }
        clear() {
            this.cache.clear();
        }
    }
    exports.WorkingCopyBackupsModel = WorkingCopyBackupsModel;
    let WorkingCopyBackupService = class WorkingCopyBackupService extends lifecycle_1.Disposable {
        constructor(backupWorkspaceHome, fileService, logService) {
            super();
            this.fileService = fileService;
            this.logService = logService;
            this.impl = this._register(this.initialize(backupWorkspaceHome));
        }
        initialize(backupWorkspaceHome) {
            if (backupWorkspaceHome) {
                return new WorkingCopyBackupServiceImpl(backupWorkspaceHome, this.fileService, this.logService);
            }
            return new InMemoryWorkingCopyBackupService();
        }
        reinitialize(backupWorkspaceHome) {
            // Re-init implementation (unless we are running in-memory)
            if (this.impl instanceof WorkingCopyBackupServiceImpl) {
                if (backupWorkspaceHome) {
                    this.impl.initialize(backupWorkspaceHome);
                }
                else {
                    this.impl = new InMemoryWorkingCopyBackupService();
                }
            }
        }
        hasBackups() {
            return this.impl.hasBackups();
        }
        hasBackupSync(identifier, versionId, meta) {
            return this.impl.hasBackupSync(identifier, versionId, meta);
        }
        backup(identifier, content, versionId, meta, token) {
            return this.impl.backup(identifier, content, versionId, meta, token);
        }
        discardBackup(identifier, token) {
            return this.impl.discardBackup(identifier, token);
        }
        discardBackups(filter) {
            return this.impl.discardBackups(filter);
        }
        getBackups() {
            return this.impl.getBackups();
        }
        resolve(identifier) {
            return this.impl.resolve(identifier);
        }
        toBackupResource(identifier) {
            return this.impl.toBackupResource(identifier);
        }
        joinBackups() {
            return this.impl.joinBackups();
        }
    };
    exports.WorkingCopyBackupService = WorkingCopyBackupService;
    exports.WorkingCopyBackupService = WorkingCopyBackupService = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], WorkingCopyBackupService);
    let WorkingCopyBackupServiceImpl = class WorkingCopyBackupServiceImpl extends lifecycle_1.Disposable {
        static { WorkingCopyBackupServiceImpl_1 = this; }
        static { this.PREAMBLE_END_MARKER = '\n'; }
        static { this.PREAMBLE_END_MARKER_CHARCODE = '\n'.charCodeAt(0); }
        static { this.PREAMBLE_META_SEPARATOR = ' '; } // using a character that is know to be escaped in a URI as separator
        static { this.PREAMBLE_MAX_LENGTH = 10000; }
        constructor(backupWorkspaceHome, fileService, logService) {
            super();
            this.backupWorkspaceHome = backupWorkspaceHome;
            this.fileService = fileService;
            this.logService = logService;
            this.ioOperationQueues = this._register(new async_1.ResourceQueue()); // queue IO operations to ensure write/delete file order
            this.model = undefined;
            this.initialize(backupWorkspaceHome);
        }
        initialize(backupWorkspaceResource) {
            this.backupWorkspaceHome = backupWorkspaceResource;
            this.ready = this.doInitialize();
        }
        async doInitialize() {
            // Create backup model
            this.model = await WorkingCopyBackupsModel.create(this.backupWorkspaceHome, this.fileService);
            return this.model;
        }
        async hasBackups() {
            const model = await this.ready;
            // Ensure to await any pending backup operations
            await this.joinBackups();
            return model.count() > 0;
        }
        hasBackupSync(identifier, versionId, meta) {
            if (!this.model) {
                return false;
            }
            const backupResource = this.toBackupResource(identifier);
            return this.model.has(backupResource, versionId, meta);
        }
        async backup(identifier, content, versionId, meta, token) {
            const model = await this.ready;
            if (token?.isCancellationRequested) {
                return;
            }
            const backupResource = this.toBackupResource(identifier);
            if (model.has(backupResource, versionId, meta)) {
                // return early if backup version id matches requested one
                return;
            }
            return this.ioOperationQueues.queueFor(backupResource, async () => {
                if (token?.isCancellationRequested) {
                    return;
                }
                if (model.has(backupResource, versionId, meta)) {
                    // return early if backup version id matches requested one
                    // this can happen when multiple backup IO operations got
                    // scheduled, racing against each other.
                    return;
                }
                // Encode as: Resource + META-START + Meta + END
                // and respect max length restrictions in case
                // meta is too large.
                let preamble = this.createPreamble(identifier, meta);
                if (preamble.length >= WorkingCopyBackupServiceImpl_1.PREAMBLE_MAX_LENGTH) {
                    preamble = this.createPreamble(identifier);
                }
                // Update backup with value
                const preambleBuffer = buffer_1.VSBuffer.fromString(preamble);
                let backupBuffer;
                if ((0, stream_1.isReadableStream)(content)) {
                    backupBuffer = (0, buffer_1.prefixedBufferStream)(preambleBuffer, content);
                }
                else if (content) {
                    backupBuffer = (0, buffer_1.prefixedBufferReadable)(preambleBuffer, content);
                }
                else {
                    backupBuffer = buffer_1.VSBuffer.concat([preambleBuffer, buffer_1.VSBuffer.fromString('')]);
                }
                // Write backup via file service
                await this.fileService.writeFile(backupResource, backupBuffer);
                //
                // Update model
                //
                // Note: not checking for cancellation here because a successful
                // write into the backup file should be noted in the model to
                // prevent the model being out of sync with the backup file
                model.add(backupResource, versionId, meta);
            });
        }
        createPreamble(identifier, meta) {
            return `${identifier.resource.toString()}${WorkingCopyBackupServiceImpl_1.PREAMBLE_META_SEPARATOR}${JSON.stringify({ ...meta, typeId: identifier.typeId })}${WorkingCopyBackupServiceImpl_1.PREAMBLE_END_MARKER}`;
        }
        async discardBackups(filter) {
            const model = await this.ready;
            // Discard all but some backups
            const except = filter?.except;
            if (Array.isArray(except) && except.length > 0) {
                const exceptMap = new map_1.ResourceMap();
                for (const exceptWorkingCopy of except) {
                    exceptMap.set(this.toBackupResource(exceptWorkingCopy), true);
                }
                await async_1.Promises.settled(model.get().map(async (backupResource) => {
                    if (!exceptMap.has(backupResource)) {
                        await this.doDiscardBackup(backupResource);
                    }
                }));
            }
            // Discard all backups
            else {
                await this.deleteIgnoreFileNotFound(this.backupWorkspaceHome);
                model.clear();
            }
        }
        discardBackup(identifier, token) {
            const backupResource = this.toBackupResource(identifier);
            return this.doDiscardBackup(backupResource, token);
        }
        async doDiscardBackup(backupResource, token) {
            const model = await this.ready;
            if (token?.isCancellationRequested) {
                return;
            }
            return this.ioOperationQueues.queueFor(backupResource, async () => {
                if (token?.isCancellationRequested) {
                    return;
                }
                // Delete backup file ignoring any file not found errors
                await this.deleteIgnoreFileNotFound(backupResource);
                //
                // Update model
                //
                // Note: not checking for cancellation here because a successful
                // delete of the backup file should be noted in the model to
                // prevent the model being out of sync with the backup file
                model.remove(backupResource);
            });
        }
        async deleteIgnoreFileNotFound(backupResource) {
            try {
                await this.fileService.del(backupResource, { recursive: true });
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error; // re-throw any other error than file not found which is OK
                }
            }
        }
        async getBackups() {
            const model = await this.ready;
            // Ensure to await any pending backup operations
            await this.joinBackups();
            const backups = await Promise.all(model.get().map(backupResource => this.resolveIdentifier(backupResource, model)));
            return (0, arrays_1.coalesce)(backups);
        }
        async resolveIdentifier(backupResource, model) {
            let res = undefined;
            await this.ioOperationQueues.queueFor(backupResource, async () => {
                if (!model.has(backupResource)) {
                    return; // require backup to be present
                }
                // Read the entire backup preamble by reading up to
                // `PREAMBLE_MAX_LENGTH` in the backup file until
                // the `PREAMBLE_END_MARKER` is found
                const backupPreamble = await this.readToMatchingString(backupResource, WorkingCopyBackupServiceImpl_1.PREAMBLE_END_MARKER, WorkingCopyBackupServiceImpl_1.PREAMBLE_MAX_LENGTH);
                if (!backupPreamble) {
                    return;
                }
                // Figure out the offset in the preamble where meta
                // information possibly starts. This can be `-1` for
                // older backups without meta.
                const metaStartIndex = backupPreamble.indexOf(WorkingCopyBackupServiceImpl_1.PREAMBLE_META_SEPARATOR);
                // Extract the preamble content for resource and meta
                let resourcePreamble;
                let metaPreamble;
                if (metaStartIndex > 0) {
                    resourcePreamble = backupPreamble.substring(0, metaStartIndex);
                    metaPreamble = backupPreamble.substr(metaStartIndex + 1);
                }
                else {
                    resourcePreamble = backupPreamble;
                    metaPreamble = undefined;
                }
                // Try to parse the meta preamble for figuring out
                // `typeId` and `meta` if defined.
                const { typeId, meta } = this.parsePreambleMeta(metaPreamble);
                // Update model entry with now resolved meta
                model.update(backupResource, meta);
                res = {
                    typeId: typeId ?? workingCopy_1.NO_TYPE_ID,
                    resource: uri_1.URI.parse(resourcePreamble)
                };
            });
            return res;
        }
        async readToMatchingString(backupResource, matchingString, maximumBytesToRead) {
            const contents = (await this.fileService.readFile(backupResource, { length: maximumBytesToRead })).value.toString();
            const matchingStringIndex = contents.indexOf(matchingString);
            if (matchingStringIndex >= 0) {
                return contents.substr(0, matchingStringIndex);
            }
            // Unable to find matching string in file
            return undefined;
        }
        async resolve(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const model = await this.ready;
            let res = undefined;
            await this.ioOperationQueues.queueFor(backupResource, async () => {
                if (!model.has(backupResource)) {
                    return; // require backup to be present
                }
                // Load the backup content and peek into the first chunk
                // to be able to resolve the meta data
                const backupStream = await this.fileService.readFileStream(backupResource);
                const peekedBackupStream = await (0, stream_1.peekStream)(backupStream.value, 1);
                const firstBackupChunk = buffer_1.VSBuffer.concat(peekedBackupStream.buffer);
                // We have seen reports (e.g. https://github.com/microsoft/vscode/issues/78500) where
                // if VSCode goes down while writing the backup file, the file can turn empty because
                // it always first gets truncated and then written to. In this case, we will not find
                // the meta-end marker ('\n') and as such the backup can only be invalid. We bail out
                // here if that is the case.
                const preambleEndIndex = firstBackupChunk.buffer.indexOf(WorkingCopyBackupServiceImpl_1.PREAMBLE_END_MARKER_CHARCODE);
                if (preambleEndIndex === -1) {
                    this.logService.trace(`Backup: Could not find meta end marker in ${backupResource}. The file is probably corrupt (filesize: ${backupStream.size}).`);
                    return undefined;
                }
                const preambelRaw = firstBackupChunk.slice(0, preambleEndIndex).toString();
                // Extract meta data (if any)
                let meta;
                const metaStartIndex = preambelRaw.indexOf(WorkingCopyBackupServiceImpl_1.PREAMBLE_META_SEPARATOR);
                if (metaStartIndex !== -1) {
                    meta = this.parsePreambleMeta(preambelRaw.substr(metaStartIndex + 1)).meta;
                }
                // Update model entry with now resolved meta
                model.update(backupResource, meta);
                // Build a new stream without the preamble
                const firstBackupChunkWithoutPreamble = firstBackupChunk.slice(preambleEndIndex + 1);
                let value;
                if (peekedBackupStream.ended) {
                    value = (0, buffer_1.bufferToStream)(firstBackupChunkWithoutPreamble);
                }
                else {
                    value = (0, buffer_1.prefixedBufferStream)(firstBackupChunkWithoutPreamble, peekedBackupStream.stream);
                }
                res = { value, meta };
            });
            return res;
        }
        parsePreambleMeta(preambleMetaRaw) {
            let typeId = undefined;
            let meta = undefined;
            if (preambleMetaRaw) {
                try {
                    meta = JSON.parse(preambleMetaRaw);
                    typeId = meta?.typeId;
                    // `typeId` is a property that we add so we
                    // remove it when returning to clients.
                    if (typeof meta?.typeId === 'string') {
                        delete meta.typeId;
                        if ((0, types_1.isEmptyObject)(meta)) {
                            meta = undefined;
                        }
                    }
                }
                catch (error) {
                    // ignore JSON parse errors
                }
            }
            return { typeId, meta };
        }
        toBackupResource(identifier) {
            return (0, resources_1.joinPath)(this.backupWorkspaceHome, identifier.resource.scheme, hashIdentifier(identifier));
        }
        joinBackups() {
            return this.ioOperationQueues.whenDrained();
        }
    };
    WorkingCopyBackupServiceImpl = WorkingCopyBackupServiceImpl_1 = __decorate([
        __param(1, files_1.IFileService),
        __param(2, log_1.ILogService)
    ], WorkingCopyBackupServiceImpl);
    class InMemoryWorkingCopyBackupService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.backups = new map_1.ResourceMap();
        }
        async hasBackups() {
            return this.backups.size > 0;
        }
        hasBackupSync(identifier, versionId) {
            const backupResource = this.toBackupResource(identifier);
            return this.backups.has(backupResource);
        }
        async backup(identifier, content, versionId, meta, token) {
            const backupResource = this.toBackupResource(identifier);
            this.backups.set(backupResource, {
                typeId: identifier.typeId,
                content: content instanceof buffer_1.VSBuffer ? content : content ? (0, stream_1.isReadableStream)(content) ? await (0, buffer_1.streamToBuffer)(content) : (0, buffer_1.readableToBuffer)(content) : buffer_1.VSBuffer.fromString(''),
                meta
            });
        }
        async resolve(identifier) {
            const backupResource = this.toBackupResource(identifier);
            const backup = this.backups.get(backupResource);
            if (backup) {
                return { value: (0, buffer_1.bufferToStream)(backup.content), meta: backup.meta };
            }
            return undefined;
        }
        async getBackups() {
            return Array.from(this.backups.entries()).map(([resource, backup]) => ({ typeId: backup.typeId, resource }));
        }
        async discardBackup(identifier) {
            this.backups.delete(this.toBackupResource(identifier));
        }
        async discardBackups(filter) {
            const except = filter?.except;
            if (Array.isArray(except) && except.length > 0) {
                const exceptMap = new map_1.ResourceMap();
                for (const exceptWorkingCopy of except) {
                    exceptMap.set(this.toBackupResource(exceptWorkingCopy), true);
                }
                for (const backup of await this.getBackups()) {
                    if (!exceptMap.has(this.toBackupResource(backup))) {
                        await this.discardBackup(backup);
                    }
                }
            }
            else {
                this.backups.clear();
            }
        }
        toBackupResource(identifier) {
            return uri_1.URI.from({ scheme: network_1.Schemas.inMemory, path: hashIdentifier(identifier) });
        }
        async joinBackups() {
            return;
        }
    }
    exports.InMemoryWorkingCopyBackupService = InMemoryWorkingCopyBackupService;
    /*
     * Exported only for testing
     */
    function hashIdentifier(identifier) {
        // IMPORTANT: for backwards compatibility, ensure that
        // we ignore the `typeId` unless a value is provided.
        // To preserve previous backups without type id, we
        // need to just hash the resource. Otherwise we use
        // the type id as a seed to the resource path.
        let resource;
        if (identifier.typeId.length > 0) {
            const typeIdHash = hashString(identifier.typeId);
            if (identifier.resource.path) {
                resource = (0, resources_1.joinPath)(identifier.resource, typeIdHash);
            }
            else {
                resource = identifier.resource.with({ path: typeIdHash });
            }
        }
        else {
            resource = identifier.resource;
        }
        return hashPath(resource);
    }
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return hashString(str);
    }
    function hashString(str) {
        return (0, hash_1.hash)(str).toString(16);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2luZ0NvcHlCYWNrdXBTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvd29ya2luZ0NvcHkvY29tbW9uL3dvcmtpbmdDb3B5QmFja3VwU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBbW1CaEcsd0NBb0JDO0lBbm1CRCxNQUFhLHVCQUF1QjtRQUluQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFlLEVBQUUsV0FBeUI7WUFDN0QsTUFBTSxLQUFLLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFbkUsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdEIsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRUQsWUFBNEIsVUFBZSxFQUFVLFdBQXlCO1lBQWxELGVBQVUsR0FBVixVQUFVLENBQUs7WUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQVY3RCxVQUFLLEdBQUcsSUFBSSxpQkFBVyxFQUF5RCxDQUFDO1FBVWhCLENBQUM7UUFFM0UsS0FBSyxDQUFDLE9BQU87WUFDcEIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztvQkFDN0IsTUFBTSxnQkFBUSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsUUFBUTt5QkFDNUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQzt5QkFDbEMsR0FBRyxDQUFDLEtBQUssRUFBQyxrQkFBa0IsRUFBQyxF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