/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/list/rangeMap", "vs/base/common/range", "vs/base/test/common/utils"], function (require, exports, assert, rangeMap_1, range_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RangeMap', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('intersection', () => {
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 0 }, { start: 0, end: 0 }), { start: 0, end: 0 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 0 }, { start: 5, end: 5 }), { start: 0, end: 0 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 1 }, { start: 5, end: 6 }), { start: 0, end: 0 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 5, end: 6 }, { start: 0, end: 1 }), { start: 0, end: 0 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 5 }, { start: 2, end: 2 }), { start: 0, end: 0 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 1 }, { start: 0, end: 1 }), { start: 0, end: 1 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 10 }, { start: 0, end: 5 }), { start: 0, end: 5 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 5 }, { start: 0, end: 10 }), { start: 0, end: 5 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 10 }, { start: 5, end: 10 }), { start: 5, end: 10 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 5, end: 10 }, { start: 0, end: 10 }), { start: 5, end: 10 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 10 }, { start: 2, end: 8 }), { start: 2, end: 8 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 2, end: 8 }, { start: 0, end: 10 }), { start: 2, end: 8 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 0, end: 10 }, { start: 5, end: 15 }), { start: 5, end: 10 });
            assert.deepStrictEqual(range_1.Range.intersect({ start: 5, end: 15 }, { start: 0, end: 10 }), { start: 5, end: 10 });
        });
        test('multiIntersect', () => {
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 0, end: 0 }, [{ range: { start: 0, end: 10 }, size: 1 }]), []);
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 10, end: 20 }, [{ range: { start: 0, end: 10 }, size: 1 }]), []);
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 2, end: 8 }, [{ range: { start: 0, end: 10 }, size: 1 }]), [{ range: { start: 2, end: 8 }, size: 1 }]);
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 2, end: 8 }, [{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }]), [{ range: { start: 2, end: 8 }, size: 1 }]);
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 12, end: 18 }, [{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }]), [{ range: { start: 12, end: 18 }, size: 5 }]);
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 2, end: 18 }, [{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }]), [{ range: { start: 2, end: 10 }, size: 1 }, { range: { start: 10, end: 18 }, size: 5 }]);
            assert.deepStrictEqual((0, rangeMap_1.groupIntersect)({ start: 2, end: 28 }, [{ range: { start: 0, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }, { range: { start: 20, end: 30 }, size: 10 }]), [{ range: { start: 2, end: 10 }, size: 1 }, { range: { start: 10, end: 20 }, size: 5 }, { range: { start: 20, end: 28 }, size: 10 }]);
        });
        test('consolidate', () => {
            assert.deepStrictEqual((0, rangeMap_1.consolidate)([]), []);
            assert.deepStrictEqual((0, rangeMap_1.consolidate)([{ range: { start: 0, end: 10 }, size: 1 }]), [{ range: { start: 0, end: 10 }, size: 1 }]);
            assert.deepStrictEqual((0, rangeMap_1.consolidate)([
                { range: { start: 0, end: 10 }, size: 1 },
                { range: { start: 10, end: 20 }, size: 1 }
            ]), [{ range: { start: 0, end: 20 }, size: 1 }]);
            assert.deepStrictEqual((0, rangeMap_1.consolidate)([
                { range: { start: 0, end: 10 }, size: 1 },
                { range: { start: 10, end: 20 }, size: 1 },
                { range: { start: 20, end: 100 }, size: 1 }
            ]), [{ range: { start: 0, end: 100 }, size: 1 }]);
            assert.deepStrictEqual((0, rangeMap_1.consolidate)([
                { range: { start: 0, end: 10 }, size: 1 },
                { range: { start: 10, end: 20 }, size: 5 },
                { range: { start: 20, end: 30 }, size: 10 }
            ]), [
                { range: { start: 0, end: 10 }, size: 1 },
                { range: { start: 10, end: 20 }, size: 5 },
                { range: { start: 20, end: 30 }, size: 10 }
            ]);
            assert.deepStrictEqual((0, rangeMap_1.consolidate)([
                { range: { start: 0, end: 10 }, size: 1 },
                { range: { start: 10, end: 20 }, size: 2 },
                { range: { start: 20, end: 100 }, size: 2 }
            ]), [
                { range: { start: 0, end: 10 }, size: 1 },
                { range: { start: 10, end: 100 }, size: 2 }
            ]);
        });
        test('empty', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            assert.strictEqual(rangeMap.size, 0);
            assert.strictEqual(rangeMap.count, 0);
        });
        const one = { size: 1 };
        const two = { size: 2 };
        const three = { size: 3 };
        const five = { size: 5 };
        const ten = { size: 10 };
        test('length & count', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [one]);
            assert.strictEqual(rangeMap.size, 1);
            assert.strictEqual(rangeMap.count, 1);
        });
        test('length & count #2', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [one, one, one, one, one]);
            assert.strictEqual(rangeMap.size, 5);
            assert.strictEqual(rangeMap.count, 5);
        });
        test('length & count #3', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [five]);
            assert.strictEqual(rangeMap.size, 5);
            assert.strictEqual(rangeMap.count, 1);
        });
        test('length & count #4', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 25);
            assert.strictEqual(rangeMap.count, 5);
        });
        test('insert', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 25);
            assert.strictEqual(rangeMap.count, 5);
            rangeMap.splice(0, 0, [five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 50);
            assert.strictEqual(rangeMap.count, 10);
            rangeMap.splice(5, 0, [ten, ten]);
            assert.strictEqual(rangeMap.size, 70);
            assert.strictEqual(rangeMap.count, 12);
            rangeMap.splice(12, 0, [{ size: 200 }]);
            assert.strictEqual(rangeMap.size, 270);
            assert.strictEqual(rangeMap.count, 13);
        });
        test('delete', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [five, five, five, five, five,
                five, five, five, five, five,
                five, five, five, five, five,
                five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 100);
            assert.strictEqual(rangeMap.count, 20);
            rangeMap.splice(10, 5);
            assert.strictEqual(rangeMap.size, 75);
            assert.strictEqual(rangeMap.count, 15);
            rangeMap.splice(0, 1);
            assert.strictEqual(rangeMap.size, 70);
            assert.strictEqual(rangeMap.count, 14);
            rangeMap.splice(1, 13);
            assert.strictEqual(rangeMap.size, 5);
            assert.strictEqual(rangeMap.count, 1);
            rangeMap.splice(1, 1);
            assert.strictEqual(rangeMap.size, 5);
            assert.strictEqual(rangeMap.count, 1);
        });
        test('insert & delete', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            assert.strictEqual(rangeMap.size, 0);
            assert.strictEqual(rangeMap.count, 0);
            rangeMap.splice(0, 0, [one]);
            assert.strictEqual(rangeMap.size, 1);
            assert.strictEqual(rangeMap.count, 1);
            rangeMap.splice(0, 1);
            assert.strictEqual(rangeMap.size, 0);
            assert.strictEqual(rangeMap.count, 0);
        });
        test('insert & delete #2', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [one, one, one, one, one,
                one, one, one, one, one]);
            rangeMap.splice(2, 6);
            assert.strictEqual(rangeMap.count, 4);
            assert.strictEqual(rangeMap.size, 4);
        });
        test('insert & delete #3', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [one, one, one, one, one,
                one, one, one, one, one,
                two, two, two, two, two,
                two, two, two, two, two]);
            rangeMap.splice(8, 4);
            assert.strictEqual(rangeMap.count, 16);
            assert.strictEqual(rangeMap.size, 24);
        });
        test('insert & delete #4', () => {
            const rangeMap = new rangeMap_1.RangeMap();
            rangeMap.splice(0, 0, [one, one, one, one, one,
                one, one, one, one, one,
                two, two, two, two, two,
                two, two, two, two, two]);
            rangeMap.splice(5, 0, [three, three, three, three, three]);
            assert.strictEqual(rangeMap.count, 25);
            assert.strictEqual(rangeMap.size, 45);
            rangeMap.splice(4, 7);
            assert.strictEqual(rangeMap.count, 18);
            assert.strictEqual(rangeMap.size, 28);
        });
        suite('indexAt, positionAt', () => {
            test('empty', () => {
                const rangeMap = new rangeMap_1.RangeMap();
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(10), 0);
                assert.strictEqual(rangeMap.indexAt(-1), -1);
                assert.strictEqual(rangeMap.positionAt(0), -1);
                assert.strictEqual(rangeMap.positionAt(10), -1);
                assert.strictEqual(rangeMap.positionAt(-1), -1);
            });
            test('simple', () => {
                const rangeMap = new rangeMap_1.RangeMap();
                rangeMap.splice(0, 0, [one]);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(1), 1);
                assert.strictEqual(rangeMap.positionAt(0), 0);
                assert.strictEqual(rangeMap.positionAt(1), -1);
            });
            test('simple #2', () => {
                const rangeMap = new rangeMap_1.RangeMap();
                rangeMap.splice(0, 0, [ten]);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(5), 0);
                assert.strictEqual(rangeMap.indexAt(9), 0);
                assert.strictEqual(rangeMap.indexAt(10), 1);
                assert.strictEqual(rangeMap.positionAt(0), 0);
                assert.strictEqual(rangeMap.positionAt(1), -1);
            });
            test('insert', () => {
                const rangeMap = new rangeMap_1.RangeMap();
                rangeMap.splice(0, 0, [one, one, one, one, one, one, one, one, one, one]);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(1), 1);
                assert.strictEqual(rangeMap.indexAt(5), 5);
                assert.strictEqual(rangeMap.indexAt(9), 9);
                assert.strictEqual(rangeMap.indexAt(10), 10);
                assert.strictEqual(rangeMap.indexAt(11), 10);
                rangeMap.splice(10, 0, [one, one, one, one, one, one, one, one, one, one]);
                assert.strictEqual(rangeMap.indexAt(10), 10);
                assert.strictEqual(rangeMap.indexAt(19), 19);
                assert.strictEqual(rangeMap.indexAt(20), 20);
                assert.strictEqual(rangeMap.indexAt(21), 20);
                assert.strictEqual(rangeMap.positionAt(0), 0);
                assert.strictEqual(rangeMap.positionAt(1), 1);
                assert.strictEqual(rangeMap.positionAt(19), 19);
                assert.strictEqual(rangeMap.positionAt(20), -1);
            });
            test('delete', () => {
                const rangeMap = new rangeMap_1.RangeMap();
                rangeMap.splice(0, 0, [one, one, one, one, one, one, one, one, one, one]);
                rangeMap.splice(2, 6);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(1), 1);
                assert.strictEqual(rangeMap.indexAt(3), 3);
                assert.strictEqual(rangeMap.indexAt(4), 4);
                assert.strictEqual(rangeMap.indexAt(5), 4);
                assert.strictEqual(rangeMap.positionAt(0), 0);
                assert.strictEqual(rangeMap.positionAt(1), 1);
                assert.strictEqual(rangeMap.positionAt(3), 3);
                assert.strictEqual(rangeMap.positionAt(4), -1);
            });
            test('delete #2', () => {
                const rangeMap = new rangeMap_1.RangeMap();
                rangeMap.splice(0, 0, [ten, ten, ten, ten, ten, ten, ten, ten, ten, ten]);
                rangeMap.splice(2, 6);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(1), 0);
                assert.strictEqual(rangeMap.indexAt(30), 3);
                assert.strictEqual(rangeMap.indexAt(40), 4);
                assert.strictEqual(rangeMap.indexAt(50), 4);
                assert.strictEqual(rangeMap.positionAt(0), 0);
                assert.strictEqual(rangeMap.positionAt(1), 10);
                assert.strictEqual(rangeMap.positionAt(2), 20);
                assert.strictEqual(rangeMap.positionAt(3), 30);
                assert.strictEqual(rangeMap.positionAt(4), -1);
            });
        });
    });
    suite('RangeMap with top padding', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('empty', () => {
            const rangeMap = new rangeMap_1.RangeMap(10);
            assert.strictEqual(rangeMap.size, 10);
            assert.strictEqual(rangeMap.count, 0);
        });
        const one = { size: 1 };
        const five = { size: 5 };
        const ten = { size: 10 };
        test('length & count', () => {
            const rangeMap = new rangeMap_1.RangeMap(10);
            rangeMap.splice(0, 0, [one]);
            assert.strictEqual(rangeMap.size, 11);
            assert.strictEqual(rangeMap.count, 1);
        });
        test('length & count #2', () => {
            const rangeMap = new rangeMap_1.RangeMap(10);
            rangeMap.splice(0, 0, [one, one, one, one, one]);
            assert.strictEqual(rangeMap.size, 15);
            assert.strictEqual(rangeMap.count, 5);
        });
        test('length & count #3', () => {
            const rangeMap = new rangeMap_1.RangeMap(10);
            rangeMap.splice(0, 0, [five]);
            assert.strictEqual(rangeMap.size, 15);
            assert.strictEqual(rangeMap.count, 1);
        });
        test('length & count #4', () => {
            const rangeMap = new rangeMap_1.RangeMap(10);
            rangeMap.splice(0, 0, [five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 35);
            assert.strictEqual(rangeMap.count, 5);
        });
        test('insert', () => {
            const rangeMap = new rangeMap_1.RangeMap(10);
            rangeMap.splice(0, 0, [five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 35);
            assert.strictEqual(rangeMap.count, 5);
            rangeMap.splice(0, 0, [five, five, five, five, five]);
            assert.strictEqual(rangeMap.size, 60);
            assert.strictEqual(rangeMap.count, 10);
            rangeMap.splice(5, 0, [ten, ten]);
            assert.strictEqual(rangeMap.size, 80);
            assert.strictEqual(rangeMap.count, 12);
            rangeMap.splice(12, 0, [{ size: 200 }]);
            assert.strictEqual(rangeMap.size, 280);
            assert.strictEqual(rangeMap.count, 13);
        });
        suite('indexAt, positionAt', () => {
            test('empty', () => {
                const rangeMap = new rangeMap_1.RangeMap(10);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(10), 0);
                assert.strictEqual(rangeMap.indexAt(-1), -1);
                assert.strictEqual(rangeMap.positionAt(0), -1);
                assert.strictEqual(rangeMap.positionAt(10), -1);
                assert.strictEqual(rangeMap.positionAt(-1), -1);
            });
            test('simple', () => {
                const rangeMap = new rangeMap_1.RangeMap(10);
                rangeMap.splice(0, 0, [one]);
                assert.strictEqual(rangeMap.indexAt(0), 0);
                assert.strictEqual(rangeMap.indexAt(1), 0);
                assert.strictEqual(rangeMap.indexAt(10), 0);
                assert.strictEqual(rangeMap.indexAt(11), 1);
                assert.strictEqual(rangeMap.positionAt(0), 10);
                assert.strictEqual(rangeMap.positionAt(1), -1);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VNYXAudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS90ZXN0L2Jyb3dzZXIvdWkvbGlzdC9yYW5nZU1hcC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLEtBQUssQ0FBQyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBRXRCLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUN6QixNQUFNLENBQUMsZUFBZSxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxRyxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxRyxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzNHLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0csTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RyxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDM0csTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMzRyxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdHLE1BQU0sQ0FBQyxlQUFlLENBQUMsYUFBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDOUcsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1lBQzNCLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUEseUJBQWMsRUFDYixFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUNwQixDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQzNDLEVBQ0QsRUFBRSxDQUNGLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLHlCQUFjLEVBQ2IsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDdEIsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUMzQyxFQUNELEVBQUUsQ0FDRixDQUFDO1lBRUYsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSx5QkFBYyxFQUNiLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQ3BCLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FDM0MsRUFDRCxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQzFDLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLHlCQUFjLEVBQ2IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFDcEIsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUN2RixFQUNELENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FDMUMsQ0FBQztZQUVGLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUEseUJBQWMsRUFDYixFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUN0QixDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQ3ZGLEVBQ0QsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUM1QyxDQUFDO1lBRUYsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSx5QkFBYyxFQUNiLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQ3JCLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FDdkYsRUFDRCxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQ3ZGLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLHlCQUFjLEVBQ2IsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDckIsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUNwSSxFQUNELENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FDcEksQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7WUFDeEIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFBLHNCQUFXLEVBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFNUMsTUFBTSxDQUFDLGVBQWUsQ0FDckIsSUFBQSxzQkFBVyxFQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUN4RCxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQzNDLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLHNCQUFXLEVBQUM7Z0JBQ1gsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO2dCQUN6QyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7YUFDMUMsQ0FBQyxFQUNGLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FDM0MsQ0FBQztZQUVGLE1BQU0sQ0FBQyxlQUFlLENBQ3JCLElBQUEsc0JBQVcsRUFBQztnQkFDWCxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7Z0JBQ3pDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtnQkFDMUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO2FBQzNDLENBQUMsRUFDRixDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQzVDLENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLHNCQUFXLEVBQUM7Z0JBQ1gsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO2dCQUN6QyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7Z0JBQzFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTthQUMzQyxDQUFDLEVBQ0Y7Z0JBQ0MsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO2dCQUN6QyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7Z0JBQzFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTthQUMzQyxDQUNELENBQUM7WUFFRixNQUFNLENBQUMsZUFBZSxDQUNyQixJQUFBLHNCQUFXLEVBQUM7Z0JBQ1gsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO2dCQUN6QyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7Z0JBQzFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTthQUMzQyxDQUFDLEVBQ0Y7Z0JBQ0MsRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO2dCQUN6QyxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7YUFDM0MsQ0FDRCxDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtZQUNsQixNQUFNLFFBQVEsR0FBRyxJQUFJLG1CQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDeEIsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDeEIsTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDMUIsTUFBTSxJQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDekIsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFFekIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtZQUMzQixNQUFNLFFBQVEsR0FBRyxJQUFJLG1CQUFRLEVBQUUsQ0FBQztZQUNoQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsRUFBRSxDQUFDO1lBQ2hDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsRUFBRSxDQUFDO1lBQ2hDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7WUFDOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxFQUFFLENBQUM7WUFDaEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQ25CLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsRUFBRSxDQUFDO1lBQ2hDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV2QyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFDbkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxFQUFFLENBQUM7WUFDaEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUk7Z0JBQ2xELElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJO2dCQUM1QixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSTtnQkFDNUIsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDaEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV2QyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFdkMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV0QyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0QixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM1QixNQUFNLFFBQVEsR0FBRyxJQUFJLG1CQUFRLEVBQUUsQ0FBQztZQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV0QyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FB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RSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUV0QixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM5QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRCxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxLQUFLLENBQUMsMkJBQTJCLEVBQUUsR0FBRyxFQUFFO1FBRXZDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtZQUNsQixNQUFNLFFBQVEsR0FBRyxJQUFJLG1CQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sR0FBRyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBRXpCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7WUFDOUIsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1lBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7WUFDbkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2xDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFdEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV2QyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRXZDLFFBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUFDO1FBRUgsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUNqQyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDbEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7Z0JBQ25CLE1BQU0sUUFBUSxHQUFHLElBQUksbUJBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDbEMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQyJ9