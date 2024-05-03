/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/uri", "vs/base/test/common/mock", "vs/base/test/common/utils", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModel", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, buffer_1, cancellation_1, lifecycle_1, mime_1, uri_1, mock_1, utils_1, testConfigurationService_1, extensions_1, notebookTextModel_1, notebookCommon_1, notebookEditorModel_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookFileWorkingCopyModel', function () {
        let disposables;
        let instantiationService;
        const configurationService = new testConfigurationService_1.TestConfigurationService();
        teardown(() => disposables.dispose());
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
        });
        test('no transient output is send to serializer', async function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [{ outputId: 'id', outputs: [{ mime: mime_1.Mimes.text, data: buffer_1.VSBuffer.fromString('Hello Out') }] }] }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false });
            { // transient output
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells.length, 1);
                        assert.strictEqual(notebook.cells[0].outputs.length, 0);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient output
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells.length, 1);
                        assert.strictEqual(notebook.cells[0].outputs.length, 1);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('no transient metadata is send to serializer', async function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [] }], { foo: 123, bar: 456 }, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false });
            disposables.add(notebook);
            { // transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientCellMetadata: {}, transientDocumentMetadata: { bar: true }, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.metadata.foo, 123);
                        assert.strictEqual(notebook.metadata.bar, undefined);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.metadata.foo, 123);
                        assert.strictEqual(notebook.metadata.bar, 456);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
        test('no transient cell metadata is send to serializer', async function () {
            const notebook = instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, 'notebook', uri_1.URI.file('test'), [{ cellKind: notebookCommon_1.CellKind.Code, language: 'foo', mime: 'foo', source: 'foo', outputs: [], metadata: { foo: 123, bar: 456 } }], {}, { transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {}, transientOutputs: false, });
            disposables.add(notebook);
            { // transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: true, transientDocumentMetadata: {}, transientCellMetadata: { bar: true }, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                        assert.strictEqual(notebook.cells[0].metadata.bar, undefined);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
            { // NOT transient
                let callCount = 0;
                const model = disposables.add(new notebookEditorModel_1.NotebookFileWorkingCopyModel(notebook, mockNotebookService(notebook, new class extends (0, mock_1.mock)() {
                    constructor() {
                        super(...arguments);
                        this.options = { transientOutputs: false, transientCellMetadata: {}, transientDocumentMetadata: {}, cellContentMetadata: {} };
                    }
                    async notebookToData(notebook) {
                        callCount += 1;
                        assert.strictEqual(notebook.cells[0].metadata.foo, 123);
                        assert.strictEqual(notebook.cells[0].metadata.bar, 456);
                        return buffer_1.VSBuffer.fromString('');
                    }
                }), configurationService));
                await model.snapshot(cancellation_1.CancellationToken.None);
                assert.strictEqual(callCount, 1);
            }
        });
    });
    function mockNotebookService(notebook, notebookSerializer) {
        return new class extends (0, mock_1.mock)() {
            async withNotebookDataProvider(viewType) {
                return new notebookService_1.SimpleNotebookProviderInfo(notebook.viewType, notebookSerializer, {
                    id: new extensions_1.ExtensionIdentifier('test'),
                    location: undefined
                });
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFZGl0b3JNb2RlbC50ZXN0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay90ZXN0L2Jyb3dzZXIvbm90ZWJvb2tFZGl0b3JNb2RlbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBbUJoRyxLQUFLLENBQUMsOEJBQThCLEVBQUU7UUFFckMsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksb0JBQThDLENBQUM7UUFDbkQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG1EQUF3QixFQUFFLENBQUM7UUFFNUQsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRXRDLElBQUEsK0NBQXVDLEdBQUUsQ0FBQztRQUUxQyxLQUFLLENBQUMsR0FBRyxFQUFFO1lBQ1YsV0FBVyxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBQ3BDLG9CQUFvQixHQUFHLElBQUEsOENBQXlCLEVBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsMkNBQTJDLEVBQUUsS0FBSztZQUV0RCxNQUFNLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUMscUNBQWlCLEVBQ3JFLFVBQVUsRUFDVixTQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUNoQixDQUFDLEVBQUUsUUFBUSxFQUFFLHlCQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxZQUFLLENB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