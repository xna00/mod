/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/action/common/actionCommonCategories", "vs/platform/commands/common/commands", "vs/workbench/services/log/common/logConstants"], function (require, exports, nls, actions_1, keybinding_1, actionCommonCategories_1, commands_1, logConstants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleKeybindingsLogAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleKeybindingsLog',
                title: nls.localize2('toggleKeybindingsLog', "Toggle Keyboard Shortcuts Troubleshooting"),
                category: actionCommonCategories_1.Categories.Developer,
                f1: true
            });
        }
        run(accessor) {
            const logging = accessor.get(keybinding_1.IKeybindingService).toggleLogging();
            if (logging) {
                const commandService = accessor.get(commands_1.ICommandService);
                commandService.executeCommand(logConstants_1.showWindowLogActionId);
            }
        }
    }
    (0, actions_1.registerAction2)(ToggleKeybindingsLogAction);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ3MuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9rZXliaW5kaW5ncy9icm93c2VyL2tleWJpbmRpbmdzLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQVVoRyxNQUFNLDBCQUEyQixTQUFRLGlCQUFPO1FBRS9DO1lBQ0MsS0FBSyxDQUFDO2dCQUNMLEVBQUUsRUFBRSx1Q0FBdUM7Z0JBQzNDLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHNCQUFzQixFQUFFLDJDQUEyQyxDQUFDO2dCQUN6RixRQUFRLEVBQUUsbUNBQVUsQ0FBQyxTQUFTO2dCQUM5QixFQUFFLEVBQUUsSUFBSTthQUNSLENBQUMsQ0FBQztRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsUUFBMEI7WUFDN0IsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywrQkFBa0IsQ0FBQyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ2pFLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQywwQkFBZSxDQUFDLENBQUM7Z0JBQ3JELGNBQWMsQ0FBQyxjQUFjLENBQUMsb0NBQXFCLENBQUMsQ0FBQztZQUN0RCxDQUFDO1FBQ0YsQ0FBQztLQUNEO0lBRUQsSUFBQSx5QkFBZSxFQUFDLDBCQUEwQixDQUFDLENBQUMifQ==