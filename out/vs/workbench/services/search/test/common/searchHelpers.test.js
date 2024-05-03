/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/model", "vs/workbench/services/search/common/searchHelpers"], function (require, exports, assert, utils_1, range_1, model_1, searchHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SearchHelpers', () => {
        suite('editorMatchesToTextSearchResults', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            const mockTextModel = {
                getLineContent(lineNumber) {
                    return '' + lineNumber;
                }
            };
            function assertRangesEqual(actual, expected) {
                if (!Array.isArray(actual)) {
                    // All of these tests are for arrays...
                    throw new Error('Expected array of ranges');
                }
                assert.strictEqual(actual.length, expected.length);
                // These are sometimes Range, sometimes SearchRange
                actual.forEach((r, i) => {
                    const expectedRange = expected[i];
                    assert.deepStrictEqual({ startLineNumber: r.startLineNumber, startColumn: r.startColumn, endLineNumber: r.endLineNumber, endColumn: r.endColumn }, { startLineNumber: expectedRange.startLineNumber, startColumn: expectedRange.startColumn, endLineNumber: expectedRange.endLineNumber, endColumn: expectedRange.endColumn });
                });
            }
            test('simple', () => {
                const results = (0, searchHelpers_1.editorMatchesToTextSearchResults)([new model_1.FindMatch(new range_1.Range(6, 1, 6, 2), null)], mockTextModel);
                assert.strictEqual(results.length, 1);
                assert.strictEqual(results[0].preview.text, '6\n');
                assertRangesEqual(results[0].preview.matches, [new range_1.Range(0, 0, 0, 1)]);
                assertRangesEqual(results[0].ranges, [new range_1.Range(5, 0, 5, 1)]);
            });
            test('multiple', () => {
                const results = (0, searchHelpers_1.editorMatchesToTextSearchResults)([
                    new model_1.FindMatch(new range_1.Range(6, 1, 6, 2), null),
                    new model_1.FindMatch(new range_1.Range(6, 4, 8, 2), null),
                    new model_1.FindMatch(new range_1.Range(9, 1, 10, 3), null),
                ], mockTextModel);
                assert.strictEqual(results.length, 2);
                assertRangesEqual(results[0].preview.matches, [
                    new range_1.Range(0, 0, 0, 1),
                    new range_1.Range(0, 3, 2, 1),
                ]);
                assertRangesEqual(results[0].ranges, [
                    new range_1.Range(5, 0, 5, 1),
                    new range_1.Range(5, 3, 7, 1),
                ]);
                assert.strictEqual(results[0].preview.text, '6\n7\n8\n');
                assertRangesEqual(results[1].preview.matches, [
                    new range_1.Range(0, 0, 1, 2),
                ]);
                assertRangesEqual(results[1].ranges, [
                    new range_1.Range(8, 0, 9, 2),
                ]);
                assert.strictEqual(results[1].preview.text, '9\n10\n');
            });
        });
        suite('addContextToEditorMatches', () => {
            (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
            const MOCK_LINE_COUNT = 100;
            const mockTextModel = {
                getLineContent(lineNumber) {
                    if (lineNumber < 1 || lineNumber > MOCK_LINE_COUNT) {
                        throw new Error(`invalid line count: ${lineNumber}`);
                    }
                    return '' + lineNumber;
                },
                getLineCount() {
                    return MOCK_LINE_COUNT;
                }
            };
            function getQuery(beforeContext, afterContext) {
                return {
                    folderQueries: [],
                    type: 2 /* QueryType.Text */,
                    contentPattern: { pattern: 'test' },
                    beforeContext,
                    afterContext
                };
            }
            test('no context', () => {
                const matches = [{
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(0, 0, 0, 10)
                    }];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery()), matches);
            });
            test('simple', () => {
                const matches = [{
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(1, 0, 1, 10)
                    }];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery(1, 2)), [
                    {
                        text: '1',
                        lineNumber: 1
                    },
                    ...matches,
                    {
                        text: '3',
                        lineNumber: 3
                    },
                    {
                        text: '4',
                        lineNumber: 4
                    },
                ]);
            });
            test('multiple matches next to each other', () => {
                const matches = [
                    {
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(1, 0, 1, 10)
                    },
                    {
                        preview: {
                            text: 'bar',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(2, 0, 2, 10)
                    }
                ];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery(1, 2)), [
                    {
                        text: '1',
                        lineNumber: 1
                    },
                    ...matches,
                    {
                        text: '4',
                        lineNumber: 4
                    },
                    {
                        text: '5',
                        lineNumber: 5
                    },
                ]);
            });
            test('boundaries', () => {
                const matches = [
                    {
                        preview: {
                            text: 'foo',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(0, 0, 0, 10)
                    },
                    {
                        preview: {
                            text: 'bar',
                            matches: new range_1.Range(0, 0, 0, 10)
                        },
                        ranges: new range_1.Range(MOCK_LINE_COUNT - 1, 0, MOCK_LINE_COUNT - 1, 10)
                    }
                ];
                assert.deepStrictEqual((0, searchHelpers_1.getTextSearchMatchWithModelContext)(matches, mockTextModel, getQuery(1, 2)), [
                    matches[0],
                    {
                        text: '2',
                        lineNumber: 2
                    },
                    {
                        text: '3',
                        lineNumber: 3
                    },
                    {
                        text: '' + (MOCK_LINE_COUNT - 1),
                        lineNumber: MOCK_LINE_COUNT - 1
                    },
                    matches[1]
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoSGVscGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvc2VhcmNoL3Rlc3QvY29tbW9uL3NlYXJjaEhlbHBlcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVNoRyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtRQUMzQixLQUFLLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO1lBQzlDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztZQUMxQyxNQUFNLGFBQWEsR0FBMkI7Z0JBQzdDLGNBQWMsQ0FBQyxVQUFrQjtvQkFDaEMsT0FBTyxFQUFFLEdBQUcsVUFBVSxDQUFDO2dCQUN4QixDQUFDO2FBQ0QsQ0FBQztZQUVGLFNBQVMsaUJBQWlCLENBQUMsTUFBcUMsRUFBRSxRQUF3QjtnQkFDekYsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztvQkFDNUIsdUNBQXVDO29CQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7Z0JBQzdDLENBQUM7Z0JBRUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFbkQsbURBQW1EO2dCQUNuRCxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUN2QixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQyxlQUFlLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsYUFBYSxFQUFFLENBQUMsQ0FB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