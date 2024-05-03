/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/model", "vs/editor/test/common/testTextModel", "vs/platform/log/common/log", "vs/platform/markers/common/markers", "../../browser/outlineModel", "vs/base/test/common/mock", "vs/base/test/common/utils"], function (require, exports, assert, cancellation_1, lifecycle_1, uri_1, range_1, languageFeatureDebounce_1, languageFeaturesService_1, model_1, testTextModel_1, log_1, markers_1, outlineModel_1, mock_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('OutlineModel', function () {
        const disposables = new lifecycle_1.DisposableStore();
        const languageFeaturesService = new languageFeaturesService_1.LanguageFeaturesService();
        teardown(function () {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        test('OutlineModel#create, cached', async function () {
            const insta = (0, testTextModel_1.createModelServices)(disposables);
            const modelService = insta.get(model_1.IModelService);
            const envService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.isBuilt = true;
                    this.isExtensionDevelopment = false;
                }
            };
            const service = new outlineModel_1.OutlineModelService(languageFeaturesService, new languageFeatureDebounce_1.LanguageFeatureDebounceService(new log_1.NullLogService(), envService), modelService);
            const model = (0, testTextModel_1.createTextModel)('foo', undefined, undefined, uri_1.URI.file('/fome/path.foo'));
            let count = 0;
            const reg = languageFeaturesService.documentSymbolProvider.register({ pattern: '**/path.foo' }, {
                provideDocumentSymbols() {
                    count += 1;
                    return [];
                }
            });
            await service.getOrCreate(model, cancellation_1.CancellationToken.None);
            assert.strictEqual(count, 1);
            // cached
            await service.getOrCreate(model, cancellation_1.CancellationToken.None);
            assert.strictEqual(count, 1);
            // new version
            model.applyEdits([{ text: 'XXX', range: new range_1.Range(1, 1, 1, 1) }]);
            await service.getOrCreate(model, cancellation_1.CancellationToken.None);
            assert.strictEqual(count, 2);
            reg.dispose();
            model.dispose();
            service.dispose();
        });
        test('OutlineModel#create, cached/cancel', async function () {
            const insta = (0, testTextModel_1.createModelServices)(disposables);
            const modelService = insta.get(model_1.IModelService);
            const envService = new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.isBuilt = true;
                    this.isExtensionDevelopment = false;
                }
            };
            const service = new outlineModel_1.OutlineModelService(languageFeaturesService, new languageFeatureDebounce_1.LanguageFeatureDebounceService(new log_1.NullLogService(), envService), modelService);
            const model = (0, testTextModel_1.createTextModel)('foo', undefined, undefined, uri_1.URI.file('/fome/path.foo'));
            let isCancelled = false;
            const reg = languageFeaturesService.documentSymbolProvider.register({ pattern: '**/path.foo' }, {
                provideDocumentSymbols(d, token) {
                    return new Promise(resolve => {
                        const l = token.onCancellationRequested(_ => {
                            isCancelled = true;
                            resolve(null);
                            l.dispose();
                        });
                    });
                }
            });
            assert.strictEqual(isCancelled, false);
            const s1 = new cancellation_1.CancellationTokenSource();
            service.getOrCreate(model, s1.token);
            const s2 = new cancellation_1.CancellationTokenSource();
            service.getOrCreate(model, s2.token);
            s1.cancel();
            assert.strictEqual(isCancelled, false);
            s2.cancel();
            assert.strictEqual(isCancelled, true);
            reg.dispose();
            model.dispose();
            service.dispose();
        });
        function fakeSymbolInformation(range, name = 'foo') {
            return {
                name,
                detail: 'fake',
                kind: 16 /* SymbolKind.Boolean */,
                tags: [],
                selectionRange: range,
                range: range
            };
        }
        function fakeMarker(range) {
            return { ...range, owner: 'ffff', message: 'test', severity: markers_1.MarkerSeverity.Error, resource: null };
        }
        test('OutlineElement - updateMarker', function () {
            const e0 = new outlineModel_1.OutlineElement('foo1', null, fakeSymbolInformation(new range_1.Range(1, 1, 1, 10)));
            const e1 = new outlineModel_1.OutlineElement('foo2', null, fakeSymbolInformation(new range_1.Range(2, 1, 5, 1)));
            const e2 = new outlineModel_1.OutlineElement('foo3', null, fakeSymbolInformation(new range_1.Range(6, 1, 10, 10)));
            const group = new outlineModel_1.OutlineGroup('group', null, null, 1);
            group.children.set(e0.id, e0);
            group.children.set(e1.id, e1);
            group.children.set(e2.id, e2);
            const data = [fakeMarker(new range_1.Range(6, 1, 6, 7)), fakeMarker(new range_1.Range(1, 1, 1, 4)), fakeMarker(new range_1.Range(10, 2, 14, 1))];
            data.sort(range_1.Range.compareRangesUsingStarts); // model does this
            group.updateMarker(data);
            assert.strictEqual(data.length, 0); // all 'stolen'
            assert.strictEqual(e0.marker.count, 1);
            assert.strictEqual(e1.marker, undefined);
            assert.strictEqual(e2.marker.count, 2);
            group.updateMarker([]);
            assert.strictEqual(e0.marker, undefined);
            assert.strictEqual(e1.marker, undefined);
            assert.strictEqual(e2.marker, undefined);
        });
        test('OutlineElement - updateMarker, 2', function () {
            const p = new outlineModel_1.OutlineElement('A', null, fakeSymbolInformation(new range_1.Range(1, 1, 11, 1)));
            const c1 = new outlineModel_1.OutlineElement('A/B', null, fakeSymbolInformation(new range_1.Range(2, 4, 5, 4)));
            const c2 = new outlineModel_1.OutlineElement('A/C', null, fakeSymbolInformation(new range_1.Range(6, 4, 9, 4)));
            const group = new outlineModel_1.OutlineGroup('group', null, null, 1);
            group.children.set(p.id, p);
            p.children.set(c1.id, c1);
            p.children.set(c2.id, c2);
            let data = [
                fakeMarker(new range_1.Range(2, 4, 5, 4))
            ];
            group.updateMarker(data);
            assert.strictEqual(p.marker.count, 0);
            assert.strictEqual(c1.marker.count, 1);
            assert.strictEqual(c2.marker, undefined);
            data = [
                fakeMarker(new range_1.Range(2, 4, 5, 4)),
                fakeMarker(new range_1.Range(2, 6, 2, 8)),
                fakeMarker(new range_1.Range(7, 6, 7, 8)),
            ];
            group.updateMarker(data);
            assert.strictEqual(p.marker.count, 0);
            assert.strictEqual(c1.marker.count, 2);
            assert.strictEqual(c2.marker.count, 1);
            data = [
                fakeMarker(new range_1.Range(1, 4, 1, 11)),
                fakeMarker(new range_1.Range(7, 6, 7, 8)),
            ];
            group.updateMarker(data);
            assert.strictEqual(p.marker.count, 1);
            assert.strictEqual(c1.marker, undefined);
            assert.strictEqual(c2.marker.count, 1);
        });
        test('OutlineElement - updateMarker/multiple groups', function () {
            const model = new class extends outlineModel_1.OutlineModel {
                constructor() {
                    super(null);
                }
                readyForTesting() {
                    this._groups = this.children;
                }
            };
            model.children.set('g1', new outlineModel_1.OutlineGroup('g1', model, null, 1));
            model.children.get('g1').children.set('c1', new outlineModel_1.OutlineElement('c1', model.children.get('g1'), fakeSymbolInformation(new range_1.Range(1, 1, 11, 1))));
            model.children.set('g2', new outlineModel_1.OutlineGroup('g2', model, null, 1));
            model.children.get('g2').children.set('c2', new outlineModel_1.OutlineElement('c2', model.children.get('g2'), fakeSymbolInformation(new range_1.Range(1, 1, 7, 1))));
            model.children.get('g2').children.get('c2').children.set('c2.1', new outlineModel_1.OutlineElement('c2.1', model.children.get('g2').children.get('c2'), fakeSymbolInformation(new range_1.Range(1, 3, 2, 19))));
            model.children.get('g2').children.get('c2').children.set('c2.2', new outlineModel_1.OutlineElement('c2.2', model.children.get('g2').children.get('c2'), fakeSymbolInformation(new range_1.Range(4, 1, 6, 10))));
            model.readyForTesting();
            const data = [
                fakeMarker(new range_1.Range(1, 1, 2, 8)),
                fakeMarker(new range_1.Range(6, 1, 6, 98)),
            ];
            model.updateMarker(data);
            assert.strictEqual(model.children.get('g1').children.get('c1').marker.count, 2);
            assert.strictEqual(model.children.get('g2').children.get('c2').children.get('c2.1').marker.count, 1);
            assert.strictEqual(model.children.get('g2').children.get('c2').children.get('c2.2').marker.count, 1);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZU1vZGVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb250cmliL2RvY3VtZW50U3ltYm9scy90ZXN0L2Jyb3dzZXIvb3V0bGluZU1vZGVsLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFtQmhHLEtBQUssQ0FBQyxjQUFjLEVBQUU7UUFFckIsTUFBTSxXQUFXLEdBQUcsSUFBSSwyQkFBZSxFQUFFLENBQUM7UUFDMUMsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLGlEQUF1QixFQUFFLENBQUM7UUFFOUQsUUFBUSxDQUFDO1lBQ1IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3JCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxLQUFLO1lBRXhDLE1BQU0sS0FBSyxHQUFHLElBQUEsbUNBQW1CLEVBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0MsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxxQkFBYSxDQUFDLENBQUM7WUFDOUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxLQUFNLFNBQVEsSUFBQSxXQUFJLEdBQXVCO2dCQUF6Qzs7b0JBQ2IsWUFBTyxHQUFZLElBQUksQ0FBQztvQkFDeEIsMkJBQXNCLEdBQVksS0FBSyxDQUFDO2dCQUNsRCxDQUFDO2FBQUEsQ0FBQztZQUNGLE1BQU0sT0FBTyxHQUFHLElBQUksa0NBQW1CLENBQUMsdUJBQXVCLEVBQUUsSUFBSSx3REFBOEIsQ0FBQyxJQUFJLG9CQUFjLEVBQUUsRUFBRSxVQUFVLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVySixNQUFNLEtBQUssR0FBRyxJQUFBLCtCQUFlLEVBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxT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