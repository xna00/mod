/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/contrib/lineSelection/browser/lineSelection", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, utils_1, position_1, selection_1, lineSelection_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function executeAction(action, editor) {
        action.run(null, editor, undefined);
    }
    suite('LineSelection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('', () => {
            const LINE1 = '    \tMy First Line\t ';
            const LINE2 = '\tMy Second Line';
            const LINE3 = '    Third Line🐶';
            const LINE4 = '';
            const LINE5 = '1';
            const TEXT = LINE1 + '\r\n' +
                LINE2 + '\n' +
                LINE3 + '\n' +
                LINE4 + '\r\n' +
                LINE5;
            (0, testCodeEditor_1.withTestCodeEditor)(TEXT, {}, (editor, viewModel) => {
                const action = new lineSelection_1.ExpandLineSelectionAction();
                //              0          1         2
                //              01234 56789012345678 0
                // let LINE1 = '    \tMy First Line\t ';
                editor.setPosition(new position_1.Position(1, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 2));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 5));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 19));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 20));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                editor.setPosition(new position_1.Position(1, 21));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 2, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 3, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 4, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 5, 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 5, LINE5.length + 1));
                executeAction(action, editor);
                assert.deepStrictEqual(editor.getSelection(), new selection_1.Selection(1, 1, 5, LINE5.length + 1));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVNlbGVjdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9saW5lU2VsZWN0aW9uL3Rlc3QvYnJvd3Nlci9saW5lU2VsZWN0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsU0FBUyxhQUFhLENBQUMsTUFBb0IsRUFBRSxNQUFtQjtRQUMvRCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUssRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBRTNCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTtZQUNiLE1BQU0sS0FBSyxHQUFHLHdCQUF3QixDQUFDO1lBQ3ZDLE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDO1lBQ2pDLE1BQU0sS0FBSyxHQUFHLGtCQUFrQixDQUFDO1lBQ2pDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNqQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7WUFFbEIsTUFBTSxJQUFJLEdBQ1QsS0FBSyxHQUFHLE1BQU07Z0JBQ2QsS0FBSyxHQUFHLElBQUk7Z0JBQ1osS0FBSyxHQUFHLElBQUk7Z0JBQ1osS0FBSyxHQUFHLE1BQU07Z0JBQ2QsS0FBSyxDQUFDO1lBRVAsSUFBQSxtQ0FBa0IsRUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO2dCQUNsRCxNQUFNLE1BQU0sR0FBRyxJQUFJLHlDQUF5QixFQUFFLENBQUM7Z0JBRS9DLHNDQUFzQztnQkFDdEMsc0NBQXNDO2dCQUN0Qyx3Q0FBd0M7Z0JBQ3hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFekUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV6RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkMsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRXpFLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFFekUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUV6RSxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEMsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6RSxhQUFhLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUM5QixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDekUsYUFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hGLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekYsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=