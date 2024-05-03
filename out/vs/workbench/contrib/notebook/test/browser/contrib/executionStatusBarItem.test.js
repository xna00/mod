/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController"], function (require, exports, assert, utils_1, executionStatusBarItemController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('notebookBrowser', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('formatCellDuration', function () {
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(0, false), '0.0s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(0), '0ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(10, false), '0.0s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(10), '10ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(100, false), '0.1s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(100), '100ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(200, false), '0.2s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(200), '200ms');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(3300), '3.3s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(180000), '3m 0.0s');
            assert.strictEqual((0, executionStatusBarItemController_1.formatCellDuration)(189412), '3m 9.4s');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0aW9uU3RhdHVzQmFySXRlbS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvY29udHJpYi9leGVjdXRpb25TdGF0dXNCYXJJdGVtLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtRQUM3QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzFCLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFEQUFrQixFQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFEQUFrQixFQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25ELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFEQUFrQixFQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFEQUFrQixFQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3JELE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBQSxxREFBa0IsRUFBQyxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUEscURBQWtCLEVBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDMUQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFBLHFEQUFrQixFQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUMifQ==