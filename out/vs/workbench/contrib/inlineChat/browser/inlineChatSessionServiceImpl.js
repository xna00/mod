var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/workbench/contrib/inlineChat/common/inlineChat", "vs/editor/common/core/range", "vs/platform/telemetry/common/telemetry", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/platform/log/common/log", "vs/base/common/iterator", "vs/base/common/async", "./inlineChatSession", "vs/editor/common/services/editorWorker", "vs/base/common/network", "vs/platform/instantiation/common/instantiation", "vs/base/common/uuid", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatAgents", "vs/platform/progress/common/progress", "vs/platform/extensions/common/extensions", "vs/base/common/arrays", "vs/base/common/htmlContent", "vs/workbench/services/extensions/common/extensions", "vs/base/common/codicons"], function (require, exports, event_1, inlineChat_1, range_1, telemetry_1, model_1, resolverService_1, lifecycle_1, textModel_1, log_1, iterator_1, async_1, inlineChatSession_1, editorWorker_1, network_1, instantiation_1, uuid_1, editorService_1, untitledTextEditorInput_1, editor_1, chatService_1, chatAgents_1, progress_1, extensions_1, arrays_1, htmlContent_1, extensions_2, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlineChatSessionServiceImpl = exports.InlineChatError = void 0;
    let BridgeAgent = class BridgeAgent {
        constructor(_data, _sessions, _instaService) {
            this._data = _data;
            this._sessions = _sessions;
            this._instaService = _instaService;
        }
        _findSessionDataByRequest(request) {
            let data;
            for (const candidate of this._sessions.values()) {
                if (candidate.session.chatModel.sessionId === request.sessionId) {
                    data = candidate;
                    break;
                }
            }
            return data;
        }
        async invoke(request, progress, history, token) {
            if (token.isCancellationRequested) {
                return {};
            }
            const data = this._findSessionDataByRequest(request);
            if (!data) {
                throw new Error('FAILED to find session');
            }
            const { session, editor } = data;
            if (!session.lastInput) {
                throw new Error('FAILED to find last input');
            }
            const modelAltVersionIdNow = session.textModelN.getAlternativeVersionId();
            const progressEdits = [];
            const inlineRequest = {
                requestId: request.requestId,
                prompt: request.message,
                attempt: session.lastInput.attempt,
                withIntentDetection: session.lastInput.withIntentDetection,
                live: session.editMode !== "preview" /* EditMode.Preview */,
                previewDocument: session.textModelN.uri,
                selection: editor.getSelection(),
                wholeRange: session.wholeRange.trackedInitialRange,
            };
            const inlineProgress = new progress_1.Progress(data => {
                // TODO@jrieken
                // if (data.message) {
                // 	progress({ kind: 'progressMessage', content: new MarkdownString(data.message) });
                // }
                // TODO@ulugbekna,jrieken should we only send data.slashCommand when having detected one?
                if (data.slashCommand && !inlineRequest.prompt.startsWith('/')) {
                    const command = this._data.slashCommands.find(c => c.name === data.slashCommand);
                    progress({ kind: 'agentDetection', agentId: this._data.id, command });
                }
                if (data.markdownFragment) {
                    progress({ kind: 'markdownContent', content: new htmlContent_1.MarkdownString(data.markdownFragment) });
                }
                if ((0, arrays_1.isNonEmptyArray)(data.edits)) {
                    progressEdits.push(data.edits);
                    progress({ kind: 'textEdit', uri: session.textModelN.uri, edits: data.edits });
                }
            });
            let result;
            let response;
            try {
                result = await data.session.provider.provideResponse(session.session, inlineRequest, inlineProgress, token);
                if (result) {
                    if (result.message) {
                        inlineProgress.report({ markdownFragment: result.message.value });
                    }
                    if (Array.isArray(result.edits)) {
                        inlineProgress.report({ edits: result.edits });
                    }
                    const markdownContents = result.message ?? new htmlContent_1.MarkdownString('', { supportThemeIcons: true, supportHtml: true, isTrusted: false });
                    response = this._instaService.createInstance(inlineChatSession_1.ReplyResponse, result, markdownContents, session.textModelN.uri, modelAltVersionIdNow, progressEdits, request.requestId);
                }
                else {
                    response = new inlineChatSession_1.EmptyResponse();
                }
            }
            catch (e) {
                response = new inlineChatSession_1.ErrorResponse(e);
            }
            session.addExchange(new inlineChatSession_1.SessionExchange(session.lastInput, response));
            // TODO@jrieken
            // result?.placeholder
            // result?.wholeRange
            return { metadata: { inlineChatResponse: result } };
        }
        async provideFollowups(request, result, history, token) {
            if (!result.metadata?.inlineChatResponse) {
                return [];
            }
            const data = this._findSessionDataByRequest(request);
            if (!data) {
                return [];
            }
            const inlineFollowups = await data.session.provider.provideFollowups?.(data.session.session, result.metadata?.inlineChatResponse, token);
            if (!inlineFollowups) {
                return [];
            }
            const chatFollowups = inlineFollowups.map(f => {
                if (f.kind === 'reply') {
                    return {
                        kind: 'reply',
                        message: f.message,
                        agentId: request.agentId,
                        title: f.title,
                        tooltip: f.tooltip,
                    };
                }
                else {
                    // TODO@jrieken update API
                    return undefined;
                }
            });
            (0, arrays_1.coalesceInPlace)(chatFollowups);
            return chatFollowups;
        }
    };
    BridgeAgent = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], BridgeAgent);
    class InlineChatError extends Error {
        static { this.code = 'InlineChatError'; }
        constructor(message) {
            super(message);
            this.name = InlineChatError.code;
        }
    }
    exports.InlineChatError = InlineChatError;
    let InlineChatSessionServiceImpl = class InlineChatSessionServiceImpl {
        constructor(_inlineChatService, _telemetryService, _modelService, _textModelService, _editorWorkerService, _logService, _instaService, _editorService, _chatService, _chatAgentService) {
            // MARK: register fake chat agent
            this._inlineChatService = _inlineChatService;
            this._telemetryService = _telemetryService;
            this._modelService = _modelService;
            this._textModelService = _textModelService;
            this._editorWorkerService = _editorWorkerService;
            this._logService = _logService;
            this._instaService = _instaService;
            this._editorService = _editorService;
            this._chatService = _chatService;
            this._chatAgentService = _chatAgentService;
            this._store = new lifecycle_1.DisposableStore();
            this._onWillStartSession = this._store.add(new event_1.Emitter());
            this.onWillStartSession = this._onWillStartSession.event;
            this._onDidMoveSession = this._store.add(new event_1.Emitter());
            this.onDidMoveSession = this._onDidMoveSession.event;
            this._onDidEndSession = this._store.add(new event_1.Emitter());
            this.onDidEndSession = this._onDidEndSession.event;
            this._onDidStashSession = this._store.add(new event_1.Emitter());
            this.onDidStashSession = this._onDidStashSession.event;
            this._sessions = new Map();
            this._keyComputers = new Map();
            this._recordings = [];
            const that = this;
            const agentData = {
                id: 'editor',
                name: 'editor',
                extensionId: extensions_2.nullExtensionDescription.identifier,
                isDefault: true,
                locations: [chatAgents_1.ChatAgentLocation.Editor],
                get slashCommands() {
                    // HACK@jrieken
                    // find the active session and return its slash commands
                    let candidate;
                    for (const data of that._sessions.values()) {
                        if (data.editor.hasWidgetFocus()) {
                            candidate = data.session;
                            break;
                        }
                    }
                    if (!candidate || !candidate.session.slashCommands) {
                        return [];
                    }
                    return candidate.session.slashCommands.map(c => {
                        return {
                            name: c.command,
                            description: c.detail ?? '',
                        };
                    });
                },
                defaultImplicitVariables: [],
                metadata: {
                    isSticky: false,
                    themeIcon: codicons_1.Codicon.copilot,
                },
            };
            this._store.add(this._chatAgentService.registerDynamicAgent(agentData, this._instaService.createInstance(BridgeAgent, agentData, this._sessions)));
            // MARK: register fake chat provider
            const mapping = this._store.add(new lifecycle_1.DisposableMap());
            const registerFakeChatProvider = (provider) => {
                const d = this._chatService.registerProvider({
                    id: this._asChatProviderBrigdeName(provider),
                    prepareSession() {
                        return {
                            id: Math.random()
                        };
                    }
                });
                mapping.set(provider, d);
            };
            this._store.add(_inlineChatService.onDidChangeProviders(e => {
                if (e.added) {
                    registerFakeChatProvider(e.added);
                }
                if (e.removed) {
                    mapping.deleteAndDispose(e.removed);
                }
            }));
            for (const provider of _inlineChatService.getAllProvider()) {
                registerFakeChatProvider(provider);
            }
        }
        dispose() {
            this._store.dispose();
            this._sessions.forEach(x => x.store.dispose());
            this._sessions.clear();
        }
        _asChatProviderBrigdeName(provider) {
            return `inlinechat:${provider.label}:${extensions_1.ExtensionIdentifier.toKey(provider.extensionId)}`;
        }
        async createSession(editor, options, token) {
            const provider = iterator_1.Iterable.first(this._inlineChatService.getAllProvider());
            if (!provider) {
                this._logService.trace('[IE] NO provider found');
                return undefined;
            }
            const chatModel = this._chatService.startSession(this._asChatProviderBrigdeName(provider), token);
            if (!chatModel) {
                this._logService.trace('[IE] NO chatModel found');
                return undefined;
            }
            const store = new lifecycle_1.DisposableStore();
            store.add((0, lifecycle_1.toDisposable)(() => {
                this._chatService.clearSession(chatModel.sessionId);
                chatModel.dispose();
            }));
            this._onWillStartSession.fire(editor);
            const textModel = editor.getModel();
            const selection = editor.getSelection();
            let rawSession;
            try {
                rawSession = await (0, async_1.raceCancellation)(Promise.resolve(provider.prepareInlineChatSession(textModel, selection, token)), token);
            }
            catch (error) {
                this._logService.error('[IE] FAILED to prepare session', provider.extensionId);
                this._logService.error(error);
                throw new InlineChatError(error?.message || 'Failed to prepare session');
            }
            if (!rawSession) {
                this._logService.trace('[IE] NO session', provider.extensionId);
                return undefined;
            }
            this._logService.trace(`[IE] creating NEW session for ${editor.getId()}, ${provider.extensionId}`);
            store.add(this._chatService.onDidPerformUserAction(e => {
                if (e.sessionId !== chatModel.sessionId || e.action.kind !== 'vote') {
                    return;
                }
                // TODO@jrieken VALIDATE candidate is proper, e.g check with `session.exchanges`
                const request = chatModel.getRequests().find(request => request.id === e.requestId);
                const candidate = request?.response?.result?.metadata?.inlineChatResponse;
                if (candidate) {
                    provider.handleInlineChatResponseFeedback?.(rawSession, candidate, e.action.direction === chatService_1.InteractiveSessionVoteDirection.Down ? 0 /* InlineChatResponseFeedbackKind.Unhelpful */ : 1 /* InlineChatResponseFeedbackKind.Helpful */);
                }
            }));
            store.add(this._inlineChatService.onDidChangeProviders(e => {
                if (e.removed === provider) {
                    this._logService.trace(`[IE] provider GONE for ${editor.getId()}, ${provider.extensionId}`);
                    this._releaseSession(session, true);
                }
            }));
            const id = (0, uuid_1.generateUuid)();
            const targetUri = textModel.uri;
            let textModelN;
            if (options.editMode === "preview" /* EditMode.Preview */) {
                // AI edits happen in a copy
                textModelN = store.add(this._modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(textModel.createSnapshot()), { languageId: textModel.getLanguageId(), onDidChange: event_1.Event.None }, targetUri.with({ scheme: network_1.Schemas.vscode, authority: 'inline-chat', path: '', query: new URLSearchParams({ id, 'textModelN': '' }).toString() })));
            }
            else {
                // AI edits happen in the actual model, keep a reference but make no copy
                store.add((await this._textModelService.createModelReference(textModel.uri)));
                textModelN = textModel;
            }
            // create: keep a snapshot of the "actual" model
            const textModel0 = store.add(this._modelService.createModel((0, textModel_1.createTextBufferFactoryFromSnapshot)(textModel.createSnapshot()), { languageId: textModel.getLanguageId(), onDidChange: event_1.Event.None }, targetUri.with({ scheme: network_1.Schemas.vscode, authority: 'inline-chat', path: '', query: new URLSearchParams({ id, 'textModel0': '' }).toString() }), true));
            // untitled documents are special and we are releasing their session when their last editor closes
            if (targetUri.scheme === network_1.Schemas.untitled) {
                store.add(this._editorService.onDidCloseEditor(() => {
                    if (!this._editorService.isOpened({ resource: targetUri, typeId: untitledTextEditorInput_1.UntitledTextEditorInput.ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id })) {
                        this._releaseSession(session, true);
                    }
                }));
            }
            let wholeRange = options.wholeRange;
            if (!wholeRange) {
                wholeRange = rawSession.wholeRange ? range_1.Range.lift(rawSession.wholeRange) : editor.getSelection();
            }
            if (token.isCancellationRequested) {
                store.dispose();
                return undefined;
            }
            const session = new inlineChatSession_1.Session(options.editMode, targetUri, textModel0, textModelN, provider, rawSession, store.add(new inlineChatSession_1.SessionWholeRange(textModelN, wholeRange)), store.add(new inlineChatSession_1.HunkData(this._editorWorkerService, textModel0, textModelN)), chatModel);
            // store: key -> session
            const key = this._key(editor, session.targetUri);
            if (this._sessions.has(key)) {
                store.dispose();
                throw new Error(`Session already stored for ${key}`);
            }
            this._sessions.set(key, { session, editor, store });
            return session;
        }
        moveSession(session, target) {
            const newKey = this._key(target, session.targetUri);
            const existing = this._sessions.get(newKey);
            if (existing) {
                if (existing.session !== session) {
                    throw new Error(`Cannot move session because the target editor already/still has one`);
                }
                else {
                    // noop
                    return;
                }
            }
            let found = false;
            for (const [oldKey, data] of this._sessions) {
                if (data.session === session) {
                    found = true;
                    this._sessions.delete(oldKey);
                    this._sessions.set(newKey, { ...data, editor: target });
                    this._logService.trace(`[IE] did MOVE session for ${data.editor.getId()} to NEW EDITOR ${target.getId()}, ${session.provider.extensionId}`);
                    this._onDidMoveSession.fire({ session, editor: target });
                    break;
                }
            }
            if (!found) {
                throw new Error(`Cannot move session because it is not stored`);
            }
        }
        releaseSession(session) {
            this._releaseSession(session, false);
        }
        _releaseSession(session, byServer) {
            let tuple;
            // cleanup
            for (const candidate of this._sessions) {
                if (candidate[1].session === session) {
                    // if (value.session === session) {
                    tuple = candidate;
                    break;
                }
            }
            if (!tuple) {
                // double remove
                return;
            }
            this._keepRecording(session);
            this._telemetryService.publicLog2('interactiveEditor/session', session.asTelemetryData());
            const [key, value] = tuple;
            this._sessions.delete(key);
            this._logService.trace(`[IE] did RELEASED session for ${value.editor.getId()}, ${session.provider.extensionId}`);
            this._onDidEndSession.fire({ editor: value.editor, session, endedByExternalCause: byServer });
            value.store.dispose();
        }
        stashSession(session, editor, undoCancelEdits) {
            this._keepRecording(session);
            const result = this._instaService.createInstance(inlineChatSession_1.StashedSession, editor, session, undoCancelEdits);
            this._onDidStashSession.fire({ editor, session });
            this._logService.trace(`[IE] did STASH session for ${editor.getId()}, ${session.provider.extensionId}`);
            return result;
        }
        getCodeEditor(session) {
            for (const [, data] of this._sessions) {
                if (data.session === session) {
                    return data.editor;
                }
            }
            throw new Error('session not found');
        }
        getSession(editor, uri) {
            const key = this._key(editor, uri);
            return this._sessions.get(key)?.session;
        }
        _key(editor, uri) {
            const item = this._keyComputers.get(uri.scheme);
            return item
                ? item.getComparisonKey(editor, uri)
                : `${editor.getId()}@${uri.toString()}`;
        }
        registerSessionKeyComputer(scheme, value) {
            this._keyComputers.set(scheme, value);
            return (0, lifecycle_1.toDisposable)(() => this._keyComputers.delete(scheme));
        }
        // --- debug
        _keepRecording(session) {
            const newLen = this._recordings.unshift(session.asRecording());
            if (newLen > 5) {
                this._recordings.pop();
            }
        }
        recordings() {
            return this._recordings;
        }
    };
    exports.InlineChatSessionServiceImpl = InlineChatSessionServiceImpl;
    exports.InlineChatSessionServiceImpl = InlineChatSessionServiceImpl = __decorate([
        __param(0, inlineChat_1.IInlineChatService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, model_1.IModelService),
        __param(3, resolverService_1.ITextModelService),
        __param(4, editorWorker_1.IEditorWorkerService),
        __param(5, log_1.ILogService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, editorService_1.IEditorService),
        __param(8, chatService_1.IChatService),
        __param(9, chatAgents_1.IChatAgentService)
    ], InlineChatSessionServiceImpl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lQ2hhdFNlc3Npb25TZXJ2aWNlSW1wbC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvaW5saW5lQ2hhdC9icm93c2VyL2lubGluZUNoYXRTZXNzaW9uU2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQXNDQSxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFXO1FBRWhCLFlBQ2tCLEtBQXFCLEVBQ3JCLFNBQTJDLEVBQ3BCLGFBQW9DO1lBRjNELFVBQUssR0FBTCxLQUFLLENBQWdCO1lBQ3JCLGNBQVMsR0FBVCxTQUFTLENBQWtDO1lBQ3BCLGtCQUFhLEdBQWIsYUFBYSxDQUF1QjtRQUN6RSxDQUFDO1FBR0cseUJBQXlCLENBQUMsT0FBMEI7WUFDM0QsSUFBSSxJQUE2QixDQUFDO1lBQ2xDLEtBQUssTUFBTSxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNqRCxJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsS0FBSyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQ2pFLElBQUksR0FBRyxTQUFTLENBQUM7b0JBQ2pCLE1BQU07Z0JBQ1AsQ0FBQztZQUNGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQTBCLEVBQUUsUUFBdUMsRUFBRSxPQUFpQyxFQUFFLEtBQXdCO1lBRTVJLElBQUksS0FBSyxDQUFDLHVCQUF1QixFQUFFLENBQUM7Z0JBQ25DLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVyRCxJQUFJLENBQUMs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