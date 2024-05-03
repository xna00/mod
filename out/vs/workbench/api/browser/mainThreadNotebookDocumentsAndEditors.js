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
define(["require", "exports", "vs/base/common/collections", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/api/browser/mainThreadNotebookDocuments", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/api/browser/mainThreadNotebookEditors", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "../common/extHost.protocol", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, collections_1, lifecycle_1, instantiation_1, log_1, mainThreadNotebookDocuments_1, mainThreadNotebookDto_1, mainThreadNotebookEditors_1, extHostCustomers_1, editorGroupColumn_1, notebookBrowser_1, notebookEditorService_1, notebookService_1, editorGroupsService_1, editorService_1, extHost_protocol_1, proxyIdentifier_1) {
    "use strict";
    var MainThreadNotebooksAndEditors_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebooksAndEditors = void 0;
    class NotebookAndEditorState {
        static delta(before, after) {
            if (!before) {
                return {
                    addedDocuments: [...after.documents],
                    removedDocuments: [],
                    addedEditors: [...after.textEditors.values()],
                    removedEditors: [],
                    visibleEditors: [...after.visibleEditors].map(editor => editor[0])
                };
            }
            const documentDelta = (0, collections_1.diffSets)(before.documents, after.documents);
            const editorDelta = (0, collections_1.diffMaps)(before.textEditors, after.textEditors);
            const newActiveEditor = before.activeEditor !== after.activeEditor ? after.activeEditor : undefined;
            const visibleEditorDelta = (0, collections_1.diffMaps)(before.visibleEditors, after.visibleEditors);
            return {
                addedDocuments: documentDelta.added,
                removedDocuments: documentDelta.removed.map(e => e.uri),
                addedEditors: editorDelta.added,
                removedEditors: editorDelta.removed.map(removed => removed.getId()),
                newActiveEditor: newActiveEditor,
                visibleEditors: visibleEditorDelta.added.length === 0 && visibleEditorDelta.removed.length === 0
                    ? undefined
                    : [...after.visibleEditors].map(editor => editor[0])
            };
        }
        constructor(documents, textEditors, activeEditor, visibleEditors) {
            this.documents = documents;
            this.textEditors = textEditors;
            this.activeEditor = activeEditor;
            this.visibleEditors = visibleEditors;
            //
        }
    }
    let MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors_1 = class MainThreadNotebooksAndEditors {
        constructor(extHostContext, instantiationService, _notebookService, _notebookEditorService, _editorService, _editorGroupService, _logService) {
            this._notebookService = _notebookService;
            this._notebookEditorService = _notebookEditorService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._logService = _logService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._editorListeners = new lifecycle_1.DisposableMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
            this._mainThreadNotebooks = instantiationService.createInstance(mainThreadNotebookDocuments_1.MainThreadNotebookDocuments, extHostContext);
            this._mainThreadEditors = instantiationService.createInstance(mainThreadNotebookEditors_1.MainThreadNotebookEditors, extHostContext);
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadNotebookDocuments, this._mainThreadNotebooks);
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadNotebookEditors, this._mainThreadEditors);
            this._notebookService.onWillAddNotebookDocument(() => this._updateState(), this, this._disposables);
            this._notebookService.onDidRemoveNotebookDocument(() => this._updateState(), this, this._disposables);
            this._editorService.onDidActiveEditorChange(() => this._updateState(), this, this._disposables);
            this._editorService.onDidVisibleEditorsChange(() => this._updateState(), this, this._disposables);
            this._notebookEditorService.onDidAddNotebookEditor(this._handleEditorAdd, this, this._disposables);
            this._notebookEditorService.onDidRemoveNotebookEditor(this._handleEditorRemove, this, this._disposables);
            this._updateState();
        }
        dispose() {
            this._mainThreadNotebooks.dispose();
            this._mainThreadEditors.dispose();
            this._disposables.dispose();
            this._editorListeners.dispose();
        }
        _handleEditorAdd(editor) {
            this._editorListeners.set(editor.getId(), (0, lifecycle_1.combinedDisposable)(editor.onDidChangeModel(() => this._updateState()), editor.onDidFocusWidget(() => this._updateState(editor))));
            this._updateState();
        }
        _handleEditorRemove(editor) {
            this._editorListeners.deleteAndDispose(editor.getId());
            this._updateState();
        }
        _updateState(focusedEditor) {
            const editors = new Map();
            const visibleEditorsMap = new Map();
            for (const editor of this._notebookEditorService.listNotebookEditors()) {
                if (editor.hasModel()) {
                    editors.set(editor.getId(), editor);
                }
            }
            const activeNotebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            let activeEditor = null;
            if (activeNotebookEditor) {
                activeEditor = activeNotebookEditor.getId();
            }
            else if (focusedEditor?.textModel) {
                activeEditor = focusedEditor.getId();
            }
            if (activeEditor && !editors.has(activeEditor)) {
                this._logService.trace('MainThreadNotebooksAndEditors#_updateState: active editor is not in editors list', activeEditor, editors.keys());
                activeEditor = null;
            }
            for (const editorPane of this._editorService.visibleEditorPanes) {
                const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                if (notebookEditor?.hasModel() && editors.has(notebookEditor.getId())) {
                    visibleEditorsMap.set(notebookEditor.getId(), notebookEditor);
                }
            }
            const newState = new NotebookAndEditorState(new Set(this._notebookService.listNotebookDocuments()), editors, activeEditor, visibleEditorsMap);
            this._onDelta(NotebookAndEditorState.delta(this._currentState, newState));
            this._currentState = newState;
        }
        _onDelta(delta) {
            if (MainThreadNotebooksAndEditors_1._isDeltaEmpty(delta)) {
                return;
            }
            const dto = {
                removedDocuments: delta.removedDocuments,
                removedEditors: delta.removedEditors,
                newActiveEditor: delta.newActiveEditor,
                visibleEditors: delta.visibleEditors,
                addedDocuments: delta.addedDocuments.map(MainThreadNotebooksAndEditors_1._asModelAddData),
                addedEditors: delta.addedEditors.map(this._asEditorAddData, this),
            };
            // send to extension FIRST
            this._proxy.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers(dto));
            // handle internally
            this._mainThreadEditors.handleEditorsRemoved(delta.removedEditors);
            this._mainThreadNotebooks.handleNotebooksRemoved(delta.removedDocuments);
            this._mainThreadNotebooks.handleNotebooksAdded(delta.addedDocuments);
            this._mainThreadEditors.handleEditorsAdded(delta.addedEditors);
        }
        static _isDeltaEmpty(delta) {
            if (delta.addedDocuments !== undefined && delta.addedDocuments.length > 0) {
                return false;
            }
            if (delta.removedDocuments !== undefined && delta.removedDocuments.length > 0) {
                return false;
            }
            if (delta.addedEditors !== undefined && delta.addedEditors.length > 0) {
                return false;
            }
            if (delta.removedEditors !== undefined && delta.removedEditors.length > 0) {
                return false;
            }
            if (delta.visibleEditors !== undefined && delta.visibleEditors.length > 0) {
                return false;
            }
            if (delta.newActiveEditor !== undefined) {
                return false;
            }
            return true;
        }
        static _asModelAddData(e) {
            return {
                viewType: e.viewType,
                uri: e.uri,
                metadata: e.metadata,
                versionId: e.versionId,
                cells: e.cells.map(mainThreadNotebookDto_1.NotebookDto.toNotebookCellDto)
            };
        }
        _asEditorAddData(add) {
            const pane = this._editorService.visibleEditorPanes.find(pane => (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(pane) === add);
            return {
                id: add.getId(),
                documentUri: add.textModel.uri,
                selections: add.getSelections(),
                visibleRanges: add.visibleRanges,
                viewColumn: pane && (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, pane.group)
            };
        }
    };
    exports.MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors;
    exports.MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors_1 = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notebookService_1.INotebookService),
        __param(3, notebookEditorService_1.INotebookEditorService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, log_1.ILogService)
    ], MainThreadNotebooksAndEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rRG9jdW1lbnRzQW5kRWRpdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWROb3RlYm9va0RvY3VtZW50c0FuZEVkaXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQThCaEcsTUFBTSxzQkFBc0I7UUFDM0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUEwQyxFQUFFLEtBQTZCO1lBQ3JGLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPO29CQUNOLGNBQWMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztvQkFDcEMsZ0JBQWdCLEVBQUUsRUFBRTtvQkFDcEIsWUFBWSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM3QyxjQUFjLEVBQUUsRUFBRTtvQkFDbEIsY0FBYyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNsRSxDQUFDO1lBQ0gsQ0FBQztZQUNELE1BQU0sYUFBYSxHQUFHLElBQUEsc0JBQVEsRUFBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRSxNQUFNLFdBQVcsR0FBRyxJQUFBLHNCQUFRLEVBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFcEUsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLFlBQVksS0FBSyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFB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