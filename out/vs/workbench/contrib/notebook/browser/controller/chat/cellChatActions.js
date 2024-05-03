/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatContext", "vs/workbench/contrib/notebook/browser/controller/chat/notebookChatController", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, codicons_1, keyCodes_1, editorContextKeys_1, nls_1, accessibility_1, actions_1, contextkey_1, contextkeys_1, inlineChat_1, notebookChatContext_1, notebookChatController_1, coreActions_1, notebookBrowser_1, notebookCommon_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.accept',
                title: (0, nls_1.localize2)('notebook.cell.chat.accept', "Make Request"),
                icon: codicons_1.Codicon.send,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 3 /* KeyCode.Enter */
                },
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_INPUT,
                    group: 'navigation',
                    order: 1,
                    when: notebookChatContext_1.CTX_NOTEBOOK_CHAT_HAS_ACTIVE_REQUEST.negate()
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.acceptInput();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.arrowOutUp',
                title: (0, nls_1.localize)('arrowUp', 'Cursor Up'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_FIRST, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */
                }
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
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.arrowOutDown',
                title: (0, nls_1.localize)('arrowDown', 'Cursor Down'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_LAST, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                }
            });
        }
        async runWithContext(accessor, context) {
            await notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNext();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.focusChatWidget',
                title: (0, nls_1.localize)('focusChatWidget', 'Focus Chat Widget'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('bottom'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */
                }
            });
        }
        async runWithContext(accessor, context) {
            const index = context.notebookEditor.getCellIndex(context.cell);
            await notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNearestWidget(index, 'above');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.focusNextChatWidget',
                title: (0, nls_1.localize)('focusNextChatWidget', 'Focus Next Cell Chat Widget'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('top'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 7,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                }
            });
        }
        async runWithContext(accessor, context) {
            const index = context.notebookEditor.getCellIndex(context.cell);
            await notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNearestWidget(index, 'below');
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.stop',
                title: (0, nls_1.localize2)('notebook.cell.chat.stop', "Stop Request"),
                icon: codicons_1.Codicon.debugStop,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_INPUT,
                    group: 'navigation',
                    order: 1,
                    when: notebookChatContext_1.CTX_NOTEBOOK_CHAT_HAS_ACTIVE_REQUEST
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.cancelCurrentRequest(false);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.close',
                title: (0, nls_1.localize2)('notebook.cell.chat.close', "Close Chat"),
                icon: codicons_1.Codicon.close,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET,
                    group: 'navigation',
                    order: 2
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.dismiss(false);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.acceptChanges',
                title: (0, nls_1.localize2)('apply1', "Accept Changes"),
                shortTitle: (0, nls_1.localize)('apply2', 'Accept'),
                icon: codicons_1.Codicon.check,
                tooltip: (0, nls_1.localize)('apply3', 'Accept Changes'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                        weight: 100 /* KeybindingWeight.EditorContrib */ + 10,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookChatContext_1.CTX_NOTEBOOK_CHAT_USER_DID_EDIT, notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                        weight: 0 /* KeybindingWeight.EditorCore */ + 10,
                        primary: 9 /* KeyCode.Escape */
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate(), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('below')),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
                menu: [
                    {
                        id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_STATUS,
                        group: 'inline',
                        order: 0,
                        when: inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */),
                    }
                ]
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.acceptSession();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.discard',
                title: (0, nls_1.localize)('discard', 'Discard'),
                icon: codicons_1.Codicon.discard,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED, notebookChatContext_1.CTX_NOTEBOOK_CHAT_USER_DID_EDIT.negate(), notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.negate()),
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_STATUS,
                    group: 'main',
                    order: 1
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.discard();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.feedbackHelpful',
                title: (0, nls_1.localize)('feedback.helpful', 'Helpful'),
                icon: codicons_1.Codicon.thumbsup,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK,
                    group: 'inline',
                    order: 1,
                    when: inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.notEqualsTo(undefined),
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.feedbackLast(1 /* InlineChatResponseFeedbackKind.Helpful */);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.feedbackUnhelpful',
                title: (0, nls_1.localize)('feedback.unhelpful', 'Unhelpful'),
                icon: codicons_1.Codicon.thumbsdown,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK,
                    group: 'inline',
                    order: 2,
                    when: inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.notEqualsTo(undefined),
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.feedbackLast(0 /* InlineChatResponseFeedbackKind.Unhelpful */);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.reportIssueForBug',
                title: (0, nls_1.localize)('feedback.reportIssueForBug', 'Report Issue'),
                icon: codicons_1.Codicon.report,
                menu: {
                    id: notebookChatContext_1.MENU_CELL_CHAT_WIDGET_FEEDBACK,
                    group: 'inline',
                    order: 3,
                    when: inlineChat_1.CTX_INLINE_CHAT_LAST_RESPONSE_TYPE.notEqualsTo(undefined),
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.feedbackLast(4 /* InlineChatResponseFeedbackKind.Bug */);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.start',
                title: {
                    value: '$(sparkle) ' + (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat', "Generate"),
                    original: '$(sparkle) Generate',
                },
                tooltip: (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat.tooltip', "Start Chat to Generate Code"),
                metadata: {
                    description: (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat.tooltip', "Start Chat to Generate Code"),
                    args: [
                        {
                            name: 'args',
                            schema: {
                                type: 'object',
                                required: ['index'],
                                properties: {
                                    'index': {
                                        type: 'number'
                                    },
                                    'input': {
                                        type: 'string'
                                    },
                                    'autoSend': {
                                        type: 'boolean'
                                    }
                                }
                            }
                        }
                    ]
                },
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true)),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
                    secondary: [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 39 /* KeyCode.KeyI */)],
                },
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellBetween,
                        group: 'inline',
                        order: -1,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true))
                    }
                ]
            });
        }
        getEditorContextFromArgsOrActive(accessor, ...args) {
            const [firstArg] = args;
            if (!firstArg) {
                const notebookEditor = (0, coreActions_1.getEditorFromArgsOrActivePane)(accessor);
                if (!notebookEditor) {
                    return undefined;
                }
                const activeCell = notebookEditor.getActiveCell();
                if (!activeCell) {
                    return undefined;
                }
                return {
                    cell: activeCell,
                    notebookEditor,
                    input: undefined,
                    autoSend: undefined
                };
            }
            if (typeof firstArg !== 'object' || typeof firstArg.index !== 'number') {
                return undefined;
            }
            const notebookEditor = (0, coreActions_1.getEditorFromArgsOrActivePane)(accessor);
            if (!notebookEditor) {
                return undefined;
            }
            const cell = firstArg.index <= 0 ? undefined : notebookEditor.cellAt(firstArg.index - 1);
            return {
                cell,
                notebookEditor,
                input: firstArg.input,
                autoSend: firstArg.autoSend
            };
        }
        async runWithContext(accessor, context) {
            const index = Math.max(0, context.cell ? context.notebookEditor.getCellIndex(context.cell) + 1 : 0);
            context.notebookEditor.focusContainer();
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.run(index, context.input, context.autoSend);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.startAtTop',
                title: {
                    value: '$(sparkle) ' + (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat', "Generate"),
                    original: '$(sparkle) Generate',
                },
                tooltip: (0, nls_1.localize)('notebookActions.menu.insertCodeCellWithChat.tooltip', "Start Chat to Generate Code"),
                f1: false,
                menu: [
                    {
                        id: actions_1.MenuId.NotebookCellListTop,
                        group: 'inline',
                        order: -1,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true))
                    },
                ]
            });
        }
        async runWithContext(accessor, context) {
            context.notebookEditor.focusContainer();
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.run(0, '', false);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.NotebookToolbar, {
        command: {
            id: 'notebook.cell.chat.start',
            icon: codicons_1.Codicon.sparkle,
            title: (0, nls_1.localize)('notebookActions.menu.insertCode.ontoolbar', "Generate"),
            tooltip: (0, nls_1.localize)('notebookActions.menu.insertCode.tooltip', "Start Chat to Generate Code")
        },
        order: -10,
        group: 'navigation/add',
        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'betweenCells'), contextkey_1.ContextKeyExpr.notEquals('config.notebook.insertToolbarLocation', 'hidden'), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true))
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.focus',
                title: (0, nls_1.localize)('focusNotebookChat', 'Focus Chat'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('above')),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), notebookChatContext_1.CTX_NOTEBOOK_CHAT_OUTER_FOCUS_POSITION.isEqualTo('below')),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.focusNextCell',
                title: (0, nls_1.localize)('focusNextCell', 'Focus Next Cell'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusNext();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.focusPreviousCell',
                title: (0, nls_1.localize)('focusPreviousCell', 'Focus Previous Cell'),
                keybinding: [
                    {
                        when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                ],
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.focusAbove();
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.previousFromHistory',
                title: (0, nls_1.localize2)('notebook.cell.chat.previousFromHistory', "Previous From History"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 10,
                    primary: 16 /* KeyCode.UpArrow */,
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.populateHistory(true);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.nextFromHistory',
                title: (0, nls_1.localize2)('notebook.cell.chat.nextFromHistory', "Next From History"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookChatContext_1.CTX_NOTEBOOK_CELL_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED),
                    weight: 0 /* KeybindingWeight.EditorCore */ + 10,
                    primary: 18 /* KeyCode.DownArrow */
                }
            });
        }
        async runWithContext(accessor, context) {
            notebookChatController_1.NotebookChatController.get(context.notebookEditor)?.populateHistory(false);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: 'notebook.cell.chat.restore',
                title: (0, nls_1.localize2)('notebookActions.restoreCellprompt', "Generate"),
                icon: codicons_1.Codicon.sparkle,
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    group: coreActions_1.CELL_TITLE_CELL_GROUP_ID,
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.isEqualTo(true), inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, notebookContextKeys_1.NOTEBOOK_CELL_GENERATED_BY_CHAT, contextkey_1.ContextKeyExpr.equals(`config.${notebookCommon_1.NotebookSetting.cellChat}`, true))
                }
            });
        }
        async runWithContext(accessor, context) {
            const cell = context.cell;
            if (!cell) {
                return;
            }
            const notebookEditor = context.notebookEditor;
            const controller = notebookChatController_1.NotebookChatController.get(notebookEditor);
            if (!controller) {
                return;
            }
            const prompt = controller.getPromptFromCache(cell);
            if (prompt) {
                controller.restore(cell, prompt);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbENoYXRBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9ub3RlYm9vay9icm93c2VyL2NvbnRyb2xsZXIvY2hhdC9jZWxsQ2hhdEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFxQmhHLElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsNEJBQWM7UUFDM0M7WUFDQyxLQUFLLENBQ0o7Z0JBQ0MsRUFBRSxFQUFFLDJCQUEyQjtnQkFDL0IsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDJCQUEyQixFQUFFLGNBQWMsQ0FBQztnQkFDN0QsSUFBSSxFQUFFLGtCQUFPLENBQUMsSUFBSTtnQkFDbEIsVUFBVSxFQUFFO29CQUNYLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyxvREFBOEIsRUFBRSxvQ0FBdUIsRUFBRSxrREFBNEIsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDeEgsTUFBTSw2Q0FBbUM7b0JBQ3pDLE9BQU8sdUJBQWU7aUJBQ3RCO2dCQUNELElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsMENBQW9CO29CQUN4QixLQUFLLEVBQUUsWUFBWTtvQkFDbkIsS0FBSyxFQUFFLENBQUM7b0JBQ1IsSUFBSSxFQUFFLDBEQUFvQyxDQUFDLE1BQU0sRUFBRTtpQkFDbkQ7YUFDRCxDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUEwQixFQUFFLE9BQStCO1lBQy9FLCtDQUFzQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDbkUsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEseUJBQWUsRUFBQyxLQUFNLFNBQVEsZ0NBQWtCO1FBQy9DO1lBQ0MsS0FB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