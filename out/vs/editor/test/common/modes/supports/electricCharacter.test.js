/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/supports/electricCharacter", "vs/editor/common/languages/supports/richEditBrackets", "vs/editor/test/common/modesTestUtils"], function (require, exports, assert, utils_1, electricCharacter_1, richEditBrackets_1, modesTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const fakeLanguageId = 'test';
    suite('Editor Modes - Auto Indentation', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function _testOnElectricCharacter(electricCharacterSupport, line, character, offset) {
            return electricCharacterSupport.onElectricCharacter(character, (0, modesTestUtils_1.createFakeScopedLineTokens)(line), offset);
        }
        function testDoesNothing(electricCharacterSupport, line, character, offset) {
            const actual = _testOnElectricCharacter(electricCharacterSupport, line, character, offset);
            assert.deepStrictEqual(actual, null);
        }
        function testMatchBracket(electricCharacterSupport, line, character, offset, matchOpenBracket) {
            const actual = _testOnElectricCharacter(electricCharacterSupport, line, character, offset);
            assert.deepStrictEqual(actual, { matchOpenBracket: matchOpenBracket });
        }
        test('getElectricCharacters uses all sources and dedups', () => {
            const sup = new electricCharacter_1.BracketElectricCharacterSupport(new richEditBrackets_1.RichEditBrackets(fakeLanguageId, [
                ['{', '}'],
                ['(', ')']
            ]));
            assert.deepStrictEqual(sup.getElectricCharacters(), ['}', ')']);
        });
        test('matchOpenBracket', () => {
            const sup = new electricCharacter_1.BracketElectricCharacterSupport(new richEditBrackets_1.RichEditBrackets(fakeLanguageId, [
                ['{', '}'],
                ['(', ')']
            ]));
            testDoesNothing(sup, [{ text: '\t{', type: 0 /* StandardTokenType.Other */ }], '\t', 1);
            testDoesNothing(sup, [{ text: '\t{', type: 0 /* StandardTokenType.Other */ }], '\t', 2);
            testDoesNothing(sup, [{ text: '\t\t', type: 0 /* StandardTokenType.Other */ }], '{', 3);
            testDoesNothing(sup, [{ text: '\t}', type: 0 /* StandardTokenType.Other */ }], '\t', 1);
            testDoesNothing(sup, [{ text: '\t}', type: 0 /* StandardTokenType.Other */ }], '\t', 2);
            testMatchBracket(sup, [{ text: '\t\t', type: 0 /* StandardTokenType.Other */ }], '}', 3, '}');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlY3RyaWNDaGFyYWN0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVzL3N1cHBvcnRzL2VsZWN0cmljQ2hhcmFjdGVyLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0lBRTlCLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUU7UUFFN0MsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsd0JBQXdCLENBQUMsd0JBQXlELEVBQUUsSUFBaUIsRUFBRSxTQUFpQixFQUFFLE1BQWM7WUFDaEosT0FBTyx3QkFBd0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBQSwyQ0FBMEIsRUFBQyxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxRyxDQUFDO1FBRUQsU0FBUyxlQUFlLENBQUMsd0JBQXlELEVBQUUsSUFBaUIsRUFBRSxTQUFpQixFQUFFLE1BQWM7WUFDdkksTUFBTSxNQUFNLEdBQUcsd0JBQXdCLENBQUMsd0JBQXdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMzRixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsU0FBUyxnQkFBZ0IsQ0FBQyx3QkFBeUQsRUFBRSxJQUFpQixFQUFFLFNBQWlCLEVBQUUsTUFBYyxFQUFFLGdCQUF3QjtZQUNsSyxNQUFNLE1BQU0sR0FBRyx3QkFBd0IsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLENBQUM7UUFFRCxJQUFJLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1lBQzlELE1BQU0sR0FBRyxHQUFHLElBQUksbURBQStCLENBQzlDLElBQUksbUNBQWdCLENBQUMsY0FBYyxFQUFFO2dCQUNwQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQ1YsQ0FBQyxDQUNGLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO1lBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUksbURBQStCLENBQzlDLElBQUksbUNBQWdCLENBQUMsY0FBYyxFQUFFO2dCQUNwQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUM7Z0JBQ1YsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDO2FBQ1YsQ0FBQyxDQUNGLENBQUM7WUFFRixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksaUNBQXlCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksaUNBQXlCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksaUNBQXlCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoRixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksaUNBQXlCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksaUNBQXlCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRixnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxpQ0FBeUIsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN2RixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=