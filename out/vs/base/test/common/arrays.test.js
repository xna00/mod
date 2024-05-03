define(["require", "exports", "assert", "vs/base/common/arrays", "vs/base/common/arraysFind", "vs/base/test/common/utils"], function (require, exports, assert, arrays, arraysFind, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Arrays', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('removeFastWithoutKeepingOrder', () => {
            const array = [1, 4, 5, 7, 55, 59, 60, 61, 64, 69];
            arrays.removeFastWithoutKeepingOrder(array, 1);
            assert.deepStrictEqual(array, [1, 69, 5, 7, 55, 59, 60, 61, 64]);
            arrays.removeFastWithoutKeepingOrder(array, 0);
            assert.deepStrictEqual(array, [64, 69, 5, 7, 55, 59, 60, 61]);
            arrays.removeFastWithoutKeepingOrder(array, 7);
            assert.deepStrictEqual(array, [64, 69, 5, 7, 55, 59, 60]);
        });
        test('findFirst', () => {
            const array = [1, 4, 5, 7, 55, 59, 60, 61, 64, 69];
            let idx = arraysFind.findFirstIdxMonotonousOrArrLen(array, e => e >= 0);
            assert.strictEqual(array[idx], 1);
            idx = arraysFind.findFirstIdxMonotonousOrArrLen(array, e => e > 1);
            assert.strictEqual(array[idx], 4);
            idx = arraysFind.findFirstIdxMonotonousOrArrLen(array, e => e >= 8);
            assert.strictEqual(array[idx], 55);
            idx = arraysFind.findFirstIdxMonotonousOrArrLen(array, e => e >= 61);
            assert.strictEqual(array[idx], 61);
            idx = arraysFind.findFirstIdxMonotonousOrArrLen(array, e => e >= 69);
            assert.strictEqual(array[idx], 69);
            idx = arraysFind.findFirstIdxMonotonousOrArrLen(array, e => e >= 70);
            assert.strictEqual(idx, array.length);
            idx = arraysFind.findFirstIdxMonotonousOrArrLen([], e => e >= 0);
            assert.strictEqual(array[idx], 1);
        });
        test('quickSelect', () => {
            function assertMedian(expexted, data, nth = Math.floor(data.length / 2)) {
                const compare = (a, b) => a - b;
                const actual1 = arrays.quickSelect(nth, data, compare);
                assert.strictEqual(actual1, expexted);
                const actual2 = data.slice().sort(compare)[nth];
                assert.strictEqual(actual2, expexted);
            }
            assertMedian(5, [9, 1, 0, 2, 3, 4, 6, 8, 7, 10, 5]);
            assertMedian(8, [9, 1, 0, 2, 3, 4, 6, 8, 7, 10, 5], 8);
            assertMedian(8, [13, 4, 8]);
            assertMedian(4, [13, 4, 8, 4, 4]);
            assertMedian(13, [13, 4, 8], 2);
        });
        test('sortedDiff', () => {
            function compare(a, b) {
                return a - b;
            }
            let d = arrays.sortedDiff([1, 2, 4], [], compare);
            assert.deepStrictEqual(d, [
                { start: 0, deleteCount: 3, toInsert: [] }
            ]);
            d = arrays.sortedDiff([], [1, 2, 4], compare);
            assert.deepStrictEqual(d, [
                { start: 0, deleteCount: 0, toInsert: [1, 2, 4] }
            ]);
            d = arrays.sortedDiff([1, 2, 4], [1, 2, 4], compare);
            assert.deepStrictEqual(d, []);
            d = arrays.sortedDiff([1, 2, 4], [2, 3, 4, 5], compare);
            assert.deepStrictEqual(d, [
                { start: 0, deleteCount: 1, toInsert: [] },
                { start: 2, deleteCount: 0, toInsert: [3] },
                { start: 3, deleteCount: 0, toInsert: [5] },
            ]);
            d = arrays.sortedDiff([2, 3, 4, 5], [1, 2, 4], compare);
            assert.deepStrictEqual(d, [
                { start: 0, deleteCount: 0, toInsert: [1] },
                { start: 1, deleteCount: 1, toInsert: [] },
                { start: 3, deleteCount: 1, toInsert: [] },
            ]);
            d = arrays.sortedDiff([1, 3, 5, 7], [5, 9, 11], compare);
            assert.deepStrictEqual(d, [
                { start: 0, deleteCount: 2, toInsert: [] },
                { start: 3, deleteCount: 1, toInsert: [9, 11] }
            ]);
            d = arrays.sortedDiff([1, 3, 7], [5, 9, 11], compare);
            assert.deepStrictEqual(d, [
                { start: 0, deleteCount: 3, toInsert: [5, 9, 11] }
            ]);
        });
        test('delta sorted arrays', function () {
            function compare(a, b) {
                return a - b;
            }
            let d = arrays.delta([1, 2, 4], [], compare);
            assert.deepStrictEqual(d.removed, [1, 2, 4]);
            assert.deepStrictEqual(d.added, []);
            d = arrays.delta([], [1, 2, 4], compare);
            assert.deepStrictEqual(d.removed, []);
            assert.deepStrictEqual(d.added, [1, 2, 4]);
            d = arrays.delta([1, 2, 4], [1, 2, 4], compare);
            assert.deepStrictEqual(d.removed, []);
            assert.deepStrictEqual(d.added, []);
            d = arrays.delta([1, 2, 4], [2, 3, 4, 5], compare);
            assert.deepStrictEqual(d.removed, [1]);
            assert.deepStrictEqual(d.added, [3, 5]);
            d = arrays.delta([2, 3, 4, 5], [1, 2, 4], compare);
            assert.deepStrictEqual(d.removed, [3, 5]);
            assert.deepStrictEqual(d.added, [1]);
            d = arrays.delta([1, 3, 5, 7], [5, 9, 11], compare);
            assert.deepStrictEqual(d.removed, [1, 3, 7]);
            assert.deepStrictEqual(d.added, [9, 11]);
            d = arrays.delta([1, 3, 7], [5, 9, 11], compare);
            assert.deepStrictEqual(d.removed, [1, 3, 7]);
            assert.deepStrictEqual(d.added, [5, 9, 11]);
        });
        test('binarySearch', () => {
            function compare(a, b) {
                return a - b;
            }
            const array = [1, 4, 5, 7, 55, 59, 60, 61, 64, 69];
            assert.strictEqual(arrays.binarySearch(array, 1, compare), 0);
            assert.strictEqual(arrays.binarySearch(array, 5, compare), 2);
            // insertion point
            assert.strictEqual(arrays.binarySearch(array, 0, compare), ~0);
            assert.strictEqual(arrays.binarySearch(array, 6, compare), ~3);
            assert.strictEqual(arrays.binarySearch(array, 70, compare), ~10);
        });
        test('binarySearch2', () => {
            function compareTo(key) {
                return (index) => {
                    return array[index] - key;
                };
            }
            const array = [1, 4, 5, 7, 55, 59, 60, 61, 64, 69];
            assert.strictEqual(arrays.binarySearch2(10, compareTo(1)), 0);
            assert.strictEqual(arrays.binarySearch2(10, compareTo(5)), 2);
            // insertion point
            assert.strictEqual(arrays.binarySearch2(10, compareTo(0)), ~0);
            assert.strictEqual(arrays.binarySearch2(10, compareTo(6)), ~3);
            assert.strictEqual(arrays.binarySearch2(10, compareTo(70)), ~10);
            assert.strictEqual(arrays.binarySearch2(2, compareTo(5)), ~2);
        });
        test('distinct', () => {
            function compare(a) {
                return a;
            }
            assert.deepStrictEqual(arrays.distinct(['32', '4', '5'], compare), ['32', '4', '5']);
            assert.deepStrictEqual(arrays.distinct(['32', '4', '5', '4'], compare), ['32', '4', '5']);
            assert.deepStrictEqual(arrays.distinct(['32', 'constructor', '5', '1'], compare), ['32', 'constructor', '5', '1']);
            assert.deepStrictEqual(arrays.distinct(['32', 'constructor', 'proto', 'proto', 'constructor'], compare), ['32', 'constructor', 'proto']);
            assert.deepStrictEqual(arrays.distinct(['32', '4', '5', '32', '4', '5', '32', '4', '5', '5'], compare), ['32', '4', '5']);
        });
        test('top', () => {
            const cmp = (a, b) => {
                assert.strictEqual(typeof a, 'number', 'typeof a');
                assert.strictEqual(typeof b, 'number', 'typeof b');
                return a - b;
            };
            assert.deepStrictEqual(arrays.top([], cmp, 1), []);
            assert.deepStrictEqual(arrays.top([1], cmp, 0), []);
            assert.deepStrictEqual(arrays.top([1, 2], cmp, 1), [1]);
            assert.deepStrictEqual(arrays.top([2, 1], cmp, 1), [1]);
            assert.deepStrictEqual(arrays.top([1, 3, 2], cmp, 2), [1, 2]);
            assert.deepStrictEqual(arrays.top([3, 2, 1], cmp, 3), [1, 2, 3]);
            assert.deepStrictEqual(arrays.top([4, 6, 2, 7, 8, 3, 5, 1], cmp, 3), [1, 2, 3]);
        });
        test('topAsync', async () => {
            const cmp = (a, b) => {
                assert.strictEqual(typeof a, 'number', 'typeof a');
                assert.strictEqual(typeof b, 'number', 'typeof b');
                return a - b;
            };
            await testTopAsync(cmp, 1);
            return testTopAsync(cmp, 2);
        });
        async function testTopAsync(cmp, m) {
            {
                const result = await arrays.topAsync([], cmp, 1, m);
                assert.deepStrictEqual(result, []);
            }
            {
                const result = await arrays.topAsync([1], cmp, 0, m);
                assert.deepStrictEqual(result, []);
            }
            {
                const result = await arrays.topAsync([1, 2], cmp, 1, m);
                assert.deepStrictEqual(result, [1]);
            }
            {
                const result = await arrays.topAsync([2, 1], cmp, 1, m);
                assert.deepStrictEqual(result, [1]);
            }
            {
                const result = await arrays.topAsync([1, 3, 2], cmp, 2, m);
                assert.deepStrictEqual(result, [1, 2]);
            }
            {
                const result = await arrays.topAsync([3, 2, 1], cmp, 3, m);
                assert.deepStrictEqual(result, [1, 2, 3]);
            }
            {
                const result = await arrays.topAsync([4, 6, 2, 7, 8, 3, 5, 1], cmp, 3, m);
                assert.deepStrictEqual(result, [1, 2, 3]);
            }
        }
        test('coalesce', () => {
            const a = arrays.coalesce([null, 1, null, 2, 3]);
            assert.strictEqual(a.length, 3);
            assert.strictEqual(a[0], 1);
            assert.strictEqual(a[1], 2);
            assert.strictEqual(a[2], 3);
            arrays.coalesce([null, 1, null, undefined, undefined, 2, 3]);
            assert.strictEqual(a.length, 3);
            assert.strictEqual(a[0], 1);
            assert.strictEqual(a[1], 2);
            assert.strictEqual(a[2], 3);
            let b = [];
            b[10] = 1;
            b[20] = 2;
            b[30] = 3;
            b = arrays.coalesce(b);
            assert.strictEqual(b.length, 3);
            assert.strictEqual(b[0], 1);
            assert.strictEqual(b[1], 2);
            assert.strictEqual(b[2], 3);
            let sparse = [];
            sparse[0] = 1;
            sparse[1] = 1;
            sparse[17] = 1;
            sparse[1000] = 1;
            sparse[1001] = 1;
            assert.strictEqual(sparse.length, 1002);
            sparse = arrays.coalesce(sparse);
            assert.strictEqual(sparse.length, 5);
        });
        test('coalesce - inplace', function () {
            let a = [null, 1, null, 2, 3];
            arrays.coalesceInPlace(a);
            assert.strictEqual(a.length, 3);
            assert.strictEqual(a[0], 1);
            assert.strictEqual(a[1], 2);
            assert.strictEqual(a[2], 3);
            a = [null, 1, null, undefined, undefined, 2, 3];
            arrays.coalesceInPlace(a);
            assert.strictEqual(a.length, 3);
            assert.strictEqual(a[0], 1);
            assert.strictEqual(a[1], 2);
            assert.strictEqual(a[2], 3);
            const b = [];
            b[10] = 1;
            b[20] = 2;
            b[30] = 3;
            arrays.coalesceInPlace(b);
            assert.strictEqual(b.length, 3);
            assert.strictEqual(b[0], 1);
            assert.strictEqual(b[1], 2);
            assert.strictEqual(b[2], 3);
            const sparse = [];
            sparse[0] = 1;
            sparse[1] = 1;
            sparse[17] = 1;
            sparse[1000] = 1;
            sparse[1001] = 1;
            assert.strictEqual(sparse.length, 1002);
            arrays.coalesceInPlace(sparse);
            assert.strictEqual(sparse.length, 5);
        });
        test('insert, remove', function () {
            const array = [];
            const remove = arrays.insert(array, 'foo');
            assert.strictEqual(array[0], 'foo');
            remove();
            assert.strictEqual(array.length, 0);
        });
        test('splice', function () {
            // negative start index, absolute value greater than the length
            let array = [1, 2, 3, 4, 5];
            arrays.splice(array, -6, 3, [6, 7]);
            assert.strictEqual(array.length, 4);
            assert.strictEqual(array[0], 6);
            assert.strictEqual(array[1], 7);
            assert.strictEqual(array[2], 4);
            assert.strictEqual(array[3], 5);
            // negative start index, absolute value less than the length
            array = [1, 2, 3, 4, 5];
            arrays.splice(array, -3, 3, [6, 7]);
            assert.strictEqual(array.length, 4);
            assert.strictEqual(array[0], 1);
            assert.strictEqual(array[1], 2);
            assert.strictEqual(array[2], 6);
            assert.strictEqual(array[3], 7);
            // Start index less than the length
            array = [1, 2, 3, 4, 5];
            arrays.splice(array, 3, 3, [6, 7]);
            assert.strictEqual(array.length, 5);
            assert.strictEqual(array[0], 1);
            assert.strictEqual(array[1], 2);
            assert.strictEqual(array[2], 3);
            assert.strictEqual(array[3], 6);
            assert.strictEqual(array[4], 7);
            // Start index greater than the length
            array = [1, 2, 3, 4, 5];
            arrays.splice(array, 6, 3, [6, 7]);
            assert.strictEqual(array.length, 7);
            assert.strictEqual(array[0], 1);
            assert.strictEqual(array[1], 2);
            assert.strictEqual(array[2], 3);
            assert.strictEqual(array[3], 4);
            assert.strictEqual(array[4], 5);
            assert.strictEqual(array[5], 6);
            assert.strictEqual(array[6], 7);
        });
        test('findMaxBy', () => {
            const array = [{ v: 3 }, { v: 5 }, { v: 2 }, { v: 2 }, { v: 2 }, { v: 5 }];
            assert.strictEqual(array.indexOf(arraysFind.findFirstMaxBy(array, arrays.compareBy(v => v.v, arrays.numberComparator))), 1);
        });
        test('findLastMaxBy', () => {
            const array = [{ v: 3 }, { v: 5 }, { v: 2 }, { v: 2 }, { v: 2 }, { v: 5 }];
            assert.strictEqual(array.indexOf(arraysFind.findLastMaxBy(array, arrays.compareBy(v => v.v, arrays.numberComparator))), 5);
        });
        test('findMinBy', () => {
            const array = [{ v: 3 }, { v: 5 }, { v: 2 }, { v: 2 }, { v: 2 }, { v: 5 }];
            assert.strictEqual(array.indexOf(arraysFind.findFirstMinBy(array, arrays.compareBy(v => v.v, arrays.numberComparator))), 2);
        });
        suite('ArrayQueue', () => {
            suite('takeWhile/takeFromEndWhile', () => {
                test('TakeWhile 1', () => {
                    const queue1 = new arrays.ArrayQueue([9, 8, 1, 7, 6]);
                    assert.deepStrictEqual(queue1.takeWhile(x => x > 5), [9, 8]);
                    assert.deepStrictEqual(queue1.takeWhile(x => x < 7), [1]);
                    assert.deepStrictEqual(queue1.takeWhile(x => true), [7, 6]);
                });
                test('TakeFromEndWhile 1', () => {
                    const queue1 = new arrays.ArrayQueue([9, 8, 1, 7, 6]);
                    assert.deepStrictEqual(queue1.takeFromEndWhile(x => x > 5), [7, 6]);
                    assert.deepStrictEqual(queue1.takeFromEndWhile(x => x < 2), [1]);
                    assert.deepStrictEqual(queue1.takeFromEndWhile(x => true), [9, 8]);
                });
            });
            suite('takeWhile/takeFromEndWhile monotonous', () => {
                function testMonotonous(array, predicate) {
                    function normalize(arr) {
                        if (arr.length === 0) {
                            return null;
                        }
                        return arr;
                    }
                    const negatedPredicate = (a) => !predicate(a);
                    {
                        const queue1 = new arrays.ArrayQueue(array);
                        assert.deepStrictEqual(queue1.takeWhile(predicate), normalize(array.filter(predicate)));
                        assert.deepStrictEqual(queue1.length, array.length - array.filter(predicate).length);
                        assert.deepStrictEqual(queue1.takeWhile(() => true), normalize(array.filter(negatedPredicate)));
                    }
                    {
                        const queue3 = new arrays.ArrayQueue(array);
                        assert.deepStrictEqual(queue3.takeFromEndWhile(negatedPredicate), normalize(array.filter(negatedPredicate)));
                        assert.deepStrictEqual(queue3.length, array.length - array.filter(negatedPredicate).length);
                        assert.deepStrictEqual(queue3.takeFromEndWhile(() => true), normalize(array.filter(predicate)));
                    }
                }
                const array = [1, 1, 1, 2, 5, 5, 7, 8, 8];
                test('TakeWhile 1', () => testMonotonous(array, value => value <= 1));
                test('TakeWhile 2', () => testMonotonous(array, value => value < 5));
                test('TakeWhile 3', () => testMonotonous(array, value => value <= 5));
                test('TakeWhile 4', () => testMonotonous(array, value => true));
                test('TakeWhile 5', () => testMonotonous(array, value => false));
                const array2 = [1, 1, 1, 2, 5, 5, 7, 8, 8, 9, 9, 9, 9, 10, 10];
                test('TakeWhile 6', () => testMonotonous(array2, value => value < 10));
                test('TakeWhile 7', () => testMonotonous(array2, value => value < 7));
                test('TakeWhile 8', () => testMonotonous(array2, value => value < 5));
                test('TakeWhile Empty', () => testMonotonous([], value => value <= 5));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXlzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvdGVzdC9jb21tb24vYXJyYXlzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0lBU0EsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFFcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpFLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU5RCxNQUFNLENBQUMsNkJBQTZCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9DLE1BQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1lBQ3RCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFbkQsSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN4RSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVsQyxHQUFHLEdBQUcsVUFBVSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNuRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVsQyxHQUFHLEdBQUcsVUFBVSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVuQyxHQUFHLEdBQUcsVUFBVSxDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNyRSxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVu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TSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0IsTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLEVBQUU7Z0JBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRCxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2QsQ0FBQyxDQUFDO1lBRUYsTUFBTSxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzNCLE9BQU8sWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssVUFBVSxZQUFZLENBQUMsR0FBUSxFQUFFLENBQVM7WUFDOUMsQ0FBQztnQkFDQSxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFDRCxDQUFDO2dCQUNBLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLENBQUM7WUFDRCxDQUFDO2dCQUNBLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUNELENBQUM7Z0JBQ0EsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELE1BQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUNELENBQUM7Z0JBQ0EsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxDQUFDO1lBQ0QsQ0FBQztnQkFDQSxNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDMUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsQ0FBQztRQUNGLENBQUM7UUFFRCxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtZQUNyQixNQUFNLENBQUMsR0FBeUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1QixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFNUIsSUFBSSxDQUFDLEdBQWEsRUFBRSxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLENBQUMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1QixJQUFJLE1BQU0sR0FBYSxFQUFFLENBQUM7WUFDMUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRWpCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV4QyxNQUFNLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDMUIsSUFBSSxDQUFDLEdBQXlCLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVUsRUFBRSxTQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTVCLE1BQU0sQ0FBQyxHQUFhLEVBQUUsQ0FBQztZQUN2QixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNWLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUU1QixNQUFNLE1BQU0sR0FBYSxFQUFFLENBQUM7WUFDNUIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDZCxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRWpCLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV4QyxNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUN0QixNQUFNLEtBQUssR0FBYSxFQUFFLENBQUM7WUFDM0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFcEMsTUFBTSxFQUFFLENBQUM7WUFDVCxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2QsK0RBQStEO1lBQy9ELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVCLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoQyw0REFBNEQ7WUFDNUQsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUVoQyxtQ0FBbUM7WUFDbkMsS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFaEMsc0NBQXNDO1lBQ3RDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QixNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7WUFDdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLENBQ2pCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUUsQ0FBQyxFQUNyRyxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7WUFDMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLENBQ2pCLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUUsQ0FBQyxFQUNwRyxDQUFDLENBQ0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7WUFDdEIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRTNFLE1BQU0sQ0FBQyxXQUFXLENB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