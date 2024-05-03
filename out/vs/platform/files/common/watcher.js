/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/files/common/files"], function (require, exports, glob_1, lifecycle_1, path_1, platform_1, uri_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractUniversalWatcherClient = exports.AbstractNonRecursiveWatcherClient = exports.AbstractWatcherClient = void 0;
    exports.isWatchRequestWithCorrelation = isWatchRequestWithCorrelation;
    exports.isRecursiveWatchRequest = isRecursiveWatchRequest;
    exports.reviveFileChanges = reviveFileChanges;
    exports.coalesceEvents = coalesceEvents;
    exports.normalizeWatcherPattern = normalizeWatcherPattern;
    exports.parseWatcherPatterns = parseWatcherPatterns;
    function isWatchRequestWithCorrelation(request) {
        return typeof request.correlationId === 'number';
    }
    function isRecursiveWatchRequest(request) {
        return request.recursive === true;
    }
    class AbstractWatcherClient extends lifecycle_1.Disposable {
        static { this.MAX_RESTARTS = 5; }
        constructor(onFileChanges, onLogMessage, verboseLogging, options) {
            super();
            this.onFileChanges = onFileChanges;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            this.options = options;
            this.watcherDisposables = this._register(new lifecycle_1.MutableDisposable());
            this.requests = undefined;
            this.restartCounter = 0;
        }
        init() {
            // Associate disposables to the watcher
            const disposables = new lifecycle_1.DisposableStore();
            this.watcherDisposables.value = disposables;
            // Ask implementors to create the watcher
            this.watcher = this.createWatcher(disposables);
            this.watcher.setVerboseLogging(this.verboseLogging);
            // Wire in event handlers
            disposables.add(this.watcher.onDidChangeFile(changes => this.onFileChanges(changes)));
            disposables.add(this.watcher.onDidLogMessage(msg => this.onLogMessage(msg)));
            disposables.add(this.watcher.onDidError(error => this.onError(error)));
        }
        onError(error) {
            // Restart on error (up to N times, if enabled)
            if (this.options.restartOnError) {
                if (this.restartCounter < AbstractWatcherClient.MAX_RESTARTS && this.requests) {
                    this.error(`restarting watcher after error: ${error}`);
                    this.restart(this.requests);
                }
                else {
                    this.error(`gave up attempting to restart watcher after error: ${error}`);
                }
            }
            // Do not attempt to restart if not enabled
            else {
                this.error(error);
            }
        }
        restart(requests) {
            this.restartCounter++;
            this.init();
            this.watch(requests);
        }
        async watch(requests) {
            this.requests = requests;
            await this.watcher?.watch(requests);
        }
        async setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
            await this.watcher?.setVerboseLogging(verboseLogging);
        }
        error(message) {
            this.onLogMessage({ type: 'error', message: `[File Watcher (${this.options.type})] ${message}` });
        }
        trace(message) {
            this.onLogMessage({ type: 'trace', message: `[File Watcher (${this.options.type})] ${message}` });
        }
        dispose() {
            // Render the watcher invalid from here
            this.watcher = undefined;
            return super.dispose();
        }
    }
    exports.AbstractWatcherClient = AbstractWatcherClient;
    class AbstractNonRecursiveWatcherClient extends AbstractWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging, { type: 'node.js', restartOnError: false });
        }
    }
    exports.AbstractNonRecursiveWatcherClient = AbstractNonRecursiveWatcherClient;
    class AbstractUniversalWatcherClient extends AbstractWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging, { type: 'universal', restartOnError: true });
        }
    }
    exports.AbstractUniversalWatcherClient = AbstractUniversalWatcherClient;
    function reviveFileChanges(changes) {
        return changes.map(change => ({
            type: change.type,
            resource: uri_1.URI.revive(change.resource),
            cId: change.cId
        }));
    }
    function coalesceEvents(changes) {
        // Build deltas
        const coalescer = new EventCoalescer();
        for (const event of changes) {
            coalescer.processEvent(event);
        }
        return coalescer.coalesce();
    }
    function normalizeWatcherPattern(path, pattern) {
        // Patterns are always matched on the full absolute path
        // of the event. As such, if the pattern is not absolute
        // and is a string and does not start with a leading
        // `**`, we have to convert it to a relative pattern with
        // the given `base`
        if (typeof pattern === 'string' && !pattern.startsWith(glob_1.GLOBSTAR) && !(0, path_1.isAbsolute)(pattern)) {
            return { base: path, pattern };
        }
        return pattern;
    }
    function parseWatcherPatterns(path, patterns) {
        const parsedPatterns = [];
        for (const pattern of patterns) {
            parsedPatterns.push((0, glob_1.parse)(normalizeWatcherPattern(path, pattern)));
        }
        return parsedPatterns;
    }
    class EventCoalescer {
        constructor() {
            this.coalesced = new Set();
            this.mapPathToChange = new Map();
        }
        toKey(event) {
            if (platform_1.isLinux) {
                return event.resource.fsPath;
            }
            return event.resource.fsPath.toLowerCase(); // normalise to file system case sensitivity
        }
        processEvent(event) {
            const existingEvent = this.mapPathToChange.get(this.toKey(event));
            let keepEvent = false;
            // Event path already exists
            if (existingEvent) {
                const currentChangeType = existingEvent.type;
                const newChangeType = event.type;
                // macOS/Windows: track renames to different case
                // by keeping both CREATE and DELETE events
                if (existingEvent.resource.fsPath !== event.resource.fsPath && (event.type === 2 /* FileChangeType.DELETED */ || event.type === 1 /* FileChangeType.ADDED */)) {
                    keepEvent = true;
                }
                // Ignore CREATE followed by DELETE in one go
                else if (currentChangeType === 1 /* FileChangeType.ADDED */ && newChangeType === 2 /* FileChangeType.DELETED */) {
                    this.mapPathToChange.delete(this.toKey(event));
                    this.coalesced.delete(existingEvent);
                }
                // Flatten DELETE followed by CREATE into CHANGE
                else if (currentChangeType === 2 /* FileChangeType.DELETED */ && newChangeType === 1 /* FileChangeType.ADDED */) {
                    existingEvent.type = 0 /* FileChangeType.UPDATED */;
                }
                // Do nothing. Keep the created event
                else if (currentChangeType === 1 /* FileChangeType.ADDED */ && newChangeType === 0 /* FileChangeType.UPDATED */) { }
                // Otherwise apply change type
                else {
                    existingEvent.type = newChangeType;
                }
            }
            // Otherwise keep
            else {
                keepEvent = true;
            }
            if (keepEvent) {
                this.coalesced.add(event);
                this.mapPathToChange.set(this.toKey(event), event);
            }
        }
        coalesce() {
            const addOrChangeEvents = [];
            const deletedPaths = [];
            // This algorithm will remove all DELETE events up to the root folder
            // that got deleted if any. This ensures that we are not producing
            // DELETE events for each file inside a folder that gets deleted.
            //
            // 1.) split ADD/CHANGE and DELETED events
            // 2.) sort short deleted paths to the top
            // 3.) for each DELETE, check if there is a deleted parent and ignore the event in that case
            return Array.from(this.coalesced).filter(e => {
                if (e.type !== 2 /* FileChangeType.DELETED */) {
                    addOrChangeEvents.push(e);
                    return false; // remove ADD / CHANGE
                }
                return true; // keep DELETE
            }).sort((e1, e2) => {
                return e1.resource.fsPath.length - e2.resource.fsPath.length; // shortest path first
            }).filter(e => {
                if (deletedPaths.some(deletedPath => (0, files_1.isParent)(e.resource.fsPath, deletedPath, !platform_1.isLinux /* ignorecase */))) {
                    return false; // DELETE is ignored if parent is deleted already
                }
                // otherwise mark as deleted
                deletedPaths.push(e.resource.fsPath);
                return true;
            }).concat(addOrChangeEvents);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvY29tbW9uL3dhdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBOENoRyxzRUFFQztJQXdCRCwwREFFQztJQTBNRCw4Q0FNQztJQUVELHdDQVNDO0lBRUQsMERBYUM7SUFFRCxvREFRQztJQWhSRCxTQUFnQiw2QkFBNkIsQ0FBQyxPQUFzQjtRQUNuRSxPQUFPLE9BQU8sT0FBTyxDQUFDLGFBQWEsS0FBSyxRQUFRLENBQUM7SUFDbEQsQ0FBQztJQXdCRCxTQUFnQix1QkFBdUIsQ0FBQyxPQUFzQjtRQUM3RCxPQUFPLE9BQU8sQ0FBQyxTQUFTLEtBQUssSUFBSSxDQUFDO0lBQ25DLENBQUM7SUE0RUQsTUFBc0IscUJBQXNCLFNBQVEsc0JBQVU7aUJBRXJDLGlCQUFZLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFTekMsWUFDa0IsYUFBK0MsRUFDL0MsWUFBd0MsRUFDakQsY0FBdUIsRUFDdkIsT0FHUDtZQUVELEtBQUssRUFBRSxDQUFDO1lBUlMsa0JBQWEsR0FBYixhQUFhLENBQWtDO1lBQy9DLGlCQUFZLEdBQVosWUFBWSxDQUE0QjtZQUNqRCxtQkFBYyxHQUFkLGNBQWMsQ0FBUztZQUN2QixZQUFPLEdBQVAsT0FBTyxDQUdkO1lBYmUsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQUV0RSxhQUFRLEdBQWdDLFNBQVMsQ0FBQztZQUVsRCxtQkFBYyxHQUFHLENBQUMsQ0FBQztRQVkzQixDQUFDO1FBSVMsSUFBSTtZQUViLHVDQUF1QztZQUN2QyxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsa0JBQWtCLENBQUMs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