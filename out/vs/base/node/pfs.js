/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "os", "util", "vs/base/common/async", "vs/base/common/extpath", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, fs, os_1, util_1, async_1, extpath_1, normalization_1, path_1, platform_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Promises = exports.SymlinkSupport = exports.RimRafMode = void 0;
    exports.rimrafSync = rimrafSync;
    exports.readdirSync = readdirSync;
    exports.whenDeleted = whenDeleted;
    exports.configureFlushOnWrite = configureFlushOnWrite;
    exports.writeFileSync = writeFileSync;
    //#region rimraf
    var RimRafMode;
    (function (RimRafMode) {
        /**
         * Slow version that unlinks each file and folder.
         */
        RimRafMode[RimRafMode["UNLINK"] = 0] = "UNLINK";
        /**
         * Fast version that first moves the file/folder
         * into a temp directory and then deletes that
         * without waiting for it.
         */
        RimRafMode[RimRafMode["MOVE"] = 1] = "MOVE";
    })(RimRafMode || (exports.RimRafMode = RimRafMode = {}));
    async function rimraf(path, mode = RimRafMode.UNLINK, moveToPath) {
        if ((0, extpath_1.isRootOrDriveLetter)(path)) {
            throw new Error('rimraf - will refuse to recursively delete root');
        }
        // delete: via rm
        if (mode === RimRafMode.UNLINK) {
            return rimrafUnlink(path);
        }
        // delete: via move
        return rimrafMove(path, moveToPath);
    }
    async function rimrafMove(path, moveToPath = (0, extpath_1.randomPath)((0, os_1.tmpdir)())) {
        try {
            try {
                // Intentionally using `fs.promises` here to skip
                // the patched graceful-fs method that can result
                // in very long running `rename` calls when the
                // folder is locked by a file watcher. We do not
                // really want to slow down this operation more
                // than necessary and we have a fallback to delete
                // via unlink.
                // https://github.com/microsoft/vscode/issues/139908
                await fs.promises.rename(path, moveToPath);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    return; // ignore - path to delete did not exist
                }
                return rimrafUnlink(path); // otherwise fallback to unlink
            }
            // Delete but do not return as promise
            rimrafUnlink(moveToPath).catch(error => { });
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
    async function rimrafUnlink(path) {
        return (0, util_1.promisify)(fs.rm)(path, { recursive: true, force: true, maxRetries: 3 });
    }
    function rimrafSync(path) {
        if ((0, extpath_1.isRootOrDriveLetter)(path)) {
            throw new Error('rimraf - will refuse to recursively delete root');
        }
        fs.rmSync(path, { recursive: true, force: true, maxRetries: 3 });
    }
    async function readdir(path, options) {
        return handleDirectoryChildren(await (options ? safeReaddirWithFileTypes(path) : (0, util_1.promisify)(fs.readdir)(path)));
    }
    async function safeReaddirWithFileTypes(path) {
        try {
            return await (0, util_1.promisify)(fs.readdir)(path, { withFileTypes: true });
        }
        catch (error) {
            console.warn('[node.js fs] readdir with filetypes failed with error: ', error);
        }
        // Fallback to manually reading and resolving each
        // children of the folder in case we hit an error
        // previously.
        // This can only really happen on exotic file systems
        // such as explained in #115645 where we get entries
        // from `readdir` that we can later not `lstat`.
        const result = [];
        const children = await readdir(path);
        for (const child of children) {
            let isFile = false;
            let isDirectory = false;
            let isSymbolicLink = false;
            try {
                const lstat = await exports.Promises.lstat((0, path_1.join)(path, child));
                isFile = lstat.isFile();
                isDirectory = lstat.isDirectory();
                isSymbolicLink = lstat.isSymbolicLink();
            }
            catch (error) {
                console.warn('[node.js fs] unexpected error from lstat after readdir: ', error);
            }
            result.push({
                name: child,
                isFile: () => isFile,
                isDirectory: () => isDirectory,
                isSymbolicLink: () => isSymbolicLink
            });
        }
        return result;
    }
    /**
     * Drop-in replacement of `fs.readdirSync` with support
     * for converting from macOS NFD unicon form to NFC
     * (https://github.com/nodejs/node/issues/2165)
     */
    function readdirSync(path) {
        return handleDirectoryChildren(fs.readdirSync(path));
    }
    function handleDirectoryChildren(children) {
        return children.map(child => {
            // Mac: uses NFD unicode form on disk, but we want NFC
            // See also https://github.com/nodejs/node/issues/2165
            if (typeof child === 'string') {
                return platform_1.isMacintosh ? (0, normalization_1.normalizeNFC)(child) : child;
            }
            child.name = platform_1.isMacintosh ? (0, normalization_1.normalizeNFC)(child.name) : child.name;
            return child;
        });
    }
    /**
     * A convenience method to read all children of a path that
     * are directories.
     */
    async function readDirsInDir(dirPath) {
        const children = await readdir(dirPath);
        const directories = [];
        for (const child of children) {
            if (await SymlinkSupport.existsDirectory((0, path_1.join)(dirPath, child))) {
                directories.push(child);
            }
        }
        return directories;
    }
    //#endregion
    //#region whenDeleted()
    /**
     * A `Promise` that resolves when the provided `path`
     * is deleted from disk.
     */
    function whenDeleted(path, intervalMs = 1000) {
        return new Promise(resolve => {
            let running = false;
            const interval = setInterval(() => {
                if (!running) {
                    running = true;
                    fs.access(path, err => {
                        running = false;
                        if (err) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    });
                }
            }, intervalMs);
        });
    }
    //#endregion
    //#region Methods with symbolic links support
    var SymlinkSupport;
    (function (SymlinkSupport) {
        /**
         * Resolves the `fs.Stats` of the provided path. If the path is a
         * symbolic link, the `fs.Stats` will be from the target it points
         * to. If the target does not exist, `dangling: true` will be returned
         * as `symbolicLink` value.
         */
        async function stat(path) {
            // First stat the link
            let lstats;
            try {
                lstats = await exports.Promises.lstat(path);
                // Return early if the stat is not a symbolic link at all
                if (!lstats.isSymbolicLink()) {
                    return { stat: lstats };
                }
            }
            catch (error) {
                /* ignore - use stat() instead */
            }
            // If the stat is a symbolic link or failed to stat, use fs.stat()
            // which for symbolic links will stat the target they point to
            try {
                const stats = await exports.Promises.stat(path);
                return { stat: stats, symbolicLink: lstats?.isSymbolicLink() ? { dangling: false } : undefined };
            }
            catch (error) {
                // If the link points to a nonexistent file we still want
                // to return it as result while setting dangling: true flag
                if (error.code === 'ENOENT' && lstats) {
                    return { stat: lstats, symbolicLink: { dangling: true } };
                }
                // Windows: workaround a node.js bug where reparse points
                // are not supported (https://github.com/nodejs/node/issues/36790)
                if (platform_1.isWindows && error.code === 'EACCES') {
                    try {
                        const stats = await exports.Promises.stat(await exports.Promises.readlink(path));
                        return { stat: stats, symbolicLink: { dangling: false } };
                    }
                    catch (error) {
                        // If the link points to a nonexistent file we still want
                        // to return it as result while setting dangling: true flag
                        if (error.code === 'ENOENT' && lstats) {
                            return { stat: lstats, symbolicLink: { dangling: true } };
                        }
                        throw error;
                    }
                }
                throw error;
            }
        }
        SymlinkSupport.stat = stat;
        /**
         * Figures out if the `path` exists and is a file with support
         * for symlinks.
         *
         * Note: this will return `false` for a symlink that exists on
         * disk but is dangling (pointing to a nonexistent path).
         *
         * Use `exists` if you only care about the path existing on disk
         * or not without support for symbolic links.
         */
        async function existsFile(path) {
            try {
                const { stat, symbolicLink } = await SymlinkSupport.stat(path);
                return stat.isFile() && symbolicLink?.dangling !== true;
            }
            catch (error) {
                // Ignore, path might not exist
            }
            return false;
        }
        SymlinkSupport.existsFile = existsFile;
        /**
         * Figures out if the `path` exists and is a directory with support for
         * symlinks.
         *
         * Note: this will return `false` for a symlink that exists on
         * disk but is dangling (pointing to a nonexistent path).
         *
         * Use `exists` if you only care about the path existing on disk
         * or not without support for symbolic links.
         */
        async function existsDirectory(path) {
            try {
                const { stat, symbolicLink } = await SymlinkSupport.stat(path);
                return stat.isDirectory() && symbolicLink?.dangling !== true;
            }
            catch (error) {
                // Ignore, path might not exist
            }
            return false;
        }
        SymlinkSupport.existsDirectory = existsDirectory;
    })(SymlinkSupport || (exports.SymlinkSupport = SymlinkSupport = {}));
    //#endregion
    //#region Write File
    // According to node.js docs (https://nodejs.org/docs/v14.16.0/api/fs.html#fs_fs_writefile_file_data_options_callback)
    // it is not safe to call writeFile() on the same path multiple times without waiting for the callback to return.
    // Therefor we use a Queue on the path that is given to us to sequentialize calls to the same path properly.
    const writeQueues = new async_1.ResourceQueue();
    function writeFile(path, data, options) {
        return writeQueues.queueFor(uri_1.URI.file(path), () => {
            const ensuredOptions = ensureWriteOptions(options);
            return new Promise((resolve, reject) => doWriteFileAndFlush(path, data, ensuredOptions, error => error ? reject(error) : resolve()));
        }, resources_1.extUriBiasedIgnorePathCase);
    }
    let canFlush = true;
    function configureFlushOnWrite(enabled) {
        canFlush = enabled;
    }
    // Calls fs.writeFile() followed by a fs.sync() call to flush the changes to disk
    // We do this in cases where we want to make sure the data is really on disk and
    // not in some cache.
    //
    // See https://github.com/nodejs/node/blob/v5.10.0/lib/fs.js#L1194
    function doWriteFileAndFlush(path, data, options, callback) {
        if (!canFlush) {
            return fs.writeFile(path, data, { mode: options.mode, flag: options.flag }, callback);
        }
        // Open the file with same flags and mode as fs.writeFile()
        fs.open(path, options.flag, options.mode, (openError, fd) => {
            if (openError) {
                return callback(openError);
            }
            // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
            fs.writeFile(fd, data, writeError => {
                if (writeError) {
                    return fs.close(fd, () => callback(writeError)); // still need to close the handle on error!
                }
                // Flush contents (not metadata) of the file to disk
                // https://github.com/microsoft/vscode/issues/9589
                fs.fdatasync(fd, (syncError) => {
                    // In some exotic setups it is well possible that node fails to sync
                    // In that case we disable flushing and warn to the console
                    if (syncError) {
                        console.warn('[node.js fs] fdatasync is now disabled for this session because it failed: ', syncError);
                        configureFlushOnWrite(false);
                    }
                    return fs.close(fd, closeError => callback(closeError));
                });
            });
        });
    }
    /**
     * Same as `fs.writeFileSync` but with an additional call to
     * `fs.fdatasyncSync` after writing to ensure changes are
     * flushed to disk.
     */
    function writeFileSync(path, data, options) {
        const ensuredOptions = ensureWriteOptions(options);
        if (!canFlush) {
            return fs.writeFileSync(path, data, { mode: ensuredOptions.mode, flag: ensuredOptions.flag });
        }
        // Open the file with same flags and mode as fs.writeFile()
        const fd = fs.openSync(path, ensuredOptions.flag, ensuredOptions.mode);
        try {
            // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
            fs.writeFileSync(fd, data);
            // Flush contents (not metadata) of the file to disk
            try {
                fs.fdatasyncSync(fd); // https://github.com/microsoft/vscode/issues/9589
            }
            catch (syncError) {
                console.warn('[node.js fs] fdatasyncSync is now disabled for this session because it failed: ', syncError);
                configureFlushOnWrite(false);
            }
        }
        finally {
            fs.closeSync(fd);
        }
    }
    function ensureWriteOptions(options) {
        if (!options) {
            return { mode: 0o666 /* default node.js mode for files */, flag: 'w' };
        }
        return {
            mode: typeof options.mode === 'number' ? options.mode : 0o666 /* default node.js mode for files */,
            flag: typeof options.flag === 'string' ? options.flag : 'w'
        };
    }
    //#endregion
    //#region Move / Copy
    /**
     * A drop-in replacement for `fs.rename` that:
     * - allows to move across multiple disks
     * - attempts to retry the operation for certain error codes on Windows
     */
    async function rename(source, target, windowsRetryTimeout = 60000 /* matches graceful-fs */) {
        if (source === target) {
            return; // simulate node.js behaviour here and do a no-op if paths match
        }
        try {
            if (platform_1.isWindows && typeof windowsRetryTimeout === 'number') {
                // On Windows, a rename can fail when either source or target
                // is locked by AV software. We do leverage graceful-fs to iron
                // out these issues, however in case the target file exists,
                // graceful-fs will immediately return without retry for fs.rename().
                await renameWithRetry(source, target, Date.now(), windowsRetryTimeout);
            }
            else {
                await (0, util_1.promisify)(fs.rename)(source, target);
            }
        }
        catch (error) {
            // In two cases we fallback to classic copy and delete:
            //
            // 1.) The EXDEV error indicates that source and target are on different devices
            // In this case, fallback to using a copy() operation as there is no way to
            // rename() between different devices.
            //
            // 2.) The user tries to rename a file/folder that ends with a dot. This is not
            // really possible to move then, at least on UNC devices.
            if (source.toLowerCase() !== target.toLowerCase() && error.code === 'EXDEV' || source.endsWith('.')) {
                await copy(source, target, { preserveSymlinks: false /* copying to another device */ });
                await rimraf(source, RimRafMode.MOVE);
            }
            else {
                throw error;
            }
        }
    }
    async function renameWithRetry(source, target, startTime, retryTimeout, attempt = 0) {
        try {
            return await (0, util_1.promisify)(fs.rename)(source, target);
        }
        catch (error) {
            if (error.code !== 'EACCES' && error.code !== 'EPERM' && error.code !== 'EBUSY') {
                throw error; // only for errors we think are temporary
            }
            if (Date.now() - startTime >= retryTimeout) {
                console.error(`[node.js fs] rename failed after ${attempt} retries with error: ${error}`);
                throw error; // give up after configurable timeout
            }
            if (attempt === 0) {
                let abortRetry = false;
                try {
                    const { stat } = await SymlinkSupport.stat(target);
                    if (!stat.isFile()) {
                        abortRetry = true; // if target is not a file, EPERM error may be raised and we should not attempt to retry
                    }
                }
                catch (error) {
                    // Ignore
                }
                if (abortRetry) {
                    throw error;
                }
            }
            // Delay with incremental backoff up to 100ms
            await (0, async_1.timeout)(Math.min(100, attempt * 10));
            // Attempt again
            return renameWithRetry(source, target, startTime, retryTimeout, attempt + 1);
        }
    }
    /**
     * Recursively copies all of `source` to `target`.
     *
     * The options `preserveSymlinks` configures how symbolic
     * links should be handled when encountered. Set to
     * `false` to not preserve them and `true` otherwise.
     */
    async function copy(source, target, options) {
        return doCopy(source, target, { root: { source, target }, options, handledSourcePaths: new Set() });
    }
    // When copying a file or folder, we want to preserve the mode
    // it had and as such provide it when creating. However, modes
    // can go beyond what we expect (see link below), so we mask it.
    // (https://github.com/nodejs/node-v0.x-archive/issues/3045#issuecomment-4862588)
    const COPY_MODE_MASK = 0o777;
    async function doCopy(source, target, payload) {
        // Keep track of paths already copied to prevent
        // cycles from symbolic links to cause issues
        if (payload.handledSourcePaths.has(source)) {
            return;
        }
        else {
            payload.handledSourcePaths.add(source);
        }
        const { stat, symbolicLink } = await SymlinkSupport.stat(source);
        // Symlink
        if (symbolicLink) {
            // Try to re-create the symlink unless `preserveSymlinks: false`
            if (payload.options.preserveSymlinks) {
                try {
                    return await doCopySymlink(source, target, payload);
                }
                catch (error) {
                    // in any case of an error fallback to normal copy via dereferencing
                }
            }
            if (symbolicLink.dangling) {
                return; // skip dangling symbolic links from here on (https://github.com/microsoft/vscode/issues/111621)
            }
        }
        // Folder
        if (stat.isDirectory()) {
            return doCopyDirectory(source, target, stat.mode & COPY_MODE_MASK, payload);
        }
        // File or file-like
        else {
            return doCopyFile(source, target, stat.mode & COPY_MODE_MASK);
        }
    }
    async function doCopyDirectory(source, target, mode, payload) {
        // Create folder
        await exports.Promises.mkdir(target, { recursive: true, mode });
        // Copy each file recursively
        const files = await readdir(source);
        for (const file of files) {
            await doCopy((0, path_1.join)(source, file), (0, path_1.join)(target, file), payload);
        }
    }
    async function doCopyFile(source, target, mode) {
        // Copy file
        await exports.Promises.copyFile(source, target);
        // restore mode (https://github.com/nodejs/node/issues/1104)
        await exports.Promises.chmod(target, mode);
    }
    async function doCopySymlink(source, target, payload) {
        // Figure out link target
        let linkTarget = await exports.Promises.readlink(source);
        // Special case: the symlink points to a target that is
        // actually within the path that is being copied. In that
        // case we want the symlink to point to the target and
        // not the source
        if ((0, extpath_1.isEqualOrParent)(linkTarget, payload.root.source, !platform_1.isLinux)) {
            linkTarget = (0, path_1.join)(payload.root.target, linkTarget.substr(payload.root.source.length + 1));
        }
        // Create symlink
        await exports.Promises.symlink(linkTarget, target);
    }
    //#endregion
    //#region Promise based fs methods
    /**
     * Prefer this helper class over the `fs.promises` API to
     * enable `graceful-fs` to function properly. Given issue
     * https://github.com/isaacs/node-graceful-fs/issues/160 it
     * is evident that the module only takes care of the non-promise
     * based fs methods.
     *
     * Another reason is `realpath` being entirely different in
     * the promise based implementation compared to the other
     * one (https://github.com/microsoft/vscode/issues/118562)
     *
     * Note: using getters for a reason, since `graceful-fs`
     * patching might kick in later after modules have been
     * loaded we need to defer access to fs methods.
     * (https://github.com/microsoft/vscode/issues/124176)
     */
    exports.Promises = new class {
        //#region Implemented by node.js
        get access() { return (0, util_1.promisify)(fs.access); }
        get stat() { return (0, util_1.promisify)(fs.stat); }
        get lstat() { return (0, util_1.promisify)(fs.lstat); }
        get utimes() { return (0, util_1.promisify)(fs.utimes); }
        get read() {
            // Not using `promisify` here for a reason: the return
            // type is not an object as indicated by TypeScript but
            // just the bytes read, so we create our own wrapper.
            return (fd, buffer, offset, length, position) => {
                return new Promise((resolve, reject) => {
                    fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve({ bytesRead, buffer });
                    });
                });
            };
        }
        get readFile() { return (0, util_1.promisify)(fs.readFile); }
        get write() {
            // Not using `promisify` here for a reason: the return
            // type is not an object as indicated by TypeScript but
            // just the bytes written, so we create our own wrapper.
            return (fd, buffer, offset, length, position) => {
                return new Promise((resolve, reject) => {
                    fs.write(fd, buffer, offset, length, position, (err, bytesWritten, buffer) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve({ bytesWritten, buffer });
                    });
                });
            };
        }
        get appendFile() { return (0, util_1.promisify)(fs.appendFile); }
        get fdatasync() { return (0, util_1.promisify)(fs.fdatasync); }
        get truncate() { return (0, util_1.promisify)(fs.truncate); }
        get copyFile() { return (0, util_1.promisify)(fs.copyFile); }
        get open() { return (0, util_1.promisify)(fs.open); }
        get close() { return (0, util_1.promisify)(fs.close); }
        get symlink() { return (0, util_1.promisify)(fs.symlink); }
        get readlink() { return (0, util_1.promisify)(fs.readlink); }
        get chmod() { return (0, util_1.promisify)(fs.chmod); }
        get mkdir() { return (0, util_1.promisify)(fs.mkdir); }
        get unlink() { return (0, util_1.promisify)(fs.unlink); }
        get rmdir() { return (0, util_1.promisify)(fs.rmdir); }
        get realpath() { return (0, util_1.promisify)(fs.realpath); }
        //#endregion
        //#region Implemented by us
        async exists(path) {
            try {
                await exports.Promises.access(path);
                return true;
            }
            catch {
                return false;
            }
        }
        get readdir() { return readdir; }
        get readDirsInDir() { return readDirsInDir; }
        get writeFile() { return writeFile; }
        get rm() { return rimraf; }
        get rename() { return rename; }
        get copy() { return copy; }
    };
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGZzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL25vZGUvcGZzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlGaEcsZ0NBTUM7SUF1RUQsa0NBRUM7SUE4Q0Qsa0NBaUJDO0lBc0tELHNEQUVDO0lBOENELHNDQXlCQztJQXpjRCxnQkFBZ0I7SUFFaEIsSUFBWSxVQWFYO0lBYkQsV0FBWSxVQUFVO1FBRXJCOztXQUVHO1FBQ0gsK0NBQU0sQ0FBQTtRQUVOOzs7O1dBSUc7UUFDSCwyQ0FBSSxDQUFBO0lBQ0wsQ0FBQyxFQWJXLFVBQVUsMEJBQVYsVUFBVSxRQWFyQjtJQWNELEtBQUssVUFBVSxNQUFNLENBQUMsSUFBWSxFQUFFLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQW1CO1FBQ2hGLElBQUksSUFBQSw2QkFBbUIsRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztRQUNwRSxDQUFDO1FBRUQsaUJBQWlCO1FBQ2pCLElBQUksSUFBSSxLQUFLLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoQyxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLE9BQU8sVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQsS0FBSyxVQUFVLFVBQVUsQ0FBQyxJQUFZLEVBQUUsVUFBVSxHQUFHLElBQUEsb0JBQVUsRUFBQyxJQUFBLFdBQU0sR0FBRSxDQUFDO1FBQ3hFLElBQUksQ0FBQztZQUNKLElBQUksQ0FBQztnQkFDSixpREFBaUQ7Z0JBQ2pELGlEQUFpRDtnQkFDakQsK0NBQStDO2dCQUMvQyxnREFBZ0Q7Z0JBQ2hELCtD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