/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/accessibilitySignal/browser/accessibilitySignalService", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/contextkeys", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/actions/chatClear", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatContextKeys"], function (require, exports, codicons_1, nls_1, actions_1, accessibilitySignalService_1, contextkey_1, viewPane_1, contextkeys_1, chatActions_1, chatClear_1, chat_1, chatEditorInput_1, chatContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ACTION_ID_NEW_CHAT = void 0;
    exports.registerNewChatActions = registerNewChatActions;
    exports.getNewChatAction = getNewChatAction;
    exports.ACTION_ID_NEW_CHAT = `workbench.action.chat.newChat`;
    function registerNewChatActions() {
        (0, actions_1.registerAction2)(class NewChatEditorAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chatEditor.newChat',
                    title: (0, nls_1.localize2)('chat.newChat.label', "New Chat"),
                    icon: codicons_1.Codicon.plus,
                    f1: false,
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    menu: [{
                            id: actions_1.MenuId.EditorTitle,
                            group: 'navigation',
                            order: 0,
                            when: contextkeys_1.ActiveEditorContext.isEqualTo(chatEditorInput_1.ChatEditorInput.EditorID),
                        }]
                });
            }
            async run(accessor, ...args) {
                announceChatCleared(accessor);
                await (0, chatClear_1.clearChatEditor)(accessor);
            }
        });
        (0, actions_1.registerAction2)(class GlobalClearChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.ACTION_ID_NEW_CHAT,
                    title: (0, nls_1.localize2)('chat.newChat.label', "New Chat"),
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.plus,
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        primary: 2048 /* KeyMod.CtrlCmd */ | 42 /* KeyCode.KeyL */,
                        mac: {
                            primary: 256 /* KeyMod.WinCtrl */ | 42 /* KeyCode.KeyL */
                        },
                        when: chatContextKeys_1.CONTEXT_IN_CHAT_SESSION
                    },
                    menu: {
                        id: actions_1.MenuId.ChatContext,
                        group: 'z_clear'
                    }
                });
            }
            run(accessor, ...args) {
                const widgetService = accessor.get(chat_1.IChatWidgetService);
                const widget = widgetService.lastFocusedWidget;
                if (!widget) {
                    return;
                }
                announceChatCleared(accessor);
                widget.clear();
                widget.focusInput();
            }
        });
    }
    const getNewChatActionDescriptorForViewTitle = (viewId, providerId) => ({
        viewId,
        id: `workbench.action.chat.${providerId}.newChat`,
        title: (0, nls_1.localize2)('chat.newChat.label', "New Chat"),
        menu: {
            id: actions_1.MenuId.ViewTitle,
            when: contextkey_1.ContextKeyExpr.equals('view', viewId),
            group: 'navigation',
            order: -1
        },
        precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
        category: chatActions_1.CHAT_CATEGORY,
        icon: codicons_1.Codicon.plus,
        f1: false
    });
    function getNewChatAction(viewId, providerId) {
        return class NewChatAction extends viewPane_1.ViewAction {
            constructor() {
                super(getNewChatActionDescriptorForViewTitle(viewId, providerId));
            }
            async runInView(accessor, view) {
                announceChatCleared(accessor);
                await view.clear();
                view.widget.focusInput();
            }
        };
    }
    function announceChatCleared(accessor) {
        accessor.get(accessibilitySignalService_1.IAccessibilitySignalService).playSignal(accessibilitySignalService_1.AccessibilitySignal.clear);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENsZWFyQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdENsZWFyQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQmhHLHdEQThEQztJQWtCRCw0Q0FZQztJQTlGWSxRQUFBLGtCQUFrQixHQUFHLCtCQUErQixDQUFDO0lBRWxFLFNBQWdCLHNCQUFzQjtRQUVyQyxJQUFBLHlCQUFlLEVBQUMsTUFBTSxtQkFBb0IsU0FBUSxpQkFBTztZQUN4RDtnQkFDQyxLQUFLLENBQUM7b0JBQ0wsRUFBRSxFQUFFLHFDQUFxQztvQkFDekMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9CQUFvQixFQUFFLFVBQVUsQ0FBQztvQkFDbEQsSUFBSSxFQUFFLGtCQUFPLENBQUMsSUFBSTtvQkFDbEIsRUFBRSxFQUFFLEtBQUs7b0JBQ1QsWUFBWSxFQUFFLHlDQUF1QjtvQkFDckMsSUFBSSxFQUFFLENBQUM7NEJBQ04sRUFBRSxFQUFFLGdCQUFNLENBQUMsV0FBVzs0QkFDdEIsS0FBSyxFQUFFLFlBQVk7NEJBQ25CLEtBQUssRUFBRSxDQUFDOzRCQUNSLElBQUksRUFBRSxpQ0FBbUIsQ0FBQyxTQUFTLENBQUMsaUNBQWUsQ0FBQyxRQUFRLENBQUM7eUJBQzdELENBQUM7aUJBQ0YsQ0FBQyxDQUFDO1lBQ0osQ0FBQztZQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQ25ELG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM5QixNQUFNLElBQUEsMkJBQWUsRUFBQyxRQUFRLENBQUMsQ0FBQztZQUNqQyxDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBR0gsSUFBQSx5QkFBZSxFQUFDLE1B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