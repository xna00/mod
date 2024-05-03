/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/filters"], function (require, exports, arrays_1, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleCompletionModel = exports.LineContext = void 0;
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
    class SimpleCompletionModel {
        constructor(_items, _lineContext, replacementIndex, replacementLength) {
            this._items = _items;
            this._lineContext = _lineContext;
            this.replacementIndex = replacementIndex;
            this.replacementLength = replacementLength;
            this._refilterKind = 1 /* Refilter.All */;
            this._fuzzyScoreOptions = filters_1.FuzzyScoreOptions.default;
            // TODO: Pass in options
            this._options = {};
        }
        get items() {
            this._ensureCachedState();
            return this._filteredItems;
        }
        get stats() {
            this._ensureCachedState();
            return this._stats;
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
        _ensureCachedState() {
            if (this._refilterKind !== 0 /* Refilter.Nothing */) {
                this._createCachedState();
            }
        }
        _createCachedState() {
            // this._providerInfo = new Map();
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
                // if (item.isInvalid) {
                // 	continue; // SKIP invalid items
                // }
                // collect all support, know if their result is incomplete
                // this._providerInfo.set(item.provider, Boolean(item.container.incomplete));
                // 'word' is that remainder of the current line that we
                // filter and score against. In theory each suggestion uses a
                // different word, but in practice not - that's why we cache
                // TODO: Fix
                const overwriteBefore = this.replacementLength; // item.position.column - item.editStart.column;
                const wordLen = overwriteBefore + characterCountDelta; // - (item.position.column - this._column);
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
                        // } else if (typeof item.completion.filterText === 'string') {
                        // 	// when there is a `filterText` it must match the `word`.
                        // 	// if it matches we check with the label to compute highlights
                        // 	// and if that doesn't yield a result we have no highlights,
                        // 	// despite having the match
                        // 	const match = scoreFn(word, wordLow, wordPos, item.completion.filterText, item.filterTextLow!, 0, this._fuzzyScoreOptions);
                        // 	if (!match) {
                        // 		continue; // NO match
                        // 	}
                        // 	if (compareIgnoreCase(item.completion.filterText, item.textLabel) === 0) {
                        // 		// filterText and label are actually the same -> use good highlights
                        // 		item.score = match;
                        // 	} else {
                        // 		// re-run the scorer on the label in the hope of a result BUT use the rank
                        // 		// of the filterText-match
                        // 		item.score = anyScore(word, wordLow, wordPos, item.textLabel, item.labelLow, 0);
                        // 		item.score[0] = match[0]; // use score from filterText
                        // 	}
                    }
                    else {
                        // by default match `word` against the `label`
                        const match = scoreFn(word, wordLow, wordPos, item.completion.label, item.labelLow, 0, this._fuzzyScoreOptions);
                        if (!match) {
                            continue; // NO match
                        }
                        item.score = match;
                    }
                }
                item.idx = i;
                target.push(item);
                // update stats
                labelLengths.push(item.completion.label.length);
            }
            this._filteredItems = target.sort((a, b) => b.score[0] - a.score[0]);
            this._refilterKind = 0 /* Refilter.Nothing */;
            this._stats = {
                pLabelLen: labelLengths.length ?
                    (0, arrays_1.quickSelect)(labelLengths.length - .85, labelLengths, (a, b) => a - b)
                    : 0
            };
        }
    }
    exports.SimpleCompletionModel = SimpleCompletionModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2ltcGxlQ29tcGxldGlvbk1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc3VnZ2VzdC9icm93c2VyL3NpbXBsZUNvbXBsZXRpb25Nb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFXaEcsTUFBYSxXQUFXO1FBQ3ZCLFlBQ1Usa0JBQTBCLEVBQzFCLG1CQUEyQjtZQUQzQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQVE7WUFDMUIsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFRO1FBQ2pDLENBQUM7S0FDTDtJQUxELGtDQUtDO0lBRUQsSUFBVyxRQUlWO0lBSkQsV0FBVyxRQUFRO1FBQ2xCLDZDQUFXLENBQUE7UUFDWCxxQ0FBTyxDQUFBO1FBQ1AsdUNBQVEsQ0FBQTtJQUNULENBQUMsRUFKVSxRQUFRLEtBQVIsUUFBUSxRQUlsQjtJQUVELE1BQWEscUJBQXFCO1FBV2pDLFlBQ2tCLE1BQThCLEVBQ3ZDLFlBQXlCLEVBQ3hCLGdCQUF3QixFQUN4QixpQkFBeUI7WUFIakIsV0FBTSxHQUFOLE1BQU0sQ0FBd0I7WUFDdkMsaUJBQVksR0FBWixZQUFZLENBQWE7WUFDeEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1lBQ3hCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtZQVozQixrQkFBYSx3QkFBMEI7WUFDdkMsdUJBQWtCLEdBQWtDLDJCQUFpQixDQUFDLE9BQU8sQ0FBQztZQUV0Rix3QkFBd0I7WUFDaEIsYUFBUSxHQUVaLEVBQUUsQ0FBQztRQVFQLENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDUixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUMxQixPQUFPLElBQUksQ0FBQyxjQUFlLENBQUM7UUFDN0IsQ0FBQztRQUVELElBQUksS0FBSztZQUNSLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzFCLE9BQU8sSUFBSSxDQUFDLE1BQU8sQ0FBQztRQUNyQixDQUFDO1FBR0QsSUFBSSxXQUFXO1lBQ2QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBQzFCLENBQUM7UUFFRCxJQUFJLFdBQVcsQ0FBQyxLQUFrQjtZQUNqQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsa0JBQWtCLEtBQUssS0FBSyxDQUFDLGtCQUFrQjttQkFDakUsSUFBSSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsS0FBSyxLQUFLLENBQUMsbUJBQW1CLEVBQ3JFLENBQUM7Z0JBQ0YsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsdUJBQWUsQ0FBQyxxQkFBYSxDQUFDO2dCQUM3SSxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUMzQixDQUFDO1FBQ0YsQ0FBQztRQUVPLGtCQUFrQjtZQUN6QixJQUFJLElBQUksQ0FBQyxhQUFhLDZCQUFxQixFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO1FBQ08sa0JBQWtCO1lBRXpCLGtDQUFrQztZQUVsQyxNQUFNLFlBQVksR0FBYSxFQUFFLENBQUM7WUFFbEMsTUFBTSxFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN0RSxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7WUFDZCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFFakIsNEJBQTRCO1lBQzVCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLHlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBZSxDQUFDO1lBQ3hGLE1BQU0sTUFBTSxHQUEyQixFQUFFLENBQUM7WUFFMUMsZ0RBQWdEO1lBQ2hELHNEQUFzRDtZQUN0RCxxQkFBcUI7WUFDckIsTUFBTSxPQUFPLEdBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBVSxDQUFDLENBQUMsQ0FBQyxzQ0FBNEIsQ0FBQztZQUVqSSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUV4QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXZCLHdCQUF3QjtnQkFDeEIsbUNBQW1DO2dCQUNuQyxJQUFJO2dCQUVKLDBEQUEwRDtnQkFDMUQsNkVBQTZFO2dCQUU3RSx1REFBdUQ7Z0JBQ3ZELDZEQUE2RDtnQkFDN0QsNERBQTREO2dCQUM1RCxZQUFZO2dCQUNaLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLGdEQUFnRDtnQkFDaEcsTUFBTSxPQUFPLEdBQUcsZUFBZSxHQUFHLG1CQUFtQixDQUFDLENBQUMsMkNBQTJDO2dCQUNsRyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQzdCLElBQUksR0FBRyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvRCxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUM5QixDQUFDO2dCQUVELGdEQUFnRDtnQkFDaEQsU0FBUztnQkFDVCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztnQkFFakIsSUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25CLGdEQUFnRDtvQkFDaEQsZ0RBQWdEO29CQUNoRCxrREFBa0Q7b0JBQ2xELG1EQUFtRDtvQkFDbkQsMkNBQTJDO29CQUMzQyxJQUFJLENBQUMsS0FBSyxHQUFHLG9CQUFVLENBQUMsT0FBTyxDQUFDO2dCQUVqQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsaURBQWlEO29CQUNqRCxrREFBa0Q7b0JBQ2xELElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztvQkFDaEIsT0FBTyxPQUFPLEdBQUcsZUFBZSxFQUFFLENBQUM7d0JBQ2xDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7d0JBQ3BDLElBQUksRUFBRSw0QkFBbUIsSUFBSSxFQUFFLHlCQUFpQixFQUFFLENBQUM7NEJBQ2xELE9BQU8sSUFBSSxDQUFDLENBQUM7d0JBQ2QsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE1BQU07d0JBQ1AsQ0FBQztvQkFDRixDQUFDO29CQUVELElBQUksT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDO3dCQUN4Qix3REFBd0Q7d0JBQ3hELDBEQUEwRDt3QkFDMUQsSUFBSSxDQUFDLEtBQUssR0FBRyxvQkFBVSxDQUFDLE9BQU8sQ0FBQzt3QkFFaEMsK0RBQStEO3dCQUMvRCw2REFBNkQ7d0JBQzdELGtFQUFrRTt3QkFDbEUsZ0VBQWdFO3dCQUNoRSwrQkFBK0I7d0JBQy9CLCtIQUErSDt3QkFDL0gsaUJBQWlCO3dCQUNqQiwwQkFBMEI7d0JBQzFCLEtBQUs7d0JBQ0wsOEVBQThFO3dCQUM5RSx5RUFBeUU7d0JBQ3pFLHdCQUF3Qjt3QkFDeEIsWUFBWTt3QkFDWiwrRUFBK0U7d0JBQy9FLCtCQUErQjt3QkFDL0IscUZBQXFGO3dCQUNyRiwyREFBMkQ7d0JBQzNELEtBQUs7b0JBRU4sQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLDhDQUE4Qzt3QkFDOUMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO3dCQUNoSCxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ1osU0FBUyxDQUFDLFdBQVc7d0JBQ3RCLENBQUM7d0JBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7b0JBQ3BCLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDYixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVsQixlQUFlO2dCQUNmLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUVELElBQUksQ0FBQyxjQUFjLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxhQUFhLDJCQUFtQixDQUFDO1lBRXRDLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ2IsU0FBUyxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDL0IsSUFBQSxvQkFBVyxFQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ3JFLENBQUMsQ0FBQyxDQUFDO2FBQ0osQ0FBQztRQUNILENBQUM7S0FDRDtJQXBLRCxzREFvS0MifQ==