/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/selection", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/inlineChat/browser/inlineChatController"], function (require, exports, codicons_1, codeEditorService_1, selection_1, nls_1, actions_1, chatActions_1, chat_1, chatContextKeys_1, inlineChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ASK_QUICK_QUESTION_ACTION_ID = void 0;
    exports.registerQuickChatActions = registerQuickChatActions;
    exports.getQuickChatActionForProvider = getQuickChatActionForProvider;
    exports.ASK_QUICK_QUESTION_ACTION_ID = 'workbench.action.quickchat.toggle';
    function registerQuickChatActions() {
        (0, actions_1.registerAction2)(QuickChatGlobalAction);
        (0, actions_1.registerAction2)(class OpenInChatViewAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.quickchat.openInChatView',
                    title: (0, nls_1.localize2)('chat.openInChatView.label', "Open in Chat View"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.commentDiscussion,
                    menu: {
                        id: actions_1.MenuId.ChatInputSide,
                        group: 'navigation',
                        order: 10
                    }
                });
            }
            run(accessor) {
                const quickChatService = accessor.get(chat_1.IQuickChatService);
                quickChatService.openInChatView();
            }
        });
        (0, actions_1.registerAction2)(class CloseQuickChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.quickchat.close',
                    title: (0, nls_1.localize2)('chat.closeQuickChat.label', "Close Quick Chat"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.close,
                    menu: {
                        id: actions_1.MenuId.ChatInputSide,
                        group: 'navigation',
                        order: 20
                    }
                });
            }
            run(accessor) {
                const quickChatService = accessor.get(chat_1.IQuickChatService);
                quickChatService.close();
            }
        });
        (0, actions_1.registerAction2)(class LaunchInlineChatFromQuickChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.quickchat.launchInlineChat',
                    title: (0, nls_1.localize2)('chat.launchInlineChat.label', "Launch Inline Chat"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY
                });
            }
            async run(accessor) {
                const quickChatService = accessor.get(chat_1.IQuickChatService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                if (quickChatService.focused) {
                    quickChatService.close();
                }
                const codeEditor = codeEditorService.getActiveCodeEditor();
                if (!codeEditor) {
                    return;
                }
                const controller = inlineChatController_1.InlineChatController.get(codeEditor);
                if (!controller) {
                    return;
                }
                await controller.run();
                controller.focus();
            }
        });
    }
    class QuickChatGlobalAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.ASK_QUICK_QUESTION_ACTION_ID,
                title: (0, nls_1.localize2)('quickChat', 'Quick Chat'),
                precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                icon: codicons_1.Codicon.commentDiscussion,
                f1: false,
                category: chatActions_1.CHAT_CATEGORY,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 39 /* KeyCode.KeyI */,
                    linux: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 39 /* KeyCode.KeyI */
                    }
                },
                metadata: {
                    description: (0, nls_1.localize)('toggle.desc', 'Toggle the quick chat'),
                    args: [{
                            name: 'args',
                            schema: {
                                anyOf: [
                                    {
                                        type: 'object',
                                        required: ['query'],
                                        properties: {
                                            query: {
                                                description: (0, nls_1.localize)('toggle.query', "The query to open the quick chat with"),
                                                type: 'string'
                                            },
                                            isPartialQuery: {
                                                description: (0, nls_1.localize)('toggle.isPartialQuery', "Whether the query is partial; it will wait for more user input"),
                                                type: 'boolean'
                                            }
                                        },
                                    },
                                    {
                                        type: 'string',
                                        description: (0, nls_1.localize)('toggle.query', "The query to open the quick chat with")
                                    }
                                ]
                            }
                        }]
                },
            });
        }
        run(accessor, query) {
            const quickChatService = accessor.get(chat_1.IQuickChatService);
            let options;
            switch (typeof query) {
                case 'string':
                    options = { query };
                    break;
                case 'object':
                    options = query;
                    break;
            }
            if (options?.query) {
                options.selection = new selection_1.Selection(1, options.query.length + 1, 1, options.query.length + 1);
            }
            quickChatService.toggle(undefined, options);
        }
    }
    /**
     * Returns a provider specific action that will open the quick chat for that provider.
     * This is used to include the provider label in the action title so it shows up in
     * the command palette.
     * @param id The id of the provider
     * @param label The label of the provider
     * @returns An action that will open the quick chat for this provider
     */
    function getQuickChatActionForProvider(id, label) {
        return class AskQuickChatAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.openQuickChat.${id}`,
                    category: chatActions_1.CHAT_CATEGORY,
                    title: (0, nls_1.localize2)('interactiveSession.open', "Open Quick Chat ({0})", label),
                    f1: true
                });
            }
            run(accessor, query) {
                const quickChatService = accessor.get(chat_1.IQuickChatService);
                quickChatService.toggle(id, query ? {
                    query,
                    selection: new selection_1.Selection(1, query.length + 1, 1, query.length + 1)
                } : undefined);
            }
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFF1aWNrSW5wdXRBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0UXVpY2tJbnB1dEFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JoRyw0REE2RUM7SUF1RUQsc0VBbUJDO0lBeEtZLFFBQUEsNEJBQTRCLEdBQUcsbUNBQW1DLENBQUM7SUFDaEYsU0FBZ0Isd0JBQXdCO1FBQ3ZDLElBQUEseUJBQWUsRUFBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBRXZDLElBQUEseUJBQWUsRUFBQyxNQUFNLG9CQUFxQixTQUFRLGlCQUFPO1lBQ3pEO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsMkNBQTJDO29CQUMvQyxLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsMkJBQTJCLEVBQUUsbUJBQW1CLENBQUM7b0JBQ2xFLEVBQUUsRUFBRSxLQUFLO29CQUNULFFBQVEsRUFBRSwyQkFBYTtvQkFDdkIsSUFBSSxFQUFFLGtCQUFPLENBQUMsaUJBQWlCO29CQUMvQixJQUFJLEVBQUU7d0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTt3QkFDeEIsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLEtBQUssRUFBRSxFQUFFO3FCQUNUO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxHQUFHLENBQUMsUUFBMEI7Z0JBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBaUIsQ0FBQyxDQUFDO2dCQUN6RCxnQkFBZ0IsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQyxDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sb0JBQXFCLFNBQVEsaUJBQU87WUFDekQ7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSxrQ0FBa0M7b0JBQ3RDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQywyQkFBMkIsRUFBRSxrQkFBa0IsQ0FBQztvQkFDakUsRUFBRSxFQUFFLEtBQUs7b0JBQ1QsUUFBUSxFQUFFLDJCQUFhO29CQUN2QixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxLQUFLO29CQUNuQixJQUFJLEVBQUU7d0JBQ0wsRUFBRSxFQUFFLGdCQUFNLENBQUMsYUFBYTt3QkFDeEIsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLEtBQUssRUFBRSxFQUFFO3FCQUNUO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxHQUFHLENBQUMsUUFBMEI7Z0JBQzdCLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx3QkFBaUIsQ0FBQyxDQUFDO2dCQUN6RCxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUMxQixDQUFDO1NBQ0QsQ0FBQyxDQUFDO1FBRUgsSUFBQSx5QkFBZSxFQUFDLE1BQU0sbUNBQW9DLFNBQVEsaUJBQU87WUFDeEU7Z0JBQ0MsS0FBSyxDQUFDO29CQUNMLEVBQUUsRUFBRSw2Q0FBNkM7b0JBQ2pELEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyw2QkFBNkIsRUFBRSxvQkFBb0IsQ0FBQztvQkFDckUsRUFBRSxFQUFFLEtBQUs7b0JBQ1QsUUFBUSxFQUFFLDJCQUFhO2lCQUN2QixDQUFDLENBQUM7WUFDSixDQUFDO1lBRUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUEwQjtnQkFDbkMsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFpQixDQUFDLENBQUM7Z0JBQ3pELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxzQ0FBa0IsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUM5QixnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDMUIsQ0FBQztnQkFDRCxNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMzRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7b0JBQ2pCLE9BQU87Z0JBQ1IsQ0FBQztnQkFFRCxNQUFNLFVBQVUsR0FBRywyQ0FBb0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3hELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDakIsT0FBTztnQkFDUixDQUFDO2dCQUVELE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixVQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsQ0FBQztTQUNELENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxNQUFNLHFCQUFzQixTQUFRLGlCQUFPO1FBQzFDO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSxvQ0FBNEI7Z0JBQ2hDLEtBQUssRUFBRSxJQUFBLGVBQVMsRUFBQyxXQUFXLEVBQUUsWUFBWSxDQUFDO2dCQUMzQyxZQUFZLEVBQUUseUNBQXVCO2dCQUNyQyxJQUFJLEVBQUUsa0JBQU8sQ0FBQyxpQkFBaUI7Z0JBQy9CLEVBQUUsRUFBRSxLQUFLO2dCQUNULFFBQVEsRUFBRSwyQkFBYTtnQkFDdkIsVUFBVSxFQUFFO29CQUNYLE1BQU0sNkNBQW1DO29CQUN6QyxPQUFPLEVBQUUsbURBQTZCLHdCQUFlO29CQUNyRCxLQUFLLEVBQUU7d0JBQ04sT0FBTyxFQUFFLG1EQUE2Qix1QkFBYSx3QkFBZTtxQkFDbEU7aUJBQ0Q7Z0JBQ0QsUUFBUSxFQUFFO29CQUNULFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxhQUFhLEVBQUUsdUJBQXVCLENBQUM7b0JBQzdELElBQUksRUFBRSxDQUFDOzRCQUNOLElBQUksRUFBRSxNQUFNOzRCQUNaLE1BQU0sRUFBRTtnQ0FDUCxLQUFLLEVBQUU7b0NBQ047d0NBQ0MsSUFBSSxFQUFFLFFBQVE7d0NBQ2QsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDO3dDQUNuQixVQUFVLEVBQUU7NENBQ1gsS0FBSyxFQUFFO2dEQUNOLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsdUNBQXVDLENBQUM7Z0RBQzlFLElBQUksRUFBRSxRQUFROzZDQUNkOzRDQUNELGNBQWMsRUFBRTtnREFDZixXQUFXLEVBQUUsSUFBQSxjQUFRLEVBQUMsdUJBQXVCLEVBQUUsZ0VBQWdFLENBQUM7Z0RBQ2hILElBQUksRUFBRSxTQUFTOzZDQUNmO3lDQUNEO3FDQUNEO29DQUNEO3dDQUNDLElBQUksRUFBRSxRQUFRO3dDQUNkLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxjQUFjLEVBQUUsdUNBQXVDLENBQUM7cUNBQzlFO2lDQUNEOzZCQUNEO3lCQUNELENBQUM7aUJBQ0Y7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBRVEsR0FBRyxDQUFDLFFBQTBCLEVBQUUsS0FBeUQ7WUFDakcsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFpQixDQUFDLENBQUM7WUFDekQsSUFBSSxPQUEwQyxDQUFDO1lBQy9DLFFBQVEsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDdEIsS0FBSyxRQUFRO29CQUFFLE9BQU8sR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDO29CQUFDLE1BQU07Z0JBQzFDLEtBQUssUUFBUTtvQkFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDO29CQUFDLE1BQU07WUFDdkMsQ0FBQztZQUNELElBQUksT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUNwQixPQUFPLENBQUMsU0FBUyxHQUFHLElBQUkscUJBQVMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM3RixDQUFDO1lBQ0QsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO0tBQ0Q7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsU0FBZ0IsNkJBQTZCLENBQUMsRUFBVSxFQUFFLEtBQWE7UUFDdEUsT0FBTyxNQUFNLGtCQUFtQixTQUFRLGlCQUFPO1lBQzlDO2dCQUNDLEtBQUssQ0FBQztvQkFDTCxFQUFFLEVBQUUsa0NBQWtDLEVBQUUsRUFBRTtvQkFDMUMsUUFBUSxFQUFFLDJCQUFhO29CQUN2QixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMseUJBQXlCLEVBQUUsdUJBQXVCLEVBQUUsS0FBSyxDQUFDO29CQUMzRSxFQUFFLEVBQUUsSUFBSTtpQkFDUixDQUFDLENBQUM7WUFDSixDQUFDO1lBRVEsR0FBRyxDQUFDLFFBQTBCLEVBQUUsS0FBYztnQkFDdEQsTUFBTSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUFpQixDQUFDLENBQUM7Z0JBQ3pELGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDbkMsS0FBSztvQkFDTCxTQUFTLEVBQUUsSUFBSSxxQkFBUyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7aUJBQ2xFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2hCLENBQUM7U0FDRCxDQUFDO0lBQ0gsQ0FBQyJ9