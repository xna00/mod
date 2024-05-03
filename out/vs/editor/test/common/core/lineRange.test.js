/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/lineRange"], function (require, exports, assert, utils_1, lineRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('LineRange', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('contains', () => {
            const r = new lineRange_1.LineRange(2, 3);
            assert.deepStrictEqual(r.contains(1), false);
            assert.deepStrictEqual(r.contains(2), true);
            assert.deepStrictEqual(r.contains(3), false);
            assert.deepStrictEqual(r.contains(4), false);
        });
    });
    suite('LineRangeSet', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('addRange', () => {
            const set = new lineRange_1.LineRangeSet();
            set.addRange(new lineRange_1.LineRange(2, 3));
            set.addRange(new lineRange_1.LineRange(3, 4));
            set.addRange(new lineRange_1.LineRange(10, 20));
            assert.deepStrictEqual(set.toString(), '[2,4), [10,20)');
            set.addRange(new lineRange_1.LineRange(3, 21));
            assert.deepStrictEqual(set.toString(), '[2,21)');
        });
        test('getUnion', () => {
            const set1 = new lineRange_1.LineRangeSet([
                new lineRange_1.LineRange(2, 3),
                new lineRange_1.LineRange(5, 7),
                new lineRange_1.LineRange(10, 20)
            ]);
            const set2 = new lineRange_1.LineRangeSet([
                new lineRange_1.LineRange(3, 4),
                new lineRange_1.LineRange(6, 8),
                new lineRange_1.LineRange(9, 11)
            ]);
            const union = set1.getUnion(set2);
            assert.deepStrictEqual(union.toString(), '[2,4), [5,8), [9,20)');
        });
        test('intersects', () => {
            const set1 = new lineRange_1.LineRangeSet([
                new lineRange_1.LineRange(2, 3),
                new lineRange_1.LineRange(5, 7),
                new lineRange_1.LineRange(10, 20)
            ]);
            assert.deepStrictEqual(set1.intersects(new lineRange_1.LineRange(1, 2)), false);
            assert.deepStrictEqual(set1.intersects(new lineRange_1.LineRange(1, 3)), true);
            assert.deepStrictEqual(set1.intersects(new lineRange_1.LineRange(3, 5)), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluZVJhbmdlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9jb3JlL2xpbmVSYW5nZS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBTWhHLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBRXZCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNyQixNQUFNLENBQUMsR0FBRyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLGNBQWMsRUFBRSxHQUFHLEVBQUU7UUFFMUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLE1BQU0sR0FBRyxHQUFHLElBQUksd0JBQVksRUFBRSxDQUFDO1lBQy9CLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxxQkFBUyxDQUFD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