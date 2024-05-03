/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/contributions", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/chat/browser/actions/chatAccessibilityHelp", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatWidgetHistoryService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/views/common/viewsService"], function (require, exports, codicons_1, lifecycle_1, themables_1, editorExtensions_1, codeEditorService_1, nls_1, actions_1, contextkey_1, contextkeys_1, quickInput_1, platform_1, viewPane_1, contributions_1, accessibleViewActions_1, chatAccessibilityHelp_1, chat_1, chatEditorInput_1, chatAgents_1, chatContextKeys_1, chatContributionService_1, chatParserTypes_1, chatService_1, chatWidgetHistoryService_1, editorService_1, viewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatSubmitEditorAction = exports.ChatSubmitSecondaryAgentEditorAction = exports.CHAT_OPEN_ACTION_ID = exports.CHAT_CATEGORY = void 0;
    exports.registerChatActions = registerChatActions;
    exports.getOpenChatEditorAction = getOpenChatEditorAction;
    exports.getHistoryAction = getHistoryAction;
    exports.CHAT_CATEGORY = (0, nls_1.localize2)('chat.category', 'Chat');
    exports.CHAT_OPEN_ACTION_ID = 'workbench.action.chat.open';
    class OpenChatGlobalAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.CHAT_OPEN_ACTION_ID,
                title: (0, nls_1.localize2)('openChat', "Open Chat"),
                precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                icon: codicons_1.Codicon.commentDiscussion,
                f1: false,
                category: exports.CHAT_CATEGORY,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 39 /* KeyCode.KeyI */
                    }
                }
            });
        }
        async run(accessor, opts) {
            opts = typeof opts === 'string' ? { query: opts } : opts;
            const chatService = accessor.get(chatService_1.IChatService);
            const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
            const providers = chatService.getProviderInfos();
            if (!providers.length) {
                return;
            }
            const chatWidget = await chatWidgetService.revealViewForProvider(providers[0].id);
            if (!chatWidget) {
                return;
            }
            if (opts?.query) {
                if (opts.isPartialQuery) {
                    chatWidget.setInput(opts.query);
                }
                else {
                    chatWidget.acceptInput(opts.query);
                }
            }
            chatWidget.focusInput();
        }
    }
    class ChatSubmitSecondaryAgentEditorAction extends editorExtensions_1.EditorAction2 {
        static { this.ID = 'workbench.action.chat.submitSecondaryAgent'; }
        constructor() {
            super({
                id: ChatSubmitSecondaryAgentEditorAction.ID,
                title: (0, nls_1.localize2)({ key: 'actions.chat.submitSecondaryAgent', comment: ['Send input from the chat input box to the secondary agent'] }, "Submit to Secondary Agent"),
                precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT, chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_AGENT.negate(), chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                keybinding: {
                    when: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menu: {
                    id: actions_1.MenuId.ChatExecuteSecondary,
                    group: 'group_1',
                    when: chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_AGENT.negate(),
                }
            });
        }
        runEditorCommand(accessor, editor) {
            const editorUri = editor.getModel()?.uri;
            if (editorUri) {
                const agentService = accessor.get(chatAgents_1.IChatAgentService);
                const secondaryAgent = agentService.getSecondaryAgent();
                if (!secondaryAgent) {
                    return;
                }
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                const widget = widgetService.getWidgetByInputUri(editorUri);
                if (!widget) {
                    return;
                }
                if (widget.getInput().match(/^\s*@/)) {
                    widget.acceptInput();
                }
                else {
                    widget.acceptInputWithPrefix(`${chatParserTypes_1.chatAgentLeader}${secondaryAgent.name}`);
                }
            }
        }
    }
    exports.ChatSubmitSecondaryAgentEditorAction = ChatSubmitSecondaryAgentEditorAction;
    class ChatSubmitEditorAction extends editorExtensions_1.EditorAction2 {
        static { this.ID = 'workbench.action.chat.acceptInput'; }
        constructor() {
            super({
                id: ChatSubmitEditorAction.ID,
                title: (0, nls_1.localize2)({ key: 'actions.chat.submit', comment: ['Apply input from the chat input box'] }, "Submit"),
                precondition: chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT,
                keybinding: {
                    when: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menu: {
                    id: actions_1.MenuId.ChatExecuteSecondary,
                    when: chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(),
                    group: 'group_1',
                },
            });
        }
        runEditorCommand(accessor, editor) {
            const editorUri = editor.getModel()?.uri;
            if (editorUri) {
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                widgetService.getWidgetByInputUri(editorUri)?.acceptInput();
            }
        }
    }
    exports.ChatSubmitEditorAction = ChatSubmitEditorAction;
    function registerChatActions() {
        (0, actions_1.registerAction2)(OpenChatGlobalAction);
        (0, actions_1.registerAction2)(ChatSubmitEditorAction);
        (0, actions_1.registerAction2)(ChatSubmitSecondaryAgentEditorAction);
        (0, actions_1.registerAction2)(class ClearChatInputHistoryAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.clearInputHistory',
                    title: (0, nls_1.localize2)('interactiveSession.clearHistory.label', "Clear Input History"),
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    category: exports.CHAT_CATEGORY,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const historyService = accessor.get(chatWidgetHistoryService_1.IChatWidgetHistoryService);
                historyService.clearHistory();
            }
        });
        (0, actions_1.registerAction2)(class ClearChatHistoryAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.clearHistory',
                    title: (0, nls_1.localize2)('chat.clear.label', "Clear All Workspace Chats"),
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    category: exports.CHAT_CATEGORY,
                    f1: true,
                });
            }
            async run(accessor, ...args) {
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.clearAllHistoryEntries();
            }
        });
        (0, actions_1.registerAction2)(class FocusChatAction extends editorExtensions_1.EditorAction2 {
            constructor() {
                super({
                    id: 'chat.action.focus',
                    title: (0, nls_1.localize2)('actions.interactiveSession.focus', 'Focus Chat List'),
                    precondition: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                    category: exports.CHAT_CATEGORY,
                    keybinding: [
                        // On mac, require that the cursor is at the top of the input, to avoid stealing cmd+up to move the cursor to the top
                        {
                            when: chatContextKeys_1.CONTEXT_CHAT_INPUT_CURSOR_AT_TOP,
                            primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                        },
                        // On win/linux, ctrl+up can always focus the chat list
                        {
                            when: contextkey_1.ContextKeyExpr.or(contextkeys_1.IsWindowsContext, contextkeys_1.IsLinuxContext),
                            primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                            weight: 100 /* KeybindingWeight.EditorContrib */,
                        }
                    ]
                });
            }
            runEditorCommand(accessor, editor) {
                const editorUri = editor.getModel()?.uri;
                if (editorUri) {
                    const widgetService = accessor.get(chat_1.IChatWidgetService);
                    widgetService.getWidgetByInputUri(editorUri)?.focusLastMessage();
                }
            }
        });
        class ChatAccessibilityHelpContribution extends lifecycle_1.Disposable {
            constructor() {
                super();
                this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'panelChat', async (accessor) => {
                    const codeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getActiveCodeEditor() || accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
                    (0, chatAccessibilityHelp_1.runAccessibilityHelpAction)(accessor, codeEditor ?? undefined, 'panelChat');
                }, contextkey_1.ContextKeyExpr.or(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_REQUEST)));
            }
        }
        const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(ChatAccessibilityHelpContribution, 4 /* LifecyclePhase.Eventually */);
        (0, actions_1.registerAction2)(class FocusChatInputAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.focusInput',
                    title: (0, nls_1.localize2)('interactiveSession.focusInput.label', "Focus Chat Input"),
                    f1: false,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.negate())
                    }
                });
            }
            run(accessor, ...args) {
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                widgetService.lastFocusedWidget?.focusInput();
            }
        });
    }
    function getOpenChatEditorAction(id, label, when) {
        return class OpenChatEditor extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.openChat.${id}`,
                    title: (0, nls_1.localize2)('interactiveSession.open', "Open Editor ({0})", label),
                    f1: true,
                    category: exports.CHAT_CATEGORY,
                    precondition: contextkey_1.ContextKeyExpr.deserialize(when)
                });
            }
            async run(accessor) {
                const editorService = accessor.get(editorService_1.IEditorService);
                await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { providerId: id }, pinned: true } });
            }
        };
    }
    const getHistoryChatActionDescriptorForViewTitle = (viewId, providerId) => ({
        viewId,
        id: `workbench.action.chat.${providerId}.history`,
        title: (0, nls_1.localize2)('chat.history.label', "Show Chats"),
        menu: {
            id: actions_1.MenuId.ViewTitle,
            when: contextkey_1.ContextKeyExpr.equals('view', viewId),
            group: 'navigation',
            order: -1
        },
        category: exports.CHAT_CATEGORY,
        icon: codicons_1.Codicon.history,
        f1: true,
        precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS
    });
    function getHistoryAction(viewId, providerId) {
        return class HistoryAction extends viewPane_1.ViewAction {
            constructor() {
                super(getHistoryChatActionDescriptorForViewTitle(viewId, providerId));
            }
            async runInView(accessor, view) {
                const chatService = accessor.get(chatService_1.IChatService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const chatContribService = accessor.get(chatContributionService_1.IChatContributionService);
                const viewsService = accessor.get(viewsService_1.IViewsService);
                const items = chatService.getHistory();
                const picks = items.map(i => ({
                    label: i.title,
                    chat: i,
                    buttons: [{
                            iconClass: themables_1.ThemeIcon.asClassName(codicons_1.Codicon.x),
                            tooltip: (0, nls_1.localize)('interactiveSession.history.delete', "Delete"),
                        }]
                }));
                const selection = await quickInputService.pick(picks, {
                    placeHolder: (0, nls_1.localize)('interactiveSession.history.pick', "Switch to chat"),
                    onDidTriggerItemButton: context => {
                        chatService.removeHistoryEntry(context.item.chat.sessionId);
                        context.removeItem();
                    }
                });
                if (selection) {
                    const sessionId = selection.chat.sessionId;
                    const provider = chatContribService.registeredProviders[0]?.id;
                    if (provider) {
                        const viewId = chatContribService.getViewIdForProvider(provider);
                        const view = await viewsService.openView(viewId);
                        view.loadSession(sessionId);
                    }
                }
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvYnJvd3Nlci9hY3Rpb25zL2NoYXRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXVLaEcsa0RBdUdDO0lBRUQsMERBaUJDO0lBa0JELDRDQXVDQztJQXhUWSxRQUFBLGFBQWEsR0FBRyxJQUFBLGVBQVMsRUFBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbkQsUUFBQSxtQkFBbUIsR0FBRyw0QkFBNEIsQ0FBQztJQWFoRSxNQUFNLG9CQUFxQixTQUFRLGlCQUFPO1FBQ3pDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSwyQkFBbUI7Z0JBQ3ZCLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO2dCQUN6QyxZQUFZLEVBQUUseUNBQXVCO2dCQUNyQyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxpQkFBaUI7Z0JBQy9CLEVBQUUsRUFBRSxLQUFLO2dCQUNULFFBQVEsRUFBRSxxQkFBYTtnQkFDdkIsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsZ0RBQTJCLHdCQUFlO29CQUNuRCxHQUFHLEVBQUU7d0JBQ0osT0FBTyxFQUFFLG9EQUErQix3QkFBZTtxQkFDdkQ7aUJBQ0Q7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQixFQUFFLElBQW9DO1lBQ2xGLElBQUksR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFFekQsTUFBTSxXQUFXLEdBQUcsUUFB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