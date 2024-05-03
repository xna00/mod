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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/contrib/semanticTokens/common/getSemanticTokens", "vs/editor/contrib/semanticTokens/common/semanticTokensConfig", "vs/editor/common/services/semanticTokensProviderStyling", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/semanticTokensStyling"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, getSemanticTokens_1, semanticTokensConfig_1, semanticTokensProviderStyling_1, configuration_1, themeService_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1, semanticTokensStyling_1) {
    "use strict";
    var ViewportSemanticTokensContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewportSemanticTokensContribution = void 0;
    let ViewportSemanticTokensContribution = class ViewportSemanticTokensContribution extends lifecycle_1.Disposable {
        static { ViewportSemanticTokensContribution_1 = this; }
        static { this.ID = 'editor.contrib.viewportSemanticTokens'; }
        static get(editor) {
            return editor.getContribution(ViewportSemanticTokensContribution_1.ID);
        }
        constructor(editor, _semanticTokensStylingService, _themeService, _configurationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._semanticTokensStylingService = _semanticTokensStylingService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._editor = editor;
            this._provider = languageFeaturesService.documentRangeSemanticTokensProvider;
            this._debounceInformation = languageFeatureDebounceService.for(this._provider, 'DocumentRangeSemanticTokens', { min: 100, max: 500 });
            this._tokenizeViewport = this._register(new async_1.RunOnceScheduler(() => this._tokenizeViewportNow(), 100));
            this._outstandingRequests = [];
            const scheduleTokenizeViewport = () => {
                if (this._editor.hasModel()) {
                    this._tokenizeViewport.schedule(this._debounceInformation.get(this._editor.getModel()));
                }
            };
            this._register(this._editor.onDidScrollChange(() => {
                scheduleTokenizeViewport();
            }));
            this._register(this._editor.onDidChangeModel(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._provider.onDidChange(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(semanticTokensConfig_1.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    this._cancelAll();
                    scheduleTokenizeViewport();
                }
            }));
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._cancelAll();
                scheduleTokenizeViewport();
            }));
            scheduleTokenizeViewport();
        }
        _cancelAll() {
            for (const request of this._outstandingRequests) {
                request.cancel();
            }
            this._outstandingRequests = [];
        }
        _removeOutstandingRequest(req) {
            for (let i = 0, len = this._outstandingRequests.length; i < len; i++) {
                if (this._outstandingRequests[i] === req) {
                    this._outstandingRequests.splice(i, 1);
                    return;
                }
            }
        }
        _tokenizeViewportNow() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            if (model.tokenization.hasCompleteSemanticTokens()) {
                return;
            }
            if (!(0, semanticTokensConfig_1.isSemanticColoringEnabled)(model, this._themeService, this._configurationService)) {
                if (model.tokenization.hasSomeSemanticTokens()) {
                    model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            if (!(0, getSemanticTokens_1.hasDocumentRangeSemanticTokensProvider)(this._provider, model)) {
                if (model.tokenization.hasSomeSemanticTokens()) {
                    model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            this._outstandingRequests = this._outstandingRequests.concat(visibleRanges.map(range => this._requestRange(model, range)));
        }
        _requestRange(model, range) {
            const requestVersionId = model.getVersionId();
            const request = (0, async_1.createCancelablePromise)(token => Promise.resolve((0, getSemanticTokens_1.getDocumentRangeSemanticTokens)(this._provider, model, range, token)));
            const sw = new stopwatch_1.StopWatch(false);
            request.then((r) => {
                this._debounceInformation.update(model, sw.elapsed());
                if (!r || !r.tokens || model.isDisposed() || model.getVersionId() !== requestVersionId) {
                    return;
                }
                const { provider, tokens: result } = r;
                const styling = this._semanticTokensStylingService.getStyling(provider);
                model.tokenization.setPartialSemanticTokens(range, (0, semanticTokensProviderStyling_1.toMultilineTokens2)(result, styling, model.getLanguageId()));
            }).then(() => this._removeOutstandingRequest(request), () => this._removeOutstandingRequest(request));
            return request;
        }
    };
    exports.ViewportSemanticTokensContribution = ViewportSemanticTokensContribution;
    exports.ViewportSemanticTokensContribution = ViewportSemanticTokensContribution = ViewportSemanticTokensContribution_1 = __decorate([
        __param(1, semanticTokensStyling_1.ISemanticTokensStylingService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], ViewportSemanticTokensContribution);
    (0, editorExtensions_1.registerEditorContribution)(ViewportSemanticTokensContribution.ID, ViewportSemanticTokensContribution, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld3BvcnRTZW1hbnRpY1Rva2Vucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc2VtYW50aWNUb2tlbnMvYnJvd3Nlci92aWV3cG9ydFNlbWFudGljVG9rZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUFxQnpGLElBQU0sa0NBQWtDLEdBQXhDLE1BQU0sa0NBQW1DLFNBQVEsc0JBQVU7O2lCQUUxQyxPQUFFLEdBQUcsdUNBQXVDLEFBQTFDLENBQTJDO1FBRTdELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBbUI7WUFDcEMsT0FBTyxNQUFNLENBQUMsZUFBZSxDQUFxQyxvQ0FBa0MsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMxRyxDQUFDO1FBUUQsWUFDQyxNQUFtQixFQUM2Qiw2QkFBNEQsRUFDNUUsYUFBNEIsRUFDcEIscUJBQTRDLEVBQ25ELDhCQUErRCxFQUN0RSx1QkFBaUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFOd0Msa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUM1RSxrQkFBYSxHQUFiLGFBQWEsQ0FBZTtZQUNwQiwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBS3BGLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsdUJBQXVCLENBQUMsbUNBQW1DLENBQUM7WUFDN0UsSUFBSSxDQUFDLG9CQUFvQixHQUFHLDhCQUE4QixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDZCQUE2QixFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN0SSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FB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