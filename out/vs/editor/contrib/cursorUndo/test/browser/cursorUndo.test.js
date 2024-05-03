/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/browser/coreCommands", "vs/editor/common/core/selection", "vs/editor/contrib/cursorUndo/browser/cursorUndo", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, utils_1, coreCommands_1, selection_1, cursorUndo_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('FindController', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const cursorUndoAction = new cursorUndo_1.CursorUndo();
        test('issue #82535: Edge case with cursorUndo', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor) => {
                editor.registerAndInstantiateContribution(cursorUndo_1.CursorUndoRedoController.ID, cursorUndo_1.CursorUndoRedoController);
                // type hello
                editor.trigger('test', "type" /* Handler.Type */, { text: 'hello' });
                // press left
                coreCommands_1.CoreNavigationCommands.CursorLeft.runEditorCommand(null, editor, {});
                // press Delete
                coreCommands_1.CoreEditingCommands.DeleteRight.runEditorCommand(null, editor, {});
                assert.deepStrictEqual(editor.getValue(), 'hell');
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 5, 1, 5)]);
                // press left
                coreCommands_1.CoreNavigationCommands.CursorLeft.runEditorCommand(null, editor, {});
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 4, 1, 4)]);
                // press Ctrl+U
                cursorUndoAction.run(null, editor, {});
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 5, 1, 5)]);
            });
        });
        test('issue #82535: Edge case with cursorUndo (reverse)', () => {
            (0, testCodeEditor_1.withTestCodeEditor)('', {}, (editor) => {
                editor.registerAndInstantiateContribution(cursorUndo_1.CursorUndoRedoController.ID, cursorUndo_1.CursorUndoRedoController);
                // type hello
                editor.trigger('test', "type" /* Handler.Type */, { text: 'hell' });
                editor.trigger('test', "type" /* Handler.Type */, { text: 'o' });
                assert.deepStrictEqual(editor.getValue(), 'hello');
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
                // press Ctrl+U
                cursorUndoAction.run(null, editor, {});
                assert.deepStrictEqual(editor.getSelections(), [new selection_1.Selection(1, 6, 1, 6)]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yVW5kby50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jdXJzb3JVbmRvL3Rlc3QvYnJvd3Nlci9jdXJzb3JVbmRvLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLHVCQUFVLEVBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO1lBQ3BELElBQUEsbUNBQWtCLEVBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUVyQyxNQUFNLENBQUMsa0NBQWtDLENBQUMscUNBQXdCLENBQUMsRUFBRSxFQUFFLHFDQUF3QixDQUFDLENBQUM7Z0JBRWpHLGFBQWE7Z0JBQ2IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLDZCQUFnQixFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUV4RCxhQUFhO2dCQUNiLHFDQUFzQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUVyRSxlQUFlO2dCQUNmLGtDQUFtQixDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1RSxhQUFhO2dCQUNiLHFDQUFzQixDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRSxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVFLGVBQWU7Z0JBQ2YsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLElBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtZQUM5RCxJQUFBLG1DQUFrQixFQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFFckMsTUFBTSxDQUFDLGtDQUFrQyxDQUFDLHFDQUF3QixDQUFDLEVBQUUsRUFBRSxxQ0FBd0IsQ0FBQyxDQUFDO2dCQUVqRyxhQUFhO2dCQUNiLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSw2QkFBZ0IsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDdkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLDZCQUFnQixFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDbkQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUU1RSxlQUFlO2dCQUNmLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxJQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0UsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=