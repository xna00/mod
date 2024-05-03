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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorService", "vs/editor/common/model", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/browser/mainThreadDocuments", "vs/workbench/api/browser/mainThreadEditor", "vs/workbench/api/browser/mainThreadEditors", "vs/workbench/api/common/extHost.protocol", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/path/common/pathService", "vs/base/common/collections", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, lifecycle_1, editorBrowser_1, codeEditorService_1, model_1, model_2, resolverService_1, files_1, extHostCustomers_1, mainThreadDocuments_1, mainThreadEditor_1, mainThreadEditors_1, extHost_protocol_1, textEditor_1, editorGroupColumn_1, editorService_1, editorGroupsService_1, textfiles_1, environmentService_1, workingCopyFileService_1, uriIdentity_1, clipboardService_1, pathService_1, collections_1, panecomposite_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDocumentsAndEditors = void 0;
    class TextEditorSnapshot {
        constructor(editor) {
            this.editor = editor;
            this.id = `${editor.getId()},${editor.getModel().id}`;
        }
    }
    class DocumentAndEditorStateDelta {
        constructor(removedDocuments, addedDocuments, removedEditors, addedEditors, oldActiveEditor, newActiveEditor) {
            this.removedDocuments = removedDocuments;
            this.addedDocuments = addedDocuments;
            this.removedEditors = removedEditors;
            this.addedEditors = addedEditors;
            this.oldActiveEditor = oldActiveEditor;
            this.newActiveEditor = newActiveEditor;
            this.isEmpty = this.removedDocuments.length === 0
                && this.addedDocuments.length === 0
                && this.removedEditors.length === 0
                && this.addedEditors.length === 0
                && oldActiveEditor === newActiveEditor;
        }
        toString() {
            let ret = 'DocumentAndEditorStateDelta\n';
            ret += `\tRemoved Documents: [${this.removedDocuments.map(d => d.uri.toString(true)).join(', ')}]\n`;
            ret += `\tAdded Documents: [${this.addedDocuments.map(d => d.uri.toString(true)).join(', ')}]\n`;
            ret += `\tRemoved Editors: [${this.removedEditors.map(e => e.id).join(', ')}]\n`;
            ret += `\tAdded Editors: [${this.addedEditors.map(e => e.id).join(', ')}]\n`;
            ret += `\tNew Active Editor: ${this.newActiveEditor}\n`;
            return ret;
        }
    }
    class DocumentAndEditorState {
        static compute(before, after) {
            if (!before) {
                return new DocumentAndEditorStateDelta([], [...after.documents.values()], [], [...after.textEditors.values()], undefined, after.activeEditor);
            }
            const documentDelta = (0, collections_1.diffSets)(before.documents, after.documents);
            const editorDelta = (0, collections_1.diffMaps)(before.textEditors, after.textEditors);
            const oldActiveEditor = before.activeEditor !== after.activeEditor ? before.activeEditor : undefined;
            const newActiveEditor = before.activeEditor !== after.activeEditor ? after.activeEditor : undefined;
            return new DocumentAndEditorStateDelta(documentDelta.removed, documentDelta.added, editorDelta.removed, editorDelta.added, oldActiveEditor, newActiveEditor);
        }
        constructor(documents, textEditors, activeEditor) {
            this.documents = documents;
            this.textEditors = textEditors;
            this.activeEditor = activeEditor;
            //
        }
    }
    var ActiveEditorOrder;
    (function (ActiveEditorOrder) {
        ActiveEditorOrder[ActiveEditorOrder["Editor"] = 0] = "Editor";
        ActiveEditorOrder[ActiveEditorOrder["Panel"] = 1] = "Panel";
    })(ActiveEditorOrder || (ActiveEditorOrder = {}));
    let MainThreadDocumentAndEditorStateComputer = class MainThreadDocumentAndEditorStateComputer {
        constructor(_onDidChangeState, _modelService, _codeEditorService, _editorService, _paneCompositeService) {
            this._onDidChangeState = _onDidChangeState;
            this._modelService = _modelService;
            this._codeEditorService = _codeEditorService;
            this._editorService = _editorService;
            this._paneCompositeService = _paneCompositeService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._toDisposeOnEditorRemove = new lifecycle_1.DisposableMap();
            this._activeEditorOrder = 0 /* ActiveEditorOrder.Editor */;
            this._modelService.onModelAdded(this._updateStateOnModelAdd, this, this._toDispose);
            this._modelService.onModelRemoved(_ => this._updateState(), this, this._toDispose);
            this._editorService.onDidActiveEditorChange(_ => this._updateState(), this, this._toDispose);
            this._codeEditorService.onCodeEditorAdd(this._onDidAddEditor, this, this._toDispose);
            this._codeEditorService.onCodeEditorRemove(this._onDidRemoveEditor, this, this._toDispose);
            this._codeEditorService.listCodeEditors().forEach(this._onDidAddEditor, this);
            event_1.Event.filter(this._paneCompositeService.onDidPaneCompositeOpen, event => event.viewContainerLocation === 1 /* ViewContainerLocation.Panel */)(_ => this._activeEditorOrder = 1 /* ActiveEditorOrder.Panel */, undefined, this._toDispose);
            event_1.Event.filter(this._paneCompositeService.onDidPaneCompositeClose, event => event.viewContainerLocation === 1 /* ViewContainerLocation.Panel */)(_ => this._activeEditorOrder = 0 /* ActiveEditorOrder.Editor */, undefined, this._toDispose);
            this._editorService.onDidVisibleEditorsChange(_ => this._activeEditorOrder = 0 /* ActiveEditorOrder.Editor */, undefined, this._toDispose);
            this._updateState();
        }
        dispose() {
            this._toDispose.dispose();
            this._toDisposeOnEditorRemove.dispose();
        }
        _onDidAddEditor(e) {
            this._toDisposeOnEditorRemove.set(e.getId(), (0, lifecycle_1.combinedDisposable)(e.onDidChangeModel(() => this._updateState()), e.onDidFocusEditorText(() => this._updateState()), e.onDidFocusEditorWidget(() => this._updateState(e))));
            this._updateState();
        }
        _onDidRemoveEditor(e) {
            const id = e.getId();
            if (this._toDisposeOnEditorRemove.has(id)) {
                this._toDisposeOnEditorRemove.deleteAndDispose(id);
                this._updateState();
            }
        }
        _updateStateOnModelAdd(model) {
            if (!(0, model_1.shouldSynchronizeModel)(model)) {
                // ignore
                return;
            }
            if (!this._currentState) {
                // too early
                this._updateState();
                return;
            }
            // small (fast) delta
            this._currentState = new DocumentAndEditorState(this._currentState.documents.add(model), this._currentState.textEditors, this._currentState.activeEditor);
            this._onDidChangeState(new DocumentAndEditorStateDelta([], [model], [], [], undefined, undefined));
        }
        _updateState(widgetFocusCandidate) {
            // models: ignore too large models
            const models = new Set();
            for (const model of this._modelService.getModels()) {
                if ((0, model_1.shouldSynchronizeModel)(model)) {
                    models.add(model);
                }
            }
            // editor: only take those that have a not too large model
            const editors = new Map();
            let activeEditor = null; // Strict null work. This doesn't like being undefined!
            for (const editor of this._codeEditorService.listCodeEditors()) {
                if (editor.isSimpleWidget) {
                    continue;
                }
                const model = editor.getModel();
                if (editor.hasModel() && model && (0, model_1.shouldSynchronizeModel)(model)
                    && !model.isDisposed() // model disposed
                    && Boolean(this._modelService.getModel(model.uri)) // model disposing, the flag didn't flip yet but the model service already removed it
                ) {
                    const apiEditor = new TextEditorSnapshot(editor);
                    editors.set(apiEditor.id, apiEditor);
                    if (editor.hasTextFocus() || (widgetFocusCandidate === editor && editor.hasWidgetFocus())) {
                        // text focus has priority, widget focus is tricky because multiple
                        // editors might claim widget focus at the same time. therefore we use a
                        // candidate (which is the editor that has raised an widget focus event)
                        // in addition to the widget focus check
                        activeEditor = apiEditor.id;
                    }
                }
            }
            // active editor: if none of the previous editors had focus we try
            // to match output panels or the active workbench editor with
            // one of editor we have just computed
            if (!activeEditor) {
                let candidate;
                if (this._activeEditorOrder === 0 /* ActiveEditorOrder.Editor */) {
                    candidate = this._getActiveEditorFromEditorPart() || this._getActiveEditorFromPanel();
                }
                else {
                    candidate = this._getActiveEditorFromPanel() || this._getActiveEditorFromEditorPart();
                }
                if (candidate) {
                    for (const snapshot of editors.values()) {
                        if (candidate === snapshot.editor) {
                            activeEditor = snapshot.id;
                        }
                    }
                }
            }
            // compute new state and compare against old
            const newState = new DocumentAndEditorState(models, editors, activeEditor);
            const delta = DocumentAndEditorState.compute(this._currentState, newState);
            if (!delta.isEmpty) {
                this._currentState = newState;
                this._onDidChangeState(delta);
            }
        }
        _getActiveEditorFromPanel() {
            const panel = this._paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (panel instanceof textEditor_1.AbstractTextEditor) {
                const control = panel.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(control)) {
                    return control;
                }
            }
            return undefined;
        }
        _getActiveEditorFromEditorPart() {
            let activeTextEditorControl = this._editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                activeTextEditorControl = activeTextEditorControl.getModifiedEditor();
            }
            return activeTextEditorControl;
        }
    };
    MainThreadDocumentAndEditorStateComputer = __decorate([
        __param(1, model_2.IModelService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, editorService_1.IEditorService),
        __param(4, panecomposite_1.IPaneCompositePartService)
    ], MainThreadDocumentAndEditorStateComputer);
    let MainThreadDocumentsAndEditors = class MainThreadDocumentsAndEditors {
        constructor(extHostContext, _modelService, _textFileService, _editorService, codeEditorService, fileService, textModelResolverService, _editorGroupService, paneCompositeService, environmentService, workingCopyFileService, uriIdentityService, _clipboardService, pathService, configurationService) {
            this._modelService = _modelService;
            this._textFileService = _textFileService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._clipboardService = _clipboardService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._textEditors = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentsAndEditors);
            this._mainThreadDocuments = this._toDispose.add(new mainThreadDocuments_1.MainThreadDocuments(extHostContext, this._modelService, this._textFileService, fileService, textModelResolverService, environmentService, uriIdentityService, workingCopyFileService, pathService));
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadDocuments, this._mainThreadDocuments);
            this._mainThreadEditors = this._toDispose.add(new mainThreadEditors_1.MainThreadTextEditors(this, extHostContext, codeEditorService, this._editorService, this._editorGroupService, configurationService));
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadTextEditors, this._mainThreadEditors);
            // It is expected that the ctor of the state computer calls our `_onDelta`.
            this._toDispose.add(new MainThreadDocumentAndEditorStateComputer(delta => this._onDelta(delta), _modelService, codeEditorService, this._editorService, paneCompositeService));
        }
        dispose() {
            this._toDispose.dispose();
        }
        _onDelta(delta) {
            const removedEditors = [];
            const addedEditors = [];
            // removed models
            const removedDocuments = delta.removedDocuments.map(m => m.uri);
            // added editors
            for (const apiEditor of delta.addedEditors) {
                const mainThreadEditor = new mainThreadEditor_1.MainThreadTextEditor(apiEditor.id, apiEditor.editor.getModel(), apiEditor.editor, { onGainedFocus() { }, onLostFocus() { } }, this._mainThreadDocuments, this._modelService, this._clipboardService);
                this._textEditors.set(apiEditor.id, mainThreadEditor);
                addedEditors.push(mainThreadEditor);
            }
            // removed editors
            for (const { id } of delta.removedEditors) {
                const mainThreadEditor = this._textEditors.get(id);
                if (mainThreadEditor) {
                    mainThreadEditor.dispose();
                    this._textEditors.delete(id);
                    removedEditors.push(id);
                }
            }
            const extHostDelta = Object.create(null);
            let empty = true;
            if (delta.newActiveEditor !== undefined) {
                empty = false;
                extHostDelta.newActiveEditor = delta.newActiveEditor;
            }
            if (removedDocuments.length > 0) {
                empty = false;
                extHostDelta.removedDocuments = removedDocuments;
            }
            if (removedEditors.length > 0) {
                empty = false;
                extHostDelta.removedEditors = removedEditors;
            }
            if (delta.addedDocuments.length > 0) {
                empty = false;
                extHostDelta.addedDocuments = delta.addedDocuments.map(m => this._toModelAddData(m));
            }
            if (delta.addedEditors.length > 0) {
                empty = false;
                extHostDelta.addedEditors = addedEditors.map(e => this._toTextEditorAddData(e));
            }
            if (!empty) {
                // first update ext host
                this._proxy.$acceptDocumentsAndEditorsDelta(extHostDelta);
                // second update dependent document/editor states
                removedDocuments.forEach(this._mainThreadDocuments.handleModelRemoved, this._mainThreadDocuments);
                delta.addedDocuments.forEach(this._mainThreadDocuments.handleModelAdded, this._mainThreadDocuments);
                removedEditors.forEach(this._mainThreadEditors.handleTextEditorRemoved, this._mainThreadEditors);
                addedEditors.forEach(this._mainThreadEditors.handleTextEditorAdded, this._mainThreadEditors);
            }
        }
        _toModelAddData(model) {
            return {
                uri: model.uri,
                versionId: model.getVersionId(),
                lines: model.getLinesContent(),
                EOL: model.getEOL(),
                languageId: model.getLanguageId(),
                isDirty: this._textFileService.isDirty(model.uri)
            };
        }
        _toTextEditorAddData(textEditor) {
            const props = textEditor.getProperties();
            return {
                id: textEditor.getId(),
                documentUri: textEditor.getModel().uri,
                options: props.options,
                selections: props.selections,
                visibleRanges: props.visibleRanges,
                editorPosition: this._findEditorPosition(textEditor)
            };
        }
        _findEditorPosition(editor) {
            for (const editorPane of this._editorService.visibleEditorPanes) {
                if (editor.matches(editorPane)) {
                    return (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, editorPane.group);
                }
            }
            return undefined;
        }
        findTextEditorIdFor(editorPane) {
            for (const [id, editor] of this._textEditors) {
                if (editor.matches(editorPane)) {
                    return id;
                }
            }
            return undefined;
        }
        getIdOfCodeEditor(codeEditor) {
            for (const [id, editor] of this._textEditors) {
                if (editor.getCodeEditor() === codeEditor) {
                    return id;
                }
            }
            return undefined;
        }
        getEditor(id) {
            return this._textEditors.get(id);
        }
    };
    exports.MainThreadDocumentsAndEditors = MainThreadDocumentsAndEditors;
    exports.MainThreadDocumentsAndEditors = MainThreadDocumentsAndEditors = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, model_2.IModelService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorService_1.IEditorService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, files_1.IFileService),
        __param(6, resolverService_1.ITextModelService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, workingCopyFileService_1.IWorkingCopyFileService),
        __param(11, uriIdentity_1.IUriIdentityService),
        __param(12, clipboardService_1.IClipboardService),
        __param(13, pathService_1.IPathService),
        __param(14, configuration_1.IConfigurationService)
    ], MainThreadDocumentsAndEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZERvY3VtZW50c0FuZEVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkRG9jdW1lbnRzQW5kRWRpdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFpQ2hHLE1BQU0sa0JBQWtCO1FBSXZCLFlBQ1UsTUFBeUI7WUFBekIsV0FBTSxHQUFOLE1BQU0sQ0FBbUI7WUFFbEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDdkQsQ0FBQztLQUNEO0lBRUQsTUFBTSwyQkFBMkI7UUFJaEMsWUFDVSxnQkFBOEIsRUFDOUIsY0FBNEIsRUFDNUIsY0FBb0MsRUFDcEMsWUFBa0MsRUFDbEMsZUFBMEMsRUFDMUMsZUFBMEM7WUFMMUMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFjO1lBQzlCLG1CQUFjLEdBQWQsY0FBYyxDQUFjO1lBQzVCLG1CQUFjLEdBQWQsY0FBYyxDQUFzQjtZQUNwQyxpQkFBWSxHQUFaLFlBQVksQ0FBc0I7WUFDbEMsb0JBQWUsR0FBZixlQUFlLENBQTJCO1lBQzFDLG9CQUFlLEdBQWYsZUFBZSxDQUEyQjtZQUVuRCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEtBQUssQ0FBQzttQkFDN0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQzttQkFDaEMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQzttQkFDaEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQzttQkFDOUIsZUFBZSxLQUFLLGVBQWUs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