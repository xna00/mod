/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isLocalizedString = isLocalizedString;
    exports.isICommandActionToggleInfo = isICommandActionToggleInfo;
    function isLocalizedString(thing) {
        return thing
            && typeof thing === 'object'
            && typeof thing.original === 'string'
            && typeof thing.value === 'string';
    }
    function isICommandActionToggleInfo(thing) {
        return thing ? thing.condition !== undefined : false;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb24vY29tbW9uL2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFCaEcsOENBS0M7SUFrQ0QsZ0VBRUM7SUF6Q0QsU0FBZ0IsaUJBQWlCLENBQUMsS0FBVTtRQUMzQyxPQUFPLEtBQUs7ZUFDUixPQUFPLEtBQUssS0FBSyxRQUFRO2VBQ3pCLE9BQU8sS0FBSyxDQUFDLFFBQVEsS0FBSyxRQUFRO2VBQ2xDLE9BQU8sS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLENBQUM7SUFDckMsQ0FBQztJQWtDRCxTQUFnQiwwQkFBMEIsQ0FBQyxLQUFrRTtRQUM1RyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQTRCLEtBQU0sQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDbEYsQ0FBQyJ9