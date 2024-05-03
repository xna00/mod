/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/test/common/mock", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/editor/common/languages/modesRegistry", "vs/platform/actions/common/actions", "vs/base/test/common/utils", "vs/base/common/async"], function (require, exports, assert, uri_1, extensions_1, testNotebookEditor_1, event_1, notebookKernelService_1, notebookKernelServiceImpl_1, notebookService_1, mock_1, lifecycle_1, notebookTextModel_1, modesRegistry_1, actions_1, utils_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookKernelService', () => {
        let instantiationService;
        let kernelService;
        let disposables;
        let onDidAddNotebookDocument;
        teardown(() => {
            disposables.dispose();
        });
        (0, utils_1.ensureNoDisposablesAreLeakedInTestSuite)();
        setup(function () {
            disposables = new lifecycle_1.DisposableStore();
            onDidAddNotebookDocument = new event_1.Emitter();
            disposables.add(onDidAddNotebookDocument);
            instantiationService = (0, testNotebookEditor_1.setupInstantiationService)(disposables);
            instantiationService.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidAddNotebookDocument = onDidAddNotebookDocument.event;
                    this.onWillRemoveNotebookDocument = event_1.Event.None;
                }
                getNotebookTextModels() { return []; }
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
        });
        test('notebook priorities', function () {
            const u1 = uri_1.URI.parse('foo:///one');
            const u2 = uri_1.URI.parse('foo:///two');
            const k1 = new TestNotebookKernel({ label: 'z' });
            const k2 = new TestNotebookKernel({ label: 'a' });
            disposables.add(kernelService.registerKernel(k1));
            disposables.add(kernelService.registerKernel(k2));
            // equal priorities -> sort by name
            let info = kernelService.getMatchingKernel({ uri: u1, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
            // update priorities for u1 notebook
            kernelService.updateKernelNotebookAffinity(k2, u1, 2);
            kernelService.updateKernelNotebookAffinity(k2, u2, 1);
            // updated
            info = kernelService.getMatchingKernel({ uri: u1, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
            // NOT updated
            info = kernelService.getMatchingKernel({ uri: u2, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
            // reset
            kernelService.updateKernelNotebookAffinity(k2, u1, undefined);
            info = kernelService.getMatchingKernel({ uri: u1, viewType: 'foo' });
            assert.ok(info.all[0] === k2);
            assert.ok(info.all[1] === k1);
        });
        test('new kernel with higher affinity wins, https://github.com/microsoft/vscode/issues/122028', function () {
            const notebook = uri_1.URI.parse('foo:///one');
            const kernel = new TestNotebookKernel();
            disposables.add(kernelService.registerKernel(kernel));
            let info = kernelService.getMatchingKernel({ uri: notebook, viewType: 'foo' });
            assert.strictEqual(info.all.length, 1);
            assert.ok(info.all[0] === kernel);
            const betterKernel = new TestNotebookKernel();
            disposables.add(kernelService.registerKernel(betterKernel));
            info = kernelService.getMatchingKernel({ uri: notebook, viewType: 'foo' });
            assert.strictEqual(info.all.length, 2);
            kernelService.updateKernelNotebookAffinity(betterKernel, notebook, 2);
            info = kernelService.getMatchingKernel({ uri: notebook, viewType: 'foo' });
            assert.strictEqual(info.all.length, 2);
            assert.ok(info.all[0] === betterKernel);
            assert.ok(info.all[1] === kernel);
        });
        test('onDidChangeSelectedNotebooks not fired on initial notebook open #121904', function () {
            const uri = uri_1.URI.parse('foo:///one');
            const jupyter = { uri, viewType: 'jupyter' };
            const dotnet = { uri, viewType: 'dotnet' };
            const jupyterKernel = new TestNotebookKernel({ viewType: jupyter.viewType });
            const dotnetKernel = new TestNotebookKernel({ viewType: dotnet.viewType });
            disposables.add(kernelService.registerKernel(jupyterKernel));
            disposables.add(kernelService.registerKernel(dotnetKernel));
            kernelService.selectKernelForNotebook(jupyterKernel, jupyter);
            kernelService.selectKernelForNotebook(dotnetKernel, dotnet);
            let info = kernelService.getMatchingKernel(dotnet);
            assert.strictEqual(info.selected === dotnetKernel, true);
            info = kernelService.getMatchingKernel(jupyter);
            assert.strictEqual(info.selected === jupyterKernel, true);
        });
        test('onDidChangeSelectedNotebooks not fired on initial notebook open #121904, p2', async function () {
            const uri = uri_1.URI.parse('foo:///one');
            const jupyter = { uri, viewType: 'jupyter' };
            const dotnet = { uri, viewType: 'dotnet' };
            const jupyterKernel = new TestNotebookKernel({ viewType: jupyter.viewType });
            const dotnetKernel = new TestNotebookKernel({ viewType: dotnet.viewType });
            disposables.add(kernelService.registerKernel(jupyterKernel));
            disposables.add(kernelService.registerKernel(dotnetKernel));
            kernelService.selectKernelForNotebook(jupyterKernel, jupyter);
            kernelService.selectKernelForNotebook(dotnetKernel, dotnet);
            const transientOptions = {
                transientOutputs: false,
                transientCellMetadata: {},
                transientDocumentMetadata: {},
                cellContentMetadata: {},
            };
            {
                // open as jupyter -> bind event
                const p1 = event_1.Event.toPromise(kernelService.onDidChangeSelectedNotebooks);
                const d1 = disposables.add(instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, jupyter.viewType, jupyter.uri, [], {}, transientOptions));
                onDidAddNotebookDocument.fire(d1);
                const event = await p1;
                assert.strictEqual(event.newKernel, jupyterKernel.id);
            }
            {
                // RE-open as dotnet -> bind event
                const p2 = event_1.Event.toPromise(kernelService.onDidChangeSelectedNotebooks);
                const d2 = disposables.add(instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, dotnet.viewType, dotnet.uri, [], {}, transientOptions));
                onDidAddNotebookDocument.fire(d2);
                const event2 = await p2;
                assert.strictEqual(event2.newKernel, dotnetKernel.id);
            }
        });
    });
    class TestNotebookKernel {
        executeNotebookCellsRequest() {
            throw new Error('Method not implemented.');
        }
        cancelNotebookCellExecution() {
            throw new Error('Method not implemented.');
        }
        provideVariables(notebookUri, parentId, kind, start, token) {
            return async_1.AsyncIterableObject.EMPTY;
        }
        constructor(opts) {
            this.id = Math.random() + 'kernel';
            this.label = 'test-label';
            this.viewType = '*';
            this.onDidChange = event_1.Event.None;
            this.extension = new extensions_1.ExtensionIdentifier('test');
            this.localResourceRoot = uri_1.URI.file('/test');
            this.preloadUris = [];
            this.preloadProvides = [];
            this.supportedLanguages = [];
            this.supportedLanguages = opts?.languages ?? [modesRegistry_1.PLAINTEXT_LANGUAGE_ID];
            this.label = opts?.label ?? this.label;
            this.viewType = opts?.viewType ?? this.viewType;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxTZXJ2aWNlLnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0tlcm5lbFNlcnZpY2UudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsS0FBSyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUVuQyxJQUFJLG9CQUE4QyxDQUFDO1FBQ25ELElBQUksYUFBcUMsQ0FBQztRQUMxQyxJQUFJLFdBQTRCLENBQUM7UUFFakMsSUFBSSx3QkFBb0QsQ0FBQztRQUN6RCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQztZQUNMLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUVwQyx3QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFDO1lBQ3pDLFdBQVcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUUxQyxvQkFBb0IsR0FBRyxJQUFBLDhDQUF5QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQ0FBZ0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBb0I7Z0JBQXRDOztvQkFDdEMsNkJBQXdCLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDO29CQUMxRCxpQ0FBNEIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO2dCQUVwRCxDQUFDO2dCQURTLHFCQUFxQixLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUMvQyxDQUFDLENBQUM7WUFD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