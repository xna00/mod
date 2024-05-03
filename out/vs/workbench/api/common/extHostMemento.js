/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async"], function (require, exports, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionGlobalMemento = exports.ExtensionMemento = void 0;
    class ExtensionMemento {
        constructor(id, global, storage) {
            this._deferredPromises = new Map();
            this._id = id;
            this._shared = global;
            this._storage = storage;
            this._init = this._storage.initializeExtensionStorage(this._shared, this._id, Object.create(null)).then(value => {
                this._value = value;
                return this;
            });
            this._storageListener = this._storage.onDidChangeStorage(e => {
                if (e.shared === this._shared && e.key === this._id) {
                    this._value = e.value;
                }
            });
            this._scheduler = new async_1.RunOnceScheduler(() => {
                const records = this._deferredPromises;
                this._deferredPromises = new Map();
                (async () => {
                    try {
                        await this._storage.setValue(this._shared, this._id, this._value);
                        for (const value of records.values()) {
                            value.complete();
                        }
                    }
                    catch (e) {
                        for (const value of records.values()) {
                            value.error(e);
                        }
                    }
                })();
            }, 0);
        }
        keys() {
            // Filter out `undefined` values, as they can stick around in the `_value` until the `onDidChangeStorage` event runs
            return Object.entries(this._value ?? {}).filter(([, value]) => value !== undefined).map(([key]) => key);
        }
        get whenReady() {
            return this._init;
        }
        get(key, defaultValue) {
            let value = this._value[key];
            if (typeof value === 'undefined') {
                value = defaultValue;
            }
            return value;
        }
        update(key, value) {
            this._value[key] = value;
            const record = this._deferredPromises.get(key);
            if (record !== undefined) {
                return record.p;
            }
            const promise = new async_1.DeferredPromise();
            this._deferredPromises.set(key, promise);
            if (!this._scheduler.isScheduled()) {
                this._scheduler.schedule();
            }
            return promise.p;
        }
        dispose() {
            this._storageListener.dispose();
        }
    }
    exports.ExtensionMemento = ExtensionMemento;
    class ExtensionGlobalMemento extends ExtensionMemento {
        setKeysForSync(keys) {
            this._storage.registerExtensionStorageKeysToSync({ id: this._id, version: this._extension.version }, keys);
        }
        constructor(extensionDescription, storage) {
            super(extensionDescription.identifier.value, true, storage);
            this._extension = extensionDescription;
        }
    }
    exports.ExtensionGlobalMemento = ExtensionGlobalMemento;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE1lbWVudG8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RNZW1lbnRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVFoRyxNQUFhLGdCQUFnQjtRQWE1QixZQUFZLEVBQVUsRUFBRSxNQUFlLEVBQUUsT0FBdUI7WUFIeEQsc0JBQWlCLEdBQXVDLElBQUksR0FBRyxFQUFFLENBQUM7WUFJekUsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7WUFDZCxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUV4QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQy9HLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO2dCQUNwQixPQUFPLElBQUksQ0FBQztZQUNiLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNyRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ3ZCLENBQUM7WUFDRixDQUFDLENBQUMsQ0FB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