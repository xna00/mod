/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/workbench/api/common/extHost.protocol"], function (require, exports, iterator_1, lifecycle_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostChat = void 0;
    class ChatProviderWrapper {
        static { this._pool = 0; }
        constructor(extension, provider) {
            this.extension = extension;
            this.provider = provider;
            this.handle = ChatProviderWrapper._pool++;
        }
    }
    class ExtHostChat {
        static { this._nextId = 0; }
        constructor(mainContext) {
            this._chatProvider = new Map();
            this._chatSessions = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadChat);
        }
        //#region interactive session
        registerChatProvider(extension, id, provider) {
            const wrapper = new ChatProviderWrapper(extension, provider);
            this._chatProvider.set(wrapper.handle, wrapper);
            this._proxy.$registerChatProvider(wrapper.handle, id);
            return (0, lifecycle_1.toDisposable)(() => {
                this._proxy.$unregisterChatProvider(wrapper.handle);
                this._chatProvider.delete(wrapper.handle);
            });
        }
        transferChatSession(session, newWorkspace) {
            const sessionId = iterator_1.Iterable.find(this._chatSessions.keys(), key => this._chatSessions.get(key) === session) ?? 0;
            if (typeof sessionId !== 'number') {
                return;
            }
            this._proxy.$transferChatSession(sessionId, newWorkspace);
        }
        async $prepareChat(handle, token) {
            const entry = this._chatProvider.get(handle);
            if (!entry) {
                return undefined;
            }
            const session = await entry.provider.prepareSession(token);
            if (!session) {
                return undefined;
            }
            const id = ExtHostChat._nextId++;
            this._chatSessions.set(id, session);
            return {
                id,
            };
        }
        $releaseSession(sessionId) {
            this._chatSessions.delete(sessionId);
        }
    }
    exports.ExtHostChat = ExtHostChat;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0SG9zdENoYXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9hcGkvY29tbW9uL2V4dEhvc3RDaGF0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFNLG1CQUFtQjtpQkFFVCxVQUFLLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFJekIsWUFDVSxTQUFpRCxFQUNqRCxRQUFXO1lBRFgsY0FBUyxHQUFULFNBQVMsQ0FBd0M7WUFDakQsYUFBUSxHQUFSLFFBQVEsQ0FBRztZQUpaLFdBQU0sR0FBVyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUtsRCxDQUFDOztJQUdOLE1BQWEsV0FBVztpQkFDUixZQUFPLEdBQUcsQ0FBQyxBQUFKLENBQUs7UUFRM0IsWUFDQyxXQUF5QjtZQVBULGtCQUFhLEdBQUcsSUFBSSxHQUFHLEVBQWtFLENBQUM7WUFFMUYsa0JBQWEsR0FBRyxJQUFJLEdBQUcsRUFBcUMsQ0FBQztZQU83RSxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsOEJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsNkJBQTZCO1FBRTdCLG9CQUFvQixDQUFDLFNBQWlELEVBQUUsRUFBVSxFQUFFLFFBQTJDO1lBQzlILE1BQU0sT0FBTyxHQUFHLElBQUksbUJBQW1CLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sSUFBQSx3QkFBWSxFQUFDLEdBQUcsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMzQyxDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxtQkFBbUIsQ0FBQyxPQUFrQyxFQUFFLFlBQXdCO1lBQy9FLE1BQU0sU0FBUyxHQUFHLG1CQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDaEgsSUFBSSxPQUFPLFNBQVMsS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDbkMsT0FBTztZQUNSLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFjLEVBQUUsS0FBd0I7WUFDMUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNaLE9BQU8sU0FBUyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxNQUFNLE9BQU8sR0FBRyxNQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxPQUFPLFNBQVMsQ0FBQztZQUNsQixDQUFDO1lBRUQsTUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVwQyxPQUFPO2dCQUNOLEVBQUU7YUFDRixDQUFDO1FBQ0gsQ0FBQztRQUVELGVBQWUsQ0FBQyxTQUFpQjtZQUNoQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxDQUFDOztJQXpERixrQ0E0REMifQ==