/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/lifecycle", "vs/platform/files/common/watcher", "vs/base/common/event", "vs/base/common/uri"], function (require, exports, fs_1, lifecycle_1, watcher_1, event_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseWatcher = void 0;
    class BaseWatcher extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onDidLogMessage = this._register(new event_1.Emitter());
            this.onDidLogMessage = this._onDidLogMessage.event;
            this._onDidWatchFail = this._register(new event_1.Emitter());
            this.onDidWatchFail = this._onDidWatchFail.event;
            this.allNonCorrelatedWatchRequests = new Set();
            this.allCorrelatedWatchRequests = new Map();
            this.suspendedWatchRequests = this._register(new lifecycle_1.DisposableMap());
            this.suspendedWatchRequestPollingInterval = 5007; // node.js default
            this._register(this.onDidWatchFail(request => this.handleDidWatchFail(request)));
        }
        handleDidWatchFail(request) {
            if (!this.isCorrelated(request)) {
                // For now, limit failed watch monitoring to requests with a correlationId
                // to experiment with this feature in a controlled way. Monitoring requests
                // requires us to install polling watchers (via `fs.watchFile()`) and thus
                // should be used sparingly.
                return;
            }
            this.suspendWatchRequest(request);
        }
        isCorrelated(request) {
            return (0, watcher_1.isWatchRequestWithCorrelation)(request);
        }
        async watch(requests) {
            this.allCorrelatedWatchRequests.clear();
            this.allNonCorrelatedWatchRequests.clear();
            // Figure out correlated vs. non-correlated requests
            for (const request of requests) {
                if (this.isCorrelated(request)) {
                    this.allCorrelatedWatchRequests.set(request.correlationId, request);
                }
                else {
                    this.allNonCorrelatedWatchRequests.add(request);
                }
            }
            // Remove all suspended correlated watch requests that are no longer watched
            for (const [correlationId] of this.suspendedWatchRequests) {
                if (!this.allCorrelatedWatchRequests.has(correlationId)) {
                    this.suspendedWatchRequests.deleteAndDispose(correlationId);
                }
            }
            return this.updateWatchers();
        }
        updateWatchers() {
            return this.doWatch([
                ...this.allNonCorrelatedWatchRequests,
                ...Array.from(this.allCorrelatedWatchRequests.values()).filter(request => !this.suspendedWatchRequests.has(request.correlationId))
            ]);
        }
        suspendWatchRequest(request) {
            if (this.suspendedWatchRequests.has(request.correlationId)) {
                return; // already suspended
            }
            const disposables = new lifecycle_1.DisposableStore();
            this.suspendedWatchRequests.set(request.correlationId, disposables);
            this.monitorSuspendedWatchRequest(request, disposables);
            this.updateWatchers();
        }
        resumeWatchRequest(request) {
            this.suspendedWatchRequests.deleteAndDispose(request.correlationId);
            this.updateWatchers();
        }
        monitorSuspendedWatchRequest(request, disposables) {
            const resource = uri_1.URI.file(request.path);
            const that = this;
            let pathNotFound = false;
            const watchFileCallback = (curr, prev) => {
                if (disposables.isDisposed) {
                    return; // return early if already disposed
                }
                const currentPathNotFound = this.isPathNotFound(curr);
                const previousPathNotFound = this.isPathNotFound(prev);
                const oldPathNotFound = pathNotFound;
                pathNotFound = currentPathNotFound;
                // Watch path created: resume watching request
                if (!currentPathNotFound && (previousPathNotFound || oldPathNotFound)) {
                    this.trace(`fs.watchFile() detected ${request.path} exists again, resuming watcher (correlationId: ${request.correlationId})`);
                    // Emit as event
                    const event = { resource, type: 1 /* FileChangeType.ADDED */, cId: request.correlationId };
                    that._onDidChangeFile.fire([event]);
                    this.traceEvent(event, request);
                    // Resume watching
                    this.resumeWatchRequest(request);
                }
            };
            this.trace(`starting fs.watchFile() on ${request.path} (correlationId: ${request.correlationId})`);
            try {
                (0, fs_1.watchFile)(request.path, { persistent: false, interval: this.suspendedWatchRequestPollingInterval }, watchFileCallback);
            }
            catch (error) {
                this.warn(`fs.watchFile() failed with error ${error} on path ${request.path} (correlationId: ${request.correlationId})`);
            }
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this.trace(`stopping fs.watchFile() on ${request.path} (correlationId: ${request.correlationId})`);
                try {
                    (0, fs_1.unwatchFile)(request.path, watchFileCallback);
                }
                catch (error) {
                    this.warn(`fs.unwatchFile() failed with error ${error} on path ${request.path} (correlationId: ${request.correlationId})`);
                }
            }));
        }
        isPathNotFound(stats) {
            return stats.ctimeMs === 0 && stats.ino === 0;
        }
        async stop() {
            this.suspendedWatchRequests.clearAndDisposeAll();
        }
        traceEvent(event, request) {
            const traceMsg = ` >> normalized ${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.resource.fsPath}`;
            this.trace(typeof request.correlationId === 'number' ? `${traceMsg} (correlationId: ${request.correlationId})` : traceMsg);
        }
        requestToString(request) {
            return `${request.path} (excludes: ${request.excludes.length > 0 ? request.excludes : '<none>'}, includes: ${request.includes && request.includes.length > 0 ? JSON.stringify(request.includes) : '<all>'}, correlationId: ${typeof request.correlationId === 'number' ? request.correlationId : '<none>'})`;
        }
    }
    exports.BaseWatcher = BaseWatcher;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZVdhdGNoZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2ZpbGVzL25vZGUvd2F0Y2hlci9iYXNlV2F0Y2hlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFTaEcsTUFBc0IsV0FBWSxTQUFRLHNCQUFVO1FBa0JuRDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBakJVLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWlCLENBQUMsQ0FBQztZQUMxRSxvQkFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFFcEMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7WUFDeEUsb0JBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBRXBDLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMEIsQ0FBQyxDQUFDO1lBQzFFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFFNUMsa0NBQTZCLEdBQUcsSUFBSSxHQUFHLEVBQTBCLENBQUM7WUFDbEUsK0JBQTBCLEdBQUcsSUFBSSxHQUFHLEVBQTZELENBQUM7WUFFbEcsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQStCLENBQUMsQ0FBQztZQUV4Rix5Q0FBb0MsR0FBVyxJQUFJLENBQUMsQ0FBQyxrQkFBa0I7WUFLekYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNs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