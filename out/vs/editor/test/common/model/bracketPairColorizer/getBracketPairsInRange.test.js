/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/test/common/model/bracketPairColorizer/tokenizer.test", "vs/editor/test/common/testTextModel"], function (require, exports, assert, lifecycle_1, utils_1, position_1, range_1, languages_1, language_1, languageConfigurationRegistry_1, tokenizer_test_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Bracket Pair Colorizer - getBracketPairsInRange', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createTextModelWithColorizedBracketPairs(store, text) {
            const languageId = 'testLanguage';
            const instantiationService = (0, testTextModel_1.createModelServices)(store);
            const languageConfigurationService = instantiationService.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            const languageService = instantiationService.get(language_1.ILanguageService);
            store.add(languageService.registerLanguage({
                id: languageId,
            }));
            const encodedMode1 = languageService.languageIdCodec.encodeLanguageId(languageId);
            const document = new tokenizer_test_1.TokenizedDocument([
                new tokenizer_test_1.TokenInfo(text, encodedMode1, 0 /* StandardTokenType.Other */, true)
            ]);
            store.add(languages_1.TokenizationRegistry.register(languageId, document.getTokenizationSupport()));
            store.add(languageConfigurationService.register(languageId, {
                brackets: [
                    ['<', '>']
                ],
                colorizedBracketPairs: [
                    ['{', '}'],
                    ['[', ']'],
                    ['(', ')'],
                ]
            }));
            const textModel = store.add((0, testTextModel_1.instantiateTextModel)(instantiationService, text, languageId));
            return textModel;
        }
        test('Basic 1', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`{ ( [] ¹ ) [ ² { } ] () } []`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                model.tokenization.getLineTokens(1).getLanguageId(0);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON)
                    .toArray(), [
                    {
                        level: 0,
                        range: '[1,1 -> 1,2]',
                        openRange: '[1,1 -> 1,2]',
                        closeRange: '[1,23 -> 1,24]',
                    },
                    {
                        level: 1,
                        range: '[1,3 -> 1,4]',
                        openRange: '[1,3 -> 1,4]',
                        closeRange: '[1,9 -> 1,10]',
                    },
                    {
                        level: 1,
                        range: '[1,11 -> 1,12]',
                        openRange: '[1,11 -> 1,12]',
                        closeRange: '[1,18 -> 1,19]',
                    },
                ]);
            });
        });
        test('Basic 2', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`{ ( [] ¹ ²) [  { } ] () } []`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON)
                    .toArray(), [
                    {
                        level: 0,
                        range: '[1,1 -> 1,2]',
                        openRange: '[1,1 -> 1,2]',
                        closeRange: '[1,23 -> 1,24]',
                    },
                    {
                        level: 1,
                        range: '[1,3 -> 1,4]',
                        openRange: '[1,3 -> 1,4]',
                        closeRange: '[1,9 -> 1,10]',
                    },
                ]);
            });
        });
        test('Basic Empty', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ ² { ( [] ) [  { } ] () } []`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON)
                    .toArray(), []);
            });
        });
        test('Basic All', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ { ( [] ) [  { } ] () } [] ²`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketPairsInRange(doc.range(1, 2))
                    .map(bracketPairToJSON)
                    .toArray(), [
                    {
                        level: 0,
                        range: '[1,2 -> 1,3]',
                        openRange: '[1,2 -> 1,3]',
                        closeRange: '[1,23 -> 1,24]',
                    },
                    {
                        level: 1,
                        range: '[1,4 -> 1,5]',
                        openRange: '[1,4 -> 1,5]',
                        closeRange: '[1,9 -> 1,10]',
                    },
                    {
                        level: 2,
                        range: '[1,6 -> 1,7]',
                        openRange: '[1,6 -> 1,7]',
                        closeRange: '[1,7 -> 1,8]',
                    },
                    {
                        level: 1,
                        range: '[1,11 -> 1,12]',
                        openRange: '[1,11 -> 1,12]',
                        closeRange: '[1,18 -> 1,19]',
                    },
                    {
                        level: 2,
                        range: '[1,14 -> 1,15]',
                        openRange: '[1,14 -> 1,15]',
                        closeRange: '[1,16 -> 1,17]',
                    },
                    {
                        level: 1,
                        range: '[1,20 -> 1,21]',
                        openRange: '[1,20 -> 1,21]',
                        closeRange: '[1,21 -> 1,22]',
                    },
                    {
                        level: 0,
                        range: '[1,25 -> 1,26]',
                        openRange: '[1,25 -> 1,26]',
                        closeRange: '[1,26 -> 1,27]',
                    },
                ]);
            });
        });
        test('getBracketsInRange', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ { [ ( [ [ (  ) ] ] ) ] } { } ²`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketsInRange(doc.range(1, 2))
                    .map(b => ({ level: b.nestingLevel, levelEqualBracketType: b.nestingLevelOfEqualBracketType, range: b.range.toString() }))
                    .toArray(), [
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,2 -> 1,3]"
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,4 -> 1,5]"
                    },
                    {
                        level: 2,
                        levelEqualBracketType: 0,
                        range: "[1,6 -> 1,7]"
                    },
                    {
                        level: 3,
                        levelEqualBracketType: 1,
                        range: "[1,8 -> 1,9]"
                    },
                    {
                        level: 4,
                        levelEqualBracketType: 2,
                        range: "[1,10 -> 1,11]"
                    },
                    {
                        level: 5,
                        levelEqualBracketType: 1,
                        range: "[1,12 -> 1,13]"
                    },
                    {
                        level: 5,
                        levelEqualBracketType: 1,
                        range: "[1,15 -> 1,16]"
                    },
                    {
                        level: 4,
                        levelEqualBracketType: 2,
                        range: "[1,17 -> 1,18]"
                    },
                    {
                        level: 3,
                        levelEqualBracketType: 1,
                        range: "[1,19 -> 1,20]"
                    },
                    {
                        level: 2,
                        levelEqualBracketType: 0,
                        range: "[1,21 -> 1,22]"
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,23 -> 1,24]"
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,25 -> 1,26]"
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,27 -> 1,28]"
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,29 -> 1,30]"
                    },
                ]);
            });
        });
        test('Test Error Brackets', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ { () ] ² `);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketsInRange(doc.range(1, 2))
                    .map(b => ({ level: b.nestingLevel, range: b.range.toString(), isInvalid: b.isInvalid }))
                    .toArray(), [
                    {
                        level: 0,
                        isInvalid: true,
                        range: "[1,2 -> 1,3]",
                    },
                    {
                        level: 1,
                        isInvalid: false,
                        range: "[1,4 -> 1,5]",
                    },
                    {
                        level: 1,
                        isInvalid: false,
                        range: "[1,5 -> 1,6]",
                    },
                    {
                        level: 0,
                        isInvalid: true,
                        range: "[1,7 -> 1,8]"
                    }
                ]);
            });
        });
        test('colorizedBracketsVSBrackets', () => {
            (0, lifecycle_1.disposeOnReturn)(store => {
                const doc = new AnnotatedDocument(`¹ {} [<()>] <{>} ²`);
                const model = createTextModelWithColorizedBracketPairs(store, doc.text);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketsInRange(doc.range(1, 2), true)
                    .map(b => ({ level: b.nestingLevel, levelEqualBracketType: b.nestingLevelOfEqualBracketType, range: b.range.toString() }))
                    .toArray(), [
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,2 -> 1,3]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,3 -> 1,4]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,5 -> 1,6]",
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,7 -> 1,8]",
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,8 -> 1,9]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,10 -> 1,11]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,13 -> 1,14]",
                    },
                    {
                        level: -1,
                        levelEqualBracketType: 0,
                        range: "[1,15 -> 1,16]",
                    },
                ]);
                assert.deepStrictEqual(model.bracketPairs
                    .getBracketsInRange(doc.range(1, 2), false)
                    .map(b => ({ level: b.nestingLevel, levelEqualBracketType: b.nestingLevelOfEqualBracketType, range: b.range.toString() }))
                    .toArray(), [
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,2 -> 1,3]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,3 -> 1,4]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,5 -> 1,6]",
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,6 -> 1,7]",
                    },
                    {
                        level: 2,
                        levelEqualBracketType: 0,
                        range: "[1,7 -> 1,8]",
                    },
                    {
                        level: 2,
                        levelEqualBracketType: 0,
                        range: "[1,8 -> 1,9]",
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,9 -> 1,10]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,10 -> 1,11]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,12 -> 1,13]",
                    },
                    {
                        level: 1,
                        levelEqualBracketType: 0,
                        range: "[1,13 -> 1,14]",
                    },
                    {
                        level: 0,
                        levelEqualBracketType: 0,
                        range: "[1,14 -> 1,15]",
                    },
                    {
                        level: -1,
                        levelEqualBracketType: 0,
                        range: "[1,15 -> 1,16]",
                    },
                ]);
            });
        });
    });
    function bracketPairToJSON(pair) {
        return {
            level: pair.nestingLevel,
            range: pair.openingBracketRange.toString(),
            openRange: pair.openingBracketRange.toString(),
            closeRange: pair.closingBracketRange?.toString() || null,
        };
    }
    class PositionOffsetTransformer {
        constructor(text) {
            this.lineStartOffsetByLineIdx = [];
            this.lineStartOffsetByLineIdx.push(0);
            for (let i = 0; i < text.length; i++) {
                if (text.charAt(i) === '\n') {
                    this.lineStartOffsetByLineIdx.push(i + 1);
                }
            }
        }
        getOffset(position) {
            return this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1;
        }
        getPosition(offset) {
            const lineNumber = this.lineStartOffsetByLineIdx.findIndex(lineStartOffset => lineStartOffset <= offset);
            return new position_1.Position(lineNumber + 1, offset - this.lineStartOffsetByLineIdx[lineNumber] + 1);
        }
    }
    class AnnotatedDocument {
        constructor(src) {
            const numbers = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
            let text = '';
            const offsetPositions = new Map();
            let offset = 0;
            for (let i = 0; i < src.length; i++) {
                const idx = numbers.indexOf(src[i]);
                if (idx >= 0) {
                    offsetPositions.set(idx, offset);
                }
                else {
                    text += src[i];
                    offset++;
                }
            }
            this.text = text;
            const mapper = new PositionOffsetTransformer(this.text);
            const positions = new Map();
            for (const [idx, offset] of offsetPositions.entries()) {
                positions.set(idx, mapper.getPosition(offset));
            }
            this.positions = positions;
        }
        range(start, end) {
            return range_1.Range.fromPositions(this.positions.get(start), this.positions.get(end));
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0QnJhY2tldFBhaXJzSW5SYW5nZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZWwvYnJhY2tldFBhaXJDb2xvcml6ZXIvZ2V0QnJhY2tldFBhaXJzSW5SYW5nZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0JoRyxLQUFLLENBQUMsaURBQWlELEVBQUUsR0FBRyxFQUFFO1FBRTdELElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLHdDQUF3QyxDQUFDLEtBQXNCLEVBQUUsSUFBWTtZQUNyRixNQUFNLFVBQVUsR0FBRyxjQUFjLENBQUM7WUFDbEMsTUFBTSxvQkFBb0IsR0FBRyxJQUFBLG1DQUFtQixFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE1BQU0sNEJBQTRCLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDZEQUE2QixDQUFDLENBQUM7WUFDN0YsTUFBTSxlQUFlLEdBQUcsb0JBQW9CLENBQUMsR0FBRyxDQUFDLDJCQUFnQixDQUFDLENBQUM7WUFDbkUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsZ0JBQWdCLENBQUM7Z0JBQzFDLEVBQUUsRUFBRSxVQUFVO2FBQ2QsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLFlBQVksR0FBRyxlQUFlLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2xGLE1BQU0sUUFBUSxHQUFHLElBQUksa0NBQWlCLENBQUM7Z0JBQ3RDLElBQUksMEJBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxtQ0FBMkIsSUFBSSxDQUFDO2FBQ2hFLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxHQUFHLENBQUMsZ0NBQW9CLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxRQUFR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