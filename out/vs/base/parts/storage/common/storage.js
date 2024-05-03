/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/types"], function (require, exports, async_1, event_1, lifecycle_1, marshalling_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageDatabase = exports.Storage = exports.StorageState = exports.StorageHint = void 0;
    exports.isStorageItemsChangeEvent = isStorageItemsChangeEvent;
    var StorageHint;
    (function (StorageHint) {
        // A hint to the storage that the storage
        // does not exist on disk yet. This allows
        // the storage library to improve startup
        // time by not checking the storage for data.
        StorageHint[StorageHint["STORAGE_DOES_NOT_EXIST"] = 0] = "STORAGE_DOES_NOT_EXIST";
        // A hint to the storage that the storage
        // is backed by an in-memory storage.
        StorageHint[StorageHint["STORAGE_IN_MEMORY"] = 1] = "STORAGE_IN_MEMORY";
    })(StorageHint || (exports.StorageHint = StorageHint = {}));
    function isStorageItemsChangeEvent(thing) {
        const candidate = thing;
        return candidate?.changed instanceof Map || candidate?.deleted instanceof Set;
    }
    var StorageState;
    (function (StorageState) {
        StorageState[StorageState["None"] = 0] = "None";
        StorageState[StorageState["Initialized"] = 1] = "Initialized";
        StorageState[StorageState["Closed"] = 2] = "Closed";
    })(StorageState || (exports.StorageState = StorageState = {}));
    class Storage extends lifecycle_1.Disposable {
        static { this.DEFAULT_FLUSH_DELAY = 100; }
        constructor(database, options = Object.create(null)) {
            super();
            this.database = database;
            this.options = options;
            this._onDidChangeStorage = this._register(new event_1.PauseableEmitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this.state = StorageState.None;
            this.cache = new Map();
            this.flushDelayer = this._register(new async_1.ThrottledDelayer(Storage.DEFAULT_FLUSH_DELAY));
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            this.pendingClose = undefined;
            this.whenFlushedCallbacks = [];
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.database.onDidChangeItemsExternal(e => this.onDidChangeItemsExternal(e)));
        }
        onDidChangeItemsExternal(e) {
            this._onDidChangeStorage.pause();
            try {
                // items that change external require us to update our
                // caches with the values. we just accept the value and
                // emit an event if there is a change.
                e.changed?.forEach((value, key) => this.acceptExternal(key, value));
                e.deleted?.forEach(key => this.acceptExternal(key, undefined));
            }
            finally {
                this._onDidChangeStorage.resume();
            }
        }
        acceptExternal(key, value) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            let changed = false;
            // Item got removed, check for deletion
            if ((0, types_1.isUndefinedOrNull)(value)) {
                changed = this.cache.delete(key);
            }
            // Item got updated, check for change
            else {
                const currentValue = this.cache.get(key);
                if (currentValue !== value) {
                    this.cache.set(key, value);
                    changed = true;
                }
            }
            // Signal to outside listeners
            if (changed) {
                this._onDidChangeStorage.fire({ key, external: true });
            }
        }
        get items() {
            return this.cache;
        }
        get size() {
            return this.cache.size;
        }
        async init() {
            if (this.state !== StorageState.None) {
                return; // either closed or already initialized
            }
            this.state = StorageState.Initialized;
            if (this.options.hint === StorageHint.STORAGE_DOES_NOT_EXIST) {
                // return early if we know the storage file does not exist. this is a performance
                // optimization to not load all items of the underlying storage if we know that
                // there can be no items because the storage does not exist.
                return;
            }
            this.cache = await this.database.getItems();
        }
        get(key, fallbackValue) {
            const value = this.cache.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return value;
        }
        getBoolean(key, fallbackValue) {
            const value = this.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return value === 'true';
        }
        getNumber(key, fallbackValue) {
            const value = this.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return parseInt(value, 10);
        }
        getObject(key, fallbackValue) {
            const value = this.get(key);
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return fallbackValue;
            }
            return (0, marshalling_1.parse)(value);
        }
        async set(key, value, external = false) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            // We remove the key for undefined/null values
            if ((0, types_1.isUndefinedOrNull)(value)) {
                return this.delete(key, external);
            }
            // Otherwise, convert to String and store
            const valueStr = (0, types_1.isObject)(value) || Array.isArray(value) ? (0, marshalling_1.stringify)(value) : String(value);
            // Return early if value already set
            const currentValue = this.cache.get(key);
            if (currentValue === valueStr) {
                return;
            }
            // Update in cache and pending
            this.cache.set(key, valueStr);
            this.pendingInserts.set(key, valueStr);
            this.pendingDeletes.delete(key);
            // Event
            this._onDidChangeStorage.fire({ key, external });
            // Accumulate work by scheduling after timeout
            return this.doFlush();
        }
        async delete(key, external = false) {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            // Remove from cache and add to pending
            const wasDeleted = this.cache.delete(key);
            if (!wasDeleted) {
                return; // Return early if value already deleted
            }
            if (!this.pendingDeletes.has(key)) {
                this.pendingDeletes.add(key);
            }
            this.pendingInserts.delete(key);
            // Event
            this._onDidChangeStorage.fire({ key, external });
            // Accumulate work by scheduling after timeout
            return this.doFlush();
        }
        async optimize() {
            if (this.state === StorageState.Closed) {
                return; // Return early if we are already closed
            }
            // Await pending data to be flushed to the DB
            // before attempting to optimize the DB
            await this.flush(0);
            return this.database.optimize();
        }
        async close() {
            if (!this.pendingClose) {
                this.pendingClose = this.doClose();
            }
            return this.pendingClose;
        }
        async doClose() {
            // Update state
            this.state = StorageState.Closed;
            // Trigger new flush to ensure data is persisted and then close
            // even if there is an error flushing. We must always ensure
            // the DB is closed to avoid corruption.
            //
            // Recovery: we pass our cache over as recovery option in case
            // the DB is not healthy.
            try {
                await this.doFlush(0 /* as soon as possible */);
            }
            catch (error) {
                // Ignore
            }
            await this.database.close(() => this.cache);
        }
        get hasPending() {
            return this.pendingInserts.size > 0 || this.pendingDeletes.size > 0;
        }
        async flushPending() {
            if (!this.hasPending) {
                return; // return early if nothing to do
            }
            // Get pending data
            const updateRequest = { insert: this.pendingInserts, delete: this.pendingDeletes };
            // Reset pending data for next run
            this.pendingDeletes = new Set();
            this.pendingInserts = new Map();
            // Update in storage and release any
            // waiters we have once done
            return this.database.updateItems(updateRequest).finally(() => {
                if (!this.hasPending) {
                    while (this.whenFlushedCallbacks.length) {
                        this.whenFlushedCallbacks.pop()?.();
                    }
                }
            });
        }
        async flush(delay) {
            if (!this.hasPending) {
                return; // return early if nothing to do
            }
            return this.doFlush(delay);
        }
        async doFlush(delay) {
            if (this.options.hint === StorageHint.STORAGE_IN_MEMORY) {
                return this.flushPending(); // return early if in-memory
            }
            return this.flushDelayer.trigger(() => this.flushPending(), delay);
        }
        async whenFlushed() {
            if (!this.hasPending) {
                return; // return early if nothing to do
            }
            return new Promise(resolve => this.whenFlushedCallbacks.push(resolve));
        }
        isInMemory() {
            return this.options.hint === StorageHint.STORAGE_IN_MEMORY;
        }
    }
    exports.Storage = Storage;
    class InMemoryStorageDatabase {
        constructor() {
            this.onDidChangeItemsExternal = event_1.Event.None;
            this.items = new Map();
        }
        async getItems() {
            return this.items;
        }
        async updateItems(request) {
            request.insert?.forEach((value, key) => this.items.set(key, value));
            request.delete?.forEach(key => this.items.delete(key));
        }
        async optimize() { }
        async close() { }
    }
    exports.InMemoryStorageDatabase = InMemoryStorageDatabase;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9wYXJ0cy9zdG9yYWdlL2NvbW1vbi9zdG9yYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQW1DaEcsOERBSUM7SUEvQkQsSUFBWSxXQVdYO0lBWEQsV0FBWSxXQUFXO1FBRXRCLHlDQUF5QztRQUN6QywwQ0FBMEM7UUFDMUMseUNBQXlDO1FBQ3pDLDZDQUE2QztRQUM3QyxpRkFBc0IsQ0FBQTtRQUV0Qix5Q0FBeUM7UUFDekMscUNBQXFDO1FBQ3JDLHVFQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFYVyxXQUFXLDJCQUFYLFdBQVcsUUFXdEI7SUFnQkQsU0FBZ0IseUJBQXlCLENBQUMsS0FBYztRQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUE2QyxDQUFDO1FBRWhFLE9BQU8sU0FBUyxFQUFFLE9BQU8sWUFBWSxHQUFHLElBQUksU0FBUyxFQUFFLE9BQU8sWUFBWSxHQUFHLENBQUM7SUFDL0UsQ0FBQztJQWtFRCxJQUFZLFlBSVg7SUFKRCxXQUFZLFlBQVk7UUFDdkIsK0NBQUksQ0FBQTtRQUNKLDZEQUFXLENBQUE7UUFDWCxtREFBTSxDQUFBO0lBQ1AsQ0FBQyxFQUpXLFlBQVksNEJBQVosWUFBWSxRQUl2QjtJQUVELE1BQWEsT0FBUSxTQUFRLHNCQUFVO2lCQUVkLHdCQUFtQixHQUFHLEdBQUcsQUFBTixDQUFPO1FBa0JsRCxZQUNvQixRQUEwQixFQUM1QixVQUEyQixNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztZQUUvRCxLQUFLLEVBQUUsQ0FBQztZQUhXLGFBQVEsR0FBUixRQUFRLENBQWtCO1lBQzVCLFlBQU8sR0FBUCxPQUFPLENBQXVDO1lBbEIvQyx3QkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksd0JBQWdC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