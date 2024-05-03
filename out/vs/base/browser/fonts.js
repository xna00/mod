/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_FONT_FAMILY = void 0;
    /**
     * The best font-family to be used in CSS based on the platform:
     * - Windows: Segoe preferred, fallback to sans-serif
     * - macOS: standard system font, fallback to sans-serif
     * - Linux: standard system font preferred, fallback to Ubuntu fonts
     *
     * Note: this currently does not adjust for different locales.
     */
    exports.DEFAULT_FONT_FAMILY = platform_1.isWindows ? '"Segoe WPC", "Segoe UI", sans-serif' : platform_1.isMacintosh ? '-apple-system, BlinkMacSystemFont, sans-serif' : 'system-ui, "Ubuntu", "Droid Sans", sans-serif';
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci9mb250cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFJaEc7Ozs7Ozs7T0FPRztJQUNVLFFBQUEsbUJBQW1CLEdBQUcsb0JBQVMsQ0FBQyxDQUFDLENBQUMscUNBQXFDLENBQUMsQ0FBQyxDQUFDLHNCQUFXLENBQUMsQ0FBQyxDQUFDLCtDQUErQyxDQUFDLENBQUMsQ0FBQywrQ0FBK0MsQ0FBQyJ9