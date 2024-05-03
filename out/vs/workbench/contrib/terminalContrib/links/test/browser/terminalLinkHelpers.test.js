/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkHelpers", "vs/base/test/common/utils"], function (require, exports, assert, terminalLinkHelpers_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Terminal Link Helpers', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('convertLinkRangeToBuffer', () => {
            test('should convert ranges for ascii characters', () => {
                const lines = createBufferLineArray([
                    { text: 'AA http://t', width: 11 },
                    { text: '.com/f/', width: 8 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 4, startLineNumber: 1, endColumn: 19, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4, y: 1 },
                    end: { x: 7, y: 2 }
                });
            });
            test('should convert ranges for wide characters before the link', () => {
                const lines = createBufferLineArray([
                    { text: 'A文 http://', width: 11 },
                    { text: 't.com/f/', width: 9 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 4, startLineNumber: 1, endColumn: 19, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4 + 1, y: 1 },
                    end: { x: 7 + 1, y: 2 }
                });
            });
            test('should give correct range for links containing multi-character emoji', () => {
                const lines = createBufferLineArray([
                    { text: 'A🙂 http://', width: 11 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 0 + 1, startLineNumber: 1, endColumn: 2 + 1, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 1, y: 1 },
                    end: { x: 2, y: 1 }
                });
            });
            test('should convert ranges for combining characters before the link', () => {
                const lines = createBufferLineArray([
                    { text: 'A🙂 http://', width: 11 },
                    { text: 't.com/f/', width: 9 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 4 + 1, startLineNumber: 1, endColumn: 19 + 1, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 6, y: 1 },
                    end: { x: 9, y: 2 }
                });
            });
            test('should convert ranges for wide characters inside the link', () => {
                const lines = createBufferLineArray([
                    { text: 'AA http://t', width: 11 },
                    { text: '.com/文/', width: 8 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 4, startLineNumber: 1, endColumn: 19, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4, y: 1 },
                    end: { x: 7 + 1, y: 2 }
                });
            });
            test('should convert ranges for wide characters before and inside the link', () => {
                const lines = createBufferLineArray([
                    { text: 'A文 http://', width: 11 },
                    { text: 't.com/文/', width: 9 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 4, startLineNumber: 1, endColumn: 19, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4 + 1, y: 1 },
                    end: { x: 7 + 2, y: 2 }
                });
            });
            test('should convert ranges for emoji before and wide inside the link', () => {
                const lines = createBufferLineArray([
                    { text: 'A🙂 http://', width: 11 },
                    { text: 't.com/文/', width: 9 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 4 + 1, startLineNumber: 1, endColumn: 19 + 1, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 6, y: 1 },
                    end: { x: 10 + 1, y: 2 }
                });
            });
            test('should convert ranges for ascii characters (link starts on wrapped)', () => {
                const lines = createBufferLineArray([
                    { text: 'AAAAAAAAAAA', width: 11 },
                    { text: 'AA http://t', width: 11 },
                    { text: '.com/f/', width: 8 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 15, startLineNumber: 1, endColumn: 30, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4, y: 2 },
                    end: { x: 7, y: 3 }
                });
            });
            test('should convert ranges for wide characters before the link (link starts on wrapped)', () => {
                const lines = createBufferLineArray([
                    { text: 'AAAAAAAAAAA', width: 11 },
                    { text: 'A文 http://', width: 11 },
                    { text: 't.com/f/', width: 9 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 15, startLineNumber: 1, endColumn: 30, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4 + 1, y: 2 },
                    end: { x: 7 + 1, y: 3 }
                });
            });
            test('regression test #147619: 获取模板 25235168 的预览图失败', () => {
                const lines = createBufferLineArray([
                    { text: '获取模板 25235168 的预览图失败', width: 30 }
                ]);
                assert.deepStrictEqual((0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 30, {
                    startColumn: 1,
                    startLineNumber: 1,
                    endColumn: 5,
                    endLineNumber: 1
                }, 0), {
                    start: { x: 1, y: 1 },
                    end: { x: 8, y: 1 }
                });
                assert.deepStrictEqual((0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 30, {
                    startColumn: 6,
                    startLineNumber: 1,
                    endColumn: 14,
                    endLineNumber: 1
                }, 0), {
                    start: { x: 10, y: 1 },
                    end: { x: 17, y: 1 }
                });
                assert.deepStrictEqual((0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 30, {
                    startColumn: 15,
                    startLineNumber: 1,
                    endColumn: 21,
                    endLineNumber: 1
                }, 0), {
                    start: { x: 19, y: 1 },
                    end: { x: 30, y: 1 }
                });
            });
            test('should convert ranges for wide characters inside the link (link starts on wrapped)', () => {
                const lines = createBufferLineArray([
                    { text: 'AAAAAAAAAAA', width: 11 },
                    { text: 'AA http://t', width: 11 },
                    { text: '.com/文/', width: 8 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 15, startLineNumber: 1, endColumn: 30, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4, y: 2 },
                    end: { x: 7 + 1, y: 3 }
                });
            });
            test('should convert ranges for wide characters before and inside the link #2', () => {
                const lines = createBufferLineArray([
                    { text: 'AAAAAAAAAAA', width: 11 },
                    { text: 'A文 http://', width: 11 },
                    { text: 't.com/文/', width: 9 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 15, startLineNumber: 1, endColumn: 30, endLineNumber: 1 }, 0);
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 4 + 1, y: 2 },
                    end: { x: 7 + 2, y: 3 }
                });
            });
            test('should convert ranges for several wide characters before the link', () => {
                const lines = createBufferLineArray([
                    { text: 'A文文AAAAAA', width: 11 },
                    { text: 'AA文文 http', width: 11 },
                    { text: '://t.com/f/', width: 11 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 15, startLineNumber: 1, endColumn: 30, endLineNumber: 1 }, 0);
                // This test ensures that the start offset is applied to the end before it's counted
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 3 + 4, y: 2 },
                    end: { x: 6 + 4, y: 3 }
                });
            });
            test('should convert ranges for several wide characters before and inside the link', () => {
                const lines = createBufferLineArray([
                    { text: 'A文文AAAAAA', width: 11 },
                    { text: 'AA文文 http', width: 11 },
                    { text: '://t.com/文', width: 11 },
                    { text: '文/', width: 3 }
                ]);
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, 11, { startColumn: 14, startLineNumber: 1, endColumn: 31, endLineNumber: 1 }, 0);
                // This test ensures that the start offset is applies to the end before it's counted
                assert.deepStrictEqual(bufferRange, {
                    start: { x: 5, y: 2 },
                    end: { x: 1, y: 4 }
                });
            });
        });
    });
    const TEST_WIDE_CHAR = '文';
    const TEST_NULL_CHAR = 'C';
    function createBufferLineArray(lines) {
        const result = [];
        lines.forEach((l, i) => {
            result.push(new TestBufferLine(l.text, l.width, i + 1 !== lines.length));
        });
        return result;
    }
    class TestBufferLine {
        constructor(_text, length, isWrapped) {
            this._text = _text;
            this.length = length;
            this.isWrapped = isWrapped;
        }
        getCell(x) {
            // Create a fake line of cells and use that to resolve the width
            const cells = [];
            let wideNullCellOffset = 0; // There is no null 0 width char after a wide char
            const emojiOffset = 0; // Skip chars as emoji are multiple characters
            for (let i = 0; i <= x - wideNullCellOffset + emojiOffset; i++) {
                let char = this._text.charAt(i);
                if (char === '\ud83d') {
                    // Make "🙂"
                    char += '\ude42';
                }
                cells.push(char);
                if (this._text.charAt(i) === TEST_WIDE_CHAR || char.charCodeAt(0) > 255) {
                    // Skip the next character as it's width is 0
                    cells.push(TEST_NULL_CHAR);
                    wideNullCellOffset++;
                }
            }
            return {
                getChars: () => {
                    return x >= cells.length ? '' : cells[x];
                },
                getWidth: () => {
                    switch (cells[x]) {
                        case TEST_WIDE_CHAR: return 2;
                        case TEST_NULL_CHAR: return 0;
                        default: {
                            // Naive measurement, assume anything our of ascii in tests are wide
                            if (cells[x].charCodeAt(0) > 255) {
                                return 2;
                            }
                            return 1;
                        }
                    }
                }
            };
        }
        translateToString() {
            throw new Error('Method not implemented.');
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxMaW5rSGVscGVycy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvdGVzdC9icm93c2VyL3Rlcm1pbmFsTGlua0hlbHBlcnMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1FBQy9DLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7Z0JBQ3ZELE1BQU0sS0FBSyxHQUFHLHFCQUFxQixDQUFDO29CQUNuQyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtvQkFDbEMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUU7aUJBQzdCLENBQUMsQ0FBQztnQkFDSCxNQUFNLFdBQVcsR0FBRyxJQUFBLDhDQUF3QixFQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLGVBQWUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BJLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFO29CQUNuQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ3JCLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtpQkFDbkIsQ0FBQyxDQUFDO1lB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