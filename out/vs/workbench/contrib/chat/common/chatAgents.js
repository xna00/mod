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
define(["require", "exports", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, iterator_1, lifecycle_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MergedChatAgent = exports.ChatAgentService = exports.IChatAgentService = exports.ChatAgentLocation = void 0;
    var ChatAgentLocation;
    (function (ChatAgentLocation) {
        ChatAgentLocation["Panel"] = "panel";
        ChatAgentLocation["Terminal"] = "terminal";
        ChatAgentLocation["Notebook"] = "notebook";
        ChatAgentLocation["Editor"] = "editor";
    })(ChatAgentLocation || (exports.ChatAgentLocation = ChatAgentLocation = {}));
    (function (ChatAgentLocation) {
        function fromRaw(value) {
            switch (value) {
                case 'panel': return ChatAgentLocation.Panel;
                case 'terminal': return ChatAgentLocation.Terminal;
                case 'notebook': return ChatAgentLocation.Notebook;
            }
            return ChatAgentLocation.Panel;
        }
        ChatAgentLocation.fromRaw = fromRaw;
    })(ChatAgentLocation || (exports.ChatAgentLocation = ChatAgentLocation = {}));
    exports.IChatAgentService = (0, instantiation_1.createDecorator)('chatAgentService');
    let ChatAgentService = class ChatAgentService {
        static { this.AGENT_LEADER = '@'; }
        constructor(contextKeyService) {
            this.contextKeyService = contextKeyService;
            this._agents = [];
            this._onDidChangeAgents = new event_1.Emitter();
            this.onDidChangeAgents = this._onDidChangeAgents.event;
        }
        registerAgent(id, data) {
            const existingAgent = this.getAgent(id);
            if (existingAgent) {
                throw new Error(`Agent already registered: ${JSON.stringify(id)}`);
            }
            const that = this;
            const commands = data.slashCommands;
            data = {
                ...data,
                get slashCommands() {
                    return commands.filter(c => !c.when || that.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(c.when)));
                }
            };
            const entry = { data };
            this._agents.push(entry);
            return (0, lifecycle_1.toDisposable)(() => {
                this._agents = this._agents.filter(a => a !== entry);
                this._onDidChangeAgents.fire(undefined);
            });
        }
        registerAgentImplementation(id, agentImpl) {
            const entry = this._getAgentEntry(id);
            if (!entry) {
                throw new Error(`Unknown agent: ${JSON.stringify(id)}`);
            }
            if (entry.impl) {
                throw new Error(`Agent already has implementation: ${JSON.stringify(id)}`);
            }
            entry.impl = agentImpl;
            this._onDidChangeAgents.fire(new MergedChatAgent(entry.data, agentImpl));
            return (0, lifecycle_1.toDisposable)(() => {
                entry.impl = undefined;
                this._onDidChangeAgents.fire(undefined);
            });
        }
        registerDynamicAgent(data, agentImpl) {
            const agent = { data, impl: agentImpl };
            this._agents.push(agent);
            this._onDidChangeAgents.fire(new MergedChatAgent(data, agentImpl));
            return (0, lifecycle_1.toDisposable)(() => {
                this._agents = this._agents.filter(a => a !== agent);
                this._onDidChangeAgents.fire(undefined);
            });
        }
        updateAgent(id, updateMetadata) {
            const agent = this._getAgentEntry(id);
            if (!agent?.impl) {
                throw new Error(`No activated agent with id ${JSON.stringify(id)} registered`);
            }
            agent.data.metadata = { ...agent.data.metadata, ...updateMetadata };
            this._onDidChangeAgents.fire(new MergedChatAgent(agent.data, agent.impl));
        }
        getDefaultAgent(location) {
            return this.getActivatedAgents().find(a => !!a.isDefault && a.locations.includes(location));
        }
        getSecondaryAgent() {
            // TODO also static
            return iterator_1.Iterable.find(this._agents.values(), a => !!a.data.metadata.isSecondary)?.data;
        }
        _getAgentEntry(id) {
            return this._agents.find(a => a.data.id === id);
        }
        getAgent(id) {
            return this._getAgentEntry(id)?.data;
        }
        /**
         * Returns all agent datas that exist- static registered and dynamic ones.
         */
        getAgents() {
            return this._agents.map(entry => entry.data);
        }
        getActivatedAgents() {
            return Array.from(this._agents.values())
                .filter(a => !!a.impl)
                .map(a => new MergedChatAgent(a.data, a.impl));
        }
        getAgentsByName(name) {
            return this.getAgents().filter(a => a.name === name);
        }
        async invokeAgent(id, request, progress, history, token) {
            const data = this._getAgentEntry(id);
            if (!data?.impl) {
                throw new Error(`No activated agent with id ${id}`);
            }
            return await data.impl.invoke(request, progress, history, token);
        }
        async getFollowups(id, request, result, history, token) {
            const data = this._getAgentEntry(id);
            if (!data?.impl) {
                throw new Error(`No activated agent with id ${id}`);
            }
            if (!data.impl?.provideFollowups) {
                return [];
            }
            return data.impl.provideFollowups(request, result, history, token);
        }
    };
    exports.ChatAgentService = ChatAgentService;
    exports.ChatAgentService = ChatAgentService = __decorate([
        __param(0, contextkey_1.IContextKeyService)
    ], ChatAgentService);
    class MergedChatAgent {
        constructor(data, impl) {
            this.data = data;
            this.impl = impl;
        }
        get id() { return this.data.id; }
        get name() { return this.data.name ?? ''; }
        get description() { return this.data.description ?? ''; }
        get extensionId() { return this.data.extensionId; }
        get isDefault() { return this.data.isDefault; }
        get metadata() { return this.data.metadata; }
        get slashCommands() { return this.data.slashCommands; }
        get defaultImplicitVariables() { return this.data.defaultImplicitVariables; }
        get locations() { return this.data.locations; }
        async invoke(request, progress, history, token) {
            return this.impl.invoke(request, progress, history, token);
        }
        async provideFollowups(request, result, history, token) {
            if (this.impl.provideFollowups) {
                return this.impl.provideFollowups(request, result, history, token);
            }
            return [];
        }
        provideWelcomeMessage(token) {
            if (this.impl.provideWelcomeMessage) {
                return this.impl.provideWelcomeMessage(token);
            }
            return undefined;
        }
        provideSampleQuestions(token) {
            if (this.impl.provideSampleQuestions) {
                return this.impl.provideSampleQuestions(token);
            }
            return undefined;
        }
    }
    exports.MergedChatAgent = MergedChatAgent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdEFnZW50cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9jb21tb24vY2hhdEFnZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF5QmhHLElBQVksaUJBS1g7SUFMRCxXQUFZLGlCQUFpQjtRQUM1QixvQ0FBZSxDQUFBO1FBQ2YsMENBQXFCLENBQUE7UUFDckIsMENBQXFCLENBQUE7UUFDckIsc0NBQWlCLENBQUE7SUFDbEIsQ0FBQyxFQUxXLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBSzVCO0lBRUQsV0FBaUIsaUJBQWlCO1FBQ2pDLFNBQWdCLE9BQU8sQ0FBQyxLQUEwQztZQUNqRSxRQUFRLEtBQUssRUFBRSxDQUFDO2dCQUNmLEtBQUssT0FBTyxDQUFDLENBQUMsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLENBQUM7Z0JBQzdDLEtBQUssVUFBVSxDQUFDLENBQUMsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7Z0JBQ25ELEtBQUssVUFBVSxDQUFDLENBQUMsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7WUFDcEQsQ0FBQztZQUNELE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDO1FBQ2hDLENBQUM7UUFQZSx5QkFBTyxVQU90QixDQUFBO0lBQ0YsQ0FBQyxFQVRnQixpQkFBaUIsaUNBQWpCLGlCQUFpQixRQVNqQztJQTBFWSxRQUFBLGlCQUFpQixHQUFHLElBQUEsK0JBQWUsRUFBb0Isa0JBQWtCLENBQUMsQ0FBQztJQTJCakYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7aUJBRUwsaUJBQVksR0FBRyxHQUFHLEFBQU4sQ0FBTztRQVMxQyxZQUNxQixpQkFBc0Q7WUFBckMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQU5uRSxZQUFPLEdBQXNCLEVBQUUsQ0FBQztZQUV2Qix1QkFBa0IsR0FBRyxJQUFJLGVBQU8sRUFBMEIsQ0FBQztZQUNuRSxzQkFBaUIsR0FBa0MsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztRQUl0RixDQUFDO1FBRUwsYUFBYSxDQUFDLEVBQVUsRUFBRSxJQUFvQjtZQUM3QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLElBQUksYUFBYSxFQUFFLENBQUM7Z0JBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUM7WUFDbEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUNwQyxJQUFJLEdBQUc7Z0JBQ04sR0FBRyxJQUFJO2dCQUNQLElBQUksYUFBYTtvQkFDaEIsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsQ0FBQywyQkFBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4SCxDQUFDO2FBQ0QsQ0FBQztZQUNGLE1BQU0sS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELDJCQUEyQixDQUFDLEVBQVUsRUFBRSxTQUFtQztZQUMxRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDWixNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLENBQUM7WUFFRCxLQUFLLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQztZQUN2QixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUV6RSxPQUFPLElBQUEsd0JBQVksRUFBQyxHQUFHLEVBQUU7Z0JBQ3hCLEtBQUssQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDO2dCQUN2QixJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELG9CQUFvQixDQUFDLElBQW9CLEVBQUUsU0FBbUM7WUFDN0UsTUFBTSxLQUFLLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFFbkUsT0FBTyxJQUFBLHdCQUFZLEVBQUMsR0FBRyxFQUFFO2dCQUN4QixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3pDLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELFdBQVcsQ0FBQyxFQUFVLEVBQUUsY0FBa0M7WUFDekQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNoRixDQUFDO1lBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7WUFDcEUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzNFLENBQUM7UUFFRCxlQUFlLENBQUMsUUFBMkI7WUFDMUMsT0FBTyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFFRCxpQkFBaUI7WUFDaEIsbUJBQW1CO1lBQ25CLE9BQU8sbUJBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxJQUFJLENBQUM7UUFDdkYsQ0FBQztRQUVPLGNBQWMsQ0FBQyxFQUFVO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsUUFBUSxDQUFDLEVBQVU7WUFDbEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztRQUN0QyxDQUFDO1FBRUQ7O1dBRUc7UUFDSCxTQUFTO1lBQ1IsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsa0JBQWtCO1lBQ2pCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO2lCQUN0QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztpQkFDckIsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDO1FBRUQsZUFBZSxDQUFDLElBQVk7WUFDM0IsT0FBTyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFVLEVBQUUsT0FBMEIsRUFBRSxRQUF1QyxFQUFFLE9BQWlDLEVBQUUsS0FBd0I7WUFDN0osTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO2dCQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3JELENBQUM7WUFFRCxPQUFPLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEUsQ0FBQztRQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBVSxFQUFFLE9BQTBCLEVBQUUsTUFBd0IsRUFBRSxPQUFpQyxFQUFFLEtBQXdCO1lBQy9JLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztnQkFDakIsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbEMsT0FBTyxFQUFFLENBQUM7WUFDWCxDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BFLENBQUM7O0lBbElXLDRDQUFnQjsrQkFBaEIsZ0JBQWdCO1FBWTFCLFdBQUEsK0JBQWtCLENBQUE7T0FaUixnQkFBZ0IsQ0FtSTVCO0lBRUQsTUFBYSxlQUFlO1FBQzNCLFlBQ2tCLElBQW9CLEVBQ3BCLElBQThCO1lBRDlCLFNBQUksR0FBSixJQUFJLENBQWdCO1lBQ3BCLFNBQUksR0FBSixJQUFJLENBQTBCO1FBQzVDLENBQUM7UUFFTCxJQUFJLEVBQUUsS0FBYSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN6QyxJQUFJLElBQUksS0FBYSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxXQUFXLEtBQWEsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksV0FBVyxLQUEwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN4RSxJQUFJLFNBQVMsS0FBMEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsSUFBSSxRQUFRLEtBQXlCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksYUFBYSxLQUEwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUM1RSxJQUFJLHdCQUF3QixLQUEyQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQ25HLElBQUksU0FBUyxLQUEwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUVwRSxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQTBCLEVBQUUsUUFBdUMsRUFBRSxPQUFpQyxFQUFFLEtBQXdCO1lBQzVJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUQsQ0FBQztRQUVELEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxPQUEwQixFQUFFLE1BQXdCLEVBQUUsT0FBaUMsRUFBRSxLQUF3QjtZQUN2SSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3BFLENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFFRCxxQkFBcUIsQ0FBQyxLQUF3QjtZQUM3QyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztnQkFDckMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9DLENBQUM7WUFFRCxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsc0JBQXNCLENBQUMsS0FBd0I7WUFDOUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQ3RDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoRCxDQUFDO1lBRUQsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBM0NELDBDQTJDQyJ9