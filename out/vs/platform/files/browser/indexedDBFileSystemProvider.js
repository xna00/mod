/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/files/common/files", "vs/base/browser/indexedDB", "vs/base/browser/broadcast"], function (require, exports, async_1, buffer_1, event_1, lifecycle_1, resources_1, types_1, uri_1, nls_1, files_1, indexedDB_1, broadcast_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBFileSystemProvider = void 0;
    // Standard FS Errors (expected to be thrown in production when invalid FS operations are requested)
    const ERR_FILE_NOT_FOUND = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
    const ERR_FILE_IS_DIR = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileIsDirectory', "File is Directory"), files_1.FileSystemProviderErrorCode.FileIsADirectory);
    const ERR_FILE_NOT_DIR = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotDirectory', "File is not a directory"), files_1.FileSystemProviderErrorCode.FileNotADirectory);
    const ERR_DIR_NOT_EMPTY = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('dirIsNotEmpty', "Directory is not empty"), files_1.FileSystemProviderErrorCode.Unknown);
    const ERR_FILE_EXCEEDS_STORAGE_QUOTA = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileExceedsStorageQuota', "File exceeds available storage quota"), files_1.FileSystemProviderErrorCode.FileExceedsStorageQuota);
    // Arbitrary Internal Errors
    const ERR_UNKNOWN_INTERNAL = (message) => (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('internal', "Internal error occurred in IndexedDB File System Provider. ({0})", message), files_1.FileSystemProviderErrorCode.Unknown);
    class IndexedDBFileSystemNode {
        constructor(entry) {
            this.entry = entry;
            this.type = entry.type;
        }
        read(path) {
            return this.doRead(path.split('/').filter(p => p.length));
        }
        doRead(pathParts) {
            if (pathParts.length === 0) {
                return this.entry;
            }
            if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL('Internal error reading from IndexedDBFSNode -- expected directory at ' + this.entry.path);
            }
            const next = this.entry.children.get(pathParts[0]);
            if (!next) {
                return undefined;
            }
            return next.doRead(pathParts.slice(1));
        }
        delete(path) {
            const toDelete = path.split('/').filter(p => p.length);
            if (toDelete.length === 0) {
                if (this.entry.type !== files_1.FileType.Directory) {
                    throw ERR_UNKNOWN_INTERNAL(`Internal error deleting from IndexedDBFSNode. Expected root entry to be directory`);
                }
                this.entry.children.clear();
            }
            else {
                return this.doDelete(toDelete, path);
            }
        }
        doDelete(pathParts, originalPath) {
            if (pathParts.length === 0) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error deleting from IndexedDBFSNode -- got no deletion path parts (encountered while deleting ${originalPath})`);
            }
            else if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL('Internal error deleting from IndexedDBFSNode -- expected directory at ' + this.entry.path);
            }
            else if (pathParts.length === 1) {
                this.entry.children.delete(pathParts[0]);
            }
            else {
                const next = this.entry.children.get(pathParts[0]);
                if (!next) {
                    throw ERR_UNKNOWN_INTERNAL('Internal error deleting from IndexedDBFSNode -- expected entry at ' + this.entry.path + '/' + next);
                }
                next.doDelete(pathParts.slice(1), originalPath);
            }
        }
        add(path, entry) {
            this.doAdd(path.split('/').filter(p => p.length), entry, path);
        }
        doAdd(pathParts, entry, originalPath) {
            if (pathParts.length === 0) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- adding empty path (encountered while adding ${originalPath})`);
            }
            else if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- parent is not a directory (encountered while adding ${originalPath})`);
            }
            else if (pathParts.length === 1) {
                const next = pathParts[0];
                const existing = this.entry.children.get(next);
                if (entry.type === 'dir') {
                    if (existing?.entry.type === files_1.FileType.File) {
                        throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting file with directory: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                    }
                    this.entry.children.set(next, existing ?? new IndexedDBFileSystemNode({
                        type: files_1.FileType.Directory,
                        path: this.entry.path + '/' + next,
                        children: new Map(),
                    }));
                }
                else {
                    if (existing?.entry.type === files_1.FileType.Directory) {
                        throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting directory with file: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                    }
                    this.entry.children.set(next, new IndexedDBFileSystemNode({
                        type: files_1.FileType.File,
                        path: this.entry.path + '/' + next,
                        size: entry.size,
                    }));
                }
            }
            else if (pathParts.length > 1) {
                const next = pathParts[0];
                let childNode = this.entry.children.get(next);
                if (!childNode) {
                    childNode = new IndexedDBFileSystemNode({
                        children: new Map(),
                        path: this.entry.path + '/' + next,
                        type: files_1.FileType.Directory
                    });
                    this.entry.children.set(next, childNode);
                }
                else if (childNode.type === files_1.FileType.File) {
                    throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting file entry with directory: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                }
                childNode.doAdd(pathParts.slice(1), entry, originalPath);
            }
        }
        print(indentation = '') {
            console.log(indentation + this.entry.path);
            if (this.entry.type === files_1.FileType.Directory) {
                this.entry.children.forEach(child => child.print(indentation + ' '));
            }
        }
    }
    class IndexedDBFileSystemProvider extends lifecycle_1.Disposable {
        constructor(scheme, indexedDB, store, watchCrossWindowChanges) {
            super();
            this.scheme = scheme;
            this.indexedDB = indexedDB;
            this.store = store;
            this.capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.extUri = new resources_1.ExtUri(() => false) /* Case Sensitive */;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onReportError = this._register(new event_1.Emitter());
            this.onReportError = this._onReportError.event;
            this.mtimes = new Map();
            this.fileWriteBatch = [];
            this.writeManyThrottler = new async_1.Throttler();
            if (watchCrossWindowChanges) {
                this.changesBroadcastChannel = this._register(new broadcast_1.BroadcastDataChannel(`vscode.indexedDB.${scheme}.changes`));
                this._register(this.changesBroadcastChannel.onDidReceiveData(changes => {
                    this._onDidChangeFile.fire(changes.map(c => ({ type: c.type, resource: uri_1.URI.revive(c.resource) })));
                }));
            }
        }
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        async mkdir(resource) {
            try {
                const resourceStat = await this.stat(resource);
                if (resourceStat.type === files_1.FileType.File) {
                    throw ERR_FILE_NOT_DIR;
                }
            }
            catch (error) { /* Ignore */ }
            (await this.getFiletree()).add(resource.path, { type: 'dir' });
        }
        async stat(resource) {
            const entry = (await this.getFiletree()).read(resource.path);
            if (entry?.type === files_1.FileType.File) {
                return {
                    type: files_1.FileType.File,
                    ctime: 0,
                    mtime: this.mtimes.get(resource.toString()) || 0,
                    size: entry.size ?? (await this.readFile(resource)).byteLength
                };
            }
            if (entry?.type === files_1.FileType.Directory) {
                return {
                    type: files_1.FileType.Directory,
                    ctime: 0,
                    mtime: 0,
                    size: 0
                };
            }
            throw ERR_FILE_NOT_FOUND;
        }
        async readdir(resource) {
            try {
                const entry = (await this.getFiletree()).read(resource.path);
                if (!entry) {
                    // Dirs aren't saved to disk, so empty dirs will be lost on reload.
                    // Thus we have two options for what happens when you try to read a dir and nothing is found:
                    // - Throw FileSystemProviderErrorCode.FileNotFound
                    // - Return []
                    // We choose to return [] as creating a dir then reading it (even after reload) should not throw an error.
                    return [];
                }
                if (entry.type !== files_1.FileType.Directory) {
                    throw ERR_FILE_NOT_DIR;
                }
                else {
                    return [...entry.children.entries()].map(([name, node]) => [name, node.type]);
                }
            }
            catch (error) {
                this.reportError('readDir', error);
                throw error;
            }
        }
        async readFile(resource) {
            try {
                const result = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => objectStore.get(resource.path));
                if (result === undefined) {
                    throw ERR_FILE_NOT_FOUND;
                }
                const buffer = result instanceof Uint8Array ? result : (0, types_1.isString)(result) ? buffer_1.VSBuffer.fromString(result).buffer : undefined;
                if (buffer === undefined) {
                    throw ERR_UNKNOWN_INTERNAL(`IndexedDB entry at "${resource.path}" in unexpected format`);
                }
                // update cache
                const fileTree = await this.getFiletree();
                fileTree.add(resource.path, { type: 'file', size: buffer.byteLength });
                return buffer;
            }
            catch (error) {
                this.reportError('readFile', error);
                throw error;
            }
        }
        async writeFile(resource, content, opts) {
            try {
                const existing = await this.stat(resource).catch(() => undefined);
                if (existing?.type === files_1.FileType.Directory) {
                    throw ERR_FILE_IS_DIR;
                }
                await this.bulkWrite([[resource, content]]);
            }
            catch (error) {
                this.reportError('writeFile', error);
                throw error;
            }
        }
        async rename(from, to, opts) {
            const fileTree = await this.getFiletree();
            const fromEntry = fileTree.read(from.path);
            if (!fromEntry) {
                throw ERR_FILE_NOT_FOUND;
            }
            const toEntry = fileTree.read(to.path);
            if (toEntry) {
                if (!opts.overwrite) {
                    throw (0, files_1.createFileSystemProviderError)('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
                }
                if (toEntry.type !== fromEntry.type) {
                    throw (0, files_1.createFileSystemProviderError)('Cannot rename files with different types', files_1.FileSystemProviderErrorCode.Unknown);
                }
                // delete the target file if exists
                await this.delete(to, { recursive: true, useTrash: false, atomic: false });
            }
            const toTargetResource = (path) => this.extUri.joinPath(to, this.extUri.relativePath(from, from.with({ path })) || '');
            const sourceEntries = await this.tree(from);
            const sourceFiles = [];
            for (const sourceEntry of sourceEntries) {
                if (sourceEntry[1] === files_1.FileType.File) {
                    sourceFiles.push(sourceEntry);
                }
                else if (sourceEntry[1] === files_1.FileType.Directory) {
                    // add directories to the tree
                    fileTree.add(toTargetResource(sourceEntry[0]).path, { type: 'dir' });
                }
            }
            if (sourceFiles.length) {
                const targetFiles = [];
                const sourceFilesContents = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => sourceFiles.map(([path]) => objectStore.get(path)));
                for (let index = 0; index < sourceFiles.length; index++) {
                    const content = sourceFilesContents[index] instanceof Uint8Array ? sourceFilesContents[index] : (0, types_1.isString)(sourceFilesContents[index]) ? buffer_1.VSBuffer.fromString(sourceFilesContents[index]).buffer : undefined;
                    if (content) {
                        targetFiles.push([toTargetResource(sourceFiles[index][0]), content]);
                    }
                }
                await this.bulkWrite(targetFiles);
            }
            await this.delete(from, { recursive: true, useTrash: false, atomic: false });
        }
        async delete(resource, opts) {
            let stat;
            try {
                stat = await this.stat(resource);
            }
            catch (e) {
                if (e.code === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    return;
                }
                throw e;
            }
            let toDelete;
            if (opts.recursive) {
                const tree = await this.tree(resource);
                toDelete = tree.map(([path]) => path);
            }
            else {
                if (stat.type === files_1.FileType.Directory && (await this.readdir(resource)).length) {
                    throw ERR_DIR_NOT_EMPTY;
                }
                toDelete = [resource.path];
            }
            await this.deleteKeys(toDelete);
            (await this.getFiletree()).delete(resource.path);
            toDelete.forEach(key => this.mtimes.delete(key));
            this.triggerChanges(toDelete.map(path => ({ resource: resource.with({ path }), type: 2 /* FileChangeType.DELETED */ })));
        }
        async tree(resource) {
            const stat = await this.stat(resource);
            const allEntries = [[resource.path, stat.type]];
            if (stat.type === files_1.FileType.Directory) {
                const dirEntries = await this.readdir(resource);
                for (const [key, type] of dirEntries) {
                    const childResource = this.extUri.joinPath(resource, key);
                    allEntries.push([childResource.path, type]);
                    if (type === files_1.FileType.Directory) {
                        const childEntries = await this.tree(childResource);
                        allEntries.push(...childEntries);
                    }
                }
            }
            return allEntries;
        }
        triggerChanges(changes) {
            if (changes.length) {
                this._onDidChangeFile.fire(changes);
                this.changesBroadcastChannel?.postData(changes);
            }
        }
        getFiletree() {
            if (!this.cachedFiletree) {
                this.cachedFiletree = (async () => {
                    const rootNode = new IndexedDBFileSystemNode({
                        children: new Map(),
                        path: '',
                        type: files_1.FileType.Directory
                    });
                    const result = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => objectStore.getAllKeys());
                    const keys = result.map(key => key.toString());
                    keys.forEach(key => rootNode.add(key, { type: 'file' }));
                    return rootNode;
                })();
            }
            return this.cachedFiletree;
        }
        async bulkWrite(files) {
            files.forEach(([resource, content]) => this.fileWriteBatch.push({ content, resource }));
            await this.writeManyThrottler.queue(() => this.writeMany());
            const fileTree = await this.getFiletree();
            for (const [resource, content] of files) {
                fileTree.add(resource.path, { type: 'file', size: content.byteLength });
                this.mtimes.set(resource.toString(), Date.now());
            }
            this.triggerChanges(files.map(([resource]) => ({ resource, type: 0 /* FileChangeType.UPDATED */ })));
        }
        async writeMany() {
            if (this.fileWriteBatch.length) {
                const fileBatch = this.fileWriteBatch.splice(0, this.fileWriteBatch.length);
                try {
                    await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => fileBatch.map(entry => {
                        return objectStore.put(entry.content, entry.resource.path);
                    }));
                }
                catch (ex) {
                    if (ex instanceof DOMException && ex.name === 'QuotaExceededError') {
                        throw ERR_FILE_EXCEEDS_STORAGE_QUOTA;
                    }
                    throw ex;
                }
            }
        }
        async deleteKeys(keys) {
            if (keys.length) {
                await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => keys.map(key => objectStore.delete(key)));
            }
        }
        async reset() {
            await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => objectStore.clear());
        }
        reportError(operation, error) {
            this._onReportError.fire({ scheme: this.scheme, operation, code: error instanceof files_1.FileSystemProviderError || error instanceof indexedDB_1.DBClosedError ? error.code : 'unknown' });
        }
    }
    exports.IndexedDBFileSystemProvider = IndexedDBFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXhlZERCRmlsZVN5c3RlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9maWxlcy9icm93c2VyL2luZGV4ZWREQkZpbGVTeXN0ZW1Qcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0QmhHLG9HQUFvRztJQUNwRyxNQUFNLGtCQUFrQixHQUFHLElBQUEscUNBQTZCLEVBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHFCQUFxQixDQUFDLEVBQUUsbUNBQTJCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckosTUFBTSxlQUFlLEdBQUcsSUFBQSxxQ0FBNkIsRUFBQyxJQUFBLGNBQVEsRUFBQyxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFLG1DQUEyQixDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDdEosTUFBTSxnQkFBZ0IsR0FBRyxJQUFBLHFDQUE2QixFQUFDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHlCQUF5QixDQUFDLEVBQUUsbUNBQTJCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUMvSixNQUFNLGlCQUFpQixHQUFHLElBQUEscUNBQTZCLEVBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHdCQUF3QixDQUFDLEVBQUUsbUNBQTJCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEosTUFBTSw4QkFBOEIsR0FBRyxJQUFBLHFDQUE2QixFQUFDLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLHNDQUFzQyxDQUFDLEVBQUUsbUNBQTJCLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUV2TSw0QkFBNEI7SUFDNUIsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsSUFBQSxxQ0FBNkIsRUFBQyxJQUFBLGNBQVEsRUFBQyxV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