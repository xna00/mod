/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext"], function (require, exports, codicons_1, language_1, nls_1, actions_1, contextkey_1, contextkeys_1, cellOperations_1, coreActions_1, notebookContextKeys_1, notebookCommon_1, notebookChatContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InsertCellCommand = void 0;
    exports.insertNewCell = insertNewCell;
    const INSERT_CODE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertCodeCellAbove';
    const INSERT_CODE_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertCodeCellBelow';
    const INSERT_CODE_CELL_ABOVE_AND_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.insertCodeCellAboveAndFocusContainer';
    const INSERT_CODE_CELL_BELOW_AND_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.insertCodeCellBelowAndFocusContainer';
    const INSERT_CODE_CELL_AT_TOP_COMMAND_ID = 'notebook.cell.insertCodeCellAtTop';
    const INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertMarkdownCellAbove';
    const INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertMarkdownCellBelow';
    const INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID = 'notebook.cell.insertMarkdownCellAtTop';
    function insertNewCell(accessor, context, kind, direction, focusEditor) {
        let newCell = null;
        if (context.ui) {
            context.notebookEditor.focus();
        }
        const languageService = accessor.get(language_1.ILanguageService);
        if (context.cell) {
            const idx = context.notebookEditor.getCellIndex(context.cell);
            newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, kind, direction, undefined, true);
        }
        else {
            const focusRange = context.notebookEditor.getFocus();
            const next = Math.max(focusRange.end - 1, 0);
            newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, next, kind, direction, undefined, true);
        }
        return newCell;
    }
    class InsertCellCommand extends coreActions_1.NotebookAction {
        constructor(desc, kind, direction, focusEditor) {
            super(desc);
            this.kind = kind;
            this.direction = direction;
            this.focusEditor = focusEditor;
        }
        async runWithContext(accessor, context) {
            const newCell = await insertNewCell(accessor, context, this.kind, this.direction, this.focusEditor);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, this.focusEditor ? 'editor' : 'container');
            }
        }
    }
    exports.InsertCellCommand = InsertCellCommand;
    (0, actions_1.registerAction2)(class InsertCodeCellAboveAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAbove', "Insert Code Cell Above"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 0
                }
            }, notebookCommon_1.CellKind.Code, 'above', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellAboveAndFocusContainerAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_AND_FOCUS_CONTAINER_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAboveAndFocusContainer', "Insert Code Cell Above and Focus Container")
            }, notebookCommon_1.CellKind.Code, 'above', false);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellBelowAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellBelow', "Insert Code Cell Below"),
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated(), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('')),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 1
                }
            }, notebookCommon_1.CellKind.Code, 'below', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellBelowAndFocusContainerAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_AND_FOCUS_CONTAINER_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellBelowAndFocusContainer', "Insert Code Cell Below and Focus Container"),
            }, notebookCommon_1.CellKind.Code, 'below', false);
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellAboveAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellAbove', "Insert Markdown Cell Above"),
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 2
                }
            }, notebookCommon_1.CellKind.Markup, 'above', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellBelowAction extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellBelow', "Insert Markdown Cell Below"),
                menu: {
                    id: actions_1.MenuId.NotebookCellInsert,
                    order: 3
                }
            }, notebookCommon_1.CellKind.Markup, 'below', true);
        }
    });
    (0, actions_1.registerAction2)(class InsertCodeCellAtTopAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertCodeCellAtTop', "Add Code Cell At Top"),
                f1: false
            });
        }
        async run(accessor, context) {
            context = context ?? this.getEditorContextFromArgsOrActive(accessor);
            if (context) {
                this.runWithContext(accessor, context);
            }
        }
        async runWithContext(accessor, context) {
            const languageService = accessor.get(language_1.ILanguageService);
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, 0, notebookCommon_1.CellKind.Code, 'above', undefined, true);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    });
    (0, actions_1.registerAction2)(class InsertMarkdownCellAtTopAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.insertMarkdownCellAtTop', "Add Markdown Cell At Top"),
                f1: false
            });
        }
        async run(accessor, context) {
            context = context ?? this.getEditorContextFromArgsOrActive(accessor);
            if (context) {
                this.runWithContext(accessor, context);
            }
        }
        async runWithContext(accessor, context) {
            const languageService = accessor.get(language_1.ILanguageService);
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, 0, notebookCommon_1.CellKind.Markup, 'above', undefined, true);
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, 'editor');
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertCode', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.minimalToolbar', "Add Code"),
            icon: codicons_1.Codicon.add,
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.equals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
            icon: codicons_1.Codicon.add,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.ontoolbar', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: -5,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertCode', "Code"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_CODE_CELL_AT_TOP_COMMAND_ID,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.minimaltoolbar', "Add Code"),
            icon: codicons_1.Codicon.add,
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Add Code Cell")
        },
        order: 0,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.equals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellBetween, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertMarkdown', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: 1,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
            icon: codicons_1.Codicon.add,
            title: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.ontoolbar', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: -5,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'), contextkey_1.ContextKeyExpr.notEquals(`config.${notebookCommon_1.NotebookSetting.globalToolbarShowLabel}`, false), contextkey_1.ContextKeyExpr.notEquals(`config.${notebookCommon_1.NotebookSetting.globalToolbarShowLabel}`, 'never'))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookCellListTop, {
        command: {
            id: INSERT_MARKDOWN_CELL_AT_TOP_COMMAND_ID,
            title: '$(add) ' + (0, nls_1.localize)('notebookActions.menu.insertMarkdown', "Markdown"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertMarkdown.tooltip', "Add Markdown Cell")
        },
        order: 1,
        group: 'inline',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.experimental.insertToolbarAlignment', 'left'))
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zZXJ0Q2VsbEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9pbnNlcnRDZWxsQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHLHNDQWlCQztJQTFCRCxNQUFNLGlDQUFpQyxHQUFHLG1DQUFtQyxDQUFDO0lBQzlFLE1BQU0saUNBQWlDLEdBQUcsbUNBQW1DLENBQUM7SUFDOUUsTUFBTSxxREFBcUQsR0FBRyxvREFBb0QsQ0FBQztJQUNuSCxNQUFNLHFEQUFxRCxHQUFHLG9EQUFvRCxDQUFDO0lBQ25ILE1BQU0sa0NBQWtDLEdBQUcsbUNBQW1DLENBQUM7SUFDL0UsTUFBTSxxQ0FBcUMsR0FBRyx1Q0FBdUMsQ0FBQztJQUN0RixNQUFNLHFDQUFxQyxHQUFHLHVDQUF1QyxDQUFDO0lBQ3RGLE1BQU0sc0NBQXNDLEdBQUcsdUNBQXVDLENBQUM7SUFFdkYsU0FBZ0IsYUFBYSxDQUFDLFFBQTBCLEVBQUUsT0FBK0IsRUFBRSxJQUFjLEVBQUUsU0FBNEIsRUFBRSxXQUFvQjtRQUM1SixJQUFJLE9BQU8sR0FBeUIsSUFBSSxDQUFDO1FBQ3pDLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ2hCLE9BQU8sQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsQ0FBQztRQUVELE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztRQUN2RCxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNsQixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQs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