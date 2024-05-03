/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/broadcast", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/indexedDB", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/parts/storage/common/storage", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, broadcast_1, browser_1, dom_1, indexedDB_1, async_1, errorMessage_1, event_1, lifecycle_1, types_1, storage_1, log_1, storage_2, userDataProfile_1) {
    "use strict";
    var BrowserStorageService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBStorageDatabase = exports.BrowserStorageService = void 0;
    let BrowserStorageService = class BrowserStorageService extends storage_2.AbstractStorageService {
        static { BrowserStorageService_1 = this; }
        static { this.BROWSER_DEFAULT_FLUSH_INTERVAL = 5 * 1000; } // every 5s because async operations are not permitted on shutdown
        get hasPendingUpdate() {
            return Boolean(this.applicationStorageDatabase?.hasPendingUpdate ||
                this.profileStorageDatabase?.hasPendingUpdate ||
                this.workspaceStorageDatabase?.hasPendingUpdate);
        }
        constructor(workspace, userDataProfileService, logService) {
            super({ flushInterval: BrowserStorageService_1.BROWSER_DEFAULT_FLUSH_INTERVAL });
            this.workspace = workspace;
            this.userDataProfileService = userDataProfileService;
            this.logService = logService;
            this.applicationStoragePromise = new async_1.DeferredPromise();
            this.profileStorageProfile = this.userDataProfileService.currentProfile;
            this.profileStorageDisposables = this._register(new lifecycle_1.DisposableStore());
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.userDataProfileService.onDidChangeCurrentProfile(e => e.join(this.switchToProfile(e.profile))));
        }
        async doInitialize() {
            // Init storages
            await async_1.Promises.settled([
                this.createApplicationStorage(),
                this.createProfileStorage(this.profileStorageProfile),
                this.createWorkspaceStorage()
            ]);
        }
        async createApplicationStorage() {
            const applicationStorageIndexedDB = await IndexedDBStorageDatabase.createApplicationStorage(this.logService);
            this.applicationStorageDatabase = this._register(applicationStorageIndexedDB);
            this.applicationStorage = this._register(new storage_1.Storage(this.applicationStorageDatabase));
            this._register(this.applicationStorage.onDidChangeStorage(e => this.emitDidChangeValue(-1 /* StorageScope.APPLICATION */, e)));
            await this.applicationStorage.init();
            this.updateIsNew(this.applicationStorage);
            this.applicationStoragePromise.complete({ indexedDb: applicationStorageIndexedDB, storage: this.applicationStorage });
        }
        async createProfileStorage(profile) {
            // First clear any previously associated disposables
            this.profileStorageDisposables.clear();
            // Remember profile associated to profile storage
            this.profileStorageProfile = profile;
            if ((0, storage_2.isProfileUsingDefaultStorage)(this.profileStorageProfile)) {
                // If we are using default profile storage, the profile storage is
                // actually the same as application storage. As such we
                // avoid creating the storage library a second time on
                // the same DB.
                const { indexedDb: applicationStorageIndexedDB, storage: applicationStorage } = await this.applicationStoragePromise.p;
                this.profileStorageDatabase = applicationStorageIndexedDB;
                this.profileStorage = applicationStorage;
                this.profileStorageDisposables.add(this.profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
            }
            else {
                const profileStorageIndexedDB = await IndexedDBStorageDatabase.createProfileStorage(this.profileStorageProfile, this.logService);
                this.profileStorageDatabase = this.profileStorageDisposables.add(profileStorageIndexedDB);
                this.profileStorage = this.profileStorageDisposables.add(new storage_1.Storage(this.profileStorageDatabase));
                this.profileStorageDisposables.add(this.profileStorage.onDidChangeStorage(e => this.emitDidChangeValue(0 /* StorageScope.PROFILE */, e)));
                await this.profileStorage.init();
                this.updateIsNew(this.profileStorage);
            }
        }
        async createWorkspaceStorage() {
            const workspaceStorageIndexedDB = await IndexedDBStorageDatabase.createWorkspaceStorage(this.workspace.id, this.logService);
            this.workspaceStorageDatabase = this._register(workspaceStorageIndexedDB);
            this.workspaceStorage = this._register(new storage_1.Storage(this.workspaceStorageDatabase));
            this._register(this.workspaceStorage.onDidChangeStorage(e => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, e)));
            await this.workspaceStorage.init();
            this.updateIsNew(this.workspaceStorage);
        }
        updateIsNew(storage) {
            const firstOpen = storage.getBoolean(storage_2.IS_NEW_KEY);
            if (firstOpen === undefined) {
                storage.set(storage_2.IS_NEW_KEY, true);
            }
            else if (firstOpen) {
                storage.set(storage_2.IS_NEW_KEY, false);
            }
        }
        getStorage(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorage;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorage;
                default:
                    return this.workspaceStorage;
            }
        }
        getLogDetails(scope) {
            switch (scope) {
                case -1 /* StorageScope.APPLICATION */:
                    return this.applicationStorageDatabase?.name;
                case 0 /* StorageScope.PROFILE */:
                    return this.profileStorageDatabase?.name;
                default:
                    return this.workspaceStorageDatabase?.name;
            }
        }
        async switchToProfile(toProfile) {
            if (!this.canSwitchProfile(this.profileStorageProfile, toProfile)) {
                return;
            }
            const oldProfileStorage = (0, types_1.assertIsDefined)(this.profileStorage);
            const oldItems = oldProfileStorage.items;
            // Close old profile storage but only if this is
            // different from application storage!
            if (oldProfileStorage !== this.applicationStorage) {
                await oldProfileStorage.close();
            }
            // Create new profile storage & init
            await this.createProfileStorage(toProfile);
            // Handle data switch and eventing
            this.switchData(oldItems, (0, types_1.assertIsDefined)(this.profileStorage), 0 /* StorageScope.PROFILE */);
        }
        async switchToWorkspace(toWorkspace, preserveData) {
            throw new Error('Migrating storage is currently unsupported in Web');
        }
        shouldFlushWhenIdle() {
            // this flush() will potentially cause new state to be stored
            // since new state will only be created while the document
            // has focus, one optimization is to not run this when the
            // document has no focus, assuming that state has not changed
            //
            // another optimization is to not collect more state if we
            // have a pending update already running which indicates
            // that the connection is either slow or disconnected and
            // thus unhealthy.
            return (0, dom_1.getActiveWindow)().document.hasFocus() && !this.hasPendingUpdate;
        }
        close() {
            // Safari: there is an issue where the page can hang on load when
            // a previous session has kept IndexedDB transactions running.
            // The only fix seems to be to cancel any pending transactions
            // (https://github.com/microsoft/vscode/issues/136295)
            //
            // On all other browsers, we keep the databases opened because
            // we expect data to be written when the unload happens.
            if (browser_1.isSafari) {
                this.applicationStorage?.close();
                this.profileStorageDatabase?.close();
                this.workspaceStorageDatabase?.close();
            }
            // Always dispose to ensure that no timeouts or callbacks
            // get triggered in this phase.
            this.dispose();
        }
        async clear() {
            // Clear key/values
            for (const scope of [-1 /* StorageScope.APPLICATION */, 0 /* StorageScope.PROFILE */, 1 /* StorageScope.WORKSPACE */]) {
                for (const target of [0 /* StorageTarget.USER */, 1 /* StorageTarget.MACHINE */]) {
                    for (const key of this.keys(scope, target)) {
                        this.remove(key, scope);
                    }
                }
                await this.getStorage(scope)?.whenFlushed();
            }
            // Clear databases
            await async_1.Promises.settled([
                this.applicationStorageDatabase?.clear() ?? Promise.resolve(),
                this.profileStorageDatabase?.clear() ?? Promise.resolve(),
                this.workspaceStorageDatabase?.clear() ?? Promise.resolve()
            ]);
        }
        hasScope(scope) {
            if ((0, userDataProfile_1.isUserDataProfile)(scope)) {
                return this.profileStorageProfile.id === scope.id;
            }
            return this.workspace.id === scope.id;
        }
    };
    exports.BrowserStorageService = BrowserStorageService;
    exports.BrowserStorageService = BrowserStorageService = BrowserStorageService_1 = __decorate([
        __param(2, log_1.ILogService)
    ], BrowserStorageService);
    class InMemoryIndexedDBStorageDatabase extends storage_1.InMemoryStorageDatabase {
        constructor() {
            super(...arguments);
            this.hasPendingUpdate = false;
            this.name = 'in-memory-indexedb-storage';
        }
        async clear() {
            (await this.getItems()).clear();
        }
        dispose() {
            // No-op
        }
    }
    class IndexedDBStorageDatabase extends lifecycle_1.Disposable {
        static async createApplicationStorage(logService) {
            return IndexedDBStorageDatabase.create({ id: 'global', broadcastChanges: true }, logService);
        }
        static async createProfileStorage(profile, logService) {
            return IndexedDBStorageDatabase.create({ id: `global-${profile.id}`, broadcastChanges: true }, logService);
        }
        static async createWorkspaceStorage(workspaceId, logService) {
            return IndexedDBStorageDatabase.create({ id: workspaceId }, logService);
        }
        static async create(options, logService) {
            try {
                const database = new IndexedDBStorageDatabase(options, logService);
                await database.whenConnected;
                return database;
            }
            catch (error) {
                logService.error(`[IndexedDB Storage ${options.id}] create(): ${(0, errorMessage_1.toErrorMessage)(error, true)}`);
                return new InMemoryIndexedDBStorageDatabase();
            }
        }
        static { this.STORAGE_DATABASE_PREFIX = 'vscode-web-state-db-'; }
        static { this.STORAGE_OBJECT_STORE = 'ItemTable'; }
        get hasPendingUpdate() { return !!this.pendingUpdate; }
        constructor(options, logService) {
            super();
            this.logService = logService;
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.pendingUpdate = undefined;
            this.name = `${IndexedDBStorageDatabase.STORAGE_DATABASE_PREFIX}${options.id}`;
            this.broadcastChannel = options.broadcastChanges ? this._register(new broadcast_1.BroadcastDataChannel(this.name)) : undefined;
            this.whenConnected = this.connect();
            this.registerListeners();
        }
        registerListeners() {
            // Check for storage change events from other
            // windows/tabs via `BroadcastChannel` mechanisms.
            if (this.broadcastChannel) {
                this._register(this.broadcastChannel.onDidReceiveData(data => {
                    if ((0, storage_1.isStorageItemsChangeEvent)(data)) {
                        this._onDidChangeItemsExternal.fire(data);
                    }
                }));
            }
        }
        async connect() {
            try {
                return await indexedDB_1.IndexedDB.create(this.name, undefined, [IndexedDBStorageDatabase.STORAGE_OBJECT_STORE]);
            }
            catch (error) {
                this.logService.error(`[IndexedDB Storage ${this.name}] connect() error: ${(0, errorMessage_1.toErrorMessage)(error)}`);
                throw error;
            }
        }
        async getItems() {
            const db = await this.whenConnected;
            function isValid(value) {
                return typeof value === 'string';
            }
            return db.getKeyValues(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, isValid);
        }
        async updateItems(request) {
            // Run the update
            let didUpdate = false;
            this.pendingUpdate = this.doUpdateItems(request);
            try {
                didUpdate = await this.pendingUpdate;
            }
            finally {
                this.pendingUpdate = undefined;
            }
            // Broadcast changes to other windows/tabs if enabled
            // and only if we actually did update storage items.
            if (this.broadcastChannel && didUpdate) {
                const event = {
                    changed: request.insert,
                    deleted: request.delete
                };
                this.broadcastChannel.postData(event);
            }
        }
        async doUpdateItems(request) {
            // Return early if the request is empty
            const toInsert = request.insert;
            const toDelete = request.delete;
            if ((!toInsert && !toDelete) || (toInsert?.size === 0 && toDelete?.size === 0)) {
                return false;
            }
            const db = await this.whenConnected;
            // Update `ItemTable` with inserts and/or deletes
            await db.runInTransaction(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, 'readwrite', objectStore => {
                const requests = [];
                // Inserts
                if (toInsert) {
                    for (const [key, value] of toInsert) {
                        requests.push(objectStore.put(value, key));
                    }
                }
                // Deletes
                if (toDelete) {
                    for (const key of toDelete) {
                        requests.push(objectStore.delete(key));
                    }
                }
                return requests;
            });
            return true;
        }
        async optimize() {
            // not suported in IndexedDB
        }
        async close() {
            const db = await this.whenConnected;
            // Wait for pending updates to having finished
            await this.pendingUpdate;
            // Finally, close IndexedDB
            return db.close();
        }
        async clear() {
            const db = await this.whenConnected;
            await db.runInTransaction(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, 'readwrite', objectStore => objectStore.clear());
        }
    }
    exports.IndexedDBStorageDatabase = IndexedDBStorageDatabase;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9zZXJ2aWNlcy9zdG9yYWdlL2Jyb3dzZXIvc3RvcmFnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQWtCekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxnQ0FBc0I7O2lCQUVqRCxtQ0FBOEIsR0FBRyxDQUFDLEdBQUcsSUFBSSxBQUFYLENBQVksR0FBQyxrRUFBa0U7UUFjNUgsSUFBSSxnQkFBZ0I7WUFDbkIsT0FBTyxPQUFPLENBQ2IsSUFBSSxDQUFDLDBCQUEwQixFQUFFLGdCQUFnQjtnQkFDakQsSUFBSSxDQUFDLHNCQUFzQixFQUFFLGdCQUFnQjtnQkFDN0MsSUFBSSxDQUFDLHdCQUF3QixFQUFFLGdCQUFnQixDQUMvQyxDQUFDO1FBQ0gsQ0FBQztRQUVELFlBQ2tCLFNBQWtDLEVBQ2xDLHNCQUErQyxFQUNuRCxVQUF3QztZQUVyRCxLQUFLLENBQUMsRUFBRSxhQUFhLEVBQUUsdUJBQXFCLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxDQUFDO1lBSjlELGNBQVMsR0FBVCxTQUFTLENBQXlCO1lBQ2xDLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDbEMsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQXJCckMsOEJBQXlCLEdBQUcsSUFBSSx1QkFBZSxFQUErRCxDQUFDO1lBSXhILDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxjQUFjLENBQUM7WUFDMUQsOEJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBb0JsRixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMxQixDQUFDO1FBRU8saUJB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