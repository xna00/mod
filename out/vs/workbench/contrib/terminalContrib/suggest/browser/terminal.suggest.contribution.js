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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminalContrib/suggest/browser/terminalSuggestAddon", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/nls", "vs/platform/configuration/common/configuration"], function (require, exports, dom, lifecycle_1, instantiation_1, terminalExtensions_1, terminalSuggestAddon_1, terminal_1, contextkey_1, terminalContextKey_1, terminalActions_1, nls_1, configuration_1) {
    "use strict";
    var TerminalSuggestContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalSuggestContribution = class TerminalSuggestContribution extends lifecycle_1.DisposableStore {
        static { TerminalSuggestContribution_1 = this; }
        static { this.ID = 'terminal.suggest'; }
        static get(instance) {
            return instance.getContribution(TerminalSuggestContribution_1.ID);
        }
        get addon() { return this._addon.value; }
        constructor(_instance, _processManager, widgetManager, _contextKeyService, _configurationService, _instantiationService) {
            super();
            this._instance = _instance;
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._instantiationService = _instantiationService;
            this._addon = new lifecycle_1.MutableDisposable();
            this._terminalSuggestWidgetContextKeys = new Set(terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible.key);
            this.add((0, lifecycle_1.toDisposable)(() => this._addon?.dispose()));
            this._terminalSuggestWidgetVisibleContextKey = terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible.bindTo(this._contextKeyService);
        }
        xtermOpen(xterm) {
            this._loadSuggestAddon(xterm.raw);
            this.add(this._contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(this._terminalSuggestWidgetContextKeys)) {
                    this._loadSuggestAddon(xterm.raw);
                }
            }));
            this.add(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.sendKeybindingsToShell" /* TerminalSettingId.SendKeybindingsToShell */)) {
                    this._loadSuggestAddon(xterm.raw);
                }
            }));
        }
        _loadSuggestAddon(xterm) {
            const sendingKeybindingsToShell = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).sendKeybindingsToShell;
            if (sendingKeybindingsToShell) {
                this._addon.dispose();
                return;
            }
            if (this._terminalSuggestWidgetVisibleContextKey) {
                this._addon.value = this._instantiationService.createInstance(terminalSuggestAddon_1.SuggestAddon, this._terminalSuggestWidgetVisibleContextKey);
                xterm.loadAddon(this._addon.value);
                this._addon.value.setPanel(dom.findParentWithClass(xterm.element, 'panel'));
                this._addon.value.setScreen(xterm.element.querySelector('.xterm-screen'));
                this.add(this._instance.onDidBlur(() => this._addon.value?.hideSuggestWidget()));
                this.add(this._addon.value.onAcceptedCompletion(async (text) => {
                    this._instance.focus();
                    this._instance.sendText(text, false);
                }));
                this.add(this._instance.onDidSendText((text) => {
                    this._addon.value?.handleNonXtermData(text);
                }));
            }
        }
    };
    TerminalSuggestContribution = TerminalSuggestContribution_1 = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], TerminalSuggestContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalSuggestContribution.ID, TerminalSuggestContribution);
    // Actions
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectPrevSuggestion" /* TerminalCommandId.SelectPrevSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectPrevSuggestion', 'Select the Previous Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Up is bound to other workbench keybindings that this needs to beat
            primary: 16 /* KeyCode.UpArrow */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectPreviousSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectPrevPageSuggestion" /* TerminalCommandId.SelectPrevPageSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectPrevPageSuggestion', 'Select the Previous Page Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Up is bound to other workbench keybindings that this needs to beat
            primary: 11 /* KeyCode.PageUp */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectPreviousPageSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectNextSuggestion" /* TerminalCommandId.SelectNextSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectNextSuggestion', 'Select the Next Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Down is bound to other workbench keybindings that this needs to beat
            primary: 18 /* KeyCode.DownArrow */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectNextSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.selectNextPageSuggestion" /* TerminalCommandId.SelectNextPageSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.selectNextPageSuggestion', 'Select the Next Page Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            // Down is bound to other workbench keybindings that this needs to beat
            primary: 12 /* KeyCode.PageDown */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.selectNextPageSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.acceptSelectedSuggestion" /* TerminalCommandId.AcceptSelectedSuggestion */,
        title: (0, nls_1.localize2)('workbench.action.terminal.acceptSelectedSuggestion', 'Accept Selected Suggestion'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            primary: 3 /* KeyCode.Enter */,
            secondary: [2 /* KeyCode.Tab */],
            // Enter is bound to other workbench keybindings that this needs to beat
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.acceptSelectedSuggestion()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.hideSuggestWidget" /* TerminalCommandId.HideSuggestWidget */,
        title: (0, nls_1.localize2)('workbench.action.terminal.hideSuggestWidget', 'Hide Suggest Widget'),
        f1: false,
        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.suggestWidgetVisible),
        keybinding: {
            primary: 9 /* KeyCode.Escape */,
            // Escape is bound to other workbench keybindings that this needs to beat
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1
        },
        run: (activeInstance) => TerminalSuggestContribution.get(activeInstance)?.addon?.hideSuggestWidget()
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuc3VnZ2VzdC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9zdWdnZXN0L2Jyb3dzZXIvdGVybWluYWwuc3VnZ2VzdC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLDJCQUFlOztpQkFDeEMsT0FBRSxHQUFHLGtCQUFrQixBQUFyQixDQUFzQjtRQUV4QyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQTJCO1lBQ3JDLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBOEIsNkJBQTJCLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUYsQ0FBQztRQU1ELElBQUksS0FBSyxLQUErQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUVuRSxZQUNrQixTQUE0QixFQUM3QyxlQUF3QyxFQUN4QyxhQUFvQyxFQUNoQixrQkFBdUQsRUFDcEQscUJBQTZELEVBQzdELHFCQUE2RDtZQUVwRixLQUFLLEVBQUUsQ0FBQztZQVBTLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBR1IsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQUNuQywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQzVDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFaN0UsV0FBTSxHQUFvQyxJQUFJLDZCQUFpQixFQUFFLENBQUM7WUFDbEUsc0NBQWlDLEdBQXlCLElBQUksR0FBRyxDQUFDLHdDQUFtQixDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBY3ZILElBQUksQ0FBQyxHQUFHLENBQUMsSUFBQSx3QkFB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