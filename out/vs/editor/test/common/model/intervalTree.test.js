/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/model/intervalTree"], function (require, exports, assert, utils_1, intervalTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const GENERATE_TESTS = false;
    const TEST_COUNT = GENERATE_TESTS ? 10000 : 0;
    const PRINT_TREE = false;
    const MIN_INTERVAL_START = 1;
    const MAX_INTERVAL_END = 100;
    const MIN_INSERTS = 1;
    const MAX_INSERTS = 30;
    const MIN_CHANGE_CNT = 10;
    const MAX_CHANGE_CNT = 20;
    suite('IntervalTree 1', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class Interval {
            constructor(start, end) {
                this._intervalBrand = undefined;
                this.start = start;
                this.end = end;
            }
        }
        class Oracle {
            constructor() {
                this.intervals = [];
            }
            insert(interval) {
                this.intervals.push(interval);
                this.intervals.sort((a, b) => {
                    if (a.start === b.start) {
                        return a.end - b.end;
                    }
                    return a.start - b.start;
                });
                return interval;
            }
            delete(interval) {
                for (let i = 0, len = this.intervals.length; i < len; i++) {
                    if (this.intervals[i] === interval) {
                        this.intervals.splice(i, 1);
                        return;
                    }
                }
            }
            search(interval) {
                const result = [];
                for (let i = 0, len = this.intervals.length; i < len; i++) {
                    const int = this.intervals[i];
                    if (int.start <= interval.end && int.end >= interval.start) {
                        result.push(int);
                    }
                }
                return result;
            }
        }
        class TestState {
            constructor() {
                this._oracle = new Oracle();
                this._tree = new intervalTree_1.IntervalTree();
                this._lastNodeId = -1;
                this._treeNodes = [];
                this._oracleNodes = [];
            }
            acceptOp(op) {
                if (op.type === 'insert') {
                    if (PRINT_TREE) {
                        console.log(`insert: {${JSON.stringify(new Interval(op.begin, op.end))}}`);
                    }
                    const nodeId = (++this._lastNodeId);
                    this._treeNodes[nodeId] = new intervalTree_1.IntervalNode(null, op.begin, op.end);
                    this._tree.insert(this._treeNodes[nodeId]);
                    this._oracleNodes[nodeId] = this._oracle.insert(new Interval(op.begin, op.end));
                }
                else if (op.type === 'delete') {
                    if (PRINT_TREE) {
                        console.log(`delete: {${JSON.stringify(this._oracleNodes[op.id])}}`);
                    }
                    this._tree.delete(this._treeNodes[op.id]);
                    this._oracle.delete(this._oracleNodes[op.id]);
                    this._treeNodes[op.id] = null;
                    this._oracleNodes[op.id] = null;
                }
                else if (op.type === 'change') {
                    this._tree.delete(this._treeNodes[op.id]);
                    this._treeNodes[op.id].reset(0, op.begin, op.end, null);
                    this._tree.insert(this._treeNodes[op.id]);
                    this._oracle.delete(this._oracleNodes[op.id]);
                    this._oracleNodes[op.id].start = op.begin;
                    this._oracleNodes[op.id].end = op.end;
                    this._oracle.insert(this._oracleNodes[op.id]);
                }
                else {
                    const actualNodes = this._tree.intervalSearch(op.begin, op.end, 0, false, 0, false);
                    const actual = actualNodes.map(n => new Interval(n.cachedAbsoluteStart, n.cachedAbsoluteEnd));
                    const expected = this._oracle.search(new Interval(op.begin, op.end));
                    assert.deepStrictEqual(actual, expected);
                    return;
                }
                if (PRINT_TREE) {
                    printTree(this._tree);
                }
                assertTreeInvariants(this._tree);
                const actual = this._tree.getAllInOrder().map(n => new Interval(n.cachedAbsoluteStart, n.cachedAbsoluteEnd));
                const expected = this._oracle.intervals;
                assert.deepStrictEqual(actual, expected);
            }
            getExistingNodeId(index) {
                let currIndex = -1;
                for (let i = 0; i < this._treeNodes.length; i++) {
                    if (this._treeNodes[i] === null) {
                        continue;
                    }
                    currIndex++;
                    if (currIndex === index) {
                        return i;
                    }
                }
                throw new Error('unexpected');
            }
        }
        function testIntervalTree(ops) {
            const state = new TestState();
            for (let i = 0; i < ops.length; i++) {
                state.acceptOp(ops[i]);
            }
        }
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        function getRandomRange(min, max) {
            const begin = getRandomInt(min, max);
            let length;
            if (getRandomInt(1, 10) <= 2) {
                // large range
                length = getRandomInt(0, max - begin);
            }
            else {
                // small range
                length = getRandomInt(0, Math.min(max - begin, 10));
            }
            return [begin, begin + length];
        }
        class AutoTest {
            constructor() {
                this._ops = [];
                this._state = new TestState();
                this._insertCnt = getRandomInt(MIN_INSERTS, MAX_INSERTS);
                this._changeCnt = getRandomInt(MIN_CHANGE_CNT, MAX_CHANGE_CNT);
                this._deleteCnt = 0;
            }
            _doRandomInsert() {
                const range = getRandomRange(MIN_INTERVAL_START, MAX_INTERVAL_END);
                this._run({
                    type: 'insert',
                    begin: range[0],
                    end: range[1]
                });
            }
            _doRandomDelete() {
                const idx = getRandomInt(Math.floor(this._deleteCnt / 2), this._deleteCnt - 1);
                this._run({
                    type: 'delete',
                    id: this._state.getExistingNodeId(idx)
                });
            }
            _doRandomChange() {
                const idx = getRandomInt(0, this._deleteCnt - 1);
                const range = getRandomRange(MIN_INTERVAL_START, MAX_INTERVAL_END);
                this._run({
                    type: 'change',
                    id: this._state.getExistingNodeId(idx),
                    begin: range[0],
                    end: range[1]
                });
            }
            run() {
                while (this._insertCnt > 0 || this._deleteCnt > 0 || this._changeCnt > 0) {
                    if (this._insertCnt > 0) {
                        this._doRandomInsert();
                        this._insertCnt--;
                        this._deleteCnt++;
                    }
                    else if (this._changeCnt > 0) {
                        this._doRandomChange();
                        this._changeCnt--;
                    }
                    else {
                        this._doRandomDelete();
                        this._deleteCnt--;
                    }
                    // Let's also search for something...
                    const searchRange = getRandomRange(MIN_INTERVAL_START, MAX_INTERVAL_END);
                    this._run({
                        type: 'search',
                        begin: searchRange[0],
                        end: searchRange[1]
                    });
                }
            }
            _run(op) {
                this._ops.push(op);
                this._state.acceptOp(op);
            }
            print() {
                console.log(`testIntervalTree(${JSON.stringify(this._ops)})`);
            }
        }
        suite('generated', () => {
            test('gen01', () => {
                testIntervalTree([
                    { type: 'insert', begin: 28, end: 35 },
                    { type: 'insert', begin: 52, end: 54 },
                    { type: 'insert', begin: 63, end: 69 }
                ]);
            });
            test('gen02', () => {
                testIntervalTree([
                    { type: 'insert', begin: 80, end: 89 },
                    { type: 'insert', begin: 92, end: 100 },
                    { type: 'insert', begin: 99, end: 99 }
                ]);
            });
            test('gen03', () => {
                testIntervalTree([
                    { type: 'insert', begin: 89, end: 96 },
                    { type: 'insert', begin: 71, end: 74 },
                    { type: 'delete', id: 1 }
                ]);
            });
            test('gen04', () => {
                testIntervalTree([
                    { type: 'insert', begin: 44, end: 46 },
                    { type: 'insert', begin: 85, end: 88 },
                    { type: 'delete', id: 0 }
                ]);
            });
            test('gen05', () => {
                testIntervalTree([
                    { type: 'insert', begin: 82, end: 90 },
                    { type: 'insert', begin: 69, end: 73 },
                    { type: 'delete', id: 0 },
                    { type: 'delete', id: 1 }
                ]);
            });
            test('gen06', () => {
                testIntervalTree([
                    { type: 'insert', begin: 41, end: 63 },
                    { type: 'insert', begin: 98, end: 98 },
                    { type: 'insert', begin: 47, end: 51 },
                    { type: 'delete', id: 2 }
                ]);
            });
            test('gen07', () => {
                testIntervalTree([
                    { type: 'insert', begin: 24, end: 26 },
                    { type: 'insert', begin: 11, end: 28 },
                    { type: 'insert', begin: 27, end: 30 },
                    { type: 'insert', begin: 80, end: 85 },
                    { type: 'delete', id: 1 }
                ]);
            });
            test('gen08', () => {
                testIntervalTree([
                    { type: 'insert', begin: 100, end: 100 },
                    { type: 'insert', begin: 100, end: 100 }
                ]);
            });
            test('gen09', () => {
                testIntervalTree([
                    { type: 'insert', begin: 58, end: 65 },
                    { type: 'insert', begin: 82, end: 96 },
                    { type: 'insert', begin: 58, end: 65 }
                ]);
            });
            test('gen10', () => {
                testIntervalTree([
                    { type: 'insert', begin: 32, end: 40 },
                    { type: 'insert', begin: 25, end: 29 },
                    { type: 'insert', begin: 24, end: 32 }
                ]);
            });
            test('gen11', () => {
                testIntervalTree([
                    { type: 'insert', begin: 25, end: 70 },
                    { type: 'insert', begin: 99, end: 100 },
                    { type: 'insert', begin: 46, end: 51 },
                    { type: 'insert', begin: 57, end: 57 },
                    { type: 'delete', id: 2 }
                ]);
            });
            test('gen12', () => {
                testIntervalTree([
                    { type: 'insert', begin: 20, end: 26 },
                    { type: 'insert', begin: 10, end: 18 },
                    { type: 'insert', begin: 99, end: 99 },
                    { type: 'insert', begin: 37, end: 59 },
                    { type: 'delete', id: 2 }
                ]);
            });
            test('gen13', () => {
                testIntervalTree([
                    { type: 'insert', begin: 3, end: 91 },
                    { type: 'insert', begin: 57, end: 57 },
                    { type: 'insert', begin: 35, end: 44 },
                    { type: 'insert', begin: 72, end: 81 },
                    { type: 'delete', id: 2 }
                ]);
            });
            test('gen14', () => {
                testIntervalTree([
                    { type: 'insert', begin: 58, end: 61 },
                    { type: 'insert', begin: 34, end: 35 },
                    { type: 'insert', begin: 56, end: 62 },
                    { type: 'insert', begin: 69, end: 78 },
                    { type: 'delete', id: 0 }
                ]);
            });
            test('gen15', () => {
                testIntervalTree([
                    { type: 'insert', begin: 63, end: 69 },
                    { type: 'insert', begin: 17, end: 24 },
                    { type: 'insert', begin: 3, end: 13 },
                    { type: 'insert', begin: 84, end: 94 },
                    { type: 'insert', begin: 18, end: 23 },
                    { type: 'insert', begin: 96, end: 98 },
                    { type: 'delete', id: 1 }
                ]);
            });
            test('gen16', () => {
                testIntervalTree([
                    { type: 'insert', begin: 27, end: 27 },
                    { type: 'insert', begin: 42, end: 87 },
                    { type: 'insert', begin: 42, end: 49 },
                    { type: 'insert', begin: 69, end: 71 },
                    { type: 'insert', begin: 20, end: 27 },
                    { type: 'insert', begin: 8, end: 9 },
                    { type: 'insert', begin: 42, end: 49 },
                    { type: 'delete', id: 1 }
                ]);
            });
            test('gen17', () => {
                testIntervalTree([
                    { type: 'insert', begin: 21, end: 23 },
                    { type: 'insert', begin: 83, end: 87 },
                    { type: 'insert', begin: 56, end: 58 },
                    { type: 'insert', begin: 1, end: 55 },
                    { type: 'insert', begin: 56, end: 59 },
                    { type: 'insert', begin: 58, end: 60 },
                    { type: 'insert', begin: 56, end: 65 },
                    { type: 'delete', id: 1 },
                    { type: 'delete', id: 0 },
                    { type: 'delete', id: 6 }
                ]);
            });
            test('gen18', () => {
                testIntervalTree([
                    { type: 'insert', begin: 25, end: 25 },
                    { type: 'insert', begin: 67, end: 79 },
                    { type: 'delete', id: 0 },
                    { type: 'search', begin: 65, end: 75 }
                ]);
            });
            test('force delta overflow', () => {
                // Search the IntervalNode ctor for FORCE_OVERFLOWING_TEST
                // to force that this test leads to a delta normalization
                testIntervalTree([
                    { type: 'insert', begin: 686081138593427, end: 733009856502260 },
                    { type: 'insert', begin: 591031326181669, end: 591031326181672 },
                    { type: 'insert', begin: 940037682731896, end: 940037682731903 },
                    { type: 'insert', begin: 598413641151120, end: 598413641151128 },
                    { type: 'insert', begin: 800564156553344, end: 800564156553351 },
                    { type: 'insert', begin: 894198957565481, end: 894198957565491 }
                ]);
            });
        });
        // TEST_COUNT = 0;
        // PRINT_TREE = true;
        for (let i = 0; i < TEST_COUNT; i++) {
            if (i % 100 === 0) {
                console.log(`TEST ${i + 1}/${TEST_COUNT}`);
            }
            const test = new AutoTest();
            try {
                test.run();
            }
            catch (err) {
                console.log(err);
                test.print();
                return;
            }
        }
        suite('searching', () => {
            function createCormenTree() {
                const r = new intervalTree_1.IntervalTree();
                const data = [
                    [16, 21],
                    [8, 9],
                    [25, 30],
                    [5, 8],
                    [15, 23],
                    [17, 19],
                    [26, 26],
                    [0, 3],
                    [6, 10],
                    [19, 20]
                ];
                data.forEach((int) => {
                    const node = new intervalTree_1.IntervalNode(null, int[0], int[1]);
                    r.insert(node);
                });
                return r;
            }
            const T = createCormenTree();
            function assertIntervalSearch(start, end, expected) {
                const actualNodes = T.intervalSearch(start, end, 0, false, 0, false);
                const actual = actualNodes.map((n) => [n.cachedAbsoluteStart, n.cachedAbsoluteEnd]);
                assert.deepStrictEqual(actual, expected);
            }
            test('cormen 1->2', () => {
                assertIntervalSearch(1, 2, [
                    [0, 3],
                ]);
            });
            test('cormen 4->8', () => {
                assertIntervalSearch(4, 8, [
                    [5, 8],
                    [6, 10],
                    [8, 9],
                ]);
            });
            test('cormen 10->15', () => {
                assertIntervalSearch(10, 15, [
                    [6, 10],
                    [15, 23],
                ]);
            });
            test('cormen 21->25', () => {
                assertIntervalSearch(21, 25, [
                    [15, 23],
                    [16, 21],
                    [25, 30],
                ]);
            });
            test('cormen 24->24', () => {
                assertIntervalSearch(24, 24, []);
            });
        });
    });
    suite('IntervalTree 2', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function assertNodeAcceptEdit(msg, nodeStart, nodeEnd, nodeStickiness, start, end, textLength, forceMoveMarkers, expectedNodeStart, expectedNodeEnd) {
            const node = new intervalTree_1.IntervalNode('', nodeStart, nodeEnd);
            (0, intervalTree_1.setNodeStickiness)(node, nodeStickiness);
            (0, intervalTree_1.nodeAcceptEdit)(node, start, end, textLength, forceMoveMarkers);
            assert.deepStrictEqual([node.start, node.end], [expectedNodeStart, expectedNodeEnd], msg);
        }
        test('nodeAcceptEdit', () => {
            // A. collapsed decoration
            {
                // no-op
                assertNodeAcceptEdit('A.000', 0, 0, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 0, false, 0, 0);
                assertNodeAcceptEdit('A.001', 0, 0, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 0, false, 0, 0);
                assertNodeAcceptEdit('A.002', 0, 0, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 0, false, 0, 0);
                assertNodeAcceptEdit('A.003', 0, 0, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 0, false, 0, 0);
                assertNodeAcceptEdit('A.004', 0, 0, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 0, true, 0, 0);
                assertNodeAcceptEdit('A.005', 0, 0, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 0, true, 0, 0);
                assertNodeAcceptEdit('A.006', 0, 0, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 0, true, 0, 0);
                assertNodeAcceptEdit('A.007', 0, 0, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 0, true, 0, 0);
                // insertion
                assertNodeAcceptEdit('A.008', 0, 0, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 1, false, 0, 1);
                assertNodeAcceptEdit('A.009', 0, 0, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 1, false, 1, 1);
                assertNodeAcceptEdit('A.010', 0, 0, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 1, false, 0, 0);
                assertNodeAcceptEdit('A.011', 0, 0, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 1, false, 1, 1);
                assertNodeAcceptEdit('A.012', 0, 0, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 1, true, 1, 1);
                assertNodeAcceptEdit('A.013', 0, 0, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 1, true, 1, 1);
                assertNodeAcceptEdit('A.014', 0, 0, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 1, true, 1, 1);
                assertNodeAcceptEdit('A.015', 0, 0, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 1, true, 1, 1);
            }
            // B. non collapsed decoration
            {
                // no-op
                assertNodeAcceptEdit('B.000', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 0, false, 0, 5);
                assertNodeAcceptEdit('B.001', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 0, false, 0, 5);
                assertNodeAcceptEdit('B.002', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 0, false, 0, 5);
                assertNodeAcceptEdit('B.003', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 0, false, 0, 5);
                assertNodeAcceptEdit('B.004', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 0, true, 0, 5);
                assertNodeAcceptEdit('B.005', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 0, true, 0, 5);
                assertNodeAcceptEdit('B.006', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 0, true, 0, 5);
                assertNodeAcceptEdit('B.007', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 0, true, 0, 5);
                // insertion at start
                assertNodeAcceptEdit('B.008', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 1, false, 0, 6);
                assertNodeAcceptEdit('B.009', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 1, false, 1, 6);
                assertNodeAcceptEdit('B.010', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 1, false, 0, 6);
                assertNodeAcceptEdit('B.011', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 1, false, 1, 6);
                assertNodeAcceptEdit('B.012', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 0, 0, 1, true, 1, 6);
                assertNodeAcceptEdit('B.013', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 0, 0, 1, true, 1, 6);
                assertNodeAcceptEdit('B.014', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 0, 0, 1, true, 1, 6);
                assertNodeAcceptEdit('B.015', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 0, 0, 1, true, 1, 6);
                // insertion in middle
                assertNodeAcceptEdit('B.016', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 2, 2, 1, false, 0, 6);
                assertNodeAcceptEdit('B.017', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 2, 2, 1, false, 0, 6);
                assertNodeAcceptEdit('B.018', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 2, 2, 1, false, 0, 6);
                assertNodeAcceptEdit('B.019', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 2, 2, 1, false, 0, 6);
                assertNodeAcceptEdit('B.020', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 2, 2, 1, true, 0, 6);
                assertNodeAcceptEdit('B.021', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 2, 2, 1, true, 0, 6);
                assertNodeAcceptEdit('B.022', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 2, 2, 1, true, 0, 6);
                assertNodeAcceptEdit('B.023', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 2, 2, 1, true, 0, 6);
                // insertion at end
                assertNodeAcceptEdit('B.024', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 5, 1, false, 0, 6);
                assertNodeAcceptEdit('B.025', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 5, 1, false, 0, 5);
                assertNodeAcceptEdit('B.026', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 5, 1, false, 0, 5);
                assertNodeAcceptEdit('B.027', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 5, 1, false, 0, 6);
                assertNodeAcceptEdit('B.028', 0, 5, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 5, 1, true, 0, 6);
                assertNodeAcceptEdit('B.029', 0, 5, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 5, 1, true, 0, 6);
                assertNodeAcceptEdit('B.030', 0, 5, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 5, 1, true, 0, 6);
                assertNodeAcceptEdit('B.031', 0, 5, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 5, 1, true, 0, 6);
                // replace with larger text until start
                assertNodeAcceptEdit('B.032', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 5, 2, false, 5, 11);
                assertNodeAcceptEdit('B.033', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 5, 2, false, 6, 11);
                assertNodeAcceptEdit('B.034', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 5, 2, false, 5, 11);
                assertNodeAcceptEdit('B.035', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 5, 2, false, 6, 11);
                assertNodeAcceptEdit('B.036', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 5, 2, true, 6, 11);
                assertNodeAcceptEdit('B.037', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 5, 2, true, 6, 11);
                assertNodeAcceptEdit('B.038', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 5, 2, true, 6, 11);
                assertNodeAcceptEdit('B.039', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 5, 2, true, 6, 11);
                // replace with smaller text until start
                assertNodeAcceptEdit('B.040', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 3, 5, 1, false, 4, 9);
                assertNodeAcceptEdit('B.041', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 3, 5, 1, false, 4, 9);
                assertNodeAcceptEdit('B.042', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 3, 5, 1, false, 4, 9);
                assertNodeAcceptEdit('B.043', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 3, 5, 1, false, 4, 9);
                assertNodeAcceptEdit('B.044', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 3, 5, 1, true, 4, 9);
                assertNodeAcceptEdit('B.045', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 3, 5, 1, true, 4, 9);
                assertNodeAcceptEdit('B.046', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 3, 5, 1, true, 4, 9);
                assertNodeAcceptEdit('B.047', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 3, 5, 1, true, 4, 9);
                // replace with larger text select start
                assertNodeAcceptEdit('B.048', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 6, 3, false, 5, 11);
                assertNodeAcceptEdit('B.049', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 6, 3, false, 5, 11);
                assertNodeAcceptEdit('B.050', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 6, 3, false, 5, 11);
                assertNodeAcceptEdit('B.051', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 6, 3, false, 5, 11);
                assertNodeAcceptEdit('B.052', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 6, 3, true, 7, 11);
                assertNodeAcceptEdit('B.053', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 6, 3, true, 7, 11);
                assertNodeAcceptEdit('B.054', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 6, 3, true, 7, 11);
                assertNodeAcceptEdit('B.055', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 6, 3, true, 7, 11);
                // replace with smaller text select start
                assertNodeAcceptEdit('B.056', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 6, 1, false, 5, 9);
                assertNodeAcceptEdit('B.057', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 6, 1, false, 5, 9);
                assertNodeAcceptEdit('B.058', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 6, 1, false, 5, 9);
                assertNodeAcceptEdit('B.059', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 6, 1, false, 5, 9);
                assertNodeAcceptEdit('B.060', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 6, 1, true, 5, 9);
                assertNodeAcceptEdit('B.061', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 6, 1, true, 5, 9);
                assertNodeAcceptEdit('B.062', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 6, 1, true, 5, 9);
                assertNodeAcceptEdit('B.063', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 6, 1, true, 5, 9);
                // replace with larger text from start
                assertNodeAcceptEdit('B.064', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 6, 2, false, 5, 11);
                assertNodeAcceptEdit('B.065', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 6, 2, false, 5, 11);
                assertNodeAcceptEdit('B.066', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 6, 2, false, 5, 11);
                assertNodeAcceptEdit('B.067', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 6, 2, false, 5, 11);
                assertNodeAcceptEdit('B.068', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 6, 2, true, 7, 11);
                assertNodeAcceptEdit('B.069', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 6, 2, true, 7, 11);
                assertNodeAcceptEdit('B.070', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 6, 2, true, 7, 11);
                assertNodeAcceptEdit('B.071', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 6, 2, true, 7, 11);
                // replace with smaller text from start
                assertNodeAcceptEdit('B.072', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 7, 1, false, 5, 9);
                assertNodeAcceptEdit('B.073', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 7, 1, false, 5, 9);
                assertNodeAcceptEdit('B.074', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 7, 1, false, 5, 9);
                assertNodeAcceptEdit('B.075', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 7, 1, false, 5, 9);
                assertNodeAcceptEdit('B.076', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 7, 1, true, 6, 9);
                assertNodeAcceptEdit('B.077', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 7, 1, true, 6, 9);
                assertNodeAcceptEdit('B.078', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 7, 1, true, 6, 9);
                assertNodeAcceptEdit('B.079', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 7, 1, true, 6, 9);
                // replace with larger text to end
                assertNodeAcceptEdit('B.080', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 10, 2, false, 5, 11);
                assertNodeAcceptEdit('B.081', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 10, 2, false, 5, 10);
                assertNodeAcceptEdit('B.082', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 10, 2, false, 5, 10);
                assertNodeAcceptEdit('B.083', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 10, 2, false, 5, 11);
                assertNodeAcceptEdit('B.084', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 10, 2, true, 5, 11);
                assertNodeAcceptEdit('B.085', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 10, 2, true, 5, 11);
                assertNodeAcceptEdit('B.086', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 10, 2, true, 5, 11);
                assertNodeAcceptEdit('B.087', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 10, 2, true, 5, 11);
                // replace with smaller text to end
                assertNodeAcceptEdit('B.088', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 8, 10, 1, false, 5, 9);
                assertNodeAcceptEdit('B.089', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 8, 10, 1, false, 5, 9);
                assertNodeAcceptEdit('B.090', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 8, 10, 1, false, 5, 9);
                assertNodeAcceptEdit('B.091', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 8, 10, 1, false, 5, 9);
                assertNodeAcceptEdit('B.092', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 8, 10, 1, true, 5, 9);
                assertNodeAcceptEdit('B.093', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 8, 10, 1, true, 5, 9);
                assertNodeAcceptEdit('B.094', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 8, 10, 1, true, 5, 9);
                assertNodeAcceptEdit('B.095', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 8, 10, 1, true, 5, 9);
                // replace with larger text select end
                assertNodeAcceptEdit('B.096', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.097', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.098', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.099', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.100', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 11, 3, true, 5, 12);
                assertNodeAcceptEdit('B.101', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 11, 3, true, 5, 12);
                assertNodeAcceptEdit('B.102', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 11, 3, true, 5, 12);
                assertNodeAcceptEdit('B.103', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 11, 3, true, 5, 12);
                // replace with smaller text select end
                assertNodeAcceptEdit('B.104', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 11, 1, false, 5, 10);
                assertNodeAcceptEdit('B.105', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 11, 1, false, 5, 10);
                assertNodeAcceptEdit('B.106', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 11, 1, false, 5, 10);
                assertNodeAcceptEdit('B.107', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 11, 1, false, 5, 10);
                assertNodeAcceptEdit('B.108', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 11, 1, true, 5, 10);
                assertNodeAcceptEdit('B.109', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 11, 1, true, 5, 10);
                assertNodeAcceptEdit('B.110', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 11, 1, true, 5, 10);
                assertNodeAcceptEdit('B.111', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 11, 1, true, 5, 10);
                // replace with larger text from end
                assertNodeAcceptEdit('B.112', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 10, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.113', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 10, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.114', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 10, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.115', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 10, 11, 3, false, 5, 10);
                assertNodeAcceptEdit('B.116', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 10, 11, 3, true, 5, 13);
                assertNodeAcceptEdit('B.117', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 10, 11, 3, true, 5, 13);
                assertNodeAcceptEdit('B.118', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 10, 11, 3, true, 5, 13);
                assertNodeAcceptEdit('B.119', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 10, 11, 3, true, 5, 13);
                // replace with smaller text from end
                assertNodeAcceptEdit('B.120', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 10, 12, 1, false, 5, 10);
                assertNodeAcceptEdit('B.121', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 10, 12, 1, false, 5, 10);
                assertNodeAcceptEdit('B.122', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 10, 12, 1, false, 5, 10);
                assertNodeAcceptEdit('B.123', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 10, 12, 1, false, 5, 10);
                assertNodeAcceptEdit('B.124', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 10, 12, 1, true, 5, 11);
                assertNodeAcceptEdit('B.125', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 10, 12, 1, true, 5, 11);
                assertNodeAcceptEdit('B.126', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 10, 12, 1, true, 5, 11);
                assertNodeAcceptEdit('B.127', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 10, 12, 1, true, 5, 11);
                // delete until start
                assertNodeAcceptEdit('B.128', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 5, 0, false, 4, 9);
                assertNodeAcceptEdit('B.129', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 5, 0, false, 4, 9);
                assertNodeAcceptEdit('B.130', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 5, 0, false, 4, 9);
                assertNodeAcceptEdit('B.131', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 5, 0, false, 4, 9);
                assertNodeAcceptEdit('B.132', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 5, 0, true, 4, 9);
                assertNodeAcceptEdit('B.133', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 5, 0, true, 4, 9);
                assertNodeAcceptEdit('B.134', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 5, 0, true, 4, 9);
                assertNodeAcceptEdit('B.135', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 5, 0, true, 4, 9);
                // delete select start
                assertNodeAcceptEdit('B.136', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 6, 0, false, 4, 8);
                assertNodeAcceptEdit('B.137', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 6, 0, false, 4, 8);
                assertNodeAcceptEdit('B.138', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 6, 0, false, 4, 8);
                assertNodeAcceptEdit('B.139', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 6, 0, false, 4, 8);
                assertNodeAcceptEdit('B.140', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 4, 6, 0, true, 4, 8);
                assertNodeAcceptEdit('B.141', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 4, 6, 0, true, 4, 8);
                assertNodeAcceptEdit('B.142', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 4, 6, 0, true, 4, 8);
                assertNodeAcceptEdit('B.143', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 4, 6, 0, true, 4, 8);
                // delete from start
                assertNodeAcceptEdit('B.144', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 6, 0, false, 5, 9);
                assertNodeAcceptEdit('B.145', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 6, 0, false, 5, 9);
                assertNodeAcceptEdit('B.146', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 6, 0, false, 5, 9);
                assertNodeAcceptEdit('B.147', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 6, 0, false, 5, 9);
                assertNodeAcceptEdit('B.148', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 6, 0, true, 5, 9);
                assertNodeAcceptEdit('B.149', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 6, 0, true, 5, 9);
                assertNodeAcceptEdit('B.150', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 6, 0, true, 5, 9);
                assertNodeAcceptEdit('B.151', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 6, 0, true, 5, 9);
                // delete to end
                assertNodeAcceptEdit('B.152', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 10, 0, false, 5, 9);
                assertNodeAcceptEdit('B.153', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 10, 0, false, 5, 9);
                assertNodeAcceptEdit('B.154', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 10, 0, false, 5, 9);
                assertNodeAcceptEdit('B.155', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 10, 0, false, 5, 9);
                assertNodeAcceptEdit('B.156', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 10, 0, true, 5, 9);
                assertNodeAcceptEdit('B.157', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 10, 0, true, 5, 9);
                assertNodeAcceptEdit('B.158', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 10, 0, true, 5, 9);
                assertNodeAcceptEdit('B.159', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 10, 0, true, 5, 9);
                // delete select end
                assertNodeAcceptEdit('B.160', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 11, 0, false, 5, 9);
                assertNodeAcceptEdit('B.161', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 11, 0, false, 5, 9);
                assertNodeAcceptEdit('B.162', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 11, 0, false, 5, 9);
                assertNodeAcceptEdit('B.163', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 11, 0, false, 5, 9);
                assertNodeAcceptEdit('B.164', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 9, 11, 0, true, 5, 9);
                assertNodeAcceptEdit('B.165', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 9, 11, 0, true, 5, 9);
                assertNodeAcceptEdit('B.166', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 9, 11, 0, true, 5, 9);
                assertNodeAcceptEdit('B.167', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 9, 11, 0, true, 5, 9);
                // delete from end
                assertNodeAcceptEdit('B.168', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 10, 11, 0, false, 5, 10);
                assertNodeAcceptEdit('B.169', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 10, 11, 0, false, 5, 10);
                assertNodeAcceptEdit('B.170', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 10, 11, 0, false, 5, 10);
                assertNodeAcceptEdit('B.171', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 10, 11, 0, false, 5, 10);
                assertNodeAcceptEdit('B.172', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 10, 11, 0, true, 5, 10);
                assertNodeAcceptEdit('B.173', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 10, 11, 0, true, 5, 10);
                assertNodeAcceptEdit('B.174', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 10, 11, 0, true, 5, 10);
                assertNodeAcceptEdit('B.175', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 10, 11, 0, true, 5, 10);
                // replace with larger text entire
                assertNodeAcceptEdit('B.176', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 10, 3, false, 5, 8);
                assertNodeAcceptEdit('B.177', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 10, 3, false, 5, 8);
                assertNodeAcceptEdit('B.178', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 10, 3, false, 5, 8);
                assertNodeAcceptEdit('B.179', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 10, 3, false, 5, 8);
                assertNodeAcceptEdit('B.180', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 10, 3, true, 8, 8);
                assertNodeAcceptEdit('B.181', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 10, 3, true, 8, 8);
                assertNodeAcceptEdit('B.182', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 10, 3, true, 8, 8);
                assertNodeAcceptEdit('B.183', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 10, 3, true, 8, 8);
                // replace with smaller text entire
                assertNodeAcceptEdit('B.184', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 10, 7, false, 5, 12);
                assertNodeAcceptEdit('B.185', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 10, 7, false, 5, 10);
                assertNodeAcceptEdit('B.186', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 10, 7, false, 5, 10);
                assertNodeAcceptEdit('B.187', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 10, 7, false, 5, 12);
                assertNodeAcceptEdit('B.188', 5, 10, 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */, 5, 10, 7, true, 12, 12);
                assertNodeAcceptEdit('B.189', 5, 10, 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */, 5, 10, 7, true, 12, 12);
                assertNodeAcceptEdit('B.190', 5, 10, 2 /* TrackedRangeStickiness.GrowsOnlyWhenTypingBefore */, 5, 10, 7, true, 12, 12);
                assertNodeAcceptEdit('B.191', 5, 10, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */, 5, 10, 7, true, 12, 12);
            }
        });
    });
    function printTree(T) {
        if (T.root === intervalTree_1.SENTINEL) {
            console.log(`~~ empty`);
            return;
        }
        const out = [];
        _printTree(T, T.root, '', 0, out);
        console.log(out.join(''));
    }
    function _printTree(T, n, indent, delta, out) {
        out.push(`${indent}[${(0, intervalTree_1.getNodeColor)(n) === 1 /* NodeColor.Red */ ? 'R' : 'B'},${n.delta}, ${n.start}->${n.end}, ${n.maxEnd}] : {${delta + n.start}->${delta + n.end}}, maxEnd: ${n.maxEnd + delta}\n`);
        if (n.left !== intervalTree_1.SENTINEL) {
            _printTree(T, n.left, indent + '    ', delta, out);
        }
        else {
            out.push(`${indent}    NIL\n`);
        }
        if (n.right !== intervalTree_1.SENTINEL) {
            _printTree(T, n.right, indent + '    ', delta + n.delta, out);
        }
        else {
            out.push(`${indent}    NIL\n`);
        }
    }
    //#region Assertion
    function assertTreeInvariants(T) {
        assert((0, intervalTree_1.getNodeColor)(intervalTree_1.SENTINEL) === 0 /* NodeColor.Black */);
        assert(intervalTree_1.SENTINEL.parent === intervalTree_1.SENTINEL);
        assert(intervalTree_1.SENTINEL.left === intervalTree_1.SENTINEL);
        assert(intervalTree_1.SENTINEL.right === intervalTree_1.SENTINEL);
        assert(intervalTree_1.SENTINEL.start === 0);
        assert(intervalTree_1.SENTINEL.end === 0);
        assert(intervalTree_1.SENTINEL.delta === 0);
        assert(T.root.parent === intervalTree_1.SENTINEL);
        assertValidTree(T);
    }
    function depth(n) {
        if (n === intervalTree_1.SENTINEL) {
            // The leafs are black
            return 1;
        }
        assert(depth(n.left) === depth(n.right));
        return ((0, intervalTree_1.getNodeColor)(n) === 0 /* NodeColor.Black */ ? 1 : 0) + depth(n.left);
    }
    function assertValidNode(n, delta) {
        if (n === intervalTree_1.SENTINEL) {
            return;
        }
        const l = n.left;
        const r = n.right;
        if ((0, intervalTree_1.getNodeColor)(n) === 1 /* NodeColor.Red */) {
            assert((0, intervalTree_1.getNodeColor)(l) === 0 /* NodeColor.Black */);
            assert((0, intervalTree_1.getNodeColor)(r) === 0 /* NodeColor.Black */);
        }
        let expectedMaxEnd = n.end;
        if (l !== intervalTree_1.SENTINEL) {
            assert((0, intervalTree_1.intervalCompare)(l.start + delta, l.end + delta, n.start + delta, n.end + delta) <= 0);
            expectedMaxEnd = Math.max(expectedMaxEnd, l.maxEnd);
        }
        if (r !== intervalTree_1.SENTINEL) {
            assert((0, intervalTree_1.intervalCompare)(n.start + delta, n.end + delta, r.start + delta + n.delta, r.end + delta + n.delta) <= 0);
            expectedMaxEnd = Math.max(expectedMaxEnd, r.maxEnd + n.delta);
        }
        assert(n.maxEnd === expectedMaxEnd);
        assertValidNode(l, delta);
        assertValidNode(r, delta + n.delta);
    }
    function assertValidTree(T) {
        if (T.root === intervalTree_1.SENTINEL) {
            return;
        }
        assert((0, intervalTree_1.getNodeColor)(T.root) === 0 /* NodeColor.Black */);
        assert(depth(T.root.left) === depth(T.root.right));
        assertValidNode(T.root, 0);
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJ2YWxUcmVlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2NvbW1vbi9tb2RlbC9pbnRlcnZhbFRyZWUudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDN0IsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDekIsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7SUFDN0IsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLENBQUM7SUFDN0IsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQztJQUN2QixNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUM7SUFDMUIsTUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBRTFCLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFFNUIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sUUFBUTtZQU1iLFlBQVksS0FBYSxFQUFFLEdBQVc7Z0JBTHRDLG1CQUFjLEdBQVMsU0FBUyxDQUFDO2dCQU1oQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDaEIsQ0FBQztTQUNEO1FBRUQsTUFBTSxNQUFNO1lBR1g7Z0JBQ0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDckIsQ0FBQztZQUVNLE1BQU0sQ0FBQyxRQUFrQjtnQkFDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFD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