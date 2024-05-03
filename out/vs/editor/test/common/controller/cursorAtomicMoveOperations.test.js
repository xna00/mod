/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/cursor/cursorAtomicMoveOperations"], function (require, exports, assert, utils_1, cursorAtomicMoveOperations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Cursor move command test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Test whitespaceVisibleColumn', () => {
            const testCases = [
                {
                    lineContent: '        ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1],
                    expectedVisibleColumn: [0, 1, 2, 3, 4, 5, 6, 7, 8, -1],
                },
                {
                    lineContent: '  ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, -1],
                    expectedVisibleColumn: [0, 1, 2, -1],
                },
                {
                    lineContent: '\t',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, -1],
                    expectedVisibleColumn: [0, 4, -1],
                },
                {
                    lineContent: '\t ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 4, -1],
                    expectedVisibleColumn: [0, 4, 5, -1],
                },
                {
                    lineContent: ' \t\t ',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, 2, 3, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, 4, 8, -1],
                    expectedVisibleColumn: [0, 1, 4, 8, 9, -1],
                },
                {
                    lineContent: ' \tA',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, 0, 0, -1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, 0, 0, -1, -1],
                    expectedVisibleColumn: [0, 1, 4, -1, -1],
                },
                {
                    lineContent: 'A',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, -1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, -1, -1],
                    expectedVisibleColumn: [0, -1, -1],
                },
                {
                    lineContent: '',
                    tabSize: 4,
                    expectedPrevTabStopPosition: [-1, -1],
                    expectedPrevTabStopVisibleColumn: [-1, -1],
                    expectedVisibleColumn: [0, -1],
                },
            ];
            for (const testCase of testCases) {
                const maxPosition = testCase.expectedVisibleColumn.length;
                for (let position = 0; position < maxPosition; position++) {
                    const actual = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.whitespaceVisibleColumn(testCase.lineContent, position, testCase.tabSize);
                    const expected = [
                        testCase.expectedPrevTabStopPosition[position],
                        testCase.expectedPrevTabStopVisibleColumn[position],
                        testCase.expectedVisibleColumn[position]
                    ];
                    assert.deepStrictEqual(actual, expected);
                }
            }
        });
        test('Test atomicPosition', () => {
            const testCases = [
                {
                    lineContent: '        ',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1],
                    expectedRight: [4, 4, 4, 4, 8, 8, 8, 8, -1, -1],
                    expectedNearest: [0, 0, 0, 4, 4, 4, 4, 8, 8, -1],
                },
                {
                    lineContent: ' \t',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, -1],
                    expectedRight: [2, 2, -1, -1],
                    expectedNearest: [0, 0, 2, -1],
                },
                {
                    lineContent: '\t ',
                    tabSize: 4,
                    expectedLeft: [-1, 0, -1, -1],
                    expectedRight: [1, -1, -1, -1],
                    expectedNearest: [0, 1, -1, -1],
                },
                {
                    lineContent: ' \t ',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, -1, -1],
                    expectedRight: [2, 2, -1, -1, -1],
                    expectedNearest: [0, 0, 2, -1, -1],
                },
                {
                    lineContent: '        A',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, 0, 0, 4, 4, 4, 4, -1, -1],
                    expectedRight: [4, 4, 4, 4, 8, 8, 8, 8, -1, -1, -1],
                    expectedNearest: [0, 0, 0, 4, 4, 4, 4, 8, 8, -1, -1],
                },
                {
                    lineContent: '      foo',
                    tabSize: 4,
                    expectedLeft: [-1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1],
                    expectedRight: [4, 4, 4, 4, -1, -1, -1, -1, -1, -1, -1],
                    expectedNearest: [0, 0, 0, 4, 4, -1, -1, -1, -1, -1, -1],
                },
            ];
            for (const testCase of testCases) {
                for (const { direction, expected } of [
                    {
                        direction: 0 /* Direction.Left */,
                        expected: testCase.expectedLeft,
                    },
                    {
                        direction: 1 /* Direction.Right */,
                        expected: testCase.expectedRight,
                    },
                    {
                        direction: 2 /* Direction.Nearest */,
                        expected: testCase.expectedNearest,
                    },
                ]) {
                    const actual = expected.map((_, i) => cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(testCase.lineContent, i, testCase.tabSize, direction));
                    assert.deepStrictEqual(actual, expected);
                }
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3Vyc29yQXRvbWljTW92ZU9wZXJhdGlvbnMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL2NvbnRyb2xsZXIvY3Vyc29yQXRvbWljTW92ZU9wZXJhdGlvbnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBRXRDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1lBQ3pDLE1BQU0sU0FBUyxHQUFHO2dCQUNqQjtvQkFDQyxXQUFXLEVBQUUsVUFBVTtvQkFDdkIsT0FBTyxFQUFFLENBQUM7b0JBQ1YsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUM3RCxnQ0FBZ0MsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ2xFLHFCQUFxQixFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ3REO2dCQUNEO29CQUNDLFdBQVcsRUFBRSxJQUFJO29CQUNqQixPQUFPLEVBQUUsQ0FBQztvQkFDViwyQkFBMkIsRUFBRSxDQUFD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