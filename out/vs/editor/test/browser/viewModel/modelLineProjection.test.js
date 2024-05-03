/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/common/modelLineProjectionData", "vs/editor/common/viewModel/modelLineProjection", "vs/editor/common/viewModel/monospaceLineBreaksComputer", "vs/editor/common/viewModel/viewModelLines", "vs/editor/test/browser/config/testConfiguration", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, position_1, range_1, languages, nullTokenize_1, modelLineProjectionData_1, modelLineProjection_1, monospaceLineBreaksComputer_1, viewModelLines_1, testConfiguration_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Editor ViewModel - SplitLinesCollection', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('SplitLine', () => {
            let model1 = createModel('My First LineMy Second LineAnd another one');
            let line1 = createSplitLine([13, 14, 15], [13, 13 + 14, 13 + 14 + 15], 0);
            assert.strictEqual(line1.getViewLineCount(), 3);
            assert.strictEqual(line1.getViewLineContent(model1, 1, 0), 'My First Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 1), 'My Second Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 2), 'And another one');
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 0), 14);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 1), 15);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 2), 16);
            for (let col = 1; col <= 14; col++) {
                assert.strictEqual(line1.getModelColumnOfViewPosition(0, col), col, 'getInputColumnOfOutputPosition(0, ' + col + ')');
            }
            for (let col = 1; col <= 15; col++) {
                assert.strictEqual(line1.getModelColumnOfViewPosition(1, col), 13 + col, 'getInputColumnOfOutputPosition(1, ' + col + ')');
            }
            for (let col = 1; col <= 16; col++) {
                assert.strictEqual(line1.getModelColumnOfViewPosition(2, col), 13 + 14 + col, 'getInputColumnOfOutputPosition(2, ' + col + ')');
            }
            for (let col = 1; col <= 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(0, col), 'getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13; col <= 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(1, col - 13), 'getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13 + 14; col <= 15 + 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(2, col - 13 - 14), 'getOutputPositionOfInputPosition(' + col + ')');
            }
            model1 = createModel('My First LineMy Second LineAnd another one');
            line1 = createSplitLine([13, 14, 15], [13, 13 + 14, 13 + 14 + 15], 4);
            assert.strictEqual(line1.getViewLineCount(), 3);
            assert.strictEqual(line1.getViewLineContent(model1, 1, 0), 'My First Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 1), '    My Second Line');
            assert.strictEqual(line1.getViewLineContent(model1, 1, 2), '    And another one');
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 0), 14);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 1), 19);
            assert.strictEqual(line1.getViewLineMaxColumn(model1, 1, 2), 20);
            const actualViewColumnMapping = [];
            for (let lineIndex = 0; lineIndex < line1.getViewLineCount(); lineIndex++) {
                const actualLineViewColumnMapping = [];
                for (let col = 1; col <= line1.getViewLineMaxColumn(model1, 1, lineIndex); col++) {
                    actualLineViewColumnMapping.push(line1.getModelColumnOfViewPosition(lineIndex, col));
                }
                actualViewColumnMapping.push(actualLineViewColumnMapping);
            }
            assert.deepStrictEqual(actualViewColumnMapping, [
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                [14, 14, 14, 14, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
                [28, 28, 28, 28, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
            ]);
            for (let col = 1; col <= 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(0, col), '6.getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13; col <= 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(1, 4 + col - 13), '7.getOutputPositionOfInputPosition(' + col + ')');
            }
            for (let col = 1 + 13 + 14; col <= 15 + 14 + 13; col++) {
                assert.deepStrictEqual(line1.getViewPositionOfModelPosition(0, col), pos(2, 4 + col - 13 - 14), '8.getOutputPositionOfInputPosition(' + col + ')');
            }
        });
        function withSplitLinesCollection(text, callback) {
            const config = new testConfiguration_1.TestConfiguration({});
            const wrappingInfo = config.options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = config.options.get(50 /* EditorOption.fontInfo */);
            const wordWrapBreakAfterCharacters = config.options.get(133 /* EditorOption.wordWrapBreakAfterCharacters */);
            const wordWrapBreakBeforeCharacters = config.options.get(134 /* EditorOption.wordWrapBreakBeforeCharacters */);
            const wrappingIndent = config.options.get(138 /* EditorOption.wrappingIndent */);
            const wordBreak = config.options.get(129 /* EditorOption.wordBreak */);
            const lineBreaksComputerFactory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(wordWrapBreakBeforeCharacters, wordWrapBreakAfterCharacters);
            const model = (0, testTextModel_1.createTextModel)([
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
            ].join('\n'));
            const linesCollection = new viewModelLines_1.ViewModelLinesFromProjectedModel(1, model, lineBreaksComputerFactory, lineBreaksComputerFactory, fontInfo, model.getOptions().tabSize, 'simple', wrappingInfo.wrappingColumn, wrappingIndent, wordBreak);
            callback(model, linesCollection);
            linesCollection.dispose();
            model.dispose();
            config.dispose();
        }
        test('Invalid line numbers', () => {
            const text = [
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
            ].join('\n');
            withSplitLinesCollection(text, (model, linesCollection) => {
                assert.strictEqual(linesCollection.getViewLineCount(), 6);
                // getOutputIndentGuide
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(-1, -1), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(0, 0), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(1, 1), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(2, 2), [1]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(3, 3), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(4, 4), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(5, 5), [1]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(6, 6), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(7, 7), [0]);
                assert.deepStrictEqual(linesCollection.getViewLinesIndentGuides(0, 7), [0, 1, 0, 0, 1, 0]);
                // getOutputLineContent
                assert.strictEqual(linesCollection.getViewLineContent(-1), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(0), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(1), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(2), '\tprintf("Hello world!");');
                assert.strictEqual(linesCollection.getViewLineContent(3), '}');
                assert.strictEqual(linesCollection.getViewLineContent(4), 'int main() {');
                assert.strictEqual(linesCollection.getViewLineContent(5), '\tprintf("Hello world!");');
                assert.strictEqual(linesCollection.getViewLineContent(6), '}');
                assert.strictEqual(linesCollection.getViewLineContent(7), '}');
                // getOutputLineMinColumn
                assert.strictEqual(linesCollection.getViewLineMinColumn(-1), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(0), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(1), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(2), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(3), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(4), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(5), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(6), 1);
                assert.strictEqual(linesCollection.getViewLineMinColumn(7), 1);
                // getOutputLineMaxColumn
                assert.strictEqual(linesCollection.getViewLineMaxColumn(-1), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(0), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(1), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(2), 25);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(3), 2);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(4), 13);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(5), 25);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(6), 2);
                assert.strictEqual(linesCollection.getViewLineMaxColumn(7), 2);
                // convertOutputPositionToInputPosition
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(-1, 1), new position_1.Position(1, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(0, 1), new position_1.Position(1, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(1, 1), new position_1.Position(1, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(2, 1), new position_1.Position(2, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(3, 1), new position_1.Position(3, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(4, 1), new position_1.Position(4, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(5, 1), new position_1.Position(5, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(6, 1), new position_1.Position(6, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(7, 1), new position_1.Position(6, 1));
                assert.deepStrictEqual(linesCollection.convertViewPositionToModelPosition(8, 1), new position_1.Position(6, 1));
            });
        });
        test('issue #3662', () => {
            const text = [
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
                'int main() {',
                '\tprintf("Hello world!");',
                '}',
            ].join('\n');
            withSplitLinesCollection(text, (model, linesCollection) => {
                linesCollection.setHiddenAreas([
                    new range_1.Range(1, 1, 3, 1),
                    new range_1.Range(5, 1, 6, 1)
                ]);
                const viewLineCount = linesCollection.getViewLineCount();
                assert.strictEqual(viewLineCount, 1, 'getOutputLineCount()');
                const modelLineCount = model.getLineCount();
                for (let lineNumber = 0; lineNumber <= modelLineCount + 1; lineNumber++) {
                    const lineMinColumn = (lineNumber >= 1 && lineNumber <= modelLineCount) ? model.getLineMinColumn(lineNumber) : 1;
                    const lineMaxColumn = (lineNumber >= 1 && lineNumber <= modelLineCount) ? model.getLineMaxColumn(lineNumber) : 1;
                    for (let column = lineMinColumn - 1; column <= lineMaxColumn + 1; column++) {
                        const viewPosition = linesCollection.convertModelPositionToViewPosition(lineNumber, column);
                        // validate view position
                        let viewLineNumber = viewPosition.lineNumber;
                        let viewColumn = viewPosition.column;
                        if (viewLineNumber < 1) {
                            viewLineNumber = 1;
                        }
                        const lineCount = linesCollection.getViewLineCount();
                        if (viewLineNumber > lineCount) {
                            viewLineNumber = lineCount;
                        }
                        const viewMinColumn = linesCollection.getViewLineMinColumn(viewLineNumber);
                        const viewMaxColumn = linesCollection.getViewLineMaxColumn(viewLineNumber);
                        if (viewColumn < viewMinColumn) {
                            viewColumn = viewMinColumn;
                        }
                        if (viewColumn > viewMaxColumn) {
                            viewColumn = viewMaxColumn;
                        }
                        const validViewPosition = new position_1.Position(viewLineNumber, viewColumn);
                        assert.strictEqual(viewPosition.toString(), validViewPosition.toString(), 'model->view for ' + lineNumber + ', ' + column);
                    }
                }
                for (let lineNumber = 0; lineNumber <= viewLineCount + 1; lineNumber++) {
                    const lineMinColumn = linesCollection.getViewLineMinColumn(lineNumber);
                    const lineMaxColumn = linesCollection.getViewLineMaxColumn(lineNumber);
                    for (let column = lineMinColumn - 1; column <= lineMaxColumn + 1; column++) {
                        const modelPosition = linesCollection.convertViewPositionToModelPosition(lineNumber, column);
                        const validModelPosition = model.validatePosition(modelPosition);
                        assert.strictEqual(modelPosition.toString(), validModelPosition.toString(), 'view->model for ' + lineNumber + ', ' + column);
                    }
                }
            });
        });
    });
    suite('SplitLinesCollection', () => {
        const _text = [
            'class Nice {',
            '	function hi() {',
            '		console.log("Hello world");',
            '	}',
            '	function hello() {',
            '		console.log("Hello world, this is a somewhat longer line");',
            '	}',
            '}',
        ];
        const _tokens = [
            [
                { startIndex: 0, value: 1 },
                { startIndex: 5, value: 2 },
                { startIndex: 6, value: 3 },
                { startIndex: 10, value: 4 },
            ],
            [
                { startIndex: 0, value: 5 },
                { startIndex: 1, value: 6 },
                { startIndex: 9, value: 7 },
                { startIndex: 10, value: 8 },
                { startIndex: 12, value: 9 },
            ],
            [
                { startIndex: 0, value: 10 },
                { startIndex: 2, value: 11 },
                { startIndex: 9, value: 12 },
                { startIndex: 10, value: 13 },
                { startIndex: 13, value: 14 },
                { startIndex: 14, value: 15 },
                { startIndex: 27, value: 16 },
            ],
            [
                { startIndex: 0, value: 17 },
            ],
            [
                { startIndex: 0, value: 18 },
                { startIndex: 1, value: 19 },
                { startIndex: 9, value: 20 },
                { startIndex: 10, value: 21 },
                { startIndex: 15, value: 22 },
            ],
            [
                { startIndex: 0, value: 23 },
                { startIndex: 2, value: 24 },
                { startIndex: 9, value: 25 },
                { startIndex: 10, value: 26 },
                { startIndex: 13, value: 27 },
                { startIndex: 14, value: 28 },
                { startIndex: 59, value: 29 },
            ],
            [
                { startIndex: 0, value: 30 },
            ],
            [
                { startIndex: 0, value: 31 },
            ]
        ];
        let model;
        let languageRegistration;
        setup(() => {
            let _lineIndex = 0;
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    const tokens = _tokens[_lineIndex++];
                    const result = new Uint32Array(2 * tokens.length);
                    for (let i = 0; i < tokens.length; i++) {
                        result[2 * i] = tokens[i].startIndex;
                        result[2 * i + 1] = (tokens[i].value << 15 /* MetadataConsts.FOREGROUND_OFFSET */);
                    }
                    return new languages.EncodedTokenizationResult(result, state);
                }
            };
            const LANGUAGE_ID = 'modelModeTest1';
            languageRegistration = languages.TokenizationRegistry.register(LANGUAGE_ID, tokenizationSupport);
            model = (0, testTextModel_1.createTextModel)(_text.join('\n'), LANGUAGE_ID);
            // force tokenization
            model.tokenization.forceTokenization(model.getLineCount());
        });
        teardown(() => {
            model.dispose();
            languageRegistration.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertViewLineTokens(_actual, expected) {
            const actual = [];
            for (let i = 0, len = _actual.getCount(); i < len; i++) {
                actual[i] = {
                    endIndex: _actual.getEndOffset(i),
                    value: _actual.getForeground(i)
                };
            }
            assert.deepStrictEqual(actual, expected);
        }
        function assertMinimapLineRenderingData(actual, expected) {
            if (actual === null && expected === null) {
                assert.ok(true);
                return;
            }
            if (expected === null) {
                assert.ok(false);
            }
            assert.strictEqual(actual.content, expected.content);
            assert.strictEqual(actual.minColumn, expected.minColumn);
            assert.strictEqual(actual.maxColumn, expected.maxColumn);
            assertViewLineTokens(actual.tokens, expected.tokens);
        }
        function assertMinimapLinesRenderingData(actual, expected) {
            assert.strictEqual(actual.length, expected.length);
            for (let i = 0; i < expected.length; i++) {
                assertMinimapLineRenderingData(actual[i], expected[i]);
            }
        }
        function assertAllMinimapLinesRenderingData(splitLinesCollection, all) {
            const lineCount = all.length;
            for (let line = 1; line <= lineCount; line++) {
                assert.strictEqual(splitLinesCollection.getViewLineData(line).content, splitLinesCollection.getViewLineContent(line));
            }
            for (let start = 1; start <= lineCount; start++) {
                for (let end = start; end <= lineCount; end++) {
                    const count = end - start + 1;
                    for (let desired = Math.pow(2, count) - 1; desired >= 0; desired--) {
                        const needed = [];
                        const expected = [];
                        for (let i = 0; i < count; i++) {
                            needed[i] = (desired & (1 << i)) ? true : false;
                            expected[i] = (needed[i] ? all[start - 1 + i] : null);
                        }
                        const actual = splitLinesCollection.getViewLinesData(start, end, needed);
                        assertMinimapLinesRenderingData(actual, expected);
                        // Comment out next line to test all possible combinations
                        break;
                    }
                }
            }
        }
        test('getViewLinesData - no wrapping', () => {
            withSplitLinesCollection(model, 'off', 0, (splitLinesCollection) => {
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 8);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                const _expected = [
                    {
                        content: 'class Nice {',
                        minColumn: 1,
                        maxColumn: 13,
                        tokens: [
                            { endIndex: 5, value: 1 },
                            { endIndex: 6, value: 2 },
                            { endIndex: 10, value: 3 },
                            { endIndex: 12, value: 4 },
                        ]
                    },
                    {
                        content: '	function hi() {',
                        minColumn: 1,
                        maxColumn: 17,
                        tokens: [
                            { endIndex: 1, value: 5 },
                            { endIndex: 9, value: 6 },
                            { endIndex: 10, value: 7 },
                            { endIndex: 12, value: 8 },
                            { endIndex: 16, value: 9 },
                        ]
                    },
                    {
                        content: '		console.log("Hello world");',
                        minColumn: 1,
                        maxColumn: 30,
                        tokens: [
                            { endIndex: 2, value: 10 },
                            { endIndex: 9, value: 11 },
                            { endIndex: 10, value: 12 },
                            { endIndex: 13, value: 13 },
                            { endIndex: 14, value: 14 },
                            { endIndex: 27, value: 15 },
                            { endIndex: 29, value: 16 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 17 },
                        ]
                    },
                    {
                        content: '	function hello() {',
                        minColumn: 1,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 1, value: 18 },
                            { endIndex: 9, value: 19 },
                            { endIndex: 10, value: 20 },
                            { endIndex: 15, value: 21 },
                            { endIndex: 19, value: 22 },
                        ]
                    },
                    {
                        content: '		console.log("Hello world, this is a somewhat longer line");',
                        minColumn: 1,
                        maxColumn: 62,
                        tokens: [
                            { endIndex: 2, value: 23 },
                            { endIndex: 9, value: 24 },
                            { endIndex: 10, value: 25 },
                            { endIndex: 13, value: 26 },
                            { endIndex: 14, value: 27 },
                            { endIndex: 59, value: 28 },
                            { endIndex: 61, value: 29 },
                        ]
                    },
                    {
                        minColumn: 1,
                        maxColumn: 3,
                        content: '	}',
                        tokens: [
                            { endIndex: 2, value: 30 },
                        ]
                    },
                    {
                        minColumn: 1,
                        maxColumn: 2,
                        content: '}',
                        tokens: [
                            { endIndex: 1, value: 31 },
                        ]
                    }
                ];
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[1],
                    _expected[2],
                    _expected[3],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                ]);
                splitLinesCollection.setHiddenAreas([new range_1.Range(2, 1, 4, 1)]);
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 5);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                ]);
            });
        });
        test('getViewLinesData - with wrapping', () => {
            withSplitLinesCollection(model, 'wordWrapColumn', 30, (splitLinesCollection) => {
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 12);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                const _expected = [
                    {
                        content: 'class Nice {',
                        minColumn: 1,
                        maxColumn: 13,
                        tokens: [
                            { endIndex: 5, value: 1 },
                            { endIndex: 6, value: 2 },
                            { endIndex: 10, value: 3 },
                            { endIndex: 12, value: 4 },
                        ]
                    },
                    {
                        content: '	function hi() {',
                        minColumn: 1,
                        maxColumn: 17,
                        tokens: [
                            { endIndex: 1, value: 5 },
                            { endIndex: 9, value: 6 },
                            { endIndex: 10, value: 7 },
                            { endIndex: 12, value: 8 },
                            { endIndex: 16, value: 9 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 10 },
                            { endIndex: 9, value: 11 },
                            { endIndex: 10, value: 12 },
                            { endIndex: 13, value: 13 },
                            { endIndex: 14, value: 14 },
                            { endIndex: 21, value: 15 },
                        ]
                    },
                    {
                        content: '            world");',
                        minColumn: 13,
                        maxColumn: 21,
                        tokens: [
                            { endIndex: 18, value: 15 },
                            { endIndex: 20, value: 16 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 17 },
                        ]
                    },
                    {
                        content: '	function hello() {',
                        minColumn: 1,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 1, value: 18 },
                            { endIndex: 9, value: 19 },
                            { endIndex: 10, value: 20 },
                            { endIndex: 15, value: 21 },
                            { endIndex: 19, value: 22 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 23 },
                            { endIndex: 9, value: 24 },
                            { endIndex: 10, value: 25 },
                            { endIndex: 13, value: 26 },
                            { endIndex: 14, value: 27 },
                            { endIndex: 21, value: 28 },
                        ]
                    },
                    {
                        content: '            world, this is a ',
                        minColumn: 13,
                        maxColumn: 30,
                        tokens: [
                            { endIndex: 29, value: 28 },
                        ]
                    },
                    {
                        content: '            somewhat longer ',
                        minColumn: 13,
                        maxColumn: 29,
                        tokens: [
                            { endIndex: 28, value: 28 },
                        ]
                    },
                    {
                        content: '            line");',
                        minColumn: 13,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 17, value: 28 },
                            { endIndex: 19, value: 29 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 30 },
                        ]
                    },
                    {
                        content: '}',
                        minColumn: 1,
                        maxColumn: 2,
                        tokens: [
                            { endIndex: 1, value: 31 },
                        ]
                    }
                ];
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[1],
                    _expected[2],
                    _expected[3],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                    _expected[8],
                    _expected[9],
                    _expected[10],
                    _expected[11],
                ]);
                splitLinesCollection.setHiddenAreas([new range_1.Range(2, 1, 4, 1)]);
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 8);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(1, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(2, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(3, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(4, 1), false);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(5, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(6, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(7, 1), true);
                assert.strictEqual(splitLinesCollection.modelPositionIsVisible(8, 1), true);
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                    _expected[8],
                    _expected[9],
                    _expected[10],
                    _expected[11],
                ]);
            });
        });
        test('getViewLinesData - with wrapping and injected text', () => {
            model.deltaDecorations([], [{
                    range: new range_1.Range(1, 9, 1, 9),
                    options: {
                        description: 'example',
                        after: {
                            content: 'very very long injected text that causes a line break',
                            inlineClassName: 'myClassName'
                        },
                        showIfCollapsed: true,
                    }
                }]);
            withSplitLinesCollection(model, 'wordWrapColumn', 30, (splitLinesCollection) => {
                assert.strictEqual(splitLinesCollection.getViewLineCount(), 14);
                assert.strictEqual(splitLinesCollection.getViewLineMaxColumn(1), 24);
                const _expected = [
                    {
                        content: 'class Nivery very long ',
                        minColumn: 1,
                        maxColumn: 24,
                        tokens: [
                            { endIndex: 5, value: 1 },
                            { endIndex: 6, value: 2 },
                            { endIndex: 8, value: 3 },
                            { endIndex: 23, value: 1 },
                        ]
                    },
                    {
                        content: '    injected text that causes ',
                        minColumn: 5,
                        maxColumn: 31,
                        tokens: [{ endIndex: 30, value: 1 }]
                    },
                    {
                        content: '    a line breakce {',
                        minColumn: 5,
                        maxColumn: 21,
                        tokens: [
                            { endIndex: 16, value: 1 },
                            { endIndex: 18, value: 3 },
                            { endIndex: 20, value: 4 }
                        ]
                    },
                    {
                        content: '	function hi() {',
                        minColumn: 1,
                        maxColumn: 17,
                        tokens: [
                            { endIndex: 1, value: 5 },
                            { endIndex: 9, value: 6 },
                            { endIndex: 10, value: 7 },
                            { endIndex: 12, value: 8 },
                            { endIndex: 16, value: 9 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 10 },
                            { endIndex: 9, value: 11 },
                            { endIndex: 10, value: 12 },
                            { endIndex: 13, value: 13 },
                            { endIndex: 14, value: 14 },
                            { endIndex: 21, value: 15 },
                        ]
                    },
                    {
                        content: '            world");',
                        minColumn: 13,
                        maxColumn: 21,
                        tokens: [
                            { endIndex: 18, value: 15 },
                            { endIndex: 20, value: 16 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 17 },
                        ]
                    },
                    {
                        content: '	function hello() {',
                        minColumn: 1,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 1, value: 18 },
                            { endIndex: 9, value: 19 },
                            { endIndex: 10, value: 20 },
                            { endIndex: 15, value: 21 },
                            { endIndex: 19, value: 22 },
                        ]
                    },
                    {
                        content: '		console.log("Hello ',
                        minColumn: 1,
                        maxColumn: 22,
                        tokens: [
                            { endIndex: 2, value: 23 },
                            { endIndex: 9, value: 24 },
                            { endIndex: 10, value: 25 },
                            { endIndex: 13, value: 26 },
                            { endIndex: 14, value: 27 },
                            { endIndex: 21, value: 28 },
                        ]
                    },
                    {
                        content: '            world, this is a ',
                        minColumn: 13,
                        maxColumn: 30,
                        tokens: [
                            { endIndex: 29, value: 28 },
                        ]
                    },
                    {
                        content: '            somewhat longer ',
                        minColumn: 13,
                        maxColumn: 29,
                        tokens: [
                            { endIndex: 28, value: 28 },
                        ]
                    },
                    {
                        content: '            line");',
                        minColumn: 13,
                        maxColumn: 20,
                        tokens: [
                            { endIndex: 17, value: 28 },
                            { endIndex: 19, value: 29 },
                        ]
                    },
                    {
                        content: '	}',
                        minColumn: 1,
                        maxColumn: 3,
                        tokens: [
                            { endIndex: 2, value: 30 },
                        ]
                    },
                    {
                        content: '}',
                        minColumn: 1,
                        maxColumn: 2,
                        tokens: [
                            { endIndex: 1, value: 31 },
                        ]
                    }
                ];
                assertAllMinimapLinesRenderingData(splitLinesCollection, [
                    _expected[0],
                    _expected[1],
                    _expected[2],
                    _expected[3],
                    _expected[4],
                    _expected[5],
                    _expected[6],
                    _expected[7],
                    _expected[8],
                    _expected[9],
                    _expected[10],
                    _expected[11],
                ]);
                const data = splitLinesCollection.getViewLinesData(1, 14, new Array(14).fill(true));
                assert.deepStrictEqual(data.map((d) => ({
                    inlineDecorations: d.inlineDecorations?.map((d) => ({
                        startOffset: d.startOffset,
                        endOffset: d.endOffset,
                    })),
                })), [
                    { inlineDecorations: [{ startOffset: 8, endOffset: 23 }] },
                    { inlineDecorations: [{ startOffset: 4, endOffset: 30 }] },
                    { inlineDecorations: [{ startOffset: 4, endOffset: 16 }] },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                    { inlineDecorations: undefined },
                ]);
            });
        });
        function withSplitLinesCollection(model, wordWrap, wordWrapColumn, callback) {
            const configuration = new testConfiguration_1.TestConfiguration({
                wordWrap: wordWrap,
                wordWrapColumn: wordWrapColumn,
                wrappingIndent: 'indent'
            });
            const wrappingInfo = configuration.options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = configuration.options.get(50 /* EditorOption.fontInfo */);
            const wordWrapBreakAfterCharacters = configuration.options.get(133 /* EditorOption.wordWrapBreakAfterCharacters */);
            const wordWrapBreakBeforeCharacters = configuration.options.get(134 /* EditorOption.wordWrapBreakBeforeCharacters */);
            const wrappingIndent = configuration.options.get(138 /* EditorOption.wrappingIndent */);
            const wordBreak = configuration.options.get(129 /* EditorOption.wordBreak */);
            const lineBreaksComputerFactory = new monospaceLineBreaksComputer_1.MonospaceLineBreaksComputerFactory(wordWrapBreakBeforeCharacters, wordWrapBreakAfterCharacters);
            const linesCollection = new viewModelLines_1.ViewModelLinesFromProjectedModel(1, model, lineBreaksComputerFactory, lineBreaksComputerFactory, fontInfo, model.getOptions().tabSize, 'simple', wrappingInfo.wrappingColumn, wrappingIndent, wordBreak);
            callback(linesCollection);
            configuration.dispose();
        }
    });
    function pos(lineNumber, column) {
        return new position_1.Position(lineNumber, column);
    }
    function createSplitLine(splitLengths, breakingOffsetsVisibleColumn, wrappedTextIndentWidth, isVisible = true) {
        return (0, modelLineProjection_1.createModelLineProjection)(createLineBreakData(splitLengths, breakingOffsetsVisibleColumn, wrappedTextIndentWidth), isVisible);
    }
    function createLineBreakData(breakingLengths, breakingOffsetsVisibleColumn, wrappedTextIndentWidth) {
        const sums = [];
        for (let i = 0; i < breakingLengths.length; i++) {
            sums[i] = (i > 0 ? sums[i - 1] : 0) + breakingLengths[i];
        }
        return new modelLineProjectionData_1.ModelLineProjectionData(null, null, sums, breakingOffsetsVisibleColumn, wrappedTextIndentWidth);
    }
    function createModel(text) {
        return {
            tokenization: {
                getLineTokens: (lineNumber) => {
                    return null;
                },
            },
            getLineContent: (lineNumber) => {
                return text;
            },
            getLineLength: (lineNumber) => {
                return text.length;
            },
            getLineMinColumn: (lineNumber) => {
                return 1;
            },
            getLineMaxColumn: (lineNumber) => {
                return text.length + 1;
            },
            getValueInRange: (range, eol) => {
                return text.substring(range.startColumn - 1, range.endColumn - 1);
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWxMaW5lUHJvamVjdGlvbi50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL3ZpZXdNb2RlbC9tb2RlbExpbmVQcm9qZWN0aW9uLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFzQmhHLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7UUFFckQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyw0Q0FBNEMsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksS0FBSyxHQUFHLGVBQWUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDN0UsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxpQkFBaUIs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QUFDLENBQUMsQ0FBQztnQkFFL0QsdUNBQXVDO2dCQUN2QyxNQUFNLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RHLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLE1BQU0sQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JHLE1BQU0sQ0FBQyxlQUFlLENBQUMs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QixFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM3QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDN0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzdCLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2FBQzdCO1lBQ0Q7Z0JBQ0MsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7YUFDNUI7WUFDRDtnQkFDQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM1QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDN0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7YUFDN0I7WUFDRDtnQkFDQyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDNUIsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFO2dCQUM1QixFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTtnQkFDN0IsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxF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RUFBRSxJQUFJO3dCQUNiLFNBQVMsRUFBRSxDQUFDO3dCQUNaLFNBQVMsRUFBRSxDQUFDO3dCQUNaLE1BQU0sRUFBRTs0QkFDUCxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDMUI7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLHFCQUFxQjt3QkFDOUIsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTt5QkFDM0I7cUJBQ0Q7b0JBQ0Q7d0JBQ0MsT0FBTyxFQUFFLHVCQUF1Qjt3QkFDaEMsU0FBUyxFQUFFLENBQUM7d0JBQ1osU0FBUyxFQUFFLEVBQUU7d0JBQ2IsTUFBTSxFQUFFOzRCQUNQLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMxQixFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDMUIsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7NEJBQzNCLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFOzRCQUMzQixFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRTs0QkFDM0IsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUU7eUJBQzNCO3FC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