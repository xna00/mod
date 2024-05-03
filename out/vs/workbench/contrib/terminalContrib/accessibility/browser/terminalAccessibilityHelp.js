/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, strings_1, nls_1, accessibility_1, commands_1, contextkey_1, instantiation_1, keybinding_1, accessibilityConfiguration_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAccessibilityHelpProvider = exports.ClassName = void 0;
    var ClassName;
    (function (ClassName) {
        ClassName["Active"] = "active";
        ClassName["EditorTextArea"] = "textarea";
    })(ClassName || (exports.ClassName = ClassName = {}));
    let TerminalAccessibilityHelpProvider = class TerminalAccessibilityHelpProvider extends lifecycle_1.Disposable {
        onClose() {
            const expr = contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal-help" /* AccessibleViewProviderId.TerminalHelp */));
            if (expr?.evaluate(this._contextKeyService.getContext(null))) {
                this._commandService.executeCommand("workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */);
            }
            else {
                this._instance.focus();
            }
            this.dispose();
        }
        constructor(_instance, _xterm, _instantiationService, _keybindingService, _contextKeyService, _commandService, _accessibilityService, _configurationService) {
            super();
            this._instance = _instance;
            this._keybindingService = _keybindingService;
            this._contextKeyService = _contextKeyService;
            this._commandService = _commandService;
            this._accessibilityService = _accessibilityService;
            this._configurationService = _configurationService;
            this.id = "terminal-help" /* AccessibleViewProviderId.TerminalHelp */;
            this._hasShellIntegration = false;
            this.options = {
                type: "help" /* AccessibleViewType.Help */,
                readMoreUrl: 'https://code.visualstudio.com/docs/editor/accessibility#_terminal-accessibility'
            };
            this.verbositySettingKey = "accessibility.verbosity.terminal" /* AccessibilityVerbositySettingId.Terminal */;
            this._hasShellIntegration = _xterm.shellIntegration.status === 2 /* ShellIntegrationStatus.VSCode */;
        }
        _descriptionForCommand(commandId, msg, noKbMsg) {
            if (commandId === "workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */) {
                const kb = this._keybindingService.lookupKeybindings(commandId);
                // Run recent command has multiple keybindings. lookupKeybinding just returns the first one regardless of the when context.
                // Thus, we have to check if accessibility mode is enabled to determine which keybinding to use.
                const isScreenReaderOptimized = this._accessibilityService.isScreenReaderOptimized();
                if (isScreenReaderOptimized && kb[1]) {
                    (0, strings_1.format)(msg, kb[1].getAriaLabel());
                }
                else if (kb[0]) {
                    (0, strings_1.format)(msg, kb[0].getAriaLabel());
                }
                else {
                    return (0, strings_1.format)(noKbMsg, commandId);
                }
            }
            const kb = this._keybindingService.lookupKeybinding(commandId, this._contextKeyService)?.getAriaLabel();
            return !kb ? (0, strings_1.format)(noKbMsg, commandId) : (0, strings_1.format)(msg, kb);
        }
        provideContent() {
            const content = [];
            content.push(this._descriptionForCommand("workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */, (0, nls_1.localize)('focusAccessibleTerminalView', 'The Focus Accessible Terminal View ({0}) command enables screen readers to read terminal contents.'), (0, nls_1.localize)('focusAccessibleTerminalViewNoKb', 'The Focus Terminal Accessible View command enables screen readers to read terminal contents and is currently not triggerable by a keybinding.')));
            content.push((0, nls_1.localize)('preserveCursor', 'Customize the behavior of the cursor when toggling between the terminal and accessible view with `terminal.integrated.accessibleViewPreserveCursorPosition.`'));
            if (!this._configurationService.getValue("terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */)) {
                content.push((0, nls_1.localize)('focusViewOnExecution', 'Enable `terminal.integrated.accessibleViewFocusOnCommandExecution` to automatically focus the terminal accessible view when a command is executed in the terminal.'));
            }
            if (this._instance.shellType === "cmd" /* WindowsShellType.CommandPrompt */) {
                content.push((0, nls_1.localize)('commandPromptMigration', "Consider using powershell instead of command prompt for an improved experience"));
            }
            if (this._hasShellIntegration) {
                const shellIntegrationCommandList = [];
                shellIntegrationCommandList.push((0, nls_1.localize)('shellIntegration', "The terminal has a feature called shell integration that offers an enhanced experience and provides useful commands for screen readers such as:"));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.accessibleBufferGoToNextCommand" /* TerminalCommandId.AccessibleBufferGoToNextCommand */, (0, nls_1.localize)('goToNextCommand', 'Go to Next Command ({0}) in the accessible view'), (0, nls_1.localize)('goToNextCommandNoKb', 'Go to Next Command in the accessible view is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.accessibleBufferGoToPreviousCommand" /* TerminalCommandId.AccessibleBufferGoToPreviousCommand */, (0, nls_1.localize)('goToPreviousCommand', 'Go to Previous Command ({0}) in the accessible view'), (0, nls_1.localize)('goToPreviousCommandNoKb', 'Go to Previous Command in the accessible view is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("editor.action.accessibleViewGoToSymbol" /* AccessibilityCommandId.GoToSymbol */, (0, nls_1.localize)('goToSymbol', 'Go to Symbol ({0})'), (0, nls_1.localize)('goToSymbolNoKb', 'Go to symbol is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */, (0, nls_1.localize)('runRecentCommand', 'Run Recent Command ({0})'), (0, nls_1.localize)('runRecentCommandNoKb', 'Run Recent Command is currently not triggerable by a keybinding.')));
                shellIntegrationCommandList.push('- ' + this._descriptionForCommand("workbench.action.terminal.goToRecentDirectory" /* TerminalCommandId.GoToRecentDirectory */, (0, nls_1.localize)('goToRecentDirectory', 'Go to Recent Directory ({0})'), (0, nls_1.localize)('goToRecentDirectoryNoKb', 'Go to Recent Directory is currently not triggerable by a keybinding.')));
                content.push(shellIntegrationCommandList.join('\n'));
            }
            else {
                content.push(this._descriptionForCommand("workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */, (0, nls_1.localize)('goToRecentDirectoryNoShellIntegration', 'The Go to Recent Directory command ({0}) enables screen readers to easily navigate to a directory that has been used in the terminal.'), (0, nls_1.localize)('goToRecentDirectoryNoKbNoShellIntegration', 'The Go to Recent Directory command enables screen readers to easily navigate to a directory that has been used in the terminal and is currently not triggerable by a keybinding.')));
            }
            content.push(this._descriptionForCommand("workbench.action.terminal.openDetectedLink" /* TerminalCommandId.OpenDetectedLink */, (0, nls_1.localize)('openDetectedLink', 'The Open Detected Link ({0}) command enables screen readers to easily open links found in the terminal.'), (0, nls_1.localize)('openDetectedLinkNoKb', 'The Open Detected Link command enables screen readers to easily open links found in the terminal and is currently not triggerable by a keybinding.')));
            content.push(this._descriptionForCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */, (0, nls_1.localize)('newWithProfile', 'The Create New Terminal (With Profile) ({0}) command allows for easy terminal creation using a specific profile.'), (0, nls_1.localize)('newWithProfileNoKb', 'The Create New Terminal (With Profile) command allows for easy terminal creation using a specific profile and is currently not triggerable by a keybinding.')));
            content.push((0, nls_1.localize)('focusAfterRun', 'Configure what gets focused after running selected text in the terminal with `{0}`.', "terminal.integrated.focusAfterRun" /* TerminalSettingId.FocusAfterRun */));
            return content.join('\n\n');
        }
    };
    exports.TerminalAccessibilityHelpProvider = TerminalAccessibilityHelpProvider;
    exports.TerminalAccessibilityHelpProvider = TerminalAccessibilityHelpProvider = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, commands_1.ICommandService),
        __param(6, accessibility_1.IAccessibilityService),
        __param(7, configuration_1.IConfigurationService)
    ], TerminalAccessibilityHelpProvider);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxBY2Nlc3NpYmlsaXR5SGVscC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2NvbnRyaWIvdGVybWluYWxDb250cmliL2FjY2Vzc2liaWxpdHkvYnJvd3Nlci90ZXJtaW5hbEFjY2Vzc2liaWxpdHlIZWxwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQW1CaEcsSUFBa0IsU0FHakI7SUFIRCxXQUFrQixTQUFTO1FBQzFCLDhCQUFpQixDQUFBO1FBQ2pCLHdDQUEyQixDQUFBO0lBQzVCLENBQUMsRUFIaUIsU0FBUyx5QkFBVCxTQUFTLFFBRzFCO0lBRU0sSUFBTSxpQ0FBaUMsR0FBdkMsTUFBTSxpQ0FBa0MsU0FBUSxzQkFBVTtRQUdoRSxPQUFPO1lBQ04sTUFBTSxJQUFJLEdBQUcsMkJBQWMsQ0FBQyxHQUFHLENBQUMsa0RBQXFCLEVBQUUsMkJBQWMsQ0FBQyxNQUFNLENBQUMsNERBQStCLENBQUMsR0FBRyw4REFBd0MsQ0FBQyxDQUFDO1lBQzFKLElBQUksSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxjQUFjLGlHQUF5QyxDQUFDO1lBQzlFLENBQUM7aUJBQU0sQ0FBQztnQkFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3hCLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsQ0FBQztRQU9ELFlBQ2tCLFNBQTZHLEVBQzlILE1BQWdGLEVBQ3pELHFCQUE0QyxFQUMvQyxrQkFBdUQsRUFDdkQsa0JBQXVELEVBQzFELGVBQWlELEVBQzNDLHFCQUE2RCxFQUM3RCxxQkFBNkQ7WUFFcEYsS0FBSyxFQUFFLENBQUM7WUFUUyxjQUFTLEdBQVQsU0FBUyxDQUFvRztZQUd6Rix1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBQ3RDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDekMsb0JBQWUsR0FBZixlQUFlLENBQWlCO1lBQzFCLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDNUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQXpCckYsT0FBRSwrREFBeUM7WUFDMUIseUJBQW9CLEdBQVksS0FBSyxDQUFDO1lBVXZELFlBQU8sR0FBMkI7Z0JBQ2pDLElBQUksc0NBQXlCO2dCQUM3QixXQUFXLEVBQUUsaUZBQWlGO2FBQzlGLENBQUM7WUFDRix3QkFBbUIscUZBQTRDO1lBYTlELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSwwQ0FBa0MsQ0FBQztRQUM5RixDQUFDO1FBRU8sc0JBQXNCLENBQUMsU0FBaUIsRUFBRSxHQUFXLEVBQUUsT0FBZTtZQUM3RSxJQUFJLFNBQVMsMEZBQXVDLEVBQUUsQ0FBQztnQkFDdEQsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNoRSwySEFBMkg7Z0JBQzNILGdHQUFnRztnQkFDaEcsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDckYsSUFBSSx1QkFBdUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztvQkFDdEMsSUFBQSxnQkFBTSxFQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO29CQUNsQixJQUFBLGdCQUFNLEVBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxJQUFBLGdCQUFNLEVBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0YsQ0FBQztZQUNELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUM7WUFDeEcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBQSxnQkFBTSxFQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSxnQkFBTSxFQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMzRCxDQUFDO1FBRUQsY0FBYztZQUNiLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0Isa0dBQTBDLElBQUEsY0FBUSxFQUFDLDZCQUE2QixFQUFFLG9HQUFvRyxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsaUNBQWlDLEVBQUUsK0lBQStJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaGEsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSw4SkFBOEosQ0FBQyxDQUFDLENBQUM7WUFDek0sSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLDJIQUF5RCxFQUFFLENBQUM7Z0JBQ25HLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsb0tBQW9LLENBQUMsQ0FBQyxDQUFDO1lBQ3ROLENBQUM7WUFDRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUywrQ0FBbUMsRUFBRSxDQUFDO2dCQUNqRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUEsY0FBUSxFQUFDLHdCQUF3QixFQUFFLGdGQUFnRixDQUFDLENBQUMsQ0FBQztZQUNwSSxDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSwyQkFBMkIsR0FBRyxFQUFFLENBQUM7Z0JBQ3ZDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFBLGNBQVEsRUFBQyxrQkFBa0IsRUFBRSxpSkFBaUosQ0FBQyxDQUFDLENBQUM7Z0JBQ2xOLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixzSEFBb0QsSUFBQSxjQUFRLEVBQUMsaUJBQWlCLEVBQUUsaURBQWlELENBQUMsRUFBRSxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSx5RkFBeUYsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcFUsMkJBQTJCLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsc0JBQXNCLDhIQUF3RCxJQUFBLGNBQVEsRUFBQyxxQkFBcUIsRUFBRSxxREFBcUQsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLHlCQUF5QixFQUFFLDZGQUE2RixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4ViwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsbUZBQW9DLElBQUEsY0FBUSxFQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLGdCQUFnQixFQUFFLDREQUE0RCxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoUCwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxzQkFBc0Isd0ZBQXFDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLDBCQUEwQixDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsa0VBQWtFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3pRLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLHNCQUFzQiw4RkFBd0MsSUFBQSxjQUFRLEVBQUMscUJBQXFCLEVBQUUsOEJBQThCLENBQUMsRUFBRSxJQUFBLGNBQVEsRUFBQyx5QkFBeUIsRUFBRSxzRUFBc0UsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMVIsT0FBTyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLHdGQUFxQyxJQUFBLGNBQVEsRUFBQyx1Q0FBdUMsRUFBRSx1SUFBdUksQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLDJDQUEyQyxFQUFFLGtMQUFrTCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RmLENBQUM7WUFDRCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0Isd0ZBQXFDLElBQUEsY0FBUSxFQUFDLGtCQUFrQixFQUFFLHlHQUF5RyxDQUFDLEVBQUUsSUFBQSxjQUFRLEVBQUMsc0JBQXNCLEVBQUUsb0pBQW9KLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL1ksT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLG9GQUFtQyxJQUFBLGNBQVEsRUFBQyxnQkFBZ0IsRUFBRSxrSEFBa0gsQ0FBQyxFQUFFLElBQUEsY0FBUSxFQUFDLG9CQUFvQixFQUFFLDZKQUE2SixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBQSxjQUFRLEVBQUMsZUFBZSxFQUFFLHFGQUFxRiw0RUFBa0MsQ0FBQyxDQUFDO1lBQ2hLLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3QixDQUFDO0tBQ0QsQ0FBQTtJQTdFWSw4RUFBaUM7Z0RBQWpDLGlDQUFpQztRQXFCM0MsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLCtCQUFrQixDQUFBO1FBQ2xCLFdBQUEsK0JBQWtCLENBQUE7UUFDbEIsV0FBQSwwQkFBZSxDQUFBO1FBQ2YsV0FBQSxxQ0FBcUIsQ0FBQTtRQUNyQixXQUFBLHFDQUFxQixDQUFBO09BMUJYLGlDQUFpQyxDQTZFN0MifQ==