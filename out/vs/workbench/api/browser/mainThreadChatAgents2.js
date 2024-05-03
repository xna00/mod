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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/core/wordHelper", "vs/editor/common/services/languageFeatures", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/browser/chatInputPart", "vs/workbench/contrib/chat/browser/contrib/chatDynamicVariables", "vs/workbench/contrib/chat/common/chatAgents", "vs/workbench/contrib/chat/common/chatParserTypes", "vs/workbench/contrib/chat/common/chatRequestParser", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, lifecycle_1, marshalling_1, strings_1, range_1, wordHelper_1, languageFeatures_1, instantiation_1, extHost_protocol_1, chat_1, chatInputPart_1, chatDynamicVariables_1, chatAgents_1, chatParserTypes_1, chatRequestParser_1, chatService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadChatAgents2 = void 0;
    let MainThreadChatAgents2 = class MainThreadChatAgents2 extends lifecycle_1.Disposable {
        constructor(extHostContext, _chatAgentService, _chatService, _languageFeaturesService, _chatWidgetService, _instantiationService) {
            super();
            this._chatAgentService = _chatAgentService;
            this._chatService = _chatService;
            this._languageFeaturesService = _languageFeaturesService;
            this._chatWidgetService = _chatWidgetService;
            this._instantiationService = _instantiationService;
            this._agents = this._register(new lifecycle_1.DisposableMap());
            this._agentCompletionProviders = this._register(new lifecycle_1.DisposableMap());
            this._pendingProgress = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChatAgents2);
            this._register(this._chatService.onDidDisposeSession(e => {
                this._proxy.$releaseSession(e.sessionId);
            }));
            this._register(this._chatService.onDidPerformUserAction(e => {
                if (typeof e.agentId === 'string') {
                    for (const [handle, agent] of this._agents) {
                        if (agent.id === e.agentId) {
                            if (e.action.kind === 'vote') {
                                this._proxy.$acceptFeedback(handle, e.result ?? {}, e.action.direction);
                            }
                            else {
                                this._proxy.$acceptAction(handle, e.result || {}, e);
                            }
                            break;
                        }
                    }
                }
            }));
        }
        $unregisterAgent(handle) {
            this._agents.deleteAndDispose(handle);
        }
        $registerAgent(handle, extension, id, metadata, dynamicProps) {
            const staticAgentRegistration = this._chatAgentService.getAgent(id);
            if (!staticAgentRegistration && !dynamicProps) {
                if (this._chatAgentService.getAgentsByName(id).length) {
                    // Likely some extension authors will not adopt the new ID, so give a hint if they register a
                    // participant by name instead of ID.
                    throw new Error(`chatParticipant must be declared with an ID in package.json. The "id" property may be missing! "${id}"`);
                }
                throw new Error(`chatParticipant must be declared in package.json: ${id}`);
            }
            const impl = {
                invoke: async (request, progress, history, token) => {
                    this._pendingProgress.set(request.requestId, progress);
                    try {
                        return await this._proxy.$invokeAgent(handle, request, { history }, token) ?? {};
                    }
                    finally {
                        this._pendingProgress.delete(request.requestId);
                    }
                },
                provideFollowups: async (request, result, history, token) => {
                    if (!this._agents.get(handle)?.hasFollowups) {
                        return [];
                    }
                    return this._proxy.$provideFollowups(request, handle, result, { history }, token);
                },
                provideWelcomeMessage: (token) => {
                    return this._proxy.$provideWelcomeMessage(handle, token);
                },
                provideSampleQuestions: (token) => {
                    return this._proxy.$provideSampleQuestions(handle, token);
                }
            };
            let disposable;
            if (!staticAgentRegistration && dynamicProps) {
                disposable = this._chatAgentService.registerDynamicAgent({
                    id,
                    name: dynamicProps.name,
                    description: dynamicProps.description,
                    extensionId: extension,
                    metadata: (0, marshalling_1.revive)(metadata),
                    slashCommands: [],
                    locations: [chatAgents_1.ChatAgentLocation.Panel] // TODO all dynamic participants are panel only?
                }, impl);
            }
            else {
                disposable = this._chatAgentService.registerAgentImplementation(id, impl);
            }
            this._agents.set(handle, {
                id: id,
                extensionId: extension,
                dispose: disposable.dispose,
                hasFollowups: metadata.hasFollowups
            });
        }
        $updateAgent(handle, metadataUpdate) {
            const data = this._agents.get(handle);
            if (!data) {
                throw new Error(`No agent with handle ${handle} registered`);
            }
            data.hasFollowups = metadataUpdate.hasFollowups;
            this._chatAgentService.updateAgent(data.id, (0, marshalling_1.revive)(metadataUpdate));
        }
        async $handleProgressChunk(requestId, progress) {
            const revivedProgress = (0, marshalling_1.revive)(progress);
            this._pendingProgress.get(requestId)?.(revivedProgress);
        }
        $registerAgentCompletionsProvider(handle, triggerCharacters) {
            this._agentCompletionProviders.set(handle, this._languageFeaturesService.completionProvider.register({ scheme: chatInputPart_1.ChatInputPart.INPUT_SCHEME, hasAccessToAllModels: true }, {
                _debugDisplayName: 'chatAgentCompletions:' + handle,
                triggerCharacters,
                provideCompletionItems: async (model, position, _context, token) => {
                    const widget = this._chatWidgetService.getWidgetByInputUri(model.uri);
                    if (!widget || !widget.viewModel) {
                        return;
                    }
                    const triggerCharsPart = triggerCharacters.map(c => (0, strings_1.escapeRegExpCharacters)(c)).join('');
                    const wordRegex = new RegExp(`[${triggerCharsPart}]\\S*`, 'g');
                    const query = (0, wordHelper_1.getWordAtText)(position.column, wordRegex, model.getLineContent(position.lineNumber), 0)?.word ?? '';
                    if (query && !triggerCharacters.some(c => query.startsWith(c))) {
                        return;
                    }
                    const parsedRequest = this._instantiationService.createInstance(chatRequestParser_1.ChatRequestParser).parseChatRequest(widget.viewModel.sessionId, model.getValue()).parts;
                    const agentPart = parsedRequest.find((part) => part instanceof chatParserTypes_1.ChatRequestAgentPart);
                    const thisAgentId = this._agents.get(handle)?.id;
                    if (agentPart?.agent.id !== thisAgentId) {
                        return;
                    }
                    const range = computeCompletionRanges(model, position, wordRegex);
                    if (!range) {
                        return null;
                    }
                    const result = await this._proxy.$invokeCompletionProvider(handle, query, token);
                    const variableItems = result.map(v => {
                        const insertText = v.insertText ?? (typeof v.label === 'string' ? v.label : v.label.label);
                        const rangeAfterInsert = new range_1.Range(range.insert.startLineNumber, range.insert.startColumn, range.insert.endLineNumber, range.insert.startColumn + insertText.length);
                        return {
                            label: v.label,
                            range,
                            insertText: insertText + ' ',
                            kind: 18 /* CompletionItemKind.Text */,
                            detail: v.detail,
                            documentation: v.documentation,
                            command: { id: chatDynamicVariables_1.AddDynamicVariableAction.ID, title: '', arguments: [{ widget, range: rangeAfterInsert, variableData: (0, marshalling_1.revive)(v.values) }] }
                        };
                    });
                    return {
                        suggestions: variableItems
                    };
                }
            }));
        }
        $unregisterAgentCompletionsProvider(handle) {
            this._agentCompletionProviders.deleteAndDispose(handle);
        }
    };
    exports.MainThreadChatAgents2 = MainThreadChatAgents2;
    exports.MainThreadChatAgents2 = MainThreadChatAgents2 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadChatAgents2),
        __param(1, chatAgents_1.IChatAgentService),
        __param(2, chatService_1.IChatService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, chat_1.IChatWidgetService),
        __param(5, instantiation_1.IInstantiationService)
    ], MainThreadChatAgents2);
    function computeCompletionRanges(model, position, reg) {
        const varWord = (0, wordHelper_1.getWordAtText)(position.column, reg, model.getLineContent(position.lineNumber), 0);
        if (!varWord && model.getWordUntilPosition(position).word) {
            // inside a "normal" word
            return;
        }
        let insert;
        let replace;
        if (!varWord) {
            insert = replace = range_1.Range.fromPositions(position);
        }
        else {
            insert = new range_1.Range(position.lineNumber, varWord.startColumn, position.lineNumber, position.column);
            replace = new range_1.Range(position.lineNumber, varWord.startColumn, position.lineNumber, varWord.endColumn);
        }
        return { insert, replace };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENoYXRBZ2VudHMyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYXBpL2Jyb3dzZXIvbWFpblRocmVhZENoYXRBZ2VudHMyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQWdDekYsSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBVTtRQVFwRCxZQUNDLGNBQStCLEVBQ1osaUJBQXFELEVBQzFELFlBQTJDLEVBQy9CLHdCQUFtRSxFQUN6RSxrQkFBdUQsRUFDcEQscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBTjRCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBbUI7WUFDekMsaUJBQVksR0FBWixZQUFZLENBQWM7WUFDZCw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1lBQ3hELHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQVpwRSxZQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQXFCLENBQUMsQ0FBQztZQUNqRSw4QkFBeUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUJBQWEsRUFBdUIsQ0FBQyxDQUFDO1lBRXJGLHFCQUFnQixHQUFHLElBQUksR0FBRyxFQUF5QyxDQUFDO1lBWXBGLElBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQyxpQ0FBYyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFFekUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFO2dCQUN4RCxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsU0FB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