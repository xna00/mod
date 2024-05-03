/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/browser/terminalProfileResolverService", "vs/workbench/contrib/terminal/common/terminalContextKey"], function (require, exports, keybindingsRegistry_1, terminal_1, extensions_1, terminalProfileResolverService_1, terminalContextKey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(terminal_1.ITerminalProfileResolverService, terminalProfileResolverService_1.BrowserTerminalProfileResolverService, 1 /* InstantiationType.Delayed */);
    // Register standard external terminal keybinding as integrated terminal when in web as the
    // external terminal is not available
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: terminalContextKey_1.TerminalContextKeys.notFocus,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwud2ViLmNvbnRyaWJ1dGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWwvYnJvd3Nlci90ZXJtaW5hbC53ZWIuY29udHJpYnV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7O0lBU2hHLElBQUEsOEJBQWlCLEVBQUMsMENBQStCLEVBQUUsc0VBQXFDLG9DQUE0QixDQUFDO0lBRXJILDJGQUEyRjtJQUMzRixxQ0FBcUM7SUFDckMseUNBQW1CLENBQUMsc0JBQXNCLENBQUM7UUFDMUMsRUFBRSw2REFBdUI7UUFDekIsTUFBTSw2Q0FBbUM7UUFDekMsSUFBSSxFQUFFLHdDQUFtQixDQUFDLFFBQVE7UUFDbEMsT0FBTyxFQUFFLG1EQUE2Qix3QkFBZTtLQUNyRCxDQUFDLENBQUMifQ==