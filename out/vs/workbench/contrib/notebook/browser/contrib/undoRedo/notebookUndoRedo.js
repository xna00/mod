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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/browser/editorExtensions"], function (require, exports, lifecycle_1, contributions_1, notebookCommon_1, editorService_1, notebookBrowser_1, editorExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookUndoRedoContribution = class NotebookUndoRedoContribution extends lifecycle_1.Disposable {
        static { this.ID = 'workbench.contrib.notebookUndoRedo'; }
        constructor(_editorService) {
            super();
            this._editorService = _editorService;
            const PRIORITY = 105;
            this._register(editorExtensions_1.UndoCommand.addImplementation(PRIORITY, 'notebook-undo-redo', () => {
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                const viewModel = editor?.getViewModel();
                if (editor && editor.hasModel() && viewModel) {
                    return viewModel.undo().then(cellResources => {
                        if (cellResources?.length) {
                            for (let i = 0; i < editor.getLength(); i++) {
                                const cell = editor.cellAt(i);
                                if (cell.cellKind === notebookCommon_1.CellKind.Markup && cellResources.find(resource => resource.fragment === cell.model.uri.fragment)) {
                                    cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'undo');
                                }
                            }
                            editor?.setOptions({ cellOptions: { resource: cellResources[0] }, preserveFocus: true });
                        }
                    });
                }
                return false;
            }));
            this._register(editorExtensions_1.RedoCommand.addImplementation(PRIORITY, 'notebook-undo-redo', () => {
                const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                const viewModel = editor?.getViewModel();
                if (editor && editor.hasModel() && viewModel) {
                    return viewModel.redo().then(cellResources => {
                        if (cellResources?.length) {
                            for (let i = 0; i < editor.getLength(); i++) {
                                const cell = editor.cellAt(i);
                                if (cell.cellKind === notebookCommon_1.CellKind.Markup && cellResources.find(resource => resource.fragment === cell.model.uri.fragment)) {
                                    cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'redo');
                                }
                            }
                            editor?.setOptions({ cellOptions: { resource: cellResources[0] }, preserveFocus: true });
                        }
                    });
                }
                return false;
            }));
        }
    };
    NotebookUndoRedoContribution = __decorate([
        __param(0, editorService_1.IEditorService)
    ], NotebookUndoRedoContribution);
    (0, contributions_1.registerWorkbenchContribution2)(NotebookUndoRedoContribution.ID, NotebookUndoRedoContribution, 2 /* WorkbenchPhase.BlockRestore */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tVbmRvUmVkby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbm90ZWJvb2svYnJvd3Nlci9jb250cmliL3VuZG9SZWRvL25vdGVib29rVW5kb1JlZG8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7SUFVaEcsSUFBTSw0QkFBNEIsR0FBbEMsTUFBTSw0QkFBNkIsU0FBUSxzQkFBVTtpQkFFcEMsT0FBRSxHQUFHLG9DQUFvQyxBQUF2QyxDQUF3QztRQUUxRCxZQUE2QyxjQUE4QjtZQUMxRSxLQUFLLEVBQUUsQ0FBQztZQURvQyxtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7WUFHMUUsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxTQUFTLENBQUMsOEJBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO2dCQUNqRixNQUFNLE1BQU0sR0FBRyxJQUFBLGlEQUErQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFDckYsTUFBTSxTQUFTLEdBQUcsTUFBTSxFQUFFLFlBQVksRUFBbUMsQ0FBQztnQkFDMUUsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLFNBQVMsRUFBRSxDQUFDO29CQUM5QyxPQUFPLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUU7d0JBQzVDLElBQUksYUFBYSxFQUFFLE1BQU0sRUFBRSxDQUFDOzRCQUMzQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0NBQzdDLE1B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