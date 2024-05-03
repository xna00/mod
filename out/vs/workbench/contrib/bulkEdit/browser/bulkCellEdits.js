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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/services/editor/common/editorService"], function (require, exports, arrays_1, strings_1, types_1, uri_1, bulkEditService_1, notebookBrowser_1, notebookCommon_1, notebookEditorModelResolverService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BulkCellEdits = exports.ResourceNotebookCellEdit = void 0;
    class ResourceNotebookCellEdit extends bulkEditService_1.ResourceEdit {
        static is(candidate) {
            if (candidate instanceof ResourceNotebookCellEdit) {
                return true;
            }
            return uri_1.URI.isUri(candidate.resource)
                && (0, types_1.isObject)(candidate.cellEdit);
        }
        static lift(edit) {
            if (edit instanceof ResourceNotebookCellEdit) {
                return edit;
            }
            return new ResourceNotebookCellEdit(edit.resource, edit.cellEdit, edit.notebookVersionId, edit.metadata);
        }
        constructor(resource, cellEdit, notebookVersionId = undefined, metadata) {
            super(metadata);
            this.resource = resource;
            this.cellEdit = cellEdit;
            this.notebookVersionId = notebookVersionId;
        }
    }
    exports.ResourceNotebookCellEdit = ResourceNotebookCellEdit;
    let BulkCellEdits = class BulkCellEdits {
        constructor(_undoRedoGroup, undoRedoSource, _progress, _token, _edits, _editorService, _notebookModelService) {
            this._undoRedoGroup = _undoRedoGroup;
            this._progress = _progress;
            this._token = _token;
            this._edits = _edits;
            this._editorService = _editorService;
            this._notebookModelService = _notebookModelService;
            this._edits = this._edits.map(e => {
                if (e.resource.scheme === notebookCommon_1.CellUri.scheme) {
                    const uri = notebookCommon_1.CellUri.parse(e.resource)?.notebook;
                    if (!uri) {
                        throw new Error(`Invalid notebook URI: ${e.resource}`);
                    }
                    return new ResourceNotebookCellEdit(uri, e.cellEdit, e.notebookVersionId, e.metadata);
                }
                else {
                    return e;
                }
            });
        }
        async apply() {
            const resources = [];
            const editsByNotebook = (0, arrays_1.groupBy)(this._edits, (a, b) => (0, strings_1.compare)(a.resource.toString(), b.resource.toString()));
            for (const group of editsByNotebook) {
                if (this._token.isCancellationRequested) {
                    break;
                }
                const [first] = group;
                const ref = await this._notebookModelService.resolve(first.resource);
                // check state
                if (typeof first.notebookVersionId === 'number' && ref.object.notebook.versionId !== first.notebookVersionId) {
                    ref.dispose();
                    throw new Error(`Notebook '${first.resource}' has changed in the meantime`);
                }
                // apply edits
                const edits = group.map(entry => entry.cellEdit);
                const computeUndo = !ref.object.isReadonly();
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                const initialSelectionState = editor?.textModel?.uri.toString() === ref.object.notebook.uri.toString() ? {
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: editor.getFocus(),
                    selections: editor.getSelections()
                } : undefined;
                ref.object.notebook.applyEdits(edits, true, initialSelectionState, () => undefined, this._undoRedoGroup, computeUndo);
                ref.dispose();
                this._progress.report(undefined);
                resources.push(first.resource);
            }
            return resources;
        }
    };
    exports.BulkCellEdits = BulkCellEdits;
    exports.BulkCellEdits = BulkCellEdits = __decorate([
        __param(5, editorService_1.IEditorService),
        __param(6, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], BulkCellEdits);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVsa0NlbGxFZGl0cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvYnVsa0VkaXQvYnJvd3Nlci9idWxrQ2VsbEVkaXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdCaEcsTUFBYSx3QkFBeUIsU0FBUSw4QkFBWTtRQUV6RCxNQUFNLENBQUMsRUFBRSxDQUFDLFNBQWM7WUFDdkIsSUFBSSxTQUFTLFlBQVksd0JBQXdCLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxTQUFHLENBQUMsS0FBSyxDQUE4QixTQUFVLENBQUMsUUFBUSxDQUFDO21CQUM5RCxJQUFBLGdCQUFRLEVBQThCLFNBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFnQztZQUMzQyxJQUFJLElBQUksWUFBWSx3QkFBd0IsRUFBRSxDQUFDO2dCQUM5QyxPQUFPLElBQUksQ0FBQztZQUNiLENBQUM7WUFDRCxPQUFPLElBQUksd0JBQXdCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUcsQ0FBQztRQUVELFlBQ1UsUUFBYSxFQUNiLFFBQTZFLEVBQzdFLG9CQUF3QyxTQUFTLEVBQzFELFFBQWdDO1lBRWhDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUxQLGFBQVEsR0FBUixRQUFRLENBQUs7WUFDYixhQUFRLEdBQVIsUUFBUSxDQUFxRTtZQUM3RSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWdDO1FBSTNELENBQUM7S0FDRDtJQXpCRCw0REF5QkM7SUFF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