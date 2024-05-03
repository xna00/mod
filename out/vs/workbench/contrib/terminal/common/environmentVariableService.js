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
define(["require", "exports", "vs/base/common/event", "vs/base/common/decorators", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/terminal/common/environmentVariableCollection", "vs/platform/terminal/common/environmentVariableShared", "vs/base/common/lifecycle"], function (require, exports, event_1, decorators_1, storage_1, extensions_1, environmentVariableCollection_1, environmentVariableShared_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentVariableService = void 0;
    /**
     * Tracks and persists environment variable collections as defined by extensions.
     */
    let EnvironmentVariableService = class EnvironmentVariableService extends lifecycle_1.Disposable {
        get onDidChangeCollections() { return this._onDidChangeCollections.event; }
        constructor(_extensionService, _storageService) {
            super();
            this._extensionService = _extensionService;
            this._storageService = _storageService;
            this.collections = new Map();
            this._onDidChangeCollections = this._register(new event_1.Emitter());
            this._storageService.remove("terminal.integrated.environmentVariableCollections" /* TerminalStorageKeys.DeprecatedEnvironmentVariableCollections */, 1 /* StorageScope.WORKSPACE */);
            const serializedPersistedCollections = this._storageService.get("terminal.integrated.environmentVariableCollectionsV2" /* TerminalStorageKeys.EnvironmentVariableCollections */, 1 /* StorageScope.WORKSPACE */);
            if (serializedPersistedCollections) {
                const collectionsJson = JSON.parse(serializedPersistedCollections);
                collectionsJson.forEach(c => this.collections.set(c.extensionIdentifier, {
                    persistent: true,
                    map: (0, environmentVariableShared_1.deserializeEnvironmentVariableCollection)(c.collection),
                    descriptionMap: (0, environmentVariableShared_1.deserializeEnvironmentDescriptionMap)(c.description)
                }));
                // Asynchronously invalidate collections where extensions have been uninstalled, this is
                // async to avoid making all functions on the service synchronous and because extensions
                // being uninstalled is rare.
                this._invalidateExtensionCollections();
            }
            this.mergedCollection = this._resolveMergedCollection();
            // Listen for uninstalled/disabled extensions
            this._register(this._extensionService.onDidChangeExtensions(() => this._invalidateExtensionCollections()));
        }
        set(extensionIdentifier, collection) {
            this.collections.set(extensionIdentifier, collection);
            this._updateCollections();
        }
        delete(extensionIdentifier) {
            this.collections.delete(extensionIdentifier);
            this._updateCollections();
        }
        _updateCollections() {
            this._persistCollectionsEventually();
            this.mergedCollection = this._resolveMergedCollection();
            this._notifyCollectionUpdatesEventually();
        }
        _persistCollectionsEventually() {
            this._persistCollections();
        }
        _persistCollections() {
            const collectionsJson = [];
            this.collections.forEach((collection, extensionIdentifier) => {
                if (collection.persistent) {
                    collectionsJson.push({
                        extensionIdentifier,
                        collection: (0, environmentVariableShared_1.serializeEnvironmentVariableCollection)(this.collections.get(extensionIdentifier).map),
                        description: (0, environmentVariableShared_1.serializeEnvironmentDescriptionMap)(collection.descriptionMap)
                    });
                }
            });
            const stringifiedJson = JSON.stringify(collectionsJson);
            this._storageService.store("terminal.integrated.environmentVariableCollectionsV2" /* TerminalStorageKeys.EnvironmentVariableCollections */, stringifiedJson, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        _notifyCollectionUpdatesEventually() {
            this._notifyCollectionUpdates();
        }
        _notifyCollectionUpdates() {
            this._onDidChangeCollections.fire(this.mergedCollection);
        }
        _resolveMergedCollection() {
            return new environmentVariableCollection_1.MergedEnvironmentVariableCollection(this.collections);
        }
        async _invalidateExtensionCollections() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            const registeredExtensions = this._extensionService.extensions;
            let changes = false;
            this.collections.forEach((_, extensionIdentifier) => {
                const isExtensionRegistered = registeredExtensions.some(r => r.identifier.value === extensionIdentifier);
                if (!isExtensionRegistered) {
                    this.collections.delete(extensionIdentifier);
                    changes = true;
                }
            });
            if (changes) {
                this._updateCollections();
            }
        }
    };
    exports.EnvironmentVariableService = EnvironmentVariableService;
    __decorate([
        (0, decorators_1.throttle)(1000)
    ], EnvironmentVariableService.prototype, "_persistCollectionsEventually", null);
    __decorate([
        (0, decorators_1.debounce)(1000)
    ], EnvironmentVariableService.prototype, "_notifyCollectionUpdatesEventually", null);
    exports.EnvironmentVariableService = EnvironmentVariableService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService)
    ], EnvironmentVariableService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnRWYXJpYWJsZVNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsL2NvbW1vbi9lbnZpcm9ubWVudFZhcmlhYmxlU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHOztPQUVHO0lBQ0ksSUFBTSwwQkFBMEIsR0FBaEMsTUFBTSwwQkFBMkIsU0FBUSxzQkFBVTtRQU96RCxJQUFJLHNCQUFzQixLQUFrRCxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXhILFlBQ29CLGlCQUFxRCxFQUN2RCxlQUFpRDtZQUVsRSxLQUFLLEVBQUUsQ0FBQztZQUg0QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3RDLG9CQUFlLEdBQWYsZUFBZSxDQUFpQjtZQVJuRSxnQkFBVyxHQUErRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBR25FLDRCQUF1QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQXdDLENBQUMsQ0FBQztZQVM5RyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0seUpBQXNGLENBQUM7WUFDbEgsTUFBTSw4QkFBOEIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsaUpBQTRFLENBQUM7WUFDNUksSUFBSSw4QkFBOEIsRUFBRSxDQUFDO2dCQUNwQyxNQUFNLGVBQWUsR0FBMEQsSUFBSSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2dCQUMxSCxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFO29CQUN4RSxVQUFV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