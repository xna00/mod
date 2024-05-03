/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "graceful-fs", "vs/base/common/async", "vs/base/common/map", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stream", "vs/base/node/pfs", "vs/nls", "vs/platform/files/common/files", "vs/platform/files/common/io", "vs/platform/files/common/diskFileSystemProvider", "vs/base/common/errorMessage", "vs/platform/files/node/watcher/watcherClient", "vs/platform/files/node/watcher/nodejs/nodejsClient"], function (require, exports, fs, graceful_fs_1, async_1, map_1, buffer_1, event_1, extpath_1, lifecycle_1, path_1, platform_1, resources_1, stream_1, pfs_1, nls_1, files_1, io_1, diskFileSystemProvider_1, errorMessage_1, watcherClient_1, nodejsClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProvider = void 0;
    /**
     * Enable graceful-fs very early from here to have it enabled
     * in all contexts that leverage the disk file system provider.
     */
    (() => {
        try {
            (0, graceful_fs_1.gracefulify)(fs);
        }
        catch (error) {
            console.error(`Error enabling graceful-fs: ${(0, errorMessage_1.toErrorMessage)(error)}`);
        }
    })();
    class DiskFileSystemProvider extends diskFileSystemProvider_1.AbstractDiskFileSystemProvider {
        static { this.TRACE_LOG_RESOURCE_LOCKS = false; } // not enabled by default because very spammy
        constructor(logService, options) {
            super(logService, options);
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            //#endregion
            //#region File Reading/Writing
            this.resourceLocks = new map_1.ResourceMap(resource => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(resource));
            this.mapHandleToPos = new Map();
            this.mapHandleToLock = new Map();
            this.writeHandles = new Map();
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */ |
                        8 /* FileSystemProviderCapabilities.FileFolderCopy */ |
                        8192 /* FileSystemProviderCapabilities.FileWriteUnlock */ |
                        16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                        32768 /* FileSystemProviderCapabilities.FileAtomicWrite */ |
                        65536 /* FileSystemProviderCapabilities.FileAtomicDelete */ |
                        131072 /* FileSystemProviderCapabilities.FileClone */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        async stat(resource) {
            try {
                const { stat, symbolicLink } = await pfs_1.SymlinkSupport.stat(this.toFilePath(resource)); // cannot use fs.stat() here to support links properly
                return {
                    type: this.toType(stat, symbolicLink),
                    ctime: stat.birthtime.getTime(), // intentionally not using ctime here, we want the creation time
                    mtime: stat.mtime.getTime(),
                    size: stat.size,
                    permissions: (stat.mode & 0o200) === 0 ? files_1.FilePermission.Locked : undefined
                };
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async statIgnoreError(resource) {
            try {
                return await this.stat(resource);
            }
            catch (error) {
                return undefined;
            }
        }
        async readdir(resource) {
            try {
                const children = await pfs_1.Promises.readdir(this.toFilePath(resource), { withFileTypes: true });
                const result = [];
                await Promise.all(children.map(async (child) => {
                    try {
                        let type;
                        if (child.isSymbolicLink()) {
                            type = (await this.stat((0, resources_1.joinPath)(resource, child.name))).type; // always resolve target the link points to if any
                        }
                        else {
                            type = this.toType(child);
                        }
                        result.push([child.name, type]);
                    }
                    catch (error) {
                        this.logService.trace(error); // ignore errors for individual entries that can arise from permission denied
                    }
                }));
                return result;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        toType(entry, symbolicLink) {
            // Signal file type by checking for file / directory, except:
            // - symbolic links pointing to nonexistent files are FileType.Unknown
            // - files that are neither file nor directory are FileType.Unknown
            let type;
            if (symbolicLink?.dangling) {
                type = files_1.FileType.Unknown;
            }
            else if (entry.isFile()) {
                type = files_1.FileType.File;
            }
            else if (entry.isDirectory()) {
                type = files_1.FileType.Directory;
            }
            else {
                type = files_1.FileType.Unknown;
            }
            // Always signal symbolic link as file type additionally
            if (symbolicLink) {
                type |= files_1.FileType.SymbolicLink;
            }
            return type;
        }
        async createResourceLock(resource) {
            const filePath = this.toFilePath(resource);
            this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - request to acquire resource lock (${filePath})`);
            // Await pending locks for resource. It is possible for a new lock being
            // added right after opening, so we have to loop over locks until no lock
            // remains.
            let existingLock = undefined;
            while (existingLock = this.resourceLocks.get(resource)) {
                this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - waiting for resource lock to be released (${filePath})`);
                await existingLock.wait();
            }
            // Store new
            const newLock = new async_1.Barrier();
            this.resourceLocks.set(resource, newLock);
            this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - new resource lock created (${filePath})`);
            return (0, lifecycle_1.toDisposable)(() => {
                this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - resource lock dispose() (${filePath})`);
                // Delete lock if it is still ours
                if (this.resourceLocks.get(resource) === newLock) {
                    this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - resource lock removed from resource-lock map (${filePath})`);
                    this.resourceLocks.delete(resource);
                }
                // Open lock
                this.traceLock(`[Disk FileSystemProvider]: createResourceLock() - resource lock barrier open() (${filePath})`);
                newLock.open();
            });
        }
        async readFile(resource, options) {
            let lock = undefined;
            try {
                if (options?.atomic) {
                    this.traceLock(`[Disk FileSystemProvider]: atomic read operation started (${this.toFilePath(resource)})`);
                    // When the read should be atomic, make sure
                    // to await any pending locks for the resource
                    // and lock for the duration of the read.
                    lock = await this.createResourceLock(resource);
                }
                const filePath = this.toFilePath(resource);
                return await pfs_1.Promises.readFile(filePath);
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                lock?.dispose();
            }
        }
        traceLock(msg) {
            if (DiskFileSystemProvider.TRACE_LOG_RESOURCE_LOCKS) {
                this.logService.trace(msg);
            }
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            (0, io_1.readFileIntoStream)(this, resource, stream, data => data.buffer, {
                ...opts,
                bufferSize: 256 * 1024 // read into chunks of 256kb each to reduce IPC overhead
            }, token);
            return stream;
        }
        async writeFile(resource, content, opts) {
            if (opts?.atomic !== false && opts?.atomic?.postfix && await this.canWriteFileAtomic(resource)) {
                return this.doWriteFileAtomic(resource, (0, resources_1.joinPath)((0, resources_1.dirname)(resource), `${(0, resources_1.basename)(resource)}${opts.atomic.postfix}`), content, opts);
            }
            else {
                return this.doWriteFile(resource, content, opts);
            }
        }
        async canWriteFileAtomic(resource) {
            try {
                const filePath = this.toFilePath(resource);
                const { symbolicLink } = await pfs_1.SymlinkSupport.stat(filePath);
                if (symbolicLink) {
                    // atomic writes are unsupported for symbolic links because
                    // we need to ensure that the `rename` operation is atomic
                    // and that only works if the link is on the same disk.
                    // Since we do not know where the symbolic link points to
                    // we refuse to write atomically.
                    return false;
                }
            }
            catch (error) {
                // ignore stat errors here and just proceed trying to write
            }
            return true; // atomic writing supported
        }
        async doWriteFileAtomic(resource, tempResource, content, opts) {
            // Ensure to create locks for all resources involved
            // since atomic write involves mutiple disk operations
            // and resources.
            const locks = new lifecycle_1.DisposableStore();
            try {
                locks.add(await this.createResourceLock(resource));
                locks.add(await this.createResourceLock(tempResource));
                // Write to temp resource first
                await this.doWriteFile(tempResource, content, opts, true /* disable write lock */);
                try {
                    // Rename over existing to ensure atomic replace
                    await this.rename(tempResource, resource, { overwrite: true });
                }
                catch (error) {
                    // Cleanup in case of rename error
                    try {
                        await this.delete(tempResource, { recursive: false, useTrash: false, atomic: false });
                    }
                    catch (error) {
                        // ignore - we want the outer error to bubble up
                    }
                    throw error;
                }
            }
            finally {
                locks.dispose();
            }
        }
        async doWriteFile(resource, content, opts, disableWriteLock) {
            let handle = undefined;
            try {
                const filePath = this.toFilePath(resource);
                // Validate target unless { create: true, overwrite: true }
                if (!opts.create || !opts.overwrite) {
                    const fileExists = await pfs_1.Promises.exists(filePath);
                    if (fileExists) {
                        if (!opts.overwrite) {
                            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileExists', "File already exists"), files_1.FileSystemProviderErrorCode.FileExists);
                        }
                    }
                    else {
                        if (!opts.create) {
                            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
                        }
                    }
                }
                // Open
                handle = await this.open(resource, { create: true, unlock: opts.unlock }, disableWriteLock);
                // Write content at once
                await this.write(handle, 0, content, 0, content.byteLength);
            }
            catch (error) {
                throw await this.toFileSystemProviderWriteError(resource, error);
            }
            finally {
                if (typeof handle === 'number') {
                    await this.close(handle);
                }
            }
        }
        static { this.canFlush = true; }
        static configureFlushOnWrite(enabled) {
            DiskFileSystemProvider.canFlush = enabled;
        }
        async open(resource, opts, disableWriteLock) {
            const filePath = this.toFilePath(resource);
            // Writes: guard multiple writes to the same resource
            // behind a single lock to prevent races when writing
            // from multiple places at the same time to the same file
            let lock = undefined;
            if ((0, files_1.isFileOpenForWriteOptions)(opts) && !disableWriteLock) {
                lock = await this.createResourceLock(resource);
            }
            let fd = undefined;
            try {
                // Determine whether to unlock the file (write only)
                if ((0, files_1.isFileOpenForWriteOptions)(opts) && opts.unlock) {
                    try {
                        const { stat } = await pfs_1.SymlinkSupport.stat(filePath);
                        if (!(stat.mode & 0o200 /* File mode indicating writable by owner */)) {
                            await pfs_1.Promises.chmod(filePath, stat.mode | 0o200);
                        }
                    }
                    catch (error) {
                        if (error.code !== 'ENOENT') {
                            this.logService.trace(error); // ignore any errors here and try to just write
                        }
                    }
                }
                // Determine file flags for opening (read vs write)
                let flags = undefined;
                if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                    if (platform_1.isWindows) {
                        try {
                            // On Windows and if the file exists, we use a different strategy of saving the file
                            // by first truncating the file and then writing with r+ flag. This helps to save hidden files on Windows
                            // (see https://github.com/microsoft/vscode/issues/931) and prevent removing alternate data streams
                            // (see https://github.com/microsoft/vscode/issues/6363)
                            await pfs_1.Promises.truncate(filePath, 0);
                            // After a successful truncate() the flag can be set to 'r+' which will not truncate.
                            flags = 'r+';
                        }
                        catch (error) {
                            if (error.code !== 'ENOENT') {
                                this.logService.trace(error);
                            }
                        }
                    }
                    // We take opts.create as a hint that the file is opened for writing
                    // as such we use 'w' to truncate an existing or create the
                    // file otherwise. we do not allow reading.
                    if (!flags) {
                        flags = 'w';
                    }
                }
                else {
                    // Otherwise we assume the file is opened for reading
                    // as such we use 'r' to neither truncate, nor create
                    // the file.
                    flags = 'r';
                }
                // Finally open handle to file path
                fd = await pfs_1.Promises.open(filePath, flags);
            }
            catch (error) {
                // Release lock because we have no valid handle
                // if we did open a lock during this operation
                lock?.dispose();
                // Rethrow as file system provider error
                if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                    throw await this.toFileSystemProviderWriteError(resource, error);
                }
                else {
                    throw this.toFileSystemProviderError(error);
                }
            }
            // Remember this handle to track file position of the handle
            // we init the position to 0 since the file descriptor was
            // just created and the position was not moved so far (see
            // also http://man7.org/linux/man-pages/man2/open.2.html -
            // "The file offset is set to the beginning of the file.")
            this.mapHandleToPos.set(fd, 0);
            // remember that this handle was used for writing
            if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                this.writeHandles.set(fd, resource);
            }
            if (lock) {
                const previousLock = this.mapHandleToLock.get(fd);
                // Remember that this handle has an associated lock
                this.traceLock(`[Disk FileSystemProvider]: open() - storing lock for handle ${fd} (${filePath})`);
                this.mapHandleToLock.set(fd, lock);
                // There is a slight chance that a resource lock for a
                // handle was not yet disposed when we acquire a new
                // lock, so we must ensure to dispose the previous lock
                // before storing a new one for the same handle, other
                // wise we end up in a deadlock situation
                // https://github.com/microsoft/vscode/issues/142462
                if (previousLock) {
                    this.traceLock(`[Disk FileSystemProvider]: open() - disposing a previous lock that was still stored on same handle ${fd} (${filePath})`);
                    previousLock.dispose();
                }
            }
            return fd;
        }
        async close(fd) {
            // It is very important that we keep any associated lock
            // for the file handle before attempting to call `fs.close(fd)`
            // because of a possible race condition: as soon as a file
            // handle is released, the OS may assign the same handle to
            // the next `fs.open` call and as such it is possible that our
            // lock is getting overwritten
            const lockForHandle = this.mapHandleToLock.get(fd);
            try {
                // Remove this handle from map of positions
                this.mapHandleToPos.delete(fd);
                // If a handle is closed that was used for writing, ensure
                // to flush the contents to disk if possible.
                if (this.writeHandles.delete(fd) && DiskFileSystemProvider.canFlush) {
                    try {
                        await pfs_1.Promises.fdatasync(fd); // https://github.com/microsoft/vscode/issues/9589
                    }
                    catch (error) {
                        // In some exotic setups it is well possible that node fails to sync
                        // In that case we disable flushing and log the error to our logger
                        DiskFileSystemProvider.configureFlushOnWrite(false);
                        this.logService.error(error);
                    }
                }
                return await pfs_1.Promises.close(fd);
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                if (lockForHandle) {
                    if (this.mapHandleToLock.get(fd) === lockForHandle) {
                        this.traceLock(`[Disk FileSystemProvider]: close() - resource lock removed from handle-lock map ${fd}`);
                        this.mapHandleToLock.delete(fd); // only delete from map if this is still our lock!
                    }
                    this.traceLock(`[Disk FileSystemProvider]: close() - disposing lock for handle ${fd}`);
                    lockForHandle.dispose();
                }
            }
        }
        async read(fd, pos, data, offset, length) {
            const normalizedPos = this.normalizePos(fd, pos);
            let bytesRead = null;
            try {
                bytesRead = (await pfs_1.Promises.read(fd, data, offset, length, normalizedPos)).bytesRead;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                this.updatePos(fd, normalizedPos, bytesRead);
            }
            return bytesRead;
        }
        normalizePos(fd, pos) {
            // When calling fs.read/write we try to avoid passing in the "pos" argument and
            // rather prefer to pass in "null" because this avoids an extra seek(pos)
            // call that in some cases can even fail (e.g. when opening a file over FTP -
            // see https://github.com/microsoft/vscode/issues/73884).
            //
            // as such, we compare the passed in position argument with our last known
            // position for the file descriptor and use "null" if they match.
            if (pos === this.mapHandleToPos.get(fd)) {
                return null;
            }
            return pos;
        }
        updatePos(fd, pos, bytesLength) {
            const lastKnownPos = this.mapHandleToPos.get(fd);
            if (typeof lastKnownPos === 'number') {
                // pos !== null signals that previously a position was used that is
                // not null. node.js documentation explains, that in this case
                // the internal file pointer is not moving and as such we do not move
                // our position pointer.
                //
                // Docs: "If position is null, data will be read from the current file position,
                // and the file position will be updated. If position is an integer, the file position
                // will remain unchanged."
                if (typeof pos === 'number') {
                    // do not modify the position
                }
                // bytesLength = number is a signal that the read/write operation was
                // successful and as such we need to advance the position in the Map
                //
                // Docs (http://man7.org/linux/man-pages/man2/read.2.html):
                // "On files that support seeking, the read operation commences at the
                // file offset, and the file offset is incremented by the number of
                // bytes read."
                //
                // Docs (http://man7.org/linux/man-pages/man2/write.2.html):
                // "For a seekable file (i.e., one to which lseek(2) may be applied, for
                // example, a regular file) writing takes place at the file offset, and
                // the file offset is incremented by the number of bytes actually
                // written."
                else if (typeof bytesLength === 'number') {
                    this.mapHandleToPos.set(fd, lastKnownPos + bytesLength);
                }
                // bytesLength = null signals an error in the read/write operation
                // and as such we drop the handle from the Map because the position
                // is unspecificed at this point.
                else {
                    this.mapHandleToPos.delete(fd);
                }
            }
        }
        async write(fd, pos, data, offset, length) {
            // We know at this point that the file to write to is truncated and thus empty
            // if the write now fails, the file remains empty. as such we really try hard
            // to ensure the write succeeds by retrying up to three times.
            return (0, async_1.retry)(() => this.doWrite(fd, pos, data, offset, length), 100 /* ms delay */, 3 /* retries */);
        }
        async doWrite(fd, pos, data, offset, length) {
            const normalizedPos = this.normalizePos(fd, pos);
            let bytesWritten = null;
            try {
                bytesWritten = (await pfs_1.Promises.write(fd, data, offset, length, normalizedPos)).bytesWritten;
            }
            catch (error) {
                throw await this.toFileSystemProviderWriteError(this.writeHandles.get(fd), error);
            }
            finally {
                this.updatePos(fd, normalizedPos, bytesWritten);
            }
            return bytesWritten;
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async mkdir(resource) {
            try {
                await pfs_1.Promises.mkdir(this.toFilePath(resource));
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async delete(resource, opts) {
            try {
                const filePath = this.toFilePath(resource);
                if (opts.recursive) {
                    let rmMoveToPath = undefined;
                    if (opts?.atomic !== false && opts.atomic.postfix) {
                        rmMoveToPath = (0, path_1.join)((0, path_1.dirname)(filePath), `${(0, path_1.basename)(filePath)}${opts.atomic.postfix}`);
                    }
                    await pfs_1.Promises.rm(filePath, pfs_1.RimRafMode.MOVE, rmMoveToPath);
                }
                else {
                    try {
                        await pfs_1.Promises.unlink(filePath);
                    }
                    catch (unlinkError) {
                        // `fs.unlink` will throw when used on directories
                        // we try to detect this error and then see if the
                        // provided resource is actually a directory. in that
                        // case we use `fs.rmdir` to delete the directory.
                        if (unlinkError.code === 'EPERM' || unlinkError.code === 'EISDIR') {
                            let isDirectory = false;
                            try {
                                const { stat, symbolicLink } = await pfs_1.SymlinkSupport.stat(filePath);
                                isDirectory = stat.isDirectory() && !symbolicLink;
                            }
                            catch (statError) {
                                // ignore
                            }
                            if (isDirectory) {
                                await pfs_1.Promises.rmdir(filePath);
                            }
                            else {
                                throw unlinkError;
                            }
                        }
                        else {
                            throw unlinkError;
                        }
                    }
                }
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async rename(from, to, opts) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            if (fromFilePath === toFilePath) {
                return; // simulate node.js behaviour here and do a no-op if paths match
            }
            try {
                // Validate the move operation can perform
                await this.validateMoveCopy(from, to, 'move', opts.overwrite);
                // Rename
                await pfs_1.Promises.rename(fromFilePath, toFilePath);
            }
            catch (error) {
                // Rewrite some typical errors that can happen especially around symlinks
                // to something the user can better understand
                if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                    error = new Error((0, nls_1.localize)('moveError', "Unable to move '{0}' into '{1}' ({2}).", (0, path_1.basename)(fromFilePath), (0, path_1.basename)((0, path_1.dirname)(toFilePath)), error.toString()));
                }
                throw this.toFileSystemProviderError(error);
            }
        }
        async copy(from, to, opts) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            if (fromFilePath === toFilePath) {
                return; // simulate node.js behaviour here and do a no-op if paths match
            }
            try {
                // Validate the copy operation can perform
                await this.validateMoveCopy(from, to, 'copy', opts.overwrite);
                // Copy
                await pfs_1.Promises.copy(fromFilePath, toFilePath, { preserveSymlinks: true });
            }
            catch (error) {
                // Rewrite some typical errors that can happen especially around symlinks
                // to something the user can better understand
                if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                    error = new Error((0, nls_1.localize)('copyError', "Unable to copy '{0}' into '{1}' ({2}).", (0, path_1.basename)(fromFilePath), (0, path_1.basename)((0, path_1.dirname)(toFilePath)), error.toString()));
                }
                throw this.toFileSystemProviderError(error);
            }
        }
        async validateMoveCopy(from, to, mode, overwrite) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            let isSameResourceWithDifferentPathCase = false;
            const isPathCaseSensitive = !!(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if (!isPathCaseSensitive) {
                isSameResourceWithDifferentPathCase = (0, extpath_1.isEqual)(fromFilePath, toFilePath, true /* ignore case */);
            }
            if (isSameResourceWithDifferentPathCase) {
                // You cannot copy the same file to the same location with different
                // path case unless you are on a case sensitive file system
                if (mode === 'copy') {
                    throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileCopyErrorPathCase', "File cannot be copied to same path with different path case"), files_1.FileSystemProviderErrorCode.FileExists);
                }
                // You can move the same file to the same location with different
                // path case on case insensitive file systems
                else if (mode === 'move') {
                    return;
                }
            }
            // Here we have to see if the target to move/copy to exists or not.
            // We need to respect the `overwrite` option to throw in case the
            // target exists.
            const fromStat = await this.statIgnoreError(from);
            if (!fromStat) {
                throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileMoveCopyErrorNotFound', "File to move/copy does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const toStat = await this.statIgnoreError(to);
            if (!toStat) {
                return; // target does not exist so we are good
            }
            if (!overwrite) {
                throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileMoveCopyErrorExists', "File at target already exists and thus will not be moved/copied to unless overwrite is specified"), files_1.FileSystemProviderErrorCode.FileExists);
            }
            // Handle existing target for move/copy
            if ((fromStat.type & files_1.FileType.File) !== 0 && (toStat.type & files_1.FileType.File) !== 0) {
                return; // node.js can move/copy a file over an existing file without having to delete it first
            }
            else {
                await this.delete(to, { recursive: true, useTrash: false, atomic: false });
            }
        }
        //#endregion
        //#region Clone File
        async cloneFile(from, to) {
            return this.doCloneFile(from, to, false /* optimistically assume parent folders exist */);
        }
        async doCloneFile(from, to, mkdir) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            const isPathCaseSensitive = !!(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if ((0, extpath_1.isEqual)(fromFilePath, toFilePath, !isPathCaseSensitive)) {
                return; // cloning is only supported `from` and `to` are different files
            }
            // Implement clone by using `fs.copyFile`, however setup locks
            // for both `from` and `to` because node.js does not ensure
            // this to be an atomic operation
            const locks = new lifecycle_1.DisposableStore();
            try {
                locks.add(await this.createResourceLock(from));
                locks.add(await this.createResourceLock(to));
                if (mkdir) {
                    await pfs_1.Promises.mkdir((0, path_1.dirname)(toFilePath), { recursive: true });
                }
                await pfs_1.Promises.copyFile(fromFilePath, toFilePath);
            }
            catch (error) {
                if (error.code === 'ENOENT' && !mkdir) {
                    return this.doCloneFile(from, to, true);
                }
                throw this.toFileSystemProviderError(error);
            }
            finally {
                locks.dispose();
            }
        }
        //#endregion
        //#region File Watching
        createUniversalWatcher(onChange, onLogMessage, verboseLogging) {
            return new watcherClient_1.UniversalWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging);
        }
        createNonRecursiveWatcher(onChange, onLogMessage, verboseLogging) {
            return new nodejsClient_1.NodeJSWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging);
        }
        //#endregion
        //#region Helpers
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let resultError = error;
            let code;
            switch (error.code) {
                case 'ENOENT':
                    code = files_1.FileSystemProviderErrorCode.FileNotFound;
                    break;
                case 'EISDIR':
                    code = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                    break;
                case 'ENOTDIR':
                    code = files_1.FileSystemProviderErrorCode.FileNotADirectory;
                    break;
                case 'EEXIST':
                    code = files_1.FileSystemProviderErrorCode.FileExists;
                    break;
                case 'EPERM':
                case 'EACCES':
                    code = files_1.FileSystemProviderErrorCode.NoPermissions;
                    break;
                case 'ERR_UNC_HOST_NOT_ALLOWED':
                    resultError = `${error.message}. Please update the 'security.allowedUNCHosts' setting if you want to allow this host.`;
                    code = files_1.FileSystemProviderErrorCode.Unknown;
                    break;
                default:
                    code = files_1.FileSystemProviderErrorCode.Unknown;
            }
            return (0, files_1.createFileSystemProviderError)(resultError, code);
        }
        async toFileSystemProviderWriteError(resource, error) {
            let fileSystemProviderWriteError = this.toFileSystemProviderError(error);
            // If the write error signals permission issues, we try
            // to read the file's mode to see if the file is write
            // locked.
            if (resource && fileSystemProviderWriteError.code === files_1.FileSystemProviderErrorCode.NoPermissions) {
                try {
                    const { stat } = await pfs_1.SymlinkSupport.stat(this.toFilePath(resource));
                    if (!(stat.mode & 0o200 /* File mode indicating writable by owner */)) {
                        fileSystemProviderWriteError = (0, files_1.createFileSystemProviderError)(error, files_1.FileSystemProviderErrorCode.FileWriteLocked);
                    }
                }
                catch (error) {
                    this.logService.trace(error); // ignore - return original error
                }
            }
            return fileSystemProviderWriteError;
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS9kaXNrRmlsZVN5c3RlbVByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTJCaEc7OztPQUdHO0lBQ0gsQ0FBQyxHQUFHLEVBQUU7UUFDTCxJQUFJLENBQUM7WUFDSixJQUFBLHlCQUFXLEVBQUMsRUFBRSxDQUFDLENBQUM7UUFDakIsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RSxDQUFDO0lBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUVMLE1BQWEsc0JBQXVCLFNBQVEsdURBQThCO2lCQVUxRCw2QkFBd0IsR0FBRyxLQUFLLEFBQVIsQ0FBUyxHQUFDLDZDQUE2QztRQUU5RixZQUNDLFVBQXVCLEVBQ3ZCLE9BQXdDO1lBRXhDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFHNUIsMkJBQTJCO1lBRWxCLDRCQUF1QixHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFzRzlDLFlBQVk7WUFFWiw4QkFBOEI7WUFFYixrQkFBYSxHQUFHLElBQUksaUJBQVcsQ0FBVSxRQUFRLENBQUMsRUFBRSxDQUFDLHNDQUEwQixDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUEySzVHLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7WUFDM0Msb0JBQWUsR0FBRyxJQUFJLEdBQUcsRUFBdUIsQ0FBQztZQUVqRCxpQkFBWSxHQUFHLElBQUksR0FBRyxFQUFlLENBQUM7UUE1UnZELENBQUM7UUFP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