/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/config/editorOptions", "vs/editor/common/cursorCommon", "vs/editor/common/cursor/cursorWordOperations", "vs/editor/common/core/wordCharacterClassifier", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys"], function (require, exports, editorExtensions_1, replaceCommand_1, editorOptions_1, cursorCommon_1, cursorWordOperations_1, wordCharacterClassifier_1, position_1, range_1, selection_1, editorContextKeys_1, languageConfigurationRegistry_1, nls, accessibility_1, contextkey_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeleteInsideWord = exports.DeleteWordRight = exports.DeleteWordEndRight = exports.DeleteWordStartRight = exports.DeleteWordLeft = exports.DeleteWordEndLeft = exports.DeleteWordStartLeft = exports.DeleteWordRightCommand = exports.DeleteWordLeftCommand = exports.DeleteWordCommand = exports.CursorWordAccessibilityRightSelect = exports.CursorWordAccessibilityRight = exports.CursorWordRightSelect = exports.CursorWordEndRightSelect = exports.CursorWordStartRightSelect = exports.CursorWordRight = exports.CursorWordEndRight = exports.CursorWordStartRight = exports.CursorWordAccessibilityLeftSelect = exports.CursorWordAccessibilityLeft = exports.CursorWordLeftSelect = exports.CursorWordEndLeftSelect = exports.CursorWordStartLeftSelect = exports.CursorWordLeft = exports.CursorWordEndLeft = exports.CursorWordStartLeft = exports.WordRightCommand = exports.WordLeftCommand = exports.MoveWordCommand = void 0;
    class MoveWordCommand extends editorExtensions_1.EditorCommand {
        constructor(opts) {
            super(opts);
            this._inSelectionMode = opts.inSelectionMode;
            this._wordNavigationType = opts.wordNavigationType;
        }
        runEditorCommand(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(editor.getOption(131 /* EditorOption.wordSeparators */), editor.getOption(130 /* EditorOption.wordSegmenterLocales */));
            const model = editor.getModel();
            const selections = editor.getSelections();
            const result = selections.map((sel) => {
                const inPosition = new position_1.Position(sel.positionLineNumber, sel.positionColumn);
                const outPosition = this._move(wordSeparators, model, inPosition, this._wordNavigationType);
                return this._moveTo(sel, outPosition, this._inSelectionMode);
            });
            model.pushStackElement();
            editor._getViewModel().setCursorStates('moveWordCommand', 3 /* CursorChangeReason.Explicit */, result.map(r => cursorCommon_1.CursorState.fromModelSelection(r)));
            if (result.length === 1) {
                const pos = new position_1.Position(result[0].positionLineNumber, result[0].positionColumn);
                editor.revealPosition(pos, 0 /* ScrollType.Smooth */);
            }
        }
        _moveTo(from, to, inSelectionMode) {
            if (inSelectionMode) {
                // move just position
                return new selection_1.Selection(from.selectionStartLineNumber, from.selectionStartColumn, to.lineNumber, to.column);
            }
            else {
                // move everything
                return new selection_1.Selection(to.lineNumber, to.column, to.lineNumber, to.column);
            }
        }
    }
    exports.MoveWordCommand = MoveWordCommand;
    class WordLeftCommand extends MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordOperations.moveWordLeft(wordSeparators, model, position, wordNavigationType);
        }
    }
    exports.WordLeftCommand = WordLeftCommand;
    class WordRightCommand extends MoveWordCommand {
        _move(wordSeparators, model, position, wordNavigationType) {
            return cursorWordOperations_1.WordOperations.moveWordRight(wordSeparators, model, position, wordNavigationType);
        }
    }
    exports.WordRightCommand = WordRightCommand;
    class CursorWordStartLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordStartLeft',
                precondition: undefined
            });
        }
    }
    exports.CursorWordStartLeft = CursorWordStartLeft;
    class CursorWordEndLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordEndLeft',
                precondition: undefined
            });
        }
    }
    exports.CursorWordEndLeft = CursorWordEndLeft;
    class CursorWordLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 1 /* WordNavigationType.WordStartFast */,
                id: 'cursorWordLeft',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkeys_1.IsWindowsContext)?.negate()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
                    mac: { primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordLeft = CursorWordLeft;
    class CursorWordStartLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordStartLeftSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordStartLeftSelect = CursorWordStartLeftSelect;
    class CursorWordEndLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordEndLeftSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordEndLeftSelect = CursorWordEndLeftSelect;
    class CursorWordLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 1 /* WordNavigationType.WordStartFast */,
                id: 'cursorWordLeftSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkeys_1.IsWindowsContext)?.negate()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */,
                    mac: { primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordLeftSelect = CursorWordLeftSelect;
    // Accessibility navigation commands should only be enabled on windows since they are tuned to what NVDA expects
    class CursorWordAccessibilityLeft extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 3 /* WordNavigationType.WordAccessibility */,
                id: 'cursorWordAccessibilityLeft',
                precondition: undefined
            });
        }
        _move(wordCharacterClassifier, model, position, wordNavigationType) {
            return super._move((0, wordCharacterClassifier_1.getMapForWordSeparators)(editorOptions_1.EditorOptions.wordSeparators.defaultValue, wordCharacterClassifier.intlSegmenterLocales), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityLeft = CursorWordAccessibilityLeft;
    class CursorWordAccessibilityLeftSelect extends WordLeftCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 3 /* WordNavigationType.WordAccessibility */,
                id: 'cursorWordAccessibilityLeftSelect',
                precondition: undefined
            });
        }
        _move(wordCharacterClassifier, model, position, wordNavigationType) {
            return super._move((0, wordCharacterClassifier_1.getMapForWordSeparators)(editorOptions_1.EditorOptions.wordSeparators.defaultValue, wordCharacterClassifier.intlSegmenterLocales), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityLeftSelect = CursorWordAccessibilityLeftSelect;
    class CursorWordStartRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordStartRight',
                precondition: undefined
            });
        }
    }
    exports.CursorWordStartRight = CursorWordStartRight;
    class CursorWordEndRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordEndRight',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkeys_1.IsWindowsContext)?.negate()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
                    mac: { primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordEndRight = CursorWordEndRight;
    class CursorWordRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordRight',
                precondition: undefined
            });
        }
    }
    exports.CursorWordRight = CursorWordRight;
    class CursorWordStartRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'cursorWordStartRightSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordStartRightSelect = CursorWordStartRightSelect;
    class CursorWordEndRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordEndRightSelect',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.textInputFocus, contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, contextkeys_1.IsWindowsContext)?.negate()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */,
                    mac: { primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.CursorWordEndRightSelect = CursorWordEndRightSelect;
    class CursorWordRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'cursorWordRightSelect',
                precondition: undefined
            });
        }
    }
    exports.CursorWordRightSelect = CursorWordRightSelect;
    class CursorWordAccessibilityRight extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: false,
                wordNavigationType: 3 /* WordNavigationType.WordAccessibility */,
                id: 'cursorWordAccessibilityRight',
                precondition: undefined
            });
        }
        _move(wordCharacterClassifier, model, position, wordNavigationType) {
            return super._move((0, wordCharacterClassifier_1.getMapForWordSeparators)(editorOptions_1.EditorOptions.wordSeparators.defaultValue, wordCharacterClassifier.intlSegmenterLocales), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityRight = CursorWordAccessibilityRight;
    class CursorWordAccessibilityRightSelect extends WordRightCommand {
        constructor() {
            super({
                inSelectionMode: true,
                wordNavigationType: 3 /* WordNavigationType.WordAccessibility */,
                id: 'cursorWordAccessibilityRightSelect',
                precondition: undefined
            });
        }
        _move(wordCharacterClassifier, model, position, wordNavigationType) {
            return super._move((0, wordCharacterClassifier_1.getMapForWordSeparators)(editorOptions_1.EditorOptions.wordSeparators.defaultValue, wordCharacterClassifier.intlSegmenterLocales), model, position, wordNavigationType);
        }
    }
    exports.CursorWordAccessibilityRightSelect = CursorWordAccessibilityRightSelect;
    class DeleteWordCommand extends editorExtensions_1.EditorCommand {
        constructor(opts) {
            super(opts);
            this._whitespaceHeuristics = opts.whitespaceHeuristics;
            this._wordNavigationType = opts.wordNavigationType;
        }
        runEditorCommand(accessor, editor, args) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            if (!editor.hasModel()) {
                return;
            }
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(editor.getOption(131 /* EditorOption.wordSeparators */), editor.getOption(130 /* EditorOption.wordSegmenterLocales */));
            const model = editor.getModel();
            const selections = editor.getSelections();
            const autoClosingBrackets = editor.getOption(6 /* EditorOption.autoClosingBrackets */);
            const autoClosingQuotes = editor.getOption(11 /* EditorOption.autoClosingQuotes */);
            const autoClosingPairs = languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).getAutoClosingPairs();
            const viewModel = editor._getViewModel();
            const commands = selections.map((sel) => {
                const deleteRange = this._delete({
                    wordSeparators,
                    model,
                    selection: sel,
                    whitespaceHeuristics: this._whitespaceHeuristics,
                    autoClosingDelete: editor.getOption(9 /* EditorOption.autoClosingDelete */),
                    autoClosingBrackets,
                    autoClosingQuotes,
                    autoClosingPairs,
                    autoClosedCharacters: viewModel.getCursorAutoClosedCharacters(),
                }, this._wordNavigationType);
                return new replaceCommand_1.ReplaceCommand(deleteRange, '');
            });
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.DeleteWordCommand = DeleteWordCommand;
    class DeleteWordLeftCommand extends DeleteWordCommand {
        _delete(ctx, wordNavigationType) {
            const r = cursorWordOperations_1.WordOperations.deleteWordLeft(ctx, wordNavigationType);
            if (r) {
                return r;
            }
            return new range_1.Range(1, 1, 1, 1);
        }
    }
    exports.DeleteWordLeftCommand = DeleteWordLeftCommand;
    class DeleteWordRightCommand extends DeleteWordCommand {
        _delete(ctx, wordNavigationType) {
            const r = cursorWordOperations_1.WordOperations.deleteWordRight(ctx, wordNavigationType);
            if (r) {
                return r;
            }
            const lineCount = ctx.model.getLineCount();
            const maxColumn = ctx.model.getLineMaxColumn(lineCount);
            return new range_1.Range(lineCount, maxColumn, lineCount, maxColumn);
        }
    }
    exports.DeleteWordRightCommand = DeleteWordRightCommand;
    class DeleteWordStartLeft extends DeleteWordLeftCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'deleteWordStartLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordStartLeft = DeleteWordStartLeft;
    class DeleteWordEndLeft extends DeleteWordLeftCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'deleteWordEndLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordEndLeft = DeleteWordEndLeft;
    class DeleteWordLeft extends DeleteWordLeftCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'deleteWordLeft',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                    mac: { primary: 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.DeleteWordLeft = DeleteWordLeft;
    class DeleteWordStartRight extends DeleteWordRightCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 0 /* WordNavigationType.WordStart */,
                id: 'deleteWordStartRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordStartRight = DeleteWordStartRight;
    class DeleteWordEndRight extends DeleteWordRightCommand {
        constructor() {
            super({
                whitespaceHeuristics: false,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'deleteWordEndRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.DeleteWordEndRight = DeleteWordEndRight;
    class DeleteWordRight extends DeleteWordRightCommand {
        constructor() {
            super({
                whitespaceHeuristics: true,
                wordNavigationType: 2 /* WordNavigationType.WordEnd */,
                id: 'deleteWordRight',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 20 /* KeyCode.Delete */,
                    mac: { primary: 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
    }
    exports.DeleteWordRight = DeleteWordRight;
    class DeleteInsideWord extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'deleteInsideWord',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                label: nls.localize('deleteInsideWord', "Delete Word"),
                alias: 'Delete Word'
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const wordSeparators = (0, wordCharacterClassifier_1.getMapForWordSeparators)(editor.getOption(131 /* EditorOption.wordSeparators */), editor.getOption(130 /* EditorOption.wordSegmenterLocales */));
            const model = editor.getModel();
            const selections = editor.getSelections();
            const commands = selections.map((sel) => {
                const deleteRange = cursorWordOperations_1.WordOperations.deleteInsideWord(wordSeparators, model, sel);
                return new replaceCommand_1.ReplaceCommand(deleteRange, '');
            });
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.DeleteInsideWord = DeleteInsideWord;
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordStartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordEndLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordStartLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordEndLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordStartRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordEndRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordStartRightSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordEndRightSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordRightSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordAccessibilityLeft());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordAccessibilityLeftSelect());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordAccessibilityRight());
    (0, editorExtensions_1.registerEditorCommand)(new CursorWordAccessibilityRightSelect());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordStartLeft());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordEndLeft());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordLeft());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordStartRight());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordEndRight());
    (0, editorExtensions_1.registerEditorCommand)(new DeleteWordRight());
    (0, editorExtensions_1.registerEditorAction)(DeleteInsideWord);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29yZE9wZXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL3dvcmRPcGVyYXRpb25zL2Jyb3dzZXIvd29yZE9wZXJhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkJoRyxNQUFzQixlQUFnQixTQUFRLGdDQUFhO1FBSzFELFlBQVksSUFBcUI7WUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1osSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDN0MsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNwRCxDQUFDO1FBRU0sZ0JBQWdCLENBQUMsUUFBMEIsRUFBRSxNQUFtQixFQUFFLElBQVM7WUFDakYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUNELE1BQU0sY0FBYyxHQUFHLElBQUEsaURBQXVCLEVBQUMsTUFBTSxDQUFDLFNBQVMsdUNBQTZCLEVBQUUsTUFBTSxDQUFDLFNBQVMsNkNBQW1DLENBQUMsQ0FBQztZQUNuSixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBRTFDLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDckMsTUFBTSxVQUFVLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQzVFLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMs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