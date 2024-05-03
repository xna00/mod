/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/hover/browser/contentHover", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, utils_1, position_1, range_1, contentHover_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Content Hover', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('issue #151235: Gitlens hover shows up in the wrong place', () => {
            const text = 'just some text';
            (0, testCodeEditor_1.withTestCodeEditor)(text, {}, (editor) => {
                const actual = contentHover_1.ContentHoverController.computeHoverRanges(editor, new range_1.Range(5, 5, 5, 5), [{ range: new range_1.Range(4, 1, 5, 6) }]);
                assert.deepStrictEqual(actual, {
                    showAtPosition: new position_1.Position(5, 5),
                    showAtSecondaryPosition: new position_1.Position(5, 5),
                    highlightRange: new range_1.Range(4, 1, 5, 6)
                });
            });
        });
        test('issue #95328: Hover placement with word-wrap', () => {
            const text = 'just some text';
            const opts = { wordWrap: 'wordWrapColumn', wordWrapColumn: 6 };
            (0, testCodeEditor_1.withTestCodeEditor)(text, opts, (editor) => {
                const actual = contentHover_1.ContentHoverController.computeHoverRanges(editor, new range_1.Range(1, 8, 1, 8), [{ range: new range_1.Range(1, 1, 1, 15) }]);
                assert.deepStrictEqual(actual, {
                    showAtPosition: new position_1.Position(1, 8),
                    showAtSecondaryPosition: new position_1.Position(1, 6),
                    highlightRange: new range_1.Range(1, 1, 1, 15)
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2hvdmVyL3Rlc3QvYnJvd3Nlci9jb250ZW50SG92ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUUzQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtZQUNyRSxNQUFNLElBQUksR0FBRyxnQkFBZ0IsQ0FBQztZQUM5QixJQUFBLG1DQUFrQixFQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDdkMsTUFBTSxNQUFNLEdBQUcscUNBQXNCLENBQUMsa0JBQWtCLENBQ3ZELE1BQU0sRUFDTixJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDckIsQ0FBYSxFQUFFLEtBQUssRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQzlDLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLGVBQWUsQ0FDckIsTUFBTSxFQUNOO29CQUNDLGNBQWMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbEMsdUJBQXVCLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzNDLGNBQWMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBQ3JDLENBQ0QsQ0FBQztZQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsOENBQThDLEVBQUUsR0FBRyxFQUFFO1lBQ3pELE1BQU0sSUFBSSxHQUFHLGdCQUFnQixDQUFDO1lBQzlCLE1BQU0sSUFBSSxHQUF1QyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDbkcsSUFBQSxtQ0FBa0IsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ3pDLE1BQU0sTUFBTSxHQUFHLHFDQUFzQixDQUFDLGtCQUFrQixDQUN2RCxNQUFNLEVBQ04sSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ3JCLENBQWEsRUFBRSxLQUFLLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUMvQyxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLE1BQU0sRUFDTjtvQkFDQyxjQUFjLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2xDLHVCQUF1QixFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUMzQyxjQUFjLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2lCQUN0QyxDQUNELENBQUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==