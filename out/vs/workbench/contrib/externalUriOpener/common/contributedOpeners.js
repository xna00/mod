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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/workbench/contrib/externalUriOpener/common/configuration", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, storage_1, memento_1, configuration_1, extensions_1) {
    "use strict";
    var ContributedExternalUriOpenersStore_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedExternalUriOpenersStore = void 0;
    let ContributedExternalUriOpenersStore = class ContributedExternalUriOpenersStore extends lifecycle_1.Disposable {
        static { ContributedExternalUriOpenersStore_1 = this; }
        static { this.STORAGE_ID = 'externalUriOpeners'; }
        constructor(storageService, _extensionService) {
            super();
            this._extensionService = _extensionService;
            this._openers = new Map();
            this._memento = new memento_1.Memento(ContributedExternalUriOpenersStore_1.STORAGE_ID, storageService);
            this._mementoObject = this._memento.getMemento(0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            for (const [id, value] of Object.entries(this._mementoObject || {})) {
                this.add(id, value.extensionId, { isCurrentlyRegistered: false });
            }
            this.invalidateOpenersOnExtensionsChanged();
            this._register(this._extensionService.onDidChangeExtensions(() => this.invalidateOpenersOnExtensionsChanged()));
            this._register(this._extensionService.onDidChangeExtensionsStatus(() => this.invalidateOpenersOnExtensionsChanged()));
        }
        didRegisterOpener(id, extensionId) {
            this.add(id, extensionId, {
                isCurrentlyRegistered: true
            });
        }
        add(id, extensionId, options) {
            const existing = this._openers.get(id);
            if (existing) {
                existing.isCurrentlyRegistered = existing.isCurrentlyRegistered || options.isCurrentlyRegistered;
                return;
            }
            const entry = {
                extensionId,
                isCurrentlyRegistered: options.isCurrentlyRegistered
            };
            this._openers.set(id, entry);
            this._mementoObject[id] = entry;
            this._memento.saveMemento();
            this.updateSchema();
        }
        delete(id) {
            this._openers.delete(id);
            delete this._mementoObject[id];
            this._memento.saveMemento();
            this.updateSchema();
        }
        async invalidateOpenersOnExtensionsChanged() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            const registeredExtensions = this._extensionService.extensions;
            for (const [id, entry] of this._openers) {
                const extension = registeredExtensions.find(r => r.identifier.value === entry.extensionId);
                if (extension) {
                    if (!this._extensionService.canRemoveExtension(extension)) {
                        // The extension is running. We should have registered openers at this point
                        if (!entry.isCurrentlyRegistered) {
                            this.delete(id);
                        }
                    }
                }
                else {
                    // The opener came from an extension that is no longer enabled/installed
                    this.delete(id);
                }
            }
        }
        updateSchema() {
            const ids = [];
            const descriptions = [];
            for (const [id, entry] of this._openers) {
                ids.push(id);
                descriptions.push(entry.extensionId);
            }
            (0, configuration_1.updateContributedOpeners)(ids, descriptions);
        }
    };
    exports.ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore;
    exports.ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore = ContributedExternalUriOpenersStore_1 = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensions_1.IExtensionService)
    ], ContributedExternalUriOpenersStore);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJpYnV0ZWRPcGVuZXJzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlcm5hbFVyaU9wZW5lci9jb21tb24vY29udHJpYnV0ZWRPcGVuZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFrQnpGLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7O2lCQUV6QyxlQUFVLEdBQUcsb0JBQW9CLEFBQXZCLENBQXdCO1FBTTFELFlBQ2tCLGNBQStCLEVBQzdCLGlCQUFxRDtZQUV4RSxLQUFLLEVBQUUsQ0FBQztZQUY0QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBTnhELGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBb0MsQ0FBQztZQVV2RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksaUJBQU8sQ0FBQyxvQ0FBa0MsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDM0YsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsNkRBQTZDLENBQUM7WUFDNUYsS0FBSyxNQUFNLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNyRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBRUQsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLENBQUM7WUFFNUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMs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