/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/platform/extensions/common/extensions", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/base/common/event", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/services/notebookKernelServiceImpl", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/test/common/mock", "vs/base/common/lifecycle", "vs/editor/common/languages/modesRegistry", "vs/platform/actions/common/actions", "vs/workbench/contrib/notebook/browser/services/notebookKernelHistoryServiceImpl", "vs/platform/storage/common/storage", "vs/workbench/contrib/notebook/common/notebookLoggingService", "vs/base/test/common/utils", "vs/base/common/async"], function (require, exports, assert, uri_1, extensions_1, testNotebookEditor_1, event_1, notebookKernelService_1, notebookKernelServiceImpl_1, notebookService_1, mock_1, lifecycle_1, modesRegistry_1, actions_1, notebookKernelHistoryServiceImpl_1, storage_1, notebookLoggingService_1, utils_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('NotebookKernelHistoryService', () => {
        let disposables;
        let instantiationService;
        let kernelService;
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
        test('notebook kernel empty history', function () {
            const u1 = uri_1.URI.parse('foo:///one');
            const k1 = new TestNotebookKernel({ label: 'z', viewType: 'foo' });
            const k2 = new TestNotebookKernel({ label: 'a', viewType: 'foo' });
            disposables.add(kernelService.registerKernel(k1));
            disposables.add(kernelService.registerKernel(k2));
            instantiationService.stub(storage_1.IStorageService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onWillSaveState = event_1.Event.None;
                }
                onDidChangeValue(scope, key, disposable) {
                    return event_1.Event.None;
                }
                get(key, scope, fallbackValue) {
                    if (key === 'notebook.kernelHistory') {
                        return JSON.stringify({
                            'foo': {
                                'entries': []
                            }
                        });
                    }
                    return undefined;
                }
            });
            instantiationService.stub(notebookLoggingService_1.INotebookLoggingService, new class extends (0, mock_1.mock)() {
                info() { }
                debug() { }
            });
            const kernelHistoryService = disposables.add(instantiationService.createInstance(notebookKernelHistoryServiceImpl_1.NotebookKernelHistoryService));
            let info = kernelHistoryService.getKernels({ uri: u1, viewType: 'foo' });
            assert.equal(info.all.length, 0);
            assert.ok(!info.selected);
            // update priorities for u1 notebook
            kernelService.updateKernelNotebookAffinity(k2, u1, 2);
            info = kernelHistoryService.getKernels({ uri: u1, viewType: 'foo' });
            assert.equal(info.all.length, 0);
            // MRU only auto selects kernel if there is only one
            assert.deepStrictEqual(info.selected, undefined);
        });
        test('notebook kernel history restore', function () {
            const u1 = uri_1.URI.parse('foo:///one');
            const k1 = new TestNotebookKernel({ label: 'z', viewType: 'foo' });
            const k2 = new TestNotebookKernel({ label: 'a', viewType: 'foo' });
            const k3 = new TestNotebookKernel({ label: 'b', viewType: 'foo' });
            disposables.add(kernelService.registerKernel(k1));
            disposables.add(kernelService.registerKernel(k2));
            disposables.add(kernelService.registerKernel(k3));
            instantiationService.stub(storage_1.IStorageService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onWillSaveState = event_1.Event.None;
                }
                onDidChangeValue(scope, key, disposable) {
                    return event_1.Event.None;
                }
                get(key, scope, fallbackValue) {
                    if (key === 'notebook.kernelHistory') {
                        return JSON.stringify({
                            'foo': {
                                'entries': [
                                    k2.id
                                ]
                            }
                        });
                    }
                    return undefined;
                }
            });
            instantiationService.stub(notebookLoggingService_1.INotebookLoggingService, new class extends (0, mock_1.mock)() {
                info() { }
                debug() { }
            });
            const kernelHistoryService = disposables.add(instantiationService.createInstance(notebookKernelHistoryServiceImpl_1.NotebookKernelHistoryService));
            let info = kernelHistoryService.getKernels({ uri: u1, viewType: 'foo' });
            assert.equal(info.all.length, 1);
            assert.deepStrictEqual(info.selected, undefined);
            kernelHistoryService.addMostRecentKernel(k3);
            info = kernelHistoryService.getKernels({ uri: u1, viewType: 'foo' });
            assert.deepStrictEqual(info.all, [k3, k2]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tLZXJuZWxIaXN0b3J5LnRlc3QuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL3Rlc3QvYnJvd3Nlci9ub3RlYm9va0tlcm5lbEhpc3RvcnkudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXVCaEcsS0FBSyxDQUFDLDhCQUE4QixFQUFFLEdBQUcsRUFBRTtRQUUxQyxJQUFJLFdBQTRCLENBQUM7UUFDakMsSUFBSSxvQkFBOEMsQ0FBQztRQUNuRCxJQUFJLGFBQXFDLENBQUM7UUFFMUMsSUFBSSx3QkFBb0QsQ0FBQztRQUV6RCxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2IsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBQSwrQ0FBdUMsR0FBRSxDQUFDO1FBRTFDLEtBQUssQ0FBQztZQUNMLFdBQVcsR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUNwQyx3QkFBd0IsR0FBRyxJQUFJLGVBQU8sRUFBRSxDQUFDO1lBQ3pDLFdBQVcsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUUxQyxvQkFBb0IsR0FBRyxJQUFBLDhDQUF5QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELG9CQUFvQixDQUFDLElBQUksQ0FBQyxrQ0FBZ0IsRUFBRSxJQUFJLEtBQU0sU0FBUSxJQUFBLFdBQUksR0FBb0I7Z0JBQXRDOztvQkFDdEMsNkJBQXdCLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxDQUFDO29CQUMxRCxpQ0FBNEIsR0FBRyxhQUFLLENBQUMsSUFBSSxDQUFDO2dCQUVwRCxDQUFDO2dCQURTLHFCQUFxQixLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUMvQyxDQUFDLENBQUM7WUFD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