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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, platform_1, environment_1, storage_1, telemetry_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncEnablementService = void 0;
    const enablementKey = 'sync.enable';
    let UserDataSyncEnablementService = class UserDataSyncEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, telemetryService, environmentService, userDataSyncStoreManagementService) {
            super();
            this.storageService = storageService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._onDidChangeResourceEnablement = new event_1.Emitter();
            this.onDidChangeResourceEnablement = this._onDidChangeResourceEnablement.event;
            this._register(storageService.onDidChangeValue(-1 /* StorageScope.APPLICATION */, undefined, this._register(new lifecycle_1.DisposableStore()))(e => this.onDidStorageChange(e)));
        }
        isEnabled() {
            switch (this.environmentService.sync) {
                case 'on':
                    return true;
                case 'off':
                    return false;
            }
            return this.storageService.getBoolean(enablementKey, -1 /* StorageScope.APPLICATION */, false);
        }
        canToggleEnablement() {
            return this.userDataSyncStoreManagementService.userDataSyncStore !== undefined && this.environmentService.sync === undefined;
        }
        setEnablement(enabled) {
            if (enabled && !this.canToggleEnablement()) {
                return;
            }
            this.telemetryService.publicLog2(enablementKey, { enabled });
            this.storageService.store(enablementKey, enabled, -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
        }
        isResourceEnabled(resource) {
            return this.storageService.getBoolean((0, userDataSync_1.getEnablementKey)(resource), -1 /* StorageScope.APPLICATION */, true);
        }
        setResourceEnablement(resource, enabled) {
            if (this.isResourceEnabled(resource) !== enabled) {
                const resourceEnablementKey = (0, userDataSync_1.getEnablementKey)(resource);
                this.storeResourceEnablement(resourceEnablementKey, enabled);
            }
        }
        getResourceSyncStateVersion(resource) {
            return undefined;
        }
        storeResourceEnablement(resourceEnablementKey, enabled) {
            this.storageService.store(resourceEnablementKey, enabled, -1 /* StorageScope.APPLICATION */, platform_1.isWeb ? 0 /* StorageTarget.USER */ : 1 /* StorageTarget.MACHINE */);
        }
        onDidStorageChange(storageChangeEvent) {
            if (enablementKey === storageChangeEvent.key) {
                this._onDidChangeEnablement.fire(this.isEnabled());
                return;
            }
            const resourceKey = userDataSync_1.ALL_SYNC_RESOURCES.filter(resourceKey => (0, userDataSync_1.getEnablementKey)(resourceKey) === storageChangeEvent.key)[0];
            if (resourceKey) {
                this._onDidChangeResourceEnablement.fire([resourceKey, this.isResourceEnabled(resourceKey)]);
                return;
            }
        }
    };
    exports.UserDataSyncEnablementService = UserDataSyncEnablementService;
    exports.UserDataSyncEnablementService = UserDataSyncEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, userDataSync_1.IUserDataSyncStoreManagementService)
    ], UserDataSyncEnablementService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlckRhdGFTeW5jRW5hYmxlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3VzZXJEYXRhU3luYy9jb21tb24vdXNlckRhdGFTeW5jRW5hYmxlbWVudFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JoRyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUM7SUFFN0IsSUFBTSw2QkFBNkIsR0FBbkMsTUFBTSw2QkFBOEIsU0FBUSxzQkFBVTtRQVU1RCxZQUNrQixjQUFnRCxFQUM5QyxnQkFBb0QsRUFDbEQsa0JBQTBELEVBQzFDLGtDQUF3RjtZQUU3SCxLQUFLLEVBQUUsQ0FBQztZQUwwQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7WUFDN0IscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ3pCLHVDQUFrQyxHQUFsQyxrQ0FBa0MsQ0FBcUM7WUFWdEgsMkJBQXNCLEdBQUcsSUFBSSxlQUFPLEVBQVcsQ0FBQztZQUMvQywwQkFBcUIsR0FBbUIsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUUzRSxtQ0FBOEIsR0FBRyxJQUFJLGVBQU8sRUFBMkIsQ0FBQztZQUN2RSxrQ0FBNkIsR0FBbUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQztZQVNsSCxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0Isb0NBQTJCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUos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