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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/core/offsetRange", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatService"], function (require, exports, arrays_1, async_1, event_1, htmlContent_1, lifecycle_1, map_1, marshalling_1, resources_1, uri_1, uuid_1, offsetRange_1, instantiation_1, log_1, chatAgents_1, chatParserTypes_1, chatService_1) {
    "use strict";
    var ChatModel_1, ChatWelcomeMessageModel_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatWelcomeMessageModel = exports.ChatModel = exports.ChatModelInitState = exports.ChatResponseModel = exports.Response = exports.ChatRequestModel = void 0;
    exports.isExportableSessionData = isExportableSessionData;
    exports.isSerializableSessionData = isSerializableSessionData;
    exports.getHistoryEntriesFromModel = getHistoryEntriesFromModel;
    exports.updateRanges = updateRanges;
    class ChatRequestModel {
        static { this.nextId = 0; }
        get id() {
            return this._id;
        }
        get username() {
            return this.session.requesterUsername;
        }
        get avatarIconUri() {
            return this.session.requesterAvatarIconUri;
        }
        get variableData() {
            return this._variableData;
        }
        set variableData(v) {
            this._variableData = v;
        }
        constructor(session, message, _variableData) {
            this.session = session;
            this.message = message;
            this._variableData = _variableData;
            this._id = 'request_' + ChatRequestModel.nextId++;
        }
    }
    exports.ChatRequestModel = ChatRequestModel;
    class Response {
        get onDidChangeValue() {
            return this._onDidChangeValue.event;
        }
        get value() {
            return this._responseParts;
        }
        constructor(value) {
            this._onDidChangeValue = new event_1.Emitter();
            this._responseParts = (0, arrays_1.asArray)(value).map((v) => ((0, htmlContent_1.isMarkdownString)(v) ?
                { content: v, kind: 'markdownContent' } :
                'kind' in v ? v : { kind: 'treeData', treeData: v }));
            this._updateRepr(true);
        }
        asString() {
            return this._responseRepr;
        }
        clear() {
            this._responseParts = [];
            this._updateRepr(true);
        }
        updateContent(progress, quiet) {
            if (progress.kind === 'content' || progress.kind === 'markdownContent') {
                const responsePartLength = this._responseParts.length - 1;
                const lastResponsePart = this._responseParts[responsePartLength];
                if (!lastResponsePart || lastResponsePart.kind !== 'markdownContent') {
                    // The last part can't be merged with
                    if (progress.kind === 'content') {
                        this._responseParts.push({ content: new htmlContent_1.MarkdownString(progress.content), kind: 'markdownContent' });
                    }
                    else {
                        this._responseParts.push(progress);
                    }
                }
                else if (progress.kind === 'markdownContent') {
                    // Merge all enabled commands
                    const lastPartEnabledCommands = typeof lastResponsePart.content.isTrusted === 'object' ?
                        lastResponsePart.content.isTrusted.enabledCommands :
                        [];
                    const thisPartEnabledCommands = typeof progress.content.isTrusted === 'object' ?
                        progress.content.isTrusted.enabledCommands :
                        [];
                    const enabledCommands = [...lastPartEnabledCommands, ...thisPartEnabledCommands];
                    this._responseParts[responsePartLength] = { content: new htmlContent_1.MarkdownString(lastResponsePart.content.value + progress.content.value, { isTrusted: { enabledCommands } }), kind: 'markdownContent' };
                }
                else {
                    this._responseParts[responsePartLength] = { content: new htmlContent_1.MarkdownString(lastResponsePart.content.value + progress.content, lastResponsePart.content), kind: 'markdownContent' };
                }
                this._updateRepr(quiet);
            }
            else {
                this._responseParts.push(progress);
                this._updateRepr(quiet);
            }
        }
        _updateRepr(quiet) {
            this._responseRepr = this._responseParts.map(part => {
                if (part.kind === 'treeData') {
                    return '';
                }
                else if (part.kind === 'inlineReference') {
                    return (0, resources_1.basename)('uri' in part.inlineReference ? part.inlineReference.uri : part.inlineReference);
                }
                else if (part.kind === 'command') {
                    return part.command.title;
                }
                else {
                    return part.content.value;
                }
            }).join('\n\n');
            if (!quiet) {
                this._onDidChangeValue.fire();
            }
        }
    }
    exports.Response = Response;
    class ChatResponseModel extends lifecycle_1.Disposable {
        static { this.nextId = 0; }
        get id() {
            return this._id;
        }
        get isComplete() {
            return this._isComplete;
        }
        get isCanceled() {
            return this._isCanceled;
        }
        get vote() {
            return this._vote;
        }
        get followups() {
            return this._followups;
        }
        get response() {
            return this._response;
        }
        get edits() {
            return this._edits;
        }
        get result() {
            return this._result;
        }
        get providerId() {
            return this.session.providerId;
        }
        get username() {
            return this.session.responderUsername;
        }
        get avatarIcon() {
            return this.session.responderAvatarIcon;
        }
        get agent() {
            return this._agent;
        }
        get slashCommand() {
            return this._slashCommand;
        }
        get agentOrSlashCommandDetected() {
            return this._agentOrSlashCommandDetected ?? false;
        }
        get usedContext() {
            return this._usedContext;
        }
        get contentReferences() {
            return this._contentReferences;
        }
        get progressMessages() {
            return this._progressMessages;
        }
        get isStale() {
            return this._isStale;
        }
        constructor(_response, session, _agent, _slashCommand, requestId, _isComplete = false, _isCanceled = false, _vote, _result, followups) {
            super();
            this.session = session;
            this._agent = _agent;
            this._slashCommand = _slashCommand;
            this.requestId = requestId;
            this._isComplete = _isComplete;
            this._isCanceled = _isCanceled;
            this._vote = _vote;
            this._result = _result;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._contentReferences = [];
            this._progressMessages = [];
            this._isStale = false;
            // If we are creating a response with some existing content, consider it stale
            this._isStale = Array.isArray(_response) && (_response.length !== 0 || (0, htmlContent_1.isMarkdownString)(_response) && _response.value.length !== 0);
            this._followups = followups ? [...followups] : undefined;
            this._response = new Response(_response);
            this._edits = new map_1.ResourceMap();
            this._register(this._response.onDidChangeValue(() => this._onDidChange.fire()));
            this._id = 'response_' + ChatResponseModel.nextId++;
        }
        /**
         * Apply a progress update to the actual response content.
         */
        updateContent(responsePart, quiet) {
            this._response.updateContent(responsePart, quiet);
        }
        updateTextEdits(uri, edits) {
            const array = this._edits.get(uri);
            if (!array) {
                this._edits.set(uri, edits);
            }
            else {
                array.push(...edits);
            }
            this._onDidChange.fire();
        }
        /**
         * Apply one of the progress updates that are not part of the actual response content.
         */
        applyReference(progress) {
            if (progress.kind === 'usedContext') {
                this._usedContext = progress;
            }
            else if (progress.kind === 'reference') {
                this._contentReferences.push(progress);
                this._onDidChange.fire();
            }
        }
        setAgent(agent, slashCommand) {
            this._agent = agent;
            this._slashCommand = slashCommand;
            this._agentOrSlashCommandDetected = true;
            this._onDidChange.fire();
        }
        setResult(result) {
            this._result = result;
            this._onDidChange.fire();
        }
        complete() {
            if (this._result?.errorDetails?.responseIsRedacted) {
                this._response.clear();
            }
            this._isComplete = true;
            this._onDidChange.fire();
        }
        cancel() {
            this._isComplete = true;
            this._isCanceled = true;
            this._onDidChange.fire();
        }
        setFollowups(followups) {
            this._followups = followups;
            this._onDidChange.fire(); // Fire so that command followups get rendered on the row
        }
        setVote(vote) {
            this._vote = vote;
            this._onDidChange.fire();
        }
    }
    exports.ChatResponseModel = ChatResponseModel;
    function isExportableSessionData(obj) {
        const data = obj;
        return typeof data === 'object' &&
            typeof data.providerId === 'string' &&
            typeof data.requesterUsername === 'string';
    }
    function isSerializableSessionData(obj) {
        const data = obj;
        return isExportableSessionData(obj) &&
            typeof data.creationDate === 'number' &&
            typeof data.sessionId === 'string' &&
            obj.requests.every((request) => !request.usedContext /* for backward compat allow missing usedContext */ || (0, chatService_1.isIUsedContext)(request.usedContext));
    }
    var ChatModelInitState;
    (function (ChatModelInitState) {
        ChatModelInitState[ChatModelInitState["Created"] = 0] = "Created";
        ChatModelInitState[ChatModelInitState["Initializing"] = 1] = "Initializing";
        ChatModelInitState[ChatModelInitState["Initialized"] = 2] = "Initialized";
    })(ChatModelInitState || (exports.ChatModelInitState = ChatModelInitState = {}));
    let ChatModel = ChatModel_1 = class ChatModel extends lifecycle_1.Disposable {
        static getDefaultTitle(requests) {
            const firstRequestMessage = (0, arrays_1.firstOrDefault)(requests)?.message ?? '';
            const message = typeof firstRequestMessage === 'string' ?
                firstRequestMessage :
                firstRequestMessage.text;
            return message.split('\n')[0].substring(0, 50);
        }
        get session() {
            return this._session;
        }
        get welcomeMessage() {
            return this._welcomeMessage;
        }
        get sessionId() {
            return this._sessionId;
        }
        get requestInProgress() {
            const lastRequest = this._requests[this._requests.length - 1];
            return !!lastRequest && !!lastRequest.response && !lastRequest.response.isComplete;
        }
        get creationDate() {
            return this._creationDate;
        }
        get _defaultAgent() {
            return this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
        }
        get requesterUsername() {
            return (this._defaultAgent ?
                this._defaultAgent.metadata.requester?.name :
                this.initialData?.requesterUsername) ?? '';
        }
        get responderUsername() {
            return (this._defaultAgent ?
                this._defaultAgent.metadata.fullName :
                this.initialData?.responderUsername) ?? '';
        }
        get requesterAvatarIconUri() {
            return this._defaultAgent ?
                this._defaultAgent.metadata.requester?.icon :
                this._initialRequesterAvatarIconUri;
        }
        get responderAvatarIcon() {
            return this._defaultAgent ?
                this._defaultAgent?.metadata.themeIcon :
                this._initialResponderAvatarIconUri;
        }
        get initState() {
            return this._initState;
        }
        get isImported() {
            return this._isImported;
        }
        get title() {
            return ChatModel_1.getDefaultTitle(this._requests);
        }
        constructor(providerId, initialData, logService, chatAgentService, instantiationService) {
            super();
            this.providerId = providerId;
            this.initialData = initialData;
            this.logService = logService;
            this.chatAgentService = chatAgentService;
            this.instantiationService = instantiationService;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._initState = ChatModelInitState.Created;
            this._isInitializedDeferred = new async_1.DeferredPromise();
            this._isImported = false;
            this._isImported = (!!initialData && !isSerializableSessionData(initialData)) || (initialData?.isImported ?? false);
            this._sessionId = (isSerializableSessionData(initialData) && initialData.sessionId) || (0, uuid_1.generateUuid)();
            this._requests = initialData ? this._deserialize(initialData) : [];
            this._creationDate = (isSerializableSessionData(initialData) && initialData.creationDate) || Date.now();
            this._initialRequesterAvatarIconUri = initialData?.requesterAvatarIconUri && uri_1.URI.revive(initialData.requesterAvatarIconUri);
            this._initialResponderAvatarIconUri = (0, uri_1.isUriComponents)(initialData?.responderAvatarIconUri) ? uri_1.URI.revive(initialData.responderAvatarIconUri) : initialData?.responderAvatarIconUri;
        }
        _deserialize(obj) {
            const requests = obj.requests;
            if (!Array.isArray(requests)) {
                this.logService.error(`Ignoring malformed session data: ${JSON.stringify(obj)}`);
                return [];
            }
            if (obj.welcomeMessage) {
                const content = obj.welcomeMessage.map(item => typeof item === 'string' ? new htmlContent_1.MarkdownString(item) : item);
                this._welcomeMessage = this.instantiationService.createInstance(ChatWelcomeMessageModel, content, []);
            }
            try {
                return requests.map((raw) => {
                    const parsedRequest = typeof raw.message === 'string'
                        ? this.getParsedRequestFromString(raw.message)
                        : (0, chatParserTypes_1.reviveParsedChatRequest)(raw.message);
                    // Old messages don't have variableData, or have it in the wrong (non-array) shape
                    const variableData = raw.variableData && Array.isArray(raw.variableData.variables)
                        ? raw.variableData :
                        { variables: [] };
                    const request = new ChatRequestModel(this, parsedRequest, variableData);
                    if (raw.response || raw.result || raw.responseErrorDetails) {
                        const agent = (raw.agent && 'metadata' in raw.agent) ? // Check for the new format, ignore entries in the old format
                            this.reviveSerializedAgent(raw.agent) : undefined;
                        // Port entries from old format
                        const result = 'responseErrorDetails' in raw ?
                            { errorDetails: raw.responseErrorDetails } : raw.result;
                        request.response = new ChatResponseModel(raw.response ?? [new htmlContent_1.MarkdownString(raw.response)], this, agent, raw.slashCommand, request.id, true, raw.isCanceled, raw.vote, result, raw.followups);
                        if (raw.usedContext) { // @ulugbekna: if this's a new vscode sessions, doc versions are incorrect anyway?
                            request.response.applyReference((0, marshalling_1.revive)(raw.usedContext));
                        }
                        if (raw.contentReferences) {
                            raw.contentReferences.forEach(r => request.response.applyReference((0, marshalling_1.revive)(r)));
                        }
                    }
                    return request;
                });
            }
            catch (error) {
                this.logService.error('Failed to parse chat data', error);
                return [];
            }
        }
        reviveSerializedAgent(raw) {
            const agent = 'name' in raw ?
                raw :
                {
                    ...raw,
                    name: raw.id,
                };
            return (0, marshalling_1.revive)(agent);
        }
        getParsedRequestFromString(message) {
            // TODO These offsets won't be used, but chat replies need to go through the parser as well
            const parts = [new chatParserTypes_1.ChatRequestTextPart(new offsetRange_1.OffsetRange(0, message.length), { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 }, message)];
            return {
                text: message,
                parts
            };
        }
        startInitialize() {
            if (this.initState !== ChatModelInitState.Created) {
                throw new Error(`ChatModel is in the wrong state for startInitialize: ${ChatModelInitState[this.initState]}`);
            }
            this._initState = ChatModelInitState.Initializing;
        }
        deinitialize() {
            this._session = undefined;
            this._initState = ChatModelInitState.Created;
            this._isInitializedDeferred = new async_1.DeferredPromise();
        }
        initialize(session, welcomeMessage) {
            if (this.initState !== ChatModelInitState.Initializing) {
                // Must call startInitialize before initialize, and only call it once
                throw new Error(`ChatModel is in the wrong state for initialize: ${ChatModelInitState[this.initState]}`);
            }
            this._initState = ChatModelInitState.Initialized;
            this._session = session;
            if (!this._welcomeMessage) {
                // Could also have loaded the welcome message from persisted data
                this._welcomeMessage = welcomeMessage;
            }
            this._isInitializedDeferred.complete();
            this._onDidChange.fire({ kind: 'initialize' });
        }
        setInitializationError(error) {
            if (this.initState !== ChatModelInitState.Initializing) {
                throw new Error(`ChatModel is in the wrong state for setInitializationError: ${ChatModelInitState[this.initState]}`);
            }
            if (!this._isInitializedDeferred.isSettled) {
                this._isInitializedDeferred.error(error);
            }
        }
        waitForInitialization() {
            return this._isInitializedDeferred.p;
        }
        getRequests() {
            return this._requests;
        }
        addRequest(message, variableData, chatAgent, slashCommand) {
            if (!this._session) {
                throw new Error('addRequest: No session');
            }
            const request = new ChatRequestModel(this, message, variableData);
            request.response = new ChatResponseModel([], this, chatAgent, slashCommand, request.id);
            this._requests.push(request);
            this._onDidChange.fire({ kind: 'addRequest', request });
            return request;
        }
        acceptResponseProgress(request, progress, quiet) {
            if (!this._session) {
                throw new Error('acceptResponseProgress: No session');
            }
            if (!request.response) {
                request.response = new ChatResponseModel([], this, undefined, undefined, request.id);
            }
            if (request.response.isComplete) {
                throw new Error('acceptResponseProgress: Adding progress to a completed response');
            }
            if (progress.kind === 'vulnerability') {
                request.response.updateContent({ kind: 'markdownVuln', content: { value: progress.content }, vulnerabilities: progress.vulnerabilities }, quiet);
            }
            else if (progress.kind === 'content' || progress.kind === 'markdownContent' || progress.kind === 'treeData' || progress.kind === 'inlineReference' || progress.kind === 'markdownVuln' || progress.kind === 'progressMessage' || progress.kind === 'command') {
                request.response.updateContent(progress, quiet);
            }
            else if (progress.kind === 'usedContext' || progress.kind === 'reference') {
                request.response.applyReference(progress);
            }
            else if (progress.kind === 'agentDetection') {
                const agent = this.chatAgentService.getAgent(progress.agentId);
                if (agent) {
                    request.response.setAgent(agent, progress.command);
                }
            }
            else if (progress.kind === 'textEdit') {
                request.response.updateTextEdits(progress.uri, progress.edits);
            }
            else {
                this.logService.error(`Couldn't handle progress: ${JSON.stringify(progress)}`);
            }
        }
        removeRequest(id) {
            const index = this._requests.findIndex(request => request.id === id);
            const request = this._requests[index];
            if (index !== -1) {
                this._onDidChange.fire({ kind: 'removeRequest', requestId: request.id, responseId: request.response?.id });
                this._requests.splice(index, 1);
                request.response?.dispose();
            }
        }
        cancelRequest(request) {
            if (request.response) {
                request.response.cancel();
            }
        }
        setResponse(request, result) {
            if (!this._session) {
                throw new Error('completeResponse: No session');
            }
            if (!request.response) {
                request.response = new ChatResponseModel([], this, undefined, undefined, request.id);
            }
            request.response.setResult(result);
        }
        completeResponse(request) {
            if (!request.response) {
                throw new Error('Call setResponse before completeResponse');
            }
            request.response.complete();
        }
        setFollowups(request, followups) {
            if (!request.response) {
                // Maybe something went wrong?
                return;
            }
            request.response.setFollowups(followups);
        }
        setResponseModel(request, response) {
            request.response = response;
            this._onDidChange.fire({ kind: 'addResponse', response });
        }
        toExport() {
            return {
                requesterUsername: this.requesterUsername,
                requesterAvatarIconUri: this.requesterAvatarIconUri,
                responderUsername: this.responderUsername,
                responderAvatarIconUri: this.responderAvatarIcon,
                welcomeMessage: this._welcomeMessage?.content.map(c => {
                    if (Array.isArray(c)) {
                        return c;
                    }
                    else {
                        return c.value;
                    }
                }),
                requests: this._requests.map((r) => {
                    const message = {
                        ...r.message,
                        parts: r.message.parts.map(p => p && 'toJSON' in p ? p.toJSON() : p)
                    };
                    return {
                        message,
                        variableData: r.variableData,
                        response: r.response ?
                            r.response.response.value.map(item => {
                                // Keeping the shape of the persisted data the same for back compat
                                if (item.kind === 'treeData') {
                                    return item.treeData;
                                }
                                else if (item.kind === 'markdownContent') {
                                    return item.content;
                                }
                                else {
                                    return item; // TODO
                                }
                            })
                            : undefined,
                        result: r.response?.result,
                        followups: r.response?.followups,
                        isCanceled: r.response?.isCanceled,
                        vote: r.response?.vote,
                        agent: r.response?.agent ?
                            // May actually be the full IChatAgent instance, just take the data props. slashCommands don't matter here.
                            { id: r.response.agent.id, name: r.response.agent.name, description: r.response.agent.description, extensionId: r.response.agent.extensionId, metadata: r.response.agent.metadata, slashCommands: [], locations: r.response.agent.locations, isDefault: r.response.agent.isDefault }
                            : undefined,
                        slashCommand: r.response?.slashCommand,
                        usedContext: r.response?.usedContext,
                        contentReferences: r.response?.contentReferences
                    };
                }),
                providerId: this.providerId,
            };
        }
        toJSON() {
            return {
                ...this.toExport(),
                sessionId: this.sessionId,
                creationDate: this._creationDate,
                isImported: this._isImported
            };
        }
        dispose() {
            this._session?.dispose?.();
            this._requests.forEach(r => r.response?.dispose());
            this._onDidDispose.fire();
            super.dispose();
        }
    };
    exports.ChatModel = ChatModel;
    exports.ChatModel = ChatModel = ChatModel_1 = __decorate([
        __param(2, log_1.ILogService),
        __param(3, chatAgents_1.IChatAgentService),
        __param(4, instantiation_1.IInstantiationService)
    ], ChatModel);
    let ChatWelcomeMessageModel = class ChatWelcomeMessageModel {
        static { ChatWelcomeMessageModel_1 = this; }
        static { this.nextId = 0; }
        get id() {
            return this._id;
        }
        constructor(content, sampleQuestions, chatAgentService) {
            this.content = content;
            this.sampleQuestions = sampleQuestions;
            this.chatAgentService = chatAgentService;
            this._id = 'welcome_' + ChatWelcomeMessageModel_1.nextId++;
        }
        get username() {
            return this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)?.metadata.fullName ?? '';
        }
        get avatarIcon() {
            return this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel)?.metadata.themeIcon;
        }
    };
    exports.ChatWelcomeMessageModel = ChatWelcomeMessageModel;
    exports.ChatWelcomeMessageModel = ChatWelcomeMessageModel = ChatWelcomeMessageModel_1 = __decorate([
        __param(2, chatAgents_1.IChatAgentService)
    ], ChatWelcomeMessageModel);
    function getHistoryEntriesFromModel(model) {
        const history = [];
        for (const request of model.getRequests()) {
            if (!request.response) {
                continue;
            }
            const promptTextResult = (0, chatParserTypes_1.getPromptText)(request.message);
            const historyRequest = {
                sessionId: model.sessionId,
                requestId: request.id,
                agentId: request.response.agent?.id ?? '',
                message: promptTextResult.message,
                command: request.response.slashCommand?.name,
                variables: updateRanges(request.variableData, promptTextResult.diff), // TODO bit of a hack
                location: chatAgents_1.ChatAgentLocation.Panel
            };
            history.push({ request: historyRequest, response: request.response.response.value, result: request.response.result ?? {} });
        }
        return history;
    }
    function updateRanges(variableData, diff) {
        return {
            variables: variableData.variables.map(v => ({
                ...v,
                range: v.range && {
                    start: v.range.start - diff,
                    endExclusive: v.range.endExclusive - diff
                }
            }))
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdE1vZGVsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0TW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXViaEcsMERBS0M7SUFFRCw4REFRQztJQW1jRCxnRUFxQkM7SUFFRCxvQ0FVQztJQWwxQkQsTUFBYSxnQkFBZ0I7aUJBQ2IsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUsxQixJQUFXLEVBQUU7WUFDWixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELElBQVcsUUFBUTtZQUNsQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQVcsYUFBYTtZQUN2QixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUM7UUFDNUMsQ0FBQztRQUVELElBQVcsWUFBWTtZQUN0QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDM0IsQ0FBQztRQUVELElBQVcsWUFBWSxDQUFDLENBQTJCO1lBQ2xELElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFFRCxZQUNpQixPQUFrQixFQUNsQixPQUEyQixFQUNuQyxhQUF1QztZQUYvQixZQUFPLEdBQVAsT0FBTyxDQUFXO1lBQ2xCLFlBQU8sR0FBUCxPQUFPLENBQW9CO1lBQ25DLGtCQUFhLEdBQWIsYUFBYSxDQUEwQjtZQUMvQyxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuRCxDQUFDOztJQS9CRiw0Q0FnQ0M7SUFFRCxNQUFhLFFBQVE7UUFFcEIsSUFBVyxnQkFBZ0I7WUFDMUIsT0FBTyxJQUFJLENBQUMs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