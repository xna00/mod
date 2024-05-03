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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/accessibility/browser/accessibleView", "vs/workbench/contrib/accessibility/browser/accessibleViewActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/accessibility/browser/bufferContentTracker", "vs/workbench/contrib/terminalContrib/accessibility/browser/terminalAccessibilityHelp", "vs/workbench/contrib/terminalContrib/accessibility/browser/textAreaSyncAddon", "vs/editor/common/core/position", "vs/workbench/contrib/terminalContrib/accessibility/browser/terminalAccessibleBufferProvider", "vs/platform/configuration/common/configuration", "vs/base/common/event"], function (require, exports, lifecycle_1, nls_1, accessibility_1, actions_1, contextkey_1, instantiation_1, accessibilityConfiguration_1, accessibleView_1, accessibleViewActions_1, terminal_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, bufferContentTracker_1, terminalAccessibilityHelp_1, textAreaSyncAddon_1, position_1, terminalAccessibleBufferProvider_1, configuration_1, event_1) {
    "use strict";
    var TextAreaSyncContribution_1, TerminalAccessibleViewContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalAccessibilityHelpContribution = exports.TerminalAccessibleViewContribution = void 0;
    let TextAreaSyncContribution = class TextAreaSyncContribution extends lifecycle_1.DisposableStore {
        static { TextAreaSyncContribution_1 = this; }
        static { this.ID = 'terminal.textAreaSync'; }
        static get(instance) {
            return instance.getContribution(TextAreaSyncContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _instantiationService) {
            super();
            this._instance = _instance;
            this._instantiationService = _instantiationService;
        }
        layout(xterm) {
            if (this._addon) {
                return;
            }
            this._addon = this.add(this._instantiationService.createInstance(textAreaSyncAddon_1.TextAreaSyncAddon, this._instance.capabilities));
            xterm.raw.loadAddon(this._addon);
            this._addon.activate(xterm.raw);
        }
    };
    TextAreaSyncContribution = TextAreaSyncContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], TextAreaSyncContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TextAreaSyncContribution.ID, TextAreaSyncContribution);
    let TerminalAccessibleViewContribution = class TerminalAccessibleViewContribution extends lifecycle_1.Disposable {
        static { TerminalAccessibleViewContribution_1 = this; }
        static { this.ID = 'terminal.accessibleBufferProvider'; }
        static get(instance) {
            return instance.getContribution(TerminalAccessibleViewContribution_1.ID);
        }
        constructor(_instance, processManager, widgetManager, _accessibleViewService, _instantiationService, _terminalService, _configurationService, _contextKeyService) {
            super();
            this._instance = _instance;
            this._accessibleViewService = _accessibleViewService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._configurationService = _configurationService;
            this._contextKeyService = _contextKeyService;
            this._onDidRunCommand = new lifecycle_1.MutableDisposable();
            this._register(accessibleViewActions_1.AccessibleViewAction.addImplementation(90, 'terminal', () => {
                if (this._terminalService.activeInstance !== this._instance) {
                    return false;
                }
                this.show();
                return true;
            }, terminalContextKey_1.TerminalContextKeys.focus));
            this._register(_instance.onDidExecuteText(() => {
                const focusAfterRun = _configurationService.getValue("terminal.integrated.focusAfterRun" /* TerminalSettingId.FocusAfterRun */);
                if (focusAfterRun === 'terminal') {
                    _instance.focus(true);
                }
                else if (focusAfterRun === 'accessible-buffer') {
                    this.show();
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */)) {
                    this._updateCommandExecutedListener();
                }
            }));
            this._register(this._instance.capabilities.onDidAddCapability(e => {
                if (e.capability.type === 2 /* TerminalCapability.CommandDetection */) {
                    this._updateCommandExecutedListener();
                }
            }));
        }
        xtermReady(xterm) {
            const addon = this._instantiationService.createInstance(textAreaSyncAddon_1.TextAreaSyncAddon, this._instance.capabilities);
            xterm.raw.loadAddon(addon);
            addon.activate(xterm.raw);
            this._xterm = xterm;
            this._register(this._xterm.raw.onWriteParsed(async () => {
                if (this._terminalService.activeInstance !== this._instance) {
                    return;
                }
                if (this._isTerminalAccessibleViewOpen() && this._xterm.raw.buffer.active.baseY === 0) {
                    this.show();
                }
            }));
            const onRequestUpdateEditor = event_1.Event.latch(this._xterm.raw.onScroll);
            this._register(onRequestUpdateEditor(() => {
                if (this._terminalService.activeInstance !== this._instance) {
                    return;
                }
                if (this._isTerminalAccessibleViewOpen()) {
                    this.show();
                }
            }));
        }
        _updateCommandExecutedListener() {
            if (!this._instance.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                return;
            }
            if (!this._configurationService.getValue("terminal.integrated.accessibleViewFocusOnCommandExecution" /* TerminalSettingId.AccessibleViewFocusOnCommandExecution */)) {
                this._onDidRunCommand.clear();
                return;
            }
            else if (this._onDidRunCommand.value) {
                return;
            }
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            this._onDidRunCommand.value = this._register(capability.onCommandExecuted(() => {
                if (this._instance.hasFocus) {
                    this.show();
                }
            }));
        }
        _isTerminalAccessibleViewOpen() {
            return accessibilityConfiguration_1.accessibleViewCurrentProviderId.getValue(this._contextKeyService) === "terminal" /* AccessibleViewProviderId.Terminal */;
        }
        show() {
            if (!this._xterm) {
                return;
            }
            if (!this._bufferTracker) {
                this._bufferTracker = this._register(this._instantiationService.createInstance(bufferContentTracker_1.BufferContentTracker, this._xterm));
            }
            if (!this._bufferProvider) {
                this._bufferProvider = this._register(this._instantiationService.createInstance(terminalAccessibleBufferProvider_1.TerminalAccessibleBufferProvider, this._instance, this._bufferTracker, () => {
                    return this._register(this._instantiationService.createInstance(terminalAccessibilityHelp_1.TerminalAccessibilityHelpProvider, this._instance, this._xterm)).provideContent();
                }));
            }
            const position = this._configurationService.getValue("terminal.integrated.accessibleViewPreserveCursorPosition" /* TerminalSettingId.AccessibleViewPreserveCursorPosition */) ? this._accessibleViewService.getPosition("terminal" /* AccessibleViewProviderId.Terminal */) : undefined;
            this._accessibleViewService.show(this._bufferProvider, position);
        }
        navigateToCommand(type) {
            const currentLine = this._accessibleViewService.getPosition("terminal" /* AccessibleViewProviderId.Terminal */)?.lineNumber;
            const commands = this._getCommandsWithEditorLine();
            if (!commands?.length || !currentLine) {
                return;
            }
            const filteredCommands = type === "previous" /* NavigationType.Previous */ ? commands.filter(c => c.lineNumber < currentLine).sort((a, b) => b.lineNumber - a.lineNumber) : commands.filter(c => c.lineNumber > currentLine).sort((a, b) => a.lineNumber - b.lineNumber);
            if (!filteredCommands.length) {
                return;
            }
            this._accessibleViewService.setPosition(new position_1.Position(filteredCommands[0].lineNumber, 1), true);
        }
        _getCommandsWithEditorLine() {
            const capability = this._instance.capabilities.get(2 /* TerminalCapability.CommandDetection */);
            const commands = capability?.commands;
            const currentCommand = capability?.currentCommand;
            if (!commands?.length) {
                return;
            }
            const result = [];
            for (const command of commands) {
                const lineNumber = this._getEditorLineForCommand(command);
                if (!lineNumber) {
                    continue;
                }
                result.push({ command, lineNumber });
            }
            if (currentCommand) {
                const lineNumber = this._getEditorLineForCommand(currentCommand);
                if (!!lineNumber) {
                    result.push({ command: currentCommand, lineNumber });
                }
            }
            return result;
        }
        _getEditorLineForCommand(command) {
            if (!this._bufferTracker) {
                return;
            }
            let line;
            if ('marker' in command) {
                line = command.marker?.line;
            }
            else if ('commandStartMarker' in command) {
                line = command.commandStartMarker?.line;
            }
            if (line === undefined || line < 0) {
                return;
            }
            line = this._bufferTracker.bufferToEditorLineMapping.get(line);
            if (line === undefined) {
                return;
            }
            return line + 1;
        }
    };
    exports.TerminalAccessibleViewContribution = TerminalAccessibleViewContribution;
    exports.TerminalAccessibleViewContribution = TerminalAccessibleViewContribution = TerminalAccessibleViewContribution_1 = __decorate([
        __param(3, accessibleView_1.IAccessibleViewService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, terminal_1.ITerminalService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, contextkey_1.IContextKeyService)
    ], TerminalAccessibleViewContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalAccessibleViewContribution.ID, TerminalAccessibleViewContribution);
    class TerminalAccessibilityHelpContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._register(accessibleViewActions_1.AccessibilityHelpAction.addImplementation(105, 'terminal', async (accessor) => {
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const terminalService = accessor.get(terminal_1.ITerminalService);
                const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
                const instance = await terminalService.getActiveOrCreateInstance();
                await terminalService.revealActiveTerminal();
                const terminal = instance?.xterm;
                if (!terminal) {
                    return;
                }
                accessibleViewService.show(instantiationService.createInstance(terminalAccessibilityHelp_1.TerminalAccessibilityHelpProvider, instance, terminal));
            }, contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */)))));
        }
    }
    exports.TerminalAccessibilityHelpContribution = TerminalAccessibilityHelpContribution;
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalAccessibilityHelpContribution.ID, TerminalAccessibilityHelpContribution);
    class FocusAccessibleBufferAction extends actions_1.Action2 {
        constructor() {
            super({
                id: "workbench.action.terminal.focusAccessibleBuffer" /* TerminalCommandId.FocusAccessibleBuffer */,
                title: (0, nls_1.localize2)('workbench.action.terminal.focusAccessibleBuffer', "Focus Accessible Terminal View"),
                precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                keybinding: [
                    {
                        primary: 512 /* KeyMod.Alt */ | 60 /* KeyCode.F2 */,
                        secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */],
                        linux: {
                            primary: 512 /* KeyMod.Alt */ | 60 /* KeyCode.F2 */ | 1024 /* KeyMod.Shift */,
                            secondary: [2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
                        },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.and(accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED, terminalContextKey_1.TerminalContextKeys.focus)
                    }
                ]
            });
        }
        async run(accessor, ...args) {
            const terminalService = accessor.get(terminal_1.ITerminalService);
            const terminal = await terminalService.getActiveOrCreateInstance();
            if (!terminal?.xterm) {
                return;
            }
            TerminalAccessibleViewContribution.get(terminal)?.show();
        }
    }
    (0, actions_1.registerAction2)(FocusAccessibleBufferAction);
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.accessibleBufferGoToNextCommand" /* TerminalCommandId.AccessibleBufferGoToNextCommand */,
        title: (0, nls_1.localize2)('workbench.action.terminal.accessibleBufferGoToNextCommand', "Accessible Buffer Go to Next Command"),
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated, contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: [
            {
                primary: 512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 2
            }
        ],
        run: async (c) => {
            const instance = await c.service.activeInstance;
            if (!instance) {
                return;
            }
            await TerminalAccessibleViewContribution.get(instance)?.navigateToCommand("next" /* NavigationType.Next */);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.accessibleBufferGoToPreviousCommand" /* TerminalCommandId.AccessibleBufferGoToPreviousCommand */,
        title: (0, nls_1.localize2)('workbench.action.terminal.accessibleBufferGoToPreviousCommand', "Accessible Buffer Go to Previous Command"),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: [
            {
                primary: 512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */,
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 2
            }
        ],
        run: async (c) => {
            const instance = await c.service.activeInstance;
            if (!instance) {
                return;
            }
            await TerminalAccessibleViewContribution.get(instance)?.navigateToCommand("previous" /* NavigationType.Previous */);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.scrollToBottomAccessibleView" /* TerminalCommandId.ScrollToBottomAccessibleView */,
        title: (0, nls_1.localize2)('workbench.action.terminal.scrollToBottomAccessibleView', 'Scroll to Accessible View Bottom'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
            linux: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */ },
            when: accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        run: (c, accessor) => {
            const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
            const lastPosition = accessibleViewService.getLastPosition();
            if (!lastPosition) {
                return;
            }
            accessibleViewService.setPosition(lastPosition, true);
        }
    });
    (0, terminalActions_1.registerTerminalAction)({
        id: "workbench.action.terminal.scrollToTopAccessibleView" /* TerminalCommandId.ScrollToTopAccessibleView */,
        title: (0, nls_1.localize2)('workbench.action.terminal.scrollToTopAccessibleView', 'Scroll to Accessible View Top'),
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
            linux: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */ },
            when: accessibilityConfiguration_1.accessibleViewCurrentProviderId.isEqualTo("terminal" /* AccessibleViewProviderId.Terminal */),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        run: (c, accessor) => {
            const accessibleViewService = accessor.get(accessibleView_1.IAccessibleViewService);
            accessibleViewService.setPosition({ lineNumber: 1, column: 1 }, true);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuYWNjZXNzaWJpbGl0eS5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9hY2Nlc3NpYmlsaXR5L2Jyb3dzZXIvdGVybWluYWwuYWNjZXNzaWJpbGl0eS5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCaEcsSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSwyQkFBZTs7aUJBQ3JDLE9BQUUsR0FBRyx1QkFBdUIsQUFBMUIsQ0FBMkI7UUFDN0MsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUEyQjtZQUNyQyxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQTJCLDBCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFFRCxZQUNrQixTQUE0QixFQUM3QyxjQUF1QyxFQUN2QyxhQUFvQyxFQUNJLHFCQUE0QztZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUxTLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBR0wsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtRQUdyRixDQUFDO1FBQ0QsTUFBTSxDQUFDLEtBQXlDO1lBQy9DLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNqQixPQUFPO1lBQ1IsQ0FBQztZQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFDLHFDQUFpQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNsSCxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakMs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