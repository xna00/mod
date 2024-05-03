/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/browser/view/viewLayer"], function (require, exports, assert, utils_1, viewLayer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestLine {
        constructor(id) {
            this.id = id;
            this._pinged = false;
        }
        onContentChanged() {
            this._pinged = true;
        }
        onTokensChanged() {
            this._pinged = true;
        }
    }
    function assertState(col, state) {
        const actualState = {
            startLineNumber: col.getStartLineNumber(),
            lines: [],
            pinged: []
        };
        for (let lineNumber = col.getStartLineNumber(); lineNumber <= col.getEndLineNumber(); lineNumber++) {
            actualState.lines.push(col.getLine(lineNumber).id);
            actualState.pinged.push(col.getLine(lineNumber)._pinged);
        }
        assert.deepStrictEqual(actualState, state);
    }
    suite('RenderedLinesCollection onLinesDeleted', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testOnModelLinesDeleted(deleteFromLineNumber, deleteToLineNumber, expectedDeleted, expectedState) {
            const col = new viewLayer_1.RenderedLinesCollection(() => new TestLine('new'));
            col._set(6, [
                new TestLine('old6'),
                new TestLine('old7'),
                new TestLine('old8'),
                new TestLine('old9')
            ]);
            const actualDeleted1 = col.onLinesDeleted(deleteFromLineNumber, deleteToLineNumber);
            let actualDeleted = [];
            if (actualDeleted1) {
                actualDeleted = actualDeleted1.map(line => line.id);
            }
            assert.deepStrictEqual(actualDeleted, expectedDeleted);
            assertState(col, expectedState);
        }
        test('A1', () => {
            testOnModelLinesDeleted(3, 3, [], {
                startLineNumber: 5,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A2', () => {
            testOnModelLinesDeleted(3, 4, [], {
                startLineNumber: 4,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A3', () => {
            testOnModelLinesDeleted(3, 5, [], {
                startLineNumber: 3,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A4', () => {
            testOnModelLinesDeleted(3, 6, ['old6'], {
                startLineNumber: 3,
                lines: ['old7', 'old8', 'old9'],
                pinged: [false, false, false]
            });
        });
        test('A5', () => {
            testOnModelLinesDeleted(3, 7, ['old6', 'old7'], {
                startLineNumber: 3,
                lines: ['old8', 'old9'],
                pinged: [false, false]
            });
        });
        test('A6', () => {
            testOnModelLinesDeleted(3, 8, ['old6', 'old7', 'old8'], {
                startLineNumber: 3,
                lines: ['old9'],
                pinged: [false]
            });
        });
        test('A7', () => {
            testOnModelLinesDeleted(3, 9, ['old6', 'old7', 'old8', 'old9'], {
                startLineNumber: 3,
                lines: [],
                pinged: []
            });
        });
        test('A8', () => {
            testOnModelLinesDeleted(3, 10, ['old6', 'old7', 'old8', 'old9'], {
                startLineNumber: 3,
                lines: [],
                pinged: []
            });
        });
        test('B1', () => {
            testOnModelLinesDeleted(5, 5, [], {
                startLineNumber: 5,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B2', () => {
            testOnModelLinesDeleted(5, 6, ['old6'], {
                startLineNumber: 5,
                lines: ['old7', 'old8', 'old9'],
                pinged: [false, false, false]
            });
        });
        test('B3', () => {
            testOnModelLinesDeleted(5, 7, ['old6', 'old7'], {
                startLineNumber: 5,
                lines: ['old8', 'old9'],
                pinged: [false, false]
            });
        });
        test('B4', () => {
            testOnModelLinesDeleted(5, 8, ['old6', 'old7', 'old8'], {
                startLineNumber: 5,
                lines: ['old9'],
                pinged: [false]
            });
        });
        test('B5', () => {
            testOnModelLinesDeleted(5, 9, ['old6', 'old7', 'old8', 'old9'], {
                startLineNumber: 5,
                lines: [],
                pinged: []
            });
        });
        test('B6', () => {
            testOnModelLinesDeleted(5, 10, ['old6', 'old7', 'old8', 'old9'], {
                startLineNumber: 5,
                lines: [],
                pinged: []
            });
        });
        test('C1', () => {
            testOnModelLinesDeleted(6, 6, ['old6'], {
                startLineNumber: 6,
                lines: ['old7', 'old8', 'old9'],
                pinged: [false, false, false]
            });
        });
        test('C2', () => {
            testOnModelLinesDeleted(6, 7, ['old6', 'old7'], {
                startLineNumber: 6,
                lines: ['old8', 'old9'],
                pinged: [false, false]
            });
        });
        test('C3', () => {
            testOnModelLinesDeleted(6, 8, ['old6', 'old7', 'old8'], {
                startLineNumber: 6,
                lines: ['old9'],
                pinged: [false]
            });
        });
        test('C4', () => {
            testOnModelLinesDeleted(6, 9, ['old6', 'old7', 'old8', 'old9'], {
                startLineNumber: 6,
                lines: [],
                pinged: []
            });
        });
        test('C5', () => {
            testOnModelLinesDeleted(6, 10, ['old6', 'old7', 'old8', 'old9'], {
                startLineNumber: 6,
                lines: [],
                pinged: []
            });
        });
        test('D1', () => {
            testOnModelLinesDeleted(7, 7, ['old7'], {
                startLineNumber: 6,
                lines: ['old6', 'old8', 'old9'],
                pinged: [false, false, false]
            });
        });
        test('D2', () => {
            testOnModelLinesDeleted(7, 8, ['old7', 'old8'], {
                startLineNumber: 6,
                lines: ['old6', 'old9'],
                pinged: [false, false]
            });
        });
        test('D3', () => {
            testOnModelLinesDeleted(7, 9, ['old7', 'old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6'],
                pinged: [false]
            });
        });
        test('D4', () => {
            testOnModelLinesDeleted(7, 10, ['old7', 'old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6'],
                pinged: [false]
            });
        });
        test('E1', () => {
            testOnModelLinesDeleted(8, 8, ['old8'], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old9'],
                pinged: [false, false, false]
            });
        });
        test('E2', () => {
            testOnModelLinesDeleted(8, 9, ['old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7'],
                pinged: [false, false]
            });
        });
        test('E3', () => {
            testOnModelLinesDeleted(8, 10, ['old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7'],
                pinged: [false, false]
            });
        });
        test('F1', () => {
            testOnModelLinesDeleted(9, 9, ['old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8'],
                pinged: [false, false, false]
            });
        });
        test('F2', () => {
            testOnModelLinesDeleted(9, 10, ['old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8'],
                pinged: [false, false, false]
            });
        });
        test('G1', () => {
            testOnModelLinesDeleted(10, 10, [], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('G2', () => {
            testOnModelLinesDeleted(10, 11, [], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('H1', () => {
            testOnModelLinesDeleted(11, 13, [], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
    });
    suite('RenderedLinesCollection onLineChanged', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testOnModelLineChanged(changedLineNumber, expectedPinged, expectedState) {
            const col = new viewLayer_1.RenderedLinesCollection(() => new TestLine('new'));
            col._set(6, [
                new TestLine('old6'),
                new TestLine('old7'),
                new TestLine('old8'),
                new TestLine('old9')
            ]);
            const actualPinged = col.onLinesChanged(changedLineNumber, 1);
            assert.deepStrictEqual(actualPinged, expectedPinged);
            assertState(col, expectedState);
        }
        test('3', () => {
            testOnModelLineChanged(3, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('4', () => {
            testOnModelLineChanged(4, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('5', () => {
            testOnModelLineChanged(5, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('6', () => {
            testOnModelLineChanged(6, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [true, false, false, false]
            });
        });
        test('7', () => {
            testOnModelLineChanged(7, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, true, false, false]
            });
        });
        test('8', () => {
            testOnModelLineChanged(8, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, true, false]
            });
        });
        test('9', () => {
            testOnModelLineChanged(9, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, true]
            });
        });
        test('10', () => {
            testOnModelLineChanged(10, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('11', () => {
            testOnModelLineChanged(11, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
    });
    suite('RenderedLinesCollection onLinesInserted', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testOnModelLinesInserted(insertFromLineNumber, insertToLineNumber, expectedDeleted, expectedState) {
            const col = new viewLayer_1.RenderedLinesCollection(() => new TestLine('new'));
            col._set(6, [
                new TestLine('old6'),
                new TestLine('old7'),
                new TestLine('old8'),
                new TestLine('old9')
            ]);
            const actualDeleted1 = col.onLinesInserted(insertFromLineNumber, insertToLineNumber);
            let actualDeleted = [];
            if (actualDeleted1) {
                actualDeleted = actualDeleted1.map(line => line.id);
            }
            assert.deepStrictEqual(actualDeleted, expectedDeleted);
            assertState(col, expectedState);
        }
        test('A1', () => {
            testOnModelLinesInserted(3, 3, [], {
                startLineNumber: 7,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A2', () => {
            testOnModelLinesInserted(3, 4, [], {
                startLineNumber: 8,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A3', () => {
            testOnModelLinesInserted(3, 5, [], {
                startLineNumber: 9,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A4', () => {
            testOnModelLinesInserted(3, 6, [], {
                startLineNumber: 10,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A5', () => {
            testOnModelLinesInserted(3, 7, [], {
                startLineNumber: 11,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A6', () => {
            testOnModelLinesInserted(3, 8, [], {
                startLineNumber: 12,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A7', () => {
            testOnModelLinesInserted(3, 9, [], {
                startLineNumber: 13,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('A8', () => {
            testOnModelLinesInserted(3, 10, [], {
                startLineNumber: 14,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B1', () => {
            testOnModelLinesInserted(5, 5, [], {
                startLineNumber: 7,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B2', () => {
            testOnModelLinesInserted(5, 6, [], {
                startLineNumber: 8,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B3', () => {
            testOnModelLinesInserted(5, 7, [], {
                startLineNumber: 9,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B4', () => {
            testOnModelLinesInserted(5, 8, [], {
                startLineNumber: 10,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B5', () => {
            testOnModelLinesInserted(5, 9, [], {
                startLineNumber: 11,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B6', () => {
            testOnModelLinesInserted(5, 10, [], {
                startLineNumber: 12,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('C1', () => {
            testOnModelLinesInserted(6, 6, [], {
                startLineNumber: 7,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('C2', () => {
            testOnModelLinesInserted(6, 7, [], {
                startLineNumber: 8,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('C3', () => {
            testOnModelLinesInserted(6, 8, [], {
                startLineNumber: 9,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('C4', () => {
            testOnModelLinesInserted(6, 9, [], {
                startLineNumber: 10,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('C5', () => {
            testOnModelLinesInserted(6, 10, [], {
                startLineNumber: 11,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('D1', () => {
            testOnModelLinesInserted(7, 7, ['old9'], {
                startLineNumber: 6,
                lines: ['old6', 'new', 'old7', 'old8'],
                pinged: [false, false, false, false]
            });
        });
        test('D2', () => {
            testOnModelLinesInserted(7, 8, ['old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6', 'new', 'new', 'old7'],
                pinged: [false, false, false, false]
            });
        });
        test('D3', () => {
            testOnModelLinesInserted(7, 9, ['old7', 'old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6'],
                pinged: [false]
            });
        });
        test('D4', () => {
            testOnModelLinesInserted(7, 10, ['old7', 'old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6'],
                pinged: [false]
            });
        });
        test('E1', () => {
            testOnModelLinesInserted(8, 8, ['old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'new', 'old8'],
                pinged: [false, false, false, false]
            });
        });
        test('E2', () => {
            testOnModelLinesInserted(8, 9, ['old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7'],
                pinged: [false, false]
            });
        });
        test('E3', () => {
            testOnModelLinesInserted(8, 10, ['old8', 'old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7'],
                pinged: [false, false]
            });
        });
        test('F1', () => {
            testOnModelLinesInserted(9, 9, ['old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8'],
                pinged: [false, false, false]
            });
        });
        test('F2', () => {
            testOnModelLinesInserted(9, 10, ['old9'], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8'],
                pinged: [false, false, false]
            });
        });
        test('G1', () => {
            testOnModelLinesInserted(10, 10, [], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('G2', () => {
            testOnModelLinesInserted(10, 11, [], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('H1', () => {
            testOnModelLinesInserted(11, 13, [], {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
    });
    suite('RenderedLinesCollection onTokensChanged', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function testOnModelTokensChanged(changedFromLineNumber, changedToLineNumber, expectedPinged, expectedState) {
            const col = new viewLayer_1.RenderedLinesCollection(() => new TestLine('new'));
            col._set(6, [
                new TestLine('old6'),
                new TestLine('old7'),
                new TestLine('old8'),
                new TestLine('old9')
            ]);
            const actualPinged = col.onTokensChanged([{ fromLineNumber: changedFromLineNumber, toLineNumber: changedToLineNumber }]);
            assert.deepStrictEqual(actualPinged, expectedPinged);
            assertState(col, expectedState);
        }
        test('A', () => {
            testOnModelTokensChanged(3, 3, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('B', () => {
            testOnModelTokensChanged(3, 5, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('C', () => {
            testOnModelTokensChanged(3, 6, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [true, false, false, false]
            });
        });
        test('D', () => {
            testOnModelTokensChanged(6, 6, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [true, false, false, false]
            });
        });
        test('E', () => {
            testOnModelTokensChanged(5, 10, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [true, true, true, true]
            });
        });
        test('F', () => {
            testOnModelTokensChanged(8, 9, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, true, true]
            });
        });
        test('G', () => {
            testOnModelTokensChanged(8, 11, true, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, true, true]
            });
        });
        test('H', () => {
            testOnModelTokensChanged(10, 10, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
        test('I', () => {
            testOnModelTokensChanged(10, 11, false, {
                startLineNumber: 6,
                lines: ['old6', 'old7', 'old8', 'old9'],
                pinged: [false, false, false, false]
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xheWVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci90ZXN0L2Jyb3dzZXIvdmlldy92aWV3TGF5ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU1oRyxNQUFNLFFBQVE7UUFHYixZQUFtQixFQUFVO1lBQVYsT0FBRSxHQUFGLEVBQUUsQ0FBUTtZQUQ3QixZQUFPLEdBQUcsS0FBSyxDQUFDO1FBRWhCLENBQUM7UUFFRCxnQkFBZ0I7WUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNyQixDQUFDO1FBQ0QsZUFBZTtZQUNkLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLENBQUM7S0FDRDtJQVFELFNBQVMsV0FBVyxDQUFDLEdBQXNDLEVBQUUsS0FBNEI7UUFDeEYsTUFBTSxXQUFXLEdBQTBCO1lBQzFDLGVBQWUsRUFBRSxHQUFHLENBQUMsa0JBQWtCLEVBQUU7WUFDekMsS0FBSyxFQUFFLEVBQUU7WUFDVCxNQUFNLEVBQUUsRUFBRTtTQUNWLENBQUM7UUFDRixLQUFLLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLFVBQVUsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDO1lBQ3BHLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbkQsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBQ0QsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUs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LEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNuQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNuQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO2dCQUNsQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNuQyxlQUFlLEVBQUUsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDeEMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdEMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3BDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZix3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNoRCxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDO2dCQUNyQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUN4RCxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUNmLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQzthQUNmLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZix3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDekQsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQztnQkFDZixNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUM7YUFDZixDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1lBQ2Ysd0JBQXdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN4QyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDO2dCQUN0QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2hELGVBQWUsRUFBRSxDQUFDO2dCQUNsQixLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QixNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3RCLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZix3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNqRCxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkIsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQzthQUN0QixDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1lBQ2Ysd0JBQXdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN4QyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUM7Z0JBQy9CLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQzdCLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7WUFDZix3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUU7Z0JBQ3pDLGVBQWUsRUFBRSxDQUFDO2dCQUNsQixLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDL0IsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDN0IsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNwQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNwQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtZQUNmLHdCQUF3QixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNwQyxlQUFlLEVBQUUsQ0FBQztnQkFDbEIsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDO2dCQUN2QyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUM7YUFDcEMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FBQztJQUdILEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLEVBQUU7UUFFckQsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLFNBQVMsd0JBQXdCLENBQUMscUJBQTZCLEVBQUUsbUJBQTJCLEVBQUUsY0FBdUIsRUFBRSxhQUFvQztZQUMxSixNQUFNLEdBQUcsR0FBRyxJQUFJLG1DQUF1QixDQUFXLEdBQUcsRUFBRSxDQUFDLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDN0UsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDO2dCQUNwQixJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUM7Z0JBQ3BCLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQztnQkFDcEIsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDO2FBQ3BCLENBQUMsQ0FBQztZQUNILE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekgsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDckQsV0FBVyxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtnQkFDckMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3BDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtnQkFDckMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3BDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDcEMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ25DLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDcEMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ25DLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtnQkFDckMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2FBQ2hDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRTtnQkFDcEMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2FBQ2xDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtnQkFDckMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO2FBQ2xDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRTtnQkFDdkMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3BDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7WUFDZCx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRTtnQkFDdkMsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQztnQkFDdkMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ3BDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==