/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MockChatWidgetService = void 0;
    class MockChatWidgetService {
        /**
         * Returns whether a view was successfully revealed.
         */
        async revealViewForProvider(providerId) {
            return undefined;
        }
        getWidgetByInputUri(uri) {
            return undefined;
        }
        getWidgetBySessionId(sessionId) {
            return undefined;
        }
    }
    exports.MockChatWidgetService = MockChatWidgetService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9ja0NoYXRXaWRnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL2NoYXQvdGVzdC9icm93c2VyL21vY2tDaGF0V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQUtoRyxNQUFhLHFCQUFxQjtRQVFqQzs7V0FFRztRQUNILEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxVQUFrQjtZQUM3QyxPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsbUJBQW1CLENBQUMsR0FBUTtZQUMzQixPQUFPLFNBQVMsQ0FBQztRQUNsQixDQUFDO1FBRUQsb0JBQW9CLENBQUMsU0FBaUI7WUFDckMsT0FBTyxTQUFTLENBQUM7UUFDbEIsQ0FBQztLQUNEO0lBdEJELHNEQXNCQyJ9