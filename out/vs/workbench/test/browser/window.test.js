/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/window", "vs/base/common/lifecycle", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/workbench/browser/window", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, window_1, lifecycle_1, timeTravelScheduler_1, utils_1, window_2, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Window', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        class TestWindow extends window_2.BaseWindow {
            constructor(window, dom) {
                super(window, dom, new workbenchTestServices_1.TestHostService(), workbenchTestServices_1.TestEnvironmentService);
            }
            enableWindowFocusOnElementFocus() { }
        }
        test('multi window aware setTimeout()', async function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const disposables = new lifecycle_1.DisposableStore();
                let windows = [];
                const dom = {
                    getWindowsCount: () => windows.length,
                    getWindows: () => windows
                };
                const setTimeoutCalls = [];
                const clearTimeoutCalls = [];
                function createWindow(id, slow) {
                    const res = {
                        setTimeout: function (callback, delay, ...args) {
                            setTimeoutCalls.push(id);
                            return window_1.mainWindow.setTimeout(() => callback(id), slow ? delay * 2 : delay, ...args);
                        },
                        clearTimeout: function (timeoutId) {
                            clearTimeoutCalls.push(id);
                            return window_1.mainWindow.clearTimeout(timeoutId);
                        }
                    };
                    disposables.add(new TestWindow(res, dom));
                    return res;
                }
                const window1 = createWindow(1);
                windows = [{ window: window1, disposables }];
                // Window Count: 1
                let called = false;
                await new Promise((resolve, reject) => {
                    window1.setTimeout(() => {
                        if (!called) {
                            called = true;
                            resolve();
                        }
                        else {
                            reject(new Error('timeout called twice'));
                        }
                    }, 1);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [1]);
                assert.deepStrictEqual(clearTimeoutCalls, []);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                await new Promise((resolve, reject) => {
                    window1.setTimeout(() => {
                        if (!called) {
                            called = true;
                            resolve();
                        }
                        else {
                            reject(new Error('timeout called twice'));
                        }
                    }, 0);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [1]);
                assert.deepStrictEqual(clearTimeoutCalls, []);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                // Window Count: 3
                let window2 = createWindow(2);
                const window3 = createWindow(3);
                windows = [
                    { window: window2, disposables },
                    { window: window1, disposables },
                    { window: window3, disposables }
                ];
                await new Promise((resolve, reject) => {
                    window1.setTimeout(() => {
                        if (!called) {
                            called = true;
                            resolve();
                        }
                        else {
                            reject(new Error('timeout called twice'));
                        }
                    }, 1);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [2, 1, 3]);
                assert.deepStrictEqual(clearTimeoutCalls, [2, 1, 3]);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                // Window Count: 2 (1 fast, 1 slow)
                window2 = createWindow(2, true);
                windows = [
                    { window: window2, disposables },
                    { window: window1, disposables },
                ];
                await new Promise((resolve, reject) => {
                    window1.setTimeout((windowId) => {
                        if (!called && windowId === 1) {
                            called = true;
                            resolve();
                        }
                        else if (called) {
                            reject(new Error('timeout called twice'));
                        }
                        else {
                            reject(new Error('timeout called for wrong window'));
                        }
                    }, 1);
                });
                assert.strictEqual(called, true);
                assert.deepStrictEqual(setTimeoutCalls, [2, 1]);
                assert.deepStrictEqual(clearTimeoutCalls, [2, 1]);
                called = false;
                setTimeoutCalls.length = 0;
                clearTimeoutCalls.length = 0;
                disposables.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC90ZXN0L2Jyb3dzZXIvd2luZG93LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsS0FBSyxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFFcEIsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLE1BQU0sVUFBVyxTQUFRLG1CQUFVO1lBRWxDLFlBQVksTUFBa0IsRUFBRSxHQUF5RjtnQkFDeEgsS0FBSyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSx1Q0FBZSxFQUFFLEVBQUUsOENBQXNCLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBRWtCLCtCQUErQixLQUFXLENBQUM7U0FDOUQ7UUFFRCxJQUFJLENBQUMsaUNBQWlDLEVBQUUsS0FBSztZQUM1QyxPQUFPLElBQUEsd0NBQWtCLEVBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQzdELE1BQU0sV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO2dCQUUxQyxJQUFJLE9BQU8sR0FBNEIsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLEdBQUcsR0FBRztvQkFDWCxlQUFlLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU07b0JBQ3JDLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPO2lCQUN6QixDQUFDO2dCQUVGLE1BQU0sZUFBZSxHQUFhLEVBQUUsQ0FBQztnQkFDckMsTUFBTSxpQkFBaUIsR0FBYSxFQUFFLENBQUM7Z0JBRXZDLFNBQVMsWUFBWSxDQUFDLEVBQVUsRUFBRSxJQUFjO29CQUMvQyxNQUFNLEdBQUcsR0FBRzt3QkFDWCxVQUFVLEVBQUUsVUFBVSxRQUFrQixFQUFFLEtBQWEsRUFB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