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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/strings", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/snippet/browser/snippetParser", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets", "vs/workbench/contrib/snippets/browser/snippetsFile", "vs/base/common/filters", "vs/base/common/stopwatch", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/commands/common/commands"], function (require, exports, htmlContent_1, strings_1, position_1, range_1, language_1, snippetParser_1, nls_1, snippets_1, snippetsFile_1, filters_1, stopwatch_1, languageConfigurationRegistry_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SnippetCompletionProvider = exports.SnippetCompletion = void 0;
    const markSnippetAsUsed = '_snippet.markAsUsed';
    commands_1.CommandsRegistry.registerCommand(markSnippetAsUsed, (accessor, ...args) => {
        const snippetsService = accessor.get(snippets_1.ISnippetsService);
        const [first] = args;
        if (first instanceof snippetsFile_1.Snippet) {
            snippetsService.updateUsageTimestamp(first);
        }
    });
    class SnippetCompletion {
        constructor(snippet, range) {
            this.snippet = snippet;
            this.label = { label: snippet.prefix, description: snippet.name };
            this.detail = (0, nls_1.localize)('detail.snippet', "{0} ({1})", snippet.description || snippet.name, snippet.source);
            this.insertText = snippet.codeSnippet;
            this.extensionId = snippet.extensionId;
            this.range = range;
            this.sortText = `${snippet.snippetSource === 3 /* SnippetSource.Extension */ ? 'z' : 'a'}-${snippet.prefix}`;
            this.kind = 27 /* CompletionItemKind.Snippet */;
            this.insertTextRules = 4 /* CompletionItemInsertTextRule.InsertAsSnippet */;
            this.command = { id: markSnippetAsUsed, title: '', arguments: [snippet] };
        }
        resolve() {
            this.documentation = new htmlContent_1.MarkdownString().appendCodeblock('', snippetParser_1.SnippetParser.asInsertText(this.snippet.codeSnippet));
            return this;
        }
        static compareByLabel(a, b) {
            return (0, strings_1.compare)(a.label.label, b.label.label);
        }
    }
    exports.SnippetCompletion = SnippetCompletion;
    let SnippetCompletionProvider = class SnippetCompletionProvider {
        constructor(_languageService, _snippets, _languageConfigurationService) {
            this._languageService = _languageService;
            this._snippets = _snippets;
            this._languageConfigurationService = _languageConfigurationService;
            this._debugDisplayName = 'snippetCompletions';
            //
        }
        async provideCompletionItems(model, position, context) {
            const sw = new stopwatch_1.StopWatch();
            // compute all snippet anchors: word starts and every non word character
            const line = position.lineNumber;
            const word = model.getWordAtPosition(position) ?? { startColumn: position.column, endColumn: position.column, word: '' };
            const lineContentLow = model.getLineContent(position.lineNumber).toLowerCase();
            const lineContentWithWordLow = lineContentLow.substring(0, word.startColumn + word.word.length - 1);
            const anchors = this._computeSnippetPositions(model, line, word, lineContentWithWordLow);
            // loop over possible snippets and match them against the anchors
            const columnOffset = position.column - 1;
            const triggerCharacterLow = context.triggerCharacter?.toLowerCase() ?? '';
            const languageId = this._getLanguageIdAtPosition(model, position);
            const languageConfig = this._languageConfigurationService.getLanguageConfiguration(languageId);
            const snippets = new Set(await this._snippets.getSnippets(languageId));
            const suggestions = [];
            for (const snippet of snippets) {
                if (context.triggerKind === 1 /* CompletionTriggerKind.TriggerCharacter */ && !snippet.prefixLow.startsWith(triggerCharacterLow)) {
                    // strict -> when having trigger characters they must prefix-match
                    continue;
                }
                let candidate;
                for (const anchor of anchors) {
                    if (anchor.prefixLow.match(/^\s/) && !snippet.prefixLow.match(/^\s/)) {
                        // only allow whitespace anchor when snippet prefix starts with whitespace too
                        continue;
                    }
                    if ((0, filters_1.isPatternInWord)(anchor.prefixLow, 0, anchor.prefixLow.length, snippet.prefixLow, 0, snippet.prefixLow.length)) {
                        candidate = anchor;
                        break;
                    }
                }
                if (!candidate) {
                    continue;
                }
                const pos = candidate.startColumn - 1;
                const prefixRestLen = snippet.prefixLow.length - (columnOffset - pos);
                const endsWithPrefixRest = (0, strings_1.compareSubstring)(lineContentLow, snippet.prefixLow, columnOffset, columnOffset + prefixRestLen, columnOffset - pos);
                const startPosition = position.with(undefined, pos + 1);
                let endColumn = endsWithPrefixRest === 0 ? position.column + prefixRestLen : position.column;
                // First check if there is anything to the right of the cursor
                if (columnOffset < lineContentLow.length) {
                    const autoClosingPairs = languageConfig.getAutoClosingPairs();
                    const standardAutoClosingPairConditionals = autoClosingPairs.autoClosingPairsCloseSingleChar.get(lineContentLow[columnOffset]);
                    // If the character to the right of the cursor is a closing character of an autoclosing pair
                    if (standardAutoClosingPairConditionals?.some(p => 
                    // and the start position is the opening character of an autoclosing pair
                    p.open === lineContentLow[startPosition.column - 1] &&
                        // and the snippet prefix contains the opening and closing pair at its edges
                        snippet.prefix.startsWith(p.open) &&
                        snippet.prefix[snippet.prefix.length - 1] === p.close)) {
                        // Eat the character that was likely inserted because of auto-closing pairs
                        endColumn++;
                    }
                }
                const replace = range_1.Range.fromPositions({ lineNumber: line, column: candidate.startColumn }, { lineNumber: line, column: endColumn });
                const insert = replace.setEndPosition(line, position.column);
                suggestions.push(new SnippetCompletion(snippet, { replace, insert }));
                snippets.delete(snippet);
            }
            // add remaing snippets when the current prefix ends in whitespace or when line is empty
            // and when not having a trigger character
            if (!triggerCharacterLow && (/\s/.test(lineContentLow[position.column - 2]) /*end in whitespace */ || !lineContentLow /*empty line*/)) {
                for (const snippet of snippets) {
                    const insert = range_1.Range.fromPositions(position);
                    const replace = lineContentLow.indexOf(snippet.prefixLow, columnOffset) === columnOffset ? insert.setEndPosition(position.lineNumber, position.column + snippet.prefixLow.length) : insert;
                    suggestions.push(new SnippetCompletion(snippet, { replace, insert }));
                }
            }
            // dismbiguate suggestions with same labels
            this._disambiguateSnippets(suggestions);
            return {
                suggestions,
                duration: sw.elapsed()
            };
        }
        _disambiguateSnippets(suggestions) {
            suggestions.sort(SnippetCompletion.compareByLabel);
            for (let i = 0; i < suggestions.length; i++) {
                const item = suggestions[i];
                let to = i + 1;
                for (; to < suggestions.length && item.label === suggestions[to].label; to++) {
                    suggestions[to].label.label = (0, nls_1.localize)('snippetSuggest.longLabel', "{0}, {1}", suggestions[to].label.label, suggestions[to].snippet.name);
                }
                if (to > i + 1) {
                    suggestions[i].label.label = (0, nls_1.localize)('snippetSuggest.longLabel', "{0}, {1}", suggestions[i].label.label, suggestions[i].snippet.name);
                    i = to;
                }
            }
        }
        resolveCompletionItem(item) {
            return (item instanceof SnippetCompletion) ? item.resolve() : item;
        }
        _computeSnippetPositions(model, line, word, lineContentWithWordLow) {
            const result = [];
            for (let column = 1; column < word.startColumn; column++) {
                const wordInfo = model.getWordAtPosition(new position_1.Position(line, column));
                result.push({
                    startColumn: column,
                    prefixLow: lineContentWithWordLow.substring(column - 1),
                    isWord: Boolean(wordInfo)
                });
                if (wordInfo) {
                    column = wordInfo.endColumn;
                    // the character right after a word is an anchor, always
                    result.push({
                        startColumn: wordInfo.endColumn,
                        prefixLow: lineContentWithWordLow.substring(wordInfo.endColumn - 1),
                        isWord: false
                    });
                }
            }
            if (word.word.length > 0 || result.length === 0) {
                result.push({
                    startColumn: word.startColumn,
                    prefixLow: lineContentWithWordLow.substring(word.startColumn - 1),
                    isWord: true
                });
            }
            return result;
        }
        _getLanguageIdAtPosition(model, position) {
            // validate the `languageId` to ensure this is a user
            // facing language with a name and the chance to have
            // snippets, else fall back to the outer language
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            let languageId = model.getLanguageIdAtPosition(position.lineNumber, position.column);
            if (!this._languageService.getLanguageName(languageId)) {
                languageId = model.getLanguageId();
            }
            return languageId;
        }
    };
    exports.SnippetCompletionProvider = SnippetCompletionProvider;
    exports.SnippetCompletionProvider = SnippetCompletionProvider = __decorate([
        __param(0, language_1.ILanguageService),
        __param(1, snippets_1.ISnippetsService),
        __param(2, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetCompletionProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25pcHBldENvbXBsZXRpb25Qcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvc25pcHBldHMvYnJvd3Nlci9zbmlwcGV0Q29tcGxldGlvblByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQXFCaEcsTUFBTSxpQkFBaUIsR0FBRyxxQkFBcUIsQ0FBQztJQUVoRCwyQkFBZ0IsQ0FBQyxlQUFlLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLEVBQUUsRUFBRTtRQUN6RSxNQUFNLGVBQWUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7UUFDdkQsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztRQUNyQixJQUFJLEtBQUssWUFBWSxzQkFBTyxFQUFFLENBQUM7WUFDOUIsZUFBZSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdDLENBQUM7SUFDRixDQUFDLENBQUMsQ0FBQztJQUVILE1BQWEsaUJBQWlCO1FBYTdCLFlBQ1UsT0FBZ0IsRUFDekIsS0FBbUQ7WUFEMUMsWUFBTyxHQUFQLE9BQU8sQ0FBUztZQUd6QixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsRSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxPQUFPLENBQUMsV0FBVyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNHLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FB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