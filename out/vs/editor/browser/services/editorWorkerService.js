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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/worker/simpleWorker", "vs/base/browser/defaultWorkerFactory", "vs/editor/common/core/range", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/editorSimpleWorker", "vs/editor/common/services/model", "vs/editor/common/services/textResourceConfiguration", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/stopwatch", "vs/base/common/errors", "vs/editor/common/services/languageFeatures", "vs/editor/common/diff/linesDiffComputer", "vs/editor/common/diff/rangeMapping", "vs/editor/common/core/lineRange", "vs/base/browser/window", "vs/base/browser/dom"], function (require, exports, async_1, lifecycle_1, simpleWorker_1, defaultWorkerFactory_1, range_1, languageConfigurationRegistry_1, editorSimpleWorker_1, model_1, textResourceConfiguration_1, arrays_1, log_1, stopwatch_1, errors_1, languageFeatures_1, linesDiffComputer_1, rangeMapping_1, lineRange_1, window_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorWorkerClient = exports.EditorWorkerHost = exports.EditorWorkerService = void 0;
    /**
     * Stop syncing a model to the worker if it was not needed for 1 min.
     */
    const STOP_SYNC_MODEL_DELTA_TIME_MS = 60 * 1000;
    /**
     * Stop the worker if it was not needed for 5 min.
     */
    const STOP_WORKER_DELTA_TIME_MS = 5 * 60 * 1000;
    function canSyncModel(modelService, resource) {
        const model = modelService.getModel(resource);
        if (!model) {
            return false;
        }
        if (model.isTooLargeForSyncing()) {
            return false;
        }
        return true;
    }
    let EditorWorkerService = class EditorWorkerService extends lifecycle_1.Disposable {
        constructor(modelService, configurationService, logService, languageConfigurationService, languageFeaturesService) {
            super();
            this._modelService = modelService;
            this._workerManager = this._register(new WorkerManager(this._modelService, languageConfigurationService));
            this._logService = logService;
            // register default link-provider and default completions-provider
            this._register(languageFeaturesService.linkProvider.register({ language: '*', hasAccessToAllModels: true }, {
                provideLinks: (model, token) => {
                    if (!canSyncModel(this._modelService, model.uri)) {
                        return Promise.resolve({ links: [] }); // File too large
                    }
                    return this._workerManager.withWorker().then(client => client.computeLinks(model.uri)).then(links => {
                        return links && { links };
                    });
                }
            }));
            this._register(languageFeaturesService.completionProvider.register('*', new WordBasedCompletionItemProvider(this._workerManager, configurationService, this._modelService, languageConfigurationService)));
        }
        dispose() {
            super.dispose();
        }
        canComputeUnicodeHighlights(uri) {
            return canSyncModel(this._modelService, uri);
        }
        computedUnicodeHighlights(uri, options, range) {
            return this._workerManager.withWorker().then(client => client.computedUnicodeHighlights(uri, options, range));
        }
        async computeDiff(original, modified, options, algorithm) {
            const result = await this._workerManager.withWorker().then(client => client.computeDiff(original, modified, options, algorithm));
            if (!result) {
                return null;
            }
            // Convert from space efficient JSON data to rich objects.
            const diff = {
                identical: result.identical,
                quitEarly: result.quitEarly,
                changes: toLineRangeMappings(result.changes),
                moves: result.moves.map(m => new linesDiffComputer_1.MovedText(new rangeMapping_1.LineRangeMapping(new lineRange_1.LineRange(m[0], m[1]), new lineRange_1.LineRange(m[2], m[3])), toLineRangeMappings(m[4])))
            };
            return diff;
            function toLineRangeMappings(changes) {
                return changes.map((c) => new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(c[0], c[1]), new lineRange_1.LineRange(c[2], c[3]), c[4]?.map((c) => new rangeMapping_1.RangeMapping(new range_1.Range(c[0], c[1], c[2], c[3]), new range_1.Range(c[4], c[5], c[6], c[7])))));
            }
        }
        canComputeDirtyDiff(original, modified) {
            return (canSyncModel(this._modelService, original) && canSyncModel(this._modelService, modified));
        }
        computeDirtyDiff(original, modified, ignoreTrimWhitespace) {
            return this._workerManager.withWorker().then(client => client.computeDirtyDiff(original, modified, ignoreTrimWhitespace));
        }
        computeMoreMinimalEdits(resource, edits, pretty = false) {
            if ((0, arrays_1.isNonEmptyArray)(edits)) {
                if (!canSyncModel(this._modelService, resource)) {
                    return Promise.resolve(edits); // File too large
                }
                const sw = stopwatch_1.StopWatch.create();
                const result = this._workerManager.withWorker().then(client => client.computeMoreMinimalEdits(resource, edits, pretty));
                result.finally(() => this._logService.trace('FORMAT#computeMoreMinimalEdits', resource.toString(true), sw.elapsed()));
                return Promise.race([result, (0, async_1.timeout)(1000).then(() => edits)]);
            }
            else {
                return Promise.resolve(undefined);
            }
        }
        computeHumanReadableDiff(resource, edits) {
            if ((0, arrays_1.isNonEmptyArray)(edits)) {
                if (!canSyncModel(this._modelService, resource)) {
                    return Promise.resolve(edits); // File too large
                }
                const sw = stopwatch_1.StopWatch.create();
                const result = this._workerManager.withWorker().then(client => client.computeHumanReadableDiff(resource, edits, { ignoreTrimWhitespace: false, maxComputationTimeMs: 1000, computeMoves: false, })).catch((err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    // In case of an exception, fall back to computeMoreMinimalEdits
                    return this.computeMoreMinimalEdits(resource, edits, true);
                });
                result.finally(() => this._logService.trace('FORMAT#computeHumanReadableDiff', resource.toString(true), sw.elapsed()));
                return result;
            }
            else {
                return Promise.resolve(undefined);
            }
        }
        canNavigateValueSet(resource) {
            return (canSyncModel(this._modelService, resource));
        }
        navigateValueSet(resource, range, up) {
            return this._workerManager.withWorker().then(client => client.navigateValueSet(resource, range, up));
        }
        canComputeWordRanges(resource) {
            return canSyncModel(this._modelService, resource);
        }
        computeWordRanges(resource, range) {
            return this._workerManager.withWorker().then(client => client.computeWordRanges(resource, range));
        }
        findSectionHeaders(uri, options) {
            return this._workerManager.withWorker().then(client => client.findSectionHeaders(uri, options));
        }
    };
    exports.EditorWorkerService = EditorWorkerService;
    exports.EditorWorkerService = EditorWorkerService = __decorate([
        __param(0, model_1.IModelService),
        __param(1, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(2, log_1.ILogService),
        __param(3, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], EditorWorkerService);
    class WordBasedCompletionItemProvider {
        constructor(workerManager, configurationService, modelService, languageConfigurationService) {
            this.languageConfigurationService = languageConfigurationService;
            this._debugDisplayName = 'wordbasedCompletions';
            this._workerManager = workerManager;
            this._configurationService = configurationService;
            this._modelService = modelService;
        }
        async provideCompletionItems(model, position) {
            const config = this._configurationService.getValue(model.uri, position, 'editor');
            if (config.wordBasedSuggestions === 'off') {
                return undefined;
            }
            const models = [];
            if (config.wordBasedSuggestions === 'currentDocument') {
                // only current file and only if not too large
                if (canSyncModel(this._modelService, model.uri)) {
                    models.push(model.uri);
                }
            }
            else {
                // either all files or files of same language
                for (const candidate of this._modelService.getModels()) {
                    if (!canSyncModel(this._modelService, candidate.uri)) {
                        continue;
                    }
                    if (candidate === model) {
                        models.unshift(candidate.uri);
                    }
                    else if (config.wordBasedSuggestions === 'allDocuments' || candidate.getLanguageId() === model.getLanguageId()) {
                        models.push(candidate.uri);
                    }
                }
            }
            if (models.length === 0) {
                return undefined; // File too large, no other files
            }
            const wordDefRegExp = this.languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).getWordDefinition();
            const word = model.getWordAtPosition(position);
            const replace = !word ? range_1.Range.fromPositions(position) : new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
            const insert = replace.setEndPosition(position.lineNumber, position.column);
            const client = await this._workerManager.withWorker();
            const data = await client.textualSuggest(models, word?.word, wordDefRegExp);
            if (!data) {
                return undefined;
            }
            return {
                duration: data.duration,
                suggestions: data.words.map((word) => {
                    return {
                        kind: 18 /* languages.CompletionItemKind.Text */,
                        label: word,
                        insertText: word,
                        range: { insert, replace }
                    };
                }),
            };
        }
    }
    class WorkerManager extends lifecycle_1.Disposable {
        constructor(modelService, languageConfigurationService) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            this._modelService = modelService;
            this._editorWorkerClient = null;
            this._lastWorkerUsedTime = (new Date()).getTime();
            const stopWorkerInterval = this._register(new dom_1.WindowIntervalTimer());
            stopWorkerInterval.cancelAndSet(() => this._checkStopIdleWorker(), Math.round(STOP_WORKER_DELTA_TIME_MS / 2), window_1.mainWindow);
            this._register(this._modelService.onModelRemoved(_ => this._checkStopEmptyWorker()));
        }
        dispose() {
            if (this._editorWorkerClient) {
                this._editorWorkerClient.dispose();
                this._editorWorkerClient = null;
            }
            super.dispose();
        }
        /**
         * Check if the model service has no more models and stop the worker if that is the case.
         */
        _checkStopEmptyWorker() {
            if (!this._editorWorkerClient) {
                return;
            }
            const models = this._modelService.getModels();
            if (models.length === 0) {
                // There are no more models => nothing possible for me to do
                this._editorWorkerClient.dispose();
                this._editorWorkerClient = null;
            }
        }
        /**
         * Check if the worker has been idle for a while and then stop it.
         */
        _checkStopIdleWorker() {
            if (!this._editorWorkerClient) {
                return;
            }
            const timeSinceLastWorkerUsedTime = (new Date()).getTime() - this._lastWorkerUsedTime;
            if (timeSinceLastWorkerUsedTime > STOP_WORKER_DELTA_TIME_MS) {
                this._editorWorkerClient.dispose();
                this._editorWorkerClient = null;
            }
        }
        withWorker() {
            this._lastWorkerUsedTime = (new Date()).getTime();
            if (!this._editorWorkerClient) {
                this._editorWorkerClient = new EditorWorkerClient(this._modelService, false, 'editorWorkerService', this.languageConfigurationService);
            }
            return Promise.resolve(this._editorWorkerClient);
        }
    }
    class EditorModelManager extends lifecycle_1.Disposable {
        constructor(proxy, modelService, keepIdleModels) {
            super();
            this._syncedModels = Object.create(null);
            this._syncedModelsLastUsedTime = Object.create(null);
            this._proxy = proxy;
            this._modelService = modelService;
            if (!keepIdleModels) {
                const timer = new async_1.IntervalTimer();
                timer.cancelAndSet(() => this._checkStopModelSync(), Math.round(STOP_SYNC_MODEL_DELTA_TIME_MS / 2));
                this._register(timer);
            }
        }
        dispose() {
            for (const modelUrl in this._syncedModels) {
                (0, lifecycle_1.dispose)(this._syncedModels[modelUrl]);
            }
            this._syncedModels = Object.create(null);
            this._syncedModelsLastUsedTime = Object.create(null);
            super.dispose();
        }
        ensureSyncedResources(resources, forceLargeModels) {
            for (const resource of resources) {
                const resourceStr = resource.toString();
                if (!this._syncedModels[resourceStr]) {
                    this._beginModelSync(resource, forceLargeModels);
                }
                if (this._syncedModels[resourceStr]) {
                    this._syncedModelsLastUsedTime[resourceStr] = (new Date()).getTime();
                }
            }
        }
        _checkStopModelSync() {
            const currentTime = (new Date()).getTime();
            const toRemove = [];
            for (const modelUrl in this._syncedModelsLastUsedTime) {
                const elapsedTime = currentTime - this._syncedModelsLastUsedTime[modelUrl];
                if (elapsedTime > STOP_SYNC_MODEL_DELTA_TIME_MS) {
                    toRemove.push(modelUrl);
                }
            }
            for (const e of toRemove) {
                this._stopModelSync(e);
            }
        }
        _beginModelSync(resource, forceLargeModels) {
            const model = this._modelService.getModel(resource);
            if (!model) {
                return;
            }
            if (!forceLargeModels && model.isTooLargeForSyncing()) {
                return;
            }
            const modelUrl = resource.toString();
            this._proxy.acceptNewModel({
                url: model.uri.toString(),
                lines: model.getLinesContent(),
                EOL: model.getEOL(),
                versionId: model.getVersionId()
            });
            const toDispose = new lifecycle_1.DisposableStore();
            toDispose.add(model.onDidChangeContent((e) => {
                this._proxy.acceptModelChanged(modelUrl.toString(), e);
            }));
            toDispose.add(model.onWillDispose(() => {
                this._stopModelSync(modelUrl);
            }));
            toDispose.add((0, lifecycle_1.toDisposable)(() => {
                this._proxy.acceptRemovedModel(modelUrl);
            }));
            this._syncedModels[modelUrl] = toDispose;
        }
        _stopModelSync(modelUrl) {
            const toDispose = this._syncedModels[modelUrl];
            delete this._syncedModels[modelUrl];
            delete this._syncedModelsLastUsedTime[modelUrl];
            (0, lifecycle_1.dispose)(toDispose);
        }
    }
    class SynchronousWorkerClient {
        constructor(instance) {
            this._instance = instance;
            this._proxyObj = Promise.resolve(this._instance);
        }
        dispose() {
            this._instance.dispose();
        }
        getProxyObject() {
            return this._proxyObj;
        }
    }
    class EditorWorkerHost {
        constructor(workerClient) {
            this._workerClient = workerClient;
        }
        // foreign host request
        fhr(method, args) {
            return this._workerClient.fhr(method, args);
        }
    }
    exports.EditorWorkerHost = EditorWorkerHost;
    class EditorWorkerClient extends lifecycle_1.Disposable {
        constructor(modelService, keepIdleModels, label, languageConfigurationService) {
            super();
            this.languageConfigurationService = languageConfigurationService;
            this._disposed = false;
            this._modelService = modelService;
            this._keepIdleModels = keepIdleModels;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory(label);
            this._worker = null;
            this._modelManager = null;
        }
        // foreign host request
        fhr(method, args) {
            throw new Error(`Not implemented!`);
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/editor/common/services/editorSimpleWorker', new EditorWorkerHost(this)));
                }
                catch (err) {
                    (0, simpleWorker_1.logOnceWebWorkerWarning)(err);
                    this._worker = new SynchronousWorkerClient(new editorSimpleWorker_1.EditorSimpleWorker(new EditorWorkerHost(this), null));
                }
            }
            return this._worker;
        }
        _getProxy() {
            return this._getOrCreateWorker().getProxyObject().then(undefined, (err) => {
                (0, simpleWorker_1.logOnceWebWorkerWarning)(err);
                this._worker = new SynchronousWorkerClient(new editorSimpleWorker_1.EditorSimpleWorker(new EditorWorkerHost(this), null));
                return this._getOrCreateWorker().getProxyObject();
            });
        }
        _getOrCreateModelManager(proxy) {
            if (!this._modelManager) {
                this._modelManager = this._register(new EditorModelManager(proxy, this._modelService, this._keepIdleModels));
            }
            return this._modelManager;
        }
        async _withSyncedResources(resources, forceLargeModels = false) {
            if (this._disposed) {
                return Promise.reject((0, errors_1.canceled)());
            }
            return this._getProxy().then((proxy) => {
                this._getOrCreateModelManager(proxy).ensureSyncedResources(resources, forceLargeModels);
                return proxy;
            });
        }
        computedUnicodeHighlights(uri, options, range) {
            return this._withSyncedResources([uri]).then(proxy => {
                return proxy.computeUnicodeHighlights(uri.toString(), options, range);
            });
        }
        computeDiff(original, modified, options, algorithm) {
            return this._withSyncedResources([original, modified], /* forceLargeModels */ true).then(proxy => {
                return proxy.computeDiff(original.toString(), modified.toString(), options, algorithm);
            });
        }
        computeDirtyDiff(original, modified, ignoreTrimWhitespace) {
            return this._withSyncedResources([original, modified]).then(proxy => {
                return proxy.computeDirtyDiff(original.toString(), modified.toString(), ignoreTrimWhitespace);
            });
        }
        computeMoreMinimalEdits(resource, edits, pretty) {
            return this._withSyncedResources([resource]).then(proxy => {
                return proxy.computeMoreMinimalEdits(resource.toString(), edits, pretty);
            });
        }
        computeHumanReadableDiff(resource, edits, options) {
            return this._withSyncedResources([resource]).then(proxy => {
                return proxy.computeHumanReadableDiff(resource.toString(), edits, options);
            });
        }
        computeLinks(resource) {
            return this._withSyncedResources([resource]).then(proxy => {
                return proxy.computeLinks(resource.toString());
            });
        }
        computeDefaultDocumentColors(resource) {
            return this._withSyncedResources([resource]).then(proxy => {
                return proxy.computeDefaultDocumentColors(resource.toString());
            });
        }
        async textualSuggest(resources, leadingWord, wordDefRegExp) {
            const proxy = await this._withSyncedResources(resources);
            const wordDef = wordDefRegExp.source;
            const wordDefFlags = wordDefRegExp.flags;
            return proxy.textualSuggest(resources.map(r => r.toString()), leadingWord, wordDef, wordDefFlags);
        }
        computeWordRanges(resource, range) {
            return this._withSyncedResources([resource]).then(proxy => {
                const model = this._modelService.getModel(resource);
                if (!model) {
                    return Promise.resolve(null);
                }
                const wordDefRegExp = this.languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).getWordDefinition();
                const wordDef = wordDefRegExp.source;
                const wordDefFlags = wordDefRegExp.flags;
                return proxy.computeWordRanges(resource.toString(), range, wordDef, wordDefFlags);
            });
        }
        navigateValueSet(resource, range, up) {
            return this._withSyncedResources([resource]).then(proxy => {
                const model = this._modelService.getModel(resource);
                if (!model) {
                    return null;
                }
                const wordDefRegExp = this.languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).getWordDefinition();
                const wordDef = wordDefRegExp.source;
                const wordDefFlags = wordDefRegExp.flags;
                return proxy.navigateValueSet(resource.toString(), range, up, wordDef, wordDefFlags);
            });
        }
        findSectionHeaders(uri, options) {
            return this._withSyncedResources([uri]).then(proxy => {
                return proxy.findSectionHeaders(uri.toString(), options);
            });
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    }
    exports.EditorWorkerClient = EditorWorkerClient;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yV29ya2VyU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvc2VydmljZXMvZWRpdG9yV29ya2VyU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQ2hHOztPQUVHO0lBQ0gsTUFBTSw2QkFBNkIsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBRWhEOztPQUVHO0lBQ0gsTUFBTSx5QkFBeUIsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztJQUVoRCxTQUFTLFlBQVksQ0FBQyxZQUEyQixFQUFFLFFBQWE7UUFDL0QsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWixPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFDRCxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLENBQUM7WUFDbEMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRU0sSUFBTSxtQkFBbUIsR0FBekIsTUFBTSxtQkFBb0IsU0FBUSxzQkFBVTtRQVFsRCxZQUNnQixZQUEyQixFQUNQLG9CQUF1RCxFQUM3RSxVQUF1QixFQUNMLDRCQUEyRCxFQUNoRSx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsYUFBYSxHQUFHLFlBQVksQ0FBQztZQUNsQyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7WUFDMUcsSUFBSSxDQUFDLFdBQVcs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