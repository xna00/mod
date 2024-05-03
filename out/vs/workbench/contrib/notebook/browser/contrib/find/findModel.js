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
define(["require", "exports", "vs/base/common/async", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/common/core/range", "vs/editor/common/model/prefixSumComputer", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arraysFind", "vs/workbench/contrib/notebook/browser/contrib/find/findMatchDecorationModel"], function (require, exports, async_1, notebookBrowser_1, range_1, prefixSumComputer_1, notebookCommon_1, configuration_1, lifecycle_1, arraysFind_1, findMatchDecorationModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindModel = exports.CellFindMatchModel = void 0;
    class CellFindMatchModel {
        get length() {
            return this._contentMatches.length + this._webviewMatches.length;
        }
        get contentMatches() {
            return this._contentMatches;
        }
        get webviewMatches() {
            return this._webviewMatches;
        }
        constructor(cell, index, contentMatches, webviewMatches) {
            this.cell = cell;
            this.index = index;
            this._contentMatches = contentMatches;
            this._webviewMatches = webviewMatches;
        }
        getMatch(index) {
            if (index >= this.length) {
                throw new Error('NotebookCellFindMatch: index out of range');
            }
            if (index < this._contentMatches.length) {
                return this._contentMatches[index];
            }
            return this._webviewMatches[index - this._contentMatches.length];
        }
    }
    exports.CellFindMatchModel = CellFindMatchModel;
    let FindModel = class FindModel extends lifecycle_1.Disposable {
        get findMatches() {
            return this._findMatches;
        }
        get currentMatch() {
            return this._currentMatch;
        }
        constructor(_notebookEditor, _state, _configurationService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._state = _state;
            this._configurationService = _configurationService;
            this._findMatches = [];
            this._findMatchesStarts = null;
            this._currentMatch = -1;
            this._computePromise = null;
            this._modelDisposable = this._register(new lifecycle_1.DisposableStore());
            this._throttledDelayer = new async_1.Delayer(20);
            this._computePromise = null;
            this._register(_state.onFindReplaceStateChange(e => {
                this._updateCellStates(e);
                if (e.searchString || e.isRegex || e.matchCase || e.searchScope || e.wholeWord || (e.isRevealed && this._state.isRevealed) || e.filters || e.isReplaceRevealed) {
                    this.research();
                }
                if (e.isRevealed && !this._state.isRevealed) {
                    this.clear();
                }
            }));
            this._register(this._notebookEditor.onDidChangeModel(e => {
                this._registerModelListener(e);
            }));
            this._register(this._notebookEditor.onDidChangeCellState(e => {
                if (e.cell.cellKind === notebookCommon_1.CellKind.Markup && e.source.editStateChanged) {
                    // research when markdown cell is switching between markdown preview and editing mode.
                    this.research();
                }
            }));
            if (this._notebookEditor.hasModel()) {
                this._registerModelListener(this._notebookEditor.textModel);
            }
            this._findMatchDecorationModel = new findMatchDecorationModel_1.FindMatchDecorationModel(this._notebookEditor, this._notebookEditor.getId());
        }
        _updateCellStates(e) {
            if (!this._state.filters?.markupInput) {
                return;
            }
            if (!this._state.filters?.markupPreview) {
                return;
            }
            // we only update cell state if users are using the hybrid mode (both input and preview are enabled)
            const updateEditingState = () => {
                const viewModel = this._notebookEditor.getViewModel();
                if (!viewModel) {
                    return;
                }
                // search markup sources first to decide if a markup cell should be in editing mode
                const wordSeparators = this._configurationService.inspect('editor.wordSeparators').value;
                const options = {
                    regex: this._state.isRegex,
                    wholeWord: this._state.wholeWord,
                    caseSensitive: this._state.matchCase,
                    wordSeparators: wordSeparators,
                    includeMarkupInput: true,
                    includeCodeInput: false,
                    includeMarkupPreview: false,
                    includeOutput: false
                };
                const contentMatches = viewModel.find(this._state.searchString, options);
                for (let i = 0; i < viewModel.length; i++) {
                    const cell = viewModel.cellAt(i);
                    if (cell && cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        const foundContentMatch = contentMatches.find(m => m.cell.handle === cell.handle && m.contentMatches.length > 0);
                        const targetState = foundContentMatch ? notebookBrowser_1.CellEditState.Editing : notebookBrowser_1.CellEditState.Preview;
                        const currentEditingState = cell.getEditState();
                        if (currentEditingState === notebookBrowser_1.CellEditState.Editing && cell.editStateSource !== 'find') {
                            // it's already in editing mode, we should not update
                            continue;
                        }
                        if (currentEditingState !== targetState) {
                            cell.updateEditState(targetState, 'find');
                        }
                    }
                }
            };
            if (e.isReplaceRevealed && !this._state.isReplaceRevealed) {
                // replace is hidden, we need to switch all markdown cells to preview mode
                const viewModel = this._notebookEditor.getViewModel();
                if (!viewModel) {
                    return;
                }
                for (let i = 0; i < viewModel.length; i++) {
                    const cell = viewModel.cellAt(i);
                    if (cell && cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        if (cell.getEditState() === notebookBrowser_1.CellEditState.Editing && cell.editStateSource === 'find') {
                            cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'find');
                        }
                    }
                }
                return;
            }
            if (e.isReplaceRevealed) {
                updateEditingState();
            }
            else if ((e.filters || e.isRevealed || e.searchString || e.replaceString) && this._state.isRevealed && this._state.isReplaceRevealed) {
                updateEditingState();
            }
        }
        ensureFindMatches() {
            if (!this._findMatchesStarts) {
                this.set(this._findMatches, true);
            }
        }
        getCurrentMatch() {
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            const cell = this._findMatches[nextIndex.index].cell;
            const match = this._findMatches[nextIndex.index].getMatch(nextIndex.remainder);
            return {
                cell,
                match,
                isModelMatch: nextIndex.remainder < this._findMatches[nextIndex.index].contentMatches.length
            };
        }
        refreshCurrentMatch(focus) {
            const findMatchIndex = this.findMatches.findIndex(match => match.cell === focus.cell);
            if (findMatchIndex === -1) {
                return;
            }
            const findMatch = this.findMatches[findMatchIndex];
            const index = findMatch.contentMatches.findIndex(match => match.range.intersectRanges(focus.range) !== null);
            if (index === undefined) {
                return;
            }
            const matchesBefore = findMatchIndex === 0 ? 0 : (this._findMatchesStarts?.getPrefixSum(findMatchIndex - 1) ?? 0);
            this._currentMatch = matchesBefore + index;
            this.highlightCurrentFindMatchDecoration(findMatchIndex, index).then(offset => {
                this.revealCellRange(findMatchIndex, index, offset);
                this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
            });
        }
        find(option) {
            if (!this.findMatches.length) {
                return;
            }
            // let currCell;
            if (!this._findMatchesStarts) {
                this.set(this._findMatches, true);
                if ('index' in option) {
                    this._currentMatch = option.index;
                }
            }
            else {
                // const currIndex = this._findMatchesStarts!.getIndexOf(this._currentMatch);
                // currCell = this._findMatches[currIndex.index].cell;
                const totalVal = this._findMatchesStarts.getTotalSum();
                if ('index' in option) {
                    this._currentMatch = option.index;
                }
                else if (this._currentMatch === -1) {
                    this._currentMatch = option.previous ? totalVal - 1 : 0;
                }
                else {
                    const nextVal = (this._currentMatch + (option.previous ? -1 : 1) + totalVal) % totalVal;
                    this._currentMatch = nextVal;
                }
            }
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            // const newFocusedCell = this._findMatches[nextIndex.index].cell;
            this.highlightCurrentFindMatchDecoration(nextIndex.index, nextIndex.remainder).then(offset => {
                this.revealCellRange(nextIndex.index, nextIndex.remainder, offset);
                this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
            });
        }
        revealCellRange(cellIndex, matchIndex, outputOffset) {
            const findMatch = this._findMatches[cellIndex];
            if (matchIndex >= findMatch.contentMatches.length) {
                // reveal output range
                this._notebookEditor.focusElement(findMatch.cell);
                const index = this._notebookEditor.getCellIndex(findMatch.cell);
                if (index !== undefined) {
                    // const range: ICellRange = { start: index, end: index + 1 };
                    this._notebookEditor.revealCellOffsetInCenter(findMatch.cell, outputOffset ?? 0);
                }
            }
            else {
                const match = findMatch.getMatch(matchIndex);
                if (findMatch.cell.getEditState() !== notebookBrowser_1.CellEditState.Editing) {
                    findMatch.cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'find');
                }
                findMatch.cell.isInputCollapsed = false;
                this._notebookEditor.focusElement(findMatch.cell);
                this._notebookEditor.setCellEditorSelection(findMatch.cell, match.range);
                this._notebookEditor.revealRangeInCenterIfOutsideViewportAsync(findMatch.cell, match.range);
            }
        }
        _registerModelListener(notebookTextModel) {
            this._modelDisposable.clear();
            if (notebookTextModel) {
                this._modelDisposable.add(notebookTextModel.onDidChangeContent((e) => {
                    if (!e.rawEvents.some(event => event.kind === notebookCommon_1.NotebookCellsChangeType.ChangeCellContent || event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange)) {
                        return;
                    }
                    this.research();
                }));
            }
            this.research();
        }
        async research() {
            return this._throttledDelayer.trigger(async () => {
                this._state.change({ isSearching: true }, false);
                await this._research();
                this._state.change({ isSearching: false }, false);
            });
        }
        async _research() {
            this._computePromise?.cancel();
            if (!this._state.isRevealed || !this._notebookEditor.hasModel()) {
                this.set([], false);
                return;
            }
            this._computePromise = (0, async_1.createCancelablePromise)(token => this._compute(token));
            const findMatches = await this._computePromise;
            if (!findMatches) {
                this.set([], false);
                return;
            }
            if (findMatches.length === 0) {
                this.set([], false);
                return;
            }
            const findFirstMatchAfterCellIndex = (cellIndex) => {
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches.map(match => match.index), index => index >= cellIndex);
                this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
            };
            if (this._currentMatch === -1) {
                // no active current match
                if (this._notebookEditor.getLength() === 0) {
                    this.set(findMatches, false);
                    return;
                }
                else {
                    const focus = this._notebookEditor.getFocus().start;
                    findFirstMatchAfterCellIndex(focus);
                    this.set(findMatches, false);
                    return;
                }
            }
            const oldCurrIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            const oldCurrCell = this._findMatches[oldCurrIndex.index].cell;
            const oldCurrMatchCellIndex = this._notebookEditor.getCellIndex(oldCurrCell);
            if (oldCurrMatchCellIndex < 0) {
                // the cell containing the active match is deleted
                if (this._notebookEditor.getLength() === 0) {
                    this.set(findMatches, false);
                    return;
                }
                findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                return;
            }
            // the cell still exist
            const cell = this._notebookEditor.cellAt(oldCurrMatchCellIndex);
            // we will try restore the active find match in this cell, if it contains any find match
            if (cell.cellKind === notebookCommon_1.CellKind.Markup && cell.getEditState() === notebookBrowser_1.CellEditState.Preview) {
                // find first match in this cell or below
                findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                return;
            }
            // the cell is a markup cell in editing mode or a code cell, both should have monaco editor rendered
            if (!this._findMatchDecorationModel.currentMatchDecorations) {
                // no current highlight decoration
                findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                return;
            }
            // check if there is monaco editor selection and find the first match, otherwise find the first match above current cell
            // this._findMatches[cellIndex].matches[matchIndex].range
            if (this._findMatchDecorationModel.currentMatchDecorations.kind === 'input') {
                const currentMatchDecorationId = this._findMatchDecorationModel.currentMatchDecorations.decorations.find(decoration => decoration.ownerId === cell.handle);
                if (!currentMatchDecorationId) {
                    // current match decoration is no longer valid
                    findFirstMatchAfterCellIndex(oldCurrMatchCellIndex);
                    return;
                }
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches, match => match.index >= oldCurrMatchCellIndex) % findMatches.length;
                if (findMatches[matchAfterSelection].index > oldCurrMatchCellIndex) {
                    // there is no search result in curr cell anymore, find the nearest one (from top to bottom)
                    this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
                    return;
                }
                else {
                    // there are still some search results in current cell
                    let currMatchRangeInEditor = cell.editorAttached && currentMatchDecorationId.decorations[0] ? cell.getCellDecorationRange(currentMatchDecorationId.decorations[0]) : null;
                    if (currMatchRangeInEditor === null && oldCurrIndex.remainder < this._findMatches[oldCurrIndex.index].contentMatches.length) {
                        currMatchRangeInEditor = this._findMatches[oldCurrIndex.index].getMatch(oldCurrIndex.remainder).range;
                    }
                    if (currMatchRangeInEditor !== null) {
                        // we find a range for the previous current match, let's find the nearest one after it (can overlap)
                        const cellMatch = findMatches[matchAfterSelection];
                        const matchAfterOldSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(cellMatch.contentMatches, match => range_1.Range.compareRangesUsingStarts(match.range, currMatchRangeInEditor) >= 0);
                        this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection) + matchAfterOldSelection);
                    }
                    else {
                        // no range found, let's fall back to finding the nearest match
                        this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
                        return;
                    }
                }
            }
            else {
                // output now has the highlight
                const matchAfterSelection = (0, arraysFind_1.findFirstIdxMonotonousOrArrLen)(findMatches.map(match => match.index), index => index >= oldCurrMatchCellIndex) % findMatches.length;
                this._updateCurrentMatch(findMatches, this._matchesCountBeforeIndex(findMatches, matchAfterSelection));
            }
        }
        set(cellFindMatches, autoStart) {
            if (!cellFindMatches || !cellFindMatches.length) {
                this._findMatches = [];
                this._findMatchDecorationModel.setAllFindMatchesDecorations([]);
                this.constructFindMatchesStarts();
                this._currentMatch = -1;
                this._findMatchDecorationModel.clearCurrentFindMatchDecoration();
                this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
                return;
            }
            // all matches
            this._findMatches = cellFindMatches;
            this._findMatchDecorationModel.setAllFindMatchesDecorations(cellFindMatches || []);
            // current match
            this.constructFindMatchesStarts();
            if (autoStart) {
                this._currentMatch = 0;
                this.highlightCurrentFindMatchDecoration(0, 0);
            }
            this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
        }
        async _compute(token) {
            if (!this._notebookEditor.hasModel()) {
                return null;
            }
            let ret = null;
            const val = this._state.searchString;
            const wordSeparators = this._configurationService.inspect('editor.wordSeparators').value;
            const options = {
                regex: this._state.isRegex,
                wholeWord: this._state.wholeWord,
                caseSensitive: this._state.matchCase,
                wordSeparators: wordSeparators,
                includeMarkupInput: this._state.filters?.markupInput ?? true,
                includeCodeInput: this._state.filters?.codeInput ?? true,
                includeMarkupPreview: !!this._state.filters?.markupPreview,
                includeOutput: !!this._state.filters?.codeOutput
            };
            ret = await this._notebookEditor.find(val, options, token);
            if (token.isCancellationRequested) {
                return null;
            }
            return ret;
        }
        _updateCurrentMatch(findMatches, currentMatchesPosition) {
            this._currentMatch = currentMatchesPosition % findMatches.length;
            this.set(findMatches, false);
            const nextIndex = this._findMatchesStarts.getIndexOf(this._currentMatch);
            this.highlightCurrentFindMatchDecoration(nextIndex.index, nextIndex.remainder);
            this._state.changeMatchInfo(this._currentMatch, this._findMatches.reduce((p, c) => p + c.length, 0), undefined);
        }
        _matchesCountBeforeIndex(findMatches, index) {
            let prevMatchesCount = 0;
            for (let i = 0; i < index; i++) {
                prevMatchesCount += findMatches[i].length;
            }
            return prevMatchesCount;
        }
        constructFindMatchesStarts() {
            if (this._findMatches && this._findMatches.length) {
                const values = new Uint32Array(this._findMatches.length);
                for (let i = 0; i < this._findMatches.length; i++) {
                    values[i] = this._findMatches[i].length;
                }
                this._findMatchesStarts = new prefixSumComputer_1.PrefixSumComputer(values);
            }
            else {
                this._findMatchesStarts = null;
            }
        }
        async highlightCurrentFindMatchDecoration(cellIndex, matchIndex) {
            const cell = this._findMatches[cellIndex].cell;
            const match = this._findMatches[cellIndex].getMatch(matchIndex);
            if (matchIndex < this._findMatches[cellIndex].contentMatches.length) {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInCell(cell, match.range);
            }
            else {
                return this._findMatchDecorationModel.highlightCurrentFindMatchDecorationInWebview(cell, match.index);
            }
        }
        clear() {
            this._computePromise?.cancel();
            this._throttledDelayer.cancel();
            this.set([], false);
        }
        dispose() {
            this._findMatchDecorationModel.dispose();
            super.dispose();
        }
    };
    exports.FindModel = FindModel;
    exports.FindModel = FindModel = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], FindModel);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZmluZC9maW5kTW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRyxNQUFhLGtCQUFrQjtRQUs5QixJQUFJLE1BQU07WUFDVCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDO1FBQ2xFLENBQUM7UUFFRCxJQUFJLGNBQWM7WUFDakIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFRCxJQUFJLGNBQWM7WUFDakIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFRCxZQUFZLElBQW9CLEVBQUUsS0FBYSxFQUFFLGNBQTJCLEVBQUUsY0FBc0M7WUFDbkgsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDakIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7WUFDdEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxjQUFjLENBQUM7UUFDdkMsQ0FBQztRQUVELFFBQVEsQ0FBQyxLQUFhO1lBQ3JCLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFRCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUN6QyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEMsQ0FB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