/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatViewModel"], function (require, exports, nls_1, actions_1, clipboardService_1, chatActions_1, chat_1, chatContextKeys_1, chatViewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatCopyActions = registerChatCopyActions;
    function registerChatCopyActions() {
        (0, actions_1.registerAction2)(class CopyAllAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.copyAll',
                    title: (0, nls_1.localize2)('interactive.copyAll.label', "Copy All"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    menu: {
                        id: actions_1.MenuId.ChatContext,
                        when: chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.toNegated(),
                        group: 'copy',
                    }
                });
            }
            run(accessor, ...args) {
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
                const widget = chatWidgetService.lastFocusedWidget;
                if (widget) {
                    const viewModel = widget.viewModel;
                    const sessionAsText = viewModel?.getItems()
                        .filter((item) => (0, chatViewModel_1.isRequestVM)(item) || ((0, chatViewModel_1.isResponseVM)(item) && !item.errorDetails?.responseIsFiltered))
                        .map(item => stringifyItem(item))
                        .join('\n\n');
                    if (sessionAsText) {
                        clipboardService.writeText(sessionAsText);
                    }
                }
            }
        });
        (0, actions_1.registerAction2)(class CopyItemAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.copyItem',
                    title: (0, nls_1.localize2)('interactive.copyItem.label', "Copy"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    menu: {
                        id: actions_1.MenuId.ChatContext,
                        when: chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.toNegated(),
                        group: 'copy',
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isRequestVM)(item) && !(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const clipboardService = accessor.get(clipboardService_1.IClipboardService);
                const text = stringifyItem(item, false);
                clipboardService.writeText(text);
            }
        });
    }
    function stringifyItem(item, includeName = true) {
        if ((0, chatViewModel_1.isRequestVM)(item)) {
            return (includeName ? `${item.username}: ` : '') + item.messageText;
        }
        else {
            return (includeName ? `${item.username}: ` : '') + item.response.asString();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdENvcHlBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0Q29weUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUFXaEcsMERBMkRDO0lBM0RELFNBQWdCLHVCQUF1QjtRQUN0QyxJQUFBLHlCQUFlLEVBQUMsTUFBTSxhQUFjLFNBQVEsaUJBQU87WUFDbEQ7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSwrQkFBK0I7b0JBQ25DLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywyQkFBMkIsRUFBRSxVQUFVLENBQUM7b0JBQ3pELEVBQUUsRUFBRSxLQUFLO29CQUNULFFBQVEsRUFBRSwyQkFBYTtvQkFDdkIsSUFBSSxFQUFFO3dCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7d0JBQ3RCLElBQUksRUFBRSwyQ0FBeUIsQ0FBQyxTQUFTLEVBQUU7d0JBQzNDLEtBQUssRUFBRSxNQUFNO3FCQUNiO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQzdDLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxvQ0FBaUIsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMseUJBQWtCLENBQUMsQ0FBQztnQkFDM0QsTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsaUJBQWlCLENBQUM7Z0JBQ25ELElBQUksTUFBTSxFQUFFLENBQUM7b0JBQ1osTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztvQkFDbkMsTUFBTSxhQUFhLEdBQUcsU0FBUyxFQUFFLFFBQVEsRUFBRTt5QkFDekMsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUE0RCxFQUFFLENBQUMsSUFBQSwyQkFBVyxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSw0QkFBWSxFQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO3lCQUMvSixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ2hDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDZixJQUFJLGFBQWEsRUFBRSxDQUFDO3dCQUNuQixnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7b0JBQzNDLENBQUM7Z0JBQ0YsQ0FBQztZQUNGLENBQUM7U0FDRCxDQUFDLENBQUM7UUFFSCxJQUFBLHlCQUFlLEVBQUMsTUFBTSxjQUFlLFNBQVEsaUJBQU87WUFDbkQ7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSxnQ0FBZ0M7b0JBQ3BDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUM7b0JBQ3RELEVBQUUsRUFBRSxLQUFLO29CQUNULFFBQVEsRUFBRSwyQkFBYTtvQkFDdkIsSUFBSSxFQUFFO3dCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLFdBQVc7d0JBQ3RCLElBQUksRUFBRSwyQ0FBeUIsQ0FBQyxTQUFTLEVBQUU7d0JBQzNDLEtBQUssRUFBRSxNQUFNO3FCQUNiO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLElBQUEsMkJBQVcsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsNEJBQVksRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUMvQyxPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLG9DQUFpQixDQUFDLENBQUM7Z0JBQ3pELE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ3hDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsQyxDQUFDO1NBQ0QsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUVELFNBQVMsYUFBYSxDQUFDLElBQW9ELEVBQUUsV0FBVyxHQUFHLElBQUk7UUFDOUYsSUFBSSxJQUFBLDJCQUFXLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2QixPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNyRSxDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzdFLENBQUM7SUFDRixDQUFDIn0=