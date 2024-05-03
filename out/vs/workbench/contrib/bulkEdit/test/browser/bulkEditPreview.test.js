/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/platform/files/common/files", "vs/workbench/test/common/workbenchTestServices", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/services/model", "vs/base/common/uri", "vs/workbench/contrib/bulkEdit/browser/preview/bulkEditPreview", "vs/editor/common/core/range", "vs/editor/browser/services/bulkEditService", "vs/base/test/common/utils"], function (require, exports, assert, event_1, files_1, workbenchTestServices_1, instantiationService_1, serviceCollection_1, model_1, uri_1, bulkEditPreview_1, range_1, bulkEditService_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('BulkEditPreview', function () {
        const store = (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        let instaService;
        setup(function () {
            const fileService = new class extends (0, workbenchTestServices_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidFilesChange = event_1.Event.None;
                }
                async exists() {
                    return true;
                }
            };
            const modelService = new class extends (0, workbenchTestServices_1.mock)() {
                getModel() {
                    return null;
                }
                getModels() {
                    return [];
                }
            };
            instaService = new instantiationService_1.InstantiationService(new serviceCollection_1.ServiceCollection([files_1.IFileService, fileService], [model_1.IModelService, modelService]));
        });
        test('one needsConfirmation unchecks all of file', async function () {
            const edits = [
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri1'), undefined, { label: 'cat1', needsConfirmation: true }),
                new bulkEditService_1.ResourceFileEdit(uri_1.URI.parse('some:///uri1'), uri_1.URI.parse('some:///uri2'), undefined, { label: 'cat2', needsConfirmation: false }),
            ];
            const ops = await instaService.invokeFunction(bulkEditPreview_1.BulkFileOperations.create, edits);
            store.add(ops);
            assert.strictEqual(ops.fileOperations.length, 1);
            assert.strictEqual(ops.checked.isChecked(edits[0]), false);
        });
        test('has categories', async function () {
            const edits = [
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri1'), undefined, { label: 'uri1', needsConfirmation: true }),
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri2'), undefined, { label: 'uri2', needsConfirmation: false }),
            ];
            const ops = await instaService.invokeFunction(bulkEditPreview_1.BulkFileOperations.create, edits);
            store.add(ops);
            assert.strictEqual(ops.categories.length, 2);
            assert.strictEqual(ops.categories[0].metadata.label, 'uri1'); // unconfirmed!
            assert.strictEqual(ops.categories[1].metadata.label, 'uri2');
        });
        test('has not categories', async function () {
            const edits = [
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri1'), undefined, { label: 'uri1', needsConfirmation: true }),
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri2'), undefined, { label: 'uri1', needsConfirmation: false }),
            ];
            const ops = await instaService.invokeFunction(bulkEditPreview_1.BulkFileOperations.create, edits);
            store.add(ops);
            assert.strictEqual(ops.categories.length, 1);
            assert.strictEqual(ops.categories[0].metadata.label, 'uri1'); // unconfirmed!
            assert.strictEqual(ops.categories[0].metadata.label, 'uri1');
        });
        test('category selection', async function () {
            const edits = [
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri1'), undefined, { label: 'C1', needsConfirmation: false }),
                new bulkEditService_1.ResourceTextEdit(uri_1.URI.parse('some:///uri2'), { text: 'foo', range: new range_1.Range(1, 1, 1, 1) }, undefined, { label: 'C2', needsConfirmation: false }),
            ];
            const ops = await instaService.invokeFunction(bulkEditPreview_1.BulkFileOperations.create, edits);
            store.add(ops);
            assert.strictEqual(ops.checked.isChecked(edits[0]), true);
            assert.strictEqual(ops.checked.isChecked(edits[1]), true);
            assert.ok(edits === ops.getWorkspaceEdit());
            // NOT taking to create, but the invalid text edit will
            // go through
            ops.checked.updateChecked(edits[0], false);
            const newEdits = ops.getWorkspaceEdit();
            assert.ok(edits !== newEdits);
            assert.strictEqual(edits.length, 2);
            assert.strictEqual(newEdits.length, 1);
        });
        test('fix bad metadata', async function () {
            // bogous edit that wants creation to be confirmed, but not it's textedit-child...
            const edits = [
                new bulkEditService_1.ResourceFileEdit(undefined, uri_1.URI.parse('some:///uri1'), undefined, { label: 'C1', needsConfirmation: true }),
                new bulkEditService_1.ResourceTextEdit(uri_1.URI.parse('some:///uri1'), { text: 'foo', range: new range_1.Range(1, 1, 1, 1) }, undefined, { label: 'C2', needsConfirmation: false })
            ];
            const ops = await instaService.invokeFunction(bulkEditPreview_1.BulkFileOperations.create, edits);
            store.add(ops);
            assert.strictEqual(ops.checked.isChecked(edits[0]), false);
            assert.strictEqual(ops.checked.isChecked(edits[1]), false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0VkaXRQcmV2aWV3LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2J1bGtFZGl0L3Rlc3QvYnJvd3Nlci9idWxrRWRpdFByZXZpZXcudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWdCaEcsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBRXhCLE1BQU0sS0FBSyxHQUFHLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUV4RCxJQUFJLFlBQW1DLENBQUM7UUFFeEMsS0FBSyxDQUFDO1lBRUwsTUFBTSxXQUFXLEdBQWlCLElBQUksS0FBTSxTQUFRLElBQUEsNEJBQUksR0FBZ0I7Z0JBQWxDOztvQkFDNUIscUJBQWdCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztnQkFJeEMsQ0FBQztnQkFIUyxLQUFLLENBQUMsTUFBTTtvQkFDcEIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQzthQUNELENBQUM7WUFFRixNQUFNLFlBQVksR0FBa0IsSUFBSSxLQUFNLFNBQVEsSUFBQSw0QkFBSSxHQUFpQjtnQkFDakUsUUFBUTtvQkFDaEIsT0FBTyxJQUFJLENBQUM7Z0JBQ2IsQ0FBQztnQkFDUSxTQUFTO29CQUNqQixPQUFPLEVBQUUsQ0FBQztnQkFDWCxDQUFDO2FBQ0QsQ0FBQztZQUVGLFlBQVksR0FBRyxJQUFJLDJDQUFvQixDQUFDLElBQUkscUNBQWlCLENBQzVELENBQUMsb0JBQVksRUFBRSxXQUFXLENBQUMsRUFDM0IsQ0FBQyxxQkFBYSxFQUFFLFlBQVksQ0FBQyxDQUM3QixDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLO1lBRXZELE1BQU0sS0FBSyxHQUFHO2dCQUNiLElBQUksa0NBQWdCLENBQUMsU0FB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