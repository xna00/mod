/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/base/test/common/utils", "vs/platform/markers/common/markerService", "vs/workbench/api/browser/mainThreadDiagnostics", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, async_1, uri_1, timeTravelScheduler_1, utils_1, markerService_1, mainThreadDiagnostics_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadDiagnostics', function () {
        let markerService;
        setup(function () {
            markerService = new markerService_1.MarkerService();
        });
        teardown(function () {
            markerService.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('clear markers on dispose', function () {
            const diag = new mainThreadDiagnostics_1.MainThreadDiagnostics(new class {
                constructor() {
                    this.remoteAuthority = '';
                    this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                }
                dispose() { }
                assertRegistered() { }
                set(v) { return null; }
                getProxy() {
                    return {
                        $acceptMarkersChange() { }
                    };
                }
                drain() { return null; }
            }, markerService, new class extends (0, workbenchTestServices_1.mock)() {
                asCanonicalUri(uri) { return uri; }
            });
            diag.$changeMany('foo', [[uri_1.URI.file('a'), [{
                            code: '666',
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 1,
                            endColumn: 1,
                            message: 'fffff',
                            severity: 1,
                            source: 'me'
                        }]]]);
            assert.strictEqual(markerService.read().length, 1);
            diag.dispose();
            assert.strictEqual(markerService.read().length, 0);
        });
        test('OnDidChangeDiagnostics triggers twice on same diagnostics #136434', function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const changedData = [];
                const diag = new mainThreadDiagnostics_1.MainThreadDiagnostics(new class {
                    constructor() {
                        this.remoteAuthority = '';
                        this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    dispose() { }
                    assertRegistered() { }
                    set(v) { return null; }
                    getProxy() {
                        return {
                            $acceptMarkersChange(data) {
                                changedData.push(data);
                            }
                        };
                    }
                    drain() { return null; }
                }, markerService, new class extends (0, workbenchTestServices_1.mock)() {
                    asCanonicalUri(uri) { return uri; }
                });
                const markerDataStub = {
                    code: '666',
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1,
                    severity: 1,
                    source: 'me'
                };
                const target = uri_1.URI.file('a');
                diag.$changeMany('foo', [[target, [{ ...markerDataStub, message: 'same_owner' }]]]);
                markerService.changeOne('bar', target, [{ ...markerDataStub, message: 'forgein_owner' }]);
                // added one marker via the API and one via the ext host. the latter must not
                // trigger an event to the extension host
                await (0, async_1.timeout)(0);
                assert.strictEqual(markerService.read().length, 2);
                assert.strictEqual(changedData.length, 1);
                assert.strictEqual(changedData[0].length, 1);
                assert.strictEqual(changedData[0][0][1][0].message, 'forgein_owner');
                diag.dispose();
            });
        });
        test('onDidChangeDiagnostics different behavior when "extensionKind" ui running on remote workspace #136955', function () {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({}, async () => {
                const markerData = {
                    code: '666',
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: 1,
                    endColumn: 1,
                    severity: 1,
                    source: 'me',
                    message: 'message'
                };
                const target = uri_1.URI.file('a');
                markerService.changeOne('bar', target, [markerData]);
                const changedData = [];
                const diag = new mainThreadDiagnostics_1.MainThreadDiagnostics(new class {
                    constructor() {
                        this.remoteAuthority = '';
                        this.extensionHostKind = 1 /* ExtensionHostKind.LocalProcess */;
                    }
                    dispose() { }
                    assertRegistered() { }
                    set(v) { return null; }
                    getProxy() {
                        return {
                            $acceptMarkersChange(data) {
                                changedData.push(data);
                            }
                        };
                    }
                    drain() { return null; }
                }, markerService, new class extends (0, workbenchTestServices_1.mock)() {
                    asCanonicalUri(uri) { return uri; }
                });
                diag.$clear('bar');
                await (0, async_1.timeout)(0);
                assert.strictEqual(markerService.read().length, 0);
                assert.strictEqual(changedData.length, 1);
                diag.dispose();
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERpYWdub3N0aWNzLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL21haW5UaHJlYWREaWFnbm9zdGljcy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBZ0JoRyxLQUFLLENBQUMsdUJBQXVCLEVBQUU7UUFFOUIsSUFBSSxhQUE0QixDQUFDO1FBRWpDLEtBQUssQ0FBQztZQUNMLGFBQWEsR0FBRyxJQUFJLDZCQUFhLEVBQUUsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILFFBQVEsQ0FBQztZQUNSLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxJQUFJLENBQUMsMEJBQTBCLEVBQUU7WUFFaEMsTUFBTSxJQUFJLEdBQUcsSUFBSSw2Q0FBcUIsQ0FDckMsSUFBSTtnQkFBQTtvQkFDSCxvQkFBZSxHQUFHLEVBQUUsQ0FBQztvQkFDckIsc0JBQWlCLDBDQUFrQztnQkFVcEQsQ0FBQztnQkFUQSxPQUFPLEtBQUssQ0FBQztnQkFDYixnQkFBZ0IsS0FBSyxDQUFDO2dCQUN0QixHQUFHLENBQUMsQ0FBTSxJQUFTLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakMsUUFBUTtvQkFDUCxPQUFPO3dCQUNOLG9CQUFvQixLQUFLLENBQUM7cUJBQzFCLENBQUM7Z0JBQ0gsQ0FBQztnQkFDRCxLQUFLLEtBQVUsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQzdCLEVBQ0QsYUFBYSxFQUNiLElBQUksS0FBTSxTQUFRLElBQUEsNEJBQUksR0FBdUI7Z0JBQ25DLGNBQWMsQ0FBQyxHQUFRLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQyxD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