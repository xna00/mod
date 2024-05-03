/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/test/common/mock", "vs/editor/common/languages/modesRegistry", "vs/platform/actions/common/actions", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/services/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookExecutionStateServiceImpl", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, async_1, event_1, lifecycle_1, uri_1, mock_1, modesRegistry_1, actions_1, extensions_1, cellOperations_1, notebookExecutionServiceImpl_1, notebookExecutionStateServiceImpl_1, notebookKernelServiceImpl_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookExecutionStateService', () => {
        let instantiationService;
        let kernelService;
        let disposables;
        let testNotebookModel;
        teardown(() => {
            disposables.dispose();
        });
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidAddNotebookDocument = event_1.Event.None;
                    this.onWillRemoveNotebookDocument = event_1.Event.None;
                }
                getNotebookTextModels() { return []; }
                getNotebookTextModel(uri) {
                    return testNotebookModel;
                }
            });
            instantiationService.stub(actions_1.IMenuService, new class extends (0, mock_1.mock)() {
                createMenu() {
                    return new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.onDidChange = event_1.Event.None;
                        }
                        getActions() { return []; }
                        dispose() { }
                    };
                }
            });
            kernelService = disposables.add(instantiationService.createInstance(notebookKernelServiceImpl_1.NotebookKernelService));
            instantiationService.set(notebookKernelService_1.INotebookKernelService, kernelService);
            instantiationService.set(notebookExecutionService_1.INotebookExecutionService, disposables.add(instantiationService.createInstance(notebookExecutionServiceImpl_1.NotebookExecutionService)));
            instantiationService.set(notebookExecutionStateService_1.INotebookExecutionStateService, disposables.add(instantiationService.createInstance(notebookExecutionStateServiceImpl_1.NotebookExecutionStateService)));
        });
        async function withTestNotebook(cells, callback) {
            return (0, testNotebookEditor_1.withTestNotebook)(cells, (editor, viewModel) => callback(viewModel, viewModel.notebookDocument));
        }
        function testCancelOnDelete(expectedCancels, implementsInterrupt) {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                let cancels = 0;
                const kernel = new class extends TestNotebookKernel {
                    constructor() {
                        super({ languages: ['javascript'] });
                        this.implementsInterrupt = implementsInterrupt;
                    }
                    async executeNotebookCellsRequest() { }
                    async cancelNotebookCellExecution(_uri, handles) {
                        cancels += handles.length;
                    }
                };
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                // Should cancel executing and pending cells, when kernel does not implement interrupt
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const cell2 = (0, cellOperations_1.insertCellAtIndex)(viewModel, 1, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const cell3 = (0, cellOperations_1.insertCellAtIndex)(viewModel, 2, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                (0, cellOperations_1.insertCellAtIndex)(viewModel, 3, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true); // Not deleted
                const exe = executionStateService.createCellExecution(viewModel.uri, cell.handle); // Executing
                exe.confirm();
                exe.update([{ editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState, executionOrder: 1 }]);
                const exe2 = executionStateService.createCellExecution(viewModel.uri, cell2.handle); // Pending
                exe2.confirm();
                executionStateService.createCellExecution(viewModel.uri, cell3.handle); // Unconfirmed
                assert.strictEqual(cancels, 0);
                viewModel.notebookDocument.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 0, count: 3, cells: []
                    }], true, undefined, () => undefined, undefined, false);
                assert.strictEqual(cancels, expectedCancels);
            });
        }
        // TODO@roblou Could be a test just for NotebookExecutionListeners, which can be a standalone contribution
        test('cancel execution when cell is deleted', async function () {
            return testCancelOnDelete(3, false);
        });
        test('cancel execution when cell is deleted in interrupt-type kernel', async function () {
            return testCancelOnDelete(1, true);
        });
        test('fires onDidChangeCellExecution when cell is completed while deleted', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const exe = executionStateService.createCellExecution(viewModel.uri, cell.handle);
                let didFire = false;
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                        didFire = !e.changed;
                    }
                }));
                viewModel.notebookDocument.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 0, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, false);
                exe.complete({});
                assert.strictEqual(didFire, true);
            });
        });
        test('does not fire onDidChangeCellExecution for output updates', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const exe = executionStateService.createCellExecution(viewModel.uri, cell.handle);
                let didFire = false;
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                        didFire = true;
                    }
                }));
                exe.update([{ editType: notebookExecutionService_1.CellExecutionUpdateType.OutputItems, items: [], outputId: '1' }]);
                assert.strictEqual(didFire, false);
                exe.update([{ editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState, executionOrder: 123 }]);
                assert.strictEqual(didFire, true);
                exe.complete({});
            });
        });
        // #142466
        test('getCellExecution and onDidChangeCellExecution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                const deferred = new async_1.DeferredPromise();
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.cell) {
                        const cellUri = notebookCommon_1.CellUri.generate(e.notebook, e.cellHandle);
                        const exe = executionStateService.getCellExecution(cellUri);
                        assert.ok(exe);
                        assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                        assert.strictEqual(e.cellHandle, exe.cellHandle);
                        assert.strictEqual(exe.notebook.toString(), e.changed?.notebook.toString());
                        assert.strictEqual(exe.cellHandle, e.changed?.cellHandle);
                        deferred.complete();
                    }
                }));
                executionStateService.createCellExecution(viewModel.uri, cell.handle);
                return deferred.p;
            });
        });
        test('getExecution and onDidChangeExecution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const eventRaisedWithExecution = [];
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                executionStateService.onDidChangeExecution(e => eventRaisedWithExecution.push(e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook && !!e.changed), this, disposables);
                const deferred = new async_1.DeferredPromise();
                disposables.add(executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook) {
                        const exe = executionStateService.getExecution(viewModel.uri);
                        assert.ok(exe);
                        assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                        assert.ok(e.affectsNotebook(viewModel.uri));
                        assert.deepStrictEqual(eventRaisedWithExecution, [true]);
                        deferred.complete();
                    }
                }));
                executionStateService.createExecution(viewModel.uri);
                return deferred.p;
            });
        });
        test('getExecution and onDidChangeExecution 2', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const deferred = new async_1.DeferredPromise();
                const expectedNotebookEventStates = [notebookCommon_1.NotebookExecutionState.Unconfirmed, notebookCommon_1.NotebookExecutionState.Pending, notebookCommon_1.NotebookExecutionState.Executing, undefined];
                executionStateService.onDidChangeExecution(e => {
                    if (e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook) {
                        const expectedState = expectedNotebookEventStates.shift();
                        if (typeof expectedState === 'number') {
                            const exe = executionStateService.getExecution(viewModel.uri);
                            assert.ok(exe);
                            assert.strictEqual(e.notebook.toString(), exe.notebook.toString());
                            assert.strictEqual(e.changed?.state, expectedState);
                        }
                        else {
                            assert.ok(e.changed === undefined);
                        }
                        assert.ok(e.affectsNotebook(viewModel.uri));
                        if (expectedNotebookEventStates.length === 0) {
                            deferred.complete();
                        }
                    }
                }, this, disposables);
                const execution = executionStateService.createExecution(viewModel.uri);
                execution.confirm();
                execution.begin();
                execution.complete();
                return deferred.p;
            });
        });
        test('force-cancel works for Cell Execution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                const cell = (0, cellOperations_1.insertCellAtIndex)(viewModel, 0, 'var c = 3', 'javascript', notebookCommon_1.CellKind.Code, {}, [], true, true);
                executionStateService.createCellExecution(viewModel.uri, cell.handle);
                const exe = executionStateService.getCellExecution(cell.uri);
                assert.ok(exe);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const exe2 = executionStateService.getCellExecution(cell.uri);
                assert.strictEqual(exe2, undefined);
            });
        });
        test('force-cancel works for Notebook Execution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const eventRaisedWithExecution = [];
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                executionStateService.onDidChangeExecution(e => eventRaisedWithExecution.push(e.type === notebookExecutionStateService_1.NotebookExecutionType.notebook && !!e.changed), this, disposables);
                executionStateService.createExecution(viewModel.uri);
                const exe = executionStateService.getExecution(viewModel.uri);
                assert.ok(exe);
                assert.deepStrictEqual(eventRaisedWithExecution, [true]);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const exe2 = executionStateService.getExecution(viewModel.uri);
                assert.deepStrictEqual(eventRaisedWithExecution, [true, false]);
                assert.strictEqual(exe2, undefined);
            });
        });
        test('force-cancel works for Cell and Notebook Execution', async function () {
            return withTestNotebook([], async (viewModel) => {
                testNotebookModel = viewModel.notebookDocument;
                const kernel = new TestNotebookKernel();
                kernelService.registerKernel(kernel);
                kernelService.selectKernelForNotebook(kernel, viewModel.notebookDocument);
                const executionStateService = instantiationService.get(notebookExecutionStateService_1.INotebookExecutionStateService);
                executionStateService.createExecution(viewModel.uri);
                executionStateService.createExecution(viewModel.uri);
                const cellExe = executionStateService.getExecution(viewModel.uri);
                const exe = executionStateService.getExecution(viewModel.uri);
                assert.ok(cellExe);
                assert.ok(exe);
                executionStateService.forceCancelNotebookExecutions(viewModel.uri);
                const cellExe2 = executionStateService.getExecution(viewModel.uri);
                const exe2 = executionStateService.getExecution(viewModel.uri);
                assert.strictEqual(cellExe2, undefined);
                assert.strictEqual(exe2, undefined);
            });
        });
    });
    class TestNotebookKernel {
        async executeNotebookCellsRequest() { }
        async cancelNotebookCellExecution(uri, cellHandles) { }
        provideVariables(notebookUri, parentId, kind, start, token) {
            return async_1.AsyncIterableObject.EMPTY;
        }
        constructor(opts) {
            this.id = 'test';
            this.label = '';
            this.viewType = '*';
            this.onDidChange = event_1.Event.None;
            this.extension = new extensions_1.ExtensionIdentifier('test');
            this.localResourceRoot = uri_1.URI.file('/test');
            this.preloadUris = [];
            this.preloadProvides = [];
            this.supportedLanguages = [];
            this.supportedLanguages = opts?.languages ?? [modesRegistry_1.PLAINTEXT_LANGUAGE_ID];
            if (opts?.id) {
                this.id = opts?.id;
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tFeGVjdXRpb25TdGF0ZVNlcnZpY2UudGVzdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svdGVzdC9icm93c2VyL25vdGVib29rRXhlY3V0aW9uU3RhdGVTZXJ2aWNlLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUEwQmhHLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxHQUFHLEVBQUU7UUFFM0MsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGFBQXFDLENBQUM7UUFDMUMsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksaUJBQWdELENBQUM7UUFFckQsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNiLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN2QixDQUFDLENBQUMsQ0FBQztRQUVILEtBQUssQ0FBQztZQUVMLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVwQyxvQkFBb0IsR0FBRyxJQUFBLDhDQUF5QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRTlELG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQ0FBZ0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBb0I7Z0JBQXRDOztvQkFDdEMsNkJBQXdCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztvQkFDdEMsaUNBQTRCLEdBQUcsYUFBSyxDQUFDLElBQUksQ0FBQztnQkFLcEQsQ0FBQztnQkFKUyxxQkFBcUIsS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLG9CQUFvQixDQUFDLEdBQVE7b0JBQ3JDLE9BQU8saUJBQWlCLENBQUM7Z0JBQzFCLENBQUM7YUFDRCxDQUFDLENBQUM7WUFFSCxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsc0JBQVksRUFBRSxJ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