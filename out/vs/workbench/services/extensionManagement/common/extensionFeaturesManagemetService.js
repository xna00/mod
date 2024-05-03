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
define(["require", "exports", "vs/base/common/event", "vs/platform/extensions/common/extensions", "vs/base/common/lifecycle", "vs/workbench/services/extensionManagement/common/extensionFeatures", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/types", "vs/platform/dialogs/common/dialogs", "vs/nls", "vs/workbench/services/extensions/common/extensions", "vs/base/common/arrays", "vs/base/common/objects"], function (require, exports, event_1, extensions_1, lifecycle_1, extensionFeatures_1, extensions_2, storage_1, platform_1, types_1, dialogs_1, nls_1, extensions_3, arrays_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const FEATURES_STATE_KEY = 'extension.features.state';
    let ExtensionFeaturesManagementService = class ExtensionFeaturesManagementService extends lifecycle_1.Disposable {
        constructor(storageService, dialogService, extensionService) {
            super();
            this.storageService = storageService;
            this.dialogService = dialogService;
            this.extensionService = extensionService;
            this._onDidChangeEnablement = this._register(new event_1.Emitter());
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._onDidChangeAccessData = this._register(new event_1.Emitter());
            this.onDidChangeAccessData = this._onDidChangeAccessData.event;
            this.extensionFeaturesState = new Map();
            this.registry = platform_1.Registry.as(extensionFeatures_1.Extensions.ExtensionFeaturesRegistry);
            this.extensionFeaturesState = this.loadState();
            this._register(storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, FEATURES_STATE_KEY, this._store)(e => this.onDidStorageChange(e)));
        }
        isEnabled(extension, featureId) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                return false;
            }
            const isDisabled = this.getExtensionFeatureState(extension, featureId)?.disabled;
            if ((0, types_1.isBoolean)(isDisabled)) {
                return !isDisabled;
            }
            const defaultExtensionAccess = feature.access.extensionsList?.[extension.value];
            if ((0, types_1.isBoolean)(defaultExtensionAccess)) {
                return defaultExtensionAccess;
            }
            return !feature.access.requireUserConsent;
        }
        setEnablement(extension, featureId, enabled) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                throw new Error(`No feature with id '${featureId}'`);
            }
            const featureState = this.getAndSetIfNotExistsExtensionFeatureState(extension, featureId);
            if (featureState.disabled !== !enabled) {
                featureState.disabled = !enabled;
                this._onDidChangeEnablement.fire({ extension, featureId, enabled });
                this.saveState();
            }
        }
        getEnablementData(featureId) {
            const result = [];
            const feature = this.registry.getExtensionFeature(featureId);
            if (feature) {
                for (const [extension, featuresStateMap] of this.extensionFeaturesState) {
                    const featureState = featuresStateMap.get(featureId);
                    if (featureState?.disabled !== undefined) {
                        result.push({ extension: new extensions_1.ExtensionIdentifier(extension), enabled: !featureState.disabled });
                    }
                }
            }
            return result;
        }
        async getAccess(extension, featureId, justification) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                return false;
            }
            const featureState = this.getAndSetIfNotExistsExtensionFeatureState(extension, featureId);
            if (featureState.disabled) {
                return false;
            }
            if (featureState.disabled === undefined) {
                let enabled = true;
                if (feature.access.requireUserConsent) {
                    const extensionDescription = this.extensionService.extensions.find(e => extensions_1.ExtensionIdentifier.equals(e.identifier, extension));
                    const confirmationResult = await this.dialogService.confirm({
                        title: (0, nls_1.localize)('accessExtensionFeature', "Access '{0}' Feature", feature.label),
                        message: (0, nls_1.localize)('accessExtensionFeatureMessage', "'{0}' extension would like to access the '{1}' feature.", extensionDescription?.displayName ?? extension.value, feature.label),
                        detail: justification ?? feature.description,
                        custom: true,
                        primaryButton: (0, nls_1.localize)('allow', "Allow"),
                        cancelButton: (0, nls_1.localize)('disallow', "Don't Allow"),
                    });
                    enabled = confirmationResult.confirmed;
                }
                this.setEnablement(extension, featureId, enabled);
                if (!enabled) {
                    return false;
                }
            }
            featureState.accessData.current = {
                count: featureState.accessData.current?.count ? featureState.accessData.current?.count + 1 : 1,
                lastAccessed: Date.now(),
                status: featureState.accessData.current?.status
            };
            featureState.accessData.totalCount = featureState.accessData.totalCount + 1;
            this.saveState();
            this._onDidChangeAccessData.fire({ extension, featureId, accessData: featureState.accessData });
            return true;
        }
        getAccessData(extension, featureId) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                return;
            }
            return this.getExtensionFeatureState(extension, featureId)?.accessData;
        }
        setStatus(extension, featureId, status) {
            const feature = this.registry.getExtensionFeature(featureId);
            if (!feature) {
                throw new Error(`No feature with id '${featureId}'`);
            }
            const featureState = this.getAndSetIfNotExistsExtensionFeatureState(extension, featureId);
            featureState.accessData.current = {
                count: featureState.accessData.current?.count ?? 0,
                lastAccessed: featureState.accessData.current?.lastAccessed ?? 0,
                status
            };
            this._onDidChangeAccessData.fire({ extension, featureId, accessData: this.getAccessData(extension, featureId) });
        }
        getExtensionFeatureState(extension, featureId) {
            return this.extensionFeaturesState.get(extension.value)?.get(featureId);
        }
        getAndSetIfNotExistsExtensionFeatureState(extension, featureId) {
            let extensionState = this.extensionFeaturesState.get(extension.value);
            if (!extensionState) {
                extensionState = new Map();
                this.extensionFeaturesState.set(extension.value, extensionState);
            }
            let featureState = extensionState.get(featureId);
            if (!featureState) {
                featureState = { accessData: { totalCount: 0 } };
                extensionState.set(featureId, featureState);
            }
            return featureState;
        }
        onDidStorageChange(e) {
            if (e.external) {
                const oldState = this.extensionFeaturesState;
                this.extensionFeaturesState = this.loadState();
                for (const extensionId of (0, arrays_1.distinct)([...oldState.keys(), ...this.extensionFeaturesState.keys()])) {
                    const extension = new extensions_1.ExtensionIdentifier(extensionId);
                    const oldExtensionFeaturesState = oldState.get(extensionId);
                    const newExtensionFeaturesState = this.extensionFeaturesState.get(extensionId);
                    for (const featureId of (0, arrays_1.distinct)([...oldExtensionFeaturesState?.keys() ?? [], ...newExtensionFeaturesState?.keys() ?? []])) {
                        const isEnabled = this.isEnabled(extension, featureId);
                        const wasEnabled = !oldExtensionFeaturesState?.get(featureId)?.disabled;
                        if (isEnabled !== wasEnabled) {
                            this._onDidChangeEnablement.fire({ extension, featureId, enabled: isEnabled });
                        }
                        const newAccessData = this.getAccessData(extension, featureId);
                        const oldAccessData = oldExtensionFeaturesState?.get(featureId)?.accessData;
                        if (!(0, objects_1.equals)(newAccessData, oldAccessData)) {
                            this._onDidChangeAccessData.fire({ extension, featureId, accessData: newAccessData ?? { totalCount: 0 } });
                        }
                    }
                }
            }
        }
        loadState() {
            let data = {};
            const raw = this.storageService.get(FEATURES_STATE_KEY, 0 /* StorageScope.PROFILE */, '{}');
            try {
                data = JSON.parse(raw);
            }
            catch (e) {
                // ignore
            }
            const result = new Map();
            for (const extensionId in data) {
                const extensionFeatureState = new Map();
                const extensionFeatures = data[extensionId];
                for (const featureId in extensionFeatures) {
                    const extensionFeature = extensionFeatures[featureId];
                    extensionFeatureState.set(featureId, {
                        disabled: extensionFeature.disabled,
                        accessData: {
                            totalCount: extensionFeature.accessCount
                        }
                    });
                }
                result.set(extensionId, extensionFeatureState);
            }
            return result;
        }
        saveState() {
            const data = {};
            this.extensionFeaturesState.forEach((extensionState, extensionId) => {
                const extensionFeatures = {};
                extensionState.forEach((featureState, featureId) => {
                    extensionFeatures[featureId] = {
                        disabled: featureState.disabled,
                        accessCount: featureState.accessData.totalCount
                    };
                });
                data[extensionId] = extensionFeatures;
            });
            this.storageService.store(FEATURES_STATE_KEY, JSON.stringify(data), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
    };
    ExtensionFeaturesManagementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, dialogs_1.IDialogService),
        __param(2, extensions_3.IExtensionService)
    ], ExtensionFeaturesManagementService);
    (0, extensions_2.registerSingleton)(extensionFeatures_1.IExtensionFeaturesManagementService, ExtensionFeaturesManagementService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uRmVhdHVyZXNNYW5hZ2VtZXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvZXh0ZW5zaW9uTWFuYWdlbWVudC9jb21tb24vZXh0ZW5zaW9uRmVhdHVyZXNNYW5hZ2VtZXRTZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7O0lBd0JoRyxNQUFNLGtCQUFrQixHQUFHLDBCQUEwQixDQUFDO0lBRXRELElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7UUFZMUQsWUFDa0IsY0FBZ0QsRUFDakQsYUFBOEMsRUFDM0MsZ0JBQW9EO1lBRXZFLEtBQUssRUFBRSxDQUFDO1lBSjBCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDMUIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQVp2RCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUEyRSxDQUFDLENBQUM7WUFDeEksMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUVsRCwyQkFBc0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFrRyxDQUFDLENBQUM7WUFDL0osMEJBQXFCLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQztZQUczRCwyQkFBc0IsR0FBRyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztZQVF2RixJQUFJLENBQUMsUUFBUSxHQUFHLG1CQUFRLENBQUMsRUFBRSxDQUE2Qiw4QkFBVSxDQUFDLHlCQUF5QixDQUFDLENBQUM7WUFDOUYsSUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFT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