/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arraysFind", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/common/commands/replaceCommand", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModelSearch", "vs/editor/contrib/find/browser/findDecorations", "vs/editor/contrib/find/browser/replaceAllCommand", "vs/editor/contrib/find/browser/replacePattern", "vs/platform/contextkey/common/contextkey"], function (require, exports, arraysFind_1, async_1, lifecycle_1, replaceCommand_1, position_1, range_1, selection_1, textModelSearch_1, findDecorations_1, replaceAllCommand_1, replacePattern_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindModelBoundToEditorModel = exports.MATCHES_LIMIT = exports.FIND_IDS = exports.TogglePreserveCaseKeybinding = exports.ToggleSearchScopeKeybinding = exports.ToggleRegexKeybinding = exports.ToggleWholeWordKeybinding = exports.ToggleCaseSensitiveKeybinding = exports.CONTEXT_REPLACE_INPUT_FOCUSED = exports.CONTEXT_FIND_INPUT_FOCUSED = exports.CONTEXT_FIND_WIDGET_NOT_VISIBLE = exports.CONTEXT_FIND_WIDGET_VISIBLE = void 0;
    exports.CONTEXT_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('findWidgetVisible', false);
    exports.CONTEXT_FIND_WIDGET_NOT_VISIBLE = exports.CONTEXT_FIND_WIDGET_VISIBLE.toNegated();
    // Keep ContextKey use of 'Focussed' to not break when clauses
    exports.CONTEXT_FIND_INPUT_FOCUSED = new contextkey_1.RawContextKey('findInputFocussed', false);
    exports.CONTEXT_REPLACE_INPUT_FOCUSED = new contextkey_1.RawContextKey('replaceInputFocussed', false);
    exports.ToggleCaseSensitiveKeybinding = {
        primary: 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */ }
    };
    exports.ToggleWholeWordKeybinding = {
        primary: 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */ }
    };
    exports.ToggleRegexKeybinding = {
        primary: 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ }
    };
    exports.ToggleSearchScopeKeybinding = {
        primary: 512 /* KeyMod.Alt */ | 42 /* KeyCode.KeyL */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 42 /* KeyCode.KeyL */ }
    };
    exports.TogglePreserveCaseKeybinding = {
        primary: 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 46 /* KeyCode.KeyP */ }
    };
    exports.FIND_IDS = {
        StartFindAction: 'actions.find',
        StartFindWithSelection: 'actions.findWithSelection',
        StartFindWithArgs: 'editor.actions.findWithArgs',
        NextMatchFindAction: 'editor.action.nextMatchFindAction',
        PreviousMatchFindAction: 'editor.action.previousMatchFindAction',
        GoToMatchFindAction: 'editor.action.goToMatchFindAction',
        NextSelectionMatchFindAction: 'editor.action.nextSelectionMatchFindAction',
        PreviousSelectionMatchFindAction: 'editor.action.previousSelectionMatchFindAction',
        StartFindReplaceAction: 'editor.action.startFindReplaceAction',
        CloseFindWidgetCommand: 'closeFindWidget',
        ToggleCaseSensitiveCommand: 'toggleFindCaseSensitive',
        ToggleWholeWordCommand: 'toggleFindWholeWord',
        ToggleRegexCommand: 'toggleFindRegex',
        ToggleSearchScopeCommand: 'toggleFindInSelection',
        TogglePreserveCaseCommand: 'togglePreserveCase',
        ReplaceOneAction: 'editor.action.replaceOne',
        ReplaceAllAction: 'editor.action.replaceAll',
        SelectAllMatchesAction: 'editor.action.selectAllMatches'
    };
    exports.MATCHES_LIMIT = 19999;
    const RESEARCH_DELAY = 240;
    class FindModelBoundToEditorModel {
        constructor(editor, state) {
            this._toDispose = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._state = state;
            this._isDisposed = false;
            this._startSearchingTimer = new async_1.TimeoutTimer();
            this._decorations = new findDecorations_1.FindDecorations(editor);
            this._toDispose.add(this._decorations);
            this._updateDecorationsScheduler = new async_1.RunOnceScheduler(() => this.research(false), 100);
            this._toDispose.add(this._updateDecorationsScheduler);
            this._toDispose.add(this._editor.onDidChangeCursorPosition((e) => {
                if (e.reason === 3 /* CursorChangeReason.Explicit */
                    || e.reason === 5 /* CursorChangeReason.Undo */
                    || e.reason === 6 /* CursorChangeReason.Redo */) {
                    this._decorations.setStartPosition(this._editor.getPosition());
                }
            }));
            this._ignoreModelContentChanged = false;
            this._toDispose.add(this._editor.onDidChangeModelContent((e) => {
                if (this._ignoreModelContentChanged) {
                    return;
                }
                if (e.isFlush) {
                    // a model.setValue() was called
                    this._decorations.reset();
                }
                this._decorations.setStartPosition(this._editor.getPosition());
                this._updateDecorationsScheduler.schedule();
            }));
            this._toDispose.add(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this.research(false, this._state.searchScope);
        }
        dispose() {
            this._isDisposed = true;
            (0, lifecycle_1.dispose)(this._startSearchingTimer);
            this._toDispose.dispose();
        }
        _onStateChanged(e) {
            if (this._isDisposed) {
                // The find model is disposed during a find state changed event
                return;
            }
            if (!this._editor.hasModel()) {
                // The find model will be disposed momentarily
                return;
            }
            if (e.searchString || e.isReplaceRevealed || e.isRegex || e.wholeWord || e.matchCase || e.searchScope) {
                const model = this._editor.getModel();
                if (model.isTooLargeForSyncing()) {
                    this._startSearchingTimer.cancel();
                    this._startSearchingTimer.setIfNotSet(() => {
                        if (e.searchScope) {
                            this.research(e.moveCursor, this._state.searchScope);
                        }
                        else {
                            this.research(e.moveCursor);
                        }
                    }, RESEARCH_DELAY);
                }
                else {
                    if (e.searchScope) {
                        this.research(e.moveCursor, this._state.searchScope);
                    }
                    else {
                        this.research(e.moveCursor);
                    }
                }
            }
        }
        static _getSearchRange(model, findScope) {
            // If we have set now or before a find scope, use it for computing the search range
            if (findScope) {
                return findScope;
            }
            return model.getFullModelRange();
        }
        research(moveCursor, newFindScope) {
            let findScopes = null;
            if (typeof newFindScope !== 'undefined') {
                if (newFindScope !== null) {
                    if (!Array.isArray(newFindScope)) {
                        findScopes = [newFindScope];
                    }
                    else {
                        findScopes = newFindScope;
                    }
                }
            }
            else {
                findScopes = this._decorations.getFindScopes();
            }
            if (findScopes !== null) {
                findScopes = findScopes.map(findScope => {
                    if (findScope.startLineNumber !== findScope.endLineNumber) {
                        let endLineNumber = findScope.endLineNumber;
                        if (findScope.endColumn === 1) {
                            endLineNumber = endLineNumber - 1;
                        }
                        return new range_1.Range(findScope.startLineNumber, 1, endLineNumber, this._editor.getModel().getLineMaxColumn(endLineNumber));
                    }
                    return findScope;
                });
            }
            const findMatches = this._findMatches(findScopes, false, exports.MATCHES_LIMIT);
            this._decorations.set(findMatches, findScopes);
            const editorSelection = this._editor.getSelection();
            let currentMatchesPosition = this._decorations.getCurrentMatchesPosition(editorSelection);
            if (currentMatchesPosition === 0 && findMatches.length > 0) {
                // current selection is not on top of a match
                // try to find its nearest result from the top of the document
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches.map(match => match.range), range => range_1.Range.compareRangesUsingStarts(range, editorSelection) >= 0);
                currentMatchesPosition = matchAfterSelection > 0 ? matchAfterSelection - 1 + 1 /** match position is one based */ : currentMatchesPosition;
            }
            this._state.changeMatchInfo(currentMatchesPosition, this._decorations.getCount(), undefined);
            if (moveCursor && this._editor.getOption(41 /* EditorOption.find */).cursorMoveOnType) {
                this._moveToNextMatch(this._decorations.getStartPosition());
            }
        }
        _hasMatches() {
            return (this._state.matchesCount > 0);
        }
        _cannotFind() {
            if (!this._hasMatches()) {
                const findScope = this._decorations.getFindScope();
                if (findScope) {
                    // Reveal the selection so user is reminded that 'selection find' is on.
                    this._editor.revealRangeInCenterIfOutsideViewport(findScope, 0 /* ScrollType.Smooth */);
                }
                return true;
            }
            return false;
        }
        _setCurrentFindMatch(match) {
            const matchesPosition = this._decorations.setCurrentFindMatch(match);
            this._state.changeMatchInfo(matchesPosition, this._decorations.getCount(), match);
            this._editor.setSelection(match);
            this._editor.revealRangeInCenterIfOutsideViewport(match, 0 /* ScrollType.Smooth */);
        }
        _prevSearchPosition(before) {
            const isUsingLineStops = this._state.isRegex && (this._state.searchString.indexOf('^') >= 0
                || this._state.searchString.indexOf('$') >= 0);
            let { lineNumber, column } = before;
            const model = this._editor.getModel();
            if (isUsingLineStops || column === 1) {
                if (lineNumber === 1) {
                    lineNumber = model.getLineCount();
                }
                else {
                    lineNumber--;
                }
                column = model.getLineMaxColumn(lineNumber);
            }
            else {
                column--;
            }
            return new position_1.Position(lineNumber, column);
        }
        _moveToPrevMatch(before, isRecursed = false) {
            if (!this._state.canNavigateBack()) {
                // we are beyond the first matched find result
                // instead of doing nothing, we should refocus the first item
                const nextMatchRange = this._decorations.matchAfterPosition(before);
                if (nextMatchRange) {
                    this._setCurrentFindMatch(nextMatchRange);
                }
                return;
            }
            if (this._decorations.getCount() < exports.MATCHES_LIMIT) {
                let prevMatchRange = this._decorations.matchBeforePosition(before);
                if (prevMatchRange && prevMatchRange.isEmpty() && prevMatchRange.getStartPosition().equals(before)) {
                    before = this._prevSearchPosition(before);
                    prevMatchRange = this._decorations.matchBeforePosition(before);
                }
                if (prevMatchRange) {
                    this._setCurrentFindMatch(prevMatchRange);
                }
                return;
            }
            if (this._cannotFind()) {
                return;
            }
            const findScope = this._decorations.getFindScope();
            const searchRange = FindModelBoundToEditorModel._getSearchRange(this._editor.getModel(), findScope);
            // ...(----)...|...
            if (searchRange.getEndPosition().isBefore(before)) {
                before = searchRange.getEndPosition();
            }
            // ...|...(----)...
            if (before.isBefore(searchRange.getStartPosition())) {
                before = searchRange.getEndPosition();
            }
            const { lineNumber, column } = before;
            const model = this._editor.getModel();
            let position = new position_1.Position(lineNumber, column);
            let prevMatch = model.findPreviousMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false);
            if (prevMatch && prevMatch.range.isEmpty() && prevMatch.range.getStartPosition().equals(position)) {
                // Looks like we're stuck at this position, unacceptable!
                position = this._prevSearchPosition(position);
                prevMatch = model.findPreviousMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false);
            }
            if (!prevMatch) {
                // there is precisely one match and selection is on top of it
                return;
            }
            if (!isRecursed && !searchRange.containsRange(prevMatch.range)) {
                return this._moveToPrevMatch(prevMatch.range.getStartPosition(), true);
            }
            this._setCurrentFindMatch(prevMatch.range);
        }
        moveToPrevMatch() {
            this._moveToPrevMatch(this._editor.getSelection().getStartPosition());
        }
        _nextSearchPosition(after) {
            const isUsingLineStops = this._state.isRegex && (this._state.searchString.indexOf('^') >= 0
                || this._state.searchString.indexOf('$') >= 0);
            let { lineNumber, column } = after;
            const model = this._editor.getModel();
            if (isUsingLineStops || column === model.getLineMaxColumn(lineNumber)) {
                if (lineNumber === model.getLineCount()) {
                    lineNumber = 1;
                }
                else {
                    lineNumber++;
                }
                column = 1;
            }
            else {
                column++;
            }
            return new position_1.Position(lineNumber, column);
        }
        _moveToNextMatch(after) {
            if (!this._state.canNavigateForward()) {
                // we are beyond the last matched find result
                // instead of doing nothing, we should refocus the last item
                const prevMatchRange = this._decorations.matchBeforePosition(after);
                if (prevMatchRange) {
                    this._setCurrentFindMatch(prevMatchRange);
                }
                return;
            }
            if (this._decorations.getCount() < exports.MATCHES_LIMIT) {
                let nextMatchRange = this._decorations.matchAfterPosition(after);
                if (nextMatchRange && nextMatchRange.isEmpty() && nextMatchRange.getStartPosition().equals(after)) {
                    // Looks like we're stuck at this position, unacceptable!
                    after = this._nextSearchPosition(after);
                    nextMatchRange = this._decorations.matchAfterPosition(after);
                }
                if (nextMatchRange) {
                    this._setCurrentFindMatch(nextMatchRange);
                }
                return;
            }
            const nextMatch = this._getNextMatch(after, false, true);
            if (nextMatch) {
                this._setCurrentFindMatch(nextMatch.range);
            }
        }
        _getNextMatch(after, captureMatches, forceMove, isRecursed = false) {
            if (this._cannotFind()) {
                return null;
            }
            const findScope = this._decorations.getFindScope();
            const searchRange = FindModelBoundToEditorModel._getSearchRange(this._editor.getModel(), findScope);
            // ...(----)...|...
            if (searchRange.getEndPosition().isBefore(after)) {
                after = searchRange.getStartPosition();
            }
            // ...|...(----)...
            if (after.isBefore(searchRange.getStartPosition())) {
                after = searchRange.getStartPosition();
            }
            const { lineNumber, column } = after;
            const model = this._editor.getModel();
            let position = new position_1.Position(lineNumber, column);
            let nextMatch = model.findNextMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, captureMatches);
            if (forceMove && nextMatch && nextMatch.range.isEmpty() && nextMatch.range.getStartPosition().equals(position)) {
                // Looks like we're stuck at this position, unacceptable!
                position = this._nextSearchPosition(position);
                nextMatch = model.findNextMatch(this._state.searchString, position, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, captureMatches);
            }
            if (!nextMatch) {
                // there is precisely one match and selection is on top of it
                return null;
            }
            if (!isRecursed && !searchRange.containsRange(nextMatch.range)) {
                return this._getNextMatch(nextMatch.range.getEndPosition(), captureMatches, forceMove, true);
            }
            return nextMatch;
        }
        moveToNextMatch() {
            this._moveToNextMatch(this._editor.getSelection().getEndPosition());
        }
        _moveToMatch(index) {
            const decorationRange = this._decorations.getDecorationRangeAt(index);
            if (decorationRange) {
                this._setCurrentFindMatch(decorationRange);
            }
        }
        moveToMatch(index) {
            this._moveToMatch(index);
        }
        _getReplacePattern() {
            if (this._state.isRegex) {
                return (0, replacePattern_1.parseReplaceString)(this._state.replaceString);
            }
            return replacePattern_1.ReplacePattern.fromStaticValue(this._state.replaceString);
        }
        replace() {
            if (!this._hasMatches()) {
                return;
            }
            const replacePattern = this._getReplacePattern();
            const selection = this._editor.getSelection();
            const nextMatch = this._getNextMatch(selection.getStartPosition(), true, false);
            if (nextMatch) {
                if (selection.equalsRange(nextMatch.range)) {
                    // selection sits on a find match => replace it!
                    const replaceString = replacePattern.buildReplaceString(nextMatch.matches, this._state.preserveCase);
                    const command = new replaceCommand_1.ReplaceCommand(selection, replaceString);
                    this._executeEditorCommand('replace', command);
                    this._decorations.setStartPosition(new position_1.Position(selection.startLineNumber, selection.startColumn + replaceString.length));
                    this.research(true);
                }
                else {
                    this._decorations.setStartPosition(this._editor.getPosition());
                    this._setCurrentFindMatch(nextMatch.range);
                }
            }
        }
        _findMatches(findScopes, captureMatches, limitResultCount) {
            const searchRanges = (findScopes || [null]).map((scope) => FindModelBoundToEditorModel._getSearchRange(this._editor.getModel(), scope));
            return this._editor.getModel().findMatches(this._state.searchString, searchRanges, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, captureMatches, limitResultCount);
        }
        replaceAll() {
            if (!this._hasMatches()) {
                return;
            }
            const findScopes = this._decorations.getFindScopes();
            if (findScopes === null && this._state.matchesCount >= exports.MATCHES_LIMIT) {
                // Doing a replace on the entire file that is over ${MATCHES_LIMIT} matches
                this._largeReplaceAll();
            }
            else {
                this._regularReplaceAll(findScopes);
            }
            this.research(false);
        }
        _largeReplaceAll() {
            const searchParams = new textModelSearch_1.SearchParams(this._state.searchString, this._state.isRegex, this._state.matchCase, this._state.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null);
            const searchData = searchParams.parseSearchRequest();
            if (!searchData) {
                return;
            }
            let searchRegex = searchData.regex;
            if (!searchRegex.multiline) {
                let mod = 'mu';
                if (searchRegex.ignoreCase) {
                    mod += 'i';
                }
                if (searchRegex.global) {
                    mod += 'g';
                }
                searchRegex = new RegExp(searchRegex.source, mod);
            }
            const model = this._editor.getModel();
            const modelText = model.getValue(1 /* EndOfLinePreference.LF */);
            const fullModelRange = model.getFullModelRange();
            const replacePattern = this._getReplacePattern();
            let resultText;
            const preserveCase = this._state.preserveCase;
            if (replacePattern.hasReplacementPatterns || preserveCase) {
                resultText = modelText.replace(searchRegex, function () {
                    return replacePattern.buildReplaceString(arguments, preserveCase);
                });
            }
            else {
                resultText = modelText.replace(searchRegex, replacePattern.buildReplaceString(null, preserveCase));
            }
            const command = new replaceCommand_1.ReplaceCommandThatPreservesSelection(fullModelRange, resultText, this._editor.getSelection());
            this._executeEditorCommand('replaceAll', command);
        }
        _regularReplaceAll(findScopes) {
            const replacePattern = this._getReplacePattern();
            // Get all the ranges (even more than the highlighted ones)
            const matches = this._findMatches(findScopes, replacePattern.hasReplacementPatterns || this._state.preserveCase, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            const replaceStrings = [];
            for (let i = 0, len = matches.length; i < len; i++) {
                replaceStrings[i] = replacePattern.buildReplaceString(matches[i].matches, this._state.preserveCase);
            }
            const command = new replaceAllCommand_1.ReplaceAllCommand(this._editor.getSelection(), matches.map(m => m.range), replaceStrings);
            this._executeEditorCommand('replaceAll', command);
        }
        selectAllMatches() {
            if (!this._hasMatches()) {
                return;
            }
            const findScopes = this._decorations.getFindScopes();
            // Get all the ranges (even more than the highlighted ones)
            const matches = this._findMatches(findScopes, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            let selections = matches.map(m => new selection_1.Selection(m.range.startLineNumber, m.range.startColumn, m.range.endLineNumber, m.range.endColumn));
            // If one of the ranges is the editor selection, then maintain it as primary
            const editorSelection = this._editor.getSelection();
            for (let i = 0, len = selections.length; i < len; i++) {
                const sel = selections[i];
                if (sel.equalsRange(editorSelection)) {
                    selections = [editorSelection].concat(selections.slice(0, i)).concat(selections.slice(i + 1));
                    break;
                }
            }
            this._editor.setSelections(selections);
        }
        _executeEditorCommand(source, command) {
            try {
                this._ignoreModelContentChanged = true;
                this._editor.pushUndoStop();
                this._editor.executeCommand(source, command);
                this._editor.pushUndoStop();
            }
            finally {
                this._ignoreModelContentChanged = false;
            }
        }
    }
    exports.FindModelBoundToEditorModel = FindModelBoundToEditorModel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9maW5kL2Jyb3dzZXIvZmluZE1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCbkYsUUFBQSwyQkFBMkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckYsUUFBQSwrQkFBK0IsR0FBRyxtQ0FBMkIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN2Riw4REFBOEQ7SUFDakQsUUFBQSwwQkFBMEIsR0FBRyxJQUFJLDBCQUFhLENBQVUsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEYsUUFBQSw2QkFBNkIsR0FBRyxJQUFJLDBCQUFhLENBQVUsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFMUYsUUFBQSw2QkFBNkIsR0FBaUI7UUFDMUQsT0FBTyxFQUFFLDRDQUF5QjtRQUNsQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlLEVBQUU7S0FDNUQsQ0FBQztJQUNXLFFBQUEseUJBQXlCLEdBQWlCO1FBQ3RELE9BQU8sRUFBRSw0Q0FBeUI7UUFDbEMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdEQUEyQix3QkFBZSxFQUFFO0tBQzVELENBQUM7SUFDVyxRQUFBLHFCQUFxQixHQUFpQjtRQUNsRCxPQUFPLEVBQUUsNENBQXlCO1FBQ2xDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxnREFBMkIsd0JBQWUsRUFBRTtLQUM1RCxDQUFDO0lBQ1csUUFBQSwyQkFBMkIsR0FBaUI7UUFDeEQsT0FBTyxFQUFFLDRDQUF5QjtRQUNsQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlLEVBQUU7S0FDNUQsQ0FBQztJQUNXLFFB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