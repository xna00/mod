/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ColorScheme = void 0;
    exports.isHighContrast = isHighContrast;
    exports.isDark = isDark;
    /**
     * Color scheme used by the OS and by color themes.
     */
    var ColorScheme;
    (function (ColorScheme) {
        ColorScheme["DARK"] = "dark";
        ColorScheme["LIGHT"] = "light";
        ColorScheme["HIGH_CONTRAST_DARK"] = "hcDark";
        ColorScheme["HIGH_CONTRAST_LIGHT"] = "hcLight";
    })(ColorScheme || (exports.ColorScheme = ColorScheme = {}));
    function isHighContrast(scheme) {
        return scheme === ColorScheme.HIGH_CONTRAST_DARK || scheme === ColorScheme.HIGH_CONTRAST_LIGHT;
    }
    function isDark(scheme) {
        return scheme === ColorScheme.DARK || scheme === ColorScheme.HIGH_CONTRAST_DARK;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhlbWUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL3RoZW1lL2NvbW1vbi90aGVtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsd0NBRUM7SUFFRCx3QkFFQztJQWhCRDs7T0FFRztJQUNILElBQVksV0FLWDtJQUxELFdBQVksV0FBVztRQUN0Qiw0QkFBYSxDQUFBO1FBQ2IsOEJBQWUsQ0FBQTtRQUNmLDRDQUE2QixDQUFBO1FBQzdCLDhDQUErQixDQUFBO0lBQ2hDLENBQUMsRUFMVyxXQUFXLDJCQUFYLFdBQVcsUUFLdEI7SUFFRCxTQUFnQixjQUFjLENBQUMsTUFBbUI7UUFDakQsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLGtCQUFrQixJQUFJLE1BQU0sS0FBSyxXQUFXLENBQUMsbUJBQW1CLENBQUM7SUFDaEcsQ0FBQztJQUVELFNBQWdCLE1BQU0sQ0FBQyxNQUFtQjtRQUN6QyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsSUFBSSxJQUFJLE1BQU0sS0FBSyxXQUFXLENBQUMsa0JBQWtCLENBQUM7SUFDakYsQ0FBQyJ9