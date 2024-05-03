/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/log/common/log", "vs/workbench/api/common/extHostDecorations", "vs/workbench/services/extensions/common/extensions"], function (require, exports, assert, async_1, cancellation_1, uri_1, mock_1, utils_1, log_1, extHostDecorations_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostDecorations', function () {
        let mainThreadShape;
        let extHostDecorations;
        const providers = new Set();
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(function () {
            providers.clear();
            mainThreadShape = new class extends (0, mock_1.mock)() {
                $registerDecorationProvider(handle) {
                    providers.add(handle);
                }
            };
            extHostDecorations = new extHostDecorations_1.ExtHostDecorations(new class extends (0, mock_1.mock)() {
                getProxy() {
                    return mainThreadShape;
                }
            }, new log_1.NullLogService());
        });
        test('SCM Decorations missing #100524', async function () {
            let calledA = false;
            let calledB = false;
            // never returns
            extHostDecorations.registerFileDecorationProvider({
                provideFileDecoration() {
                    calledA = true;
                    return new Promise(() => { });
                }
            }, extensions_1.nullExtensionDescription);
            // always returns
            extHostDecorations.registerFileDecorationProvider({
                provideFileDecoration() {
                    calledB = true;
                    return new Promise(resolve => resolve({ badge: 'H', tooltip: 'Hello' }));
                }
            }, extensions_1.nullExtensionDescription);
            const requests = [...providers.values()].map((handle, idx) => {
                return extHostDecorations.$provideDecorations(handle, [{ id: idx, uri: uri_1.URI.parse('test:///file') }], cancellation_1.CancellationToken.None);
            });
            assert.strictEqual(calledA, true);
            assert.strictEqual(calledB, true);
            assert.strictEqual(requests.length, 2);
            const [first, second] = requests;
            const firstResult = await Promise.race([first, (0, async_1.timeout)(30).then(() => false)]);
            assert.strictEqual(typeof firstResult, 'boolean'); // never finishes...
            const secondResult = await Promise.race([second, (0, async_1.timeout)(30).then(() => false)]);
            assert.strictEqual(typeof secondResult, 'object');
            await (0, async_1.timeout)(30);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdERlY29yYXRpb25zLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3REZWNvcmF0aW9ucy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBY2hHLEtBQUssQ0FBQyxvQkFBb0IsRUFBRTtRQUUzQixJQUFJLGVBQTJDLENBQUM7UUFDaEQsSUFBSSxrQkFBc0MsQ0FBQztRQUMzQyxNQUFNLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1FBRXBDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUM7WUFFTCxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFbEIsZUFBZSxHQUFHLElBQUksS0FBTSxTQUFRLElBQUEsV0FBSSxHQUE4QjtnQkFDNUQsMkJBQTJCLENBQUMsTUFBYztvQkFDbEQsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdkIsQ0FBQzthQUNELENBQUM7WUFFRixrQkFBa0IsR0FBRyxJQUFJLHVDQUFrQixDQUMxQyxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBc0I7Z0JBQ2xDLFFBQVE7b0JBQ2hCLE9BQU8sZUFBZSxDQUFDO2dCQUN4QixDQUFDO2FBQ0QsRUFDRCxJQUFJLG9CQUFjLEVBQUUsQ0FDcEIsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEtBQUs7WUFFNUMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztZQUVwQixnQkFBZ0I7WUFDaEIsa0JBQWtCLENBQUMsOEJBQThCLENBQUM7Z0JBRWpELHFCQUFxQjtvQkFDcEIsT0FBTyxHQUFHLElBQUksQ0FBQztvQkFDZixPQUFPLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUMvQixDQUFDO2FBQ0QsRUFBRSxxQ0FBd0IsQ0FBQyxDQUFDO1lBRTdCLGlCQUFpQjtZQUNqQixrQkFBa0IsQ0FBQyw4QkFBOEIsQ0FBQztnQkFFakQscUJBQXFCO29CQUNwQixPQUFPLEdBQUcsSUFBSSxDQUFDO29CQUNmLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLENBQUM7YUFDRCxFQUFFLHFDQUF3QixDQUFDLENBQUM7WUFHN0IsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDNUQsT0FBTyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFNBQUcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGdDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlILENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFbEMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBRWpDLE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFBLGVBQU8sRUFBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxvQkFBb0I7WUFFdkUsTUFBTSxZQUFZLEdBQUcsTUFBTSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakYsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUdsRCxNQUFNLElBQUEsZUFBTyxFQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO0lBRUosQ0FBQyxDQUFDLENBQUMifQ==