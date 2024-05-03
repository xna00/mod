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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/language", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/instantiation/common/extensions", "vs/editor/common/services/model", "vs/base/common/worker/simpleWorker", "vs/platform/telemetry/common/telemetry", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/diagnostics/common/diagnostics", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage", "vs/base/common/map", "vs/platform/log/common/log"], function (require, exports, lifecycle_1, languageDetectionWorkerService_1, network_1, environmentService_1, configuration_1, language_1, uri_1, platform_1, extensions_1, model_1, simpleWorker_1, telemetry_1, editorWorkerService_1, languageConfigurationRegistry_1, diagnostics_1, workspace_1, editorService_1, storage_1, map_1, log_1) {
    "use strict";
    var LanguageDetectionService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionWorkerClient = exports.LanguageDetectionWorkerHost = exports.LanguageDetectionService = void 0;
    const TOP_LANG_COUNTS = 12;
    const regexpModuleLocation = `${network_1.nodeModulesPath}/vscode-regexp-languagedetection`;
    const regexpModuleLocationAsar = `${network_1.nodeModulesAsarPath}/vscode-regexp-languagedetection`;
    const moduleLocation = `${network_1.nodeModulesPath}/@vscode/vscode-languagedetection`;
    const moduleLocationAsar = `${network_1.nodeModulesAsarPath}/@vscode/vscode-languagedetection`;
    let LanguageDetectionService = class LanguageDetectionService extends lifecycle_1.Disposable {
        static { LanguageDetectionService_1 = this; }
        static { this.enablementSettingKey = 'workbench.editor.languageDetection'; }
        static { this.historyBasedEnablementConfig = 'workbench.editor.historyBasedLanguageDetection'; }
        static { this.preferHistoryConfig = 'workbench.editor.preferHistoryBasedLanguageDetection'; }
        static { this.workspaceOpenedLanguagesStorageKey = 'workbench.editor.languageDetectionOpenedLanguages.workspace'; }
        static { this.globalOpenedLanguagesStorageKey = 'workbench.editor.languageDetectionOpenedLanguages.global'; }
        constructor(_environmentService, languageService, _configurationService, _diagnosticsService, _workspaceContextService, modelService, _editorService, telemetryService, storageService, _logService, languageConfigurationService) {
            super();
            this._environmentService = _environmentService;
            this._configurationService = _configurationService;
            this._diagnosticsService = _diagnosticsService;
            this._workspaceContextService = _workspaceContextService;
            this._editorService = _editorService;
            this._logService = _logService;
            this.hasResolvedWorkspaceLanguageIds = false;
            this.workspaceLanguageIds = new Set();
            this.sessionOpenedLanguageIds = new Set();
            this.historicalGlobalOpenedLanguageIds = new map_1.LRUCache(TOP_LANG_COUNTS);
            this.historicalWorkspaceOpenedLanguageIds = new map_1.LRUCache(TOP_LANG_COUNTS);
            this.dirtyBiases = true;
            this.langBiases = {};
            this._languageDetectionWorkerClient = this._register(new LanguageDetectionWorkerClient(modelService, languageService, telemetryService, 
            // TODO: See if it's possible to bundle vscode-languagedetection
            this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/dist/lib/index.js`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/dist/lib/index.js`).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/model/model.json`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/model/model.json`).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${moduleLocationAsar}/model/group1-shard1of1.bin`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${moduleLocation}/model/group1-shard1of1.bin`).toString(true), this._environmentService.isBuilt && !platform_1.isWeb
                ? network_1.FileAccess.asBrowserUri(`${regexpModuleLocationAsar}/dist/index.js`).toString(true)
                : network_1.FileAccess.asBrowserUri(`${regexpModuleLocation}/dist/index.js`).toString(true), languageConfigurationService));
            this.initEditorOpenedListeners(storageService);
        }
        async resolveWorkspaceLanguageIds() {
            if (this.hasResolvedWorkspaceLanguageIds) {
                return;
            }
            this.hasResolvedWorkspaceLanguageIds = true;
            const fileExtensions = await this._diagnosticsService.getWorkspaceFileExtensions(this._workspaceContextService.getWorkspace());
            let count = 0;
            for (const ext of fileExtensions.extensions) {
                const langId = this._languageDetectionWorkerClient.getLanguageId(ext);
                if (langId && count < TOP_LANG_COUNTS) {
                    this.workspaceLanguageIds.add(langId);
                    count++;
                    if (count > TOP_LANG_COUNTS) {
                        break;
                    }
                }
            }
            this.dirtyBiases = true;
        }
        isEnabledForLanguage(languageId) {
            return !!languageId && this._configurationService.getValue(LanguageDetectionService_1.enablementSettingKey, { overrideIdentifier: languageId });
        }
        getLanguageBiases() {
            if (!this.dirtyBiases) {
                return this.langBiases;
            }
            const biases = {};
            // Give different weight to the biases depending on relevance of source
            this.sessionOpenedLanguageIds.forEach(lang => biases[lang] = (biases[lang] ?? 0) + 7);
            this.workspaceLanguageIds.forEach(lang => biases[lang] = (biases[lang] ?? 0) + 5);
            [...this.historicalWorkspaceOpenedLanguageIds.keys()].forEach(lang => biases[lang] = (biases[lang] ?? 0) + 3);
            [...this.historicalGlobalOpenedLanguageIds.keys()].forEach(lang => biases[lang] = (biases[lang] ?? 0) + 1);
            this._logService.trace('Session Languages:', JSON.stringify([...this.sessionOpenedLanguageIds]));
            this._logService.trace('Workspace Languages:', JSON.stringify([...this.workspaceLanguageIds]));
            this._logService.trace('Historical Workspace Opened Languages:', JSON.stringify([...this.historicalWorkspaceOpenedLanguageIds.keys()]));
            this._logService.trace('Historical Globally Opened Languages:', JSON.stringify([...this.historicalGlobalOpenedLanguageIds.keys()]));
            this._logService.trace('Computed Language Detection Biases:', JSON.stringify(biases));
            this.dirtyBiases = false;
            this.langBiases = biases;
            return biases;
        }
        async detectLanguage(resource, supportedLangs) {
            const useHistory = this._configurationService.getValue(LanguageDetectionService_1.historyBasedEnablementConfig);
            const preferHistory = this._configurationService.getValue(LanguageDetectionService_1.preferHistoryConfig);
            if (useHistory) {
                await this.resolveWorkspaceLanguageIds();
            }
            const biases = useHistory ? this.getLanguageBiases() : undefined;
            return this._languageDetectionWorkerClient.detectLanguage(resource, biases, preferHistory, supportedLangs);
        }
        // TODO: explore using the history service or something similar to provide this list of opened editors
        // so this service can support delayed instantiation. This may be tricky since it seems the IHistoryService
        // only gives history for a workspace... where this takes advantage of history at a global level as well.
        initEditorOpenedListeners(storageService) {
            try {
                const globalLangHistoryData = JSON.parse(storageService.get(LanguageDetectionService_1.globalOpenedLanguagesStorageKey, 0 /* StorageScope.PROFILE */, '[]'));
                this.historicalGlobalOpenedLanguageIds.fromJSON(globalLangHistoryData);
            }
            catch (e) {
                console.error(e);
            }
            try {
                const workspaceLangHistoryData = JSON.parse(storageService.get(LanguageDetectionService_1.workspaceOpenedLanguagesStorageKey, 1 /* StorageScope.WORKSPACE */, '[]'));
                this.historicalWorkspaceOpenedLanguageIds.fromJSON(workspaceLangHistoryData);
            }
            catch (e) {
                console.error(e);
            }
            this._register(this._editorService.onDidActiveEditorChange(() => {
                const activeLanguage = this._editorService.activeTextEditorLanguageId;
                if (activeLanguage && this._editorService.activeEditor?.resource?.scheme !== network_1.Schemas.untitled) {
                    this.sessionOpenedLanguageIds.add(activeLanguage);
                    this.historicalGlobalOpenedLanguageIds.set(activeLanguage, true);
                    this.historicalWorkspaceOpenedLanguageIds.set(activeLanguage, true);
                    storageService.store(LanguageDetectionService_1.globalOpenedLanguagesStorageKey, JSON.stringify(this.historicalGlobalOpenedLanguageIds.toJSON()), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                    storageService.store(LanguageDetectionService_1.workspaceOpenedLanguagesStorageKey, JSON.stringify(this.historicalWorkspaceOpenedLanguageIds.toJSON()), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    this.dirtyBiases = true;
                }
            }));
        }
    };
    exports.LanguageDetectionService = LanguageDetectionService;
    exports.LanguageDetectionService = LanguageDetectionService = LanguageDetectionService_1 = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, language_1.ILanguageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, diagnostics_1.IDiagnosticsService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, model_1.IModelService),
        __param(6, editorService_1.IEditorService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, storage_1.IStorageService),
        __param(9, log_1.ILogService),
        __param(10, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], LanguageDetectionService);
    class LanguageDetectionWorkerHost {
        constructor(_indexJsUri, _modelJsonUri, _weightsUri, _telemetryService) {
            this._indexJsUri = _indexJsUri;
            this._modelJsonUri = _modelJsonUri;
            this._weightsUri = _weightsUri;
            this._telemetryService = _telemetryService;
        }
        async getIndexJsUri() {
            return this._indexJsUri;
        }
        async getModelJsonUri() {
            return this._modelJsonUri;
        }
        async getWeightsUri() {
            return this._weightsUri;
        }
        async sendTelemetryEvent(languages, confidences, timeSpent) {
            this._telemetryService.publicLog2('automaticlanguagedetection.stats', {
                languages: languages.join(','),
                confidences: confidences.join(','),
                timeSpent
            });
        }
    }
    exports.LanguageDetectionWorkerHost = LanguageDetectionWorkerHost;
    class LanguageDetectionWorkerClient extends editorWorkerService_1.EditorWorkerClient {
        constructor(modelService, _languageService, _telemetryService, _indexJsUri, _modelJsonUri, _weightsUri, _regexpModelUri, languageConfigurationService) {
            super(modelService, true, 'languageDetectionWorkerService', languageConfigurationService);
            this._languageService = _languageService;
            this._telemetryService = _telemetryService;
            this._indexJsUri = _indexJsUri;
            this._modelJsonUri = _modelJsonUri;
            this._weightsUri = _weightsUri;
            this._regexpModelUri = _regexpModelUri;
        }
        _getOrCreateLanguageDetectionWorker() {
            if (this.workerPromise) {
                return this.workerPromise;
            }
            this.workerPromise = new Promise((resolve, reject) => {
                resolve(this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/services/languageDetection/browser/languageDetectionSimpleWorker', new editorWorkerService_1.EditorWorkerHost(this))));
            });
            return this.workerPromise;
        }
        _guessLanguageIdByUri(uri) {
            const guess = this._languageService.guessLanguageIdByFilepathOrFirstLine(uri);
            if (guess && guess !== 'unknown') {
                return guess;
            }
            return undefined;
        }
        async _getProxy() {
            return (await this._getOrCreateLanguageDetectionWorker()).getProxyObject();
        }
        // foreign host request
        async fhr(method, args) {
            switch (method) {
                case 'getIndexJsUri':
                    return this.getIndexJsUri();
                case 'getModelJsonUri':
                    return this.getModelJsonUri();
                case 'getWeightsUri':
                    return this.getWeightsUri();
                case 'getRegexpModelUri':
                    return this.getRegexpModelUri();
                case 'getLanguageId':
                    return this.getLanguageId(args[0]);
                case 'sendTelemetryEvent':
                    return this.sendTelemetryEvent(args[0], args[1], args[2]);
                default:
                    return super.fhr(method, args);
            }
        }
        async getIndexJsUri() {
            return this._indexJsUri;
        }
        getLanguageId(languageIdOrExt) {
            if (!languageIdOrExt) {
                return undefined;
            }
            if (this._languageService.isRegisteredLanguageId(languageIdOrExt)) {
                return languageIdOrExt;
            }
            const guessed = this._guessLanguageIdByUri(uri_1.URI.file(`file.${languageIdOrExt}`));
            if (!guessed || guessed === 'unknown') {
                return undefined;
            }
            return guessed;
        }
        async getModelJsonUri() {
            return this._modelJsonUri;
        }
        async getWeightsUri() {
            return this._weightsUri;
        }
        async getRegexpModelUri() {
            return this._regexpModelUri;
        }
        async sendTelemetryEvent(languages, confidences, timeSpent) {
            this._telemetryService.publicLog2(languageDetectionWorkerService_1.LanguageDetectionStatsId, {
                languages: languages.join(','),
                confidences: confidences.join(','),
                timeSpent
            });
        }
        async detectLanguage(resource, langBiases, preferHistory, supportedLangs) {
            const startTime = Date.now();
            const quickGuess = this._guessLanguageIdByUri(resource);
            if (quickGuess) {
                return quickGuess;
            }
            await this._withSyncedResources([resource]);
            const modelId = await (await this._getProxy()).detectLanguage(resource.toString(), langBiases, preferHistory, supportedLangs);
            const languageId = this.getLanguageId(modelId);
            const LanguageDetectionStatsId = 'automaticlanguagedetection.perf';
            this._telemetryService.publicLog2(LanguageDetectionStatsId, {
                timeSpent: Date.now() - startTime,
                detection: languageId || 'unknown',
            });
            return languageId;
        }
    }
    exports.LanguageDetectionWorkerClient = LanguageDetectionWorkerClient;
    // For now we use Eager until we handle keeping track of history better.
    (0, extensions_1.registerSingleton)(languageDetectionWorkerService_1.ILanguageDetectionService, LanguageDetectionService, 0 /* InstantiationType.Eager */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFuZ3VhZ2VEZXRlY3Rpb25Xb3JrZXJTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL2xhbmd1YWdlRGV0ZWN0aW9uL2Jyb3dzZXIvbGFuZ3VhZ2VEZXRlY3Rpb25Xb3JrZXJTZXJ2aWNlSW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBd0JoRyxNQUFNLGVBQWUsR0FBRyxFQUFFLENBQUM7SUFFM0IsTUFBTSxvQkFBb0IsR0FBb0IsR0FBRyx5QkFBZSxrQ0FBa0MsQ0FBQztJQUNuRyxNQUFNLHdCQUF3QixHQUFvQixHQUFHLDZCQUFtQixrQ0FBa0MsQ0FBQztJQUMzRyxNQUFNLGNBQWMsR0FBb0IsR0FBRyx5QkFBZSxtQ0FBbUMsQ0FBQztJQUM5RixNQUFNLGtCQUFrQixHQUFvQixHQUFHLDZCQUFtQixtQ0FBbUMsQ0FBQztJQUUvRixJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVOztpQkFDdkMseUJBQW9CLEdBQUcsb0NBQW9DLEFBQXZDLENBQXdDO2lCQUM1RCxpQ0FBNEIsR0FBRyxnREFBZ0QsQUFBbkQsQ0FBb0Q7aUJBQ2hGLHdCQUFtQixHQUFHLHNEQUFzRCxBQUF6RCxDQUEwRDtpQkFDN0UsdUNBQWtDLEdBQUcsNkRBQTZELEFBQWhFLENBQWlFO2lCQUNuRyxvQ0FBK0IsR0FBRywwREFBMEQsQUFBN0QsQ0FBOEQ7UUFjN0csWUFDK0IsbUJBQWtFLEVBQzlFLGVBQWlDLEVBQzVCLHFCQUE2RCxFQUMvRCxtQkFBeUQsRUFDcEQsd0JBQW1FLEVBQzlFLFlBQTJCLEVBQzFCLGNBQStDLEVBQzVDLGdCQUFtQyxFQUNyQyxjQUErQixFQUNuQyxXQUF5QyxFQUN2Qiw0QkFBMkQ7WUFFMUYsS0FBSyxFQUFFLENBQUM7WUFadUMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUE4QjtZQUV4RCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzlDLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFDbkMsNkJBQXdCLEdBQXhCLHdCQUF3QixDQUEwQjtZQUU1RCxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFHakMsZ0JBQVcsR0FBWCxXQUFXLENBQWE7WUFsQi9DLG9DQUErQixHQUFHLEtBQUssQ0FBQztZQUN4Qyx5QkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBQ3pDLDZCQUF3QixHQUFHLElBQUksR0FBRyxFQUFVLENBQUM7WUFDN0Msc0NBQWlDLEdBQUcsSUFBSSxjQUFRLENBQWUsZUFBZSxDQUFDLENBQUM7WUFDaEYseUNBQW9DLEdBQUcsSUFBSSxjQUFRLENBQWUsZUFBZSxDQUFDLENBQUM7WUFDbkYsZ0JBQVcsR0FBWSxJQUFJLENBQUM7WUFDNUIsZUFBVSxHQUEyQixFQUFFLENBQUM7WUFpQi9DLElBQUksQ0FBQyw4QkFBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksNkJBQTZCLENBQ3JGLFlBQVksRUFDWixlQUFlLEVBQ2YsZ0JBQWdCO1lBQ2hCLGdFQUFnRTtZQUNoRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxJQUFJLENBQUMsZ0JBQUs7Z0JBQ3pDLENBQUMsQ0FBQyxvQkFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLGtCQUFrQixvQkFBb0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ25GLENBQUMsQ0FBQyxvQkFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLGNBQWMsb0JBQW9CLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQ2hGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLElBQUksQ0FBQyxnQkFBSztnQkFDekMsQ0FBQyxDQUFDLG9CQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsa0JBQWtCLG1CQUFtQixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDbEYsQ0FBQyxDQUFDLG9CQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsY0FBYyxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDL0UsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sSUFBSSxDQUFDLGdCQUFLO2dCQUN6QyxDQUFDLENBQUMsb0JBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxrQkFBa0IsNkJBQTZCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO2dCQUM1RixDQUFDLENBQUMsb0JBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxjQUFjLDZCQUE2QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUN6RixJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxJQUFJLENBQUMsZ0JBQUs7Z0JBQ3pDLENBQUMsQ0FBQyxvQkFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLHdCQUF3QixnQkFBZ0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7Z0JBQ3JGLENBQUMsQ0FBQyxvQkFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLG9CQUFvQixnQkFBZ0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDbEYsNEJBQTRCLENBQzVCLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBRU8sS0FBSyxDQUFDLDJCQUEyQjtZQUN4QyxJQUFJLElBQUksQ0FBQywrQkFBK0IsRUFBRSxDQUFDO2dCQUFDLE9BQU87WUFBQyxDQUFDO1lBQ3JELElBQUksQ0FBQywrQkFBK0IsR0FBRyxJQUFJLENBQUM7WUFDNUMsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsMEJBQTBCLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7WUFFL0gsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsS0FBSyxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3RFLElBQUksTUFBTSxJQUFJLEtBQUssR0FBRyxlQUFlLEVBQUUsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDdEMsS0FBSyxFQUFFLENBQUM7b0JBQ1IsSUFBSSxLQUFLLEdBQUcsZUFBZSxFQUFFLENBQUM7d0JBQUMsTUFBTTtvQkFBQyxDQUFDO2dCQUN4QyxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLENBQUM7UUFFTSxvQkFBb0IsQ0FBQyxVQUFrQjtZQUM3QyxPQUFPLENBQUMsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBVSwwQkFBd0IsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDeEosQ0FBQztRQUdPLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUFDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUFDLENBQUM7WUFFbEQsTUFBTSxNQUFNLEdBQTJCLEVBQUUsQ0FBQztZQUUxQyx1RUFBdUU7WUFDdkUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFekMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUN4QyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFekMsQ0FBQyxHQUFHLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNwRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFekMsQ0FBQyxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNqRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFFekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pHLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvRixJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsb0NBQW9DLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsdUNBQXVDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN0RixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztZQUN6QixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQWEsRUFBRSxjQUF5QjtZQUM1RCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxDQUFXLDBCQUF3QixDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDeEgsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBVSwwQkFBd0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pILElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFDMUMsQ0FBQztZQUNELE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUNqRSxPQUFPLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDNUcsQ0FBQztRQUVELHNHQUFzRztRQUN0RywyR0FBMkc7UUFDM0cseUdBQXlHO1FBQ2pHLHlCQUF5QixDQUFDLGNBQStCO1lBQ2hFLElBQUksQ0FBQztnQkFDSixNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQywwQkFBd0IsQ0FBQywrQkFBK0IsZ0NBQXdCLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ25KLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUN4RSxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQztZQUVqQyxJQUFJLENBQUM7Z0JBQ0osTUFBTSx3QkFBd0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsMEJBQXdCLENBQUMsa0NBQWtDLGtDQUEwQixJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMzSixJQUFJLENBQUMsb0NBQW9DLENBQUMsUUFBUSxDQUFDLHdCQUF3QixDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUM7WUFFakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtnQkFDL0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQztnQkFDdEUsSUFBSSxjQUFjLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUMvRixJQUFJLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUNsRCxJQUFJLENBQUMsaUNBQWlDLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztvQkFDakUsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQ3BFLGNBQWMsQ0FBQyxLQUFLLENBQUMsMEJBQXdCLENBQUMsK0JBQStCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsTUFBTSxFQUFFLENBQUMsOERBQThDLENBQUM7b0JBQzdMLGNBQWMsQ0FBQyxLQUFLLENBQUMsMEJBQXdCLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsb0NBQW9DLENBQUMsTUFBTSxFQUFFLENBQUMsZ0VBQWdELENBQUM7b0JBQ3JNLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixDQUFDO1lBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7O0lBOUlXLDREQUF3Qjt1Q0FBeEIsd0JBQXdCO1FBb0JsQyxXQUFBLGlEQUE0QixDQUFBO1FBQzVCLFdBQUEsMkJBQWdCLENBQUE7UUFDaEIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLGlDQUFtQixDQUFBO1FBQ25CLFdBQUEsb0NBQXdCLENBQUE7UUFDeEIsV0FBQSxxQkFBYSxDQUFBO1FBQ2IsV0FBQSw4QkFBYyxDQUFBO1FBQ2QsV0FBQSw2QkFBaUIsQ0FBQTtRQUNqQixXQUFBLHlCQUFlLENBQUE7UUFDZixXQUFBLGlCQUFXLENBQUE7UUFDWCxZQUFBLDZEQUE2QixDQUFBO09BOUJuQix3QkFBd0IsQ0ErSXBDO0lBT0QsTUFBYSwyQkFBMkI7UUFDdkMsWUFDUyxXQUFtQixFQUNuQixhQUFxQixFQUNyQixXQUFtQixFQUNuQixpQkFBb0M7WUFIcEMsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDckIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7WUFDbkIsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFtQjtRQUU3QyxDQUFDO1FBRUQsS0FBSyxDQUFDLGFBQWE7WUFDbEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZTtZQUNwQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFNBQW1CLEVBQUUsV0FBcUIsRUFBRSxTQUFpQjtZQVVyRixJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUErRCxrQ0FBa0MsRUFBRTtnQkFDbkksU0FBUyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUM5QixXQUFXLEVBQUUsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ2xDLFNBQVM7YUFDVCxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0Q7SUFyQ0Qsa0VBcUNDO0lBRUQsTUFBYSw2QkFBOEIsU0FBUSx3Q0FBa0I7UUFHcEUsWUFDQyxZQUEyQixFQUNWLGdCQUFrQyxFQUNsQyxpQkFBb0MsRUFDcEMsV0FBbUIsRUFDbkIsYUFBcUIsRUFDckIsV0FBbUIsRUFDbkIsZUFBdUIsRUFDeEMsNEJBQTJEO1lBRTNELEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLGdDQUFnQyxFQUFFLDRCQUE0QixDQUFDLENBQUM7WUFSekUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFrQjtZQUNsQyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ3BDLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1lBQ3JCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLG9CQUFlLEdBQWYsZUFBZSxDQUFRO1FBSXpDLENBQUM7UUFFTyxtQ0FBbUM7WUFDMUMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUMzQixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDcEQsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxpQ0FBa0IsQ0FDNUMsSUFBSSxDQUFDLGNBQWMsRUFDbkIsK0VBQStFLEVBQy9FLElBQUksc0NBQWdCLENBQUMsSUFBSSxDQUFDLENBQzFCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVPLHFCQUFxQixDQUFDLEdBQVE7WUFDckMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlFLElBQUksS0FBSyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztRQUVrQixLQUFLLENBQUMsU0FBUztZQUNqQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsbUNBQW1DLEVBQUUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQzVFLENBQUM7UUFFRCx1QkFBdUI7UUFDUCxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQWMsRUFBRSxJQUFXO1lBQ3BELFFBQVEsTUFBTSxFQUFFLENBQUM7Z0JBQ2hCLEtBQUssZUFBZTtvQkFDbkIsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzdCLEtBQUssaUJBQWlCO29CQUNyQixPQUFPLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDL0IsS0FBSyxlQUFlO29CQUNuQixPQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFDN0IsS0FBSyxtQkFBbUI7b0JBQ3ZCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQ2pDLEtBQUssZUFBZTtvQkFDbkIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxLQUFLLG9CQUFvQjtvQkFDeEIsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0Q7b0JBQ0MsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqQyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsYUFBYSxDQUFDLGVBQW1DO1lBQ2hELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLE9BQU8sZUFBZSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsU0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsT0FBTyxJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdkMsT0FBTyxTQUFTLENBQUM7WUFDbEIsQ0FBQztZQUNELE9BQU8sT0FBTyxDQUFDO1FBQ2hCLENBQUM7UUFFRCxLQUFLLENBQUMsZUFBZTtZQUNwQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELEtBQUssQ0FBQyxhQUFhO1lBQ2xCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUN6QixDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQjtZQUN0QixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxTQUFtQixFQUFFLFdBQXFCLEVBQUUsU0FBaUI7WUFDckYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBZ0UseURBQXdCLEVBQUU7Z0JBQzFILFNBQVMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztnQkFDOUIsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUNsQyxTQUFTO2FBQ1QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVNLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBYSxFQUFFLFVBQThDLEVBQUUsYUFBc0IsRUFBRSxjQUF5QjtZQUMzSSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3hELElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sVUFBVSxDQUFDO1lBQ25CLENBQUM7WUFFRCxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlILE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFL0MsTUFBTSx3QkFBd0IsR0FBRyxpQ0FBaUMsQ0FBQztZQWNuRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUE4RCx3QkFBd0IsRUFBRTtnQkFDeEgsU0FBUyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTO2dCQUNqQyxTQUFTLEVBQUUsVUFBVSxJQUFJLFNBQVM7YUFDbEMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxVQUFVLENBQUM7UUFDbkIsQ0FBQztLQUNEO0lBdElELHNFQXNJQztJQUVELHdFQUF3RTtJQUN4RSxJQUFBLDhCQUFpQixFQUFDLDBEQUF5QixFQUFFLHdCQUF3QixrQ0FBMEIsQ0FBQyJ9