/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, keybindingsRegistry_1, textDiffEditor_1, contextkeys_1, diffEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DIFF_SWAP_SIDES = exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = exports.DIFF_OPEN_SIDE = exports.DIFF_FOCUS_OTHER_SIDE = exports.DIFF_FOCUS_SECONDARY_SIDE = exports.DIFF_FOCUS_PRIMARY_SIDE = exports.GOTO_PREVIOUS_CHANGE = exports.GOTO_NEXT_CHANGE = exports.TOGGLE_DIFF_SIDE_BY_SIDE = void 0;
    exports.registerDiffEditorCommands = registerDiffEditorCommands;
    exports.TOGGLE_DIFF_SIDE_BY_SIDE = 'toggle.diff.renderSideBySide';
    exports.GOTO_NEXT_CHANGE = 'workbench.action.compareEditor.nextChange';
    exports.GOTO_PREVIOUS_CHANGE = 'workbench.action.compareEditor.previousChange';
    exports.DIFF_FOCUS_PRIMARY_SIDE = 'workbench.action.compareEditor.focusPrimarySide';
    exports.DIFF_FOCUS_SECONDARY_SIDE = 'workbench.action.compareEditor.focusSecondarySide';
    exports.DIFF_FOCUS_OTHER_SIDE = 'workbench.action.compareEditor.focusOtherSide';
    exports.DIFF_OPEN_SIDE = 'workbench.action.compareEditor.openSide';
    exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = 'toggle.diff.ignoreTrimWhitespace';
    exports.DIFF_SWAP_SIDES = 'workbench.action.compareEditor.swapSides';
    function registerDiffEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_NEXT_CHANGE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.TextCompareEditorVisibleContext,
            primary: 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */,
            handler: accessor => navigateInDiffEditor(accessor, true)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.GOTO_NEXT_CHANGE,
                title: (0, nls_1.localize2)('compare.nextChange', 'Go to Next Change'),
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_PREVIOUS_CHANGE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.TextCompareEditorVisibleContext,
            primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
            handler: accessor => navigateInDiffEditor(accessor, false)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.GOTO_PREVIOUS_CHANGE,
                title: (0, nls_1.localize2)('compare.previousChange', 'Go to Previous Change'),
            }
        });
        function getActiveTextDiffEditor(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            for (const editor of [editorService.activeEditorPane, ...editorService.visibleEditorPanes]) {
                if (editor instanceof textDiffEditor_1.TextDiffEditor) {
                    return editor;
                }
            }
            return undefined;
        }
        function navigateInDiffEditor(accessor, next) {
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            if (activeTextDiffEditor) {
                activeTextDiffEditor.getControl()?.goToDiff(next ? 'next' : 'previous');
            }
        }
        let FocusTextDiffEditorMode;
        (function (FocusTextDiffEditorMode) {
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Original"] = 0] = "Original";
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Modified"] = 1] = "Modified";
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Toggle"] = 2] = "Toggle";
        })(FocusTextDiffEditorMode || (FocusTextDiffEditorMode = {}));
        function focusInDiffEditor(accessor, mode) {
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            if (activeTextDiffEditor) {
                switch (mode) {
                    case FocusTextDiffEditorMode.Original:
                        activeTextDiffEditor.getControl()?.getOriginalEditor().focus();
                        break;
                    case FocusTextDiffEditorMode.Modified:
                        activeTextDiffEditor.getControl()?.getModifiedEditor().focus();
                        break;
                    case FocusTextDiffEditorMode.Toggle:
                        if (activeTextDiffEditor.getControl()?.getModifiedEditor().hasWidgetFocus()) {
                            return focusInDiffEditor(accessor, FocusTextDiffEditorMode.Original);
                        }
                        else {
                            return focusInDiffEditor(accessor, FocusTextDiffEditorMode.Modified);
                        }
                }
            }
        }
        function toggleDiffSideBySide(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.renderSideBySide');
            configurationService.updateValue('diffEditor.renderSideBySide', newValue);
        }
        function toggleDiffIgnoreTrimWhitespace(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.ignoreTrimWhitespace');
            configurationService.updateValue('diffEditor.ignoreTrimWhitespace', newValue);
        }
        async function swapDiffSides(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const diffEditor = getActiveTextDiffEditor(accessor);
            const activeGroup = diffEditor?.group;
            const diffInput = diffEditor?.input;
            if (!diffEditor || typeof activeGroup === 'undefined' || !(diffInput instanceof diffEditorInput_1.DiffEditorInput) || !diffInput.modified.resource) {
                return;
            }
            const untypedDiffInput = diffInput.toUntyped({ preserveViewState: activeGroup.id, preserveResource: true });
            if (!untypedDiffInput) {
                return;
            }
            // Since we are about to replace the diff editor, make
            // sure to first open the modified side if it is not
            // yet opened. This ensures that the swapping is not
            // bringing up a confirmation dialog to save.
            if (diffInput.modified.isModified() && editorService.findEditors({ resource: diffInput.modified.resource, typeId: diffInput.modified.typeId, editorId: diffInput.modified.editorId }).length === 0) {
                await editorService.openEditor({
                    ...untypedDiffInput.modified,
                    options: {
                        ...untypedDiffInput.modified.options,
                        pinned: true,
                        inactive: true
                    }
                }, activeGroup);
            }
            // Replace the input with the swapped variant
            await editorService.replaceEditors([
                {
                    editor: diffInput,
                    replacement: {
                        ...untypedDiffInput,
                        original: untypedDiffInput.modified,
                        modified: untypedDiffInput.original,
                        options: {
                            ...untypedDiffInput.options,
                            pinned: true
                        }
                    }
                }
            ], activeGroup);
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffSideBySide(accessor)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_PRIMARY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Modified)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_SECONDARY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Original)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_OTHER_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Toggle)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffIgnoreTrimWhitespace(accessor)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_SWAP_SIDES,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => swapDiffSides(accessor)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
                title: (0, nls_1.localize2)('toggleInlineView', "Toggle Inline View"),
                category: (0, nls_1.localize)('compare', "Compare")
            },
            when: contextkeys_1.TextCompareEditorActiveContext
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.DIFF_SWAP_SIDES,
                title: (0, nls_1.localize2)('swapDiffSides', "Swap Left and Right Editor Side"),
                category: (0, nls_1.localize)('compare', "Compare")
            },
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.TextCompareEditorActiveContext, contextkeys_1.ActiveCompareEditorCanSwapContext)
        });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckNvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9lZGl0b3IvZGlmZkVkaXRvckNvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsZ0VBNE1DO0lBdE5ZLFFBQUEsd0JBQXdCLEdBQUcsOEJBQThCLENBQUM7SUFDMUQsUUFBQSxnQkFBZ0IsR0FBRywyQ0FBMkMsQ0FBQztJQUMvRCxRQUFBLG9CQUFvQixHQUFHLCtDQUErQyxDQUFDO0lBQ3ZFLFFBQUEsdUJBQXVCLEdBQUcsaURBQWlELENBQUM7SUFDNUUsUUFBQSx5QkFBeUIsR0FBRyxtREFBbUQsQ0FBQztJQUNoRixRQUFBLHFCQUFxQixHQUFHLCtDQUErQyxDQUFDO0lBQ3hFLFFBQUEsY0FBYyxHQUFHLHlDQUF5QyxDQUFDO0lBQzNELFFBQUEsa0NBQWtDLEdBQUcsa0NBQWtDLENBQUM7SUFDeEUsUUFBQSxlQUFlLEdBQUcsMENBQTBDLENBQUM7SUFFMUUsU0FBZ0IsMEJBQTBCO1FBQ3pDLHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1lBQ3BELEVBQUUsRUFBRSx3QkFBZ0I7WUFDcEIsTUFBTSw2Q0FBbUM7WUFDekMsSUFBSSxFQUFFLDZDQUErQjtZQUNyQyxPQUFPLEVBQUUsMENBQXVCO1lBQ2hDLE9BQU8sRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUM7U0FDekQsQ0FBQyxDQUFDO1FBRUgsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxjQUFjLEVBQUU7WUFDbEQsT0FBTyxFQUFFO2dCQUNSLEVBQUUsRUFBRSx3QkFBZ0I7Z0JBQ3BCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxvQkFBb0IsRUFB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