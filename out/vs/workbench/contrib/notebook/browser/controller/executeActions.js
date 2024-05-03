/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/resources", "vs/base/common/themables", "vs/editor/common/languages/language", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatController", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, iterator_1, resources_1, themables_1, language_1, nls_1, actions_1, configuration_1, contextkey_1, debug_1, inlineChatController_1, inlineChat_1, cellOperations_1, notebookChatContext_1, notebookChatController_1, coreActions_1, notebookBrowser_1, icons, notebookCommon_1, notebookContextKeys_1, notebookEditorInput_1, notebookExecutionStateService_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.executeThisCellCondition = exports.executeCondition = void 0;
    const EXECUTE_NOTEBOOK_COMMAND_ID = 'notebook.execute';
    const CANCEL_NOTEBOOK_COMMAND_ID = 'notebook.cancelExecution';
    const INTERRUPT_NOTEBOOK_COMMAND_ID = 'notebook.interruptExecution';
    const CANCEL_CELL_COMMAND_ID = 'notebook.cell.cancelExecution';
    const EXECUTE_CELL_FOCUS_CONTAINER_COMMAND_ID = 'notebook.cell.executeAndFocusContainer';
    const EXECUTE_CELL_SELECT_BELOW = 'notebook.cell.executeAndSelectBelow';
    const EXECUTE_CELL_INSERT_BELOW = 'notebook.cell.executeAndInsertBelow';
    const EXECUTE_CELL_AND_BELOW = 'notebook.cell.executeCellAndBelow';
    const EXECUTE_CELLS_ABOVE = 'notebook.cell.executeCellsAbove';
    const RENDER_ALL_MARKDOWN_CELLS = 'notebook.renderAllMarkdownCells';
    const REVEAL_RUNNING_CELL = 'notebook.revealRunningCell';
    const REVEAL_LAST_FAILED_CELL = 'notebook.revealLastFailedCell';
    // If this changes, update getCodeCellExecutionContextKeyService to match
    exports.executeCondition = contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.key, 0), contextkey_1.ContextKeyExpr.greater(notebookContextKeys_1.NOTEBOOK_KERNEL_SOURCE_COUNT.key, 0), notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION));
    exports.executeThisCellCondition = contextkey_1.ContextKeyExpr.and(exports.executeCondition, notebookContextKeys_1.NOTEBOOK_CELL_EXECUTING.toNegated());
    function renderAllMarkdownCells(context) {
        for (let i = 0; i < context.notebookEditor.getLength(); i++) {
            const cell = context.notebookEditor.cellAt(i);
            if (cell.cellKind === notebookCommon_1.CellKind.Markup) {
                cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'renderAllMarkdownCells');
            }
        }
    }
    async function runCell(editorGroupsService, context) {
        const group = editorGroupsService.activeGroup;
        if (group) {
            if (group.activeEditor) {
                group.pinEditor(group.activeEditor);
            }
        }
        if (context.ui && context.cell) {
            await context.notebookEditor.executeNotebookCells(iterator_1.Iterable.single(context.cell));
            if (context.autoReveal) {
                const cellIndex = context.notebookEditor.getCellIndex(context.cell);
                context.notebookEditor.revealCellRangeInView({ start: cellIndex, end: cellIndex + 1 });
            }
        }
        else if (context.selectedCells?.length || context.cell) {
            const selectedCells = context.selectedCells?.length ? context.selectedCells : [context.cell];
            await context.notebookEditor.executeNotebookCells(selectedCells);
            const firstCell = selectedCells[0];
            if (firstCell && context.autoReveal) {
                const cellIndex = context.notebookEditor.getCellIndex(firstCell);
                context.notebookEditor.revealCellRangeInView({ start: cellIndex, end: cellIndex + 1 });
            }
        }
        let foundEditor = undefined;
        for (const [, codeEditor] of context.notebookEditor.codeEditors) {
            if ((0, resources_1.isEqual)(codeEditor.getModel()?.uri, (context.cell ?? context.selectedCells?.[0])?.uri)) {
                foundEditor = codeEditor;
                break;
            }
        }
        if (!foundEditor) {
            return;
        }
        const controller = inlineChatController_1.InlineChatController.get(foundEditor);
        if (!controller) {
            return;
        }
        controller.createSnapshot();
    }
    (0, actions_1.registerAction2)(class RenderAllMarkdownCellsAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: RENDER_ALL_MARKDOWN_CELLS,
                title: (0, nls_1.localize)('notebookActions.renderMarkdown', "Render All Markdown Cells"),
            });
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
        }
    });
    (0, actions_1.registerAction2)(class ExecuteNotebookAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: EXECUTE_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.executeNotebook', "Run All"),
                icon: icons.executeAllIcon,
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.executeNotebook', "Run All"),
                    args: [
                        {
                            name: 'uri',
                            description: 'The document uri'
                        }
                    ]
                },
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING.toNegated()), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(coreActions_1.executeNotebookCondition, contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING.toNegated()), contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated())?.negate(), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    }
                ]
            });
        }
        getEditorContextFromArgsOrActive(accessor, context) {
            return (0, coreActions_1.getContextFromUri)(accessor, context) ?? (0, coreActions_1.getContextFromActiveEditor)(accessor.get(editorService_1.IEditorService));
        }
        async runWithContext(accessor, context) {
            renderAllMarkdownCells(context);
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).find(editor => editor.editor instanceof notebookEditorInput_1.NotebookEditorInput && editor.editor.viewType === context.notebookEditor.textModel.viewType && editor.editor.resource.toString() === context.notebookEditor.textModel.uri.toString());
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (editor) {
                const group = editorGroupService.getGroup(editor.groupId);
                group?.pinEditor(editor.editor);
            }
            return context.notebookEditor.executeNotebookCells();
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCell extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXECUTE_CELL_COMMAND_ID,
                precondition: exports.executeThisCellCondition,
                title: (0, nls_1.localize)('notebookActions.execute', "Execute Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.or(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED)),
                    primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                    win: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */
                    },
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellExecutePrimary,
                    when: exports.executeThisCellCondition,
                    group: 'inline'
                },
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.execute', "Execute Cell"),
                    args: coreActions_1.cellExecutionArgs
                },
                icon: icons.executeIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (context.ui) {
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            const chatController = notebookChatController_1.NotebookChatController.get(context.notebookEditor);
            const editingCell = chatController?.getEditingCell();
            if (chatController?.hasFocus() && editingCell) {
                const group = editorGroupsService.activeGroup;
                if (group) {
                    if (group.activeEditor) {
                        group.pinEditor(group.activeEditor);
                    }
                }
                await context.notebookEditor.executeNotebookCells([editingCell]);
                return;
            }
            await runCell(editorGroupsService, context);
        }
    });
    (0, actions_1.registerAction2)(class ExecuteAboveCells extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELLS_ABOVE,
                precondition: exports.executeCondition,
                title: (0, nls_1.localize)('notebookActions.executeAbove', "Execute Above Cells"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellExecute,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, true))
                    },
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        order: 1 /* CellToolbarOrder.ExecuteAboveCells */,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, false))
                    }
                ],
                icon: icons.executeAboveIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let endCellIdx = undefined;
            if (context.ui) {
                endCellIdx = context.notebookEditor.getCellIndex(context.cell);
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                endCellIdx = Math.min(...context.selectedCells.map(cell => context.notebookEditor.getCellIndex(cell)));
            }
            if (typeof endCellIdx === 'number') {
                const range = { start: 0, end: endCellIdx };
                const cells = context.notebookEditor.getCellsInRange(range);
                context.notebookEditor.executeNotebookCells(cells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellAndBelow extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_AND_BELOW,
                precondition: exports.executeCondition,
                title: (0, nls_1.localize)('notebookActions.executeBelow', "Execute Cell and Below"),
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellExecute,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, true))
                    },
                    {
                        id: actions_1.MenuId.NotebookCellTitle,
                        order: 2 /* CellToolbarOrder.ExecuteCellAndBelow */,
                        group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                        when: contextkey_1.ContextKeyExpr.and(exports.executeCondition, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.consolidatedRunButton}`, false))
                    }
                ],
                icon: icons.executeBelowIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let startCellIdx = undefined;
            if (context.ui) {
                startCellIdx = context.notebookEditor.getCellIndex(context.cell);
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                startCellIdx = Math.min(...context.selectedCells.map(cell => context.notebookEditor.getCellIndex(cell)));
            }
            if (typeof startCellIdx === 'number') {
                const range = { start: startCellIdx, end: context.notebookEditor.getLength() };
                const cells = context.notebookEditor.getCellsInRange(range);
                context.notebookEditor.executeNotebookCells(cells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellFocusContainer extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_FOCUS_CONTAINER_COMMAND_ID,
                precondition: exports.executeThisCellCondition,
                title: (0, nls_1.localize)('notebookActions.executeAndFocusContainer', "Execute Cell and Focus Container"),
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.executeAndFocusContainer', "Execute Cell and Focus Container"),
                    args: coreActions_1.cellExecutionArgs
                },
                icon: icons.executeIcon
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            if (context.ui) {
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
            }
            else {
                const firstCell = context.selectedCells[0];
                if (firstCell) {
                    await context.notebookEditor.focusNotebookCell(firstCell, 'container', { skipReveal: true });
                }
            }
            await runCell(editorGroupsService, context);
        }
    });
    const cellCancelCondition = contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals(notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.key, 'executing'), contextkey_1.ContextKeyExpr.equals(notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.key, 'pending'));
    (0, actions_1.registerAction2)(class CancelExecuteCell extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CANCEL_CELL_COMMAND_ID,
                precondition: cellCancelCondition,
                title: (0, nls_1.localize)('notebookActions.cancel', "Stop Cell Execution"),
                icon: icons.stopIcon,
                menu: {
                    id: actions_1.MenuId.NotebookCellExecutePrimary,
                    when: cellCancelCondition,
                    group: 'inline'
                },
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.cancel', "Stop Cell Execution"),
                    args: [
                        {
                            name: 'options',
                            description: 'The cell range options',
                            schema: {
                                'type': 'object',
                                'required': ['ranges'],
                                'properties': {
                                    'ranges': {
                                        'type': 'array',
                                        items: [
                                            {
                                                'type': 'object',
                                                'required': ['start', 'end'],
                                                'properties': {
                                                    'start': {
                                                        'type': 'number'
                                                    },
                                                    'end': {
                                                        'type': 'number'
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    'document': {
                                        'type': 'object',
                                        'description': 'The document uri',
                                    }
                                }
                            }
                        }
                    ]
                },
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                await context.notebookEditor.focusNotebookCell(context.cell, 'container', { skipReveal: true });
                return context.notebookEditor.cancelNotebookCells(iterator_1.Iterable.single(context.cell));
            }
            else {
                return context.notebookEditor.cancelNotebookCells(context.selectedCells);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellSelectBelow extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_SELECT_BELOW,
                precondition: contextkey_1.ContextKeyExpr.or(exports.executeThisCellCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                title: (0, nls_1.localize)('notebookActions.executeAndSelectBelow', "Execute Notebook Cell and Select Below"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.negate()),
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const idx = context.notebookEditor.getCellIndex(context.cell);
            if (typeof idx !== 'number') {
                return;
            }
            const languageService = accessor.get(language_1.ILanguageService);
            const config = accessor.get(configuration_1.IConfigurationService);
            const scrollBehavior = config.getValue(notebookCommon_1.NotebookSetting.scrollToRevealCell);
            let focusOptions;
            if (scrollBehavior === 'none') {
                focusOptions = { skipReveal: true };
            }
            else {
                focusOptions = {
                    revealBehavior: scrollBehavior === 'fullCell' ? notebookBrowser_1.ScrollToRevealBehavior.fullCell : notebookBrowser_1.ScrollToRevealBehavior.firstLine
                };
            }
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                const nextCell = context.notebookEditor.cellAt(idx + 1);
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, EXECUTE_CELL_SELECT_BELOW);
                if (nextCell) {
                    await context.notebookEditor.focusNotebookCell(nextCell, 'container', focusOptions);
                }
                else {
                    const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, notebookCommon_1.CellKind.Markup, 'below');
                    if (newCell) {
                        await context.notebookEditor.focusNotebookCell(newCell, 'editor', focusOptions);
                    }
                }
                return;
            }
            else {
                const nextCell = context.notebookEditor.cellAt(idx + 1);
                if (nextCell) {
                    await context.notebookEditor.focusNotebookCell(nextCell, 'container', focusOptions);
                }
                else {
                    const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, notebookCommon_1.CellKind.Code, 'below');
                    if (newCell) {
                        await context.notebookEditor.focusNotebookCell(newCell, 'editor', focusOptions);
                    }
                }
                return runCell(editorGroupsService, context);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExecuteCellInsertBelow extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: EXECUTE_CELL_INSERT_BELOW,
                precondition: contextkey_1.ContextKeyExpr.or(exports.executeThisCellCondition, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                title: (0, nls_1.localize)('notebookActions.executeAndInsertBelow', "Execute Notebook Cell and Insert Below"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                    primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const idx = context.notebookEditor.getCellIndex(context.cell);
            const languageService = accessor.get(language_1.ILanguageService);
            const newFocusMode = context.cell.focusMode === notebookBrowser_1.CellFocusMode.Editor ? 'editor' : 'container';
            const newCell = (0, cellOperations_1.insertCell)(languageService, context.notebookEditor, idx, context.cell.cellKind, 'below');
            if (newCell) {
                await context.notebookEditor.focusNotebookCell(newCell, newFocusMode);
            }
            if (context.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                context.cell.updateEditState(notebookBrowser_1.CellEditState.Preview, EXECUTE_CELL_INSERT_BELOW);
            }
            else {
                runCell(editorGroupsService, context);
            }
        }
    });
    class CancelNotebook extends coreActions_1.NotebookAction {
        getEditorContextFromArgsOrActive(accessor, context) {
            return (0, coreActions_1.getContextFromUri)(accessor, context) ?? (0, coreActions_1.getContextFromActiveEditor)(accessor.get(editorService_1.IEditorService));
        }
        async runWithContext(accessor, context) {
            return context.notebookEditor.cancelNotebookCells();
        }
    }
    (0, actions_1.registerAction2)(class CancelAllNotebook extends CancelNotebook {
        constructor() {
            super({
                id: CANCEL_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.cancelNotebook', "Stop Execution"),
                icon: icons.stopIcon,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.toNegated(), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    }
                ]
            });
        }
    });
    (0, actions_1.registerAction2)(class InterruptNotebook extends CancelNotebook {
        constructor() {
            super({
                id: INTERRUPT_NOTEBOOK_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.interruptNotebook', "Interrupt"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL),
                icon: icons.stopIcon,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        order: -1,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.NotebookToolbar,
                        order: -1,
                        group: 'navigation/execute',
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_SOMETHING_RUNNING, notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true))
                    },
                    {
                        id: actions_1.MenuId.InteractiveToolbar,
                        group: 'navigation/execute'
                    }
                ]
            });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        title: (0, nls_1.localize)('revealRunningCellShort', "Go To"),
        submenu: actions_1.MenuId.NotebookCellExecuteGoTo,
        group: 'navigation/execute',
        order: 20,
        icon: themables_1.ThemeIcon.modify(icons.executingStateIcon, 'spin')
    });
    (0, actions_1.registerAction2)(class RevealRunningCellAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: REVEAL_RUNNING_CELL,
                title: (0, nls_1.localize)('revealRunningCell', "Go to Running Cell"),
                tooltip: (0, nls_1.localize)('revealRunningCell', "Go to Running Cell"),
                shortTitle: (0, nls_1.localize)('revealRunningCell', "Go to Running Cell"),
                precondition: notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookCellExecuteGoTo,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 20
                    },
                    {
                        id: actions_1.MenuId.InteractiveToolbar,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL, contextkey_1.ContextKeyExpr.equals('activeEditor', 'workbench.editor.interactive')),
                        group: 'navigation',
                        order: 10
                    }
                ],
                icon: themables_1.ThemeIcon.modify(icons.executingStateIcon, 'spin')
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const notebook = context.notebookEditor.textModel.uri;
            const executingCells = notebookExecutionStateService.getCellExecutionsForNotebook(notebook);
            if (executingCells[0]) {
                const topStackFrameCell = this.findCellAtTopFrame(accessor, notebook);
                const focusHandle = topStackFrameCell ?? executingCells[0].cellHandle;
                const cell = context.notebookEditor.getCellByHandle(focusHandle);
                if (cell) {
                    context.notebookEditor.focusNotebookCell(cell, 'container');
                }
            }
        }
        findCellAtTopFrame(accessor, notebook) {
            const debugService = accessor.get(debug_1.IDebugService);
            for (const session of debugService.getModel().getSessions()) {
                for (const thread of session.getAllThreads()) {
                    const sf = thread.getTopStackFrame();
                    if (sf) {
                        const parsed = notebookCommon_1.CellUri.parse(sf.source.uri);
                        if (parsed && parsed.notebook.toString() === notebook.toString()) {
                            return parsed.handle;
                        }
                    }
                }
            }
            return undefined;
        }
    });
    (0, actions_1.registerAction2)(class RevealLastFailedCellAction extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: REVEAL_LAST_FAILED_CELL,
                title: (0, nls_1.localize)('revealLastFailedCell', "Go to Most Recently Failed Cell"),
                tooltip: (0, nls_1.localize)('revealLastFailedCell', "Go to Most Recently Failed Cell"),
                shortTitle: (0, nls_1.localize)('revealLastFailedCellShort', "Go to Most Recently Failed Cell"),
                precondition: notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED,
                menu: [
                    {
                        id: actions_1.MenuId.EditorTitle,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.notebook.globalToolbar', true)),
                        group: 'navigation',
                        order: 0
                    },
                    {
                        id: actions_1.MenuId.NotebookCellExecuteGoTo,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_LAST_CELL_FAILED, notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.toNegated(), contextkey_1.ContextKeyExpr.equals('config.notebook.globalToolbar', true)),
                        group: 'navigation/execute',
                        order: 20
                    },
                ],
                icon: icons.errorStateIcon,
            });
        }
        async runWithContext(accessor, context) {
            const notebookExecutionStateService = accessor.get(notebookExecutionStateService_1.INotebookExecutionStateService);
            const notebook = context.notebookEditor.textModel.uri;
            const lastFailedCellHandle = notebookExecutionStateService.getLastFailedCellForNotebook(notebook);
            if (lastFailedCellHandle !== undefined) {
                const lastFailedCell = context.notebookEditor.getCellByHandle(lastFailedCellHandle);
                if (lastFailedCell) {
                    context.notebookEditor.focusNotebookCell(lastFailedCell, 'container');
                }
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhlY3V0ZUFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvY29udHJvbGxlci9leGVjdXRlQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUErQmhHLE1BQU0sMkJBQTJCLEdBQUcsa0JBQWtCLENBQUM7SUFDdkQsTUFBTSwwQkFBMEIsR0FBRywwQkFBMEIsQ0FBQztJQUM5RCxNQUFNLDZCQUE2QixHQUFHLDZCQUE2QixDQUFDO0lBQ3BFLE1BQU0sc0JBQXNCLEdBQUcsK0JBQStCLENBQUM7SUFDL0QsTUFBTSx1Q0FBdUMsR0FBRyx3Q0FBd0MsQ0FBQztJQUN6RixNQUFNLHlCQUF5QixHQUFHLHFDQUFxQyxDQUFDO0lBQ3hFLE1BQU0seUJBQXlCLEdBQUcscUNBQXFDLENBQUM7SUFDeEUsTUFBTSxzQkFBc0IsR0FBRyxtQ0FBbUMsQ0FBQztJQUNuRSxNQUFNLG1CQUFtQixHQUFHLGlDQUFpQyxDQUFDO0lBQzlELE1BQU0seUJBQXlCLEdBQUcsaUNBQWlDLENBQUM7SUFDcEUsTUFBTSxtQkFBbUIsR0FBRyw0QkFBNEIsQ0FBQztJQUN6RCxNQUFNLHVCQUF1QixHQUFHLCtCQUErQixDQUFDO0lBRWhFLHlFQUF5RTtJQUM1RCxRQUFBLGdCQUFnQixHQUFHLDJCQUFjLENBQUMsR0FBRyxDQUNqRCx3Q0FBa0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQ3BDLDJCQUFjLENBQUMsRUFBRSxDQUNoQiwyQkFBYyxDQUFDLE9BQU8sQ0FBQywyQ0FBcUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ3BELDJCQUFjLENBQUMsT0FBTyxDQUFDLGtEQUE0QixDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDM0QsdURBQWlDLENB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