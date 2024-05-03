/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/utils", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService"], function (require, exports, assert, uri_1, utils_1, markers_1, markerService) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function randomMarkerData(severity = markers_1.MarkerSeverity.Error) {
        return {
            severity,
            message: Math.random().toString(16),
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: 1
        };
    }
    suite('Marker Service', () => {
        let service;
        teardown(function () {
            service.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('query', () => {
            service = new markerService.MarkerService();
            service.changeAll('far', [{
                    resource: uri_1.URI.parse('file:///c/test/file.cs'),
                    marker: randomMarkerData(markers_1.MarkerSeverity.Error)
                }]);
            assert.strictEqual(service.read().length, 1);
            assert.strictEqual(service.read({ owner: 'far' }).length, 1);
            assert.strictEqual(service.read({ resource: uri_1.URI.parse('file:///c/test/file.cs') }).length, 1);
            assert.strictEqual(service.read({ owner: 'far', resource: uri_1.URI.parse('file:///c/test/file.cs') }).length, 1);
            service.changeAll('boo', [{
                    resource: uri_1.URI.parse('file:///c/test/file.cs'),
                    marker: randomMarkerData(markers_1.MarkerSeverity.Warning)
                }]);
            assert.strictEqual(service.read().length, 2);
            assert.strictEqual(service.read({ owner: 'far' }).length, 1);
            assert.strictEqual(service.read({ owner: 'boo' }).length, 1);
            assert.strictEqual(service.read({ severities: markers_1.MarkerSeverity.Error }).length, 1);
            assert.strictEqual(service.read({ severities: markers_1.MarkerSeverity.Warning }).length, 1);
            assert.strictEqual(service.read({ severities: markers_1.MarkerSeverity.Hint }).length, 0);
            assert.strictEqual(service.read({ severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning }).length, 2);
        });
        test('changeOne override', () => {
            service = new markerService.MarkerService();
            service.changeOne('far', uri_1.URI.parse('file:///path/only.cs'), [randomMarkerData()]);
            assert.strictEqual(service.read().length, 1);
            assert.strictEqual(service.read({ owner: 'far' }).length, 1);
            service.changeOne('boo', uri_1.URI.parse('file:///path/only.cs'), [randomMarkerData()]);
            assert.strictEqual(service.read().length, 2);
            assert.strictEqual(service.read({ owner: 'far' }).length, 1);
            assert.strictEqual(service.read({ owner: 'boo' }).length, 1);
            service.changeOne('far', uri_1.URI.parse('file:///path/only.cs'), [randomMarkerData(), randomMarkerData()]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 2);
            assert.strictEqual(service.read({ owner: 'boo' }).length, 1);
        });
        test('changeOne/All clears', () => {
            service = new markerService.MarkerService();
            service.changeOne('far', uri_1.URI.parse('file:///path/only.cs'), [randomMarkerData()]);
            service.changeOne('boo', uri_1.URI.parse('file:///path/only.cs'), [randomMarkerData()]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 1);
            assert.strictEqual(service.read({ owner: 'boo' }).length, 1);
            assert.strictEqual(service.read().length, 2);
            service.changeOne('far', uri_1.URI.parse('file:///path/only.cs'), []);
            assert.strictEqual(service.read({ owner: 'far' }).length, 0);
            assert.strictEqual(service.read({ owner: 'boo' }).length, 1);
            assert.strictEqual(service.read().length, 1);
            service.changeAll('boo', []);
            assert.strictEqual(service.read({ owner: 'far' }).length, 0);
            assert.strictEqual(service.read({ owner: 'boo' }).length, 0);
            assert.strictEqual(service.read().length, 0);
        });
        test('changeAll sends event for cleared', () => {
            service = new markerService.MarkerService();
            service.changeAll('far', [{
                    resource: uri_1.URI.parse('file:///d/path'),
                    marker: randomMarkerData()
                }, {
                    resource: uri_1.URI.parse('file:///d/path'),
                    marker: randomMarkerData()
                }]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 2);
            const d = service.onMarkerChanged(changedResources => {
                assert.strictEqual(changedResources.length, 1);
                changedResources.forEach(u => assert.strictEqual(u.toString(), 'file:///d/path'));
                assert.strictEqual(service.read({ owner: 'far' }).length, 0);
            });
            service.changeAll('far', []);
            d.dispose();
        });
        test('changeAll merges', () => {
            service = new markerService.MarkerService();
            service.changeAll('far', [{
                    resource: uri_1.URI.parse('file:///c/test/file.cs'),
                    marker: randomMarkerData()
                }, {
                    resource: uri_1.URI.parse('file:///c/test/file.cs'),
                    marker: randomMarkerData()
                }]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 2);
        });
        test('changeAll must not break integrety, issue #12635', () => {
            service = new markerService.MarkerService();
            service.changeAll('far', [{
                    resource: uri_1.URI.parse('scheme:path1'),
                    marker: randomMarkerData()
                }, {
                    resource: uri_1.URI.parse('scheme:path2'),
                    marker: randomMarkerData()
                }]);
            service.changeAll('boo', [{
                    resource: uri_1.URI.parse('scheme:path1'),
                    marker: randomMarkerData()
                }]);
            service.changeAll('far', [{
                    resource: uri_1.URI.parse('scheme:path1'),
                    marker: randomMarkerData()
                }, {
                    resource: uri_1.URI.parse('scheme:path2'),
                    marker: randomMarkerData()
                }]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 2);
            assert.strictEqual(service.read({ resource: uri_1.URI.parse('scheme:path1') }).length, 2);
        });
        test('invalid marker data', () => {
            const data = randomMarkerData();
            service = new markerService.MarkerService();
            data.message = undefined;
            service.changeOne('far', uri_1.URI.parse('some:uri/path'), [data]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 0);
            data.message = null;
            service.changeOne('far', uri_1.URI.parse('some:uri/path'), [data]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 0);
            data.message = 'null';
            service.changeOne('far', uri_1.URI.parse('some:uri/path'), [data]);
            assert.strictEqual(service.read({ owner: 'far' }).length, 1);
        });
        test('MapMap#remove returns bad values, https://github.com/microsoft/vscode/issues/13548', () => {
            service = new markerService.MarkerService();
            service.changeOne('o', uri_1.URI.parse('some:uri/1'), [randomMarkerData()]);
            service.changeOne('o', uri_1.URI.parse('some:uri/2'), []);
        });
        test('Error code of zero in markers get removed, #31275', function () {
            const data = {
                code: '0',
                startLineNumber: 1,
                startColumn: 2,
                endLineNumber: 1,
                endColumn: 5,
                message: 'test',
                severity: 0,
                source: 'me'
            };
            service = new markerService.MarkerService();
            service.changeOne('far', uri_1.URI.parse('some:thing'), [data]);
            const marker = service.read({ resource: uri_1.URI.parse('some:thing') });
            assert.strictEqual(marker.length, 1);
            assert.strictEqual(marker[0].code, '0');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2VyU2VydmljZS50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9tYXJrZXJzL3Rlc3QvY29tbW9uL21hcmtlclNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVFoRyxTQUFTLGdCQUFnQixDQUFDLFFBQVEsR0FBRyx3QkFBYyxDQUFDLEtBQUs7UUFDeEQsT0FBTztZQUNOLFFBQVE7WUFDUixPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDbkMsZUFBZSxFQUFFLENBQUM7WUFDbEIsV0FBVyxFQUFFLENBQUM7WUFDZCxhQUFhLEVBQUUsQ0FBQztZQUNoQixTQUFTLEVBQUUsQ0FBQztTQUNaLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLGdCQUFnQixFQUFFLEdBQUcsRUFBRTtRQUU1QixJQUFJLE9BQW9DLENBQUM7UUFFekMsUUFBUSxDQUFDO1lBQ1IsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBRWxCLE9BQU8sR0FBRyxJQUFJLGFBQWEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUU1QyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUN6QixRQUFRLEVBQUUsU0FBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQztvQkFDN0MsTUFBTSxFQUFFLGdCQUFnQixDQUFDLHdCQUFjLENBQUMsS0FBSyxDQUFDO2lCQUM5QyxDQUFDLENBQUMsQ0FBQztZQUVKLE1BQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxD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