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
define(["require", "exports", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/iconRegistry", "vs/workbench/contrib/chat/browser/actions/chatActions", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/inlineChat/browser/inlineChatController", "vs/platform/commands/common/commands", "vs/workbench/common/contextkeys", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/speech/common/speechService", "vs/base/common/async", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/theme", "vs/platform/theme/common/colorRegistry", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/host/browser/host", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/chat/common/voiceChat", "vs/platform/keybinding/common/keybinding", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalContribExports", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/css!./media/voiceChatActions"], function (require, exports, event_1, arrays_1, cancellation_1, codicons_1, lifecycle_1, nls_1, actions_1, contextkey_1, instantiation_1, iconRegistry_1, chatActions_1, chat_1, chatService_1, inlineChat_1, chatContextKeys_1, inlineChatController_1, commands_1, contextkeys_1, viewsService_1, chatContributionService_1, layoutService_1, speechService_1, async_1, themeService_1, theme_1, theme_2, colorRegistry_1, configuration_1, types_1, accessibilityConfiguration_1, platform_1, configurationRegistry_1, statusbar_1, host_1, editorBrowser_1, editorService_1, extensions_1, voiceChat_1, keybinding_1, editorContextKeys_1, terminal_1, terminalContribExports_1, notebookContextKeys_1) {
    "use strict";
    var VoiceChatSessions_1, KeywordActivationContribution_1, KeywordActivationStatusEntry_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeywordActivationContribution = exports.StopListeningAndSubmitAction = exports.StopListeningInTerminalChatAction = exports.StopListeningInQuickChatAction = exports.StopListeningInChatEditorAction = exports.StopListeningInChatViewAction = exports.StopListeningAction = exports.InstallVoiceChatAction = exports.StartVoiceChatAction = exports.QuickVoiceChatAction = exports.InlineVoiceChatAction = exports.HoldToVoiceChatInChatViewAction = exports.VoiceChatInChatViewAction = exports.VOICE_KEY_HOLD_THRESHOLD = void 0;
    const CONTEXT_VOICE_CHAT_GETTING_READY = new contextkey_1.RawContextKey('voiceChatGettingReady', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatGettingReady', "True when getting ready for receiving voice input from the microphone for voice chat.") });
    const CONTEXT_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('voiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatInProgress', "True when voice recording from microphone is in progress for voice chat.") });
    const CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('quickVoiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('quickVoiceChatInProgress', "True when voice recording from microphone is in progress for quick chat.") });
    const CONTEXT_INLINE_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('inlineVoiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('inlineVoiceChatInProgress', "True when voice recording from microphone is in progress for inline chat.") });
    const CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS = new contextkey_1.RawContextKey('terminalVoiceChatInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('terminalVoiceChatInProgress', "True when voice recording from microphone is in progress for terminal chat.") });
    const CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS = new contextkey_1.RawContextKey('voiceChatInViewInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatInViewInProgress', "True when voice recording from microphone is in progress in the chat view.") });
    const CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS = new contextkey_1.RawContextKey('voiceChatInEditorInProgress', false, { type: 'boolean', description: (0, nls_1.localize)('voiceChatInEditorInProgress', "True when voice recording from microphone is in progress in the chat editor.") });
    const CanVoiceChat = contextkey_1.ContextKeyExpr.and(chatContextKeys_1.CONTEXT_PROVIDER_EXISTS, speechService_1.HasSpeechProvider);
    const FocusInChatInput = (0, types_1.assertIsDefined)(contextkey_1.ContextKeyExpr.or(inlineChat_1.CTX_INLINE_CHAT_FOCUSED, chatContextKeys_1.CONTEXT_IN_CHAT_INPUT));
    class VoiceChatSessionControllerFactory {
        static async create(accessor, context) {
            const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
            const viewsService = accessor.get(viewsService_1.IViewsService);
            const chatContributionService = accessor.get(chatContributionService_1.IChatContributionService);
            const quickChatService = accessor.get(chat_1.IQuickChatService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const terminalService = accessor.get(terminal_1.ITerminalService);
            // Currently Focused Context
            if (context === 'focused') {
                // Try with the terminal chat
                const activeInstance = terminalService.activeInstance;
                if (activeInstance) {
                    const terminalChat = terminalContribExports_1.TerminalChatController.activeChatWidget || terminalContribExports_1.TerminalChatController.get(activeInstance);
                    if (terminalChat?.hasFocus()) {
                        return VoiceChatSessionControllerFactory.doCreateForTerminalChat(terminalChat);
                    }
                }
                // Try with the chat widget service, which currently
                // only supports the chat view and quick chat
                // https://github.com/microsoft/vscode/issues/191191
                const chatInput = chatWidgetService.lastFocusedWidget;
                if (chatInput?.hasInputFocus()) {
                    // Unfortunately there does not seem to be a better way
                    // to figure out if the chat widget is in a part or picker
                    if (layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ||
                        layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */) ||
                        layoutService.hasFocus("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                        return VoiceChatSessionControllerFactory.doCreateForChatView(chatInput, viewsService, chatContributionService);
                    }
                    if (layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                        return VoiceChatSessionControllerFactory.doCreateForChatEditor(chatInput, viewsService, chatContributionService);
                    }
                    return VoiceChatSessionControllerFactory.doCreateForQuickChat(chatInput, quickChatService);
                }
                // Try with the inline chat
                const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
                if (activeCodeEditor) {
                    const inlineChat = inlineChatController_1.InlineChatController.get(activeCodeEditor);
                    if (inlineChat?.hasFocus()) {
                        return VoiceChatSessionControllerFactory.doCreateForInlineChat(inlineChat);
                    }
                }
            }
            // View Chat
            if (context === 'view' || context === 'focused' /* fallback in case 'focused' was not successful */) {
                const chatView = await VoiceChatSessionControllerFactory.revealChatView(accessor);
                if (chatView) {
                    return VoiceChatSessionControllerFactory.doCreateForChatView(chatView, viewsService, chatContributionService);
                }
            }
            // Inline Chat
            if (context === 'inline') {
                const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
                if (activeCodeEditor) {
                    const inlineChat = inlineChatController_1.InlineChatController.get(activeCodeEditor);
                    if (inlineChat) {
                        return VoiceChatSessionControllerFactory.doCreateForInlineChat(inlineChat);
                    }
                }
            }
            // Terminal Chat
            if (context === 'terminal') {
                const activeInstance = terminalService.activeInstance;
                if (activeInstance) {
                    const terminalChat = terminalContribExports_1.TerminalChatController.activeChatWidget || terminalContribExports_1.TerminalChatController.get(activeInstance);
                    if (terminalChat) {
                        return VoiceChatSessionControllerFactory.doCreateForTerminalChat(terminalChat);
                    }
                }
            }
            // Quick Chat
            if (context === 'quick') {
                quickChatService.open();
                const quickChat = chatWidgetService.lastFocusedWidget;
                if (quickChat) {
                    return VoiceChatSessionControllerFactory.doCreateForQuickChat(quickChat, quickChatService);
                }
            }
            return undefined;
        }
        static async revealChatView(accessor) {
            const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
            const chatService = accessor.get(chatService_1.IChatService);
            const provider = (0, arrays_1.firstOrDefault)(chatService.getProviderInfos());
            if (provider) {
                return chatWidgetService.revealViewForProvider(provider.id);
            }
            return undefined;
        }
        static doCreateForChatView(chatView, viewsService, chatContributionService) {
            return VoiceChatSessionControllerFactory.doCreateForChatViewOrEditor('view', chatView, viewsService, chatContributionService);
        }
        static doCreateForChatEditor(chatView, viewsService, chatContributionService) {
            return VoiceChatSessionControllerFactory.doCreateForChatViewOrEditor('editor', chatView, viewsService, chatContributionService);
        }
        static doCreateForChatViewOrEditor(context, chatView, viewsService, chatContributionService) {
            return {
                context,
                onDidAcceptInput: chatView.onDidAcceptInput,
                // TODO@bpasero cancellation needs to work better for chat editors that are not view bound
                onDidCancelInput: event_1.Event.filter(viewsService.onDidChangeViewVisibility, e => e.id === chatContributionService.getViewIdForProvider(chatView.providerId)),
                focusInput: () => chatView.focusInput(),
                acceptInput: () => chatView.acceptInput(),
                updateInput: text => chatView.setInput(text),
                getInput: () => chatView.getInput(),
                setInputPlaceholder: text => chatView.setInputPlaceholder(text),
                clearInputPlaceholder: () => chatView.resetInputPlaceholder()
            };
        }
        static doCreateForQuickChat(quickChat, quickChatService) {
            return {
                context: 'quick',
                onDidAcceptInput: quickChat.onDidAcceptInput,
                onDidCancelInput: quickChatService.onDidClose,
                focusInput: () => quickChat.focusInput(),
                acceptInput: () => quickChat.acceptInput(),
                updateInput: text => quickChat.setInput(text),
                getInput: () => quickChat.getInput(),
                setInputPlaceholder: text => quickChat.setInputPlaceholder(text),
                clearInputPlaceholder: () => quickChat.resetInputPlaceholder()
            };
        }
        static doCreateForInlineChat(inlineChat) {
            const inlineChatSession = inlineChat.joinCurrentRun() ?? inlineChat.run();
            return {
                context: 'inline',
                onDidAcceptInput: inlineChat.onDidAcceptInput,
                onDidCancelInput: event_1.Event.any(inlineChat.onDidCancelInput, event_1.Event.fromPromise(inlineChatSession)),
                focusInput: () => inlineChat.focus(),
                acceptInput: () => inlineChat.acceptInput(),
                updateInput: text => inlineChat.updateInput(text, false),
                getInput: () => inlineChat.getInput(),
                setInputPlaceholder: text => inlineChat.setPlaceholder(text),
                clearInputPlaceholder: () => inlineChat.resetPlaceholder()
            };
        }
        static doCreateForTerminalChat(terminalChat) {
            return {
                context: 'terminal',
                onDidAcceptInput: terminalChat.onDidAcceptInput,
                onDidCancelInput: terminalChat.onDidCancelInput,
                focusInput: () => terminalChat.focus(),
                acceptInput: () => terminalChat.acceptInput(),
                updateInput: text => terminalChat.updateInput(text, false),
                getInput: () => terminalChat.getInput(),
                setInputPlaceholder: text => terminalChat.setPlaceholder(text),
                clearInputPlaceholder: () => terminalChat.resetPlaceholder()
            };
        }
    }
    let VoiceChatSessions = class VoiceChatSessions {
        static { VoiceChatSessions_1 = this; }
        static { this.instance = undefined; }
        static getInstance(instantiationService) {
            if (!VoiceChatSessions_1.instance) {
                VoiceChatSessions_1.instance = instantiationService.createInstance(VoiceChatSessions_1);
            }
            return VoiceChatSessions_1.instance;
        }
        constructor(contextKeyService, voiceChatService, configurationService) {
            this.contextKeyService = contextKeyService;
            this.voiceChatService = voiceChatService;
            this.configurationService = configurationService;
            this.voiceChatInProgressKey = CONTEXT_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.voiceChatGettingReadyKey = CONTEXT_VOICE_CHAT_GETTING_READY.bindTo(this.contextKeyService);
            this.quickVoiceChatInProgressKey = CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.inlineVoiceChatInProgressKey = CONTEXT_INLINE_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.terminalVoiceChatInProgressKey = CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS.bindTo(this.contextKeyService);
            this.voiceChatInViewInProgressKey = CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS.bindTo(this.contextKeyService);
            this.voiceChatInEditorInProgressKey = CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS.bindTo(this.contextKeyService);
            this.currentVoiceChatSession = undefined;
            this.voiceChatSessionIds = 0;
        }
        async start(controller, context) {
            this.stop();
            let disableTimeout = false;
            const sessionId = ++this.voiceChatSessionIds;
            const session = this.currentVoiceChatSession = {
                id: sessionId,
                controller,
                disposables: new lifecycle_1.DisposableStore(),
                setTimeoutDisabled: (disabled) => { disableTimeout = disabled; },
                accept: () => session.controller.acceptInput(),
                stop: () => this.stop(sessionId, controller.context)
            };
            const cts = new cancellation_1.CancellationTokenSource();
            session.disposables.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
            session.disposables.add(controller.onDidAcceptInput(() => this.stop(sessionId, controller.context)));
            session.disposables.add(controller.onDidCancelInput(() => this.stop(sessionId, controller.context)));
            controller.focusInput();
            this.voiceChatGettingReadyKey.set(true);
            const voiceChatSession = await this.voiceChatService.createVoiceChatSession(cts.token, { usesAgents: controller.context !== 'inline', model: context?.widget?.viewModel?.model });
            let inputValue = controller.getInput();
            let voiceChatTimeout = this.configurationService.getValue("accessibility.voice.speechTimeout" /* AccessibilityVoiceSettingId.SpeechTimeout */);
            if (!(0, types_1.isNumber)(voiceChatTimeout) || voiceChatTimeout < 0) {
                voiceChatTimeout = accessibilityConfiguration_1.SpeechTimeoutDefault;
            }
            const acceptTranscriptionScheduler = session.disposables.add(new async_1.RunOnceScheduler(() => session.controller.acceptInput(), voiceChatTimeout));
            session.disposables.add(voiceChatSession.onDidChange(({ status, text, waitingForInput }) => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                switch (status) {
                    case speechService_1.SpeechToTextStatus.Started:
                        this.onDidSpeechToTextSessionStart(controller, session.disposables);
                        break;
                    case speechService_1.SpeechToTextStatus.Recognizing:
                        if (text) {
                            session.controller.updateInput(inputValue ? [inputValue, text].join(' ') : text);
                            if (voiceChatTimeout > 0 && context?.voice?.disableTimeout !== true && !disableTimeout) {
                                acceptTranscriptionScheduler.cancel();
                            }
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Recognized:
                        if (text) {
                            inputValue = inputValue ? [inputValue, text].join(' ') : text;
                            session.controller.updateInput(inputValue);
                            if (voiceChatTimeout > 0 && context?.voice?.disableTimeout !== true && !waitingForInput && !disableTimeout) {
                                acceptTranscriptionScheduler.schedule();
                            }
                        }
                        break;
                    case speechService_1.SpeechToTextStatus.Stopped:
                        this.stop(session.id, controller.context);
                        break;
                }
            }));
            return session;
        }
        onDidSpeechToTextSessionStart(controller, disposables) {
            this.voiceChatGettingReadyKey.set(false);
            this.voiceChatInProgressKey.set(true);
            switch (controller.context) {
                case 'inline':
                    this.inlineVoiceChatInProgressKey.set(true);
                    break;
                case 'terminal':
                    this.terminalVoiceChatInProgressKey.set(true);
                    break;
                case 'quick':
                    this.quickVoiceChatInProgressKey.set(true);
                    break;
                case 'view':
                    this.voiceChatInViewInProgressKey.set(true);
                    break;
                case 'editor':
                    this.voiceChatInEditorInProgressKey.set(true);
                    break;
            }
            let dotCount = 0;
            const updatePlaceholder = () => {
                dotCount = (dotCount + 1) % 4;
                controller.setInputPlaceholder(`${(0, nls_1.localize)('listening', "I'm listening")}${'.'.repeat(dotCount)}`);
                placeholderScheduler.schedule();
            };
            const placeholderScheduler = disposables.add(new async_1.RunOnceScheduler(updatePlaceholder, 500));
            updatePlaceholder();
        }
        stop(voiceChatSessionId = this.voiceChatSessionIds, context) {
            if (!this.currentVoiceChatSession ||
                this.voiceChatSessionIds !== voiceChatSessionId ||
                (context && this.currentVoiceChatSession.controller.context !== context)) {
                return;
            }
            this.currentVoiceChatSession.controller.clearInputPlaceholder();
            this.currentVoiceChatSession.disposables.dispose();
            this.currentVoiceChatSession = undefined;
            this.voiceChatGettingReadyKey.set(false);
            this.voiceChatInProgressKey.set(false);
            this.quickVoiceChatInProgressKey.set(false);
            this.inlineVoiceChatInProgressKey.set(false);
            this.terminalVoiceChatInProgressKey.set(false);
            this.voiceChatInViewInProgressKey.set(false);
            this.voiceChatInEditorInProgressKey.set(false);
        }
        accept(voiceChatSessionId = this.voiceChatSessionIds) {
            if (!this.currentVoiceChatSession ||
                this.voiceChatSessionIds !== voiceChatSessionId) {
                return;
            }
            this.currentVoiceChatSession.controller.acceptInput();
        }
    };
    VoiceChatSessions = VoiceChatSessions_1 = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, voiceChat_1.IVoiceChatService),
        __param(2, configuration_1.IConfigurationService)
    ], VoiceChatSessions);
    exports.VOICE_KEY_HOLD_THRESHOLD = 500;
    async function startVoiceChatWithHoldMode(id, accessor, target, context) {
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const holdMode = keybindingService.enableKeybindingHoldMode(id);
        const controller = await VoiceChatSessionControllerFactory.create(accessor, target);
        if (!controller) {
            return;
        }
        const session = await VoiceChatSessions.getInstance(instantiationService).start(controller, context);
        let acceptVoice = false;
        const handle = (0, async_1.disposableTimeout)(() => {
            acceptVoice = true;
            session?.setTimeoutDisabled(true); // disable accept on timeout when hold mode runs for VOICE_KEY_HOLD_THRESHOLD
        }, exports.VOICE_KEY_HOLD_THRESHOLD);
        await holdMode;
        handle.dispose();
        if (acceptVoice) {
            session.accept();
        }
    }
    class VoiceChatWithHoldModeAction extends actions_1.Action2 {
        constructor(desc, target) {
            super(desc);
            this.target = target;
        }
        run(accessor, context) {
            return startVoiceChatWithHoldMode(this.desc.id, accessor, this.target, context);
        }
    }
    class VoiceChatInChatViewAction extends VoiceChatWithHoldModeAction {
        static { this.ID = 'workbench.action.chat.voiceChatInChatView'; }
        constructor() {
            super({
                id: VoiceChatInChatViewAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.voiceChatInView.label', "Voice Chat in View"),
                category: chatActions_1.CHAT_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                f1: true
            }, 'view');
        }
    }
    exports.VoiceChatInChatViewAction = VoiceChatInChatViewAction;
    class HoldToVoiceChatInChatViewAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.holdToVoiceChatInChatView'; }
        constructor() {
            super({
                id: HoldToVoiceChatInChatViewAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.holdToVoiceChatInChatView.label', "Hold to Voice Chat in View"),
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(CanVoiceChat, FocusInChatInput.negate(), // when already in chat input, disable this action and prefer to start voice chat directly
                    editorContextKeys_1.EditorContextKeys.focus.negate(), // do not steal the inline-chat keybinding
                    notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.negate() // do not steal the notebook keybinding
                    ),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */
                }
            });
        }
        async run(accessor, context) {
            // The intent of this action is to provide 2 modes to align with what `Ctrlcmd+I` in inline chat:
            // - if the user press and holds, we start voice chat in the chat view
            // - if the user press and releases quickly enough, we just open the chat view without voice chat
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const holdMode = keybindingService.enableKeybindingHoldMode(HoldToVoiceChatInChatViewAction.ID);
            let session;
            const handle = (0, async_1.disposableTimeout)(async () => {
                const controller = await VoiceChatSessionControllerFactory.create(accessor, 'view');
                if (controller) {
                    session = await VoiceChatSessions.getInstance(instantiationService).start(controller, context);
                    session.setTimeoutDisabled(true);
                }
            }, exports.VOICE_KEY_HOLD_THRESHOLD);
            (await VoiceChatSessionControllerFactory.revealChatView(accessor))?.focusInput();
            await holdMode;
            handle.dispose();
            if (session) {
                session.accept();
            }
        }
    }
    exports.HoldToVoiceChatInChatViewAction = HoldToVoiceChatInChatViewAction;
    class InlineVoiceChatAction extends VoiceChatWithHoldModeAction {
        static { this.ID = 'workbench.action.chat.inlineVoiceChat'; }
        constructor() {
            super({
                id: InlineVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.inlineVoiceChat', "Inline Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, contextkeys_1.ActiveEditorContext, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                f1: true
            }, 'inline');
        }
    }
    exports.InlineVoiceChatAction = InlineVoiceChatAction;
    class QuickVoiceChatAction extends VoiceChatWithHoldModeAction {
        static { this.ID = 'workbench.action.chat.quickVoiceChat'; }
        constructor() {
            super({
                id: QuickVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.quickVoiceChat.label', "Quick Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate()),
                f1: true
            }, 'quick');
        }
    }
    exports.QuickVoiceChatAction = QuickVoiceChatAction;
    class StartVoiceChatAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.startVoiceChat'; }
        constructor() {
            super({
                id: StartVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.startVoiceChat.label', "Start Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: contextkey_1.ContextKeyExpr.and(FocusInChatInput, // scope this action to chat input fields only
                    editorContextKeys_1.EditorContextKeys.focus.negate(), // do not steal the inline-chat keybinding
                    notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED.negate(), // do not steal the notebook keybinding
                    CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS.negate(), CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS.negate(), CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS.negate(), CONTEXT_INLINE_VOICE_CHAT_IN_PROGRESS.negate(), CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS.negate()),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */
                },
                icon: codicons_1.Codicon.mic,
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, CONTEXT_VOICE_CHAT_GETTING_READY.negate(), chatContextKeys_1.CONTEXT_CHAT_REQUEST_IN_PROGRESS.negate(), inlineChat_1.CTX_INLINE_CHAT_HAS_ACTIVE_REQUEST.negate(), terminalContribExports_1.TerminalChatContextKeys.requestActive.negate()),
                menu: [{
                        id: actions_1.MenuId.ChatExecute,
                        when: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS.negate(), CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS.negate(), CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS.negate()),
                        group: 'navigation',
                        order: -1
                    }, {
                        id: actions_1.MenuId.for('terminalChatInput'),
                        when: contextkey_1.ContextKeyExpr.and(speechService_1.HasSpeechProvider, CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS.negate()),
                        group: 'navigation',
                        order: -1
                    }]
            });
        }
        async run(accessor, context) {
            const widget = context?.widget;
            if (widget) {
                // if we already get a context when the action is executed
                // from a toolbar within the chat widget, then make sure
                // to move focus into the input field so that the controller
                // is properly retrieved
                // TODO@bpasero this will actually not work if the button
                // is clicked from the inline editor while focus is in a
                // chat input field in a view or picker
                widget.focusInput();
            }
            return startVoiceChatWithHoldMode(this.desc.id, accessor, 'focused', context);
        }
    }
    exports.StartVoiceChatAction = StartVoiceChatAction;
    const InstallingSpeechProvider = new contextkey_1.RawContextKey('installingSpeechProvider', false, true);
    class InstallVoiceChatAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.installVoiceChat'; }
        static { this.SPEECH_EXTENSION_ID = 'ms-vscode.vscode-speech'; }
        constructor() {
            super({
                id: InstallVoiceChatAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.startVoiceChat.label', "Start Voice Chat"),
                category: chatActions_1.CHAT_CATEGORY,
                icon: codicons_1.Codicon.mic,
                precondition: InstallingSpeechProvider.negate(),
                menu: [{
                        id: actions_1.MenuId.ChatExecute,
                        when: speechService_1.HasSpeechProvider.negate(),
                        group: 'navigation',
                        order: -1
                    }, {
                        id: actions_1.MenuId.for('terminalChatInput'),
                        when: speechService_1.HasSpeechProvider.negate(),
                        group: 'navigation',
                        order: -1
                    }]
            });
        }
        async run(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const extensionsWorkbenchService = accessor.get(extensions_1.IExtensionsWorkbenchService);
            try {
                InstallingSpeechProvider.bindTo(contextKeyService).set(true);
                await extensionsWorkbenchService.install(InstallVoiceChatAction.SPEECH_EXTENSION_ID, {
                    justification: (0, nls_1.localize)('confirmInstallDetail', "Microphone support requires this extension."),
                    enable: true
                }, 15 /* ProgressLocation.Notification */);
            }
            finally {
                InstallingSpeechProvider.bindTo(contextKeyService).set(false);
            }
        }
    }
    exports.InstallVoiceChatAction = InstallVoiceChatAction;
    class BaseStopListeningAction extends actions_1.Action2 {
        constructor(desc, target, context, menu) {
            super({
                ...desc,
                title: (0, nls_1.localize2)('workbench.action.chat.stopListening.label', "Stop Listening"),
                category: chatActions_1.CHAT_CATEGORY,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100,
                    primary: 9 /* KeyCode.Escape */
                },
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, context),
                menu: menu ? [{
                        id: menu,
                        when: contextkey_1.ContextKeyExpr.and(CanVoiceChat, context),
                        group: 'navigation',
                        order: -1
                    }] : undefined
            });
            this.target = target;
        }
        async run(accessor, context) {
            VoiceChatSessions.getInstance(accessor.get(instantiation_1.IInstantiationService)).stop(undefined, this.target);
        }
    }
    class StopListeningAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListening'; }
        constructor() {
            super({ id: StopListeningAction.ID, f1: true }, undefined, CONTEXT_VOICE_CHAT_IN_PROGRESS, undefined);
        }
    }
    exports.StopListeningAction = StopListeningAction;
    class StopListeningInChatViewAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInChatView'; }
        constructor() {
            super({ id: StopListeningInChatViewAction.ID, icon: iconRegistry_1.spinningLoading }, 'view', CONTEXT_VOICE_CHAT_IN_VIEW_IN_PROGRESS, actions_1.MenuId.ChatExecute);
        }
    }
    exports.StopListeningInChatViewAction = StopListeningInChatViewAction;
    class StopListeningInChatEditorAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInChatEditor'; }
        constructor() {
            super({ id: StopListeningInChatEditorAction.ID, icon: iconRegistry_1.spinningLoading }, 'editor', CONTEXT_VOICE_CHAT_IN_EDITOR_IN_PROGRESS, actions_1.MenuId.ChatExecute);
        }
    }
    exports.StopListeningInChatEditorAction = StopListeningInChatEditorAction;
    class StopListeningInQuickChatAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInQuickChat'; }
        constructor() {
            super({ id: StopListeningInQuickChatAction.ID, icon: iconRegistry_1.spinningLoading }, 'quick', CONTEXT_QUICK_VOICE_CHAT_IN_PROGRESS, actions_1.MenuId.ChatExecute);
        }
    }
    exports.StopListeningInQuickChatAction = StopListeningInQuickChatAction;
    class StopListeningInTerminalChatAction extends BaseStopListeningAction {
        static { this.ID = 'workbench.action.chat.stopListeningInTerminalChat'; }
        constructor() {
            super({ id: StopListeningInTerminalChatAction.ID, icon: iconRegistry_1.spinningLoading }, 'terminal', CONTEXT_TERMINAL_VOICE_CHAT_IN_PROGRESS, actions_1.MenuId.for('terminalChatInput'));
        }
    }
    exports.StopListeningInTerminalChatAction = StopListeningInTerminalChatAction;
    class StopListeningAndSubmitAction extends actions_1.Action2 {
        static { this.ID = 'workbench.action.chat.stopListeningAndSubmit'; }
        constructor() {
            super({
                id: StopListeningAndSubmitAction.ID,
                title: (0, nls_1.localize2)('workbench.action.chat.stopListeningAndSubmit.label', "Stop Listening and Submit"),
                category: chatActions_1.CHAT_CATEGORY,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: FocusInChatInput,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */
                },
                precondition: contextkey_1.ContextKeyExpr.and(CanVoiceChat, CONTEXT_VOICE_CHAT_IN_PROGRESS)
            });
        }
        run(accessor) {
            VoiceChatSessions.getInstance(accessor.get(instantiation_1.IInstantiationService)).accept();
        }
    }
    exports.StopListeningAndSubmitAction = StopListeningAndSubmitAction;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        let activeRecordingColor;
        let activeRecordingDimmedColor;
        if (theme.type === theme_2.ColorScheme.LIGHT || theme.type === theme_2.ColorScheme.DARK) {
            activeRecordingColor = theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND) ?? theme.getColor(colorRegistry_1.focusBorder);
            activeRecordingDimmedColor = activeRecordingColor?.transparent(0.38);
        }
        else {
            activeRecordingColor = theme.getColor(colorRegistry_1.contrastBorder);
            activeRecordingDimmedColor = theme.getColor(colorRegistry_1.contrastBorder);
        }
        // Show a "microphone" icon when recording is in progress that glows via outline.
        collector.addRule(`
		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled) {
			color: ${activeRecordingColor};
			outline: 1px solid ${activeRecordingColor};
			outline-offset: -1px;
			animation: pulseAnimation 1s infinite;
			border-radius: 50%;
		}

		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled)::before {
			position: absolute;
			outline: 1px solid ${activeRecordingColor};
			outline-offset: 2px;
			border-radius: 50%;
			width: 16px;
			height: 16px;
		}

		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled)::after {
			outline: 2px solid ${activeRecordingColor};
			outline-offset: -1px;
			animation: pulseAnimation 1500ms cubic-bezier(0.75, 0, 0.25, 1) infinite;
		}

		.monaco-workbench:not(.reduce-motion) .interactive-input-part .monaco-action-bar .action-label.codicon-loading.codicon-modifier-spin:not(.disabled)::before {
			position: absolute;
			outline: 1px solid ${activeRecordingColor};
			outline-offset: 2px;
			border-radius: 50%;
			width: 16px;
			height: 16px;
		}

		@keyframes pulseAnimation {
			0% {
				outline-width: 2px;
			}
			62% {
				outline-width: 5px;
				outline-color: ${activeRecordingDimmedColor};
			}
			100% {
				outline-width: 2px;
			}
		}
	`);
    });
    function supportsKeywordActivation(configurationService, speechService) {
        if (!speechService.hasSpeechProvider) {
            return false;
        }
        const value = configurationService.getValue(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID);
        return typeof value === 'string' && value !== KeywordActivationContribution.SETTINGS_VALUE.OFF;
    }
    let KeywordActivationContribution = class KeywordActivationContribution extends lifecycle_1.Disposable {
        static { KeywordActivationContribution_1 = this; }
        static { this.ID = 'workbench.contrib.keywordActivation'; }
        static { this.SETTINGS_VALUE = {
            OFF: 'off',
            INLINE_CHAT: 'inlineChat',
            QUICK_CHAT: 'quickChat',
            VIEW_CHAT: 'chatInView',
            CHAT_IN_CONTEXT: 'chatInContext'
        }; }
        constructor(speechService, configurationService, commandService, instantiationService, editorService, hostService, chatService) {
            super();
            this.speechService = speechService;
            this.configurationService = configurationService;
            this.commandService = commandService;
            this.editorService = editorService;
            this.hostService = hostService;
            this.chatService = chatService;
            this.activeSession = undefined;
            this._register(instantiationService.createInstance(KeywordActivationStatusEntry));
            this.registerListeners();
        }
        registerListeners() {
            this._register(event_1.Event.runAndSubscribe(this.speechService.onDidChangeHasSpeechProvider, () => {
                this.updateConfiguration();
                this.handleKeywordActivation();
            }));
            this._register(this.chatService.onDidRegisterProvider(() => this.updateConfiguration()));
            this._register(this.speechService.onDidStartSpeechToTextSession(() => this.handleKeywordActivation()));
            this._register(this.speechService.onDidEndSpeechToTextSession(() => this.handleKeywordActivation()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID)) {
                    this.handleKeywordActivation();
                }
            }));
        }
        updateConfiguration() {
            if (!this.speechService.hasSpeechProvider || this.chatService.getProviderInfos().length === 0) {
                return; // these settings require a speech and chat provider
            }
            const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            registry.registerConfiguration({
                ...accessibilityConfiguration_1.accessibilityConfigurationNodeBase,
                properties: {
                    [chatService_1.KEYWORD_ACTIVIATION_SETTING_ID]: {
                        'type': 'string',
                        'enum': [
                            KeywordActivationContribution_1.SETTINGS_VALUE.OFF,
                            KeywordActivationContribution_1.SETTINGS_VALUE.VIEW_CHAT,
                            KeywordActivationContribution_1.SETTINGS_VALUE.QUICK_CHAT,
                            KeywordActivationContribution_1.SETTINGS_VALUE.INLINE_CHAT,
                            KeywordActivationContribution_1.SETTINGS_VALUE.CHAT_IN_CONTEXT
                        ],
                        'enumDescriptions': [
                            (0, nls_1.localize)('voice.keywordActivation.off', "Keyword activation is disabled."),
                            (0, nls_1.localize)('voice.keywordActivation.chatInView', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the chat view."),
                            (0, nls_1.localize)('voice.keywordActivation.quickChat', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the quick chat."),
                            (0, nls_1.localize)('voice.keywordActivation.inlineChat', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the active editor if possible."),
                            (0, nls_1.localize)('voice.keywordActivation.chatInContext', "Keyword activation is enabled and listening for 'Hey Code' to start a voice chat session in the active editor or view depending on keyboard focus.")
                        ],
                        'description': (0, nls_1.localize)('voice.keywordActivation', "Controls whether the keyword phrase 'Hey Code' is recognized to start a voice chat session. Enabling this will start recording from the microphone but the audio is processed locally and never sent to a server."),
                        'default': 'off',
                        'tags': ['accessibility']
                    }
                }
            });
        }
        handleKeywordActivation() {
            const enabled = supportsKeywordActivation(this.configurationService, this.speechService) &&
                !this.speechService.hasActiveSpeechToTextSession;
            if ((enabled && this.activeSession) ||
                (!enabled && !this.activeSession)) {
                return; // already running or stopped
            }
            // Start keyword activation
            if (enabled) {
                this.enableKeywordActivation();
            }
            // Stop keyword activation
            else {
                this.disableKeywordActivation();
            }
        }
        async enableKeywordActivation() {
            const session = this.activeSession = new cancellation_1.CancellationTokenSource();
            const result = await this.speechService.recognizeKeyword(session.token);
            if (session.token.isCancellationRequested || session !== this.activeSession) {
                return; // cancelled
            }
            this.activeSession = undefined;
            if (result === speechService_1.KeywordRecognitionStatus.Recognized) {
                if (this.hostService.hasFocus) {
                    this.commandService.executeCommand(this.getKeywordCommand());
                }
                // Immediately start another keyboard activation session
                // because we cannot assume that the command we execute
                // will trigger a speech recognition session.
                this.handleKeywordActivation();
            }
        }
        getKeywordCommand() {
            const setting = this.configurationService.getValue(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID);
            switch (setting) {
                case KeywordActivationContribution_1.SETTINGS_VALUE.INLINE_CHAT:
                    return InlineVoiceChatAction.ID;
                case KeywordActivationContribution_1.SETTINGS_VALUE.QUICK_CHAT:
                    return QuickVoiceChatAction.ID;
                case KeywordActivationContribution_1.SETTINGS_VALUE.CHAT_IN_CONTEXT: {
                    const activeCodeEditor = (0, editorBrowser_1.getCodeEditor)(this.editorService.activeTextEditorControl);
                    if (activeCodeEditor?.hasWidgetFocus()) {
                        return InlineVoiceChatAction.ID;
                    }
                }
                default:
                    return VoiceChatInChatViewAction.ID;
            }
        }
        disableKeywordActivation() {
            this.activeSession?.dispose(true);
            this.activeSession = undefined;
        }
        dispose() {
            this.activeSession?.dispose();
            super.dispose();
        }
    };
    exports.KeywordActivationContribution = KeywordActivationContribution;
    exports.KeywordActivationContribution = KeywordActivationContribution = KeywordActivationContribution_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, commands_1.ICommandService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, editorService_1.IEditorService),
        __param(5, host_1.IHostService),
        __param(6, chatService_1.IChatService)
    ], KeywordActivationContribution);
    let KeywordActivationStatusEntry = class KeywordActivationStatusEntry extends lifecycle_1.Disposable {
        static { KeywordActivationStatusEntry_1 = this; }
        static { this.STATUS_NAME = (0, nls_1.localize)('keywordActivation.status.name', "Voice Keyword Activation"); }
        static { this.STATUS_COMMAND = 'keywordActivation.status.command'; }
        static { this.STATUS_ACTIVE = (0, nls_1.localize)('keywordActivation.status.active', "Listening to 'Hey Code'..."); }
        static { this.STATUS_INACTIVE = (0, nls_1.localize)('keywordActivation.status.inactive', "Waiting for voice chat to end..."); }
        constructor(speechService, statusbarService, commandService, configurationService) {
            super();
            this.speechService = speechService;
            this.statusbarService = statusbarService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.entry = this._register(new lifecycle_1.MutableDisposable());
            this._register(commands_1.CommandsRegistry.registerCommand(KeywordActivationStatusEntry_1.STATUS_COMMAND, () => this.commandService.executeCommand('workbench.action.openSettings', chatService_1.KEYWORD_ACTIVIATION_SETTING_ID)));
            this.registerListeners();
            this.updateStatusEntry();
        }
        registerListeners() {
            this._register(this.speechService.onDidStartKeywordRecognition(() => this.updateStatusEntry()));
            this._register(this.speechService.onDidEndKeywordRecognition(() => this.updateStatusEntry()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(chatService_1.KEYWORD_ACTIVIATION_SETTING_ID)) {
                    this.updateStatusEntry();
                }
            }));
        }
        updateStatusEntry() {
            const visible = supportsKeywordActivation(this.configurationService, this.speechService);
            if (visible) {
                if (!this.entry.value) {
                    this.createStatusEntry();
                }
                this.updateStatusLabel();
            }
            else {
                this.entry.clear();
            }
        }
        createStatusEntry() {
            this.entry.value = this.statusbarService.addEntry(this.getStatusEntryProperties(), 'status.voiceKeywordActivation', 1 /* StatusbarAlignment.RIGHT */, 103);
        }
        getStatusEntryProperties() {
            return {
                name: KeywordActivationStatusEntry_1.STATUS_NAME,
                text: this.speechService.hasActiveKeywordRecognition ? '$(mic-filled)' : '$(mic)',
                tooltip: this.speechService.hasActiveKeywordRecognition ? KeywordActivationStatusEntry_1.STATUS_ACTIVE : KeywordActivationStatusEntry_1.STATUS_INACTIVE,
                ariaLabel: this.speechService.hasActiveKeywordRecognition ? KeywordActivationStatusEntry_1.STATUS_ACTIVE : KeywordActivationStatusEntry_1.STATUS_INACTIVE,
                command: KeywordActivationStatusEntry_1.STATUS_COMMAND,
                kind: 'prominent',
                showInAllWindows: true
            };
        }
        updateStatusLabel() {
            this.entry.value?.update(this.getStatusEntryProperties());
        }
    };
    KeywordActivationStatusEntry = KeywordActivationStatusEntry_1 = __decorate([
        __param(0, speechService_1.ISpeechService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, commands_1.ICommandService),
        __param(3, configuration_1.IConfigurationService)
    ], KeywordActivationStatusEntry);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidm9pY2VDaGF0QWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9lbGVjdHJvbi1zYW5kYm94L2FjdGlvbnMvdm9pY2VDaGF0QWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBc0RoRyxNQUFNLGdDQUFnQyxHQUFHLElBQUksMEJBQWEsQ0FBVSx1QkFBdUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyx1QkFBdUIsRUFBRSx1RkFBdUYsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNsUSxNQUFNLDhCQUE4QixHQUFHLElBQUksMEJBQWEsQ0FBVSxxQkFBcUIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSwwRUFBMEUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUUvTyxNQUFNLG9DQUFvQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwwQkFBMEIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywwQkFBMEIsRUFBRSwwRUFBMEUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMvUCxNQUFNLHFDQUFxQyxHQUFHLElBQUksMEJBQWEsQ0FBVSwyQkFBMkIsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFBLGNBQVEsRUFBQywyQkFBMkIsRUFBRSwyRUFBMkUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNuUSxNQUFNLHVDQUF1QyxHQUFHLElBQUksMEJBQWEsQ0FBVSw2QkFBNkIsRUFB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