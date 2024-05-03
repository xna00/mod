/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, assert, utils_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Return a set of ranges for the cells matching the given predicate
     */
    function getRanges(cells, included) {
        const ranges = [];
        let currentRange;
        cells.forEach((cell, idx) => {
            if (included(cell)) {
                if (!currentRange) {
                    currentRange = { start: idx, end: idx + 1 };
                    ranges.push(currentRange);
                }
                else {
                    currentRange.end = idx + 1;
                }
            }
            else {
                currentRange = undefined;
            }
        });
        return ranges;
    }
    suite('notebookBrowser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('getRanges', function () {
            const predicate = (cell) => cell.cellKind === notebookCommon_1.CellKind.Code;
            test('all code', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Code },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), [{ start: 0, end: 2 }]);
            });
            test('none code', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), []);
            });
            test('start code', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), [{ start: 0, end: 1 }]);
            });
            test('random', function () {
                const cells = [
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Code },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Markup },
                    { cellKind: notebookCommon_1.CellKind.Code },
                ];
                assert.deepStrictEqual(getRanges(cells, predicate), [{ start: 0, end: 2 }, { start: 3, end: 4 }, { start: 6, end: 7 }]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tCcm93c2VyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0Jyb3dzZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRzs7T0FFRztJQUNILFNBQVMsU0FBUyxDQUFDLEtBQXVCLEVBQUUsUUFBMkM7UUFDdEYsTUFBTSxNQUFNLEdBQWlCLEVBQUUsQ0FBQztRQUNoQyxJQUFJLFlBQW9DLENBQUM7UUFFekMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUMzQixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNwQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7b0JBQ25CLFlBQVksR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQztvQkFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztxQkFBTSxDQUFDO29CQUNQLFlBQVksQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztZQUNGLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxZQUFZLEdBQUcsU0FBUyxDQUFDO1lBQzFCLENBQUM7UUFDRixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUdELEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLEVBQUU7UUFDN0IsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFDbEIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxJQUFvQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsSUFBSSxDQUFDO1lBRTVFLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ2hCLE1BQU0sS0FBSyxHQUFHO29CQUNiLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFO29CQUMzQixFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRTtpQkFDM0IsQ0FBQztnQkFDRixNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxLQUF5QixFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakcsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNqQixNQUFNLEtBQUssR0FBRztvQkFDYixFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRTtvQkFDN0IsRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUU7aUJBQzdCLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBeUIsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ2xCLE1BQU0sS0FBSyxHQUFHO29CQUNiLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFO29CQUMzQixFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRTtpQkFDN0IsQ0FBQztnQkFDRixNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxLQUF5QixFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakcsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNkLE1BQU0sS0FBSyxHQUFHO29CQUNiLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFO29CQUMzQixFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLElBQUksRUFBRTtvQkFDM0IsRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUU7b0JBQzdCLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFO29CQUMzQixFQUFFLFFBQVEsRUFBRSx5QkFBUSxDQUFDLE1BQU0sRUFBRTtvQkFDN0IsRUFBRSxRQUFRLEVBQUUseUJBQVEsQ0FBQyxNQUFNLEVBQUU7b0JBQzdCLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFO2lCQUMzQixDQUFDO2dCQUNGLE1BQU0sQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLEtBQXlCLEVBQUUsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDN0ksQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=