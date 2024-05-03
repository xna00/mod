/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/editor/contrib/find/browser/findController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindWidget", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/editor/common/editorService", "vs/css!./media/notebookFind"], function (require, exports, network_1, resources_1, codeEditorService_1, editorContextKeys_1, findController_1, nls_1, actions_1, contextkey_1, notebookFindWidget_1, notebookBrowser_1, notebookEditorExtensions_1, notebookCommon_1, notebookContextKeys_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, notebookEditorExtensions_1.registerNotebookContribution)(notebookFindWidget_1.NotebookFindContrib.id, notebookFindWidget_1.NotebookFindContrib);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.hideFind',
                title: (0, nls_1.localize2)('notebookActions.hideFind', 'Hide Find in Notebook'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED),
                    primary: 9 /* KeyCode.Escape */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(notebookFindWidget_1.NotebookFindContrib.id);
            controller.hide();
            editor.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.find',
                title: (0, nls_1.localize2)('notebookActions.findInNotebook', 'Find in Notebook'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.INTERACTIVE_WINDOW_IS_ACTIVE_EDITOR), editorContextKeys_1.EditorContextKeys.focus.toNegated()),
                    primary: 36 /* KeyCode.KeyF */ | 2048 /* KeyMod.CtrlCmd */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(notebookFindWidget_1.NotebookFindContrib.id);
            controller.show();
        }
    });
    function notebookContainsTextModel(uri, textModel) {
        if (textModel.uri.scheme === network_1.Schemas.vscodeNotebookCell) {
            const cellUri = notebookCommon_1.CellUri.parse(textModel.uri);
            if (cellUri && (0, resources_1.isEqual)(cellUri.notebook, uri)) {
                return true;
            }
        }
        return false;
    }
    function getSearchStringOptions(editor, opts) {
        // Get the search string result, following the same logic in _start function in 'vs/editor/contrib/find/browser/findController'
        if (opts.seedSearchStringFromSelection === 'single') {
            const selectionSearchString = (0, findController_1.getSelectionSearchString)(editor, opts.seedSearchStringFromSelection, opts.seedSearchStringFromNonEmptySelection);
            if (selectionSearchString) {
                return {
                    searchString: selectionSearchString,
                    selection: editor.getSelection()
                };
            }
        }
        else if (opts.seedSearchStringFromSelection === 'multiple' && !opts.updateSearchScope) {
            const selectionSearchString = (0, findController_1.getSelectionSearchString)(editor, opts.seedSearchStringFromSelection);
            if (selectionSearchString) {
                return {
                    searchString: selectionSearchString,
                    selection: editor.getSelection()
                };
            }
        }
        return undefined;
    }
    findController_1.StartFindAction.addImplementation(100, (accessor, codeEditor, args) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor) {
            return false;
        }
        if (!codeEditor.hasModel()) {
            return false;
        }
        if (!editor.hasEditorFocus() && !editor.hasWebviewFocus()) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            // check if the active pane contains the active text editor
            const textEditor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (editor.hasModel() && textEditor && textEditor.hasModel() && notebookContainsTextModel(editor.textModel.uri, textEditor.getModel())) {
                // the active text editor is in notebook editor
            }
            else {
                return false;
            }
        }
        const controller = editor.getContribution(notebookFindWidget_1.NotebookFindContrib.id);
        const searchStringOptions = getSearchStringOptions(codeEditor, {
            forceRevealReplace: false,
            seedSearchStringFromSelection: codeEditor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never' ? 'single' : 'none',
            seedSearchStringFromNonEmptySelection: codeEditor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection === 'selection',
            seedSearchStringFromGlobalClipboard: codeEditor.getOption(41 /* EditorOption.find */).globalFindClipboard,
            shouldFocus: 1 /* FindStartFocusAction.FocusFindInput */,
            shouldAnimate: true,
            updateSearchScope: false,
            loop: codeEditor.getOption(41 /* EditorOption.find */).loop
        });
        let options = undefined;
        const uri = codeEditor.getModel().uri;
        const data = notebookCommon_1.CellUri.parse(uri);
        if (searchStringOptions?.selection && data) {
            const cell = editor.getCellByHandle(data.handle);
            if (cell) {
                options = {
                    searchStringSeededFrom: { cell, range: searchStringOptions.selection },
                };
            }
        }
        controller.show(searchStringOptions?.searchString, options);
        return true;
    });
    findController_1.StartFindReplaceAction.addImplementation(100, (accessor, codeEditor, args) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor) {
            return false;
        }
        if (!codeEditor.hasModel()) {
            return false;
        }
        const controller = editor.getContribution(notebookFindWidget_1.NotebookFindContrib.id);
        const searchStringOptions = getSearchStringOptions(codeEditor, {
            forceRevealReplace: false,
            seedSearchStringFromSelection: codeEditor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection !== 'never' ? 'single' : 'none',
            seedSearchStringFromNonEmptySelection: codeEditor.getOption(41 /* EditorOption.find */).seedSearchStringFromSelection === 'selection',
            seedSearchStringFromGlobalClipboard: codeEditor.getOption(41 /* EditorOption.find */).globalFindClipboard,
            shouldFocus: 1 /* FindStartFocusAction.FocusFindInput */,
            shouldAnimate: true,
            updateSearchScope: false,
            loop: codeEditor.getOption(41 /* EditorOption.find */).loop
        });
        if (controller) {
            controller.replace(searchStringOptions?.searchString);
            return true;
        }
        return false;
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90ZWJvb2tGaW5kLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvZmluZC9ub3RlYm9va0ZpbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUF5QmhHLElBQUEsdURBQTRCLEVBQUMsd0NBQW1CLENBQUMsRUFBRSxFQUFFLHdDQUFtQixDQUFDLENBQUM7SUFFMUUsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxpQkFBTztRQUNwQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsbUJBQW1CO2dCQUN2QixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsMEJBQTBCLEVBQUUsdUJBQXVCLENBQUM7Z0JBQ3JFLFVBQVUsRUFBRTtvQkFDWCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsNkNBQXVCLEVBQUUscUVBQStDLENBQUM7b0JBQ2xHLE9BQU8sd0JBQWdCO29CQUN2QixNQUFNLDZDQUFtQztpQkFDekM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtZQUNuQyxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLE1BQU0sR0FBRyxJQUFBLGlEQUErQixFQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBRS9FLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDYixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQXNCLHdDQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZGLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQixNQUFNLENBQUMs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