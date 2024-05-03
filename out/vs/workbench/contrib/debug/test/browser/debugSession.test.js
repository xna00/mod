/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/workbench/contrib/debug/browser/debugSession"], function (require, exports, assert, utils_1, debugSession_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('DebugSession - ThreadStatusScheduler', () => {
        const ds = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('cancel base case', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            await scheduler.run(Promise.resolve([1]), async (threadId, token) => {
                assert.strictEqual(threadId, 1);
                assert.strictEqual(token.isCancellationRequested, false);
                scheduler.cancel([1]);
                assert.strictEqual(token.isCancellationRequested, true);
            });
        });
        test('cancel global', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            await scheduler.run(Promise.resolve([1]), async (threadId, token) => {
                assert.strictEqual(threadId, 1);
                assert.strictEqual(token.isCancellationRequested, false);
                scheduler.cancel(undefined);
                assert.strictEqual(token.isCancellationRequested, true);
            });
        });
        test('cancels when new work comes in', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            let innerCalled = false;
            await scheduler.run(Promise.resolve([1]), async (threadId, token1) => {
                assert.strictEqual(threadId, 1);
                assert.strictEqual(token1.isCancellationRequested, false);
                await scheduler.run(Promise.resolve([1]), async (_threadId, token2) => {
                    innerCalled = true;
                    assert.strictEqual(token1.isCancellationRequested, true);
                    assert.strictEqual(token2.isCancellationRequested, false);
                });
            });
            assert.strictEqual(innerCalled, true);
        });
        test('cancels slower lookups when new lookup is made', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            const innerCalled1 = [];
            const innerCalled2 = [];
            await Promise.all([
                scheduler.run(Promise.resolve().then(() => { }).then(() => [1, 3]), async (threadId) => {
                    innerCalled1.push(threadId);
                }),
                scheduler.run(Promise.resolve([1, 2]), async (threadId) => {
                    innerCalled2.push(threadId);
                })
            ]);
            assert.deepEqual(innerCalled1, [3]);
            assert.deepEqual(innerCalled2, [1, 2]);
        });
        test('allows work with other IDs', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            let innerCalled = false;
            await scheduler.run(Promise.resolve([1]), async (threadId, token1) => {
                assert.strictEqual(threadId, 1);
                assert.strictEqual(token1.isCancellationRequested, false);
                await scheduler.run(Promise.resolve([2]), async (_threadId, token2) => {
                    innerCalled = true;
                    assert.strictEqual(token1.isCancellationRequested, false);
                    assert.strictEqual(token2.isCancellationRequested, false);
                });
            });
            assert.strictEqual(innerCalled, true);
        });
        test('cancels when called during reslution', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            let innerCalled = false;
            await scheduler.run(Promise.resolve().then(() => scheduler.cancel([1])).then(() => [1]), async () => {
                innerCalled = true;
            });
            assert.strictEqual(innerCalled, false);
        });
        test('global cancels when called during reslution', async () => {
            const scheduler = ds.add(new debugSession_1.ThreadStatusScheduler());
            let innerCalled = false;
            await scheduler.run(Promise.resolve().then(() => scheduler.cancel(undefined)).then(() => [1]), async () => {
                innerCalled = true;
            });
            assert.strictEqual(innerCalled, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdTZXNzaW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL3Rlc3QvYnJvd3Nlci9kZWJ1Z1Nlc3Npb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsc0NBQXNDLEVBQUUsR0FBRyxFQUFFO1FBQ2xELE1BQU0sRUFBRSxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUVyRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkMsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLG9DQUFxQixFQUFFLENBQUMsQ0FBQztZQUV0RCxNQUFNLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDbkUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUN6RCxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdEIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDekQsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEMsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLG9DQUFxQixF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