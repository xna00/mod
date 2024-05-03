/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/diffEditor/diffEditorWidget", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "./registrations.contribution"], function (require, exports, dom_1, codicons_1, editorExtensions_1, codeEditorService_1, diffEditorWidget_1, editorContextKeys_1, nls_1, actions_1, configuration_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibleDiffViewerPrev = exports.AccessibleDiffViewerNext = exports.RevertHunkOrSelection = exports.ShowAllUnchangedRegions = exports.CollapseAllUnchangedRegions = exports.ExitCompareMove = exports.SwitchSide = exports.ToggleUseInlineViewWhenSpaceIsLimited = exports.ToggleShowMovedCodeBlocks = exports.ToggleCollapseUnchangedRegions = void 0;
    exports.findDiffEditor = findDiffEditor;
    exports.findFocusedDiffEditor = findFocusedDiffEditor;
    class ToggleCollapseUnchangedRegions extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.toggleCollapseUnchangedRegions',
                title: (0, nls_1.localize2)('toggleCollapseUnchangedRegions', 'Toggle Collapse Unchanged Regions'),
                icon: codicons_1.Codicon.map,
                toggled: contextkey_1.ContextKeyExpr.has('config.diffEditor.hideUnchangedRegions.enabled'),
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                menu: {
                    when: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                    id: actions_1.MenuId.EditorTitle,
                    order: 22,
                    group: 'navigation',
                },
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.hideUnchangedRegions.enabled');
            configurationService.updateValue('diffEditor.hideUnchangedRegions.enabled', newValue);
        }
    }
    exports.ToggleCollapseUnchangedRegions = ToggleCollapseUnchangedRegions;
    class ToggleShowMovedCodeBlocks extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.toggleShowMovedCodeBlocks',
                title: (0, nls_1.localize2)('toggleShowMovedCodeBlocks', 'Toggle Show Moved Code Blocks'),
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.experimental.showMoves');
            configurationService.updateValue('diffEditor.experimental.showMoves', newValue);
        }
    }
    exports.ToggleShowMovedCodeBlocks = ToggleShowMovedCodeBlocks;
    class ToggleUseInlineViewWhenSpaceIsLimited extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.toggleUseInlineViewWhenSpaceIsLimited',
                title: (0, nls_1.localize2)('toggleUseInlineViewWhenSpaceIsLimited', 'Toggle Use Inline View When Space Is Limited'),
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
            });
        }
        run(accessor, ...args) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.useInlineViewWhenSpaceIsLimited');
            configurationService.updateValue('diffEditor.useInlineViewWhenSpaceIsLimited', newValue);
        }
    }
    exports.ToggleUseInlineViewWhenSpaceIsLimited = ToggleUseInlineViewWhenSpaceIsLimited;
    const diffEditorCategory = (0, nls_1.localize2)('diffEditor', "Diff Editor");
    class SwitchSide extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.switchSide',
                title: (0, nls_1.localize2)('switchSide', 'Switch Side'),
                icon: codicons_1.Codicon.arrowSwap,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                f1: true,
                category: diffEditorCategory,
            });
        }
        runEditorCommand(accessor, editor, arg) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                if (arg && arg.dryRun) {
                    return { destinationSelection: diffEditor.mapToOtherSide().destinationSelection };
                }
                else {
                    diffEditor.switchSide();
                }
            }
            return undefined;
        }
    }
    exports.SwitchSide = SwitchSide;
    class ExitCompareMove extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.exitCompareMove',
                title: (0, nls_1.localize2)('exitCompareMove', 'Exit Compare Move'),
                icon: codicons_1.Codicon.close,
                precondition: editorContextKeys_1.EditorContextKeys.comparingMovedCode,
                f1: false,
                category: diffEditorCategory,
                keybinding: {
                    weight: 10000,
                    primary: 9 /* KeyCode.Escape */,
                }
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.exitCompareMove();
            }
        }
    }
    exports.ExitCompareMove = ExitCompareMove;
    class CollapseAllUnchangedRegions extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.collapseAllUnchangedRegions',
                title: (0, nls_1.localize2)('collapseAllUnchangedRegions', 'Collapse All Unchanged Regions'),
                icon: codicons_1.Codicon.fold,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                f1: true,
                category: diffEditorCategory,
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.collapseAllUnchangedRegions();
            }
        }
    }
    exports.CollapseAllUnchangedRegions = CollapseAllUnchangedRegions;
    class ShowAllUnchangedRegions extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'diffEditor.showAllUnchangedRegions',
                title: (0, nls_1.localize2)('showAllUnchangedRegions', 'Show All Unchanged Regions'),
                icon: codicons_1.Codicon.unfold,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                f1: true,
                category: diffEditorCategory,
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            const diffEditor = findFocusedDiffEditor(accessor);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.showAllUnchangedRegions();
            }
        }
    }
    exports.ShowAllUnchangedRegions = ShowAllUnchangedRegions;
    class RevertHunkOrSelection extends actions_1.Action2 {
        constructor() {
            super({
                id: 'diffEditor.revert',
                title: (0, nls_1.localize2)('revert', 'Revert'),
                f1: false,
                category: diffEditorCategory,
            });
        }
        run(accessor, arg) {
            const diffEditor = findDiffEditor(accessor, arg.originalUri, arg.modifiedUri);
            if (diffEditor instanceof diffEditorWidget_1.DiffEditorWidget) {
                diffEditor.revertRangeMappings(arg.mapping.innerChanges ?? []);
            }
            return undefined;
        }
    }
    exports.RevertHunkOrSelection = RevertHunkOrSelection;
    const accessibleDiffViewerCategory = (0, nls_1.localize2)('accessibleDiffViewer', "Accessible Diff Viewer");
    class AccessibleDiffViewerNext extends actions_1.Action2 {
        static { this.id = 'editor.action.accessibleDiffViewer.next'; }
        constructor() {
            super({
                id: AccessibleDiffViewerNext.id,
                title: (0, nls_1.localize2)('editor.action.accessibleDiffViewer.next', 'Go to Next Difference'),
                category: accessibleDiffViewerCategory,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                keybinding: {
                    primary: 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                f1: true,
            });
        }
        run(accessor) {
            const diffEditor = findFocusedDiffEditor(accessor);
            diffEditor?.accessibleDiffViewerNext();
        }
    }
    exports.AccessibleDiffViewerNext = AccessibleDiffViewerNext;
    class AccessibleDiffViewerPrev extends actions_1.Action2 {
        static { this.id = 'editor.action.accessibleDiffViewer.prev'; }
        constructor() {
            super({
                id: AccessibleDiffViewerPrev.id,
                title: (0, nls_1.localize2)('editor.action.accessibleDiffViewer.prev', 'Go to Previous Difference'),
                category: accessibleDiffViewerCategory,
                precondition: contextkey_1.ContextKeyExpr.has('isInDiffEditor'),
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 65 /* KeyCode.F7 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                f1: true,
            });
        }
        run(accessor) {
            const diffEditor = findFocusedDiffEditor(accessor);
            diffEditor?.accessibleDiffViewerPrev();
        }
    }
    exports.AccessibleDiffViewerPrev = AccessibleDiffViewerPrev;
    function findDiffEditor(accessor, originalUri, modifiedUri) {
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const diffEditors = codeEditorService.listDiffEditors();
        return diffEditors.find(diffEditor => {
            const modified = diffEditor.getModifiedEditor();
            const original = diffEditor.getOriginalEditor();
            return modified && modified.getModel()?.uri.toString() === modifiedUri.toString()
                && original && original.getModel()?.uri.toString() === originalUri.toString();
        }) || null;
    }
    function findFocusedDiffEditor(accessor) {
        const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
        const diffEditors = codeEditorService.listDiffEditors();
        const activeElement = (0, dom_1.getActiveElement)();
        if (activeElement) {
            for (const d of diffEditors) {
                const container = d.getContainerDomNode();
                if (isElementOrParentOf(container, activeElement)) {
                    return d;
                }
            }
        }
        return null;
    }
    function isElementOrParentOf(elementOrParent, element) {
        let e = element;
        while (e) {
            if (e === elementOrParent) {
                return true;
            }
            e = e.parentElement;
        }
        return false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2NvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXlPaEcsd0NBV0M7SUFFRCxzREFlQztJQWpQRCxNQUFhLDhCQUErQixTQUFRLGlCQUFPO1FBQzFEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwyQ0FBMkM7Z0JBQy9DLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxnQ0FBZ0MsRUFBRSxtQ0FBbUMsQ0FBQztnQkFDdkYsSUFBSSxFQUFFLGtCQUFPLENBQUMsR0FBRztnQkFDakIsT0FBTyxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLGdEQUFnRCxDQUFDO2dCQUM3RSxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ2xELElBQUksRUFBRTtvQkFDTCxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7b0JBQzFDLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7b0JBQ3RCLEtBQUssRUFBRSxFQUFFO29CQUNULEtBQUssRUFBRSxZQUFZO2lCQUNuQjthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQWU7WUFDakQsTUFBTSxvQkFBb0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHFDQUFxQixDQUFDLENBQUM7WUFDakUsTUFBTSxRQUFRLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQVUseUNBQXlDLENBQUMsQ0FBQztZQUNwRyxvQkFBb0IsQ0FBQyxXQUFXLENBQUMseUNBQXlDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkYsQ0FBQztLQUNE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