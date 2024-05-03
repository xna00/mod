/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/mime", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/notebook/browser/controller/cellOperations", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/notification/common/notification", "vs/editor/common/editorContextKeys", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/editor/common/core/range", "vs/editor/contrib/codeAction/browser/codeActionController", "vs/editor/contrib/codeAction/common/types"], function (require, exports, keyCodes_1, mime_1, bulkEditService_1, nls_1, actions_1, contextkey_1, contextkeys_1, bulkCellEdits_1, cellOperations_1, coreActions_1, notebookBrowser_1, notebookContextKeys_1, icons, notebookCommon_1, notification_1, editorContextKeys_1, configuration_1, codeCellViewModel_1, range_1, codeActionController_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID = void 0;
    //#region Move/Copy cells
    const MOVE_CELL_UP_COMMAND_ID = 'notebook.cell.moveUp';
    const MOVE_CELL_DOWN_COMMAND_ID = 'notebook.cell.moveDown';
    const COPY_CELL_UP_COMMAND_ID = 'notebook.cell.copyUp';
    const COPY_CELL_DOWN_COMMAND_ID = 'notebook.cell.copyDown';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: MOVE_CELL_UP_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.moveCellUp', "Move Cell Up"),
                icon: icons.moveUpIcon,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.equals('config.notebook.dragAndDropEnabled', false),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 14
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.moveCellRange)(context, 'up');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: MOVE_CELL_DOWN_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.moveCellDown', "Move Cell Down"),
                icon: icons.moveDownIcon,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.equals('config.notebook.dragAndDropEnabled', false),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 14
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.moveCellRange)(context, 'down');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: COPY_CELL_UP_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.copyCellUp', "Copy Cell Up"),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.copyCellRange)(context, 'up');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: COPY_CELL_DOWN_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.copyCellDown', "Copy Cell Down"),
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 13
                }
            });
        }
        async runWithContext(accessor, context) {
            return (0, cellOperations_1.copyCellRange)(context, 'down');
        }
    });
    //#endregion
    //#region Join/Split
    const SPLIT_CELL_COMMAND_ID = 'notebook.cell.split';
    const JOIN_SELECTED_CELLS_COMMAND_ID = 'notebook.cell.joinSelected';
    const JOIN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.joinAbove';
    const JOIN_CELL_BELOW_COMMAND_ID = 'notebook.cell.joinBelow';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: SPLIT_CELL_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.splitCell', "Split Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED.toNegated()),
                    order: 4 /* CellToolbarOrder.SplitCell */,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID
                },
                icon: icons.splitCellIcon,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 93 /* KeyCode.Backslash */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async runWithContext(accessor, context) {
            if (context.notebookEditor.isReadOnly) {
                return;
            }
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const cell = context.cell;
            const index = context.notebookEditor.getCellIndex(cell);
            const splitPoints = cell.focusMode === notebookBrowser_1.CellFocusMode.Container ? [{ lineNumber: 1, column: 1 }] : cell.getSelectionsStartPosition();
            if (splitPoints && splitPoints.length > 0) {
                await cell.resolveTextModel();
                if (!cell.hasModel()) {
                    return;
                }
                const newLinesContents = (0, cellOperations_1.computeCellLinesContents)(cell, splitPoints);
                if (newLinesContents) {
                    const language = cell.language;
                    const kind = cell.cellKind;
                    const mime = cell.mime;
                    const textModel = await cell.resolveTextModel();
                    await bulkEditService.apply([
                        new bulkEditService_1.ResourceTextEdit(cell.uri, { range: textModel.getFullModelRange(), text: newLinesContents[0] }),
                        new bulkCellEdits_1.ResourceNotebookCellEdit(context.notebookEditor.textModel.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index + 1,
                            count: 0,
                            cells: newLinesContents.slice(1).map(line => ({
                                cellKind: kind,
                                language,
                                mime,
                                source: line,
                                outputs: [],
                                metadata: {}
                            }))
                        })
                    ], { quotableLabel: 'Split Notebook Cell' });
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: JOIN_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.joinCellAbove', "Join With Previous Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 40 /* KeyCode.KeyJ */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 10
                }
            });
        }
        async runWithContext(accessor, context) {
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            return (0, cellOperations_1.joinCellsWithSurrounds)(bulkEditService, context, 'above');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: JOIN_CELL_BELOW_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.joinCellBelow', "Join With Next Cell"),
                keybinding: {
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 40 /* KeyCode.KeyJ */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 11
                }
            });
        }
        async runWithContext(accessor, context) {
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            return (0, cellOperations_1.joinCellsWithSurrounds)(bulkEditService, context, 'below');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: JOIN_SELECTED_CELLS_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.joinSelectedCells', "Join Selected Cells"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                    order: 12
                }
            });
        }
        async runWithContext(accessor, context) {
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const notificationService = accessor.get(notification_1.INotificationService);
            return (0, cellOperations_1.joinSelectedCells)(bulkEditService, notificationService, context);
        }
    });
    //#endregion
    //#region Change Cell Type
    const CHANGE_CELL_TO_CODE_COMMAND_ID = 'notebook.cell.changeToCode';
    const CHANGE_CELL_TO_MARKDOWN_COMMAND_ID = 'notebook.cell.changeToMarkdown';
    (0, actions_1.registerAction2)(class ChangeCellToCodeAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CHANGE_CELL_TO_CODE_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.changeCellToCode', "Change Cell to Code"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED.toNegated()),
                    primary: 55 /* KeyCode.KeyY */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('markup')),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                }
            });
        }
        async runWithContext(accessor, context) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Code, context);
        }
    });
    (0, actions_1.registerAction2)(class ChangeCellToMarkdownAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: CHANGE_CELL_TO_MARKDOWN_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.changeCellToMarkdown', "Change Cell to Markdown"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_OUTPUT_FOCUSED.toNegated()),
                    primary: 43 /* KeyCode.KeyM */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code')),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_TYPE.isEqualTo('code')),
                    group: "3_edit" /* CellOverflowToolbarGroups.Edit */,
                }
            });
        }
        async runWithContext(accessor, context) {
            await (0, cellOperations_1.changeCellToKind)(notebookCommon_1.CellKind.Markup, context, 'markdown', mime_1.Mimes.markdown);
        }
    });
    //#endregion
    //#region Collapse Cell
    const COLLAPSE_CELL_INPUT_COMMAND_ID = 'notebook.cell.collapseCellInput';
    const COLLAPSE_CELL_OUTPUT_COMMAND_ID = 'notebook.cell.collapseCellOutput';
    const COLLAPSE_ALL_CELL_INPUTS_COMMAND_ID = 'notebook.cell.collapseAllCellInputs';
    const EXPAND_ALL_CELL_INPUTS_COMMAND_ID = 'notebook.cell.expandAllCellInputs';
    const COLLAPSE_ALL_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.collapseAllCellOutputs';
    const EXPAND_ALL_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.expandAllCellOutputs';
    const TOGGLE_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.toggleOutputs';
    const TOGGLE_CELL_OUTPUT_SCROLLING = 'notebook.cell.toggleOutputScrolling';
    exports.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID = 'notebook.cell.openFailureActions';
    (0, actions_1.registerAction2)(class CollapseCellInputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_CELL_INPUT_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.collapseCellInput', "Collapse Cell Input"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED.toNegated(), contextkeys_1.InputFocusedContext.toNegated()),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isInputCollapsed = true;
            }
            else {
                context.selectedCells.forEach(cell => cell.isInputCollapsed = true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExpandCellInputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXPAND_CELL_INPUT_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.expandCellInput', "Expand Cell Input"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isInputCollapsed = false;
            }
            else {
                context.selectedCells.forEach(cell => cell.isInputCollapsed = false);
            }
        }
    });
    (0, actions_1.registerAction2)(class CollapseCellOutputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_CELL_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.collapseCellOutput', "Collapse Cell Output"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_OUTPUT_COLLAPSED.toNegated(), contextkeys_1.InputFocusedContext.toNegated(), notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 50 /* KeyCode.KeyT */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isOutputCollapsed = true;
            }
            else {
                context.selectedCells.forEach(cell => cell.isOutputCollapsed = true);
            }
        }
    });
    (0, actions_1.registerAction2)(class ExpandCellOuputAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: notebookBrowser_1.EXPAND_CELL_OUTPUT_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.expandCellOutput', "Expand Cell Output"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_OUTPUT_COLLAPSED),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 50 /* KeyCode.KeyT */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            if (context.ui) {
                context.cell.isOutputCollapsed = false;
            }
            else {
                context.selectedCells.forEach(cell => cell.isOutputCollapsed = false);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: TOGGLE_CELL_OUTPUTS_COMMAND_ID,
                precondition: notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED,
                title: (0, nls_1.localize2)('notebookActions.toggleOutputs', "Toggle Outputs"),
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.toggleOutputs', "Toggle Outputs"),
                    args: coreActions_1.cellExecutionArgs
                }
            });
        }
        parseArgs(accessor, ...args) {
            return (0, coreActions_1.parseMultiCellExecutionArgs)(accessor, ...args);
        }
        async runWithContext(accessor, context) {
            let cells = [];
            if (context.ui) {
                cells = [context.cell];
            }
            else if (context.selectedCells) {
                cells = context.selectedCells;
            }
            for (const cell of cells) {
                cell.isOutputCollapsed = !cell.isOutputCollapsed;
            }
        }
    });
    (0, actions_1.registerAction2)(class CollapseAllCellInputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_ALL_CELL_INPUTS_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.collapseAllCellInput', "Collapse All Cell Inputs"),
                f1: true,
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isInputCollapsed = true);
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllCellInputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXPAND_ALL_CELL_INPUTS_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.expandAllCellInput', "Expand All Cell Inputs"),
                f1: true
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isInputCollapsed = false);
        }
    });
    (0, actions_1.registerAction2)(class CollapseAllCellOutputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: COLLAPSE_ALL_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.collapseAllCellOutput', "Collapse All Cell Outputs"),
                f1: true,
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isOutputCollapsed = true);
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllCellOutputsAction extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: EXPAND_ALL_CELL_OUTPUTS_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.expandAllCellOutput', "Expand All Cell Outputs"),
                f1: true
            });
        }
        async runWithContext(accessor, context) {
            forEachCell(context.notebookEditor, cell => cell.isOutputCollapsed = false);
        }
    });
    (0, actions_1.registerAction2)(class ToggleCellOutputScrolling extends coreActions_1.NotebookMultiCellAction {
        constructor() {
            super({
                id: TOGGLE_CELL_OUTPUT_SCROLLING,
                title: (0, nls_1.localize2)('notebookActions.toggleScrolling', "Toggle Scroll Cell Output"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_LIST_FOCUSED, contextkeys_1.InputFocusedContext.toNegated(), notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS),
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 55 /* KeyCode.KeyY */),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        toggleOutputScrolling(viewModel, globalScrollSetting, collapsed) {
            const cellMetadata = viewModel.model.metadata;
            // TODO: when is cellMetadata undefined? Is that a case we need to support? It is currently a read-only property.
            if (cellMetadata) {
                const currentlyEnabled = cellMetadata['scrollable'] !== undefined ? cellMetadata['scrollable'] : globalScrollSetting;
                const shouldEnableScrolling = collapsed || !currentlyEnabled;
                cellMetadata['scrollable'] = shouldEnableScrolling;
                viewModel.resetRenderer();
            }
        }
        async runWithContext(accessor, context) {
            const globalScrolling = accessor.get(configuration_1.IConfigurationService).getValue(notebookCommon_1.NotebookSetting.outputScrolling);
            if (context.ui) {
                context.cell.outputsViewModels.forEach((viewModel) => {
                    this.toggleOutputScrolling(viewModel, globalScrolling, context.cell.isOutputCollapsed);
                });
                context.cell.isOutputCollapsed = false;
            }
            else {
                context.selectedCells.forEach(cell => {
                    cell.outputsViewModels.forEach((viewModel) => {
                        this.toggleOutputScrolling(viewModel, globalScrolling, cell.isOutputCollapsed);
                    });
                    cell.isOutputCollapsed = false;
                });
            }
        }
    });
    (0, actions_1.registerAction2)(class ExpandAllCellOutputsAction extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: exports.OPEN_CELL_FAILURE_ACTIONS_COMMAND_ID,
                title: (0, nls_1.localize2)('notebookActions.cellFailureActions', "Show Cell Failure Actions"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.toNegated()),
                f1: true,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_CELL_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_HAS_ERROR_DIAGNOSTICS, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.toNegated()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            if (context.cell instanceof codeCellViewModel_1.CodeCellViewModel) {
                const error = context.cell.cellDiagnostics.ErrorDetails;
                if (error?.location) {
                    const location = range_1.Range.lift({
                        startLineNumber: error.location.startLineNumber + 1,
                        startColumn: error.location.startColumn + 1,
                        endLineNumber: error.location.endLineNumber + 1,
                        endColumn: error.location.endColumn + 1
                    });
                    context.notebookEditor.setCellEditorSelection(context.cell, range_1.Range.lift(location));
                    const editor = (0, coreActions_1.findTargetCellEditor)(context, context.cell);
                    if (editor) {
                        const controller = codeActionController_1.CodeActionController.get(editor);
                        controller?.manualTriggerAtCurrentPosition((0, nls_1.localize)('cellCommands.quickFix.noneMessage', "No code actions available"), types_1.CodeActionTriggerSource.Default, { include: types_1.CodeActionKind.QuickFix });
                    }
                }
            }
        }
    });
    //#endregion
    function forEachCell(editor, callback) {
        for (let i = 0; i < editor.getLength(); i++) {
            const cell = editor.cellAt(i);
            callback(cell, i);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENvbW1hbmRzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyaWIvY2VsbENvbW1hbmRzL2NlbGxDb21tYW5kcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEwQmhHLHlCQUF5QjtJQUN6QixNQUFNLHVCQUF1QixHQUFHLHNCQUFzQixDQUFDO0lBQ3ZELE1BQU0seUJBQXlCLEdBQUcsd0JBQXdCLENBQUM7SUFDM0QsTUFBTSx1QkFBdUIsR0FBRyxzQkFBc0IsQ0FBQztJQUN2RCxNQUFNLHlCQUF5QixHQUFHLHdCQUF3QixDQUFDO0lBRTNELElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsZ0NBQWtCO1FBQy9DO1lBQ0MsS0FBSyxDQUNKO2dCQUNDLEVBQUUsRUFBRSx1QkFBdUI7Z0JBQzNCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw0QkFBNEIsRUFBRSxjQUFjLENBQUM7Z0JBQzlELElBQUksRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDdEIsVUFBVSxFQUFFO29CQUNYLE9BQU8sRUFBRSwrQ0FBNEI7b0JBQ3JDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyw2Q0FBdUIsRUFBRSxpQ0FBbUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztvQkFDbEYsTUFBTSw2Q0FBbUM7aUJBQ3pDO2dCQUNELElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxpQkFBaUI7b0JBQzVCLElBQUksRUFBRSwyQkFBYyxDQUFDLE1BQU0sQ0FBQyxvQ0FBb0MsRUFBRSxLQUFLLENBQUM7b0JBQ3hFLEtBQUssK0NBQWdDO29CQUNyQyxLQUFLLEVBQUUsRUFBRTtpQkFDVDthQUNELENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCxLQUFLLENB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