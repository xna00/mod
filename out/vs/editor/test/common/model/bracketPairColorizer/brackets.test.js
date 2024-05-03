/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/brackets", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet", "vs/editor/test/common/modes/testLanguageConfigurationService"], function (require, exports, assert, lifecycle_1, utils_1, brackets_1, smallImmutableSet_1, testLanguageConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Bracket Pair Colorizer - Brackets', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Basic', () => {
            const languageId = 'testMode1';
            const denseKeyProvider = new smallImmutableSet_1.DenseKeyProvider();
            const getImmutableSet = (elements) => {
                let newSet = smallImmutableSet_1.SmallImmutableSet.getEmpty();
                elements.forEach(x => newSet = newSet.add(`${languageId}:::${x}`, denseKeyProvider));
                return newSet;
            };
            const getKey = (value) => {
                return denseKeyProvider.getKey(`${languageId}:::${value}`);
            };
            const disposableStore = new lifecycle_1.DisposableStore();
            const languageConfigService = disposableStore.add(new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            disposableStore.add(languageConfigService.register(languageId, {
                brackets: [
                    ['{', '}'], ['[', ']'], ['(', ')'],
                    ['begin', 'end'], ['case', 'endcase'], ['casez', 'endcase'], // Verilog
                    ['\\left(', '\\right)'], ['\\left(', '\\right.'], ['\\left.', '\\right)'], // LaTeX Parentheses
                    ['\\left[', '\\right]'], ['\\left[', '\\right.'], ['\\left.', '\\right]'] // LaTeX Brackets
                ]
            }));
            const brackets = new brackets_1.LanguageAgnosticBracketTokens(denseKeyProvider, l => languageConfigService.getLanguageConfiguration(l));
            const bracketsExpected = [
                { text: '{', length: 1, kind: 'OpeningBracket', bracketId: getKey('{'), bracketIds: getImmutableSet(['{']) },
                { text: '[', length: 1, kind: 'OpeningBracket', bracketId: getKey('['), bracketIds: getImmutableSet(['[']) },
                { text: '(', length: 1, kind: 'OpeningBracket', bracketId: getKey('('), bracketIds: getImmutableSet(['(']) },
                { text: 'begin', length: 5, kind: 'OpeningBracket', bracketId: getKey('begin'), bracketIds: getImmutableSet(['begin']) },
                { text: 'case', length: 4, kind: 'OpeningBracket', bracketId: getKey('case'), bracketIds: getImmutableSet(['case']) },
                { text: 'casez', length: 5, kind: 'OpeningBracket', bracketId: getKey('casez'), bracketIds: getImmutableSet(['casez']) },
                { text: '\\left(', length: 6, kind: 'OpeningBracket', bracketId: getKey('\\left('), bracketIds: getImmutableSet(['\\left(']) },
                { text: '\\left.', length: 6, kind: 'OpeningBracket', bracketId: getKey('\\left.'), bracketIds: getImmutableSet(['\\left.']) },
                { text: '\\left[', length: 6, kind: 'OpeningBracket', bracketId: getKey('\\left['), bracketIds: getImmutableSet(['\\left[']) },
                { text: '}', length: 1, kind: 'ClosingBracket', bracketId: getKey('{'), bracketIds: getImmutableSet(['{']) },
                { text: ']', length: 1, kind: 'ClosingBracket', bracketId: getKey('['), bracketIds: getImmutableSet(['[']) },
                { text: ')', length: 1, kind: 'ClosingBracket', bracketId: getKey('('), bracketIds: getImmutableSet(['(']) },
                { text: 'end', length: 3, kind: 'ClosingBracket', bracketId: getKey('begin'), bracketIds: getImmutableSet(['begin']) },
                { text: 'endcase', length: 7, kind: 'ClosingBracket', bracketId: getKey('case'), bracketIds: getImmutableSet(['case', 'casez']) },
                { text: '\\right)', length: 7, kind: 'ClosingBracket', bracketId: getKey('\\left('), bracketIds: getImmutableSet(['\\left(', '\\left.']) },
                { text: '\\right.', length: 7, kind: 'ClosingBracket', bracketId: getKey('\\left('), bracketIds: getImmutableSet(['\\left(', '\\left[']) },
                { text: '\\right]', length: 7, kind: 'ClosingBracket', bracketId: getKey('\\left['), bracketIds: getImmutableSet(['\\left[', '\\left.']) }
            ];
            const bracketsActual = bracketsExpected.map(x => tokenToObject(brackets.getToken(x.text, languageId), x.text));
            assert.deepStrictEqual(bracketsActual, bracketsExpected);
            disposableStore.dispose();
        });
    });
    function tokenToObject(token, text) {
        if (token === undefined) {
            return undefined;
        }
        return {
            text: text,
            length: token.length,
            bracketId: token.bracketId,
            bracketIds: token.bracketIds,
            kind: {
                [2 /* TokenKind.ClosingBracket */]: 'ClosingBracket',
                [1 /* TokenKind.OpeningBracket */]: 'OpeningBracket',
                [0 /* TokenKind.Text */]: 'Text',
            }[token.kind],
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJhY2tldHMudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyQ29sb3JpemVyL2JyYWNrZXRzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFVaEcsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRTtRQUMvQyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbEIsTUFBTSxVQUFVLEdBQUcsV0FBVyxDQUFDO1lBQy9CLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxvQ0FBZ0IsRUFBVSxDQUFDO1lBQ3hELE1BQU0sZUFBZSxHQUFHLENBQUMsUUFBa0IsRUFBRSxFQUFFO2dCQUM5QyxJQUFJLE1BQU0sR0FBRyxxQ0FBaUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDMUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxNQUFNLENBQUMsRUFBRSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztnQkFDckYsT0FBTyxNQUFNLENBQUM7WUFDZixDQUFDLENBQUM7WUFDRixNQUFNLE1BQU0sR0FBRyxDQUFDLEtBQWEsRUFBRSxFQUFFO2dCQUNoQyxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsTUFBTSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1lBQzVELENBQUMsQ0FBQztZQUVGLE1BQU0sZUFBZSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQzlDLE1BQU0scUJBQXFCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLG1FQUFnQyxFQUFFLENBQUMsQ0FB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