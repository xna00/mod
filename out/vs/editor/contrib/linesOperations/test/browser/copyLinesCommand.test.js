/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/contrib/linesOperations/browser/copyLinesCommand", "vs/editor/contrib/linesOperations/browser/linesOperations", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/browser/testCommand"], function (require, exports, assert, utils_1, selection_1, copyLinesCommand_1, linesOperations_1, testCodeEditor_1, testCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testCopyLinesDownCommand(lines, selection, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new copyLinesCommand_1.CopyLinesCommand(sel, true), expectedLines, expectedSelection);
    }
    function testCopyLinesUpCommand(lines, selection, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new copyLinesCommand_1.CopyLinesCommand(sel, false), expectedLines, expectedSelection);
    }
    suite('Editor Contrib - Copy Lines Command', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('copy first line down', function () {
            testCopyLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1), [
                'first',
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 1));
        });
        test('copy first line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1), [
                'first',
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1));
        });
        test('copy last line down', function () {
            testCopyLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 3, 5, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth',
                'fifth'
            ], new selection_1.Selection(6, 3, 6, 1));
        });
        test('copy last line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 3, 5, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth',
                'fifth'
            ], new selection_1.Selection(5, 3, 5, 1));
        });
        test('issue #1322: copy line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 11, 3, 11), [
                'first',
                'second line',
                'third line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 11, 3, 11));
        });
        test('issue #1322: copy last line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 6), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 6));
        });
        test('copy many lines up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 3, 2, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 3, 2, 1));
        });
        test('ignore empty selection', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1), [
                'first',
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1));
        });
    });
    suite('Editor Contrib - Duplicate Selection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        const duplicateSelectionAction = new linesOperations_1.DuplicateSelectionAction();
        function testDuplicateSelectionAction(lines, selections, expectedLines, expectedSelections) {
            (0, testCodeEditor_1.withTestCodeEditor)(lines.join('\n'), {}, (editor) => {
                editor.setSelections(selections);
                duplicateSelectionAction.run(null, editor, {});
                assert.deepStrictEqual(editor.getValue(), expectedLines.join('\n'));
                assert.deepStrictEqual(editor.getSelections().map(s => s.toString()), expectedSelections.map(s => s.toString()));
            });
        }
        test('empty selection', function () {
            testDuplicateSelectionAction([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(2, 2, 2, 2), new selection_1.Selection(3, 2, 3, 2)], [
                'first',
                'second line',
                'second line',
                'third line',
                'third line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(3, 2, 3, 2), new selection_1.Selection(5, 2, 5, 2)]);
        });
        test('with selection', function () {
            testDuplicateSelectionAction([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(2, 1, 2, 4), new selection_1.Selection(3, 1, 3, 4)], [
                'first',
                'secsecond line',
                'thithird line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(2, 4, 2, 7), new selection_1.Selection(3, 4, 3, 7)]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29weUxpbmVzQ29tbWFuZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9saW5lc09wZXJhdGlvbnMvdGVzdC9icm93c2VyL2NvcHlMaW5lc0NvbW1hbmQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxTQUFTLHdCQUF3QixDQUFDLEtBQWUsRUFBRSxTQUFvQixFQUFFLGFBQXVCLEVBQUUsaUJBQTRCO1FBQzdILElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksbUNBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzNILENBQUM7SUFFRCxTQUFTLHNCQUFzQixDQUFDLEtBQWUsRUFBRSxTQUFvQixFQUFFLGFBQXVCLEVBQUUsaUJBQTRCO1FBQzNILElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksbUNBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzVILENBQUM7SUFFRCxLQUFLLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBRWpELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDNUIsd0JBQXdCLENBQ3ZCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMs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