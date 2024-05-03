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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/services/views/common/viewsService", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/debug/browser/welcomeView", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/css!./media/debugViewlet"], function (require, exports, lifecycle_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, progress_1, quickInput_1, storage_1, telemetry_1, themeService_1, workspace_1, viewPaneContainer_1, contextkeys_1, views_1, viewsService_1, debugActionViewItems_1, debugCommands_1, debugIcons_1, debugToolBar_1, welcomeView_1, debug_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugViewPaneContainer = void 0;
    let DebugViewPaneContainer = class DebugViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, progressService, debugService, instantiationService, contextService, storageService, themeService, contextMenuService, extensionService, configurationService, contextViewService, contextKeyService, viewDescriptorService) {
            super(debug_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.progressService = progressService;
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.contextKeyService = contextKeyService;
            this.paneListeners = new Map();
            this.stopActionViewItemDisposables = this._register(new lifecycle_1.DisposableStore());
            // When there are potential updates to the docked debug toolbar we need to update it
            this._register(this.debugService.onDidChangeState(state => this.onDebugServiceStateChange(state)));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(new Set([debug_1.CONTEXT_DEBUG_UX_KEY, 'inDebugMode']))) {
                    this.updateTitleArea();
                }
            }));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateTitleArea()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.toolBarLocation') || e.affectsConfiguration('debug.hideLauncherWhileDebugging')) {
                    this.updateTitleArea();
                }
            }));
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('debug-viewlet');
        }
        focus() {
            super.focus();
            if (this.startDebugActionViewItem) {
                this.startDebugActionViewItem.focus();
            }
            else {
                this.focusView(welcomeView_1.WelcomeView.ID);
            }
        }
        getActionViewItem(action, options) {
            if (action.id === debugCommands_1.DEBUG_START_COMMAND_ID) {
                this.startDebugActionViewItem = this.instantiationService.createInstance(debugActionViewItems_1.StartDebugActionViewItem, null, action, options);
                return this.startDebugActionViewItem;
            }
            if (action.id === debugCommands_1.FOCUS_SESSION_ID) {
                return new debugActionViewItems_1.FocusSessionActionViewItem(action, undefined, this.debugService, this.contextViewService, this.configurationService);
            }
            if (action.id === debugCommands_1.STOP_ID || action.id === debugCommands_1.DISCONNECT_ID) {
                this.stopActionViewItemDisposables.clear();
                const item = this.instantiationService.invokeFunction(accessor => (0, debugToolBar_1.createDisconnectMenuItemAction)(action, this.stopActionViewItemDisposables, accessor, { hoverDelegate: options.hoverDelegate }));
                if (item) {
                    return item;
                }
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
        }
        focusView(id) {
            const view = this.getView(id);
            if (view) {
                view.focus();
            }
        }
        onDebugServiceStateChange(state) {
            if (this.progressResolve) {
                this.progressResolve();
                this.progressResolve = undefined;
            }
            if (state === 1 /* State.Initializing */) {
                this.progressService.withProgress({ location: debug_1.VIEWLET_ID, }, _progress => {
                    return new Promise(resolve => this.progressResolve = resolve);
                });
            }
        }
        addPanes(panes) {
            super.addPanes(panes);
            for (const { pane: pane } of panes) {
                // attach event listener to
                if (pane.id === debug_1.BREAKPOINTS_VIEW_ID) {
                    this.breakpointView = pane;
                    this.updateBreakpointsMaxSize();
                }
                else {
                    this.paneListeners.set(pane.id, pane.onDidChange(() => this.updateBreakpointsMaxSize()));
                }
            }
        }
        removePanes(panes) {
            super.removePanes(panes);
            for (const pane of panes) {
                (0, lifecycle_1.dispose)(this.paneListeners.get(pane.id));
                this.paneListeners.delete(pane.id);
            }
        }
        updateBreakpointsMaxSize() {
            if (this.breakpointView) {
                // We need to update the breakpoints view since all other views are collapsed #25384
                const allOtherCollapsed = this.panes.every(view => !view.isExpanded() || view === this.breakpointView);
                this.breakpointView.maximumBodySize = allOtherCollapsed ? Number.POSITIVE_INFINITY : this.breakpointView.minimumBodySize;
            }
        }
    };
    exports.DebugViewPaneContainer = DebugViewPaneContainer;
    exports.DebugViewPaneContainer = DebugViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, debug_1.IDebugService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, storage_1.IStorageService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, contextView_1.IContextViewService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, views_1.IViewDescriptorService)
    ], DebugViewPaneContainer);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_UX.notEqualsTo('simple'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_DEBUG_STATE.isEqualTo('inactive'), contextkey_1.ContextKeyExpr.notEquals('config.debug.toolBarLocation', 'docked')), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.not('config.debug.hideLauncherWhileDebugging'), contextkey_1.ContextKeyExpr.not('inDebugMode'))),
        order: 10,
        group: 'navigation',
        command: {
            precondition: debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */)),
            id: debugCommands_1.DEBUG_START_COMMAND_ID,
            title: debugCommands_1.DEBUG_START_LABEL
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID,
                title: {
                    value: debugCommands_1.DEBUG_CONFIGURE_LABEL,
                    original: 'Open \'launch.json\'',
                    mnemonicTitle: nls.localize({ key: 'miOpenConfigurations', comment: ['&& denotes a mnemonic'] }, "Open &&Configurations")
                },
                f1: true,
                icon: debugIcons_1.debugConfigure,
                precondition: debug_1.CONTEXT_DEBUG_UX.notEqualsTo('simple'),
                menu: [{
                        id: actions_1.MenuId.ViewContainerTitle,
                        group: 'navigation',
                        order: 20,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_UX.notEqualsTo('simple'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_DEBUG_STATE.isEqualTo('inactive'), contextkey_1.ContextKeyExpr.notEquals('config.debug.toolBarLocation', 'docked')))
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        order: 20,
                        // Show in debug viewlet secondary actions when debugging and debug toolbar is docked
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked'))
                    }, {
                        id: actions_1.MenuId.MenubarDebugMenu,
                        group: '2_configuration',
                        order: 1,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                    }]
            });
        }
        async run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationManager = debugService.getConfigurationManager();
            let launch;
            if (configurationManager.selectedConfiguration.name) {
                launch = configurationManager.selectedConfiguration.launch;
            }
            else {
                const launches = configurationManager.getLaunches().filter(l => !l.hidden);
                if (launches.length === 1) {
                    launch = launches[0];
                }
                else {
                    const picks = launches.map(l => ({ label: l.name, launch: l }));
                    const picked = await quickInputService.pick(picks, {
                        activeItem: picks[0],
                        placeHolder: nls.localize({ key: 'selectWorkspaceFolder', comment: ['User picks a workspace folder or a workspace configuration file here. Workspace configuration files can contain settings and thus a launch.json configuration can be written into one.'] }, "Select a workspace folder to create a launch.json file in or add it to the workspace config file")
                    });
                    if (picked) {
                        launch = picked.launch;
                    }
                }
            }
            if (launch) {
                await launch.openConfigFile({ preserveFocus: false });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'debug.toggleReplIgnoreFocus',
                title: nls.localize('debugPanel', "Debug Console"),
                toggled: contextkey_1.ContextKeyExpr.has(`view.${debug_1.REPL_VIEW_ID}.visible`),
                menu: [{
                        id: viewPaneContainer_1.ViewsSubMenu,
                        group: '3_toggleRepl',
                        order: 30,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID))
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(viewsService_1.IViewsService);
            if (viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                viewsService.closeView(debug_1.REPL_VIEW_ID);
            }
            else {
                await viewsService.openView(debug_1.REPL_VIEW_ID);
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked'), contextkey_1.ContextKeyExpr.has('config.debug.hideLauncherWhileDebugging'))),
        order: 10,
        command: {
            id: debugCommands_1.SELECT_AND_START_ID,
            title: nls.localize('startAdditionalSession', "Start Additional Session"),
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdWaWV3bGV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnVmlld2xldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFrQ3pGLElBQU0sc0JBQXNCLEdBQTVCLE1BQU0sc0JBQXVCLFNBQVEscUNBQWlCO1FBUzVELFlBQzBCLGFBQXNDLEVBQzVDLGdCQUFtQyxFQUNwQyxlQUFrRCxFQUNyRCxZQUE0QyxFQUNwQyxvQkFBMkMsRUFDeEMsY0FBd0MsRUFDakQsY0FBK0IsRUFDakMsWUFBMkIsRUFDckIsa0JBQXVDLEVBQ3pDLGdCQUFtQyxFQUMvQixvQkFBMkMsRUFDN0Msa0JBQXdELEVBQ3pELGlCQUFzRCxFQUNsRCxxQkFBNkM7WUFFckUsS0FBSyxDQUFDLGtCQUFVLEVBQUUsRUFBRSxvQ0FBb0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxvQkFBb0IsRUFBRSxhQUFhLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUscUJBQXFCLENBQUMsQ0FBQztZQWJ2TixvQkFBZSxHQUFmLGVBQWUsQ0FBa0I7WUFDcEMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFRckIsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFxQjtZQUN4QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBakJuRSxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBRXRDLGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQW9CdEYsb0ZBQW9GO1lBQ3BGLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxD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