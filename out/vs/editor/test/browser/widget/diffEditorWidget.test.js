/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/editor/browser/widget/diffEditor/diffEditorViewModel", "vs/editor/common/core/lineRange", "vs/editor/common/diff/rangeMapping"], function (require, exports, assert, utils_1, diffEditorViewModel_1, lineRange_1, rangeMapping_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DiffEditorWidget2', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('UnchangedRegion', () => {
            function serialize(regions) {
                return regions.map(r => `${r.originalUnchangedRange} - ${r.modifiedUnchangedRange}`);
            }
            test('Everything changed', () => {
                assert.deepStrictEqual(serialize(diffEditorViewModel_1.UnchangedRegion.fromDiffs([new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(1, 10), new lineRange_1.LineRange(1, 10), [])], 10, 10, 3, 3)), []);
            });
            test('Nothing changed', () => {
                assert.deepStrictEqual(serialize(diffEditorViewModel_1.UnchangedRegion.fromDiffs([], 10, 10, 3, 3)), [
                    "[1,11) - [1,11)"
                ]);
            });
            test('Change in the middle', () => {
                assert.deepStrictEqual(serialize(diffEditorViewModel_1.UnchangedRegion.fromDiffs([new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(50, 60), new lineRange_1.LineRange(50, 60), [])], 100, 100, 3, 3)), ([
                    '[1,47) - [1,47)',
                    '[63,101) - [63,101)'
                ]));
            });
            test('Change at the end', () => {
                assert.deepStrictEqual(serialize(diffEditorViewModel_1.UnchangedRegion.fromDiffs([new rangeMapping_1.DetailedLineRangeMapping(new lineRange_1.LineRange(99, 100), new lineRange_1.LineRange(100, 100), [])], 100, 100, 3, 3)), (["[1,96) - [1,96)"]));
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvcldpZGdldC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvdGVzdC9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yV2lkZ2V0LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFRaEcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM3QixTQUFTLFNBQVMsQ0FBQyxPQUEwQjtnQkFDNUMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsc0JBQXNCLE1BQU0sQ0FBQyxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQztZQUN0RixDQUFDO1lBRUQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsRUFBRTtnQkFDL0IsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMscUNBQWUsQ0FBQyxTQUFTLENBQ3pELENBQUMsSUFBSSx1Q0FBd0IsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFDOUUsRUFBRSxFQUNGLEVBQUUsRUFDRixDQUFDLEVBQ0QsQ0FBQyxDQUNELENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNULENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtnQkFDNUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMscUNBQWUsQ0FBQyxTQUFTLENBQ3pELEVBQUUsRUFDRixFQUFFLEVBQ0YsRUFBRSxFQUNGLENBQUMsRUFDRCxDQUFDLENBQ0QsQ0FBQyxFQUFFO29CQUNILGlCQUFpQjtpQkFDakIsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxFQUFFO2dCQUNqQyxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxxQ0FBZSxDQUFDLFNBQVMsQ0FDekQsQ0FBQyxJQUFJLHVDQUF3QixDQUFDLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUNoRixHQUFHLEVBQ0gsR0FBRyxFQUNILENBQUMsRUFDRCxDQUFDLENBQ0QsQ0FBQyxFQUFFLENBQUM7b0JBQ0osaUJBQWlCO29CQUNqQixxQkFBcUI7aUJBQ3JCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO2dCQUM5QixNQUFNLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxxQ0FBZSxDQUFDLFNBQVMsQ0FDekQsQ0FBQyxJQUFJLHVDQUF3QixDQUFDLElBQUkscUJBQVMsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxxQkFBUyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUNuRixHQUFHLEVBQ0gsR0FBRyxFQUNILENBQUMsRUFDRCxDQUFDLENBQ0QsQ0FBQyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==