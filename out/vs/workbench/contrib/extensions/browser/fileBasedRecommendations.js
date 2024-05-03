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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/common/extensions", "vs/nls", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/glob", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/platform/workspace/common/workspace", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/types", "vs/editor/common/languages/modesRegistry"], function (require, exports, extensionRecommendations_1, extensionRecommendations_2, extensions_1, nls_1, storage_1, productService_1, network_1, resources_1, glob_1, model_1, language_1, extensionRecommendations_3, arrays_1, lifecycle_1, notebookCommon_1, async_1, workspace_1, extensionManagementUtil_1, types_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileBasedRecommendations = void 0;
    const promptedRecommendationsStorageKey = 'fileBasedRecommendations/promptedRecommendations';
    const recommendationsStorageKey = 'extensionsAssistant/recommendations';
    const milliSecondsInADay = 1000 * 60 * 60 * 24;
    let FileBasedRecommendations = class FileBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        get recommendations() {
            const recommendations = [];
            [...this.fileBasedRecommendations.keys()]
                .sort((a, b) => {
                if (this.fileBasedRecommendations.get(a).recommendedTime === this.fileBasedRecommendations.get(b).recommendedTime) {
                    if (this.fileBasedImportantRecommendations.has(a)) {
                        return -1;
                    }
                    if (this.fileBasedImportantRecommendations.has(b)) {
                        return 1;
                    }
                }
                return this.fileBasedRecommendations.get(a).recommendedTime > this.fileBasedRecommendations.get(b).recommendedTime ? -1 : 1;
            })
                .forEach(extensionId => {
                recommendations.push({
                    extension: extensionId,
                    reason: {
                        reasonId: 1 /* ExtensionRecommendationReason.File */,
                        reasonText: (0, nls_1.localize)('fileBasedRecommendation', "This extension is recommended based on the files you recently opened.")
                    }
                });
            });
            return recommendations;
        }
        get importantRecommendations() {
            return this.recommendations.filter(e => this.fileBasedImportantRecommendations.has(e.extension));
        }
        get otherRecommendations() {
            return this.recommendations.filter(e => !this.fileBasedImportantRecommendations.has(e.extension));
        }
        constructor(extensionsWorkbenchService, modelService, languageService, productService, storageService, extensionRecommendationNotificationService, extensionIgnoredRecommendationsService, workspaceContextService) {
            super();
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.storageService = storageService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this.workspaceContextService = workspaceContextService;
            this.recommendationsByPattern = new Map();
            this.fileBasedRecommendations = new Map();
            this.fileBasedImportantRecommendations = new Set();
            this.fileOpenRecommendations = {};
            if (productService.extensionRecommendations) {
                for (const [extensionId, recommendation] of Object.entries(productService.extensionRecommendations)) {
                    if (recommendation.onFileOpen) {
                        this.fileOpenRecommendations[extensionId.toLowerCase()] = recommendation.onFileOpen;
                    }
                }
            }
        }
        async doActivate() {
            if ((0, types_1.isEmptyObject)(this.fileOpenRecommendations)) {
                return;
            }
            await this.extensionsWorkbenchService.whenInitialized;
            const cachedRecommendations = this.getCachedRecommendations();
            const now = Date.now();
            // Retire existing recommendations if they are older than a week or are not part of this.productService.extensionTips anymore
            Object.entries(cachedRecommendations).forEach(([key, value]) => {
                const diff = (now - value) / milliSecondsInADay;
                if (diff <= 7 && this.fileOpenRecommendations[key]) {
                    this.fileBasedRecommendations.set(key.toLowerCase(), { recommendedTime: value });
                }
            });
            this._register(this.modelService.onModelAdded(model => this.onModelAdded(model)));
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
        }
        onModelAdded(model) {
            const uri = model.uri.scheme === network_1.Schemas.vscodeNotebookCell ? notebookCommon_1.CellUri.parse(model.uri)?.notebook : model.uri;
            if (!uri) {
                return;
            }
            const supportedSchemes = (0, arrays_1.distinct)([network_1.Schemas.untitled, network_1.Schemas.file, network_1.Schemas.vscodeRemote, ...this.workspaceContextService.getWorkspace().folders.map(folder => folder.uri.scheme)]);
            if (!uri || !supportedSchemes.includes(uri.scheme)) {
                return;
            }
            // re-schedule this bit of the operation to be off the critical path - in case glob-match is slow
            (0, async_1.disposableTimeout)(() => this.promptImportantRecommendations(uri, model), 0, this._store);
        }
        /**
         * Prompt the user to either install the recommended extension for the file type in the current editor model
         * or prompt to search the marketplace if it has extensions that can support the file type
         */
        promptImportantRecommendations(uri, model, extensionRecommendations) {
            if (model.isDisposed()) {
                return;
            }
            const pattern = (0, resources_1.extname)(uri).toLowerCase();
            extensionRecommendations = extensionRecommendations ?? this.recommendationsByPattern.get(pattern) ?? this.fileOpenRecommendations;
            const extensionRecommendationEntries = Object.entries(extensionRecommendations);
            if (extensionRecommendationEntries.length === 0) {
                return;
            }
            const processedPathGlobs = new Map();
            const installed = this.extensionsWorkbenchService.local;
            const recommendationsByPattern = {};
            const matchedRecommendations = {};
            const unmatchedRecommendations = {};
            let listenOnLanguageChange = false;
            const languageId = model.getLanguageId();
            for (const [extensionId, conditions] of extensionRecommendationEntries) {
                const conditionsByPattern = [];
                const matchedConditions = [];
                const unmatchedConditions = [];
                for (const condition of conditions) {
                    let languageMatched = false;
                    let pathGlobMatched = false;
                    const isLanguageCondition = !!condition.languages;
                    const isFileContentCondition = !!condition.contentPattern;
                    if (isLanguageCondition || isFileContentCondition) {
                        conditionsByPattern.push(condition);
                    }
                    if (isLanguageCondition) {
                        if (condition.languages.includes(languageId)) {
                            languageMatched = true;
                        }
                    }
                    if (condition.pathGlob) {
                        const pathGlob = condition.pathGlob;
                        if (processedPathGlobs.get(pathGlob) ?? (0, glob_1.match)(condition.pathGlob, uri.with({ fragment: '' }).toString())) {
                            pathGlobMatched = true;
                        }
                        processedPathGlobs.set(pathGlob, pathGlobMatched);
                    }
                    let matched = languageMatched || pathGlobMatched;
                    // If the resource has pattern (extension) and not matched, then we don't need to check the other conditions
                    if (pattern && !matched) {
                        continue;
                    }
                    if (matched && condition.whenInstalled) {
                        if (!condition.whenInstalled.every(id => installed.some(local => (0, extensionManagementUtil_1.areSameExtensions)({ id }, local.identifier)))) {
                            matched = false;
                        }
                    }
                    if (matched && condition.whenNotInstalled) {
                        if (installed.some(local => condition.whenNotInstalled?.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, local.identifier)))) {
                            matched = false;
                        }
                    }
                    if (matched && isFileContentCondition) {
                        if (!model.findMatches(condition.contentPattern, false, true, false, null, false).length) {
                            matched = false;
                        }
                    }
                    if (matched) {
                        matchedConditions.push(condition);
                        conditionsByPattern.pop();
                    }
                    else {
                        if (isLanguageCondition || isFileContentCondition) {
                            unmatchedConditions.push(condition);
                            if (isLanguageCondition) {
                                listenOnLanguageChange = true;
                            }
                        }
                    }
                }
                if (matchedConditions.length) {
                    matchedRecommendations[extensionId] = matchedConditions;
                }
                if (unmatchedConditions.length) {
                    unmatchedRecommendations[extensionId] = unmatchedConditions;
                }
                if (conditionsByPattern.length) {
                    recommendationsByPattern[extensionId] = conditionsByPattern;
                }
            }
            if (pattern) {
                this.recommendationsByPattern.set(pattern, recommendationsByPattern);
            }
            if (Object.keys(unmatchedRecommendations).length) {
                if (listenOnLanguageChange) {
                    const disposables = new lifecycle_1.DisposableStore();
                    disposables.add(model.onDidChangeLanguage(() => {
                        // re-schedule this bit of the operation to be off the critical path - in case glob-match is slow
                        (0, async_1.disposableTimeout)(() => {
                            if (!disposables.isDisposed) {
                                this.promptImportantRecommendations(uri, model, unmatchedRecommendations);
                                disposables.dispose();
                            }
                        }, 0, disposables);
                    }));
                    disposables.add(model.onWillDispose(() => disposables.dispose()));
                }
            }
            if (Object.keys(matchedRecommendations).length) {
                this.promptFromRecommendations(uri, model, matchedRecommendations);
            }
        }
        promptFromRecommendations(uri, model, extensionRecommendations) {
            let isImportantRecommendationForLanguage = false;
            const importantRecommendations = new Set();
            const fileBasedRecommendations = new Set();
            for (const [extensionId, conditions] of Object.entries(extensionRecommendations)) {
                for (const condition of conditions) {
                    fileBasedRecommendations.add(extensionId);
                    if (condition.important) {
                        importantRecommendations.add(extensionId);
                        this.fileBasedImportantRecommendations.add(extensionId);
                    }
                    if (condition.languages) {
                        isImportantRecommendationForLanguage = true;
                    }
                }
            }
            // Update file based recommendations
            for (const recommendation of fileBasedRecommendations) {
                const filedBasedRecommendation = this.fileBasedRecommendations.get(recommendation) || { recommendedTime: Date.now(), sources: [] };
                filedBasedRecommendation.recommendedTime = Date.now();
                this.fileBasedRecommendations.set(recommendation, filedBasedRecommendation);
            }
            this.storeCachedRecommendations();
            if (this.extensionRecommendationNotificationService.hasToIgnoreRecommendationNotifications()) {
                return;
            }
            const language = model.getLanguageId();
            const languageName = this.languageService.getLanguageName(language);
            if (importantRecommendations.size &&
                this.promptRecommendedExtensionForFileType(languageName && isImportantRecommendationForLanguage && language !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID ? (0, nls_1.localize)('languageName', "the {0} language", languageName) : (0, resources_1.basename)(uri), language, [...importantRecommendations])) {
                return;
            }
        }
        promptRecommendedExtensionForFileType(name, language, recommendations) {
            recommendations = this.filterIgnoredOrNotAllowed(recommendations);
            if (recommendations.length === 0) {
                return false;
            }
            recommendations = this.filterInstalled(recommendations, this.extensionsWorkbenchService.local)
                .filter(extensionId => this.fileBasedImportantRecommendations.has(extensionId));
            const promptedRecommendations = language !== modesRegistry_1.PLAINTEXT_LANGUAGE_ID ? this.getPromptedRecommendations()[language] : undefined;
            if (promptedRecommendations) {
                recommendations = recommendations.filter(extensionId => promptedRecommendations.includes(extensionId));
            }
            if (recommendations.length === 0) {
                return false;
            }
            this.promptImportantExtensionsInstallNotification(recommendations, name, language);
            return true;
        }
        async promptImportantExtensionsInstallNotification(extensions, name, language) {
            try {
                const result = await this.extensionRecommendationNotificationService.promptImportantExtensionsInstallNotification({ extensions, name, source: 1 /* RecommendationSource.FILE */ });
                if (result === "reacted" /* RecommendationsNotificationResult.Accepted */) {
                    this.addToPromptedRecommendations(language, extensions);
                }
            }
            catch (error) { /* Ignore */ }
        }
        getPromptedRecommendations() {
            return JSON.parse(this.storageService.get(promptedRecommendationsStorageKey, 0 /* StorageScope.PROFILE */, '{}'));
        }
        addToPromptedRecommendations(language, extensions) {
            const promptedRecommendations = this.getPromptedRecommendations();
            promptedRecommendations[language] = (0, arrays_1.distinct)([...(promptedRecommendations[language] ?? []), ...extensions]);
            this.storageService.store(promptedRecommendationsStorageKey, JSON.stringify(promptedRecommendations), 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */);
        }
        filterIgnoredOrNotAllowed(recommendationsToSuggest) {
            const ignoredRecommendations = [...this.extensionIgnoredRecommendationsService.ignoredRecommendations, ...this.extensionRecommendationNotificationService.ignoredRecommendations];
            return recommendationsToSuggest.filter(id => !ignoredRecommendations.includes(id));
        }
        filterInstalled(recommendationsToSuggest, installed) {
            const installedExtensionsIds = installed.reduce((result, i) => {
                if (i.enablementState !== 1 /* EnablementState.DisabledByExtensionKind */) {
                    result.add(i.identifier.id.toLowerCase());
                }
                return result;
            }, new Set());
            return recommendationsToSuggest.filter(id => !installedExtensionsIds.has(id.toLowerCase()));
        }
        getCachedRecommendations() {
            let storedRecommendations = JSON.parse(this.storageService.get(recommendationsStorageKey, 0 /* StorageScope.PROFILE */, '[]'));
            if (Array.isArray(storedRecommendations)) {
                storedRecommendations = storedRecommendations.reduce((result, id) => { result[id] = Date.now(); return result; }, {});
            }
            const result = {};
            Object.entries(storedRecommendations).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    result[key.toLowerCase()] = value;
                }
            });
            return result;
        }
        storeCachedRecommendations() {
            const storedRecommendations = {};
            this.fileBasedRecommendations.forEach((value, key) => storedRecommendations[key] = value.recommendedTime);
            this.storageService.store(recommendationsStorageKey, JSON.stringify(storedRecommendations), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
        }
    };
    exports.FileBasedRecommendations = FileBasedRecommendations;
    exports.FileBasedRecommendations = FileBasedRecommendations = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, productService_1.IProductService),
        __param(4, storage_1.IStorageService),
        __param(5, extensionRecommendations_3.IExtensionRecommendationNotificationService),
        __param(6, extensionRecommendations_2.IExtensionIgnoredRecommendationsService),
        __param(7, workspace_1.IWorkspaceContextService)
    ], FileBasedRecommendations);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUJhc2VkUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9leHRlbnNpb25zL2Jyb3dzZXIvZmlsZUJhc2VkUmVjb21tZW5kYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRCaEcsTUFBTSxpQ0FBaUMsR0FBRyxrREFBa0QsQ0FBQztJQUM3RixNQUFNLHlCQUF5QixHQUFHLHFDQUFxQyxDQUFDO0lBQ3hFLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBRXhDLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsbURBQXdCO1FBT3JFLElBQUksZUFBZTtZQUNsQixNQUFNLGVBQWUsR0FBcUMsRUFBRSxDQUFDO1lBQzdELENBQUMsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLENBQUM7aUJBQ3ZDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDZCxJQUFJLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUMsZUFBZSxLQUFLLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFFLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ3JILElBQUksSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO3dCQUNuRCxPQUFPLENBQUMsQ0FBQyxDQUFDO29CQUNYLENBQUM7b0JBQ0QsSUFBSSxJQUFJLENBQUMsaUNBQWlDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7d0JBQ25ELE9BQU8sQ0FBQyxDQUFD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