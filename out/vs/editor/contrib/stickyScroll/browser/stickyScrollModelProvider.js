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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/documentSymbols/browser/outlineModel", "vs/base/common/async", "vs/editor/contrib/folding/browser/folding", "vs/editor/contrib/folding/browser/syntaxRangeProvider", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/common/languages/languageConfigurationRegistry", "vs/base/common/errors", "vs/editor/contrib/stickyScroll/browser/stickyScrollElement", "vs/base/common/iterator", "vs/platform/instantiation/common/instantiation"], function (require, exports, lifecycle_1, languageFeatures_1, outlineModel_1, async_1, folding_1, syntaxRangeProvider_1, indentRangeProvider_1, languageConfigurationRegistry_1, errors_1, stickyScrollElement_1, iterator_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyModelProvider = void 0;
    var ModelProvider;
    (function (ModelProvider) {
        ModelProvider["OUTLINE_MODEL"] = "outlineModel";
        ModelProvider["FOLDING_PROVIDER_MODEL"] = "foldingProviderModel";
        ModelProvider["INDENTATION_MODEL"] = "indentationModel";
    })(ModelProvider || (ModelProvider = {}));
    var Status;
    (function (Status) {
        Status[Status["VALID"] = 0] = "VALID";
        Status[Status["INVALID"] = 1] = "INVALID";
        Status[Status["CANCELED"] = 2] = "CANCELED";
    })(Status || (Status = {}));
    let StickyModelProvider = class StickyModelProvider extends lifecycle_1.Disposable {
        constructor(_editor, onProviderUpdate, _languageConfigurationService, _languageFeaturesService) {
            super();
            this._editor = _editor;
            this._languageConfigurationService = _languageConfigurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._modelProviders = [];
            this._modelPromise = null;
            this._updateScheduler = this._register(new async_1.Delayer(300));
            this._updateOperation = this._register(new lifecycle_1.DisposableStore());
            switch (this._editor.getOption(115 /* EditorOption.stickyScroll */).defaultModel) {
                case ModelProvider.OUTLINE_MODEL:
                    this._modelProviders.push(new StickyModelFromCandidateOutlineProvider(this._editor, _languageFeaturesService));
                // fall through
                case ModelProvider.FOLDING_PROVIDER_MODEL:
                    this._modelProviders.push(new StickyModelFromCandidateSyntaxFoldingProvider(this._editor, onProviderUpdate, _languageFeaturesService));
                // fall through
                case ModelProvider.INDENTATION_MODEL:
                    this._modelProviders.push(new StickyModelFromCandidateIndentationFoldingProvider(this._editor, _languageConfigurationService));
                    break;
            }
        }
        dispose() {
            this._modelProviders.forEach(provider => provider.dispose());
            this._updateOperation.clear();
            this._cancelModelPromise();
            super.dispose();
        }
        _cancelModelPromise() {
            if (this._modelPromise) {
                this._modelPromise.cancel();
                this._modelPromise = null;
            }
        }
        async update(token) {
            this._updateOperation.clear();
            this._updateOperation.add({
                dispose: () => {
                    this._cancelModelPromise();
                    this._updateScheduler.cancel();
                }
            });
            this._cancelModelPromise();
            return await this._updateScheduler.trigger(async () => {
                for (const modelProvider of this._modelProviders) {
                    const { statusPromise, modelPromise } = modelProvider.computeStickyModel(token);
                    this._modelPromise = modelPromise;
                    const status = await statusPromise;
                    if (this._modelPromise !== modelPromise) {
                        return null;
                    }
                    switch (status) {
                        case Status.CANCELED:
                            this._updateOperation.clear();
                            return null;
                        case Status.VALID:
                            return modelProvider.stickyModel;
                    }
                }
                return null;
            }).catch((error) => {
                (0, errors_1.onUnexpectedError)(error);
                return null;
            });
        }
    };
    exports.StickyModelProvider = StickyModelProvider;
    exports.StickyModelProvider = StickyModelProvider = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService)
    ], StickyModelProvider);
    class StickyModelCandidateProvider extends lifecycle_1.Disposable {
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._stickyModel = null;
        }
        get stickyModel() {
            return this._stickyModel;
        }
        _invalid() {
            this._stickyModel = null;
            return Status.INVALID;
        }
        computeStickyModel(token) {
            if (token.isCancellationRequested || !this.isProviderValid()) {
                return { statusPromise: this._invalid(), modelPromise: null };
            }
            const providerModelPromise = (0, async_1.createCancelablePromise)(token => this.createModelFromProvider(token));
            return {
                statusPromise: providerModelPromise.then(providerModel => {
                    if (!this.isModelValid(providerModel)) {
                        return this._invalid();
                    }
                    if (token.isCancellationRequested) {
                        return Status.CANCELED;
                    }
                    this._stickyModel = this.createStickyModel(token, providerModel);
                    return Status.VALID;
                }).then(undefined, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return Status.CANCELED;
                }),
                modelPromise: providerModelPromise
            };
        }
        /**
         * Method which checks whether the model returned by the provider is valid and can be used to compute a sticky model.
         * This method by default returns true.
         * @param model model returned by the provider
         * @returns boolean indicating whether the model is valid
         */
        isModelValid(model) {
            return true;
        }
        /**
         * Method which checks whether the provider is valid before applying it to find the provider model.
         * This method by default returns true.
         * @returns boolean indicating whether the provider is valid
         */
        isProviderValid() {
            return true;
        }
    }
    let StickyModelFromCandidateOutlineProvider = class StickyModelFromCandidateOutlineProvider extends StickyModelCandidateProvider {
        constructor(_editor, _languageFeaturesService) {
            super(_editor);
            this._languageFeaturesService = _languageFeaturesService;
        }
        createModelFromProvider(token) {
            return outlineModel_1.OutlineModel.create(this._languageFeaturesService.documentSymbolProvider, this._editor.getModel(), token);
        }
        createStickyModel(token, model) {
            const { stickyOutlineElement, providerID } = this._stickyModelFromOutlineModel(model, this._stickyModel?.outlineProviderId);
            const textModel = this._editor.getModel();
            return new stickyScrollElement_1.StickyModel(textModel.uri, textModel.getVersionId(), stickyOutlineElement, providerID);
        }
        isModelValid(model) {
            return model && model.children.size > 0;
        }
        _stickyModelFromOutlineModel(outlineModel, preferredProvider) {
            let outlineElements;
            // When several possible outline providers
            if (iterator_1.Iterable.first(outlineModel.children.values()) instanceof outlineModel_1.OutlineGroup) {
                const provider = iterator_1.Iterable.find(outlineModel.children.values(), outlineGroupOfModel => outlineGroupOfModel.id === preferredProvider);
                if (provider) {
                    outlineElements = provider.children;
                }
                else {
                    let tempID = '';
                    let maxTotalSumOfRanges = -1;
                    let optimalOutlineGroup = undefined;
                    for (const [_key, outlineGroup] of outlineModel.children.entries()) {
                        const totalSumRanges = this._findSumOfRangesOfGroup(outlineGroup);
                        if (totalSumRanges > maxTotalSumOfRanges) {
                            optimalOutlineGroup = outlineGroup;
                            maxTotalSumOfRanges = totalSumRanges;
                            tempID = outlineGroup.id;
                        }
                    }
                    preferredProvider = tempID;
                    outlineElements = optimalOutlineGroup.children;
                }
            }
            else {
                outlineElements = outlineModel.children;
            }
            const stickyChildren = [];
            const outlineElementsArray = Array.from(outlineElements.values()).sort((element1, element2) => {
                const range1 = new stickyScrollElement_1.StickyRange(element1.symbol.range.startLineNumber, element1.symbol.range.endLineNumber);
                const range2 = new stickyScrollElement_1.StickyRange(element2.symbol.range.startLineNumber, element2.symbol.range.endLineNumber);
                return this._comparator(range1, range2);
            });
            for (const outlineElement of outlineElementsArray) {
                stickyChildren.push(this._stickyModelFromOutlineElement(outlineElement, outlineElement.symbol.selectionRange.startLineNumber));
            }
            const stickyOutlineElement = new stickyScrollElement_1.StickyElement(undefined, stickyChildren, undefined);
            return {
                stickyOutlineElement: stickyOutlineElement,
                providerID: preferredProvider
            };
        }
        _stickyModelFromOutlineElement(outlineElement, previousStartLine) {
            const children = [];
            for (const child of outlineElement.children.values()) {
                if (child.symbol.selectionRange.startLineNumber !== child.symbol.range.endLineNumber) {
                    if (child.symbol.selectionRange.startLineNumber !== previousStartLine) {
                        children.push(this._stickyModelFromOutlineElement(child, child.symbol.selectionRange.startLineNumber));
                    }
                    else {
                        for (const subchild of child.children.values()) {
                            children.push(this._stickyModelFromOutlineElement(subchild, child.symbol.selectionRange.startLineNumber));
                        }
                    }
                }
            }
            children.sort((child1, child2) => this._comparator(child1.range, child2.range));
            const range = new stickyScrollElement_1.StickyRange(outlineElement.symbol.selectionRange.startLineNumber, outlineElement.symbol.range.endLineNumber);
            return new stickyScrollElement_1.StickyElement(range, children, undefined);
        }
        _comparator(range1, range2) {
            if (range1.startLineNumber !== range2.startLineNumber) {
                return range1.startLineNumber - range2.startLineNumber;
            }
            else {
                return range2.endLineNumber - range1.endLineNumber;
            }
        }
        _findSumOfRangesOfGroup(outline) {
            let res = 0;
            for (const child of outline.children.values()) {
                res += this._findSumOfRangesOfGroup(child);
            }
            if (outline instanceof outlineModel_1.OutlineElement) {
                return res + outline.symbol.range.endLineNumber - outline.symbol.selectionRange.startLineNumber;
            }
            else {
                return res;
            }
        }
    };
    StickyModelFromCandidateOutlineProvider = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], StickyModelFromCandidateOutlineProvider);
    class StickyModelFromCandidateFoldingProvider extends StickyModelCandidateProvider {
        constructor(editor) {
            super(editor);
            this._foldingLimitReporter = new folding_1.RangesLimitReporter(editor);
        }
        createStickyModel(token, model) {
            const foldingElement = this._fromFoldingRegions(model);
            const textModel = this._editor.getModel();
            return new stickyScrollElement_1.StickyModel(textModel.uri, textModel.getVersionId(), foldingElement, undefined);
        }
        isModelValid(model) {
            return model !== null;
        }
        _fromFoldingRegions(foldingRegions) {
            const length = foldingRegions.length;
            const orderedStickyElements = [];
            // The root sticky outline element
            const stickyOutlineElement = new stickyScrollElement_1.StickyElement(undefined, [], undefined);
            for (let i = 0; i < length; i++) {
                // Finding the parent index of the current range
                const parentIndex = foldingRegions.getParentIndex(i);
                let parentNode;
                if (parentIndex !== -1) {
                    // Access the reference of the parent node
                    parentNode = orderedStickyElements[parentIndex];
                }
                else {
                    // In that case the parent node is the root node
                    parentNode = stickyOutlineElement;
                }
                const child = new stickyScrollElement_1.StickyElement(new stickyScrollElement_1.StickyRange(foldingRegions.getStartLineNumber(i), foldingRegions.getEndLineNumber(i) + 1), [], parentNode);
                parentNode.children.push(child);
                orderedStickyElements.push(child);
            }
            return stickyOutlineElement;
        }
    }
    let StickyModelFromCandidateIndentationFoldingProvider = class StickyModelFromCandidateIndentationFoldingProvider extends StickyModelFromCandidateFoldingProvider {
        constructor(editor, _languageConfigurationService) {
            super(editor);
            this._languageConfigurationService = _languageConfigurationService;
            this.provider = this._register(new indentRangeProvider_1.IndentRangeProvider(editor.getModel(), this._languageConfigurationService, this._foldingLimitReporter));
        }
        async createModelFromProvider(token) {
            return this.provider.compute(token);
        }
    };
    StickyModelFromCandidateIndentationFoldingProvider = __decorate([
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], StickyModelFromCandidateIndentationFoldingProvider);
    let StickyModelFromCandidateSyntaxFoldingProvider = class StickyModelFromCandidateSyntaxFoldingProvider extends StickyModelFromCandidateFoldingProvider {
        constructor(editor, onProviderUpdate, _languageFeaturesService) {
            super(editor);
            this._languageFeaturesService = _languageFeaturesService;
            const selectedProviders = folding_1.FoldingController.getFoldingRangeProviders(this._languageFeaturesService, editor.getModel());
            if (selectedProviders.length > 0) {
                this.provider = this._register(new syntaxRangeProvider_1.SyntaxRangeProvider(editor.getModel(), selectedProviders, onProviderUpdate, this._foldingLimitReporter, undefined));
            }
        }
        isProviderValid() {
            return this.provider !== undefined;
        }
        async createModelFromProvider(token) {
            return this.provider?.compute(token) ?? null;
        }
    };
    StickyModelFromCandidateSyntaxFoldingProvider = __decorate([
        __param(2, languageFeatures_1.ILanguageFeaturesService)
    ], StickyModelFromCandidateSyntaxFoldingProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsTW9kZWxQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvc3RpY2t5U2Nyb2xsTW9kZWxQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFtQmhHLElBQUssYUFJSjtJQUpELFdBQUssYUFBYTtRQUNqQiwrQ0FBOEIsQ0FBQTtRQUM5QixnRUFBK0MsQ0FBQTtRQUMvQyx1REFBc0MsQ0FBQTtJQUN2QyxDQUFDLEVBSkksYUFBYSxLQUFiLGFBQWEsUUFJakI7SUFFRCxJQUFLLE1BSUo7SUFKRCxXQUFLLE1BQU07UUFDVixxQ0FBSyxDQUFBO1FBQ0wseUNBQU8sQ0FBQTtRQUNQLDJDQUFRLENBQUE7SUFDVCxDQUFDLEVBSkksTUFBTSxLQUFOLE1BQU0sUUFJVjtJQVlNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVU7UUFPbEQsWUFDa0IsT0FBMEIsRUFDM0MsZ0JBQTRCLEVBQ0wsNkJBQXFFLEVBQ2xFLHdCQUEyRDtZQUVyRixLQUFLLEVBQUUsQ0FBQztZQUxTLFlBQU8sR0FBUCxPQUFPLENBQW1CO1lBRVgsa0NBQTZCLEdBQTdCLDZCQUE2QixDQUErQjtZQUN6RCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBVDlFLG9CQUFlLEdBQXlDLEVBQUUsQ0FBQztZQUMzRCxrQkFBYSxHQUF5QyxJQUFJLENBQUM7WUFDM0QscUJBQWdCLEdBQWdDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLENBQXFCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDNUYscUJBQWdCLEdBQW9CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZ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