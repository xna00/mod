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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/product/common/productService", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/types"], function (require, exports, instantiation_1, event_1, lifecycle_1, storage_1, extensionManagementUtil_1, productService_1, arrays_1, log_1, types_1) {
    "use strict";
    var ExtensionStorageService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStorageService = exports.IExtensionStorageService = void 0;
    exports.IExtensionStorageService = (0, instantiation_1.createDecorator)('IExtensionStorageService');
    const EXTENSION_KEYS_ID_VERSION_REGEX = /^extensionKeys\/([^.]+\..+)@(\d+\.\d+\.\d+(-.*)?)$/;
    let ExtensionStorageService = class ExtensionStorageService extends lifecycle_1.Disposable {
        static { ExtensionStorageService_1 = this; }
        static { this.LARGE_STATE_WARNING_THRESHOLD = 512 * 1024; }
        static toKey(extension) {
            return `extensionKeys/${(0, extensionManagementUtil_1.adoptToGalleryExtensionId)(extension.id)}@${extension.version}`;
        }
        static fromKey(key) {
            const matches = EXTENSION_KEYS_ID_VERSION_REGEX.exec(key);
            if (matches && matches[1]) {
                return { id: matches[1], version: matches[2] };
            }
            return undefined;
        }
        /* TODO @sandy081: This has to be done across all profiles */
        static async removeOutdatedExtensionVersions(extensionManagementService, storageService) {
            const extensions = await extensionManagementService.getInstalled();
            const extensionVersionsToRemove = [];
            for (const [id, versions] of ExtensionStorageService_1.readAllExtensionsWithKeysForSync(storageService)) {
                const extensionVersion = extensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }))?.manifest.version;
                for (const version of versions) {
                    if (extensionVersion !== version) {
                        extensionVersionsToRemove.push(ExtensionStorageService_1.toKey({ id, version }));
                    }
                }
            }
            for (const key of extensionVersionsToRemove) {
                storageService.remove(key, 0 /* StorageScope.PROFILE */);
            }
        }
        static readAllExtensionsWithKeysForSync(storageService) {
            const extensionsWithKeysForSync = new Map();
            const keys = storageService.keys(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const key of keys) {
                const extensionIdWithVersion = ExtensionStorageService_1.fromKey(key);
                if (extensionIdWithVersion) {
                    let versions = extensionsWithKeysForSync.get(extensionIdWithVersion.id.toLowerCase());
                    if (!versions) {
                        extensionsWithKeysForSync.set(extensionIdWithVersion.id.toLowerCase(), versions = []);
                    }
                    versions.push(extensionIdWithVersion.version);
                }
            }
            return extensionsWithKeysForSync;
        }
        constructor(storageService, productService, logService) {
            super();
            this.storageService = storageService;
            this.productService = productService;
            this.logService = logService;
            this._onDidChangeExtensionStorageToSync = this._register(new event_1.Emitter());
            this.onDidChangeExtensionStorageToSync = this._onDidChangeExtensionStorageToSync.event;
            this.extensionsWithKeysForSync = ExtensionStorageService_1.readAllExtensionsWithKeysForSync(storageService);
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this._register(new lifecycle_1.DisposableStore()))(e => this.onDidChangeStorageValue(e)));
        }
        onDidChangeStorageValue(e) {
            // State of extension with keys for sync has changed
            if (this.extensionsWithKeysForSync.has(e.key.toLowerCase())) {
                this._onDidChangeExtensionStorageToSync.fire();
                return;
            }
            // Keys for sync of an extension has changed
            const extensionIdWithVersion = ExtensionStorageService_1.fromKey(e.key);
            if (extensionIdWithVersion) {
                if (this.storageService.get(e.key, 0 /* StorageScope.PROFILE */) === undefined) {
                    this.extensionsWithKeysForSync.delete(extensionIdWithVersion.id.toLowerCase());
                }
                else {
                    let versions = this.extensionsWithKeysForSync.get(extensionIdWithVersion.id.toLowerCase());
                    if (!versions) {
                        this.extensionsWithKeysForSync.set(extensionIdWithVersion.id.toLowerCase(), versions = []);
                    }
                    versions.push(extensionIdWithVersion.version);
                    this._onDidChangeExtensionStorageToSync.fire();
                }
                return;
            }
        }
        getExtensionId(extension) {
            if ((0, types_1.isString)(extension)) {
                return extension;
            }
            const publisher = extension.manifest ? extension.manifest.publisher : extension.publisher;
            const name = extension.manifest ? extension.manifest.name : extension.name;
            return (0, extensionManagementUtil_1.getExtensionId)(publisher, name);
        }
        getExtensionState(extension, global) {
            const extensionId = this.getExtensionId(extension);
            const jsonValue = this.getExtensionStateRaw(extension, global);
            if (jsonValue) {
                try {
                    return JSON.parse(jsonValue);
                }
                catch (error) {
                    // Do not fail this call but log it for diagnostics
                    // https://github.com/microsoft/vscode/issues/132777
                    this.logService.error(`[mainThreadStorage] unexpected error parsing storage contents (extensionId: ${extensionId}, global: ${global}): ${error}`);
                }
            }
            return undefined;
        }
        getExtensionStateRaw(extension, global) {
            const extensionId = this.getExtensionId(extension);
            const rawState = this.storageService.get(extensionId, global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */);
            if (rawState && rawState?.length > ExtensionStorageService_1.LARGE_STATE_WARNING_THRESHOLD) {
                this.logService.warn(`[mainThreadStorage] large extension state detected (extensionId: ${extensionId}, global: ${global}): ${rawState.length / 1024}kb. Consider to use 'storageUri' or 'globalStorageUri' to store this data on disk instead.`);
            }
            return rawState;
        }
        setExtensionState(extension, state, global) {
            const extensionId = this.getExtensionId(extension);
            if (state === undefined) {
                this.storageService.remove(extensionId, global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(extensionId, JSON.stringify(state), global ? 0 /* StorageScope.PROFILE */ : 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        setKeysForSync(extensionIdWithVersion, keys) {
            this.storageService.store(ExtensionStorageService_1.toKey(extensionIdWithVersion), JSON.stringify(keys), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
        getKeysForSync(extensionIdWithVersion) {
            const extensionKeysForSyncFromProduct = this.productService.extensionSyncedKeys?.[extensionIdWithVersion.id.toLowerCase()];
            const extensionKeysForSyncFromStorageValue = this.storageService.get(ExtensionStorageService_1.toKey(extensionIdWithVersion), 0 /* StorageScope.PROFILE */);
            const extensionKeysForSyncFromStorage = extensionKeysForSyncFromStorageValue ? JSON.parse(extensionKeysForSyncFromStorageValue) : undefined;
            return extensionKeysForSyncFromStorage && extensionKeysForSyncFromProduct
                ? (0, arrays_1.distinct)([...extensionKeysForSyncFromStorage, ...extensionKeysForSyncFromProduct])
                : (extensionKeysForSyncFromStorage || extensionKeysForSyncFromProduct);
        }
        addToMigrationList(from, to) {
            if (from !== to) {
                // remove the duplicates
                const migrationList = this.migrationList.filter(entry => !entry.includes(from) && !entry.includes(to));
                migrationList.push([from, to]);
                this.migrationList = migrationList;
            }
        }
        getSourceExtensionToMigrate(toExtensionId) {
            const entry = this.migrationList.find(([, to]) => toExtensionId === to);
            return entry ? entry[0] : undefined;
        }
        get migrationList() {
            const value = this.storageService.get('extensionStorage.migrationList', -1 /* StorageScope.APPLICATION */, '[]');
            try {
                const migrationList = JSON.parse(value);
                if (Array.isArray(migrationList)) {
                    return migrationList;
                }
            }
            catch (error) { /* ignore */ }
            return [];
        }
        set migrationList(migrationList) {
            if (migrationList.length) {
                this.storageService.store('extensionStorage.migrationList', JSON.stringify(migrationList), -1 /* StorageScope.APPLICATION */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove('extensionStorage.migrationList', -1 /* StorageScope.APPLICATION */);
            }
        }
    };
    exports.ExtensionStorageService = ExtensionStorageService;
    exports.ExtensionStorageService = ExtensionStorageService = ExtensionStorageService_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService)
    ], ExtensionStorageService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uU3RvcmFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBb0JuRixRQUFBLHdCQUF3QixHQUFHLElBQUEsK0JBQWUsRUFBMkIsMEJBQTBCLENBQUMsQ0FBQztJQWlCOUcsTUFBTSwrQkFBK0IsR0FBRyxvREFBb0QsQ0FBQztJQUV0RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVOztpQkFJdkMsa0NBQTZCLEdBQUcsR0FBRyxHQUFHLElBQUksQUFBYixDQUFjO1FBRWxELE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBa0M7WUFDdEQsT0FBTyxpQkFBaUIsSUFBQSxtREFBeUIsRUFBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hGLENBQUM7UUFFTyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQVc7WUFDakMsTUFBTSxPQUFPLEdBQUcsK0JBQStCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzFELElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUMzQixPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDaEQsQ0FBQztZQUNELE9BQU8sU0FBUyxDQUFDO1FBQ2xCLENBQUM7UUFFRCw2REFBNkQ7UUFDN0QsTUFBTSxDQUFDLEtBQUssQ0FBQywrQkFBK0IsQ0FBQywwQkFBdUQsRUFBRSxjQUErQjtZQUNwSSxN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