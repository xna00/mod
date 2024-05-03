/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/languages/supports/richEditBrackets"], function (require, exports, assert, utils_1, richEditBrackets_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('richEditBrackets', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function findPrevBracketInRange(reversedBracketRegex, lineText, currentTokenStart, currentTokenEnd) {
            return richEditBrackets_1.BracketsUtils.findPrevBracketInRange(reversedBracketRegex, 1, lineText, currentTokenStart, currentTokenEnd);
        }
        function findNextBracketInRange(forwardBracketRegex, lineText, currentTokenStart, currentTokenEnd) {
            return richEditBrackets_1.BracketsUtils.findNextBracketInRange(forwardBracketRegex, 1, lineText, currentTokenStart, currentTokenEnd);
        }
        test('findPrevBracketInToken one char 1', () => {
            const result = findPrevBracketInRange(/(\{)|(\})/i, '{', 0, 1);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 2);
        });
        test('findPrevBracketInToken one char 2', () => {
            const result = findPrevBracketInRange(/(\{)|(\})/i, '{{', 0, 1);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 2);
        });
        test('findPrevBracketInToken one char 3', () => {
            const result = findPrevBracketInRange(/(\{)|(\})/i, '{hello world!', 0, 13);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 2);
        });
        test('findPrevBracketInToken more chars 1', () => {
            const result = findPrevBracketInRange(/(olleh)/i, 'hello world!', 0, 12);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 6);
        });
        test('findPrevBracketInToken more chars 2', () => {
            const result = findPrevBracketInRange(/(olleh)/i, 'hello world!', 0, 5);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 6);
        });
        test('findPrevBracketInToken more chars 3', () => {
            const result = findPrevBracketInRange(/(olleh)/i, ' hello world!', 0, 6);
            assert.strictEqual(result.startColumn, 2);
            assert.strictEqual(result.endColumn, 7);
        });
        test('findNextBracketInToken one char', () => {
            const result = findNextBracketInRange(/(\{)|(\})/i, '{', 0, 1);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 2);
        });
        test('findNextBracketInToken more chars', () => {
            const result = findNextBracketInRange(/(world)/i, 'hello world!', 0, 12);
            assert.strictEqual(result.startColumn, 7);
            assert.strictEqual(result.endColumn, 12);
        });
        test('findNextBracketInToken with emoty result', () => {
            const result = findNextBracketInRange(/(\{)|(\})/i, '', 0, 0);
            assert.strictEqual(result, null);
        });
        test('issue #3894: [Handlebars] Curly braces edit issues', () => {
            const result = findPrevBracketInRange(/(\-\-!<)|(>\-\-)|(\{\{)|(\}\})/i, '{{asd}}', 0, 2);
            assert.strictEqual(result.startColumn, 1);
            assert.strictEqual(result.endColumn, 3);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmljaEVkaXRCcmFja2V0cy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9jb21tb24vbW9kZXMvc3VwcG9ydHMvcmljaEVkaXRCcmFja2V0cy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFFOUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsc0JBQXNCLENBQUMsb0JBQTRCLEVBQUUsUUFBZ0IsRUFBRSxpQkFBeUIsRUFBRSxlQUF1QjtZQUNqSSxPQUFPLGdDQUFhLENBQUMsc0JBQXNCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUNwSCxDQUFDO1FBRUQsU0FBUyxzQkFBc0IsQ0FBQyxtQkFBMkIsRUFBRSxRQUFnQixFQUFFLGlCQUF5QixFQUFFLGVBQXVCO1lBQ2hJLE9BQU8sZ0NBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ25ILENBQUM7UUFFRCxJQUFJLENBQUMsbUNBQW1DLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sTUFBTSxHQUFHLHNCQUFzQixDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJ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