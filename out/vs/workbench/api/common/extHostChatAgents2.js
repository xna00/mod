/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/extensions/common/extensions", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, arrays_1, async_1, errorMessage_1, event_1, iterator_1, lifecycle_1, stopwatch_1, types_1, uri_1, nls_1, extensions_1, extHost_protocol_1, typeConvert, extHostTypes, chatService_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostChatAgents2 = void 0;
    class ChatAgentResponseStream {
        constructor(_extension, _request, _proxy, _logService, _commandsConverter, _sessionDisposables) {
            this._extension = _extension;
            this._request = _request;
            this._proxy = _proxy;
            this._logService = _logService;
            this._commandsConverter = _commandsConverter;
            this._sessionDisposables = _sessionDisposables;
            this._stopWatch = stopwatch_1.StopWatch.create(false);
            this._isClosed = false;
        }
        close() {
            this._isClosed = true;
        }
        get timings() {
            return {
                firstProgress: this._firstProgress,
                totalElapsed: this._stopWatch.elapsed()
            };
        }
        get apiObject() {
            if (!this._apiObject) {
                const that = this;
                this._stopWatch.reset();
                function throwIfDone(source) {
                    if (that._isClosed) {
                        const err = new Error('Response stream has been closed');
                        Error.captureStackTrace(err, source);
                        throw err;
                    }
                }
                const _report = (progress) => {
                    // Measure the time to the first progress update with real markdown content
                    if (typeof this._firstProgress === 'undefined' && 'content' in progress) {
                        this._firstProgress = this._stopWatch.elapsed();
                    }
                    this._proxy.$handleProgressChunk(this._request.requestId, progress);
                };
                this._apiObject = {
                    markdown(value) {
                        throwIfDone(this.markdown);
                        const part = new extHostTypes.ChatResponseMarkdownPart(value);
                        const dto = typeConvert.ChatResponseMarkdownPart.to(part);
                        _report(dto);
                        return this;
                    },
                    filetree(value, baseUri) {
                        throwIfDone(this.filetree);
                        const part = new extHostTypes.ChatResponseFileTreePart(value, baseUri);
                        const dto = typeConvert.ChatResponseFilesPart.to(part);
                        _report(dto);
                        return this;
                    },
                    anchor(value, title) {
                        throwIfDone(this.anchor);
                        const part = new extHostTypes.ChatResponseAnchorPart(value, title);
                        const dto = typeConvert.ChatResponseAnchorPart.to(part);
                        _report(dto);
                        return this;
                    },
                    button(value) {
                        throwIfDone(this.anchor);
                        const part = new extHostTypes.ChatResponseCommandButtonPart(value);
                        const dto = typeConvert.ChatResponseCommandButtonPart.to(part, that._commandsConverter, that._sessionDisposables);
                        _report(dto);
                        return this;
                    },
                    progress(value) {
                        throwIfDone(this.progress);
                        const part = new extHostTypes.ChatResponseProgressPart(value);
                        const dto = typeConvert.ChatResponseProgressPart.to(part);
                        _report(dto);
                        return this;
                    },
                    reference(value) {
                        throwIfDone(this.reference);
                        if ('variableName' in value && !value.value) {
                            // The participant used this variable. Does that variable have any references to pull in?
                            const matchingVarData = that._request.variables.variables.find(v => v.name === value.variableName);
                            if (matchingVarData) {
                                let references;
                                if (matchingVarData.references?.length) {
                                    references = matchingVarData.references.map(r => ({
                                        kind: 'reference',
                                        reference: { variableName: value.variableName, value: r.reference }
                                    }));
                                }
                                else {
                                    // Participant sent a variableName reference but the variable produced no references. Show variable reference with no value
                                    const part = new extHostTypes.ChatResponseReferencePart(value);
                                    const dto = typeConvert.ChatResponseReferencePart.to(part);
                                    references = [dto];
                                }
                                references.forEach(r => _report(r));
                                return this;
                            }
                            else {
                                // Something went wrong- that variable doesn't actually exist
                            }
                        }
                        else {
                            const part = new extHostTypes.ChatResponseReferencePart(value);
                            const dto = typeConvert.ChatResponseReferencePart.to(part);
                            _report(dto);
                        }
                        return this;
                    },
                    push(part) {
                        throwIfDone(this.push);
                        if (part instanceof extHostTypes.ChatResponseReferencePart) {
                            // Ensure variable reference values get fixed up
                            this.reference(part.value);
                        }
                        else {
                            const dto = typeConvert.ChatResponsePart.to(part, that._commandsConverter, that._sessionDisposables);
                            _report(dto);
                        }
                        return this;
                    },
                    report(progress) {
                        throwIfDone(this.report);
                        if ('placeholder' in progress && 'resolvedContent' in progress) {
                            // Ignore for now, this is the deleted Task type
                            return;
                        }
                        const value = typeConvert.ChatResponseProgress.from(that._extension, progress);
                        if (!value) {
                            that._logService.error('Unknown progress type: ' + JSON.stringify(progress));
                            return;
                        }
                        _report(value);
                        return this;
                    }
                };
            }
            return this._apiObject;
        }
    }
    class ExtHostChatAgents2 {
        static { this._idPool = 0; }
        constructor(mainContext, _logService, commands) {
            this._logService = _logService;
            this.commands = commands;
            this._agents = new Map();
            this._sessionDisposables = new lifecycle_1.DisposableMap();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadChatAgents2);
        }
        createChatAgent(extension, id, handler) {
            const handle = ExtHostChatAgents2._idPool++;
            const agent = new ExtHostChatAgent(extension, id, this._proxy, handle, handler);
            this._agents.set(handle, agent);
            this._proxy.$registerAgent(handle, extension.identifier, id, {}, undefined);
            return agent.apiAgent;
        }
        createDynamicChatAgent(extension, id, name, description, handler) {
            const handle = ExtHostChatAgents2._idPool++;
            const agent = new ExtHostChatAgent(extension, id, this._proxy, handle, handler);
            this._agents.set(handle, agent);
            this._proxy.$registerAgent(handle, extension.identifier, id, {}, { name, description });
            return agent.apiAgent;
        }
        async $invokeAgent(handle, request, context, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                throw new Error(`[CHAT](${handle}) CANNOT invoke agent because the agent is not registered`);
            }
            // Init session disposables
            let sessionDisposables = this._sessionDisposables.get(request.sessionId);
            if (!sessionDisposables) {
                sessionDisposables = new lifecycle_1.DisposableStore();
                this._sessionDisposables.set(request.sessionId, sessionDisposables);
            }
            const stream = new ChatAgentResponseStream(agent.extension, request, this._proxy, this._logService, this.commands.converter, sessionDisposables);
            try {
                const convertedHistory = await this.prepareHistoryTurns(request.agentId, context);
                const task = agent.invoke(typeConvert.ChatAgentRequest.to(request), { history: convertedHistory }, stream.apiObject, token);
                return await (0, async_1.raceCancellation)(Promise.resolve(task).then((result) => {
                    if (result?.metadata) {
                        try {
                            JSON.stringify(result.metadata);
                        }
                        catch (err) {
                            const msg = `result.metadata MUST be JSON.stringify-able. Got error: ${err.message}`;
                            this._logService.error(`[${agent.extension.identifier.value}] [@${agent.id}] ${msg}`, agent.extension);
                            return { errorDetails: { message: msg }, timings: stream.timings };
                        }
                    }
                    return { errorDetails: result?.errorDetails, timings: stream.timings, metadata: result?.metadata };
                }), token);
            }
            catch (e) {
                this._logService.error(e, agent.extension);
                return { errorDetails: { message: (0, nls_1.localize)('errorResponse', "Error from participant: {0}", (0, errorMessage_1.toErrorMessage)(e)), responseIsIncomplete: true } };
            }
            finally {
                stream.close();
            }
        }
        async prepareHistoryTurns(agentId, context) {
            const res = [];
            for (const h of context.history) {
                const ehResult = typeConvert.ChatAgentResult.to(h.result);
                const result = agentId === h.request.agentId ?
                    ehResult :
                    { ...ehResult, metadata: undefined };
                // REQUEST turn
                res.push(new extHostTypes.ChatRequestTurn(h.request.message, h.request.command, h.request.variables.variables.map(typeConvert.ChatAgentResolvedVariable.to), h.request.agentId));
                // RESPONSE turn
                const parts = (0, arrays_1.coalesce)(h.response.map(r => typeConvert.ChatResponsePart.fromContent(r, this.commands.converter)));
                res.push(new extHostTypes.ChatResponseTurn(parts, result, h.request.agentId, h.request.command));
            }
            return res;
        }
        $releaseSession(sessionId) {
            this._sessionDisposables.deleteAndDispose(sessionId);
        }
        async $provideFollowups(request, handle, result, context, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return Promise.resolve([]);
            }
            const convertedHistory = await this.prepareHistoryTurns(agent.id, context);
            const ehResult = typeConvert.ChatAgentResult.to(result);
            return (await agent.provideFollowups(ehResult, { history: convertedHistory }, token))
                .filter(f => {
                // The followup must refer to a participant that exists from the same extension
                const isValid = !f.participant || iterator_1.Iterable.some(this._agents.values(), a => a.id === f.participant && extensions_1.ExtensionIdentifier.equals(a.extension.identifier, agent.extension.identifier));
                if (!isValid) {
                    this._logService.warn(`[@${agent.id}] ChatFollowup refers to an unknown participant: ${f.participant}`);
                }
                return isValid;
            })
                .map(f => typeConvert.ChatFollowup.from(f, request));
        }
        $acceptFeedback(handle, result, vote, reportIssue) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            const ehResult = typeConvert.ChatAgentResult.to(result);
            let kind;
            switch (vote) {
                case chatService_1.InteractiveSessionVoteDirection.Down:
                    kind = extHostTypes.ChatResultFeedbackKind.Unhelpful;
                    break;
                case chatService_1.InteractiveSessionVoteDirection.Up:
                    kind = extHostTypes.ChatResultFeedbackKind.Helpful;
                    break;
            }
            agent.acceptFeedback(reportIssue ?
                Object.freeze({ result: ehResult, kind, reportIssue }) :
                Object.freeze({ result: ehResult, kind }));
        }
        $acceptAction(handle, result, event) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            if (event.action.kind === 'vote') {
                // handled by $acceptFeedback
                return;
            }
            const ehAction = typeConvert.ChatAgentUserActionEvent.to(result, event, this.commands.converter);
            if (ehAction) {
                agent.acceptAction(Object.freeze(ehAction));
            }
        }
        async $invokeCompletionProvider(handle, query, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return [];
            }
            const items = await agent.invokeCompletionProvider(query, token);
            return items.map(typeConvert.ChatAgentCompletionItem.from);
        }
        async $provideWelcomeMessage(handle, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            return await agent.provideWelcomeMessage(token);
        }
        async $provideSampleQuestions(handle, token) {
            const agent = this._agents.get(handle);
            if (!agent) {
                return;
            }
            return (await agent.provideSampleQuestions(token))
                .map(f => typeConvert.ChatFollowup.from(f, undefined));
        }
    }
    exports.ExtHostChatAgents2 = ExtHostChatAgents2;
    class ExtHostChatAgent {
        constructor(extension, id, _proxy, _handle, _requestHandler) {
            this.extension = extension;
            this.id = id;
            this._proxy = _proxy;
            this._handle = _handle;
            this._requestHandler = _requestHandler;
            this._onDidReceiveFeedback = new event_1.Emitter();
            this._onDidPerformAction = new event_1.Emitter();
        }
        acceptFeedback(feedback) {
            this._onDidReceiveFeedback.fire(feedback);
        }
        acceptAction(event) {
            this._onDidPerformAction.fire(event);
        }
        async invokeCompletionProvider(query, token) {
            if (!this._agentVariableProvider) {
                return [];
            }
            return await this._agentVariableProvider.provider.provideCompletionItems(query, token) ?? [];
        }
        async provideFollowups(result, context, token) {
            if (!this._followupProvider) {
                return [];
            }
            const followups = await this._followupProvider.provideFollowups(result, context, token);
            if (!followups) {
                return [];
            }
            return followups
                // Filter out "command followups" from older providers
                .filter(f => !(f && 'commandId' in f))
                // Filter out followups from older providers before 'message' changed to 'prompt'
                .filter(f => !(f && 'message' in f));
        }
        async provideWelcomeMessage(token) {
            if (!this._welcomeMessageProvider) {
                return [];
            }
            const content = await this._welcomeMessageProvider.provideWelcomeMessage(token);
            if (!content) {
                return [];
            }
            return content.map(item => {
                if (typeof item === 'string') {
                    return item;
                }
                else {
                    return typeConvert.MarkdownString.from(item);
                }
            });
        }
        async provideSampleQuestions(token) {
            if (!this._welcomeMessageProvider || !this._welcomeMessageProvider.provideSampleQuestions) {
                return [];
            }
            const content = await this._welcomeMessageProvider.provideSampleQuestions(token);
            if (!content) {
                return [];
            }
            return content;
        }
        get apiAgent() {
            let disposed = false;
            let updateScheduled = false;
            const updateMetadataSoon = () => {
                if (disposed) {
                    return;
                }
                if (updateScheduled) {
                    return;
                }
                updateScheduled = true;
                queueMicrotask(() => {
                    this._proxy.$updateAgent(this._handle, {
                        fullName: this._fullName,
                        icon: !this._iconPath ? undefined :
                            this._iconPath instanceof uri_1.URI ? this._iconPath :
                                'light' in this._iconPath ? this._iconPath.light :
                                    undefined,
                        iconDark: !this._iconPath ? undefined :
                            'dark' in this._iconPath ? this._iconPath.dark :
                                undefined,
                        themeIcon: this._iconPath instanceof extHostTypes.ThemeIcon ? this._iconPath : undefined,
                        hasFollowups: this._followupProvider !== undefined,
                        isSecondary: this._isSecondary,
                        helpTextPrefix: (!this._helpTextPrefix || typeof this._helpTextPrefix === 'string') ? this._helpTextPrefix : typeConvert.MarkdownString.from(this._helpTextPrefix),
                        helpTextVariablesPrefix: (!this._helpTextVariablesPrefix || typeof this._helpTextVariablesPrefix === 'string') ? this._helpTextVariablesPrefix : typeConvert.MarkdownString.from(this._helpTextVariablesPrefix),
                        helpTextPostfix: (!this._helpTextPostfix || typeof this._helpTextPostfix === 'string') ? this._helpTextPostfix : typeConvert.MarkdownString.from(this._helpTextPostfix),
                        sampleRequest: this._sampleRequest,
                        supportIssueReporting: this._supportIssueReporting,
                        requester: this._requester
                    });
                    updateScheduled = false;
                });
            };
            const that = this;
            return {
                get id() {
                    return that.id;
                },
                get fullName() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._fullName ?? that.extension.displayName ?? that.extension.name;
                },
                set fullName(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._fullName = v;
                    updateMetadataSoon();
                },
                get iconPath() {
                    return that._iconPath;
                },
                set iconPath(v) {
                    that._iconPath = v;
                    updateMetadataSoon();
                },
                get requestHandler() {
                    return that._requestHandler;
                },
                set requestHandler(v) {
                    (0, types_1.assertType)(typeof v === 'function', 'Invalid request handler');
                    that._requestHandler = v;
                },
                get followupProvider() {
                    return that._followupProvider;
                },
                set followupProvider(v) {
                    that._followupProvider = v;
                    updateMetadataSoon();
                },
                get isDefault() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._isDefault;
                },
                set isDefault(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._isDefault = v;
                    updateMetadataSoon();
                },
                get helpTextPrefix() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._helpTextPrefix;
                },
                set helpTextPrefix(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._helpTextPrefix = v;
                    updateMetadataSoon();
                },
                get helpTextVariablesPrefix() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._helpTextVariablesPrefix;
                },
                set helpTextVariablesPrefix(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._helpTextVariablesPrefix = v;
                    updateMetadataSoon();
                },
                get helpTextPostfix() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._helpTextPostfix;
                },
                set helpTextPostfix(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._helpTextPostfix = v;
                    updateMetadataSoon();
                },
                get isSecondary() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._isSecondary;
                },
                set isSecondary(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._isSecondary = v;
                    updateMetadataSoon();
                },
                get sampleRequest() {
                    return that._sampleRequest;
                },
                set sampleRequest(v) {
                    that._sampleRequest = v;
                    updateMetadataSoon();
                },
                get supportIssueReporting() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    return that._supportIssueReporting;
                },
                set supportIssueReporting(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    that._supportIssueReporting = v;
                    updateMetadataSoon();
                },
                get onDidReceiveFeedback() {
                    return that._onDidReceiveFeedback.event;
                },
                set participantVariableProvider(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    that._agentVariableProvider = v;
                    if (v) {
                        if (!v.triggerCharacters.length) {
                            throw new Error('triggerCharacters are required');
                        }
                        that._proxy.$registerAgentCompletionsProvider(that._handle, v.triggerCharacters);
                    }
                    else {
                        that._proxy.$unregisterAgentCompletionsProvider(that._handle);
                    }
                },
                get participantVariableProvider() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'chatParticipantAdditions');
                    return that._agentVariableProvider;
                },
                set welcomeMessageProvider(v) {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    that._welcomeMessageProvider = v;
                    updateMetadataSoon();
                },
                get welcomeMessageProvider() {
                    (0, extensions_2.checkProposedApiEnabled)(that.extension, 'defaultChatParticipant');
                    return that._welcomeMessageProvider;
                },
                onDidPerformAction: !(0, extensions_2.isProposedApiEnabled)(this.extension, 'chatParticipantAdditions')
                    ? undefined
                    : this._onDidPerformAction.event,
                set requester(v) {
                    that._requester = v;
                    updateMetadataSoon();
                },
                get requester() {
                    return that._requester;
                },
                dispose() {
                    disposed = true;
                    that._followupProvider = undefined;
                    that._onDidReceiveFeedback.dispose();
                    that._proxy.$unregisterAgent(that._handle);
                },
            };
        }
        invoke(request, context, response, token) {
            return this._requestHandler(request, context, response, token);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENoYXRBZ2VudHMyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2NvbW1vbi9leHRIb3N0Q2hhdEFnZW50czIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMkJoRyxNQUFNLHVCQUF1QjtRQU81QixZQUNrQixVQUFpQyxFQUNqQyxRQUEyQixFQUMzQixNQUFrQyxFQUNsQyxXQUF3QixFQUN4QixrQkFBcUMsRUFDckMsbUJBQW9DO1lBTHBDLGVBQVUsR0FBVixVQUFVLENBQXVCO1lBQ2pDLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQzNCLFdBQU0sR0FBTixNQUFNLENBQTRCO1lBQ2xDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1lBQ3hCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBbUI7WUFDckMsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFpQjtZQVg5QyxlQUFVLEdBQUcscUJBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDckMsY0FBUyxHQUFZLEtBQUssQ0FBQztRQVcvQixDQUFDO1FBRUwsS0FBSztZQUNKLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDVixPQUFPO2dCQUNOLGFBQWEsRUFBRSxJQUFJLENBQUMsY0FBYztnQkFDbEMsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFO2FBQ3ZDLENBQUM7UUFDSCxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBRVosSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFFdEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO2dCQUNsQixJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUV4QixTQUFTLFdBQVcsQ0FBQyxNQUE0QjtvQkFDaEQsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7d0JBQ3BCLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7d0JBQ3pELEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQ3JDLE1BQU0sR0FBRyxDQUFDO29CQUNYLENBQUM7Z0JBQ0YsQ0FBQztnQkFFRCxNQUFNLE9BQU8sR0FBRyxDQUFDLFFBQTRCLEVBQUUsRUFBRTtvQkFDaEQsMkVBQTJFO29CQUMzRSxJQUFJLE9BQU8sSUFBSSxDQUFDLGNBQWMsS0FBSyxXQUFXLElBQUksU0FBUyxJQUFJLFFBQVEsRUFBRSxDQUFDO3dCQUN6RSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pELENBQUM7b0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDckUsQ0FBQyxDQUFDO2dCQUVGLElBQUksQ0FBQyxVQUFVLEdBQUc7b0JBQ2pCLFFBQVEsQ0FBQyxLQUFLO3dCQUNiLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM5RCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMxRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2IsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFDRCxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU87d0JBQ3RCLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDdkUsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzt3QkFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO3dCQUNiLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEtBQUssRUFBRSxLQUFjO3dCQUMzQixXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUN6QixNQUFNLElBQUksR0FBRyxJQUFJLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7d0JBQ25FLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDYixPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELE1BQU0sQ0FBQyxLQUFLO3dCQUNYLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ3pCLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNuRSxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsNkJBQTZCLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7d0JBQ2xILE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDYixPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELFFBQVEsQ0FBQyxLQUFLO3dCQUNiLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM5RCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMxRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2IsT0FBTyxJQUFJLENBQUM7b0JBQ2IsQ0FBQztvQkFDRCxTQUFTLENBQUMsS0FBSzt3QkFDZCxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUU1QixJQUFJLGNBQWMsSUFBSSxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQzdDLHlGQUF5Rjs0QkFDekYsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDOzRCQUNuRyxJQUFJLGVBQWUsRUFBRSxDQUFDO2dDQUNyQixJQUFJLFVBQW9ELENBQUM7Z0NBQ3pELElBQUksZUFBZSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsQ0FBQztvQ0FDeEMsVUFBVSxHQUFHLGVBQWUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3Q0FDakQsSUFBSSxFQUFFLFdBQVc7d0NBQ2pCLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsU0FBMkIsRUFBRTtxQ0FDckQsQ0FBQyxDQUFDLENBQUM7Z0NBQ3JDLENBQUM7cUNBQU0sQ0FBQztvQ0FDUCwySEFBMkg7b0NBQzNILE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO29DQUMvRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO29DQUMzRCxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDcEIsQ0FBQztnQ0FFRCxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQ3BDLE9BQU8sSUFBSSxDQUFDOzRCQUNiLENBQUM7aUNBQU0sQ0FBQztnQ0FDUCw2REFBNkQ7NEJBQzlELENBQUM7d0JBQ0YsQ0FBQzs2QkFBTSxDQUFDOzRCQUNQLE1BQU0sSUFBSSxHQUFHLElBQUksWUFBWSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUMvRCxNQUFNLEdBQUcsR0FBRyxXQUFXLENBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUMzRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2QsQ0FBQzt3QkFFRCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELElBQUksQ0FBQyxJQUFJO3dCQUNSLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBRXZCLElBQUksSUFBSSxZQUFZLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDOzRCQUM1RCxnREFBZ0Q7NEJBQ2hELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM1QixDQUFDOzZCQUFNLENBQUM7NEJBQ1AsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOzRCQUNyRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2QsQ0FBQzt3QkFFRCxPQUFPLElBQUksQ0FBQztvQkFDYixDQUFDO29CQUNELE1BQU0sQ0FBQyxRQUFRO3dCQUNkLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7d0JBQ3pCLElBQUksYUFBYSxJQUFJLFFBQVEsSUFBSSxpQkFBaUIsSUFBSSxRQUFRLEVBQUUsQ0FBQzs0QkFDaEUsZ0RBQWdEOzRCQUNoRCxPQUFPO3dCQUNSLENBQUM7d0JBRUQsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO3dCQUMvRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ1osSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDOzRCQUM3RSxPQUFPO3dCQUNSLENBQUM7d0JBRUQsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNmLE9BQU8sSUFBSSxDQUFDO29CQUNiLENBQUM7aUJBQ0QsQ0FBQztZQUNILENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDeEIsQ0FBQztLQUNEO0lBRUQsTUFBYSxrQkFBa0I7aUJBRWYsWUFBTyxHQUFHLENBQUMsQUFBSixDQUFLO1FBTzNCLFlBQ0MsV0FBeUIsRUFDUixXQUF3QixFQUN4QixRQUF5QjtZQUR6QixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtZQUN4QixhQUFRLEdBQVIsUUFBUSxDQUFpQjtZQVIxQixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQTRCLENBQUM7WUFHOUMsd0JBQW1CLEdBQTJDLElBQUkseUJBQWEsRUFBRSxDQUFDO1lBT2xHLElBQUksQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyw4QkFBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDdkUsQ0FBQztRQUVELGVBQWUsQ0FBQyxTQUFnQyxFQUFFLEVBQVUsRUFBRSxPQUEwQztZQUN2RyxNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QyxNQUFNLEtBQUssR0FBRyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWhDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDNUUsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxzQkFBc0IsQ0FBQyxTQUFnQyxFQUFFLEVBQVUsRUFBRSxJQUFZLEVBQUUsV0FBbUIsRUFBRSxPQUEwQztZQUNqSixNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUM1QyxNQUFNLEtBQUssR0FBRyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEYsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRWhDLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztZQUN4RixPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDdkIsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBYyxFQUFFLE9BQTBCLEVBQUUsT0FBaUQsRUFBRSxLQUF3QjtZQUN6SSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLE1BQU0sMkRBQTJELENBQUMsQ0FBQztZQUM5RixDQUFDO1lBRUQsMkJBQTJCO1lBQzNCLElBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDekUsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3pCLGtCQUFrQixHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO2dCQUMzQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUNyRSxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztZQUNqSixJQUFJLENBQUM7Z0JBQ0osTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUNsRixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUN4QixXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUN4QyxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxFQUM3QixNQUFNLENBQUMsU0FBUyxFQUNoQixLQUFLLENBQ0wsQ0FBQztnQkFFRixPQUFPLE1BQU0sSUFBQSx3QkFBZ0IsRUFBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUNuRSxJQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQzt3QkFDdEIsSUFBSSxDQUFDOzRCQUNKLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNqQyxDQUFDO3dCQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7NEJBQ2QsTUFBTSxHQUFHLEdBQUcsMkRBQTJELEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs0QkFDckYsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxLQUFLLE9BQU8sS0FBSyxDQUFDLEVBQUUsS0FBSyxHQUFHLEVBQUUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBQ3ZHLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDcEUsQ0FBQztvQkFDRixDQUFDO29CQUNELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxDQUFDO2dCQUNwRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVaLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQzNDLE9BQU8sRUFBRSxZQUFZLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLDZCQUE2QixFQUFFLElBQUEsNkJBQWMsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLG9CQUFvQixFQUFFLElBQUksRUFBRSxFQUFFLENBQUM7WUFFL0ksQ0FBQztvQkFBUyxDQUFDO2dCQUNWLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztRQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxPQUFlLEVBQUUsT0FBaUQ7WUFFbkcsTUFBTSxHQUFHLEdBQXlELEVBQUUsQ0FBQztZQUVyRSxLQUFLLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDakMsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxRCxNQUFNLE1BQU0sR0FBc0IsT0FBTyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQ2hFLFFBQVEsQ0FBQyxDQUFDO29CQUNWLEVBQUUsR0FBRyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDO2dCQUV0QyxlQUFlO2dCQUNmLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLHlCQUF5QixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFFakwsZ0JBQWdCO2dCQUNoQixNQUFNLEtBQUssR0FBRyxJQUFBLGlCQUFRLEVBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEgsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNsRyxDQUFDO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDO1FBRUQsZUFBZSxDQUFDLFNBQWlCO1lBQ2hDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE9BQTBCLEVBQUUsTUFBYyxFQUFFLE1BQXdCLEVBQUUsT0FBaUQsRUFBRSxLQUF3QjtZQUN4SyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLENBQUM7WUFFRCxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFM0UsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEQsT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2lCQUNuRixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1gsK0VBQStFO2dCQUMvRSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLElBQUksbUJBQVEsQ0FBQyxJQUFJLENBQzlDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsV0FBVyxJQUFJLGdDQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hILElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDZCxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssQ0FBQyxFQUFFLG9EQUFvRCxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztnQkFDekcsQ0FBQztnQkFDRCxPQUFPLE9BQU8sQ0FBQztZQUNoQixDQUFDLENBQUM7aUJBQ0QsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELGVBQWUsQ0FBQyxNQUFjLEVBQUUsTUFBd0IsRUFBRSxJQUFxQyxFQUFFLFdBQXFCO1lBQ3JILE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hELElBQUksSUFBeUMsQ0FBQztZQUM5QyxRQUFRLElBQUksRUFBRSxDQUFDO2dCQUNkLEtBQUssNkNBQStCLENBQUMsSUFBSTtvQkFDeEMsSUFBSSxHQUFHLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUM7b0JBQ3JELE1BQU07Z0JBQ1AsS0FBSyw2Q0FBK0IsQ0FBQyxFQUFFO29CQUN0QyxJQUFJLEdBQUcsWUFBWSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQztvQkFDbkQsTUFBTTtZQUNSLENBQUM7WUFDRCxLQUFLLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQztRQUVELGFBQWEsQ0FBQyxNQUFjLEVBQUUsTUFBd0IsRUFBRSxLQUEyQjtZQUNsRixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTztZQUNSLENBQUM7WUFDRCxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO2dCQUNsQyw2QkFBNkI7Z0JBQzdCLE9BQU87WUFDUixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakcsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM3QyxDQUFDO1FBQ0YsQ0FBQztRQUVELEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxNQUFjLEVBQUUsS0FBYSxFQUFFLEtBQXdCO1lBQ3RGLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDakUsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsS0FBSyxDQUFDLHNCQUFzQixDQUFDLE1BQWMsRUFBRSxLQUF3QjtZQUNwRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ1osT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLE1BQU0sS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCxLQUFLLENBQUMsdUJBQXVCLENBQUMsTUFBYyxFQUFFLEtBQXdCO1lBQ3JFLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixPQUFPO1lBQ1IsQ0FBQztZQUVELE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDaEQsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekQsQ0FBQzs7SUFoTUYsZ0RBaU1DO0lBRUQsTUFBTSxnQkFBZ0I7UUFrQnJCLFlBQ2lCLFNBQWdDLEVBQ2hDLEVBQVUsRUFDVCxNQUFrQyxFQUNsQyxPQUFlLEVBQ3hCLGVBQWtEO1lBSjFDLGNBQVMsR0FBVCxTQUFTLENBQXVCO1lBQ2hDLE9BQUUsR0FBRixFQUFFLENBQVE7WUFDVCxXQUFNLEdBQU4sTUFBTSxDQUE0QjtZQUNsQyxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQ3hCLG9CQUFlLEdBQWYsZUFBZSxDQUFtQztZQVpuRCwwQkFBcUIsR0FBRyxJQUFJLGVBQU8sRUFBNkIsQ0FBQztZQUNqRSx3QkFBbUIsR0FBRyxJQUFJLGVBQU8sRUFBOEIsQ0FBQztRQVlwRSxDQUFDO1FBRUwsY0FBYyxDQUFDLFFBQW1DO1lBQ2pELElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELFlBQVksQ0FBQyxLQUFpQztZQUM3QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCxLQUFLLENBQUMsd0JBQXdCLENBQUMsS0FBYSxFQUFFLEtBQXdCO1lBQ3JFLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsT0FBTyxNQUFNLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5RixDQUFDO1FBRUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLE1BQXlCLEVBQUUsT0FBMkIsRUFBRSxLQUF3QjtZQUN0RyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzdCLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEYsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNoQixPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxPQUFPLFNBQVM7Z0JBQ2Ysc0RBQXNEO2lCQUNyRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLFdBQVcsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDdEMsaUZBQWlGO2lCQUNoRixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLENBQUM7UUFFRCxLQUFLLENBQUMscUJBQXFCLENBQUMsS0FBd0I7WUFDbkQsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO2dCQUNuQyxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QixJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO29CQUM5QixPQUFPLElBQUksQ0FBQztnQkFDYixDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxLQUF3QjtZQUNwRCxJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixJQUFJLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzNGLE9BQU8sRUFBRSxDQUFDO1lBQ1gsQ0FBQztZQUNELE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLEVBQUUsQ0FBQztZQUNYLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQsSUFBSSxRQUFRO1lBQ1gsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQztZQUM1QixNQUFNLGtCQUFrQixHQUFHLEdBQUcsRUFBRTtnQkFDL0IsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDZCxPQUFPO2dCQUNSLENBQUM7Z0JBQ0QsSUFBSSxlQUFlLEVBQUUsQ0FBQztvQkFDckIsT0FBTztnQkFDUixDQUFDO2dCQUNELGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQ3ZCLGNBQWMsQ0FBQyxHQUFHLEVBQUU7b0JBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7d0JBQ3RDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUzt3QkFDeEIsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7NEJBQ2xDLElBQUksQ0FBQyxTQUFTLFlBQVksU0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0NBQy9DLE9BQU8sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO29DQUNqRCxTQUFTO3dCQUNaLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzRCQUN0QyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQ0FDL0MsU0FBUzt3QkFDWCxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsWUFBWSxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTO3dCQUN4RixZQUFZLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixLQUFLLFNBQVM7d0JBQ2xELFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWTt3QkFDOUIsY0FBYyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sSUFBSSxDQUFDLGVBQWUsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQzt3QkFDbEssdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsSUFBSSxPQUFPLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUM7d0JBQy9NLGVBQWUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixJQUFJLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQzt3QkFDdkssYUFBYSxFQUFFLElBQUksQ0FBQyxjQUFjO3dCQUNsQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsc0JBQXNCO3dCQUNsRCxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVU7cUJBQzFCLENBQUMsQ0FBQztvQkFDSCxlQUFlLEdBQUcsS0FBSyxDQUFDO2dCQUN6QixDQUFDLENBQUMsQ0FBQztZQUNKLENBQUMsQ0FBQztZQUVGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztZQUNsQixPQUFPO2dCQUNOLElBQUksRUFBRTtvQkFDTCxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLENBQUM7Z0JBQ0QsSUFBSSxRQUFRO29CQUNYLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUNsRSxPQUFPLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7Z0JBQzVFLENBQUM7Z0JBQ0QsSUFBSSxRQUFRLENBQUMsQ0FBQztvQkFDYixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7b0JBQ25CLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxRQUFRO29CQUNYLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDdkIsQ0FBQztnQkFDRCxJQUFJLFFBQVEsQ0FBQyxDQUFDO29CQUNiLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO29CQUNuQixrQkFBa0IsRUFBRSxDQUFDO2dCQUN0QixDQUFDO2dCQUNELElBQUksY0FBYztvQkFDakIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO2dCQUM3QixDQUFDO2dCQUNELElBQUksY0FBYyxDQUFDLENBQUM7b0JBQ25CLElBQUEsa0JBQVUsRUFBQyxPQUFPLENBQUMsS0FBSyxVQUFVLEVBQUUseUJBQXlCLENBQUMsQ0FBQztvQkFDL0QsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLENBQUM7Z0JBQ0QsSUFBSSxnQkFBZ0I7b0JBQ25CLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO2dCQUMvQixDQUFDO2dCQUNELElBQUksZ0JBQWdCLENBQUMsQ0FBQztvQkFDckIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztvQkFDM0Isa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxJQUFJLFNBQVM7b0JBQ1osSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7b0JBQ2xFLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDeEIsQ0FBQztnQkFDRCxJQUFJLFNBQVMsQ0FBQyxDQUFDO29CQUNkLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUNsRSxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztvQkFDcEIsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxJQUFJLGNBQWM7b0JBQ2pCLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUNsRSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7Z0JBQzdCLENBQUM7Z0JBQ0QsSUFBSSxjQUFjLENBQUMsQ0FBQztvQkFDbkIsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7b0JBQ2xFLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO29CQUN6QixrQkFBa0IsRUFBRSxDQUFDO2dCQUN0QixDQUFDO2dCQUNELElBQUksdUJBQXVCO29CQUMxQixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztvQkFDbEUsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUM7Z0JBQ3RDLENBQUM7Z0JBQ0QsSUFBSSx1QkFBdUIsQ0FBQyxDQUFDO29CQUM1QixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLHdCQUF3QixHQUFHLENBQUMsQ0FBQztvQkFDbEMsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxJQUFJLGVBQWU7b0JBQ2xCLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUNsRSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDOUIsQ0FBQztnQkFDRCxJQUFJLGVBQWUsQ0FBQyxDQUFDO29CQUNwQixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztvQkFDMUIsa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEIsQ0FBQztnQkFDRCxJQUFJLFdBQVc7b0JBQ2QsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7b0JBQ2xFLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDMUIsQ0FBQztnQkFDRCxJQUFJLFdBQVcsQ0FBQyxDQUFDO29CQUNoQixJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztvQkFDbEUsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7b0JBQ3RCLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxhQUFhO29CQUNoQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7Z0JBQzVCLENBQUM7Z0JBQ0QsSUFBSSxhQUFhLENBQUMsQ0FBQztvQkFDbEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7b0JBQ3hCLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxxQkFBcUI7b0JBQ3hCLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO29CQUNwRSxPQUFPLElBQUksQ0FBQyxzQkFBc0IsQ0FBQztnQkFDcEMsQ0FBQztnQkFDRCxJQUFJLHFCQUFxQixDQUFDLENBQUM7b0JBQzFCLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO29CQUNwRSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO29CQUNoQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUN0QixDQUFDO2dCQUNELElBQUksb0JBQW9CO29CQUN2QixPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7Z0JBQ3pDLENBQUM7Z0JBQ0QsSUFBSSwyQkFBMkIsQ0FBQyxDQUFDO29CQUNoQyxJQUFBLG9DQUF1QixFQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztvQkFDcEUsSUFBSSxDQUFDLHNCQUFzQixHQUFHLENBQUMsQ0FBQztvQkFDaEMsSUFBSSxDQUFDLEVBQUUsQ0FBQzt3QkFDUCxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDOzRCQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7d0JBQ25ELENBQUM7d0JBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO29CQUNsRixDQUFDO3lCQUFNLENBQUM7d0JBQ1AsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQy9ELENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxJQUFJLDJCQUEyQjtvQkFDOUIsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDBCQUEwQixDQUFDLENBQUM7b0JBQ3BFLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDO2dCQUNwQyxDQUFDO2dCQUNELElBQUksc0JBQXNCLENBQUMsQ0FBQztvQkFDM0IsSUFBQSxvQ0FBdUIsRUFBQyxJQUFJLENBQUMsU0FBUyxFQUFFLHdCQUF3QixDQUFDLENBQUM7b0JBQ2xFLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUM7b0JBQ2pDLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsSUFBSSxzQkFBc0I7b0JBQ3pCLElBQUEsb0NBQXVCLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO29CQUNsRSxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztnQkFDckMsQ0FBQztnQkFDRCxrQkFBa0IsRUFBRSxDQUFDLElBQUEsaUNBQW9CLEVBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSwwQkFBMEIsQ0FBQztvQkFDcEYsQ0FBQyxDQUFDLFNBQVU7b0JBQ1osQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLO2dCQUVqQyxJQUFJLFNBQVMsQ0FBQyxDQUFDO29CQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO29CQUNwQixrQkFBa0IsRUFBRSxDQUFDO2dCQUN0QixDQUFDO2dCQUNELElBQUksU0FBUztvQkFDWixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ3hCLENBQUM7Z0JBQ0QsT0FBTztvQkFDTixRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNoQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDO29CQUNuQyxJQUFJLENBQUMscUJBQXFCLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QyxDQUFDO2FBQ2dDLENBQUM7UUFDcEMsQ0FBQztRQUVELE1BQU0sQ0FBQyxPQUEyQixFQUFFLE9BQTJCLEVBQUUsUUFBMkMsRUFBRSxLQUF3QjtZQUNySSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEUsQ0FBQztLQUNEIn0=