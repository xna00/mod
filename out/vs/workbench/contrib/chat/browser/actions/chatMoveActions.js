/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/contextkeys", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatEditorInput", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, actions_1, contextkey_1, viewPane_1, contextkeys_1, viewsService_1, chatActions_1, chat_1, chatEditorInput_1, chatContextKeys_1, chatContributionService_1, chatService_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMoveToEditorAction = getMoveToEditorAction;
    exports.getMoveToNewWindowAction = getMoveToNewWindowAction;
    exports.getMoveToAction = getMoveToAction;
    exports.registerMoveActions = registerMoveActions;
    var MoveToNewLocation;
    (function (MoveToNewLocation) {
        MoveToNewLocation["Editor"] = "Editor";
        MoveToNewLocation["Window"] = "Window";
    })(MoveToNewLocation || (MoveToNewLocation = {}));
    const getMoveToChatActionDescriptorForViewTitle = (viewId, providerId, moveTo) => ({
        id: `workbench.action.chat.${providerId}.openIn${moveTo}`,
        title: {
            value: moveTo === MoveToNewLocation.Editor ? (0, nls_1.localize)('chat.openInEditor.label', "Open Chat in Editor") : (0, nls_1.localize)('chat.openInNewWindow.label', "Open Chat in New Window"),
            original: moveTo === MoveToNewLocation.Editor ? 'Open Chat in Editor' : 'Open Chat in New Window',
        },
        category: chatActions_1.CHAT_CATEGORY,
        precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
        f1: false,
        viewId,
        menu: {
            id: actions_1.MenuId.ViewTitle,
            when: contextkey_1.ContextKeyExpr.equals('view', viewId),
            order: 0
        },
    });
    function getMoveToEditorAction(viewId, providerId) {
        return getMoveToAction(viewId, providerId, MoveToNewLocation.Editor);
    }
    function getMoveToNewWindowAction(viewId, providerId) {
        return getMoveToAction(viewId, providerId, MoveToNewLocation.Window);
    }
    function getMoveToAction(viewId, providerId, moveTo) {
        return class MoveToAction extends viewPane_1.ViewAction {
            constructor() {
                super(getMoveToChatActionDescriptorForViewTitle(viewId, providerId, moveTo));
            }
            async runInView(accessor, view) {
                const viewModel = view.widget.viewModel;
                if (!viewModel) {
                    return;
                }
                const editorService = accessor.get(editorService_1.IEditorService);
                const sessionId = viewModel.sessionId;
                const viewState = view.widget.getViewState();
                view.clear();
                await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { sessionId }, pinned: true, viewState: viewState } }, moveTo === MoveToNewLocation.Window ? editorService_1.AUX_WINDOW_GROUP : editorService_1.ACTIVE_GROUP);
            }
        };
    }
    function registerMoveActions() {
        (0, actions_1.registerAction2)(class GlobalMoveToEditorAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.chat.openInEditor`,
                    title: (0, nls_1.localize2)('interactiveSession.openInEditor.label', "Open Chat in Editor"),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true
                });
            }
            async run(accessor, ...args) {
                executeMoveToAction(accessor, MoveToNewLocation.Editor);
            }
        });
        (0, actions_1.registerAction2)(class GlobalMoveToNewWindowAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.chat.openInNewWindow`,
                    title: (0, nls_1.localize2)('interactiveSession.openInNewWindow.label', "Open Chat in New Window"),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true
                });
            }
            async run(accessor, ...args) {
                executeMoveToAction(accessor, MoveToNewLocation.Window);
            }
        });
        (0, actions_1.registerAction2)(class GlobalMoveToSidebarAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: `workbench.action.chat.openInSidebar`,
                    title: (0, nls_1.localize2)('interactiveSession.openInSidebar.label', "Open Chat in Side Bar"),
                    category: chatActions_1.CHAT_CATEGORY,
                    precondition: chatContextKeys_1.CONTEXT_PROVIDER_EXISTS,
                    f1: true,
                    menu: [{
                            id: actions_1.MenuId.EditorTitle,
                            order: 0,
                            when: contextkeys_1.ActiveEditorContext.isEqualTo(chatEditorInput_1.ChatEditorInput.EditorID),
                        }]
                });
            }
            async run(accessor, ...args) {
                return moveToSidebar(accessor);
            }
        });
    }
    async function executeMoveToAction(accessor, moveTo) {
        const widgetService = accessor.get(chat_1.IChatWidgetService);
        const viewService = accessor.get(viewsService_1.IViewsService);
        const chatService = accessor.get(chatService_1.IChatService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const widget = widgetService.lastFocusedWidget;
        if (!widget || !('viewId' in widget.viewContext)) {
            const providerId = chatService.getProviderInfos()[0].id;
            await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { providerId }, pinned: true } }, moveTo === MoveToNewLocation.Window ? editorService_1.AUX_WINDOW_GROUP : editorService_1.ACTIVE_GROUP);
            return;
        }
        const viewModel = widget.viewModel;
        if (!viewModel) {
            return;
        }
        const sessionId = viewModel.sessionId;
        const view = await viewService.openView(widget.viewContext.viewId);
        const viewState = view.widget.getViewState();
        view.clear();
        await editorService.openEditor({ resource: chatEditorInput_1.ChatEditorInput.getNewEditorUri(), options: { target: { sessionId }, pinned: true, viewState: viewState } }, moveTo === MoveToNewLocation.Window ? editorService_1.AUX_WINDOW_GROUP : editorService_1.ACTIVE_GROUP);
    }
    async function moveToSidebar(accessor) {
        const viewsService = accessor.get(viewsService_1.IViewsService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const chatContribService = accessor.get(chatContributionService_1.IChatContributionService);
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const chatEditorInput = editorService.activeEditor;
        if (chatEditorInput instanceof chatEditorInput_1.ChatEditorInput && chatEditorInput.sessionId && chatEditorInput.providerId) {
            await editorService.closeEditor({ editor: chatEditorInput, groupId: editorGroupService.activeGroup.id });
            const viewId = chatContribService.getViewIdForProvider(chatEditorInput.providerId);
            const view = await viewsService.openView(viewId);
            view.loadSession(chatEditorInput.sessionId);
        }
        else {
            const chatService = accessor.get(chatService_1.IChatService);
            const providerId = chatService.getProviderInfos()[0].id;
            const viewId = chatContribService.getViewIdForProvider(providerId);
            await viewsService.openView(viewId);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1vdmVBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvYWN0aW9ucy9jaGF0TW92ZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7SUEwQ2hHLHNEQUVDO0lBRUQsNERBRUM7SUFFRCwwQ0FvQkM7SUFFRCxrREFzREM7SUExR0QsSUFBSyxpQkFHSjtJQUhELFdBQUssaUJBQWlCO1FBQ3JCLHNDQUFpQixDQUFBO1FBQ2pCLHNDQUFpQixDQUFBO0lBQ2xCLENBQUMsRUFISSxpQkFBaUIsS0FBakIsaUJBQWlCLFFBR3JCO0lBRUQsTUFBTSx5Q0FBeUMsR0FBRyxDQUFDLE1BQWMsRUFBRSxVQUFrQixFQUFFLE1BQXlCLEVBQWtELEVBQUUsQ0FBQyxDQUFDO1FBQ3JLLEVBQUUsRUFBRSx5QkFBeUIsVUFBVSxVQUFVLE1BQU0sRUFBRTtRQUN6RCxLQUFLLEVBQUU7WUFDTixLQUFLLEVBQUUsTUFBTSxLQUFLLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMseUJBQXlCLEVBQUUscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxjQUFRLEVBQUMsNEJBQTRCLEVBQUUseUJBQXlCLENBQUM7WUFDM0ssUUFBUSxFQUFFLE1BQU0sS0FBSyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyx5QkFBeUI7U0FDakc7UUFDRCxRQUFRLEVBQUUsMkJBQWE7UUFDdkIsWUFBWSxFQUFFLHlDQUF1QjtRQUNyQyxFQUFFLEVBQUUsS0FBSztRQUNULE1BQU07UUFDTixJQUFJLEVBQUU7WUFDTCxFQUFFLEVBQUUsZ0JBQU0sQ0FBQyxTQUFTO1lBQ3BCLElBQUksRUFB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