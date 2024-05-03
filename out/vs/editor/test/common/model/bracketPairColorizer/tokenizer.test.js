/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/brackets", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/tokenizer", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, languages_1, language_1, languageConfigurationRegistry_1, brackets_1, length_1, smallImmutableSet_1, tokenizer_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TokenInfo = exports.TokenizedDocument = void 0;
    suite('Bracket Pair Colorizer - Tokenizer', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Basic', () => {
            const mode1 = 'testMode1';
            const disposableStore = new lifecycle_1.DisposableStore();
            const instantiationService = (0, testTextModel_1.createModelServices)(disposableStore);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            disposableStore.add(languageService.registerLanguage({ id: mode1 }));
            const encodedMode1 = languageService.languageIdCodec.encodeLanguageId(mode1);
            const denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
            const tStandard = (text) => new TokenInfo(text, encodedMode1, 0 /* StandardTokenType.Other */, true);
            const tComment = (text) => new TokenInfo(text, encodedMode1, 1 /* StandardTokenType.Comment */, true);
            const document = new TokenizedDocument([
                tStandard(' { } '), tStandard('be'), tStandard('gin end'), tStandard('\n'),
                tStandard('hello'), tComment('{'), tStandard('}'),
            ]);
            disposableStore.add(languages_1.TokenizationRegistry.register(mode1, document.getTokenizationSupport()));
            disposableStore.add(languageConfigurationService.register(mode1, {
                brackets: [['{', '}'], ['[', ']'], ['(', ')'], ['begin', 'end']],
            }));
            const model = disposableStore.add((0, testTextModel_1.instantiateTextModel)(instantiationService, document.getText(), mode1));
            model.tokenization.forceTokenization(model.getLineCount());
            const brackets = new brackets_1.LanguageAgnosticBracketTokens(denseKeyProvider, l => languageConfigurationService.getLanguageConfiguration(l));
            const tokens = readAllTokens(new tokenizer_1.TextBufferTokenizer(model, brackets));
            assert.deepStrictEqual(toArr(tokens, model, denseKeyProvider), [
                { text: ' ', bracketId: null, bracketIds: [], kind: 'Text' },
                {
                    text: '{',
                    bracketId: 'testMode1:::{',
                    bracketIds: ['testMode1:::{'],
                    kind: 'OpeningBracket',
                },
                { text: ' ', bracketId: null, bracketIds: [], kind: 'Text' },
                {
                    text: '}',
                    bracketId: 'testMode1:::{',
                    bracketIds: ['testMode1:::{'],
                    kind: 'ClosingBracket',
                },
                { text: ' ', bracketId: null, bracketIds: [], kind: 'Text' },
                {
                    text: 'begin',
                    bracketId: 'testMode1:::begin',
                    bracketIds: ['testMode1:::begin'],
                    kind: 'OpeningBracket',
                },
                { text: ' ', bracketId: null, bracketIds: [], kind: 'Text' },
                {
                    text: 'end',
                    bracketId: 'testMode1:::begin',
                    bracketIds: ['testMode1:::begin'],
                    kind: 'ClosingBracket',
                },
                { text: '\nhello{', bracketId: null, bracketIds: [], kind: 'Text' },
                {
                    text: '}',
                    bracketId: 'testMode1:::{',
                    bracketIds: ['testMode1:::{'],
                    kind: 'ClosingBracket',
                },
            ]);
            disposableStore.dispose();
        });
    });
    function readAllTokens(tokenizer) {
        const tokens = new Array();
        while (true) {
            const token = tokenizer.read();
            if (!token) {
                break;
            }
            tokens.push(token);
        }
        return tokens;
    }
    function toArr(tokens, model, keyProvider) {
        const result = new Array();
        let offset = length_1.lengthZero;
        for (const token of tokens) {
            result.push(tokenToObj(token, offset, model, keyProvider));
            offset = (0, length_1.lengthAdd)(offset, token.length);
        }
        return result;
    }
    function tokenToObj(token, offset, model, keyProvider) {
        return {
            text: model.getValueInRange((0, length_1.lengthsToRange)(offset, (0, length_1.lengthAdd)(offset, token.length))),
            bracketId: keyProvider.reverseLookup(token.bracketId) || null,
            bracketIds: keyProvider.reverseLookupSet(token.bracketIds),
            kind: {
                [2 /* TokenKind.ClosingBracket */]: 'ClosingBracket',
                [1 /* TokenKind.OpeningBracket */]: 'OpeningBracket',
                [0 /* TokenKind.Text */]: 'Text',
            }[token.kind]
        };
    }
    class TokenizedDocument {
        constructor(tokens) {
            const tokensByLine = new Array();
            let curLine = new Array();
            for (const token of tokens) {
                const lines = token.text.split('\n');
                let first = true;
                while (lines.length > 0) {
                    if (!first) {
                        tokensByLine.push(curLine);
                        curLine = new Array();
                    }
                    else {
                        first = false;
                    }
                    if (lines[0].length > 0) {
                        curLine.push(token.withText(lines[0]));
                    }
                    lines.pop();
                }
            }
            tokensByLine.push(curLine);
            this.tokensByLine = tokensByLine;
        }
        getText() {
            return this.tokensByLine.map(t => t.map(t => t.text).join('')).join('\n');
        }
        getTokenizationSupport() {
            class State {
                constructor(lineNumber) {
                    this.lineNumber = lineNumber;
                }
                clone() {
                    return new State(this.lineNumber);
                }
                equals(other) {
                    return this.lineNumber === other.lineNumber;
                }
            }
            return {
                getInitialState: () => new State(0),
                tokenize: () => { throw new Error('Method not implemented.'); },
                tokenizeEncoded: (line, hasEOL, state) => {
                    const state2 = state;
                    const tokens = this.tokensByLine[state2.lineNumber];
                    const arr = new Array();
                    let offset = 0;
                    for (const t of tokens) {
                        arr.push(offset, t.getMetadata());
                        offset += t.text.length;
                    }
                    return new languages_1.EncodedTokenizationResult(new Uint32Array(arr), new State(state2.lineNumber + 1));
                }
            };
        }
    }
    exports.TokenizedDocument = TokenizedDocument;
    class TokenInfo {
        constructor(text, languageId, tokenType, hasBalancedBrackets) {
            this.text = text;
            this.languageId = languageId;
            this.tokenType = tokenType;
            this.hasBalancedBrackets = hasBalancedBrackets;
        }
        getMetadata() {
            return ((((this.languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */) |
                (this.tokenType << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)) >>>
                0) |
                (this.hasBalancedBrackets ? 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */ : 0));
        }
        withText(text) {
            return new TokenInfo(text, this.languageId, this.tokenType, this.hasBalancedBrackets);
        }
    }
    exports.TokenInfo = TokenInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW5pemVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9icmFja2V0UGFpckNvbG9yaXplci90b2tlbml6ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7UUFFaEQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBQ2xCLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQztZQUMxQixNQUFNLGVBQWUsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUM5QyxNQUFNLG9CQUFvQixHQUFHLElBQUEsbUNBQW1CLEVBQUMsZUFBZSxDQUFDLENBQUM7WUFDbEUsTUFBTSw0QkFBNEIsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsNkRBQTZCLENBQUMsQ0FBQztZQUM3RixNQUFNLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztZQUNuRSxlQUFlLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsTUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUU3RSxNQUFNLGdCQUFnQixHQUFHLElBQUksb0NBQWdCLEVBQVUsQ0FBQztZQUV4RCxNQUFNLFNBQVMsR0FBRyxDQUFDLElBQVksRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksbUNBQTJCLElBQUksQ0FBQyxDQUFDO1lBQ3JHLE1BQU0sUUFB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