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
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/contextkeys", "vs/workbench/common/theme", "vs/workbench/common/views", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/actions", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions", "vs/base/common/types", "vs/workbench/browser/actions/layoutActions", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/paneCompositePart", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/browser/dom", "vs/platform/actions/browser/toolbar", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/browser/actions", "vs/css!./media/auxiliaryBarPart"], function (require, exports, nls_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, storage_1, colorRegistry_1, themeService_1, contextkeys_1, theme_1, views_1, extensions_1, layoutService_1, actions_1, auxiliaryBarActions_1, types_1, layoutActions_1, commands_1, paneCompositePart_1, actionbar_1, actions_2, configuration_1, menuEntryActionViewItem_1, dom_1, toolbar_1, actionViewItems_1, actions_3) {
    "use strict";
    var AuxiliaryBarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuxiliaryBarPart = void 0;
    let AuxiliaryBarPart = class AuxiliaryBarPart extends paneCompositePart_1.AbstractPaneCompositePart {
        static { AuxiliaryBarPart_1 = this; }
        static { this.activePanelSettingsKey = 'workbench.auxiliarybar.activepanelid'; }
        static { this.pinnedPanelsKey = 'workbench.auxiliarybar.pinnedPanels'; }
        static { this.placeholdeViewContainersKey = 'workbench.auxiliarybar.placeholderPanels'; }
        static { this.viewContainersWorkspaceStateKey = 'workbench.auxiliarybar.viewContainersWorkspaceState'; }
        get preferredHeight() {
            // Don't worry about titlebar or statusbar visibility
            // The difference is minimal and keeps this function clean
            return this.layoutService.mainContainerDimension.height * 0.4;
        }
        get preferredWidth() {
            const activeComposite = this.getActivePaneComposite();
            if (!activeComposite) {
                return;
            }
            const width = activeComposite.getOptimalWidth();
            if (typeof width !== 'number') {
                return;
            }
            return Math.max(width, 300);
        }
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, commandService, menuService, configurationService) {
            super("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, {
                hasTitle: true,
                borderWidth: () => (this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder)) ? 1 : 0,
            }, AuxiliaryBarPart_1.activePanelSettingsKey, contextkeys_1.ActiveAuxiliaryContext.bindTo(contextKeyService), contextkeys_1.AuxiliaryBarFocusContext.bindTo(contextKeyService), 'auxiliarybar', 'auxiliarybar', undefined, notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService);
            this.commandService = commandService;
            this.configurationService = configurationService;
            // Use the side bar dimensions
            this.minimumWidth = 170;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.priority = 1 /* LayoutPriority.Low */;
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */)) {
                    this.onDidChangeActivityBarLocation();
                }
            }));
        }
        onDidChangeActivityBarLocation() {
            this.updateCompositeBar();
            const id = this.getActiveComposite()?.getId();
            if (id) {
                this.onTitleAreaUpdate(id);
            }
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.SIDE_BAR_BACKGROUND) || '';
            const borderColor = this.getColor(theme_1.SIDE_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 1 /* Position.RIGHT */;
            container.style.color = this.getColor(theme_1.SIDE_BAR_FOREGROUND) || '';
            container.style.borderLeftColor = borderColor ?? '';
            container.style.borderRightColor = borderColor ?? '';
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : 'none';
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : 'none';
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '0px';
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '0px';
        }
        getCompositeBarOptions() {
            const $this = this;
            return {
                partContainerClass: 'auxiliarybar',
                pinnedViewContainersKey: AuxiliaryBarPart_1.pinnedPanelsKey,
                placeholderViewContainersKey: AuxiliaryBarPart_1.placeholdeViewContainersKey,
                viewContainersWorkspaceStateKey: AuxiliaryBarPart_1.viewContainersWorkspaceStateKey,
                icon: true,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                recomputeSizes: true,
                activityHoverOptions: {
                    position: () => this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.BOTTOM ? 3 /* HoverPosition.ABOVE */ : 2 /* HoverPosition.BELOW */,
                },
                fillExtraContextMenuActions: actions => this.fillExtraContextMenuActions(actions),
                compositeSize: 0,
                iconSize: 16,
                // Add 10px spacing if the overflow action is visible to no confuse the user with ... between the toolbars
                get overflowActionSize() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? 40 : 30; },
                colors: theme => ({
                    activeBackgroundColor: theme.getColor(theme_1.SIDE_BAR_BACKGROUND),
                    inactiveBackgroundColor: theme.getColor(theme_1.SIDE_BAR_BACKGROUND),
                    get activeBorderBottomColor() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_ACTIVE_BORDER); },
                    get activeForegroundColor() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_FOREGROUND); },
                    get inactiveForegroundColor() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_INACTIVE_FOREGROUND); },
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                    get dragAndDropBorder() { return $this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TITLE ? theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BORDER) : theme.getColor(theme_1.ACTIVITY_BAR_TOP_DRAG_AND_DROP_BORDER); }
                }),
                compact: true
            };
        }
        fillExtraContextMenuActions(actions) {
            const currentPositionRight = this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */;
            const viewsSubmenuAction = this.getViewsSubmenuAction();
            if (viewsSubmenuAction) {
                actions.push(new actions_1.Separator());
                actions.push(viewsSubmenuAction);
            }
            const activityBarPositionMenu = this.menuService.createMenu(actions_2.MenuId.ActivityBarPositionMenu, this.contextKeyService);
            const positionActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(activityBarPositionMenu, { shouldForwardArgs: true, renderShortTitle: true }, { primary: [], secondary: positionActions });
            activityBarPositionMenu.dispose();
            actions.push(...[
                new actions_1.Separator(),
                new actions_1.SubmenuAction('workbench.action.panel.position', (0, nls_1.localize)('activity bar position', "Activity Bar Position"), positionActions),
                (0, actions_1.toAction)({ id: layoutActions_1.ToggleSidebarPositionAction.ID, label: currentPositionRight ? (0, nls_1.localize)('move second side bar left', "Move Secondary Side Bar Left") : (0, nls_1.localize)('move second side bar right', "Move Secondary Side Bar Right"), run: () => this.commandService.executeCommand(layoutActions_1.ToggleSidebarPositionAction.ID) }),
                (0, actions_1.toAction)({ id: auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID, label: (0, nls_1.localize)('hide second side bar', "Hide Secondary Side Bar"), run: () => this.commandService.executeCommand(auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID) })
            ]);
        }
        shouldShowCompositeBar() {
            return this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) !== "hidden" /* ActivityBarPosition.HIDDEN */;
        }
        // TODO@benibenj chache this
        getCompositeBarPosition() {
            const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
            switch (activityBarPosition) {
                case "top" /* ActivityBarPosition.TOP */: return paneCompositePart_1.CompositeBarPosition.TOP;
                case "bottom" /* ActivityBarPosition.BOTTOM */: return paneCompositePart_1.CompositeBarPosition.BOTTOM;
                case "hidden" /* ActivityBarPosition.HIDDEN */: return paneCompositePart_1.CompositeBarPosition.TITLE;
                case "default" /* ActivityBarPosition.DEFAULT */: return paneCompositePart_1.CompositeBarPosition.TITLE;
                default: return paneCompositePart_1.CompositeBarPosition.TITLE;
            }
        }
        createHeaderArea() {
            const headerArea = super.createHeaderArea();
            const globalHeaderContainer = (0, dom_1.$)('.auxiliary-bar-global-header');
            // Add auxillary header action
            const menu = this.headerFooterCompositeBarDispoables.add(this.instantiationService.createInstance(actions_3.CompositeMenuActions, actions_2.MenuId.AuxiliaryBarHeader, undefined, undefined));
            const toolBar = this.headerFooterCompositeBarDispoables.add(this.instantiationService.createInstance(toolbar_1.WorkbenchToolBar, globalHeaderContainer, {
                actionViewItemProvider: (action, options) => this.headerActionViewItemProvider(action, options),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
            }));
            toolBar.setActions((0, actionbar_1.prepareActions)(menu.getPrimaryActions()));
            this.headerFooterCompositeBarDispoables.add(menu.onDidChange(() => toolBar.setActions((0, actionbar_1.prepareActions)(menu.getPrimaryActions()))));
            headerArea.appendChild(globalHeaderContainer);
            return headerArea;
        }
        getToolbarWidth() {
            if (this.getCompositeBarPosition() === paneCompositePart_1.CompositeBarPosition.TOP) {
                return 22;
            }
            return super.getToolbarWidth();
        }
        headerActionViewItemProvider(action, options) {
            if (action.id === auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID) {
                return this.instantiationService.createInstance(actionViewItems_1.ActionViewItem, undefined, action, options);
            }
            return undefined;
        }
        toJSON() {
            return {
                type: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */
            };
        }
    };
    exports.AuxiliaryBarPart = AuxiliaryBarPart;
    exports.AuxiliaryBarPart = AuxiliaryBarPart = AuxiliaryBarPart_1 = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, extensions_1.IExtensionService),
        __param(10, commands_1.ICommandService),
        __param(11, actions_2.IMenuService),
        __param(12, configuration_1.IConfigurationService)
    ], AuxiliaryBarPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV4aWxpYXJ5QmFyUGFydC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvYXV4aWxpYXJ5YmFyL2F1eGlsaWFyeUJhclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQW1DekYsSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSw2Q0FBeUI7O2lCQUU5QywyQkFBc0IsR0FBRyxzQ0FBc0MsQUFBekMsQ0FBMEM7aUJBQ2hFLG9CQUFlLEdBQUcscUNBQXFDLEFBQXhDLENBQXlDO2lCQUN4RCxnQ0FBMkIsR0FBRywwQ0FBMEMsQUFBN0MsQ0FBOEM7aUJBQ3pFLG9DQUErQixHQUFHLHFEQUFxRCxBQUF4RCxDQUF5RDtRQVF4RyxJQUFJLGVBQWU7WUFDbEIscURBQXFEO1lBQ3JELDBEQUEwRDtZQUMxRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUMvRCxDQUFDO1FBRUQsSUFBSSxjQUFjO1lBQ2pCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBRXRELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFJRCxZQUN1QixtQkFBeUMsRUFDOUMsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ25DLGFBQXND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