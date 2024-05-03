/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isMenubarMenuItemSubmenu = isMenubarMenuItemSubmenu;
    exports.isMenubarMenuItemSeparator = isMenubarMenuItemSeparator;
    exports.isMenubarMenuItemRecentAction = isMenubarMenuItemRecentAction;
    exports.isMenubarMenuItemAction = isMenubarMenuItemAction;
    function isMenubarMenuItemSubmenu(menuItem) {
        return menuItem.submenu !== undefined;
    }
    function isMenubarMenuItemSeparator(menuItem) {
        return menuItem.id === 'vscode.menubar.separator';
    }
    function isMenubarMenuItemRecentAction(menuItem) {
        return menuItem.uri !== undefined;
    }
    function isMenubarMenuItemAction(menuItem) {
        return !isMenubarMenuItemSubmenu(menuItem) && !isMenubarMenuItemSeparator(menuItem) && !isMenubarMenuItemRecentAction(menuItem);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbWVudWJhci9jb21tb24vbWVudWJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQWtEaEcsNERBRUM7SUFFRCxnRUFFQztJQUVELHNFQUVDO0lBRUQsMERBRUM7SUFkRCxTQUFnQix3QkFBd0IsQ0FBQyxRQUF5QjtRQUNqRSxPQUFpQyxRQUFTLENBQUMsT0FBTyxLQUFLLFNBQVMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsU0FBZ0IsMEJBQTBCLENBQUMsUUFBeUI7UUFDbkUsT0FBbUMsUUFBUyxDQUFDLEVBQUUsS0FBSywwQkFBMEIsQ0FBQztJQUNoRixDQUFDO0lBRUQsU0FBZ0IsNkJBQTZCLENBQUMsUUFBeUI7UUFDdEUsT0FBc0MsUUFBUyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUM7SUFDbkUsQ0FBQztJQUVELFNBQWdCLHVCQUF1QixDQUFDLFFBQXlCO1FBQ2hFLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsNkJBQTZCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakksQ0FBQyJ9