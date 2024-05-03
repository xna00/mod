/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/workbench/services/lifecycle/electron-sandbox/lifecycleService", "vs/workbench/test/electron-sandbox/workbenchTestServices"], function (require, exports, assert, lifecycle_1, utils_1, lifecycleService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Lifecycleservice', function () {
        let lifecycleService;
        const disposables = new lifecycle_1.DisposableStore();
        class TestLifecycleService extends lifecycleService_1.NativeLifecycleService {
            testHandleBeforeShutdown(reason) {
                return super.handleBeforeShutdown(reason);
            }
            testHandleWillShutdown(reason) {
                return super.handleWillShutdown(reason);
            }
        }
        setup(async () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            lifecycleService = disposables.add(instantiationService.createInstance(TestLifecycleService));
        });
        teardown(async () => {
            disposables.clear();
        });
        test('onBeforeShutdown - final veto called after other vetos', async function () {
            let vetoCalled = false;
            let finalVetoCalled = false;
            const order = [];
            disposables.add(lifecycleService.onBeforeShutdown(e => {
                e.veto(new Promise(resolve => {
                    vetoCalled = true;
                    order.push(1);
                    resolve(false);
                }), 'test');
            }));
            disposables.add(lifecycleService.onBeforeShutdown(e => {
                e.finalVeto(() => {
                    return new Promise(resolve => {
                        finalVetoCalled = true;
                        order.push(2);
                        resolve(true);
                    });
                }, 'test');
            }));
            const veto = await lifecycleService.testHandleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
            assert.strictEqual(vetoCalled, true);
            assert.strictEqual(finalVetoCalled, true);
            assert.strictEqual(order[0], 1);
            assert.strictEqual(order[1], 2);
        });
        test('onBeforeShutdown - final veto not called when veto happened before', async function () {
            let vetoCalled = false;
            let finalVetoCalled = false;
            disposables.add(lifecycleService.onBeforeShutdown(e => {
                e.veto(new Promise(resolve => {
                    vetoCalled = true;
                    resolve(true);
                }), 'test');
            }));
            disposables.add(lifecycleService.onBeforeShutdown(e => {
                e.finalVeto(() => {
                    return new Promise(resolve => {
                        finalVetoCalled = true;
                        resolve(true);
                    });
                }, 'test');
            }));
            const veto = await lifecycleService.testHandleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
            assert.strictEqual(vetoCalled, true);
            assert.strictEqual(finalVetoCalled, false);
        });
        test('onBeforeShutdown - veto with error is treated as veto', async function () {
            disposables.add(lifecycleService.onBeforeShutdown(e => {
                e.veto(new Promise((resolve, reject) => {
                    reject(new Error('Fail'));
                }), 'test');
            }));
            const veto = await lifecycleService.testHandleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
        });
        test('onBeforeShutdown - final veto with error is treated as veto', async function () {
            disposables.add(lifecycleService.onBeforeShutdown(e => {
                e.finalVeto(() => new Promise((resolve, reject) => {
                    reject(new Error('Fail'));
                }), 'test');
            }));
            const veto = await lifecycleService.testHandleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
        });
        test('onWillShutdown - join', async function () {
            let joinCalled = false;
            disposables.add(lifecycleService.onWillShutdown(e => {
                e.join(new Promise(resolve => {
                    joinCalled = true;
                    resolve();
                }), { id: 'test', label: 'test' });
            }));
            await lifecycleService.testHandleWillShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(joinCalled, true);
        });
        test('onWillShutdown - join with error is handled', async function () {
            let joinCalled = false;
            disposables.add(lifecycleService.onWillShutdown(e => {
                e.join(new Promise((resolve, reject) => {
                    joinCalled = true;
                    reject(new Error('Fail'));
                }), { id: 'test', label: 'test' });
            }));
            await lifecycleService.testHandleWillShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(joinCalled, true);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlmZWN5Y2xlU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvbGlmZWN5Y2xlL3Rlc3QvZWxlY3Ryb24tc2FuZGJveC9saWZlY3ljbGVTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFTaEcsS0FBSyxDQUFDLGtCQUFrQixFQUFFO1FBRXpCLElBQUksZ0JBQXNDLENBQUM7UUFDM0MsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFFMUMsTUFBTSxvQkFBcUIsU0FBUSx5Q0FBc0I7WUFFeEQsd0JBQXdCLENBQUMsTUFBc0I7Z0JBQzlDLE9BQU8sS0FBSyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFFRCxzQkFBc0IsQ0FBQyxNQUFzQjtnQkFDNUMsT0FBTyxLQUFLLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekMsQ0FBQztTQUNEO1FBRUQsS0FBSyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2hCLE1BQU0sb0JBQW9CLEdBQUcsSUFBQSxxREFBNkIsRUFBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbkYsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQy9GLENBQUMsQ0FBQyxDQUFDO1FBRUgsUUFBUSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ25CLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyx3REFBd0QsRUFBRSxLQUFLO1lBQ25FLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJ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