/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GeneratingPhrase = exports.IChatCodeBlockContextProviderService = exports.IChatAccessibilityService = exports.IQuickChatService = exports.IChatWidgetService = void 0;
    exports.IChatWidgetService = (0, instantiation_1.createDecorator)('chatWidgetService');
    exports.IQuickChatService = (0, instantiation_1.createDecorator)('quickChatService');
    exports.IChatAccessibilityService = (0, instantiation_1.createDecorator)('chatAccessibilityService');
    exports.IChatCodeBlockContextProviderService = (0, instantiation_1.createDecorator)('chatCodeBlockContextProviderService');
    exports.GeneratingPhrase = (0, nls_1.localize)('generating', "Generating");
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhdC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvY2hhdC9icm93c2VyL2NoYXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBZ0JuRixRQUFBLGtCQUFrQixHQUFHLElBQUEsK0JBQWUsRUFBcUIsbUJBQW1CLENBQUMsQ0FBQztJQXFCOUUsUUFBQSxpQkFBaUIsR0FBRyxJQUFBLCtCQUFlLEVBQW9CLGtCQUFrQixDQUFDLENBQUM7SUE0QjNFLFFBQUEseUJBQXlCLEdBQUcsSUFBQSwrQkFBZSxFQUE0QiwwQkFBMEIsQ0FBQyxDQUFDO0lBMEZuRyxRQUFBLG9DQUFvQyxHQUFHLElBQUEsK0JBQWUsRUFBdUMscUNBQXFDLENBQUMsQ0FBQztJQU9wSSxRQUFBLGdCQUFnQixHQUFHLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQyJ9