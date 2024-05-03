/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "./findModel"], function (require, exports, event_1, lifecycle_1, range_1, findModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindReplaceState = exports.FindOptionOverride = void 0;
    var FindOptionOverride;
    (function (FindOptionOverride) {
        FindOptionOverride[FindOptionOverride["NotSet"] = 0] = "NotSet";
        FindOptionOverride[FindOptionOverride["True"] = 1] = "True";
        FindOptionOverride[FindOptionOverride["False"] = 2] = "False";
    })(FindOptionOverride || (exports.FindOptionOverride = FindOptionOverride = {}));
    function effectiveOptionValue(override, value) {
        if (override === 1 /* FindOptionOverride.True */) {
            return true;
        }
        if (override === 2 /* FindOptionOverride.False */) {
            return false;
        }
        return value;
    }
    class FindReplaceState extends lifecycle_1.Disposable {
        get searchString() { return this._searchString; }
        get replaceString() { return this._replaceString; }
        get isRevealed() { return this._isRevealed; }
        get isReplaceRevealed() { return this._isReplaceRevealed; }
        get isRegex() { return effectiveOptionValue(this._isRegexOverride, this._isRegex); }
        get wholeWord() { return effectiveOptionValue(this._wholeWordOverride, this._wholeWord); }
        get matchCase() { return effectiveOptionValue(this._matchCaseOverride, this._matchCase); }
        get preserveCase() { return effectiveOptionValue(this._preserveCaseOverride, this._preserveCase); }
        get actualIsRegex() { return this._isRegex; }
        get actualWholeWord() { return this._wholeWord; }
        get actualMatchCase() { return this._matchCase; }
        get actualPreserveCase() { return this._preserveCase; }
        get searchScope() { return this._searchScope; }
        get matchesPosition() { return this._matchesPosition; }
        get matchesCount() { return this._matchesCount; }
        get currentMatch() { return this._currentMatch; }
        get isSearching() { return this._isSearching; }
        get filters() { return this._filters; }
        constructor() {
            super();
            this._onFindReplaceStateChange = this._register(new event_1.Emitter());
            this.onFindReplaceStateChange = this._onFindReplaceStateChange.event;
            this._searchString = '';
            this._replaceString = '';
            this._isRevealed = false;
            this._isReplaceRevealed = false;
            this._isRegex = false;
            this._isRegexOverride = 0 /* FindOptionOverride.NotSet */;
            this._wholeWord = false;
            this._wholeWordOverride = 0 /* FindOptionOverride.NotSet */;
            this._matchCase = false;
            this._matchCaseOverride = 0 /* FindOptionOverride.NotSet */;
            this._preserveCase = false;
            this._preserveCaseOverride = 0 /* FindOptionOverride.NotSet */;
            this._searchScope = null;
            this._matchesPosition = 0;
            this._matchesCount = 0;
            this._currentMatch = null;
            this._loop = true;
            this._isSearching = false;
            this._filters = null;
        }
        changeMatchInfo(matchesPosition, matchesCount, currentMatch) {
            const changeEvent = {
                moveCursor: false,
                updateHistory: false,
                searchString: false,
                replaceString: false,
                isRevealed: false,
                isReplaceRevealed: false,
                isRegex: false,
                wholeWord: false,
                matchCase: false,
                preserveCase: false,
                searchScope: false,
                matchesPosition: false,
                matchesCount: false,
                currentMatch: false,
                loop: false,
                isSearching: false,
                filters: false
            };
            let somethingChanged = false;
            if (matchesCount === 0) {
                matchesPosition = 0;
            }
            if (matchesPosition > matchesCount) {
                matchesPosition = matchesCount;
            }
            if (this._matchesPosition !== matchesPosition) {
                this._matchesPosition = matchesPosition;
                changeEvent.matchesPosition = true;
                somethingChanged = true;
            }
            if (this._matchesCount !== matchesCount) {
                this._matchesCount = matchesCount;
                changeEvent.matchesCount = true;
                somethingChanged = true;
            }
            if (typeof currentMatch !== 'undefined') {
                if (!range_1.Range.equalsRange(this._currentMatch, currentMatch)) {
                    this._currentMatch = currentMatch;
                    changeEvent.currentMatch = true;
                    somethingChanged = true;
                }
            }
            if (somethingChanged) {
                this._onFindReplaceStateChange.fire(changeEvent);
            }
        }
        change(newState, moveCursor, updateHistory = true) {
            const changeEvent = {
                moveCursor: moveCursor,
                updateHistory: updateHistory,
                searchString: false,
                replaceString: false,
                isRevealed: false,
                isReplaceRevealed: false,
                isRegex: false,
                wholeWord: false,
                matchCase: false,
                preserveCase: false,
                searchScope: false,
                matchesPosition: false,
                matchesCount: false,
                currentMatch: false,
                loop: false,
                isSearching: false,
                filters: false
            };
            let somethingChanged = false;
            const oldEffectiveIsRegex = this.isRegex;
            const oldEffectiveWholeWords = this.wholeWord;
            const oldEffectiveMatchCase = this.matchCase;
            const oldEffectivePreserveCase = this.preserveCase;
            if (typeof newState.searchString !== 'undefined') {
                if (this._searchString !== newState.searchString) {
                    this._searchString = newState.searchString;
                    changeEvent.searchString = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.replaceString !== 'undefined') {
                if (this._replaceString !== newState.replaceString) {
                    this._replaceString = newState.replaceString;
                    changeEvent.replaceString = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isRevealed !== 'undefined') {
                if (this._isRevealed !== newState.isRevealed) {
                    this._isRevealed = newState.isRevealed;
                    changeEvent.isRevealed = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isReplaceRevealed !== 'undefined') {
                if (this._isReplaceRevealed !== newState.isReplaceRevealed) {
                    this._isReplaceRevealed = newState.isReplaceRevealed;
                    changeEvent.isReplaceRevealed = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isRegex !== 'undefined') {
                this._isRegex = newState.isRegex;
            }
            if (typeof newState.wholeWord !== 'undefined') {
                this._wholeWord = newState.wholeWord;
            }
            if (typeof newState.matchCase !== 'undefined') {
                this._matchCase = newState.matchCase;
            }
            if (typeof newState.preserveCase !== 'undefined') {
                this._preserveCase = newState.preserveCase;
            }
            if (typeof newState.searchScope !== 'undefined') {
                if (!newState.searchScope?.every((newSearchScope) => {
                    return this._searchScope?.some(existingSearchScope => {
                        return !range_1.Range.equalsRange(existingSearchScope, newSearchScope);
                    });
                })) {
                    this._searchScope = newState.searchScope;
                    changeEvent.searchScope = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.loop !== 'undefined') {
                if (this._loop !== newState.loop) {
                    this._loop = newState.loop;
                    changeEvent.loop = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.isSearching !== 'undefined') {
                if (this._isSearching !== newState.isSearching) {
                    this._isSearching = newState.isSearching;
                    changeEvent.isSearching = true;
                    somethingChanged = true;
                }
            }
            if (typeof newState.filters !== 'undefined') {
                if (this._filters) {
                    this._filters.update(newState.filters);
                }
                else {
                    this._filters = newState.filters;
                }
                changeEvent.filters = true;
                somethingChanged = true;
            }
            // Overrides get set when they explicitly come in and get reset anytime something else changes
            this._isRegexOverride = (typeof newState.isRegexOverride !== 'undefined' ? newState.isRegexOverride : 0 /* FindOptionOverride.NotSet */);
            this._wholeWordOverride = (typeof newState.wholeWordOverride !== 'undefined' ? newState.wholeWordOverride : 0 /* FindOptionOverride.NotSet */);
            this._matchCaseOverride = (typeof newState.matchCaseOverride !== 'undefined' ? newState.matchCaseOverride : 0 /* FindOptionOverride.NotSet */);
            this._preserveCaseOverride = (typeof newState.preserveCaseOverride !== 'undefined' ? newState.preserveCaseOverride : 0 /* FindOptionOverride.NotSet */);
            if (oldEffectiveIsRegex !== this.isRegex) {
                somethingChanged = true;
                changeEvent.isRegex = true;
            }
            if (oldEffectiveWholeWords !== this.wholeWord) {
                somethingChanged = true;
                changeEvent.wholeWord = true;
            }
            if (oldEffectiveMatchCase !== this.matchCase) {
                somethingChanged = true;
                changeEvent.matchCase = true;
            }
            if (oldEffectivePreserveCase !== this.preserveCase) {
                somethingChanged = true;
                changeEvent.preserveCase = true;
            }
            if (somethingChanged) {
                this._onFindReplaceStateChange.fire(changeEvent);
            }
        }
        canNavigateBack() {
            return this.canNavigateInLoop() || (this.matchesPosition !== 1);
        }
        canNavigateForward() {
            return this.canNavigateInLoop() || (this.matchesPosition < this.matchesCount);
        }
        canNavigateInLoop() {
            return this._loop || (this.matchesCount >= findModel_1.MATCHES_LIMIT);
        }
    }
    exports.FindReplaceState = FindReplaceState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZFN0YXRlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9maW5kL2Jyb3dzZXIvZmluZFN0YXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQTRCaEcsSUFBa0Isa0JBSWpCO0lBSkQsV0FBa0Isa0JBQWtCO1FBQ25DLCtEQUFVLENBQUE7UUFDViwyREFBUSxDQUFBO1FBQ1IsNkRBQVMsQ0FBQTtJQUNWLENBQUMsRUFKaUIsa0JBQWtCLGtDQUFsQixrQkFBa0IsUUFJbkM7SUFxQkQsU0FBUyxvQkFBb0IsQ0FBQyxRQUE0QixFQUFFLEtBQWM7UUFDekUsSUFBSSxRQUFRLG9DQUE0QixFQUFFLENBQUM7WUFDMUMsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ0QsSUFBSSxRQUFRLHFDQUE2QixFQUFFLENBQUM7WUFDM0MsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsTUFBYSxnQkFBa0YsU0FBUSxzQkFBVTtRQXNCaEgsSUFBVyxZQUFZLEtBQWEsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUNoRSxJQUFXLGFBQWEsS0FBYSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLElBQVcsVUFBVSxLQUFjLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0QsSUFBVyxpQkFBaUIsS0FBYyxPQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDM0UsSUFBVyxPQUFPLEtBQWMsT0FBTyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRyxJQUFXLFNBQVMs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