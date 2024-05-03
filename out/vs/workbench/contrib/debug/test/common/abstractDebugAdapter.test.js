/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/test/common/utils", "vs/workbench/contrib/debug/test/common/mockDebug"], function (require, exports, assert, async_1, utils_1, mockDebug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - AbstractDebugAdapter', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        suite('event ordering', () => {
            let adapter;
            let output;
            setup(() => {
                adapter = new mockDebug_1.MockDebugAdapter();
                output = [];
                adapter.onEvent(ev => {
                    output.push(ev.body.output);
                    Promise.resolve().then(() => output.push('--end microtask--'));
                });
            });
            const evaluate = async (expression) => {
                await new Promise(resolve => adapter.sendRequest('evaluate', { expression }, resolve));
                output.push(`=${expression}`);
                Promise.resolve().then(() => output.push('--end microtask--'));
            };
            test('inserts task boundary before response', async () => {
                await evaluate('before.foo');
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(output, ['before.foo', '--end microtask--', '=before.foo', '--end microtask--']);
            });
            test('inserts task boundary after response', async () => {
                await evaluate('after.foo');
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(output, ['=after.foo', '--end microtask--', 'after.foo', '--end microtask--']);
            });
            test('does not insert boundaries between events', async () => {
                adapter.sendEventBody('output', { output: 'a' });
                adapter.sendEventBody('output', { output: 'b' });
                adapter.sendEventBody('output', { output: 'c' });
                await (0, async_1.timeout)(0);
                assert.deepStrictEqual(output, ['a', 'b', 'c', '--end microtask--', '--end microtask--', '--end microtask--']);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3REZWJ1Z0FkYXB0ZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvZGVidWcvdGVzdC9jb21tb24vYWJzdHJhY3REZWJ1Z0FkYXB0ZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQU9oRyxLQUFLLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO1FBQzFDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxFQUFFO1lBQzVCLElBQUksT0FBeUIsQ0FBQztZQUM5QixJQUFJLE1BQWdCLENBQUM7WUFDckIsS0FBSyxDQUFDLEdBQUcsRUFBRTtnQkFDVixPQUFPLEdBQUcsSUFBSSw0QkFBZ0IsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUNaLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUU7b0JBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUUsRUFBZ0MsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzNELE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hFLENBQUMsQ0FBQyxDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUM7WUFFSCxNQUFNLFFBQVEsR0FBRyxLQUFLLEVBQUUsVUFBa0IsRUFBRSxFQUFFO2dCQUM3QyxNQUFNLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDOUIsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDLENBQUM7WUFFRixJQUFJLENBQUMsdUNBQXVDLEVBQUUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3hELE1BQU0sUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUM3QixNQUFNLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUVqQixNQUFNLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxhQUFhLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ3pHLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssSUFBSSxFQUFFO2dCQUN2RCxNQUFNLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxJQUFBLGVBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQztnQkFFakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQztZQUN2RyxDQUFDLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLElBQUksRUFBRTtnQkFDNUQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDakQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDakQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDakQsTUFBTSxJQUFBLGVBQU8sRUFBQyxDQUFDLENBQUMsQ0FBQztnQkFFakIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7WUFDaEgsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=