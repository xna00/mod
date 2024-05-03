/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/test/common/utils", "vs/editor/common/core/selection", "vs/editor/contrib/linesOperations/browser/sortLinesCommand", "vs/editor/test/browser/testCommand"], function (require, exports, utils_1, selection_1, sortLinesCommand_1, testCommand_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testSortLinesAscendingCommand(lines, selection, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new sortLinesCommand_1.SortLinesCommand(sel, false), expectedLines, expectedSelection);
    }
    function testSortLinesDescendingCommand(lines, selection, expectedLines, expectedSelection) {
        (0, testCommand_1.testCommand)(lines, null, selection, (accessor, sel) => new sortLinesCommand_1.SortLinesCommand(sel, true), expectedLines, expectedSelection);
    }
    suite('Editor Contrib - Sort Lines Command', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('no op unless at least two lines selected 1', function () {
            testSortLinesAscendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1));
        });
        test('no op unless at least two lines selected 2', function () {
            testSortLinesAscendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 2, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 2, 1));
        });
        test('sorting two lines ascending', function () {
            testSortLinesAscendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 3, 4, 2), [
                'first',
                'second line',
                'fourth line',
                'third line',
                'fifth'
            ], new selection_1.Selection(3, 3, 4, 1));
        });
        test('sorting first 4 lines ascending', function () {
            testSortLinesAscendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 5, 1), [
                'first',
                'fourth line',
                'second line',
                'third line',
                'fifth'
            ], new selection_1.Selection(1, 1, 5, 1));
        });
        test('sorting all lines ascending', function () {
            testSortLinesAscendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 5, 6), [
                'fifth',
                'first',
                'fourth line',
                'second line',
                'third line',
            ], new selection_1.Selection(1, 1, 5, 11));
        });
        test('sorting first 4 lines descending', function () {
            testSortLinesDescendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 5, 1), [
                'third line',
                'second line',
                'fourth line',
                'first',
                'fifth'
            ], new selection_1.Selection(1, 1, 5, 1));
        });
        test('sorting all lines descending', function () {
            testSortLinesDescendingCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 1, 5, 6), [
                'third line',
                'second line',
                'fourth line',
                'first',
                'fifth',
            ], new selection_1.Selection(1, 1, 5, 6));
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ydExpbmVzQ29tbWFuZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9saW5lc09wZXJhdGlvbnMvdGVzdC9icm93c2VyL3NvcnRMaW5lc0NvbW1hbmQudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxTQUFTLDZCQUE2QixDQUFDLEtBQWUsRUFBRSxTQUFvQixFQUFFLGFBQXVCLEVBQUUsaUJBQTRCO1FBQ2xJLElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksbUNBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzVILENBQUM7SUFFRCxTQUFTLDhCQUE4QixDQUFDLEtBQWUsRUFBRSxTQUFvQixFQUFFLGFBQXVCLEVBQUUsaUJBQTRCO1FBQ25JLElBQUEseUJBQVcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksbUNBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQzNILENBQUM7SUFFRCxLQUFLLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBRWpELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsNENBQTRDLEVBQUU7WUFDbEQsNkJBQTZCLENBQzVCO2dCQUNDLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixZQUFZO2dCQUNaLGFBQWE7Z0JBQ2IsT0FBTzthQUNQLEVBQ0QsSUFBSSxxQkFBUyxDQUFDLENBQUMs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