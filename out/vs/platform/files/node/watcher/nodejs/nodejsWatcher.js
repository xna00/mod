/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/platform/files/node/watcher/baseWatcher", "vs/base/common/platform", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib", "vs/base/common/extpath"], function (require, exports, event_1, glob_1, baseWatcher_1, platform_1, nodejsWatcherLib_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSWatcher = void 0;
    class NodeJSWatcher extends baseWatcher_1.BaseWatcher {
        constructor() {
            super(...arguments);
            this.onDidError = event_1.Event.None;
            this.watchers = new Set();
            this.verboseLogging = false;
        }
        async doWatch(requests) {
            // Figure out duplicates to remove from the requests
            requests = this.removeDuplicateRequests(requests);
            // Figure out which watchers to start and which to stop
            const requestsToStart = [];
            const watchersToStop = new Set(Array.from(this.watchers));
            for (const request of requests) {
                const watcher = this.findWatcher(request);
                if (watcher && (0, glob_1.patternsEquals)(watcher.request.excludes, request.excludes) && (0, glob_1.patternsEquals)(watcher.request.includes, request.includes)) {
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
                this.stopWatching(watcher);
            }
            // Start watching as instructed
            for (const request of requestsToStart) {
                this.startWatching(request);
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
        startWatching(request) {
            // Start via node.js lib
            const instance = new nodejsWatcherLib_1.NodeJSFileWatcherLibrary(request, changes => this._onDidChangeFile.fire(changes), () => this._onDidWatchFail.fire(request), msg => this._onDidLogMessage.fire(msg), this.verboseLogging);
            // Remember as watcher instance
            const watcher = { request, instance };
            this.watchers.add(watcher);
        }
        async stop() {
            await super.stop();
            for (const watcher of this.watchers) {
                this.stopWatching(watcher);
            }
        }
        stopWatching(watcher) {
            this.trace(`stopping file watcher`, watcher);
            this.watchers.delete(watcher);
            watcher.instance.dispose();
        }
        removeDuplicateRequests(requests) {
            const mapCorrelationtoRequests = new Map();
            // Ignore requests for the same paths that have the same correlation
            for (const request of requests) {
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
            return Array.from(mapCorrelationtoRequests.values()).map(requests => Array.from(requests.values())).flat();
        }
        async setVerboseLogging(enabled) {
            this.verboseLogging = enabled;
            for (const watcher of this.watchers) {
                watcher.instance.setVerboseLogging(enabled);
            }
        }
        trace(message, watcher) {
            if (this.verboseLogging) {
                this._onDidLogMessage.fire({ type: 'trace', message: this.toMessage(message, watcher) });
            }
        }
        warn(message) {
            this._onDidLogMessage.fire({ type: 'warn', message: this.toMessage(message) });
        }
        toMessage(message, watcher) {
            return watcher ? `[File Watcher (node.js)] ${message} (${this.requestToString(watcher.request)})` : `[File Watcher (node.js)] ${message}`;
        }
    }
    exports.NodeJSWatcher = NodeJSWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZWpzV2F0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvbm9kZS93YXRjaGVyL25vZGVqcy9ub2RlanNXYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsTUFBYSxhQUFjLFNBQVEseUJBQVc7UUFBOUM7O1lBRVUsZUFBVSxHQUFHLGFBQUssQ0FBQyxJQUFJLENBQUM7WUFFZCxhQUFRLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFFeEQsbUJBQWMsR0FBRyxLQUFLLENBQUM7UUFvSWhDLENBQUM7UUFsSW1CLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBcUM7WUFFckUsb0RBQW9EO1lBQ3BELFFBQVEsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFbEQsdURBQXVEO1lBQ3ZELE1BQU0sZUFBZSxHQUFnQyxFQUFFLENBQUM7WUFDeEQsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUMxRCxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLE9BQU8sSUFBSSxJQUFBLHFCQUFjLEVBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUEscUJBQWMsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDekksY0FBYyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMs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