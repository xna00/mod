/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/test/common/utils", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, assert, cancellation_1, uri_1, utils_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NativeTextSearchManager', () => {
        test('fixes encoding', async () => {
            let correctEncoding = false;
            const provider = {
                provideTextSearchResults(query, options, progress, token) {
                    correctEncoding = options.encoding === 'windows-1252';
                    return null;
                }
            };
            const query = {
                type: 2 /* QueryType.Text */,
                contentPattern: {
                    pattern: 'a'
                },
                folderQueries: [{
                        folder: uri_1.URI.file('/some/folder'),
                        fileEncoding: 'windows1252'
                    }]
            };
            const m = new textSearchManager_1.NativeTextSearchManager(query, provider);
            await m.search(() => { }, cancellation_1.CancellationToken.None);
            assert.ok(correctEncoding);
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dFNlYXJjaE1hbmFnZXIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL3NlcnZpY2VzL3NlYXJjaC90ZXN0L25vZGUvdGV4dFNlYXJjaE1hbmFnZXIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVdoRyxLQUFLLENBQUMseUJBQXlCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqQyxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDNUIsTUFBTSxRQUFRLEdBQXVCO2dCQUNwQyx3QkFBd0IsQ0FBQyxLQUFzQixFQUFFLE9BQTBCLEVBQUUsUUFBb0MsRUFBRSxLQUF3QjtvQkFDMUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssY0FBYyxDQUFDO29CQUV0RCxPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO2FBQ0QsQ0FBQztZQUVGLE1BQU0sS0FBSyxHQUFlO2dCQUN6QixJQUFJLHdCQUFnQjtnQkFDcEIsY0FBYyxFQUFFO29CQUNmLE9BQU8sRUFBRSxHQUFHO2lCQUNaO2dCQUNELGFBQWEsRUFBRSxDQUFDO3dCQUNmLE1BQU0sRUFBRSxTQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQzt3QkFDaEMsWUFBWSxFQUFFLGFBQWE7cUJBQzNCLENBQUM7YUFDRixDQUFDO1lBRUYsTUFBTSxDQUFDLEdBQUcsSUFBSSwyQ0FBdUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDdkQsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxnQ0FBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVsRCxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO0lBQzNDLENBQUMsQ0FBQyxDQUFDIn0=