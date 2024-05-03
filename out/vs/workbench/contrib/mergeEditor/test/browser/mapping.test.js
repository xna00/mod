/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/textLength", "vs/workbench/contrib/mergeEditor/browser/model/mapping"], function (require, exports, assert, utils_1, position_1, range_1, textLength_1, mapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('merge editor mapping', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('DocumentRangeMap', () => {
            const documentMap = createDocumentRangeMap([
                '1:3',
                ['0:2', '0:3'],
                '1:1',
                ['1:2', '3:3'],
                '0:2',
                ['0:2', '0:3'],
            ]);
            test('map', () => assert.deepStrictEqual(documentMap.rangeMappings.map(m => m.toString()), [
                '[2:4, 2:6) -> [2:4, 2:7)',
                '[3:2, 4:3) -> [3:2, 6:4)',
                '[4:5, 4:7) -> [6:6, 6:9)'
            ]));
            function f() {
                return documentMap.project(parsePos(this.test.title)).toString();
            }
            test('1:1', function () { assert.deepStrictEqual(f.apply(this), '[1:1, 1:1) -> [1:1, 1:1)'); });
            test('2:3', function () { assert.deepStrictEqual(f.apply(this), '[2:3, 2:3) -> [2:3, 2:3)'); });
            test('2:4', function () { assert.deepStrictEqual(f.apply(this), '[2:4, 2:6) -> [2:4, 2:7)'); });
            test('2:5', function () { assert.deepStrictEqual(f.apply(this), '[2:4, 2:6) -> [2:4, 2:7)'); });
            test('2:6', function () { assert.deepStrictEqual(f.apply(this), '[2:6, 2:6) -> [2:7, 2:7)'); });
            test('2:7', function () { assert.deepStrictEqual(f.apply(this), '[2:7, 2:7) -> [2:8, 2:8)'); });
            test('3:1', function () { assert.deepStrictEqual(f.apply(this), '[3:1, 3:1) -> [3:1, 3:1)'); });
            test('3:2', function () { assert.deepStrictEqual(f.apply(this), '[3:2, 4:3) -> [3:2, 6:4)'); });
            test('4:2', function () { assert.deepStrictEqual(f.apply(this), '[3:2, 4:3) -> [3:2, 6:4)'); });
            test('4:3', function () { assert.deepStrictEqual(f.apply(this), '[4:3, 4:3) -> [6:4, 6:4)'); });
            test('4:4', function () { assert.deepStrictEqual(f.apply(this), '[4:4, 4:4) -> [6:5, 6:5)'); });
            test('4:5', function () { assert.deepStrictEqual(f.apply(this), '[4:5, 4:7) -> [6:6, 6:9)'); });
        });
    });
    function parsePos(str) {
        const [lineCount, columnCount] = str.split(':');
        return new position_1.Position(parseInt(lineCount, 10), parseInt(columnCount, 10));
    }
    function parseLengthObj(str) {
        const [lineCount, columnCount] = str.split(':');
        return new textLength_1.TextLength(parseInt(lineCount, 10), parseInt(columnCount, 10));
    }
    function toPosition(length) {
        return new position_1.Position(length.lineCount + 1, length.columnCount + 1);
    }
    function createDocumentRangeMap(items) {
        const mappings = [];
        let lastLen1 = new textLength_1.TextLength(0, 0);
        let lastLen2 = new textLength_1.TextLength(0, 0);
        for (const item of items) {
            if (typeof item === 'string') {
                const len = parseLengthObj(item);
                lastLen1 = lastLen1.add(len);
                lastLen2 = lastLen2.add(len);
            }
            else {
                const len1 = parseLengthObj(item[0]);
                const len2 = parseLengthObj(item[1]);
                mappings.push(new mapping_1.RangeMapping(range_1.Range.fromPositions(toPosition(lastLen1), toPosition(lastLen1.add(len1))), range_1.Range.fromPositions(toPosition(lastLen2), toPosition(lastLen2.add(len2)))));
                lastLen1 = lastLen1.add(len1);
                lastLen2 = lastLen2.add(len2);
            }
        }
        return new mapping_1.DocumentRangeMap(mappings, lastLen1.lineCount);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwcGluZy50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9tZXJnZUVkaXRvci90ZXN0L2Jyb3dzZXIvbWFwcGluZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLEVBQUU7UUFDbEMsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7WUFDOUIsTUFBTSxXQUFXLEdBQUcsc0JBQXNCLENBQUM7Z0JBQzFDLEtBQUs7Z0JBQ0wsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUNkLEtBQUs7Z0JBQ0wsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO2dCQUNkLEtBQUs7Z0JBQ0wsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO2FBQ2QsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUU7Z0JBQzFGLDBCQUEwQjtnQkFDMUIsMEJBQTBCO2dCQUMxQiwwQkFBMEI7YUFDMUIsQ0FBQyxDQUFDLENBQUM7WUFFSixTQUFTLENBQUM7Z0JBQ1QsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkUsQ0FBQztZQUVELElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hHLElBQUksQ0FBQyxLQUFLLEVBQUUsY0FBYyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLFFBQVEsQ0FBQyxHQUFXO1FBQzVCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRCxPQUFPLElBQUksbUJBQVEsQ0FBQyxRQUFRLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBRUQsU0FBUyxjQUFjLENBQUMsR0FBVztRQUNsQyxNQUFNLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEQsT0FBTyxJQUFJLHVCQUFVLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLE1BQWtCO1FBQ3JDLE9BQU8sSUFBSSxtQkFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVELFNBQVMsc0JBQXNCLENBQUMsS0FBb0M7UUFDbkUsTUFBTSxRQUFRLEdBQW1CLEVBQUUsQ0FBQztRQUNwQyxJQUFJLFFBQVEsR0FBRyxJQUFJLHVCQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksUUFBUSxHQUFHLElBQUksdUJBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUMxQixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5QixNQUFNLEdBQUcsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLFFBQVEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM3QixRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsTUFBTSxJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxNQUFNLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxzQkFBWSxDQUM3QixhQUFLLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ3pFLGFBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FDekUsQ0FBQyxDQUFDO2dCQUNILFFBQVEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixDQUFDO1FBQ0YsQ0FBQztRQUVELE9BQU8sSUFBSSwwQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNELENBQUMifQ==