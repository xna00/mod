/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/platform", "vs/base/browser/dom"], function (require, exports, keybindingsRegistry_1, platform, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (platform.isMacintosh) {
        // On the mac, cmd+x, cmd+c and cmd+v do not result in cut / copy / paste
        // We therefore add a basic keybinding rule that invokes document.execCommand
        // This is to cover <input>s...
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execCut',
            primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
            handler: bindExecuteCommand('cut'),
            weight: 0,
            when: undefined,
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execCopy',
            primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
            handler: bindExecuteCommand('copy'),
            weight: 0,
            when: undefined,
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: 'execPaste',
            primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
            handler: bindExecuteCommand('paste'),
            weight: 0,
            when: undefined,
        });
        function bindExecuteCommand(command) {
            return () => {
                (0, dom_1.getActiveWindow)().document.execCommand(command);
            };
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRDbGlwYm9hcmRBY3Rpb25zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9jb2RlRWRpdG9yL2VsZWN0cm9uLXNhbmRib3gvaW5wdXRDbGlwYm9hcmRBY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBT2hHLElBQUksUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTFCLHlFQUF5RTtRQUN6RSw2RUFBNkU7UUFDN0UsK0JBQStCO1FBRS9CLHlDQUFtQixDQUFDLGdDQUFnQyxDQUFDO1lBQ3BELEVBQUUsRUFBRSxTQUFTO1lBQ2IsT0FBTyxFQUFFLGlEQUE2QjtZQUN0QyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxDQUFDO1lBQ2xDLE1BQU0sRUFBRSxDQUFDO1lBQ1QsSUFBSSxFQUFFLFNBQVM7U0FDZixDQUFDLENBQUM7UUFDSCx5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztZQUNwRCxFQUFFLEVBQUUsVUFBVTtZQUNkLE9BQU8sRUFBRSxpREFBNkI7WUFDdEMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztZQUNuQyxNQUFNLEVBQUUsQ0FBQztZQUNULElBQUksRUFBRSxTQUFTO1NBQ2YsQ0FBQyxDQUFDO1FBQ0gseUNBQW1CLENBQUMsZ0NBQWdDLENBQUM7WUFDcEQsRUFBRSxFQUFFLFdBQVc7WUFDZixPQUFPLEVBQUUsaURBQTZCO1lBQ3RDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxPQUFPLENBQUM7WUFDcEMsTUFBTSxFQUFFLENBQUM7WUFDVCxJQUFJLEVBQUUsU0FBUztTQUNmLENBQUMsQ0FBQztRQUVILFNBQVMsa0JBQWtCLENBQUMsT0FBaUM7WUFDNUQsT0FBTyxHQUFHLEVBQUU7Z0JBQ1gsSUFBQSxxQkFBZSxHQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqRCxDQUFDLENBQUM7UUFDSCxDQUFDO0lBQ0YsQ0FBQyJ9