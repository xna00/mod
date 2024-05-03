/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/length"], function (require, exports, assert, utils_1, length_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Bracket Pair Colorizer - Length', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function toStr(length) {
            return (0, length_1.lengthToObj)(length).toString();
        }
        test('Basic', () => {
            const l1 = (0, length_1.toLength)(100, 10);
            assert.strictEqual((0, length_1.lengthToObj)(l1).lineCount, 100);
            assert.strictEqual((0, length_1.lengthToObj)(l1).columnCount, 10);
            assert.deepStrictEqual(toStr((0, length_1.lengthAdd)(l1, (0, length_1.toLength)(100, 10))), '200,10');
            assert.deepStrictEqual(toStr((0, length_1.lengthAdd)(l1, (0, length_1.toLength)(0, 10))), '100,20');
        });
        test('lengthDiffNonNeg', () => {
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(100, 10), (0, length_1.toLength)(100, 20))), '0,10');
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(100, 10), (0, length_1.toLength)(101, 20))), '1,20');
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(101, 30), (0, length_1.toLength)(101, 20))), '0,0');
            assert.deepStrictEqual(toStr((0, length_1.lengthDiffNonNegative)((0, length_1.toLength)(102, 10), (0, length_1.toLength)(101, 20))), '0,0');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVuZ3RoLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9icmFja2V0UGFpckNvbG9yaXplci9sZW5ndGgudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsR0FBRyxFQUFFO1FBRTdDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxTQUFTLEtBQUssQ0FBQyxNQUFjO1lBQzVCLE9BQU8sSUFBQSxvQkFBVyxFQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtZQUNsQixNQUFNLEVBQUUsR0FBRyxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxvQkFBVyxFQUFDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEsb0JBQVcsRUFBQyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFcEQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBQSxrQkFBUyxFQUFDLEVBQUUsRUFBRSxJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxRSxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFBLGtCQUFTLEVBQUMsRUFBRSxFQUFFLElBQUEsaUJBQVEsRUFBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtZQUM3QixNQUFNLENBQUMsZUFBZSxDQUNyQixLQUFLLENBQ0osSUFBQSw4QkFBcUIsRUFDcEIsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFDakIsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUNuQixFQUNELE1BQU0sQ0FDTixDQUFDO1lBRUYsTUFBTSxDQUFDLGVBQWUsQ0FDckIsS0FBSyxDQUNKLElBQUEsOEJBQXFCLEVBQ3BCLElBQUEsaUJBQVEsRUFBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQ2pCLElBQUEsaUJBQVEsRUFBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FDbkIsRUFDRCxNQUFNLENBQ04sQ0FBQztZQUVGLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLEtBQUssQ0FDSixJQUFBLDhCQUFxQixFQUNwQixJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUNqQixJQUFBLGlCQUFRLEVBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQ25CLEVBQ0QsS0FBSyxDQUNMLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixLQUFLLENBQ0osSUFBQSw4QkFBcUIsRUFDcEIsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFDakIsSUFBQSxpQkFBUSxFQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUNuQixFQUNELEtBQUssQ0FDTCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9