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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/cursor/cursorMoveCommands", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/contrib/find/browser/findController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/wordHighlighter/browser/highlightDecorations", "vs/platform/instantiation/common/instantiation"], function (require, exports, aria_1, async_1, keyCodes_1, lifecycle_1, editorExtensions_1, cursorMoveCommands_1, range_1, selection_1, editorContextKeys_1, findController_1, nls, actions_1, contextkey_1, languageFeatures_1, highlightDecorations_1, instantiation_1) {
    "use strict";
    var SelectionHighlighter_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FocusPreviousCursor = exports.FocusNextCursor = exports.SelectionHighlighter = exports.CompatChangeAll = exports.SelectHighlightsAction = exports.MoveSelectionToPreviousFindMatchAction = exports.MoveSelectionToNextFindMatchAction = exports.AddSelectionToPreviousFindMatchAction = exports.AddSelectionToNextFindMatchAction = exports.MultiCursorSelectionControllerAction = exports.MultiCursorSelectionController = exports.MultiCursorSession = exports.MultiCursorSessionResult = exports.InsertCursorBelow = exports.InsertCursorAbove = void 0;
    function announceCursorChange(previousCursorState, cursorState) {
        const cursorDiff = cursorState.filter(cs => !previousCursorState.find(pcs => pcs.equals(cs)));
        if (cursorDiff.length >= 1) {
            const cursorPositions = cursorDiff.map(cs => `line ${cs.viewState.position.lineNumber} column ${cs.viewState.position.column}`).join(', ');
            const msg = cursorDiff.length === 1 ? nls.localize('cursorAdded', "Cursor added: {0}", cursorPositions) : nls.localize('cursorsAdded', "Cursors added: {0}", cursorPositions);
            (0, aria_1.status)(msg);
        }
    }
    class InsertCursorAbove extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertCursorAbove',
                label: nls.localize('mutlicursor.insertAbove', "Add Cursor Above"),
                alias: 'Add Cursor Above',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                    linux: {
                        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */]
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miInsertCursorAbove', comment: ['&& denotes a mnemonic'] }, "&&Add Cursor Above"),
                    order: 2
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            let useLogicalLine = true;
            if (args && args.logicalLine === false) {
                useLogicalLine = false;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = viewModel.getCursorStates();
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.addCursorUp(viewModel, previousCursorState, useLogicalLine));
            viewModel.revealTopMostCursor(args.source);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.InsertCursorAbove = InsertCursorAbove;
    class InsertCursorBelow extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertCursorBelow',
                label: nls.localize('mutlicursor.insertBelow', "Add Cursor Below"),
                alias: 'Add Cursor Below',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                    linux: {
                        primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */]
                    },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miInsertCursorBelow', comment: ['&& denotes a mnemonic'] }, "A&&dd Cursor Below"),
                    order: 3
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            let useLogicalLine = true;
            if (args && args.logicalLine === false) {
                useLogicalLine = false;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = viewModel.getCursorStates();
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, cursorMoveCommands_1.CursorMoveCommands.addCursorDown(viewModel, previousCursorState, useLogicalLine));
            viewModel.revealBottomMostCursor(args.source);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.InsertCursorBelow = InsertCursorBelow;
    class InsertCursorAtEndOfEachLineSelected extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertCursorAtEndOfEachLineSelected',
                label: nls.localize('mutlicursor.insertAtEndOfEachLineSelected', "Add Cursors to Line Ends"),
                alias: 'Add Cursors to Line Ends',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miInsertCursorAtEndOfEachLineSelected', comment: ['&& denotes a mnemonic'] }, "Add C&&ursors to Line Ends"),
                    order: 4
                }
            });
        }
        getCursorsForSelection(selection, model, result) {
            if (selection.isEmpty()) {
                return;
            }
            for (let i = selection.startLineNumber; i < selection.endLineNumber; i++) {
                const currentLineMaxColumn = model.getLineMaxColumn(i);
                result.push(new selection_1.Selection(i, currentLineMaxColumn, i, currentLineMaxColumn));
            }
            if (selection.endColumn > 1) {
                result.push(new selection_1.Selection(selection.endLineNumber, selection.endColumn, selection.endLineNumber, selection.endColumn));
            }
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            const selections = editor.getSelections();
            const viewModel = editor._getViewModel();
            const previousCursorState = viewModel.getCursorStates();
            const newSelections = [];
            selections.forEach((sel) => this.getCursorsForSelection(sel, model, newSelections));
            if (newSelections.length > 0) {
                editor.setSelections(newSelections);
            }
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    class InsertCursorAtEndOfLineSelected extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.addCursorsToBottom',
                label: nls.localize('mutlicursor.addCursorsToBottom', "Add Cursors To Bottom"),
                alias: 'Add Cursors To Bottom',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections();
            const lineCount = editor.getModel().getLineCount();
            const newSelections = [];
            for (let i = selections[0].startLineNumber; i <= lineCount; i++) {
                newSelections.push(new selection_1.Selection(i, selections[0].startColumn, i, selections[0].endColumn));
            }
            const viewModel = editor._getViewModel();
            const previousCursorState = viewModel.getCursorStates();
            if (newSelections.length > 0) {
                editor.setSelections(newSelections);
            }
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    class InsertCursorAtTopOfLineSelected extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.addCursorsToTop',
                label: nls.localize('mutlicursor.addCursorsToTop', "Add Cursors To Top"),
                alias: 'Add Cursors To Top',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections();
            const newSelections = [];
            for (let i = selections[0].startLineNumber; i >= 1; i--) {
                newSelections.push(new selection_1.Selection(i, selections[0].startColumn, i, selections[0].endColumn));
            }
            const viewModel = editor._getViewModel();
            const previousCursorState = viewModel.getCursorStates();
            if (newSelections.length > 0) {
                editor.setSelections(newSelections);
            }
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    class MultiCursorSessionResult {
        constructor(selections, revealRange, revealScrollType) {
            this.selections = selections;
            this.revealRange = revealRange;
            this.revealScrollType = revealScrollType;
        }
    }
    exports.MultiCursorSessionResult = MultiCursorSessionResult;
    class MultiCursorSession {
        static create(editor, findController) {
            if (!editor.hasModel()) {
                return null;
            }
            const findState = findController.getState();
            // Find widget owns entirely what we search for if:
            //  - focus is not in the editor (i.e. it is in the find widget)
            //  - and the search widget is visible
            //  - and the search string is non-empty
            if (!editor.hasTextFocus() && findState.isRevealed && findState.searchString.length > 0) {
                // Find widget owns what is searched for
                return new MultiCursorSession(editor, findController, false, findState.searchString, findState.wholeWord, findState.matchCase, null);
            }
            // Otherwise, the selection gives the search text, and the find widget gives the search settings
            // The exception is the find state disassociation case: when beginning with a single, collapsed selection
            let isDisconnectedFromFindController = false;
            let wholeWord;
            let matchCase;
            const selections = editor.getSelections();
            if (selections.length === 1 && selections[0].isEmpty()) {
                isDisconnectedFromFindController = true;
                wholeWord = true;
                matchCase = true;
            }
            else {
                wholeWord = findState.wholeWord;
                matchCase = findState.matchCase;
            }
            // Selection owns what is searched for
            const s = editor.getSelection();
            let searchText;
            let currentMatch = null;
            if (s.isEmpty()) {
                // selection is empty => expand to current word
                const word = editor.getConfiguredWordAtPosition(s.getStartPosition());
                if (!word) {
                    return null;
                }
                searchText = word.word;
                currentMatch = new selection_1.Selection(s.startLineNumber, word.startColumn, s.startLineNumber, word.endColumn);
            }
            else {
                searchText = editor.getModel().getValueInRange(s).replace(/\r\n/g, '\n');
            }
            return new MultiCursorSession(editor, findController, isDisconnectedFromFindController, searchText, wholeWord, matchCase, currentMatch);
        }
        constructor(_editor, findController, isDisconnectedFromFindController, searchText, wholeWord, matchCase, currentMatch) {
            this._editor = _editor;
            this.findController = findController;
            this.isDisconnectedFromFindController = isDisconnectedFromFindController;
            this.searchText = searchText;
            this.wholeWord = wholeWord;
            this.matchCase = matchCase;
            this.currentMatch = currentMatch;
        }
        addSelectionToNextFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const nextMatch = this._getNextMatch();
            if (!nextMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.concat(nextMatch), nextMatch, 0 /* ScrollType.Smooth */);
        }
        moveSelectionToNextFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const nextMatch = this._getNextMatch();
            if (!nextMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.slice(0, allSelections.length - 1).concat(nextMatch), nextMatch, 0 /* ScrollType.Smooth */);
        }
        _getNextMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            if (this.currentMatch) {
                const result = this.currentMatch;
                this.currentMatch = null;
                return result;
            }
            this.findController.highlightFindOptions();
            const allSelections = this._editor.getSelections();
            const lastAddedSelection = allSelections[allSelections.length - 1];
            const nextMatch = this._editor.getModel().findNextMatch(this.searchText, lastAddedSelection.getEndPosition(), false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false);
            if (!nextMatch) {
                return null;
            }
            return new selection_1.Selection(nextMatch.range.startLineNumber, nextMatch.range.startColumn, nextMatch.range.endLineNumber, nextMatch.range.endColumn);
        }
        addSelectionToPreviousFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const previousMatch = this._getPreviousMatch();
            if (!previousMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.concat(previousMatch), previousMatch, 0 /* ScrollType.Smooth */);
        }
        moveSelectionToPreviousFindMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            const previousMatch = this._getPreviousMatch();
            if (!previousMatch) {
                return null;
            }
            const allSelections = this._editor.getSelections();
            return new MultiCursorSessionResult(allSelections.slice(0, allSelections.length - 1).concat(previousMatch), previousMatch, 0 /* ScrollType.Smooth */);
        }
        _getPreviousMatch() {
            if (!this._editor.hasModel()) {
                return null;
            }
            if (this.currentMatch) {
                const result = this.currentMatch;
                this.currentMatch = null;
                return result;
            }
            this.findController.highlightFindOptions();
            const allSelections = this._editor.getSelections();
            const lastAddedSelection = allSelections[allSelections.length - 1];
            const previousMatch = this._editor.getModel().findPreviousMatch(this.searchText, lastAddedSelection.getStartPosition(), false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false);
            if (!previousMatch) {
                return null;
            }
            return new selection_1.Selection(previousMatch.range.startLineNumber, previousMatch.range.startColumn, previousMatch.range.endLineNumber, previousMatch.range.endColumn);
        }
        selectAll(searchScope) {
            if (!this._editor.hasModel()) {
                return [];
            }
            this.findController.highlightFindOptions();
            const editorModel = this._editor.getModel();
            if (searchScope) {
                return editorModel.findMatches(this.searchText, searchScope, false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
            }
            return editorModel.findMatches(this.searchText, true, false, this.matchCase, this.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        }
    }
    exports.MultiCursorSession = MultiCursorSession;
    class MultiCursorSelectionController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.multiCursorController'; }
        static get(editor) {
            return editor.getContribution(MultiCursorSelectionController.ID);
        }
        constructor(editor) {
            super();
            this._sessionDispose = this._register(new lifecycle_1.DisposableStore());
            this._editor = editor;
            this._ignoreSelectionChange = false;
            this._session = null;
        }
        dispose() {
            this._endSession();
            super.dispose();
        }
        _beginSessionIfNeeded(findController) {
            if (!this._session) {
                // Create a new session
                const session = MultiCursorSession.create(this._editor, findController);
                if (!session) {
                    return;
                }
                this._session = session;
                const newState = { searchString: this._session.searchText };
                if (this._session.isDisconnectedFromFindController) {
                    newState.wholeWordOverride = 1 /* FindOptionOverride.True */;
                    newState.matchCaseOverride = 1 /* FindOptionOverride.True */;
                    newState.isRegexOverride = 2 /* FindOptionOverride.False */;
                }
                findController.getState().change(newState, false);
                this._sessionDispose.add(this._editor.onDidChangeCursorSelection((e) => {
                    if (this._ignoreSelectionChange) {
                        return;
                    }
                    this._endSession();
                }));
                this._sessionDispose.add(this._editor.onDidBlurEditorText(() => {
                    this._endSession();
                }));
                this._sessionDispose.add(findController.getState().onFindReplaceStateChange((e) => {
                    if (e.matchCase || e.wholeWord) {
                        this._endSession();
                    }
                }));
            }
        }
        _endSession() {
            this._sessionDispose.clear();
            if (this._session && this._session.isDisconnectedFromFindController) {
                const newState = {
                    wholeWordOverride: 0 /* FindOptionOverride.NotSet */,
                    matchCaseOverride: 0 /* FindOptionOverride.NotSet */,
                    isRegexOverride: 0 /* FindOptionOverride.NotSet */,
                };
                this._session.findController.getState().change(newState, false);
            }
            this._session = null;
        }
        _setSelections(selections) {
            this._ignoreSelectionChange = true;
            this._editor.setSelections(selections);
            this._ignoreSelectionChange = false;
        }
        _expandEmptyToWord(model, selection) {
            if (!selection.isEmpty()) {
                return selection;
            }
            const word = this._editor.getConfiguredWordAtPosition(selection.getStartPosition());
            if (!word) {
                return selection;
            }
            return new selection_1.Selection(selection.startLineNumber, word.startColumn, selection.startLineNumber, word.endColumn);
        }
        _applySessionResult(result) {
            if (!result) {
                return;
            }
            this._setSelections(result.selections);
            if (result.revealRange) {
                this._editor.revealRangeInCenterIfOutsideViewport(result.revealRange, result.revealScrollType);
            }
        }
        getSession(findController) {
            return this._session;
        }
        addSelectionToNextFindMatch(findController) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (!this._session) {
                // If there are multiple cursors, handle the case where they do not all select the same text.
                const allSelections = this._editor.getSelections();
                if (allSelections.length > 1) {
                    const findState = findController.getState();
                    const matchCase = findState.matchCase;
                    const selectionsContainSameText = modelRangesContainSameText(this._editor.getModel(), allSelections, matchCase);
                    if (!selectionsContainSameText) {
                        const model = this._editor.getModel();
                        const resultingSelections = [];
                        for (let i = 0, len = allSelections.length; i < len; i++) {
                            resultingSelections[i] = this._expandEmptyToWord(model, allSelections[i]);
                        }
                        this._editor.setSelections(resultingSelections);
                        return;
                    }
                }
            }
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.addSelectionToNextFindMatch());
            }
        }
        addSelectionToPreviousFindMatch(findController) {
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.addSelectionToPreviousFindMatch());
            }
        }
        moveSelectionToNextFindMatch(findController) {
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.moveSelectionToNextFindMatch());
            }
        }
        moveSelectionToPreviousFindMatch(findController) {
            this._beginSessionIfNeeded(findController);
            if (this._session) {
                this._applySessionResult(this._session.moveSelectionToPreviousFindMatch());
            }
        }
        selectAll(findController) {
            if (!this._editor.hasModel()) {
                return;
            }
            let matches = null;
            const findState = findController.getState();
            // Special case: find widget owns entirely what we search for if:
            // - focus is not in the editor (i.e. it is in the find widget)
            // - and the search widget is visible
            // - and the search string is non-empty
            // - and we're searching for a regex
            if (findState.isRevealed && findState.searchString.length > 0 && findState.isRegex) {
                const editorModel = this._editor.getModel();
                if (findState.searchScope) {
                    matches = editorModel.findMatches(findState.searchString, findState.searchScope, findState.isRegex, findState.matchCase, findState.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
                }
                else {
                    matches = editorModel.findMatches(findState.searchString, true, findState.isRegex, findState.matchCase, findState.wholeWord ? this._editor.getOption(131 /* EditorOption.wordSeparators */) : null, false, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
                }
            }
            else {
                this._beginSessionIfNeeded(findController);
                if (!this._session) {
                    return;
                }
                matches = this._session.selectAll(findState.searchScope);
            }
            if (matches.length > 0) {
                const editorSelection = this._editor.getSelection();
                // Have the primary cursor remain the one where the action was invoked
                for (let i = 0, len = matches.length; i < len; i++) {
                    const match = matches[i];
                    const intersection = match.range.intersectRanges(editorSelection);
                    if (intersection) {
                        // bingo!
                        matches[i] = matches[0];
                        matches[0] = match;
                        break;
                    }
                }
                this._setSelections(matches.map(m => new selection_1.Selection(m.range.startLineNumber, m.range.startColumn, m.range.endLineNumber, m.range.endColumn)));
            }
        }
        selectAllUsingSelections(selections) {
            if (selections.length > 0) {
                this._setSelections(selections);
            }
        }
    }
    exports.MultiCursorSelectionController = MultiCursorSelectionController;
    class MultiCursorSelectionControllerAction extends editorExtensions_1.EditorAction {
        run(accessor, editor) {
            const multiCursorController = MultiCursorSelectionController.get(editor);
            if (!multiCursorController) {
                return;
            }
            const viewModel = editor._getViewModel();
            if (viewModel) {
                const previousCursorState = viewModel.getCursorStates();
                const findController = findController_1.CommonFindController.get(editor);
                if (findController) {
                    this._run(multiCursorController, findController);
                }
                else {
                    const newFindController = accessor.get(instantiation_1.IInstantiationService).createInstance(findController_1.CommonFindController, editor);
                    this._run(multiCursorController, newFindController);
                    newFindController.dispose();
                }
                announceCursorChange(previousCursorState, viewModel.getCursorStates());
            }
        }
    }
    exports.MultiCursorSelectionControllerAction = MultiCursorSelectionControllerAction;
    class AddSelectionToNextFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.addSelectionToNextFindMatch',
                label: nls.localize('addSelectionToNextFindMatch', "Add Selection To Next Find Match"),
                alias: 'Add Selection To Next Find Match',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 34 /* KeyCode.KeyD */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miAddSelectionToNextFindMatch', comment: ['&& denotes a mnemonic'] }, "Add &&Next Occurrence"),
                    order: 5
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.addSelectionToNextFindMatch(findController);
        }
    }
    exports.AddSelectionToNextFindMatchAction = AddSelectionToNextFindMatchAction;
    class AddSelectionToPreviousFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.addSelectionToPreviousFindMatch',
                label: nls.localize('addSelectionToPreviousFindMatch', "Add Selection To Previous Find Match"),
                alias: 'Add Selection To Previous Find Match',
                precondition: undefined,
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miAddSelectionToPreviousFindMatch', comment: ['&& denotes a mnemonic'] }, "Add P&&revious Occurrence"),
                    order: 6
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.addSelectionToPreviousFindMatch(findController);
        }
    }
    exports.AddSelectionToPreviousFindMatchAction = AddSelectionToPreviousFindMatchAction;
    class MoveSelectionToNextFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.moveSelectionToNextFindMatch',
                label: nls.localize('moveSelectionToNextFindMatch', "Move Last Selection To Next Find Match"),
                alias: 'Move Last Selection To Next Find Match',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 34 /* KeyCode.KeyD */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.moveSelectionToNextFindMatch(findController);
        }
    }
    exports.MoveSelectionToNextFindMatchAction = MoveSelectionToNextFindMatchAction;
    class MoveSelectionToPreviousFindMatchAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.moveSelectionToPreviousFindMatch',
                label: nls.localize('moveSelectionToPreviousFindMatch', "Move Last Selection To Previous Find Match"),
                alias: 'Move Last Selection To Previous Find Match',
                precondition: undefined
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.moveSelectionToPreviousFindMatch(findController);
        }
    }
    exports.MoveSelectionToPreviousFindMatchAction = MoveSelectionToPreviousFindMatchAction;
    class SelectHighlightsAction extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.selectHighlights',
                label: nls.localize('selectAllOccurrencesOfFindMatch', "Select All Occurrences of Find Match"),
                alias: 'Select All Occurrences of Find Match',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '3_multi',
                    title: nls.localize({ key: 'miSelectHighlights', comment: ['&& denotes a mnemonic'] }, "Select All &&Occurrences"),
                    order: 7
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.selectAll(findController);
        }
    }
    exports.SelectHighlightsAction = SelectHighlightsAction;
    class CompatChangeAll extends MultiCursorSelectionControllerAction {
        constructor() {
            super({
                id: 'editor.action.changeAll',
                label: nls.localize('changeAll.label', "Change All Occurrences"),
                alias: 'Change All Occurrences',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 60 /* KeyCode.F2 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.2
                }
            });
        }
        _run(multiCursorController, findController) {
            multiCursorController.selectAll(findController);
        }
    }
    exports.CompatChangeAll = CompatChangeAll;
    class SelectionHighlighterState {
        constructor(_model, _searchText, _matchCase, _wordSeparators, prevState) {
            this._model = _model;
            this._searchText = _searchText;
            this._matchCase = _matchCase;
            this._wordSeparators = _wordSeparators;
            this._modelVersionId = this._model.getVersionId();
            this._cachedFindMatches = null;
            if (prevState
                && this._model === prevState._model
                && this._searchText === prevState._searchText
                && this._matchCase === prevState._matchCase
                && this._wordSeparators === prevState._wordSeparators
                && this._modelVersionId === prevState._modelVersionId) {
                this._cachedFindMatches = prevState._cachedFindMatches;
            }
        }
        findMatches() {
            if (this._cachedFindMatches === null) {
                this._cachedFindMatches = this._model.findMatches(this._searchText, true, false, this._matchCase, this._wordSeparators, false).map(m => m.range);
                this._cachedFindMatches.sort(range_1.Range.compareRangesUsingStarts);
            }
            return this._cachedFindMatches;
        }
    }
    let SelectionHighlighter = class SelectionHighlighter extends lifecycle_1.Disposable {
        static { SelectionHighlighter_1 = this; }
        static { this.ID = 'editor.contrib.selectionHighlighter'; }
        constructor(editor, _languageFeaturesService) {
            super();
            this._languageFeaturesService = _languageFeaturesService;
            this.editor = editor;
            this._isEnabled = editor.getOption(108 /* EditorOption.selectionHighlight */);
            this._decorations = editor.createDecorationsCollection();
            this.updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 300));
            this.state = null;
            this._register(editor.onDidChangeConfiguration((e) => {
                this._isEnabled = editor.getOption(108 /* EditorOption.selectionHighlight */);
            }));
            this._register(editor.onDidChangeCursorSelection((e) => {
                if (!this._isEnabled) {
                    // Early exit if nothing needs to be done!
                    // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                    return;
                }
                if (e.selection.isEmpty()) {
                    if (e.reason === 3 /* CursorChangeReason.Explicit */) {
                        if (this.state) {
                            // no longer valid
                            this._setState(null);
                        }
                        this.updateSoon.schedule();
                    }
                    else {
                        this._setState(null);
                    }
                }
                else {
                    this._update();
                }
            }));
            this._register(editor.onDidChangeModel((e) => {
                this._setState(null);
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                if (this._isEnabled) {
                    this.updateSoon.schedule();
                }
            }));
            const findController = findController_1.CommonFindController.get(editor);
            if (findController) {
                this._register(findController.getState().onFindReplaceStateChange((e) => {
                    this._update();
                }));
            }
            this.updateSoon.schedule();
        }
        _update() {
            this._setState(SelectionHighlighter_1._createState(this.state, this._isEnabled, this.editor));
        }
        static _createState(oldState, isEnabled, editor) {
            if (!isEnabled) {
                return null;
            }
            if (!editor.hasModel()) {
                return null;
            }
            const s = editor.getSelection();
            if (s.startLineNumber !== s.endLineNumber) {
                // multiline forbidden for perf reasons
                return null;
            }
            const multiCursorController = MultiCursorSelectionController.get(editor);
            if (!multiCursorController) {
                return null;
            }
            const findController = findController_1.CommonFindController.get(editor);
            if (!findController) {
                return null;
            }
            let r = multiCursorController.getSession(findController);
            if (!r) {
                const allSelections = editor.getSelections();
                if (allSelections.length > 1) {
                    const findState = findController.getState();
                    const matchCase = findState.matchCase;
                    const selectionsContainSameText = modelRangesContainSameText(editor.getModel(), allSelections, matchCase);
                    if (!selectionsContainSameText) {
                        return null;
                    }
                }
                r = MultiCursorSession.create(editor, findController);
            }
            if (!r) {
                return null;
            }
            if (r.currentMatch) {
                // This is an empty selection
                // Do not interfere with semantic word highlighting in the no selection case
                return null;
            }
            if (/^[ \t]+$/.test(r.searchText)) {
                // whitespace only selection
                return null;
            }
            if (r.searchText.length > 200) {
                // very long selection
                return null;
            }
            // TODO: better handling of this case
            const findState = findController.getState();
            const caseSensitive = findState.matchCase;
            // Return early if the find widget shows the exact same matches
            if (findState.isRevealed) {
                let findStateSearchString = findState.searchString;
                if (!caseSensitive) {
                    findStateSearchString = findStateSearchString.toLowerCase();
                }
                let mySearchString = r.searchText;
                if (!caseSensitive) {
                    mySearchString = mySearchString.toLowerCase();
                }
                if (findStateSearchString === mySearchString && r.matchCase === findState.matchCase && r.wholeWord === findState.wholeWord && !findState.isRegex) {
                    return null;
                }
            }
            return new SelectionHighlighterState(editor.getModel(), r.searchText, r.matchCase, r.wholeWord ? editor.getOption(131 /* EditorOption.wordSeparators */) : null, oldState);
        }
        _setState(newState) {
            this.state = newState;
            if (!this.state) {
                this._decorations.clear();
                return;
            }
            if (!this.editor.hasModel()) {
                return;
            }
            const model = this.editor.getModel();
            if (model.isTooLargeForTokenization()) {
                // the file is too large, so searching word under cursor in the whole document would be blocking the UI.
                return;
            }
            const allMatches = this.state.findMatches();
            const selections = this.editor.getSelections();
            selections.sort(range_1.Range.compareRangesUsingStarts);
            // do not overlap with selection (issue #64 and #512)
            const matches = [];
            for (let i = 0, j = 0, len = allMatches.length, lenJ = selections.length; i < len;) {
                const match = allMatches[i];
                if (j >= lenJ) {
                    // finished all editor selections
                    matches.push(match);
                    i++;
                }
                else {
                    const cmp = range_1.Range.compareRangesUsingStarts(match, selections[j]);
                    if (cmp < 0) {
                        // match is before sel
                        if (selections[j].isEmpty() || !range_1.Range.areIntersecting(match, selections[j])) {
                            matches.push(match);
                        }
                        i++;
                    }
                    else if (cmp > 0) {
                        // sel is before match
                        j++;
                    }
                    else {
                        // sel is equal to match
                        i++;
                        j++;
                    }
                }
            }
            const occurrenceHighlighting = this.editor.getOption(81 /* EditorOption.occurrencesHighlight */) !== 'off';
            const hasSemanticHighlights = this._languageFeaturesService.documentHighlightProvider.has(model) && occurrenceHighlighting;
            const decorations = matches.map(r => {
                return {
                    range: r,
                    options: (0, highlightDecorations_1.getSelectionHighlightDecorationOptions)(hasSemanticHighlights)
                };
            });
            this._decorations.set(decorations);
        }
        dispose() {
            this._setState(null);
            super.dispose();
        }
    };
    exports.SelectionHighlighter = SelectionHighlighter;
    exports.SelectionHighlighter = SelectionHighlighter = SelectionHighlighter_1 = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], SelectionHighlighter);
    function modelRangesContainSameText(model, ranges, matchCase) {
        const selectedText = getValueInRange(model, ranges[0], !matchCase);
        for (let i = 1, len = ranges.length; i < len; i++) {
            const range = ranges[i];
            if (range.isEmpty()) {
                return false;
            }
            const thisSelectedText = getValueInRange(model, range, !matchCase);
            if (selectedText !== thisSelectedText) {
                return false;
            }
        }
        return true;
    }
    function getValueInRange(model, range, toLowerCase) {
        const text = model.getValueInRange(range);
        return (toLowerCase ? text.toLowerCase() : text);
    }
    class FocusNextCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.focusNextCursor',
                label: nls.localize('mutlicursor.focusNextCursor', "Focus Next Cursor"),
                metadata: {
                    description: nls.localize('mutlicursor.focusNextCursor.description', "Focuses the next cursor"),
                    args: [],
                },
                alias: 'Focus Next Cursor',
                precondition: undefined
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = Array.from(viewModel.getCursorStates());
            const firstCursor = previousCursorState.shift();
            if (!firstCursor) {
                return;
            }
            previousCursorState.push(firstCursor);
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, previousCursorState);
            viewModel.revealPrimaryCursor(args.source, true);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.FocusNextCursor = FocusNextCursor;
    class FocusPreviousCursor extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.focusPreviousCursor',
                label: nls.localize('mutlicursor.focusPreviousCursor', "Focus Previous Cursor"),
                metadata: {
                    description: nls.localize('mutlicursor.focusPreviousCursor.description', "Focuses the previous cursor"),
                    args: [],
                },
                alias: 'Focus Previous Cursor',
                precondition: undefined
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const viewModel = editor._getViewModel();
            if (viewModel.cursorConfig.readOnly) {
                return;
            }
            viewModel.model.pushStackElement();
            const previousCursorState = Array.from(viewModel.getCursorStates());
            const firstCursor = previousCursorState.pop();
            if (!firstCursor) {
                return;
            }
            previousCursorState.unshift(firstCursor);
            viewModel.setCursorStates(args.source, 3 /* CursorChangeReason.Explicit */, previousCursorState);
            viewModel.revealPrimaryCursor(args.source, true);
            announceCursorChange(previousCursorState, viewModel.getCursorStates());
        }
    }
    exports.FocusPreviousCursor = FocusPreviousCursor;
    (0, editorExtensions_1.registerEditorContribution)(MultiCursorSelectionController.ID, MultiCursorSelectionController, 4 /* EditorContributionInstantiation.Lazy */);
    (0, editorExtensions_1.registerEditorContribution)(SelectionHighlighter.ID, SelectionHighlighter, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAbove);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorBelow);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAtEndOfEachLineSelected);
    (0, editorExtensions_1.registerEditorAction)(AddSelectionToNextFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(AddSelectionToPreviousFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(MoveSelectionToNextFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(MoveSelectionToPreviousFindMatchAction);
    (0, editorExtensions_1.registerEditorAction)(SelectHighlightsAction);
    (0, editorExtensions_1.registerEditorAction)(CompatChangeAll);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAtEndOfLineSelected);
    (0, editorExtensions_1.registerEditorAction)(InsertCursorAtTopOfLineSelected);
    (0, editorExtensions_1.registerEditorAction)(FocusNextCursor);
    (0, editorExtensions_1.registerEditorAction)(FocusPreviousCursor);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXVsdGljdXJzb3IuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL211bHRpY3Vyc29yL2Jyb3dzZXIvbXVsdGljdXJzb3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTRCaEcsU0FBUyxvQkFBb0IsQ0FBQyxtQkFBa0MsRUFBRSxXQUEwQjtRQUMzRixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RixJQUFJLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDNUIsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsVUFBVSxXQUFXLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNJLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsb0JBQW9CLEVBQUUsZUFBZSxDQUFDLENBQUM7WUFDOUssSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDYixDQUFDO0lBQ0YsQ0FBQztJQUVELE1BQWEs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