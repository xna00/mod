/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/worker/simpleWorker", "vs/base/browser/defaultWorkerFactory", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, lifecycle_1, simpleWorker_1, defaultWorkerFactory_1, notebookCommon_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorWorkerServiceImpl = void 0;
    let NotebookEditorWorkerServiceImpl = class NotebookEditorWorkerServiceImpl extends lifecycle_1.Disposable {
        constructor(notebookService) {
            super();
            this._workerManager = this._register(new WorkerManager(notebookService));
        }
        canComputeDiff(original, modified) {
            throw new Error('Method not implemented.');
        }
        computeDiff(original, modified) {
            return this._workerManager.withWorker().then(client => {
                return client.computeDiff(original, modified);
            });
        }
        canPromptRecommendation(model) {
            return this._workerManager.withWorker().then(client => {
                return client.canPromptRecommendation(model);
            });
        }
    };
    exports.NotebookEditorWorkerServiceImpl = NotebookEditorWorkerServiceImpl;
    exports.NotebookEditorWorkerServiceImpl = NotebookEditorWorkerServiceImpl = __decorate([
        __param(0, notebookService_1.INotebookService)
    ], NotebookEditorWorkerServiceImpl);
    class WorkerManager extends lifecycle_1.Disposable {
        // private _lastWorkerUsedTime: number;
        constructor(_notebookService) {
            super();
            this._notebookService = _notebookService;
            this._editorWorkerClient = null;
            // this._lastWorkerUsedTime = (new Date()).getTime();
        }
        withWorker() {
            // this._lastWorkerUsedTime = (new Date()).getTime();
            if (!this._editorWorkerClient) {
                this._editorWorkerClient = new NotebookWorkerClient(this._notebookService, 'notebookEditorWorkerService');
            }
            return Promise.resolve(this._editorWorkerClient);
        }
    }
    class NotebookEditorModelManager extends lifecycle_1.Disposable {
        constructor(_proxy, _notebookService) {
            super();
            this._proxy = _proxy;
            this._notebookService = _notebookService;
            this._syncedModels = Object.create(null);
            this._syncedModelsLastUsedTime = Object.create(null);
        }
        ensureSyncedResources(resources) {
            for (const resource of resources) {
                const resourceStr = resource.toString();
                if (!this._syncedModels[resourceStr]) {
                    this._beginModelSync(resource);
                }
                if (this._syncedModels[resourceStr]) {
                    this._syncedModelsLastUsedTime[resourceStr] = (new Date()).getTime();
                }
            }
        }
        _beginModelSync(resource) {
            const model = this._notebookService.listNotebookDocuments().find(document => document.uri.toString() === resource.toString());
            if (!model) {
                return;
            }
            const modelUrl = resource.toString();
            this._proxy.acceptNewModel(model.uri.toString(), {
                cells: model.cells.map(cell => ({
                    handle: cell.handle,
                    uri: cell.uri,
                    source: cell.getValue(),
                    eol: cell.textBuffer.getEOL(),
                    language: cell.language,
                    mime: cell.mime,
                    cellKind: cell.cellKind,
                    outputs: cell.outputs.map(op => ({ outputId: op.outputId, outputs: op.outputs })),
                    metadata: cell.metadata,
                    internalMetadata: cell.internalMetadata,
                })),
                metadata: model.metadata
            });
            const toDispose = new lifecycle_1.DisposableStore();
            const cellToDto = (cell) => {
                return {
                    handle: cell.handle,
                    uri: cell.uri,
                    source: cell.textBuffer.getLinesContent(),
                    eol: cell.textBuffer.getEOL(),
                    language: cell.language,
                    cellKind: cell.cellKind,
                    outputs: cell.outputs.map(op => ({ outputId: op.outputId, outputs: op.outputs })),
                    metadata: cell.metadata,
                    internalMetadata: cell.internalMetadata,
                };
            };
            toDispose.add(model.onDidChangeContent((event) => {
                const dto = event.rawEvents.map(e => {
                    const data = e.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange || e.kind === notebookCommon_1.NotebookCellsChangeType.Initialize
                        ? {
                            kind: e.kind,
                            versionId: event.versionId,
                            changes: e.changes.map(diff => [diff[0], diff[1], diff[2].map(cell => cellToDto(cell))])
                        }
                        : (e.kind === notebookCommon_1.NotebookCellsChangeType.Move
                            ? {
                                kind: e.kind,
                                index: e.index,
                                length: e.length,
                                newIdx: e.newIdx,
                                versionId: event.versionId,
                                cells: e.cells.map(cell => cellToDto(cell))
                            }
                            : e);
                    return data;
                });
                this._proxy.acceptModelChanged(modelUrl.toString(), {
                    rawEvents: dto,
                    versionId: event.versionId
                });
            }));
            toDispose.add(model.onWillDispose(() => {
                this._stopModelSync(modelUrl);
            }));
            toDispose.add((0, lifecycle_1.toDisposable)(() => {
                this._proxy.acceptRemovedModel(modelUrl);
            }));
            this._syncedModels[modelUrl] = toDispose;
        }
        _stopModelSync(modelUrl) {
            const toDispose = this._syncedModels[modelUrl];
            delete this._syncedModels[modelUrl];
            delete this._syncedModelsLastUsedTime[modelUrl];
            (0, lifecycle_1.dispose)(toDispose);
        }
    }
    class NotebookWorkerHost {
        constructor(workerClient) {
            this._workerClient = workerClient;
        }
        // foreign host request
        fhr(method, args) {
            return this._workerClient.fhr(method, args);
        }
    }
    class NotebookWorkerClient extends lifecycle_1.Disposable {
        constructor(_notebookService, label) {
            super();
            this._notebookService = _notebookService;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory(label);
            this._worker = null;
            this._modelManager = null;
        }
        // foreign host request
        fhr(method, args) {
            throw new Error(`Not implemented!`);
        }
        computeDiff(original, modified) {
            return this._withSyncedResources([original, modified]).then(proxy => {
                return proxy.computeDiff(original.toString(), modified.toString());
            });
        }
        canPromptRecommendation(modelUri) {
            return this._withSyncedResources([modelUri]).then(proxy => {
                return proxy.canPromptRecommendation(modelUri.toString());
            });
        }
        _getOrCreateModelManager(proxy) {
            if (!this._modelManager) {
                this._modelManager = this._register(new NotebookEditorModelManager(proxy, this._notebookService));
            }
            return this._modelManager;
        }
        _withSyncedResources(resources) {
            return this._getProxy().then((proxy) => {
                this._getOrCreateModelManager(proxy).ensureSyncedResources(resources);
                return proxy;
            });
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/contrib/notebook/common/services/notebookSimpleWorker', new NotebookWorkerHost(this)));
                }
                catch (err) {
                    // logOnceWebWorkerWarning(err);
                    // this._worker = new SynchronousWorkerClient(new EditorSimpleWorker(new EditorWorkerHost(this), null));
                    throw (err);
                }
            }
            return this._worker;
        }
        _getProxy() {
            return this._getOrCreateWorker().getProxyObject().then(undefined, (err) => {
                // logOnceWebWorkerWarning(err);
                // this._worker = new SynchronousWorkerClient(new EditorSimpleWorker(new EditorWorkerHost(this), null));
                // return this._getOrCreateWorker().getProxyObject();
                throw (err);
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tXb3JrZXJTZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9zZXJ2aWNlcy9ub3RlYm9va1dvcmtlclNlcnZpY2VJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWF6RixJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHNCQUFVO1FBSzlELFlBQ21CLGVBQWlDO1lBRW5ELEtBQUssRUFBRSxDQUFDO1lBRVIsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUNELGNBQWMsQ0FBQyxRQUFhLEVBQUUsUUFBYTtZQUMxQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVELFdBQVcsQ0FBQyxRQUFhLEVBQUUsUUFBYTtZQUN2QyxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUNyRCxPQUFPLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9DLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELHVCQUF1QixDQUFDLEtBQVU7WUFDakMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtnQkFDckQsT0FBTyxNQUFNLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUMsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO0tBQ0QsQ0FBQTtJQTNC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