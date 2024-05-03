/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, keybindingsRegistry_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setupTerminalCommands = setupTerminalCommands;
    function setupTerminalCommands() {
        registerOpenTerminalAtIndexCommands();
    }
    function registerOpenTerminalAtIndexCommands() {
        for (let i = 0; i < 9; i++) {
            const terminalIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: `workbench.action.terminal.focusAtIndex${visibleIndex}`,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 0,
                handler: accessor => {
                    accessor.get(terminal_1.ITerminalGroupService).setActiveInstanceByIndex(terminalIndex);
                    return accessor.get(terminal_1.ITerminalGroupService).showPanel(true);
                }
            });
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDb21tYW5kcy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbENvbW1hbmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBS2hHLHNEQUVDO0lBRkQsU0FBZ0IscUJBQXFCO1FBQ3BDLG1DQUFtQyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELFNBQVMsbUNBQW1DO1FBQzNDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM1QixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7WUFDeEIsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUUzQix5Q0FBbUIsQ0FBQyxnQ0FBZ0MsQ0FBQztnQkFDcEQsRUFBRSxFQUFFLHlDQUF5QyxZQUFZLEVBQUU7Z0JBQzNELE1BQU0sNkNBQW1DO2dCQUN6QyxJQUFJLEVBQUUsU0FBUztnQkFDZixPQUFPLEVBQUUsQ0FBQztnQkFDVixPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQUU7b0JBQ25CLFFBQVEsQ0FBQyxHQUFHLENBQUMsZ0NBQXFCLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztvQkFDNUUsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLGdDQUFxQixDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM1RCxDQUFDO2FBQ0QsQ0FBQyxDQUFDO1FBQ0osQ0FBQztJQUNGLENBQUMifQ==