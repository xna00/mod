/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/keyCodes", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/widget/diffEditor/embeddedDiffEditorWidget", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/base/common/date", "./inlineChatSessionService", "vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp", "vs/platform/accessibility/common/accessibility", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/preferences/common/preferences", "vs/platform/log/common/log", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatAgents"], function (require, exports, codicons_1, keyCodes_1, editorBrowser_1, editorExtensions_1, embeddedDiffEditorWidget_1, embeddedCodeEditorWidget_1, editorContextKeys_1, inlineChatController_1, inlineChat_1, nls_1, actions_1, clipboardService_1, contextkey_1, instantiation_1, quickInput_1, editorService_1, codeEditorService_1, date_1, inlineChatSessionService_1, chatAccessibilityHelp_1, accessibility_1, lifecycle_1, commands_1, accessibleViewActions_1, iconRegistry_1, preferences_1, log_1, chatContextKeys_1, chatAgents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineAccessibilityHelpContribution = exports.ViewInChatAction = exports.CopyRecordings = exports.MoveToPreviousHunk = exports.MoveToNextHunk = exports.ConfigureInlineChatAction = exports.CloseAction = exports.CancelSessionAction = exports.AcceptChanges = exports.ReportIssueForBugCommand = exports.ToggleDiffForChange = exports.DiscardUndoToNewFileAction = exports.DiscardToClipboardAction = exports.DiscardAction = exports.DiscardHunkAction = exports.FocusInlineChat = exports.ArrowOutDownAction = exports.ArrowOutUpAction = exports.ReRunRequestWithIntentDetectionAction = exports.ReRunRequestAction = exports.AbstractInlineChatAction = exports.UnstashSessionAction = exports.StartSessionAction = exports.START_INLINE_CHAT = exports.LOCALIZED_START_INLINE_CHAT_STRING = void 0;
    exports.setHoldForSpeech = setHoldForSpeech;
    commands_1.CommandsRegistry.registerCommandAlias('interactiveEditor.start', 'inlineChat.start');
    commands_1.CommandsRegistry.registerCommandAlias('interactive.acceptChanges', inlineChat_1.ACTION_ACCEPT_CHANGES);
    exports.LOCALIZED_START_INLINE_CHAT_STRING = (0, nls_1.localize2)('run', 'Start in Editor');
    exports.START_INLINE_CHAT = (0, iconRegistry_1.registerIcon)('start-inline-chat', codicons_1.Codicon.sparkle, (0, nls_1.localize)('startInlineChat', 'Icon which spawns the inline chat from the editor toolbar.'));
    let _holdForSpeech = undefined;
    function setHoldForSpeech(holdForSpeech) {
        _holdForSpeech = holdForSpeech;
    }
    class StartSessionAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.start',
                title: exports.LOCALIZED_START_INLINE_CHAT_STRING,
                category: AbstractInlineChatAction.category,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, editorContextKeys_1.EditorContextKeys.writable),
                keybinding: {
                    when: editorContextKeys_1.EditorContextKeys.focus,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */,
                    secondary: [(0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 39 /* KeyCode.KeyI */)],
                },
                icon: exports.START_INLINE_CHAT
            });
        }
        runEditorCommand(accessor, editor, ..._args) {
            const ctrl = inlineChatController_1.InlineChatController.get(editor);
            if (!ctrl) {
                return;
            }
            if (_holdForSpeech) {
                accessor.get(instantiation_1.IInstantiationService).invokeFunction(_holdForSpeech, ctrl, this);
            }
            let options;
            const arg = _args[0];
            if (arg && inlineChatController_1.InlineChatRunOptions.isInteractiveEditorOptions(arg)) {
                options = arg;
            }
            inlineChatController_1.InlineChatController.get(editor)?.run({ ...options });
        }
    }
    exports.StartSessionAction = StartSessionAction;
    class UnstashSessionAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.unstash',
                title: (0, nls_1.localize2)('unstash', "Resume Last Dismissed Inline Chat"),
                category: AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_HAS_STASHED_SESSION, editorContextKeys_1.EditorContextKeys.writable),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 56 /* KeyCode.KeyZ */,
                }
            });
        }
        async runEditorCommand(_accessor, editor, ..._args) {
            const ctrl = inlineChatController_1.InlineChatController.get(editor);
            if (ctrl) {
                const session = ctrl.unstashLastSession();
                if (session) {
                    ctrl.run({
                        existingSession: session,
                        isUnstashed: true
                    });
                }
            }
        }
    }
    exports.UnstashSessionAction = UnstashSessionAction;
    class AbstractInlineChatAction extends editorExtensions_1.EditorAction2 {
        static { this.category = (0, nls_1.localize2)('cat', "Inline Chat"); }
        constructor(desc) {
            super({
                ...desc,
                category: AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_HAS_PROVIDER, desc.precondition)
            });
        }
        runEditorCommand(accessor, editor, ..._args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const logService = accessor.get(log_1.ILogService);
            let ctrl = inlineChatController_1.InlineChatController.get(editor);
            if (!ctrl) {
                const { activeTextEditorControl } = editorService;
                if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                    editor = activeTextEditorControl;
                }
                else if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                    editor = activeTextEditorControl.getModifiedEditor();
                }
                ctrl = inlineChatController_1.InlineChatController.get(editor);
            }
            if (!ctrl) {
                logService.warn('[IE] NO controller found for action', this.desc.id, editor.getModel()?.uri);
                return;
            }
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                editor = editor.getParentEditor();
            }
            if (!ctrl) {
                for (const diffEditor of accessor.get(codeEditorService_1.ICodeEditorService).listDiffEditors()) {
                    if (diffEditor.getOriginalEditor() === editor || diffEditor.getModifiedEditor() === editor) {
                        if (diffEditor instanceof embeddedDiffEditorWidget_1.EmbeddedDiffEditorWidget) {
                            this.runEditorCommand(accessor, diffEditor.getParentEditor(), ..._args);
                        }
                    }
                }
                return;
            }
            this.runInlineChatCommand(accessor, ctrl, editor, ..._args);
        }
    }
    exports.AbstractInlineChatAction = AbstractInlineChatAction;
    const CHAT_REGENERATE_MENU = actions_1.MenuId.for('inlineChat.response.rerun');
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ChatMessageTitle, {
        submenu: CHAT_REGENERATE_MENU,
        title: (0, nls_1.localize)('reunmenu', "Regenerate..."),
        icon: codicons_1.Codicon.refresh,
        group: 'navigation',
        order: -10,
        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Editor))
    });
    class ReRunRequestAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_REGENERATE_RESPONSE,
                title: (0, nls_1.localize)('rerun', 'Regenerate Response'),
                shortTitle: (0, nls_1.localize)('rerunShort', 'Regenerate'),
                icon: codicons_1.Codicon.refresh,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_EMPTY.negate(), inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("empty" /* InlineChatResponseTypes.Empty */)),
                menu: [{
                        id: CHAT_REGENERATE_MENU,
                        group: 'navigation',
                        order: -120,
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Editor))
                    }]
            });
        }
        runInlineChatCommand(_accessor, ctrl) {
            ctrl.rerun({ retry: true });
        }
    }
    exports.ReRunRequestAction = ReRunRequestAction;
    class ReRunRequestWithIntentDetectionAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.rerunWithIntentDetection',
                title: (0, nls_1.localize)('rerunWithout', 'Regenerate without Command Detection'),
                icon: codicons_1.Codicon.debugRestartFrame,
                menu: {
                    id: CHAT_REGENERATE_MENU,
                    group: 'navigation',
                    order: -100,
                    when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_RESPONSE_DETECTED_AGENT_COMMAND, chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_CHAT_LOCATION.isEqualTo(chatAgents_1.ChatAgentLocation.Editor))
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl) {
            ctrl.rerun({ withoutIntentDetection: true });
        }
    }
    exports.ReRunRequestWithIntentDetectionAction = ReRunRequestWithIntentDetectionAction;
    class ArrowOutUpAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.arrowOutUp',
                title: (0, nls_1.localize)('arrowUp', 'Cursor Up'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_FIRST, editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                keybinding: {
                    weight: 0 /* KeybindingWeight.EditorCore */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.arrowOut(true);
        }
    }
    exports.ArrowOutUpAction = ArrowOutUpAction;
    class ArrowOutDownAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.arrowOutDown',
                title: (0, nls_1.localize)('arrowDown', 'Cursor Down'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_INNER_CURSOR_LAST, editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                keybinding: {
                    weight: 0 /* KeybindingWeight.EditorCore */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.arrowOut(false);
        }
    }
    exports.ArrowOutDownAction = ArrowOutDownAction;
    class FocusInlineChat extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: 'inlineChat.focus',
                title: (0, nls_1.localize2)('focus', "Focus Input"),
                f1: true,
                category: AbstractInlineChatAction.category,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_FOCUSED.negate(), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                keybinding: [{
                        weight: 0 /* KeybindingWeight.EditorCore */ + 10, // win against core_command
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_OUTER_CURSOR_POSITION.isEqualTo('above'), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                    }, {
                        weight: 0 /* KeybindingWeight.EditorCore */ + 10, // win against core_command
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_OUTER_CURSOR_POSITION.isEqualTo('below'), editorContextKeys_1.EditorContextKeys.isEmbeddedDiffEditor.negate()),
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                    }]
            });
        }
        runEditorCommand(_accessor, editor, ..._args) {
            inlineChatController_1.InlineChatController.get(editor)?.focus();
        }
    }
    exports.FocusInlineChat = FocusInlineChat;
    class DiscardHunkAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discardHunkChange',
                title: (0, nls_1.localize)('discard', 'Discard'),
                icon: codicons_1.Codicon.clearAll,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */), inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("live" /* EditMode.Live */)),
                    group: '0_main',
                    order: 3
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            return ctrl.discardHunk();
        }
    }
    exports.DiscardHunkAction = DiscardHunkAction;
    actions_1.MenuRegistry.appendMenuItem(inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS, {
        submenu: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
        title: (0, nls_1.localize)('discardMenu', "Discard..."),
        icon: codicons_1.Codicon.discard,
        group: '0_main',
        order: 2,
        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.notEqualsTo("preview" /* EditMode.Preview */), inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.notEqualsTo("live" /* EditMode.Live */), inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */)),
        rememberDefaultAction: true
    });
    class DiscardAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discard',
                title: (0, nls_1.localize)('discard', 'Discard'),
                icon: codicons_1.Codicon.discard,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 1,
                    primary: 9 /* KeyCode.Escape */,
                    when: inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.negate()
                },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
                    group: '0_main',
                    order: 0
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            await ctrl.cancelSession();
        }
    }
    exports.DiscardAction = DiscardAction;
    class DiscardToClipboardAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discardToClipboard',
                title: (0, nls_1.localize)('undo.clipboard', 'Discard to Clipboard'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_DID_EDIT),
                // keybinding: {
                // 	weight: KeybindingWeight.EditorContrib + 10,
                // 	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ,
                // 	mac: { primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyZ },
                // },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
                    group: '0_main',
                    order: 1
                }
            });
        }
        async runInlineChatCommand(accessor, ctrl) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const changedText = await ctrl.cancelSession();
            if (changedText !== undefined) {
                clipboardService.writeText(changedText);
            }
        }
    }
    exports.DiscardToClipboardAction = DiscardToClipboardAction;
    class DiscardUndoToNewFileAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.discardToFile',
                title: (0, nls_1.localize)('undo.newfile', 'Discard to New File'),
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_DID_EDIT),
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_DISCARD,
                    group: '0_main',
                    order: 2
                }
            });
        }
        async runInlineChatCommand(accessor, ctrl, editor, ..._args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const changedText = await ctrl.cancelSession();
            if (changedText !== undefined) {
                const input = { forceUntitled: true, resource: undefined, contents: changedText, languageId: editor.getModel()?.getLanguageId() };
                editorService.openEditor(input, editorService_1.SIDE_GROUP);
            }
        }
    }
    exports.DiscardUndoToNewFileAction = DiscardUndoToNewFileAction;
    class ToggleDiffForChange extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_TOGGLE_DIFF,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("live" /* EditMode.Live */), inlineChat_1.CTX_INLINE_CHAT_CHANGE_HAS_DIFF),
                title: (0, nls_1.localize2)('showChanges', 'Toggle Changes'),
                icon: codicons_1.Codicon.diffSingle,
                toggled: {
                    condition: inlineChat_1.CTX_INLINE_CHAT_CHANGE_SHOWS_DIFF,
                },
                menu: [
                    {
                        id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                        group: '1_main',
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("live" /* EditMode.Live */), inlineChat_1.CTX_INLINE_CHAT_CHANGE_HAS_DIFF)
                    }
                ]
            });
        }
        runInlineChatCommand(accessor, ctrl) {
            ctrl.toggleDiff();
        }
    }
    exports.ToggleDiffForChange = ToggleDiffForChange;
    class ReportIssueForBugCommand extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.reportIssueForBug',
                title: (0, nls_1.localize)('feedback.reportIssueForBug', 'Report Issue'),
                icon: codicons_1.Codicon.report,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("empty" /* InlineChatResponseTypes.Empty */)),
                menu: [{
                        id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_FEEDBACK,
                        when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_SUPPORT_ISSUE_REPORTING, inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("empty" /* InlineChatResponseTypes.Empty */)),
                        group: '2_feedback',
                        order: 3
                    }]
            });
        }
        runInlineChatCommand(_accessor, ctrl) {
            ctrl.feedbackLast(4 /* InlineChatResponseFeedbackKind.Bug */);
        }
    }
    exports.ReportIssueForBugCommand = ReportIssueForBugCommand;
    class AcceptChanges extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_ACCEPT_CHANGES,
                title: (0, nls_1.localize2)('apply1', "Accept Changes"),
                shortTitle: (0, nls_1.localize)('apply2', 'Accept'),
                icon: codicons_1.Codicon.check,
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_DOCUMENT_CHANGED.toNegated(), inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.notEqualsTo("preview" /* EditMode.Preview */))),
                keybinding: [{
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    }],
                menu: {
                    when: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.notEqualsTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */)),
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    group: '0_main',
                    order: 0
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl) {
            ctrl.acceptHunk();
        }
    }
    exports.AcceptChanges = AcceptChanges;
    class CancelSessionAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.cancel',
                title: (0, nls_1.localize)('cancel', 'Cancel'),
                icon: codicons_1.Codicon.clearAll,
                precondition: contextkey_1.ContextKeyExpr.and(inlineChat_1.CTX_INLINE_CHAT_VISIBLE, inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("preview" /* EditMode.Preview */)),
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 1,
                    primary: 9 /* KeyCode.Escape */
                },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    when: inlineChat_1.CTX_INLINE_CHAT_EDIT_MODE.isEqualTo("preview" /* EditMode.Preview */),
                    group: '0_main',
                    order: 3
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.cancelSession();
        }
    }
    exports.CancelSessionAction = CancelSessionAction;
    class CloseAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.close',
                title: (0, nls_1.localize)('close', 'Close'),
                icon: codicons_1.Codicon.close,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */ - 1,
                    primary: 9 /* KeyCode.Escape */,
                    when: inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.negate()
                },
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET,
                    group: 'navigation',
                    order: 10,
                }
            });
        }
        async runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.cancelSession();
        }
    }
    exports.CloseAction = CloseAction;
    class ConfigureInlineChatAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.configure',
                title: (0, nls_1.localize)('configure', 'Configure '),
                icon: codicons_1.Codicon.settingsGear,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET,
                    group: 'config',
                    order: 1,
                }
            });
        }
        async runInlineChatCommand(accessor, ctrl, _editor, ..._args) {
            accessor.get(preferences_1.IPreferencesService).openSettings({ query: 'inlineChat' });
        }
    }
    exports.ConfigureInlineChatAction = ConfigureInlineChatAction;
    class MoveToNextHunk extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.moveToNextHunk',
                title: (0, nls_1.localize2)('moveToNextHunk', 'Move to Next Change'),
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 65 /* KeyCode.F7 */
                }
            });
        }
        runInlineChatCommand(accessor, ctrl, editor, ...args) {
            ctrl.moveHunk(true);
        }
    }
    exports.MoveToNextHunk = MoveToNextHunk;
    class MoveToPreviousHunk extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.moveToPreviousHunk',
                title: (0, nls_1.localize2)('moveToPreviousHunk', 'Move to Previous Change'),
                f1: true,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 1024 /* KeyMod.Shift */ | 65 /* KeyCode.F7 */
                }
            });
        }
        runInlineChatCommand(accessor, ctrl, editor, ...args) {
            ctrl.moveHunk(false);
        }
    }
    exports.MoveToPreviousHunk = MoveToPreviousHunk;
    class CopyRecordings extends AbstractInlineChatAction {
        constructor() {
            super({
                id: 'inlineChat.copyRecordings',
                f1: true,
                title: (0, nls_1.localize2)('copyRecordings', "(Developer) Write Exchange to Clipboard")
            });
        }
        async runInlineChatCommand(accessor) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const quickPickService = accessor.get(quickInput_1.IQuickInputService);
            const ieSessionService = accessor.get(inlineChatSessionService_1.IInlineChatSessionService);
            const recordings = ieSessionService.recordings().filter(r => r.exchanges.length > 0);
            if (recordings.length === 0) {
                return;
            }
            const picks = recordings.map(rec => {
                return {
                    rec,
                    label: (0, nls_1.localize)('label', "'{0}' and {1} follow ups ({2})", rec.exchanges[0].prompt, rec.exchanges.length - 1, (0, date_1.fromNow)(rec.when, true)),
                    tooltip: rec.exchanges.map(ex => ex.prompt).join('\n'),
                };
            });
            const pick = await quickPickService.pick(picks, { canPickMany: false });
            if (pick) {
                clipboardService.writeText(JSON.stringify(pick.rec, undefined, 2));
            }
        }
    }
    exports.CopyRecordings = CopyRecordings;
    class ViewInChatAction extends AbstractInlineChatAction {
        constructor() {
            super({
                id: inlineChat_1.ACTION_VIEW_IN_CHAT,
                title: (0, nls_1.localize)('viewInChat', 'View in Chat'),
                icon: codicons_1.Codicon.commentDiscussion,
                precondition: inlineChat_1.CTX_INLINE_CHAT_VISIBLE,
                menu: {
                    id: inlineChat_1.MENU_INLINE_CHAT_WIDGET_STATUS,
                    when: inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.isEqualTo("onlyMessages" /* InlineChatResponseTypes.OnlyMessages */),
                    group: '0_main',
                    order: 1
                }
            });
        }
        runInlineChatCommand(_accessor, ctrl, _editor, ..._args) {
            ctrl.viewInChat();
        }
    }
    exports.ViewInChatAction = ViewInChatAction;
    class InlineAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(106, 'inlineChat', async (accessor) => {
                const codeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor() || accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
                if (!codeEditor) {
                    return;
                }
                (0, chatAccessibilityHelp_1.runAccessibilityHelpAction)(accessor, codeEditor, 'inlineChat');
            }, contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_RESPONSE_FOCUSED, inlineChat_1.CTX_INLINE_CHAT_FOCUSED)));
        }
    }
    exports.InlineAccessibilityHelpContribution = InlineAccessibilityHelpContribution;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE4Q2hHLDRDQUVDO0lBZEQsMkJBQWdCLENBQUMsb0JBQW9CLENBQUMseUJBQXlCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUNyRiwyQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQywyQkFBMkIsRUFBRSxrQ0FBcUIsQ0FBQyxDQUFDO0lBRTdFLFFBQUEsa0NBQWtDLEdBQUcsSUFBQSxlQUFTLEVBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDekUsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLDJCQUFZLEVBQUMsbUJBQW1CLEVBQUUsa0JBQU8sQ0FBQyxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsNERBQTRELENBQUMsQ0FBQyxDQUFDO0lBTy9LLElBQUksY0FBYyxHQUErQixTQUFTLENBQUM7SUFDM0QsU0FBZ0IsZ0JBQWdCLENBQUMsYUFBNkI7UUFDN0QsY0FBYyxHQUFHLGFBQWEsQ0FBQztJQUNoQyxDQUFDO0lBRUQsTUFBYSxrQkFBbUIsU0FBUSxnQ0FBYTtRQUVwRDtZQUNDLEtBQUssQ0FBQztnQkFDTCxFQUFFLEVBQUUsa0JBQWtCO2dCQUN0QixLQUFLLEVBQUUsMENBQWtDO2dCQUN6QyxRQUFRLEVBQUUsd0JBQXdCLENBQUMsUUFBUTtnQkFDM0MsRUFBRSxFQUFFLElBQUk7Z0JBQ1IsWUFBWSxFQUFFLDJCQUFjLENBQUMsR0FBRyxDQUFDLHlDQUE0QixFQUFFLHFDQUFpQixDQUFDLFFBQVEsQ0FBQztnQkFDMUYsVUFBVSxFQUFFO29CQUNYLElBQUksRUFB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