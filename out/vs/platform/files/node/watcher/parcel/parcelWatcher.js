/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "@parcel/watcher", "fs", "os", "vs/base/common/uri", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/glob", "vs/platform/files/node/watcher/baseWatcher", "vs/base/common/ternarySearchTree", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/extpath", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/platform/files/common/watcher"], function (require, exports, parcelWatcher, fs_1, os_1, uri_1, async_1, cancellation_1, errorMessage_1, event_1, extpath_1, glob_1, baseWatcher_1, ternarySearchTree_1, normalization_1, path_1, platform_1, extpath_2, nodejsWatcherLib_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParcelWatcher = void 0;
    class ParcelWatcher extends baseWatcher_1.BaseWatcher {
        static { this.MAP_PARCEL_WATCHER_ACTION_TO_FILE_CHANGE = new Map([
            ['create', 1 /* FileChangeType.ADDED */],
            ['update', 0 /* FileChangeType.UPDATED */],
            ['delete', 2 /* FileChangeType.DELETED */]
        ]); }
        static { this.PARCEL_WATCHER_BACKEND = platform_1.isWindows ? 'windows' : platform_1.isLinux ? 'inotify' : 'fs-events'; }
        // A delay for collecting file changes from Parcel
        // before collecting them for coalescing and emitting.
        // Parcel internally uses 50ms as delay, so we use 75ms,
        // to schedule sufficiently after Parcel.
        //
        // Note: since Parcel 2.0.7, the very first event is
        // emitted without delay if no events occured over a
        // duration of 500ms. But we always want to aggregate
        // events to apply our coleasing logic.
        //
        static { this.FILE_CHANGES_HANDLER_DELAY = 75; }
        constructor() {
            super();
            this._onDidError = this._register(new event_1.Emitter());
            this.onDidError = this._onDidError.event;
            this.watchers = new Set();
            // Reduce likelyhood of spam from file events via throttling.
            // (https://github.com/microsoft/vscode/issues/124723)
            this.throttledFileChangesEmitter = this._register(new async_1.ThrottledWorker({
                maxWorkChunkSize: 500, // only process up to 500 changes at once before...
                throttleDelay: 200, // ...resting for 200ms until we process events again...
                maxBufferedWork: 30000 // ...but never buffering more than 30000 events in memory
            }, events => this._onDidChangeFile.fire(events)));
            this.verboseLogging = false;
            this.enospcErrorLogged = false;
            this.registerListeners();
        }
        registerListeners() {
            // Error handling on process
            process.on('uncaughtException', error => this.onUnexpectedError(error));
            process.on('unhandledRejection', error => this.onUnexpectedError(error));
        }
        async doWatch(requests) {
            // Figure out duplicates to remove from the requests
            requests = this.removeDuplicateRequests(requests);
            // Figure out which watchers to start and which to stop
            const requestsToStart = [];
            const watchersToStop = new Set(Array.from(this.watchers));
            for (const request of requests) {
                const watcher = this.findWatcher(request);
                if (watcher && (0, glob_1.patternsEquals)(watcher.request.excludes, request.excludes) && (0, glob_1.patternsEquals)(watcher.request.includes, request.includes) && watcher.request.pollingInterval === request.pollingInterval) {
                    watchersToStop.delete(watcher); // keep watcher
                }
                else {
                    requestsToStart.push(request); // start watching
                }
            }
            // Logging
            if (requestsToStart.length) {
                this.trace(`Request to start watching: ${requestsToStart.map(request => this.requestToString(request)).join(',')}`);
            }
            if (watchersToStop.size) {
                this.trace(`Request to stop watching: ${Array.from(watchersToStop).map(watcher => this.requestToString(watcher.request)).join(',')}`);
            }
            // Stop watching as instructed
            for (const watcher of watchersToStop) {
                await this.stopWatching(watcher);
            }
            // Start watching as instructed
            for (const request of requestsToStart) {
                if (request.pollingInterval) {
                    this.startPolling(request, request.pollingInterval);
                }
                else {
                    this.startWatching(request);
                }
            }
        }
        findWatcher(request) {
            for (const watcher of this.watchers) {
                // Requests or watchers with correlation always match on that
                if (typeof request.correlationId === 'number' || typeof watcher.request.correlationId === 'number') {
                    if (watcher.request.correlationId === request.correlationId) {
                        return watcher;
                    }
                }
                // Non-correlated requests or watchers match on path
                else {
                    if ((0, extpath_1.isEqual)(watcher.request.path, request.path, !platform_1.isLinux /* ignorecase */)) {
                        return watcher;
                    }
                }
            }
            return undefined;
        }
        startPolling(request, pollingInterval, restarts = 0) {
            const cts = new cancellation_1.CancellationTokenSource();
            const instance = new async_1.DeferredPromise();
            const snapshotFile = (0, extpath_1.randomPath)((0, os_1.tmpdir)(), 'vscode-watcher-snapshot');
            // Remember as watcher instance
            const watcher = {
                request,
                ready: instance.p,
                restarts,
                token: cts.token,
                worker: new async_1.RunOnceWorker(events => this.handleParcelEvents(events, watcher), ParcelWatcher.FILE_CHANGES_HANDLER_DELAY),
                stop: async () => {
                    cts.dispose(true);
                    watcher.worker.flush();
                    watcher.worker.dispose();
                    pollingWatcher.dispose();
                    (0, fs_1.unlinkSync)(snapshotFile);
                }
            };
            this.watchers.add(watcher);
            // Path checks for symbolic links / wrong casing
            const { realPath, realPathDiffers, realPathLength } = this.normalizePath(request);
            // Warm up include patterns for usage
            const includePatterns = request.includes ? (0, watcher_1.parseWatcherPatterns)(request.path, request.includes) : undefined;
            this.trace(`Started watching: '${realPath}' with polling interval '${pollingInterval}'`);
            let counter = 0;
            const pollingWatcher = new async_1.RunOnceScheduler(async () => {
                counter++;
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // We already ran before, check for events since
                if (counter > 1) {
                    const parcelEvents = await parcelWatcher.getEventsSince(realPath, snapshotFile, { ignore: request.excludes, backend: ParcelWatcher.PARCEL_WATCHER_BACKEND });
                    if (cts.token.isCancellationRequested) {
                        return;
                    }
                    // Handle & emit events
                    this.onParcelEvents(parcelEvents, watcher, includePatterns, realPathDiffers, realPathLength);
                }
                // Store a snapshot of files to the snapshot file
                await parcelWatcher.writeSnapshot(realPath, snapshotFile, { ignore: request.excludes, backend: ParcelWatcher.PARCEL_WATCHER_BACKEND });
                // Signal we are ready now when the first snapshot was written
                if (counter === 1) {
                    instance.complete();
                }
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Schedule again at the next interval
                pollingWatcher.schedule();
            }, pollingInterval);
            pollingWatcher.schedule(0);
        }
        startWatching(request, restarts = 0) {
            const cts = new cancellation_1.CancellationTokenSource();
            const instance = new async_1.DeferredPromise();
            // Remember as watcher instance
            const watcher = {
                request,
                ready: instance.p,
                restarts,
                token: cts.token,
                worker: new async_1.RunOnceWorker(events => this.handleParcelEvents(events, watcher), ParcelWatcher.FILE_CHANGES_HANDLER_DELAY),
                stop: async () => {
                    cts.dispose(true);
                    watcher.worker.flush();
                    watcher.worker.dispose();
                    const watcherInstance = await instance.p;
                    await watcherInstance?.unsubscribe();
                }
            };
            this.watchers.add(watcher);
            // Path checks for symbolic links / wrong casing
            const { realPath, realPathDiffers, realPathLength } = this.normalizePath(request);
            // Warm up include patterns for usage
            const includePatterns = request.includes ? (0, watcher_1.parseWatcherPatterns)(request.path, request.includes) : undefined;
            parcelWatcher.subscribe(realPath, (error, parcelEvents) => {
                if (watcher.token.isCancellationRequested) {
                    return; // return early when disposed
                }
                // In any case of an error, treat this like a unhandled exception
                // that might require the watcher to restart. We do not really know
                // the state of parcel at this point and as such will try to restart
                // up to our maximum of restarts.
                if (error) {
                    this.onUnexpectedError(error, watcher);
                }
                // Handle & emit events
                this.onParcelEvents(parcelEvents, watcher, includePatterns, realPathDiffers, realPathLength);
            }, {
                backend: ParcelWatcher.PARCEL_WATCHER_BACKEND,
                ignore: watcher.request.excludes
            }).then(parcelWatcher => {
                this.trace(`Started watching: '${realPath}' with backend '${ParcelWatcher.PARCEL_WATCHER_BACKEND}'`);
                instance.complete(parcelWatcher);
            }).catch(error => {
                this.onUnexpectedError(error, watcher);
                instance.complete(undefined);
                this._onDidWatchFail.fire(request);
            });
        }
        onParcelEvents(parcelEvents, watcher, includes, realPathDiffers, realPathLength) {
            if (parcelEvents.length === 0) {
                return;
            }
            // Normalize events: handle NFC normalization and symlinks
            // It is important to do this before checking for includes
            // to check on the original path.
            this.normalizeEvents(parcelEvents, watcher.request, realPathDiffers, realPathLength);
            // Check for includes
            const includedEvents = this.handleIncludes(watcher, parcelEvents, includes);
            // Add to event aggregator for later processing
            for (const includedEvent of includedEvents) {
                watcher.worker.work(includedEvent);
            }
        }
        handleIncludes(watcher, parcelEvents, includes) {
            const events = [];
            for (const { path, type: parcelEventType } of parcelEvents) {
                const type = ParcelWatcher.MAP_PARCEL_WATCHER_ACTION_TO_FILE_CHANGE.get(parcelEventType);
                if (this.verboseLogging) {
                    this.trace(`${type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${path}`);
                }
                // Apply include filter if any
                if (includes && includes.length > 0 && !includes.some(include => include(path))) {
                    if (this.verboseLogging) {
                        this.trace(` >> ignored (not included) ${path}`);
                    }
                }
                else {
                    events.push({ type, resource: uri_1.URI.file(path), cId: watcher.request.correlationId });
                }
            }
            return events;
        }
        handleParcelEvents(parcelEvents, watcher) {
            // Coalesce events: merge events of same kind
            const coalescedEvents = (0, watcher_1.coalesceEvents)(parcelEvents);
            // Filter events: check for specific events we want to exclude
            const { events: filteredEvents, rootDeleted } = this.filterEvents(coalescedEvents, watcher);
            // Broadcast to clients
            this.emitEvents(filteredEvents, watcher);
            // Handle root path deletes
            if (rootDeleted) {
                this.onWatchedPathDeleted(watcher);
            }
        }
        emitEvents(events, watcher) {
            if (events.length === 0) {
                return;
            }
            // Logging
            if (this.verboseLogging) {
                for (const event of events) {
                    this.traceEvent(event, watcher.request);
                }
            }
            // Broadcast to clients via throttler
            const worked = this.throttledFileChangesEmitter.work(events);
            // Logging
            if (!worked) {
                this.warn(`started ignoring events due to too many file change events at once (incoming: ${events.length}, most recent change: ${events[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
            }
            else {
                if (this.throttledFileChangesEmitter.pending > 0) {
                    this.trace(`started throttling events due to large amount of file change events at once (pending: ${this.throttledFileChangesEmitter.pending}, most recent change: ${events[0].resource.fsPath}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`, watcher);
                }
            }
        }
        normalizePath(request) {
            let realPath = request.path;
            let realPathDiffers = false;
            let realPathLength = request.path.length;
            try {
                // First check for symbolic link
                realPath = (0, extpath_2.realpathSync)(request.path);
                // Second check for casing difference
                // Note: this will be a no-op on Linux platforms
                if (request.path === realPath) {
                    realPath = (0, extpath_2.realcaseSync)(request.path) ?? request.path;
                }
                // Correct watch path as needed
                if (request.path !== realPath) {
                    realPathLength = realPath.length;
                    realPathDiffers = true;
                    this.trace(`correcting a path to watch that seems to be a symbolic link or wrong casing (original: ${request.path}, real: ${realPath})`);
                }
            }
            catch (error) {
                // ignore
            }
            return { realPath, realPathDiffers, realPathLength };
        }
        normalizeEvents(events, request, realPathDiffers, realPathLength) {
            for (const event of events) {
                // Mac uses NFD unicode form on disk, but we want NFC
                if (platform_1.isMacintosh) {
                    event.path = (0, normalization_1.normalizeNFC)(event.path);
                }
                // Workaround for https://github.com/parcel-bundler/watcher/issues/68
                // where watching root drive letter adds extra backslashes.
                if (platform_1.isWindows) {
                    if (request.path.length <= 3) { // for ex. c:, C:\
                        event.path = (0, path_1.normalize)(event.path);
                    }
                }
                // Convert paths back to original form in case it differs
                if (realPathDiffers) {
                    event.path = request.path + event.path.substr(realPathLength);
                }
            }
        }
        filterEvents(events, watcher) {
            const filteredEvents = [];
            let rootDeleted = false;
            for (const event of events) {
                rootDeleted = event.type === 2 /* FileChangeType.DELETED */ && (0, extpath_1.isEqual)(event.resource.fsPath, watcher.request.path, !platform_1.isLinux);
                if (rootDeleted && !this.isCorrelated(watcher.request)) {
                    // Explicitly exclude changes to root if we have any
                    // to avoid VS Code closing all opened editors which
                    // can happen e.g. in case of network connectivity
                    // issues
                    // (https://github.com/microsoft/vscode/issues/136673)
                    //
                    // Update 2024: with the new correlated events, we
                    // really do not want to skip over file events any
                    // more, so we only ignore this event for non-correlated
                    // watch requests.
                    continue;
                }
                filteredEvents.push(event);
            }
            return { events: filteredEvents, rootDeleted };
        }
        onWatchedPathDeleted(watcher) {
            this.warn('Watcher shutdown because watched path got deleted', watcher);
            this._onDidWatchFail.fire(watcher.request);
            // Do monitoring of the request path parent unless this request
            // can be handled via suspend/resume in the super class
            //
            // TODO@bpasero we should remove this logic in favor of the
            // support in the super class so that we have 1 consistent
            // solution for handling this.
            if (!this.isCorrelated(watcher.request)) {
                this.legacyMonitorRequest(watcher);
            }
        }
        legacyMonitorRequest(watcher) {
            const parentPath = (0, path_1.dirname)(watcher.request.path);
            if ((0, fs_1.existsSync)(parentPath)) {
                this.trace('Trying to watch on the parent path to restart the watcher...', watcher);
                const nodeWatcher = new nodejsWatcherLib_1.NodeJSFileWatcherLibrary({ path: parentPath, excludes: [], recursive: false, correlationId: watcher.request.correlationId }, changes => {
                    if (watcher.token.isCancellationRequested) {
                        return; // return early when disposed
                    }
                    // Watcher path came back! Restart watching...
                    for (const { resource, type } of changes) {
                        if ((0, extpath_1.isEqual)(resource.fsPath, watcher.request.path, !platform_1.isLinux) && (type === 1 /* FileChangeType.ADDED */ || type === 0 /* FileChangeType.UPDATED */)) {
                            if (this.isPathValid(watcher.request.path)) {
                                this.warn('Watcher restarts because watched path got created again', watcher);
                                // Stop watching that parent folder
                                nodeWatcher.dispose();
                                // Restart the file watching
                                this.restartWatching(watcher);
                                break;
                            }
                        }
                    }
                }, undefined, msg => this._onDidLogMessage.fire(msg), this.verboseLogging);
                // Make sure to stop watching when the watcher is disposed
                watcher.token.onCancellationRequested(() => nodeWatcher.dispose());
            }
        }
        onUnexpectedError(error, watcher) {
            const msg = (0, errorMessage_1.toErrorMessage)(error);
            // Specially handle ENOSPC errors that can happen when
            // the watcher consumes so many file descriptors that
            // we are running into a limit. We only want to warn
            // once in this case to avoid log spam.
            // See https://github.com/microsoft/vscode/issues/7950
            if (msg.indexOf('No space left on device') !== -1) {
                if (!this.enospcErrorLogged) {
                    this.error('Inotify limit reached (ENOSPC)', watcher);
                    this.enospcErrorLogged = true;
                }
            }
            // Any other error is unexpected and we should try to
            // restart the watcher as a result to get into healthy
            // state again if possible and if not attempted too much
            else {
                this.error(`Unexpected error: ${msg} (EUNKNOWN)`, watcher);
                this._onDidError.fire(msg);
            }
        }
        async stop() {
            await super.stop();
            for (const watcher of this.watchers) {
                await this.stopWatching(watcher);
            }
        }
        restartWatching(watcher, delay = 800) {
            // Restart watcher delayed to accomodate for
            // changes on disk that have triggered the
            // need for a restart in the first place.
            const scheduler = new async_1.RunOnceScheduler(async () => {
                if (watcher.token.isCancellationRequested) {
                    return; // return early when disposed
                }
                // Await the watcher having stopped, as this is
                // needed to properly re-watch the same path
                await this.stopWatching(watcher);
                // Start watcher again counting the restarts
                if (watcher.request.pollingInterval) {
                    this.startPolling(watcher.request, watcher.request.pollingInterval, watcher.restarts + 1);
                }
                else {
                    this.startWatching(watcher.request, watcher.restarts + 1);
                }
            }, delay);
            scheduler.schedule();
            watcher.token.onCancellationRequested(() => scheduler.dispose());
        }
        async stopWatching(watcher) {
            this.trace(`stopping file watcher`, watcher);
            this.watchers.delete(watcher);
            try {
                await watcher.stop();
            }
            catch (error) {
                this.error(`Unexpected error stopping watcher: ${(0, errorMessage_1.toErrorMessage)(error)}`, watcher);
            }
        }
        removeDuplicateRequests(requests, validatePaths = true) {
            // Sort requests by path length to have shortest first
            // to have a way to prevent children to be watched if
            // parents exist.
            requests.sort((requestA, requestB) => requestA.path.length - requestB.path.length);
            // Ignore requests for the same paths that have the same correlation
            const mapCorrelationtoRequests = new Map();
            for (const request of requests) {
                if (request.excludes.includes(glob_1.GLOBSTAR)) {
                    continue; // path is ignored entirely (via `**` glob exclude)
                }
                const path = platform_1.isLinux ? request.path : request.path.toLowerCase(); // adjust for case sensitivity
                let requestsForCorrelation = mapCorrelationtoRequests.get(request.correlationId);
                if (!requestsForCorrelation) {
                    requestsForCorrelation = new Map();
                    mapCorrelationtoRequests.set(request.correlationId, requestsForCorrelation);
                }
                if (requestsForCorrelation.has(path)) {
                    this.trace(`ignoring a request for watching who's path is already watched: ${this.requestToString(request)}`);
                }
                requestsForCorrelation.set(path, request);
            }
            const normalizedRequests = [];
            for (const requestsForCorrelation of mapCorrelationtoRequests.values()) {
                // Only consider requests for watching that are not
                // a child of an existing request path to prevent
                // duplication. In addition, drop any request where
                // everything is excluded (via `**` glob).
                //
                // However, allow explicit requests to watch folders
                // that are symbolic links because the Parcel watcher
                // does not allow to recursively watch symbolic links.
                const requestTrie = ternarySearchTree_1.TernarySearchTree.forPaths(!platform_1.isLinux);
                for (const request of requestsForCorrelation.values()) {
                    // Check for overlapping requests
                    if (requestTrie.findSubstr(request.path)) {
                        try {
                            const realpath = (0, extpath_2.realpathSync)(request.path);
                            if (realpath === request.path) {
                                this.trace(`ignoring a request for watching who's parent is already watched: ${this.requestToString(request)}`);
                                continue;
                            }
                        }
                        catch (error) {
                            this.trace(`ignoring a request for watching who's realpath failed to resolve: ${this.requestToString(request)} (error: ${error})`);
                            this._onDidWatchFail.fire(request);
                            continue;
                        }
                    }
                    // Check for invalid paths
                    if (validatePaths && !this.isPathValid(request.path)) {
                        this._onDidWatchFail.fire(request);
                        continue;
                    }
                    requestTrie.set(request.path, request);
                }
                normalizedRequests.push(...Array.from(requestTrie).map(([, request]) => request));
            }
            return normalizedRequests;
        }
        isPathValid(path) {
            try {
                const stat = (0, fs_1.statSync)(path);
                if (!stat.isDirectory()) {
                    this.trace(`ignoring a path for watching that is a file and not a folder: ${path}`);
                    return false;
                }
            }
            catch (error) {
                this.trace(`ignoring a path for watching who's stat info failed to resolve: ${path} (error: ${error})`);
                return false;
            }
            return true;
        }
        async setVerboseLogging(enabled) {
            this.verboseLogging = enabled;
        }
        trace(message, watcher) {
            if (this.verboseLogging) {
                this._onDidLogMessage.fire({ type: 'trace', message: this.toMessage(message, watcher) });
            }
        }
        warn(message, watcher) {
            this._onDidLogMessage.fire({ type: 'warn', message: this.toMessage(message, watcher) });
        }
        error(message, watcher) {
            this._onDidLogMessage.fire({ type: 'error', message: this.toMessage(message, watcher) });
        }
        toMessage(message, watcher) {
            return watcher ? `[File Watcher (parcel)] ${message} (path: ${watcher.request.path})` : `[File Watcher (parcel)] ${message}`;
        }
    }
    exports.ParcelWatcher = ParcelWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyY2VsV2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS93YXRjaGVyL3BhcmNlbC9wYXJjZWxXYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlEaEcsTUFBYSxhQUFjLFNBQVEseUJBQVc7aUJBRXJCLDZDQUF3QyxHQUFHLElBQUksR0FBRyxDQUN6RTtZQUNDLENBQUMsUUFBUSwrQkFBdUI7WUFDaEMsQ0FBQyxRQUFRLGlDQUF5QjtZQUNsQyxDQUFDLFFBQVEsaUNBQXlCO1NBQ2xDLENBQ0QsQUFOK0QsQ0FNOUQ7aUJBRXNCLDJCQUFzQixHQUFHLG9CQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsa0JBQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxXQUFXLEFBQTVELENBQTZEO1FBTzNHLGtEQUFrRDtRQUNsRCxzREFBc0Q7UUFDdEQsd0RBQXdEO1FBQ3hELHlDQUF5QztRQUN6QyxFQUFFO1FBQ0Ysb0RBQW9EO1FBQ3BELG9EQUFvRDtRQUNwRCxxREFBcUQ7UUFDckQsdUNBQXVDO1FBQ3ZDLEVBQUU7aUJBQ3NCLCtCQUEwQixHQUFHLEVBQUUsQUFBTCxDQUFNO1FBZ0J4RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBaENRLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVSxDQUFDLENBQUM7WUFDNUQsZUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBRTFCLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQWNoRSw2REFBNkQ7WUFDN0Qsc0RBQXNEO1lBQ3JDLGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSx1QkFBZSxD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