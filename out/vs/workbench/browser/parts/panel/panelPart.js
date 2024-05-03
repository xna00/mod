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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/common/views", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/paneCompositePart", "vs/platform/commands/common/commands", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/css!./media/panelpart"], function (require, exports, nls_1, actions_1, contextkeys_1, layoutService_1, storage_1, contextView_1, keybinding_1, instantiation_1, panelActions_1, themeService_1, theme_1, colorRegistry_1, notification_1, dom_1, contextkey_1, types_1, extensions_1, views_1, actions_2, paneCompositePart_1, commands_1, menuEntryActionViewItem_1) {
    "use strict";
    var PanelPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PanelPart = void 0;
    let PanelPart = class PanelPart extends paneCompositePart_1.AbstractPaneCompositePart {
        static { PanelPart_1 = this; }
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
        //#endregion
        static { this.activePanelSettingsKey = 'workbench.panelpart.activepanelid'; }
        constructor(notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, commandService, menuService) {
            super("workbench.parts.panel" /* Parts.PANEL_PART */, { hasTitle: true }, PanelPart_1.activePanelSettingsKey, contextkeys_1.ActivePanelContext.bindTo(contextKeyService), contextkeys_1.PanelFocusContext.bindTo(contextKeyService), 'panel', 'panel', undefined, notificationService, storageService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, viewDescriptorService, contextKeyService, extensionService, menuService);
            this.commandService = commandService;
            //#region IView
            this.minimumWidth = 300;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 77;
            this.maximumHeight = Number.POSITIVE_INFINITY;
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            container.style.backgroundColor = this.getColor(theme_1.PANEL_BACKGROUND) || '';
            const borderColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            container.style.borderLeftColor = borderColor;
            container.style.borderRightColor = borderColor;
            const title = this.getTitleArea();
            if (title) {
                title.style.borderTopColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            }
        }
        getCompositeBarOptions() {
            return {
                partContainerClass: 'panel',
                pinnedViewContainersKey: 'workbench.panel.pinnedPanels',
                placeholderViewContainersKey: 'workbench.panel.placeholderPanels',
                viewContainersWorkspaceStateKey: 'workbench.panel.viewContainersWorkspaceState',
                icon: false,
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                recomputeSizes: true,
                activityHoverOptions: {
                    position: () => this.layoutService.getPanelPosition() === 2 /* Position.BOTTOM */ && !this.layoutService.isPanelMaximized() ? 3 /* HoverPosition.ABOVE */ : 2 /* HoverPosition.BELOW */,
                },
                fillExtraContextMenuActions: actions => this.fillExtraContextMenuActions(actions),
                compositeSize: 0,
                iconSize: 16,
                overflowActionSize: 44,
                colors: theme => ({
                    activeBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND), // Background color for overflow action
                    inactiveBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND), // Background color for overflow action
                    activeBorderBottomColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER),
                    activeForegroundColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND),
                    badgeBackground: theme.getColor(colorRegistry_1.badgeBackground),
                    badgeForeground: theme.getColor(colorRegistry_1.badgeForeground),
                    dragAndDropBorder: theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BORDER)
                })
            };
        }
        fillExtraContextMenuActions(actions) {
            const panelPositionMenu = this.menuService.createMenu(actions_2.MenuId.PanelPositionMenu, this.contextKeyService);
            const panelAlignMenu = this.menuService.createMenu(actions_2.MenuId.PanelAlignmentMenu, this.contextKeyService);
            const positionActions = [];
            const alignActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(panelPositionMenu, { shouldForwardArgs: true }, { primary: [], secondary: positionActions });
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(panelAlignMenu, { shouldForwardArgs: true }, { primary: [], secondary: alignActions });
            panelAlignMenu.dispose();
            panelPositionMenu.dispose();
            actions.push(...[
                new actions_1.Separator(),
                new actions_1.SubmenuAction('workbench.action.panel.position', (0, nls_1.localize)('panel position', "Panel Position"), positionActions),
                new actions_1.SubmenuAction('workbench.action.panel.align', (0, nls_1.localize)('align panel', "Align Panel"), alignActions),
                (0, actions_1.toAction)({ id: panelActions_1.TogglePanelAction.ID, label: (0, nls_1.localize)('hidePanel', "Hide Panel"), run: () => this.commandService.executeCommand(panelActions_1.TogglePanelAction.ID) })
            ]);
        }
        layout(width, height, top, left) {
            let dimensions;
            if (this.layoutService.getPanelPosition() === 1 /* Position.RIGHT */) {
                dimensions = new dom_1.Dimension(width - 1, height); // Take into account the 1px border when layouting
            }
            else {
                dimensions = new dom_1.Dimension(width, height);
            }
            // Layout contents
            super.layout(dimensions.width, dimensions.height, top, left);
        }
        shouldShowCompositeBar() {
            return true;
        }
        getCompositeBarPosition() {
            return paneCompositePart_1.CompositeBarPosition.TITLE;
        }
        toJSON() {
            return {
                type: "workbench.parts.panel" /* Parts.PANEL_PART */
            };
        }
    };
    exports.PanelPart = PanelPart;
    exports.PanelPart = PanelPart = PanelPart_1 = __decorate([
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
        __param(11, actions_2.IMenuService)
    ], PanelPart);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFuZWxQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9wYW5lbC9wYW5lbFBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTZCekYsSUFBTSxTQUFTLEdBQWYsTUFBTSxTQUFVLFNBQVEsNkNBQXlCOztRQVN2RCxJQUFJLGVBQWU7WUFDbEIscURBQXFEO1lBQ3JELDBEQUEwRDtZQUMxRCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztRQUMvRCxDQUFDO1FBRUQsSUFBSSxjQUFjO1lBQ2pCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1lBRXRELElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDdEIsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxlQUFlLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUUsQ0FBQztnQkFDL0IsT0FBTztZQUNSLENBQUM7WUFFRCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFFRCxZQUFZO2lCQUVJLDJCQUFzQixHQUFHLG1DQUFtQyxBQUF0QyxDQUF1QztRQUU3RSxZQUN1QixtQkFBeUMsRUFDOUMsY0FBK0IsRUFDM0Isa0JBQXVDLEVBQ25DLGFBQXNDLEVBQzNDLGlCQUFxQyxFQUNsQyxvQkFBMkMsRUFDbkQsWUFBMkIsRUFDbEIscUJBQTZDLEVBQ2pELGlCQUFxQyxFQUN0QyxnQkFBbUMsRUFDckMsY0FBdUMsRUFDMUMsV0FBeUI7WUFFdkMsS0FBSyxpREFFSixFQUFFLFFBQVEs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