/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/dnd/browser/dnd", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickAccess", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/terminalLogService", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/workbench/browser/editor", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/browser/quickaccess", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/remoteTerminalBackend", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalCommands", "vs/workbench/contrib/terminal/browser/terminalEditor", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/browser/terminalEditorSerializer", "vs/workbench/contrib/terminal/browser/terminalEditorService", "vs/workbench/contrib/terminal/browser/terminalGroupService", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/contrib/terminal/browser/terminalInstanceService", "vs/workbench/contrib/terminal/browser/terminalMainContribution", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/browser/terminalProfileService", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/contrib/terminal/browser/terminalService", "vs/workbench/contrib/terminal/browser/terminalView", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/common/terminalConfiguration", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/css!./media/scrollbar", "vs/css!./media/terminal", "vs/css!./media/terminalVoice", "vs/css!./media/widgets", "vs/css!./media/xterm"], function (require, exports, network_1, platform_1, uri_1, nls, accessibility_1, commands_1, contextkey_1, dnd_1, descriptors_1, extensions_1, keybindingsRegistry_1, quickAccess_1, platform_2, terminal_1, terminalLogService_1, terminalPlatformConfiguration_1, editor_1, viewPaneContainer_1, quickaccess_1, contributions_1, editor_2, views_1, remoteTerminalBackend_1, terminal_2, terminalActions_1, terminalCommands_1, terminalEditor_1, terminalEditorInput_1, terminalEditorSerializer_1, terminalEditorService_1, terminalGroupService_1, terminalIcons_1, terminalInstanceService_1, terminalMainContribution_1, terminalMenus_1, terminalProfileService_1, terminalQuickAccess_1, terminalService_1, terminalView_1, terminal_3, terminalColorRegistry_1, terminalConfiguration_1, terminalContextKey_1, terminalStrings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register services
    (0, extensions_1.registerSingleton)(terminal_1.ITerminalLogService, terminalLogService_1.TerminalLogService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalService, terminalService_1.TerminalService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalEditorService, terminalEditorService_1.TerminalEditorService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalGroupService, terminalGroupService_1.TerminalGroupService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalInstanceService, terminalInstanceService_1.TerminalInstanceService, 1 /* InstantiationType.Delayed */);
    (0, extensions_1.registerSingleton)(terminal_3.ITerminalProfileService, terminalProfileService_1.TerminalProfileService, 1 /* InstantiationType.Delayed */);
    // Register quick accesses
    const quickAccessRegistry = (platform_2.Registry.as(quickAccess_1.Extensions.Quickaccess));
    const inTerminalsPicker = 'inTerminalPicker';
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: terminalQuickAccess_1.TerminalQuickAccessProvider,
        prefix: terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX,
        contextKey: inTerminalsPicker,
        placeholder: nls.localize('tasksQuickAccessPlaceholder', "Type the name of a terminal to open."),
        helpEntries: [{ description: nls.localize('tasksQuickAccessHelp', "Show All Opened Terminals"), commandId: "workbench.action.quickOpenTerm" /* TerminalCommandId.QuickOpenTerm */ }]
    });
    const quickAccessNavigateNextInTerminalPickerId = 'workbench.action.quickOpenNavigateNextInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickAccessNavigateNextInTerminalPickerId, handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInTerminalPickerId, true) });
    const quickAccessNavigatePreviousInTerminalPickerId = 'workbench.action.quickOpenNavigatePreviousInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickAccessNavigatePreviousInTerminalPickerId, handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInTerminalPickerId, false) });
    // Register workbench contributions
    // This contribution blocks startup as it's critical to enable the web embedder window.createTerminal API
    (0, contributions_1.registerWorkbenchContribution2)(terminalMainContribution_1.TerminalMainContribution.ID, terminalMainContribution_1.TerminalMainContribution, 1 /* WorkbenchPhase.BlockStartup */);
    (0, contributions_1.registerWorkbenchContribution2)(remoteTerminalBackend_1.RemoteTerminalBackendContribution.ID, remoteTerminalBackend_1.RemoteTerminalBackendContribution, 3 /* WorkbenchPhase.AfterRestored */);
    // Register configurations
    (0, terminalPlatformConfiguration_1.registerTerminalPlatformConfiguration)();
    (0, terminalConfiguration_1.registerTerminalConfiguration)();
    // Register editor/dnd contributions
    platform_2.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(terminalEditorInput_1.TerminalEditorInput.ID, terminalEditorSerializer_1.TerminalInputSerializer);
    platform_2.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(terminalEditor_1.TerminalEditor, terminal_2.terminalEditorId, terminalStrings_1.terminalStrings.terminal), [
        new descriptors_1.SyncDescriptor(terminalEditorInput_1.TerminalEditorInput)
    ]);
    platform_2.Registry.as(dnd_1.Extensions.DragAndDropContribution).register({
        dataFormatKey: "Terminals" /* TerminalDataTransfers.Terminals */,
        getEditorInputs(data) {
            const editors = [];
            try {
                const terminalEditors = JSON.parse(data);
                for (const terminalEditor of terminalEditors) {
                    editors.push({ resource: uri_1.URI.parse(terminalEditor) });
                }
            }
            catch (error) {
                // Invalid transfer
            }
            return editors;
        },
        setData(resources, event) {
            const terminalResources = resources.filter(({ resource }) => resource.scheme === network_1.Schemas.vscodeTerminal);
            if (terminalResources.length) {
                event.dataTransfer?.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify(terminalResources.map(({ resource }) => resource.toString())));
            }
        }
    });
    // Register views
    const VIEW_CONTAINER = platform_2.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: terminal_3.TERMINAL_VIEW_ID,
        title: nls.localize2('terminal', "Terminal"),
        icon: terminalIcons_1.terminalViewIcon,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [terminal_3.TERMINAL_VIEW_ID, { mergeViewWithContainerWhenSingleView: true }]),
        storageId: terminal_3.TERMINAL_VIEW_ID,
        hideIfEmpty: true,
        order: 3,
    }, 1 /* ViewContainerLocation.Panel */, { doNotRegisterOpenCommand: true, isDefault: true });
    platform_2.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: terminal_3.TERMINAL_VIEW_ID,
            name: nls.localize2('terminal', "Terminal"),
            containerIcon: terminalIcons_1.terminalViewIcon,
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(terminalView_1.TerminalViewPane),
            openCommandActionDescriptor: {
                id: "workbench.action.terminal.toggleTerminal" /* TerminalCommandId.Toggle */,
                mnemonicTitle: nls.localize({ key: 'miToggleIntegratedTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal"),
                keybindings: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 91 /* KeyCode.Backquote */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 91 /* KeyCode.Backquote */ }
                },
                order: 3
            }
        }], VIEW_CONTAINER);
    // Register actions
    (0, terminalActions_1.registerTerminalActions)();
    function registerSendSequenceKeybinding(text, rule) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: "workbench.action.terminal.sendSequence" /* TerminalCommandId.SendSequence */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: rule.when || terminalContextKey_1.TerminalContextKeys.focus,
            primary: rule.primary,
            mac: rule.mac,
            linux: rule.linux,
            win: rule.win,
            handler: terminalActions_1.terminalSendSequenceCommand,
            args: { text }
        });
    }
    var Constants;
    (function (Constants) {
        /** The text representation of `^<letter>` is `'A'.charCodeAt(0) + 1`. */
        Constants[Constants["CtrlLetterOffset"] = 64] = "CtrlLetterOffset";
    })(Constants || (Constants = {}));
    // An extra Windows-only ctrl+v keybinding is used for pwsh that sends ctrl+v directly to the
    // shell, this gets handled by PSReadLine which properly handles multi-line pastes. This is
    // disabled in accessibility mode as PowerShell does not run PSReadLine when it detects a screen
    // reader. This works even when clipboard.readText is not supported.
    if (platform_1.isWindows) {
        registerSendSequenceKeybinding(String.fromCharCode('V'.charCodeAt(0) - 64 /* Constants.CtrlLetterOffset */), {
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
            primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */
        });
    }
    // Map certain keybindings in pwsh to unused keys which get handled by PSReadLine handlers in the
    // shell integration script. This allows keystrokes that cannot be sent via VT sequences to work.
    // See https://github.com/microsoft/terminal/issues/879#issuecomment-497775007
    registerSendSequenceKeybinding('\x1b[24~a', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 10 /* KeyCode.Space */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 10 /* KeyCode.Space */ }
    });
    registerSendSequenceKeybinding('\x1b[24~b', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
        primary: 512 /* KeyMod.Alt */ | 10 /* KeyCode.Space */
    });
    registerSendSequenceKeybinding('\x1b[24~c', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
        primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */
    });
    registerSendSequenceKeybinding('\x1b[24~d', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
        mac: { primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */ }
    });
    registerSendSequenceKeybinding('\x1b[24~e', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), terminalContextKey_1.TerminalContextKeys.terminalShellIntegrationEnabled, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate(), contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.shellIntegration.suggestEnabled" /* TerminalSettingId.ShellIntegrationSuggestEnabled */}`, true)),
        primary: 2048 /* KeyMod.CtrlCmd */ | 10 /* KeyCode.Space */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 10 /* KeyCode.Space */ }
    });
    // Always on pwsh keybindings
    registerSendSequenceKeybinding('\x1b[1;2H', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */)),
        mac: { primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */ }
    });
    // Map ctrl+alt+r -> ctrl+r when in accessibility mode due to default run recent command keybinding
    registerSendSequenceKeybinding('\x12', {
        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ }
    });
    // Map ctrl+alt+g -> ctrl+g due to default go to recent directory keybinding
    registerSendSequenceKeybinding('\x07', {
        when: terminalContextKey_1.TerminalContextKeys.focus,
        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 37 /* KeyCode.KeyG */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 512 /* KeyMod.Alt */ | 37 /* KeyCode.KeyG */ }
    });
    // send ctrl+c to the iPad when the terminal is focused and ctrl+c is pressed to kill the process (work around for #114009)
    if (platform_1.isIOS) {
        registerSendSequenceKeybinding(String.fromCharCode('C'.charCodeAt(0) - 64 /* Constants.CtrlLetterOffset */), {
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus),
            primary: 256 /* KeyMod.WinCtrl */ | 33 /* KeyCode.KeyC */
        });
    }
    // Delete word left: ctrl+w
    registerSendSequenceKeybinding(String.fromCharCode('W'.charCodeAt(0) - 64 /* Constants.CtrlLetterOffset */), {
        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
        mac: { primary: 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */ }
    });
    if (platform_1.isWindows) {
        // Delete word left: ctrl+h
        // Windows cmd.exe requires ^H to delete full word left
        registerSendSequenceKeybinding(String.fromCharCode('H'.charCodeAt(0) - 64 /* Constants.CtrlLetterOffset */), {
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "cmd" /* WindowsShellType.CommandPrompt */)),
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
        });
    }
    // Delete word right: alt+d [27, 100]
    registerSendSequenceKeybinding('\u001bd', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 20 /* KeyCode.Delete */,
        mac: { primary: 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */ }
    });
    // Delete to line start: ctrl+u
    registerSendSequenceKeybinding('\u0015', {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ }
    });
    // Move to line start: ctrl+A
    registerSendSequenceKeybinding(String.fromCharCode('A'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */ }
    });
    // Move to line end: ctrl+E
    registerSendSequenceKeybinding(String.fromCharCode('E'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */ }
    });
    // NUL: ctrl+shift+2
    registerSendSequenceKeybinding('\u0000', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 23 /* KeyCode.Digit2 */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 23 /* KeyCode.Digit2 */ }
    });
    // RS: ctrl+shift+6
    registerSendSequenceKeybinding('\u001e', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 27 /* KeyCode.Digit6 */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 27 /* KeyCode.Digit6 */ }
    });
    // US (Undo): ctrl+/
    registerSendSequenceKeybinding('\u001f', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 90 /* KeyCode.Slash */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 90 /* KeyCode.Slash */ }
    });
    (0, terminalCommands_1.setupTerminalCommands)();
    (0, terminalMenus_1.setupTerminalMenus)();
    (0, terminalColorRegistry_1.registerColors)();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbC9icm93c2VyL3Rlcm1pbmFsLmNvbnRyaWJ1dGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7OztJQXFEaEcsb0JBQW9CO0lBQ3BCLElBQUEsOEJBQWlCLEVBQUMsOEJBQW1CLEVBQUUsdUNBQWtCLG9DQUE0QixDQUFDO0lBQ3RGLElBQUEsOEJBQWlCLEVBQUMsMkJBQWdCLEVBQUUsaUNBQWUsb0NBQTRCLENBQUM7SUFDaEYsSUFBQSw4QkFBaUIsRUFBQyxpQ0FBc0IsRUFBRSw2Q0FBcUIsb0NBQTRCLENBQUM7SUFDNUYsSUFBQSw4QkFBaUIsRUFBQyxnQ0FBcUIsRUFBRSwyQ0FBb0Isb0NBQTRCLENBQUM7SUFDMUYsSUFBQSw4QkFBaUIsRUFBQyxtQ0FBd0IsRUFBRSxpREFBdUIsb0NBQTRCLENBQUM7SUFDaEcsSUFBQSw4QkFBaUIsRUFBQyxrQ0FBdUIsRUFBRSwrQ0FBc0Isb0NBQTRCLENBQUM7SUFFOUYsMEJBQTBCO0lBQzFCLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxtQkFBUSxDQUFDLEVBQUUsQ0FBdUIsd0JBQXFCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNuRyxNQUFNLGlCQUFpQixHQUFHLGtCQUFrQixDQUFDO0lBQzdDLG1CQUFtQixDQUFDLDJCQUEyQixDQUFDO1FBQy9DLElBQUksRUFBRSxpREFBMkI7UUFDakMsTUFBTSxFQUFFLGlEQUEyQixDQUFDLE1BQU07UUFDMUMsVUFBVSxFQUFFLGlCQUFpQjtRQUM3QixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsRUFBRSxzQ0FBc0MsQ0FBQztRQUNoRyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdB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