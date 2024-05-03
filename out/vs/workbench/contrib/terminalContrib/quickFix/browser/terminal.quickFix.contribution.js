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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFix", "vs/workbench/contrib/terminalContrib/quickFix/browser/quickFixAddon", "vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixBuiltinActions", "vs/workbench/contrib/terminalContrib/quickFix/browser/terminalQuickFixService", "vs/css!./media/terminalQuickFix"], function (require, exports, lifecycle_1, nls_1, extensions_1, instantiation_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, quickFix_1, quickFixAddon_1, terminalQuickFixBuiltinActions_1, terminalQuickFixService_1) {
    "use strict";
    var TerminalQuickFixContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    // Services
    (0, extensions_1.registerSingleton)(quickFix_1.ITerminalQuickFixService, terminalQuickFixService_1.TerminalQuickFixService, 1 /* InstantiationType.Delayed */);
    // Contributions
    let TerminalQuickFixContribution = class TerminalQuickFixContribution extends lifecycle_1.DisposableStore {
        static { TerminalQuickFixContribution_1 = this; }
        static { this.ID = 'quickFix'; }
        static get(instance) {
            return instance.getContribution(TerminalQuickFixContribution_1.ID);
        }
        get addon() { return this._addon; }
        constructor(_instance, processManager, widgetManager, _instantiationService) {
            super();
            this._instance = _instance;
            this._instantiationService = _instantiationService;
        }
        xtermReady(xterm) {
            // Create addon
            this._addon = this._instantiationService.createInstance(quickFixAddon_1.TerminalQuickFixAddon, undefined, this._instance.capabilities);
            xterm.raw.loadAddon(this._addon);
            // Hook up listeners
            this.add(this._addon.onDidRequestRerunCommand((e) => this._instance.runCommand(e.command, e.shouldExecute || false)));
            // Register quick fixes
            for (const actionOption of [
                (0, terminalQuickFixBuiltinActions_1.gitTwoDashes)(),
                (0, terminalQuickFixBuiltinActions_1.gitPull)(),
                (0, terminalQuickFixBuiltinActions_1.freePort)((port, command) => this._instance.freePortKillProcess(port, command)),
                (0, terminalQuickFixBuiltinActions_1.gitSimilar)(),
                (0, terminalQuickFixBuiltinActions_1.gitPushSetUpstream)(),
                (0, terminalQuickFixBuiltinActions_1.gitCreatePr)(),
                (0, terminalQuickFixBuiltinActions_1.pwshUnixCommandNotFoundError)(),
                (0, terminalQuickFixBuiltinActions_1.pwshGeneralError)()
            ]) {
                this._addon.registerCommandFinishedListener(actionOption);
            }
        }
    };
    TerminalQuickFixContribution = TerminalQuickFixContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], TerminalQuickFixContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalQuickFixContribution.ID, TerminalQuickFixContribution);
    // Actions
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.showQuickFixes" /* TerminalCommandId.ShowQuickFixes */,
        title: (0, nls_1.localize2)('workbench.action.terminal.showQuickFixes', 'Show Terminal Quick Fixes'),
        precondition: terminalContextKey_1.TerminalContextKeys.focus,
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 89 /* KeyCode.Period */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        run: (activeInstance) => TerminalQuickFixContribution.get(activeInstance)?.addon?.showMenu()
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwucXVpY2tGaXguY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvcXVpY2tGaXgvYnJvd3Nlci90ZXJtaW5hbC5xdWlja0ZpeC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBcUJoRyxXQUFXO0lBQ1gsSUFBQSw4QkFBaUIsRUFBQyxtQ0FBd0IsRUFBRSxpREFBdUIsb0NBQTRCLENBQUM7SUFFaEcsZ0JBQWdCO0lBQ2hCLElBQU0sNEJBQTRCLEdBQWxDLE1BQU0sNEJBQTZCLFNBQVEsMkJBQWU7O2lCQUN6QyxPQUFFLEdBQUcsVUFBVSxBQUFiLENBQWM7UUFFaEMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUEyQjtZQUNyQyxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQStCLDhCQUE0QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2hHLENBQUM7UUFHRCxJQUFJLEtBQUssS0FBd0MsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUV0RSxZQUNrQixTQUE0QixFQUM3QyxjQUF1QyxFQUN2QyxhQUFvQyxFQUNJLHFCQUE0QztZQUVwRixLQUFLLEVBQUUsQ0FBQztZQUxTLGNBQVMsR0FBVCxTQUFTLENBQW1CO1lBR0wsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtRQUdyRixDQUFDO1FBRUQsVUFBVSxDQUFDLEtBQWlEO1lBQzNELGVBQWU7WUFDZixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMscUNBQXFCLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDdkgsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRWpDLG9CQUFvQjtZQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdEgsdUJBQXVCO1lBQ3ZCLEtBQUssTUFBTSxZQUFZLElBQUk7Z0JBQzFCLElBQUEsNkNBQVksR0FBRTtnQkFDZCxJQUFBLHdDQUFPLEdBQUU7Z0JBQ1QsSUFBQSx5Q0FBUSxFQUFDLENBQUMsSUFBWSxFQUFFLE9BQWUsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzlGLElBQUEsMkNBQVUsR0FBRTtnQkFDWixJQUFBLG1EQUFrQixHQUFFO2dCQUNwQixJQUFBLDRDQUFXLEdBQUU7Z0JBQ2IsSUFBQSw2REFBNEIsR0FBRTtnQkFDOUIsSUFBQSxpREFBZ0IsR0FBRTthQUNsQixFQUFFLENBQUM7Z0JBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzRCxDQUFDO1FBQ0YsQ0FBQzs7SUF4Q0ksNEJBQTRCO1FBYy9CLFdBQUEscUNBQXFCLENBQUE7T0FkbEIsNEJBQTRCLENBeUNqQztJQUNELElBQUEsaURBQTRCLEVBQUMsNEJBQTRCLENBQUMsRUFBRSxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFFNUYsVUFBVTtJQUNWLElBQUEsOENBQTRCLEVBQUM7UUFDNUIsRUFBRSxtRkFBa0M7UUFDcEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDBDQUEwQyxFQUFFLDJCQUEyQixDQUFDO1FBQ3pGLFlBQVksRUFBRSx3Q0FBbUIsQ0FBQyxLQUFLO1FBQ3ZDLFVBQVUsRUFBRTtZQUNYLE9BQU8sRUFBRSxtREFBK0I7WUFDeEMsTUFBTSw2Q0FBbUM7U0FDekM7UUFDRCxHQUFHLEVBQUUsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFO0tBQzVGLENBQUMsQ0FBQyJ9