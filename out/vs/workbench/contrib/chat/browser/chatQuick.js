/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/sash/sash", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/layout/browser/layoutService", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, dom, sash_1, async_1, cancellation_1, event_1, lifecycle_1, actions_1, contextkey_1, instantiation_1, serviceCollection_1, layoutService_1, quickInput_1, colorRegistry_1, chat_1, chatWidget_1, chatAgents_1, chatService_1) {
    "use strict";
    var QuickChat_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickChatService = void 0;
    let QuickChatService = class QuickChatService extends lifecycle_1.Disposable {
        constructor(quickInputService, chatService, instantiationService) {
            super();
            this.quickInputService = quickInputService;
            this.chatService = chatService;
            this.instantiationService = instantiationService;
            this._onDidClose = this._register(new event_1.Emitter());
            this.onDidClose = this._onDidClose.event;
        }
        get enabled() {
            return this.chatService.getProviderInfos().length > 0;
        }
        get focused() {
            const widget = this._input?.widget;
            if (!widget) {
                return false;
            }
            return dom.isAncestorOfActiveElement(widget);
        }
        toggle(providerId, options) {
            // If the input is already shown, hide it. This provides a toggle behavior of the quick
            // pick. This should not happen when there is a query.
            if (this.focused && !options?.query) {
                this.close();
            }
            else {
                this.open(providerId, options);
                // If this is a partial query, the value should be cleared when closed as otherwise it
                // would remain for the next time the quick chat is opened in any context.
                if (options?.isPartialQuery) {
                    const disposable = this._store.add(event_1.Event.once(this.onDidClose)(() => {
                        this._currentChat?.clearValue();
                        this._store.delete(disposable);
                    }));
                }
            }
        }
        open(providerId, options) {
            if (this._input) {
                if (this._currentChat && options?.query) {
                    this._currentChat.focus();
                    this._currentChat.setValue(options.query, options.selection);
                    if (!options.isPartialQuery) {
                        this._currentChat.acceptInput();
                    }
                    return;
                }
                return this.focus();
            }
            // Check if any providers are available. If not, show nothing
            // This shouldn't be needed because of the precondition, but just in case
            const providerInfo = providerId
                ? this.chatService.getProviderInfos().find(info => info.id === providerId)
                : this.chatService.getProviderInfos()[0];
            if (!providerInfo) {
                return;
            }
            const disposableStore = new lifecycle_1.DisposableStore();
            this._input = this.quickInputService.createQuickWidget();
            this._input.contextKey = 'chatInputVisible';
            this._input.ignoreFocusOut = true;
            disposableStore.add(this._input);
            this._container ??= dom.$('.interactive-session');
            this._input.widget = this._container;
            this._input.show();
            if (!this._currentChat) {
                this._currentChat = this.instantiationService.createInstance(QuickChat, {
                    providerId: providerInfo.id,
                });
                // show needs to come after the quickpick is shown
                this._currentChat.render(this._container);
            }
            else {
                this._currentChat.show();
            }
            disposableStore.add(this._input.onDidHide(() => {
                disposableStore.dispose();
                this._currentChat.hide();
                this._input = undefined;
                this._onDidClose.fire();
            }));
            this._currentChat.focus();
            if (options?.query) {
                this._currentChat.setValue(options.query, options.selection);
                if (!options.isPartialQuery) {
                    this._currentChat.acceptInput();
                }
            }
        }
        focus() {
            this._currentChat?.focus();
        }
        close() {
            this._input?.dispose();
            this._input = undefined;
        }
        async openInChatView() {
            await this._currentChat?.openChatView();
            this.close();
        }
    };
    exports.QuickChatService = QuickChatService;
    exports.QuickChatService = QuickChatService = __decorate([
        __param(0, quickInput_1.IQuickInputService),
        __param(1, chatService_1.IChatService),
        __param(2, instantiation_1.IInstantiationService)
    ], QuickChatService);
    let QuickChat = class QuickChat extends lifecycle_1.Disposable {
        static { QuickChat_1 = this; }
        // TODO@TylerLeonhardt: be responsive to window size
        static { this.DEFAULT_MIN_HEIGHT = 200; }
        static { this.DEFAULT_HEIGHT_OFFSET = 100; }
        constructor(_options, instantiationService, contextKeyService, chatService, _chatWidgetService, layoutService) {
            super();
            this._options = _options;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.chatService = chatService;
            this._chatWidgetService = _chatWidgetService;
            this.layoutService = layoutService;
            this.maintainScrollTimer = this._register(new lifecycle_1.MutableDisposable());
            this._deferUpdatingDynamicLayout = false;
        }
        clear() {
            this.model?.dispose();
            this.model = undefined;
            this.updateModel();
            this.widget.inputEditor.setValue('');
        }
        focus(selection) {
            if (this.widget) {
                this.widget.focusInput();
                const value = this.widget.inputEditor.getValue();
                if (value) {
                    this.widget.inputEditor.setSelection(selection ?? {
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: value.length + 1
                    });
                }
            }
        }
        hide() {
            this.widget.setVisible(false);
            // Maintain scroll position for a short time so that if the user re-shows the chat
            // the same scroll position will be used.
            this.maintainScrollTimer.value = (0, async_1.disposableTimeout)(() => {
                // At this point, clear this mutable disposable which will be our signal that
                // the timer has expired and we should stop maintaining scroll position
                this.maintainScrollTimer.clear();
            }, 30 * 1000); // 30 seconds
        }
        show() {
            this.widget.setVisible(true);
            // If the mutable disposable is set, then we are keeping the existing scroll position
            // so we should not update the layout.
            if (this._deferUpdatingDynamicLayout) {
                this._deferUpdatingDynamicLayout = false;
                this.widget.updateDynamicChatTreeItemLayout(2, this.maxHeight);
            }
            if (!this.maintainScrollTimer.value) {
                this.widget.layoutDynamicChatTreeItemMode();
            }
        }
        render(parent) {
            if (this.widget) {
                throw new Error('Cannot render quick chat twice');
            }
            const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([
                contextkey_1.IContextKeyService,
                this._register(this.contextKeyService.createScoped(parent))
            ]));
            this.widget = this._register(scopedInstantiationService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Panel, { resource: true }, { renderInputOnTop: true, renderStyle: 'compact', menus: { inputSideToolbar: actions_1.MenuId.ChatInputSide } }, {
                listForeground: colorRegistry_1.quickInputForeground,
                listBackground: colorRegistry_1.quickInputBackground,
                inputEditorBackground: colorRegistry_1.inputBackground,
                resultEditorBackground: colorRegistry_1.editorBackground
            }));
            this.widget.render(parent);
            this.widget.setVisible(true);
            this.widget.setDynamicChatTreeItemLayout(2, this.maxHeight);
            this.updateModel();
            this.sash = this._register(new sash_1.Sash(parent, { getHorizontalSashTop: () => parent.offsetHeight }, { orientation: 1 /* Orientation.HORIZONTAL */ }));
            this.registerListeners(parent);
        }
        get maxHeight() {
            return this.layoutService.mainContainerDimension.height - QuickChat_1.DEFAULT_HEIGHT_OFFSET;
        }
        registerListeners(parent) {
            this._register(this.layoutService.onDidLayoutMainContainer(() => {
                if (this.widget.visible) {
                    this.widget.updateDynamicChatTreeItemLayout(2, this.maxHeight);
                }
                else {
                    // If the chat is not visible, then we should defer updating the layout
                    // because it relies on offsetHeight which only works correctly
                    // when the chat is visible.
                    this._deferUpdatingDynamicLayout = true;
                }
            }));
            this._register(this.widget.inputEditor.onDidChangeModelContent((e) => {
                this._currentQuery = this.widget.inputEditor.getValue();
            }));
            this._register(this.widget.onDidClear(() => this.clear()));
            this._register(this.widget.onDidChangeHeight((e) => this.sash.layout()));
            const width = parent.offsetWidth;
            this._register(this.sash.onDidStart(() => {
                this.widget.isDynamicChatTreeItemLayoutEnabled = false;
            }));
            this._register(this.sash.onDidChange((e) => {
                if (e.currentY < QuickChat_1.DEFAULT_MIN_HEIGHT || e.currentY > this.maxHeight) {
                    return;
                }
                this.widget.layout(e.currentY, width);
                this.sash.layout();
            }));
            this._register(this.sash.onDidReset(() => {
                this.widget.isDynamicChatTreeItemLayoutEnabled = true;
                this.widget.layoutDynamicChatTreeItemMode();
            }));
        }
        async acceptInput() {
            return this.widget.acceptInput();
        }
        async openChatView() {
            const widget = await this._chatWidgetService.revealViewForProvider(this._options.providerId);
            if (!widget?.viewModel || !this.model) {
                return;
            }
            for (const request of this.model.getRequests()) {
                if (request.response?.response.value || request.response?.result) {
                    this.chatService.addCompleteRequest(widget.viewModel.sessionId, request.message, request.variableData, {
                        message: request.response.response.value,
                        result: request.response.result,
                        followups: request.response.followups
                    });
                }
                else if (request.message) {
                }
            }
            const value = this.widget.inputEditor.getValue();
            if (value) {
                widget.inputEditor.setValue(value);
            }
            widget.focusInput();
        }
        setValue(value, selection) {
            this.widget.inputEditor.setValue(value);
            this.focus(selection);
        }
        clearValue() {
            this.widget.inputEditor.setValue('');
        }
        updateModel() {
            this.model ??= this.chatService.startSession(this._options.providerId, cancellation_1.CancellationToken.None);
            if (!this.model) {
                throw new Error('Could not start chat session');
            }
            this.widget.setModel(this.model, { inputValue: this._currentQuery });
        }
    };
    QuickChat = QuickChat_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, chatService_1.IChatService),
        __param(4, chat_1.IChatWidgetService),
        __param(5, layoutService_1.ILayoutService)
    ], QuickChat);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFF1aWNrLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdFF1aWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3QnpGLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVU7UUFXL0MsWUFDcUIsaUJBQXNELEVBQzVELFdBQTBDLEVBQ2pDLG9CQUE0RDtZQUVuRixLQUFLLEVBQUUsQ0FBQztZQUo2QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQzNDLGdCQUFXLEdBQVgsV0FBVyxDQUFjO1lBQ2hCLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFYbkUsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMxRCxlQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFhN0MsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELElBQUksT0FBTztZQUNWLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBaUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBQ0QsT0FBTyxHQUFHLENBQUMseUJBQXlCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUVELE1BQU0sQ0FBQyxVQUFtQixFQUFFLE9BQStCO1lBQzFELHVGQUF1RjtZQUN2RixzREFBc0Q7WUFDdEQsSUFBSSxJQUFJLENBQUMs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