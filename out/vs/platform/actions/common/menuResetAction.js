/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/common/actions", "vs/platform/log/common/log"], function (require, exports, nls_1, actionCommonCategories_1, actions_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuHiddenStatesReset = void 0;
    class MenuHiddenStatesReset extends actions_1.Action2 {
        constructor() {
            super({
                id: 'menu.resetHiddenStates',
                title: (0, nls_1.localize2)('title', "Reset All Menus"),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(actions_1.IMenuService).resetHiddenStates();
            accessor.get(log_1.ILogService).info('did RESET all menu hidden states');
        }
    }
    exports.MenuHiddenStatesReset = MenuHiddenStatesReset;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudVJlc2V0QWN0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb25zL2NvbW1vbi9tZW51UmVzZXRBY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBUWhHLE1BQWEscUJBQXNCLFNBQVEsaUJBQU87UUFFakQ7WUFDQyxLQUFLLENBQUM7Z0JBQ0wsRUFBRSxFQUFFLHdCQUF3QjtnQkFDNUIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztnQkFDNUMsUUFBUSxFQUFFLG1DQUFVLENBQUMsSUFBSTtnQkFDekIsRUFBRSxFQUFFLElBQUk7YUFDUixDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLFFBQTBCO1lBQzdCLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0JBQVksQ0FBQyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDL0MsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBVyxDQUFDLENBQUMsSUFBSSxDQUFDLGtDQUFrQyxDQUFDLENBQUM7UUFDcEUsQ0FBQztLQUNEO0lBZkQsc0RBZUMifQ==