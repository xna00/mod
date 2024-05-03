/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditor", "vs/workbench/contrib/multiDiffEditor/browser/multiDiffEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, editorContextKeys_1, nls_1, actions_1, contextkey_1, textFileEditor_1, multiDiffEditor_1, multiDiffEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExpandAllAction = exports.CollapseAllAction = exports.GoToFileAction = void 0;
    class GoToFileAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.goToFile',
                title: (0, nls_1.localize2)('goToFile', 'Open File'),
                icon: codicons_1.Codicon.goToFile,
                precondition: editorContextKeys_1.EditorContextKeys.inMultiDiffEditor,
                menu: {
                    when: editorContextKeys_1.EditorContextKeys.inMultiDiffEditor,
                    id: actions_1.MenuId.MultiDiffEditorFileToolbar,
                    order: 22,
                    group: 'navigation',
                },
            });
        }
        async run(accessor, ...args) {
            const uri = args[0];
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            let selections = undefined;
            if (activeEditorPane instanceof multiDiffEditor_1.MultiDiffEditor) {
                const editor = activeEditorPane.tryGetCodeEditor(uri);
                if (editor) {
                    selections = editor.editor.getSelections() ?? undefined;
                }
            }
            const editor = await editorService.openEditor({ resource: uri });
            if (selections && (editor instanceof textFileEditor_1.TextFileEditor)) {
                const c = editor.getControl();
                if (c) {
                    c.setSelections(selections);
                    c.revealLineInCenter(selections[0].selectionStartLineNumber);
                }
            }
        }
    }
    exports.GoToFileAction = GoToFileAction;
    class CollapseAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.collapseAll',
                title: (0, nls_1.localize2)('collapseAllDiffs', 'Collapse All Diffs'),
                icon: codicons_1.Codicon.collapseAll,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.not('multiDiffEditorAllCollapsed')),
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.not('multiDiffEditorAllCollapsed')),
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: 100
                },
                f1: true,
            });
        }
        async run(accessor, ...args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditor = editorService.activeEditor;
            if (activeEditor instanceof multiDiffEditorInput_1.MultiDiffEditorInput) {
                const viewModel = await activeEditor.getViewModel();
                viewModel.collapseAll();
            }
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
    class ExpandAllAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'multiDiffEditor.expandAll',
                title: (0, nls_1.localize2)('ExpandAllDiffs', 'Expand All Diffs'),
                icon: codicons_1.Codicon.expandAll,
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.has('multiDiffEditorAllCollapsed')),
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', multiDiffEditor_1.MultiDiffEditor.ID), contextkey_1.ContextKeyExpr.has('multiDiffEditorAllCollapsed')),
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: 100
                },
                f1: true,
            });
        }
        async run(accessor, ...args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditor = editorService.activeEditor;
            if (activeEditor instanceof multiDiffEditorInput_1.MultiDiffEditorInput) {
                const viewModel = await activeEditor.getViewModel();
                viewModel.expandAll();
            }
        }
    }
    exports.ExpandAllAction = ExpandAllAction;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvbXVsdGlEaWZmRWRpdG9yL2Jyb3dzZXIvYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFlaEcsTUFBYSxjQUFlLFNBQVEsaUJBQU87UUFDMUM7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDBCQUEwQjtnQkFDOUIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLFVBQVUsRUFBRSxXQUFXLENBQUM7Z0JBQ3pDLElBQUksRUFBRSxrQkFBTyxDQUFDLFFBQVE7Z0JBQ3RCLFlBQVksRUFBRSxxQ0FBaUIsQ0FBQyxpQkFBaUI7Z0JBQ2pELElBQUksRUFBRTtvQkFDTCxJQUFJLEVBQUUscUNBQWlCLENBQUMsaUJBQWlCO29CQUN6QyxFQUFFLEVBQUUsZ0JBQU0sQ0FBQywwQkFBMEI7b0JBQ3JDLEtBQUssRUFBRSxFQUFFO29CQUNULEtBQUssRUFBRSxZQUFZO2lCQUNuQjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQ25ELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQVEsQ0FBQztZQUMzQixNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLDhCQUFjLENBQUMsQ0FBQztZQUNuRCxNQUFNLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztZQUN4RCxJQUFJLFVBQVUsR0FBNEIsU0FBUyxDQUFDO1lBQ3BELElBQUksZ0JBQWdCLFlBQVksaUNBQWUsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFD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