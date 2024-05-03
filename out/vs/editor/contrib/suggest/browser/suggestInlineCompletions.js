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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/editorFeatures", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/suggest/browser/completionModel", "vs/editor/contrib/suggest/browser/suggest", "vs/editor/contrib/suggest/browser/suggestMemory", "vs/editor/contrib/suggest/browser/suggestModel", "vs/editor/contrib/suggest/browser/wordDistance", "vs/platform/clipboard/common/clipboardService"], function (require, exports, cancellation_1, filters_1, iterator_1, lifecycle_1, codeEditorService_1, range_1, editorFeatures_1, languageFeatures_1, completionModel_1, suggest_1, suggestMemory_1, suggestModel_1, wordDistance_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestInlineCompletions = void 0;
    class SuggestInlineCompletion {
        constructor(range, insertText, filterText, additionalTextEdits, command, completion) {
            this.range = range;
            this.insertText = insertText;
            this.filterText = filterText;
            this.additionalTextEdits = additionalTextEdits;
            this.command = command;
            this.completion = completion;
        }
    }
    let InlineCompletionResults = class InlineCompletionResults extends lifecycle_1.RefCountedDisposable {
        constructor(model, line, word, completionModel, completions, _suggestMemoryService) {
            super(completions.disposable);
            this.model = model;
            this.line = line;
            this.word = word;
            this.completionModel = completionModel;
            this._suggestMemoryService = _suggestMemoryService;
        }
        canBeReused(model, line, word) {
            return this.model === model // same model
                && this.line === line
                && this.word.word.length > 0
                && this.word.startColumn === word.startColumn && this.word.endColumn < word.endColumn // same word
                && this.completionModel.getIncompleteProvider().size === 0; // no incomplete results
        }
        get items() {
            const result = [];
            // Split items by preselected index. This ensures the memory-selected item shows first and that better/worst
            // ranked items are before/after
            const { items } = this.completionModel;
            const selectedIndex = this._suggestMemoryService.select(this.model, { lineNumber: this.line, column: this.word.endColumn + this.completionModel.lineContext.characterCountDelta }, items);
            const first = iterator_1.Iterable.slice(items, selectedIndex);
            const second = iterator_1.Iterable.slice(items, 0, selectedIndex);
            let resolveCount = 5;
            for (const item of iterator_1.Iterable.concat(first, second)) {
                if (item.score === filters_1.FuzzyScore.Default) {
                    // skip items that have no overlap
                    continue;
                }
                const range = new range_1.Range(item.editStart.lineNumber, item.editStart.column, item.editInsertEnd.lineNumber, item.editInsertEnd.column + this.completionModel.lineContext.characterCountDelta // end PLUS character delta
                );
                const insertText = item.completion.insertTextRules && (item.completion.insertTextRules & 4 /* CompletionItemInsertTextRule.InsertAsSnippet */)
                    ? { snippet: item.completion.insertText }
                    : item.completion.insertText;
                result.push(new SuggestInlineCompletion(range, insertText, item.filterTextLow ?? item.labelLow, item.completion.additionalTextEdits, item.completion.command, item));
                // resolve the first N suggestions eagerly
                if (resolveCount-- >= 0) {
                    item.resolve(cancellation_1.CancellationToken.None);
                }
            }
            return result;
        }
    };
    InlineCompletionResults = __decorate([
        __param(5, suggestMemory_1.ISuggestMemoryService)
    ], InlineCompletionResults);
    let SuggestInlineCompletions = class SuggestInlineCompletions extends lifecycle_1.Disposable {
        constructor(_languageFeatureService, _clipboardService, _suggestMemoryService, _editorService) {
            super();
            this._languageFeatureService = _languageFeatureService;
            this._clipboardService = _clipboardService;
            this._suggestMemoryService = _suggestMemoryService;
            this._editorService = _editorService;
            this._store.add(_languageFeatureService.inlineCompletionsProvider.register('*', this));
        }
        async provideInlineCompletions(model, position, context, token) {
            if (context.selectedSuggestionInfo) {
                return;
            }
            let editor;
            for (const candidate of this._editorService.listCodeEditors()) {
                if (candidate.getModel() === model) {
                    editor = candidate;
                    break;
                }
            }
            if (!editor) {
                return;
            }
            const config = editor.getOption(89 /* EditorOption.quickSuggestions */);
            if (suggest_1.QuickSuggestionsOptions.isAllOff(config)) {
                // quick suggest is off (for this model/language)
                return;
            }
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            const lineTokens = model.tokenization.getLineTokens(position.lineNumber);
            const tokenType = lineTokens.getStandardTokenType(lineTokens.findTokenIndexAtOffset(Math.max(position.column - 1 - 1, 0)));
            if (suggest_1.QuickSuggestionsOptions.valueFor(config, tokenType) !== 'inline') {
                // quick suggest is off (for this token)
                return undefined;
            }
            // We consider non-empty leading words and trigger characters. The latter only
            // when no word is being typed (word characters superseed trigger characters)
            let wordInfo = model.getWordAtPosition(position);
            let triggerCharacterInfo;
            if (!wordInfo?.word) {
                triggerCharacterInfo = this._getTriggerCharacterInfo(model, position);
            }
            if (!wordInfo?.word && !triggerCharacterInfo) {
                // not at word, not a trigger character
                return;
            }
            // ensure that we have word information and that we are at the end of a word
            // otherwise we stop because we don't want to do quick suggestions inside words
            if (!wordInfo) {
                wordInfo = model.getWordUntilPosition(position);
            }
            if (wordInfo.endColumn !== position.column) {
                return;
            }
            let result;
            const leadingLineContents = model.getValueInRange(new range_1.Range(position.lineNumber, 1, position.lineNumber, position.column));
            if (!triggerCharacterInfo && this._lastResult?.canBeReused(model, position.lineNumber, wordInfo)) {
                // reuse a previous result iff possible, only a refilter is needed
                // TODO@jrieken this can be improved further and only incomplete results can be updated
                // console.log(`REUSE with ${wordInfo.word}`);
                const newLineContext = new completionModel_1.LineContext(leadingLineContents, position.column - this._lastResult.word.endColumn);
                this._lastResult.completionModel.lineContext = newLineContext;
                this._lastResult.acquire();
                result = this._lastResult;
            }
            else {
                // refesh model is required
                const completions = await (0, suggest_1.provideSuggestionItems)(this._languageFeatureService.completionProvider, model, position, new suggest_1.CompletionOptions(undefined, suggestModel_1.SuggestModel.createSuggestFilter(editor).itemKind, triggerCharacterInfo?.providers), triggerCharacterInfo && { triggerKind: 1 /* CompletionTriggerKind.TriggerCharacter */, triggerCharacter: triggerCharacterInfo.ch }, token);
                let clipboardText;
                if (completions.needsClipboard) {
                    clipboardText = await this._clipboardService.readText();
                }
                const completionModel = new completionModel_1.CompletionModel(completions.items, position.column, new completionModel_1.LineContext(leadingLineContents, 0), wordDistance_1.WordDistance.None, editor.getOption(118 /* EditorOption.suggest */), editor.getOption(112 /* EditorOption.snippetSuggestions */), { boostFullMatch: false, firstMatchCanBeWeak: false }, clipboardText);
                result = new InlineCompletionResults(model, position.lineNumber, wordInfo, completionModel, completions, this._suggestMemoryService);
            }
            this._lastResult = result;
            return result;
        }
        handleItemDidShow(_completions, item) {
            item.completion.resolve(cancellation_1.CancellationToken.None);
        }
        freeInlineCompletions(result) {
            result.release();
        }
        _getTriggerCharacterInfo(model, position) {
            const ch = model.getValueInRange(range_1.Range.fromPositions({ lineNumber: position.lineNumber, column: position.column - 1 }, position));
            const providers = new Set();
            for (const provider of this._languageFeatureService.completionProvider.all(model)) {
                if (provider.triggerCharacters?.includes(ch)) {
                    providers.add(provider);
                }
            }
            if (providers.size === 0) {
                return undefined;
            }
            return { providers, ch };
        }
    };
    exports.SuggestInlineCompletions = SuggestInlineCompletions;
    exports.SuggestInlineCompletions = SuggestInlineCompletions = __decorate([
        __param(0, languageFeatures_1.ILanguageFeaturesService),
        __param(1, clipboardService_1.IClipboardService),
        __param(2, suggestMemory_1.ISuggestMemoryService),
        __param(3, codeEditorService_1.ICodeEditorService)
    ], SuggestInlineCompletions);
    (0, editorFeatures_1.registerEditorFeature)(SuggestInlineCompletions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdElubGluZUNvbXBsZXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvc3VnZ2VzdElubGluZUNvbXBsZXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXdCaEcsTUFBTSx1QkFBdUI7UUFFNUIsWUFDVSxLQUFhLEVBQ2IsVUFBd0MsRUFDeEMsVUFBa0IsRUFDbEIsbUJBQXVELEVBQ3ZELE9BQTRCLEVBQzVCLFVBQTBCO1lBTDFCLFVBQUssR0FBTCxLQUFLLENBQVE7WUFDYixlQUFVLEdBQVYsVUFBVSxDQUE4QjtZQUN4QyxlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBb0M7WUFDdkQsWUFBTyxHQUFQLE9BQU8sQ0FBcUI7WUFDNUIsZUFBVSxHQUFWLFVBQVUsQ0FBZ0I7UUFDaEMsQ0FBQztLQUNMO0lBRUQsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxnQ0FBb0I7UUFFekQsWUFDVSxLQUFpQixFQUNqQixJQUFZLEVBQ1osSUFBcUIsRUFDckIsZUFBZ0MsRUFDekMsV0FBZ0MsRUFDUSxxQkFBNEM7WUFFcEYsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQVByQixVQUFLLEdBQUwsS0FBSyxDQUFZO1lBQ2pCLFNBQUksR0FBSixJQUFJLENBQVE7WUFDWixTQUFJLEdBQUosSUFBSSxDQUFpQjtZQUNyQixvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7WUFFRCwwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1FBR3JGLENBQUM7UUFFRCxXQUFXLENBQUMsS0FBaUIsRUFBRSxJQUFZLEVBQUUsSUFBcUI7WUFDakUsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxhQUFhO21CQUNyQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUk7bUJBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDO21CQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWTttQkFDL0YsSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyx3QkFBd0I7UUFDdEYsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLE1BQU0sTUFBTSxHQUE4QixFQUFFLENBQUM7WUFFN0MsNEdBQTRHO1lBQzVHLGdDQUFnQztZQUNoQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUN2QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxTCxNQUFNLEtBQUssR0FBRyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDbkQsTUFBTSxNQUFNLEdBQUcsbUJBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUV2RCxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7WUFFckIsS0FBSyxNQUFNLElBQUksSUFBSSxtQkFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFFbkQsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLG9CQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3ZDLGtDQUFrQztvQkFDbEMsU0FBUztnQkFDVixDQUFDO2dCQUVELE1BQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFDaEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsMkJBQTJCO2lCQUMzSSxDQUFDO2dCQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsZUFBZSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxlQUFlLHVEQUErQyxDQUFDO29CQUNySSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUU7b0JBQ3pDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztnQkFFOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLHVCQUF1QixDQUN0QyxLQUFLLEVBQ0wsVUFBVSxFQUNWLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFFBQVEsRUFDbkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsRUFDbkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQ3ZCLElBQUksQ0FDSixDQUFDLENBQUM7Z0JBRUgsMENBQTBDO2dCQUMxQyxJQUFJLFlBQVksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0QyxDQUFDO1lBQ0YsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztLQUNELENBQUE7SUFoRUssdUJBQXVCO1FBUTFCLFdBQUEscUNBQXFCLENBQUE7T0FSbEIsdUJBQXVCLENBZ0U1QjtJQUdNLElBQU0sd0JBQXdCLEdBQTlCLE1BQU0sd0JBQXlCLFNBQVEsc0JBQVU7UUFJdkQsWUFDNEMsdUJBQWlELEVBQ3hELGlCQUFvQyxFQUNoQyxxQkFBNEMsRUFDL0MsY0FBa0M7WUFFdkUsS0FBSyxFQUFFLENBQUM7WUFMbUMsNEJBQXVCLEdBQXZCLHVCQUF1QixDQUEwQjtZQUN4RCxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW1CO1lBQ2hDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsbUJBQWMsR0FBZCxjQUFjLENBQW9CO1lBR3ZFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN4RixDQUFDO1FBRUQsS0FBSyxDQUFDLHdCQUF3QixDQUFDLEtBQWlCLEVBQUUsUUFBa0IsRUFBRSxPQUFnQyxFQUFFLEtBQXdCO1lBRS9ILElBQUksT0FBTyxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxNQUErQixDQUFDO1lBQ3BDLEtBQUssTUFBTSxTQUFTLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDO2dCQUMvRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBQztvQkFDcEMsTUFBTSxHQUFHLFNBQVMsQ0FBQztvQkFDbkIsTUFBTTtnQkFDUCxDQUFDO1lBQ0YsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLHdDQUErQixDQUFDO1lBQy9ELElBQUksaUNBQXVCLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7Z0JBQzlDLGlEQUFpRDtnQkFDakQsT0FBTztZQUNSLENBQUM7WUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3pFLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNILElBQUksaUNBQXVCLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDdEUsd0NBQXdDO2dCQUN4QyxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsOEVBQThFO1lBQzlFLDZFQUE2RTtZQUM3RSxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakQsSUFBSSxvQkFBd0YsQ0FBQztZQUU3RixJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUNyQixvQkFBb0IsR0FBRyxJQUFJLENBQUMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzlDLHVDQUF1QztnQkFDdkMsT0FBTztZQUNSLENBQUM7WUFFRCw0RUFBNEU7WUFDNUUsK0VBQStFO1lBQy9FLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDZixRQUFRLEdBQUcsS0FBSyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFDRCxJQUFJLFFBQVEsQ0FBQyxTQUFTLEtBQUssUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM1QyxPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksTUFBK0IsQ0FBQztZQUNwQyxNQUFNLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxhQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUMzSCxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbEcsa0VBQWtFO2dCQUNsRSx1RkFBdUY7Z0JBQ3ZGLDhDQUE4QztnQkFDOUMsTUFBTSxjQUFjLEdBQUcsSUFBSSw2QkFBVyxDQUFDLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQy9HLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7Z0JBQzlELElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBRTNCLENBQUM7aUJBQU0sQ0FBQztnQkFDUCwyQkFBMkI7Z0JBQzNCLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSxnQ0FBc0IsRUFDL0MsSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixFQUMvQyxLQUFLLEVBQUUsUUFBUSxFQUNmLElBQUksMkJBQWlCLENBQUMsU0FBUyxFQUFFLDJCQUFZLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxFQUNwSCxvQkFBb0IsSUFBSSxFQUFFLFdBQVcsZ0RBQXdDLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQzFILEtBQUssQ0FDTCxDQUFDO2dCQUVGLElBQUksYUFBaUMsQ0FBQztnQkFDdEMsSUFBSSxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ2hDLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDekQsQ0FBQztnQkFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLGlDQUFlLENBQzFDLFdBQVcsQ0FBQyxLQUFLLEVBQ2pCLFFBQVEsQ0FBQyxNQUFNLEVBQ2YsSUFBSSw2QkFBVyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxFQUN2QywyQkFBWSxDQUFDLElBQUksRUFDakIsTUFBTSxDQUFDLFNBQVMsZ0NBQXNCLEVBQ3RDLE1BQU0sQ0FBQyxTQUFTLDJDQUFpQyxFQUNqRCxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLEVBQ3JELGFBQWEsQ0FDYixDQUFDO2dCQUNGLE1BQU0sR0FBRyxJQUFJLHVCQUF1QixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1lBQ3RJLENBQUM7WUFFRCxJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQztZQUMxQixPQUFPLE1BQU0sQ0FBQztRQUNmLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxZQUFxQyxFQUFFLElBQTZCO1lBQ3JGLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxNQUErQjtZQUNwRCxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEIsQ0FBQztRQUVPLHdCQUF3QixDQUFDLEtBQWlCLEVBQUUsUUFBbUI7WUFDdEUsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsSSxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBMEIsQ0FBQztZQUNwRCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbkYsSUFBSSxRQUFRLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7b0JBQzlDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7WUFDRixDQUFDO1lBQ0QsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUMxQixPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBQ0QsT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMxQixDQUFDO0tBQ0QsQ0FBQTtJQXJJWSw0REFBd0I7dUNBQXhCLHdCQUF3QjtRQUtsQyxXQUFBLDJDQUF3QixDQUFBO1FBQ3hCLFdBQUEsb0NBQWlCLENBQUE7UUFDakIsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHNDQUFrQixDQUFBO09BUlIsd0JBQXdCLENBcUlwQztJQUdELElBQUEsc0NBQXFCLEVBQUMsd0JBQXdCLENBQUMsQ0FBQyJ9