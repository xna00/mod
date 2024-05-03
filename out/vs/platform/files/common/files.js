/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/ternarySearchTree", "vs/base/common/path", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform", "vs/base/common/network", "vs/base/common/lazy"], function (require, exports, ternarySearchTree_1, path_1, strings_1, types_1, uri_1, nls_1, instantiation_1, platform_1, network_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ByteSize = exports.ETAG_DISABLED = exports.FileKind = exports.FILES_READONLY_FROM_PERMISSIONS_CONFIG = exports.FILES_READONLY_EXCLUDE_CONFIG = exports.FILES_READONLY_INCLUDE_CONFIG = exports.FILES_EXCLUDE_CONFIG = exports.FILES_ASSOCIATIONS_CONFIG = exports.HotExitConfiguration = exports.AutoSaveConfiguration = exports.FileOperationResult = exports.NotModifiedSinceFileOperationError = exports.TooLargeFileOperationError = exports.FileOperationError = exports.FileChangesEvent = exports.FileChangeType = exports.FileOperationEvent = exports.FileOperation = exports.FileSystemProviderError = exports.FileSystemProviderErrorCode = exports.FileSystemProviderCapabilities = exports.FilePermission = exports.FileType = exports.IFileService = void 0;
    exports.isFileOpenForWriteOptions = isFileOpenForWriteOptions;
    exports.isFileSystemWatcher = isFileSystemWatcher;
    exports.hasReadWriteCapability = hasReadWriteCapability;
    exports.hasFileFolderCopyCapability = hasFileFolderCopyCapability;
    exports.hasFileCloneCapability = hasFileCloneCapability;
    exports.hasOpenReadWriteCloseCapability = hasOpenReadWriteCloseCapability;
    exports.hasFileReadStreamCapability = hasFileReadStreamCapability;
    exports.hasFileAtomicReadCapability = hasFileAtomicReadCapability;
    exports.hasFileAtomicWriteCapability = hasFileAtomicWriteCapability;
    exports.hasFileAtomicDeleteCapability = hasFileAtomicDeleteCapability;
    exports.hasReadonlyCapability = hasReadonlyCapability;
    exports.createFileSystemProviderError = createFileSystemProviderError;
    exports.ensureFileSystemProviderError = ensureFileSystemProviderError;
    exports.markAsFileSystemProviderError = markAsFileSystemProviderError;
    exports.toFileSystemProviderErrorCode = toFileSystemProviderErrorCode;
    exports.toFileOperationResult = toFileOperationResult;
    exports.isParent = isParent;
    exports.etag = etag;
    exports.whenProviderRegistered = whenProviderRegistered;
    exports.getLargeFileConfirmationLimit = getLargeFileConfirmationLimit;
    //#region file service & providers
    exports.IFileService = (0, instantiation_1.createDecorator)('fileService');
    function isFileOpenForWriteOptions(options) {
        return options.create === true;
    }
    var FileType;
    (function (FileType) {
        /**
         * File is unknown (neither file, directory nor symbolic link).
         */
        FileType[FileType["Unknown"] = 0] = "Unknown";
        /**
         * File is a normal file.
         */
        FileType[FileType["File"] = 1] = "File";
        /**
         * File is a directory.
         */
        FileType[FileType["Directory"] = 2] = "Directory";
        /**
         * File is a symbolic link.
         *
         * Note: even when the file is a symbolic link, you can test for
         * `FileType.File` and `FileType.Directory` to know the type of
         * the target the link points to.
         */
        FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
    })(FileType || (exports.FileType = FileType = {}));
    var FilePermission;
    (function (FilePermission) {
        /**
         * File is readonly. Components like editors should not
         * offer to edit the contents.
         */
        FilePermission[FilePermission["Readonly"] = 1] = "Readonly";
        /**
         * File is locked. Components like editors should offer
         * to edit the contents and ask the user upon saving to
         * remove the lock.
         */
        FilePermission[FilePermission["Locked"] = 2] = "Locked";
    })(FilePermission || (exports.FilePermission = FilePermission = {}));
    function isFileSystemWatcher(thing) {
        const candidate = thing;
        return !!candidate && typeof candidate.onDidChange === 'function';
    }
    var FileSystemProviderCapabilities;
    (function (FileSystemProviderCapabilities) {
        /**
         * No capabilities.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["None"] = 0] = "None";
        /**
         * Provider supports unbuffered read/write.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileReadWrite"] = 2] = "FileReadWrite";
        /**
         * Provider supports open/read/write/close low level file operations.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileOpenReadWriteClose"] = 4] = "FileOpenReadWriteClose";
        /**
         * Provider supports stream based reading.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileReadStream"] = 16] = "FileReadStream";
        /**
         * Provider supports copy operation.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileFolderCopy"] = 8] = "FileFolderCopy";
        /**
         * Provider is path case sensitive.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["PathCaseSensitive"] = 1024] = "PathCaseSensitive";
        /**
         * All files of the provider are readonly.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["Readonly"] = 2048] = "Readonly";
        /**
         * Provider supports to delete via trash.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["Trash"] = 4096] = "Trash";
        /**
         * Provider support to unlock files for writing.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileWriteUnlock"] = 8192] = "FileWriteUnlock";
        /**
         * Provider support to read files atomically. This implies the
         * provider provides the `FileReadWrite` capability too.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileAtomicRead"] = 16384] = "FileAtomicRead";
        /**
         * Provider support to write files atomically. This implies the
         * provider provides the `FileReadWrite` capability too.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileAtomicWrite"] = 32768] = "FileAtomicWrite";
        /**
         * Provider support to delete atomically.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileAtomicDelete"] = 65536] = "FileAtomicDelete";
        /**
         * Provider support to clone files atomically.
         */
        FileSystemProviderCapabilities[FileSystemProviderCapabilities["FileClone"] = 131072] = "FileClone";
    })(FileSystemProviderCapabilities || (exports.FileSystemProviderCapabilities = FileSystemProviderCapabilities = {}));
    function hasReadWriteCapability(provider) {
        return !!(provider.capabilities & 2 /* FileSystemProviderCapabilities.FileReadWrite */);
    }
    function hasFileFolderCopyCapability(provider) {
        return !!(provider.capabilities & 8 /* FileSystemProviderCapabilities.FileFolderCopy */);
    }
    function hasFileCloneCapability(provider) {
        return !!(provider.capabilities & 131072 /* FileSystemProviderCapabilities.FileClone */);
    }
    function hasOpenReadWriteCloseCapability(provider) {
        return !!(provider.capabilities & 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */);
    }
    function hasFileReadStreamCapability(provider) {
        return !!(provider.capabilities & 16 /* FileSystemProviderCapabilities.FileReadStream */);
    }
    function hasFileAtomicReadCapability(provider) {
        if (!hasReadWriteCapability(provider)) {
            return false; // we require the `FileReadWrite` capability too
        }
        return !!(provider.capabilities & 16384 /* FileSystemProviderCapabilities.FileAtomicRead */);
    }
    function hasFileAtomicWriteCapability(provider) {
        if (!hasReadWriteCapability(provider)) {
            return false; // we require the `FileReadWrite` capability too
        }
        return !!(provider.capabilities & 32768 /* FileSystemProviderCapabilities.FileAtomicWrite */);
    }
    function hasFileAtomicDeleteCapability(provider) {
        return !!(provider.capabilities & 65536 /* FileSystemProviderCapabilities.FileAtomicDelete */);
    }
    function hasReadonlyCapability(provider) {
        return !!(provider.capabilities & 2048 /* FileSystemProviderCapabilities.Readonly */);
    }
    var FileSystemProviderErrorCode;
    (function (FileSystemProviderErrorCode) {
        FileSystemProviderErrorCode["FileExists"] = "EntryExists";
        FileSystemProviderErrorCode["FileNotFound"] = "EntryNotFound";
        FileSystemProviderErrorCode["FileNotADirectory"] = "EntryNotADirectory";
        FileSystemProviderErrorCode["FileIsADirectory"] = "EntryIsADirectory";
        FileSystemProviderErrorCode["FileExceedsStorageQuota"] = "EntryExceedsStorageQuota";
        FileSystemProviderErrorCode["FileTooLarge"] = "EntryTooLarge";
        FileSystemProviderErrorCode["FileWriteLocked"] = "EntryWriteLocked";
        FileSystemProviderErrorCode["NoPermissions"] = "NoPermissions";
        FileSystemProviderErrorCode["Unavailable"] = "Unavailable";
        FileSystemProviderErrorCode["Unknown"] = "Unknown";
    })(FileSystemProviderErrorCode || (exports.FileSystemProviderErrorCode = FileSystemProviderErrorCode = {}));
    class FileSystemProviderError extends Error {
        static create(error, code) {
            const providerError = new FileSystemProviderError(error.toString(), code);
            markAsFileSystemProviderError(providerError, code);
            return providerError;
        }
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.FileSystemProviderError = FileSystemProviderError;
    function createFileSystemProviderError(error, code) {
        return FileSystemProviderError.create(error, code);
    }
    function ensureFileSystemProviderError(error) {
        if (!error) {
            return createFileSystemProviderError((0, nls_1.localize)('unknownError', "Unknown Error"), FileSystemProviderErrorCode.Unknown); // https://github.com/microsoft/vscode/issues/72798
        }
        return error;
    }
    function markAsFileSystemProviderError(error, code) {
        error.name = code ? `${code} (FileSystemError)` : `FileSystemError`;
        return error;
    }
    function toFileSystemProviderErrorCode(error) {
        // Guard against abuse
        if (!error) {
            return FileSystemProviderErrorCode.Unknown;
        }
        // FileSystemProviderError comes with the code
        if (error instanceof FileSystemProviderError) {
            return error.code;
        }
        // Any other error, check for name match by assuming that the error
        // went through the markAsFileSystemProviderError() method
        const match = /^(.+) \(FileSystemError\)$/.exec(error.name);
        if (!match) {
            return FileSystemProviderErrorCode.Unknown;
        }
        switch (match[1]) {
            case FileSystemProviderErrorCode.FileExists: return FileSystemProviderErrorCode.FileExists;
            case FileSystemProviderErrorCode.FileIsADirectory: return FileSystemProviderErrorCode.FileIsADirectory;
            case FileSystemProviderErrorCode.FileNotADirectory: return FileSystemProviderErrorCode.FileNotADirectory;
            case FileSystemProviderErrorCode.FileNotFound: return FileSystemProviderErrorCode.FileNotFound;
            case FileSystemProviderErrorCode.FileTooLarge: return FileSystemProviderErrorCode.FileTooLarge;
            case FileSystemProviderErrorCode.FileWriteLocked: return FileSystemProviderErrorCode.FileWriteLocked;
            case FileSystemProviderErrorCode.NoPermissions: return FileSystemProviderErrorCode.NoPermissions;
            case FileSystemProviderErrorCode.Unavailable: return FileSystemProviderErrorCode.Unavailable;
        }
        return FileSystemProviderErrorCode.Unknown;
    }
    function toFileOperationResult(error) {
        // FileSystemProviderError comes with the result already
        if (error instanceof FileOperationError) {
            return error.fileOperationResult;
        }
        // Otherwise try to find from code
        switch (toFileSystemProviderErrorCode(error)) {
            case FileSystemProviderErrorCode.FileNotFound:
                return 1 /* FileOperationResult.FILE_NOT_FOUND */;
            case FileSystemProviderErrorCode.FileIsADirectory:
                return 0 /* FileOperationResult.FILE_IS_DIRECTORY */;
            case FileSystemProviderErrorCode.FileNotADirectory:
                return 9 /* FileOperationResult.FILE_NOT_DIRECTORY */;
            case FileSystemProviderErrorCode.FileWriteLocked:
                return 5 /* FileOperationResult.FILE_WRITE_LOCKED */;
            case FileSystemProviderErrorCode.NoPermissions:
                return 6 /* FileOperationResult.FILE_PERMISSION_DENIED */;
            case FileSystemProviderErrorCode.FileExists:
                return 4 /* FileOperationResult.FILE_MOVE_CONFLICT */;
            case FileSystemProviderErrorCode.FileTooLarge:
                return 7 /* FileOperationResult.FILE_TOO_LARGE */;
            default:
                return 10 /* FileOperationResult.FILE_OTHER_ERROR */;
        }
    }
    var FileOperation;
    (function (FileOperation) {
        FileOperation[FileOperation["CREATE"] = 0] = "CREATE";
        FileOperation[FileOperation["DELETE"] = 1] = "DELETE";
        FileOperation[FileOperation["MOVE"] = 2] = "MOVE";
        FileOperation[FileOperation["COPY"] = 3] = "COPY";
        FileOperation[FileOperation["WRITE"] = 4] = "WRITE";
    })(FileOperation || (exports.FileOperation = FileOperation = {}));
    class FileOperationEvent {
        constructor(resource, operation, target) {
            this.resource = resource;
            this.operation = operation;
            this.target = target;
        }
        isOperation(operation) {
            return this.operation === operation;
        }
    }
    exports.FileOperationEvent = FileOperationEvent;
    /**
     * Possible changes that can occur to a file.
     */
    var FileChangeType;
    (function (FileChangeType) {
        FileChangeType[FileChangeType["UPDATED"] = 0] = "UPDATED";
        FileChangeType[FileChangeType["ADDED"] = 1] = "ADDED";
        FileChangeType[FileChangeType["DELETED"] = 2] = "DELETED";
    })(FileChangeType || (exports.FileChangeType = FileChangeType = {}));
    class FileChangesEvent {
        static { this.MIXED_CORRELATION = null; }
        constructor(changes, ignorePathCasing) {
            this.ignorePathCasing = ignorePathCasing;
            this.correlationId = undefined;
            this.added = new lazy_1.Lazy(() => {
                const added = ternarySearchTree_1.TernarySearchTree.forUris(() => this.ignorePathCasing);
                added.fill(this.rawAdded.map(resource => [resource, true]));
                return added;
            });
            this.updated = new lazy_1.Lazy(() => {
                const updated = ternarySearchTree_1.TernarySearchTree.forUris(() => this.ignorePathCasing);
                updated.fill(this.rawUpdated.map(resource => [resource, true]));
                return updated;
            });
            this.deleted = new lazy_1.Lazy(() => {
                const deleted = ternarySearchTree_1.TernarySearchTree.forUris(() => this.ignorePathCasing);
                deleted.fill(this.rawDeleted.map(resource => [resource, true]));
                return deleted;
            });
            /**
             * @deprecated use the `contains` or `affects` method to efficiently find
             * out if the event relates to a given resource. these methods ensure:
             * - that there is no expensive lookup needed (by using a `TernarySearchTree`)
             * - correctly handles `FileChangeType.DELETED` events
             */
            this.rawAdded = [];
            /**
            * @deprecated use the `contains` or `affects` method to efficiently find
            * out if the event relates to a given resource. these methods ensure:
            * - that there is no expensive lookup needed (by using a `TernarySearchTree`)
            * - correctly handles `FileChangeType.DELETED` events
            */
            this.rawUpdated = [];
            /**
            * @deprecated use the `contains` or `affects` method to efficiently find
            * out if the event relates to a given resource. these methods ensure:
            * - that there is no expensive lookup needed (by using a `TernarySearchTree`)
            * - correctly handles `FileChangeType.DELETED` events
            */
            this.rawDeleted = [];
            for (const change of changes) {
                // Split by type
                switch (change.type) {
                    case 1 /* FileChangeType.ADDED */:
                        this.rawAdded.push(change.resource);
                        break;
                    case 0 /* FileChangeType.UPDATED */:
                        this.rawUpdated.push(change.resource);
                        break;
                    case 2 /* FileChangeType.DELETED */:
                        this.rawDeleted.push(change.resource);
                        break;
                }
                // Figure out events correlation
                if (this.correlationId !== FileChangesEvent.MIXED_CORRELATION) {
                    if (typeof change.cId === 'number') {
                        if (this.correlationId === undefined) {
                            this.correlationId = change.cId; // correlation not yet set, just take it
                        }
                        else if (this.correlationId !== change.cId) {
                            this.correlationId = FileChangesEvent.MIXED_CORRELATION; // correlation mismatch, we have mixed correlation
                        }
                    }
                    else {
                        if (this.correlationId !== undefined) {
                            this.correlationId = FileChangesEvent.MIXED_CORRELATION; // correlation mismatch, we have mixed correlation
                        }
                    }
                }
            }
        }
        /**
         * Find out if the file change events match the provided resource.
         *
         * Note: when passing `FileChangeType.DELETED`, we consider a match
         * also when the parent of the resource got deleted.
         */
        contains(resource, ...types) {
            return this.doContains(resource, { includeChildren: false }, ...types);
        }
        /**
         * Find out if the file change events either match the provided
         * resource, or contain a child of this resource.
         */
        affects(resource, ...types) {
            return this.doContains(resource, { includeChildren: true }, ...types);
        }
        doContains(resource, options, ...types) {
            if (!resource) {
                return false;
            }
            const hasTypesFilter = types.length > 0;
            // Added
            if (!hasTypesFilter || types.includes(1 /* FileChangeType.ADDED */)) {
                if (this.added.value.get(resource)) {
                    return true;
                }
                if (options.includeChildren && this.added.value.findSuperstr(resource)) {
                    return true;
                }
            }
            // Updated
            if (!hasTypesFilter || types.includes(0 /* FileChangeType.UPDATED */)) {
                if (this.updated.value.get(resource)) {
                    return true;
                }
                if (options.includeChildren && this.updated.value.findSuperstr(resource)) {
                    return true;
                }
            }
            // Deleted
            if (!hasTypesFilter || types.includes(2 /* FileChangeType.DELETED */)) {
                if (this.deleted.value.findSubstr(resource) /* deleted also considers parent folders */) {
                    return true;
                }
                if (options.includeChildren && this.deleted.value.findSuperstr(resource)) {
                    return true;
                }
            }
            return false;
        }
        /**
         * Returns if this event contains added files.
         */
        gotAdded() {
            return this.rawAdded.length > 0;
        }
        /**
         * Returns if this event contains deleted files.
         */
        gotDeleted() {
            return this.rawDeleted.length > 0;
        }
        /**
         * Returns if this event contains updated files.
         */
        gotUpdated() {
            return this.rawUpdated.length > 0;
        }
        /**
         * Returns if this event contains changes that correlate to the
         * provided `correlationId`.
         *
         * File change event correlation is an advanced watch feature that
         * allows to  identify from which watch request the events originate
         * from. This correlation allows to route events specifically
         * only to the requestor and not emit them to all listeners.
         */
        correlates(correlationId) {
            return this.correlationId === correlationId;
        }
        /**
         * Figure out if the event contains changes that correlate to one
         * correlation identifier.
         *
         * File change event correlation is an advanced watch feature that
         * allows to  identify from which watch request the events originate
         * from. This correlation allows to route events specifically
         * only to the requestor and not emit them to all listeners.
         */
        hasCorrelation() {
            return typeof this.correlationId === 'number';
        }
    }
    exports.FileChangesEvent = FileChangesEvent;
    function isParent(path, candidate, ignoreCase) {
        if (!path || !candidate || path === candidate) {
            return false;
        }
        if (candidate.length > path.length) {
            return false;
        }
        if (candidate.charAt(candidate.length - 1) !== path_1.sep) {
            candidate += path_1.sep;
        }
        if (ignoreCase) {
            return (0, strings_1.startsWithIgnoreCase)(path, candidate);
        }
        return path.indexOf(candidate) === 0;
    }
    class FileOperationError extends Error {
        constructor(message, fileOperationResult, options) {
            super(message);
            this.fileOperationResult = fileOperationResult;
            this.options = options;
        }
    }
    exports.FileOperationError = FileOperationError;
    class TooLargeFileOperationError extends FileOperationError {
        constructor(message, fileOperationResult, size, options) {
            super(message, fileOperationResult, options);
            this.fileOperationResult = fileOperationResult;
            this.size = size;
        }
    }
    exports.TooLargeFileOperationError = TooLargeFileOperationError;
    class NotModifiedSinceFileOperationError extends FileOperationError {
        constructor(message, stat, options) {
            super(message, 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */, options);
            this.stat = stat;
        }
    }
    exports.NotModifiedSinceFileOperationError = NotModifiedSinceFileOperationError;
    var FileOperationResult;
    (function (FileOperationResult) {
        FileOperationResult[FileOperationResult["FILE_IS_DIRECTORY"] = 0] = "FILE_IS_DIRECTORY";
        FileOperationResult[FileOperationResult["FILE_NOT_FOUND"] = 1] = "FILE_NOT_FOUND";
        FileOperationResult[FileOperationResult["FILE_NOT_MODIFIED_SINCE"] = 2] = "FILE_NOT_MODIFIED_SINCE";
        FileOperationResult[FileOperationResult["FILE_MODIFIED_SINCE"] = 3] = "FILE_MODIFIED_SINCE";
        FileOperationResult[FileOperationResult["FILE_MOVE_CONFLICT"] = 4] = "FILE_MOVE_CONFLICT";
        FileOperationResult[FileOperationResult["FILE_WRITE_LOCKED"] = 5] = "FILE_WRITE_LOCKED";
        FileOperationResult[FileOperationResult["FILE_PERMISSION_DENIED"] = 6] = "FILE_PERMISSION_DENIED";
        FileOperationResult[FileOperationResult["FILE_TOO_LARGE"] = 7] = "FILE_TOO_LARGE";
        FileOperationResult[FileOperationResult["FILE_INVALID_PATH"] = 8] = "FILE_INVALID_PATH";
        FileOperationResult[FileOperationResult["FILE_NOT_DIRECTORY"] = 9] = "FILE_NOT_DIRECTORY";
        FileOperationResult[FileOperationResult["FILE_OTHER_ERROR"] = 10] = "FILE_OTHER_ERROR";
    })(FileOperationResult || (exports.FileOperationResult = FileOperationResult = {}));
    //#endregion
    //#region Settings
    exports.AutoSaveConfiguration = {
        OFF: 'off',
        AFTER_DELAY: 'afterDelay',
        ON_FOCUS_CHANGE: 'onFocusChange',
        ON_WINDOW_CHANGE: 'onWindowChange'
    };
    exports.HotExitConfiguration = {
        OFF: 'off',
        ON_EXIT: 'onExit',
        ON_EXIT_AND_WINDOW_CLOSE: 'onExitAndWindowClose'
    };
    exports.FILES_ASSOCIATIONS_CONFIG = 'files.associations';
    exports.FILES_EXCLUDE_CONFIG = 'files.exclude';
    exports.FILES_READONLY_INCLUDE_CONFIG = 'files.readonlyInclude';
    exports.FILES_READONLY_EXCLUDE_CONFIG = 'files.readonlyExclude';
    exports.FILES_READONLY_FROM_PERMISSIONS_CONFIG = 'files.readonlyFromPermissions';
    //#endregion
    //#region Utilities
    var FileKind;
    (function (FileKind) {
        FileKind[FileKind["FILE"] = 0] = "FILE";
        FileKind[FileKind["FOLDER"] = 1] = "FOLDER";
        FileKind[FileKind["ROOT_FOLDER"] = 2] = "ROOT_FOLDER";
    })(FileKind || (exports.FileKind = FileKind = {}));
    /**
     * A hint to disable etag checking for reading/writing.
     */
    exports.ETAG_DISABLED = '';
    function etag(stat) {
        if (typeof stat.size !== 'number' || typeof stat.mtime !== 'number') {
            return undefined;
        }
        return stat.mtime.toString(29) + stat.size.toString(31);
    }
    async function whenProviderRegistered(file, fileService) {
        if (fileService.hasProvider(uri_1.URI.from({ scheme: file.scheme }))) {
            return;
        }
        return new Promise(resolve => {
            const disposable = fileService.onDidChangeFileSystemProviderRegistrations(e => {
                if (e.scheme === file.scheme && e.added) {
                    disposable.dispose();
                    resolve();
                }
            });
        });
    }
    /**
     * Helper to format a raw byte size into a human readable label.
     */
    class ByteSize {
        static { this.KB = 1024; }
        static { this.MB = ByteSize.KB * ByteSize.KB; }
        static { this.GB = ByteSize.MB * ByteSize.KB; }
        static { this.TB = ByteSize.GB * ByteSize.KB; }
        static formatSize(size) {
            if (!(0, types_1.isNumber)(size)) {
                size = 0;
            }
            if (size < ByteSize.KB) {
                return (0, nls_1.localize)('sizeB', "{0}B", size.toFixed(0));
            }
            if (size < ByteSize.MB) {
                return (0, nls_1.localize)('sizeKB', "{0}KB", (size / ByteSize.KB).toFixed(2));
            }
            if (size < ByteSize.GB) {
                return (0, nls_1.localize)('sizeMB', "{0}MB", (size / ByteSize.MB).toFixed(2));
            }
            if (size < ByteSize.TB) {
                return (0, nls_1.localize)('sizeGB', "{0}GB", (size / ByteSize.GB).toFixed(2));
            }
            return (0, nls_1.localize)('sizeTB', "{0}TB", (size / ByteSize.TB).toFixed(2));
        }
    }
    exports.ByteSize = ByteSize;
    function getLargeFileConfirmationLimit(arg) {
        const isRemote = typeof arg === 'string' || arg?.scheme === network_1.Schemas.vscodeRemote;
        const isLocal = typeof arg !== 'string' && arg?.scheme === network_1.Schemas.file;
        if (isLocal) {
            // Local almost has no limit in file size
            return 1024 * ByteSize.MB;
        }
        if (isRemote) {
            // With a remote, pick a low limit to avoid
            // potentially costly file transfers
            return 10 * ByteSize.MB;
        }
        if (platform_1.isWeb) {
            // Web: we cannot know for sure if a cost
            // is associated with the file transfer
            // so we pick a reasonably small limit
            return 50 * ByteSize.MB;
        }
        // Local desktop: almost no limit in file size
        return 1024 * ByteSize.MB;
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL2NvbW1vbi9maWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzWGhHLDhEQUVDO0lBd0tELGtEQUlDO0lBMkdELHdEQUVDO0lBTUQsa0VBRUM7SUFNRCx3REFFQztJQVNELDBFQUVDO0lBTUQsa0VBRUM7SUFPRCxrRUFNQztJQU9ELG9FQU1DO0lBT0Qsc0VBRUM7SUFZRCxzREFFQztJQWtDRCxzRUFFQztJQUVELHNFQU1DO0lBRUQsc0VBSUM7SUFFRCxzRUErQkM7SUFFRCxzREEwQkM7SUFzUkQsNEJBa0JDO0lBa1ZELG9CQU1DO0lBRUQsd0RBYUM7SUF5Q0Qsc0VBd0JDO0lBaGhERCxrQ0FBa0M7SUFFckIsUUFBQSxZQUFZLEdBQUcsSUFBQSwrQkFBZSxFQUFlLGFBQWEsQ0FBQyxDQUFDO0lBZ1d6RSxTQUFnQix5QkFBeUIsQ0FBQyxPQUF5QjtRQUNsRSxPQUFPLE9BQU8sQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDO0lBQ2hDLENBQUM7SUE4Q0QsSUFBWSxRQXlCWDtJQXpCRCxXQUFZLFFBQVE7UUFFbkI7O1dBRUc7UUFDSCw2Q0FBVyxDQUFBO1FBRVg7O1dBRUc7UUFDSCx1Q0FBUSxDQUFBO1FBRVI7O1dBRUc7UUFDSCxpREFBYSxDQUFBO1FBRWI7Ozs7OztXQU1HO1FBQ0gsd0RBQWlCLENBQUE7SUFDbEIsQ0FBQyxFQXpCVyxRQUFRLHdCQUFSLFFBQVEsUUF5Qm5CO0lBRUQsSUFBWSxjQWNYO0lBZEQsV0FBWSxjQUFjO1FBRXpCOzs7V0FHRztRQUNILDJEQUFZLENBQUE7UUFFWjs7OztXQUlHO1FBQ0gsdURBQVUsQ0FBQTtJQUNYLENBQUMsRUFkVyxjQUFjLDhCQUFkLGNBQWMsUUFjekI7SUFpRkQsU0FBZ0IsbUJB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