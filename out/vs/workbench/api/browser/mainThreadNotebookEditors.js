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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/services/notebookEditorService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "../common/extHost.protocol"], function (require, exports, lifecycle_1, objects_1, uri_1, configuration_1, editor_1, notebookBrowser_1, notebookEditorService_1, editorGroupColumn_1, editorGroupsService_1, editorService_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookEditors = void 0;
    class MainThreadNotebook {
        constructor(editor, disposables) {
            this.editor = editor;
            this.disposables = disposables;
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    let MainThreadNotebookEditors = class MainThreadNotebookEditors {
        constructor(extHostContext, _editorService, _notebookEditorService, _editorGroupService, _configurationService) {
            this._editorService = _editorService;
            this._notebookEditorService = _notebookEditorService;
            this._editorGroupService = _editorGroupService;
            this._configurationService = _configurationService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._mainThreadEditors = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookEditors);
            this._editorService.onDidActiveEditorChange(() => this._updateEditorViewColumns(), this, this._disposables);
            this._editorGroupService.onDidRemoveGroup(() => this._updateEditorViewColumns(), this, this._disposables);
            this._editorGroupService.onDidMoveGroup(() => this._updateEditorViewColumns(), this, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
            (0, lifecycle_1.dispose)(this._mainThreadEditors.values());
        }
        handleEditorsAdded(editors) {
            for (const editor of editors) {
                const editorDisposables = new lifecycle_1.DisposableStore();
                editorDisposables.add(editor.onDidChangeVisibleRanges(() => {
                    this._proxy.$acceptEditorPropertiesChanged(editor.getId(), { visibleRanges: { ranges: editor.visibleRanges } });
                }));
                editorDisposables.add(editor.onDidChangeSelection(() => {
                    this._proxy.$acceptEditorPropertiesChanged(editor.getId(), { selections: { selections: editor.getSelections() } });
                }));
                const wrapper = new MainThreadNotebook(editor, editorDisposables);
                this._mainThreadEditors.set(editor.getId(), wrapper);
            }
        }
        handleEditorsRemoved(editorIds) {
            for (const id of editorIds) {
                this._mainThreadEditors.get(id)?.dispose();
                this._mainThreadEditors.delete(id);
            }
        }
        _updateEditorViewColumns() {
            const result = Object.create(null);
            for (const editorPane of this._editorService.visibleEditorPanes) {
                const candidate = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                if (candidate && this._mainThreadEditors.has(candidate.getId())) {
                    result[candidate.getId()] = (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, editorPane.group);
                }
            }
            if (!(0, objects_1.equals)(result, this._currentViewColumnInfo)) {
                this._currentViewColumnInfo = result;
                this._proxy.$acceptEditorViewColumns(result);
            }
        }
        async $tryShowNotebookDocument(resource, viewType, options) {
            const editorOptions = {
                cellSelections: options.selections,
                preserveFocus: options.preserveFocus,
                pinned: options.pinned,
                // selection: options.selection,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: options.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined,
                override: viewType
            };
            const editorPane = await this._editorService.openEditor({ resource: uri_1.URI.revive(resource), options: editorOptions }, (0, editorGroupColumn_1.columnToEditorGroup)(this._editorGroupService, this._configurationService, options.position));
            const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
            if (notebookEditor) {
                return notebookEditor.getId();
            }
            else {
                throw new Error(`Notebook Editor creation failure for document ${JSON.stringify(resource)}`);
            }
        }
        async $tryRevealRange(id, range, revealType) {
            const editor = this._notebookEditorService.getNotebookEditor(id);
            if (!editor) {
                return;
            }
            const notebookEditor = editor;
            if (!notebookEditor.hasModel()) {
                return;
            }
            if (range.start >= notebookEditor.getLength()) {
                return;
            }
            const cell = notebookEditor.cellAt(range.start);
            switch (revealType) {
                case extHost_protocol_1.NotebookEditorRevealType.Default:
                    return notebookEditor.revealCellRangeInView(range);
                case extHost_protocol_1.NotebookEditorRevealType.InCenter:
                    return notebookEditor.revealInCenter(cell);
                case extHost_protocol_1.NotebookEditorRevealType.InCenterIfOutsideViewport:
                    return notebookEditor.revealInCenterIfOutsideViewport(cell);
                case extHost_protocol_1.NotebookEditorRevealType.AtTop:
                    return notebookEditor.revealInViewAtTop(cell);
            }
        }
        $trySetSelections(id, ranges) {
            const editor = this._notebookEditorService.getNotebookEditor(id);
            if (!editor) {
                return;
            }
            editor.setSelections(ranges);
            if (ranges.length) {
                editor.setFocus({ start: ranges[0].start, end: ranges[0].start + 1 });
            }
        }
    };
    exports.MainThreadNotebookEditors = MainThreadNotebookEditors;
    exports.MainThreadNotebookEditors = MainThreadNotebookEditors = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, notebookEditorService_1.INotebookEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, configuration_1.IConfigurationService)
    ], MainThreadNotebookEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZE5vdGVib29rRWRpdG9ycy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2FwaS9icm93c2VyL21haW5UaHJlYWROb3RlYm9va0VkaXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBZ0JoRyxNQUFNLGtCQUFrQjtRQUV2QixZQUNVLE1BQXVCLEVBQ3ZCLFdBQTRCO1lBRDVCLFdBQU0sR0FBTixNQUFNLENBQWlCO1lBQ3ZCLGdCQUFXLEdBQVgsV0FBVyxDQUFpQjtRQUNsQyxDQUFDO1FBRUwsT0FBTztZQUNOLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsQ0FBQztLQUNEO0lBRU0sSUFBTSx5QkFBeUIsR0FBL0IsTUFBTSx5QkFBeUI7UUFTckMsWUFDQyxjQUErQixFQUNmLGNBQStDLEVBQ3ZDLHNCQUErRCxFQUNqRSxtQkFBMEQsRUFDekQscUJBQTZEO1lBSG5ELG1CQUFjLEdBQWQsY0FBYyxDQUFnQjtZQUN0QiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXdCO1lBQ2hELHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7WUFDeEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQVpwRSxpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBR3JDLHVCQUFrQixHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO1lBVzNFLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFFN0UsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlB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