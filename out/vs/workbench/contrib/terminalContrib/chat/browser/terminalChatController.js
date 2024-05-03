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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatWidget", "vs/base/common/htmlContent", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat"], function (require, exports, cancellation_1, event_1, lazy_1, lifecycle_1, configuration_1, contextkey_1, instantiation_1, chat_1, chatAgents_1, chatService_1, terminal_1, terminalChatWidget_1, htmlContent_1, chatModel_1, terminalChat_1) {
    "use strict";
    var TerminalChatController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatController = void 0;
    var Message;
    (function (Message) {
        Message[Message["NONE"] = 0] = "NONE";
        Message[Message["ACCEPT_SESSION"] = 1] = "ACCEPT_SESSION";
        Message[Message["CANCEL_SESSION"] = 2] = "CANCEL_SESSION";
        Message[Message["PAUSE_SESSION"] = 4] = "PAUSE_SESSION";
        Message[Message["CANCEL_REQUEST"] = 8] = "CANCEL_REQUEST";
        Message[Message["CANCEL_INPUT"] = 16] = "CANCEL_INPUT";
        Message[Message["ACCEPT_INPUT"] = 32] = "ACCEPT_INPUT";
        Message[Message["RERUN_INPUT"] = 64] = "RERUN_INPUT";
    })(Message || (Message = {}));
    let TerminalChatController = class TerminalChatController extends lifecycle_1.Disposable {
        static { TerminalChatController_1 = this; }
        static { this.ID = 'terminal.chat'; }
        static get(instance) {
            return instance.getContribution(TerminalChatController_1.ID);
        }
        /**
         * The chat widget for the controller, this will be undefined if xterm is not ready yet (ie. the
         * terminal is still initializing).
         */
        get chatWidget() { return this._chatWidget?.value; }
        get lastResponseContent() {
            return this._lastResponseContent;
        }
        constructor(_instance, processManager, widgetManager, _configurationService, _terminalService, _instantiationService, _chatAgentService, _contextKeyService, _chatAccessibilityService, _chatWidgetService, _chatService, _chatCodeBlockContextProviderService) {
            super();
            this._instance = _instance;
            this._configurationService = _configurationService;
            this._terminalService = _terminalService;
            this._instantiationService = _instantiationService;
            this._chatAgentService = _chatAgentService;
            this._contextKeyService = _contextKeyService;
            this._chatAccessibilityService = _chatAccessibilityService;
            this._chatWidgetService = _chatWidgetService;
            this._chatService = _chatService;
            this._chatCodeBlockContextProviderService = _chatCodeBlockContextProviderService;
            this._messages = this._store.add(new event_1.Emitter());
            this.onDidAcceptInput = event_1.Event.filter(this._messages.event, m => m === 32 /* Message.ACCEPT_INPUT */, this._store);
            this.onDidCancelInput = event_1.Event.filter(this._messages.event, m => m === 16 /* Message.CANCEL_INPUT */ || m === 2 /* Message.CANCEL_SESSION */, this._store);
            this._terminalAgentName = 'terminal';
            this._model = this._register(new lifecycle_1.MutableDisposable());
            this._forcedPlaceholder = undefined;
            this._requestActiveContextKey = terminalChat_1.TerminalChatContextKeys.requestActive.bindTo(this._contextKeyService);
            this._terminalAgentRegisteredContextKey = terminalChat_1.TerminalChatContextKeys.agentRegistered.bindTo(this._contextKeyService);
            this._responseContainsCodeBlockContextKey = terminalChat_1.TerminalChatContextKeys.responseContainsCodeBlock.bindTo(this._contextKeyService);
            this._responseSupportsIssueReportingContextKey = terminalChat_1.TerminalChatContextKeys.responseSupportsIssueReporting.bindTo(this._contextKeyService);
            this._sessionResponseVoteContextKey = terminalChat_1.TerminalChatContextKeys.sessionResponseVote.bindTo(this._contextKeyService);
            if (!this._configurationService.getValue("terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */)) {
                return;
            }
            if (!this.initTerminalAgent()) {
                this._register(this._chatAgentService.onDidChangeAgents(() => this.initTerminalAgent()));
            }
            this._register(this._chatCodeBlockContextProviderService.registerProvider({
                getCodeBlockContext: (editor) => {
                    if (!editor || !this._chatWidget?.hasValue || !this.hasFocus()) {
                        return;
                    }
                    return {
                        element: editor,
                        code: editor.getValue(),
                        codeBlockIndex: 0,
                        languageId: editor.getModel().getLanguageId()
                    };
                }
            }, 'terminal'));
            // TODO
            // This is glue/debt that's needed while ChatModel isn't yet adopted. The chat model uses
            // a default chat model (unless configured) and feedback is reported against that one. This
            // code forwards the feedback to an actual registered provider
            this._register(this._chatService.onDidPerformUserAction(e => {
                if (e.providerId === this._chatWidget?.rawValue?.inlineChatWidget.getChatModel().providerId) {
                    if (e.action.kind === 'bug') {
                        this.acceptFeedback(undefined);
                    }
                    else if (e.action.kind === 'vote') {
                        this.acceptFeedback(e.action.direction === chatService_1.InteractiveSessionVoteDirection.Up);
                    }
                }
            }));
        }
        initTerminalAgent() {
            const terminalAgent = this._chatAgentService.getAgentsByName(this._terminalAgentName)[0];
            if (terminalAgent) {
                this._terminalAgentId = terminalAgent.id;
                this._terminalAgentRegisteredContextKey.set(true);
                return true;
            }
            return false;
        }
        xtermReady(xterm) {
            if (!this._configurationService.getValue("terminal.integrated.experimentalInlineChat" /* TerminalSettingId.ExperimentalInlineChat */)) {
                return;
            }
            this._chatWidget = new lazy_1.Lazy(() => {
                const chatWidget = this._register(this._instantiationService.createInstance(terminalChatWidget_1.TerminalChatWidget, this._instance.domElement, this._instance));
                this._register(chatWidget.focusTracker.onDidFocus(() => {
                    TerminalChatController_1.activeChatWidget = this;
                    if (!(0, terminal_1.isDetachedTerminalInstance)(this._instance)) {
                        this._terminalService.setActiveInstance(this._instance);
                    }
                }));
                this._register(chatWidget.focusTracker.onDidBlur(() => {
                    TerminalChatController_1.activeChatWidget = undefined;
                    this._instance.resetScrollbarVisibility();
                }));
                if (!this._instance.domElement) {
                    throw new Error('FindWidget expected terminal DOM to be initialized');
                }
                return chatWidget;
            });
        }
        acceptFeedback(helpful) {
            const providerId = this._chatService.getProviderInfos()?.[0]?.id;
            const model = this._model.value;
            if (!providerId || !this._currentRequest || !model) {
                return;
            }
            let action;
            if (helpful === undefined) {
                action = { kind: 'bug' };
            }
            else {
                this._sessionResponseVoteContextKey.set(helpful ? 'up' : 'down');
                action = { kind: 'vote', direction: helpful ? chatService_1.InteractiveSessionVoteDirection.Up : chatService_1.InteractiveSessionVoteDirection.Down };
            }
            // TODO:extract into helper method
            for (const request of model.getRequests()) {
                if (request.response?.response.value || request.response?.result) {
                    this._chatService.notifyUserAction({
                        providerId,
                        sessionId: request.session.sessionId,
                        requestId: request.id,
                        agentId: request.response?.agent?.id,
                        result: request.response?.result,
                        action
                    });
                }
            }
            this._chatWidget?.value.inlineChatWidget.updateStatus('Thank you for your feedback!', { resetAfter: 1250 });
        }
        cancel() {
            if (this._currentRequest) {
                this._model.value?.cancelRequest(this._currentRequest);
            }
            this._requestActiveContextKey.set(false);
            this._chatWidget?.value.inlineChatWidget.updateProgress(false);
            this._chatWidget?.value.inlineChatWidget.updateInfo('');
            this._chatWidget?.value.inlineChatWidget.updateToolbar(true);
        }
        _updatePlaceholder() {
            const inlineChatWidget = this._chatWidget?.value.inlineChatWidget;
            if (inlineChatWidget) {
                inlineChatWidget.placeholder = this._getPlaceholderText();
            }
        }
        _getPlaceholderText() {
            return this._forcedPlaceholder ?? '';
        }
        setPlaceholder(text) {
            this._forcedPlaceholder = text;
            this._updatePlaceholder();
        }
        resetPlaceholder() {
            this._forcedPlaceholder = undefined;
            this._updatePlaceholder();
        }
        clear() {
            if (this._currentRequest) {
                this._model.value?.cancelRequest(this._currentRequest);
            }
            this._model.clear();
            this._chatWidget?.rawValue?.hide();
            this._chatWidget?.rawValue?.setValue(undefined);
            this._responseContainsCodeBlockContextKey.reset();
            this._sessionResponseVoteContextKey.reset();
            this._requestActiveContextKey.reset();
        }
        async acceptInput() {
            const providerInfo = this._chatService.getProviderInfos()?.[0];
            if (!providerInfo) {
                return;
            }
            if (!this._model.value) {
                this._model.value = this._chatService.startSession(providerInfo.id, cancellation_1.CancellationToken.None);
                if (!this._model.value) {
                    throw new Error('Could not start chat session');
                }
            }
            this._messages.fire(32 /* Message.ACCEPT_INPUT */);
            const model = this._model.value;
            this._lastInput = this._chatWidget?.value?.input();
            if (!this._lastInput) {
                return;
            }
            const accessibilityRequestId = this._chatAccessibilityService.acceptRequest();
            this._requestActiveContextKey.set(true);
            const cancellationToken = new cancellation_1.CancellationTokenSource().token;
            let responseContent = '';
            const progressCallback = (progress) => {
                if (cancellationToken.isCancellationRequested) {
                    return;
                }
                if (progress.kind === 'content') {
                    responseContent += progress.content;
                }
                else if (progress.kind === 'markdownContent') {
                    responseContent += progress.content.value;
                }
                if (this._currentRequest) {
                    model.acceptResponseProgress(this._currentRequest, progress);
                }
            };
            await model.waitForInitialization();
            this._chatWidget?.value.addToHistory(this._lastInput);
            const request = {
                text: this._lastInput,
                parts: []
            };
            const requestVarData = {
                variables: []
            };
            this._currentRequest = model.addRequest(request, requestVarData);
            const requestProps = {
                sessionId: model.sessionId,
                requestId: this._currentRequest.id,
                agentId: this._terminalAgentId,
                message: this._lastInput,
                variables: { variables: [] },
                location: chatAgents_1.ChatAgentLocation.Terminal
            };
            try {
                const task = this._chatAgentService.invokeAgent(this._terminalAgentId, requestProps, progressCallback, (0, chatModel_1.getHistoryEntriesFromModel)(model), cancellationToken);
                this._chatWidget?.value.inlineChatWidget.updateChatMessage(undefined);
                this._chatWidget?.value.inlineChatWidget.updateFollowUps(undefined);
                this._chatWidget?.value.inlineChatWidget.updateProgress(true);
                this._chatWidget?.value.inlineChatWidget.updateInfo(chat_1.GeneratingPhrase + '\u2026');
                await task;
            }
            catch (e) {
            }
            finally {
                this._requestActiveContextKey.set(false);
                this._chatWidget?.value.inlineChatWidget.updateProgress(false);
                this._chatWidget?.value.inlineChatWidget.updateInfo('');
                this._chatWidget?.value.inlineChatWidget.updateToolbar(true);
                if (this._currentRequest) {
                    model.completeResponse(this._currentRequest);
                }
                this._lastResponseContent = responseContent;
                if (this._currentRequest) {
                    this._chatAccessibilityService.acceptResponse(responseContent, accessibilityRequestId);
                    const containsCode = responseContent.includes('```');
                    this._chatWidget?.value.inlineChatWidget.updateChatMessage({ message: new htmlContent_1.MarkdownString(responseContent), requestId: this._currentRequest.id, providerId: 'terminal' }, false, containsCode);
                    this._responseContainsCodeBlockContextKey.set(containsCode);
                    this._chatWidget?.value.inlineChatWidget.updateToolbar(true);
                }
                const supportIssueReporting = this._currentRequest?.response?.agent?.metadata?.supportIssueReporting;
                if (supportIssueReporting !== undefined) {
                    this._responseSupportsIssueReportingContextKey.set(supportIssueReporting);
                }
            }
        }
        updateInput(text, selectAll = true) {
            const widget = this._chatWidget?.value.inlineChatWidget;
            if (widget) {
                widget.value = text;
                if (selectAll) {
                    widget.selectAll();
                }
            }
        }
        getInput() {
            return this._chatWidget?.value.input() ?? '';
        }
        focus() {
            this._chatWidget?.value.focus();
        }
        hasFocus() {
            return !!this._chatWidget?.rawValue?.hasFocus() ?? false;
        }
        async acceptCommand(shouldExecute) {
            const code = await this.chatWidget?.inlineChatWidget.getCodeBlockInfo(0);
            if (!code) {
                return;
            }
            this._chatWidget?.value.acceptCommand(code.textEditorModel.getValue(), shouldExecute);
        }
        reveal() {
            this._chatWidget?.value.reveal();
        }
        async viewInChat() {
            const providerInfo = this._chatService.getProviderInfos()?.[0];
            if (!providerInfo) {
                return;
            }
            const model = this._model.value;
            const widget = await this._chatWidgetService.revealViewForProvider(providerInfo.id);
            if (widget) {
                if (widget.viewModel && model) {
                    for (const request of model.getRequests()) {
                        if (request.response?.response.value || request.response?.result) {
                            this._chatService.addCompleteRequest(widget.viewModel.sessionId, request.message, request.variableData, {
                                message: request.response.response.value,
                                result: request.response.result,
                                followups: request.response.followups
                            });
                        }
                    }
                    widget.focusLastMessage();
                }
                else if (!model) {
                    widget.focusInput();
                }
                this._chatWidget?.rawValue?.hide();
            }
        }
        // TODO: Move to register calls, don't override
        dispose() {
            if (this._currentRequest) {
                this._model.value?.cancelRequest(this._currentRequest);
            }
            super.dispose();
            this.clear();
        }
    };
    exports.TerminalChatController = TerminalChatController;
    exports.TerminalChatController = TerminalChatController = TerminalChatController_1 = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, terminal_1.ITerminalService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, chatAgents_1.IChatAgentService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, chat_1.IChatAccessibilityService),
        __param(9, chat_1.IChatWidgetService),
        __param(10, chatService_1.IChatService),
        __param(11, chat_1.IChatCodeBlockContextProviderService)
    ], TerminalChatController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0Q29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2NoYXQvYnJvd3Nlci90ZXJtaW5hbENoYXRDb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF3QmhHLElBQVcsT0FTVjtJQVRELFdBQVcsT0FBTztRQUNqQixxQ0FBUSxDQUFBO1FBQ1IseURBQXVCLENBQUE7UUFDdkIseURBQXVCLENBQUE7UUFDdkIsdURBQXNCLENBQUE7UUFDdEIseURBQXVCLENBQUE7UUFDdkIsc0RBQXFCLENBQUE7UUFDckIsc0RBQXFCLENBQUE7UUFDckIsb0RBQW9CLENBQUE7SUFDckIsQ0FBQyxFQVRVLE9BQU8sS0FBUCxPQUFPLFFBU2pCO0lBRU0sSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTs7aUJBQ3JDLE9BQUUsR0FBRyxlQUFlLEFBQWxCLENBQW1CO1FBRXJDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBMkI7WUFDckMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUF5Qix3QkFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRixDQUFDO1FBYUQ7OztXQUdHO1FBQ0gsSUFBSSxVQUFVLEtBQXFDLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBY3BGLElBQUksbUJBQW1CO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDO1FBQ2xDLENBQUM7UUFVRCxZQUNrQixTQUE0QixFQUM3QyxjQUF1QyxFQUN2QyxhQUFvQyxFQUNiLHFCQUFvRCxFQUN6RCxnQkFBbUQsRUFDOUMscUJBQTZELEVBQ2pFLGlCQUFxRCxFQUNwRCxrQkFBdUQs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