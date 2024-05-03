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
define(["require", "exports", "vs/platform/storage/common/storage", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionStorage", "vs/workbench/services/extensions/common/extensionStorageMigration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, storage_1, extHost_protocol_1, extHostCustomers_1, lifecycle_1, platform_1, extensionStorage_1, extensionStorageMigration_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadStorage = void 0;
    let MainThreadStorage = class MainThreadStorage {
        constructor(extHostContext, _extensionStorageService, _storageService, _instantiationService, _logService) {
            this._extensionStorageService = _extensionStorageService;
            this._storageService = _storageService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._storageListener = new lifecycle_1.DisposableStore();
            this._sharedStorageKeysToWatch = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostStorage);
            this._storageListener.add(this._storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this._storageListener)(e => {
                if (this._sharedStorageKeysToWatch.has(e.key)) {
                    const rawState = this._extensionStorageService.getExtensionStateRaw(e.key, true);
                    if (typeof rawState === 'string') {
                        this._proxy.$acceptValue(true, e.key, rawState);
                    }
                }
            }));
        }
        dispose() {
            this._storageListener.dispose();
        }
        async $initializeExtensionStorage(shared, extensionId) {
            await this.checkAndMigrateExtensionStorage(extensionId, shared);
            if (shared) {
                this._sharedStorageKeysToWatch.set(extensionId, true);
            }
            return this._extensionStorageService.getExtensionStateRaw(extensionId, shared);
        }
        async $setValue(shared, key, value) {
            this._extensionStorageService.setExtensionState(key, value, shared);
        }
        $registerExtensionStorageKeysToSync(extension, keys) {
            this._extensionStorageService.setKeysForSync(extension, keys);
        }
        async checkAndMigrateExtensionStorage(extensionId, shared) {
            try {
                let sourceExtensionId = this._extensionStorageService.getSourceExtensionToMigrate(extensionId);
                // TODO: @sandy081 - Remove it after 6 months
                // If current extension does not have any migration requested
                // Then check if the extension has to be migrated for using lower case in web
                // If so, migrate the extension state from lower case id to its normal id.
                if (!sourceExtensionId && platform_1.isWeb && extensionId !== extensionId.toLowerCase()) {
                    sourceExtensionId = extensionId.toLowerCase();
                }
                if (sourceExtensionId) {
                    // TODO: @sandy081 - Remove it after 6 months
                    // In Web, extension state was used to be stored in lower case extension id.
                    // Hence check that if the lower cased source extension was not yet migrated in web
                    // If not take the lower cased source extension id for migration
                    if (platform_1.isWeb && sourceExtensionId !== sourceExtensionId.toLowerCase() && this._extensionStorageService.getExtensionState(sourceExtensionId.toLowerCase(), shared) && !this._extensionStorageService.getExtensionState(sourceExtensionId, shared)) {
                        sourceExtensionId = sourceExtensionId.toLowerCase();
                    }
                    await (0, extensionStorageMigration_1.migrateExtensionStorage)(sourceExtensionId, extensionId, shared, this._instantiationService);
                }
            }
            catch (error) {
                this._logService.error(error);
            }
        }
    };
    exports.MainThreadStorage = MainThreadStorage;
    exports.MainThreadStorage = MainThreadStorage = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadStorage),
        __param(1, extensionStorage_1.IExtensionStorageService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService)
    ], MainThreadStorage);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZFN0b3JhZ2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkU3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFhekYsSUFBTSxpQkFBaUIsR0FBdkIsTUFBTSxpQkFBaUI7UUFNN0IsWUFDQyxjQUErQixFQUNMLHdCQUFtRSxFQUM1RSxlQUFpRCxFQUMzQyxxQkFBNkQsRUFDdkUsV0FBeUM7WUFIWCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQzNELG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQUMxQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3RELGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBUnRDLHFCQUFnQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3pDLDhCQUF5QixHQUF5QixJQUFJLEdBQUcsRUFBbUIsQ0FBQztZQVM3RixJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsaUNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUVyRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLCtCQUF1QixTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzNILElBQUksSUFBSSxDQUFDLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDL0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ2pGLElBQUksT0FB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