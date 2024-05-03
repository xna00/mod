/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHostNotebook", "vs/workbench/api/common/extHostNotebookDocuments", "vs/workbench/api/common/extHostNotebookKernels", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/api/common/extHostFileSystemConsumer", "vs/workbench/api/common/extHostFileSystemInfo", "vs/base/test/common/utils", "vs/workbench/api/common/extHostSearch", "vs/workbench/api/common/extHostUriTransformerService"], function (require, exports, assert, async_1, lifecycle_1, uri_1, extensions_1, log_1, extHost_protocol_1, extHostCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHostNotebook_1, extHostNotebookDocuments_1, extHostNotebookKernels_1, extHostTypes_1, notebookCommon_1, notebookExecutionService_1, extensions_2, proxyIdentifier_1, testRPCProtocol_1, workbenchTestServices_1, extHostFileSystemConsumer_1, extHostFileSystemInfo_1, utils_1, extHostSearch_1, extHostUriTransformerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookKernel', function () {
        let rpcProtocol;
        let extHostNotebookKernels;
        let notebook;
        let extHostDocumentsAndEditors;
        let extHostDocuments;
        let extHostNotebooks;
        let extHostNotebookDocuments;
        let extHostCommands;
        let extHostConsumerFileSystem;
        let extHostSearch;
        const notebookUri = uri_1.URI.parse('test:///notebook.file');
        const kernelData = new Map();
        const disposables = new lifecycle_1.DisposableStore();
        const cellExecuteCreate = [];
        const cellExecuteUpdates = [];
        const cellExecuteComplete = [];
        teardown(function () {
            disposables.clear();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(async function () {
            cellExecuteCreate.length = 0;
            cellExecuteUpdates.length = 0;
            cellExecuteComplete.length = 0;
            kernelData.clear();
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, new class extends (0, workbenchTestServices_1.mock)() {
                $registerCommand() { }
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebookKernels, new class extends (0, workbenchTestServices_1.mock)() {
                async $addKernel(handle, data) {
                    kernelData.set(handle, data);
                }
                $removeKernel(handle) {
                    kernelData.delete(handle);
                }
                $updateKernel(handle, data) {
                    assert.strictEqual(kernelData.has(handle), true);
                    kernelData.set(handle, { ...kernelData.get(handle), ...data, });
                }
                $createExecution(handle, controllerId, uri, cellHandle) {
                    cellExecuteCreate.push({ notebook: uri, cell: cellHandle });
                }
                $updateExecution(handle, data) {
                    cellExecuteUpdates.push(...data.value);
                }
                $completeExecution(handle, data) {
                    cellExecuteComplete.push(data.value);
                }
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebookDocuments, new class extends (0, workbenchTestServices_1.mock)() {
            });
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadNotebook, new class extends (0, workbenchTestServices_1.mock)() {
                async $registerNotebookSerializer() { }
                async $unregisterNotebookSerializer() { }
            });
            extHostDocumentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol, new log_1.NullLogService());
            extHostDocuments = disposables.add(new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors));
            extHostCommands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService(), new class extends (0, workbenchTestServices_1.mock)() {
                onExtensionError() {
                    return true;
                }
            });
            extHostConsumerFileSystem = new extHostFileSystemConsumer_1.ExtHostConsumerFileSystem(rpcProtocol, new extHostFileSystemInfo_1.ExtHostFileSystemInfo());
            extHostSearch = new extHostSearch_1.ExtHostSearch(rpcProtocol, new extHostUriTransformerService_1.URITransformerService(null), new log_1.NullLogService());
            extHostNotebooks = new extHostNotebook_1.ExtHostNotebookController(rpcProtocol, extHostCommands, extHostDocumentsAndEditors, extHostDocuments, extHostConsumerFileSystem, extHostSearch);
            extHostNotebookDocuments = new extHostNotebookDocuments_1.ExtHostNotebookDocuments(extHostNotebooks);
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({
                addedDocuments: [{
                        uri: notebookUri,
                        viewType: 'test',
                        versionId: 0,
                        cells: [{
                                handle: 0,
                                uri: notebookCommon_1.CellUri.generate(notebookUri, 0),
                                source: ['### Heading'],
                                eol: '\n',
                                language: 'markdown',
                                cellKind: notebookCommon_1.CellKind.Markup,
                                outputs: [],
                            }, {
                                handle: 1,
                                uri: notebookCommon_1.CellUri.generate(notebookUri, 1),
                                source: ['console.log("aaa")', 'console.log("bbb")'],
                                eol: '\n',
                                language: 'javascript',
                                cellKind: notebookCommon_1.CellKind.Code,
                                outputs: [],
                            }],
                    }],
                addedEditors: [{
                        documentUri: notebookUri,
                        id: '_notebook_editor_0',
                        selections: [{ start: 0, end: 1 }],
                        visibleRanges: []
                    }]
            }));
            extHostNotebooks.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers({ newActiveEditor: '_notebook_editor_0' }));
            notebook = extHostNotebooks.notebookDocuments[0];
            disposables.add(notebook);
            disposables.add(extHostDocuments);
            extHostNotebookKernels = new extHostNotebookKernels_1.ExtHostNotebookKernels(rpcProtocol, new class extends (0, workbenchTestServices_1.mock)() {
            }, extHostNotebooks, extHostCommands, new log_1.NullLogService());
        });
        test('create/dispose kernel', async function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            assert.throws(() => kernel.id = 'dd');
            assert.throws(() => kernel.notebookType = 'dd');
            assert.ok(kernel);
            assert.strictEqual(kernel.id, 'foo');
            assert.strictEqual(kernel.label, 'Foo');
            assert.strictEqual(kernel.notebookType, '*');
            await rpcProtocol.sync();
            assert.strictEqual(kernelData.size, 1);
            const [first] = kernelData.values();
            assert.strictEqual(first.id, 'nullExtensionDescription/foo');
            assert.strictEqual(extensions_1.ExtensionIdentifier.equals(first.extensionId, extensions_2.nullExtensionDescription.identifier), true);
            assert.strictEqual(first.label, 'Foo');
            assert.strictEqual(first.notebookType, '*');
            kernel.dispose();
            await rpcProtocol.sync();
            assert.strictEqual(kernelData.size, 0);
        });
        test('update kernel', async function () {
            const kernel = disposables.add(extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo'));
            await rpcProtocol.sync();
            assert.ok(kernel);
            let [first] = kernelData.values();
            assert.strictEqual(first.id, 'nullExtensionDescription/foo');
            assert.strictEqual(first.label, 'Foo');
            kernel.label = 'Far';
            assert.strictEqual(kernel.label, 'Far');
            await rpcProtocol.sync();
            [first] = kernelData.values();
            assert.strictEqual(first.id, 'nullExtensionDescription/foo');
            assert.strictEqual(first.label, 'Far');
        });
        test('execute - simple createNotebookCellExecution', function () {
            const kernel = disposables.add(extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo'));
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.start();
            task.end(undefined);
        });
        test('createNotebookCellExecution, must be selected/associated', function () {
            const kernel = disposables.add(extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo'));
            assert.throws(() => {
                kernel.createNotebookCellExecution(notebook.apiNotebook.cellAt(0));
            });
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const execution = kernel.createNotebookCellExecution(notebook.apiNotebook.cellAt(0));
            execution.end(true);
        });
        test('createNotebookCellExecution, cell must be alive', function () {
            const kernel = disposables.add(extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo'));
            const cell1 = notebook.apiNotebook.cellAt(0);
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            extHostNotebookDocuments.$acceptModelChanged(notebook.uri, new proxyIdentifier_1.SerializableObjectWithBuffers({
                versionId: 12,
                rawEvents: [{
                        kind: notebookCommon_1.NotebookCellsChangeType.ModelChange,
                        changes: [[0, notebook.apiNotebook.cellCount, []]]
                    }]
            }), true);
            assert.strictEqual(cell1.index, -1);
            assert.throws(() => {
                kernel.createNotebookCellExecution(cell1);
            });
        });
        test('interrupt handler, cancellation', async function () {
            let interruptCallCount = 0;
            let tokenCancelCount = 0;
            const kernel = disposables.add(extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo'));
            kernel.interruptHandler = () => { interruptCallCount += 1; };
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            disposables.add(task.token.onCancellationRequested(() => tokenCancelCount += 1));
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            assert.strictEqual(interruptCallCount, 1);
            assert.strictEqual(tokenCancelCount, 0);
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            assert.strictEqual(interruptCallCount, 2);
            assert.strictEqual(tokenCancelCount, 0);
            // should cancelling the cells end the execution task?
            task.end(false);
        });
        test('set outputs on cancel', async function () {
            const kernel = disposables.add(extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo'));
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.start();
            const b = new async_1.Barrier();
            disposables.add(task.token.onCancellationRequested(async () => {
                await task.replaceOutput(new extHostTypes_1.NotebookCellOutput([extHostTypes_1.NotebookCellOutputItem.text('canceled')]));
                task.end(true);
                b.open(); // use barrier to signal that cancellation has happened
            }));
            cellExecuteUpdates.length = 0;
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            await b.wait();
            assert.strictEqual(cellExecuteUpdates.length > 0, true);
            let found = false;
            for (const edit of cellExecuteUpdates) {
                if (edit.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
                    assert.strictEqual(edit.append, false);
                    assert.strictEqual(edit.outputs.length, 1);
                    assert.strictEqual(edit.outputs[0].items.length, 1);
                    assert.deepStrictEqual(Array.from(edit.outputs[0].items[0].valueBytes.buffer), Array.from(new TextEncoder().encode('canceled')));
                    found = true;
                }
            }
            assert.ok(found);
        });
        test('set outputs on interrupt', async function () {
            const kernel = extHostNotebookKernels.createNotebookController(extensions_2.nullExtensionDescription, 'foo', '*', 'Foo');
            extHostNotebookKernels.$acceptNotebookAssociation(0, notebook.uri, true);
            const cell1 = notebook.apiNotebook.cellAt(0);
            const task = kernel.createNotebookCellExecution(cell1);
            task.start();
            kernel.interruptHandler = async (_notebook) => {
                assert.ok(notebook.apiNotebook === _notebook);
                await task.replaceOutput(new extHostTypes_1.NotebookCellOutput([extHostTypes_1.NotebookCellOutputItem.text('interrupted')]));
                task.end(true);
            };
            cellExecuteUpdates.length = 0;
            await extHostNotebookKernels.$cancelCells(0, notebook.uri, [0]);
            assert.strictEqual(cellExecuteUpdates.length > 0, true);
            let found = false;
            for (const edit of cellExecuteUpdates) {
                if (edit.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
                    assert.strictEqual(edit.append, false);
                    assert.strictEqual(edit.outputs.length, 1);
                    assert.strictEqual(edit.outputs[0].items.length, 1);
                    assert.deepStrictEqual(Array.from(edit.outputs[0].items[0].valueBytes.buffer), Array.from(new TextEncoder().encode('interrupted')));
                    found = true;
                }
            }
            assert.ok(found);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdE5vdGVib29rS2VybmVsLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvdGVzdC9icm93c2VyL2V4dEhvc3ROb3RlYm9va0tlcm5lbC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBK0JoRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7UUFDdkIsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksc0JBQThDLENBQUM7UUFDbkQsSUFBSSxRQUFpQyxDQUFDO1FBQ3RDLElBQUksMEJBQXNELENBQUM7UUFDM0QsSUFBSSxnQkFBa0MsQ0FBQztRQUN2QyxJQUFJLGdCQUEyQyxDQUFDO1FBQ2hELElBQUksd0JBQWtELENBQUM7UUFDdkQsSUFBSSxlQUFnQyxDQUFDO1FBQ3JDLElBQUkseUJBQW9ELENBQUM7UUFDekQsSUFBSSxhQUE0QixDQUFDO1FBRWpDLE1BQU0sV0FBVyxHQUFHLFNBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUN2RCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBK0IsQ0FBQztRQUMxRCxNQUFNLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztRQUUxQyxNQUFNLGlCQUFpQixHQUFnRCxFQUFFLENBQUM7UUFDMUUsTUFBTSxrQkFBa0IsR0FBNEIsRUFBRSxDQUFDO1FBQ3ZELE1BQU0sbUJBQW1CLEdBQWdDLEVBQUUsQ0FBQztRQUU1RCxRQUFRLENBQUM7WUFDUixXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFBLCtDQUF1QyxHQUFFLENBQUM7UUFFMUMsS0FBSyxDQUFDLEtBQUs7WUFDVixpQkFBaUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLGtCQUFr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