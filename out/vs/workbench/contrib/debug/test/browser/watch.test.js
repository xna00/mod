/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/debug/test/browser/mockDebugModel"], function (require, exports, assert, utils_1, mockDebugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Expressions
    function assertWatchExpressions(watchExpressions, expectedName) {
        assert.strictEqual(watchExpressions.length, 2);
        watchExpressions.forEach(we => {
            assert.strictEqual(we.available, false);
            assert.strictEqual(we.reference, 0);
            assert.strictEqual(we.name, expectedName);
        });
    }
    suite('Debug - Watch', () => {
        let model;
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            model = (0, mockDebugModel_1.createMockDebugModel)(disposables);
        });
        test('watch expressions', () => {
            assert.strictEqual(model.getWatchExpressions().length, 0);
            model.addWatchExpression('console');
            model.addWatchExpression('console');
            let watchExpressions = model.getWatchExpressions();
            assertWatchExpressions(watchExpressions, 'console');
            model.renameWatchExpression(watchExpressions[0].getId(), 'new_name');
            model.renameWatchExpression(watchExpressions[1].getId(), 'new_name');
            assertWatchExpressions(model.getWatchExpressions(), 'new_name');
            assertWatchExpressions(model.getWatchExpressions(), 'new_name');
            model.addWatchExpression('mockExpression');
            model.moveWatchExpression(model.getWatchExpressions()[2].getId(), 1);
            watchExpressions = model.getWatchExpressions();
            assert.strictEqual(watchExpressions[0].name, 'new_name');
            assert.strictEqual(watchExpressions[1].name, 'mockExpression');
            assert.strictEqual(watchExpressions[2].name, 'new_name');
            model.removeWatchExpressions();
            assert.strictEqual(model.getWatchExpressions().length, 0);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F0Y2gudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9icm93c2VyL3dhdGNoLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFPaEcsY0FBYztJQUVkLFNBQVMsc0JBQXNCLENBQUMsZ0JBQThCLEVBQUUsWUFBb0I7UUFDbkYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDL0MsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4QyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELEtBQUssQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQzNCLElBQUksS0FBaUIsQ0FBQztRQUN0QixNQUFNLFdBQVcsR0FBRyxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFOUQsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUNWLEtBQUssR0FBRyxJQUFBLHFDQUFvQixFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtZQUM5QixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMxRCxLQUFLLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDbkQsc0JBQXNCLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFFcEQsS0FBSyxDQUFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3JFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUNyRSxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVoRSxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUVoRSxLQUFLLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUMzQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckUsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDL0MsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUMvRCxNQUFNLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztZQUV6RCxLQUFLLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztZQUMvQixNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzRCxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=