/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/extpath", "vs/base/node/pfs", "vs/platform/files/common/watcher"], function (require, exports, fs_1, async_1, cancellation_1, extpath_1, lifecycle_1, normalization_1, path_1, platform_1, resources_1, uri_1, extpath_2, pfs_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSFileWatcherLibrary = void 0;
    exports.watchFileContents = watchFileContents;
    class NodeJSFileWatcherLibrary extends lifecycle_1.Disposable {
        // A delay in reacting to file deletes to support
        // atomic save operations where a tool may chose
        // to delete a file before creating it again for
        // an update.
        static { this.FILE_DELETE_HANDLER_DELAY = 100; }
        // A delay for collecting file changes from node.js
        // before collecting them for coalescing and emitting
        // Same delay as used for the recursive watcher.
        static { this.FILE_CHANGES_HANDLER_DELAY = 75; }
        constructor(request, onDidFilesChange, onDidWatchFail, onLogMessage, verboseLogging) {
            super();
            this.request = request;
            this.onDidFilesChange = onDidFilesChange;
            this.onDidWatchFail = onDidWatchFail;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            // Reduce likelyhood of spam from file events via throttling.
            // These numbers are a bit more aggressive compared to the
            // recursive watcher because we can have many individual
            // node.js watchers per request.
            // (https://github.com/microsoft/vscode/issues/124723)
            this.throttledFileChangesEmitter = this._register(new async_1.ThrottledWorker({
                maxWorkChunkSize: 100, // only process up to 100 changes at once before...
                throttleDelay: 200, // ...resting for 200ms until we process events again...
                maxBufferedWork: 10000 // ...but never buffering more than 10000 events in memory
            }, events => this.onDidFilesChange(events)));
            // Aggregate file changes over FILE_CHANGES_HANDLER_DELAY
            // to coalesce events and reduce spam.
            this.fileChangesAggregator = this._register(new async_1.RunOnceWorker(events => this.handleFileChanges(events), NodeJSFileWatcherLibrary.FILE_CHANGES_HANDLER_DELAY));
            this.excludes = (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.excludes);
            this.includes = this.request.includes ? (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.includes) : undefined;
            this.cts = new cancellation_1.CancellationTokenSource();
            this.ready = this.watch();
        }
        async watch() {
            try {
                const realPath = await this.normalizePath(this.request);
                if (this.cts.token.isCancellationRequested) {
                    return;
                }
                const stat = await pfs_1.Promises.stat(realPath);
                if (this.cts.token.isCancellationRequested) {
                    return;
                }
                this._register(await this.doWatch(realPath, stat.isDirectory()));
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.error(error);
                }
                else {
                    this.trace(`ignoring a path for watching who's stat info failed to resolve: ${this.request.path} (error: ${error})`);
                }
                this.onDidWatchFail?.();
            }
        }
        async normalizePath(request) {
            let realPath = request.path;
            try {
                // First check for symbolic link
                realPath = await pfs_1.Promises.realpath(request.path);
                // Second check for casing difference
                // Note: this will be a no-op on Linux platforms
                if (request.path === realPath) {
                    realPath = await (0, extpath_2.realcase)(request.path, this.cts.token) ?? request.path;
                }
                // Correct watch path as needed
                if (request.path !== realPath) {
                    this.trace(`correcting a path to watch that seems to be a symbolic link or wrong casing (original: ${request.path}, real: ${realPath})`);
                }
            }
            catch (error) {
                // ignore
            }
            return realPath;
        }
        async doWatch(path, isDirectory) {
            // macOS: watching samba shares can crash VSCode so we do
            // a simple check for the file path pointing to /Volumes
            // (https://github.com/microsoft/vscode/issues/106879)
            // TODO@electron this needs a revisit when the crash is
            // fixed or mitigated upstream.
            if (platform_1.isMacintosh && (0, extpath_1.isEqualOrParent)(path, '/Volumes/', true)) {
                this.error(`Refusing to watch ${path} for changes using fs.watch() for possibly being a network share where watching is unreliable and unstable.`);
                return lifecycle_1.Disposable.None;
            }
            const cts = new cancellation_1.CancellationTokenSource(this.cts.token);
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const requestResource = uri_1.URI.file(this.request.path);
                const pathBasename = (0, path_1.basename)(path);
                // Creating watcher can fail with an exception
                const watcher = (0, fs_1.watch)(path);
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    watcher.removeAllListeners();
                    watcher.close();
                }));
                this.trace(`Started watching: '${path}'`);
                // Folder: resolve children to emit proper events
                const folderChildren = new Set();
                if (isDirectory) {
                    try {
                        for (const child of await pfs_1.Promises.readdir(path)) {
                            folderChildren.add(child);
                        }
                    }
                    catch (error) {
                        this.error(error);
                    }
                }
                const mapPathToStatDisposable = new Map();
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    for (const [, disposable] of mapPathToStatDisposable) {
                        disposable.dispose();
                    }
                    mapPathToStatDisposable.clear();
                }));
                watcher.on('error', (code, signal) => {
                    this.error(`Failed to watch ${path} for changes using fs.watch() (${code}, ${signal})`);
                    this.onDidWatchFail?.();
                });
                watcher.on('change', (type, raw) => {
                    if (cts.token.isCancellationRequested) {
                        return; // ignore if already disposed
                    }
                    this.trace(`[raw] ["${type}"] ${raw}`);
                    // Normalize file name
                    let changedFileName = '';
                    if (raw) { // https://github.com/microsoft/vscode/issues/38191
                        changedFileName = raw.toString();
                        if (platform_1.isMacintosh) {
                            // Mac: uses NFD unicode form on disk, but we want NFC
                            // See also https://github.com/nodejs/node/issues/2165
                            changedFileName = (0, normalization_1.normalizeNFC)(changedFileName);
                        }
                    }
                    if (!changedFileName || (type !== 'change' && type !== 'rename')) {
                        return; // ignore unexpected events
                    }
                    // Folder
                    if (isDirectory) {
                        // Folder child added/deleted
                        if (type === 'rename') {
                            // Cancel any previous stats for this file if existing
                            mapPathToStatDisposable.get(changedFileName)?.dispose();
                            // Wait a bit and try see if the file still exists on disk
                            // to decide on the resulting event
                            const timeoutHandle = setTimeout(async () => {
                                mapPathToStatDisposable.delete(changedFileName);
                                // Depending on the OS the watcher runs on, there
                                // is different behaviour for when the watched
                                // folder path is being deleted:
                                //
                                // -   macOS: not reported but events continue to
                                //            work even when the folder is brought
                                //            back, though it seems every change
                                //            to a file is reported as "rename"
                                // -   Linux: "rename" event is reported with the
                                //            name of the folder and events stop
                                //            working
                                // - Windows: an EPERM error is thrown that we
                                //            handle from the `on('error')` event
                                //
                                // We do not re-attach the watcher after timeout
                                // though as we do for file watches because for
                                // file watching specifically we want to handle
                                // the atomic-write cases where the file is being
                                // deleted and recreated with different contents.
                                if (changedFileName === pathBasename && !await pfs_1.Promises.exists(path)) {
                                    this.onWatchedPathDeleted(requestResource);
                                    return;
                                }
                                // In order to properly detect renames on a case-insensitive
                                // file system, we need to use `existsChildStrictCase` helper
                                // because otherwise we would wrongly assume a file exists
                                // when it was renamed to same name but different case.
                                const fileExists = await this.existsChildStrictCase((0, path_1.join)(path, changedFileName));
                                if (cts.token.isCancellationRequested) {
                                    return; // ignore if disposed by now
                                }
                                // Figure out the correct event type:
                                // File Exists: either 'added' or 'updated' if known before
                                // File Does not Exist: always 'deleted'
                                let type;
                                if (fileExists) {
                                    if (folderChildren.has(changedFileName)) {
                                        type = 0 /* FileChangeType.UPDATED */;
                                    }
                                    else {
                                        type = 1 /* FileChangeType.ADDED */;
                                        folderChildren.add(changedFileName);
                                    }
                                }
                                else {
                                    folderChildren.delete(changedFileName);
                                    type = 2 /* FileChangeType.DELETED */;
                                }
                                this.onFileChange({ resource: (0, resources_1.joinPath)(requestResource, changedFileName), type, cId: this.request.correlationId });
                            }, NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY);
                            mapPathToStatDisposable.set(changedFileName, (0, lifecycle_1.toDisposable)(() => clearTimeout(timeoutHandle)));
                        }
                        // Folder child changed
                        else {
                            // Figure out the correct event type: if this is the
                            // first time we see this child, it can only be added
                            let type;
                            if (folderChildren.has(changedFileName)) {
                                type = 0 /* FileChangeType.UPDATED */;
                            }
                            else {
                                type = 1 /* FileChangeType.ADDED */;
                                folderChildren.add(changedFileName);
                            }
                            this.onFileChange({ resource: (0, resources_1.joinPath)(requestResource, changedFileName), type, cId: this.request.correlationId });
                        }
                    }
                    // File
                    else {
                        // File added/deleted
                        if (type === 'rename' || changedFileName !== pathBasename) {
                            // Depending on the OS the watcher runs on, there
                            // is different behaviour for when the watched
                            // file path is being deleted:
                            //
                            // -   macOS: "rename" event is reported and events
                            //            stop working
                            // -   Linux: "rename" event is reported and events
                            //            stop working
                            // - Windows: "rename" event is reported and events
                            //            continue to work when file is restored
                            //
                            // As opposed to folder watching, we re-attach the
                            // watcher after brief timeout to support "atomic save"
                            // operations where a tool may decide to delete a file
                            // and then create it with the updated contents.
                            //
                            // Different to folder watching, we emit a delete event
                            // though we never detect when the file is brought back
                            // because the watcher is disposed then.
                            const timeoutHandle = setTimeout(async () => {
                                const fileExists = await pfs_1.Promises.exists(path);
                                if (cts.token.isCancellationRequested) {
                                    return; // ignore if disposed by now
                                }
                                // File still exists, so emit as change event and reapply the watcher
                                if (fileExists) {
                                    this.onFileChange({ resource: requestResource, type: 0 /* FileChangeType.UPDATED */, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
                                    disposables.add(await this.doWatch(path, false));
                                }
                                // File seems to be really gone, so emit a deleted and failed event
                                else {
                                    this.onWatchedPathDeleted(requestResource);
                                }
                            }, NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY);
                            // Very important to dispose the watcher which now points to a stale inode
                            // and wire in a new disposable that tracks our timeout that is installed
                            disposables.clear();
                            disposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(timeoutHandle)));
                        }
                        // File changed
                        else {
                            this.onFileChange({ resource: requestResource, type: 0 /* FileChangeType.UPDATED */, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
                        }
                    }
                });
            }
            catch (error) {
                if (!cts.token.isCancellationRequested) {
                    this.error(`Failed to watch ${path} for changes using fs.watch() (${error.toString()})`);
                }
                this.onDidWatchFail?.();
            }
            return (0, lifecycle_1.toDisposable)(() => {
                cts.dispose(true);
                disposables.dispose();
            });
        }
        onWatchedPathDeleted(resource) {
            this.warn('Watcher shutdown because watched path got deleted');
            // Emit events and flush in case the watcher gets disposed
            this.onFileChange({ resource, type: 2 /* FileChangeType.DELETED */, cId: this.request.correlationId }, true /* skip excludes/includes (file is explicitly watched) */);
            this.fileChangesAggregator.flush();
            this.onDidWatchFail?.();
        }
        onFileChange(event, skipIncludeExcludeChecks = false) {
            if (this.cts.token.isCancellationRequested) {
                return;
            }
            // Logging
            if (this.verboseLogging) {
                this.trace(`${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.resource.fsPath}`);
            }
            // Add to aggregator unless excluded or not included (not if explicitly disabled)
            if (!skipIncludeExcludeChecks && this.excludes.some(exclude => exclude(event.resource.fsPath))) {
                if (this.verboseLogging) {
                    this.trace(` >> ignored (excluded) ${event.resource.fsPath}`);
                }
            }
            else if (!skipIncludeExcludeChecks && this.includes && this.includes.length > 0 && !this.includes.some(include => include(event.resource.fsPath))) {
                if (this.verboseLogging) {
                    this.trace(` >> ignored (not included) ${event.resource.fsPath}`);
                }
            }
            else {
                this.fileChangesAggregator.work(event);
            }
        }
        handleFileChanges(fileChanges) {
            // Coalesce events: merge events of same kind
            const coalescedFileChanges = (0, watcher_1.coalesceEvents)(fileChanges);
            if (coalescedFileChanges.length > 0) {
                // Logging
                if (this.verboseLogging) {
                    for (const event of coalescedFileChanges) {
                        this.trace(` >> normalized ${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.resource.fsPath}`);
                    }
                }
                // Broadcast to clients via throttled emitter
                const worked = this.throttledFileChangesEmitter.work(coalescedFileChanges);
                // Logging
                if (!worked) {
                    this.warn(`started ignoring events due to too many file change events at once (incoming: ${coalescedFileChanges.length}, most recent change: ${coalescedFileChanges[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
                }
                else {
                    if (this.throttledFileChangesEmitter.pending > 0) {
                        this.trace(`started throttling events due to large amount of file change events at once (pending: ${this.throttledFileChangesEmitter.pending}, most recent change: ${coalescedFileChanges[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
                    }
                }
            }
        }
        async existsChildStrictCase(path) {
            if (platform_1.isLinux) {
                return pfs_1.Promises.exists(path);
            }
            try {
                const pathBasename = (0, path_1.basename)(path);
                const children = await pfs_1.Promises.readdir((0, path_1.dirname)(path));
                return children.some(child => child === pathBasename);
            }
            catch (error) {
                this.trace(error);
                return false;
            }
        }
        setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
        }
        error(error) {
            if (!this.cts.token.isCancellationRequested) {
                this.onLogMessage?.({ type: 'error', message: `[File Watcher (node.js)] ${error}` });
            }
        }
        warn(message) {
            if (!this.cts.token.isCancellationRequested) {
                this.onLogMessage?.({ type: 'warn', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        trace(message) {
            if (!this.cts.token.isCancellationRequested && this.verboseLogging) {
                this.onLogMessage?.({ type: 'trace', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        dispose() {
            this.cts.dispose(true);
            super.dispose();
        }
    }
    exports.NodeJSFileWatcherLibrary = NodeJSFileWatcherLibrary;
    /**
     * Watch the provided `path` for changes and return
     * the data in chunks of `Uint8Array` for further use.
     */
    async function watchFileContents(path, onData, onReady, token, bufferSize = 512) {
        const handle = await pfs_1.Promises.open(path, 'r');
        const buffer = Buffer.allocUnsafe(bufferSize);
        const cts = new cancellation_1.CancellationTokenSource(token);
        let error = undefined;
        let isReading = false;
        const request = { path, excludes: [], recursive: false };
        const watcher = new NodeJSFileWatcherLibrary(request, changes => {
            (async () => {
                for (const { type } of changes) {
                    if (type === 0 /* FileChangeType.UPDATED */) {
                        if (isReading) {
                            return; // return early if we are already reading the output
                        }
                        isReading = true;
                        try {
                            // Consume the new contents of the file until finished
                            // everytime there is a change event signalling a change
                            while (!cts.token.isCancellationRequested) {
                                const { bytesRead } = await pfs_1.Promises.read(handle, buffer, 0, bufferSize, null);
                                if (!bytesRead || cts.token.isCancellationRequested) {
                                    break;
                                }
                                onData(buffer.slice(0, bytesRead));
                            }
                        }
                        catch (err) {
                            error = new Error(err);
                            cts.dispose(true);
                        }
                        finally {
                            isReading = false;
                        }
                    }
                }
            })();
        });
        await watcher.ready;
        onReady();
        return new Promise((resolve, reject) => {
            cts.token.onCancellationRequested(async () => {
                watcher.dispose();
                try {
                    await pfs_1.Promises.close(handle);
                }
                catch (err) {
                    error = new Error(err);
                }
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzV2F0Y2hlckxpYi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS93YXRjaGVyL25vZGVqcy9ub2RlanNXYXRjaGVyTGliLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlkaEcsOENBK0RDO0lBL2ZELE1BQWEsd0JBQXlCLFNBQVEsc0JBQVU7UUFFdkQsaURBQWlEO1FBQ2pELGdEQUFnRDtRQUNoRCxnREFBZ0Q7UUFDaEQsYUFBYTtpQkFDVyw4QkFBeUIsR0FBRyxHQUFHLEFBQU4sQ0FBTztRQUV4RCxtREFBbUQ7UUFDbkQscURBQXFEO1FBQ3JELGdEQUFnRDtpQkFDeEIsK0JBQTBCLEdBQUcsRUFBRSxBQUFMLENBQU07UUEyQnhELFlBQ2tCLE9BQWtDLEVBQ2xDLGdCQUFrRCxFQUNsRCxjQUEyQixFQUMzQixZQUF5QyxFQUNsRCxjQUF3QjtZQUVoQyxLQUFLLEVBQUUsQ0FBQztZQU5TLFlBQU8sR0FBUCxPQUFPLENBQTJCO1lBQ2xDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBa0M7WUFDbEQsbUJBQWMsR0FBZCxjQUFjLENBQWE7WUFDM0IsaUJBQVksR0FBWixZQUFZLENBQTZCO1lBQ2xELG1CQUFjLEdBQWQsY0FBYyxDQUFVO1lBOUJqQyw2REFBNkQ7WUFDN0QsMERBQTBEO1lBQzFELHdEQUF3RDtZQUN4RCxnQ0FBZ0M7WUFDaEMsc0RBQXNEO1lBQ3JDLGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1QkFBZSxDQUNoRjtnQkFDQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUUsbURBQW1EO2dCQUMxRSxhQUFhLEVBQUUsR0FBRyxFQUFLLHdEQUF3RDtnQkFDL0UsZUFBZSxFQUFFLEtBQUssQ0FBRSwwREFBMEQ7YUFDbEYsRUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FDdkMsQ0FBQyxDQUFDO1lBRUgseURBQXlEO1lBQ3pELHNDQUFzQztZQUNyQiwwQkFBcUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkscUJBQWEsQ0FBYyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsRUFBRSx3QkFBd0IsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7WUFFdEssYUFBUSxHQUFHLElBQUEsOEJBQW9CLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMxRSxhQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUEsOEJBQW9CLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBRTlHLFFBQUcsR0FBRyxJQUFJLHNDQUF1QixFQUFFLENBQUM7WUFFNUMsVUFBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQVU5QixDQUFDO1FBRU8sS0FBSyxDQUFDLEtBQUs7WUFDbEIsSUFBSSxDQUFDO2dCQUNKLE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRXhELElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQkFDNUMsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sY0FBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFM0MsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUM1QyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsQ0FBQztxQkFBTSxDQUFDO29CQUNQLElBQUksQ0FBQyxLQUFLLENBQUMsbUVBQW1FLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxZQUFZLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ3RILENBQUM7Z0JBRUQsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7WUFDekIsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsYUFBYSxDQUFDLE9BQWtDO1lBQzdELElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFFNUIsSUFBSSxDQUFDO2dCQUVKLGdDQUFnQztnQkFDaEMsUUFBUSxHQUFHLE1BQU0sY0FBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRWpELHFDQUFxQztnQkFDckMsZ0RBQWdEO2dCQUNoRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQy9CLFFBQVEsR0FBRyxNQUFNLElBQUEsa0JBQVEsRUFBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDekUsQ0FBQztnQkFFRCwrQkFBK0I7Z0JBQy9CLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztvQkFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQywwRkFBMEYsT0FBTyxDQUFDLElBQUksV0FBVyxRQUFRLEdBQUcsQ0FBQyxDQUFDO2dCQUMxSSxDQUFDO1lBQ0YsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLFNBQVM7WUFDVixDQUFDO1lBRUQsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVPLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBWSxFQUFFLFdBQW9CO1lBRXZELHlEQUF5RDtZQUN6RCx3REFBd0Q7WUFDeEQsc0RBQXNEO1lBQ3RELHVEQUF1RDtZQUN2RCwrQkFBK0I7WUFDL0IsSUFBSSxzQkFBVyxJQUFJLElBQUEseUJBQWUsRUFBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQzdELElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLElBQUksNkdBQTZHLENBQUMsQ0FBQztnQkFFbkosT0FBTyxzQkFBVSxDQUFDLElBQUksQ0FBQztZQUN4QixDQUFDO1lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxzQ0FBdUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXhELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBRTFDLElBQUksQ0FBQztnQkFDSixNQUFNLGVBQWUsR0FBRyxTQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sWUFBWSxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQyw4Q0FBOEM7Z0JBQzlDLE1BQU0sT0FBTyxHQUFHLElBQUEsVUFBSyxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1QixXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7b0JBQ2pDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUM3QixPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRUosSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsSUFBSSxHQUFHLENBQUMsQ0FBQztnQkFFMUMsaURBQWlEO2dCQUNqRCxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO2dCQUN6QyxJQUFJLFdBQVcsRUFBRSxDQUFDO29CQUNqQixJQUFJLENBQUM7d0JBQ0osS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLGNBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQzs0QkFDbEQsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDM0IsQ0FBQztvQkFDRixDQUFDO29CQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7d0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ25CLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLHVCQUF1QixHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO2dCQUMvRCxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7b0JBQ2pDLEtBQUssTUFBTSxDQUFDLEVBQUUsVUFBVSxDQUFDLElBQUksdUJBQXVCLEVBQUUsQ0FBQzt3QkFDdEQsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUN0QixDQUFDO29CQUNELHVCQUF1QixDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVKLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBWSxFQUFFLE1BQWMsRUFBRSxFQUFFO29CQUNwRCxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLGtDQUFrQyxJQUFJLEtBQUssTUFBTSxHQUFHLENBQUMsQ0FBQztvQkFFeEYsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxDQUFDO2dCQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUFFO29CQUNsQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzt3QkFDdkMsT0FBTyxDQUFDLDZCQUE2QjtvQkFDdEMsQ0FBQztvQkFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7b0JBRXZDLHNCQUFzQjtvQkFDdEIsSUFBSSxlQUFlLEdBQUcsRUFBRSxDQUFDO29CQUN6QixJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsbURBQW1EO3dCQUM3RCxlQUFlLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO3dCQUNqQyxJQUFJLHNCQUFXLEVBQUUsQ0FBQzs0QkFDakIsc0RBQXNEOzRCQUN0RCxzREFBc0Q7NEJBQ3RELGVBQWUsR0FBRyxJQUFBLDRCQUFZLEVBQUMsZUFBZSxDQUFDLENBQUM7d0JBQ2pELENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsSUFBSSxJQUFJLEtBQUssUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFDbEUsT0FBTyxDQUFDLDJCQUEyQjtvQkFDcEMsQ0FBQztvQkFFRCxTQUFTO29CQUNULElBQUksV0FBVyxFQUFFLENBQUM7d0JBRWpCLDZCQUE2Qjt3QkFDN0IsSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7NEJBRXZCLHNEQUFzRDs0QkFDdEQsdUJBQXVCLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDOzRCQUV4RCwwREFBMEQ7NEJBQzFELG1DQUFtQzs0QkFDbkMsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLEtBQUssSUFBSSxFQUFFO2dDQUMzQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7Z0NBRWhELGlEQUFpRDtnQ0FDakQsOENBQThDO2dDQUM5QyxnQ0FBZ0M7Z0NBQ2hDLEVBQUU7Z0NBQ0YsaURBQWlEO2dDQUNqRCxrREFBa0Q7Z0NBQ2xELGdEQUFnRDtnQ0FDaEQsK0NBQStDO2dDQUMvQyxpREFBaUQ7Z0NBQ2pELGdEQUFnRDtnQ0FDaEQscUJBQXFCO2dDQUNyQiw4Q0FBOEM7Z0NBQzlDLGlEQUFpRDtnQ0FDakQsRUFBRTtnQ0FDRixnREFBZ0Q7Z0NBQ2hELCtDQUErQztnQ0FDL0MsK0NBQStDO2dDQUMvQyxpREFBaUQ7Z0NBQ2pELGlEQUFpRDtnQ0FDakQsSUFBSSxlQUFlLEtBQUssWUFBWSxJQUFJLENBQUMsTUFBTSxjQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7b0NBQ3RFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQ0FFM0MsT0FBTztnQ0FDUixDQUFDO2dDQUVELDREQUE0RDtnQ0FDNUQsNkRBQTZEO2dDQUM3RCwwREFBMEQ7Z0NBQzFELHVEQUF1RDtnQ0FDdkQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBQSxXQUFJLEVBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDLENBQUM7Z0NBRWpGLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29DQUN2QyxPQUFPLENBQUMsNEJBQTRCO2dDQUNyQyxDQUFDO2dDQUVELHFDQUFxQztnQ0FDckMsMkRBQTJEO2dDQUMzRCx3Q0FBd0M7Z0NBQ3hDLElBQUksSUFBb0IsQ0FBQztnQ0FDekIsSUFBSSxVQUFVLEVBQUUsQ0FBQztvQ0FDaEIsSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7d0NBQ3pDLElBQUksaUNBQXlCLENBQUM7b0NBQy9CLENBQUM7eUNBQU0sQ0FBQzt3Q0FDUCxJQUFJLCtCQUF1QixDQUFDO3dDQUM1QixjQUFjLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO29DQUNyQyxDQUFDO2dDQUNGLENBQUM7cUNBQU0sQ0FBQztvQ0FDUCxjQUFjLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29DQUN2QyxJQUFJLGlDQUF5QixDQUFDO2dDQUMvQixDQUFDO2dDQUVELElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBQSxvQkFBUSxFQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQzs0QkFDcEgsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLHlCQUF5QixDQUFDLENBQUM7NEJBRXZELHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQy9GLENBQUM7d0JBRUQsdUJBQXVCOzZCQUNsQixDQUFDOzRCQUVMLG9EQUFvRDs0QkFDcEQscURBQXFEOzRCQUNyRCxJQUFJLElBQW9CLENBQUM7NEJBQ3pCLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDO2dDQUN6QyxJQUFJLGlDQUF5QixDQUFDOzRCQUMvQixDQUFDO2lDQUFNLENBQUM7Z0NBQ1AsSUFBSSwrQkFBdUIsQ0FBQztnQ0FDNUIsY0FBYyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQzs0QkFDckMsQ0FBQzs0QkFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUEsb0JBQVEsRUFBQyxlQUFlLEVBQUUsZUFBZSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7d0JBQ3BILENBQUM7b0JBQ0YsQ0FBQztvQkFFRCxPQUFPO3lCQUNGLENBQUM7d0JBRUwscUJBQXFCO3dCQUNyQixJQUFJLElBQUksS0FBSyxRQUFRLElBQUksZUFBZSxLQUFLLFlBQVksRUFBRSxDQUFDOzRCQUUzRCxpREFBaUQ7NEJBQ2pELDhDQUE4Qzs0QkFDOUMsOEJBQThCOzRCQUM5QixFQUFFOzRCQUNGLG1EQUFtRDs0QkFDbkQsMEJBQTBCOzRCQUMxQixtREFBbUQ7NEJBQ25ELDBCQUEwQjs0QkFDMUIsbURBQW1EOzRCQUNuRCxvREFBb0Q7NEJBQ3BELEVBQUU7NEJBQ0Ysa0RBQWtEOzRCQUNsRCx1REFBdUQ7NEJBQ3ZELHNEQUFzRDs0QkFDdEQsZ0RBQWdEOzRCQUNoRCxFQUFFOzRCQUNGLHVEQUF1RDs0QkFDdkQsdURBQXVEOzRCQUN2RCx3Q0FBd0M7NEJBRXhDLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtnQ0FDM0MsTUFBTSxVQUFVLEdBQUcsTUFBTSxjQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dDQUUvQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztvQ0FDdkMsT0FBTyxDQUFDLDRCQUE0QjtnQ0FDckMsQ0FBQztnQ0FFRCxxRUFBcUU7Z0NBQ3JFLElBQUksVUFBVSxFQUFFLENBQUM7b0NBQ2hCLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLElBQUksZ0NBQXdCLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxDQUFDLHlEQUF5RCxDQUFDLENBQUM7b0NBRWhMLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dDQUNsRCxDQUFDO2dDQUVELG1FQUFtRTtxQ0FDOUQsQ0FBQztvQ0FDTCxJQUFJLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUM7Z0NBQzVDLENBQUM7NEJBQ0YsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLHlCQUF5QixDQUFDLENBQUM7NEJBRXZELDBFQUEwRTs0QkFDMUUseUVBQXlFOzRCQUN6RSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ3BCLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ2xFLENBQUM7d0JBRUQsZUFBZTs2QkFDVixDQUFDOzRCQUNMLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLElBQUksZ0NBQXdCLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLEVBQUUsSUFBSSxDQUFDLHlEQUF5RCxDQUFDLENBQUM7d0JBQ2pMLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29CQUN4QyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLGtDQUFrQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUMxRixDQUFDO2dCQUVELElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDO1lBQ3pCLENBQUM7WUFFRCxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xCLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2QixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFTyxvQkFBb0IsQ0FBQyxRQUFhO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsbURBQW1ELENBQUMsQ0FBQztZQUUvRCwwREFBMEQ7WUFDMUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLGdDQUF3QixFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLElBQUksQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO1lBQy9KLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVuQyxJQUFJLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQztRQUN6QixDQUFDO1FBRU8sWUFBWSxDQUFDLEtBQWtCLEVBQUUsd0JBQXdCLEdBQUcsS0FBSztZQUN4RSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQzVDLE9BQU87WUFDUixDQUFDO1lBRUQsVUFBVTtZQUNWLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksaUNBQXlCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksbUNBQTJCLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUMvSixDQUFDO1lBRUQsaUZBQWlGO1lBQ2pGLElBQUksQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDaEcsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDL0QsQ0FBQztZQUNGLENBQUM7aUJBQU0sSUFBSSxDQUFDLHdCQUF3QixJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JKLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsS0FBSyxDQUFDLDhCQUE4QixLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ25FLENBQUM7WUFDRixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN4QyxDQUFDO1FBQ0YsQ0FBQztRQUVPLGlCQUFpQixDQUFDLFdBQTBCO1lBRW5ELDZDQUE2QztZQUM3QyxNQUFNLG9CQUFvQixHQUFHLElBQUEsd0JBQWMsRUFBQyxXQUFXLENBQUMsQ0FBQztZQUN6RCxJQUFJLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFFckMsVUFBVTtnQkFDVixJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztvQkFDekIsS0FBSyxNQUFNLEtBQUssSUFBSSxvQkFBb0IsRUFBRSxDQUFDO3dCQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixLQUFLLENBQUMsSUFBSSxpQ0FBeUIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxtQ0FBMkIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO29CQUM5SyxDQUFDO2dCQUNGLENBQUM7Z0JBRUQsNkNBQTZDO2dCQUM3QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBRTNFLFVBQVU7Z0JBQ1YsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsaUZBQWlGLG9CQUFvQixDQUFDLE1BQU0seUJBQXlCLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLGlIQUFpSCxDQUFDLENBQUM7Z0JBQzFTLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ2xELElBQUksQ0FBQyxLQUFLLENBQUMseUZBQXlGLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLHlCQUF5QixvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxpSEFBaUgsQ0FBQyxDQUFDO29CQUNoVSxDQUFDO2dCQUNGLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFZO1lBQy9DLElBQUksa0JBQU8sRUFBRSxDQUFDO2dCQUNiLE9BQU8sY0FBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM5QixDQUFDO1lBRUQsSUFBSSxDQUFDO2dCQUNKLE1BQU0sWUFBWSxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQVEsQ0FBQyxPQUFPLENBQUMsSUFBQSxjQUFPLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFFdkQsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLFlBQVksQ0FBQyxDQUFDO1lBQ3ZELENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVsQixPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7UUFDRixDQUFDO1FBRUQsaUJBQWlCLENBQUMsY0FBdUI7WUFDeEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDdEMsQ0FBQztRQUVPLEtBQUssQ0FBQyxLQUFhO1lBQzFCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUM3QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSw0QkFBNEIsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RGLENBQUM7UUFDRixDQUFDO1FBRU8sSUFBSSxDQUFDLE9BQWU7WUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLDRCQUE0QixPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkYsQ0FBQztRQUNGLENBQUM7UUFFTyxLQUFLLENBQUMsT0FBZTtZQUM1QixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNwRSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSw0QkFBNEIsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7UUFDRixDQUFDO1FBRVEsT0FBTztZQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZCLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDOztJQXpiRiw0REEwYkM7SUFFRDs7O09BR0c7SUFDSSxLQUFLLFVBQVUsaUJBQWlCLENBQUMsSUFBWSxFQUFFLE1BQW1DLEVBQUUsT0FBbUIsRUFBRSxLQUF3QixFQUFFLFVBQVUsR0FBRyxHQUFHO1FBQ3pKLE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU5QyxNQUFNLEdBQUcsR0FBRyxJQUFJLHNDQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9DLElBQUksS0FBSyxHQUFzQixTQUFTLENBQUM7UUFDekMsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBRXRCLE1BQU0sT0FBTyxHQUE4QixFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQztRQUNwRixNQUFNLE9BQU8sR0FBRyxJQUFJLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTtZQUMvRCxDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUNYLEtBQUssTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLE9BQU8sRUFBRSxDQUFDO29CQUNoQyxJQUFJLElBQUksbUNBQTJCLEVBQUUsQ0FBQzt3QkFFckMsSUFBSSxTQUFTLEVBQUUsQ0FBQzs0QkFDZixPQUFPLENBQUMsb0RBQW9EO3dCQUM3RCxDQUFDO3dCQUVELFNBQVMsR0FBRyxJQUFJLENBQUM7d0JBRWpCLElBQUksQ0FBQzs0QkFDSixzREFBc0Q7NEJBQ3RELHdEQUF3RDs0QkFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQ0FDM0MsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLE1BQU0sY0FBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0NBQy9FLElBQUksQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO29DQUNyRCxNQUFNO2dDQUNQLENBQUM7Z0NBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7NEJBQ3BDLENBQUM7d0JBQ0YsQ0FBQzt3QkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOzRCQUNkLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs0QkFDdkIsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDbkIsQ0FBQztnQ0FBUyxDQUFDOzRCQUNWLFNBQVMsR0FBRyxLQUFLLENBQUM7d0JBQ25CLENBQUM7b0JBQ0YsQ0FBQztnQkFDRixDQUFDO1lBQ0YsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3BCLE9BQU8sRUFBRSxDQUFDO1FBRVYsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QyxHQUFHLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUM1QyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBRWxCLElBQUksQ0FBQztvQkFDSixNQUFNLGNBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7Z0JBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztvQkFDZCxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3hCLENBQUM7Z0JBRUQsSUFBSSxLQUFLLEVBQUUsQ0FBQztvQkFDWCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2YsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUM7WUFDRixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyJ9