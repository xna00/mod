/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/markers/common/markers", "vs/workbench/contrib/markers/browser/markersModel", "vs/base/common/collections", "vs/base/test/common/utils"], function (require, exports, assert, uri_1, markers_1, markersModel_1, collections_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestMarkersModel extends markersModel_1.MarkersModel {
        constructor(markers) {
            super();
            const byResource = (0, collections_1.groupBy)(markers, r => r.resource.toString());
            Object.keys(byResource).forEach(key => {
                const markers = byResource[key];
                const resource = markers[0].resource;
                this.setResourceMarkers([[resource, markers]]);
            });
        }
    }
    suite('MarkersModel Test', () => {
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('marker ids are unique', function () {
            const marker1 = anErrorWithRange(3);
            const marker2 = anErrorWithRange(3);
            const marker3 = aWarningWithRange(3);
            const marker4 = aWarningWithRange(3);
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4]);
            const actuals = testObject.resourceMarkers[0].markers;
            assert.notStrictEqual(actuals[0].id, actuals[1].id);
            assert.notStrictEqual(actuals[0].id, actuals[2].id);
            assert.notStrictEqual(actuals[0].id, actuals[3].id);
            assert.notStrictEqual(actuals[1].id, actuals[2].id);
            assert.notStrictEqual(actuals[1].id, actuals[3].id);
            assert.notStrictEqual(actuals[2].id, actuals[3].id);
        });
        test('sort palces resources with no errors at the end', function () {
            const marker1 = aMarker('a/res1', markers_1.MarkerSeverity.Warning);
            const marker2 = aMarker('a/res2');
            const marker3 = aMarker('res4');
            const marker4 = aMarker('b/res3');
            const marker5 = aMarker('res4');
            const marker6 = aMarker('c/res2', markers_1.MarkerSeverity.Info);
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);
            const actuals = testObject.resourceMarkers;
            assert.strictEqual(5, actuals.length);
            assert.ok(compareResource(actuals[0], 'a/res2'));
            assert.ok(compareResource(actuals[1], 'b/res3'));
            assert.ok(compareResource(actuals[2], 'res4'));
            assert.ok(compareResource(actuals[3], 'a/res1'));
            assert.ok(compareResource(actuals[4], 'c/res2'));
        });
        test('sort resources by file path', function () {
            const marker1 = aMarker('a/res1');
            const marker2 = aMarker('a/res2');
            const marker3 = aMarker('res4');
            const marker4 = aMarker('b/res3');
            const marker5 = aMarker('res4');
            const marker6 = aMarker('c/res2');
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6]);
            const actuals = testObject.resourceMarkers;
            assert.strictEqual(5, actuals.length);
            assert.ok(compareResource(actuals[0], 'a/res1'));
            assert.ok(compareResource(actuals[1], 'a/res2'));
            assert.ok(compareResource(actuals[2], 'b/res3'));
            assert.ok(compareResource(actuals[3], 'c/res2'));
            assert.ok(compareResource(actuals[4], 'res4'));
        });
        test('sort markers by severity, line and column', function () {
            const marker1 = aWarningWithRange(8, 1, 9, 3);
            const marker2 = aWarningWithRange(3);
            const marker3 = anErrorWithRange(8, 1, 9, 3);
            const marker4 = anIgnoreWithRange(5);
            const marker5 = anInfoWithRange(8, 1, 8, 4, 'ab');
            const marker6 = anErrorWithRange(3);
            const marker7 = anErrorWithRange(5);
            const marker8 = anInfoWithRange(5);
            const marker9 = anErrorWithRange(8, 1, 8, 4, 'ab');
            const marker10 = anErrorWithRange(10);
            const marker11 = anErrorWithRange(8, 1, 8, 4, 'ba');
            const marker12 = anIgnoreWithRange(3);
            const marker13 = aWarningWithRange(5);
            const marker14 = anErrorWithRange(4);
            const marker15 = anErrorWithRange(8, 2, 8, 4);
            const testObject = new TestMarkersModel([marker1, marker2, marker3, marker4, marker5, marker6, marker7, marker8, marker9, marker10, marker11, marker12, marker13, marker14, marker15]);
            const actuals = testObject.resourceMarkers[0].markers;
            assert.strictEqual(actuals[0].marker, marker6);
            assert.strictEqual(actuals[1].marker, marker14);
            assert.strictEqual(actuals[2].marker, marker7);
            assert.strictEqual(actuals[3].marker, marker9);
            assert.strictEqual(actuals[4].marker, marker11);
            assert.strictEqual(actuals[5].marker, marker3);
            assert.strictEqual(actuals[6].marker, marker15);
            assert.strictEqual(actuals[7].marker, marker10);
            assert.strictEqual(actuals[8].marker, marker2);
            assert.strictEqual(actuals[9].marker, marker13);
            assert.strictEqual(actuals[10].marker, marker1);
            assert.strictEqual(actuals[11].marker, marker8);
            assert.strictEqual(actuals[12].marker, marker5);
            assert.strictEqual(actuals[13].marker, marker12);
            assert.strictEqual(actuals[14].marker, marker4);
        });
        test('toString()', () => {
            let marker = aMarker('a/res1');
            marker.code = '1234';
            assert.strictEqual(JSON.stringify({ ...marker, resource: marker.resource.path }, null, '\t'), new markersModel_1.Marker('1', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Warning);
            assert.strictEqual(JSON.stringify({ ...marker, resource: marker.resource.path }, null, '\t'), new markersModel_1.Marker('2', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Info, 1, 2, 1, 8, 'Info', '');
            assert.strictEqual(JSON.stringify({ ...marker, resource: marker.resource.path }, null, '\t'), new markersModel_1.Marker('3', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Hint, 1, 2, 1, 8, 'Ignore message', 'Ignore');
            assert.strictEqual(JSON.stringify({ ...marker, resource: marker.resource.path }, null, '\t'), new markersModel_1.Marker('4', marker).toString());
            marker = aMarker('a/res2', markers_1.MarkerSeverity.Warning, 1, 2, 1, 8, 'Warning message', '', [{ startLineNumber: 2, startColumn: 5, endLineNumber: 2, endColumn: 10, message: 'some info', resource: uri_1.URI.file('a/res3') }]);
            const testObject = new markersModel_1.Marker('5', marker, null);
            // hack
            testObject.relatedInformation = marker.relatedInformation.map(r => new markersModel_1.RelatedInformation('6', marker, r));
            assert.strictEqual(JSON.stringify({ ...marker, resource: marker.resource.path, relatedInformation: marker.relatedInformation.map(r => ({ ...r, resource: r.resource.path })) }, null, '\t'), testObject.toString());
        });
        test('Markers for same-document but different fragment', function () {
            const model = new TestMarkersModel([anErrorWithRange(1)]);
            assert.strictEqual(model.total, 1);
            const document = uri_1.URI.parse('foo://test/path/file');
            const frag1 = uri_1.URI.parse('foo://test/path/file#1');
            const frag2 = uri_1.URI.parse('foo://test/path/file#two');
            model.setResourceMarkers([[document, [{ ...aMarker(), resource: frag1 }, { ...aMarker(), resource: frag2 }]]]);
            assert.strictEqual(model.total, 3);
            const a = model.getResourceMarkers(document);
            const b = model.getResourceMarkers(frag1);
            const c = model.getResourceMarkers(frag2);
            assert.ok(a === b);
            assert.ok(a === c);
            model.setResourceMarkers([[document, [{ ...aMarker(), resource: frag2 }]]]);
            assert.strictEqual(model.total, 2);
        });
        test('Problems are no sorted correctly #99135', function () {
            const model = new TestMarkersModel([]);
            assert.strictEqual(model.total, 0);
            const document = uri_1.URI.parse('foo://test/path/file');
            const frag1 = uri_1.URI.parse('foo://test/path/file#1');
            const frag2 = uri_1.URI.parse('foo://test/path/file#2');
            model.setResourceMarkers([[frag1, [
                        { ...aMarker(), resource: frag1 },
                        { ...aMarker(undefined, markers_1.MarkerSeverity.Warning), resource: frag1 },
                    ]]]);
            model.setResourceMarkers([[frag2, [
                        { ...aMarker(), resource: frag2 }
                    ]]]);
            assert.strictEqual(model.total, 3);
            const markers = model.getResourceMarkers(document)?.markers;
            assert.deepStrictEqual(markers?.map(m => m.marker.severity), [markers_1.MarkerSeverity.Error, markers_1.MarkerSeverity.Error, markers_1.MarkerSeverity.Warning]);
            assert.deepStrictEqual(markers?.map(m => m.marker.resource.toString()), [frag1.toString(), frag2.toString(), frag1.toString()]);
        });
        function compareResource(a, b) {
            return a.resource.toString() === uri_1.URI.file(b).toString();
        }
        function anErrorWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Error, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function aWarningWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Warning, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function anInfoWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Info, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function anIgnoreWithRange(startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message') {
            return aMarker('some resource', markers_1.MarkerSeverity.Hint, startLineNumber, startColumn, endLineNumber, endColumn, message);
        }
        function aMarker(resource = 'some resource', severity = markers_1.MarkerSeverity.Error, startLineNumber = 10, startColumn = 5, endLineNumber = startLineNumber + 1, endColumn = startColumn + 5, message = 'some message', source = 'tslint', relatedInformation) {
            return {
                owner: 'someOwner',
                resource: uri_1.URI.file(resource),
                severity,
                message,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
                source,
                relatedInformation
            };
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya2Vyc01vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL21hcmtlcnMvdGVzdC9icm93c2VyL21hcmtlcnNNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLE1BQU0sZ0JBQWlCLFNBQVEsMkJBQVk7UUFFMUMsWUFBWSxPQUFrQjtZQUM3QixLQUFLLEVBQUUsQ0FBQztZQUVSLE1BQU0sVUFBVSxHQUFHLElBQUEscUJBQU8sRUFBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFFaEUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3JDLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztnQkFFckMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztLQUNEO0lBRUQsS0FBSyxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUUvQixJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBQzdCLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sT0FBTyxHQUFHLGlCQUFp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