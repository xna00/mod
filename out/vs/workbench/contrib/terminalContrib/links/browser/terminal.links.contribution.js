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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/accessibility/browser/accessibilityConfiguration", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalExtensions", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminalContrib/links/browser/links", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkManager", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkProviderService", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkQuickpick", "vs/workbench/contrib/terminalContrib/links/browser/terminalLinkResolver"], function (require, exports, event_1, lifecycle_1, nls_1, contextkey_1, extensions_1, instantiation_1, accessibilityConfiguration_1, terminal_1, terminalActions_1, terminalExtensions_1, terminal_2, terminalContextKey_1, terminalStrings_1, links_1, terminalLinkManager_1, terminalLinkProviderService_1, terminalLinkQuickpick_1, terminalLinkResolver_1) {
    "use strict";
    var TerminalLinkContribution_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(links_1.ITerminalLinkProviderService, terminalLinkProviderService_1.TerminalLinkProviderService, 1 /* InstantiationType.Delayed */);
    let TerminalLinkContribution = class TerminalLinkContribution extends lifecycle_1.DisposableStore {
        static { TerminalLinkContribution_1 = this; }
        static { this.ID = 'terminal.link'; }
        static get(instance) {
            return instance.getContribution(TerminalLinkContribution_1.ID);
        }
        constructor(_instance, _processManager, _widgetManager, _instantiationService, _terminalLinkProviderService) {
            super();
            this._instance = _instance;
            this._processManager = _processManager;
            this._widgetManager = _widgetManager;
            this._instantiationService = _instantiationService;
            this._terminalLinkProviderService = _terminalLinkProviderService;
            this._linkResolver = this._instantiationService.createInstance(terminalLinkResolver_1.TerminalLinkResolver);
        }
        xtermReady(xterm) {
            const linkManager = this._linkManager = this.add(this._instantiationService.createInstance(terminalLinkManager_1.TerminalLinkManager, xterm.raw, this._processManager, this._instance.capabilities, this._linkResolver));
            // Set widget manager
            if ((0, terminal_2.isTerminalProcessManager)(this._processManager)) {
                const disposable = linkManager.add(event_1.Event.once(this._processManager.onProcessReady)(() => {
                    linkManager.setWidgetManager(this._widgetManager);
                    this.delete(disposable);
                }));
            }
            else {
                linkManager.setWidgetManager(this._widgetManager);
            }
            // Attach the external link provider to the instance and listen for changes
            if (!(0, terminal_1.isDetachedTerminalInstance)(this._instance)) {
                for (const linkProvider of this._terminalLinkProviderService.linkProviders) {
                    linkManager.externalProvideLinksCb = linkProvider.provideLinks.bind(linkProvider, this._instance);
                }
                linkManager.add(this._terminalLinkProviderService.onDidAddLinkProvider(e => {
                    linkManager.externalProvideLinksCb = e.provideLinks.bind(e, this._instance);
                }));
            }
            linkManager.add(this._terminalLinkProviderService.onDidRemoveLinkProvider(() => linkManager.externalProvideLinksCb = undefined));
        }
        async showLinkQuickpick(extended) {
            if (!this._terminalLinkQuickpick) {
                this._terminalLinkQuickpick = this.add(this._instantiationService.createInstance(terminalLinkQuickpick_1.TerminalLinkQuickpick));
                this._terminalLinkQuickpick.onDidRequestMoreLinks(() => {
                    this.showLinkQuickpick(true);
                });
            }
            const links = await this._getLinks();
            return await this._terminalLinkQuickpick.show(this._instance, links);
        }
        async _getLinks() {
            if (!this._linkManager) {
                throw new Error('terminal links are not ready, cannot generate link quick pick');
            }
            return this._linkManager.getLinks();
        }
        async openRecentLink(type) {
            if (!this._linkManager) {
                throw new Error('terminal links are not ready, cannot open a link');
            }
            this._linkManager.openRecentLink(type);
        }
    };
    TerminalLinkContribution = TerminalLinkContribution_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, links_1.ITerminalLinkProviderService)
    ], TerminalLinkContribution);
    (0, terminalExtensions_1.registerTerminalContribution)(TerminalLinkContribution.ID, TerminalLinkContribution, true);
    const category = terminalStrings_1.terminalStrings.actionCategory;
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.openDetectedLink" /* TerminalCommandId.OpenDetectedLink */,
        title: (0, nls_1.localize2)('workbench.action.terminal.openDetectedLink', 'Open Detected Link...'),
        f1: true,
        category,
        precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
        keybinding: [{
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 45 /* KeyCode.KeyO */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                when: terminalContextKey_1.TerminalContextKeys.focus
            }, {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                when: contextkey_1.ContextKeyExpr.and(accessibilityConfiguration_1.accessibleViewIsShown, contextkey_1.ContextKeyExpr.equals(accessibilityConfiguration_1.accessibleViewCurrentProviderId.key, "terminal" /* AccessibleViewProviderId.Terminal */))
            },
        ],
        run: (activeInstance) => TerminalLinkContribution.get(activeInstance)?.showLinkQuickpick()
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.openUrlLink" /* TerminalCommandId.OpenWebLink */,
        title: (0, nls_1.localize2)('workbench.action.terminal.openLastUrlLink', 'Open Last URL Link'),
        f1: true,
        category,
        precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
        run: (activeInstance) => TerminalLinkContribution.get(activeInstance)?.openRecentLink('url')
    });
    (0, terminalActions_1.registerActiveInstanceAction)({
        id: "workbench.action.terminal.openFileLink" /* TerminalCommandId.OpenFileLink */,
        title: (0, nls_1.localize2)('workbench.action.terminal.openLastLocalFileLink', 'Open Last Local File Link'),
        f1: true,
        category,
        precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
        run: (activeInstance) => TerminalLinkContribution.get(activeInstance)?.openRecentLink('localFile')
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWwubGlua3MuY29udHJpYnV0aW9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi90ZXJtaW5hbENvbnRyaWIvbGlua3MvYnJvd3Nlci90ZXJtaW5hbC5saW5rcy5jb250cmlidXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBeUJoRyxJQUFBLDhCQUFpQixFQUFDLG9DQUE0QixFQUFFLHlEQUEyQixvQ0FBNEIsQ0FBQztJQUV4RyxJQUFNLHdCQUF3QixHQUE5QixNQUFNLHdCQUF5QixTQUFRLDJCQUFlOztpQkFDckMsT0FBRSxHQUFHLGVBQWUsQUFBbEIsQ0FBbUI7UUFFckMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUEyQjtZQUNyQyxPQUFPLFFBQVEsQ0FBQyxlQUFlLENBQTJCLDBCQUF3QixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hGLENBQUM7UUFNRCxZQUNrQixTQUF3RCxFQUN4RCxlQUErRCxFQUMvRCxjQUFxQyxFQUNkLHFCQUE0QyxFQUNyQyw0QkFBMEQ7WUFFekcsS0FBSyxFQUFFLENBQUM7WUFOUyxjQUFTLEdBQVQsU0FBUyxDQUErQztZQUN4RCxvQkFBZSxHQUFmLGVBQWUsQ0FBZ0Q7WUFDL0QsbUJBQWMsR0FBZCxjQUFjLENBQXVCO1lBQ2QsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUNyQyxpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQThCO1lBR3pHLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQywyQ0FBb0IsQ0FBQyxDQUFDO1FBQ3RGLENBQUM7UUFFRCxVQUFVLENBQUMsS0FBaUQ7WUFDM0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMs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