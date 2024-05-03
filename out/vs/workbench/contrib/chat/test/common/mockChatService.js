/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockChatService = void 0;
    class MockChatService {
        constructor() {
            this.onDidRegisterProvider = undefined;
            this.onDidUnregisterProvider = undefined;
            this.onDidPerformUserAction = undefined;
            this.onDidDisposeSession = undefined;
        }
        hasSessions(providerId) {
            throw new Error('Method not implemented.');
        }
        getProviderInfos() {
            throw new Error('Method not implemented.');
        }
        startSession(providerId, token) {
            throw new Error('Method not implemented.');
        }
        getSession(sessionId) {
            return {};
        }
        getSessionId(sessionProviderId) {
            throw new Error('Method not implemented.');
        }
        getOrRestoreSession(sessionId) {
            throw new Error('Method not implemented.');
        }
        loadSessionFromContent(data) {
            throw new Error('Method not implemented.');
        }
        registerProvider(provider) {
            throw new Error('Method not implemented.');
        }
        /**
         * Returns whether the request was accepted.
         */
        sendRequest(sessionId, message) {
            throw new Error('Method not implemented.');
        }
        removeRequest(sessionid, requestId) {
            throw new Error('Method not implemented.');
        }
        cancelCurrentRequestForSession(sessionId) {
            throw new Error('Method not implemented.');
        }
        clearSession(sessionId) {
            throw new Error('Method not implemented.');
        }
        addCompleteRequest(sessionId, message, variableData, response) {
            throw new Error('Method not implemented.');
        }
        getHistory() {
            throw new Error('Method not implemented.');
        }
        clearAllHistoryEntries() {
            throw new Error('Method not implemented.');
        }
        removeHistoryEntry(sessionId) {
            throw new Error('Method not implemented.');
        }
        notifyUserAction(event) {
            throw new Error('Method not implemented.');
        }
        transferChatSession(transferredSessionData, toWorkspace) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockChatService = MockChatService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0NoYXRTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L3Rlc3QvY29tbW9uL21vY2tDaGF0U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFVaEcsTUFBYSxlQUFlO1FBQTVCO1lBeUJDLDBCQUFxQixHQUFrQyxTQUFVLENBQUM7WUFDbEUsNEJBQXVCLEdBQWtDLFNBQVUsQ0FBQztZQWlDcEUsMkJBQXNCLEdBQWdDLFNBQVUsQ0FBQztZQUlqRSx3QkFBbUIsR0FBaUcsU0FBVSxDQUFDO1FBS2hJLENBQUM7UUFoRUEsV0FBVyxDQUFDLFVBQWtCO1lBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsZ0JBQWdCO1lBQ2YsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxZQUFZLENBQUMsVUFBa0IsRUFBRSxLQUF3QjtZQUN4RCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELFVBQVUsQ0FBQyxTQUFpQjtZQUMzQixPQUFPLEVBQWdCLENBQUM7UUFDekIsQ0FBQztRQUNELFlBQVksQ0FBQyxpQkFBeUI7WUFDckMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxtQkFBbUIsQ0FBQyxTQUFpQjtZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELHNCQUFzQixDQUFDLElBQTJCO1lBQ2pELE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBR0QsZ0JBQWdCLENBQUMsUUFBdUI7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRDs7V0FFRztRQUNILFdBQVcsQ0FBQyxTQUFpQixFQUFFLE9BQWU7WUFDN0MsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxhQUFhLENBQUMsU0FBaUIsRUFBRSxTQUFpQjtZQUNqRCxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELDhCQUE4QixDQUFDLFNBQWlCO1lBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0QsWUFBWSxDQUFDLFNBQWlCO1lBQzdCLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQ0Qsa0JBQWtCLENBQUMsU0FBaUIsRUFBRSxPQUFvQyxFQUFFLFlBQWtELEVBQUUsUUFBK0I7WUFDOUosTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxVQUFVO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxzQkFBc0I7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxrQkFBa0IsQ0FBQyxTQUFpQjtZQUNuQyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUdELGdCQUFnQixDQUFDLEtBQTJCO1lBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBR0QsbUJBQW1CLENBQUMsc0JBQW1ELEVBQUUsV0FBZ0I7WUFDeEYsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDRDtJQXBFRCwwQ0FvRUMifQ==