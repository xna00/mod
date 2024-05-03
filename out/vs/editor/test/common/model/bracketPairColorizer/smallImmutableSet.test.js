/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/model/bracketPairsTextModelPart/bracketPairsTree/smallImmutableSet"], function (require, exports, assert, utils_1, smallImmutableSet_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Bracket Pair Colorizer - ImmutableSet', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('Basic', () => {
            const keyProvider = new smallImmutableSet_1.DenseKeyProvider();
            const empty = smallImmutableSet_1.SmallImmutableSet.getEmpty();
            const items1 = empty.add('item1', keyProvider);
            const items12 = items1.add('item2', keyProvider);
            const items2 = empty.add('item2', keyProvider);
            const items21 = items2.add('item1', keyProvider);
            const items3 = empty.add('item3', keyProvider);
            assert.strictEqual(items12.intersects(items1), true);
            assert.strictEqual(items12.has('item1', keyProvider), true);
            assert.strictEqual(items12.intersects(items3), false);
            assert.strictEqual(items12.has('item3', keyProvider), false);
            assert.strictEqual(items21.equals(items12), true);
            assert.strictEqual(items21.equals(items2), false);
        });
        test('Many Elements', () => {
            const keyProvider = new smallImmutableSet_1.DenseKeyProvider();
            let set = smallImmutableSet_1.SmallImmutableSet.getEmpty();
            for (let i = 0; i < 100; i++) {
                keyProvider.getKey(`item${i}`);
                if (i % 2 === 0) {
                    set = set.add(`item${i}`, keyProvider);
                }
            }
            for (let i = 0; i < 100; i++) {
                assert.strictEqual(set.has(`item${i}`, keyProvider), i % 2 === 0);
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic21hbGxJbW11dGFibGVTZXQudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL3Rlc3QvY29tbW9uL21vZGVsL2JyYWNrZXRQYWlyQ29sb3JpemVyL3NtYWxsSW1tdXRhYmxlU2V0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFNaEcsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtRQUVuRCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxvQ0FBZ0IsRUFBVSxDQUFDO1lBRW5ELE1BQU0sS0FBSyxHQUFHLHFDQUFpQixDQUFDLFFBQVEsRUFBVSxDQUFDO1lBQ25ELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRWpELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRS9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTVELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTdELE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNsRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtZQUMxQixNQUFNLFdBQVcsR0FBRyxJQUFJLG9DQUFnQixFQUFVLENBQUM7WUFFbkQsSUFBSSxHQUFHLEdBQUcscUNBQWlCLENBQUMsUUFBUSxFQUFVLENBQUM7WUFFL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUM5QixXQUFXLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNqQixHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN4QyxDQUFDO1lBQ0YsQ0FBQztZQUVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNuRSxDQUFDO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9