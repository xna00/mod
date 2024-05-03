/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionRecommendationNotificationService = exports.RecommendationsNotificationResult = exports.RecommendationSource = void 0;
    exports.RecommendationSourceToString = RecommendationSourceToString;
    var RecommendationSource;
    (function (RecommendationSource) {
        RecommendationSource[RecommendationSource["FILE"] = 1] = "FILE";
        RecommendationSource[RecommendationSource["WORKSPACE"] = 2] = "WORKSPACE";
        RecommendationSource[RecommendationSource["EXE"] = 3] = "EXE";
    })(RecommendationSource || (exports.RecommendationSource = RecommendationSource = {}));
    function RecommendationSourceToString(source) {
        switch (source) {
            case 1 /* RecommendationSource.FILE */: return 'file';
            case 2 /* RecommendationSource.WORKSPACE */: return 'workspace';
            case 3 /* RecommendationSource.EXE */: return 'exe';
        }
    }
    var RecommendationsNotificationResult;
    (function (RecommendationsNotificationResult) {
        RecommendationsNotificationResult["Ignored"] = "ignored";
        RecommendationsNotificationResult["Cancelled"] = "cancelled";
        RecommendationsNotificationResult["TooMany"] = "toomany";
        RecommendationsNotificationResult["IncompatibleWindow"] = "incompatibleWindow";
        RecommendationsNotificationResult["Accepted"] = "reacted";
    })(RecommendationsNotificationResult || (exports.RecommendationsNotificationResult = RecommendationsNotificationResult = {}));
    exports.IExtensionRecommendationNotificationService = (0, instantiation_1.createDecorator)('IExtensionRecommendationNotificationService');
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9leHRlbnNpb25SZWNvbW1lbmRhdGlvbnMvY29tbW9uL2V4dGVuc2lvblJlY29tbWVuZGF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFrQmhHLG9FQU1DO0lBbkJELElBQWtCLG9CQUlqQjtJQUpELFdBQWtCLG9CQUFvQjtRQUNyQywrREFBUSxDQUFBO1FBQ1IseUVBQWEsQ0FBQTtRQUNiLDZEQUFPLENBQUE7SUFDUixDQUFDLEVBSmlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBSXJDO0lBU0QsU0FBZ0IsNEJBQTRCLENBQUMsTUFBNEI7UUFDeEUsUUFBUSxNQUFNLEVBQUUsQ0FBQztZQUNoQixzQ0FBOEIsQ0FBQyxDQUFDLE9BQU8sTUFBTSxDQUFDO1lBQzlDLDJDQUFtQyxDQUFDLENBQUMsT0FBTyxXQUFXLENBQUM7WUFDeEQscUNBQTZCLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQztRQUM3QyxDQUFDO0lBQ0YsQ0FBQztJQUVELElBQWtCLGlDQU1qQjtJQU5ELFdBQWtCLGlDQUFpQztRQUNsRCx3REFBbUIsQ0FBQTtRQUNuQiw0REFBdUIsQ0FBQTtRQUN2Qix3REFBbUIsQ0FBQTtRQUNuQiw4RUFBeUMsQ0FBQTtRQUN6Qyx5REFBb0IsQ0FBQTtJQUNyQixDQUFDLEVBTmlCLGlDQUFpQyxpREFBakMsaUNBQWlDLFFBTWxEO0lBRVksUUFBQSwyQ0FBMkMsR0FBRyxJQUFBLCtCQUFlLEVBQThDLDZDQUE2QyxDQUFDLENBQUMifQ==