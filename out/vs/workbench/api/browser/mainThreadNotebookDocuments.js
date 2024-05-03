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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/workbench/api/browser/mainThreadDocuments", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/platform/uriIdentity/common/uriIdentity", "../common/extHost.protocol", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, lifecycle_1, map_1, uri_1, mainThreadDocuments_1, notebookCommon_1, notebookEditorModelResolverService_1, uriIdentity_1, extHost_protocol_1, mainThreadNotebookDto_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookDocuments = void 0;
    let MainThreadNotebookDocuments = class MainThreadNotebookDocuments {
        constructor(extHostContext, _notebookEditorModelResolverService, _uriIdentityService) {
            this._notebookEditorModelResolverService = _notebookEditorModelResolverService;
            this._uriIdentityService = _uriIdentityService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._documentEventListenersMapping = new map_1.ResourceMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocuments);
            this._modelReferenceCollection = new mainThreadDocuments_1.BoundModelReferenceCollection(this._uriIdentityService.extUri);
            // forward dirty and save events
            this._disposables.add(this._notebookEditorModelResolverService.onDidChangeDirty(model => this._proxy.$acceptDirtyStateChanged(model.resource, model.isDirty())));
            this._disposables.add(this._notebookEditorModelResolverService.onDidSaveNotebook(e => this._proxy.$acceptModelSaved(e)));
            // when a conflict is going to happen RELEASE references that are held by extensions
            this._disposables.add(_notebookEditorModelResolverService.onWillFailWithConflict(e => {
                this._modelReferenceCollection.remove(e.resource);
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._modelReferenceCollection.dispose();
            (0, lifecycle_1.dispose)(this._documentEventListenersMapping.values());
        }
        handleNotebooksAdded(notebooks) {
            for (const textModel of notebooks) {
                const disposableStore = new lifecycle_1.DisposableStore();
                disposableStore.add(textModel.onDidChangeContent(event => {
                    const eventDto = {
                        versionId: event.versionId,
                        rawEvents: []
                    };
                    for (const e of event.rawEvents) {
                        switch (e.kind) {
                            case notebookCommon_1.NotebookCellsChangeType.ModelChange:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    changes: e.changes.map(diff => [diff[0], diff[1], diff[2].map(cell => mainThreadNotebookDto_1.NotebookDto.toNotebookCellDto(cell))])
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.Move:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    index: e.index,
                                    length: e.length,
                                    newIdx: e.newIdx,
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.Output:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    index: e.index,
                                    outputs: e.outputs.map(mainThreadNotebookDto_1.NotebookDto.toNotebookOutputDto)
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.OutputItem:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    index: e.index,
                                    outputId: e.outputId,
                                    outputItems: e.outputItems.map(mainThreadNotebookDto_1.NotebookDto.toNotebookOutputItemDto),
                                    append: e.append
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage:
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellContent:
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata:
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellInternalMetadata:
                                eventDto.rawEvents.push(e);
                                break;
                        }
                    }
                    const hasDocumentMetadataChangeEvent = event.rawEvents.find(e => e.kind === notebookCommon_1.NotebookCellsChangeType.ChangeDocumentMetadata);
                    // using the model resolver service to know if the model is dirty or not.
                    // assuming this is the first listener it can mean that at first the model
                    // is marked as dirty and that another event is fired
                    this._proxy.$acceptModelChanged(textModel.uri, new proxyIdentifier_1.SerializableObjectWithBuffers(eventDto), this._notebookEditorModelResolverService.isDirty(textModel.uri), hasDocumentMetadataChangeEvent ? textModel.metadata : undefined);
                }));
                this._documentEventListenersMapping.set(textModel.uri, disposableStore);
            }
        }
        handleNotebooksRemoved(uris) {
            for (const uri of uris) {
                this._documentEventListenersMapping.get(uri)?.dispose();
                this._documentEventListenersMapping.delete(uri);
            }
        }
        async $tryCreateNotebook(options) {
            const ref = await this._notebookEditorModelResolverService.resolve({ untitledResource: undefined }, options.viewType);
            // untitled notebooks are disposed when they get saved. we should not hold a reference
            // to such a disposed notebook and therefore dispose the reference as well
            ref.object.notebook.onWillDispose(() => {
                ref.dispose();
            });
            // untitled notebooks are dirty by default
            this._proxy.$acceptDirtyStateChanged(ref.object.resource, true);
            // apply content changes... slightly HACKY -> this triggers a change event
            if (options.content) {
                const data = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(options.content);
                ref.object.notebook.reset(data.cells, data.metadata, ref.object.notebook.transientOptions);
            }
            return ref.object.resource;
        }
        async $tryOpenNotebook(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const ref = await this._notebookEditorModelResolverService.resolve(uri, undefined);
            this._modelReferenceCollection.add(uri, ref);
            return uri;
        }
        async $trySaveNotebook(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const ref = await this._notebookEditorModelResolverService.resolve(uri);
            const saveResult = await ref.object.save();
            ref.dispose();
            return saveResult;
        }
    };
    exports.MainThreadNotebookDocuments = MainThreadNotebookDocuments;
    exports.MainThreadNotebookDocuments = MainThreadNotebookDocuments = __decorate([
        __param(1, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], MainThreadNotebookDocuments);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rRG9jdW1lbnRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZE5vdGVib29rRG9jdW1lbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWV6RixJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUEyQjtRQVF2QyxZQUNDLGNBQStCLEVBQ00sbUNBQXlGLEVBQ3pHLG1CQUF5RDtZQUR4Qix3Q0FBbUMsR0FBbkMsbUNBQW1DLENBQXFDO1lBQ3hGLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBcUI7WUFUOUQsaUJBQVksR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUdyQyxtQ0FBOEIsR0FBRyxJQUFJLGlCQUFXLEVBQW1CLENBQUM7WUFRcEYsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUMvRSxJQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxtREFBNkIsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFcEcsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakssSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFF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