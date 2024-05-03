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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/ternarySearchTree", "vs/base/common/network", "vs/base/common/performance", "vs/base/common/resources", "vs/base/common/stream", "vs/nls", "vs/platform/files/common/files", "vs/platform/files/common/io", "vs/platform/log/common/log", "vs/base/common/errors"], function (require, exports, arrays_1, async_1, buffer_1, cancellation_1, event_1, hash_1, iterator_1, lifecycle_1, ternarySearchTree_1, network_1, performance_1, resources_1, stream_1, nls_1, files_1, io_1, log_1, errors_1) {
    "use strict";
    var FileService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileService = void 0;
    let FileService = class FileService extends lifecycle_1.Disposable {
        static { FileService_1 = this; }
        constructor(logService) {
            super();
            this.logService = logService;
            // Choose a buffer size that is a balance between memory needs and
            // manageable IPC overhead. The larger the buffer size, the less
            // roundtrips we have to do for reading/writing data.
            this.BUFFER_SIZE = 256 * 1024;
            //#region File System Provider
            this._onDidChangeFileSystemProviderRegistrations = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderRegistrations = this._onDidChangeFileSystemProviderRegistrations.event;
            this._onWillActivateFileSystemProvider = this._register(new event_1.Emitter());
            this.onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;
            this._onDidChangeFileSystemProviderCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderCapabilities = this._onDidChangeFileSystemProviderCapabilities.event;
            this.provider = new Map();
            //#endregion
            //#region Operation events
            this._onDidRunOperation = this._register(new event_1.Emitter());
            this.onDidRunOperation = this._onDidRunOperation.event;
            //#endregion
            //#region File Watching
            this.internalOnDidFilesChange = this._register(new event_1.Emitter());
            this._onDidUncorrelatedFilesChange = this._register(new event_1.Emitter());
            this.onDidFilesChange = this._onDidUncorrelatedFilesChange.event; // global `onDidFilesChange` skips correlated events
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            this.activeWatchers = new Map();
            //#endregion
            //#region Helpers
            this.writeQueue = this._register(new async_1.ResourceQueue());
        }
        registerProvider(scheme, provider) {
            if (this.provider.has(scheme)) {
                throw new Error(`A filesystem provider for the scheme '${scheme}' is already registered.`);
            }
            (0, performance_1.mark)(`code/registerFilesystem/${scheme}`);
            const providerDisposables = new lifecycle_1.DisposableStore();
            // Add provider with event
            this.provider.set(scheme, provider);
            this._onDidChangeFileSystemProviderRegistrations.fire({ added: true, scheme, provider });
            // Forward events from provider
            providerDisposables.add(provider.onDidChangeFile(changes => {
                const event = new files_1.FileChangesEvent(changes, !this.isPathCaseSensitive(provider));
                // Always emit any event internally
                this.internalOnDidFilesChange.fire(event);
                // Only emit uncorrelated events in the global `onDidFilesChange` event
                if (!event.hasCorrelation()) {
                    this._onDidUncorrelatedFilesChange.fire(event);
                }
            }));
            if (typeof provider.onDidWatchError === 'function') {
                providerDisposables.add(provider.onDidWatchError(error => this._onDidWatchError.fire(new Error(error))));
            }
            providerDisposables.add(provider.onDidChangeCapabilities(() => this._onDidChangeFileSystemProviderCapabilities.fire({ provider, scheme })));
            return (0, lifecycle_1.toDisposable)(() => {
                this._onDidChangeFileSystemProviderRegistrations.fire({ added: false, scheme, provider });
                this.provider.delete(scheme);
                (0, lifecycle_1.dispose)(providerDisposables);
            });
        }
        getProvider(scheme) {
            return this.provider.get(scheme);
        }
        async activateProvider(scheme) {
            // Emit an event that we are about to activate a provider with the given scheme.
            // Listeners can participate in the activation by registering a provider for it.
            const joiners = [];
            this._onWillActivateFileSystemProvider.fire({
                scheme,
                join(promise) {
                    joiners.push(promise);
                },
            });
            if (this.provider.has(scheme)) {
                return; // provider is already here so we can return directly
            }
            // If the provider is not yet there, make sure to join on the listeners assuming
            // that it takes a bit longer to register the file system provider.
            await async_1.Promises.settled(joiners);
        }
        async canHandleResource(resource) {
            // Await activation of potentially extension contributed providers
            await this.activateProvider(resource.scheme);
            return this.hasProvider(resource);
        }
        hasProvider(resource) {
            return this.provider.has(resource.scheme);
        }
        hasCapability(resource, capability) {
            const provider = this.provider.get(resource.scheme);
            return !!(provider && (provider.capabilities & capability));
        }
        listCapabilities() {
            return iterator_1.Iterable.map(this.provider, ([scheme, provider]) => ({ scheme, capabilities: provider.capabilities }));
        }
        async withProvider(resource) {
            // Assert path is absolute
            if (!(0, resources_1.isAbsolutePath)(resource)) {
                throw new files_1.FileOperationError((0, nls_1.localize)('invalidPath', "Unable to resolve filesystem provider with relative file path '{0}'", this.resourceForError(resource)), 8 /* FileOperationResult.FILE_INVALID_PATH */);
            }
            // Activate provider
            await this.activateProvider(resource.scheme);
            // Assert provider
            const provider = this.provider.get(resource.scheme);
            if (!provider) {
                const error = new errors_1.ErrorNoTelemetry();
                error.message = (0, nls_1.localize)('noProviderFound', "ENOPRO: No file system provider found for resource '{0}'", resource.toString());
                throw error;
            }
            return provider;
        }
        async withReadProvider(resource) {
            const provider = await this.withProvider(resource);
            if ((0, files_1.hasOpenReadWriteCloseCapability)(provider) || (0, files_1.hasReadWriteCapability)(provider) || (0, files_1.hasFileReadStreamCapability)(provider)) {
                return provider;
            }
            throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite, FileReadStream nor FileOpenReadWriteClose capability which is needed for the read operation.`);
        }
        async withWriteProvider(resource) {
            const provider = await this.withProvider(resource);
            if ((0, files_1.hasOpenReadWriteCloseCapability)(provider) || (0, files_1.hasReadWriteCapability)(provider)) {
                return provider;
            }
            throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
        }
        async resolve(resource, options) {
            try {
                return await this.doResolveFile(resource, options);
            }
            catch (error) {
                // Specially handle file not found case as file operation result
                if ((0, files_1.toFileSystemProviderErrorCode)(error) === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    throw new files_1.FileOperationError((0, nls_1.localize)('fileNotFoundError', "Unable to resolve nonexistent file '{0}'", this.resourceForError(resource)), 1 /* FileOperationResult.FILE_NOT_FOUND */);
                }
                // Bubble up any other error as is
                throw (0, files_1.ensureFileSystemProviderError)(error);
            }
        }
        async doResolveFile(resource, options) {
            const provider = await this.withProvider(resource);
            const isPathCaseSensitive = this.isPathCaseSensitive(provider);
            const resolveTo = options?.resolveTo;
            const resolveSingleChildDescendants = options?.resolveSingleChildDescendants;
            const resolveMetadata = options?.resolveMetadata;
            const stat = await provider.stat(resource);
            let trie;
            return this.toFileStat(provider, resource, stat, undefined, !!resolveMetadata, (stat, siblings) => {
                // lazy trie to check for recursive resolving
                if (!trie) {
                    trie = ternarySearchTree_1.TernarySearchTree.forUris(() => !isPathCaseSensitive);
                    trie.set(resource, true);
                    if (resolveTo) {
                        trie.fill(true, resolveTo);
                    }
                }
                // check for recursive resolving
                if (trie.get(stat.resource) || trie.findSuperstr(stat.resource.with({ query: null, fragment: null } /* required for https://github.com/microsoft/vscode/issues/128151 */))) {
                    return true;
                }
                // check for resolving single child folders
                if (stat.isDirectory && resolveSingleChildDescendants) {
                    return siblings === 1;
                }
                return false;
            });
        }
        async toFileStat(provider, resource, stat, siblings, resolveMetadata, recurse) {
            const { providerExtUri } = this.getExtUri(provider);
            // convert to file stat
            const fileStat = {
                resource,
                name: providerExtUri.basename(resource),
                isFile: (stat.type & files_1.FileType.File) !== 0,
                isDirectory: (stat.type & files_1.FileType.Directory) !== 0,
                isSymbolicLink: (stat.type & files_1.FileType.SymbolicLink) !== 0,
                mtime: stat.mtime,
                ctime: stat.ctime,
                size: stat.size,
                readonly: Boolean((stat.permissions ?? 0) & files_1.FilePermission.Readonly) || Boolean(provider.capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */),
                locked: Boolean((stat.permissions ?? 0) & files_1.FilePermission.Locked),
                etag: (0, files_1.etag)({ mtime: stat.mtime, size: stat.size }),
                children: undefined
            };
            // check to recurse for directories
            if (fileStat.isDirectory && recurse(fileStat, siblings)) {
                try {
                    const entries = await provider.readdir(resource);
                    const resolvedEntries = await async_1.Promises.settled(entries.map(async ([name, type]) => {
                        try {
                            const childResource = providerExtUri.joinPath(resource, name);
                            const childStat = resolveMetadata ? await provider.stat(childResource) : { type };
                            return await this.toFileStat(provider, childResource, childStat, entries.length, resolveMetadata, recurse);
                        }
                        catch (error) {
                            this.logService.trace(error);
                            return null; // can happen e.g. due to permission errors
                        }
                    }));
                    // make sure to get rid of null values that signal a failure to resolve a particular entry
                    fileStat.children = (0, arrays_1.coalesce)(resolvedEntries);
                }
                catch (error) {
                    this.logService.trace(error);
                    fileStat.children = []; // gracefully handle errors, we may not have permissions to read
                }
                return fileStat;
            }
            return fileStat;
        }
        async resolveAll(toResolve) {
            return async_1.Promises.settled(toResolve.map(async (entry) => {
                try {
                    return { stat: await this.doResolveFile(entry.resource, entry.options), success: true };
                }
                catch (error) {
                    this.logService.trace(error);
                    return { stat: undefined, success: false };
                }
            }));
        }
        async stat(resource) {
            const provider = await this.withProvider(resource);
            const stat = await provider.stat(resource);
            return this.toFileStat(provider, resource, stat, undefined, true, () => false /* Do not resolve any children */);
        }
        async exists(resource) {
            const provider = await this.withProvider(resource);
            try {
                const stat = await provider.stat(resource);
                return !!stat;
            }
            catch (error) {
                return false;
            }
        }
        //#endregion
        //#region File Reading/Writing
        async canCreateFile(resource, options) {
            try {
                await this.doValidateCreateFile(resource, options);
            }
            catch (error) {
                return error;
            }
            return true;
        }
        async doValidateCreateFile(resource, options) {
            // validate overwrite
            if (!options?.overwrite && await this.exists(resource)) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileExists', "Unable to create file '{0}' that already exists when overwrite flag is not set", this.resourceForError(resource)), 3 /* FileOperationResult.FILE_MODIFIED_SINCE */, options);
            }
        }
        async createFile(resource, bufferOrReadableOrStream = buffer_1.VSBuffer.fromString(''), options) {
            // validate
            await this.doValidateCreateFile(resource, options);
            // do write into file (this will create it too)
            const fileStat = await this.writeFile(resource, bufferOrReadableOrStream);
            // events
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 0 /* FileOperation.CREATE */, fileStat));
            return fileStat;
        }
        async writeFile(resource, bufferOrReadableOrStream, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(resource), resource);
            const { providerExtUri } = this.getExtUri(provider);
            let writeFileOptions = options;
            if ((0, files_1.hasFileAtomicWriteCapability)(provider) && !writeFileOptions?.atomic) {
                const enforcedAtomicWrite = provider.enforceAtomicWriteFile?.(resource);
                if (enforcedAtomicWrite) {
                    writeFileOptions = { ...options, atomic: enforcedAtomicWrite };
                }
            }
            try {
                // validate write
                const stat = await this.validateWriteFile(provider, resource, writeFileOptions);
                // mkdir recursively as needed
                if (!stat) {
                    await this.mkdirp(provider, providerExtUri.dirname(resource));
                }
                // optimization: if the provider has unbuffered write capability and the data
                // to write is not a buffer, we consume up to 3 chunks and try to write the data
                // unbuffered to reduce the overhead. If the stream or readable has more data
                // to provide we continue to write buffered.
                let bufferOrReadableOrStreamOrBufferedStream;
                if ((0, files_1.hasReadWriteCapability)(provider) && !(bufferOrReadableOrStream instanceof buffer_1.VSBuffer)) {
                    if ((0, stream_1.isReadableStream)(bufferOrReadableOrStream)) {
                        const bufferedStream = await (0, stream_1.peekStream)(bufferOrReadableOrStream, 3);
                        if (bufferedStream.ended) {
                            bufferOrReadableOrStreamOrBufferedStream = buffer_1.VSBuffer.concat(bufferedStream.buffer);
                        }
                        else {
                            bufferOrReadableOrStreamOrBufferedStream = bufferedStream;
                        }
                    }
                    else {
                        bufferOrReadableOrStreamOrBufferedStream = (0, stream_1.peekReadable)(bufferOrReadableOrStream, data => buffer_1.VSBuffer.concat(data), 3);
                    }
                }
                else {
                    bufferOrReadableOrStreamOrBufferedStream = bufferOrReadableOrStream;
                }
                // write file: unbuffered
                if (!(0, files_1.hasOpenReadWriteCloseCapability)(provider) || // buffered writing is unsupported
                    ((0, files_1.hasReadWriteCapability)(provider) && bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer) || // data is a full buffer already
                    ((0, files_1.hasReadWriteCapability)(provider) && (0, files_1.hasFileAtomicWriteCapability)(provider) && writeFileOptions?.atomic) // atomic write forces unbuffered write if the provider supports it
                ) {
                    await this.doWriteUnbuffered(provider, resource, writeFileOptions, bufferOrReadableOrStreamOrBufferedStream);
                }
                // write file: buffered
                else {
                    await this.doWriteBuffered(provider, resource, writeFileOptions, bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer ? (0, buffer_1.bufferToReadable)(bufferOrReadableOrStreamOrBufferedStream) : bufferOrReadableOrStreamOrBufferedStream);
                }
                // events
                this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 4 /* FileOperation.WRITE */));
            }
            catch (error) {
                throw new files_1.FileOperationError((0, nls_1.localize)('err.write', "Unable to write file '{0}' ({1})", this.resourceForError(resource), (0, files_1.ensureFileSystemProviderError)(error).toString()), (0, files_1.toFileOperationResult)(error), writeFileOptions);
            }
            return this.resolve(resource, { resolveMetadata: true });
        }
        async validateWriteFile(provider, resource, options) {
            // Validate unlock support
            const unlock = !!options?.unlock;
            if (unlock && !(provider.capabilities & 8192 /* FileSystemProviderCapabilities.FileWriteUnlock */)) {
                throw new Error((0, nls_1.localize)('writeFailedUnlockUnsupported', "Unable to unlock file '{0}' because provider does not support it.", this.resourceForError(resource)));
            }
            // Validate atomic support
            const atomic = !!options?.atomic;
            if (atomic) {
                if (!(provider.capabilities & 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */)) {
                    throw new Error((0, nls_1.localize)('writeFailedAtomicUnsupported1', "Unable to atomically write file '{0}' because provider does not support it.", this.resourceForError(resource)));
                }
                if (!(provider.capabilities & 2 /* FileSystemProviderCapabilities.FileReadWrite */)) {
                    throw new Error((0, nls_1.localize)('writeFailedAtomicUnsupported2', "Unable to atomically write file '{0}' because provider does not support unbuffered writes.", this.resourceForError(resource)));
                }
                if (unlock) {
                    throw new Error((0, nls_1.localize)('writeFailedAtomicUnlock', "Unable to unlock file '{0}' because atomic write is enabled.", this.resourceForError(resource)));
                }
            }
            // Validate via file stat meta data
            let stat = undefined;
            try {
                stat = await provider.stat(resource);
            }
            catch (error) {
                return undefined; // file might not exist
            }
            // File cannot be directory
            if ((stat.type & files_1.FileType.Directory) !== 0) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileIsDirectoryWriteError', "Unable to write file '{0}' that is actually a directory", this.resourceForError(resource)), 0 /* FileOperationResult.FILE_IS_DIRECTORY */, options);
            }
            // File cannot be readonly
            this.throwIfFileIsReadonly(resource, stat);
            // Dirty write prevention: if the file on disk has been changed and does not match our expected
            // mtime and etag, we bail out to prevent dirty writing.
            //
            // First, we check for a mtime that is in the future before we do more checks. The assumption is
            // that only the mtime is an indicator for a file that has changed on disk.
            //
            // Second, if the mtime has advanced, we compare the size of the file on disk with our previous
            // one using the etag() function. Relying only on the mtime check has prooven to produce false
            // positives due to file system weirdness (especially around remote file systems). As such, the
            // check for size is a weaker check because it can return a false negative if the file has changed
            // but to the same length. This is a compromise we take to avoid having to produce checksums of
            // the file content for comparison which would be much slower to compute.
            if (typeof options?.mtime === 'number' && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED &&
                typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
                options.mtime < stat.mtime && options.etag !== (0, files_1.etag)({ mtime: options.mtime /* not using stat.mtime for a reason, see above */, size: stat.size })) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileModifiedError', "File Modified Since"), 3 /* FileOperationResult.FILE_MODIFIED_SINCE */, options);
            }
            return stat;
        }
        async readFile(resource, options, token) {
            const provider = await this.withReadProvider(resource);
            if (options?.atomic) {
                return this.doReadFileAtomic(provider, resource, options, token);
            }
            return this.doReadFile(provider, resource, options, token);
        }
        async doReadFileAtomic(provider, resource, options, token) {
            return new Promise((resolve, reject) => {
                this.writeQueue.queueFor(resource, async () => {
                    try {
                        const content = await this.doReadFile(provider, resource, options, token);
                        resolve(content);
                    }
                    catch (error) {
                        reject(error);
                    }
                }, this.getExtUri(provider).providerExtUri);
            });
        }
        async doReadFile(provider, resource, options, token) {
            const stream = await this.doReadFileStream(provider, resource, {
                ...options,
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true
            }, token);
            return {
                ...stream,
                value: await (0, buffer_1.streamToBuffer)(stream.value)
            };
        }
        async readFileStream(resource, options, token) {
            const provider = await this.withReadProvider(resource);
            return this.doReadFileStream(provider, resource, options, token);
        }
        async doReadFileStream(provider, resource, options, token) {
            // install a cancellation token that gets cancelled
            // when any error occurs. this allows us to resolve
            // the content of the file while resolving metadata
            // but still cancel the operation in certain cases.
            //
            // in addition, we pass the optional token in that
            // we got from the outside to even allow for external
            // cancellation of the read operation.
            const cancellableSource = new cancellation_1.CancellationTokenSource(token);
            let readFileOptions = options;
            if ((0, files_1.hasFileAtomicReadCapability)(provider) && provider.enforceAtomicReadFile?.(resource)) {
                readFileOptions = { ...options, atomic: true };
            }
            // validate read operation
            const statPromise = this.validateReadFile(resource, readFileOptions).then(stat => stat, error => {
                cancellableSource.dispose(true);
                throw error;
            });
            let fileStream = undefined;
            try {
                // if the etag is provided, we await the result of the validation
                // due to the likelihood of hitting a NOT_MODIFIED_SINCE result.
                // otherwise, we let it run in parallel to the file reading for
                // optimal startup performance.
                if (typeof readFileOptions?.etag === 'string' && readFileOptions.etag !== files_1.ETAG_DISABLED) {
                    await statPromise;
                }
                // read unbuffered
                if ((readFileOptions?.atomic && (0, files_1.hasFileAtomicReadCapability)(provider)) || // atomic reads are always unbuffered
                    !((0, files_1.hasOpenReadWriteCloseCapability)(provider) || (0, files_1.hasFileReadStreamCapability)(provider)) || // provider has no buffered capability
                    ((0, files_1.hasReadWriteCapability)(provider) && readFileOptions?.preferUnbuffered) // unbuffered read is preferred
                ) {
                    fileStream = this.readFileUnbuffered(provider, resource, readFileOptions);
                }
                // read streamed (always prefer over primitive buffered read)
                else if ((0, files_1.hasFileReadStreamCapability)(provider)) {
                    fileStream = this.readFileStreamed(provider, resource, cancellableSource.token, readFileOptions);
                }
                // read buffered
                else {
                    fileStream = this.readFileBuffered(provider, resource, cancellableSource.token, readFileOptions);
                }
                fileStream.on('end', () => cancellableSource.dispose());
                fileStream.on('error', () => cancellableSource.dispose());
                const fileStat = await statPromise;
                return {
                    ...fileStat,
                    value: fileStream
                };
            }
            catch (error) {
                // Await the stream to finish so that we exit this method
                // in a consistent state with file handles closed
                // (https://github.com/microsoft/vscode/issues/114024)
                if (fileStream) {
                    await (0, stream_1.consumeStream)(fileStream);
                }
                // Re-throw errors as file operation errors but preserve
                // specific errors (such as not modified since)
                throw this.restoreReadError(error, resource, readFileOptions);
            }
        }
        restoreReadError(error, resource, options) {
            const message = (0, nls_1.localize)('err.read', "Unable to read file '{0}' ({1})", this.resourceForError(resource), (0, files_1.ensureFileSystemProviderError)(error).toString());
            if (error instanceof files_1.NotModifiedSinceFileOperationError) {
                return new files_1.NotModifiedSinceFileOperationError(message, error.stat, options);
            }
            if (error instanceof files_1.TooLargeFileOperationError) {
                return new files_1.TooLargeFileOperationError(message, error.fileOperationResult, error.size, error.options);
            }
            return new files_1.FileOperationError(message, (0, files_1.toFileOperationResult)(error), options);
        }
        readFileStreamed(provider, resource, token, options = Object.create(null)) {
            const fileStream = provider.readFileStream(resource, options, token);
            return (0, stream_1.transform)(fileStream, {
                data: data => data instanceof buffer_1.VSBuffer ? data : buffer_1.VSBuffer.wrap(data),
                error: error => this.restoreReadError(error, resource, options)
            }, data => buffer_1.VSBuffer.concat(data));
        }
        readFileBuffered(provider, resource, token, options = Object.create(null)) {
            const stream = (0, buffer_1.newWriteableBufferStream)();
            (0, io_1.readFileIntoStream)(provider, resource, stream, data => data, {
                ...options,
                bufferSize: this.BUFFER_SIZE,
                errorTransformer: error => this.restoreReadError(error, resource, options)
            }, token);
            return stream;
        }
        readFileUnbuffered(provider, resource, options) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data));
            // Read the file into the stream async but do not wait for
            // this to complete because streams work via events
            (async () => {
                try {
                    let buffer;
                    if (options?.atomic && (0, files_1.hasFileAtomicReadCapability)(provider)) {
                        buffer = await provider.readFile(resource, { atomic: true });
                    }
                    else {
                        buffer = await provider.readFile(resource);
                    }
                    // respect position option
                    if (typeof options?.position === 'number') {
                        buffer = buffer.slice(options.position);
                    }
                    // respect length option
                    if (typeof options?.length === 'number') {
                        buffer = buffer.slice(0, options.length);
                    }
                    // Throw if file is too large to load
                    this.validateReadFileLimits(resource, buffer.byteLength, options);
                    // End stream with data
                    stream.end(buffer_1.VSBuffer.wrap(buffer));
                }
                catch (err) {
                    stream.error(err);
                    stream.end();
                }
            })();
            return stream;
        }
        async validateReadFile(resource, options) {
            const stat = await this.resolve(resource, { resolveMetadata: true });
            // Throw if resource is a directory
            if (stat.isDirectory) {
                throw new files_1.FileOperationError((0, nls_1.localize)('fileIsDirectoryReadError', "Unable to read file '{0}' that is actually a directory", this.resourceForError(resource)), 0 /* FileOperationResult.FILE_IS_DIRECTORY */, options);
            }
            // Throw if file not modified since (unless disabled)
            if (typeof options?.etag === 'string' && options.etag !== files_1.ETAG_DISABLED && options.etag === stat.etag) {
                throw new files_1.NotModifiedSinceFileOperationError((0, nls_1.localize)('fileNotModifiedError', "File not modified since"), stat, options);
            }
            // Throw if file is too large to load
            this.validateReadFileLimits(resource, stat.size, options);
            return stat;
        }
        validateReadFileLimits(resource, size, options) {
            if (typeof options?.limits?.size === 'number' && size > options.limits.size) {
                throw new files_1.TooLargeFileOperationError((0, nls_1.localize)('fileTooLargeError', "Unable to read file '{0}' that is too large to open", this.resourceForError(resource)), 7 /* FileOperationResult.FILE_TOO_LARGE */, size, options);
            }
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async canMove(source, target, overwrite) {
            return this.doCanMoveCopy(source, target, 'move', overwrite);
        }
        async canCopy(source, target, overwrite) {
            return this.doCanMoveCopy(source, target, 'copy', overwrite);
        }
        async doCanMoveCopy(source, target, mode, overwrite) {
            if (source.toString() !== target.toString()) {
                try {
                    const sourceProvider = mode === 'move' ? this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source) : await this.withReadProvider(source);
                    const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
                    await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
                }
                catch (error) {
                    return error;
                }
            }
            return true;
        }
        async move(source, target, overwrite) {
            const sourceProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            // move
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'move', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(source, mode === 'move' ? 2 /* FileOperation.MOVE */ : 3 /* FileOperation.COPY */, fileStat));
            return fileStat;
        }
        async copy(source, target, overwrite) {
            const sourceProvider = await this.withReadProvider(source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            // copy
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(source, mode === 'copy' ? 3 /* FileOperation.COPY */ : 2 /* FileOperation.MOVE */, fileStat));
            return fileStat;
        }
        async doMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            if (source.toString() === target.toString()) {
                return mode; // simulate node.js behaviour here and do a no-op if paths match
            }
            // validation
            const { exists, isSameResourceWithDifferentPathCase } = await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
            // delete as needed (unless target is same resurce with different path case)
            if (exists && !isSameResourceWithDifferentPathCase && overwrite) {
                await this.del(target, { recursive: true });
            }
            // create parent folders
            await this.mkdirp(targetProvider, this.getExtUri(targetProvider).providerExtUri.dirname(target));
            // copy source => target
            if (mode === 'copy') {
                // same provider with fast copy: leverage copy() functionality
                if (sourceProvider === targetProvider && (0, files_1.hasFileFolderCopyCapability)(sourceProvider)) {
                    await sourceProvider.copy(source, target, { overwrite });
                }
                // when copying via buffer/unbuffered, we have to manually
                // traverse the source if it is a folder and not a file
                else {
                    const sourceFile = await this.resolve(source);
                    if (sourceFile.isDirectory) {
                        await this.doCopyFolder(sourceProvider, sourceFile, targetProvider, target);
                    }
                    else {
                        await this.doCopyFile(sourceProvider, source, targetProvider, target);
                    }
                }
                return mode;
            }
            // move source => target
            else {
                // same provider: leverage rename() functionality
                if (sourceProvider === targetProvider) {
                    await sourceProvider.rename(source, target, { overwrite });
                    return mode;
                }
                // across providers: copy to target & delete at source
                else {
                    await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', overwrite);
                    await this.del(source, { recursive: true });
                    return 'copy';
                }
            }
        }
        async doCopyFile(sourceProvider, source, targetProvider, target) {
            // copy: source (buffered) => target (buffered)
            if ((0, files_1.hasOpenReadWriteCloseCapability)(sourceProvider) && (0, files_1.hasOpenReadWriteCloseCapability)(targetProvider)) {
                return this.doPipeBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (buffered) => target (unbuffered)
            if ((0, files_1.hasOpenReadWriteCloseCapability)(sourceProvider) && (0, files_1.hasReadWriteCapability)(targetProvider)) {
                return this.doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (buffered)
            if ((0, files_1.hasReadWriteCapability)(sourceProvider) && (0, files_1.hasOpenReadWriteCloseCapability)(targetProvider)) {
                return this.doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (unbuffered)
            if ((0, files_1.hasReadWriteCapability)(sourceProvider) && (0, files_1.hasReadWriteCapability)(targetProvider)) {
                return this.doPipeUnbuffered(sourceProvider, source, targetProvider, target);
            }
        }
        async doCopyFolder(sourceProvider, sourceFolder, targetProvider, targetFolder) {
            // create folder in target
            await targetProvider.mkdir(targetFolder);
            // create children in target
            if (Array.isArray(sourceFolder.children)) {
                await async_1.Promises.settled(sourceFolder.children.map(async (sourceChild) => {
                    const targetChild = this.getExtUri(targetProvider).providerExtUri.joinPath(targetFolder, sourceChild.name);
                    if (sourceChild.isDirectory) {
                        return this.doCopyFolder(sourceProvider, await this.resolve(sourceChild.resource), targetProvider, targetChild);
                    }
                    else {
                        return this.doCopyFile(sourceProvider, sourceChild.resource, targetProvider, targetChild);
                    }
                }));
            }
        }
        async doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            let isSameResourceWithDifferentPathCase = false;
            // Check if source is equal or parent to target (requires providers to be the same)
            if (sourceProvider === targetProvider) {
                const { providerExtUri, isPathCaseSensitive } = this.getExtUri(sourceProvider);
                if (!isPathCaseSensitive) {
                    isSameResourceWithDifferentPathCase = providerExtUri.isEqual(source, target);
                }
                if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                    throw new Error((0, nls_1.localize)('unableToMoveCopyError1', "Unable to copy when source '{0}' is same as target '{1}' with different path case on a case insensitive file system", this.resourceForError(source), this.resourceForError(target)));
                }
                if (!isSameResourceWithDifferentPathCase && providerExtUri.isEqualOrParent(target, source)) {
                    throw new Error((0, nls_1.localize)('unableToMoveCopyError2', "Unable to move/copy when source '{0}' is parent of target '{1}'.", this.resourceForError(source), this.resourceForError(target)));
                }
            }
            // Extra checks if target exists and this is not a rename
            const exists = await this.exists(target);
            if (exists && !isSameResourceWithDifferentPathCase) {
                // Bail out if target exists and we are not about to overwrite
                if (!overwrite) {
                    throw new files_1.FileOperationError((0, nls_1.localize)('unableToMoveCopyError3', "Unable to move/copy '{0}' because target '{1}' already exists at destination.", this.resourceForError(source), this.resourceForError(target)), 4 /* FileOperationResult.FILE_MOVE_CONFLICT */);
                }
                // Special case: if the target is a parent of the source, we cannot delete
                // it as it would delete the source as well. In this case we have to throw
                if (sourceProvider === targetProvider) {
                    const { providerExtUri } = this.getExtUri(sourceProvider);
                    if (providerExtUri.isEqualOrParent(source, target)) {
                        throw new Error((0, nls_1.localize)('unableToMoveCopyError4', "Unable to move/copy '{0}' into '{1}' since a file would replace the folder it is contained in.", this.resourceForError(source), this.resourceForError(target)));
                    }
                }
            }
            return { exists, isSameResourceWithDifferentPathCase };
        }
        getExtUri(provider) {
            const isPathCaseSensitive = this.isPathCaseSensitive(provider);
            return {
                providerExtUri: isPathCaseSensitive ? resources_1.extUri : resources_1.extUriIgnorePathCase,
                isPathCaseSensitive
            };
        }
        isPathCaseSensitive(provider) {
            return !!(provider.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
        }
        async createFolder(resource) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
            // mkdir recursively
            await this.mkdirp(provider, resource);
            // events
            const fileStat = await this.resolve(resource, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 0 /* FileOperation.CREATE */, fileStat));
            return fileStat;
        }
        async mkdirp(provider, directory) {
            const directoriesToCreate = [];
            // mkdir until we reach root
            const { providerExtUri } = this.getExtUri(provider);
            while (!providerExtUri.isEqual(directory, providerExtUri.dirname(directory))) {
                try {
                    const stat = await provider.stat(directory);
                    if ((stat.type & files_1.FileType.Directory) === 0) {
                        throw new Error((0, nls_1.localize)('mkdirExistsError', "Unable to create folder '{0}' that already exists but is not a directory", this.resourceForError(directory)));
                    }
                    break; // we have hit a directory that exists -> good
                }
                catch (error) {
                    // Bubble up any other error that is not file not found
                    if ((0, files_1.toFileSystemProviderErrorCode)(error) !== files_1.FileSystemProviderErrorCode.FileNotFound) {
                        throw error;
                    }
                    // Upon error, remember directories that need to be created
                    directoriesToCreate.push(providerExtUri.basename(directory));
                    // Continue up
                    directory = providerExtUri.dirname(directory);
                }
            }
            // Create directories as needed
            for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
                directory = providerExtUri.joinPath(directory, directoriesToCreate[i]);
                try {
                    await provider.mkdir(directory);
                }
                catch (error) {
                    if ((0, files_1.toFileSystemProviderErrorCode)(error) !== files_1.FileSystemProviderErrorCode.FileExists) {
                        // For mkdirp() we tolerate that the mkdir() call fails
                        // in case the folder already exists. This follows node.js
                        // own implementation of fs.mkdir({ recursive: true }) and
                        // reduces the chances of race conditions leading to errors
                        // if multiple calls try to create the same folders
                        // As such, we only throw an error here if it is other than
                        // the fact that the file already exists.
                        // (see also https://github.com/microsoft/vscode/issues/89834)
                        throw error;
                    }
                }
            }
        }
        async canDelete(resource, options) {
            try {
                await this.doValidateDelete(resource, options);
            }
            catch (error) {
                return error;
            }
            return true;
        }
        async doValidateDelete(resource, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
            // Validate trash support
            const useTrash = !!options?.useTrash;
            if (useTrash && !(provider.capabilities & 4096 /* FileSystemProviderCapabilities.Trash */)) {
                throw new Error((0, nls_1.localize)('deleteFailedTrashUnsupported', "Unable to delete file '{0}' via trash because provider does not support it.", this.resourceForError(resource)));
            }
            // Validate atomic support
            const atomic = options?.atomic;
            if (atomic && !(provider.capabilities & 65536 /* FileSystemProviderCapabilities.FileAtomicDelete */)) {
                throw new Error((0, nls_1.localize)('deleteFailedAtomicUnsupported', "Unable to delete file '{0}' atomically because provider does not support it.", this.resourceForError(resource)));
            }
            if (useTrash && atomic) {
                throw new Error((0, nls_1.localize)('deleteFailedTrashAndAtomicUnsupported', "Unable to atomically delete file '{0}' because using trash is enabled.", this.resourceForError(resource)));
            }
            // Validate delete
            let stat = undefined;
            try {
                stat = await provider.stat(resource);
            }
            catch (error) {
                // Handled later
            }
            if (stat) {
                this.throwIfFileIsReadonly(resource, stat);
            }
            else {
                throw new files_1.FileOperationError((0, nls_1.localize)('deleteFailedNotFound', "Unable to delete nonexistent file '{0}'", this.resourceForError(resource)), 1 /* FileOperationResult.FILE_NOT_FOUND */);
            }
            // Validate recursive
            const recursive = !!options?.recursive;
            if (!recursive) {
                const stat = await this.resolve(resource);
                if (stat.isDirectory && Array.isArray(stat.children) && stat.children.length > 0) {
                    throw new Error((0, nls_1.localize)('deleteFailedNonEmptyFolder', "Unable to delete non-empty folder '{0}'.", this.resourceForError(resource)));
                }
            }
            return provider;
        }
        async del(resource, options) {
            const provider = await this.doValidateDelete(resource, options);
            let deleteFileOptions = options;
            if ((0, files_1.hasFileAtomicDeleteCapability)(provider) && !deleteFileOptions?.atomic) {
                const enforcedAtomicDelete = provider.enforceAtomicDelete?.(resource);
                if (enforcedAtomicDelete) {
                    deleteFileOptions = { ...options, atomic: enforcedAtomicDelete };
                }
            }
            const useTrash = !!deleteFileOptions?.useTrash;
            const recursive = !!deleteFileOptions?.recursive;
            const atomic = deleteFileOptions?.atomic ?? false;
            // Delete through provider
            await provider.delete(resource, { recursive, useTrash, atomic });
            // Events
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 1 /* FileOperation.DELETE */));
        }
        //#endregion
        //#region Clone File
        async cloneFile(source, target) {
            const sourceProvider = await this.withProvider(source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            if (sourceProvider === targetProvider && this.getExtUri(sourceProvider).providerExtUri.isEqual(source, target)) {
                return; // return early if paths are equal
            }
            // same provider, use `cloneFile` when native support is provided
            if (sourceProvider === targetProvider && (0, files_1.hasFileCloneCapability)(sourceProvider)) {
                return sourceProvider.cloneFile(source, target);
            }
            // otherwise, either providers are different or there is no native
            // `cloneFile` support, then we fallback to emulate a clone as best
            // as we can with the other primitives
            // create parent folders
            await this.mkdirp(targetProvider, this.getExtUri(targetProvider).providerExtUri.dirname(target));
            // leverage `copy` method if provided and providers are identical
            // queue on the source to ensure atomic read
            if (sourceProvider === targetProvider && (0, files_1.hasFileFolderCopyCapability)(sourceProvider)) {
                return this.writeQueue.queueFor(source, () => sourceProvider.copy(source, target, { overwrite: true }), this.getExtUri(sourceProvider).providerExtUri);
            }
            // otherwise copy via buffer/unbuffered and use a write queue
            // on the source to ensure atomic operation as much as possible
            return this.writeQueue.queueFor(source, () => this.doCopyFile(sourceProvider, source, targetProvider, target), this.getExtUri(sourceProvider).providerExtUri);
        }
        static { this.WATCHER_CORRELATION_IDS = 0; }
        createWatcher(resource, options) {
            return this.watch(resource, {
                ...options,
                // Explicitly set a correlation id so that file events that originate
                // from requests from extensions are exclusively routed back to the
                // extension host and not into the workbench.
                correlationId: FileService_1.WATCHER_CORRELATION_IDS++
            });
        }
        watch(resource, options = { recursive: false, excludes: [] }) {
            const disposables = new lifecycle_1.DisposableStore();
            // Forward watch request to provider and wire in disposables
            let watchDisposed = false;
            let disposeWatch = () => { watchDisposed = true; };
            disposables.add((0, lifecycle_1.toDisposable)(() => disposeWatch()));
            // Watch and wire in disposable which is async but
            // check if we got disposed meanwhile and forward
            (async () => {
                try {
                    const disposable = await this.doWatch(resource, options);
                    if (watchDisposed) {
                        (0, lifecycle_1.dispose)(disposable);
                    }
                    else {
                        disposeWatch = () => (0, lifecycle_1.dispose)(disposable);
                    }
                }
                catch (error) {
                    this.logService.error(error);
                }
            })();
            // When a correlation identifier is set, return a specific
            // watcher that only emits events matching that correalation.
            const correlationId = options.correlationId;
            if (typeof correlationId === 'number') {
                const fileChangeEmitter = disposables.add(new event_1.Emitter());
                disposables.add(this.internalOnDidFilesChange.event(e => {
                    if (e.correlates(correlationId)) {
                        fileChangeEmitter.fire(e);
                    }
                }));
                const watcher = {
                    onDidChange: fileChangeEmitter.event,
                    dispose: () => disposables.dispose()
                };
                return watcher;
            }
            return disposables;
        }
        async doWatch(resource, options) {
            const provider = await this.withProvider(resource);
            // Deduplicate identical watch requests
            const watchHash = (0, hash_1.hash)([this.getExtUri(provider).providerExtUri.getComparisonKey(resource), options]);
            let watcher = this.activeWatchers.get(watchHash);
            if (!watcher) {
                watcher = {
                    count: 0,
                    disposable: provider.watch(resource, options)
                };
                this.activeWatchers.set(watchHash, watcher);
            }
            // Increment usage counter
            watcher.count += 1;
            return (0, lifecycle_1.toDisposable)(() => {
                if (watcher) {
                    // Unref
                    watcher.count--;
                    // Dispose only when last user is reached
                    if (watcher.count === 0) {
                        (0, lifecycle_1.dispose)(watcher.disposable);
                        this.activeWatchers.delete(watchHash);
                    }
                }
            });
        }
        dispose() {
            super.dispose();
            for (const [, watcher] of this.activeWatchers) {
                (0, lifecycle_1.dispose)(watcher.disposable);
            }
            this.activeWatchers.clear();
        }
        async doWriteBuffered(provider, resource, options, readableOrStreamOrBufferedStream) {
            return this.writeQueue.queueFor(resource, async () => {
                // open handle
                const handle = await provider.open(resource, { create: true, unlock: options?.unlock ?? false });
                // write into handle until all bytes from buffer have been written
                try {
                    if ((0, stream_1.isReadableStream)(readableOrStreamOrBufferedStream) || (0, stream_1.isReadableBufferedStream)(readableOrStreamOrBufferedStream)) {
                        await this.doWriteStreamBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                    }
                    else {
                        await this.doWriteReadableBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                    }
                }
                catch (error) {
                    throw (0, files_1.ensureFileSystemProviderError)(error);
                }
                finally {
                    // close handle always
                    await provider.close(handle);
                }
            }, this.getExtUri(provider).providerExtUri);
        }
        async doWriteStreamBufferedQueued(provider, handle, streamOrBufferedStream) {
            let posInFile = 0;
            let stream;
            // Buffered stream: consume the buffer first by writing
            // it to the target before reading from the stream.
            if ((0, stream_1.isReadableBufferedStream)(streamOrBufferedStream)) {
                if (streamOrBufferedStream.buffer.length > 0) {
                    const chunk = buffer_1.VSBuffer.concat(streamOrBufferedStream.buffer);
                    await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                    posInFile += chunk.byteLength;
                }
                // If the stream has been consumed, return early
                if (streamOrBufferedStream.ended) {
                    return;
                }
                stream = streamOrBufferedStream.stream;
            }
            // Unbuffered stream - just take as is
            else {
                stream = streamOrBufferedStream;
            }
            return new Promise((resolve, reject) => {
                (0, stream_1.listenStream)(stream, {
                    onData: async (chunk) => {
                        // pause stream to perform async write operation
                        stream.pause();
                        try {
                            await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                        }
                        catch (error) {
                            return reject(error);
                        }
                        posInFile += chunk.byteLength;
                        // resume stream now that we have successfully written
                        // run this on the next tick to prevent increasing the
                        // execution stack because resume() may call the event
                        // handler again before finishing.
                        setTimeout(() => stream.resume());
                    },
                    onError: error => reject(error),
                    onEnd: () => resolve()
                });
            });
        }
        async doWriteReadableBufferedQueued(provider, handle, readable) {
            let posInFile = 0;
            let chunk;
            while ((chunk = readable.read()) !== null) {
                await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                posInFile += chunk.byteLength;
            }
        }
        async doWriteBuffer(provider, handle, buffer, length, posInFile, posInBuffer) {
            let totalBytesWritten = 0;
            while (totalBytesWritten < length) {
                // Write through the provider
                const bytesWritten = await provider.write(handle, posInFile + totalBytesWritten, buffer.buffer, posInBuffer + totalBytesWritten, length - totalBytesWritten);
                totalBytesWritten += bytesWritten;
            }
        }
        async doWriteUnbuffered(provider, resource, options, bufferOrReadableOrStreamOrBufferedStream) {
            return this.writeQueue.queueFor(resource, () => this.doWriteUnbufferedQueued(provider, resource, options, bufferOrReadableOrStreamOrBufferedStream), this.getExtUri(provider).providerExtUri);
        }
        async doWriteUnbufferedQueued(provider, resource, options, bufferOrReadableOrStreamOrBufferedStream) {
            let buffer;
            if (bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer) {
                buffer = bufferOrReadableOrStreamOrBufferedStream;
            }
            else if ((0, stream_1.isReadableStream)(bufferOrReadableOrStreamOrBufferedStream)) {
                buffer = await (0, buffer_1.streamToBuffer)(bufferOrReadableOrStreamOrBufferedStream);
            }
            else if ((0, stream_1.isReadableBufferedStream)(bufferOrReadableOrStreamOrBufferedStream)) {
                buffer = await (0, buffer_1.bufferedStreamToBuffer)(bufferOrReadableOrStreamOrBufferedStream);
            }
            else {
                buffer = (0, buffer_1.readableToBuffer)(bufferOrReadableOrStreamOrBufferedStream);
            }
            // Write through the provider
            await provider.writeFile(resource, buffer.buffer, { create: true, overwrite: true, unlock: options?.unlock ?? false, atomic: options?.atomic ?? false });
        }
        async doPipeBuffered(sourceProvider, source, targetProvider, target) {
            return this.writeQueue.queueFor(target, () => this.doPipeBufferedQueued(sourceProvider, source, targetProvider, target), this.getExtUri(targetProvider).providerExtUri);
        }
        async doPipeBufferedQueued(sourceProvider, source, targetProvider, target) {
            let sourceHandle = undefined;
            let targetHandle = undefined;
            try {
                // Open handles
                sourceHandle = await sourceProvider.open(source, { create: false });
                targetHandle = await targetProvider.open(target, { create: true, unlock: false });
                const buffer = buffer_1.VSBuffer.alloc(this.BUFFER_SIZE);
                let posInFile = 0;
                let posInBuffer = 0;
                let bytesRead = 0;
                do {
                    // read from source (sourceHandle) at current position (posInFile) into buffer (buffer) at
                    // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                    bytesRead = await sourceProvider.read(sourceHandle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                    // write into target (targetHandle) at current position (posInFile) from buffer (buffer) at
                    // buffer position (posInBuffer) all bytes we read (bytesRead).
                    await this.doWriteBuffer(targetProvider, targetHandle, buffer, bytesRead, posInFile, posInBuffer);
                    posInFile += bytesRead;
                    posInBuffer += bytesRead;
                    // when buffer full, fill it again from the beginning
                    if (posInBuffer === buffer.byteLength) {
                        posInBuffer = 0;
                    }
                } while (bytesRead > 0);
            }
            catch (error) {
                throw (0, files_1.ensureFileSystemProviderError)(error);
            }
            finally {
                await async_1.Promises.settled([
                    typeof sourceHandle === 'number' ? sourceProvider.close(sourceHandle) : Promise.resolve(),
                    typeof targetHandle === 'number' ? targetProvider.close(targetHandle) : Promise.resolve(),
                ]);
            }
        }
        async doPipeUnbuffered(sourceProvider, source, targetProvider, target) {
            return this.writeQueue.queueFor(target, () => this.doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target), this.getExtUri(targetProvider).providerExtUri);
        }
        async doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target) {
            return targetProvider.writeFile(target, await sourceProvider.readFile(source), { create: true, overwrite: true, unlock: false, atomic: false });
        }
        async doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target) {
            return this.writeQueue.queueFor(target, () => this.doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target), this.getExtUri(targetProvider).providerExtUri);
        }
        async doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target) {
            // Open handle
            const targetHandle = await targetProvider.open(target, { create: true, unlock: false });
            // Read entire buffer from source and write buffered
            try {
                const buffer = await sourceProvider.readFile(source);
                await this.doWriteBuffer(targetProvider, targetHandle, buffer_1.VSBuffer.wrap(buffer), buffer.byteLength, 0, 0);
            }
            catch (error) {
                throw (0, files_1.ensureFileSystemProviderError)(error);
            }
            finally {
                await targetProvider.close(targetHandle);
            }
        }
        async doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target) {
            // Read buffer via stream buffered
            const buffer = await (0, buffer_1.streamToBuffer)(this.readFileBuffered(sourceProvider, source, cancellation_1.CancellationToken.None));
            // Write buffer into target at once
            await this.doWriteUnbuffered(targetProvider, target, undefined, buffer);
        }
        throwIfFileSystemIsReadonly(provider, resource) {
            if (provider.capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */) {
                throw new files_1.FileOperationError((0, nls_1.localize)('err.readonly', "Unable to modify read-only file '{0}'", this.resourceForError(resource)), 6 /* FileOperationResult.FILE_PERMISSION_DENIED */);
            }
            return provider;
        }
        throwIfFileIsReadonly(resource, stat) {
            if ((stat.permissions ?? 0) & files_1.FilePermission.Readonly) {
                throw new files_1.FileOperationError((0, nls_1.localize)('err.readonly', "Unable to modify read-only file '{0}'", this.resourceForError(resource)), 6 /* FileOperationResult.FILE_PERMISSION_DENIED */);
            }
        }
        resourceForError(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return resource.fsPath;
            }
            return resource.toString(true);
        }
    };
    exports.FileService = FileService;
    exports.FileService = FileService = FileService_1 = __decorate([
        __param(0, log_1.ILogService)
    ], FileService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi9maWxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0J6RixJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFZLFNBQVEsc0JBQVU7O1FBUzFDLFlBQXlCLFVBQXdDO1lBQ2hFLEtBQUssRUFBRSxDQUFDO1lBRGlDLGVBQVUsR0FBVixVQUFVLENBQWE7WUFMakUsa0VBQWtFO1lBQ2xFLGdFQUFnRTtZQUNoRSxxREFBcUQ7WUFDcEMsZ0JBQVcsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBTTFDLDhCQUE4QjtZQUViLGdEQUEyQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXdDLENBQUMsQ0FBQztZQUMxSCwrQ0FBMEMsR0FBRyxJQUFJLENBQUMsMkNBQTJDLENBQUMsS0FBSyxDQUFDO1lBRTVGLHNDQUFpQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNDLENBQUMsQ0FBQztZQUM5RyxxQ0FBZ0MsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsS0FBSyxDQUFDO1lBRXhFLCtDQUEwQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQThDLENBQUMsQ0FBQztZQUMvSCw4Q0FBeUMsR0FBRyxJQUFJLENBQUMsMENBQTBDLENBQUMsS0FBSyxDQUFDO1lBRTFGLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztZQWlJbkUsWUFBWTtZQUVaLDBCQUEwQjtZQUVULHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXNCLENBQUMsQ0FBQztZQUMvRSxzQkFBaUIsR0FBRyxJQUFJ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