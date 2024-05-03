/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/common/mockDebug", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, async_1, lifecycle_1, mock_1, utils_1, log_1, debugModel_1, mockDebug_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DebugModel', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('FunctionBreakpoint', () => {
            test('Id is saved', () => {
                const fbp = new debugModel_1.FunctionBreakpoint({ name: 'function', enabled: true, hitCondition: 'hit condition', condition: 'condition', logMessage: 'log message' });
                const strigified = JSON.stringify(fbp);
                const parsed = JSON.parse(strigified);
                assert.equal(parsed.id, fbp.getId());
            });
        });
        suite('ExceptionBreakpoint', () => {
            test('Restored matches new', () => {
                const ebp = new debugModel_1.ExceptionBreakpoint({
                    conditionDescription: 'condition description',
                    description: 'description',
                    filter: 'condition',
                    label: 'label',
                    supportsCondition: true,
                    enabled: true,
                }, 'id');
                const strigified = JSON.stringify(ebp);
                const parsed = JSON.parse(strigified);
                const newEbp = new debugModel_1.ExceptionBreakpoint(parsed);
                assert.ok(ebp.matches(newEbp));
            });
        });
        suite('DebugModel', () => {
            test('refreshTopOfCallstack resolves all returned promises when called multiple times', async () => {
                const topFrameDeferred = new async_1.DeferredPromise();
                const wholeStackDeferred = new async_1.DeferredPromise();
                const fakeThread = (0, mock_1.mockObject)()({
                    session: { capabilities: { supportsDelayedStackTraceLoading: true } },
                    getCallStack: () => [],
                    getStaleCallStack: () => [],
                });
                fakeThread.fetchCallStack.callsFake((levels) => {
                    return levels === 1 ? topFrameDeferred.p : wholeStackDeferred.p;
                });
                fakeThread.getId.returns(1);
                const disposable = new lifecycle_1.DisposableStore();
                const storage = disposable.add(new workbenchTestServices_1.TestStorageService());
                const model = new debugModel_1.DebugModel(disposable.add(new mockDebug_1.MockDebugStorage(storage)), { isDirty: (e) => false }, undefined, new log_1.NullLogService());
                disposable.add(model);
                let top1Resolved = false;
                let whole1Resolved = false;
                let top2Resolved = false;
                let whole2Resolved = false;
                const result1 = model.refreshTopOfCallstack(fakeThread);
                result1.topCallStack.then(() => top1Resolved = true);
                result1.wholeCallStack.then(() => whole1Resolved = true);
                const result2 = model.refreshTopOfCallstack(fakeThread);
                result2.topCallStack.then(() => top2Resolved = true);
                result2.wholeCallStack.then(() => whole2Resolved = true);
                assert.ok(!top1Resolved);
                assert.ok(!whole1Resolved);
                assert.ok(!top2Resolved);
                assert.ok(!whole2Resolved);
                await topFrameDeferred.complete();
                await result1.topCallStack;
                await result2.topCallStack;
                assert.ok(!whole1Resolved);
                assert.ok(!whole2Resolved);
                await wholeStackDeferred.complete();
                await result1.wholeCallStack;
                await result2.wholeCallStack;
                disposable.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy90ZXN0L2NvbW1vbi9kZWJ1Z01vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFZaEcsS0FBSyxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7UUFDeEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7WUFDaEMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksK0JBQWtCLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDO2dCQUMxSixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN0QyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDdEMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLEVBQUU7WUFDakMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEdBQUcsRUFBRTtnQkFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxnQ0FBbUIsQ0FBQztvQkFDbkMsb0JBQW9CLEVBQUUsdUJBQXVCO29CQUM3QyxXQUFX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