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
define(["require", "exports", "vs/nls", "vs/workbench/browser/part", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/browser/actions/layoutActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/base/common/types", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/configuration/common/configuration", "vs/platform/window/common/window", "vs/base/common/actions", "vs/base/browser/keyboardEvent", "vs/workbench/browser/parts/paneCompositeBar", "vs/workbench/browser/parts/globalCompositeBar", "vs/platform/storage/common/storage", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/action/common/actionCommonCategories", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/css!./media/activitybarpart", "vs/css!./media/activityaction"], function (require, exports, nls_1, part_1, layoutService_1, instantiation_1, lifecycle_1, layoutActions_1, themeService_1, theme_1, colorRegistry_1, dom_1, types_1, menubarControl_1, configuration_1, window_1, actions_1, keyboardEvent_1, paneCompositeBar_1, globalCompositeBar_1, storage_1, actions_2, contextkey_1, actionCommonCategories_1, menuEntryActionViewItem_1, views_1, panecomposite_1, extensions_1, environmentService_1) {
    "use strict";
    var ActivitybarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityBarCompositeBar = exports.ActivitybarPart = void 0;
    let ActivitybarPart = class ActivitybarPart extends part_1.Part {
        static { ActivitybarPart_1 = this; }
        static { this.ACTION_HEIGHT = 48; }
        static { this.pinnedViewContainersKey = 'workbench.activity.pinnedViewlets2'; }
        static { this.placeholderViewContainersKey = 'workbench.activity.placeholderViewlets'; }
        static { this.viewContainersWorkspaceStateKey = 'workbench.activity.viewletsWorkspaceState'; }
        constructor(paneCompositePart, instantiationService, layoutService, themeService, storageService) {
            super("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.paneCompositePart = paneCompositePart;
            this.instantiationService = instantiationService;
            //#region IView
            this.minimumWidth = 48;
            this.maximumWidth = 48;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            //#endregion
            this.compositeBar = this._register(new lifecycle_1.MutableDisposable());
        }
        createCompositeBar() {
            return this.instantiationService.createInstance(ActivityBarCompositeBar, {
                partContainerClass: 'activitybar',
                pinnedViewContainersKey: ActivitybarPart_1.pinnedViewContainersKey,
                placeholderViewContainersKey: ActivitybarPart_1.placeholderViewContainersKey,
                viewContainersWorkspaceStateKey: ActivitybarPart_1.viewContainersWorkspaceStateKey,
                orientation: 1 /* ActionsOrientation.VERTICAL */,
                icon: true,
                iconSize: 24,
                activityHoverOptions: {
                    position: () => this.layoutService.getSideBarPosition() === 0 /* Position.LEFT */ ? 1 /* HoverPosition.RIGHT */ : 0 /* HoverPosition.LEFT */,
                },
                preventLoopNavigation: true,
                recomputeSizes: false,
                fillExtraContextMenuActions: (actions, e) => { },
                compositeSize: 52,
                colors: (theme) => ({
                    activeForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_INACTIVE_FOREGROUND),
                    activeBorderColor: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER),
                    activeBackground: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND),
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                    dragAndDropBorder: theme.getColor(theme_1.ACTIVITY_BAR_DRAG_AND_DROP_BORDER),
                    activeBackgroundColor: undefined, inactiveBackgroundColor: undefined, activeBorderBottomColor: undefined,
                }),
                overflowActionSize: ActivitybarPart_1.ACTION_HEIGHT,
            }, "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, this.paneCompositePart, true);
        }
        createContentArea(parent) {
            this.element = parent;
            this.content = (0, dom_1.append)(this.element, (0, dom_1.$)('.content'));
            if (this.layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */)) {
                this.show();
            }
            return this.content;
        }
        getPinnedPaneCompositeIds() {
            return this.compositeBar.value?.getPinnedPaneCompositeIds() ?? [];
        }
        getVisiblePaneCompositeIds() {
            return this.compositeBar.value?.getVisiblePaneCompositeIds() ?? [];
        }
        focus() {
            this.compositeBar.value?.focus();
        }
        updateStyles() {
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const background = this.getColor(theme_1.ACTIVITY_BAR_BACKGROUND) || '';
            container.style.backgroundColor = background;
            const borderColor = this.getColor(theme_1.ACTIVITY_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
            container.classList.toggle('bordered', !!borderColor);
            container.style.borderColor = borderColor ? borderColor : '';
        }
        show(focus) {
            if (!this.content) {
                return;
            }
            if (!this.compositeBar.value) {
                this.compositeBar.value = this.createCompositeBar();
                this.compositeBar.value.create(this.content);
                if (this.dimension) {
                    this.layout(this.dimension.width, this.dimension.height);
                }
            }
            if (focus) {
                this.focus();
            }
        }
        hide() {
            if (!this.compositeBar.value) {
                return;
            }
            this.compositeBar.clear();
            if (this.content) {
                (0, dom_1.clearNode)(this.content);
            }
        }
        layout(width, height) {
            super.layout(width, height, 0, 0);
            if (!this.compositeBar.value) {
                return;
            }
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout composite bar
            this.compositeBar.value.layout(width, contentAreaSize.height);
        }
        toJSON() {
            return {
                type: "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */
            };
        }
    };
    exports.ActivitybarPart = ActivitybarPart;
    exports.ActivitybarPart = ActivitybarPart = ActivitybarPart_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService)
    ], ActivitybarPart);
    let ActivityBarCompositeBar = class ActivityBarCompositeBar extends paneCompositeBar_1.PaneCompositeBar {
        constructor(options, part, paneCompositePart, showGlobalActivities, instantiationService, storageService, extensionService, viewDescriptorService, contextKeyService, environmentService, configurationService, menuService, layoutService) {
            super({
                ...options,
                fillExtraContextMenuActions: (actions, e) => {
                    options.fillExtraContextMenuActions(actions, e);
                    this.fillContextMenuActions(actions, e);
                }
            }, part, paneCompositePart, instantiationService, storageService, extensionService, viewDescriptorService, contextKeyService, environmentService, layoutService);
            this.configurationService = configurationService;
            this.menuService = menuService;
            this.keyboardNavigationDisposables = this._register(new lifecycle_1.DisposableStore());
            if (showGlobalActivities) {
                this.globalCompositeBar = this._register(instantiationService.createInstance(globalCompositeBar_1.GlobalCompositeBar, () => this.getContextMenuActions(), (theme) => this.options.colors(theme), this.options.activityHoverOptions));
            }
            // Register for configuration changes
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.menuBarVisibility')) {
                    if ((0, window_1.getMenuBarVisibility)(this.configurationService) === 'compact') {
                        this.installMenubar();
                    }
                    else {
                        this.uninstallMenubar();
                    }
                }
            }));
        }
        fillContextMenuActions(actions, e) {
            // Menu
            const menuBarVisibility = (0, window_1.getMenuBarVisibility)(this.configurationService);
            if (menuBarVisibility === 'compact' || menuBarVisibility === 'hidden' || menuBarVisibility === 'toggle') {
                actions.unshift(...[(0, actions_1.toAction)({ id: 'toggleMenuVisibility', label: (0, nls_1.localize)('menu', "Menu"), checked: menuBarVisibility === 'compact', run: () => this.configurationService.updateValue('window.menuBarVisibility', menuBarVisibility === 'compact' ? 'toggle' : 'compact') }), new actions_1.Separator()]);
            }
            if (menuBarVisibility === 'compact' && this.menuBarContainer && e?.target) {
                if ((0, dom_1.isAncestor)(e.target, this.menuBarContainer)) {
                    actions.unshift(...[(0, actions_1.toAction)({ id: 'hideCompactMenu', label: (0, nls_1.localize)('hideMenu', "Hide Menu"), run: () => this.configurationService.updateValue('window.menuBarVisibility', 'toggle') }), new actions_1.Separator()]);
                }
            }
            // Global Composite Bar
            if (this.globalCompositeBar) {
                actions.push(new actions_1.Separator());
                actions.push(...this.globalCompositeBar.getContextMenuActions());
            }
            actions.push(new actions_1.Separator());
            actions.push(...this.getActivityBarContextMenuActions());
        }
        uninstallMenubar() {
            if (this.menuBar) {
                this.menuBar.dispose();
                this.menuBar = undefined;
            }
            if (this.menuBarContainer) {
                this.menuBarContainer.remove();
                this.menuBarContainer = undefined;
            }
        }
        installMenubar() {
            if (this.menuBar) {
                return; // prevent menu bar from installing twice #110720
            }
            this.menuBarContainer = document.createElement('div');
            this.menuBarContainer.classList.add('menubar');
            const content = (0, types_1.assertIsDefined)(this.element);
            content.prepend(this.menuBarContainer);
            // Menubar: install a custom menu bar depending on configuration
            this.menuBar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.menuBar.create(this.menuBarContainer);
        }
        registerKeyboardNavigationListeners() {
            this.keyboardNavigationDisposables.clear();
            // Up/Down or Left/Right arrow on compact menu
            if (this.menuBarContainer) {
                this.keyboardNavigationDisposables.add((0, dom_1.addDisposableListener)(this.menuBarContainer, dom_1.EventType.KEY_DOWN, e => {
                    const kbEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (kbEvent.equals(18 /* KeyCode.DownArrow */) || kbEvent.equals(17 /* KeyCode.RightArrow */)) {
                        this.focus();
                    }
                }));
            }
            // Up/Down on Activity Icons
            if (this.compositeBarContainer) {
                this.keyboardNavigationDisposables.add((0, dom_1.addDisposableListener)(this.compositeBarContainer, dom_1.EventType.KEY_DOWN, e => {
                    const kbEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (kbEvent.equals(18 /* KeyCode.DownArrow */) || kbEvent.equals(17 /* KeyCode.RightArrow */)) {
                        this.globalCompositeBar?.focus();
                    }
                    else if (kbEvent.equals(16 /* KeyCode.UpArrow */) || kbEvent.equals(15 /* KeyCode.LeftArrow */)) {
                        this.menuBar?.toggleFocus();
                    }
                }));
            }
            // Up arrow on global icons
            if (this.globalCompositeBar) {
                this.keyboardNavigationDisposables.add((0, dom_1.addDisposableListener)(this.globalCompositeBar.element, dom_1.EventType.KEY_DOWN, e => {
                    const kbEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (kbEvent.equals(16 /* KeyCode.UpArrow */) || kbEvent.equals(15 /* KeyCode.LeftArrow */)) {
                        this.focus(this.getVisiblePaneCompositeIds().length - 1);
                    }
                }));
            }
        }
        create(parent) {
            this.element = parent;
            // Install menubar if compact
            if ((0, window_1.getMenuBarVisibility)(this.configurationService) === 'compact') {
                this.installMenubar();
            }
            // View Containers action bar
            this.compositeBarContainer = super.create(this.element);
            // Global action bar
            if (this.globalCompositeBar) {
                this.globalCompositeBar.create(this.element);
            }
            // Keyboard Navigation
            this.registerKeyboardNavigationListeners();
            return this.compositeBarContainer;
        }
        layout(width, height) {
            if (this.menuBarContainer) {
                if (this.options.orientation === 1 /* ActionsOrientation.VERTICAL */) {
                    height -= this.menuBarContainer.clientHeight;
                }
                else {
                    width -= this.menuBarContainer.clientWidth;
                }
            }
            if (this.globalCompositeBar) {
                if (this.options.orientation === 1 /* ActionsOrientation.VERTICAL */) {
                    height -= (this.globalCompositeBar.size() * ActivitybarPart.ACTION_HEIGHT);
                }
                else {
                    width -= this.globalCompositeBar.element.clientWidth;
                }
            }
            super.layout(width, height);
        }
        getActivityBarContextMenuActions() {
            const activityBarPositionMenu = this.menuService.createMenu(actions_2.MenuId.ActivityBarPositionMenu, this.contextKeyService);
            const positionActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(activityBarPositionMenu, { shouldForwardArgs: true, renderShortTitle: true }, { primary: [], secondary: positionActions });
            activityBarPositionMenu.dispose();
            return [
                new actions_1.SubmenuAction('workbench.action.panel.position', (0, nls_1.localize)('activity bar position', "Activity Bar Position"), positionActions),
                (0, actions_1.toAction)({ id: layoutActions_1.ToggleSidebarPositionAction.ID, label: layoutActions_1.ToggleSidebarPositionAction.getLabel(this.layoutService), run: () => this.instantiationService.invokeFunction(accessor => new layoutActions_1.ToggleSidebarPositionAction().run(accessor)) })
            ];
        }
    };
    exports.ActivityBarCompositeBar = ActivityBarCompositeBar;
    exports.ActivityBarCompositeBar = ActivityBarCompositeBar = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService),
        __param(7, views_1.IViewDescriptorService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, actions_2.IMenuService),
        __param(12, layoutService_1.IWorkbenchLayoutService)
    ], ActivityBarCompositeBar);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.default',
                title: {
                    ...(0, nls_1.localize2)('positionActivityBarDefault', 'Move Activity Bar to Side'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miDefaultActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Default"),
                },
                shortTitle: (0, nls_1.localize)('default', "Default"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "default" /* ActivityBarPosition.DEFAULT */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 1
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "default" /* ActivityBarPosition.DEFAULT */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "default" /* ActivityBarPosition.DEFAULT */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.top',
                title: {
                    ...(0, nls_1.localize2)('positionActivityBarTop', 'Move Activity Bar to Top'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miTopActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Top"),
                },
                shortTitle: (0, nls_1.localize)('top', "Top"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "top" /* ActivityBarPosition.TOP */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 2
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "top" /* ActivityBarPosition.TOP */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "top" /* ActivityBarPosition.TOP */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.bottom',
                title: {
                    ...(0, nls_1.localize2)('positionActivityBarBottom', 'Move Activity Bar to Bottom'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miBottomActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Bottom"),
                },
                shortTitle: (0, nls_1.localize)('bottom', "Bottom"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "bottom" /* ActivityBarPosition.BOTTOM */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 3
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "bottom" /* ActivityBarPosition.BOTTOM */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "bottom" /* ActivityBarPosition.BOTTOM */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.activityBarLocation.hide',
                title: {
                    ...(0, nls_1.localize2)('hideActivityBar', 'Hide Activity Bar'),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miHideActivityBar', comment: ['&& denotes a mnemonic'] }, "&&Hidden"),
                },
                shortTitle: (0, nls_1.localize)('hide', "Hidden"),
                category: actionCommonCategories_1.Categories.View,
                toggled: contextkey_1.ContextKeyExpr.equals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "hidden" /* ActivityBarPosition.HIDDEN */),
                menu: [{
                        id: actions_2.MenuId.ActivityBarPositionMenu,
                        order: 4
                    }, {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.notEquals(`config.${"workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */}`, "hidden" /* ActivityBarPosition.HIDDEN */),
                    }]
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, "hidden" /* ActivityBarPosition.HIDDEN */);
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        submenu: actions_2.MenuId.ActivityBarPositionMenu,
        title: (0, nls_1.localize)('positionActivituBar', "Activity Bar Position"),
        group: '3_workbench_layout_move',
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitleContext, {
        submenu: actions_2.MenuId.ActivityBarPositionMenu,
        title: (0, nls_1.localize)('positionActivituBar', "Activity Bar Position"),
        when: contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)),
        group: '3_workbench_layout_move',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewTitleContext, {
        submenu: actions_2.MenuId.ActivityBarPositionMenu,
        title: (0, nls_1.localize)('positionActivituBar', "Activity Bar Position"),
        when: contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */)),
        group: '3_workbench_layout_move',
        order: 1
    });
    class SwitchSideBarViewAction extends actions_2.Action2 {
        constructor(desc, offset) {
            super(desc);
            this.offset = offset;
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const visibleViewletIds = paneCompositeService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet) {
                return;
            }
            let targetViewletId;
            for (let i = 0; i < visibleViewletIds.length; i++) {
                if (visibleViewletIds[i] === activeViewlet.getId()) {
                    targetViewletId = visibleViewletIds[(i + visibleViewletIds.length + this.offset) % visibleViewletIds.length];
                    break;
                }
            }
            await paneCompositeService.openPaneComposite(targetViewletId, 0 /* ViewContainerLocation.Sidebar */, true);
        }
    }
    (0, actions_2.registerAction2)(class PreviousSideBarViewAction extends SwitchSideBarViewAction {
        constructor() {
            super({
                id: 'workbench.action.previousSideBarView',
                title: (0, nls_1.localize2)('previousSideBarView', 'Previous Primary Side Bar View'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, -1);
        }
    });
    (0, actions_2.registerAction2)(class NextSideBarViewAction extends SwitchSideBarViewAction {
        constructor() {
            super({
                id: 'workbench.action.nextSideBarView',
                title: (0, nls_1.localize2)('nextSideBarView', 'Next Primary Side Bar View'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            }, 1);
        }
    });
    (0, actions_2.registerAction2)(class FocusActivityBarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusActivityBar',
                title: (0, nls_1.localize2)('focusActivityBar', 'Focus Activity Bar'),
                category: actionCommonCategories_1.Categories.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.focusPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const activityBarActiveBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER);
        if (activityBarActiveBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator:before {
				border-left-color: ${activityBarActiveBorderColor};
			}
		`);
        }
        const activityBarActiveFocusBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER);
        if (activityBarActiveFocusBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus::before {
				visibility: hidden;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus .active-item-indicator:before {
				visibility: visible;
				border-left-color: ${activityBarActiveFocusBorderColor};
			}
		`);
        }
        const activityBarActiveBackgroundColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND);
        if (activityBarActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator {
				z-index: 0;
				background-color: ${activityBarActiveBackgroundColor};
			}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:before {
				content: "";
				position: absolute;
				top: 8px;
				left: 8px;
				height: 32px;
				width: 32px;
				z-index: 1;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.profile-activity-item:before {
				top: -6px;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before {
				outline: 1px solid;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline: 1px dashed;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .active-item-indicator:before {
				border-left-color: ${outline};
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline-color: ${outline};
			}
		`);
        }
        // Styling without outline color
        else {
            const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusBorderColor) {
                collector.addRule(`
				.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .active-item-indicator:before {
						border-left-color: ${focusBorderColor};
					}
				`);
            }
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHliYXJQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9wYXJ0cy9hY3Rpdml0eWJhci9hY3Rpdml0eWJhclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXFDekYsSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxXQUFJOztpQkFFeEIsa0JBQWEsR0FBRyxFQUFFLEFBQUwsQ0FBTTtpQkFFbkIsNEJBQXVCLEdBQUcsb0NBQW9DLEFBQXZDLENBQXdDO2lCQUMvRCxpQ0FBNEIsR0FBRyx3Q0FBd0MsQUFBM0MsQ0FBNEM7aUJBQ3hFLG9DQUErQixHQUFHLDJDQUEyQyxBQUE5QyxDQUErQztRQWM5RixZQUNrQixpQkFBcUMsRUFDL0Isb0JBQTRELEVBQzFELGFBQXNDLEVBQ2hELFlBQTJCLEVBQ3pCLGNBQStCO1lBRWhELEtBQUssNkRBQXlCLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFOL0Usc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUNkLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFkcEYsZUFBZTtZQUVOLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1lBQzFCLGlCQUFZLEdBQVcsRUFBRSxDQUFDO1lBQzFCLGtCQUFhLEdBQVcsQ0FBQyxDQUFDO1lBQzFCLGtCQUFhLEdBQVcsTUFBTSxDQUFDLGlCQUFpQixDQUFDO1lBRTFELFlBQVk7WUFFSyxpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2QkFBaUIsRUFBb0IsQ0FBQyxDQUFDO1FBVzFGLENBQUM7UUFFTyxrQkFBa0I7WUFDekIsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENB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