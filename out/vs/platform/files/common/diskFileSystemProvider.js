/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/platform/files/common/watcher", "vs/platform/log/common/log"], function (require, exports, arrays_1, async_1, errors_1, event_1, lifecycle_1, path_1, watcher_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractDiskFileSystemProvider = void 0;
    class AbstractDiskFileSystemProvider extends lifecycle_1.Disposable {
        constructor(logService, options) {
            super();
            this.logService = logService;
            this.options = options;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            this.universalPathsToWatch = [];
            this.universalWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
            this.nonRecursivePathsToWatch = [];
            this.nonRecursiveWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
        }
        watch(resource, opts) {
            if (opts.recursive || this.options?.watcher?.forceUniversal) {
                return this.watchUniversal(resource, opts);
            }
            return this.watchNonRecursive(resource, opts);
        }
        watchUniversal(resource, opts) {
            // Add to list of paths to watch universally
            const pathToWatch = { path: this.toFilePath(resource), excludes: opts.excludes, includes: opts.includes, recursive: opts.recursive, correlationId: opts.correlationId };
            const remove = (0, arrays_1.insert)(this.universalPathsToWatch, pathToWatch);
            // Trigger update
            this.refreshUniversalWatchers();
            return (0, lifecycle_1.toDisposable)(() => {
                // Remove from list of paths to watch universally
                remove();
                // Trigger update
                this.refreshUniversalWatchers();
            });
        }
        refreshUniversalWatchers() {
            // Buffer requests for universal watching to decide on right watcher
            // that supports potentially watching more than one path at once
            this.universalWatchRequestDelayer.trigger(() => {
                return this.doRefreshUniversalWatchers();
            }).catch(error => (0, errors_1.onUnexpectedError)(error));
        }
        doRefreshUniversalWatchers() {
            // Create watcher if this is the first time
            if (!this.universalWatcher) {
                this.universalWatcher = this._register(this.createUniversalWatcher(changes => this._onDidChangeFile.fire((0, watcher_1.reviveFileChanges)(changes)), msg => this.onWatcherLogMessage(msg), this.logService.getLevel() === log_1.LogLevel.Trace));
                // Apply log levels dynamically
                this._register(this.logService.onDidChangeLogLevel(() => {
                    this.universalWatcher?.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                }));
            }
            // Adjust for polling
            const usePolling = this.options?.watcher?.recursive?.usePolling;
            if (usePolling === true) {
                for (const request of this.universalPathsToWatch) {
                    if ((0, watcher_1.isRecursiveWatchRequest)(request)) {
                        request.pollingInterval = this.options?.watcher?.recursive?.pollingInterval ?? 5000;
                    }
                }
            }
            else if (Array.isArray(usePolling)) {
                for (const request of this.universalPathsToWatch) {
                    if ((0, watcher_1.isRecursiveWatchRequest)(request)) {
                        if (usePolling.includes(request.path)) {
                            request.pollingInterval = this.options?.watcher?.recursive?.pollingInterval ?? 5000;
                        }
                    }
                }
            }
            // Ask to watch the provided paths
            return this.universalWatcher.watch(this.universalPathsToWatch);
        }
        watchNonRecursive(resource, opts) {
            // Add to list of paths to watch non-recursively
            const pathToWatch = { path: this.toFilePath(resource), excludes: opts.excludes, includes: opts.includes, recursive: false, correlationId: opts.correlationId };
            const remove = (0, arrays_1.insert)(this.nonRecursivePathsToWatch, pathToWatch);
            // Trigger update
            this.refreshNonRecursiveWatchers();
            return (0, lifecycle_1.toDisposable)(() => {
                // Remove from list of paths to watch non-recursively
                remove();
                // Trigger update
                this.refreshNonRecursiveWatchers();
            });
        }
        refreshNonRecursiveWatchers() {
            // Buffer requests for nonrecursive watching to decide on right watcher
            // that supports potentially watching more than one path at once
            this.nonRecursiveWatchRequestDelayer.trigger(() => {
                return this.doRefreshNonRecursiveWatchers();
            }).catch(error => (0, errors_1.onUnexpectedError)(error));
        }
        doRefreshNonRecursiveWatchers() {
            // Create watcher if this is the first time
            if (!this.nonRecursiveWatcher) {
                this.nonRecursiveWatcher = this._register(this.createNonRecursiveWatcher(changes => this._onDidChangeFile.fire((0, watcher_1.reviveFileChanges)(changes)), msg => this.onWatcherLogMessage(msg), this.logService.getLevel() === log_1.LogLevel.Trace));
                // Apply log levels dynamically
                this._register(this.logService.onDidChangeLogLevel(() => {
                    this.nonRecursiveWatcher?.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                }));
            }
            // Ask to watch the provided paths
            return this.nonRecursiveWatcher.watch(this.nonRecursivePathsToWatch);
        }
        //#endregion
        onWatcherLogMessage(msg) {
            if (msg.type === 'error') {
                this._onDidWatchError.fire(msg.message);
            }
            this.logService[msg.type](msg.message);
        }
        toFilePath(resource) {
            return (0, path_1.normalize)(resource.fsPath);
        }
    }
    exports.AbstractDiskFileSystemProvider = AbstractDiskFileSystemProvider;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlza0ZpbGVTeXN0ZW1Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZmlsZXMvY29tbW9uL2Rpc2tGaWxlU3lzdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUNoRyxNQUFzQiw4QkFBK0IsU0FBUSxzQkFBVTtRQUt0RSxZQUNvQixVQUF1QixFQUN6QixPQUF3QztZQUV6RCxLQUFLLEVBQUUsQ0FBQztZQUhXLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDekIsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7WUFLdkMscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBMEIsQ0FBQyxDQUFDO1lBQ25GLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztZQUVwQyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFVLENBQUMsQ0FBQztZQUNuRSxvQkFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7WUFjdEMsMEJBQXFCLEdBQTZCLEVBQUUsQ0FBQztZQUNyRCxpQ0FBNEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQWdGN0UsNkJBQXdCLEdBQWdDLEVBQUUsQ0FBQztZQUMzRCxvQ0FBK0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdCLENBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQXRHakcsQ0FBQztRQVFELEtBQUssQ0FBQyxRQUFhLEVBQUUsSUFBbUI7WUFDdkMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLGNB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