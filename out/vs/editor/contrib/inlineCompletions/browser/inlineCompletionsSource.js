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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/common/core/position", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/inlineCompletions/browser/provideInlineCompletions", "vs/editor/common/core/textEdit", "vs/editor/contrib/inlineCompletions/browser/singleTextEdit"], function (require, exports, cancellation_1, filters_1, lifecycle_1, observable_1, position_1, languages_1, languageConfigurationRegistry_1, languageFeatures_1, provideInlineCompletions_1, textEdit_1, singleTextEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineCompletionWithUpdatedRange = exports.UpToDateInlineCompletions = exports.InlineCompletionsSource = void 0;
    let InlineCompletionsSource = class InlineCompletionsSource extends lifecycle_1.Disposable {
        constructor(textModel, versionId, _debounceValue, languageFeaturesService, languageConfigurationService) {
            super();
            this.textModel = textModel;
            this.versionId = versionId;
            this._debounceValue = _debounceValue;
            this.languageFeaturesService = languageFeaturesService;
            this.languageConfigurationService = languageConfigurationService;
            this._updateOperation = this._register(new lifecycle_1.MutableDisposable());
            this.inlineCompletions = (0, observable_1.disposableObservableValue)('inlineCompletions', undefined);
            this.suggestWidgetInlineCompletions = (0, observable_1.disposableObservableValue)('suggestWidgetInlineCompletions', undefined);
            this._register(this.textModel.onDidChangeContent(() => {
                this._updateOperation.clear();
            }));
        }
        fetch(position, context, activeInlineCompletion) {
            const request = new UpdateRequest(position, context, this.textModel.getVersionId());
            const target = context.selectedSuggestionInfo ? this.suggestWidgetInlineCompletions : this.inlineCompletions;
            if (this._updateOperation.value?.request.satisfies(request)) {
                return this._updateOperation.value.promise;
            }
            else if (target.get()?.request.satisfies(request)) {
                return Promise.resolve(true);
            }
            const updateOngoing = !!this._updateOperation.value;
            this._updateOperation.clear();
            const source = new cancellation_1.CancellationTokenSource();
            const promise = (async () => {
                const shouldDebounce = updateOngoing || context.triggerKind === languages_1.InlineCompletionTriggerKind.Automatic;
                if (shouldDebounce) {
                    // This debounces the operation
                    await wait(this._debounceValue.get(this.textModel), source.token);
                }
                if (source.token.isCancellationRequested || this.textModel.getVersionId() !== request.versionId) {
                    return false;
                }
                const startTime = new Date();
                const updatedCompletions = await (0, provideInlineCompletions_1.provideInlineCompletions)(this.languageFeaturesService.inlineCompletionsProvider, position, this.textModel, context, source.token, this.languageConfigurationService);
                if (source.token.isCancellationRequested || this.textModel.getVersionId() !== request.versionId) {
                    return false;
                }
                const endTime = new Date();
                this._debounceValue.update(this.textModel, endTime.getTime() - startTime.getTime());
                const completions = new UpToDateInlineCompletions(updatedCompletions, request, this.textModel, this.versionId);
                if (activeInlineCompletion) {
                    const asInlineCompletion = activeInlineCompletion.toInlineCompletion(undefined);
                    if (activeInlineCompletion.canBeReused(this.textModel, position) && !updatedCompletions.has(asInlineCompletion)) {
                        completions.prepend(activeInlineCompletion.inlineCompletion, asInlineCompletion.range, true);
                    }
                }
                this._updateOperation.clear();
                (0, observable_1.transaction)(tx => {
                    /** @description Update completions with provider result */
                    target.set(completions, tx);
                });
                return true;
            })();
            const updateOperation = new UpdateOperation(request, source, promise);
            this._updateOperation.value = updateOperation;
            return promise;
        }
        clear(tx) {
            this._updateOperation.clear();
            this.inlineCompletions.set(undefined, tx);
            this.suggestWidgetInlineCompletions.set(undefined, tx);
        }
        clearSuggestWidgetInlineCompletions(tx) {
            if (this._updateOperation.value?.request.context.selectedSuggestionInfo) {
                this._updateOperation.clear();
            }
            this.suggestWidgetInlineCompletions.set(undefined, tx);
        }
        cancelUpdate() {
            this._updateOperation.clear();
        }
    };
    exports.InlineCompletionsSource = InlineCompletionsSource;
    exports.InlineCompletionsSource = InlineCompletionsSource = __decorate([
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], InlineCompletionsSource);
    function wait(ms, cancellationToken) {
        return new Promise(resolve => {
            let d = undefined;
            const handle = setTimeout(() => {
                if (d) {
                    d.dispose();
                }
                resolve();
            }, ms);
            if (cancellationToken) {
                d = cancellationToken.onCancellationRequested(() => {
                    clearTimeout(handle);
                    if (d) {
                        d.dispose();
                    }
                    resolve();
                });
            }
        });
    }
    class UpdateRequest {
        constructor(position, context, versionId) {
            this.position = position;
            this.context = context;
            this.versionId = versionId;
        }
        satisfies(other) {
            return this.position.equals(other.position)
                && equals(this.context.selectedSuggestionInfo, other.context.selectedSuggestionInfo, (v1, v2) => v1.equals(v2))
                && (other.context.triggerKind === languages_1.InlineCompletionTriggerKind.Automatic
                    || this.context.triggerKind === languages_1.InlineCompletionTriggerKind.Explicit)
                && this.versionId === other.versionId;
        }
    }
    function equals(v1, v2, equals) {
        if (!v1 || !v2) {
            return v1 === v2;
        }
        return equals(v1, v2);
    }
    class UpdateOperation {
        constructor(request, cancellationTokenSource, promise) {
            this.request = request;
            this.cancellationTokenSource = cancellationTokenSource;
            this.promise = promise;
        }
        dispose() {
            this.cancellationTokenSource.cancel();
        }
    }
    class UpToDateInlineCompletions {
        get inlineCompletions() { return this._inlineCompletions; }
        constructor(inlineCompletionProviderResult, request, textModel, versionId) {
            this.inlineCompletionProviderResult = inlineCompletionProviderResult;
            this.request = request;
            this.textModel = textModel;
            this.versionId = versionId;
            this._refCount = 1;
            this._prependedInlineCompletionItems = [];
            this._rangeVersionIdValue = 0;
            this._rangeVersionId = (0, observable_1.derived)(this, reader => {
                this.versionId.read(reader);
                let changed = false;
                for (const i of this._inlineCompletions) {
                    changed = changed || i._updateRange(this.textModel);
                }
                if (changed) {
                    this._rangeVersionIdValue++;
                }
                return this._rangeVersionIdValue;
            });
            const ids = textModel.deltaDecorations([], inlineCompletionProviderResult.completions.map(i => ({
                range: i.range,
                options: {
                    description: 'inline-completion-tracking-range'
                },
            })));
            this._inlineCompletions = inlineCompletionProviderResult.completions.map((i, index) => new InlineCompletionWithUpdatedRange(i, ids[index], this._rangeVersionId));
        }
        clone() {
            this._refCount++;
            return this;
        }
        dispose() {
            this._refCount--;
            if (this._refCount === 0) {
                setTimeout(() => {
                    // To fix https://github.com/microsoft/vscode/issues/188348
                    if (!this.textModel.isDisposed()) {
                        // This is just cleanup. It's ok if it happens with a delay.
                        this.textModel.deltaDecorations(this._inlineCompletions.map(i => i.decorationId), []);
                    }
                }, 0);
                this.inlineCompletionProviderResult.dispose();
                for (const i of this._prependedInlineCompletionItems) {
                    i.source.removeRef();
                }
            }
        }
        prepend(inlineCompletion, range, addRefToSource) {
            if (addRefToSource) {
                inlineCompletion.source.addRef();
            }
            const id = this.textModel.deltaDecorations([], [{
                    range,
                    options: {
                        description: 'inline-completion-tracking-range'
                    },
                }])[0];
            this._inlineCompletions.unshift(new InlineCompletionWithUpdatedRange(inlineCompletion, id, this._rangeVersionId, range));
            this._prependedInlineCompletionItems.push(inlineCompletion);
        }
    }
    exports.UpToDateInlineCompletions = UpToDateInlineCompletions;
    class InlineCompletionWithUpdatedRange {
        get forwardStable() {
            return this.inlineCompletion.source.inlineCompletions.enableForwardStability ?? false;
        }
        constructor(inlineCompletion, decorationId, rangeVersion, initialRange) {
            this.inlineCompletion = inlineCompletion;
            this.decorationId = decorationId;
            this.rangeVersion = rangeVersion;
            this.semanticId = JSON.stringify([
                this.inlineCompletion.filterText,
                this.inlineCompletion.insertText,
                this.inlineCompletion.range.getStartPosition().toString()
            ]);
            this._isValid = true;
            this._updatedRange = initialRange ?? inlineCompletion.range;
        }
        toInlineCompletion(reader) {
            return this.inlineCompletion.withRange(this._getUpdatedRange(reader));
        }
        toSingleTextEdit(reader) {
            return new textEdit_1.SingleTextEdit(this._getUpdatedRange(reader), this.inlineCompletion.insertText);
        }
        isVisible(model, cursorPosition, reader) {
            const minimizedReplacement = (0, singleTextEdit_1.singleTextRemoveCommonPrefix)(this._toFilterTextReplacement(reader), model);
            if (!this._isValid
                || !this.inlineCompletion.range.getStartPosition().equals(this._getUpdatedRange(reader).getStartPosition())
                || cursorPosition.lineNumber !== minimizedReplacement.range.startLineNumber) {
                return false;
            }
            // We might consider comparing by .toLowerText, but this requires GhostTextReplacement
            const originalValue = model.getValueInRange(minimizedReplacement.range, 1 /* EndOfLinePreference.LF */);
            const filterText = minimizedReplacement.text;
            const cursorPosIndex = Math.max(0, cursorPosition.column - minimizedReplacement.range.startColumn);
            let filterTextBefore = filterText.substring(0, cursorPosIndex);
            let filterTextAfter = filterText.substring(cursorPosIndex);
            let originalValueBefore = originalValue.substring(0, cursorPosIndex);
            let originalValueAfter = originalValue.substring(cursorPosIndex);
            const originalValueIndent = model.getLineIndentColumn(minimizedReplacement.range.startLineNumber);
            if (minimizedReplacement.range.startColumn <= originalValueIndent) {
                // Remove indentation
                originalValueBefore = originalValueBefore.trimStart();
                if (originalValueBefore.length === 0) {
                    originalValueAfter = originalValueAfter.trimStart();
                }
                filterTextBefore = filterTextBefore.trimStart();
                if (filterTextBefore.length === 0) {
                    filterTextAfter = filterTextAfter.trimStart();
                }
            }
            return filterTextBefore.startsWith(originalValueBefore)
                && !!(0, filters_1.matchesSubString)(originalValueAfter, filterTextAfter);
        }
        canBeReused(model, position) {
            const result = this._isValid
                && this._getUpdatedRange(undefined).containsPosition(position)
                && this.isVisible(model, position, undefined)
                && !this._isSmallerThanOriginal(undefined);
            return result;
        }
        _toFilterTextReplacement(reader) {
            return new textEdit_1.SingleTextEdit(this._getUpdatedRange(reader), this.inlineCompletion.filterText);
        }
        _isSmallerThanOriginal(reader) {
            return length(this._getUpdatedRange(reader)).isBefore(length(this.inlineCompletion.range));
        }
        _getUpdatedRange(reader) {
            this.rangeVersion.read(reader); // This makes sure all the ranges are updated.
            return this._updatedRange;
        }
        _updateRange(textModel) {
            const range = textModel.getDecorationRange(this.decorationId);
            if (!range) {
                // A setValue call might flush all decorations.
                this._isValid = false;
                return true;
            }
            if (!this._updatedRange.equalsRange(range)) {
                this._updatedRange = range;
                return true;
            }
            return false;
        }
    }
    exports.InlineCompletionWithUpdatedRange = InlineCompletionWithUpdatedRange;
    function length(range) {
        if (range.startLineNumber === range.endLineNumber) {
            return new position_1.Position(1, 1 + range.endColumn - range.startColumn);
        }
        else {
            return new position_1.Position(1 + range.endLineNumber - range.startLineNumber, range.endColumn);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ29tcGxldGlvbnNTb3VyY2UuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2lubGluZUNvbXBsZXRpb25zL2Jyb3dzZXIvaW5saW5lQ29tcGxldGlvbnNTb3VyY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUJ6RixJQUFNLHVCQUF1QixHQUE3QixNQUFNLHVCQUF3QixTQUFRLHNCQUFVO1FBS3RELFlBQ2tCLFNBQXFCLEVBQ3JCLFNBQThCLEVBQzlCLGNBQTJDLEVBQ2xDLHVCQUFrRSxFQUM3RCw0QkFBNEU7WUFFM0csS0FBSyxFQUFFLENBQUM7WUFOUyxjQUFTLEdBQVQsU0FBUyxDQUFZO1lBQ3JCLGNBQVMsR0FBVCxTQUFTLENBQXFCO1lBQzlCLG1CQUFjLEdBQWQsY0FBYyxDQUE2QjtZQUNqQiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQzVDLGlDQUE0QixHQUE1Qiw0QkFBNEIsQ0FBK0I7WUFUM0YscUJBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFtQixDQUFDLENBQUM7WUFDN0Usc0JBQWlCLEdBQUcsSUFBQSxzQ0FBeUIsRUFBd0MsbUJBQW1CLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckgsbUNBQThCLEdBQUcsSUFBQSxzQ0FBeUIsRUFBd0MsZ0NBQWdDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFXOUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRTtnQkFDckQsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO1lBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRU0sS0FBSyxDQUFDLFFBQWtCLEVB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