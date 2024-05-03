/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/test/common/core/testLineToken", "vs/editor/test/common/testTextModel", "vs/base/test/common/utils"], function (require, exports, assert, lifecycle_1, position_1, range_1, languages_1, languageConfigurationRegistry_1, nullTokenize_1, language_1, testLineToken_1, testTextModel_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createTextModelWithBrackets(disposables, text, brackets) {
        const languageId = 'bracketMode2';
        const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
        const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
        const languageService = instantiationService.get(language_1.ILanguageService);
        disposables.add(languageService.registerLanguage({ id: languageId }));
        disposables.add(languageConfigurationService.register(languageId, { brackets }));
        return disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
    }
    suite('TextModelWithTokens', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testBrackets(contents, brackets) {
            const languageId = 'testMode';
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: brackets
            }));
            function toRelaxedFoundBracket(a) {
                if (!a) {
                    return null;
                }
                return {
                    range: a.range.toString(),
                    info: a.bracketInfo,
                };
            }
            const charIsBracket = {};
            const charIsOpenBracket = {};
            const openForChar = {};
            const closeForChar = {};
            brackets.forEach((b) => {
                charIsBracket[b[0]] = true;
                charIsBracket[b[1]] = true;
                charIsOpenBracket[b[0]] = true;
                charIsOpenBracket[b[1]] = false;
                openForChar[b[0]] = b[0];
                closeForChar[b[0]] = b[1];
                openForChar[b[1]] = b[0];
                closeForChar[b[1]] = b[1];
            });
            const expectedBrackets = [];
            for (let lineIndex = 0; lineIndex < contents.length; lineIndex++) {
                const lineText = contents[lineIndex];
                for (let charIndex = 0; charIndex < lineText.length; charIndex++) {
                    const ch = lineText.charAt(charIndex);
                    if (charIsBracket[ch]) {
                        expectedBrackets.push({
                            bracketInfo: languageConfigurationService.getLanguageConfiguration(languageId).bracketsNew.getBracketInfo(ch),
                            range: new range_1.Range(lineIndex + 1, charIndex + 1, lineIndex + 1, charIndex + 2)
                        });
                    }
                }
            }
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, contents.join('\n'), languageId));
            // findPrevBracket
            {
                let expectedBracketIndex = expectedBrackets.length - 1;
                let currentExpectedBracket = expectedBracketIndex >= 0 ? expectedBrackets[expectedBracketIndex] : null;
                for (let lineNumber = contents.length; lineNumber >= 1; lineNumber--) {
                    const lineText = contents[lineNumber - 1];
                    for (let column = lineText.length + 1; column >= 1; column--) {
                        if (currentExpectedBracket) {
                            if (lineNumber === currentExpectedBracket.range.startLineNumber && column < currentExpectedBracket.range.endColumn) {
                                expectedBracketIndex--;
                                currentExpectedBracket = expectedBracketIndex >= 0 ? expectedBrackets[expectedBracketIndex] : null;
                            }
                        }
                        const actual = model.bracketPairs.findPrevBracket({
                            lineNumber: lineNumber,
                            column: column
                        });
                        assert.deepStrictEqual(toRelaxedFoundBracket(actual), toRelaxedFoundBracket(currentExpectedBracket), 'findPrevBracket of ' + lineNumber + ', ' + column);
                    }
                }
            }
            // findNextBracket
            {
                let expectedBracketIndex = 0;
                let currentExpectedBracket = expectedBracketIndex < expectedBrackets.length ? expectedBrackets[expectedBracketIndex] : null;
                for (let lineNumber = 1; lineNumber <= contents.length; lineNumber++) {
                    const lineText = contents[lineNumber - 1];
                    for (let column = 1; column <= lineText.length + 1; column++) {
                        if (currentExpectedBracket) {
                            if (lineNumber === currentExpectedBracket.range.startLineNumber && column > currentExpectedBracket.range.startColumn) {
                                expectedBracketIndex++;
                                currentExpectedBracket = expectedBracketIndex < expectedBrackets.length ? expectedBrackets[expectedBracketIndex] : null;
                            }
                        }
                        const actual = model.bracketPairs.findNextBracket({
                            lineNumber: lineNumber,
                            column: column
                        });
                        assert.deepStrictEqual(toRelaxedFoundBracket(actual), toRelaxedFoundBracket(currentExpectedBracket), 'findNextBracket of ' + lineNumber + ', ' + column);
                    }
                }
            }
            disposables.dispose();
        }
        test('brackets1', () => {
            testBrackets([
                'if (a == 3) { return (7 * (a + 5)); }'
            ], [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ]);
        });
    });
    function assertIsNotBracket(model, lineNumber, column) {
        const match = model.bracketPairs.matchBracket(new position_1.Position(lineNumber, column));
        assert.strictEqual(match, null, 'is not matching brackets at ' + lineNumber + ', ' + column);
    }
    function assertIsBracket(model, testPosition, expected) {
        expected.sort(range_1.Range.compareRangesUsingStarts);
        const actual = model.bracketPairs.matchBracket(testPosition);
        actual?.sort(range_1.Range.compareRangesUsingStarts);
        assert.deepStrictEqual(actual, expected, 'matches brackets at ' + testPosition);
    }
    suite('TextModelWithTokens - bracket matching', () => {
        const languageId = 'bracketMode1';
        let disposables;
        let instantiationService;
        let languageConfigurationService;
        let languageService;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            disposables.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
        });
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('bracket matching 1', () => {
            const text = ')]}{[(' + '\n' +
                ')]}{[(';
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
            assertIsNotBracket(model, 1, 1);
            assertIsNotBracket(model, 1, 2);
            assertIsNotBracket(model, 1, 3);
            assertIsBracket(model, new position_1.Position(1, 4), [new range_1.Range(1, 4, 1, 5), new range_1.Range(2, 3, 2, 4)]);
            assertIsBracket(model, new position_1.Position(1, 5), [new range_1.Range(1, 5, 1, 6), new range_1.Range(2, 2, 2, 3)]);
            assertIsBracket(model, new position_1.Position(1, 6), [new range_1.Range(1, 6, 1, 7), new range_1.Range(2, 1, 2, 2)]);
            assertIsBracket(model, new position_1.Position(1, 7), [new range_1.Range(1, 6, 1, 7), new range_1.Range(2, 1, 2, 2)]);
            assertIsBracket(model, new position_1.Position(2, 1), [new range_1.Range(2, 1, 2, 2), new range_1.Range(1, 6, 1, 7)]);
            assertIsBracket(model, new position_1.Position(2, 2), [new range_1.Range(2, 2, 2, 3), new range_1.Range(1, 5, 1, 6)]);
            assertIsBracket(model, new position_1.Position(2, 3), [new range_1.Range(2, 3, 2, 4), new range_1.Range(1, 4, 1, 5)]);
            assertIsBracket(model, new position_1.Position(2, 4), [new range_1.Range(2, 3, 2, 4), new range_1.Range(1, 4, 1, 5)]);
            assertIsNotBracket(model, 2, 5);
            assertIsNotBracket(model, 2, 6);
            assertIsNotBracket(model, 2, 7);
        });
        test('bracket matching 2', () => {
            const text = 'var bar = {' + '\n' +
                'foo: {' + '\n' +
                '}, bar: {hallo: [{' + '\n' +
                '}, {' + '\n' +
                '}]}}';
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
            const brackets = [
                [new position_1.Position(1, 11), new range_1.Range(1, 11, 1, 12), new range_1.Range(5, 4, 5, 5)],
                [new position_1.Position(1, 12), new range_1.Range(1, 11, 1, 12), new range_1.Range(5, 4, 5, 5)],
                [new position_1.Position(2, 6), new range_1.Range(2, 6, 2, 7), new range_1.Range(3, 1, 3, 2)],
                [new position_1.Position(2, 7), new range_1.Range(2, 6, 2, 7), new range_1.Range(3, 1, 3, 2)],
                [new position_1.Position(3, 1), new range_1.Range(3, 1, 3, 2), new range_1.Range(2, 6, 2, 7)],
                [new position_1.Position(3, 2), new range_1.Range(3, 1, 3, 2), new range_1.Range(2, 6, 2, 7)],
                [new position_1.Position(3, 9), new range_1.Range(3, 9, 3, 10), new range_1.Range(5, 3, 5, 4)],
                [new position_1.Position(3, 10), new range_1.Range(3, 9, 3, 10), new range_1.Range(5, 3, 5, 4)],
                [new position_1.Position(3, 17), new range_1.Range(3, 17, 3, 18), new range_1.Range(5, 2, 5, 3)],
                [new position_1.Position(3, 18), new range_1.Range(3, 18, 3, 19), new range_1.Range(4, 1, 4, 2)],
                [new position_1.Position(3, 19), new range_1.Range(3, 18, 3, 19), new range_1.Range(4, 1, 4, 2)],
                [new position_1.Position(4, 1), new range_1.Range(4, 1, 4, 2), new range_1.Range(3, 18, 3, 19)],
                [new position_1.Position(4, 2), new range_1.Range(4, 1, 4, 2), new range_1.Range(3, 18, 3, 19)],
                [new position_1.Position(4, 4), new range_1.Range(4, 4, 4, 5), new range_1.Range(5, 1, 5, 2)],
                [new position_1.Position(4, 5), new range_1.Range(4, 4, 4, 5), new range_1.Range(5, 1, 5, 2)],
                [new position_1.Position(5, 1), new range_1.Range(5, 1, 5, 2), new range_1.Range(4, 4, 4, 5)],
                [new position_1.Position(5, 2), new range_1.Range(5, 2, 5, 3), new range_1.Range(3, 17, 3, 18)],
                [new position_1.Position(5, 3), new range_1.Range(5, 3, 5, 4), new range_1.Range(3, 9, 3, 10)],
                [new position_1.Position(5, 4), new range_1.Range(5, 4, 5, 5), new range_1.Range(1, 11, 1, 12)],
                [new position_1.Position(5, 5), new range_1.Range(5, 4, 5, 5), new range_1.Range(1, 11, 1, 12)],
            ];
            const isABracket = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
            for (let i = 0, len = brackets.length; i < len; i++) {
                const [testPos, b1, b2] = brackets[i];
                assertIsBracket(model, testPos, [b1, b2]);
                isABracket[testPos.lineNumber][testPos.column] = true;
            }
            for (let i = 1, len = model.getLineCount(); i <= len; i++) {
                const line = model.getLineContent(i);
                for (let j = 1, lenJ = line.length + 1; j <= lenJ; j++) {
                    if (!isABracket[i].hasOwnProperty(j)) {
                        assertIsNotBracket(model, i, j);
                    }
                }
            }
        });
    });
    suite('TextModelWithTokens 2', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('bracket matching 3', () => {
            const text = [
                'begin',
                '    loop',
                '        if then',
                '        end if;',
                '    end loop;',
                'end;',
                '',
                'begin',
                '    loop',
                '        if then',
                '        end ifa;',
                '    end loop;',
                'end;',
            ].join('\n');
            const disposables = new lifecycle_1.DisposableStore();
            const model = createTextModelWithBrackets(disposables, text, [
                ['if', 'end if'],
                ['loop', 'end loop'],
                ['begin', 'end']
            ]);
            // <if> ... <end ifa> is not matched
            assertIsNotBracket(model, 10, 9);
            // <if> ... <end if> is matched
            assertIsBracket(model, new position_1.Position(3, 9), [new range_1.Range(3, 9, 3, 11), new range_1.Range(4, 9, 4, 15)]);
            assertIsBracket(model, new position_1.Position(4, 9), [new range_1.Range(4, 9, 4, 15), new range_1.Range(3, 9, 3, 11)]);
            // <loop> ... <end loop> is matched
            assertIsBracket(model, new position_1.Position(2, 5), [new range_1.Range(2, 5, 2, 9), new range_1.Range(5, 5, 5, 13)]);
            assertIsBracket(model, new position_1.Position(5, 5), [new range_1.Range(5, 5, 5, 13), new range_1.Range(2, 5, 2, 9)]);
            // <begin> ... <end> is matched
            assertIsBracket(model, new position_1.Position(1, 1), [new range_1.Range(1, 1, 1, 6), new range_1.Range(6, 1, 6, 4)]);
            assertIsBracket(model, new position_1.Position(6, 1), [new range_1.Range(6, 1, 6, 4), new range_1.Range(1, 1, 1, 6)]);
            disposables.dispose();
        });
        test('bracket matching 4', () => {
            const text = [
                'recordbegin',
                '  simplerecordbegin',
                '  endrecord',
                'endrecord',
            ].join('\n');
            const disposables = new lifecycle_1.DisposableStore();
            const model = createTextModelWithBrackets(disposables, text, [
                ['recordbegin', 'endrecord'],
                ['simplerecordbegin', 'endrecord'],
            ]);
            // <recordbegin> ... <endrecord> is matched
            assertIsBracket(model, new position_1.Position(1, 1), [new range_1.Range(1, 1, 1, 12), new range_1.Range(4, 1, 4, 10)]);
            assertIsBracket(model, new position_1.Position(4, 1), [new range_1.Range(4, 1, 4, 10), new range_1.Range(1, 1, 1, 12)]);
            // <simplerecordbegin> ... <endrecord> is matched
            assertIsBracket(model, new position_1.Position(2, 3), [new range_1.Range(2, 3, 2, 20), new range_1.Range(3, 3, 3, 12)]);
            assertIsBracket(model, new position_1.Position(3, 3), [new range_1.Range(3, 3, 3, 12), new range_1.Range(2, 3, 2, 20)]);
            disposables.dispose();
        });
        test('issue #95843: Highlighting of closing braces is indicating wrong brace when cursor is behind opening brace', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            const mode1 = 'testMode1';
            const mode2 = 'testMode2';
            const languageIdCodec = languageService.languageIdCodec;
            disposables.add(languageService.registerLanguage({ id: mode1 }));
            disposables.add(languageService.registerLanguage({ id: mode2 }));
            const encodedMode1 = languageIdCodec.encodeLanguageId(mode1);
            const encodedMode2 = languageIdCodec.encodeLanguageId(mode2);
            const otherMetadata1 = ((encodedMode1 << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
                | (1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */)) >>> 0;
            const otherMetadata2 = ((encodedMode2 << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
                | (1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */)) >>> 0;
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    switch (line) {
                        case 'function f() {': {
                            const tokens = new Uint32Array([
                                0, otherMetadata1,
                                8, otherMetadata1,
                                9, otherMetadata1,
                                10, otherMetadata1,
                                11, otherMetadata1,
                                12, otherMetadata1,
                                13, otherMetadata1,
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                        case '  return <p>{true}</p>;': {
                            const tokens = new Uint32Array([
                                0, otherMetadata1,
                                2, otherMetadata1,
                                8, otherMetadata1,
                                9, otherMetadata2,
                                10, otherMetadata2,
                                11, otherMetadata2,
                                12, otherMetadata2,
                                13, otherMetadata1,
                                17, otherMetadata2,
                                18, otherMetadata2,
                                20, otherMetadata2,
                                21, otherMetadata2,
                                22, otherMetadata2,
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                        case '}': {
                            const tokens = new Uint32Array([
                                0, otherMetadata1
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                    }
                    throw new Error(`Unexpected`);
                }
            };
            disposables.add(languages_1.TokenizationRegistry.register(mode1, tokenizationSupport));
            disposables.add(languageConfigurationService.register(mode1, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
            }));
            disposables.add(languageConfigurationService.register(mode2, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
            }));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, [
                'function f() {',
                '  return <p>{true}</p>;',
                '}',
            ].join('\n'), mode1));
            model.tokenization.forceTokenization(1);
            model.tokenization.forceTokenization(2);
            model.tokenization.forceTokenization(3);
            assert.deepStrictEqual(model.bracketPairs.matchBracket(new position_1.Position(2, 14)), [new range_1.Range(2, 13, 2, 14), new range_1.Range(2, 18, 2, 19)]);
            disposables.dispose();
        });
        test('issue #88075: TypeScript brace matching is incorrect in `${}` strings', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const mode = 'testMode';
            const languageIdCodec = instantiationService.get(language_1.ILanguageService).languageIdCodec;
            const encodedMode = languageIdCodec.encodeLanguageId(mode);
            const otherMetadata = ((encodedMode << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)) >>> 0;
            const stringMetadata = ((encodedMode << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
                | (2 /* StandardTokenType.String */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)) >>> 0;
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    switch (line) {
                        case 'function hello() {': {
                            const tokens = new Uint32Array([
                                0, otherMetadata
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                        case '    console.log(`${100}`);': {
                            const tokens = new Uint32Array([
                                0, otherMetadata,
                                16, stringMetadata,
                                19, otherMetadata,
                                22, stringMetadata,
                                24, otherMetadata,
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                        case '}': {
                            const tokens = new Uint32Array([
                                0, otherMetadata
                            ]);
                            return new languages_1.EncodedTokenizationResult(tokens, state);
                        }
                    }
                    throw new Error(`Unexpected`);
                }
            };
            disposables.add(languages_1.TokenizationRegistry.register(mode, tokenizationSupport));
            disposables.add(languageConfigurationService.register(mode, {
                brackets: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')']
                ],
            }));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, [
                'function hello() {',
                '    console.log(`${100}`);',
                '}'
            ].join('\n'), mode));
            model.tokenization.forceTokenization(1);
            model.tokenization.forceTokenization(2);
            model.tokenization.forceTokenization(3);
            assert.deepStrictEqual(model.bracketPairs.matchBracket(new position_1.Position(2, 23)), null);
            assert.deepStrictEqual(model.bracketPairs.matchBracket(new position_1.Position(2, 20)), null);
            disposables.dispose();
        });
    });
    suite('TextModelWithTokens regression tests', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('microsoft/monaco-editor#122: Unhandled Exception: TypeError: Unable to get property \'replace\' of undefined or null reference', () => {
            function assertViewLineTokens(model, lineNumber, forceTokenization, expected) {
                if (forceTokenization) {
                    model.tokenization.forceTokenization(lineNumber);
                }
                const _actual = model.tokenization.getLineTokens(lineNumber).inflate();
                const actual = [];
                for (let i = 0, len = _actual.getCount(); i < len; i++) {
                    actual[i] = {
                        endIndex: _actual.getEndOffset(i),
                        foreground: _actual.getForeground(i)
                    };
                }
                const decode = (token) => {
                    return {
                        endIndex: token.endIndex,
                        foreground: token.getForeground()
                    };
                };
                assert.deepStrictEqual(actual, expected.map(decode));
            }
            let _tokenId = 10;
            const LANG_ID1 = 'indicisiveMode1';
            const LANG_ID2 = 'indicisiveMode2';
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    const myId = ++_tokenId;
                    const tokens = new Uint32Array(2);
                    tokens[0] = 0;
                    tokens[1] = (myId << 15 /* MetadataConsts.FOREGROUND_OFFSET */) >>> 0;
                    return new languages_1.EncodedTokenizationResult(tokens, state);
                }
            };
            const registration1 = languages_1.TokenizationRegistry.register(LANG_ID1, tokenizationSupport);
            const registration2 = languages_1.TokenizationRegistry.register(LANG_ID2, tokenizationSupport);
            const model = (0, testTextModel_1.createTextModel)('A model with\ntwo lines');
            assertViewLineTokens(model, 1, true, [createViewLineToken(12, 1)]);
            assertViewLineTokens(model, 2, true, [createViewLineToken(9, 1)]);
            model.setLanguage(LANG_ID1);
            assertViewLineTokens(model, 1, true, [createViewLineToken(12, 11)]);
            assertViewLineTokens(model, 2, true, [createViewLineToken(9, 12)]);
            model.setLanguage(LANG_ID2);
            assertViewLineTokens(model, 1, false, [createViewLineToken(12, 1)]);
            assertViewLineTokens(model, 2, false, [createViewLineToken(9, 1)]);
            model.dispose();
            registration1.dispose();
            registration2.dispose();
            function createViewLineToken(endIndex, foreground) {
                const metadata = ((foreground << 15 /* MetadataConsts.FOREGROUND_OFFSET */)) >>> 0;
                return new testLineToken_1.TestLineToken(endIndex, metadata);
            }
        });
        test('microsoft/monaco-editor#133: Error: Cannot read property \'modeId\' of undefined', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const model = createTextModelWithBrackets(disposables, [
                'Imports System',
                'Imports System.Collections.Generic',
                '',
                'Module m1',
                '',
                '\tSub Main()',
                '\tEnd Sub',
                '',
                'End Module',
            ].join('\n'), [
                ['module', 'end module'],
                ['sub', 'end sub']
            ]);
            const actual = model.bracketPairs.matchBracket(new position_1.Position(4, 1));
            assert.deepStrictEqual(actual, [new range_1.Range(4, 1, 4, 7), new range_1.Range(9, 1, 9, 11)]);
            disposables.dispose();
        });
        test('issue #11856: Bracket matching does not work as expected if the opening brace symbol is contained in the closing brace symbol', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const model = createTextModelWithBrackets(disposables, [
                'sequence "outer"',
                '     sequence "inner"',
                '     endsequence',
                'endsequence',
            ].join('\n'), [
                ['sequence', 'endsequence'],
                ['feature', 'endfeature']
            ]);
            const actual = model.bracketPairs.matchBracket(new position_1.Position(3, 9));
            assert.deepStrictEqual(actual, [new range_1.Range(2, 6, 2, 14), new range_1.Range(3, 6, 3, 17)]);
            disposables.dispose();
        });
        test('issue #63822: Wrong embedded language detected for empty lines', () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageService = instantiationService.get(language_1.ILanguageService);
            const outerMode = 'outerMode';
            const innerMode = 'innerMode';
            disposables.add(languageService.registerLanguage({ id: outerMode }));
            disposables.add(languageService.registerLanguage({ id: innerMode }));
            const languageIdCodec = instantiationService.get(language_1.ILanguageService).languageIdCodec;
            const encodedInnerMode = languageIdCodec.encodeLanguageId(innerMode);
            const tokenizationSupport = {
                getInitialState: () => nullTokenize_1.NullState,
                tokenize: undefined,
                tokenizeEncoded: (line, hasEOL, state) => {
                    const tokens = new Uint32Array(2);
                    tokens[0] = 0;
                    tokens[1] = (encodedInnerMode << 0 /* MetadataConsts.LANGUAGEID_OFFSET */) >>> 0;
                    return new languages_1.EncodedTokenizationResult(tokens, state);
                }
            };
            disposables.add(languages_1.TokenizationRegistry.register(outerMode, tokenizationSupport));
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, 'A model with one line', outerMode));
            model.tokenization.forceTokenization(1);
            assert.strictEqual(model.getLanguageIdAtPosition(1, 1), innerMode);
            disposables.dispose();
        });
    });
    suite('TextModel.getLineIndentGuide', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertIndentGuides(lines, indentSize) {
            const languageId = 'testLang';
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposables);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposables.add(languageService.registerLanguage({ id: languageId }));
            const text = lines.map(l => l[4]).join('\n');
            const model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
            model.updateOptions({ indentSize: indentSize });
            const actualIndents = model.guides.getLinesIndentGuides(1, model.getLineCount());
            const actual = [];
            for (let line = 1; line <= model.getLineCount(); line++) {
                const activeIndentGuide = model.guides.getActiveIndentGuide(line, 1, model.getLineCount());
                actual[line - 1] = [actualIndents[line - 1], activeIndentGuide.startLineNumber, activeIndentGuide.endLineNumber, activeIndentGuide.indent, model.getLineContent(line)];
            }
            assert.deepStrictEqual(actual, lines);
            disposables.dispose();
        }
        test('getLineIndentGuide one level 2', () => {
            assertIndentGuides([
                [0, 2, 4, 1, 'A'],
                [1, 2, 4, 1, '  A'],
                [1, 2, 4, 1, '  A'],
                [1, 2, 4, 1, '  A'],
            ], 2);
        });
        test('getLineIndentGuide two levels', () => {
            assertIndentGuides([
                [0, 2, 5, 1, 'A'],
                [1, 2, 5, 1, '  A'],
                [1, 4, 5, 2, '  A'],
                [2, 4, 5, 2, '    A'],
                [2, 4, 5, 2, '    A'],
            ], 2);
        });
        test('getLineIndentGuide three levels', () => {
            assertIndentGuides([
                [0, 2, 4, 1, 'A'],
                [1, 3, 4, 2, '  A'],
                [2, 4, 4, 3, '    A'],
                [3, 4, 4, 3, '      A'],
                [0, 5, 5, 0, 'A'],
            ], 2);
        });
        test('getLineIndentGuide decreasing indent', () => {
            assertIndentGuides([
                [2, 1, 1, 2, '    A'],
                [1, 1, 1, 2, '  A'],
                [0, 1, 2, 1, 'A'],
            ], 2);
        });
        test('getLineIndentGuide Java', () => {
            assertIndentGuides([
                /* 1*/ [0, 2, 9, 1, 'class A {'],
                /* 2*/ [1, 3, 4, 2, '  void foo() {'],
                /* 3*/ [2, 3, 4, 2, '    console.log(1);'],
                /* 4*/ [2, 3, 4, 2, '    console.log(2);'],
                /* 5*/ [1, 3, 4, 2, '  }'],
                /* 6*/ [1, 2, 9, 1, ''],
                /* 7*/ [1, 8, 8, 2, '  void bar() {'],
                /* 8*/ [2, 8, 8, 2, '    console.log(3);'],
                /* 9*/ [1, 8, 8, 2, '  }'],
                /*10*/ [0, 2, 9, 1, '}'],
                /*11*/ [0, 12, 12, 1, 'interface B {'],
                /*12*/ [1, 12, 12, 1, '  void bar();'],
                /*13*/ [0, 12, 12, 1, '}'],
            ], 2);
        });
        test('getLineIndentGuide Javadoc', () => {
            assertIndentGuides([
                [0, 2, 3, 1, '/**'],
                [1, 2, 3, 1, ' * Comment'],
                [1, 2, 3, 1, ' */'],
                [0, 5, 6, 1, 'class A {'],
                [1, 5, 6, 1, '  void foo() {'],
                [1, 5, 6, 1, '  }'],
                [0, 5, 6, 1, '}'],
            ], 2);
        });
        test('getLineIndentGuide Whitespace', () => {
            assertIndentGuides([
                [0, 2, 7, 1, 'class A {'],
                [1, 2, 7, 1, ''],
                [1, 4, 5, 2, '  void foo() {'],
                [2, 4, 5, 2, '    '],
                [2, 4, 5, 2, '    return 1;'],
                [1, 4, 5, 2, '  }'],
                [1, 2, 7, 1, '      '],
                [0, 2, 7, 1, '}']
            ], 2);
        });
        test('getLineIndentGuide Tabs', () => {
            assertIndentGuides([
                [0, 2, 7, 1, 'class A {'],
                [1, 2, 7, 1, '\t\t'],
                [1, 4, 5, 2, '\tvoid foo() {'],
                [2, 4, 5, 2, '\t \t//hello'],
                [2, 4, 5, 2, '\t    return 2;'],
                [1, 4, 5, 2, '  \t}'],
                [1, 2, 7, 1, '      '],
                [0, 2, 7, 1, '}']
            ], 4);
        });
        test('getLineIndentGuide checker.ts', () => {
            assertIndentGuides([
                /* 1*/ [0, 1, 1, 0, '/// <reference path="binder.ts"/>'],
                /* 2*/ [0, 2, 2, 0, ''],
                /* 3*/ [0, 3, 3, 0, '/* @internal */'],
                /* 4*/ [0, 5, 16, 1, 'namespace ts {'],
                /* 5*/ [1, 5, 16, 1, '    let nextSymbolId = 1;'],
                /* 6*/ [1, 5, 16, 1, '    let nextNodeId = 1;'],
                /* 7*/ [1, 5, 16, 1, '    let nextMergeId = 1;'],
                /* 8*/ [1, 5, 16, 1, '    let nextFlowId = 1;'],
                /* 9*/ [1, 5, 16, 1, ''],
                /*10*/ [1, 11, 15, 2, '    export function getNodeId(node: Node): number {'],
                /*11*/ [2, 12, 13, 3, '        if (!node.id) {'],
                /*12*/ [3, 12, 13, 3, '            node.id = nextNodeId;'],
                /*13*/ [3, 12, 13, 3, '            nextNodeId++;'],
                /*14*/ [2, 12, 13, 3, '        }'],
                /*15*/ [2, 11, 15, 2, '        return node.id;'],
                /*16*/ [1, 11, 15, 2, '    }'],
                /*17*/ [0, 5, 16, 1, '}']
            ], 4);
        });
        test('issue #8425 - Missing indentation lines for first level indentation', () => {
            assertIndentGuides([
                [1, 2, 3, 2, '\tindent1'],
                [2, 2, 3, 2, '\t\tindent2'],
                [2, 2, 3, 2, '\t\tindent2'],
                [1, 2, 3, 2, '\tindent1']
            ], 4);
        });
        test('issue #8952 - Indentation guide lines going through text on .yml file', () => {
            assertIndentGuides([
                [0, 2, 5, 1, 'properties:'],
                [1, 3, 5, 2, '    emailAddress:'],
                [2, 3, 5, 2, '        - bla'],
                [2, 5, 5, 3, '        - length:'],
                [3, 5, 5, 3, '            max: 255'],
                [0, 6, 6, 0, 'getters:']
            ], 4);
        });
        test('issue #11892 - Indent guides look funny', () => {
            assertIndentGuides([
                [0, 2, 7, 1, 'function test(base) {'],
                [1, 3, 6, 2, '\tswitch (base) {'],
                [2, 4, 4, 3, '\t\tcase 1:'],
                [3, 4, 4, 3, '\t\t\treturn 1;'],
                [2, 6, 6, 3, '\t\tcase 2:'],
                [3, 6, 6, 3, '\t\t\treturn 2;'],
                [1, 2, 7, 1, '\t}'],
                [0, 2, 7, 1, '}']
            ], 4);
        });
        test('issue #12398 - Problem in indent guidelines', () => {
            assertIndentGuides([
                [2, 2, 2, 3, '\t\t.bla'],
                [3, 2, 2, 3, '\t\t\tlabel(for)'],
                [0, 3, 3, 0, 'include script']
            ], 4);
        });
        test('issue #49173', () => {
            const model = (0, testTextModel_1.createTextModel)([
                'class A {',
                '	public m1(): void {',
                '	}',
                '	public m2(): void {',
                '	}',
                '	public m3(): void {',
                '	}',
                '	public m4(): void {',
                '	}',
                '	public m5(): void {',
                '	}',
                '}',
            ].join('\n'));
            const actual = model.guides.getActiveIndentGuide(2, 4, 9);
            assert.deepStrictEqual(actual, { startLineNumber: 2, endLineNumber: 9, indent: 1 });
            model.dispose();
        });
        test('tweaks - no active', () => {
            assertIndentGuides([
                [0, 1, 1, 0, 'A'],
                [0, 2, 2, 0, 'A']
            ], 2);
        });
        test('tweaks - inside scope', () => {
            assertIndentGuides([
                [0, 2, 2, 1, 'A'],
                [1, 2, 2, 1, '  A']
            ], 2);
        });
        test('tweaks - scope start', () => {
            assertIndentGuides([
                [0, 2, 2, 1, 'A'],
                [1, 2, 2, 1, '  A'],
                [0, 2, 2, 1, 'A']
            ], 2);
        });
        test('tweaks - empty line', () => {
            assertIndentGuides([
                [0, 2, 4, 1, 'A'],
                [1, 2, 4, 1, '  A'],
                [1, 2, 4, 1, ''],
                [1, 2, 4, 1, '  A'],
                [0, 2, 4, 1, 'A']
            ], 2);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dE1vZGVsV2l0aFRva2Vucy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvdGV4dE1vZGVsV2l0aFRva2Vucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxTQUFTLDJCQUEyQixDQUFDLFdBQTRCLEVBQUUsSUFBWSxFQUFFLFFBQXlCO1FBQ3pHLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQztRQUNsQyxNQUFNLG9CQUFvQixHQUFHLElBQUEsbUNBQW1CLEVBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUQsTUFBTSw0QkFBNEIsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsNkRBQTZCLENBQUMsQ0FBQztRQUM3RixNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztRQUVuRSxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEUsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWpGLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLG9DQUFvQixFQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ3RGLENBQUM7SUFFRCxLQUFLLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1FBRWpDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLFlBQVksQ0FBQyxRQUFrQixFQUFFLFFBQXlCO1lBQ2xFLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FB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QUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0YsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNGLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0YsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNGLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDL0IsTUFBTSxJQUFJLEdBQ1QsYUFBYSxHQUFHLElBQUk7Z0JBQ3BCLFFBQVEsR0FBRyxJQUFJO2dCQUNmLG9CQUFvQixHQUFHLElBQUk7Z0JBQzNCLE1BQU0sR0FBRyxJQUFJO2dCQUNiLE1BQU0sQ0FBQztZQUNSLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSxvQ0FBb0IsRUFBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUU1RixNQUFNLFFBQVEsR0FBK0I7Z0JBQzVDLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckUsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFFbEUsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JFLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDckUsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUVyRSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3BFLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDcEUsQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBRWxFLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFF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O1lBQ25DLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1RixlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFNUYsK0JBQStCO1lBQy9CLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRixlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0YsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUMvQixNQUFNLElBQUksR0FBRztnQkFDWixhQUFhO2dCQUNiLHFCQUFxQjtnQkFDckIsYUFBYTtnQkFDYixXQUFXO2FBQ1gsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFYixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxNQUFNLEtBQUssR0FBRywyQkFBMkIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFO2dCQUM1RCxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUM7Z0JBQzVCLENBQUMsbUJBQW1CLEVBQUUsV0FBVyxDQUFDO2FBQ2xDLENBQUMsQ0FBQztZQUVILDJDQUEyQztZQUMzQyxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdGLGlEQUFpRDtZQUNqRCxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0YsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdGLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0R0FBNEcsRUFBRSxHQUFHLEVBQUU7WUFDdkgsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLG1DQUFtQixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELE1BQU0sNEJBQTRCLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDZEQUE2QixDQUFDLENBQUM7WUFDN0YsTUFBTSxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDbkUsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDO1lBQzFCLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQztZQUUxQixNQUFNLGVBQWUsR0FBRyxlQUFlLENBQUMsZUFBZSxDQUFDO1lBRXhELFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzdELE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUU3RCxNQUFNLGNBQWMsR0FBRyxDQUN0QixDQUFDLFlBQVksNENBQW9DLENBQUM7a0JBQ2hELENBQUMsMkVBQTJELENBQUM7a0JBQzdELGtEQUF1QyxDQUN6QyxLQUFLLENBQUMsQ0FBQztZQUNSLE1BQU0sY0FBYyxHQUFHLENBQ3RCLENBQUMsWUFBWSw0Q0FBb0MsQ0FBQztrQkFDaEQsQ0FBQywyRUFBMkQsQ0FBQztrQkFDN0Qsa0RBQXVDLENBQ3pDLEtBQUssQ0FBQyxDQUFDO1lBRVIsTUFBTSxtQkFBbUIsR0FBeUI7Z0JBQ2pELGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBUztnQkFDaEMsUUFBUSxFQUFFLFNBQVU7Z0JBQ3BCLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3hDLFFBQVEsSUFBSSxFQUFFLENBQUM7d0JBQ2QsS0FBSyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7NEJBQ3ZCLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDO2dDQUM5QixDQUFDLEVBQUUsY0FBYztnQ0FDakIsQ0FBQyxFQUFFLGNBQWM7Z0NBQ2pCLENBQUMsRUFBRSxjQUFjO2dDQUNqQixFQUFFLEVBQUUsY0FBYztnQ0FDbEIsRUFBRSxFQUFFLGNBQWM7Z0NBQ2xCLEVBQUUsRUFBRSxjQUFjO2dDQUNsQixFQUFFLEVBQUUsY0FBYzs2QkFDbEIsQ0FBQyxDQUFDOzRCQUNILE9BQU8sSUFBSSxxQ0FBeUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3JELENBQUM7d0JBQ0QsS0FBSyx5QkFBeUIsQ0FBQyxDQUFDLENBQUM7NEJBQ2hDLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDO2dDQUM5QixDQUFDLEVBQUUsY0FBYztnQ0FDakIsQ0FBQyxFQUFFLGNBQWM7Z0NBQ2pCLENBQUMsRUFBRSxjQUFjO2dDQUNqQixDQUFDLEVBQUUsY0FBYztnQ0FDakIsRUFBRSxFQUFFLGNBQWM7Z0NBQ2xCLEVBQUUsRUFBRSxjQUFjO2dDQUNsQixFQUFFLEVBQUUsY0FBYztnQ0FDbEIsRUFBRSxFQUFFLGNBQWM7Z0NBQ2xCLEVBQUUsRUFBRSxjQUFjO2dDQUNsQixFQUFFLEVBQUUsY0FBYztnQ0FDbEIsRUFBRSxFQUFFLGNBQWM7Z0NBQ2xCLEVBQUUsRUFBRSxjQUFjO2dDQUNsQixFQUFFLEVBQUUsY0FBYzs2QkFDbEIsQ0FBQyxDQUFDOzRCQUNILE9BQU8sSUFBSSxxQ0FBeUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3JELENBQUM7d0JBQ0QsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUNWLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDO2dDQUM5QixDQUFDLEVBQUUsY0FBYzs2QkFDakIsQ0FBQyxDQUFDOzRCQUNILE9BQU8sSUFBSSxxQ0FBeUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3JELENBQUM7b0JBQ0YsQ0FBQztvQkFDRCxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUMvQixDQUFDO2FBQ0QsQ0FBQztZQUVGLFdBQVcsQ0FBQyxHQUFHLENBQUMsZ0NBQW9CLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDM0UsV0FBVyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFO2dCQUM1RCxRQUFRLEVBQUU7b0JBQ1QsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO29CQUNWLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7aUJBQ1Y7YUFDRCxDQUFDLENBQUMsQ0FBQztZQUNKLFdBQVcsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRTtnQkFDNUQsUUFBUSxFQUFFO29CQUNULENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2lCQUNWO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsb0NBQW9CLEVBQ2pELG9CQUFvQixFQUNwQjtnQkFDQyxnQkFBZ0I7Z0JBQ2hCLHlCQUF5QjtnQkFDekIsR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLEtBQUssQ0FDTCxDQUFDLENBQUM7WUFFSCxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4QyxNQUFNLENBQUMsZUFBZSxDQUNyQixLQUFLLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxJQUFJLG1CQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQ3BELENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FDbEQsQ0FBQztZQUVGLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx1RUFBdUUsRUFBRSxHQUFHLEVBQUU7WUFDbEYsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLG1DQUFtQixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELE1BQU0sNEJBQTRCLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDZEQUE2QixDQUFDLENBQUM7WUFDN0YsTUFBTSxJQUFJLEdBQUcsVUFBVSxDQUFDO1lBRXhCLE1BQU0sZUFBZSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDLGVBQWUsQ0FBQztZQUVuRixNQUFNLFdBQVcsR0FBRyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFM0QsTUFBTSxhQUFhLEdBQUcsQ0FDckIsQ0FBQyxXQUFXLDRDQUFvQyxDQUFDO2tCQUMvQyxDQUFDLDJFQUEyRCxDQUFDLENBQy9ELEtBQUssQ0FBQyxDQUFDO1lBQ1IsTUFBTSxjQUFjLEdBQUcsQ0FDdEIsQ0FBQyxXQUFXLDRDQUFvQyxDQUFDO2tCQUMvQyxDQUFDLDRFQUE0RCxDQUFDLENBQ2hFLEtBQUssQ0FBQyxDQUFDO1lBRVIsTUFBTSxtQkFBbUIsR0FBeUI7Z0JBQ2pELGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBUztnQkFDaEMsUUFBUSxFQUFFLFNBQVU7Z0JBQ3BCLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3hDLFFBQVEsSUFBSSxFQUFFLENBQUM7d0JBQ2QsS0FBSyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7NEJBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDO2dDQUM5QixDQUFDLEVBQUUsYUFBYTs2QkFDaEIsQ0FBQyxDQUFDOzRCQUNILE9BQU8sSUFBSSxxQ0FBeUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ3JELENBQUM7d0JBQ0QsS0FBSyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7NEJBQ25DLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDO2dDQUM5QixDQUFDLEVBQUUsYUFBYTtnQ0FDaEIsRUFBRSxFQUFFLGNBQWM7Z0NBQ2xCLEVBQUUsRUFBRSxhQUFhO2dDQUNqQixFQUFFLEVBQUUsY0FBYztnQ0FDbEIsRUFBRSxFQUFFLGFBQWE7NkJBQ2pCLENBQUMsQ0FBQzs0QkFDSCxPQUFPLElBQUkscUNBQXlCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNyRCxDQUFDO3dCQUNELEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs0QkFDVixNQUFNLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQztnQ0FDOUIsQ0FBQyxFQUFFLGFBQWE7NkJBQ2hCLENBQUMsQ0FBQzs0QkFDSCxPQUFPLElBQUkscUNBQXlCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO3dCQUNyRCxDQUFDO29CQUNGLENBQUM7b0JBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDL0IsQ0FBQzthQUNELENBQUM7WUFFRixXQUFXLENBQUMsR0FBRyxDQUFDLGdDQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQzFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRTtnQkFDM0QsUUFBUSxFQUFFO29CQUNULENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQztvQkFDVixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7b0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2lCQUNWO2FBQ0QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUEsb0NBQW9CLEVBQ2pELG9CQUFvQixFQUNwQjtnQkFDQyxvQkFBb0I7Z0JBQ3BCLDRCQUE0QjtnQkFDNUIsR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUNaLElBQUksQ0FDSixDQUFDLENBQUM7WUFFSCxLQUFLLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4QyxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuRixNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksbUJBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUVuRixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDdkIsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUdILEtBQUssQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7UUFFbEQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxnSUFBZ0ksRUFBRSxHQUFHLEVBQUU7WUFDM0ksU0FBUyxvQkFBb0IsQ0FBQyxLQUFnQixFQUFFLFVBQWtCLEVBQUUsaUJBQTBCLEVBQUUsUUFBeUI7Z0JBQ3hILElBQUksaUJBQWlCLEVBQUUsQ0FBQztvQkFDdkIsS0FBSyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDbEQsQ0FBQztnQkFDRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFLdkUsTUFBTSxNQUFNLEdBQXVCLEVBQUUsQ0FBQztnQkFDdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3hELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRzt3QkFDWCxRQUFRLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQ2pDLFVBQVUsRUFBRSxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztxQkFDcEMsQ0FBQztnQkFDSCxDQUFDO2dCQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsS0FBb0IsRUFBRSxFQUFFO29CQUN2QyxPQUFPO3dCQUNOLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUTt3QkFDeEIsVUFBVSxFQUFFLEtBQUssQ0FBQyxhQUFhLEVBQUU7cUJBQ2pDLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDO2dCQUNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN0RCxDQUFDO1lBRUQsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDO1lBQ25DLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixDQUFDO1lBRW5DLE1BQU0sbUJBQW1CLEdBQXlCO2dCQUNqRCxlQUFlLEVBQUUsR0FBRyxFQUFFLENBQUMsd0JBQVM7Z0JBQ2hDLFFBQVEsRUFBRSxTQUFVO2dCQUNwQixlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO29CQUN4QyxNQUFNLElBQUksR0FBRyxFQUFFLFFBQVEsQ0FBQztvQkFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2xDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2QsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQ1gsSUFBSSw2Q0FBb0MsQ0FDeEMsS0FBSyxDQUFDLENBQUM7b0JBQ1IsT0FBTyxJQUFJLHFDQUF5QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckQsQ0FBQzthQUNELENBQUM7WUFFRixNQUFNLGFBQWEsR0FBRyxnQ0FBb0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLENBQUM7WUFDbkYsTUFBTSxhQUFhLEdBQUcsZ0NBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBRW5GLE1BQU0sS0FBSyxHQUFHLElBQUEsK0JBQWUsRUFBQyx5QkFBeUIsQ0FBQyxDQUFDO1lBRXpELG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbEUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU1QixvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRW5FLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFNUIsb0JBQW9CLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVuRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDaEIsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3hCLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUV4QixTQUFTLG1CQUFtQixDQUFDLFFBQWdCLEVBQUUsVUFBa0I7Z0JBQ2hFLE1BQU0sUUFBUSxHQUFHLENBQ2hCLENBQUMsVUFBVSw2Q0FBb0MsQ0FBQyxDQUNoRCxLQUFLLENBQUMsQ0FBQztnQkFDUixPQUFPLElBQUksNkJBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNGLENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLGtGQUFrRixFQUFFLEdBQUcsRUFBRTtZQUU3RixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxNQUFNLEtBQUssR0FBRywyQkFBMkIsQ0FDeEMsV0FBVyxFQUNYO2dCQUNDLGdCQUFnQjtnQkFDaEIsb0NBQW9DO2dCQUNwQyxFQUFFO2dCQUNGLFdBQVc7Z0JBQ1gsRUFBRTtnQkFDRixjQUFjO2dCQUNkLFdBQVc7Z0JBQ1gsRUFBRTtnQkFDRixZQUFZO2FBQ1osQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1o7Z0JBQ0MsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDO2dCQUN4QixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUM7YUFDbEIsQ0FDRCxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWhGLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQywrSEFBK0gsRUFBRSxHQUFHLEVBQUU7WUFFMUksTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsTUFBTSxLQUFLLEdBQUcsMkJBQTJCLENBQ3hDLFdBQVcsRUFDWDtnQkFDQyxrQkFBa0I7Z0JBQ2xCLHVCQUF1QjtnQkFDdkIsa0JBQWtCO2dCQUNsQixhQUFhO2FBQ2IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ1o7Z0JBQ0MsQ0FBQyxVQUFVLEVBQUUsYUFBYSxDQUFDO2dCQUMzQixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUM7YUFDekIsQ0FDRCxDQUFDO1lBRUYsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsSUFBSSxtQkFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRWpGLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7WUFDM0UsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7WUFDMUMsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLG1DQUFtQixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELE1BQU0sZUFBZSxHQUFHLG9CQUFvQixDQUFDLEdBQUcsQ0FBQywyQkFBZ0IsQ0FBQyxDQUFDO1lBRW5FLE1BQU0sU0FBUyxHQUFHLFdBQVcsQ0FBQztZQUM5QixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUM7WUFFOUIsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JFLFdBQVcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVyRSxNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQyxlQUFlLENBQUM7WUFDbkYsTUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFckUsTUFBTSxtQkFBbUIsR0FBeUI7Z0JBQ2pELGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx3QkFBUztnQkFDaEMsUUFBUSxFQUFFLFNBQVU7Z0JBQ3BCLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7b0JBQ3hDLE1BQU0sTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNsQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNkLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUNYLGdCQUFnQiw0Q0FBb0MsQ0FDcEQsS0FBSyxDQUFDLENBQUM7b0JBQ1IsT0FBTyxJQUFJLHFDQUF5QixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckQsQ0FBQzthQUNELENBQUM7WUFFRixXQUFXLENBQUMsR0FBRyxDQUFDLGdDQUFvQixDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBRS9FLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBQSxvQ0FBb0IsRUFBQyxvQkFBb0IsRUFBRSx1QkFBdUIsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBRTlHLEtBQUssQ0FBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBRW5FLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtRQUUxQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsU0FBUyxrQkFBa0IsQ0FBQyxLQUFpRCxFQUFFLFVBQWtCO1lBQ2hHLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQztZQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMxQyxNQUFNLG9CQUFvQixHQUFHLElBQUEsbUNBQW1CLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUQsTUFBTSxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDbkUsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRFLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0MsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFBLG9DQUFvQixFQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQzVGLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUVoRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUVqRixNQUFNLE1BQU0sR0FBK0MsRUFBRSxDQUFDO1lBQzlELEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQztnQkFDekQsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQzNGLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4SyxDQUFDO1lBRUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFdEMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLENBQUMsZ0NBQWdDLEVBQUUsR0FBRyxFQUFFO1lBQzNDLGtCQUFrQixDQUFDO2dCQUNsQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDO2dCQUNuQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7YUFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLCtCQUErQixFQUFFLEdBQUcsRUFBRTtZQUMxQyxrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUNqQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDO2dCQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUM7YUFDckIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUNqQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sQ0FBQztnQkFDckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBUyxDQUFDO2dCQUN2QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7YUFDakIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUNqRCxrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDO2dCQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNqQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLGtCQUFrQixDQUFDO2dCQUNsQixNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDO2dCQUMvQixNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxxQkFBcUIsQ0FBQztnQkFDekMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLHFCQUFxQixDQUFDO2dCQUN6QyxNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDO2dCQUN6QixNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUN0QixNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQ3BDLE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxxQkFBcUIsQ0FBQztnQkFDekMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDekIsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQztnQkFDdkIsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQztnQkFDckMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQztnQkFDckMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUN6QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFO1lBQ3ZDLGtCQUFrQixDQUFDO2dCQUNsQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDO2dCQUNuQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixDQUFDO2dCQUM5QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNqQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1lBQzFDLGtCQUFrQixDQUFDO2dCQUNsQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUM7Z0JBQ3pCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQzlCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQztnQkFDcEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDO2dCQUM3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2FBQ2pCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLEVBQUU7WUFDcEMsa0JBQWtCLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDO2dCQUNwQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsY0FBYyxDQUFDO2dCQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxpQkFBaUIsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDO2dCQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNqQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO1lBQzFDLGtCQUFrQixDQUFDO2dCQUNsQixNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsbUNBQW1DLENBQUM7Z0JBQ3ZELE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3RCLE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxpQkFBaUIsQ0FBQztnQkFDckMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLGdCQUFnQixDQUFDO2dCQUNyQyxNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsMkJBQTJCLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSx5QkFBeUIsQ0FBQztnQkFDOUMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLDBCQUEwQixDQUFDO2dCQUMvQyxNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUseUJBQXlCLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3ZCLE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxxREFBcUQsQ0FBQztnQkFDM0UsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLHlCQUF5QixDQUFDO2dCQUMvQyxNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsbUNBQW1DLENBQUM7Z0JBQ3pELE1BQU0sQ0FBQSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSwyQkFBMkIsQ0FBQztnQkFDakQsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQztnQkFDakMsTUFBTSxDQUFBLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLHlCQUF5QixDQUFDO2dCQUMvQyxNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDO2dCQUM3QixNQUFNLENBQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2FBQ3hCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxRUFBcUUsRUFBRSxHQUFHLEVBQUU7WUFDaEYsa0JBQWtCLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDO2dCQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUM7Z0JBQzNCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQzthQUN6QixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsdUVBQXVFLEVBQUUsR0FBRyxFQUFFO1lBQ2xGLGtCQUFrQixDQUFDO2dCQUNsQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxhQUFhLENBQUM7Z0JBQzNCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLG1CQUFtQixDQUFDO2dCQUNqQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUM7Z0JBQzdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLG1CQUFtQixDQUFDO2dCQUNqQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxzQkFBc0IsQ0FBQztnQkFDcEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDO2FBQ3hCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7WUFDcEQsa0JBQWtCLENBQUM7Z0JBQ2xCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLHVCQUF1QixDQUFDO2dCQUNyQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxtQkFBbUIsQ0FBQztnQkFDakMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDO2dCQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxpQkFBaUIsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDO2dCQUMzQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxpQkFBaUIsQ0FBQztnQkFDL0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDO2dCQUNuQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7YUFDakIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtZQUN4RCxrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsVUFBVSxDQUFDO2dCQUN4QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxrQkFBa0IsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUM7YUFDOUIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7WUFDekIsTUFBTSxLQUFLLEdBQUcsSUFBQSwrQkFBZSxFQUFDO2dCQUM3QixXQUFXO2dCQUNYLHNCQUFzQjtnQkFDdEIsSUFBSTtnQkFDSixzQkFBc0I7Z0JBQ3RCLElBQUk7Z0JBQ0osc0JBQXNCO2dCQUN0QixJQUFJO2dCQUNKLHNCQUFzQjtnQkFDdEIsSUFBSTtnQkFDSixzQkFBc0I7Z0JBQ3RCLElBQUk7Z0JBQ0osR0FBRzthQUNILENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFZCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEYsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtZQUMvQixrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUNqQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7YUFDakIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtZQUNsQyxrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUNqQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7YUFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxrQkFBa0IsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO2dCQUNqQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNqQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMscUJBQXFCLEVBQUUsR0FBRyxFQUFFO1lBQ2hDLGtCQUFrQixDQUFDO2dCQUNsQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7Z0JBQ2pCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDbkIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQzthQUNqQixFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9