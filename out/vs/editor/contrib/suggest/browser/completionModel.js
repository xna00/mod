/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/filters", "vs/base/common/strings"], function (require, exports, arrays_1, filters_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompletionModel = exports.LineContext = void 0;
    class LineContext {
        constructor(leadingLineContent, characterCountDelta) {
            this.leadingLineContent = leadingLineContent;
            this.characterCountDelta = characterCountDelta;
        }
    }
    exports.LineContext = LineContext;
    var Refilter;
    (function (Refilter) {
        Refilter[Refilter["Nothing"] = 0] = "Nothing";
        Refilter[Refilter["All"] = 1] = "All";
        Refilter[Refilter["Incr"] = 2] = "Incr";
    })(Refilter || (Refilter = {}));
    /**
     * Sorted, filtered completion view model
     * */
    class CompletionModel {
        constructor(items, column, lineContext, wordDistance, options, snippetSuggestions, fuzzyScoreOptions = filters_1.FuzzyScoreOptions.default, clipboardText = undefined) {
            this.clipboardText = clipboardText;
            this._snippetCompareFn = CompletionModel._compareCompletionItems;
            this._items = items;
            this._column = column;
            this._wordDistance = wordDistance;
            this._options = options;
            this._refilterKind = 1 /* Refilter.All */;
            this._lineContext = lineContext;
            this._fuzzyScoreOptions = fuzzyScoreOptions;
            if (snippetSuggestions === 'top') {
                this._snippetCompareFn = CompletionModel._compareCompletionItemsSnippetsUp;
            }
            else if (snippetSuggestions === 'bottom') {
                this._snippetCompareFn = CompletionModel._compareCompletionItemsSnippetsDown;
            }
        }
        get lineContext() {
            return this._lineContext;
        }
        set lineContext(value) {
            if (this._lineContext.leadingLineContent !== value.leadingLineContent
                || this._lineContext.characterCountDelta !== value.characterCountDelta) {
                this._refilterKind = this._lineContext.characterCountDelta < value.characterCountDelta && this._filteredItems ? 2 /* Refilter.Incr */ : 1 /* Refilter.All */;
                this._lineContext = value;
            }
        }
        get items() {
            this._ensureCachedState();
            return this._filteredItems;
        }
        getItemsByProvider() {
            this._ensureCachedState();
            return this._itemsByProvider;
        }
        getIncompleteProvider() {
            this._ensureCachedState();
            const result = new Set();
            for (const [provider, items] of this.getItemsByProvider()) {
                if (items.length > 0 && items[0].container.incomplete) {
                    result.add(provider);
                }
            }
            return result;
        }
        get stats() {
            this._ensureCachedState();
            return this._stats;
        }
        _ensureCachedState() {
            if (this._refilterKind !== 0 /* Refilter.Nothing */) {
                this._createCachedState();
            }
        }
        _createCachedState() {
            this._itemsByProvider = new Map();
            const labelLengths = [];
            const { leadingLineContent, characterCountDelta } = this._lineContext;
            let word = '';
            let wordLow = '';
            // incrementally filter less
            const source = this._refilterKind === 1 /* Refilter.All */ ? this._items : this._filteredItems;
            const target = [];
            // picks a score function based on the number of
            // items that we have to score/filter and based on the
            // user-configuration
            const scoreFn = (!this._options.filterGraceful || source.length > 2000) ? filters_1.fuzzyScore : filters_1.fuzzyScoreGracefulAggressive;
            for (let i = 0; i < source.length; i++) {
                const item = source[i];
                if (item.isInvalid) {
                    continue; // SKIP invalid items
                }
                // keep all items by their provider
                const arr = this._itemsByProvider.get(item.provider);
                if (arr) {
                    arr.push(item);
                }
                else {
                    this._itemsByProvider.set(item.provider, [item]);
                }
                // 'word' is that remainder of the current line that we
                // filter and score against. In theory each suggestion uses a
                // different word, but in practice not - that's why we cache
                const overwriteBefore = item.position.column - item.editStart.column;
                const wordLen = overwriteBefore + characterCountDelta - (item.position.column - this._column);
                if (word.length !== wordLen) {
                    word = wordLen === 0 ? '' : leadingLineContent.slice(-wordLen);
                    wordLow = word.toLowerCase();
                }
                // remember the word against which this item was
                // scored
                item.word = word;
                if (wordLen === 0) {
                    // when there is nothing to score against, don't
                    // event try to do. Use a const rank and rely on
                    // the fallback-sort using the initial sort order.
                    // use a score of `-100` because that is out of the
                    // bound of values `fuzzyScore` will return
                    item.score = filters_1.FuzzyScore.Default;
                }
                else {
                    // skip word characters that are whitespace until
                    // we have hit the replace range (overwriteBefore)
                    let wordPos = 0;
                    while (wordPos < overwriteBefore) {
                        const ch = word.charCodeAt(wordPos);
                        if (ch === 32 /* CharCode.Space */ || ch === 9 /* CharCode.Tab */) {
                            wordPos += 1;
                        }
                        else {
                            break;
                        }
                    }
                    if (wordPos >= wordLen) {
                        // the wordPos at which scoring starts is the whole word
                        // and therefore the same rules as not having a word apply
                        item.score = filters_1.FuzzyScore.Default;
                    }
                    else if (typeof item.completion.filterText === 'string') {
                        // when there is a `filterText` it must match the `word`.
                        // if it matches we check with the label to compute highlights
                        // and if that doesn't yield a result we have no highlights,
                        // despite having the match
                        const match = scoreFn(word, wordLow, wordPos, item.completion.filterText, item.filterTextLow, 0, this._fuzzyScoreOptions);
                        if (!match) {
                            continue; // NO match
                        }
                        if ((0, strings_1.compareIgnoreCase)(item.completion.filterText, item.textLabel) === 0) {
                            // filterText and label are actually the same -> use good highlights
                            item.score = match;
                        }
                        else {
                            // re-run the scorer on the label in the hope of a result BUT use the rank
                            // of the filterText-match
                            item.score = (0, filters_1.anyScore)(word, wordLow, wordPos, item.textLabel, item.labelLow, 0);
                            item.score[0] = match[0]; // use score from filterText
                        }
                    }
                    else {
                        // by default match `word` against the `label`
                        const match = scoreFn(word, wordLow, wordPos, item.textLabel, item.labelLow, 0, this._fuzzyScoreOptions);
                        if (!match) {
                            continue; // NO match
                        }
                        item.score = match;
                    }
                }
                item.idx = i;
                item.distance = this._wordDistance.distance(item.position, item.completion);
                target.push(item);
                // update stats
                labelLengths.push(item.textLabel.length);
            }
            this._filteredItems = target.sort(this._snippetCompareFn);
            this._refilterKind = 0 /* Refilter.Nothing */;
            this._stats = {
                pLabelLen: labelLengths.length ?
                    (0, arrays_1.quickSelect)(labelLengths.length - .85, labelLengths, (a, b) => a - b)
                    : 0
            };
        }
        static _compareCompletionItems(a, b) {
            if (a.score[0] > b.score[0]) {
                return -1;
            }
            else if (a.score[0] < b.score[0]) {
                return 1;
            }
            else if (a.distance < b.distance) {
                return -1;
            }
            else if (a.distance > b.distance) {
                return 1;
            }
            else if (a.idx < b.idx) {
                return -1;
            }
            else if (a.idx > b.idx) {
                return 1;
            }
            else {
                return 0;
            }
        }
        static _compareCompletionItemsSnippetsDown(a, b) {
            if (a.completion.kind !== b.completion.kind) {
                if (a.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return 1;
                }
                else if (b.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return -1;
                }
            }
            return CompletionModel._compareCompletionItems(a, b);
        }
        static _compareCompletionItemsSnippetsUp(a, b) {
            if (a.completion.kind !== b.completion.kind) {
                if (a.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return -1;
                }
                else if (b.completion.kind === 27 /* CompletionItemKind.Snippet */) {
                    return 1;
                }
            }
            return CompletionModel._compareCompletionItems(a, b);
        }
    }
    exports.CompletionModel = CompletionModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvY29tcGxldGlvbk1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWlCaEcsTUFBYSxXQUFXO1FBQ3ZCLFlBQ1Usa0JBQTBCLEVBQzFCLG1CQUEyQjtZQUQzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQVE7WUFDMUIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFRO1FBQ2pDLENBQUM7S0FDTDtJQUxELGtDQUtDO0lBRUQsSUFBVyxRQUlWO0lBSkQsV0FBVyxRQUFRO1FBQ2xCLDZDQUFXLENBQUE7UUFDWCxxQ0FBTyxDQUFBO1FBQ1AsdUNBQVEsQ0FBQTtJQUNULENBQUMsRUFKVSxRQUFRLEtBQVIsUUFBUSxRQUlsQjtJQUVEOztTQUVLO0lBQ0wsTUFBYSxlQUFlO1FBZ0IzQixZQUNDLEtBQXVCLEVBQ3ZCLE1BQWMsRUFDZCxXQUF3QixFQUN4QixZQUEwQixFQUMxQixPQUErQixFQUMvQixrQkFBd0QsRUFDeEQsb0JBQW1ELDJCQUFpQixDQUFDLE9BQU8sRUFDbkUsZ0JBQW9DLFNBQVM7WUFBN0Msa0JBQWEsR0FBYixhQUFhLENBQWdDO1lBbEJ0QyxzQkFBaUIsR0FBRyxlQUFlLENBQUMsdUJBQXVCLENBQUM7WUFvQjVFLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxhQUFhLHVCQUFlLENBQUM7WUFDbEMsSUFBSSxDQUFDLFlBQVksR0FBRyxXQUFX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