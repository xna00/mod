/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/progress/common/progress"], function (require, exports, assert, timeTravelScheduler_1, utils_1, progress_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Progress', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('multiple report calls are processed in sequence', async () => {
            await (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true, maxTaskCount: 100 }, async () => {
                const executionOrder = [];
                const timeout = (time) => {
                    return new Promise(resolve => setTimeout(resolve, time));
                };
                const executor = async (value) => {
                    executionOrder.push(`start ${value}`);
                    if (value === 1) {
                        // 1 is slowest
                        await timeout(100);
                    }
                    else if (value === 2) {
                        // 2 is also slow
                        await timeout(50);
                    }
                    else {
                        // 3 is fast
                        await timeout(10);
                    }
                    executionOrder.push(`end ${value}`);
                };
                const progress = new progress_1.AsyncProgress(executor);
                progress.report(1);
                progress.report(2);
                progress.report(3);
                await timeout(1000);
                assert.deepStrictEqual(executionOrder, [
                    'start 1',
                    'end 1',
                    'start 2',
                    'end 2',
                    'start 3',
                    'end 3',
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZ3Jlc3MudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vcHJvZ3Jlc3MvdGVzdC9jb21tb24vcHJvZ3Jlc3MudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUV0QixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ2xFLE1BQU0sSUFBQSx3Q0FBa0IsRUFBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUMvRSxNQUFNLGNBQWMsR0FBYSxFQUFFLENBQUM7Z0JBQ3BDLE1BQU0sT0FBTyxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUU7b0JBQ2hDLE9BQU8sSUFBSSxPQUFPLENBQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLENBQUMsQ0FBQztnQkFDRixNQUFNLFFBQVEsR0FBRyxLQUFLLEVBQUUsS0FBYSxFQUFFLEVBQUU7b0JBQ3hDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLEVBQUUsQ0FBQyxDQUFDO29CQUN0QyxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDakIsZUFBZTt3QkFDZixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDcEIsQ0FBQzt5QkFBTSxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDeEIsaUJBQWlCO3dCQUNqQixNQUFNLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDbkIsQ0FBQzt5QkFBTSxDQUFDO3dCQUNQLFlBQVk7d0JBQ1osTUFBTSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ25CLENBQUM7b0JBQ0QsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3JDLENBQUMsQ0FBQztnQkFDRixNQUFNLFFBQVEsR0FBRyxJQUFJLHdCQUFhLENBQVMsUUFBUSxDQUFDLENBQUM7Z0JBRXJELFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRW5CLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUVwQixNQUFNLENBQUMsZUFBZSxDQUFDLGNBQWMsRUFBRTtvQkFDdEMsU0FBUztvQkFDVCxPQUFPO29CQUNQLFNBQVM7b0JBQ1QsT0FBTztvQkFDUCxTQUFTO29CQUNULE9BQU87aUJBQ1AsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=