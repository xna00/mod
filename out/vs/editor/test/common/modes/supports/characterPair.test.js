/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/languageConfiguration", "vs/editor/common/languages/supports/characterPair", "vs/editor/test/common/modesTestUtils"], function (require, exports, assert, utils_1, languageConfiguration_1, characterPair_1, modesTestUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('CharacterPairSupport', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('only autoClosingPairs', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: 'a', close: 'b' }] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
        });
        test('only empty autoClosingPairs', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        test('only brackets', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ brackets: [['a', 'b']] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [new languageConfiguration_1.StandardAutoClosingPairConditional({ open: 'a', close: 'b' })]);
        });
        test('only empty brackets', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ brackets: [] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        test('only surroundingPairs', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ surroundingPairs: [{ open: 'a', close: 'b' }] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), [{ open: 'a', close: 'b' }]);
        });
        test('only empty surroundingPairs', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ surroundingPairs: [] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        test('brackets is ignored when having autoClosingPairs', () => {
            const characaterPairSupport = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [], brackets: [['a', 'b']] });
            assert.deepStrictEqual(characaterPairSupport.getAutoClosingPairs(), []);
            assert.deepStrictEqual(characaterPairSupport.getSurroundingPairs(), []);
        });
        function testShouldAutoClose(characterPairSupport, line, column) {
            const autoClosingPair = characterPairSupport.getAutoClosingPairs()[0];
            return autoClosingPair.shouldAutoClose((0, modesTestUtils_1.createFakeScopedLineTokens)(line), column);
        }
        test('shouldAutoClosePair in empty line', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true);
        });
        test('shouldAutoClosePair in not interesting line 1', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: 'do', type: 0 /* StandardTokenType.Other */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true);
        });
        test('shouldAutoClosePair in not interesting line 2', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}' }] });
            const tokenText = [
                { text: 'do', type: 2 /* StandardTokenType.String */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true);
        });
        test('shouldAutoClosePair in interesting line 1', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: '"a"', type: 2 /* StandardTokenType.String */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false);
        });
        test('shouldAutoClosePair in interesting line 2', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: 'x=', type: 0 /* StandardTokenType.Other */ },
                { text: '"a"', type: 2 /* StandardTokenType.String */ },
                { text: ';', type: 0 /* StandardTokenType.Other */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 5), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 6), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 7), true);
        });
        test('shouldAutoClosePair in interesting line 3', () => {
            const sup = new characterPair_1.CharacterPairSupport({ autoClosingPairs: [{ open: '{', close: '}', notIn: ['string', 'comment'] }] });
            const tokenText = [
                { text: ' ', type: 0 /* StandardTokenType.Other */ },
                { text: '//a', type: 1 /* StandardTokenType.Comment */ }
            ];
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 1), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 2), true);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 3), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 4), false);
            assert.strictEqual(testShouldAutoClose(sup, tokenText, 5), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcmFjdGVyUGFpci50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvc3VwcG9ydHMvY2hhcmFjdGVyUGFpci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFFbEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLEVBQUU7WUFDbEMsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLG9DQUFvQixDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sQ0FBQyxlQUFlLENBQUMscUJBQXFCLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLElBQUksMERBQWtDLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6SSxNQUFNLENBQUMsZUFBZSxDQUFDLHFCQUFxQixDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxJQUFJLDBEQUFrQyxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUksQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO1lBQ3hDLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxvQ0FBb0IsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLGVBQWUs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