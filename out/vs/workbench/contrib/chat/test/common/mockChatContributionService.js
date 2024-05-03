/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockChatContributionService = void 0;
    class MockChatContributionService {
        constructor() {
            this.registeredProviders = [];
        }
        registerChatParticipant(participant) {
            throw new Error('Method not implemented.');
        }
        deregisterChatParticipant(participant) {
            throw new Error('Method not implemented.');
        }
        registerChatProvider(provider) {
            throw new Error('Method not implemented.');
        }
        deregisterChatProvider(providerId) {
            throw new Error('Method not implemented.');
        }
        getViewIdForProvider(providerId) {
            throw new Error('Method not implemented.');
        }
    }
    exports.MockChatContributionService = MockChatContributionService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0NoYXRDb250cmlidXRpb25TZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jaGF0L3Rlc3QvY29tbW9uL21vY2tDaGF0Q29udHJpYnV0aW9uU2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEcsTUFBYSwyQkFBMkI7UUFHdkM7WUFHQSx3QkFBbUIsR0FBZ0MsRUFBRSxDQUFDO1FBRmxELENBQUM7UUFHTCx1QkFBdUIsQ0FBQyxXQUF5QztZQUNoRSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELHlCQUF5QixDQUFDLFdBQXlDO1lBQ2xFLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRUQsb0JBQW9CLENBQUMsUUFBbUM7WUFDdkQsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFDRCxzQkFBc0IsQ0FBQyxVQUFrQjtZQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUNELG9CQUFvQixDQUFDLFVBQWtCO1lBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUM1QyxDQUFDO0tBQ0Q7SUF2QkQsa0VBdUJDIn0=