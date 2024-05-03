/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/find/browser/findController", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, utils_1, position_1, range_1, findController_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Find', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('search string at position', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'ABC DEF',
                '0123 456'
            ], {}, (editor) => {
                // The cursor is at the very top, of the file, at the first ABC
                const searchStringAtTop = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringAtTop, 'ABC');
                // Move cursor to the end of ABC
                editor.setPosition(new position_1.Position(1, 3));
                const searchStringAfterABC = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringAfterABC, 'ABC');
                // Move cursor to DEF
                editor.setPosition(new position_1.Position(1, 5));
                const searchStringInsideDEF = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringInsideDEF, 'DEF');
            });
        });
        test('search string with selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'ABC DEF',
                '0123 456'
            ], {}, (editor) => {
                // Select A of ABC
                editor.setSelection(new range_1.Range(1, 1, 1, 2));
                const searchStringSelectionA = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionA, 'A');
                // Select BC of ABC
                editor.setSelection(new range_1.Range(1, 2, 1, 4));
                const searchStringSelectionBC = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionBC, 'BC');
                // Select BC DE
                editor.setSelection(new range_1.Range(1, 2, 1, 7));
                const searchStringSelectionBCDE = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionBCDE, 'BC DE');
            });
        });
        test('search string with multiline selection', () => {
            (0, testCodeEditor_1.withTestCodeEditor)([
                'ABC DEF',
                '0123 456'
            ], {}, (editor) => {
                // Select first line and newline
                editor.setSelection(new range_1.Range(1, 1, 2, 1));
                const searchStringSelectionWholeLine = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionWholeLine, null);
                // Select first line and chunk of second
                editor.setSelection(new range_1.Range(1, 1, 2, 4));
                const searchStringSelectionTwoLines = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionTwoLines, null);
                // Select end of first line newline and chunk of second
                editor.setSelection(new range_1.Range(1, 7, 2, 4));
                const searchStringSelectionSpanLines = (0, findController_1.getSelectionSearchString)(editor);
                assert.strictEqual(searchStringSelectionSpanLines, null);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9maW5kL3Rlc3QvYnJvd3Nlci9maW5kLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUU7UUFFbEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUU7WUFDdEMsSUFBQSxtQ0FBa0IsRUFBQztnQkFDbEIsU0FBUztnQkFDVCxVQUFVO2FBQ1YsRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFFakIsK0RBQStEO2dCQUMvRCxNQUFNLGlCQUFpQixHQUFHLElBQUEseUNBQXdCLEVBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBRTdDLGdDQUFnQztnQkFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSx5Q0FBd0IsRUFBQyxNQUFNLENBQUMsQ0FBQztnQkFDOUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFaEQscUJBQXFCO2dCQUNyQixNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsTUFBTSxxQkFBcUIsR0FBRyxJQUFBLHlDQUF3QixFQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLHFCQUFxQixFQUFF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