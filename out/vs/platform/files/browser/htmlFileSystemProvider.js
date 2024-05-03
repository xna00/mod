/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stream", "vs/platform/files/common/files", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, nls_1, uri_1, buffer_1, event_1, lifecycle_1, network_1, path_1, platform_1, resources_1, stream_1, files_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLFileSystemProvider = void 0;
    class HTMLFileSystemProvider {
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        constructor(indexedDB, store, logService) {
            this.indexedDB = indexedDB;
            this.store = store;
            this.logService = logService;
            //#region Events (unsupported)
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            //#endregion
            //#region File Capabilities
            this.extUri = platform_1.isLinux ? resources_1.extUri : resources_1.extUriIgnorePathCase;
            //#endregion
            //#region File/Directoy Handle Registry
            this._files = new Map();
            this._directories = new Map();
        }
        //#region File Metadata Resolving
        async stat(resource) {
            try {
                const handle = await this.getHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, stat', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle)) {
                    const file = await handle.getFile();
                    return {
                        type: files_1.FileType.File,
                        mtime: file.lastModified,
                        ctime: 0,
                        size: file.size
                    };
                }
                return {
                    type: files_1.FileType.Directory,
                    mtime: 0,
                    ctime: 0,
                    size: 0
                };
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async readdir(resource) {
            try {
                const handle = await this.getDirectoryHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, readdir', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                const result = [];
                for await (const [name, child] of handle) {
                    result.push([name, webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(child) ? files_1.FileType.File : files_1.FileType.Directory]);
                }
                return result;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region File Reading/Writing
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer, {
                // Set a highWaterMark to prevent the stream
                // for file upload to produce large buffers
                // in-memory
                highWaterMark: 10
            });
            (async () => {
                try {
                    const handle = await this.getFileHandle(resource);
                    if (!handle) {
                        throw this.createFileSystemProviderError(resource, 'No such file or directory, readFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    const file = await handle.getFile();
                    // Partial file: implemented simply via `readFile`
                    if (typeof opts.length === 'number' || typeof opts.position === 'number') {
                        let buffer = new Uint8Array(await file.arrayBuffer());
                        if (typeof opts?.position === 'number') {
                            buffer = buffer.slice(opts.position);
                        }
                        if (typeof opts?.length === 'number') {
                            buffer = buffer.slice(0, opts.length);
                        }
                        stream.end(buffer);
                    }
                    // Entire file
                    else {
                        const reader = file.stream().getReader();
                        let res = await reader.read();
                        while (!res.done) {
                            if (token.isCancellationRequested) {
                                break;
                            }
                            // Write buffer into stream but make sure to wait
                            // in case the `highWaterMark` is reached
                            await stream.write(res.value);
                            if (token.isCancellationRequested) {
                                break;
                            }
                            res = await reader.read();
                        }
                        stream.end(undefined);
                    }
                }
                catch (error) {
                    stream.error(this.toFileSystemProviderError(error));
                    stream.end();
                }
            })();
            return stream;
        }
        async readFile(resource) {
            try {
                const handle = await this.getFileHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, readFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                const file = await handle.getFile();
                return new Uint8Array(await file.arrayBuffer());
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async writeFile(resource, content, opts) {
            try {
                let handle = await this.getFileHandle(resource);
                // Validate target unless { create: true, overwrite: true }
                if (!opts.create || !opts.overwrite) {
                    if (handle) {
                        if (!opts.overwrite) {
                            throw this.createFileSystemProviderError(resource, 'File already exists, writeFile', files_1.FileSystemProviderErrorCode.FileExists);
                        }
                    }
                    else {
                        if (!opts.create) {
                            throw this.createFileSystemProviderError(resource, 'No such file, writeFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                        }
                    }
                }
                // Create target as needed
                if (!handle) {
                    const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                    if (!parent) {
                        throw this.createFileSystemProviderError(resource, 'No such parent directory, writeFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    handle = await parent.getFileHandle(this.extUri.basename(resource), { create: true });
                    if (!handle) {
                        throw this.createFileSystemProviderError(resource, 'Unable to create file , writeFile', files_1.FileSystemProviderErrorCode.Unknown);
                    }
                }
                // Write to target overwriting any existing contents
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async mkdir(resource) {
            try {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (!parent) {
                    throw this.createFileSystemProviderError(resource, 'No such parent directory, mkdir', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                await parent.getDirectoryHandle(this.extUri.basename(resource), { create: true });
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async delete(resource, opts) {
            try {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (!parent) {
                    throw this.createFileSystemProviderError(resource, 'No such parent directory, delete', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                return parent.removeEntry(this.extUri.basename(resource), { recursive: opts.recursive });
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async rename(from, to, opts) {
            try {
                if (this.extUri.isEqual(from, to)) {
                    return; // no-op if the paths are the same
                }
                // Implement file rename by write + delete
                const fileHandle = await this.getFileHandle(from);
                if (fileHandle) {
                    const file = await fileHandle.getFile();
                    const contents = new Uint8Array(await file.arrayBuffer());
                    await this.writeFile(to, contents, { create: true, overwrite: opts.overwrite, unlock: false, atomic: false });
                    await this.delete(from, { recursive: false, useTrash: false, atomic: false });
                }
                // File API does not support any real rename otherwise
                else {
                    throw this.createFileSystemProviderError(from, (0, nls_1.localize)('fileSystemRenameError', "Rename is only supported for files."), files_1.FileSystemProviderErrorCode.Unavailable);
                }
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region File Watching (unsupported)
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        registerFileHandle(handle) {
            return this.registerHandle(handle, this._files);
        }
        registerDirectoryHandle(handle) {
            return this.registerHandle(handle, this._directories);
        }
        get directories() {
            return this._directories.values();
        }
        async registerHandle(handle, map) {
            let handleId = `/${handle.name}`;
            // Compute a valid handle ID in case this exists already
            if (map.has(handleId) && !await map.get(handleId)?.isSameEntry(handle)) {
                const fileExt = (0, path_1.extname)(handle.name);
                const fileName = (0, path_1.basename)(handle.name, fileExt);
                let handleIdCounter = 1;
                do {
                    handleId = `/${fileName}-${handleIdCounter++}${fileExt}`;
                } while (map.has(handleId) && !await map.get(handleId)?.isSameEntry(handle));
            }
            map.set(handleId, handle);
            // Remember in IndexDB for future lookup
            try {
                await this.indexedDB?.runInTransaction(this.store, 'readwrite', objectStore => objectStore.put(handle, handleId));
            }
            catch (error) {
                this.logService.error(error);
            }
            return uri_1.URI.from({ scheme: network_1.Schemas.file, path: handleId });
        }
        async getHandle(resource) {
            // First: try to find a well known handle first
            let handle = await this.doGetHandle(resource);
            // Second: walk up parent directories and resolve handle if possible
            if (!handle) {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (parent) {
                    const name = resources_1.extUri.basename(resource);
                    try {
                        handle = await parent.getFileHandle(name);
                    }
                    catch (error) {
                        try {
                            handle = await parent.getDirectoryHandle(name);
                        }
                        catch (error) {
                            // Ignore
                        }
                    }
                }
            }
            return handle;
        }
        async getFileHandle(resource) {
            const handle = await this.doGetHandle(resource);
            if (handle instanceof FileSystemFileHandle) {
                return handle;
            }
            const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
            try {
                return await parent?.getFileHandle(resources_1.extUri.basename(resource));
            }
            catch (error) {
                return undefined; // guard against possible DOMException
            }
        }
        async getDirectoryHandle(resource) {
            const handle = await this.doGetHandle(resource);
            if (handle instanceof FileSystemDirectoryHandle) {
                return handle;
            }
            const parentUri = this.extUri.dirname(resource);
            if (this.extUri.isEqual(parentUri, resource)) {
                return undefined; // return when root is reached to prevent infinite recursion
            }
            const parent = await this.getDirectoryHandle(parentUri);
            try {
                return await parent?.getDirectoryHandle(resources_1.extUri.basename(resource));
            }
            catch (error) {
                return undefined; // guard against possible DOMException
            }
        }
        async doGetHandle(resource) {
            // We store file system handles with the `handle.name`
            // and as such require the resource to be on the root
            if (this.extUri.dirname(resource).path !== '/') {
                return undefined;
            }
            const handleId = resource.path.replace(/\/$/, ''); // remove potential slash from the end of the path
            // First: check if we have a known handle stored in memory
            const inMemoryHandle = this._files.get(handleId) ?? this._directories.get(handleId);
            if (inMemoryHandle) {
                return inMemoryHandle;
            }
            // Second: check if we have a persisted handle in IndexedDB
            const persistedHandle = await this.indexedDB?.runInTransaction(this.store, 'readonly', store => store.get(handleId));
            if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemHandle(persistedHandle)) {
                let hasPermissions = await persistedHandle.queryPermission() === 'granted';
                try {
                    if (!hasPermissions) {
                        hasPermissions = await persistedHandle.requestPermission() === 'granted';
                    }
                }
                catch (error) {
                    this.logService.error(error); // this can fail with a DOMException
                }
                if (hasPermissions) {
                    if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(persistedHandle)) {
                        this._files.set(handleId, persistedHandle);
                    }
                    else if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(persistedHandle)) {
                        this._directories.set(handleId, persistedHandle);
                    }
                    return persistedHandle;
                }
            }
            // Third: fail with an error
            throw this.createFileSystemProviderError(resource, 'No file system handle registered', files_1.FileSystemProviderErrorCode.Unavailable);
        }
        //#endregion
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let code = files_1.FileSystemProviderErrorCode.Unknown;
            if (error.name === 'NotAllowedError') {
                error = new Error((0, nls_1.localize)('fileSystemNotAllowedError', "Insufficient permissions. Please retry and allow the operation."));
                code = files_1.FileSystemProviderErrorCode.Unavailable;
            }
            return (0, files_1.createFileSystemProviderError)(error, code);
        }
        createFileSystemProviderError(resource, msg, code) {
            return (0, files_1.createFileSystemProviderError)(new Error(`${msg} (${(0, path_1.normalize)(resource.path)})`), code);
        }
    }
    exports.HTMLFileSystemProvider = HTMLFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbEZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvYnJvd3Nlci9odG1sRmlsZVN5c3RlbVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWtCaEcsTUFBYSxzQkFBc0I7UUFjbEMsSUFBSSxZQUFZO1lBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDekIsSUFBSSxDQUFDLGFBQWE7b0JBQ2pCOzhFQUM2QyxDQUFDO2dCQUUvQyxJQUFJLGtCQUFPLEVBQUUsQ0FBQztvQkFDYixJQUFJLENBQUMsYUFBYSwrREFBb0QsQ0FBQztnQkFDeEUsQ0FBQztZQUNGLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELFlBQVk7UUFHWixZQUNTLFNBQWdDLEVBQ3ZCLEtBQWEsRUFDdEIsVUFBdUI7WUFGdkIsY0FBUyxHQUFULFNBQVMsQ0FBdUI7WUFDdkIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUN0QixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBaENoQyw4QkFBOEI7WUFFckIsNEJBQXVCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztZQUNyQyxvQkFBZSxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFdEMsWUFBWTtZQUVaLDJCQUEyQjtZQUVuQixXQUFNLEdBQUcsa0JBQU8sQ0FBQyxDQUFDLENBQUMsa0JBQU0sQ0FBQyxDQUFDLENBQUMsZ0NBQW9CLENBQUM7WUFvUXpELFlBQVk7WUFFWix1Q0FBdUM7WUFFdEIsV0FBTSxHQUFHLElBQUksR0FBRyxFQUFnQyxDQUFDO1lBQ2pELGlCQUFZLEdBQUcsSUFBSSxHQUFHLEVBQXFDLENBQUM7UUFqUHpFLENBQUM7UUFFTCxpQ0FBaUM7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