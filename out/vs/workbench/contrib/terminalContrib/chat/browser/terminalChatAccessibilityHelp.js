/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChat", "vs/workbench/contrib/terminalContrib/chat/browser/terminalChatController"], function (require, exports, lifecycle_1, nls_1, keybinding_1, accessibleView_1, accessibleViewActions_1, terminal_1, terminalChat_1, terminalChatController_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalChatAccessibilityHelpContribution = void 0;
    exports.runAccessibilityHelpAction = runAccessibilityHelpAction;
    exports.getAccessibilityHelpText = getAccessibilityHelpText;
    class TerminalChatAccessibilityHelpContribution extends lifecycle_1.Disposable {
        static { this.ID = 'terminalChatAccessiblityHelp'; }
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(110, 'terminalChat', runAccessibilityHelpAction, terminalChat_1.TerminalChatContextKeys.focused));
        }
    }
    exports.TerminalChatAccessibilityHelpContribution = TerminalChatAccessibilityHelpContribution;
    async function runAccessibilityHelpAction(accessor) {
        const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
        const terminalService = accessor.get(terminal_1.ITerminalService);
        const instance = terminalService.activeInstance;
        if (!instance) {
            return;
        }
        const helpText = getAccessibilityHelpText(accessor);
        accessibleViewService.show({
            id: "terminal-chat" /* AccessibleViewProviderId.TerminalChat */,
            verbositySettingKey: "accessibility.verbosity.terminalChat" /* AccessibilityVerbositySettingId.TerminalChat */,
            provideContent: () => helpText,
            onClose: () => terminalChatController_1.TerminalChatController.get(instance)?.focus(),
            options: { type: "help" /* AccessibleViewType.Help */ }
        });
    }
    function getAccessibilityHelpText(accessor) {
        const keybindingService = accessor.get(keybinding_1.IKeybindingService);
        const content = [];
        const openAccessibleViewKeybinding = keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel();
        const runCommandKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.runCommand" /* TerminalChatCommandId.RunCommand */)?.getAriaLabel();
        const insertCommandKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.insertCommand" /* TerminalChatCommandId.InsertCommand */)?.getAriaLabel();
        const makeRequestKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.makeRequest" /* TerminalChatCommandId.MakeRequest */)?.getAriaLabel();
        const startChatKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.start" /* TerminalChatCommandId.Start */)?.getAriaLabel();
        const focusResponseKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.focusResponse" /* TerminalChatCommandId.FocusResponse */)?.getAriaLabel();
        const focusInputKeybinding = keybindingService.lookupKeybinding("workbench.action.terminal.chat.focusInput" /* TerminalChatCommandId.FocusInput */)?.getAriaLabel();
        content.push((0, nls_1.localize)('inlineChat.overview', "Inline chat occurs within a terminal. It is useful for suggesting terminal commands. Keep in mind that AI generated code may be incorrect."));
        content.push((0, nls_1.localize)('inlineChat.access', "It can be activated using the command: Terminal: Start Chat ({0}), which will focus the input box.", startChatKeybinding));
        content.push(makeRequestKeybinding ? (0, nls_1.localize)('inlineChat.input', "The input box is where the user can type a request and can make the request ({0}). The widget will be closed and all content will be discarded when the Escape key is pressed and the terminal will regain focus.", makeRequestKeybinding) : (0, nls_1.localize)('inlineChat.inputNoKb', "The input box is where the user can type a request and can make the request by tabbing to the Make Request button, which is not currently triggerable via keybindings. The widget will be closed and all content will be discarded when the Escape key is pressed and the terminal will regain focus."));
        content.push(openAccessibleViewKeybinding ? (0, nls_1.localize)('inlineChat.inspectResponseMessage', 'The response can be inspected in the accessible view ({0}).', openAccessibleViewKeybinding) : (0, nls_1.localize)('inlineChat.inspectResponseNoKb', 'With the input box focused, inspect the response in the accessible view via the Open Accessible View command, which is currently not triggerable by a keybinding.'));
        content.push(focusResponseKeybinding ? (0, nls_1.localize)('inlineChat.focusResponse', 'Reach the response from the input box ({0}).', focusResponseKeybinding) : (0, nls_1.localize)('inlineChat.focusResponseNoKb', 'Reach the response from the input box by tabbing or assigning a keybinding for the command: Focus Terminal Response.'));
        content.push(focusInputKeybinding ? (0, nls_1.localize)('inlineChat.focusInput', 'Reach the input box from the response ({0}).', focusInputKeybinding) : (0, nls_1.localize)('inlineChat.focusInputNoKb', 'Reach the response from the input box by shift+tabbing or assigning a keybinding for the command: Focus Terminal Input.'));
        content.push(runCommandKeybinding ? (0, nls_1.localize)('inlineChat.runCommand', 'With focus in the input box or command editor, the Terminal: Run Chat Command ({0}) action.', runCommandKeybinding) : (0, nls_1.localize)('inlineChat.runCommandNoKb', 'Run a command by tabbing to the button as the action is currently not triggerable by a keybinding.'));
        content.push(insertCommandKeybinding ? (0, nls_1.localize)('inlineChat.insertCommand', 'With focus in the input box command editor, the Terminal: Insert Chat Command ({0}) action.', insertCommandKeybinding) : (0, nls_1.localize)('inlineChat.insertCommandNoKb', 'Insert a command by tabbing to the button as the action is currently not triggerable by a keybinding.'));
        content.push((0, nls_1.localize)('inlineChat.toolbar', "Use tab to reach conditional parts like commands, status, message responses and more."));
        content.push((0, nls_1.localize)('chat.signals', "Accessibility Signals can be changed via settings with a prefix of signals.chat. By default, if a request takes more than 4 seconds, you will hear a sound indicating that progress is still occurring."));
        return content.join('\n\n');
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxDaGF0QWNjZXNzaWJpbGl0eUhlbHAuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9jaGF0L2Jyb3dzZXIvdGVybWluYWxDaGF0QWNjZXNzaWJpbGl0eUhlbHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUJoRyxnRUFpQkM7SUFFRCw0REFxQkM7SUFoREQsTUFBYSx5Q0FBMEMsU0FBUSxzQkFBVTtpQkFDakUsT0FBRSxHQUFHLDhCQUE4QixDQUFDO1FBQzNDO1lBQ0MsS0FBSyxFQUFFLENBQUM7WUFDUixJQUFJLENBQUMsU0FBUyxDQUFDLCtDQUF1QixDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxjQUFjLEVBQUUsMEJBQTBCLEVBQUUsc0NBQXVCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3SSxDQUFDOztJQUxGLDhGQU1DO0lBRU0sS0FBSyxVQUFVLDBCQUEwQixDQUFDLFFBQTBCO1FBQzFFLE1BQU0scUJBQXFCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyx1Q0FBc0IsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsMkJBQWdCLENBQUMsQ0FBQztRQUV2RCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsY0FBYyxDQUFDO1FBQ2hELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNmLE9BQU87UUFDUixDQUFDO1FBRUQsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEQscUJBQXFCLENBQUMsSUFBSSxDQUFDO1lBQzFCLEVBQUUsNkRBQXVDO1lBQ3pDLG1CQUFtQiwyRkFBOEM7WUFDakUsY0FBYyxFQUFFLEdBQUcsRUFBRSxDQUFDLFFB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