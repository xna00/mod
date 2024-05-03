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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/log/common/log", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/memento", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/contrib/chat/browser/chatWidget", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, cancellation_1, lifecycle_1, configuration_1, contextkey_1, contextView_1, instantiation_1, serviceCollection_1, keybinding_1, log_1, opener_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, viewPane_1, memento_1, theme_1, views_1, chatWidget_1, chatAgents_1, chatService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatViewPane = exports.CHAT_SIDEBAR_PANEL_ID = void 0;
    exports.CHAT_SIDEBAR_PANEL_ID = 'workbench.panel.chatSidebar';
    let ChatViewPane = class ChatViewPane extends viewPane_1.ViewPane {
        static { this.ID = 'workbench.panel.chat.view'; }
        get widget() { return this._widget; }
        constructor(chatViewOptions, options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService, storageService, chatService, logService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.chatViewOptions = chatViewOptions;
            this.storageService = storageService;
            this.chatService = chatService;
            this.logService = logService;
            this.modelDisposables = this._register(new lifecycle_1.DisposableStore());
            this.didProviderRegistrationFail = false;
            this.didUnregisterProvider = false;
            // View state for the ViewPane is currently global per-provider basically, but some other strictly per-model state will require a separate memento.
            this.memento = new memento_1.Memento('interactive-session-view-' + this.chatViewOptions.providerId, this.storageService);
            this.viewState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            this._register(this.chatService.onDidRegisterProvider(({ providerId }) => {
                if (providerId === this.chatViewOptions.providerId && !this._widget?.viewModel) {
                    const sessionId = this.getSessionId();
                    const model = sessionId ? this.chatService.getOrRestoreSession(sessionId) : undefined;
                    // The widget may be hidden at this point, because welcome views were allowed. Use setVisible to
                    // avoid doing a render while the widget is hidden. This is changing the condition in `shouldShowWelcome`
                    // so it should fire onDidChangeViewWelcomeState.
                    try {
                        this._widget.setVisible(false);
                        this.updateModel(model);
                        this.didProviderRegistrationFail = false;
                        this.didUnregisterProvider = false;
                        this._onDidChangeViewWelcomeState.fire();
                    }
                    finally {
                        this.widget.setVisible(true);
                    }
                }
            }));
            this._register(this.chatService.onDidUnregisterProvider(({ providerId }) => {
                if (providerId === this.chatViewOptions.providerId) {
                    this.didUnregisterProvider = true;
                    this._onDidChangeViewWelcomeState.fire();
                }
            }));
        }
        updateModel(model, viewState) {
            this.modelDisposables.clear();
            model = model ?? (this.chatService.transferredSessionData?.sessionId
                ? this.chatService.getOrRestoreSession(this.chatService.transferredSessionData.sessionId)
                : this.chatService.startSession(this.chatViewOptions.providerId, cancellation_1.CancellationToken.None));
            if (!model) {
                throw new Error('Could not start chat session');
            }
            this._widget.setModel(model, { ...(viewState ?? this.viewState) });
            this.viewState.sessionId = model.sessionId;
        }
        shouldShowWelcome() {
            const noPersistedSessions = !this.chatService.hasSessions(this.chatViewOptions.providerId);
            return this.didUnregisterProvider || !this._widget?.viewModel && (noPersistedSessions || this.didProviderRegistrationFail);
        }
        getSessionId() {
            let sessionId;
            if (this.chatService.transferredSessionData) {
                sessionId = this.chatService.transferredSessionData.sessionId;
                this.viewState.inputValue = this.chatService.transferredSessionData.inputValue;
            }
            else {
                sessionId = this.viewState.sessionId;
            }
            return sessionId;
        }
        renderBody(parent) {
            try {
                super.renderBody(parent);
                const scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.scopedContextKeyService]));
                this._widget = this._register(scopedInstantiationService.createInstance(chatWidget_1.ChatWidget, chatAgents_1.ChatAgentLocation.Panel, { viewId: this.id }, { supportsFileReferences: true }, {
                    listForeground: theme_1.SIDE_BAR_FOREGROUND,
                    listBackground: this.getBackgroundColor(),
                    inputEditorBackground: this.getBackgroundColor(),
                    resultEditorBackground: colorRegistry_1.editorBackground
                }));
                this._register(this.onDidChangeBodyVisibility(visible => {
                    this._widget.setVisible(visible);
                }));
                this._register(this._widget.onDidClear(() => this.clear()));
                this._widget.render(parent);
                const sessionId = this.getSessionId();
                // Render the welcome view if this session gets disposed at any point,
                // including if the provider registration fails
                const disposeListener = sessionId ? this._register(this.chatService.onDidDisposeSession((e) => {
                    if (e.reason === 'initializationFailed' && e.providerId === this.chatViewOptions.providerId) {
                        this.didProviderRegistrationFail = true;
                        disposeListener?.dispose();
                        this._onDidChangeViewWelcomeState.fire();
                    }
                })) : undefined;
                const model = sessionId ? this.chatService.getOrRestoreSession(sessionId) : undefined;
                this.updateModel(model);
            }
            catch (e) {
                this.logService.error(e);
                throw e;
            }
        }
        acceptInput(query) {
            this._widget.acceptInput(query);
        }
        async clear() {
            if (this.widget.viewModel) {
                this.chatService.clearSession(this.widget.viewModel.sessionId);
            }
            this.updateModel(undefined, { ...this.viewState, inputValue: undefined });
        }
        loadSession(sessionId) {
            if (this.widget.viewModel) {
                this.chatService.clearSession(this.widget.viewModel.sessionId);
            }
            const newModel = this.chatService.getOrRestoreSession(sessionId);
            this.updateModel(newModel);
        }
        focusInput() {
            this._widget.focusInput();
        }
        focus() {
            super.focus();
            this._widget.focusInput();
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this._widget.layout(height, width);
        }
        saveState() {
            if (this._widget) {
                // Since input history is per-provider, this is handled by a separate service and not the memento here.
                // TODO multiple chat views will overwrite each other
                this._widget.saveState();
                const widgetViewState = this._widget.getViewState();
                this.viewState.inputValue = widgetViewState.inputValue;
                this.viewState.inputState = widgetViewState.inputState;
                this.memento.saveMemento();
            }
            super.saveState();
        }
    };
    exports.ChatViewPane = ChatViewPane;
    exports.ChatViewPane = ChatViewPane = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, storage_1.IStorageService),
        __param(12, chatService_1.IChatService),
        __param(13, log_1.ILogService)
    ], ChatViewPane);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFZpZXdQYW5lLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2Jyb3dzZXIvY2hhdFZpZXdQYW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWtDbkYsUUFBQSxxQkFBcUIsR0FBRyw2QkFBNkIsQ0FBQztJQUM1RCxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsbUJBQVE7aUJBQ2xDLE9BQUUsR0FBRywyQkFBMkIsQUFBOUIsQ0FBK0I7UUFHeEMsSUFBSSxNQUFNLEtBQWlCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFRakQsWUFDa0IsZUFBaUMsRUFDbEQsT0FBeUIsRUFDTCxpQkFBcUMsRUFDcEMsa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QyxpQkFBcUMsRUFDakMscUJBQTZDLEVBQzlDLG9CQUEyQyxFQUNsRCxhQUE2QixFQUM5QixZQUEyQixFQUN2QixnQkFBbUMsRUFDckMsY0FBZ0QsRUFDbkQsV0FBMEMsRUFDM0MsVUFBd0M7WUFFckQsS0FBSyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFmMUssb0JBQWUsR0FBZixlQUFlLENBQWtCO1lBV2hCLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUNsQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUMxQixlQUFVLEdBQVYsVUFBVSxDQUFhO1lBcEI5QyxxQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFHekQsZ0NBQTJCLEdB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