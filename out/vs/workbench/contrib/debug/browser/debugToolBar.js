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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/codicons", "vs/base/browser/window", "vs/base/common/numbers", "vs/base/browser/pixelRatio", "vs/css!./media/debugToolBar"], function (require, exports, dom, mouseEvent_1, actionbar_1, actions_1, arrays, async_1, errors, lifecycle_1, nls_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, instantiation_1, notification_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, themables_1, debugActionViewItems_1, debugColors_1, debugCommands_1, icons, debug_1, layoutService_1, codicons_1, window_1, numbers_1, pixelRatio_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugToolBar = void 0;
    exports.createDisconnectMenuItemAction = createDisconnectMenuItemAction;
    const DEBUG_TOOLBAR_POSITION_KEY = 'debug.actionswidgetposition';
    const DEBUG_TOOLBAR_Y_KEY = 'debug.actionswidgety';
    let DebugToolBar = class DebugToolBar extends themeService_1.Themable {
        constructor(notificationService, telemetryService, debugService, layoutService, storageService, configurationService, themeService, instantiationService, menuService, contextKeyService) {
            super(themeService);
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.debugService = debugService;
            this.layoutService = layoutService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.yCoordinate = 0;
            this.isVisible = false;
            this.isBuilt = false;
            this.stopActionViewItemDisposables = this._register(new lifecycle_1.DisposableStore());
            /** coordinate of the debug toolbar per aux window */
            this.auxWindowCoordinates = new WeakMap();
            this.trackPixelRatioListener = this._register(new lifecycle_1.MutableDisposable());
            this.$el = dom.$('div.debug-toolbar');
            this.$el.style.top = `${layoutService.mainContainerOffset.top}px`;
            this.dragArea = dom.append(this.$el, dom.$('div.drag-area' + themables_1.ThemeIcon.asCSSSelector(icons.debugGripper)));
            const actionBarContainer = dom.append(this.$el, dom.$('div.action-bar-container'));
            this.debugToolBarMenu = menuService.createMenu(actions_2.MenuId.DebugToolBar, contextKeyService);
            this._register(this.debugToolBarMenu);
            this.activeActions = [];
            this.actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer, {
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                actionViewItemProvider: (action, options) => {
                    if (action.id === debugCommands_1.FOCUS_SESSION_ID) {
                        return this.instantiationService.createInstance(debugActionViewItems_1.FocusSessionActionViewItem, action, undefined);
                    }
                    else if (action.id === debugCommands_1.STOP_ID || action.id === debugCommands_1.DISCONNECT_ID) {
                        this.stopActionViewItemDisposables.clear();
                        const item = this.instantiationService.invokeFunction(accessor => createDisconnectMenuItemAction(action, this.stopActionViewItemDisposables, accessor, { hoverDelegate: options.hoverDelegate }));
                        if (item) {
                            return item;
                        }
                    }
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, options);
                }
            }));
            this.updateScheduler = this._register(new async_1.RunOnceScheduler(() => {
                const state = this.debugService.state;
                const toolBarLocation = this.configurationService.getValue('debug').toolBarLocation;
                if (state === 0 /* State.Inactive */ ||
                    toolBarLocation !== 'floating' ||
                    this.debugService.getModel().getSessions().every(s => s.suppressDebugToolbar) ||
                    (state === 1 /* State.Initializing */ && this.debugService.initializingOptions?.suppressDebugToolbar)) {
                    return this.hide();
                }
                const actions = [];
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.debugToolBarMenu, { shouldForwardArgs: true }, actions);
                if (!arrays.equals(actions, this.activeActions, (first, second) => first.id === second.id && first.enabled === second.enabled)) {
                    this.actionBar.clear();
                    this.actionBar.push(actions, { icon: true, label: false });
                    this.activeActions = actions;
                }
                this.show();
            }, 20));
            this.updateStyles();
            this.registerListeners();
            this.hide();
        }
        registerListeners() {
            this._register(this.debugService.onDidChangeState(() => this.updateScheduler.schedule()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.toolBarLocation')) {
                    this.updateScheduler.schedule();
                }
                if (e.affectsConfiguration("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */) || e.affectsConfiguration("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */)) {
                    this._yRange = undefined;
                    this.setYCoordinate();
                }
            }));
            this._register(this.debugToolBarMenu.onDidChange(() => this.updateScheduler.schedule()));
            this._register(this.actionBar.actionRunner.onDidRun((e) => {
                // check for error
                if (e.error && !errors.isCancellationError(e.error)) {
                    this.notificationService.warn(e.error);
                }
                // log in telemetry
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'debugActionsWidget' });
            }));
            this._register(dom.addDisposableGenericMouseUpListener(this.dragArea, (event) => {
                const mouseClickEvent = new mouseEvent_1.StandardMouseEvent(dom.getWindow(this.dragArea), event);
                const activeWindow = dom.getWindow(this.layoutService.activeContainer);
                if (mouseClickEvent.detail === 2) {
                    // double click on debug bar centers it again #8250
                    const widgetWidth = this.$el.clientWidth;
                    this.setCoordinates(0.5 * activeWindow.innerWidth - 0.5 * widgetWidth, this.yDefault);
                    this.storePosition();
                }
            }));
            this._register(dom.addDisposableGenericMouseDownListener(this.dragArea, (event) => {
                this.dragArea.classList.add('dragged');
                const activeWindow = dom.getWindow(this.layoutService.activeContainer);
                const mouseMoveListener = dom.addDisposableGenericMouseMoveListener(activeWindow, (e) => {
                    const mouseMoveEvent = new mouseEvent_1.StandardMouseEvent(activeWindow, e);
                    // Prevent default to stop editor selecting text #8524
                    mouseMoveEvent.preventDefault();
                    // Reduce x by width of drag handle to reduce jarring #16604
                    this.setCoordinates(mouseMoveEvent.posx - 14, mouseMoveEvent.posy - 14);
                });
                const mouseUpListener = dom.addDisposableGenericMouseUpListener(activeWindow, (e) => {
                    this.storePosition();
                    this.dragArea.classList.remove('dragged');
                    mouseMoveListener.dispose();
                    mouseUpListener.dispose();
                });
            }));
            this._register(this.layoutService.onDidChangePartVisibility(() => this.setYCoordinate()));
            const resizeListener = this._register(new lifecycle_1.MutableDisposable());
            this._register(this.layoutService.onDidChangeActiveContainer(async () => {
                this._yRange = undefined;
                // note: we intentionally don't keep the activeContainer before the
                // `await` clause to avoid any races due to quickly switching windows.
                await this.layoutService.whenContainerStylesLoaded(dom.getWindow(this.layoutService.activeContainer));
                if (this.isBuilt) {
                    this.doShowInActiveContainer();
                    this.setCoordinates();
                }
                resizeListener.value = this._register(dom.addDisposableListener(dom.getWindow(this.layoutService.activeContainer), dom.EventType.RESIZE, () => this.setYCoordinate()));
            }));
        }
        storePosition() {
            const activeWindow = dom.getWindow(this.layoutService.activeContainer);
            const isMainWindow = this.layoutService.activeContainer === this.layoutService.mainContainer;
            const left = this.$el.getBoundingClientRect().left / activeWindow.innerWidth;
            if (isMainWindow) {
                this.storageService.store(DEBUG_TOOLBAR_POSITION_KEY, left, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store(DEBUG_TOOLBAR_Y_KEY, this.yCoordinate, 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.auxWindowCoordinates.set(activeWindow, { x: left, y: this.yCoordinate });
            }
        }
        updateStyles() {
            super.updateStyles();
            if (this.$el) {
                this.$el.style.backgroundColor = this.getColor(debugColors_1.debugToolBarBackground) || '';
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                this.$el.style.boxShadow = widgetShadowColor ? `0 0 8px 2px ${widgetShadowColor}` : '';
                const contrastBorderColor = this.getColor(colorRegistry_1.widgetBorder);
                const borderColor = this.getColor(debugColors_1.debugToolBarBorder);
                if (contrastBorderColor) {
                    this.$el.style.border = `1px solid ${contrastBorderColor}`;
                }
                else {
                    this.$el.style.border = borderColor ? `solid ${borderColor}` : 'none';
                    this.$el.style.border = '1px 0';
                }
            }
        }
        setCoordinates(x, y) {
            if (!this.isVisible) {
                return;
            }
            const widgetWidth = this.$el.clientWidth;
            const currentWindow = dom.getWindow(this.layoutService.activeContainer);
            const isMainWindow = currentWindow === window_1.mainWindow;
            if (x === undefined) {
                const positionPercentage = isMainWindow
                    ? Number(this.storageService.get(DEBUG_TOOLBAR_POSITION_KEY, 0 /* StorageScope.PROFILE */))
                    : this.auxWindowCoordinates.get(currentWindow)?.x;
                x = positionPercentage !== undefined && !isNaN(positionPercentage)
                    ? positionPercentage * currentWindow.innerWidth
                    : (0.5 * currentWindow.innerWidth - 0.5 * widgetWidth);
            }
            x = (0, numbers_1.clamp)(x, 0, currentWindow.innerWidth - widgetWidth); // do not allow the widget to overflow on the right
            this.$el.style.left = `${x}px`;
            if (y === undefined) {
                y = isMainWindow
                    ? this.storageService.getNumber(DEBUG_TOOLBAR_Y_KEY, 0 /* StorageScope.PROFILE */)
                    : this.auxWindowCoordinates.get(currentWindow)?.y;
            }
            this.setYCoordinate(y ?? this.yDefault);
        }
        setYCoordinate(y = this.yCoordinate) {
            const [yMin, yMax] = this.yRange;
            y = Math.max(yMin, Math.min(y, yMax));
            this.$el.style.top = `${y}px`;
            this.yCoordinate = y;
        }
        get yDefault() {
            return this.layoutService.mainContainerOffset.top;
        }
        get yRange() {
            if (!this._yRange) {
                const isTitleBarVisible = this.layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, dom.getWindow(this.layoutService.activeContainer));
                const yMin = isTitleBarVisible ? 0 : this.layoutService.mainContainerOffset.top;
                let yMax = 0;
                if (isTitleBarVisible) {
                    if (this.configurationService.getValue("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */) === true) {
                        yMax += 35;
                    }
                    else {
                        yMax += 28;
                    }
                }
                if (this.configurationService.getValue("workbench.editor.showTabs" /* LayoutSettings.EDITOR_TABS_MODE */) !== "none" /* EditorTabsMode.NONE */) {
                    yMax += 35;
                }
                this._yRange = [yMin, yMax];
            }
            return this._yRange;
        }
        show() {
            if (this.isVisible) {
                this.setCoordinates();
                return;
            }
            if (!this.isBuilt) {
                this.isBuilt = true;
                this.doShowInActiveContainer();
            }
            this.isVisible = true;
            dom.show(this.$el);
            this.setCoordinates();
        }
        doShowInActiveContainer() {
            this.layoutService.activeContainer.appendChild(this.$el);
            this.trackPixelRatioListener.value = pixelRatio_1.PixelRatio.getInstance(dom.getWindow(this.$el)).onDidChange(() => this.setYCoordinate());
        }
        hide() {
            this.isVisible = false;
            dom.hide(this.$el);
        }
        dispose() {
            super.dispose();
            this.$el?.remove();
        }
    };
    exports.DebugToolBar = DebugToolBar;
    exports.DebugToolBar = DebugToolBar = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, debug_1.IDebugService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, actions_2.IMenuService),
        __param(9, contextkey_1.IContextKeyService)
    ], DebugToolBar);
    function createDisconnectMenuItemAction(action, disposables, accessor, options) {
        const menuService = accessor.get(actions_2.IMenuService);
        const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const menu = menuService.createMenu(actions_2.MenuId.DebugToolBarStop, contextKeyService);
        const secondary = [];
        (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, secondary);
        if (!secondary.length) {
            return undefined;
        }
        const dropdownAction = disposables.add(new actions_1.Action('notebook.moreRunActions', (0, nls_1.localize)('notebook.moreRunActionsLabel', "More..."), 'codicon-chevron-down', true));
        const item = instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, action, dropdownAction, secondary, 'debug-stop-actions', contextMenuService, options);
        return item;
    }
    // Debug toolbar
    const debugViewTitleItems = [];
    const registerDebugToolBarItem = (id, title, order, icon, when, precondition, alt) => {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBar, {
            group: 'navigation',
            when,
            order,
            command: {
                id,
                title,
                icon,
                precondition
            },
            alt
        });
        // Register actions in debug viewlet when toolbar is docked
        debugViewTitleItems.push(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, {
            group: 'navigation',
            when: contextkey_1.ContextKeyExpr.and(when, contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked')),
            order,
            command: {
                id,
                title,
                icon,
                precondition
            }
        }));
    };
    actions_2.MenuRegistry.onDidChangeMenu(e => {
        // In case the debug toolbar is docked we need to make sure that the docked toolbar has the up to date commands registered #115945
        if (e.has(actions_2.MenuId.DebugToolBar)) {
            (0, lifecycle_1.dispose)(debugViewTitleItems);
            const items = actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.DebugToolBar);
            for (const i of items) {
                debugViewTitleItems.push(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, {
                    ...i,
                    when: contextkey_1.ContextKeyExpr.and(i.when, contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked'))
                }));
            }
        }
    });
    const CONTEXT_TOOLBAR_COMMAND_CENTER = contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'commandCenter');
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandCenterCenter, {
        submenu: actions_2.MenuId.DebugToolBar,
        title: 'Debug',
        icon: codicons_1.Codicon.debug,
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, CONTEXT_TOOLBAR_COMMAND_CENTER)
    });
    registerDebugToolBarItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 10, icons.debugContinue, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 10, icons.debugPause, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('stopped'), contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'), debug_1.CONTEXT_FOCUSED_SESSION_IS_NO_DEBUG.toNegated()));
    registerDebugToolBarItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 70, icons.debugStop, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), undefined, { id: debugCommands_1.DISCONNECT_ID, title: debugCommands_1.DISCONNECT_LABEL, icon: icons.debugDisconnect, precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), });
    registerDebugToolBarItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, 70, icons.debugDisconnect, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, undefined, { id: debugCommands_1.STOP_ID, title: debugCommands_1.STOP_LABEL, icon: icons.debugStop, precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), });
    registerDebugToolBarItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 20, icons.debugStepOver, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 30, icons.debugStepInto, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 40, icons.debugStepOut, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 60, icons.debugRestart);
    registerDebugToolBarItem(debugCommands_1.STEP_BACK_ID, (0, nls_1.localize)('stepBackDebug', "Step Back"), 50, icons.debugStepBack, debug_1.CONTEXT_STEP_BACK_SUPPORTED, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.REVERSE_CONTINUE_ID, (0, nls_1.localize)('reverseContinue', "Reverse"), 55, icons.debugReverseContinue, debug_1.CONTEXT_STEP_BACK_SUPPORTED, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.FOCUS_SESSION_ID, debugCommands_1.FOCUS_SESSION_LABEL, 100, codicons_1.Codicon.listTree, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_MULTI_SESSION_DEBUG, CONTEXT_TOOLBAR_COMMAND_CENTER.negate()));
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBarStop, {
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED),
        order: 0,
        command: {
            id: debugCommands_1.DISCONNECT_ID,
            title: debugCommands_1.DISCONNECT_LABEL,
            icon: icons.debugDisconnect
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBarStop, {
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED),
        order: 0,
        command: {
            id: debugCommands_1.STOP_ID,
            title: debugCommands_1.STOP_LABEL,
            icon: icons.debugStop
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBarStop, {
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED)),
        order: 0,
        command: {
            id: debugCommands_1.DISCONNECT_AND_SUSPEND_ID,
            title: debugCommands_1.DISCONNECT_AND_SUSPEND_LABEL,
            icon: icons.debugDisconnect
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdUb29sQmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9kZWJ1Zy9icm93c2VyL2RlYnVnVG9vbEJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnVmhHLHdFQXVCQztJQTlURCxNQUFNLDBCQUEwQixHQUFHLDZCQUE2QixDQUFDO0lBQ2pFLE1BQU0sbUJBQW1CLEdBQUcsc0JBQXNCLENBQUM7SUFFNUMsSUFBTSxZQUFZLEdBQWxCLE1BQU0sWUFBYSxTQUFRLHVCQUFRO1FBbUJ6QyxZQUN1QixtQkFBMEQsRUFDN0QsZ0JBQW9ELEVBQ3hELFlBQTRDLEVBQ2xDLGFBQXVELEVBQy9ELGNBQWdELEVBQzFDLG9CQUE0RCxFQUNwRSxZQUEyQixFQUNuQixvQkFBNEQsRUFDckUsV0FBeUIsRUFDbkIsaUJBQXFDO1lBRXpELEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztZQVhtQix3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzVDLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBbUI7WUFDdkMsaUJBQVksR0FBWixZQUFZLENBQWU7WUFDakIsa0JBQWEsR0FBYixhQUFhLENBQXlCO1lBQzlDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtZQUN6Qix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1lBRTNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFuQjVFLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1lBRWhCLGNBQVMsR0FBRyxLQUFLLENBQUM7WUFDbEIsWUFBTyxHQUFHLEtBQUssQ0FBQztZQUVQLGtDQUE2QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUN2RixxREFBcUQ7WUFDcEMseUJBQW9CLEdBQUcs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