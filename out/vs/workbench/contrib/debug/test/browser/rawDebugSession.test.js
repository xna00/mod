/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/workbench/contrib/debug/browser/rawDebugSession", "vs/workbench/contrib/debug/test/common/mockDebug"], function (require, exports, assert, mock_1, utils_1, rawDebugSession_1, mockDebug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('RawDebugSession', () => {
        const disposables = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        function createTestObjects() {
            const debugAdapter = new mockDebug_1.MockDebugAdapter();
            const dbgr = (0, mock_1.mockObject)()({
                type: 'mock-debug'
            });
            const session = new rawDebugSession_1.RawDebugSession(debugAdapter, dbgr, 'sessionId', 'name', new ((0, mock_1.mock)()), new ((0, mock_1.mock)()), new ((0, mock_1.mock)()), new ((0, mock_1.mock)()));
            disposables.add(session);
            disposables.add(debugAdapter);
            return { debugAdapter, dbgr };
        }
        test('handles startDebugging request success', async () => {
            const { debugAdapter, dbgr } = createTestObjects();
            dbgr.startDebugging.returns(Promise.resolve(true));
            debugAdapter.sendRequestBody('startDebugging', {
                request: 'launch',
                configuration: {
                    type: 'some-other-type'
                }
            });
            const response = await debugAdapter.waitForResponseFromClient('startDebugging');
            assert.strictEqual(response.command, 'startDebugging');
            assert.strictEqual(response.success, true);
        });
        test('handles startDebugging request failure', async () => {
            const { debugAdapter, dbgr } = createTestObjects();
            dbgr.startDebugging.returns(Promise.resolve(false));
            debugAdapter.sendRequestBody('startDebugging', {
                request: 'launch',
                configuration: {
                    type: 'some-other-type'
                }
            });
            const response = await debugAdapter.waitForResponseFromClient('startDebugging');
            assert.strictEqual(response.command, 'startDebugging');
            assert.strictEqual(response.success, false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3RGVidWdTZXNzaW9uLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2RlYnVnL3Rlc3QvYnJvd3Nlci9yYXdEZWJ1Z1Nlc3Npb24udGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWFoRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1FBQzdCLE1BQU0sV0FBVyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUU5RCxTQUFTLGlCQUFpQjtZQUN6QixNQUFNLFlBQVksR0FBRyxJQUFJLDRCQUFnQixFQUFFLENBQUM7WUFDNUMsTUFBTSxJQUFJLEdBQUcsSUFBQSxpQkFBVSxHQUFhLENBQUM7Z0JBQ3BDLElBQUksRUFBRSxZQUFZO2FBQ2xCLENBQUMsQ0FBQztZQUVILE1BQU0sT0FBTyxHQUFHLElBQUksaUNBQWUsQ0FDbEMsWUFBWSxFQUNaLElBQXdCLEVBQ3hCLFdBQVcsRUFDWCxNQUFNLEVBQ04sSUFBSSxDQUFDLElBQUEsV0FBSSxHQUE4QixDQUFDLEVBQ3hDLElBQUksQ0FBQyxJQUFBLFdBQUksR0FBa0IsQ0FBQyxFQUM1QixJQUFJLENBQUMsSUFBQSxXQUFJLEdBQXdCLENBQUMsRUFDbEMsSUFBSSxDQUFDLElBQUEsV0FBSSxHQUFrQixDQUFDLENBQUMsQ0FBQztZQUMvQixXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLFdBQVcsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFOUIsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRUQsSUFBSSxDQUFDLHdDQUF3QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ3pELE1BQU0sRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFbkQsWUFBWSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDOUMsT0FBTyxFQUFFLFFBQVE7Z0JBQ2pCLGFBQWEsRUFBRTtvQkFDZCxJQUFJLEVBQUUsaUJBQWlCO2lCQUN2QjthQUMrQyxDQUFDLENBQUM7WUFDbkQsTUFBTSxRQUFRLEdBQUcsTUFBTSxZQUFZLENBQUMseUJBQXlCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUNoRixNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsd0NBQXdDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekQsTUFBTSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsR0FBRyxpQkFBaUIsRUFBRSxDQUFDO1lBQ25ELElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUVwRCxZQUFZLENBQUMsZUFBZSxDQUFDLGdCQUFnQixFQUFFO2dCQUM5QyxPQUFPLEVBQUUsUUFBUTtnQkFDakIsYUFBYSxFQUFFO29CQUNkLElBQUksRUFBRSxpQkFBaUI7aUJBQ3ZCO2FBQytDLENBQUMsQ0FBQztZQUNuRCxNQUFNLFFBQVEsR0FBRyxNQUFNLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ2hGLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDIn0=