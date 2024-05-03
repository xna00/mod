/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/editor/browser/coreCommands", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/commands/trimTrailingWhitespaceCommand", "vs/editor/common/cursor/cursorTypeOperations", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/contrib/linesOperations/browser/copyLinesCommand", "vs/editor/contrib/linesOperations/browser/moveLinesCommand", "vs/editor/contrib/linesOperations/browser/sortLinesCommand", "vs/nls", "vs/platform/actions/common/actions", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/configuration/common/configuration"], function (require, exports, keyCodes_1, coreCommands_1, editorExtensions_1, replaceCommand_1, trimTrailingWhitespaceCommand_1, cursorTypeOperations_1, editOperation_1, position_1, range_1, selection_1, editorContextKeys_1, copyLinesCommand_1, moveLinesCommand_1, sortLinesCommand_1, nls, actions_1, languageConfigurationRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KebabCaseAction = exports.PascalCaseAction = exports.CamelCaseAction = exports.SnakeCaseAction = exports.TitleCaseAction = exports.LowerCaseAction = exports.UpperCaseAction = exports.AbstractCaseAction = exports.TransposeAction = exports.JoinLinesAction = exports.DeleteAllRightAction = exports.DeleteAllLeftAction = exports.AbstractDeleteAllToBoundaryAction = exports.InsertLineAfterAction = exports.InsertLineBeforeAction = exports.IndentLinesAction = exports.DeleteLinesAction = exports.TrimTrailingWhitespaceAction = exports.DeleteDuplicateLinesAction = exports.SortLinesDescendingAction = exports.SortLinesAscendingAction = exports.AbstractSortLinesAction = exports.DuplicateSelectionAction = void 0;
    // copy lines
    class AbstractCopyLinesAction extends editorExtensions_1.EditorAction {
        constructor(down, opts) {
            super(opts);
            this.down = down;
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections().map((selection, index) => ({ selection, index, ignore: false }));
            selections.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.selection, b.selection));
            // Remove selections that would result in copying the same line
            let prev = selections[0];
            for (let i = 1; i < selections.length; i++) {
                const curr = selections[i];
                if (prev.selection.endLineNumber === curr.selection.startLineNumber) {
                    // these two selections would copy the same line
                    if (prev.index < curr.index) {
                        // prev wins
                        curr.ignore = true;
                    }
                    else {
                        // curr wins
                        prev.ignore = true;
                        prev = curr;
                    }
                }
            }
            const commands = [];
            for (const selection of selections) {
                commands.push(new copyLinesCommand_1.CopyLinesCommand(selection.selection, this.down, selection.ignore));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    class CopyLinesUpAction extends AbstractCopyLinesAction {
        constructor() {
            super(false, {
                id: 'editor.action.copyLinesUpAction',
                label: nls.localize('lines.copyUp', "Copy Line Up"),
                alias: 'Copy Line Up',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miCopyLinesUp', comment: ['&& denotes a mnemonic'] }, "&&Copy Line Up"),
                    order: 1
                }
            });
        }
    }
    class CopyLinesDownAction extends AbstractCopyLinesAction {
        constructor() {
            super(true, {
                id: 'editor.action.copyLinesDownAction',
                label: nls.localize('lines.copyDown', "Copy Line Down"),
                alias: 'Copy Line Down',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miCopyLinesDown', comment: ['&& denotes a mnemonic'] }, "Co&&py Line Down"),
                    order: 2
                }
            });
        }
    }
    class DuplicateSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.duplicateSelection',
                label: nls.localize('duplicateSelection', "Duplicate Selection"),
                alias: 'Duplicate Selection',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miDuplicateSelection', comment: ['&& denotes a mnemonic'] }, "&&Duplicate Selection"),
                    order: 5
                }
            });
        }
        run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const commands = [];
            const selections = editor.getSelections();
            const model = editor.getModel();
            for (const selection of selections) {
                if (selection.isEmpty()) {
                    commands.push(new copyLinesCommand_1.CopyLinesCommand(selection, true));
                }
                else {
                    const insertSelection = new selection_1.Selection(selection.endLineNumber, selection.endColumn, selection.endLineNumber, selection.endColumn);
                    commands.push(new replaceCommand_1.ReplaceCommandThatSelectsText(insertSelection, model.getValueInRange(selection)));
                }
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.DuplicateSelectionAction = DuplicateSelectionAction;
    // move lines
    class AbstractMoveLinesAction extends editorExtensions_1.EditorAction {
        constructor(down, opts) {
            super(opts);
            this.down = down;
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const commands = [];
            const selections = editor.getSelections() || [];
            const autoIndent = editor.getOption(12 /* EditorOption.autoIndent */);
            for (const selection of selections) {
                commands.push(new moveLinesCommand_1.MoveLinesCommand(selection, this.down, autoIndent, languageConfigurationService));
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    class MoveLinesUpAction extends AbstractMoveLinesAction {
        constructor() {
            super(false, {
                id: 'editor.action.moveLinesUpAction',
                label: nls.localize('lines.moveUp', "Move Line Up"),
                alias: 'Move Line Up',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                    linux: { primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miMoveLinesUp', comment: ['&& denotes a mnemonic'] }, "Mo&&ve Line Up"),
                    order: 3
                }
            });
        }
    }
    class MoveLinesDownAction extends AbstractMoveLinesAction {
        constructor() {
            super(true, {
                id: 'editor.action.moveLinesDownAction',
                label: nls.localize('lines.moveDown', "Move Line Down"),
                alias: 'Move Line Down',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                    linux: { primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarSelectionMenu,
                    group: '2_line',
                    title: nls.localize({ key: 'miMoveLinesDown', comment: ['&& denotes a mnemonic'] }, "Move &&Line Down"),
                    order: 4
                }
            });
        }
    }
    class AbstractSortLinesAction extends editorExtensions_1.EditorAction {
        constructor(descending, opts) {
            super(opts);
            this.descending = descending;
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            let selections = editor.getSelections();
            if (selections.length === 1 && selections[0].isEmpty()) {
                // Apply to whole document.
                selections = [new selection_1.Selection(1, 1, model.getLineCount(), model.getLineMaxColumn(model.getLineCount()))];
            }
            for (const selection of selections) {
                if (!sortLinesCommand_1.SortLinesCommand.canRun(editor.getModel(), selection, this.descending)) {
                    return;
                }
            }
            const commands = [];
            for (let i = 0, len = selections.length; i < len; i++) {
                commands[i] = new sortLinesCommand_1.SortLinesCommand(selections[i], this.descending);
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.AbstractSortLinesAction = AbstractSortLinesAction;
    class SortLinesAscendingAction extends AbstractSortLinesAction {
        constructor() {
            super(false, {
                id: 'editor.action.sortLinesAscending',
                label: nls.localize('lines.sortAscending', "Sort Lines Ascending"),
                alias: 'Sort Lines Ascending',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.SortLinesAscendingAction = SortLinesAscendingAction;
    class SortLinesDescendingAction extends AbstractSortLinesAction {
        constructor() {
            super(true, {
                id: 'editor.action.sortLinesDescending',
                label: nls.localize('lines.sortDescending', "Sort Lines Descending"),
                alias: 'Sort Lines Descending',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
    }
    exports.SortLinesDescendingAction = SortLinesDescendingAction;
    class DeleteDuplicateLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.removeDuplicateLines',
                label: nls.localize('lines.deleteDuplicates', "Delete Duplicate Lines"),
                alias: 'Delete Duplicate Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
                return;
            }
            const edits = [];
            const endCursorState = [];
            let linesDeleted = 0;
            let updateSelection = true;
            let selections = editor.getSelections();
            if (selections.length === 1 && selections[0].isEmpty()) {
                // Apply to whole document.
                selections = [new selection_1.Selection(1, 1, model.getLineCount(), model.getLineMaxColumn(model.getLineCount()))];
                updateSelection = false;
            }
            for (const selection of selections) {
                const uniqueLines = new Set();
                const lines = [];
                for (let i = selection.startLineNumber; i <= selection.endLineNumber; i++) {
                    const line = model.getLineContent(i);
                    if (uniqueLines.has(line)) {
                        continue;
                    }
                    lines.push(line);
                    uniqueLines.add(line);
                }
                const selectionToReplace = new selection_1.Selection(selection.startLineNumber, 1, selection.endLineNumber, model.getLineMaxColumn(selection.endLineNumber));
                const adjustedSelectionStart = selection.startLineNumber - linesDeleted;
                const finalSelection = new selection_1.Selection(adjustedSelectionStart, 1, adjustedSelectionStart + lines.length - 1, lines[lines.length - 1].length);
                edits.push(editOperation_1.EditOperation.replace(selectionToReplace, lines.join('\n')));
                endCursorState.push(finalSelection);
                linesDeleted += (selection.endLineNumber - selection.startLineNumber + 1) - lines.length;
            }
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, updateSelection ? endCursorState : undefined);
            editor.pushUndoStop();
        }
    }
    exports.DeleteDuplicateLinesAction = DeleteDuplicateLinesAction;
    class TrimTrailingWhitespaceAction extends editorExtensions_1.EditorAction {
        static { this.ID = 'editor.action.trimTrailingWhitespace'; }
        constructor() {
            super({
                id: TrimTrailingWhitespaceAction.ID,
                label: nls.localize('lines.trimTrailingWhitespace', "Trim Trailing Whitespace"),
                alias: 'Trim Trailing Whitespace',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor, args) {
            let cursors = [];
            if (args.reason === 'auto-save') {
                // See https://github.com/editorconfig/editorconfig-vscode/issues/47
                // It is very convenient for the editor config extension to invoke this action.
                // So, if we get a reason:'auto-save' passed in, let's preserve cursor positions.
                cursors = (editor.getSelections() || []).map(s => new position_1.Position(s.positionLineNumber, s.positionColumn));
            }
            const selection = editor.getSelection();
            if (selection === null) {
                return;
            }
            const config = _accessor.get(configuration_1.IConfigurationService);
            const model = editor.getModel();
            const trimInRegexAndStrings = config.getValue('files.trimTrailingWhitespaceInRegexAndStrings', { overrideIdentifier: model?.getLanguageId(), resource: model?.uri });
            const command = new trimTrailingWhitespaceCommand_1.TrimTrailingWhitespaceCommand(selection, cursors, trimInRegexAndStrings);
            editor.pushUndoStop();
            editor.executeCommands(this.id, [command]);
            editor.pushUndoStop();
        }
    }
    exports.TrimTrailingWhitespaceAction = TrimTrailingWhitespaceAction;
    class DeleteLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.deleteLines',
                label: nls.localize('lines.delete', "Delete Line"),
                alias: 'Delete Line',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 41 /* KeyCode.KeyK */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const ops = this._getLinesToRemove(editor);
            const model = editor.getModel();
            if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
                // Model is empty
                return;
            }
            let linesDeleted = 0;
            const edits = [];
            const cursorState = [];
            for (let i = 0, len = ops.length; i < len; i++) {
                const op = ops[i];
                let startLineNumber = op.startLineNumber;
                let endLineNumber = op.endLineNumber;
                let startColumn = 1;
                let endColumn = model.getLineMaxColumn(endLineNumber);
                if (endLineNumber < model.getLineCount()) {
                    endLineNumber += 1;
                    endColumn = 1;
                }
                else if (startLineNumber > 1) {
                    startLineNumber -= 1;
                    startColumn = model.getLineMaxColumn(startLineNumber);
                }
                edits.push(editOperation_1.EditOperation.replace(new selection_1.Selection(startLineNumber, startColumn, endLineNumber, endColumn), ''));
                cursorState.push(new selection_1.Selection(startLineNumber - linesDeleted, op.positionColumn, startLineNumber - linesDeleted, op.positionColumn));
                linesDeleted += (op.endLineNumber - op.startLineNumber + 1);
            }
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, cursorState);
            editor.pushUndoStop();
        }
        _getLinesToRemove(editor) {
            // Construct delete operations
            const operations = editor.getSelections().map((s) => {
                let endLineNumber = s.endLineNumber;
                if (s.startLineNumber < s.endLineNumber && s.endColumn === 1) {
                    endLineNumber -= 1;
                }
                return {
                    startLineNumber: s.startLineNumber,
                    selectionStartColumn: s.selectionStartColumn,
                    endLineNumber: endLineNumber,
                    positionColumn: s.positionColumn
                };
            });
            // Sort delete operations
            operations.sort((a, b) => {
                if (a.startLineNumber === b.startLineNumber) {
                    return a.endLineNumber - b.endLineNumber;
                }
                return a.startLineNumber - b.startLineNumber;
            });
            // Merge delete operations which are adjacent or overlapping
            const mergedOperations = [];
            let previousOperation = operations[0];
            for (let i = 1; i < operations.length; i++) {
                if (previousOperation.endLineNumber + 1 >= operations[i].startLineNumber) {
                    // Merge current operations into the previous one
                    previousOperation.endLineNumber = operations[i].endLineNumber;
                }
                else {
                    // Push previous operation
                    mergedOperations.push(previousOperation);
                    previousOperation = operations[i];
                }
            }
            // Push the last operation
            mergedOperations.push(previousOperation);
            return mergedOperations;
        }
    }
    exports.DeleteLinesAction = DeleteLinesAction;
    class IndentLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.indentLines',
                label: nls.localize('lines.indent', "Indent Line"),
                alias: 'Indent Line',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 94 /* KeyCode.BracketRight */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                return;
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.indent(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
            editor.pushUndoStop();
        }
    }
    exports.IndentLinesAction = IndentLinesAction;
    class OutdentLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.outdentLines',
                label: nls.localize('lines.outdent', "Outdent Line"),
                alias: 'Outdent Line',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 92 /* KeyCode.BracketLeft */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            coreCommands_1.CoreEditingCommands.Outdent.runEditorCommand(_accessor, editor, null);
        }
    }
    class InsertLineBeforeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertLineBefore',
                label: nls.localize('lines.insertBefore', "Insert Line Above"),
                alias: 'Insert Line Above',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                return;
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.lineInsertBefore(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
        }
    }
    exports.InsertLineBeforeAction = InsertLineBeforeAction;
    class InsertLineAfterAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.insertLineAfter',
                label: nls.localize('lines.insertAfter', "Insert Line Below"),
                alias: 'Insert Line Below',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const viewModel = editor._getViewModel();
            if (!viewModel) {
                return;
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, cursorTypeOperations_1.TypeOperations.lineInsertAfter(viewModel.cursorConfig, editor.getModel(), editor.getSelections()));
        }
    }
    exports.InsertLineAfterAction = InsertLineAfterAction;
    class AbstractDeleteAllToBoundaryAction extends editorExtensions_1.EditorAction {
        run(_accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const primaryCursor = editor.getSelection();
            const rangesToDelete = this._getRangesToDelete(editor);
            // merge overlapping selections
            const effectiveRanges = [];
            for (let i = 0, count = rangesToDelete.length - 1; i < count; i++) {
                const range = rangesToDelete[i];
                const nextRange = rangesToDelete[i + 1];
                if (range_1.Range.intersectRanges(range, nextRange) === null) {
                    effectiveRanges.push(range);
                }
                else {
                    rangesToDelete[i + 1] = range_1.Range.plusRange(range, nextRange);
                }
            }
            effectiveRanges.push(rangesToDelete[rangesToDelete.length - 1]);
            const endCursorState = this._getEndCursorState(primaryCursor, effectiveRanges);
            const edits = effectiveRanges.map(range => {
                return editOperation_1.EditOperation.replace(range, '');
            });
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, endCursorState);
            editor.pushUndoStop();
        }
    }
    exports.AbstractDeleteAllToBoundaryAction = AbstractDeleteAllToBoundaryAction;
    class DeleteAllLeftAction extends AbstractDeleteAllToBoundaryAction {
        constructor() {
            super({
                id: 'deleteAllLeft',
                label: nls.localize('lines.deleteAllLeft', "Delete All Left"),
                alias: 'Delete All Left',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _getEndCursorState(primaryCursor, rangesToDelete) {
            let endPrimaryCursor = null;
            const endCursorState = [];
            let deletedLines = 0;
            rangesToDelete.forEach(range => {
                let endCursor;
                if (range.endColumn === 1 && deletedLines > 0) {
                    const newStartLine = range.startLineNumber - deletedLines;
                    endCursor = new selection_1.Selection(newStartLine, range.startColumn, newStartLine, range.startColumn);
                }
                else {
                    endCursor = new selection_1.Selection(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn);
                }
                deletedLines += range.endLineNumber - range.startLineNumber;
                if (range.intersectRanges(primaryCursor)) {
                    endPrimaryCursor = endCursor;
                }
                else {
                    endCursorState.push(endCursor);
                }
            });
            if (endPrimaryCursor) {
                endCursorState.unshift(endPrimaryCursor);
            }
            return endCursorState;
        }
        _getRangesToDelete(editor) {
            const selections = editor.getSelections();
            if (selections === null) {
                return [];
            }
            let rangesToDelete = selections;
            const model = editor.getModel();
            if (model === null) {
                return [];
            }
            rangesToDelete.sort(range_1.Range.compareRangesUsingStarts);
            rangesToDelete = rangesToDelete.map(selection => {
                if (selection.isEmpty()) {
                    if (selection.startColumn === 1) {
                        const deleteFromLine = Math.max(1, selection.startLineNumber - 1);
                        const deleteFromColumn = selection.startLineNumber === 1 ? 1 : model.getLineLength(deleteFromLine) + 1;
                        return new range_1.Range(deleteFromLine, deleteFromColumn, selection.startLineNumber, 1);
                    }
                    else {
                        return new range_1.Range(selection.startLineNumber, 1, selection.startLineNumber, selection.startColumn);
                    }
                }
                else {
                    return new range_1.Range(selection.startLineNumber, 1, selection.endLineNumber, selection.endColumn);
                }
            });
            return rangesToDelete;
        }
    }
    exports.DeleteAllLeftAction = DeleteAllLeftAction;
    class DeleteAllRightAction extends AbstractDeleteAllToBoundaryAction {
        constructor() {
            super({
                id: 'deleteAllRight',
                label: nls.localize('lines.deleteAllRight', "Delete All Right"),
                alias: 'Delete All Right',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 41 /* KeyCode.KeyK */, secondary: [2048 /* KeyMod.CtrlCmd */ | 20 /* KeyCode.Delete */] },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        _getEndCursorState(primaryCursor, rangesToDelete) {
            let endPrimaryCursor = null;
            const endCursorState = [];
            for (let i = 0, len = rangesToDelete.length, offset = 0; i < len; i++) {
                const range = rangesToDelete[i];
                const endCursor = new selection_1.Selection(range.startLineNumber - offset, range.startColumn, range.startLineNumber - offset, range.startColumn);
                if (range.intersectRanges(primaryCursor)) {
                    endPrimaryCursor = endCursor;
                }
                else {
                    endCursorState.push(endCursor);
                }
            }
            if (endPrimaryCursor) {
                endCursorState.unshift(endPrimaryCursor);
            }
            return endCursorState;
        }
        _getRangesToDelete(editor) {
            const model = editor.getModel();
            if (model === null) {
                return [];
            }
            const selections = editor.getSelections();
            if (selections === null) {
                return [];
            }
            const rangesToDelete = selections.map((sel) => {
                if (sel.isEmpty()) {
                    const maxColumn = model.getLineMaxColumn(sel.startLineNumber);
                    if (sel.startColumn === maxColumn) {
                        return new range_1.Range(sel.startLineNumber, sel.startColumn, sel.startLineNumber + 1, 1);
                    }
                    else {
                        return new range_1.Range(sel.startLineNumber, sel.startColumn, sel.startLineNumber, maxColumn);
                    }
                }
                return sel;
            });
            rangesToDelete.sort(range_1.Range.compareRangesUsingStarts);
            return rangesToDelete;
        }
    }
    exports.DeleteAllRightAction = DeleteAllRightAction;
    class JoinLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.joinLines',
                label: nls.localize('lines.joinLines', "Join Lines"),
                alias: 'Join Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 0,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 40 /* KeyCode.KeyJ */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(_accessor, editor) {
            const selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            let primaryCursor = editor.getSelection();
            if (primaryCursor === null) {
                return;
            }
            selections.sort(range_1.Range.compareRangesUsingStarts);
            const reducedSelections = [];
            const lastSelection = selections.reduce((previousValue, currentValue) => {
                if (previousValue.isEmpty()) {
                    if (previousValue.endLineNumber === currentValue.startLineNumber) {
                        if (primaryCursor.equalsSelection(previousValue)) {
                            primaryCursor = currentValue;
                        }
                        return currentValue;
                    }
                    if (currentValue.startLineNumber > previousValue.endLineNumber + 1) {
                        reducedSelections.push(previousValue);
                        return currentValue;
                    }
                    else {
                        return new selection_1.Selection(previousValue.startLineNumber, previousValue.startColumn, currentValue.endLineNumber, currentValue.endColumn);
                    }
                }
                else {
                    if (currentValue.startLineNumber > previousValue.endLineNumber) {
                        reducedSelections.push(previousValue);
                        return currentValue;
                    }
                    else {
                        return new selection_1.Selection(previousValue.startLineNumber, previousValue.startColumn, currentValue.endLineNumber, currentValue.endColumn);
                    }
                }
            });
            reducedSelections.push(lastSelection);
            const model = editor.getModel();
            if (model === null) {
                return;
            }
            const edits = [];
            const endCursorState = [];
            let endPrimaryCursor = primaryCursor;
            let lineOffset = 0;
            for (let i = 0, len = reducedSelections.length; i < len; i++) {
                const selection = reducedSelections[i];
                const startLineNumber = selection.startLineNumber;
                const startColumn = 1;
                let columnDeltaOffset = 0;
                let endLineNumber, endColumn;
                const selectionEndPositionOffset = model.getLineLength(selection.endLineNumber) - selection.endColumn;
                if (selection.isEmpty() || selection.startLineNumber === selection.endLineNumber) {
                    const position = selection.getStartPosition();
                    if (position.lineNumber < model.getLineCount()) {
                        endLineNumber = startLineNumber + 1;
                        endColumn = model.getLineMaxColumn(endLineNumber);
                    }
                    else {
                        endLineNumber = position.lineNumber;
                        endColumn = model.getLineMaxColumn(position.lineNumber);
                    }
                }
                else {
                    endLineNumber = selection.endLineNumber;
                    endColumn = model.getLineMaxColumn(endLineNumber);
                }
                let trimmedLinesContent = model.getLineContent(startLineNumber);
                for (let i = startLineNumber + 1; i <= endLineNumber; i++) {
                    const lineText = model.getLineContent(i);
                    const firstNonWhitespaceIdx = model.getLineFirstNonWhitespaceColumn(i);
                    if (firstNonWhitespaceIdx >= 1) {
                        let insertSpace = true;
                        if (trimmedLinesContent === '') {
                            insertSpace = false;
                        }
                        if (insertSpace && (trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === ' ' ||
                            trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === '\t')) {
                            insertSpace = false;
                            trimmedLinesContent = trimmedLinesContent.replace(/[\s\uFEFF\xA0]+$/g, ' ');
                        }
                        const lineTextWithoutIndent = lineText.substr(firstNonWhitespaceIdx - 1);
                        trimmedLinesContent += (insertSpace ? ' ' : '') + lineTextWithoutIndent;
                        if (insertSpace) {
                            columnDeltaOffset = lineTextWithoutIndent.length + 1;
                        }
                        else {
                            columnDeltaOffset = lineTextWithoutIndent.length;
                        }
                    }
                    else {
                        columnDeltaOffset = 0;
                    }
                }
                const deleteSelection = new range_1.Range(startLineNumber, startColumn, endLineNumber, endColumn);
                if (!deleteSelection.isEmpty()) {
                    let resultSelection;
                    if (selection.isEmpty()) {
                        edits.push(editOperation_1.EditOperation.replace(deleteSelection, trimmedLinesContent));
                        resultSelection = new selection_1.Selection(deleteSelection.startLineNumber - lineOffset, trimmedLinesContent.length - columnDeltaOffset + 1, startLineNumber - lineOffset, trimmedLinesContent.length - columnDeltaOffset + 1);
                    }
                    else {
                        if (selection.startLineNumber === selection.endLineNumber) {
                            edits.push(editOperation_1.EditOperation.replace(deleteSelection, trimmedLinesContent));
                            resultSelection = new selection_1.Selection(selection.startLineNumber - lineOffset, selection.startColumn, selection.endLineNumber - lineOffset, selection.endColumn);
                        }
                        else {
                            edits.push(editOperation_1.EditOperation.replace(deleteSelection, trimmedLinesContent));
                            resultSelection = new selection_1.Selection(selection.startLineNumber - lineOffset, selection.startColumn, selection.startLineNumber - lineOffset, trimmedLinesContent.length - selectionEndPositionOffset);
                        }
                    }
                    if (range_1.Range.intersectRanges(deleteSelection, primaryCursor) !== null) {
                        endPrimaryCursor = resultSelection;
                    }
                    else {
                        endCursorState.push(resultSelection);
                    }
                }
                lineOffset += deleteSelection.endLineNumber - deleteSelection.startLineNumber;
            }
            endCursorState.unshift(endPrimaryCursor);
            editor.pushUndoStop();
            editor.executeEdits(this.id, edits, endCursorState);
            editor.pushUndoStop();
        }
    }
    exports.JoinLinesAction = JoinLinesAction;
    class TransposeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.transpose',
                label: nls.localize('editor.transpose', "Transpose Characters around the Cursor"),
                alias: 'Transpose Characters around the Cursor',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(_accessor, editor) {
            const selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            const model = editor.getModel();
            if (model === null) {
                return;
            }
            const commands = [];
            for (let i = 0, len = selections.length; i < len; i++) {
                const selection = selections[i];
                if (!selection.isEmpty()) {
                    continue;
                }
                const cursor = selection.getStartPosition();
                const maxColumn = model.getLineMaxColumn(cursor.lineNumber);
                if (cursor.column >= maxColumn) {
                    if (cursor.lineNumber === model.getLineCount()) {
                        continue;
                    }
                    // The cursor is at the end of current line and current line is not empty
                    // then we transpose the character before the cursor and the line break if there is any following line.
                    const deleteSelection = new range_1.Range(cursor.lineNumber, Math.max(1, cursor.column - 1), cursor.lineNumber + 1, 1);
                    const chars = model.getValueInRange(deleteSelection).split('').reverse().join('');
                    commands.push(new replaceCommand_1.ReplaceCommand(new selection_1.Selection(cursor.lineNumber, Math.max(1, cursor.column - 1), cursor.lineNumber + 1, 1), chars));
                }
                else {
                    const deleteSelection = new range_1.Range(cursor.lineNumber, Math.max(1, cursor.column - 1), cursor.lineNumber, cursor.column + 1);
                    const chars = model.getValueInRange(deleteSelection).split('').reverse().join('');
                    commands.push(new replaceCommand_1.ReplaceCommandThatPreservesSelection(deleteSelection, chars, new selection_1.Selection(cursor.lineNumber, cursor.column + 1, cursor.lineNumber, cursor.column + 1)));
                }
            }
            editor.pushUndoStop();
            editor.executeCommands(this.id, commands);
            editor.pushUndoStop();
        }
    }
    exports.TransposeAction = TransposeAction;
    class AbstractCaseAction extends editorExtensions_1.EditorAction {
        run(_accessor, editor) {
            const selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            const model = editor.getModel();
            if (model === null) {
                return;
            }
            const wordSeparators = editor.getOption(131 /* EditorOption.wordSeparators */);
            const textEdits = [];
            for (const selection of selections) {
                if (selection.isEmpty()) {
                    const cursor = selection.getStartPosition();
                    const word = editor.getConfiguredWordAtPosition(cursor);
                    if (!word) {
                        continue;
                    }
                    const wordRange = new range_1.Range(cursor.lineNumber, word.startColumn, cursor.lineNumber, word.endColumn);
                    const text = model.getValueInRange(wordRange);
                    textEdits.push(editOperation_1.EditOperation.replace(wordRange, this._modifyText(text, wordSeparators)));
                }
                else {
                    const text = model.getValueInRange(selection);
                    textEdits.push(editOperation_1.EditOperation.replace(selection, this._modifyText(text, wordSeparators)));
                }
            }
            editor.pushUndoStop();
            editor.executeEdits(this.id, textEdits);
            editor.pushUndoStop();
        }
    }
    exports.AbstractCaseAction = AbstractCaseAction;
    class UpperCaseAction extends AbstractCaseAction {
        constructor() {
            super({
                id: 'editor.action.transformToUppercase',
                label: nls.localize('editor.transformToUppercase', "Transform to Uppercase"),
                alias: 'Transform to Uppercase',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            return text.toLocaleUpperCase();
        }
    }
    exports.UpperCaseAction = UpperCaseAction;
    class LowerCaseAction extends AbstractCaseAction {
        constructor() {
            super({
                id: 'editor.action.transformToLowercase',
                label: nls.localize('editor.transformToLowercase', "Transform to Lowercase"),
                alias: 'Transform to Lowercase',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            return text.toLocaleLowerCase();
        }
    }
    exports.LowerCaseAction = LowerCaseAction;
    class BackwardsCompatibleRegExp {
        constructor(_pattern, _flags) {
            this._pattern = _pattern;
            this._flags = _flags;
            this._actual = null;
            this._evaluated = false;
        }
        get() {
            if (!this._evaluated) {
                this._evaluated = true;
                try {
                    this._actual = new RegExp(this._pattern, this._flags);
                }
                catch (err) {
                    // this browser does not support this regular expression
                }
            }
            return this._actual;
        }
        isSupported() {
            return (this.get() !== null);
        }
    }
    class TitleCaseAction extends AbstractCaseAction {
        static { this.titleBoundary = new BackwardsCompatibleRegExp('(^|[^\\p{L}\\p{N}\']|((^|\\P{L})\'))\\p{L}', 'gmu'); }
        constructor() {
            super({
                id: 'editor.action.transformToTitlecase',
                label: nls.localize('editor.transformToTitlecase', "Transform to Title Case"),
                alias: 'Transform to Title Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            const titleBoundary = TitleCaseAction.titleBoundary.get();
            if (!titleBoundary) {
                // cannot support this
                return text;
            }
            return text
                .toLocaleLowerCase()
                .replace(titleBoundary, (b) => b.toLocaleUpperCase());
        }
    }
    exports.TitleCaseAction = TitleCaseAction;
    class SnakeCaseAction extends AbstractCaseAction {
        static { this.caseBoundary = new BackwardsCompatibleRegExp('(\\p{Ll})(\\p{Lu})', 'gmu'); }
        static { this.singleLetters = new BackwardsCompatibleRegExp('(\\p{Lu}|\\p{N})(\\p{Lu})(\\p{Ll})', 'gmu'); }
        constructor() {
            super({
                id: 'editor.action.transformToSnakecase',
                label: nls.localize('editor.transformToSnakecase', "Transform to Snake Case"),
                alias: 'Transform to Snake Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            const caseBoundary = SnakeCaseAction.caseBoundary.get();
            const singleLetters = SnakeCaseAction.singleLetters.get();
            if (!caseBoundary || !singleLetters) {
                // cannot support this
                return text;
            }
            return (text
                .replace(caseBoundary, '$1_$2')
                .replace(singleLetters, '$1_$2$3')
                .toLocaleLowerCase());
        }
    }
    exports.SnakeCaseAction = SnakeCaseAction;
    class CamelCaseAction extends AbstractCaseAction {
        static { this.wordBoundary = new BackwardsCompatibleRegExp('[_\\s-]', 'gm'); }
        constructor() {
            super({
                id: 'editor.action.transformToCamelcase',
                label: nls.localize('editor.transformToCamelcase', "Transform to Camel Case"),
                alias: 'Transform to Camel Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            const wordBoundary = CamelCaseAction.wordBoundary.get();
            if (!wordBoundary) {
                // cannot support this
                return text;
            }
            const words = text.split(wordBoundary);
            const firstWord = words.shift();
            return firstWord + words.map((word) => word.substring(0, 1).toLocaleUpperCase() + word.substring(1))
                .join('');
        }
    }
    exports.CamelCaseAction = CamelCaseAction;
    class PascalCaseAction extends AbstractCaseAction {
        static { this.wordBoundary = new BackwardsCompatibleRegExp('[_\\s-]', 'gm'); }
        static { this.wordBoundaryToMaintain = new BackwardsCompatibleRegExp('(?<=\\.)', 'gm'); }
        constructor() {
            super({
                id: 'editor.action.transformToPascalcase',
                label: nls.localize('editor.transformToPascalcase', "Transform to Pascal Case"),
                alias: 'Transform to Pascal Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, wordSeparators) {
            const wordBoundary = PascalCaseAction.wordBoundary.get();
            const wordBoundaryToMaintain = PascalCaseAction.wordBoundaryToMaintain.get();
            if (!wordBoundary || !wordBoundaryToMaintain) {
                // cannot support this
                return text;
            }
            const wordsWithMaintainBoundaries = text.split(wordBoundaryToMaintain);
            const words = wordsWithMaintainBoundaries.map((word) => word.split(wordBoundary)).flat();
            return words.map((word) => word.substring(0, 1).toLocaleUpperCase() + word.substring(1))
                .join('');
        }
    }
    exports.PascalCaseAction = PascalCaseAction;
    class KebabCaseAction extends AbstractCaseAction {
        static isSupported() {
            const areAllRegexpsSupported = [
                this.caseBoundary,
                this.singleLetters,
                this.underscoreBoundary,
            ].every((regexp) => regexp.isSupported());
            return areAllRegexpsSupported;
        }
        static { this.caseBoundary = new BackwardsCompatibleRegExp('(\\p{Ll})(\\p{Lu})', 'gmu'); }
        static { this.singleLetters = new BackwardsCompatibleRegExp('(\\p{Lu}|\\p{N})(\\p{Lu}\\p{Ll})', 'gmu'); }
        static { this.underscoreBoundary = new BackwardsCompatibleRegExp('(\\S)(_)(\\S)', 'gm'); }
        constructor() {
            super({
                id: 'editor.action.transformToKebabcase',
                label: nls.localize('editor.transformToKebabcase', 'Transform to Kebab Case'),
                alias: 'Transform to Kebab Case',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        _modifyText(text, _) {
            const caseBoundary = KebabCaseAction.caseBoundary.get();
            const singleLetters = KebabCaseAction.singleLetters.get();
            const underscoreBoundary = KebabCaseAction.underscoreBoundary.get();
            if (!caseBoundary || !singleLetters || !underscoreBoundary) {
                // one or more regexps aren't supported
                return text;
            }
            return text
                .replace(underscoreBoundary, '$1-$3')
                .replace(caseBoundary, '$1-$2')
                .replace(singleLetters, '$1-$2')
                .toLocaleLowerCase();
        }
    }
    exports.KebabCaseAction = KebabCaseAction;
    (0, editorExtensions_1.registerEditorAction)(CopyLinesUpAction);
    (0, editorExtensions_1.registerEditorAction)(CopyLinesDownAction);
    (0, editorExtensions_1.registerEditorAction)(DuplicateSelectionAction);
    (0, editorExtensions_1.registerEditorAction)(MoveLinesUpAction);
    (0, editorExtensions_1.registerEditorAction)(MoveLinesDownAction);
    (0, editorExtensions_1.registerEditorAction)(SortLinesAscendingAction);
    (0, editorExtensions_1.registerEditorAction)(SortLinesDescendingAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteDuplicateLinesAction);
    (0, editorExtensions_1.registerEditorAction)(TrimTrailingWhitespaceAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteLinesAction);
    (0, editorExtensions_1.registerEditorAction)(IndentLinesAction);
    (0, editorExtensions_1.registerEditorAction)(OutdentLinesAction);
    (0, editorExtensions_1.registerEditorAction)(InsertLineBeforeAction);
    (0, editorExtensions_1.registerEditorAction)(InsertLineAfterAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteAllLeftAction);
    (0, editorExtensions_1.registerEditorAction)(DeleteAllRightAction);
    (0, editorExtensions_1.registerEditorAction)(JoinLinesAction);
    (0, editorExtensions_1.registerEditorAction)(TransposeAction);
    (0, editorExtensions_1.registerEditorAction)(UpperCaseAction);
    (0, editorExtensions_1.registerEditorAction)(LowerCaseAction);
    if (SnakeCaseAction.caseBoundary.isSupported() && SnakeCaseAction.singleLetters.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(SnakeCaseAction);
    }
    if (CamelCaseAction.wordBoundary.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(CamelCaseAction);
    }
    if (PascalCaseAction.wordBoundary.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(PascalCaseAction);
    }
    if (TitleCaseAction.titleBoundary.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(TitleCaseAction);
    }
    if (KebabCaseAction.isSupported()) {
        (0, editorExtensions_1.registerEditorAction)(KebabCaseAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZXNPcGVyYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9saW5lc09wZXJhdGlvbnMvYnJvd3Nlci9saW5lc09wZXJhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEJoRyxhQUFhO0lBRWIsTUFBZSx1QkFBd0IsU0FBUSwrQkFBWTtRQUkxRCxZQUFZLElBQWEsRUFBRSxJQUFvQjtZQUM5QyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDWixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixDQUFDO1FBRU0sR0FBRyxDQUFDLFNBQTJCLEVBQUUsTUFBbUI7WUFDMUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDO2dCQUN4QixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNHLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxhQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUVwRiwrREFBK0Q7WUFDL0QsSUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFF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