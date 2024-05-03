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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/base/common/event", "vs/platform/storage/common/storageIpc", "vs/platform/userDataProfile/common/userDataProfile"], function (require, exports, lifecycle_1, storage_1, instantiation_1, storage_2, event_1, storageIpc_1, userDataProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteUserDataProfileStorageService = exports.AbstractUserDataProfileStorageService = exports.IUserDataProfileStorageService = void 0;
    exports.IUserDataProfileStorageService = (0, instantiation_1.createDecorator)('IUserDataProfileStorageService');
    let AbstractUserDataProfileStorageService = class AbstractUserDataProfileStorageService extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
        }
        async readStorageData(profile) {
            return this.withProfileScopedStorageService(profile, async (storageService) => this.getItems(storageService));
        }
        async updateStorageData(profile, data, target) {
            return this.withProfileScopedStorageService(profile, async (storageService) => this.writeItems(storageService, data, target));
        }
        async withProfileScopedStorageService(profile, fn) {
            if (this.storageService.hasScope(profile)) {
                return fn(this.storageService);
            }
            const storageDatabase = await this.createStorageDatabase(profile);
            const storageService = new StorageService(storageDatabase);
            try {
                await storageService.initialize();
                const result = await fn(storageService);
                await storageService.flush();
                return result;
            }
            finally {
                storageService.dispose();
                await this.closeAndDispose(storageDatabase);
            }
        }
        getItems(storageService) {
            const result = new Map();
            const populate = (target) => {
                for (const key of storageService.keys(0 /* StorageScope.PROFILE */, target)) {
                    result.set(key, { value: storageService.get(key, 0 /* StorageScope.PROFILE */), target });
                }
            };
            populate(0 /* StorageTarget.USER */);
            populate(1 /* StorageTarget.MACHINE */);
            return result;
        }
        writeItems(storageService, items, target) {
            storageService.storeAll(Array.from(items.entries()).map(([key, value]) => ({ key, value, scope: 0 /* StorageScope.PROFILE */, target })), true);
        }
        async closeAndDispose(storageDatabase) {
            try {
                await storageDatabase.close();
            }
            finally {
                if ((0, lifecycle_1.isDisposable)(storageDatabase)) {
                    storageDatabase.dispose();
                }
            }
        }
    };
    exports.AbstractUserDataProfileStorageService = AbstractUserDataProfileStorageService;
    exports.AbstractUserDataProfileStorageService = AbstractUserDataProfileStorageService = __decorate([
        __param(0, storage_2.IStorageService)
    ], AbstractUserDataProfileStorageService);
    class RemoteUserDataProfileStorageService extends AbstractUserDataProfileStorageService {
        constructor(remoteService, userDataProfilesService, storageService, logService) {
            super(storageService);
            this.remoteService = remoteService;
            const channel = remoteService.getChannel('profileStorageListener');
            const disposable = this._register(new lifecycle_1.MutableDisposable());
            this._onDidChange = this._register(new event_1.Emitter({
                // Start listening to profile storage changes only when someone is listening
                onWillAddFirstListener: () => {
                    disposable.value = channel.listen('onDidChange')(e => {
                        logService.trace('profile storage changes', e);
                        this._onDidChange.fire({
                            targetChanges: e.targetChanges.map(profile => (0, userDataProfile_1.reviveProfile)(profile, userDataProfilesService.profilesHome.scheme)),
                            valueChanges: e.valueChanges.map(e => ({ ...e, profile: (0, userDataProfile_1.reviveProfile)(e.profile, userDataProfilesService.profilesHome.scheme) }))
                        });
                    });
                },
                // Stop listening to profile storage changes when no one is listening
                onDidRemoveLastListener: () => disposable.value = undefined
            }));
            this.onDidChange = this._onDidChange.event;
        }
        async createStorageDatabase(profile) {
            const storageChannel = this.remoteService.getChannel('storage');
            return (0, storage_2.isProfileUsingDefaultStorage)(profile) ? new storageIpc_1.ApplicationStorageDatabaseClient(storageChannel) : new storageIpc_1.ProfileStorageDatabaseClient(storageChannel, profile);
        }
    }
    exports.RemoteUserDataProfileStorageService = RemoteUserDataProfileStorageService;
    class StorageService extends storage_2.AbstractStorageService {
        constructor(profileStorageDatabase) {
            super({ flushInterval: 100 });
            this.profileStorage = this._register(new storage_1.Storage(profileStorageDatabase));
        }
        doInitialize() {
            return this.profileStorage.init();
        }
        getStorage(scope) {
            return scope === 0 /* StorageScope.PROFILE */ ? this.profileStorage : undefined;
        }
        getLogDetails() { return undefined; }
        async switchToProfile() { }
        async switchToWorkspace() { }
        hasScope() { return false; }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhUHJvZmlsZS9jb21tb24vdXNlckRhdGFQcm9maWxlU3RvcmFnZVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJuRixRQUFBLDhCQUE4QixHQUFHLElBQUEsK0JBQWUsRUFBaUMsZ0NBQWdDLENBQUMsQ0FBQztJQTZCekgsSUFBZSxxQ0FBcUMsR0FBcEQsTUFBZSxxQ0FBc0MsU0FBUSxzQkFBVTtRQU03RSxZQUNxQyxjQUErQjtZQUVuRSxLQUFLLEVBQUUsQ0FBQztZQUY0QixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7UUFHcEUsQ0FBQztRQUVELEtBQUssQ0FBQyxlQUFlLENBQUMsT0FBeUI7WUFDOUMsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxjQUFjLEVBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztRQUM3RyxDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQXlCLEVBQUUsSUFBNEMsRUFBRSxNQUFxQjtZQUNySCxPQUFPLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLGNBQWMsRUFBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDN0gsQ0FBQztRQUVELEtBQUssQ0FBQywrQkFBK0IsQ0FBSSxPQUF5QixFQUFFLEVBQW1EO1lBQ3RILElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FB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