/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showHistoryKeybindingHint = showHistoryKeybindingHint;
    function showHistoryKeybindingHint(keybindingService) {
        return keybindingService.lookupKeybinding('history.showPrevious')?.getElectronAccelerator() === 'Up' && keybindingService.lookupKeybinding('history.showNext')?.getElectronAccelerator() === 'Down';
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGlzdG9yeVdpZGdldEtleWJpbmRpbmdIaW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9oaXN0b3J5L2Jyb3dzZXIvaGlzdG9yeVdpZGdldEtleWJpbmRpbmdIaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBSWhHLDhEQUVDO0lBRkQsU0FBZ0IseUJBQXlCLENBQUMsaUJBQXFDO1FBQzlFLE9BQU8saUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsc0JBQXNCLENBQUMsRUFBRSxzQkFBc0IsRUFBRSxLQUFLLElBQUksSUFBSSxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLHNCQUFzQixFQUFFLEtBQUssTUFBTSxDQUFDO0lBQ3JNLENBQUMifQ==