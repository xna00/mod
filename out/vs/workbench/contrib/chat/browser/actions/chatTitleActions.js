/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/marked/marked", "vs/editor/browser/services/bulkEditService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/editor/common/editorService"], function (require, exports, codicons_1, marked_1, bulkEditService_1, nls_1, actions_1, contextkey_1, bulkCellEdits_1, chatActions_1, chat_1, chatContextKeys_1, chatService_1, chatViewModel_1, notebookCommon_1, notebookContextKeys_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerChatTitleActions = registerChatTitleActions;
    function registerChatTitleActions() {
        (0, actions_1.registerAction2)(class MarkHelpfulAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.markHelpful',
                    title: (0, nls_1.localize2)('interactive.helpful.label', "Helpful"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.thumbsup,
                    toggled: chatContextKeys_1.CONTEXT_RESPONSE_VOTE.isEqualTo('up'),
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 1,
                        when: chatContextKeys_1.CONTEXT_RESPONSE
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.notifyUserAction({
                    providerId: item.providerId,
                    agentId: item.agent?.id,
                    sessionId: item.sessionId,
                    requestId: item.requestId,
                    result: item.result,
                    action: {
                        kind: 'vote',
                        direction: chatService_1.InteractiveSessionVoteDirection.Up,
                    }
                });
                item.setVote(chatService_1.InteractiveSessionVoteDirection.Up);
            }
        });
        (0, actions_1.registerAction2)(class MarkUnhelpfulAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.markUnhelpful',
                    title: (0, nls_1.localize2)('interactive.unhelpful.label', "Unhelpful"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.thumbsdown,
                    toggled: chatContextKeys_1.CONTEXT_RESPONSE_VOTE.isEqualTo('down'),
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 2,
                        when: chatContextKeys_1.CONTEXT_RESPONSE
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.notifyUserAction({
                    providerId: item.providerId,
                    agentId: item.agent?.id,
                    sessionId: item.sessionId,
                    requestId: item.requestId,
                    result: item.result,
                    action: {
                        kind: 'vote',
                        direction: chatService_1.InteractiveSessionVoteDirection.Down,
                    }
                });
                item.setVote(chatService_1.InteractiveSessionVoteDirection.Down);
            }
        });
        (0, actions_1.registerAction2)(class ReportIssueForBugAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.reportIssueForBug',
                    title: (0, nls_1.localize2)('interactive.reportIssueForBug.label', "Report Issue"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.report,
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 3,
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_CHAT_RESPONSE_SUPPORT_ISSUE_REPORTING, chatContextKeys_1.CONTEXT_RESPONSE)
                    }
                });
            }
            run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const chatService = accessor.get(chatService_1.IChatService);
                chatService.notifyUserAction({
                    providerId: item.providerId,
                    agentId: item.agent?.id,
                    sessionId: item.sessionId,
                    requestId: item.requestId,
                    result: item.result,
                    action: {
                        kind: 'bug'
                    }
                });
            }
        });
        (0, actions_1.registerAction2)(class InsertToNotebookAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.insertIntoNotebook',
                    title: (0, nls_1.localize2)('interactive.insertIntoNotebook.label', "Insert into Notebook"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.insert,
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        isHiddenByDefault: true,
                        when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, chatContextKeys_1.CONTEXT_RESPONSE, chatContextKeys_1.CONTEXT_RESPONSE_FILTERED.negate())
                    }
                });
            }
            async run(accessor, ...args) {
                const item = args[0];
                if (!(0, chatViewModel_1.isResponseVM)(item)) {
                    return;
                }
                const editorService = accessor.get(editorService_1.IEditorService);
                if (editorService.activeEditorPane?.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
                    const notebookEditor = editorService.activeEditorPane.getControl();
                    if (!notebookEditor.hasModel()) {
                        return;
                    }
                    if (notebookEditor.isReadOnly) {
                        return;
                    }
                    const value = item.response.asString();
                    const splitContents = splitMarkdownAndCodeBlocks(value);
                    const focusRange = notebookEditor.getFocus();
                    const index = Math.max(focusRange.end, 0);
                    const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
                    await bulkEditService.apply([
                        new bulkCellEdits_1.ResourceNotebookCellEdit(notebookEditor.textModel.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index,
                            count: 0,
                            cells: splitContents.map(content => {
                                const kind = content.type === 'markdown' ? notebookCommon_1.CellKind.Markup : notebookCommon_1.CellKind.Code;
                                const language = content.type === 'markdown' ? 'markdown' : content.language;
                                const mime = content.type === 'markdown' ? 'text/markdown' : `text/x-${content.language}`;
                                return {
                                    cellKind: kind,
                                    language,
                                    mime,
                                    source: content.content,
                                    outputs: [],
                                    metadata: {}
                                };
                            })
                        })
                    ], { quotableLabel: 'Insert into Notebook' });
                }
            }
        });
        (0, actions_1.registerAction2)(class RemoveAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.chat.remove',
                    title: (0, nls_1.localize2)('chat.remove.label', "Remove Request and Response"),
                    f1: false,
                    category: chatActions_1.CHAT_CATEGORY,
                    icon: codicons_1.Codicon.x,
                    keybinding: {
                        primary: 20 /* KeyCode.Delete */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                        },
                        when: contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_IN_CHAT_SESSION, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    },
                    menu: {
                        id: actions_1.MenuId.ChatMessageTitle,
                        group: 'navigation',
                        order: 2,
                        when: chatContextKeys_1.CONTEXT_REQUEST
                    }
                });
            }
            run(accessor, ...args) {
                let item = args[0];
                if (!(0, chatViewModel_1.isRequestVM)(item)) {
                    const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
                    const widget = chatWidgetService.lastFocusedWidget;
                    item = widget?.getFocus();
                }
                const requestId = (0, chatViewModel_1.isRequestVM)(item) ? item.id :
                    (0, chatViewModel_1.isResponseVM)(item) ? item.requestId : undefined;
                if (requestId) {
                    const chatService = accessor.get(chatService_1.IChatService);
                    chatService.removeRequest(item.sessionId, requestId);
                }
            }
        });
    }
    function splitMarkdownAndCodeBlocks(markdown) {
        const lexer = new marked_1.marked.Lexer();
        const tokens = lexer.lex(markdown);
        const splitContent = [];
        let markdownPart = '';
        tokens.forEach((token) => {
            if (token.type === 'code') {
                if (markdownPart.trim()) {
                    splitContent.push({ type: 'markdown', content: markdownPart });
                    markdownPart = '';
                }
                splitContent.push({
                    type: 'code',
                    language: token.lang || '',
                    content: token.text,
                });
            }
            else {
                markdownPart += token.raw;
            }
        });
        if (markdownPart.trim()) {
            splitContent.push({ type: 'markdown', content: markdownPart });
        }
        return splitContent;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFRpdGxlQWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2FjdGlvbnMvY2hhdFRpdGxlQWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXNCaEcsNERBeU9DO0lBek9ELFNBQWdCLHdCQUF3QjtRQUN2QyxJQUFBLHlCQUFlLEVBQUMsTUFBTSxpQkFBa0IsU0FBUSxpQkFBTztZQUN0RDtnQkFDQyxLQUFLLENBQUM7b0JBQ0wsRUFBRSxFQUFFLG1DQUFtQztvQkFDdkMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDJCQUEyQixFQUFFLFNBQVMsQ0FBQztvQkFDeEQsRUFBRSxFQUFFLEtBQUs7b0JBQ1QsUUFBUSxFQUFFLDJCQUFhO29CQUN2QixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxRQUFRO29CQUN0QixPQUFPLEVBQUUsdUNBQXFCLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztvQkFDOUMsSUFBSSxFQUFFO3dCQUNMLEVBQUUsRUFBRSxnQkFBTSxDQUFDLGdCQUFnQjt3QkFDM0IsS0FBSyxFQUFFLFlBQVk7d0JBQ25CLEtBQUssRUFBRSxDQUFDO3dCQUNSLElBQUksRUFBRSxrQ0FBZ0I7cUJBQ3RCO2lCQUNELENBQUMsQ0FBQztZQUNKLENBQUM7WUFFRCxHQUFHLENBQUMsUUFBMEIsRUFBRSxHQUFHLElBQVc7Z0JBQzdDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLElBQUEsNEJBQVksRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN6QixPQUFPO2dCQUNSLENBQUM7Z0JBRUQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBWSxDQUFDLENBQUM7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