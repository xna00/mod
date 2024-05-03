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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/storage/common/storage"], function (require, exports, event_1, lifecycle_1, types_1, extensionManagement_1, extensionManagementUtil_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageManager = exports.GlobalExtensionEnablementService = void 0;
    let GlobalExtensionEnablementService = class GlobalExtensionEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, extensionManagementService) {
            super();
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this.storageManger = this._register(new StorageManager(storageService));
            this._register(this.storageManger.onDidChange(extensions => this._onDidChangeEnablement.fire({ extensions, source: 'storage' })));
            this._register(extensionManagementService.onDidInstallExtensions(e => e.forEach(({ local, operation }) => {
                if (local && operation === 4 /* InstallOperation.Migrate */) {
                    this._removeFromDisabledExtensions(local.identifier); /* Reset migrated extensions */
                }
            })));
        }
        async enableExtension(extension, source) {
            if (this._removeFromDisabledExtensions(extension)) {
                this._onDidChangeEnablement.fire({ extensions: [extension], source });
                return true;
            }
            return false;
        }
        async disableExtension(extension, source) {
            if (this._addToDisabledExtensions(extension)) {
                this._onDidChangeEnablement.fire({ extensions: [extension], source });
                return true;
            }
            return false;
        }
        getDisabledExtensions() {
            return this._getExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH);
        }
        async getDisabledExtensionsAsync() {
            return this.getDisabledExtensions();
        }
        _addToDisabledExtensions(identifier) {
            const disabledExtensions = this.getDisabledExtensions();
            if (disabledExtensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)(e, identifier))) {
                disabledExtensions.push(identifier);
                this._setDisabledExtensions(disabledExtensions);
                return true;
            }
            return false;
        }
        _removeFromDisabledExtensions(identifier) {
            const disabledExtensions = this.getDisabledExtensions();
            for (let index = 0; index < disabledExtensions.length; index++) {
                const disabledExtension = disabledExtensions[index];
                if ((0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier)) {
                    disabledExtensions.splice(index, 1);
                    this._setDisabledExtensions(disabledExtensions);
                    return true;
                }
            }
            return false;
        }
        _setDisabledExtensions(disabledExtensions) {
            this._setExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH, disabledExtensions);
        }
        _getExtensions(storageId) {
            return this.storageManger.get(storageId, 0 /* StorageScope.PROFILE */);
        }
        _setExtensions(storageId, extensions) {
            this.storageManger.set(storageId, extensions, 0 /* StorageScope.PROFILE */);
        }
    };
    exports.GlobalExtensionEnablementService = GlobalExtensionEnablementService;
    exports.GlobalExtensionEnablementService = GlobalExtensionEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensionManagement_1.IExtensionManagementService)
    ], GlobalExtensionEnablementService);
    class StorageManager extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.storage = Object.create(null);
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this._register(new lifecycle_1.DisposableStore()))(e => this.onDidStorageChange(e)));
        }
        get(key, scope) {
            let value;
            if (scope === 0 /* StorageScope.PROFILE */) {
                if ((0, types_1.isUndefinedOrNull)(this.storage[key])) {
                    this.storage[key] = this._get(key, scope);
                }
                value = this.storage[key];
            }
            else {
                value = this._get(key, scope);
            }
            return JSON.parse(value);
        }
        set(key, value, scope) {
            const newValue = JSON.stringify(value.map(({ id, uuid }) => ({ id, uuid })));
            const oldValue = this._get(key, scope);
            if (oldValue !== newValue) {
                if (scope === 0 /* StorageScope.PROFILE */) {
                    if (value.length) {
                        this.storage[key] = newValue;
                    }
                    else {
                        delete this.storage[key];
                    }
                }
                this._set(key, value.length ? newValue : undefined, scope);
            }
        }
        onDidStorageChange(storageChangeEvent) {
            if (!(0, types_1.isUndefinedOrNull)(this.storage[storageChangeEvent.key])) {
                const newValue = this._get(storageChangeEvent.key, storageChangeEvent.scope);
                if (newValue !== this.storage[storageChangeEvent.key]) {
                    const oldValues = this.get(storageChangeEvent.key, storageChangeEvent.scope);
                    delete this.storage[storageChangeEvent.key];
                    const newValues = this.get(storageChangeEvent.key, storageChangeEvent.scope);
                    const added = oldValues.filter(oldValue => !newValues.some(newValue => (0, extensionManagementUtil_1.areSameExtensions)(oldValue, newValue)));
                    const removed = newValues.filter(newValue => !oldValues.some(oldValue => (0, extensionManagementUtil_1.areSameExtensions)(oldValue, newValue)));
                    if (added.length || removed.length) {
                        this._onDidChange.fire([...added, ...removed]);
                    }
                }
            }
        }
        _get(key, scope) {
            return this.storageService.get(key, scope, '[]');
        }
        _set(key, value, scope) {
            if (value) {
                // Enablement state is synced separately through extensions
                this.storageService.store(key, value, scope, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(key, scope);
            }
        }
    }
    exports.StorageManager = StorageManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRW5hYmxlbWVudFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2V4dGVuc2lvbk1hbmFnZW1lbnQvY29tbW9uL2V4dGVuc2lvbkVuYWJsZW1lbnRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQVN6RixJQUFNLGdDQUFnQyxHQUF0QyxNQUFNLGdDQUFpQyxTQUFRLHNCQUFVO1FBUS9ELFlBQ2tCLGNBQStCLEVBQ25CLDBCQUF1RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQVJELDJCQUFzQixHQUFHLElBQUksZUFBTyxFQUE2RSxDQUFDO1lBQ2pILDBCQUFxQixHQUFxRixJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDO1lBUXBKLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsSSxJQUFJLENBQUMsU0FBUyxDQUFDLDBCQUEwQixDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7Z0JBQ3hHLElBQUksS0FBSyxJQUFJLFNBQVMscUNBQTZCLEVBQUUsQ0FBQztvQkFDckQsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FB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