/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, codicons_1, nls_1, actions_1, contextkey_1, chatActions_1, chat_1, chatContextKeys_1, chatService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CancelAction = exports.SubmitAction = void 0;
    exports.registerChatExecuteActions = registerChatExecuteActions;
    class SubmitAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.submit'; }
        constructor() {
            super({
                id: SubmitAction.ID,
                title: (0, nls_1.localize2)('interactive.submit.label', "Submit"),
                f1: false,
                category: chatActions_1.CHAT_CATEGORY,
                icon: codicons_1.Codicon.send,
                precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                menu: {
                    id: actions_1.MenuId.ChatExecute,
                    when: chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(),
                    group: 'navigation',
                },
            });
        }
        run(accessor, ...args) {
            const context = args[0];
            const widgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = context?.widget ?? widgetService.lastFocusedWidget;
            widget?.acceptInput(context?.inputValue);
        }
    }
    exports.SubmitAction = SubmitAction;
    class SendToNewChatAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.chat.sendToNewChat',
                title: (0, nls_1.localize2)('chat.newChat.label', "Send to New Chat"),
                precondition: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(), chatContextKeys_1.CONTEXT_CHAT_INPUT_HAS_TEXT),
                category: chatActions_1.CHAT_CATEGORY,
                f1: false,
                menu: {
                    id: actions_1.MenuId.ChatExecuteSecondary,
                    group: 'group_2'
                },
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    when: chatContextKeys_1.CONTEXT_IN_CHAT_INPUT,
                }
            });
        }
        async run(accessor, ...args) {
            const context = args[0];
            const widgetService = accessor.get(chat_1.IChatWidgetService);
            const widget = context?.widget ?? widgetService.lastFocusedWidget;
            if (!widget) {
                return;
            }
            widget.clear();
            widget.acceptInput(context?.inputValue);
        }
    }
    class CancelAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.cancel'; }
        constructor() {
            super({
                id: CancelAction.ID,
                title: (0, nls_1.localize2)('interactive.cancel.label', "Cancel"),
                f1: false,
                category: chatActions_1.CHAT_CATEGORY,
                icon: codicons_1.Codicon.debugStop,
                menu: {
                    id: actions_1.MenuId.ChatExecute,
                    when: chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS,
                    group: 'navigation',
                }
            });
        }
        run(accessor, ...args) {
            const context = args[0];
            if (!context.widget) {
                return;
            }
            const chatService = accessor.get(chatService_1.IChatService);
            if (context.widget.viewModel) {
                chatService.cancelCurrentRequestForSession(context.widget.viewModel.sessionId);
            }
        }
    }
    exports.CancelAction = CancelAction;
    function registerChatExecuteActions() {
        (0, actions_1.registerAction2)(SubmitAction);
        (0, actions_1.registerAction2)(CancelAction);
        (0, actions_1.registerAction2)(SendToNewChatAction);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEV4ZWN1dGVBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0RXhlY3V0ZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0hoRyxnRUFJQztJQWhHRCxNQUFhLFlBQWEsU0FBUSxpQkFBTztpQkFDeEIsT0FBRSxHQUFHLDhCQUE4QixDQUFDO1FBRXBEO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxZQUFZLENBQUMsRUFBRTtnQkFDbkIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDBCQUEwQixFQUFFLFFBQVEsQ0FBQztnQkFDdEQsRUFBRSxFQUFFLEtBQUs7Z0JBQ1QsUUFBUSxFQUFFLDJCQUFhO2dCQUN2QixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxJQUFJO2dCQUNsQixZQUFZLEVBQUUsMkJBQWMsQ0FBQyxHQUFHLENBQUMsNkNBQTJCLEVBQUUsa0RBQWdDLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3hHLElBQUksRUFBRTtvQkFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxXQUFXO29CQUN0QixJQUFJLEVBQUUsa0RBQWdDLENBQUMsTUFBTSxFQUFFO29CQUMvQyxLQUFLLEVBQUUsWUFBWTtpQkFDbkI7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCLEVBQUUsR0FBRyxJQUFXO1lBQzdDLE1BQU0sT0FBTyxHQUEwQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0QsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx5QkFBa0IsQ0FBQyxDQUFDO1lBQ3ZELE1BQU0sTUFBTSxHQUFHLE9BQU8sRUFBRSxNQUFNLElBQUksYUFBYSxDQUFDLGlC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