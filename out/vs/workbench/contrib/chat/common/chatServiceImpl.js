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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatContextKeys", "vs/workbench/contrib/chat/common/chatModel", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/contrib/chat/common/chatSlashCommands", "vs/workbench/contrib/chat/common/chatVariables", "vs/workbench/services/extensions/common/extensions"], function (require, exports, actions_1, cancellation_1, errors_1, event_1, htmlContent_1, iterator_1, lifecycle_1, marshalling_1, stopwatch_1, uri_1, nls_1, commands_1, contextkey_1, instantiation_1, log_1, notification_1, progress_1, storage_1, telemetry_1, workspace_1, chatAgents_1, chatContextKeys_1, chatModel_1, chatParserTypes_1, chatRequestParser_1, chatService_1, chatSlashCommands_1, chatVariables_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChatService = void 0;
    const serializedChatKey = 'interactive.sessions';
    const globalChatKey = 'chat.workspaceTransfer';
    const SESSION_TRANSFER_EXPIRATION_IN_MILLISECONDS = 1000 * 60;
    const maxPersistedSessions = 25;
    let ChatService = class ChatService extends lifecycle_1.Disposable {
        get transferredSessionData() {
            return this._transferredSessionData;
        }
        constructor(storageService, logService, extensionService, instantiationService, telemetryService, contextKeyService, workspaceContextService, chatSlashCommandService, chatVariablesService, chatAgentService, notificationService, commandService) {
            super();
            this.storageService = storageService;
            this.logService = logService;
            this.extensionService = extensionService;
            this.instantiationService = instantiationService;
            this.telemetryService = telemetryService;
            this.contextKeyService = contextKeyService;
            this.workspaceContextService = workspaceContextService;
            this.chatSlashCommandService = chatSlashCommandService;
            this.chatVariablesService = chatVariablesService;
            this.chatAgentService = chatAgentService;
            this.notificationService = notificationService;
            this.commandService = commandService;
            this._providers = new Map();
            this._sessionModels = this._register(new lifecycle_1.DisposableMap());
            this._pendingRequests = this._register(new lifecycle_1.DisposableMap());
            this._onDidPerformUserAction = this._register(new event_1.Emitter());
            this.onDidPerformUserAction = this._onDidPerformUserAction.event;
            this._onDidDisposeSession = this._register(new event_1.Emitter());
            this.onDidDisposeSession = this._onDidDisposeSession.event;
            this._onDidRegisterProvider = this._register(new event_1.Emitter());
            this.onDidRegisterProvider = this._onDidRegisterProvider.event;
            this._onDidUnregisterProvider = this._register(new event_1.Emitter());
            this.onDidUnregisterProvider = this._onDidUnregisterProvider.event;
            this._sessionFollowupCancelTokens = this._register(new lifecycle_1.DisposableMap());
            this._hasProvider = chatContextKeys_1.CONTEXT_PROVIDER_EXISTS.bindTo(this.contextKeyService);
            const sessionData = storageService.get(serializedChatKey, 1 /* StorageScope.WORKSPACE */, '');
            if (sessionData) {
                this._persistedSessions = this.deserializeChats(sessionData);
                const countsForLog = Object.keys(this._persistedSessions).length;
                if (countsForLog > 0) {
                    this.trace('constructor', `Restored ${countsForLog} persisted sessions`);
                }
            }
            else {
                this._persistedSessions = {};
            }
            const transferredData = this.getTransferredSessionData();
            const transferredChat = transferredData?.chat;
            if (transferredChat) {
                this.trace('constructor', `Transferred session ${transferredChat.sessionId}`);
                this._persistedSessions[transferredChat.sessionId] = transferredChat;
                this._transferredSessionData = { sessionId: transferredChat.sessionId, inputValue: transferredData.inputValue };
            }
            this._register(storageService.onWillSaveState(() => this.saveState()));
        }
        saveState() {
            let allSessions = Array.from(this._sessionModels.values())
                .filter(session => !session.providerId.startsWith('inlinechat:'))
                .filter(session => session.getRequests().length > 0);
            allSessions = allSessions.concat(Object.values(this._persistedSessions)
                .filter(session => !this._sessionModels.has(session.sessionId))
                .filter(session => session.requests.length));
            allSessions.sort((a, b) => (b.creationDate ?? 0) - (a.creationDate ?? 0));
            allSessions = allSessions.slice(0, maxPersistedSessions);
            if (allSessions.length) {
                this.trace('onWillSaveState', `Persisting ${allSessions.length} sessions`);
            }
            const serialized = JSON.stringify(allSessions);
            if (allSessions.length) {
                this.trace('onWillSaveState', `Persisting ${serialized.length} chars`);
            }
            this.storageService.store(serializedChatKey, serialized, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
        }
        notifyUserAction(action) {
            if (action.action.kind === 'vote') {
                this.telemetryService.publicLog2('interactiveSessionVote', {
                    providerId: action.providerId,
                    direction: action.action.direction === chatService_1.InteractiveSessionVoteDirection.Up ? 'up' : 'down'
                });
            }
            else if (action.action.kind === 'copy') {
                this.telemetryService.publicLog2('interactiveSessionCopy', {
                    providerId: action.providerId,
                    copyKind: action.action.copyKind === chatService_1.ChatCopyKind.Action ? 'action' : 'toolbar'
                });
            }
            else if (action.action.kind === 'insert') {
                this.telemetryService.publicLog2('interactiveSessionInsert', {
                    providerId: action.providerId,
                    newFile: !!action.action.newFile
                });
            }
            else if (action.action.kind === 'command') {
                const command = commands_1.CommandsRegistry.getCommand(action.action.commandButton.command.id);
                const commandId = command ? action.action.commandButton.command.id : 'INVALID';
                this.telemetryService.publicLog2('interactiveSessionCommand', {
                    providerId: action.providerId,
                    commandId
                });
            }
            else if (action.action.kind === 'runInTerminal') {
                this.telemetryService.publicLog2('interactiveSessionRunInTerminal', {
                    providerId: action.providerId,
                    languageId: action.action.languageId ?? ''
                });
            }
            this._onDidPerformUserAction.fire(action);
        }
        trace(method, message) {
            this.logService.trace(`ChatService#${method}: ${message}`);
        }
        error(method, message) {
            this.logService.error(`ChatService#${method} ${message}`);
        }
        deserializeChats(sessionData) {
            try {
                const arrayOfSessions = (0, marshalling_1.revive)(JSON.parse(sessionData)); // Revive serialized URIs in session data
                if (!Array.isArray(arrayOfSessions)) {
                    throw new Error('Expected array');
                }
                const sessions = arrayOfSessions.reduce((acc, session) => {
                    // Revive serialized markdown strings in response data
                    for (const request of session.requests) {
                        if (Array.isArray(request.response)) {
                            request.response = request.response.map((response) => {
                                if (typeof response === 'string') {
                                    return new htmlContent_1.MarkdownString(response);
                                }
                                return response;
                            });
                        }
                        else if (typeof request.response === 'string') {
                            request.response = [new htmlContent_1.MarkdownString(request.response)];
                        }
                    }
                    acc[session.sessionId] = session;
                    return acc;
                }, {});
                return sessions;
            }
            catch (err) {
                this.error('deserializeChats', `Malformed session data: ${err}. [${sessionData.substring(0, 20)}${sessionData.length > 20 ? '...' : ''}]`);
                return {};
            }
        }
        getTransferredSessionData() {
            const data = this.storageService.getObject(globalChatKey, 0 /* StorageScope.PROFILE */, []);
            const workspaceUri = this.workspaceContextService.getWorkspace().folders[0]?.uri;
            if (!workspaceUri) {
                return;
            }
            const thisWorkspace = workspaceUri.toString();
            const currentTime = Date.now();
            // Only use transferred data if it was created recently
            const transferred = data.find(item => uri_1.URI.revive(item.toWorkspace).toString() === thisWorkspace && (currentTime - item.timestampInMilliseconds < SESSION_TRANSFER_EXPIRATION_IN_MILLISECONDS));
            // Keep data that isn't for the current workspace and that hasn't expired yet
            const filtered = data.filter(item => uri_1.URI.revive(item.toWorkspace).toString() !== thisWorkspace && (currentTime - item.timestampInMilliseconds < SESSION_TRANSFER_EXPIRATION_IN_MILLISECONDS));
            this.storageService.store(globalChatKey, JSON.stringify(filtered), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            return transferred;
        }
        /**
         * Returns an array of chat details for all persisted chat sessions that have at least one request.
         * The array is sorted by creation date in descending order.
         * Chat sessions that have already been loaded into the chat view are excluded from the result.
         * Imported chat sessions are also excluded from the result.
         */
        getHistory() {
            const sessions = Object.values(this._persistedSessions)
                .filter(session => session.requests.length > 0);
            sessions.sort((a, b) => (b.creationDate ?? 0) - (a.creationDate ?? 0));
            return sessions
                .filter(session => !this._sessionModels.has(session.sessionId))
                .filter(session => !session.isImported)
                .map(item => {
                const title = chatModel_1.ChatModel.getDefaultTitle(item.requests);
                return {
                    sessionId: item.sessionId,
                    title
                };
            });
        }
        removeHistoryEntry(sessionId) {
            delete this._persistedSessions[sessionId];
            this.saveState();
        }
        clearAllHistoryEntries() {
            this._persistedSessions = {};
            this.saveState();
        }
        startSession(providerId, token) {
            this.trace('startSession', `providerId=${providerId}`);
            return this._startSession(providerId, undefined, token);
        }
        _startSession(providerId, someSessionHistory, token) {
            this.trace('_startSession', `providerId=${providerId}`);
            const model = this.instantiationService.createInstance(chatModel_1.ChatModel, providerId, someSessionHistory);
            this._sessionModels.set(model.sessionId, model);
            this.initializeSession(model, token);
            return model;
        }
        reinitializeModel(model) {
            this.trace('reinitializeModel', `Start reinit`);
            this.initializeSession(model, cancellation_1.CancellationToken.None);
        }
        async initializeSession(model, token) {
            try {
                this.trace('initializeSession', `Initialize session ${model.sessionId}`);
                model.startInitialize();
                await this.extensionService.activateByEvent(`onInteractiveSession:${model.providerId}`);
                const provider = this._providers.get(model.providerId);
                if (!provider) {
                    throw new errors_1.ErrorNoTelemetry(`Unknown provider: ${model.providerId}`);
                }
                let session;
                try {
                    session = await provider.prepareSession(token) ?? undefined;
                }
                catch (err) {
                    this.trace('initializeSession', `Provider initializeSession threw: ${err}`);
                }
                if (!session) {
                    throw new Error('Provider returned no session');
                }
                this.trace('startSession', `Provider returned session`);
                const defaultAgent = this.chatAgentService.getDefaultAgent(chatAgents_1.ChatAgentLocation.Panel);
                if (!defaultAgent) {
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: (0, nls_1.localize)('chatFailErrorMessage', "Chat failed to load. Please ensure that the GitHub Copilot Chat extension is up to date."),
                        actions: {
                            primary: [
                                new actions_1.Action('showExtension', (0, nls_1.localize)('action.showExtension', "Show Extension"), undefined, true, () => {
                                    return this.commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', ['GitHub.copilot-chat']);
                                })
                            ]
                        }
                    });
                    throw new errors_1.ErrorNoTelemetry('No default agent');
                }
                const welcomeMessage = model.welcomeMessage ? undefined : await defaultAgent.provideWelcomeMessage?.(token) ?? undefined;
                const welcomeModel = welcomeMessage && this.instantiationService.createInstance(chatModel_1.ChatWelcomeMessageModel, welcomeMessage.map(item => typeof item === 'string' ? new htmlContent_1.MarkdownString(item) : item), await defaultAgent.provideSampleQuestions?.(token) ?? []);
                model.initialize(session, welcomeModel);
            }
            catch (err) {
                this.trace('startSession', `initializeSession failed: ${err}`);
                model.setInitializationError(err);
                this._sessionModels.deleteAndDispose(model.sessionId);
                this._onDidDisposeSession.fire({ sessionId: model.sessionId, providerId: model.providerId, reason: 'initializationFailed' });
            }
        }
        getSession(sessionId) {
            return this._sessionModels.get(sessionId);
        }
        getSessionId(sessionProviderId) {
            return iterator_1.Iterable.find(this._sessionModels.values(), model => model.session?.id === sessionProviderId)?.sessionId;
        }
        getOrRestoreSession(sessionId) {
            this.trace('getOrRestoreSession', `sessionId: ${sessionId}`);
            const model = this._sessionModels.get(sessionId);
            if (model) {
                return model;
            }
            const sessionData = this._persistedSessions[sessionId];
            if (!sessionData) {
                return undefined;
            }
            if (sessionId === this.transferredSessionData?.sessionId) {
                this._transferredSessionData = undefined;
            }
            return this._startSession(sessionData.providerId, sessionData, cancellation_1.CancellationToken.None);
        }
        loadSessionFromContent(data) {
            return this._startSession(data.providerId, data, cancellation_1.CancellationToken.None);
        }
        async sendRequest(sessionId, request, implicitVariablesEnabled, location = chatAgents_1.ChatAgentLocation.Panel, parserContext) {
            this.trace('sendRequest', `sessionId: ${sessionId}, message: ${request.substring(0, 20)}${request.length > 20 ? '[...]' : ''}}`);
            if (!request.trim()) {
                this.trace('sendRequest', 'Rejected empty message');
                return;
            }
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            await model.waitForInitialization();
            const provider = this._providers.get(model.providerId);
            if (!provider) {
                throw new Error(`Unknown provider: ${model.providerId}`);
            }
            if (this._pendingRequests.has(sessionId)) {
                this.trace('sendRequest', `Session ${sessionId} already has a pending request`);
                return;
            }
            const defaultAgent = this.chatAgentService.getDefaultAgent(location);
            const parsedRequest = this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(sessionId, request, location, parserContext);
            const agent = parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentPart)?.agent ?? defaultAgent;
            const agentSlashCommandPart = parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            // This method is only returning whether the request was accepted - don't block on the actual request
            return {
                responseCompletePromise: this._sendRequestAsync(model, sessionId, provider, parsedRequest, implicitVariablesEnabled ?? false, defaultAgent, location),
                agent,
                slashCommand: agentSlashCommandPart?.command,
            };
        }
        refreshFollowupsCancellationToken(sessionId) {
            this._sessionFollowupCancelTokens.get(sessionId)?.cancel();
            const newTokenSource = new cancellation_1.CancellationTokenSource();
            this._sessionFollowupCancelTokens.set(sessionId, newTokenSource);
            return newTokenSource.token;
        }
        async _sendRequestAsync(model, sessionId, provider, parsedRequest, implicitVariablesEnabled, defaultAgent, location) {
            const followupsCancelToken = this.refreshFollowupsCancellationToken(sessionId);
            let request;
            const agentPart = 'kind' in parsedRequest ? undefined : parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentPart);
            const agentSlashCommandPart = 'kind' in parsedRequest ? undefined : parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestAgentSubcommandPart);
            const commandPart = 'kind' in parsedRequest ? undefined : parsedRequest.parts.find((r) => r instanceof chatParserTypes_1.ChatRequestSlashCommandPart);
            let gotProgress = false;
            const requestType = commandPart ? 'slashCommand' : 'string';
            const source = new cancellation_1.CancellationTokenSource();
            const token = source.token;
            const sendRequestInternal = async () => {
                const progressCallback = (progress) => {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    gotProgress = true;
                    if (progress.kind === 'content' || progress.kind === 'markdownContent') {
                        this.trace('sendRequest', `Provider returned progress for session ${model.sessionId}, ${typeof progress.content === 'string' ? progress.content.length : progress.content.value.length} chars`);
                    }
                    else {
                        this.trace('sendRequest', `Provider returned progress: ${JSON.stringify(progress)}`);
                    }
                    model.acceptResponseProgress(request, progress);
                };
                const stopWatch = new stopwatch_1.StopWatch(false);
                const listener = token.onCancellationRequested(() => {
                    this.trace('sendRequest', `Request for session ${model.sessionId} was cancelled`);
                    this.telemetryService.publicLog2('interactiveSessionProviderInvoked', {
                        providerId: provider.id,
                        timeToFirstProgress: undefined,
                        // Normally timings happen inside the EH around the actual provider. For cancellation we can measure how long the user waited before cancelling
                        totalTime: stopWatch.elapsed(),
                        result: 'cancelled',
                        requestType,
                        agent: agentPart?.agent.id ?? '',
                        slashCommand: agentSlashCommandPart ? agentSlashCommandPart.command.name : commandPart?.slashCommand.command,
                        chatSessionId: model.sessionId
                    });
                    model.cancelRequest(request);
                });
                try {
                    let rawResult;
                    let agentOrCommandFollowups = undefined;
                    if (agentPart || (defaultAgent && !commandPart)) {
                        const agent = (agentPart?.agent ?? defaultAgent);
                        await this.extensionService.activateByEvent(`onChatParticipant:${agent.id}`);
                        const history = (0, chatModel_1.getHistoryEntriesFromModel)(model);
                        const initVariableData = { variables: [] };
                        request = model.addRequest(parsedRequest, initVariableData, agent, agentSlashCommandPart?.command);
                        const variableData = await this.chatVariablesService.resolveVariables(parsedRequest, model, progressCallback, token);
                        request.variableData = variableData;
                        const promptTextResult = (0, chatParserTypes_1.getPromptText)(request.message);
                        const updatedVariableData = (0, chatModel_1.updateRanges)(variableData, promptTextResult.diff); // TODO bit of a hack
                        if (implicitVariablesEnabled) {
                            const implicitVariables = agent.defaultImplicitVariables;
                            if (implicitVariables) {
                                const resolvedImplicitVariables = await Promise.all(implicitVariables.map(async (v) => ({ name: v, values: await this.chatVariablesService.resolveVariable(v, parsedRequest.text, model, progressCallback, token) })));
                                updatedVariableData.variables.push(...resolvedImplicitVariables);
                            }
                        }
                        const requestProps = {
                            sessionId,
                            requestId: request.id,
                            agentId: agent.id,
                            message: promptTextResult.message,
                            command: agentSlashCommandPart?.command.name,
                            variables: updatedVariableData,
                            location
                        };
                        const agentResult = await this.chatAgentService.invokeAgent(agent.id, requestProps, progressCallback, history, token);
                        rawResult = agentResult;
                        agentOrCommandFollowups = this.chatAgentService.getFollowups(agent.id, requestProps, agentResult, history, followupsCancelToken);
                    }
                    else if (commandPart && this.chatSlashCommandService.hasCommand(commandPart.slashCommand.command)) {
                        request = model.addRequest(parsedRequest, { variables: [] });
                        // contributed slash commands
                        // TODO: spell this out in the UI
                        const history = [];
                        for (const request of model.getRequests()) {
                            if (!request.response) {
                                continue;
                            }
                            history.push({ role: 1 /* ChatMessageRole.User */, content: request.message.text });
                            history.push({ role: 2 /* ChatMessageRole.Assistant */, content: request.response.response.asString() });
                        }
                        const message = parsedRequest.text;
                        const commandResult = await this.chatSlashCommandService.executeCommand(commandPart.slashCommand.command, message.substring(commandPart.slashCommand.command.length + 1).trimStart(), new progress_1.Progress(p => {
                            progressCallback(p);
                        }), history, token);
                        agentOrCommandFollowups = Promise.resolve(commandResult?.followUp);
                        rawResult = {};
                    }
                    else {
                        throw new Error(`Cannot handle request`);
                    }
                    if (token.isCancellationRequested) {
                        return;
                    }
                    else {
                        if (!rawResult) {
                            this.trace('sendRequest', `Provider returned no response for session ${model.sessionId}`);
                            rawResult = { errorDetails: { message: (0, nls_1.localize)('emptyResponse', "Provider returned null response") } };
                        }
                        const result = rawResult.errorDetails?.responseIsFiltered ? 'filtered' :
                            rawResult.errorDetails && gotProgress ? 'errorWithOutput' :
                                rawResult.errorDetails ? 'error' :
                                    'success';
                        this.telemetryService.publicLog2('interactiveSessionProviderInvoked', {
                            providerId: provider.id,
                            timeToFirstProgress: rawResult.timings?.firstProgress,
                            totalTime: rawResult.timings?.totalElapsed,
                            result,
                            requestType,
                            agent: agentPart?.agent.id ?? '',
                            slashCommand: agentSlashCommandPart ? agentSlashCommandPart.command.name : commandPart?.slashCommand.command,
                            chatSessionId: model.sessionId
                        });
                        model.setResponse(request, rawResult);
                        this.trace('sendRequest', `Provider returned response for session ${model.sessionId}`);
                        model.completeResponse(request);
                        if (agentOrCommandFollowups) {
                            agentOrCommandFollowups.then(followups => {
                                model.setFollowups(request, followups);
                            });
                        }
                    }
                }
                finally {
                    listener.dispose();
                }
            };
            const rawResponsePromise = sendRequestInternal();
            this._pendingRequests.set(model.sessionId, source);
            rawResponsePromise.finally(() => {
                this._pendingRequests.deleteAndDispose(model.sessionId);
            });
            return rawResponsePromise;
        }
        async removeRequest(sessionId, requestId) {
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            await model.waitForInitialization();
            const provider = this._providers.get(model.providerId);
            if (!provider) {
                throw new Error(`Unknown provider: ${model.providerId}`);
            }
            model.removeRequest(requestId);
        }
        getProviders() {
            return Array.from(this._providers.keys());
        }
        async addCompleteRequest(sessionId, message, variableData, response) {
            this.trace('addCompleteRequest', `message: ${message}`);
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            await model.waitForInitialization();
            const parsedRequest = typeof message === 'string' ?
                this.instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(sessionId, message) :
                message;
            const request = model.addRequest(parsedRequest, variableData || { variables: [] });
            if (typeof response.message === 'string') {
                model.acceptResponseProgress(request, { content: response.message, kind: 'content' });
            }
            else {
                for (const part of response.message) {
                    model.acceptResponseProgress(request, part, true);
                }
            }
            model.setResponse(request, response.result || {});
            if (response.followups !== undefined) {
                model.setFollowups(request, response.followups);
            }
            model.completeResponse(request);
        }
        cancelCurrentRequestForSession(sessionId) {
            this.trace('cancelCurrentRequestForSession', `sessionId: ${sessionId}`);
            this._pendingRequests.get(sessionId)?.cancel();
            this._pendingRequests.deleteAndDispose(sessionId);
        }
        clearSession(sessionId) {
            this.trace('clearSession', `sessionId: ${sessionId}`);
            const model = this._sessionModels.get(sessionId);
            if (!model) {
                throw new Error(`Unknown session: ${sessionId}`);
            }
            if (!model.providerId.startsWith('inlinechat')) {
                this._persistedSessions[sessionId] = model.toJSON();
            }
            this._sessionModels.deleteAndDispose(sessionId);
            this._pendingRequests.get(sessionId)?.cancel();
            this._pendingRequests.deleteAndDispose(sessionId);
            this._onDidDisposeSession.fire({ sessionId, providerId: model.providerId, reason: 'cleared' });
        }
        registerProvider(provider) {
            this.trace('registerProvider', `Adding new chat provider`);
            if (this._providers.has(provider.id)) {
                throw new Error(`Provider ${provider.id} already registered`);
            }
            this._providers.set(provider.id, provider);
            this._hasProvider.set(true);
            this._onDidRegisterProvider.fire({ providerId: provider.id });
            Array.from(this._sessionModels.values())
                .filter(model => model.providerId === provider.id)
                // The provider may have been registered in the process of initializing this model. Only grab models that were deinitialized when the provider was unregistered
                .filter(model => model.initState === chatModel_1.ChatModelInitState.Created)
                .forEach(model => this.reinitializeModel(model));
            return (0, lifecycle_1.toDisposable)(() => {
                this.trace('registerProvider', `Disposing chat provider`);
                this._providers.delete(provider.id);
                this._hasProvider.set(this._providers.size > 0);
                Array.from(this._sessionModels.values())
                    .filter(model => model.providerId === provider.id)
                    .forEach(model => model.deinitialize());
                this._onDidUnregisterProvider.fire({ providerId: provider.id });
            });
        }
        hasSessions(providerId) {
            return !!Object.values(this._persistedSessions).find((session) => session.providerId === providerId);
        }
        getProviderInfos() {
            return Array.from(this._providers.values()).map(provider => {
                return {
                    id: provider.id,
                };
            });
        }
        transferChatSession(transferredSessionData, toWorkspace) {
            const model = iterator_1.Iterable.find(this._sessionModels.values(), model => model.sessionId === transferredSessionData.sessionId);
            if (!model) {
                throw new Error(`Failed to transfer session. Unknown session ID: ${transferredSessionData.sessionId}`);
            }
            const existingRaw = this.storageService.getObject(globalChatKey, 0 /* StorageScope.PROFILE */, []);
            existingRaw.push({
                chat: model.toJSON(),
                timestampInMilliseconds: Date.now(),
                toWorkspace: toWorkspace,
                inputValue: transferredSessionData.inputValue,
            });
            this.storageService.store(globalChatKey, JSON.stringify(existingRaw), 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            this.trace('transferChatSession', `Transferred session ${model.sessionId} to workspace ${toWorkspace.toString()}`);
        }
    };
    exports.ChatService = ChatService;
    exports.ChatService = ChatService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, log_1.ILogService),
        __param(2, extensions_1.IExtensionService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, chatSlashCommands_1.IChatSlashCommandService),
        __param(8, chatVariables_1.IChatVariablesService),
        __param(9, chatAgents_1.IChatAgentService),
        __param(10, notification_1.INotificationService),
        __param(11, commands_1.ICommandService)
    ], ChatService);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdFNlcnZpY2VJbXBsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L2NvbW1vbi9jaGF0U2VydmljZUltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUNoRyxNQUFNLGlCQUFpQixHQUFHLHNCQUFzQixDQUFDO0lBRWpELE1BQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFDO0lBTy9DLE1BQU0sMkNBQTJDLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQXNGOUQsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLENBQUM7SUFFekIsSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHNCQUFVO1FBVzFDLElBQVcsc0JBQXNCO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDO1FBQ3JDLENBQUM7UUFnQkQsWUFDa0IsY0FBZ0QsRUFDcEQsVUFBd0MsRUFDbEMsZ0JBQW9ELEVBQ2hELG9CQUE0RCxFQUNoRSxnQkFBb0QsRUFDbkQsaUJBQXNELEVBQ2hELHVCQUFrRSxFQUNsRSx1QkFBa0UsRUFDckUsb0JBQTRELEVBQ2hFLGdCQUFvRCxFQUNqRCxtQkFBMEQsRUFDL0QsY0FBZ0Q7WUFFakUsS0FBSyxFQUFFLENBQUM7WUFiMEIsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ25DLGVBQVUsR0FBVixVQUFVLENBQWE7WUFDakIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBQy9DLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDbEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMvQiw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQ2pELDRCQUF1QixHQUF2Qix1QkFBdUIs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