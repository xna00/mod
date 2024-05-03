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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/search/browser/searchActionsFind", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminalContrib/find/browser/terminalFindWidget"], function (require, exports, lazy_1, lifecycle_1, nls_1, contextkey_1, instantiation_1, searchActionsFind_1, terminal_1, terminalActions_1, terminalExtensions_1, terminalContextKey_1, terminalFindWidget_1) {
    "use strict";
    var TerminalFindContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalFindContribution = class TerminalFindContribution extends lifecycle_1.Disposable {
        static { TerminalFindContribution_1 = this; }
        static { this.ID = 'terminal.find'; }
        static get(instance) {
            return instance.getContribution(TerminalFindContribution_1.ID);
        }
        get findWidget() { return this._findWidget.value; }
        constructor(_instance, processManager, widgetManager, instantiationService, terminalService) {
            super();
            this._instance = _instance;
            this._findWidget = new lazy_1.Lazy(() => {
                const findWidget = instantiationService.createInstance(terminalFindWidget_1.TerminalFindWidget, this._instance);
                // Track focus and set state so we can force the scroll bar to be visible
                findWidget.focusTracker.onDidFocus(() => {
                    TerminalFindContribution_1.activeFindWidget = this;
                    this._instance.forceScrollbarVisibility();
                    if (!(0, terminal_1.isDetachedTerminalInstance)(this._instance)) {
                        terminalService.setActiveInstance(this._instance);
                    }
                });
                findWidget.focusTracker.onDidBlur(() => {
                    TerminalFindContribution_1.activeFindWidget = undefined;
                    this._instance.resetScrollbarVisibility();
                });
                if (!this._instance.domElement) {
                    throw new Error('FindWidget expected terminal DOM to be initialized');
                }
                this._instance.domElement?.appendChild(findWidget.getDomNode());
                if (this._lastLayoutDimensions) {
                    findWidget.layout(this._lastLayoutDimensions.width);
                }
                return findWidget;
            });
        }
        layout(_xterm, dimension) {
            this._lastLayoutDimensions = dimension;
            this._findWidget.rawValue?.layout(dimension.width);
        }
        xtermReady(xterm) {
            this._register(xterm.onDidChangeFindResults(() => this._findWidget.rawValue?.updateResultCount()));
        }
        dispose() {
            if (TerminalFindContribution_1.activeFindWidget === this) {
                TerminalFindContribution_1.activeFindWidget = undefined;
            }
            super.dispose();
            this._findWidget.rawValue?.dispose();
        }
    };
    TerminalFindContribution = TerminalFindContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, terminal_1.ITerminalService)
    ], TerminalFindContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalFindContribution.ID, TerminalFindContribution, true);
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.focusFind" /* TerminalCommandId.FindFocus */,
        title: (0, nls_1.localize2)('workbench.action.terminal.focusFind', 'Focus Find'),
        keybinding: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.findFocus, terminalContextKey_1.TerminalContextKeys.focusInAny),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            contr?.findWidget.reveal();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.hideFind" /* TerminalCommandId.FindHide */,
        title: (0, nls_1.localize2)('workbench.action.terminal.hideFind', 'Hide Find'),
        keybinding: {
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findVisible),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            contr?.findWidget.hide();
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */,
        title: (0, nls_1.localize2)('workbench.action.terminal.toggleFindRegex', 'Toggle Find Using Regex'),
        keybinding: {
            primary: 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ },
            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const state = contr?.findWidget.state;
            state?.change({ isRegex: !state.isRegex }, false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */,
        title: (0, nls_1.localize2)('workbench.action.terminal.toggleFindWholeWord', 'Toggle Find Using Whole Word'),
        keybinding: {
            primary: 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */ },
            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const state = contr?.findWidget.state;
            state?.change({ wholeWord: !state.wholeWord }, false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */,
        title: (0, nls_1.localize2)('workbench.action.terminal.toggleFindCaseSensitive', 'Toggle Find Using Case Sensitive'),
        keybinding: {
            primary: 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */ },
            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
            weight: 200 /* KeybindingWeight.WorkbenchContrib */
        },
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const state = contr?.findWidget.state;
            state?.change({ matchCase: !state.matchCase }, false);
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.findNext" /* TerminalCommandId.FindNext */,
        title: (0, nls_1.localize2)('workbench.action.terminal.findNext', 'Find Next'),
        keybinding: [
            {
                primary: 61 /* KeyCode.F3 */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, secondary: [61 /* KeyCode.F3 */] },
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            {
                primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                when: terminalContextKey_1.TerminalContextKeys.findInputFocus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            }
        ],
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const widget = contr?.findWidget;
            if (widget) {
                widget.show();
                widget.find(false);
            }
        }
    });
    (0, terminalActions_1.registerActiveXtermAction)({
        id: "workbench.action.terminal.findPrevious" /* TerminalCommandId.FindPrevious */,
        title: (0, nls_1.localize2)('workbench.action.terminal.findPrevious', 'Find Previous'),
        keybinding: [
            {
                primary: 1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */,
                mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */, secondary: [1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */] },
                when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focusInAny, terminalContextKey_1.TerminalContextKeys.findFocus),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            },
            {
                primary: 3 /* KeyCode.Enter */,
                when: terminalContextKey_1.TerminalContextKeys.findInputFocus,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */
            }
        ],
        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
        run: (_xterm, _accessor, activeInstance) => {
            const contr = TerminalFindContribution.activeFindWidget || TerminalFindContribution.get(activeInstance);
            const widget = contr?.findWidget;
            if (widget) {
                widget.show();
                widget.find(true);
            }
        }
    });
    // Global workspace file search
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.searchWorkspace" /* TerminalCommandId.SearchWorkspace */,
        title: (0, nls_1.localize2)('workbench.action.terminal.searchWorkspace', 'Search Workspace'),
        keybinding: [
            {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */,
                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.textSelected),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50
            }
        ],
        run: (activeInstance, c, accessor) => (0, searchActionsFind_1.findInFilesCommand)(accessor, { query: activeInstance.selection })
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwuZmluZC5jb250cmlidXRpb24uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3Rlcm1pbmFsQ29udHJpYi9maW5kL2Jyb3dzZXIvdGVybWluYWwuZmluZC5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBb0JoRyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLHNCQUFVOztpQkFDaEMsT0FBRSxHQUFHLGVBQWUsQUFBbEIsQ0FBbUI7UUFRckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUF1RDtZQUNqRSxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQTJCLDBCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFLRCxJQUFJLFVBQVUsS0FBeUIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFdkUsWUFDa0IsU0FBd0QsRUFDekUsY0FBOEQsRUFDOUQsYUFBb0MsRUFDYixvQkFBMkMsRUFDaEQsZUFBaUM7WUFFbkQsS0FBSyxFQUFFLENBQUM7WUFOUyxjQUFTLEdBQVQsU0FBUyxDQUErQztZQVF6RSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksV0FBSSxDQUFDLEdBQUcsRUFBRTtnQkFDaEMsTUFBTSxVQUFVLEdBQUcsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHVDQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFM0YseUVBQXlFO2dCQUN6RSxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7b0JBQ3ZDLDBCQUF3QixDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztvQkFDakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO29CQUMxQyxJQUFJLENBQUMsSUFBQSxxQ0FBMEIsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt3QkFDakQsZUFBZSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDbkQsQ0FBQztnQkFDRixDQUFDLENBQUMsQ0FBQztnQkFDSCxVQUFVLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7b0JBQ3RDLDBCQUF3QixDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztvQkFDdEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2dCQUMzQyxDQUFDLENBQUMsQ0FBQztnQkFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxvREFBb0QsQ0FBQyxDQUFDO2dCQUN2RSxDQUFDO2dCQUVELElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDaEUsSUFBSSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztvQkFDaEMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JELENBQUM7Z0JBRUQsT0FBTyxVQUFVLENBQUM7WUFDbkIsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTSxDQUFDLE1BQWtELEVBQUUsU0FBcUI7WUFDL0UsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFNBQVMsQ0FBQztZQUN2QyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFFRCxVQUFVLENBQUMsS0FBaUQ7WUFDM0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEcsQ0FBQztRQUVRLE9BQU87WUFDZixJQUFJLDBCQUF3QixDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRSxDQUFDO2dCQUN4RCwwQkFBd0IsQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLENBQUM7WUFDdkQsQ0FBQztZQUNELEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUN0QyxDQUFDOztJQXZFSSx3QkFBd0I7UUFzQjNCLFdBQUEscUNBQXFCLENBQUE7UUFDckIsV0FBQSwyQkFBZ0IsQ0FBQTtPQXZCYix3QkFBd0IsQ0F5RTdCO0lBQ0QsSUFBQSxpREFBNEIsRUFBQyx3QkFBd0IsQ0FBQyxFQUFFLEVBQUUsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFFMUYsSUFBQSwyQ0FBeUIsRUFBQztRQUN6QixFQUFFLHlFQUE2QjtRQUMvQixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMscUNBQXFDLEVBQUUsWUFBWSxDQUFDO1FBQ3JFLFVBQVUsRUFBRTtZQUNYLE9BQU8sRUFBRSxpREFBNkI7WUFDdEMsSUFBSSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLFNBQVMsRUFBRSx3Q0FBbUIsQ0FBQyxVQUFVLENBQUM7WUFDdEYsTUFBTSw2Q0FBbUM7U0FDekM7UUFDRCxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxFQUFFLENBQUMsd0NBQW1CLENBQUMsZ0JBQWdCLEVBQUUsd0NBQW1CLENBQUMsc0JBQXNCLENBQUM7UUFDakgsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsRUFBRTtZQUMxQyxNQUFNLEtBQUssR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsSUFBSSx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDeEcsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM1QixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsSUFBQSwyQ0FBeUIsRUFBQztRQUN6QixFQUFFLHVFQUE0QjtRQUM5QixLQUFLLEVBQUUsSUFBQSxlQUFTLEVBQUMsb0NBQW9DLEVBQUUsV0FBVyxDQUFDO1FBQ25FLFVBQVUsRUFBRTtZQUNYLE9BQU8sd0JBQWdCO1lBQ3ZCLFNBQVMsRUFBRSxDQUFDLGdEQUE2QixDQUFDO1lBQzFDLElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxVQUFVLEVBQUUsd0NBQW1CLENBQUMsV0FBVyxDQUFDO1lBQ3pGLE1BQU0sNkNBQW1DO1NBQ3pDO1FBQ0QsWUFBWSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDO1FBQ2pILEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsd0JBQXdCLENBQUMsZ0JBQWdCLElBQUksd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hHLEtBQUssRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsMkNBQXlCLEVBQUM7UUFDekIsRUFBRSxxRkFBbUM7UUFDckMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDJDQUEyQyxFQUFFLHlCQUF5QixDQUFDO1FBQ3hGLFVBQVUsRUFBRTtZQUNYLE9BQU8sRUFBRSw0Q0FBeUI7WUFDbEMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdEQUEyQix3QkFBZSxFQUFFO1lBQzVELElBQUksRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyx3Q0FBbUIsQ0FBQyxVQUFVLEVBQUUsd0NBQW1CLENBQUMsU0FBUyxDQUFDO1lBQ3RGLE1BQU0sNkNBQW1DO1NBQ3pDO1FBQ0QsWUFBWSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDO1FBQ2pILEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsd0JBQXdCLENBQUMsZ0JBQWdCLElBQUksd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sS0FBSyxHQUFHLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3RDLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsMkNBQXlCLEVBQUM7UUFDekIsRUFBRSw2RkFBdUM7UUFDekMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLCtDQUErQyxFQUFFLDhCQUE4QixDQUFDO1FBQ2pHLFVBQVUsRUFBRTtZQUNYLE9BQU8sRUFBRSw0Q0FBeUI7WUFDbEMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdEQUEyQix3QkFBZSxFQUFFO1lBQzVELElBQUksRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyx3Q0FBbUIsQ0FBQyxVQUFVLEVBQUUsd0NBQW1CLENBQUMsU0FBUyxDQUFDO1lBQ3RGLE1BQU0sNkNBQW1DO1NBQ3pDO1FBQ0QsWUFBWSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDO1FBQ2pILEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsd0JBQXdCLENBQUMsZ0JBQWdCLElBQUksd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sS0FBSyxHQUFHLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3RDLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsMkNBQXlCLEVBQUM7UUFDekIsRUFBRSxxR0FBMkM7UUFDN0MsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG1EQUFtRCxFQUFFLGtDQUFrQyxDQUFDO1FBQ3pHLFVBQVUsRUFBRTtZQUNYLE9BQU8sRUFBRSw0Q0FBeUI7WUFDbEMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGdEQUEyQix3QkFBZSxFQUFFO1lBQzVELElBQUksRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyx3Q0FBbUIsQ0FBQyxVQUFVLEVBQUUsd0NBQW1CLENBQUMsU0FBUyxDQUFDO1lBQ3RGLE1BQU0sNkNBQW1DO1NBQ3pDO1FBQ0QsWUFBWSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDO1FBQ2pILEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsd0JBQXdCLENBQUMsZ0JBQWdCLElBQUksd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sS0FBSyxHQUFHLEtBQUssRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3RDLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsMkNBQXlCLEVBQUM7UUFDekIsRUFBRSx1RUFBNEI7UUFDOUIsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLG9DQUFvQyxFQUFFLFdBQVcsQ0FBQztRQUNuRSxVQUFVLEVBQUU7WUFDWDtnQkFDQyxPQUFPLHFCQUFZO2dCQUNuQixHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsaURBQTZCLEVBQUUsU0FBUyxFQUFFLHFCQUFZLEVBQUU7Z0JBQ3hFLElBQUksRUFBRSwyQkFBYyxDQUFDLEVBQUUsQ0FBQyx3Q0FBbUIsQ0FBQyxVQUFVLEVBQUUsd0NBQW1CLENBQUMsU0FBUyxDQUFDO2dCQUN0RixNQUFNLDZDQUFtQzthQUN6QztZQUNEO2dCQUNDLE9BQU8sRUFBRSwrQ0FBNEI7Z0JBQ3JDLElBQUksRUFBRSx3Q0FBbUIsQ0FBQyxjQUFjO2dCQUN4QyxNQUFNLDZDQUFtQzthQUN6QztTQUNEO1FBQ0QsWUFBWSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLGdCQUFnQixFQUFFLHdDQUFtQixDQUFDLHNCQUFzQixDQUFDO1FBQ2pILEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsd0JBQXdCLENBQUMsZ0JBQWdCLElBQUksd0JBQXdCLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hHLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxVQUFVLENBQUM7WUFDakMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDWixNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixDQUFDO1FBQ0YsQ0FBQztLQUNELENBQUMsQ0FBQztJQUVILElBQUEsMkNBQXlCLEVBQUM7UUFDekIsRUFBRSwrRUFBZ0M7UUFDbEMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLHdDQUF3QyxFQUFFLGVBQWUsQ0FBQztRQUMzRSxVQUFVLEVBQUU7WUFDWDtnQkFDQyxPQUFPLEVBQUUsNkNBQXlCO2dCQUNsQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsbURBQTZCLHdCQUFlLEVBQUUsU0FBUyxFQUFFLENBQUMsNkNBQXlCLENBQUMsRUFBRTtnQkFDdEcsSUFBSSxFQUFFLDJCQUFjLENBQUMsRUFBRSxDQUFDLHdDQUFtQixDQUFDLFVBQVUsRUFBRSx3Q0FBbUIsQ0FBQyxTQUFTLENBQUM7Z0JBQ3RGLE1BQU0sNkNBQW1DO2FBQ3pDO1lBQ0Q7Z0JBQ0MsT0FBTyx1QkFBZTtnQkFDdEIsSUFBSSxFQUFFLHdDQUFtQixDQUFDLGNBQWM7Z0JBQ3hDLE1BQU0sNkNBQW1DO2FBQ3pDO1NBQ0Q7UUFDRCxZQUFZLEVBQUUsMkJBQWMsQ0FBQyxFQUFFLENBQUMsd0NBQW1CLENBQUMsZ0JBQWdCLEVBQUUsd0NBQW1CLENBQUMsc0JBQXNCLENBQUM7UUFDakgsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQUUsRUFBRTtZQUMxQyxNQUFNLEtBQUssR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsSUFBSSx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDeEcsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLFVBQVUsQ0FBQztZQUNqQyxJQUFJLE1BQU0sRUFBRSxDQUFDO2dCQUNaLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDZCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ25CLENBQUM7UUFDRixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0lBRUgsK0JBQStCO0lBQy9CLElBQUEsOENBQTRCLEVBQUM7UUFDNUIsRUFBRSxxRkFBbUM7UUFDckMsS0FBSyxFQUFFLElBQUEsZUFBUyxFQUFDLDJDQUEyQyxFQUFFLGtCQUFrQixDQUFDO1FBQ2pGLFVBQVUsRUFBRTtZQUNYO2dCQUNDLE9BQU8sRUFBRSxtREFBNkIsd0JBQWU7Z0JBQ3JELElBQUksRUFBRSwyQkFBYyxDQUFDLEdBQUcsQ0FBQyx3Q0FBbUIsQ0FBQyxnQkFBZ0IsRUFBRSx3Q0FBbUIsQ0FBQyxLQUFLLEVBQUUsd0NBQW1CLENBQUMsWUFBWSxDQUFDO2dCQUMzSCxNQUFNLEVBQUUsOENBQW9DLEVBQUU7YUFDOUM7U0FDRDtRQUNELEdBQUcsRUFBRSxDQUFDLGNBQWMsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHNDQUFrQixFQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUM7S0FDdkcsQ0FBQyxDQUFDIn0=