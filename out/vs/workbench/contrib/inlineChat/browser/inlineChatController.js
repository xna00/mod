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
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/stopwatch", "vs/base/common/types", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages", "vs/editor/common/services/editorWorker", "vs/editor/contrib/inlineCompletions/browser/inlineCompletionsController", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService", "./inlineChatSavingService", "vs/workbench/contrib/inlineChat/browser/inlineChatSession", "./inlineChatSessionService", "vs/workbench/contrib/inlineChat/browser/inlineChatStrategies", "./inlineChatZoneWidget", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/platform/commands/common/commands", "vs/workbench/contrib/inlineChat/browser/inlineChatContentWidget", "vs/editor/contrib/message/browser/messageController", "vs/base/common/arrays", "vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl", "vs/editor/common/services/languageFeatures", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/editor/common/core/offsetRange"], function (require, exports, aria, async_1, cancellation_1, errorMessage_1, errors_1, event_1, lazy_1, lifecycle_1, numbers_1, stopwatch_1, types_1, bulkEditService_1, position_1, range_1, selection_1, languages_1, editorWorker_1, inlineCompletionsController_1, nls_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, log_1, chat_1, chatAgents_1, chatParserTypes_1, chatService_1, inlineChatSavingService_1, inlineChatSession_1, inlineChatSessionService_1, inlineChatStrategies_1, inlineChatZoneWidget_1, inlineChat_1, commands_1, inlineChatContentWidget_1, messageController_1, arrays_1, inlineChatSessionServiceImpl_1, languageFeatures_1, chatInputPart_1, offsetRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatController = exports.InlineChatRunOptions = exports.State = void 0;
    var State;
    (function (State) {
        State["CREATE_SESSION"] = "CREATE_SESSION";
        State["INIT_UI"] = "INIT_UI";
        State["WAIT_FOR_INPUT"] = "WAIT_FOR_INPUT";
        State["SHOW_REQUEST"] = "SHOW_REQUEST";
        State["APPLY_RESPONSE"] = "APPLY_RESPONSE";
        State["SHOW_RESPONSE"] = "SHOW_RESPONSE";
        State["PAUSE"] = "PAUSE";
        State["CANCEL"] = "CANCEL";
        State["ACCEPT"] = "DONE";
    })(State || (exports.State = State = {}));
    var Message;
    (function (Message) {
        Message[Message["NONE"] = 0] = "NONE";
        Message[Message["ACCEPT_SESSION"] = 1] = "ACCEPT_SESSION";
        Message[Message["CANCEL_SESSION"] = 2] = "CANCEL_SESSION";
        Message[Message["PAUSE_SESSION"] = 4] = "PAUSE_SESSION";
        Message[Message["CANCEL_REQUEST"] = 8] = "CANCEL_REQUEST";
        Message[Message["CANCEL_INPUT"] = 16] = "CANCEL_INPUT";
        Message[Message["ACCEPT_INPUT"] = 32] = "ACCEPT_INPUT";
    })(Message || (Message = {}));
    class InlineChatRunOptions {
        static isInteractiveEditorOptions(options) {
            const { initialSelection, initialRange, message, autoSend, position, existingSession } = options;
            if (typeof message !== 'undefined' && typeof message !== 'string'
                || typeof autoSend !== 'undefined' && typeof autoSend !== 'boolean'
                || typeof initialRange !== 'undefined' && !range_1.Range.isIRange(initialRange)
                || typeof initialSelection !== 'undefined' && !selection_1.Selection.isISelection(initialSelection)
                || typeof position !== 'undefined' && !position_1.Position.isIPosition(position)
                || typeof existingSession !== 'undefined' && !(existingSession instanceof inlineChatSession_1.Session)) {
                return false;
            }
            return true;
        }
    }
    exports.InlineChatRunOptions = InlineChatRunOptions;
    let InlineChatController = class InlineChatController {
        static get(editor) {
            return editor.getContribution(inlineChat_1.INLINE_CHAT_ID);
        }
        constructor(_editor, _instaService, _inlineChatSessionService, _inlineChatSavingService, _editorWorkerService, _logService, _configurationService, _dialogService, contextKeyService, _chatAgentService, _chatService, _bulkEditService, _commandService, _languageFeatureService, _chatWidgetService) {
            this._editor = _editor;
            this._instaService = _instaService;
            this._inlineChatSessionService = _inlineChatSessionService;
            this._inlineChatSavingService = _inlineChatSavingService;
            this._editorWorkerService = _editorWorkerService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._dialogService = _dialogService;
            this._chatAgentService = _chatAgentService;
            this._chatService = _chatService;
            this._bulkEditService = _bulkEditService;
            this._commandService = _commandService;
            this._languageFeatureService = _languageFeatureService;
            this._chatWidgetService = _chatWidgetService;
            this._isDisposed = false;
            this._store = new lifecycle_1.DisposableStore();
            this._messages = this._store.add(new event_1.Emitter());
            this._onWillStartSession = this._store.add(new event_1.Emitter());
            this.onWillStartSession = this._onWillStartSession.event;
            this.onDidAcceptInput = event_1.Event.filter(this._messages.event, m => m === 32 /* Message.ACCEPT_INPUT */, this._store);
            this.onDidCancelInput = event_1.Event.filter(this._messages.event, m => m === 16 /* Message.CANCEL_INPUT */ || m === 2 /* Message.CANCEL_SESSION */, this._store);
            this._sessionStore = this._store.add(new lifecycle_1.DisposableStore());
            this._stashedSession = this._store.add(new lifecycle_1.MutableDisposable());
            this._nextAttempt = 0;
            this._nextWithIntentDetection = true;
            this._forcedPlaceholder = undefined;
            this._ctxVisible = inlineChat_1.CTX_INLINE_CHAT_VISIBLE.bindTo(contextKeyService);
            this._ctxDidEdit = inlineChat_1.CTX_INLINE_CHAT_DID_EDIT.bindTo(contextKeyService);
            this._ctxUserDidEdit = inlineChat_1.CTX_INLINE_CHAT_USER_DID_EDIT.bindTo(contextKeyService);
            this._ctxResponseTypes = inlineChat_1.CTX_INLINE_CHAT_RESPONSE_TYPES.bindTo(contextKeyService);
            this._ctxLastFeedbackKind = inlineChat_1.CTX_INLINE_CHAT_LAST_FEEDBACK.bindTo(contextKeyService);
            this._ctxSupportIssueReporting = inlineChat_1.CTX_INLINE_CHAT_SUPPORT_ISSUE_REPORTING.bindTo(contextKeyService);
            this._input = new lazy_1.Lazy(() => this._store.add(_instaService.createInstance(inlineChatContentWidget_1.InlineChatContentWidget, this._editor)));
            this._zone = new lazy_1.Lazy(() => this._store.add(_instaService.createInstance(inlineChatZoneWidget_1.InlineChatZoneWidget, this._editor)));
            this._store.add(this._editor.onDidChangeModel(async (e) => {
                if (this._session || !e.newModelUrl) {
                    return;
                }
                const existingSession = this._inlineChatSessionService.getSession(this._editor, e.newModelUrl);
                if (!existingSession) {
                    return;
                }
                this._log('session RESUMING after model change', e);
                await this.run({ existingSession });
            }));
            this._store.add(this._inlineChatSessionService.onDidEndSession(e => {
                if (e.session === this._session && e.endedByExternalCause) {
                    this._log('session ENDED by external cause');
                    this._session = undefined;
                    this._strategy?.cancel();
                    this._resetWidget();
                    this.cancelSession();
                }
            }));
            this._store.add(this._inlineChatSessionService.onDidMoveSession(async (e) => {
                if (e.editor === this._editor) {
                    this._log('session RESUMING after move', e);
                    await this.run({ existingSession: e.session });
                }
            }));
            this._log('NEW controller');
        }
        dispose() {
            if (this._currentRun) {
                this._messages.fire((this._session?.lastExchange
                    ? 4 /* Message.PAUSE_SESSION */
                    : 2 /* Message.CANCEL_SESSION */));
            }
            this._store.dispose();
            this._isDisposed = true;
            this._log('DISPOSED controller');
        }
        _log(message, ...more) {
            if (message instanceof Error) {
                this._logService.error(message, ...more);
            }
            else {
                this._logService.trace(`[IE] (editor:${this._editor.getId()})${message}`, ...more);
            }
        }
        getMessage() {
            return this._zone.value.widget.responseContent;
        }
        getId() {
            return inlineChat_1.INLINE_CHAT_ID;
        }
        _getMode() {
            return this._configurationService.getValue("inlineChat.mode" /* InlineChatConfigKeys.Mode */);
        }
        getWidgetPosition() {
            return this._zone.value.position;
        }
        async run(options = {}) {
            try {
                this.finishExistingSession();
                if (this._currentRun) {
                    await this._currentRun;
                }
                if (options.initialSelection) {
                    this._editor.setSelection(options.initialSelection);
                }
                this._stashedSession.clear();
                this._onWillStartSession.fire();
                this._currentRun = this._nextState("CREATE_SESSION" /* State.CREATE_SESSION */, options);
                await this._currentRun;
            }
            catch (error) {
                // this should not happen but when it does make sure to tear down the UI and everything
                (0, errors_1.onUnexpectedError)(error);
                if (this._session) {
                    this._inlineChatSessionService.releaseSession(this._session);
                }
                this["PAUSE" /* State.PAUSE */]();
            }
            finally {
                this._currentRun = undefined;
            }
        }
        // ---- state machine
        async _nextState(state, options) {
            let nextState = state;
            while (nextState && !this._isDisposed) {
                this._log('setState to ', nextState);
                nextState = await this[nextState](options);
            }
        }
        async ["CREATE_SESSION" /* State.CREATE_SESSION */](options) {
            (0, types_1.assertType)(this._session === undefined);
            (0, types_1.assertType)(this._editor.hasModel());
            let session = options.existingSession;
            let initPosition;
            if (options.position) {
                initPosition = position_1.Position.lift(options.position).delta(-1);
                delete options.position;
            }
            const widgetPosition = this._showWidget(true, initPosition);
            // this._updatePlaceholder();
            let errorMessage = (0, nls_1.localize)('create.fail', "Failed to start editor chat");
            if (!session) {
                const createSessionCts = new cancellation_1.CancellationTokenSource();
                const msgListener = event_1.Event.once(this._messages.event)(m => {
                    this._log('state=_createSession) message received', m);
                    if (m === 32 /* Message.ACCEPT_INPUT */) {
                        // user accepted the input before having a session
                        options.autoSend = true;
                        this._zone.value.widget.updateProgress(true);
                        this._zone.value.widget.updateInfo((0, nls_1.localize)('welcome.2', "Getting ready..."));
                    }
                    else {
                        createSessionCts.cancel();
                    }
                });
                try {
                    session = await this._inlineChatSessionService.createSession(this._editor, { editMode: this._getMode(), wholeRange: options.initialRange }, createSessionCts.token);
                }
                catch (error) {
                    // Inline chat errors are from the provider and have their error messages shown to the user
                    if (error instanceof inlineChatSessionServiceImpl_1.InlineChatError || error?.name === inlineChatSessionServiceImpl_1.InlineChatError.code) {
                        errorMessage = error.message;
                    }
                }
                createSessionCts.dispose();
                msgListener.dispose();
                if (createSessionCts.token.isCancellationRequested) {
                    if (session) {
                        this._inlineChatSessionService.releaseSession(session);
                    }
                    return "CANCEL" /* State.CANCEL */;
                }
            }
            delete options.initialRange;
            delete options.existingSession;
            if (!session) {
                messageController_1.MessageController.get(this._editor)?.showMessage(errorMessage, widgetPosition);
                this._log('Failed to start editor chat');
                return "CANCEL" /* State.CANCEL */;
            }
            // create a new strategy
            switch (session.editMode) {
                case "preview" /* EditMode.Preview */:
                    this._strategy = this._instaService.createInstance(inlineChatStrategies_1.PreviewStrategy, session, this._editor, this._zone.value);
                    break;
                case "live" /* EditMode.Live */:
                default:
                    this._strategy = this._instaService.createInstance(inlineChatStrategies_1.LiveStrategy, session, this._editor, this._zone.value);
                    break;
            }
            if (session.session.input) {
                options.message = session.session.input;
            }
            this._session = session;
            return "INIT_UI" /* State.INIT_UI */;
        }
        async ["INIT_UI" /* State.INIT_UI */](options) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            // hide/cancel inline completions when invoking IE
            inlineCompletionsController_1.InlineCompletionsController.get(this._editor)?.hide();
            this._sessionStore.clear();
            const wholeRangeDecoration = this._editor.createDecorationsCollection();
            const updateWholeRangeDecoration = () => {
                const newDecorations = this._strategy?.getWholeRangeDecoration() ?? [];
                wholeRangeDecoration.set(newDecorations);
            };
            this._sessionStore.add((0, lifecycle_1.toDisposable)(() => wholeRangeDecoration.clear()));
            this._sessionStore.add(this._session.wholeRange.onDidChange(updateWholeRangeDecoration));
            updateWholeRangeDecoration();
            this._sessionStore.add(this._input.value.onDidBlur(() => this.cancelSession()));
            this._input.value.setSession(this._session);
            // this._zone.value.widget.updateSlashCommands(this._session.session.slashCommands ?? []);
            this._updatePlaceholder();
            const message = this._session.session.message ?? (0, nls_1.localize)('welcome.1', "AI-generated code may be incorrect");
            this._zone.value.widget.updateInfo(message);
            this._showWidget(!this._session.lastExchange);
            this._sessionStore.add(this._editor.onDidChangeModel((e) => {
                const msg = this._session?.lastExchange
                    ? 4 /* Message.PAUSE_SESSION */
                    : 2 /* Message.CANCEL_SESSION */;
                this._log('model changed, pause or cancel session', msg, e);
                this._messages.fire(msg);
            }));
            const altVersionNow = this._editor.getModel()?.getAlternativeVersionId();
            this._sessionStore.add(this._editor.onDidChangeModelContent(e => {
                if (!this._session?.hunkData.ignoreTextModelNChanges) {
                    this._ctxUserDidEdit.set(altVersionNow !== this._editor.getModel()?.getAlternativeVersionId());
                }
                if (this._session?.hunkData.ignoreTextModelNChanges || this._strategy?.hasFocus()) {
                    return;
                }
                const wholeRange = this._session.wholeRange;
                let shouldFinishSession = false;
                if (this._configurationService.getValue("inlineChat.finishOnType" /* InlineChatConfigKeys.FinishOnType */)) {
                    for (const { range } of e.changes) {
                        shouldFinishSession = !range_1.Range.areIntersectingOrTouching(range, wholeRange.value);
                    }
                }
                this._session.recordExternalEditOccurred(shouldFinishSession);
                if (shouldFinishSession) {
                    this._log('text changed outside of whole range, FINISH session');
                    this.finishExistingSession();
                }
            }));
            this._sessionStore.add(this._session.chatModel.onDidChange(e => {
                if (e.kind === 'addRequest' && e.request.response) {
                    this._zone.value.widget.updateProgress(true);
                    const listener = e.request.response.onDidChange(() => {
                        if (e.request.response?.isCanceled || e.request.response?.isComplete) {
                            this._zone.value.widget.updateProgress(false);
                            listener.dispose();
                        }
                    });
                }
            }));
            // Update context key
            this._ctxSupportIssueReporting.set(this._session.provider.supportIssueReporting ?? false);
            // #region DEBT
            // DEBT@jrieken
            // REMOVE when agents are adopted
            this._sessionStore.add(this._languageFeatureService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'inline chat commands',
                triggerCharacters: ['/'],
                provideCompletionItems: (model, position, context, token) => {
                    if (position.lineNumber !== 1) {
                        return undefined;
                    }
                    if (!this._session || !this._session.session.slashCommands) {
                        return undefined;
                    }
                    const widget = this._chatWidgetService.getWidgetByInputUri(model.uri);
                    if (widget !== this._zone.value.widget.chatWidget && widget !== this._input.value.chatWidget) {
                        return undefined;
                    }
                    const result = { suggestions: [], incomplete: false };
                    for (const command of this._session.session.slashCommands) {
                        const withSlash = `/${command.command}`;
                        result.suggestions.push({
                            label: { label: withSlash, description: command.detail ?? '' },
                            kind: 18 /* CompletionItemKind.Text */,
                            insertText: withSlash,
                            range: range_1.Range.fromPositions(new position_1.Position(1, 1), position),
                            command: command.executeImmediately ? { id: 'workbench.action.chat.acceptInput', title: withSlash } : undefined
                        });
                    }
                    return result;
                }
            }));
            const updateSlashDecorations = (collection, model) => {
                const newDecorations = [];
                for (const command of (this._session?.session.slashCommands ?? []).sort((a, b) => b.command.length - a.command.length)) {
                    const withSlash = `/${command.command}`;
                    const firstLine = model.getLineContent(1);
                    if (firstLine.startsWith(withSlash)) {
                        newDecorations.push({
                            range: new range_1.Range(1, 1, 1, withSlash.length + 1),
                            options: {
                                description: 'inline-chat-slash-command',
                                inlineClassName: 'inline-chat-slash-command',
                                after: {
                                    // Force some space between slash command and placeholder
                                    content: ' '
                                }
                            }
                        });
                        // inject detail when otherwise empty
                        if (firstLine.trim() === `/${command.command}`) {
                            newDecorations.push({
                                range: new range_1.Range(1, withSlash.length, 1, withSlash.length),
                                options: {
                                    description: 'inline-chat-slash-command-detail',
                                    after: {
                                        content: `${command.detail}`,
                                        inlineClassName: 'inline-chat-slash-command-detail'
                                    }
                                }
                            });
                        }
                        break;
                    }
                }
                collection.set(newDecorations);
            };
            const inputInputEditor = this._input.value.chatWidget.inputEditor;
            const zoneInputEditor = this._zone.value.widget.chatWidget.inputEditor;
            const inputDecorations = inputInputEditor.createDecorationsCollection();
            const zoneDecorations = zoneInputEditor.createDecorationsCollection();
            this._sessionStore.add(inputInputEditor.onDidChangeModelContent(() => updateSlashDecorations(inputDecorations, inputInputEditor.getModel())));
            this._sessionStore.add(zoneInputEditor.onDidChangeModelContent(() => updateSlashDecorations(zoneDecorations, zoneInputEditor.getModel())));
            this._sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                inputDecorations.clear();
                zoneDecorations.clear();
            }));
            //#endregion ------- DEBT
            if (!this._session.lastExchange) {
                return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
            }
            else if (options.isUnstashed) {
                delete options.isUnstashed;
                return "APPLY_RESPONSE" /* State.APPLY_RESPONSE */;
            }
            else {
                return "SHOW_RESPONSE" /* State.SHOW_RESPONSE */;
            }
        }
        async ["WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */](options) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            this._updatePlaceholder();
            if (options.message) {
                this.updateInput(options.message);
                aria.alert(options.message);
                delete options.message;
                this._showWidget(false);
            }
            let message = 0 /* Message.NONE */;
            let request;
            const barrier = new async_1.Barrier();
            const store = new lifecycle_1.DisposableStore();
            store.add(this._session.chatModel.onDidChange(e => {
                if (e.kind === 'addRequest') {
                    request = e.request;
                    message = 32 /* Message.ACCEPT_INPUT */;
                    barrier.open();
                }
            }));
            store.add(this._strategy.onDidAccept(() => this.acceptSession()));
            store.add(this._strategy.onDidDiscard(() => this.cancelSession()));
            store.add(event_1.Event.once(this._messages.event)(m => {
                this._log('state=_waitForInput) message received', m);
                message = m;
                barrier.open();
            }));
            if (options.autoSend) {
                delete options.autoSend;
                this._showWidget(false);
                this._zone.value.widget.chatWidget.acceptInput();
            }
            await barrier.wait();
            store.dispose();
            if (message & (16 /* Message.CANCEL_INPUT */ | 2 /* Message.CANCEL_SESSION */)) {
                return "CANCEL" /* State.CANCEL */;
            }
            if (message & 4 /* Message.PAUSE_SESSION */) {
                return "PAUSE" /* State.PAUSE */;
            }
            if (message & 1 /* Message.ACCEPT_SESSION */) {
                this._zone.value.widget.selectAll(false);
                return "DONE" /* State.ACCEPT */;
            }
            if (!request?.message.text) {
                return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
            }
            const input = request.message.text;
            this._zone.value.widget.value = input;
            // slash command referring
            let slashCommandLike = request.message.parts.find(part => part instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart || part instanceof chatParserTypes_1.ChatRequestSlashCommandPart);
            const refer = this._session.session.slashCommands?.some(value => {
                if (value.refer) {
                    if (slashCommandLike?.text === `/${value.command}`) {
                        return true;
                    }
                    if (request?.message.text.startsWith(`/${value.command}`)) {
                        slashCommandLike = new chatParserTypes_1.ChatRequestSlashCommandPart(new offsetRange_1.OffsetRange(0, 1), new range_1.Range(1, 1, 1, 1), { command: value.command, detail: value.detail ?? '' });
                        return true;
                    }
                }
                return false;
            });
            if (refer && slashCommandLike && !this._session.lastExchange) {
                this._log('[IE] seeing refer command, continuing outside editor', this._session.provider.extensionId);
                // cancel this request
                this._chatService.cancelCurrentRequestForSession(request.session.sessionId);
                this._editor.setSelection(this._session.wholeRange.value);
                let massagedInput = input;
                const withoutSubCommandLeader = slashCommandLike.text.slice(1);
                for (const agent of this._chatAgentService.getActivatedAgents()) {
                    if (agent.locations.includes(chatAgents_1.ChatAgentLocation.Panel)) {
                        const commands = agent.slashCommands;
                        if (commands.find((command) => withoutSubCommandLeader.startsWith(command.name))) {
                            massagedInput = `${chatParserTypes_1.chatAgentLeader}${agent.name} ${slashCommandLike.text}`;
                            break;
                        }
                    }
                }
                // if agent has a refer command, massage the input to include the agent name
                await this._instaService.invokeFunction(sendRequest, massagedInput);
                return "DONE" /* State.ACCEPT */;
            }
            this._session.addInput(new inlineChatSession_1.SessionPrompt(input, this._nextAttempt, this._nextWithIntentDetection));
            // we globally store the next attempt and intent detection flag
            // to be able to use it in the next request. This is because they
            // aren't part of the chat widget state and we need to remembered here
            this._nextAttempt = 0;
            this._nextWithIntentDetection = true;
            return "SHOW_REQUEST" /* State.SHOW_REQUEST */;
        }
        async ["SHOW_REQUEST" /* State.SHOW_REQUEST */](options) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._session.lastInput);
            const request = (0, arrays_1.tail)(this._session.chatModel.getRequests());
            (0, types_1.assertType)(request);
            (0, types_1.assertType)(request.response);
            this._showWidget(false);
            this._zone.value.widget.value = request.message.text;
            this._zone.value.widget.selectAll(false);
            this._zone.value.widget.updateInfo('');
            const { response } = request;
            const responsePromise = new async_1.DeferredPromise();
            const store = new lifecycle_1.DisposableStore();
            const progressiveEditsCts = store.add(new cancellation_1.CancellationTokenSource());
            const progressiveEditsAvgDuration = new numbers_1.MovingAverage();
            const progressiveEditsClock = stopwatch_1.StopWatch.create();
            const progressiveEditsQueue = new async_1.Queue();
            let lastLength = 0;
            let message = 0 /* Message.NONE */;
            store.add(event_1.Event.once(this._messages.event)(m => {
                this._log('state=_makeRequest) message received', m);
                this._chatService.cancelCurrentRequestForSession(request.session.sessionId);
                message = m;
            }));
            // cancel the request when the user types
            store.add(this._zone.value.widget.chatWidget.inputEditor.onDidChangeModelContent(() => {
                this._chatService.cancelCurrentRequestForSession(request.session.sessionId);
            }));
            // apply edits
            store.add(response.onDidChange(() => {
                if (response.isCanceled) {
                    progressiveEditsCts.cancel();
                    responsePromise.complete();
                    return;
                }
                if (response.isComplete) {
                    responsePromise.complete();
                    return;
                }
                // TODO@jrieken
                const editsShouldBeInstant = false;
                const edits = response.edits.get(this._session.textModelN.uri) ?? [];
                const newEdits = edits.slice(lastLength);
                // console.log('NEW edits', newEdits, edits);
                if (newEdits.length === 0) {
                    return; // NO change
                }
                lastLength = edits.length;
                progressiveEditsAvgDuration.update(progressiveEditsClock.elapsed());
                progressiveEditsClock.reset();
                progressiveEditsQueue.queue(async () => {
                    const startThen = this._session.wholeRange.value.getStartPosition();
                    // making changes goes into a queue because otherwise the async-progress time will
                    // influence the time it takes to receive the changes and progressive typing will
                    // become infinitely fast
                    await this._makeChanges(newEdits, editsShouldBeInstant
                        ? undefined
                        : { duration: progressiveEditsAvgDuration.value, token: progressiveEditsCts.token });
                    // reshow the widget if the start position changed or shows at the wrong position
                    const startNow = this._session.wholeRange.value.getStartPosition();
                    if (!startNow.equals(startThen) || !this._zone.value.position?.equals(startNow)) {
                        this._showWidget(false, startNow.delta(-1));
                    }
                });
            }));
            // (1) we must wait for the request to finish
            // (2) we must wait for all edits that came in via progress to complete
            await responsePromise.p;
            await progressiveEditsQueue.whenIdle();
            store.dispose();
            // todo@jrieken we can likely remove 'trackEdit'
            const diff = await this._editorWorkerService.computeDiff(this._session.textModel0.uri, this._session.textModelN.uri, { computeMoves: false, maxComputationTimeMs: Number.MAX_SAFE_INTEGER, ignoreTrimWhitespace: false }, 'advanced');
            this._session.wholeRange.fixup(diff?.changes ?? []);
            await this._session.hunkData.recompute();
            this._zone.value.widget.updateToolbar(true);
            if (message & 2 /* Message.CANCEL_SESSION */) {
                return "CANCEL" /* State.CANCEL */;
            }
            else if (message & 4 /* Message.PAUSE_SESSION */) {
                return "PAUSE" /* State.PAUSE */;
            }
            else if (message & 1 /* Message.ACCEPT_SESSION */) {
                return "DONE" /* State.ACCEPT */;
            }
            else {
                return "APPLY_RESPONSE" /* State.APPLY_RESPONSE */;
            }
        }
        async ["APPLY_RESPONSE" /* State.APPLY_RESPONSE */]() {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            const { response } = this._session.lastExchange;
            if (response instanceof inlineChatSession_1.ReplyResponse && response.workspaceEdit) {
                // this reply cannot be applied in the normal inline chat UI and needs to be handled off to workspace edit
                this._bulkEditService.apply(response.workspaceEdit, { showPreview: true });
                return "CANCEL" /* State.CANCEL */;
            }
            return "SHOW_RESPONSE" /* State.SHOW_RESPONSE */;
        }
        async ["SHOW_RESPONSE" /* State.SHOW_RESPONSE */]() {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            const { response } = this._session.lastExchange;
            let responseTypes;
            for (const { response } of this._session.exchanges) {
                const thisType = response instanceof inlineChatSession_1.ReplyResponse
                    ? response.responseType
                    : undefined;
                if (responseTypes === undefined) {
                    responseTypes = thisType;
                }
                else if (responseTypes !== thisType) {
                    responseTypes = "mixed" /* InlineChatResponseTypes.Mixed */;
                    break;
                }
            }
            this._ctxResponseTypes.set(responseTypes);
            this._ctxDidEdit.set(this._session.hasChangedText);
            let newPosition;
            if (response instanceof inlineChatSession_1.EmptyResponse) {
                // show status message
                const status = (0, nls_1.localize)('empty', "No results, please refine your input and try again");
                this._zone.value.widget.updateStatus(status, { classes: ['warn'] });
                return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
            }
            else if (response instanceof inlineChatSession_1.ErrorResponse) {
                // show error
                if (!response.isCancellation) {
                    this._zone.value.widget.updateStatus(response.message, { classes: ['error'] });
                }
            }
            else if (response instanceof inlineChatSession_1.ReplyResponse) {
                // real response -> complex...
                this._zone.value.widget.updateStatus('');
                this._zone.value.widget.updateToolbar(true);
                newPosition = await this._strategy.renderChanges(response);
                if (this._session.provider.provideFollowups) {
                    const followupCts = new cancellation_1.CancellationTokenSource();
                    const msgListener = event_1.Event.once(this._messages.event)(() => {
                        followupCts.cancel();
                    });
                    const followupTask = this._session.provider.provideFollowups(this._session.session, response.raw, followupCts.token);
                    this._log('followup request started', this._session.provider.extensionId, this._session.session, response.raw);
                    (0, async_1.raceCancellation)(Promise.resolve(followupTask), followupCts.token).then(followupReply => {
                        if (followupReply && this._session) {
                            this._log('followup request received', this._session.provider.extensionId, this._session.session, followupReply);
                            this._zone.value.widget.updateFollowUps(followupReply, followup => {
                                if (followup.kind === 'reply') {
                                    this.updateInput(followup.message);
                                    this.acceptInput();
                                }
                                else {
                                    this._commandService.executeCommand(followup.commandId, ...(followup.args ?? []));
                                }
                            });
                        }
                    }).finally(() => {
                        msgListener.dispose();
                        followupCts.dispose();
                    });
                }
            }
            this._showWidget(false, newPosition);
            return "WAIT_FOR_INPUT" /* State.WAIT_FOR_INPUT */;
        }
        async ["PAUSE" /* State.PAUSE */]() {
            this._resetWidget();
            this._strategy?.dispose?.();
            this._session = undefined;
        }
        async ["DONE" /* State.ACCEPT */]() {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            this._sessionStore.clear();
            try {
                await this._strategy.apply();
            }
            catch (err) {
                this._dialogService.error((0, nls_1.localize)('err.apply', "Failed to apply changes.", (0, errorMessage_1.toErrorMessage)(err)));
                this._log('FAILED to apply changes');
                this._log(err);
            }
            this._inlineChatSessionService.releaseSession(this._session);
            this._resetWidget();
            this._strategy?.dispose();
            this._strategy = undefined;
            this._session = undefined;
        }
        async ["CANCEL" /* State.CANCEL */]() {
            if (this._session) {
                // assertType(this._session);
                (0, types_1.assertType)(this._strategy);
                this._sessionStore.clear();
                // only stash sessions that were not unstashed, not "empty", and not interacted with
                const shouldStash = !this._session.isUnstashed && !!this._session.lastExchange && this._session.hunkData.size === this._session.hunkData.pending;
                let undoCancelEdits = [];
                try {
                    undoCancelEdits = this._strategy.cancel();
                }
                catch (err) {
                    this._dialogService.error((0, nls_1.localize)('err.discard', "Failed to discard changes.", (0, errorMessage_1.toErrorMessage)(err)));
                    this._log('FAILED to discard changes');
                    this._log(err);
                }
                this._stashedSession.clear();
                if (shouldStash) {
                    this._stashedSession.value = this._inlineChatSessionService.stashSession(this._session, this._editor, undoCancelEdits);
                }
                else {
                    this._inlineChatSessionService.releaseSession(this._session);
                }
            }
            this._resetWidget();
            this._strategy?.dispose();
            this._strategy = undefined;
            this._session = undefined;
        }
        // ----
        _showWidget(initialRender = false, position) {
            (0, types_1.assertType)(this._editor.hasModel());
            let widgetPosition;
            if (position) {
                // explicit position wins
                widgetPosition = position;
            }
            else if (this._zone.rawValue?.position) {
                // already showing - special case of line 1
                if (this._zone.rawValue.position.lineNumber === 1) {
                    widgetPosition = this._zone.rawValue.position.delta(-1);
                }
                else {
                    widgetPosition = this._zone.rawValue.position;
                }
            }
            else {
                // default to ABOVE the selection
                widgetPosition = this._editor.getSelection().getStartPosition().delta(-1);
            }
            if (this._session && !position && (this._session.hasChangedText || this._session.lastExchange)) {
                widgetPosition = this._session.wholeRange.value.getStartPosition().delta(-1);
            }
            if (this._zone.rawValue?.position) {
                this._zone.value.updatePositionAndHeight(widgetPosition);
            }
            else if (initialRender) {
                const selection = this._editor.getSelection();
                widgetPosition = selection.getStartPosition();
                // TODO@jrieken we are not ready for this
                // widgetPosition = selection.getEndPosition();
                // if (Range.spansMultipleLines(selection) && widgetPosition.column === 1) {
                // 	// selection ends on "nothing" -> move up to match the
                // 	// rendered/visible part of the selection
                // 	widgetPosition = this._editor.getModel().validatePosition(widgetPosition.delta(-1, Number.MAX_SAFE_INTEGER));
                // }
                this._input.value.show(widgetPosition);
            }
            else {
                this._input.value.hide();
                this._zone.value.show(widgetPosition);
                if (this._session && this._zone.value.widget.chatWidget.viewModel?.model !== this._session.chatModel) {
                    this._zone.value.widget.setChatModel(this._session.chatModel);
                }
            }
            if (this._session && this._zone.rawValue) {
                this._zone.rawValue.updateBackgroundColor(widgetPosition, this._session.wholeRange.value);
            }
            this._ctxVisible.set(true);
            return widgetPosition;
        }
        _resetWidget() {
            this._sessionStore.clear();
            this._ctxVisible.reset();
            this._ctxDidEdit.reset();
            this._ctxUserDidEdit.reset();
            this._ctxLastFeedbackKind.reset();
            this._ctxSupportIssueReporting.reset();
            this._input.rawValue?.hide();
            this._zone.rawValue?.hide();
            // Return focus to the editor only if the current focus is within the editor widget
            if (this._editor.hasWidgetFocus()) {
                this._editor.focus();
            }
        }
        async _makeChanges(edits, opts) {
            (0, types_1.assertType)(this._session);
            (0, types_1.assertType)(this._strategy);
            const moreMinimalEdits = await this._editorWorkerService.computeMoreMinimalEdits(this._session.textModelN.uri, edits);
            this._log('edits from PROVIDER and after making them MORE MINIMAL', this._session.provider.extensionId, edits, moreMinimalEdits);
            if (moreMinimalEdits?.length === 0) {
                // nothing left to do
                return;
            }
            const actualEdits = !opts && moreMinimalEdits ? moreMinimalEdits : edits;
            const editOperations = actualEdits.map(languages_1.TextEdit.asEditOperation);
            const editsObserver = {
                start: () => this._session.hunkData.ignoreTextModelNChanges = true,
                stop: () => this._session.hunkData.ignoreTextModelNChanges = false,
            };
            this._inlineChatSavingService.markChanged(this._session);
            this._session.wholeRange.trackEdits(editOperations);
            if (opts) {
                await this._strategy.makeProgressiveChanges(editOperations, editsObserver, opts);
            }
            else {
                await this._strategy.makeChanges(editOperations, editsObserver);
            }
            this._ctxDidEdit.set(this._session.hasChangedText);
        }
        _updatePlaceholder() {
            this._zone.value.widget.placeholder = this._getPlaceholderText();
        }
        _getPlaceholderText() {
            return this._forcedPlaceholder ?? this._session?.session.placeholder ?? '';
        }
        // ---- controller API
        showSaveHint() {
            const status = (0, nls_1.localize)('savehint', "Accept or discard changes to continue saving");
            this._zone.value.widget.updateStatus(status, { classes: ['warn'] });
        }
        setPlaceholder(text) {
            this._forcedPlaceholder = text;
            this._updatePlaceholder();
        }
        resetPlaceholder() {
            this._forcedPlaceholder = undefined;
            this._updatePlaceholder();
        }
        acceptInput() {
            if (this._input.value.isVisible) {
                this._input.value.chatWidget.acceptInput();
            }
            else {
                this._zone.value.widget.chatWidget.acceptInput();
            }
        }
        updateInput(text, selectAll = true) {
            this._input.value.chatWidget.setInput(text);
            this._zone.value.widget.chatWidget.setInput(text);
            if (selectAll) {
                const newSelection = new selection_1.Selection(1, 1, Number.MAX_SAFE_INTEGER, 1);
                this._input.value.chatWidget.inputEditor.setSelection(newSelection);
                this._zone.value.widget.chatWidget.inputEditor.setSelection(newSelection);
            }
        }
        getInput() {
            return this._input.value.isVisible
                ? this._input.value.value
                : this._zone.value.widget.value;
        }
        async rerun(opts) {
            if (this._session?.lastExchange && this._strategy) {
                const { lastExchange } = this._session;
                const request = (0, arrays_1.tail)(this._session.chatModel.getRequests());
                if (!request || !request.response?.isComplete) {
                    return;
                }
                this._session.chatModel.removeRequest(request.id);
                if (lastExchange.response instanceof inlineChatSession_1.ReplyResponse) {
                    try {
                        this._session.hunkData.ignoreTextModelNChanges = true;
                        await this._strategy.undoChanges(lastExchange.response.modelAltVersionId);
                    }
                    finally {
                        this._session.hunkData.ignoreTextModelNChanges = false;
                    }
                }
                if (opts.retry) {
                    this._nextAttempt = lastExchange.prompt.attempt + 1;
                }
                if (opts.withoutIntentDetection) {
                    this._nextWithIntentDetection = false;
                }
                this._zone.value.widget.chatWidget.acceptInput(request.message.text);
            }
        }
        cancelCurrentRequest() {
            this._messages.fire(16 /* Message.CANCEL_INPUT */ | 8 /* Message.CANCEL_REQUEST */);
        }
        arrowOut(up) {
            if (this._zone.value.position && this._editor.hasModel()) {
                const { column } = this._editor.getPosition();
                const { lineNumber } = this._zone.value.position;
                const newLine = up ? lineNumber : lineNumber + 1;
                this._editor.setPosition({ lineNumber: newLine, column });
                this._editor.focus();
            }
        }
        focus() {
            this._zone.value.widget.focus();
        }
        hasFocus() {
            return this._zone.value.widget.hasFocus();
        }
        moveHunk(next) {
            this.focus();
            this._strategy?.move?.(next);
        }
        viewInChat() {
            if (this._session?.lastExchange?.response instanceof inlineChatSession_1.ReplyResponse) {
                this._instaService.invokeFunction(showMessageResponse, this._session.lastExchange.prompt.value, this._session.lastExchange.response.mdContent.value);
            }
        }
        toggleDiff() {
            this._strategy?.toggleDiff?.();
        }
        feedbackLast(kind) {
            if (this._session?.lastExchange && this._session.lastExchange.response instanceof inlineChatSession_1.ReplyResponse) {
                this._session.provider.handleInlineChatResponseFeedback?.(this._session.session, this._session.lastExchange.response.raw, kind);
                switch (kind) {
                    case 1 /* InlineChatResponseFeedbackKind.Helpful */:
                        this._ctxLastFeedbackKind.set('helpful');
                        break;
                    case 0 /* InlineChatResponseFeedbackKind.Unhelpful */:
                        this._ctxLastFeedbackKind.set('unhelpful');
                        break;
                    default:
                        break;
                }
                this._zone.value.widget.updateStatus('Thank you for your feedback!', { resetAfter: 1250 });
            }
        }
        createSnapshot() {
            if (this._session && !this._session.textModel0.equalsTextBuffer(this._session.textModelN.getTextBuffer())) {
                this._session.createSnapshot();
            }
        }
        acceptSession() {
            if (this._session?.lastExchange && this._session.lastExchange.response instanceof inlineChatSession_1.ReplyResponse) {
                this._session.provider.handleInlineChatResponseFeedback?.(this._session.session, this._session.lastExchange.response.raw, 3 /* InlineChatResponseFeedbackKind.Accepted */);
            }
            this._messages.fire(1 /* Message.ACCEPT_SESSION */);
        }
        acceptHunk() {
            return this._strategy?.acceptHunk();
        }
        discardHunk() {
            return this._strategy?.discardHunk();
        }
        async cancelSession() {
            let result;
            if (this._session) {
                const diff = await this._editorWorkerService.computeDiff(this._session.textModel0.uri, this._session.textModelN.uri, { ignoreTrimWhitespace: false, maxComputationTimeMs: 5000, computeMoves: false }, 'advanced');
                result = this._session.asChangedText(diff?.changes ?? []);
                if (this._session.lastExchange && this._session.lastExchange.response instanceof inlineChatSession_1.ReplyResponse) {
                    this._session.provider.handleInlineChatResponseFeedback?.(this._session.session, this._session.lastExchange.response.raw, 2 /* InlineChatResponseFeedbackKind.Undone */);
                }
            }
            this._messages.fire(2 /* Message.CANCEL_SESSION */);
            return result;
        }
        finishExistingSession() {
            if (this._session) {
                if (this._session.editMode === "preview" /* EditMode.Preview */) {
                    this._log('finishing existing session, using CANCEL', this._session.editMode);
                    this.cancelSession();
                }
                else {
                    this._log('finishing existing session, using APPLY', this._session.editMode);
                    this.acceptSession();
                }
            }
        }
        unstashLastSession() {
            const result = this._stashedSession.value?.unstash();
            if (result) {
                this._inlineChatSavingService.markChanged(result);
            }
            return result;
        }
        joinCurrentRun() {
            return this._currentRun;
        }
    };
    exports.InlineChatController = InlineChatController;
    exports.InlineChatController = InlineChatController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, inlineChatSessionService_1.IInlineChatSessionService),
        __param(3, inlineChatSavingService_1.IInlineChatSavingService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, log_1.ILogService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, dialogs_1.IDialogService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, chatAgents_1.IChatAgentService),
        __param(10, chatService_1.IChatService),
        __param(11, bulkEditService_1.IBulkEditService),
        __param(12, commands_1.ICommandService),
        __param(13, languageFeatures_1.ILanguageFeaturesService),
        __param(14, chat_1.IChatWidgetService)
    ], InlineChatController);
    async function showMessageResponse(accessor, query, response) {
        const chatService = accessor.get(chatService_1.IChatService);
        const chatAgentService = accessor.get(chatAgents_1.IChatAgentService);
        const agent = chatAgentService.getActivatedAgents().find(agent => agent.locations.includes(chatAgents_1.ChatAgentLocation.Panel) && agent.isDefault);
        if (!agent) {
            return;
        }
        const chatWidgetService = accessor.get(chat_1.IChatWidgetService);
        const widget = await chatWidgetService.revealViewForProvider(agent.name);
        if (widget && widget.viewModel) {
            chatService.addCompleteRequest(widget.viewModel.sessionId, query, undefined, { message: response });
            widget.focusLastMessage();
        }
    }
    async function sendRequest(accessor, query) {
        const widgetService = accessor.get(chat_1.IChatWidgetService);
        const chatAgentService = accessor.get(chatAgents_1.IChatAgentService);
        const agent = chatAgentService.getActivatedAgents().find(agent => agent.locations.includes(chatAgents_1.ChatAgentLocation.Panel) && agent.isDefault);
        if (!agent) {
            return;
        }
        const widget = await widgetService.revealViewForProvider(agent.name);
        if (!widget) {
            return;
        }
        widget.focusInput();
        widget.acceptInput(query);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdENvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2lubGluZUNoYXQvYnJvd3Nlci9pbmxpbmVDaGF0Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrRGhHLElBQWtCLEtBVWpCO0lBVkQsV0FBa0IsS0FBSztRQUN0QiwwQ0FBaUMsQ0FBQTtRQUNqQyw0QkFBbUIsQ0FBQTtRQUNuQiwwQ0FBaUMsQ0FBQTtRQUNqQyxzQ0FBNkIsQ0FBQTtRQUM3QiwwQ0FBaUMsQ0FBQTtRQUNqQyx3Q0FBK0IsQ0FBQTtRQUMvQix3QkFBZSxDQUFBO1FBQ2YsMEJBQWlCLENBQUE7UUFDakIsd0JBQWUsQ0FBQTtJQUNoQixDQUFDLEVBVmlCLEtBQUsscUJBQUwsS0FBSyxRQVV0QjtJQUVELElBQVcsT0FRVjtJQVJELFdBQVcsT0FBTztRQUNqQixxQ0FBUSxDQUFBO1FBQ1IseURBQXVCLENBQUE7UUFDdkIseURBQXVCLENBQUE7UUFDdkIsdURBQXNCLENBQUE7UUFDdEIseURBQXVCLENBQUE7UUFDdkIsc0RBQXFCLENBQUE7UUFDckIsc0RBQXFCLENBQUE7SUFDdEIsQ0FBQyxFQVJVLE9BQU8sS0FBUCxPQUFPLFFBUWpCO0lBRUQsTUFBc0Isb0JBQW9CO1FBVXpDLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxPQUFZO1lBQzdDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLEdBQXlCLE9BQU8sQ0FBQztZQUN2SCxJQUNDLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRO21CQUMxRCxPQUFPLFFBQVEsS0FBSyxXQUFXLElB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