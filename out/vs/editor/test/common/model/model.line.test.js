/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/model/utils", "vs/editor/common/tokens/contiguousMultilineTokensBuilder", "vs/editor/common/tokens/lineTokens", "vs/editor/test/common/core/testLineToken", "vs/editor/test/common/testTextModel"], function (require, exports, assert, utils_1, range_1, languages_1, utils_2, contiguousMultilineTokensBuilder_1, lineTokens_1, testLineToken_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function assertLineTokens(__actual, _expected) {
        const tmp = TestToken.toTokens(_expected);
        lineTokens_1.LineTokens.convertToEndOffset(tmp, __actual.getLineContent().length);
        const expected = testLineToken_1.TestLineTokenFactory.inflateArr(tmp);
        const _actual = __actual.inflate();
        const actual = [];
        for (let i = 0, len = _actual.getCount(); i < len; i++) {
            actual[i] = {
                endIndex: _actual.getEndOffset(i),
                type: _actual.getClassName(i)
            };
        }
        const decode = (token) => {
            return {
                endIndex: token.endIndex,
                type: token.getType()
            };
        };
        assert.deepStrictEqual(actual, expected.map(decode));
    }
    suite('ModelLine - getIndentLevel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertIndentLevel(text, expected, tabSize = 4) {
            const actual = (0, utils_2.computeIndentLevel)(text, tabSize);
            assert.strictEqual(actual, expected, text);
        }
        test('getIndentLevel', () => {
            assertIndentLevel('', -1);
            assertIndentLevel(' ', -1);
            assertIndentLevel('   \t', -1);
            assertIndentLevel('Hello', 0);
            assertIndentLevel(' Hello', 1);
            assertIndentLevel('   Hello', 3);
            assertIndentLevel('\tHello', 4);
            assertIndentLevel(' \tHello', 4);
            assertIndentLevel('  \tHello', 4);
            assertIndentLevel('   \tHello', 4);
            assertIndentLevel('    \tHello', 8);
            assertIndentLevel('     \tHello', 8);
            assertIndentLevel('\t Hello', 5);
            assertIndentLevel('\t \tHello', 8);
        });
    });
    class TestToken {
        constructor(startOffset, color) {
            this.startOffset = startOffset;
            this.color = color;
        }
        static toTokens(tokens) {
            if (tokens === null) {
                return null;
            }
            const tokensLen = tokens.length;
            const result = new Uint32Array((tokensLen << 1));
            for (let i = 0; i < tokensLen; i++) {
                const token = tokens[i];
                result[(i << 1)] = token.startOffset;
                result[(i << 1) + 1] = (token.color << 15 /* MetadataConsts.FOREGROUND_OFFSET */) >>> 0;
            }
            return result;
        }
    }
    class ManualTokenizationSupport {
        constructor() {
            this.tokens = new Map();
            this.stores = new Set();
        }
        setLineTokens(lineNumber, tokens) {
            const b = new contiguousMultilineTokensBuilder_1.ContiguousMultilineTokensBuilder();
            b.add(lineNumber, tokens);
            for (const s of this.stores) {
                s.setTokens(b.finalize());
            }
        }
        getInitialState() {
            return new LineState(1);
        }
        tokenize(line, hasEOL, state) {
            throw new Error();
        }
        tokenizeEncoded(line, hasEOL, state) {
            const s = state;
            return new languages_1.EncodedTokenizationResult(this.tokens.get(s.lineNumber), new LineState(s.lineNumber + 1));
        }
        /**
         * Can be/return undefined if default background tokenization should be used.
         */
        createBackgroundTokenizer(textModel, store) {
            this.stores.add(store);
            return {
                dispose: () => {
                    this.stores.delete(store);
                },
                requestTokens(startLineNumber, endLineNumberExclusive) {
                },
            };
        }
    }
    class LineState {
        constructor(lineNumber) {
            this.lineNumber = lineNumber;
        }
        clone() {
            return this;
        }
        equals(other) {
            return other.lineNumber === this.lineNumber;
        }
    }
    suite('ModelLinesTokens', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testApplyEdits(initial, edits, expected) {
            const initialText = initial.map(el => el.text).join('\n');
            const s = new ManualTokenizationSupport();
            const d = languages_1.TokenizationRegistry.register('test', s);
            const model = (0, testTextModel_1.createTextModel)(initialText, 'test');
            model.onBeforeAttached();
            for (let lineIndex = 0; lineIndex < initial.length; lineIndex++) {
                const lineTokens = initial[lineIndex].tokens;
                const lineTextLength = model.getLineMaxColumn(lineIndex + 1) - 1;
                const tokens = TestToken.toTokens(lineTokens);
                lineTokens_1.LineTokens.convertToEndOffset(tokens, lineTextLength);
                s.setLineTokens(lineIndex + 1, tokens);
            }
            model.applyEdits(edits.map((ed) => ({
                identifier: null,
                range: ed.range,
                text: ed.text,
                forceMoveMarkers: false
            })));
            for (let lineIndex = 0; lineIndex < expected.length; lineIndex++) {
                const actualLine = model.getLineContent(lineIndex + 1);
                const actualTokens = model.tokenization.getLineTokens(lineIndex + 1);
                assert.strictEqual(actualLine, expected[lineIndex].text);
                assertLineTokens(actualTokens, expected[lineIndex].tokens);
            }
            model.dispose();
            d.dispose();
        }
        test('single delete 1', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 1, 1, 2), text: '' }], [{
                    text: 'ello world',
                    tokens: [new TestToken(0, 1), new TestToken(4, 2), new TestToken(5, 3)]
                }]);
        });
        test('single delete 2', () => {
            testApplyEdits([{
                    text: 'helloworld',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2)]
                }], [{ range: new range_1.Range(1, 3, 1, 8), text: '' }], [{
                    text: 'herld',
                    tokens: [new TestToken(0, 1), new TestToken(2, 2)]
                }]);
        });
        test('single delete 3', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 1, 1, 6), text: '' }], [{
                    text: ' world',
                    tokens: [new TestToken(0, 2), new TestToken(1, 3)]
                }]);
        });
        test('single delete 4', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 2, 1, 7), text: '' }], [{
                    text: 'hworld',
                    tokens: [new TestToken(0, 1), new TestToken(1, 3)]
                }]);
        });
        test('single delete 5', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 1, 1, 12), text: '' }], [{
                    text: '',
                    tokens: [new TestToken(0, 1)]
                }]);
        });
        test('multi delete 6', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 4), new TestToken(5, 5), new TestToken(6, 6)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 7), new TestToken(5, 8), new TestToken(6, 9)]
                }], [{ range: new range_1.Range(1, 6, 3, 6), text: '' }], [{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 8), new TestToken(6, 9)]
                }]);
        });
        test('multi delete 7', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 4), new TestToken(5, 5), new TestToken(6, 6)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 7), new TestToken(5, 8), new TestToken(6, 9)]
                }], [{ range: new range_1.Range(1, 12, 3, 12), text: '' }], [{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }]);
        });
        test('multi delete 8', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 4), new TestToken(5, 5), new TestToken(6, 6)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 7), new TestToken(5, 8), new TestToken(6, 9)]
                }], [{ range: new range_1.Range(1, 1, 3, 1), text: '' }], [{
                    text: 'hello world',
                    tokens: [new TestToken(0, 7), new TestToken(5, 8), new TestToken(6, 9)]
                }]);
        });
        test('multi delete 9', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 4), new TestToken(5, 5), new TestToken(6, 6)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 7), new TestToken(5, 8), new TestToken(6, 9)]
                }], [{ range: new range_1.Range(1, 12, 3, 1), text: '' }], [{
                    text: 'hello worldhello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3), new TestToken(11, 7), new TestToken(16, 8), new TestToken(17, 9)]
                }]);
        });
        test('single insert 1', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 1, 1, 1), text: 'xx' }], [{
                    text: 'xxhello world',
                    tokens: [new TestToken(0, 1), new TestToken(7, 2), new TestToken(8, 3)]
                }]);
        });
        test('single insert 2', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 2, 1, 2), text: 'xx' }], [{
                    text: 'hxxello world',
                    tokens: [new TestToken(0, 1), new TestToken(7, 2), new TestToken(8, 3)]
                }]);
        });
        test('single insert 3', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 6, 1, 6), text: 'xx' }], [{
                    text: 'helloxx world',
                    tokens: [new TestToken(0, 1), new TestToken(7, 2), new TestToken(8, 3)]
                }]);
        });
        test('single insert 4', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 7, 1, 7), text: 'xx' }], [{
                    text: 'hello xxworld',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(8, 3)]
                }]);
        });
        test('single insert 5', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 12, 1, 12), text: 'xx' }], [{
                    text: 'hello worldxx',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }]);
        });
        test('multi insert 6', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 1, 1, 1), text: '\n' }], [{
                    text: '',
                    tokens: [new TestToken(0, 1)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 1)]
                }]);
        });
        test('multi insert 7', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 12, 1, 12), text: '\n' }], [{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }, {
                    text: '',
                    tokens: [new TestToken(0, 1)]
                }]);
        });
        test('multi insert 8', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }], [{ range: new range_1.Range(1, 7, 1, 7), text: '\n' }], [{
                    text: 'hello ',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2)]
                }, {
                    text: 'world',
                    tokens: [new TestToken(0, 1)]
                }]);
        });
        test('multi insert 9', () => {
            testApplyEdits([{
                    text: 'hello world',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2), new TestToken(6, 3)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 4), new TestToken(5, 5), new TestToken(6, 6)]
                }], [{ range: new range_1.Range(1, 7, 1, 7), text: 'xx\nyy' }], [{
                    text: 'hello xx',
                    tokens: [new TestToken(0, 1), new TestToken(5, 2)]
                }, {
                    text: 'yyworld',
                    tokens: [new TestToken(0, 1)]
                }, {
                    text: 'hello world',
                    tokens: [new TestToken(0, 4), new TestToken(5, 5), new TestToken(6, 6)]
                }]);
        });
        function testLineEditTokens(initialText, initialTokens, edits, expectedText, expectedTokens) {
            testApplyEdits([{
                    text: initialText,
                    tokens: initialTokens
                }], edits.map((ed) => ({
                range: new range_1.Range(1, ed.startColumn, 1, ed.endColumn),
                text: ed.text
            })), [{
                    text: expectedText,
                    tokens: expectedTokens
                }]);
        }
        test('insertion on empty line', () => {
            const s = new ManualTokenizationSupport();
            const d = languages_1.TokenizationRegistry.register('test', s);
            const model = (0, testTextModel_1.createTextModel)('some text', 'test');
            const tokens = TestToken.toTokens([new TestToken(0, 1)]);
            lineTokens_1.LineTokens.convertToEndOffset(tokens, model.getLineMaxColumn(1) - 1);
            s.setLineTokens(1, tokens);
            model.applyEdits([{
                    range: new range_1.Range(1, 1, 1, 10),
                    text: ''
                }]);
            s.setLineTokens(1, new Uint32Array(0));
            model.applyEdits([{
                    range: new range_1.Range(1, 1, 1, 1),
                    text: 'a'
                }]);
            const actualTokens = model.tokenization.getLineTokens(1);
            assertLineTokens(actualTokens, [new TestToken(0, 1)]);
            model.dispose();
            d.dispose();
        });
        test('updates tokens on insertion 1', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 1,
                    text: 'a',
                }], 'aabcd efgh', [
                new TestToken(0, 1),
                new TestToken(5, 2),
                new TestToken(6, 3)
            ]);
        });
        test('updates tokens on insertion 2', () => {
            testLineEditTokens('aabcd efgh', [
                new TestToken(0, 1),
                new TestToken(5, 2),
                new TestToken(6, 3)
            ], [{
                    startColumn: 2,
                    endColumn: 2,
                    text: 'x',
                }], 'axabcd efgh', [
                new TestToken(0, 1),
                new TestToken(6, 2),
                new TestToken(7, 3)
            ]);
        });
        test('updates tokens on insertion 3', () => {
            testLineEditTokens('axabcd efgh', [
                new TestToken(0, 1),
                new TestToken(6, 2),
                new TestToken(7, 3)
            ], [{
                    startColumn: 3,
                    endColumn: 3,
                    text: 'stu',
                }], 'axstuabcd efgh', [
                new TestToken(0, 1),
                new TestToken(9, 2),
                new TestToken(10, 3)
            ]);
        });
        test('updates tokens on insertion 4', () => {
            testLineEditTokens('axstuabcd efgh', [
                new TestToken(0, 1),
                new TestToken(9, 2),
                new TestToken(10, 3)
            ], [{
                    startColumn: 10,
                    endColumn: 10,
                    text: '\t',
                }], 'axstuabcd\t efgh', [
                new TestToken(0, 1),
                new TestToken(10, 2),
                new TestToken(11, 3)
            ]);
        });
        test('updates tokens on insertion 5', () => {
            testLineEditTokens('axstuabcd\t efgh', [
                new TestToken(0, 1),
                new TestToken(10, 2),
                new TestToken(11, 3)
            ], [{
                    startColumn: 12,
                    endColumn: 12,
                    text: 'dd',
                }], 'axstuabcd\t ddefgh', [
                new TestToken(0, 1),
                new TestToken(10, 2),
                new TestToken(13, 3)
            ]);
        });
        test('updates tokens on insertion 6', () => {
            testLineEditTokens('axstuabcd\t ddefgh', [
                new TestToken(0, 1),
                new TestToken(10, 2),
                new TestToken(13, 3)
            ], [{
                    startColumn: 18,
                    endColumn: 18,
                    text: 'xyz',
                }], 'axstuabcd\t ddefghxyz', [
                new TestToken(0, 1),
                new TestToken(10, 2),
                new TestToken(13, 3)
            ]);
        });
        test('updates tokens on insertion 7', () => {
            testLineEditTokens('axstuabcd\t ddefghxyz', [
                new TestToken(0, 1),
                new TestToken(10, 2),
                new TestToken(13, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 1,
                    text: 'x',
                }], 'xaxstuabcd\t ddefghxyz', [
                new TestToken(0, 1),
                new TestToken(11, 2),
                new TestToken(14, 3)
            ]);
        });
        test('updates tokens on insertion 8', () => {
            testLineEditTokens('xaxstuabcd\t ddefghxyz', [
                new TestToken(0, 1),
                new TestToken(11, 2),
                new TestToken(14, 3)
            ], [{
                    startColumn: 22,
                    endColumn: 22,
                    text: 'x',
                }], 'xaxstuabcd\t ddefghxyzx', [
                new TestToken(0, 1),
                new TestToken(11, 2),
                new TestToken(14, 3)
            ]);
        });
        test('updates tokens on insertion 9', () => {
            testLineEditTokens('xaxstuabcd\t ddefghxyzx', [
                new TestToken(0, 1),
                new TestToken(11, 2),
                new TestToken(14, 3)
            ], [{
                    startColumn: 2,
                    endColumn: 2,
                    text: '',
                }], 'xaxstuabcd\t ddefghxyzx', [
                new TestToken(0, 1),
                new TestToken(11, 2),
                new TestToken(14, 3)
            ]);
        });
        test('updates tokens on insertion 10', () => {
            testLineEditTokens('', [], [{
                    startColumn: 1,
                    endColumn: 1,
                    text: 'a',
                }], 'a', [
                new TestToken(0, 1)
            ]);
        });
        test('delete second token 2', () => {
            testLineEditTokens('abcdefghij', [
                new TestToken(0, 1),
                new TestToken(3, 2),
                new TestToken(6, 3)
            ], [{
                    startColumn: 4,
                    endColumn: 7,
                    text: '',
                }], 'abcghij', [
                new TestToken(0, 1),
                new TestToken(3, 3)
            ]);
        });
        test('insert right before second token', () => {
            testLineEditTokens('abcdefghij', [
                new TestToken(0, 1),
                new TestToken(3, 2),
                new TestToken(6, 3)
            ], [{
                    startColumn: 4,
                    endColumn: 4,
                    text: 'hello',
                }], 'abchellodefghij', [
                new TestToken(0, 1),
                new TestToken(8, 2),
                new TestToken(11, 3)
            ]);
        });
        test('delete first char', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 2,
                    text: '',
                }], 'bcd efgh', [
                new TestToken(0, 1),
                new TestToken(3, 2),
                new TestToken(4, 3)
            ]);
        });
        test('delete 2nd and 3rd chars', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 2,
                    endColumn: 4,
                    text: '',
                }], 'ad efgh', [
                new TestToken(0, 1),
                new TestToken(2, 2),
                new TestToken(3, 3)
            ]);
        });
        test('delete first token', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 5,
                    text: '',
                }], ' efgh', [
                new TestToken(0, 2),
                new TestToken(1, 3)
            ]);
        });
        test('delete second token', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 5,
                    endColumn: 6,
                    text: '',
                }], 'abcdefgh', [
                new TestToken(0, 1),
                new TestToken(4, 3)
            ]);
        });
        test('delete second token + a bit of the third one', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 5,
                    endColumn: 7,
                    text: '',
                }], 'abcdfgh', [
                new TestToken(0, 1),
                new TestToken(4, 3)
            ]);
        });
        test('delete second and third token', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 5,
                    endColumn: 10,
                    text: '',
                }], 'abcd', [
                new TestToken(0, 1)
            ]);
        });
        test('delete everything', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 10,
                    text: '',
                }], '', [
                new TestToken(0, 1)
            ]);
        });
        test('noop', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 1,
                    text: '',
                }], 'abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ]);
        });
        test('equivalent to deleting first two chars', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 1,
                    endColumn: 3,
                    text: '',
                }], 'cd efgh', [
                new TestToken(0, 1),
                new TestToken(2, 2),
                new TestToken(3, 3)
            ]);
        });
        test('equivalent to deleting from 5 to the end', () => {
            testLineEditTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], [{
                    startColumn: 5,
                    endColumn: 10,
                    text: '',
                }], 'abcd', [
                new TestToken(0, 1)
            ]);
        });
        test('updates tokens on replace 1', () => {
            testLineEditTokens('Hello world, ciao', [
                new TestToken(0, 1),
                new TestToken(5, 0),
                new TestToken(6, 2),
                new TestToken(11, 0),
                new TestToken(13, 0)
            ], [{
                    startColumn: 1,
                    endColumn: 6,
                    text: 'Hi',
                }], 'Hi world, ciao', [
                new TestToken(0, 0),
                new TestToken(3, 2),
                new TestToken(8, 0),
                new TestToken(10, 0),
            ]);
        });
        test('updates tokens on replace 2', () => {
            testLineEditTokens('Hello world, ciao', [
                new TestToken(0, 1),
                new TestToken(5, 0),
                new TestToken(6, 2),
                new TestToken(11, 0),
                new TestToken(13, 0),
            ], [{
                    startColumn: 1,
                    endColumn: 6,
                    text: 'Hi',
                }, {
                    startColumn: 8,
                    endColumn: 12,
                    text: 'my friends',
                }], 'Hi wmy friends, ciao', [
                new TestToken(0, 0),
                new TestToken(3, 2),
                new TestToken(14, 0),
                new TestToken(16, 0),
            ]);
        });
        function testLineSplitTokens(initialText, initialTokens, splitColumn, expectedText1, expectedText2, expectedTokens) {
            testApplyEdits([{
                    text: initialText,
                    tokens: initialTokens
                }], [{
                    range: new range_1.Range(1, splitColumn, 1, splitColumn),
                    text: '\n'
                }], [{
                    text: expectedText1,
                    tokens: expectedTokens
                }, {
                    text: expectedText2,
                    tokens: [new TestToken(0, 1)]
                }]);
        }
        test('split at the beginning', () => {
            testLineSplitTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], 1, '', 'abcd efgh', [
                new TestToken(0, 1),
            ]);
        });
        test('split at the end', () => {
            testLineSplitTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], 10, 'abcd efgh', '', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ]);
        });
        test('split inthe middle 1', () => {
            testLineSplitTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], 5, 'abcd', ' efgh', [
                new TestToken(0, 1)
            ]);
        });
        test('split inthe middle 2', () => {
            testLineSplitTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], 6, 'abcd ', 'efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2)
            ]);
        });
        function testLineAppendTokens(aText, aTokens, bText, bTokens, expectedText, expectedTokens) {
            testApplyEdits([{
                    text: aText,
                    tokens: aTokens
                }, {
                    text: bText,
                    tokens: bTokens
                }], [{
                    range: new range_1.Range(1, aText.length + 1, 2, 1),
                    text: ''
                }], [{
                    text: expectedText,
                    tokens: expectedTokens
                }]);
        }
        test('append empty 1', () => {
            testLineAppendTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], '', [], 'abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ]);
        });
        test('append empty 2', () => {
            testLineAppendTokens('', [], 'abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], 'abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ]);
        });
        test('append 1', () => {
            testLineAppendTokens('abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ], 'abcd efgh', [
                new TestToken(0, 4),
                new TestToken(4, 5),
                new TestToken(5, 6)
            ], 'abcd efghabcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3),
                new TestToken(9, 4),
                new TestToken(13, 5),
                new TestToken(14, 6)
            ]);
        });
        test('append 2', () => {
            testLineAppendTokens('abcd ', [
                new TestToken(0, 1),
                new TestToken(4, 2)
            ], 'efgh', [
                new TestToken(0, 3)
            ], 'abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ]);
        });
        test('append 3', () => {
            testLineAppendTokens('abcd', [
                new TestToken(0, 1),
            ], ' efgh', [
                new TestToken(0, 2),
                new TestToken(1, 3)
            ], 'abcd efgh', [
                new TestToken(0, 1),
                new TestToken(4, 2),
                new TestToken(5, 3)
            ]);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZWwubGluZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvbW9kZWwubGluZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBb0JoRyxTQUFTLGdCQUFnQixDQUFDLFFBQW9CLEVBQUUsU0FBc0I7UUFDckUsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQyx1QkFBVSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsY0FBYyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDckUsTUFBTSxRQUFRLEdBQUcsb0NBQW9CLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUtuQyxNQUFNLE1BQU0sR0FBaUIsRUFBRSxDQUFDO1FBQ2hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRztnQkFDWCxRQUFRLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLElBQUksRUFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQzthQUM3QixDQUFDO1FBQ0gsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO1lBQ3ZDLE9BQU87Z0JBQ04sUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO2dCQUN4QixJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFB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