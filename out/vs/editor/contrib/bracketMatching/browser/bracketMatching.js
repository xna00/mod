/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./bracketMatching"], function (require, exports, async_1, lifecycle_1, editorExtensions_1, position_1, range_1, selection_1, editorContextKeys_1, model_1, textModel_1, nls, actions_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BracketMatchingController = void 0;
    const overviewRulerBracketMatchForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.bracketMatchForeground', { dark: '#A0A0A0', light: '#A0A0A0', hcDark: '#A0A0A0', hcLight: '#A0A0A0' }, nls.localize('overviewRulerBracketMatchForeground', 'Overview ruler marker color for matching brackets.'));
    class JumpToBracketAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.jumpToBracket',
                label: nls.localize('smartSelect.jumpBracket', "Go to Bracket"),
                alias: 'Go to Bracket',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            BracketMatchingController.get(editor)?.jumpToBracket();
        }
    }
    class SelectToBracketAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.selectToBracket',
                label: nls.localize('smartSelect.selectToBracket', "Select to Bracket"),
                alias: 'Select to Bracket',
                precondition: undefined,
                metadata: {
                    description: nls.localize2('smartSelect.selectToBracketDescription', "Select the text inside and including the brackets or curly braces"),
                    args: [{
                            name: 'args',
                            schema: {
                                type: 'object',
                                properties: {
                                    'selectBrackets': {
                                        type: 'boolean',
                                        default: true
                                    }
                                },
                            }
                        }]
                }
            });
        }
        run(accessor, editor, args) {
            let selectBrackets = true;
            if (args && args.selectBrackets === false) {
                selectBrackets = false;
            }
            BracketMatchingController.get(editor)?.selectToBracket(selectBrackets);
        }
    }
    class RemoveBracketsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.removeBrackets',
                label: nls.localize('smartSelect.removeBrackets', "Remove Brackets"),
                alias: 'Remove Brackets',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            BracketMatchingController.get(editor)?.removeBrackets(this.id);
        }
    }
    class BracketsData {
        constructor(position, brackets, options) {
            this.position = position;
            this.brackets = brackets;
            this.options = options;
        }
    }
    class BracketMatchingController extends lifecycle_1.Disposable {
        static { this.ID = 'editor.contrib.bracketMatchingController'; }
        static get(editor) {
            return editor.getContribution(BracketMatchingController.ID);
        }
        constructor(editor) {
            super();
            this._editor = editor;
            this._lastBracketsData = [];
            this._lastVersionId = 0;
            this._decorations = this._editor.createDecorationsCollection();
            this._updateBracketsSoon = this._register(new async_1.RunOnceScheduler(() => this._updateBrackets(), 50));
            this._matchBrackets = this._editor.getOption(72 /* EditorOption.matchBrackets */);
            this._updateBracketsSoon.schedule();
            this._register(editor.onDidChangeCursorPosition((e) => {
                if (this._matchBrackets === 'never') {
                    // Early exit if nothing needs to be done!
                    // Leave some form of early exit check here if you wish to continue being a cursor position change listener ;)
                    return;
                }
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeModel((e) => {
                this._lastBracketsData = [];
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeModelLanguageConfiguration((e) => {
                this._lastBracketsData = [];
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(72 /* EditorOption.matchBrackets */)) {
                    this._matchBrackets = this._editor.getOption(72 /* EditorOption.matchBrackets */);
                    this._decorations.clear();
                    this._lastBracketsData = [];
                    this._lastVersionId = 0;
                    this._updateBracketsSoon.schedule();
                }
            }));
            this._register(editor.onDidBlurEditorWidget(() => {
                this._updateBracketsSoon.schedule();
            }));
            this._register(editor.onDidFocusEditorWidget(() => {
                this._updateBracketsSoon.schedule();
            }));
        }
        jumpToBracket() {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const newSelections = this._editor.getSelections().map(selection => {
                const position = selection.getStartPosition();
                // find matching brackets if position is on a bracket
                const brackets = model.bracketPairs.matchBracket(position);
                let newCursorPosition = null;
                if (brackets) {
                    if (brackets[0].containsPosition(position) && !brackets[1].containsPosition(position)) {
                        newCursorPosition = brackets[1].getStartPosition();
                    }
                    else if (brackets[1].containsPosition(position)) {
                        newCursorPosition = brackets[0].getStartPosition();
                    }
                }
                else {
                    // find the enclosing brackets if the position isn't on a matching bracket
                    const enclosingBrackets = model.bracketPairs.findEnclosingBrackets(position);
                    if (enclosingBrackets) {
                        newCursorPosition = enclosingBrackets[1].getStartPosition();
                    }
                    else {
                        // no enclosing brackets, try the very first next bracket
                        const nextBracket = model.bracketPairs.findNextBracket(position);
                        if (nextBracket && nextBracket.range) {
                            newCursorPosition = nextBracket.range.getStartPosition();
                        }
                    }
                }
                if (newCursorPosition) {
                    return new selection_1.Selection(newCursorPosition.lineNumber, newCursorPosition.column, newCursorPosition.lineNumber, newCursorPosition.column);
                }
                return new selection_1.Selection(position.lineNumber, position.column, position.lineNumber, position.column);
            });
            this._editor.setSelections(newSelections);
            this._editor.revealRange(newSelections[0]);
        }
        selectToBracket(selectBrackets) {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            const newSelections = [];
            this._editor.getSelections().forEach(selection => {
                const position = selection.getStartPosition();
                let brackets = model.bracketPairs.matchBracket(position);
                if (!brackets) {
                    brackets = model.bracketPairs.findEnclosingBrackets(position);
                    if (!brackets) {
                        const nextBracket = model.bracketPairs.findNextBracket(position);
                        if (nextBracket && nextBracket.range) {
                            brackets = model.bracketPairs.matchBracket(nextBracket.range.getStartPosition());
                        }
                    }
                }
                let selectFrom = null;
                let selectTo = null;
                if (brackets) {
                    brackets.sort(range_1.Range.compareRangesUsingStarts);
                    const [open, close] = brackets;
                    selectFrom = selectBrackets ? open.getStartPosition() : open.getEndPosition();
                    selectTo = selectBrackets ? close.getEndPosition() : close.getStartPosition();
                    if (close.containsPosition(position)) {
                        // select backwards if the cursor was on the closing bracket
                        const tmp = selectFrom;
                        selectFrom = selectTo;
                        selectTo = tmp;
                    }
                }
                if (selectFrom && selectTo) {
                    newSelections.push(new selection_1.Selection(selectFrom.lineNumber, selectFrom.column, selectTo.lineNumber, selectTo.column));
                }
            });
            if (newSelections.length > 0) {
                this._editor.setSelections(newSelections);
                this._editor.revealRange(newSelections[0]);
            }
        }
        removeBrackets(editSource) {
            if (!this._editor.hasModel()) {
                return;
            }
            const model = this._editor.getModel();
            this._editor.getSelections().forEach((selection) => {
                const position = selection.getPosition();
                let brackets = model.bracketPairs.matchBracket(position);
                if (!brackets) {
                    brackets = model.bracketPairs.findEnclosingBrackets(position);
                }
                if (brackets) {
                    this._editor.pushUndoStop();
                    this._editor.executeEdits(editSource, [
                        { range: brackets[0], text: '' },
                        { range: brackets[1], text: '' }
                    ]);
                    this._editor.pushUndoStop();
                }
            });
        }
        static { this._DECORATION_OPTIONS_WITH_OVERVIEW_RULER = textModel_1.ModelDecorationOptions.register({
            description: 'bracket-match-overview',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'bracket-match',
            overviewRuler: {
                color: (0, themeService_1.themeColorFromId)(overviewRulerBracketMatchForeground),
                position: model_1.OverviewRulerLane.Center
            }
        }); }
        static { this._DECORATION_OPTIONS_WITHOUT_OVERVIEW_RULER = textModel_1.ModelDecorationOptions.register({
            description: 'bracket-match-no-overview',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            className: 'bracket-match'
        }); }
        _updateBrackets() {
            if (this._matchBrackets === 'never') {
                return;
            }
            this._recomputeBrackets();
            const newDecorations = [];
            let newDecorationsLen = 0;
            for (const bracketData of this._lastBracketsData) {
                const brackets = bracketData.brackets;
                if (brackets) {
                    newDecorations[newDecorationsLen++] = { range: brackets[0], options: bracketData.options };
                    newDecorations[newDecorationsLen++] = { range: brackets[1], options: bracketData.options };
                }
            }
            this._decorations.set(newDecorations);
        }
        _recomputeBrackets() {
            if (!this._editor.hasModel() || !this._editor.hasWidgetFocus()) {
                // no model or no focus => no brackets!
                this._lastBracketsData = [];
                this._lastVersionId = 0;
                return;
            }
            const selections = this._editor.getSelections();
            if (selections.length > 100) {
                // no bracket matching for high numbers of selections
                this._lastBracketsData = [];
                this._lastVersionId = 0;
                return;
            }
            const model = this._editor.getModel();
            const versionId = model.getVersionId();
            let previousData = [];
            if (this._lastVersionId === versionId) {
                // use the previous data only if the model is at the same version id
                previousData = this._lastBracketsData;
            }
            const positions = [];
            let positionsLen = 0;
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                if (selection.isEmpty()) {
                    // will bracket match a cursor only if the selection is collapsed
                    positions[positionsLen++] = selection.getStartPosition();
                }
            }
            // sort positions for `previousData` cache hits
            if (positions.length > 1) {
                positions.sort(position_1.Position.compare);
            }
            const newData = [];
            let newDataLen = 0;
            let previousIndex = 0;
            const previousLen = previousData.length;
            for (let i = 0, len = positions.length; i < len; i++) {
                const position = positions[i];
                while (previousIndex < previousLen && previousData[previousIndex].position.isBefore(position)) {
                    previousIndex++;
                }
                if (previousIndex < previousLen && previousData[previousIndex].position.equals(position)) {
                    newData[newDataLen++] = previousData[previousIndex];
                }
                else {
                    let brackets = model.bracketPairs.matchBracket(position, 20 /* give at most 20ms to compute */);
                    let options = BracketMatchingController._DECORATION_OPTIONS_WITH_OVERVIEW_RULER;
                    if (!brackets && this._matchBrackets === 'always') {
                        brackets = model.bracketPairs.findEnclosingBrackets(position, 20 /* give at most 20ms to compute */);
                        options = BracketMatchingController._DECORATION_OPTIONS_WITHOUT_OVERVIEW_RULER;
                    }
                    newData[newDataLen++] = new BracketsData(position, brackets, options);
                }
            }
            this._lastBracketsData = newData;
            this._lastVersionId = versionId;
        }
    }
    exports.BracketMatchingController = BracketMatchingController;
    (0, editorExtensions_1.registerEditorContribution)(BracketMatchingController.ID, BracketMatchingController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    (0, editorExtensions_1.registerEditorAction)(SelectToBracketAction);
    (0, editorExtensions_1.registerEditorAction)(JumpToBracketAction);
    (0, editorExtensions_1.registerEditorAction)(RemoveBracketsAction);
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '5_infile_nav',
        command: {
            id: 'editor.action.jumpToBracket',
            title: nls.localize({ key: 'miGoToBracket', comment: ['&& denotes a mnemonic'] }, "Go to &&Bracket")
        },
        order: 2
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldE1hdGNoaW5nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9icmFja2V0TWF0Y2hpbmcvYnJvd3Nlci9icmFja2V0TWF0Y2hpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyxNQUFNLG1DQUFtQyxHQUFHLElBQUEsNkJBQWEsRUFBQyw0Q0FBNEMsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHFDQUFxQyxFQUFFLG9EQUFvRCxDQUFDLENBQUMsQ0FBQztJQUVqUyxNQUFNLG1CQUFvQixTQUFRLCtCQUFZO1FBQzdDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSw2QkFBNkI7Z0JBQ2pDLEtBQUssRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLGVBQWUsQ0FBQztnQkFDL0QsS0FBSyxFQUFFLGVBQWU7Z0JBQ3RCLFlBQVksRUFBRSxTQUFTO2dCQUN2QixNQUFNLEVBQUU7b0JBQ1AsTUFBTSxFQUFFLHFDQUFpQixDQUFDLGVBQWU7b0JBQ3pDLE9BQU8sRUFBRSxtREFBNkIsNkJBQW9CO29CQUMxRCxNQUFNLDBDQUFnQztpQkFDdEM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sR0FBRyxDQUFDLFFBQTBCLEVBQUUsTUFBbUI7WUFDekQseUJBQXlCLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDO1FBQ3hELENBQUM7S0FDRDtJQUVELE1BQU0scUJBQXNCLFNBQVEsK0JBQVk7UUFDL0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxF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