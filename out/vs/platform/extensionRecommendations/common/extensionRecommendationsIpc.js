/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationNotificationServiceChannel = exports.ExtensionRecommendationNotificationServiceChannelClient = void 0;
    class ExtensionRecommendationNotificationServiceChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        get ignoredRecommendations() { throw new Error('not supported'); }
        promptImportantExtensionsInstallNotification(extensionRecommendations) {
            return this.channel.call('promptImportantExtensionsInstallNotification', [extensionRecommendations]);
        }
        promptWorkspaceRecommendations(recommendations) {
            throw new Error('not supported');
        }
        hasToIgnoreRecommendationNotifications() {
            throw new Error('not supported');
        }
    }
    exports.ExtensionRecommendationNotificationServiceChannelClient = ExtensionRecommendationNotificationServiceChannelClient;
    class ExtensionRecommendationNotificationServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, args) {
            switch (command) {
                case 'promptImportantExtensionsInstallNotification': return this.service.promptImportantExtensionsInstallNotification(args[0]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.ExtensionRecommendationNotificationServiceChannel = ExtensionRecommendationNotificationServiceChannel;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zSXBjLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnMvY29tbW9uL2V4dGVuc2lvblJlY29tbWVuZGF0aW9uc0lwYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSx1REFBdUQ7UUFJbkUsWUFBNkIsT0FBaUI7WUFBakIsWUFBTyxHQUFQLE9BQU8sQ0FBVTtRQUFJLENBQUM7UUFFbkQsSUFBSSxzQkFBc0IsS0FBZSxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU1RSw0Q0FBNEMsQ0FBQyx3QkFBbUQ7WUFDL0YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyw4Q0FBOEMsRUFBRSxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQztRQUN0RyxDQUFDO1FBRUQsOEJBQThCLENBQUMsZUFBeUI7WUFDdkQsTUFBTSxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsc0NBQXNDO1lBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUVEO0lBcEJELDBIQW9CQztJQUVELE1BQWEsaURBQWlEO1FBRTdELFlBQW9CLE9BQW9EO1lBQXBELFlBQU8sR0FBUCxPQUFPLENBQTZDO1FBQUksQ0FBQztRQUU3RSxNQUFNLENBQUMsQ0FBVSxFQUFFLEtBQWE7WUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxDQUFDLENBQVUsRUFBRSxPQUFlLEVBQUUsSUFBVTtZQUMzQyxRQUFRLE9BQU8sRUFBRSxDQUFDO2dCQUNqQixLQUFLLDhDQUE4QyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLDRDQUE0QyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hJLENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQy9DLENBQUM7S0FDRDtJQWZELDhHQWVDIn0=