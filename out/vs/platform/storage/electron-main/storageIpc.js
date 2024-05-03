/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/platform/workspace/common/workspace"], function (require, exports, event_1, lifecycle_1, marshalling_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageDatabaseChannel = void 0;
    class StorageDatabaseChannel extends lifecycle_1.Disposable {
        static { this.STORAGE_CHANGE_DEBOUNCE_TIME = 100; }
        constructor(logService, storageMainService) {
            super();
            this.logService = logService;
            this.storageMainService = storageMainService;
            this.onDidChangeApplicationStorageEmitter = this._register(new event_1.Emitter());
            this.mapProfileToOnDidChangeProfileStorageEmitter = new Map();
            this.registerStorageChangeListeners(storageMainService.applicationStorage, this.onDidChangeApplicationStorageEmitter);
        }
        //#region Storage Change Events
        registerStorageChangeListeners(storage, emitter) {
            // Listen for changes in provided storage to send to listeners
            // that are listening. Use a debouncer to reduce IPC traffic.
            this._register(event_1.Event.debounce(storage.onDidChangeStorage, (prev, cur) => {
                if (!prev) {
                    prev = [cur];
                }
                else {
                    prev.push(cur);
                }
                return prev;
            }, StorageDatabaseChannel.STORAGE_CHANGE_DEBOUNCE_TIME)(events => {
                if (events.length) {
                    emitter.fire(this.serializeStorageChangeEvents(events, storage));
                }
            }));
        }
        serializeStorageChangeEvents(events, storage) {
            const changed = new Map();
            const deleted = new Set();
            events.forEach(event => {
                const existing = storage.get(event.key);
                if (typeof existing === 'string') {
                    changed.set(event.key, existing);
                }
                else {
                    deleted.add(event.key);
                }
            });
            return {
                changed: Array.from(changed.entries()),
                deleted: Array.from(deleted.values())
            };
        }
        listen(_, event, arg) {
            switch (event) {
                case 'onDidChangeStorage': {
                    const profile = arg.profile ? (0, marshalling_1.revive)(arg.profile) : undefined;
                    // Without profile: application scope
                    if (!profile) {
                        return this.onDidChangeApplicationStorageEmitter.event;
                    }
                    // With profile: profile scope for the profile
                    let profileStorageChangeEmitter = this.mapProfileToOnDidChangeProfileStorageEmitter.get(profile.id);
                    if (!profileStorageChangeEmitter) {
                        profileStorageChangeEmitter = this._register(new event_1.Emitter());
                        this.registerStorageChangeListeners(this.storageMainService.profileStorage(profile), profileStorageChangeEmitter);
                        this.mapProfileToOnDidChangeProfileStorageEmitter.set(profile.id, profileStorageChangeEmitter);
                    }
                    return profileStorageChangeEmitter.event;
                }
            }
            throw new Error(`Event not found: ${event}`);
        }
        //#endregion
        async call(_, command, arg) {
            const profile = arg.profile ? (0, marshalling_1.revive)(arg.profile) : undefined;
            const workspace = (0, workspace_1.reviveIdentifier)(arg.workspace);
            // Get storage to be ready
            const storage = await this.withStorageInitialized(profile, workspace);
            // handle call
            switch (command) {
                case 'getItems': {
                    return Array.from(storage.items.entries());
                }
                case 'updateItems': {
                    const items = arg;
                    if (items.insert) {
                        for (const [key, value] of items.insert) {
                            storage.set(key, value);
                        }
                    }
                    items.delete?.forEach(key => storage.delete(key));
                    break;
                }
                case 'optimize': {
                    return storage.optimize();
                }
                case 'isUsed': {
                    const path = arg.payload;
                    if (typeof path === 'string') {
                        return this.storageMainService.isUsed(path);
                    }
                }
                default:
                    throw new Error(`Call not found: ${command}`);
            }
        }
        async withStorageInitialized(profile, workspace) {
            let storage;
            if (workspace) {
                storage = this.storageMainService.workspaceStorage(workspace);
            }
            else if (profile) {
                storage = this.storageMainService.profileStorage(profile);
            }
            else {
                storage = this.storageMainService.applicationStorage;
            }
            try {
                await storage.init();
            }
            catch (error) {
                this.logService.error(`StorageIPC#init: Unable to init ${workspace ? 'workspace' : profile ? 'profile' : 'application'} storage due to ${error}`);
            }
            return storage;
        }
    }
    exports.StorageDatabaseChannel = StorageDatabaseChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZUlwYy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vc3RvcmFnZS9lbGVjdHJvbi1tYWluL3N0b3JhZ2VJcGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHLE1BQWEsc0JBQXVCLFNBQVEsc0JBQVU7aUJBRTdCLGlDQUE0QixHQUFHLEdBQUcsQUFBTixDQUFPO1FBTTNELFlBQ2tCLFVBQXVCLEVBQ3ZCLGtCQUF1QztZQUV4RCxLQUFLLEVBQUUsQ0FBQztZQUhTLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDdkIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQU54Qyx5Q0FBb0MsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFpQyxDQUFDLENBQUM7WUFFcEcsaURBQTRDLEdBQUcsSUFBSSxHQUFHLEVBQW1FLENBQUM7WUFRMUksSUFBSSxDQUFDLDhCQUE4QixDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1FBQ3ZILENBQUM7UUFFRCwrQkFBK0I7UUFFdkIsOEJBQThCLENBQUMsT0FBcUIsRUFBRSxPQUErQztZQUU1Ryw4REFBOEQ7WUFDOUQsNkRBQTZEO1lBRTdELElBQUksQ0FBQyxTQUFTLENBQUMsYUFBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxJQUF1QyxFQUFFLEdBQXdCLEVBQUUsRUFBRTtnQkFDL0gsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO29CQUNYLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNkLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQixDQUFDO2dCQUVELE9B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