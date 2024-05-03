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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/chat/browser/chat", "vs/workbench/contrib/chat/common/chatContributionService", "vs/workbench/contrib/chat/common/chatService", "vs/workbench/services/extensions/common/extHostCustomers"], function (require, exports, event_1, lifecycle_1, uri_1, extHost_protocol_1, chat_1, chatContributionService_1, chatService_1, extHostCustomers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadChat = void 0;
    let MainThreadChat = class MainThreadChat extends lifecycle_1.Disposable {
        constructor(extHostContext, _chatService, _chatWidgetService, chatContribService) {
            super();
            this._chatService = _chatService;
            this._chatWidgetService = _chatWidgetService;
            this.chatContribService = chatContribService;
            this._providerRegistrations = this._register(new lifecycle_1.DisposableMap());
            this._stateEmitters = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostChat);
        }
        $transferChatSession(sessionId, toWorkspace) {
            const sessionIdStr = this._chatService.getSessionId(sessionId);
            if (!sessionIdStr) {
                throw new Error(`Failed to transfer session. Unknown session provider ID: ${sessionId}`);
            }
            const widget = this._chatWidgetService.getWidgetBySessionId(sessionIdStr);
            const inputValue = widget?.inputEditor.getValue() ?? '';
            this._chatService.transferChatSession({ sessionId: sessionIdStr, inputValue: inputValue }, uri_1.URI.revive(toWorkspace));
        }
        async $registerChatProvider(handle, id) {
            const registration = this.chatContribService.registeredProviders.find(staticProvider => staticProvider.id === id);
            if (!registration) {
                throw new Error(`Provider ${id} must be declared in the package.json.`);
            }
            const unreg = this._chatService.registerProvider({
                id,
                prepareSession: async (token) => {
                    const session = await this._proxy.$prepareChat(handle, token);
                    if (!session) {
                        return undefined;
                    }
                    const emitter = new event_1.Emitter();
                    this._stateEmitters.set(session.id, emitter);
                    return {
                        id: session.id,
                        dispose: () => {
                            emitter.dispose();
                            this._stateEmitters.delete(session.id);
                            this._proxy.$releaseSession(session.id);
                        }
                    };
                },
            });
            this._providerRegistrations.set(handle, unreg);
        }
        async $acceptChatState(sessionId, state) {
            this._stateEmitters.get(sessionId)?.fire(state);
        }
        async $unregisterChatProvider(handle) {
            this._providerRegistrations.deleteAndDispose(handle);
        }
    };
    exports.MainThreadChat = MainThreadChat;
    exports.MainThreadChat = MainThreadChat = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadChat),
        __param(1, chatService_1.IChatService),
        __param(2, chat_1.IChatWidgetService),
        __param(3, chatContributionService_1.IChatContributionService)
    ], MainThreadChat);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpblRocmVhZENoYXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvYnJvd3Nlci9tYWluVGhyZWFkQ2hhdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFZekYsSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFVO1FBTzdDLFlBQ0MsY0FBK0IsRUFDakIsWUFBMkMsRUFDckMsa0JBQXVELEVBQ2pELGtCQUE2RDtZQUV2RixLQUFLLEVBQUUsQ0FBQztZQUp1QixpQkFBWSxHQUFaLFlBQVksQ0FBYztZQUNwQix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ2hDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBMEI7WUFUdkUsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLHlCQUFhLEVBQVUsQ0FBQyxDQUFDO1lBQ3JFLG1CQUFjLEdBQUcsSUFBSSxHQUFHLEVBQXdCLENBQUM7WUFXakUsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLGlDQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELG9CQUFvQixDQUFDLFNBQWlCLEVBQUUsV0FBMEI7WUFDakUsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDL0QsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLDREQUE0RCxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQzFGLENBQUM7WUFFRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDMUUsTUFBTSxVQUFVLEdBQUcs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