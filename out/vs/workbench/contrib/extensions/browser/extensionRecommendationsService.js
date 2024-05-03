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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/extensions/browser/exeBasedRecommendations", "vs/workbench/contrib/extensions/browser/workspaceRecommendations", "vs/workbench/contrib/extensions/browser/fileBasedRecommendations", "vs/workbench/contrib/extensions/browser/keymapRecommendations", "vs/workbench/contrib/extensions/browser/languageRecommendations", "vs/workbench/contrib/extensions/browser/configBasedRecommendations", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/base/common/async", "vs/base/common/uri", "vs/workbench/contrib/extensions/browser/webRecommendations", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/remoteRecommendations", "vs/platform/remote/common/remoteExtensionsScanner", "vs/workbench/services/userData/browser/userDataInit", "vs/base/common/types"], function (require, exports, lifecycle_1, extensionManagement_1, extensionRecommendations_1, instantiation_1, telemetry_1, arrays_1, event_1, environment_1, lifecycle_2, exeBasedRecommendations_1, workspaceRecommendations_1, fileBasedRecommendations_1, keymapRecommendations_1, languageRecommendations_1, configBasedRecommendations_1, extensionRecommendations_2, async_1, uri_1, webRecommendations_1, extensions_1, extensionManagementUtil_1, remoteRecommendations_1, remoteExtensionsScanner_1, userDataInit_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationsService = void 0;
    let ExtensionRecommendationsService = class ExtensionRecommendationsService extends lifecycle_1.Disposable {
        constructor(instantiationService, lifecycleService, galleryService, telemetryService, environmentService, extensionManagementService, extensionRecommendationsManagementService, extensionRecommendationNotificationService, extensionsWorkbenchService, remoteExtensionsScannerService, userDataInitializationService) {
            super();
            this.lifecycleService = lifecycleService;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionManagementService = extensionManagementService;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.remoteExtensionsScannerService = remoteExtensionsScannerService;
            this.userDataInitializationService = userDataInitializationService;
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this.workspaceRecommendations = this._register(instantiationService.createInstance(workspaceRecommendations_1.WorkspaceRecommendations));
            this.fileBasedRecommendations = this._register(instantiationService.createInstance(fileBasedRecommendations_1.FileBasedRecommendations));
            this.configBasedRecommendations = this._register(instantiationService.createInstance(configBasedRecommendations_1.ConfigBasedRecommendations));
            this.exeBasedRecommendations = this._register(instantiationService.createInstance(exeBasedRecommendations_1.ExeBasedRecommendations));
            this.keymapRecommendations = this._register(instantiationService.createInstance(keymapRecommendations_1.KeymapRecommendations));
            this.webRecommendations = this._register(instantiationService.createInstance(webRecommendations_1.WebRecommendations));
            this.languageRecommendations = this._register(instantiationService.createInstance(languageRecommendations_1.LanguageRecommendations));
            this.remoteRecommendations = this._register(instantiationService.createInstance(remoteRecommendations_1.RemoteRecommendations));
            if (!this.isEnabled()) {
                this.sessionSeed = 0;
                this.activationPromise = Promise.resolve();
                return;
            }
            this.sessionSeed = +new Date();
            // Activation
            this.activationPromise = this.activate();
            this._register(this.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
        }
        async activate() {
            try {
                await Promise.allSettled([
                    this.remoteExtensionsScannerService.whenExtensionsReady(),
                    this.userDataInitializationService.whenInitializationFinished(),
                    this.lifecycleService.when(3 /* LifecyclePhase.Restored */)
                ]);
            }
            catch (error) { /* ignore */ }
            // activate all recommendations
            await Promise.all([
                this.workspaceRecommendations.activate(),
                this.configBasedRecommendations.activate(),
                this.fileBasedRecommendations.activate(),
                this.keymapRecommendations.activate(),
                this.languageRecommendations.activate(),
                this.webRecommendations.activate(),
                this.remoteRecommendations.activate()
            ]);
            this._register(event_1.Event.any(this.workspaceRecommendations.onDidChangeRecommendations, this.configBasedRecommendations.onDidChangeRecommendations, this.extensionRecommendationsManagementService.onDidChangeIgnoredRecommendations)(() => this._onDidChangeRecommendations.fire()));
            this._register(this.extensionRecommendationsManagementService.onDidChangeGlobalIgnoredRecommendation(({ extensionId, isRecommended }) => {
                if (!isRecommended) {
                    const reason = this.getAllRecommendationsWithReason()[extensionId];
                    if (reason && reason.reasonId) {
                        this.telemetryService.publicLog2('extensionsRecommendations:ignoreRecommendation', { extensionId, recommendationReason: reason.reasonId });
                    }
                }
            }));
            this.promptWorkspaceRecommendations();
        }
        isEnabled() {
            return this.galleryService.isEnabled() && !this.environmentService.isExtensionDevelopment;
        }
        async activateProactiveRecommendations() {
            await Promise.all([this.exeBasedRecommendations.activate(), this.configBasedRecommendations.activate()]);
        }
        getAllRecommendationsWithReason() {
            /* Activate proactive recommendations */
            this.activateProactiveRecommendations();
            const output = Object.create(null);
            const allRecommendations = [
                ...this.configBasedRecommendations.recommendations,
                ...this.exeBasedRecommendations.recommendations,
                ...this.fileBasedRecommendations.recommendations,
                ...this.workspaceRecommendations.recommendations,
                ...this.keymapRecommendations.recommendations,
                ...this.languageRecommendations.recommendations,
                ...this.webRecommendations.recommendations,
            ];
            for (const { extension, reason } of allRecommendations) {
                if ((0, types_1.isString)(extension) && this.isExtensionAllowedToBeRecommended(extension)) {
                    output[extension.toLowerCase()] = reason;
                }
            }
            return output;
        }
        async getConfigBasedRecommendations() {
            await this.configBasedRecommendations.activate();
            return {
                important: this.toExtensionIds(this.configBasedRecommendations.importantRecommendations),
                others: this.toExtensionIds(this.configBasedRecommendations.otherRecommendations)
            };
        }
        async getOtherRecommendations() {
            await this.activationPromise;
            await this.activateProactiveRecommendations();
            const recommendations = [
                ...this.configBasedRecommendations.otherRecommendations,
                ...this.exeBasedRecommendations.otherRecommendations,
                ...this.webRecommendations.recommendations
            ];
            const extensionIds = this.toExtensionIds(recommendations);
            (0, arrays_1.shuffle)(extensionIds, this.sessionSeed);
            return extensionIds;
        }
        async getImportantRecommendations() {
            await this.activateProactiveRecommendations();
            const recommendations = [
                ...this.fileBasedRecommendations.importantRecommendations,
                ...this.configBasedRecommendations.importantRecommendations,
                ...this.exeBasedRecommendations.importantRecommendations,
            ];
            const extensionIds = this.toExtensionIds(recommendations);
            (0, arrays_1.shuffle)(extensionIds, this.sessionSeed);
            return extensionIds;
        }
        getKeymapRecommendations() {
            return this.toExtensionIds(this.keymapRecommendations.recommendations);
        }
        getLanguageRecommendations() {
            return this.toExtensionIds(this.languageRecommendations.recommendations);
        }
        getRemoteRecommendations() {
            return this.toExtensionIds(this.remoteRecommendations.recommendations);
        }
        async getWorkspaceRecommendations() {
            if (!this.isEnabled()) {
                return [];
            }
            await this.workspaceRecommendations.activate();
            const result = [];
            for (const { extension } of this.workspaceRecommendations.recommendations) {
                if ((0, types_1.isString)(extension)) {
                    if (!result.includes(extension.toLowerCase()) && this.isExtensionAllowedToBeRecommended(extension)) {
                        result.push(extension.toLowerCase());
                    }
                }
                else {
                    result.push(extension);
                }
            }
            return result;
        }
        async getExeBasedRecommendations(exe) {
            await this.exeBasedRecommendations.activate();
            const { important, others } = exe ? this.exeBasedRecommendations.getRecommendations(exe)
                : { important: this.exeBasedRecommendations.importantRecommendations, others: this.exeBasedRecommendations.otherRecommendations };
            return { important: this.toExtensionIds(important), others: this.toExtensionIds(others) };
        }
        getFileBasedRecommendations() {
            return this.toExtensionIds(this.fileBasedRecommendations.recommendations);
        }
        onDidInstallExtensions(results) {
            for (const e of results) {
                if (e.source && !uri_1.URI.isUri(e.source) && e.operation === 2 /* InstallOperation.Install */) {
                    const extRecommendations = this.getAllRecommendationsWithReason() || {};
                    const recommendationReason = extRecommendations[e.source.identifier.id.toLowerCase()];
                    if (recommendationReason) {
                        /* __GDPR__
                            "extensionGallery:install:recommendations" : {
                                "owner": "sandy081",
                                "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                                "${include}": [
                                    "${GalleryExtensionTelemetryData}"
                                ]
                            }
                        */
                        this.telemetryService.publicLog('extensionGallery:install:recommendations', { ...e.source.telemetryData, recommendationReason: recommendationReason.reasonId });
                    }
                }
            }
        }
        toExtensionIds(recommendations) {
            const extensionIds = [];
            for (const { extension } of recommendations) {
                if ((0, types_1.isString)(extension) && this.isExtensionAllowedToBeRecommended(extension) && !extensionIds.includes(extension.toLowerCase())) {
                    extensionIds.push(extension.toLowerCase());
                }
            }
            return extensionIds;
        }
        isExtensionAllowedToBeRecommended(extensionId) {
            return !this.extensionRecommendationsManagementService.ignoredRecommendations.includes(extensionId.toLowerCase());
        }
        async promptWorkspaceRecommendations() {
            const installed = await this.extensionsWorkbenchService.queryLocal();
            const allowedRecommendations = [
                ...this.workspaceRecommendations.recommendations,
                ...this.configBasedRecommendations.importantRecommendations.filter(recommendation => !recommendation.whenNotInstalled || recommendation.whenNotInstalled.every(id => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id }))))
            ]
                .map(({ extension }) => extension)
                .filter(extension => !(0, types_1.isString)(extension) || this.isExtensionAllowedToBeRecommended(extension));
            if (allowedRecommendations.length) {
                await this._registerP((0, async_1.timeout)(5000));
                await this.extensionRecommendationNotificationService.promptWorkspaceRecommendations(allowedRecommendations);
            }
        }
        _registerP(o) {
            this._register((0, lifecycle_1.toDisposable)(() => o.cancel()));
            return o;
        }
    };
    exports.ExtensionRecommendationsService = ExtensionRecommendationsService;
    exports.ExtensionRecommendationsService = ExtensionRecommendationsService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, extensionRecommendations_1.IExtensionIgnoredRecommendationsService),
        __param(7, extensionRecommendations_2.IExtensionRecommendationNotificationService),
        __param(8, extensions_1.IExtensionsWorkbenchService),
        __param(9, remoteExtensionsScanner_1.IRemoteExtensionsScannerService),
        __param(10, userDataInit_1.IUserDataInitializationService)
    ], ExtensionRecommendationsService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZXh0ZW5zaW9ucy9icm93c2VyL2V4dGVuc2lvblJlY29tbWVuZGF0aW9uc1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0N6RixJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHNCQUFVO1FBb0I5RCxZQUN3QixvQkFBMkMsRUFDL0MsZ0JBQW9ELEVBQzdDLGNBQXlELEVBQ2hFLGdCQUFvRCxFQUNsRCxrQkFBd0QsRUFDaEQsMEJBQXdFLEVBQzVELHlDQUFtRyxFQUMvRiwwQ0FBd0csRUFDeEgsMEJBQXdFLEVBQ3BFLDhCQUFnRixFQUNqRiw2QkFBOEU7WUFFOUcsS0FBSyxFQUFFLENBQUM7WUFYNEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUM1QixtQkFBYyxHQUFkLGNBQWMsQ0FBMEI7WUFDL0MscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNqQyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQy9CLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDM0MsOENBQXlDLEdBQXpDLHlDQUF5QyxDQUF5QztZQUM5RSwrQ0FBMEMsR0FBMUMsMENBQTBDLENBQTZDO1lBQ3ZHLCtCQUEwQixHQUExQiwwQkFBMEIsQ0FBNkI7WUFDbkQsbUNBQThCLEdBQTlCLDhCQUE4QixDQUFpQztZQUNoRSxrQ0FBNkIsR0FBN0IsNkJBQTZCLENBQWdDO1lBZHZHLGdDQUEyQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQ2pFLCtCQUEwQixHQUFHLElBQUksQ0FBQywyQkFBMkIs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