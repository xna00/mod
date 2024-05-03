/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/parts/storage/common/storage", "vs/base/parts/storage/node/storage", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/base/common/network"], function (require, exports, arrays_1, async_1, event_1, lifecycle_1, path_1, stopwatch_1, uri_1, pfs_1, storage_1, storage_2, log_1, storage_3, telemetry_1, workspace_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageMain = exports.WorkspaceStorageMain = exports.ApplicationStorageMain = exports.ProfileStorageMain = void 0;
    class BaseStorageMain extends lifecycle_1.Disposable {
        static { this.LOG_SLOW_CLOSE_THRESHOLD = 2000; }
        get storage() { return this._storage; }
        constructor(logService, fileService) {
            super();
            this.logService = logService;
            this.fileService = fileService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._onDidCloseStorage = this._register(new event_1.Emitter());
            this.onDidCloseStorage = this._onDidCloseStorage.event;
            this._storage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY })); // storage is in-memory until initialized
            this.initializePromise = undefined;
            this.whenInitPromise = new async_1.DeferredPromise();
            this.whenInit = this.whenInitPromise.p;
            this.state = storage_1.StorageState.None;
        }
        isInMemory() {
            return this._storage.isInMemory();
        }
        init() {
            if (!this.initializePromise) {
                this.initializePromise = (async () => {
                    if (this.state !== storage_1.StorageState.None) {
                        return; // either closed or already initialized
                    }
                    try {
                        // Create storage via subclasses
                        const storage = this._register(await this.doCreate());
                        // Replace our in-memory storage with the real
                        // once as soon as possible without awaiting
                        // the init call.
                        this._storage.dispose();
                        this._storage = storage;
                        // Re-emit storage changes via event
                        this._register(storage.onDidChangeStorage(e => this._onDidChangeStorage.fire(e)));
                        // Await storage init
                        await this.doInit(storage);
                        // Ensure we track whether storage is new or not
                        const isNewStorage = storage.getBoolean(storage_3.IS_NEW_KEY);
                        if (isNewStorage === undefined) {
                            storage.set(storage_3.IS_NEW_KEY, true);
                        }
                        else if (isNewStorage) {
                            storage.set(storage_3.IS_NEW_KEY, false);
                        }
                    }
                    catch (error) {
                        this.logService.error(`[storage main] initialize(): Unable to init storage due to ${error}`);
                    }
                    finally {
                        // Update state
                        this.state = storage_1.StorageState.Initialized;
                        // Mark init promise as completed
                        this.whenInitPromise.complete();
                    }
                })();
            }
            return this.initializePromise;
        }
        createLoggingOptions() {
            return {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
        }
        doInit(storage) {
            return storage.init();
        }
        get items() { return this._storage.items; }
        get(key, fallbackValue) {
            return this._storage.get(key, fallbackValue);
        }
        set(key, value) {
            return this._storage.set(key, value);
        }
        delete(key) {
            return this._storage.delete(key);
        }
        optimize() {
            return this._storage.optimize();
        }
        async close() {
            // Measure how long it takes to close storage
            const watch = new stopwatch_1.StopWatch(false);
            await this.doClose();
            watch.stop();
            // If close() is taking a long time, there is
            // a chance that the underlying DB is large
            // either on disk or in general. In that case
            // log some additional info to further diagnose
            if (watch.elapsed() > BaseStorageMain.LOG_SLOW_CLOSE_THRESHOLD) {
                await this.logSlowClose(watch);
            }
            // Signal as event
            this._onDidCloseStorage.fire();
        }
        async logSlowClose(watch) {
            if (!this.path) {
                return;
            }
            try {
                const largestEntries = (0, arrays_1.top)(Array.from(this._storage.items.entries())
                    .map(([key, value]) => ({ key, length: value.length })), (entryA, entryB) => entryB.length - entryA.length, 5)
                    .map(entry => `${entry.key}:${entry.length}`).join(', ');
                const dbSize = (await this.fileService.stat(uri_1.URI.file(this.path))).size;
                this.logService.warn(`[storage main] detected slow close() operation: Time: ${watch.elapsed()}ms, DB size: ${dbSize}b, Large Keys: ${largestEntries}`);
            }
            catch (error) {
                this.logService.error('[storage main] figuring out stats for slow DB on close() resulted in an error', error);
            }
        }
        async doClose() {
            // Ensure we are not accidentally leaving
            // a pending initialized storage behind in
            // case `close()` was called before `init()`
            // finishes.
            if (this.initializePromise) {
                await this.initializePromise;
            }
            // Update state
            this.state = storage_1.StorageState.Closed;
            // Propagate to storage lib
            await this._storage.close();
        }
    }
    class BaseProfileAwareStorageMain extends BaseStorageMain {
        static { this.STORAGE_NAME = 'state.vscdb'; }
        get path() {
            if (!this.options.useInMemoryStorage) {
                return (0, path_1.join)(this.profile.globalStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, BaseProfileAwareStorageMain.STORAGE_NAME);
            }
            return undefined;
        }
        constructor(profile, options, logService, fileService) {
            super(logService, fileService);
            this.profile = profile;
            this.options = options;
        }
        async doCreate() {
            return new storage_1.Storage(new storage_2.SQLiteStorageDatabase(this.path ?? storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH, {
                logging: this.createLoggingOptions()
            }), !this.path ? { hint: storage_1.StorageHint.STORAGE_IN_MEMORY } : undefined);
        }
    }
    class ProfileStorageMain extends BaseProfileAwareStorageMain {
        constructor(profile, options, logService, fileService) {
            super(profile, options, logService, fileService);
        }
    }
    exports.ProfileStorageMain = ProfileStorageMain;
    class ApplicationStorageMain extends BaseProfileAwareStorageMain {
        constructor(options, userDataProfileService, logService, fileService) {
            super(userDataProfileService.defaultProfile, options, logService, fileService);
        }
        async doInit(storage) {
            await super.doInit(storage);
            // Apply telemetry values as part of the application storage initialization
            this.updateTelemetryState(storage);
        }
        updateTelemetryState(storage) {
            // First session date (once)
            const firstSessionDate = storage.get(telemetry_1.firstSessionDateStorageKey, undefined);
            if (firstSessionDate === undefined) {
                storage.set(telemetry_1.firstSessionDateStorageKey, new Date().toUTCString());
            }
            // Last / current session (always)
            // previous session date was the "current" one at that time
            // current session date is "now"
            const lastSessionDate = storage.get(telemetry_1.currentSessionDateStorageKey, undefined);
            const currentSessionDate = new Date().toUTCString();
            storage.set(telemetry_1.lastSessionDateStorageKey, typeof lastSessionDate === 'undefined' ? null : lastSessionDate);
            storage.set(telemetry_1.currentSessionDateStorageKey, currentSessionDate);
        }
    }
    exports.ApplicationStorageMain = ApplicationStorageMain;
    class WorkspaceStorageMain extends BaseStorageMain {
        static { this.WORKSPACE_STORAGE_NAME = 'state.vscdb'; }
        static { this.WORKSPACE_META_NAME = 'workspace.json'; }
        get path() {
            if (!this.options.useInMemoryStorage) {
                return (0, path_1.join)(this.environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, this.workspace.id, WorkspaceStorageMain.WORKSPACE_STORAGE_NAME);
            }
            return undefined;
        }
        constructor(workspace, options, logService, environmentService, fileService) {
            super(logService, fileService);
            this.workspace = workspace;
            this.options = options;
            this.environmentService = environmentService;
        }
        async doCreate() {
            const { storageFilePath, wasCreated } = await this.prepareWorkspaceStorageFolder();
            return new storage_1.Storage(new storage_2.SQLiteStorageDatabase(storageFilePath, {
                logging: this.createLoggingOptions()
            }), { hint: this.options.useInMemoryStorage ? storage_1.StorageHint.STORAGE_IN_MEMORY : wasCreated ? storage_1.StorageHint.STORAGE_DOES_NOT_EXIST : undefined });
        }
        async prepareWorkspaceStorageFolder() {
            // Return early if using inMemory storage
            if (this.options.useInMemoryStorage) {
                return { storageFilePath: storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH, wasCreated: true };
            }
            // Otherwise, ensure the storage folder exists on disk
            const workspaceStorageFolderPath = (0, path_1.join)(this.environmentService.workspaceStorageHome.with({ scheme: network_1.Schemas.file }).fsPath, this.workspace.id);
            const workspaceStorageDatabasePath = (0, path_1.join)(workspaceStorageFolderPath, WorkspaceStorageMain.WORKSPACE_STORAGE_NAME);
            const storageExists = await pfs_1.Promises.exists(workspaceStorageFolderPath);
            if (storageExists) {
                return { storageFilePath: workspaceStorageDatabasePath, wasCreated: false };
            }
            // Ensure storage folder exists
            await pfs_1.Promises.mkdir(workspaceStorageFolderPath, { recursive: true });
            // Write metadata into folder (but do not await)
            this.ensureWorkspaceStorageFolderMeta(workspaceStorageFolderPath);
            return { storageFilePath: workspaceStorageDatabasePath, wasCreated: true };
        }
        async ensureWorkspaceStorageFolderMeta(workspaceStorageFolderPath) {
            let meta = undefined;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(this.workspace)) {
                meta = { folder: this.workspace.uri.toString() };
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(this.workspace)) {
                meta = { workspace: this.workspace.configPath.toString() };
            }
            if (meta) {
                try {
                    const workspaceStorageMetaPath = (0, path_1.join)(workspaceStorageFolderPath, WorkspaceStorageMain.WORKSPACE_META_NAME);
                    const storageExists = await pfs_1.Promises.exists(workspaceStorageMetaPath);
                    if (!storageExists) {
                        await pfs_1.Promises.writeFile(workspaceStorageMetaPath, JSON.stringify(meta, undefined, 2));
                    }
                }
                catch (error) {
                    this.logService.error(`[storage main] ensureWorkspaceStorageFolderMeta(): Unable to create workspace storage metadata due to ${error}`);
                }
            }
        }
    }
    exports.WorkspaceStorageMain = WorkspaceStorageMain;
    class InMemoryStorageMain extends BaseStorageMain {
        get path() {
            return undefined; // in-memory has no path
        }
        async doCreate() {
            return new storage_1.Storage(new storage_1.InMemoryStorageDatabase(), { hint: storage_1.StorageHint.STORAGE_IN_MEMORY });
        }
    }
    exports.InMemoryStorageMain = InMemoryStorageMain;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZU1haW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3N0b3JhZ2UvZWxlY3Ryb24tbWFpbi9zdG9yYWdlTWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErR2hHLE1BQWUsZUFBZ0IsU0FBUSxzQkFBVTtpQkFFeEIsNkJBQXdCLEdBQUcsSUFBSSxBQUFQLENBQVE7UUFTeEQsSUFBSSxPQUFPLEtBQWUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQVdqRCxZQUNvQixVQUF1QixFQUN6QixXQUF5QjtZQUUxQyxLQUFLLEVBQUUsQ0FBQztZQUhXLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDekIsZ0JBQVcsR0FBWCxXQUFXLENBQWM7WUFwQnhCLHdCQUFtQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXVCLENBQUMsQ0FBQztZQUNuRix1QkFBa0IsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO1lBRTVDLHVCQUFrQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pFLHNCQUFpQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFbkQsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQkFBTyxDQUFDLElBQUksaUNBQXVCLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxxQkFBVyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMseUNBQXlDO1lBS3pKLHNCQUFpQixHQUE4QixTQUFTLENBQUM7WUFFaEQsb0JBQWUsR0FBRyxJQUFJLHVCQUFlLEVBQVEsQ0FBQztZQUN0RCxhQUFRLEdBQUcsSUFBSSxDQUFDLGVBQWUs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