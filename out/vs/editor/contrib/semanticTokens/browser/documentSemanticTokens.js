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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/errors", "vs/editor/common/services/model", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/theme/common/themeService", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/semanticTokensStyling", "vs/editor/common/editorFeatures", "vs/editor/contrib/semanticTokens/common/semanticTokensConfig"], function (require, exports, lifecycle_1, errors, model_1, configuration_1, async_1, cancellation_1, themeService_1, semanticTokensProviderStyling_1, getSemanticTokens_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1, semanticTokensStyling_1, editorFeatures_1, semanticTokensConfig_1) {
    "use strict";
    var ModelSemanticColoring_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DocumentSemanticTokensFeature = void 0;
    let DocumentSemanticTokensFeature = class DocumentSemanticTokensFeature extends lifecycle_1.Disposable {
        constructor(semanticTokensStylingService, modelService, themeService, configurationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._watchers = Object.create(null);
            const register = (model) => {
                this._watchers[model.uri.toString()] = new ModelSemanticColoring(model, semanticTokensStylingService, themeService, languageFeatureDebounceService, languageFeaturesService);
            };
            const deregister = (model, modelSemanticColoring) => {
                modelSemanticColoring.dispose();
                delete this._watchers[model.uri.toString()];
            };
            const handleSettingOrThemeChange = () => {
                for (const model of modelService.getModels()) {
                    const curr = this._watchers[model.uri.toString()];
                    if ((0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, themeService, configurationService)) {
                        if (!curr) {
                            register(model);
                        }
                    }
                    else {
                        if (curr) {
                            deregister(model, curr);
                        }
                    }
                }
            };
            modelService.getModels().forEach(model => {
                if ((0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, themeService, configurationService)) {
                    register(model);
                }
            });
            this._register(modelService.onModelAdded((model) => {
                if ((0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, themeService, configurationService)) {
                    register(model);
                }
            }));
            this._register(modelService.onModelRemoved((model) => {
                const curr = this._watchers[model.uri.toString()];
                if (curr) {
                    deregister(model, curr);
                }
            }));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(semanticTokensConfig_1.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    handleSettingOrThemeChange();
                }
            }));
            this._register(themeService.onDidColorThemeChange(handleSettingOrThemeChange));
        }
        dispose() {
            // Dispose all watchers
            for (const watcher of Object.values(this._watchers)) {
                watcher.dispose();
            }
            super.dispose();
        }
    };
    exports.DocumentSemanticTokensFeature = DocumentSemanticTokensFeature;
    exports.DocumentSemanticTokensFeature = DocumentSemanticTokensFeature = __decorate([
        __param(0, semanticTokensStyling_1.ISemanticTokensStylingService),
        __param(1, model_1.IModelService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], DocumentSemanticTokensFeature);
    let ModelSemanticColoring = class ModelSemanticColoring extends lifecycle_1.Disposable {
        static { ModelSemanticColoring_1 = this; }
        static { this.REQUEST_MIN_DELAY = 300; }
        static { this.REQUEST_MAX_DELAY = 2000; }
        constructor(model, _semanticTokensStylingService, themeService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._semanticTokensStylingService = _semanticTokensStylingService;
            this._isDisposed = false;
            this._model = model;
            this._provider = languageFeaturesService.documentSemanticTokensProvider;
            this._debounceInformation = languageFeatureDebounceService.for(this._provider, 'DocumentSemanticTokens', { min: ModelSemanticColoring_1.REQUEST_MIN_DELAY, max: ModelSemanticColoring_1.REQUEST_MAX_DELAY });
            this._fetchDocumentSemanticTokens = this._register(new async_1.RunOnceScheduler(() => this._fetchDocumentSemanticTokensNow(), ModelSemanticColoring_1.REQUEST_MIN_DELAY));
            this._currentDocumentResponse = null;
            this._currentDocumentRequestCancellationTokenSource = null;
            this._documentProvidersChangeListeners = [];
            this._providersChangedDuringRequest = false;
            this._register(this._model.onDidChangeContent(() => {
                if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            }));
            this._register(this._model.onDidChangeAttached(() => {
                if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            }));
            this._register(this._model.onDidChangeLanguage(() => {
                // clear any outstanding state
                if (this._currentDocumentResponse) {
                    this._currentDocumentResponse.dispose();
                    this._currentDocumentResponse = null;
                }
                if (this._currentDocumentRequestCancellationTokenSource) {
                    this._currentDocumentRequestCancellationTokenSource.cancel();
                    this._currentDocumentRequestCancellationTokenSource = null;
                }
                this._setDocumentSemanticTokens(null, null, null, []);
                this._fetchDocumentSemanticTokens.schedule(0);
            }));
            const bindDocumentChangeListeners = () => {
                (0, lifecycle_1.dispose)(this._documentProvidersChangeListeners);
                this._documentProvidersChangeListeners = [];
                for (const provider of this._provider.all(model)) {
                    if (typeof provider.onDidChange === 'function') {
                        this._documentProvidersChangeListeners.push(provider.onDidChange(() => {
                            if (this._currentDocumentRequestCancellationTokenSource) {
                                // there is already a request running,
                                this._providersChangedDuringRequest = true;
                                return;
                            }
                            this._fetchDocumentSemanticTokens.schedule(0);
                        }));
                    }
                }
            };
            bindDocumentChangeListeners();
            this._register(this._provider.onDidChange(() => {
                bindDocumentChangeListeners();
                this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
            }));
            this._register(themeService.onDidColorThemeChange(_ => {
                // clear out existing tokens
                this._setDocumentSemanticTokens(null, null, null, []);
                this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
            }));
            this._fetchDocumentSemanticTokens.schedule(0);
        }
        dispose() {
            if (this._currentDocumentResponse) {
                this._currentDocumentResponse.dispose();
                this._currentDocumentResponse = null;
            }
            if (this._currentDocumentRequestCancellationTokenSource) {
                this._currentDocumentRequestCancellationTokenSource.cancel();
                this._currentDocumentRequestCancellationTokenSource = null;
            }
            (0, lifecycle_1.dispose)(this._documentProvidersChangeListeners);
            this._documentProvidersChangeListeners = [];
            this._setDocumentSemanticTokens(null, null, null, []);
            this._isDisposed = true;
            super.dispose();
        }
        _fetchDocumentSemanticTokensNow() {
            if (this._currentDocumentRequestCancellationTokenSource) {
                // there is already a request running, let it finish...
                return;
            }
            if (!(0, getSemanticTokens_1.hasDocumentSemanticTokensProvider)(this._provider, this._model)) {
                // there is no provider
                if (this._currentDocumentResponse) {
                    // there are semantic tokens set
                    this._model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            if (!this._model.isAttachedToEditor()) {
                // this document is not visible, there is no need to fetch semantic tokens for it
                return;
            }
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const lastProvider = this._currentDocumentResponse ? this._currentDocumentResponse.provider : null;
            const lastResultId = this._currentDocumentResponse ? this._currentDocumentResponse.resultId || null : null;
            const request = (0, getSemanticTokens_1.getDocumentSemanticTokens)(this._provider, this._model, lastProvider, lastResultId, cancellationTokenSource.token);
            this._currentDocumentRequestCancellationTokenSource = cancellationTokenSource;
            this._providersChangedDuringRequest = false;
            const pendingChanges = [];
            const contentChangeListener = this._model.onDidChangeContent((e) => {
                pendingChanges.push(e);
            });
            const sw = new stopwatch_1.StopWatch(false);
            request.then((res) => {
                this._debounceInformation.update(this._model, sw.elapsed());
                this._currentDocumentRequestCancellationTokenSource = null;
                contentChangeListener.dispose();
                if (!res) {
                    this._setDocumentSemanticTokens(null, null, null, pendingChanges);
                }
                else {
                    const { provider, tokens } = res;
                    const styling = this._semanticTokensStylingService.getStyling(provider);
                    this._setDocumentSemanticTokens(provider, tokens || null, styling, pendingChanges);
                }
            }, (err) => {
                const isExpectedError = err && (errors.isCancellationError(err) || (typeof err.message === 'string' && err.message.indexOf('busy') !== -1));
                if (!isExpectedError) {
                    errors.onUnexpectedError(err);
                }
                // Semantic tokens eats up all errors and considers errors to mean that the result is temporarily not available
                // The API does not have a special error kind to express this...
                this._currentDocumentRequestCancellationTokenSource = null;
                contentChangeListener.dispose();
                if (pendingChanges.length > 0 || this._providersChangedDuringRequest) {
                    // More changes occurred while the request was running
                    if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                        this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                    }
                }
            });
        }
        static _copy(src, srcOffset, dest, destOffset, length) {
            // protect against overflows
            length = Math.min(length, dest.length - destOffset, src.length - srcOffset);
            for (let i = 0; i < length; i++) {
                dest[destOffset + i] = src[srcOffset + i];
            }
        }
        _setDocumentSemanticTokens(provider, tokens, styling, pendingChanges) {
            const currentResponse = this._currentDocumentResponse;
            const rescheduleIfNeeded = () => {
                if ((pendingChanges.length > 0 || this._providersChangedDuringRequest) && !this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            };
            if (this._currentDocumentResponse) {
                this._currentDocumentResponse.dispose();
                this._currentDocumentResponse = null;
            }
            if (this._isDisposed) {
                // disposed!
                if (provider && tokens) {
                    provider.releaseDocumentSemanticTokens(tokens.resultId);
                }
                return;
            }
            if (!provider || !styling) {
                this._model.tokenization.setSemanticTokens(null, false);
                return;
            }
            if (!tokens) {
                this._model.tokenization.setSemanticTokens(null, true);
                rescheduleIfNeeded();
                return;
            }
            if ((0, getSemanticTokens_1.isSemanticTokensEdits)(tokens)) {
                if (!currentResponse) {
                    // not possible!
                    this._model.tokenization.setSemanticTokens(null, true);
                    return;
                }
                if (tokens.edits.length === 0) {
                    // nothing to do!
                    tokens = {
                        resultId: tokens.resultId,
                        data: currentResponse.data
                    };
                }
                else {
                    let deltaLength = 0;
                    for (const edit of tokens.edits) {
                        deltaLength += (edit.data ? edit.data.length : 0) - edit.deleteCount;
                    }
                    const srcData = currentResponse.data;
                    const destData = new Uint32Array(srcData.length + deltaLength);
                    let srcLastStart = srcData.length;
                    let destLastStart = destData.length;
                    for (let i = tokens.edits.length - 1; i >= 0; i--) {
                        const edit = tokens.edits[i];
                        if (edit.start > srcData.length) {
                            styling.warnInvalidEditStart(currentResponse.resultId, tokens.resultId, i, edit.start, srcData.length);
                            // The edits are invalid and there's no way to recover
                            this._model.tokenization.setSemanticTokens(null, true);
                            return;
                        }
                        const copyCount = srcLastStart - (edit.start + edit.deleteCount);
                        if (copyCount > 0) {
                            ModelSemanticColoring_1._copy(srcData, srcLastStart - copyCount, destData, destLastStart - copyCount, copyCount);
                            destLastStart -= copyCount;
                        }
                        if (edit.data) {
                            ModelSemanticColoring_1._copy(edit.data, 0, destData, destLastStart - edit.data.length, edit.data.length);
                            destLastStart -= edit.data.length;
                        }
                        srcLastStart = edit.start;
                    }
                    if (srcLastStart > 0) {
                        ModelSemanticColoring_1._copy(srcData, 0, destData, 0, srcLastStart);
                    }
                    tokens = {
                        resultId: tokens.resultId,
                        data: destData
                    };
                }
            }
            if ((0, getSemanticTokens_1.isSemanticTokens)(tokens)) {
                this._currentDocumentResponse = new SemanticTokensResponse(provider, tokens.resultId, tokens.data);
                const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(tokens, styling, this._model.getLanguageId());
                // Adjust incoming semantic tokens
                if (pendingChanges.length > 0) {
                    // More changes occurred while the request was running
                    // We need to:
                    // 1. Adjust incoming semantic tokens
                    // 2. Request them again
                    for (const change of pendingChanges) {
                        for (const area of result) {
                            for (const singleChange of change.changes) {
                                area.applyEdit(singleChange.range, singleChange.text);
                            }
                        }
                    }
                }
                this._model.tokenization.setSemanticTokens(result, true);
            }
            else {
                this._model.tokenization.setSemanticTokens(null, true);
            }
            rescheduleIfNeeded();
        }
    };
    ModelSemanticColoring = ModelSemanticColoring_1 = __decorate([
        __param(1, semanticTokensStyling_1.ISemanticTokensStylingService),
        __param(2, themeService_1.IThemeService),
        __param(3, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], ModelSemanticColoring);
    class SemanticTokensResponse {
        constructor(provider, resultId, data) {
            this.provider = provider;
            this.resultId = resultId;
            this.data = data;
        }
        dispose() {
            this.provider.releaseDocumentSemanticTokens(this.resultId);
        }
    }
    (0, editorFeatures_1.registerEditorFeature)(DocumentSemanticTokensFeature);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jdW1lbnRTZW1hbnRpY1Rva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc2VtYW50aWNUb2tlbnMvYnJvd3Nlci9kb2N1bWVudFNlbWFudGljVG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFzQnpGLElBQU0sNkJBQTZCLEdBQW5DLE1BQU0sNkJBQThCLFNBQVEsc0JBQVU7UUFJNUQsWUFDZ0MsNEJBQTJELEVBQzNFLFlBQTJCLEVBQzNCLFlBQTJCLEVBQ25CLG9CQUEyQyxFQUNqQyw4QkFBK0QsRUFDdEUsdUJBQWlEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBQ1IsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRXJDLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBaUIsRUFBRSxFQUFFO2dCQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxJQUFJLHFCQUFxQixDQUFDLEtBQUssRUFBRSw0QkFBNEIsRUFBRSxZQUFZLEVBQUUsOEJBQThCLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztZQUM5SyxDQUFDLENBQUM7WUFDRixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQWlCLEVBQUUscUJBQTRDLEVBQUUsRUFBRTtnQkFDdEYscUJBQXFCLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDO1lBQ0YsTUFBTSwwQkFBMEIsR0FBRyxHQUFHLEVBQUU7Z0JBQ3ZDLEtBQUssTUFBTSxLQUFLLElBQUks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