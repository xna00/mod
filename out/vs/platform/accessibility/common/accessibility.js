/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CONTEXT_ACCESSIBILITY_MODE_ENABLED = exports.AccessibilitySupport = exports.IAccessibilityService = void 0;
    exports.isAccessibilityInformation = isAccessibilityInformation;
    exports.IAccessibilityService = (0, instantiation_1.createDecorator)('accessibilityService');
    var AccessibilitySupport;
    (function (AccessibilitySupport) {
        /**
         * This should be the browser case where it is not known if a screen reader is attached or no.
         */
        AccessibilitySupport[AccessibilitySupport["Unknown"] = 0] = "Unknown";
        AccessibilitySupport[AccessibilitySupport["Disabled"] = 1] = "Disabled";
        AccessibilitySupport[AccessibilitySupport["Enabled"] = 2] = "Enabled";
    })(AccessibilitySupport || (exports.AccessibilitySupport = AccessibilitySupport = {}));
    exports.CONTEXT_ACCESSIBILITY_MODE_ENABLED = new contextkey_1.RawContextKey('accessibilityModeEnabled', false);
    function isAccessibilityInformation(obj) {
        return obj && typeof obj === 'object'
            && typeof obj.label === 'string'
            && (typeof obj.role === 'undefined' || typeof obj.role === 'string');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzaWJpbGl0eS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vYWNjZXNzaWJpbGl0eS9jb21tb24vYWNjZXNzaWJpbGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF5Q2hHLGdFQUlDO0lBdkNZLFFBQUEscUJBQXFCLEdBQUcsSUFBQSwrQkFBZSxFQUF3QixzQkFBc0IsQ0FBQyxDQUFDO0lBaUJwRyxJQUFrQixvQkFTakI7SUFURCxXQUFrQixvQkFBb0I7UUFDckM7O1dBRUc7UUFDSCxxRUFBVyxDQUFBO1FBRVgsdUVBQVksQ0FBQTtRQUVaLHFFQUFXLENBQUE7SUFDWixDQUFDLEVBVGlCLG9CQUFvQixvQ0FBcEIsb0JBQW9CLFFBU3JDO0lBRVksUUFBQSxrQ0FBa0MsR0FBRyxJQUFJLDBCQUFhLENBQVUsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFPaEgsU0FBZ0IsMEJBQTBCLENBQUMsR0FBUTtRQUNsRCxPQUFPLEdBQUcsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRO2VBQ2pDLE9BQU8sR0FBRyxDQUFDLEtBQUssS0FBSyxRQUFRO2VBQzdCLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7SUFDdkUsQ0FBQyJ9