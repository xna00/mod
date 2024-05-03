/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/registry/common/platform", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, async_1, editorExtensions_1, editorContextKeys_1, nls_1, accessibility_1, actions_1, configurationRegistry_1, contextkey_1, contextkeys_1, platform_1, inlineChatController_1, notebookChatContext_1, coreActions_1, notebookBrowser_1, notebookCommon_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CENTER_ACTIVE_CELL = void 0;
    const NOTEBOOK_FOCUS_TOP = 'notebook.focusTop';
    const NOTEBOOK_FOCUS_BOTTOM = 'notebook.focusBottom';
    const NOTEBOOK_FOCUS_PREVIOUS_EDITOR = 'notebook.focusPreviousEditor';
    const NOTEBOOK_FOCUS_NEXT_EDITOR = 'notebook.focusNextEditor';
    const FOCUS_IN_OUTPUT_COMMAND_ID = 'notebook.cell.focusInOutput';
    const FOCUS_OUT_OUTPUT_COMMAND_ID = 'notebook.cell.focusOutOutput';
    exports.CENTER_ACTIVE_CELL = 'notebook.centerActiveCell';
    const NOTEBOOK_CURSOR_PAGEUP_COMMAND_ID = 'notebook.cell.cursorPageUp';
    const NOTEBOOK_CURSOR_PAGEUP_SELECT_COMMAND_ID = 'notebook.cell.cursorPageUpSelect';
    const NOTEBOOK_CURSOR_PAGEDOWN_COMMAND_ID = 'notebook.cell.cursorPageDown';
    const NOTEBOOK_CURSOR_PAGEDOWN_SELECT_COMMAND_ID = 'notebook.cell.cursorPageDownSelect';
    (0, actions_1.registerAction2)(class FocusNextCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_NEXT_EDITOR,
                title: (0, nls_1.localize)('cursorMoveDown', 'Focus Next Cell Editor'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.equals('config.notebook.navigation.allowNavigateToSurroundingCells', true), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('top'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 18 /* KeyCode.DownArrow */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT, // code cell keybinding, focus inside editor: lower weight to not override suggest widget
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.equals('config.notebook.navigation.allowNavigateToSurroundingCells', true), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.isEqualTo(false), notebookContextKeys_1.NOTEBOOK_CURSOR_NAVIGATION_MODE), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */, // markdown keybinding, focus on list: higher weight to override list.focusDown
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    {
                        when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */, },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                ]
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = editor.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx >= editor.getLength() - 1) {
                // last one
                return;
            }
            const focusEditorLine = activeCell.textBuffer.getLineCount();
            const targetCell = (context.cell ?? context.selectedCells?.[0]);
            const foundEditor = targetCell ? (0, coreActions_1.findTargetCellEditor)(context, targetCell) : undefined;
            if (foundEditor && foundEditor.hasTextFocus() && inlineChatController_1.InlineChatController.get(foundEditor)?.getWidgetPosition()?.lineNumber === focusEditorLine) {
                inlineChatController_1.InlineChatController.get(foundEditor)?.focus();
            }
            else {
                const newCell = editor.cellAt(idx + 1);
                const newFocusMode = newCell.cellKind === notebookCommon_1.CellKind.Markup && newCell.getEditState() === notebookBrowser_1.CellEditState.Preview ? 'container' : 'editor';
                await editor.focusNotebookCell(newCell, newFocusMode, { focusEditorLine: 1 });
            }
        }
    });
    (0, actions_1.registerAction2)(class FocusPreviousCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_PREVIOUS_EDITOR,
                title: (0, nls_1.localize)('cursorMoveUp', 'Focus Previous Cell Editor'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.equals('config.notebook.navigation.allowNavigateToSurroundingCells', true), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('bottom'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 16 /* KeyCode.UpArrow */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT, // code cell keybinding, focus inside editor: lower weight to not override suggest widget
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.equals('config.notebook.navigation.allowNavigateToSurroundingCells', true), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup'), notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.isEqualTo(false), notebookContextKeys_1.NOTEBOOK_CURSOR_NAVIGATION_MODE), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 16 /* KeyCode.UpArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */, // markdown keybinding, focus on list: higher weight to override list.focusDown
                    },
                    {
                        when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                ],
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = editor.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx < 1 || editor.getLength() === 0) {
                // we don't do loop
                return;
            }
            const newCell = editor.cellAt(idx - 1);
            const newFocusMode = newCell.cellKind === notebookCommon_1.CellKind.Markup && newCell.getEditState() === notebookBrowser_1.CellEditState.Preview ? 'container' : 'editor';
            const focusEditorLine = newCell.textBuffer.getLineCount();
            await editor.focusNotebookCell(newCell, newFocusMode, { focusEditorLine: focusEditorLine });
            const foundEditor = (0, coreActions_1.findTargetCellEditor)(context, newCell);
            if (foundEditor && inlineChatController_1.InlineChatController.get(foundEditor)?.getWidgetPosition()?.lineNumber === focusEditorLine) {
                inlineChatController_1.InlineChatController.get(foundEditor)?.focus();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_TOP,
                title: (0, nls_1.localize)('focusFirstCell', 'Focus First Cell'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('')),
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (editor.getLength() === 0) {
                return;
            }
            const firstCell = editor.cellAt(0);
            await editor.focusNotebookCell(firstCell, 'container');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_BOTTOM,
                title: (0, nls_1.localize)('focusLastCell', 'Focus Last Cell'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                        mac: undefined,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('')),
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            if (!editor.hasModel() || editor.getLength() === 0) {
                return;
            }
            const lastIdx = editor.getLength() - 1;
            const lastVisibleIdx = editor.getPreviousVisibleCellIndex(lastIdx);
            if (lastVisibleIdx) {
                const cell = editor.cellAt(lastVisibleIdx);
                await editor.focusNotebookCell(cell, 'container');
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: FOCUS_IN_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('focusOutput', 'Focus In Active Cell Output'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */, },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            return (0, async_1.timeout)(0).then(() => editor.focusNotebookCell(activeCell, 'output'));
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: FOCUS_OUT_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize)('focusOutputOut', 'Focus Out Active Cell Output'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */, },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            await editor.focusNotebookCell(activeCell, 'editor');
        }
    });
    (0, actions_1.registerAction2)(class CenterActiveCellAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: exports.CENTER_ACTIVE_CELL,
                title: (0, nls_1.localize)('notebookActions.centerActiveCell', "Center Active Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */,
                    mac: {
                        primary: 256 /* KeyMod.WinCtrl */ | 42 /* KeyCode.KeyL */,
                    },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.revealInCenter(context.cell);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEUP_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageUp', "Cell Cursor Page Up"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                        primary: 11 /* KeyCode.PageUp */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageUp').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEUP_SELECT_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageUpSelect', "Cell Cursor Page Up Select"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED.negate()),
                        primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageUpSelect').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEDOWN_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageDown', "Cell Cursor Page Down"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                        primary: 12 /* KeyCode.PageDown */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageDown').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_PAGEDOWN_SELECT_COMMAND_ID,
                title: (0, nls_1.localize)('cursorPageDownSelect', "Cell Cursor Page Down Select"),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED.negate()),
                        primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                        weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            editorExtensions_1.EditorExtensionsRegistry.getEditorCommand('cursorPageDownSelect').runCommand(accessor, { pageSize: getPageSize(context) });
        }
    });
    function getPageSize(context) {
        const editor = context.notebookEditor;
        const layoutInfo = editor.getViewModel().layoutInfo;
        const lineHeight = layoutInfo?.fontInfo.lineHeight || 17;
        return Math.max(1, Math.floor((layoutInfo?.height || 0) / lineHeight) - 2);
    }
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'notebook',
        order: 100,
        type: 'object',
        'properties': {
            'notebook.navigation.allowNavigateToSurroundingCells': {
                type: 'boolean',
                default: true,
                markdownDescription: (0, nls_1.localize)('notebook.navigation.allowNavigateToSurroundingCells', "When enabled cursor can navigate to the next/previous cell when the current cursor in the cell editor is at the first/last line.")
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyb3cuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJpYi9uYXZpZ2F0aW9uL2Fycm93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVCaEcsTUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztJQUMvQyxNQUFNLHFCQUFxQixHQUFHLHNCQUFzQixDQUFDO0lBQ3JELE1BQU0sOEJBQThCLEdBQUcsOEJBQThCLENBQUM7SUFDdEUsTUFBTSwwQkFBMEIsR0FBRywwQkFBMEIsQ0FBQztJQUM5RCxNQUFNLDBCQUEwQixHQUFHLDZCQUE2QixDQUFDO0lBQ2pFLE1BQU0sMkJBQTJCLEdBQUcsOEJBQThCLENBQUM7SUFDdEQsUUFBQSxrQkFBa0IsR0FBRywyQkFBMkIsQ0FBQztJQUM5RCxNQUFNLGlDQUFpQyxHQUFHLDRCQUE0QixDQUFDO0lBQ3ZFLE1BQU0sd0NBQXdDLEdBQUcsa0NBQWtDLENBQUM7SUFDcEYsTUFBTSxtQ0FBbUMsR0FBRyw4QkFBOEIsQ0FBQztJQUMzRSxNQUFNLDBDQUEwQyxHQUFHLG9DQUFvQyxDQUFDO0lBRXhGLElBQUEseUJBQWUsRUFBQyxNQUFNLG1CQUFvQixTQUFRLGdDQUFrQjtRQUNuRTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMEJBQTBCO2dCQUM5QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsd0JBQXdCLENBQUM7Z0JBQzNELFVBQVUsRUFBRTtvQkFDWDt3QkFDQyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLDZDQUF1QixFQUN2QixrREFBa0MsQ0FBQyxNQUFNLEVBQUUsRUFDM0MsMkJBQWMsQ0FBQyxNQUFNLENBQUMsNERBQTRELEVBQUUsSUFBSSxDQUFDLEVBQ3pGLDJCQUFjLENBQUMsR0FBRyxDQUNqQiwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxFQUMxQyxxQ0FBaUIsQ0FBQyxlQUFlLEVBQ2pDLGdEQUErQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFDbEQsZ0RBQStCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUNuRCxFQUNELHFDQUFpQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUMvQzt3QkFDRCxPQUFPLDRCQUFtQjt3QkFDMUIsTUFBTSxFQUFFLGtEQUFvQyxFQUFFLHlGQUF5RjtxQkFDdkk7b0JBQ0Q7d0JBQ0MsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2Qiw2Q0FBdUIsRUFDdkIsa0RBQWtDLENBQUMsTUFBTSxFQUFFLEVBQzNDLDJCQUFjLENBQUMsTUFBTSxDQUFDLDREQUE0RCxFQUFFLElBQUksQ0FBQyxFQUN6RiwyQkFBYyxDQUFDLEdBQUcsQ0FDakIsd0NBQWtCLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUN0QyxzREFBZ0MsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQ2pELHFEQUErQixDQUFDLEVBQ2pDLHFDQUFpQixDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUMvQzt3QkFDRCxPQUFPLDRCQUFtQjt3QkFDMUIsTUFBTSw2Q0FBbUMsRUFBRSwrRUFBK0U7cUJBQzFIO29CQUNEO3dCQUNDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw2Q0FBdUIsRUFBRSw2Q0FBdUIsQ0FBQzt3QkFDMUUsT0FBTyxFQUFFLHNEQUFrQzt3QkFDM0MsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLG9EQUErQiw2QkFBb0IsR0FBRzt3QkFDdEUsTUFBTSw2Q0FBbUM7cUJBQ3pDO29CQUNEO3dCQUNDLElBQUksRUFBRSw2Q0FBdUI7d0JBQzdCLE9BQU8sRUFBRSxnREFBMkIsNEJBQW1CO3dCQUN2RCxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsZ0RBQTJCLDRCQUFtQixHQUFHO3dCQUNqRSxNQUFNLDZDQUFtQztxQkFDekM7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUEwQixFQUFFLE9BQW1DO1lBQ25GLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDdEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUVoQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzVDLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQzdCLE9BQU87WUFDUixDQUFDO1lBRUQsSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxXQUFXO2dCQUNYLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUM3RCxNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsTUFBTSxXQUFXLEdBQTRCLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBQSxrQ0FBb0IsRUFBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUVoSCxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsWUFBWSxFQUFFLElBQUksMkNBQW9CLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsVUFBVSxLQUFLLGVBQWUsRUFBRSxDQUFDO2dCQUM3SSwyQ0FBb0IsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUM7WUFDaEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSywrQkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7Z0JBQ3ZJLE1BQU0sTUFBTSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMvRSxDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUdILElBQUEseUJBQWUsRUFBQyxNQUFNLHVCQUF3QixTQUFRLGdDQUFrQjtRQUN2RTtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsOEJBQThCO2dCQUNsQyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsY0FBYyxFQUFFLDRCQUE0QixDQUFDO2dCQUM3RCxVQUFVLEVBQUU7b0JBQ1g7d0JBQ0MsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2Qiw2Q0FBdUIsRUFDdkIsa0RBQWtDLENBQUMsTUFBTSxFQUFFLEVBQzNDLDJCQUFjLENBQUMsTUFBTSxDQUFDLDREQUE0RCxFQUFFLElBQUksQ0FBQyxFQUN6RiwyQkFBYyxDQUFDLEdBQUcsQ0FDakIsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0NBQXNCLENBQUMsRUFDMUMscUNBQWlCLENBQUMsZUFBZSxFQUNqQyxnREFBK0IsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQ3JELGdEQUErQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FDbkQsRUFDRCxxQ0FBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FDL0M7d0JBQ0QsT0FBTywwQkFBaUI7d0JBQ3hCLE1BQU0sRUFBRSxrREFBb0MsRUFBRSx5RkFBeUY7cUJBQ3ZJO29CQUNEO3dCQUNDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIsNkNBQXVCLEVBQ3ZCLGtEQUFrQyxDQUFDLE1BQU0sRUFBRSxFQUMzQywyQkFBYyxDQUFDLE1BQU0sQ0FBQyw0REFBNEQsRUFBRSxJQUFJLENBQUMsRUFDekYsMkJBQWMsQ0FBQyxHQUFHLENBQ2pCLHdDQUFrQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFDdEMsc0RBQWdDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUNqRCxxREFBK0IsQ0FDL0IsRUFDRCxxQ0FBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FDL0M7d0JBQ0QsT0FBTywwQkFBaUI7d0JBQ3hCLE1BQU0sNkNBQW1DLEVBQUUsK0VBQStFO3FCQUMxSDtvQkFDRDt3QkFDQyxJQUFJLEVBQUUsNkNBQXVCO3dCQUM3QixPQUFPLEVBQUUsZ0RBQTJCLDBCQUFpQjt3QkFDckQsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdEQUEyQiwwQkFBaUIsRUFBRTt3QkFDOUQsTUFBTSw2Q0FBbUM7cUJBQ3pDO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBMEIsRUFBRSxPQUFtQztZQUNuRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1lBQ3RDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFFaEMsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUM1QyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM3QixPQUFPO1lBQ1IsQ0FBQztZQUVELElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLG1CQUFtQjtnQkFDbkIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUN2QyxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLHlCQUFRLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxZQUFZLEVBQUUsS0FBSywrQkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7WUFDdkksTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUMxRCxNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFFNUYsTUFBTSxXQUFXLEdBQTRCLElBQUEsa0NBQW9CLEVBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRXBGLElBQUksV0FBVyxJQUFJLDJDQUFvQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxpQkFBaUIsRUFBRSxFQUFFLFVBQVUsS0FBSyxlQUFlLEVBQUUsQ0FBQztnQkFDL0csMkNBQW9CLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBQ2hELENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBR0gsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSw0QkFBYztRQUMzQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0JBQWtCO2dCQUN0QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUM7Z0JBQ3JELFVBQVUsRUFBRTtvQkFDWDt3QkFDQyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsNkNBQXVCLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0NBQXNCLENBQUMsQ0FBQzt3QkFDN0YsT0FBTyxFQUFFLGlEQUE2Qjt3QkFDdEMsTUFBTSw2Q0FBbUM7cUJBQ3pDO29CQUNEO3dCQUNDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw2Q0FBdUIsRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxFQUFFLDREQUFzQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDbkosR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLG9EQUFnQyxFQUFFO3dCQUNsRCxNQUFNLDZDQUFtQztxQkFDekM7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUEwQixFQUFFLE9BQStCO1lBQy9FLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDdEMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQyxNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDeEQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsNEJBQWM7UUFDM0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHFCQUFxQjtnQkFDekIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQztnQkFDbkQsVUFBVSxFQUFFO29CQUNYO3dCQUNDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw2Q0FBdUIsRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxDQUFDO3dCQUM3RixPQUFPLEVBQUUsZ0RBQTRCO3dCQUNyQyxHQUFHLEVBQUUsU0FBUzt3QkFDZCxNQUFNLDZDQUFtQztxQkFDekM7b0JBQ0Q7d0JBQ0MsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDZDQUF1QixFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFzQixDQUFDLEVBQUUsNERBQXNDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUNuSixHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsc0RBQWtDLEVBQUU7d0JBQ3BELE1BQU0sNkNBQW1DO3FCQUN6QztpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQTBCLEVBQUUsT0FBK0I7WUFDL0UsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztZQUN0QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDcEQsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sY0FBYyxHQUFHLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuRSxJQUFJLGNBQWMsRUFBRSxDQUFDO2dCQUNwQixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFDbkQsQ0FBQztRQUNGLENBQUM7S0FDRCxDQUFDLENBQUM7SUFHSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGdDQUFrQjtRQUMvQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsMEJBQTBCO2dCQUM5QixLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsYUFBYSxFQUFFLDZCQUE2QixDQUFDO2dCQUM3RCxVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLDZDQUF1QixFQUFFLCtDQUF5QixDQUFDO29CQUM1RSxPQUFPLEVBQUUsc0RBQWtDO29CQUMzQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsb0RBQStCLDZCQUFvQixHQUFHO29CQUN0RSxNQUFNLDZDQUFtQztpQkFDekM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUEwQixFQUFFLE9BQW1DO1lBQ25GLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7WUFDdEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztZQUNoQyxPQUFPLElBQUEsZUFBTyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDOUUsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsZ0NBQWtCO1FBQy9DO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwyQkFBMkI7Z0JBQy9CLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSw4QkFBOEIsQ0FBQztnQkFDakUsVUFBVSxFQUFFO29CQUNYLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw2Q0FBdUIsRUFBRSw2Q0FBdUIsQ0FBQztvQkFDMUUsT0FBTyxFQUFFLG9EQUFnQztvQkFDekMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLG9EQUErQiwyQkFBa0IsR0FBRztvQkFDcEUsTUFBTSw2Q0FBbUM7aUJBQ3pDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBMEIsRUFBRSxPQUFtQztZQUNuRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1lBQ3RDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDaEMsTUFBTSxNQUFNLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3RELENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSxzQkFBdUIsU0FBUSxnQ0FBa0I7UUFDdEU7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDBCQUFrQjtnQkFDdEIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGtDQUFrQyxFQUFFLG9CQUFvQixDQUFDO2dCQUN6RSxVQUFVLEVBQUU7b0JBQ1gsSUFBSSxFQUFFLDZDQUF1QjtvQkFDN0IsT0FBTyxFQUFFLGlEQUE2QjtvQkFDdEMsR0FBRyxFQUFFO3dCQUNKLE9BQU8sRUFBRSxnREFBNkI7cUJBQ3RDO29CQUNELE1BQU0sNkNBQW1DO2lCQUN6QzthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQTBCLEVBQUUsT0FBbUM7WUFDbkYsT0FBTyxPQUFPLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsZ0NBQWtCO1FBQy9DO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxpQ0FBaUM7Z0JBQ3JDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUscUJBQXFCLENBQUM7Z0JBQ3RELFVBQVUsRUFBRTtvQkFDWDt3QkFDQyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLDZDQUF1QixFQUN2QiwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxFQUMxQyxxQ0FBaUIsQ0FBQyxlQUFlLENBQ2pDO3dCQUNELE9BQU8seUJBQWdCO3dCQUN2QixNQUFNLEVBQUUsa0RBQW9DO3FCQUM1QztpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQTBCLEVBQUUsT0FBbUM7WUFDbkYsMkNBQXdCLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BILENBQUM7S0FDRCxDQUFDLENBQUM7SUFFSCxJQUFBLHlCQUFlLEVBQUMsS0FBTSxTQUFRLGdDQUFrQjtRQUMvQztZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsd0NBQXdDO2dCQUM1QyxLQUFLLEVBQUUsSUFBQSxjQUFRLEVBQUMsb0JBQW9CLEVBQUUsNEJBQTRCLENBQUM7Z0JBQ25FLFVBQVUsRUFBRTtvQkFDWDt3QkFDQyxJQUFJLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQ3ZCLDZDQUF1QixFQUN2QiwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvQ0FBc0IsQ0FBQyxFQUMxQyxxQ0FBaUIsQ0FBQyxlQUFlLEVBQ2pDLDZDQUF1QixDQUFDLE1BQU0sRUFBRSxDQUNoQzt3QkFDRCxPQUFPLEVBQUUsaURBQTZCO3dCQUN0QyxNQUFNLEVBQUUsa0RBQW9DO3FCQUM1QztpQkFDRDthQUNELENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQTBCLEVBQUUsT0FBbUM7WUFDbkYsMkNBQXdCLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDMUgsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsZ0NBQWtCO1FBQy9DO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxtQ0FBbUM7Z0JBQ3ZDLEtBQUssRUFBRSxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSx1QkFBdUIsQ0FBQztnQkFDMUQsVUFBVSxFQUFFO29CQUNYO3dCQUNDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FDdkIsNkNBQXVCLEVBQ3ZCLDJCQUFjLENBQUMsR0FBRyxDQUFDLG9DQUFzQixDQUFDLEVBQzFDLHFDQUFpQixDQUFDLGVBQWUsQ0FDakM7d0JBQ0QsT0FBTywyQkFBa0I7d0JBQ3pCLE1BQU0sRUFBRSxrREFBb0M7cUJBQzVDO2lCQUNEO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBMEIsRUFBRSxPQUFtQztZQUNuRiwyQ0FBd0IsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0SCxDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSx5QkFBZSxFQUFDLEtBQU0sU0FBUSxnQ0FBa0I7UUFDL0M7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLDBDQUEwQztnQkFDOUMsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLHNCQUFzQixFQUFFLDhCQUE4QixDQUFDO2dCQUN2RSxVQUFVLEVBQUU7b0JBQ1g7d0JBQ0MsSUFBSSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUN2Qiw2Q0FBdUIsRUFDdkIsMkJBQWMsQ0FBQyxHQUFHLENBQUMsb0NBQXNCLENBQUMsRUFDMUMscUNBQWlCLENBQUMsZUFBZSxFQUNqQyw2Q0FBdUIsQ0FBQyxNQUFNLEVBQUUsQ0FDaEM7d0JBQ0QsT0FBTyxFQUFFLG1EQUErQjt3QkFDeEMsTUFBTSxFQUFFLGtEQUFvQztxQkFDNUM7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUEwQixFQUFFLE9BQW1DO1lBQ25GLDJDQUF3QixDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzVILENBQUM7S0FDRCxDQUFDLENBQUM7SUFHSCxTQUFTLFdBQVcsQ0FBQyxPQUFtQztRQUN2RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDO1FBQ3RDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUM7UUFDcEQsTUFBTSxVQUFVLEdBQUcsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDO1FBQ3pELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUdELG1CQUFRLENBQUMsRUFBRSxDQUF5QixrQ0FBdUIsQ0FBQyxhQUFhLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQztRQUNoRyxFQUFFLEVBQUUsVUFBVTtRQUNkLEtBQUssRUFBRSxHQUFHO1FBQ1YsSUFBSSxFQUFFLFFBQVE7UUFDZCxZQUFZLEVBQUU7WUFDYixxREFBcUQsRUFBRTtnQkFDdEQsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsbUJBQW1CLEVBQUUsSUFBQSxjQUFRLEVBQUMscURBQXFELEVBQUUsa0lBQWtJLENBQUM7YUFDeE47U0FDRDtLQUNELENBQUMsQ0FBQyJ9