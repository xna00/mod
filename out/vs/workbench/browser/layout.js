/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/browser", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/platform", "vs/workbench/common/editor", "vs/workbench/browser/parts/sidebar/sidebarPart", "vs/workbench/browser/parts/panel/panelPart", "vs/workbench/services/layout/browser/layoutService", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/workbench/services/title/browser/titleService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/window/common/window", "vs/workbench/services/host/browser/host", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/ui/grid/grid", "vs/workbench/browser/part", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/files/common/files", "vs/editor/browser/editorBrowser", "vs/base/common/arrays", "vs/base/common/types", "vs/platform/notification/common/notification", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/base/common/uri", "vs/workbench/common/views", "vs/workbench/common/editor/diffEditorInput", "vs/base/common/performance", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/base/common/async", "vs/workbench/services/banner/browser/bannerService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarPart", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/auxiliaryWindow/browser/auxiliaryWindowService", "vs/base/browser/window"], function (require, exports, lifecycle_1, event_1, dom_1, browser_1, workingCopyBackup_1, platform_1, editor_1, sidebarPart_1, panelPart_1, layoutService_1, workspace_1, storage_1, configuration_1, titleService_1, lifecycle_2, window_1, host_1, environmentService_1, editorService_1, editorGroupsService_1, grid_1, part_1, statusbar_1, files_1, editorBrowser_1, arrays_1, types_1, notification_1, themeService_1, theme_1, uri_1, views_1, diffEditorInput_1, performance_1, extensions_1, log_1, async_1, bannerService_1, panecomposite_1, auxiliaryBarPart_1, telemetry_1, auxiliaryWindowService_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Layout = exports.TITLE_BAR_SETTINGS = void 0;
    var LayoutClasses;
    (function (LayoutClasses) {
        LayoutClasses["SIDEBAR_HIDDEN"] = "nosidebar";
        LayoutClasses["MAIN_EDITOR_AREA_HIDDEN"] = "nomaineditorarea";
        LayoutClasses["PANEL_HIDDEN"] = "nopanel";
        LayoutClasses["AUXILIARYBAR_HIDDEN"] = "noauxiliarybar";
        LayoutClasses["STATUSBAR_HIDDEN"] = "nostatusbar";
        LayoutClasses["FULLSCREEN"] = "fullscreen";
        LayoutClasses["MAXIMIZED"] = "maximized";
        LayoutClasses["WINDOW_BORDER"] = "border";
    })(LayoutClasses || (LayoutClasses = {}));
    exports.TITLE_BAR_SETTINGS = [
        "workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */,
        "window.commandCenter" /* LayoutSettings.COMMAND_CENTER */,
        "workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */,
        "workbench.layoutControl.enabled" /* LayoutSettings.LAYOUT_ACTIONS */,
        'window.menuBarVisibility',
        "window.titleBarStyle" /* TitleBarSetting.TITLE_BAR_STYLE */,
        "window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */,
    ];
    class Layout extends lifecycle_1.Disposable {
        get activeContainer() { return this.getContainerFromDocument((0, dom_1.getActiveDocument)()); }
        get containers() {
            const containers = [];
            for (const { window } of (0, dom_1.getWindows)()) {
                containers.push(this.getContainerFromDocument(window.document));
            }
            return containers;
        }
        getContainerFromDocument(targetDocument) {
            if (targetDocument === this.mainContainer.ownerDocument) {
                // main window
                return this.mainContainer;
            }
            else {
                // auxiliary window
                return targetDocument.body.getElementsByClassName('monaco-workbench')[0];
            }
        }
        whenContainerStylesLoaded(window) {
            return this.containerStylesLoaded.get(window.vscodeWindowId);
        }
        get mainContainerDimension() { return this._mainContainerDimension; }
        get activeContainerDimension() {
            return this.getContainerDimension(this.activeContainer);
        }
        getContainerDimension(container) {
            if (container === this.mainContainer) {
                // main window
                return this.mainContainerDimension;
            }
            else {
                // auxiliary window
                return (0, dom_1.getClientArea)(container);
            }
        }
        get mainContainerOffset() {
            return this.computeContainerOffset(window_2.mainWindow);
        }
        get activeContainerOffset() {
            return this.computeContainerOffset((0, dom_1.getWindow)(this.activeContainer));
        }
        computeContainerOffset(targetWindow) {
            let top = 0;
            let quickPickTop = 0;
            if (this.isVisible("workbench.parts.banner" /* Parts.BANNER_PART */)) {
                top = this.getPart("workbench.parts.banner" /* Parts.BANNER_PART */).maximumHeight;
                quickPickTop = top;
            }
            const titlebarVisible = this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, targetWindow);
            if (titlebarVisible) {
                top += this.getPart("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */).maximumHeight;
                quickPickTop = top;
            }
            const isCommandCenterVisible = titlebarVisible && this.configurationService.getValue("window.commandCenter" /* LayoutSettings.COMMAND_CENTER */) !== false;
            if (isCommandCenterVisible) {
                // If the command center is visible then the quickinput
                // should go over the title bar and the banner
                quickPickTop = 6;
            }
            return { top, quickPickTop };
        }
        constructor(parent) {
            super();
            this.parent = parent;
            //#region Events
            this._onDidChangeZenMode = this._register(new event_1.Emitter());
            this.onDidChangeZenMode = this._onDidChangeZenMode.event;
            this._onDidChangeMainEditorCenteredLayout = this._register(new event_1.Emitter());
            this.onDidChangeMainEditorCenteredLayout = this._onDidChangeMainEditorCenteredLayout.event;
            this._onDidChangePanelAlignment = this._register(new event_1.Emitter());
            this.onDidChangePanelAlignment = this._onDidChangePanelAlignment.event;
            this._onDidChangeWindowMaximized = this._register(new event_1.Emitter());
            this.onDidChangeWindowMaximized = this._onDidChangeWindowMaximized.event;
            this._onDidChangePanelPosition = this._register(new event_1.Emitter());
            this.onDidChangePanelPosition = this._onDidChangePanelPosition.event;
            this._onDidChangePartVisibility = this._register(new event_1.Emitter());
            this.onDidChangePartVisibility = this._onDidChangePartVisibility.event;
            this._onDidChangeNotificationsVisibility = this._register(new event_1.Emitter());
            this.onDidChangeNotificationsVisibility = this._onDidChangeNotificationsVisibility.event;
            this._onDidLayoutMainContainer = this._register(new event_1.Emitter());
            this.onDidLayoutMainContainer = this._onDidLayoutMainContainer.event;
            this._onDidLayoutActiveContainer = this._register(new event_1.Emitter());
            this.onDidLayoutActiveContainer = this._onDidLayoutActiveContainer.event;
            this._onDidLayoutContainer = this._register(new event_1.Emitter());
            this.onDidLayoutContainer = this._onDidLayoutContainer.event;
            this._onDidAddContainer = this._register(new event_1.Emitter());
            this.onDidAddContainer = this._onDidAddContainer.event;
            this._onDidChangeActiveContainer = this._register(new event_1.Emitter());
            this.onDidChangeActiveContainer = this._onDidChangeActiveContainer.event;
            //#endregion
            //#region Properties
            this.mainContainer = document.createElement('div');
            this.containerStylesLoaded = new Map();
            //#endregion
            this.parts = new Map();
            this.initialized = false;
            this.disposed = false;
            this._openedDefaultEditors = false;
            this.whenReadyPromise = new async_1.DeferredPromise();
            this.whenReady = this.whenReadyPromise.p;
            this.whenRestoredPromise = new async_1.DeferredPromise();
            this.whenRestored = this.whenRestoredPromise.p;
            this.restored = false;
        }
        initLayout(accessor) {
            // Services
            this.environmentService = accessor.get(environmentService_1.IBrowserWorkbenchEnvironmentService);
            this.configurationService = accessor.get(configuration_1.IConfigurationService);
            this.hostService = accessor.get(host_1.IHostService);
            this.contextService = accessor.get(workspace_1.IWorkspaceContextService);
            this.storageService = accessor.get(storage_1.IStorageService);
            this.workingCopyBackupService = accessor.get(workingCopyBackup_1.IWorkingCopyBackupService);
            this.themeService = accessor.get(themeService_1.IThemeService);
            this.extensionService = accessor.get(extensions_1.IExtensionService);
            this.logService = accessor.get(log_1.ILogService);
            this.telemetryService = accessor.get(telemetry_1.ITelemetryService);
            this.auxiliaryWindowService = accessor.get(auxiliaryWindowService_1.IAuxiliaryWindowService);
            // Parts
            this.editorService = accessor.get(editorService_1.IEditorService);
            this.mainPartEditorService = this.editorService.createScoped('main', this._store);
            this.editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            this.paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            this.viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            this.titleService = accessor.get(titleService_1.ITitleService);
            this.notificationService = accessor.get(notification_1.INotificationService);
            this.statusBarService = accessor.get(statusbar_1.IStatusbarService);
            accessor.get(bannerService_1.IBannerService);
            // Listeners
            this.registerLayoutListeners();
            // State
            this.initLayoutState(accessor.get(lifecycle_2.ILifecycleService), accessor.get(files_1.IFileService));
        }
        registerLayoutListeners() {
            // Restore editor if hidden
            const showEditorIfHidden = () => {
                if (!this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, window_2.mainWindow)) {
                    this.toggleMaximizedPanel();
                }
            };
            // Wait to register these listeners after the editor group service
            // is ready to avoid conflicts on startup
            this.editorGroupService.whenRestored.then(() => {
                // Restore main editor part on any editor change in main part
                this._register(this.mainPartEditorService.onDidVisibleEditorsChange(showEditorIfHidden));
                this._register(this.editorGroupService.mainPart.onDidActivateGroup(showEditorIfHidden));
                // Revalidate center layout when active editor changes: diff editor quits centered mode.
                this._register(this.mainPartEditorService.onDidActiveEditorChange(() => this.centerMainEditorLayout(this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED))));
            });
            // Configuration changes
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                if ([
                    ...exports.TITLE_BAR_SETTINGS,
                    LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION,
                    LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE,
                ].some(setting => e.affectsConfiguration(setting))) {
                    // Show Custom TitleBar if actions moved to the titlebar
                    const editorActionsMovedToTitlebar = e.affectsConfiguration("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */) && this.configurationService.getValue("workbench.editor.editorActionsLocation" /* LayoutSettings.EDITOR_ACTIONS_LOCATION */) === "titleBar" /* EditorActionsLocation.TITLEBAR */;
                    let activityBarMovedToTopOrBottom = false;
                    if (e.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */)) {
                        const activityBarPosition = this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */);
                        activityBarMovedToTopOrBottom = activityBarPosition === "top" /* ActivityBarPosition.TOP */ || activityBarPosition === "bottom" /* ActivityBarPosition.BOTTOM */;
                    }
                    if (activityBarMovedToTopOrBottom || editorActionsMovedToTitlebar) {
                        if (this.configurationService.getValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */) === "never" /* CustomTitleBarVisibility.NEVER */) {
                            this.configurationService.updateValue("window.customTitleBarVisibility" /* TitleBarSetting.CUSTOM_TITLE_BAR_VISIBILITY */, "auto" /* CustomTitleBarVisibility.AUTO */);
                        }
                    }
                    this.doUpdateLayoutConfiguration();
                }
            }));
            // Fullscreen changes
            this._register((0, browser_1.onDidChangeFullscreen)(windowId => this.onFullscreenChanged(windowId)));
            // Group changes
            this._register(this.editorGroupService.mainPart.onDidAddGroup(() => this.centerMainEditorLayout(this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED))));
            this._register(this.editorGroupService.mainPart.onDidRemoveGroup(() => this.centerMainEditorLayout(this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED))));
            this._register(this.editorGroupService.mainPart.onDidChangeGroupMaximized(() => this.centerMainEditorLayout(this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED))));
            // Prevent workbench from scrolling #55456
            this._register((0, dom_1.addDisposableListener)(this.mainContainer, dom_1.EventType.SCROLL, () => this.mainContainer.scrollTop = 0));
            // Menubar visibility changes
            const showingCustomMenu = (platform_1.isWindows || platform_1.isLinux || platform_1.isWeb) && !(0, window_1.hasNativeTitlebar)(this.configurationService);
            if (showingCustomMenu) {
                this._register(this.titleService.onMenubarVisibilityChange(visible => this.onMenubarToggled(visible)));
            }
            // Theme changes
            this._register(this.themeService.onDidColorThemeChange(() => this.updateWindowsBorder()));
            // Window active / focus changes
            this._register(this.hostService.onDidChangeFocus(focused => this.onWindowFocusChanged(focused)));
            this._register(this.hostService.onDidChangeActiveWindow(() => this.onActiveWindowChanged()));
            // WCO changes
            if (platform_1.isWeb && typeof navigator.windowControlsOverlay === 'object') {
                this._register((0, dom_1.addDisposableListener)(navigator.windowControlsOverlay, 'geometrychange', () => this.onDidChangeWCO()));
            }
            // Auxiliary windows
            this._register(this.auxiliaryWindowService.onDidOpenAuxiliaryWindow(({ window, disposables }) => {
                const windowId = window.window.vscodeWindowId;
                this.containerStylesLoaded.set(windowId, window.whenStylesHaveLoaded);
                window.whenStylesHaveLoaded.then(() => this.containerStylesLoaded.delete(windowId));
                disposables.add((0, lifecycle_1.toDisposable)(() => this.containerStylesLoaded.delete(windowId)));
                const eventDisposables = disposables.add(new lifecycle_1.DisposableStore());
                this._onDidAddContainer.fire({ container: window.container, disposables: eventDisposables });
                disposables.add(window.onDidLayout(dimension => this.handleContainerDidLayout(window.container, dimension)));
            }));
        }
        onMenubarToggled(visible) {
            if (visible !== this.state.runtime.menuBar.toggled) {
                this.state.runtime.menuBar.toggled = visible;
                const menuBarVisibility = (0, window_1.getMenuBarVisibility)(this.configurationService);
                // The menu bar toggles the title bar in web because it does not need to be shown for window controls only
                if (platform_1.isWeb && menuBarVisibility === 'toggle') {
                    this.workbenchGrid.setViewVisible(this.titleBarPartView, (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled));
                }
                // The menu bar toggles the title bar in full screen for toggle and classic settings
                else if (this.state.runtime.mainWindowFullscreen && (menuBarVisibility === 'toggle' || menuBarVisibility === 'classic')) {
                    this.workbenchGrid.setViewVisible(this.titleBarPartView, (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled));
                }
                // Move layout call to any time the menubar
                // is toggled to update consumers of offset
                // see issue #115267
                this.handleContainerDidLayout(this.mainContainer, this._mainContainerDimension);
            }
        }
        handleContainerDidLayout(container, dimension) {
            if (container === this.mainContainer) {
                this._onDidLayoutMainContainer.fire(dimension);
            }
            if ((0, dom_1.isActiveDocument)(container)) {
                this._onDidLayoutActiveContainer.fire(dimension);
            }
            this._onDidLayoutContainer.fire({ container, dimension });
        }
        onFullscreenChanged(windowId) {
            if (windowId !== window_2.mainWindow.vscodeWindowId) {
                return; // ignore all but main window
            }
            this.state.runtime.mainWindowFullscreen = (0, browser_1.isFullscreen)(window_2.mainWindow);
            // Apply as CSS class
            if (this.state.runtime.mainWindowFullscreen) {
                this.mainContainer.classList.add(LayoutClasses.FULLSCREEN);
            }
            else {
                this.mainContainer.classList.remove(LayoutClasses.FULLSCREEN);
                const zenModeExitInfo = this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_EXIT_INFO);
                const zenModeActive = this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE);
                if (zenModeExitInfo.transitionedToFullScreen && zenModeActive) {
                    this.toggleZenMode();
                }
            }
            // Change edge snapping accordingly
            this.workbenchGrid.edgeSnapping = this.state.runtime.mainWindowFullscreen;
            // Changing fullscreen state of the main window has an impact
            // on custom title bar visibility, so we need to update
            if ((0, window_1.hasCustomTitlebar)(this.configurationService)) {
                // Propagate to grid
                this.workbenchGrid.setViewVisible(this.titleBarPartView, (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled));
                this.updateWindowsBorder(true);
            }
        }
        onActiveWindowChanged() {
            const activeContainerId = this.getActiveContainerId();
            if (this.state.runtime.activeContainerId !== activeContainerId) {
                this.state.runtime.activeContainerId = activeContainerId;
                // Indicate active window border
                this.updateWindowsBorder();
                this._onDidChangeActiveContainer.fire();
            }
        }
        onWindowFocusChanged(hasFocus) {
            if (this.state.runtime.hasFocus !== hasFocus) {
                this.state.runtime.hasFocus = hasFocus;
                this.updateWindowsBorder();
            }
        }
        getActiveContainerId() {
            const activeContainer = this.activeContainer;
            return (0, dom_1.getWindow)(activeContainer).vscodeWindowId;
        }
        doUpdateLayoutConfiguration(skipLayout) {
            // Custom Titlebar visibility with native titlebar
            this.updateCustomTitleBarVisibility();
            // Menubar visibility
            this.updateMenubarVisibility(!!skipLayout);
            // Centered Layout
            this.editorGroupService.whenRestored.then(() => {
                this.centerMainEditorLayout(this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED), skipLayout);
            });
        }
        setSideBarPosition(position) {
            const activityBar = this.getPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const auxiliaryBar = this.getPart("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            const newPositionValue = (position === 0 /* Position.LEFT */) ? 'left' : 'right';
            const oldPositionValue = (position === 1 /* Position.RIGHT */) ? 'left' : 'right';
            const panelAlignment = this.getPanelAlignment();
            const panelPosition = this.getPanelPosition();
            this.stateModel.setRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON, position);
            // Adjust CSS
            const activityBarContainer = (0, types_1.assertIsDefined)(activityBar.getContainer());
            const sideBarContainer = (0, types_1.assertIsDefined)(sideBar.getContainer());
            const auxiliaryBarContainer = (0, types_1.assertIsDefined)(auxiliaryBar.getContainer());
            activityBarContainer.classList.remove(oldPositionValue);
            sideBarContainer.classList.remove(oldPositionValue);
            activityBarContainer.classList.add(newPositionValue);
            sideBarContainer.classList.add(newPositionValue);
            // Auxiliary Bar has opposite values
            auxiliaryBarContainer.classList.remove(newPositionValue);
            auxiliaryBarContainer.classList.add(oldPositionValue);
            // Update Styles
            activityBar.updateStyles();
            sideBar.updateStyles();
            auxiliaryBar.updateStyles();
            // Move activity bar and side bars
            this.adjustPartPositions(position, panelAlignment, panelPosition);
        }
        updateWindowsBorder(skipLayout = false) {
            if (platform_1.isWeb ||
                platform_1.isWindows || // not working well with zooming and window control overlays
                (0, window_1.hasNativeTitlebar)(this.configurationService)) {
                return;
            }
            const theme = this.themeService.getColorTheme();
            const activeBorder = theme.getColor(theme_1.WINDOW_ACTIVE_BORDER);
            const inactiveBorder = theme.getColor(theme_1.WINDOW_INACTIVE_BORDER);
            const didHaveMainWindowBorder = this.hasMainWindowBorder();
            for (const container of this.containers) {
                const isMainContainer = container === this.mainContainer;
                const isActiveContainer = this.activeContainer === container;
                const containerWindowId = (0, dom_1.getWindowId)((0, dom_1.getWindow)(container));
                let windowBorder = false;
                if (!this.state.runtime.mainWindowFullscreen && !this.state.runtime.maximized.has(containerWindowId) && (activeBorder || inactiveBorder)) {
                    windowBorder = true;
                    // If the inactive color is missing, fallback to the active one
                    const borderColor = isActiveContainer && this.state.runtime.hasFocus ? activeBorder : inactiveBorder ?? activeBorder;
                    container.style.setProperty('--window-border-color', borderColor?.toString() ?? 'transparent');
                }
                if (isMainContainer) {
                    this.state.runtime.mainWindowBorder = windowBorder;
                }
                container.classList.toggle(LayoutClasses.WINDOW_BORDER, windowBorder);
            }
            if (!skipLayout && didHaveMainWindowBorder !== this.hasMainWindowBorder()) {
                this.layout();
            }
        }
        initLayoutState(lifecycleService, fileService) {
            this.stateModel = new LayoutStateModel(this.storageService, this.configurationService, this.contextService, this.parent);
            this.stateModel.load();
            // Both editor and panel should not be hidden on startup
            if (this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN) && this.stateModel.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN)) {
                this.stateModel.setRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN, false);
            }
            this.stateModel.onDidChangeState(change => {
                if (change.key === LayoutStateKeys.ACTIVITYBAR_HIDDEN) {
                    this.setActivityBarHidden(change.value);
                }
                if (change.key === LayoutStateKeys.STATUSBAR_HIDDEN) {
                    this.setStatusBarHidden(change.value);
                }
                if (change.key === LayoutStateKeys.SIDEBAR_POSITON) {
                    this.setSideBarPosition(change.value);
                }
                if (change.key === LayoutStateKeys.PANEL_POSITION) {
                    this.setPanelPosition(change.value);
                }
                if (change.key === LayoutStateKeys.PANEL_ALIGNMENT) {
                    this.setPanelAlignment(change.value);
                }
                this.doUpdateLayoutConfiguration();
            });
            // Layout Initialization State
            const initialEditorsState = this.getInitialEditorsState();
            if (initialEditorsState) {
                this.logService.info('Initial editor state', initialEditorsState);
            }
            const initialLayoutState = {
                layout: {
                    editors: initialEditorsState?.layout
                },
                editor: {
                    restoreEditors: this.shouldRestoreEditors(this.contextService, initialEditorsState),
                    editorsToOpen: this.resolveEditorsToOpen(fileService, initialEditorsState),
                },
                views: {
                    defaults: this.getDefaultLayoutViews(this.environmentService, this.storageService),
                    containerToRestore: {}
                }
            };
            // Layout Runtime State
            const layoutRuntimeState = {
                activeContainerId: this.getActiveContainerId(),
                mainWindowFullscreen: (0, browser_1.isFullscreen)(window_2.mainWindow),
                hasFocus: this.hostService.hasFocus,
                maximized: new Set(),
                mainWindowBorder: false,
                menuBar: {
                    toggled: false,
                },
                zenMode: {
                    transitionDisposables: new lifecycle_1.DisposableMap(),
                }
            };
            this.state = {
                initialization: initialLayoutState,
                runtime: layoutRuntimeState,
            };
            // Sidebar View Container To Restore
            if (this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                // Only restore last viewlet if window was reloaded or we are in development mode
                let viewContainerToRestore;
                if (!this.environmentService.isBuilt || lifecycleService.startupKind === 3 /* StartupKind.ReloadedWindow */) {
                    viewContainerToRestore = this.storageService.get(sidebarPart_1.SidebarPart.activeViewletSettingsKey, 1 /* StorageScope.WORKSPACE */, this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)?.id);
                }
                else {
                    viewContainerToRestore = this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)?.id;
                }
                if (viewContainerToRestore) {
                    this.state.initialization.views.containerToRestore.sideBar = viewContainerToRestore;
                }
                else {
                    this.stateModel.setRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN, true);
                }
            }
            // Panel View Container To Restore
            if (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                const viewContainerToRestore = this.storageService.get(panelPart_1.PanelPart.activePanelSettingsKey, 1 /* StorageScope.WORKSPACE */, this.viewDescriptorService.getDefaultViewContainer(1 /* ViewContainerLocation.Panel */)?.id);
                if (viewContainerToRestore) {
                    this.state.initialization.views.containerToRestore.panel = viewContainerToRestore;
                }
                else {
                    this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_HIDDEN, true);
                }
            }
            // Auxiliary Panel to restore
            if (this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                const viewContainerToRestore = this.storageService.get(auxiliaryBarPart_1.AuxiliaryBarPart.activePanelSettingsKey, 1 /* StorageScope.WORKSPACE */, this.viewDescriptorService.getDefaultViewContainer(2 /* ViewContainerLocation.AuxiliaryBar */)?.id);
                if (viewContainerToRestore) {
                    this.state.initialization.views.containerToRestore.auxiliaryBar = viewContainerToRestore;
                }
                else {
                    this.stateModel.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN, true);
                }
            }
            // Window border
            this.updateWindowsBorder(true);
        }
        getDefaultLayoutViews(environmentService, storageService) {
            const defaultLayout = environmentService.options?.defaultLayout;
            if (!defaultLayout) {
                return undefined;
            }
            if (!defaultLayout.force && !storageService.isNew(1 /* StorageScope.WORKSPACE */)) {
                return undefined;
            }
            const { views } = defaultLayout;
            if (views?.length) {
                return views.map(view => view.id);
            }
            return undefined;
        }
        shouldRestoreEditors(contextService, initialEditorsState) {
            // Restore editors based on a set of rules:
            // - never when running on temporary workspace
            // - not when we have files to open, unless:
            // - always when `window.restoreWindows: preserve`
            if ((0, workspace_1.isTemporaryWorkspace)(contextService.getWorkspace())) {
                return false;
            }
            const forceRestoreEditors = this.configurationService.getValue('window.restoreWindows') === 'preserve';
            return !!forceRestoreEditors || initialEditorsState === undefined;
        }
        willRestoreEditors() {
            return this.state.initialization.editor.restoreEditors;
        }
        async resolveEditorsToOpen(fileService, initialEditorsState) {
            if (initialEditorsState) {
                // Merge editor (single)
                const filesToMerge = (0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(initialEditorsState.filesToMerge, fileService, this.logService));
                if (filesToMerge.length === 4 && (0, editor_1.isResourceEditorInput)(filesToMerge[0]) && (0, editor_1.isResourceEditorInput)(filesToMerge[1]) && (0, editor_1.isResourceEditorInput)(filesToMerge[2]) && (0, editor_1.isResourceEditorInput)(filesToMerge[3])) {
                    return [{
                            editor: {
                                input1: { resource: filesToMerge[0].resource },
                                input2: { resource: filesToMerge[1].resource },
                                base: { resource: filesToMerge[2].resource },
                                result: { resource: filesToMerge[3].resource },
                                options: { pinned: true }
                            }
                        }];
                }
                // Diff editor (single)
                const filesToDiff = (0, arrays_1.coalesce)(await (0, editor_1.pathsToEditors)(initialEditorsState.filesToDiff, fileService, this.logService));
                if (filesToDiff.length === 2) {
                    return [{
                            editor: {
                                original: { resource: filesToDiff[0].resource },
                                modified: { resource: filesToDiff[1].resource },
                                options: { pinned: true }
                            }
                        }];
                }
                // Normal editor (multiple)
                const filesToOpenOrCreate = [];
                const resolvedFilesToOpenOrCreate = await (0, editor_1.pathsToEditors)(initialEditorsState.filesToOpenOrCreate, fileService, this.logService);
                for (let i = 0; i < resolvedFilesToOpenOrCreate.length; i++) {
                    const resolvedFileToOpenOrCreate = resolvedFilesToOpenOrCreate[i];
                    if (resolvedFileToOpenOrCreate) {
                        filesToOpenOrCreate.push({
                            editor: resolvedFileToOpenOrCreate,
                            viewColumn: initialEditorsState.filesToOpenOrCreate?.[i].viewColumn // take over `viewColumn` from initial state
                        });
                    }
                }
                return filesToOpenOrCreate;
            }
            // Empty workbench configured to open untitled file if empty
            else if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ && this.configurationService.getValue('workbench.startupEditor') === 'newUntitledFile') {
                if (this.editorGroupService.hasRestorableState) {
                    return []; // do not open any empty untitled file if we restored groups/editors from previous session
                }
                const hasBackups = await this.workingCopyBackupService.hasBackups();
                if (hasBackups) {
                    return []; // do not open any empty untitled file if we have backups to restore
                }
                return [{
                        editor: { resource: undefined } // open empty untitled file
                    }];
            }
            return [];
        }
        get openedDefaultEditors() { return this._openedDefaultEditors; }
        getInitialEditorsState() {
            // Check for editors / editor layout from `defaultLayout` options first
            const defaultLayout = this.environmentService.options?.defaultLayout;
            if ((defaultLayout?.editors?.length || defaultLayout?.layout?.editors) && (defaultLayout.force || this.storageService.isNew(1 /* StorageScope.WORKSPACE */))) {
                this._openedDefaultEditors = true;
                return {
                    layout: defaultLayout.layout?.editors,
                    filesToOpenOrCreate: defaultLayout?.editors?.map(editor => {
                        return {
                            viewColumn: editor.viewColumn,
                            fileUri: uri_1.URI.revive(editor.uri),
                            openOnlyIfExists: editor.openOnlyIfExists,
                            options: editor.options
                        };
                    })
                };
            }
            // Then check for files to open, create or diff/merge from main side
            const { filesToOpenOrCreate, filesToDiff, filesToMerge } = this.environmentService;
            if (filesToOpenOrCreate || filesToDiff || filesToMerge) {
                return { filesToOpenOrCreate, filesToDiff, filesToMerge };
            }
            return undefined;
        }
        isRestored() {
            return this.restored;
        }
        restoreParts() {
            // distinguish long running restore operations that
            // are required for the layout to be ready from those
            // that are needed to signal restoring is done
            const layoutReadyPromises = [];
            const layoutRestoredPromises = [];
            // Restore editors
            layoutReadyPromises.push((async () => {
                (0, performance_1.mark)('code/willRestoreEditors');
                // first ensure the editor part is ready
                await this.editorGroupService.whenReady;
                (0, performance_1.mark)('code/restoreEditors/editorGroupsReady');
                // apply editor layout if any
                if (this.state.initialization.layout?.editors) {
                    this.editorGroupService.mainPart.applyLayout(this.state.initialization.layout.editors);
                }
                // then see for editors to open as instructed
                // it is important that we trigger this from
                // the overall restore flow to reduce possible
                // flicker on startup: we want any editor to
                // open to get a chance to open first before
                // signaling that layout is restored, but we do
                // not need to await the editors from having
                // fully loaded.
                const editors = await this.state.initialization.editor.editorsToOpen;
                (0, performance_1.mark)('code/restoreEditors/editorsToOpenResolved');
                let openEditorsPromise = undefined;
                if (editors.length) {
                    // we have to map editors to their groups as instructed
                    // by the input. this is important to ensure that we open
                    // the editors in the groups they belong to.
                    const editorGroupsInVisualOrder = this.editorGroupService.mainPart.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                    const mapEditorsToGroup = new Map();
                    for (const editor of editors) {
                        const group = editorGroupsInVisualOrder[(editor.viewColumn ?? 1) - 1]; // viewColumn is index+1 based
                        let editorsByGroup = mapEditorsToGroup.get(group.id);
                        if (!editorsByGroup) {
                            editorsByGroup = new Set();
                            mapEditorsToGroup.set(group.id, editorsByGroup);
                        }
                        editorsByGroup.add(editor.editor);
                    }
                    openEditorsPromise = Promise.all(Array.from(mapEditorsToGroup).map(async ([groupId, editors]) => {
                        try {
                            await this.editorService.openEditors(Array.from(editors), groupId, { validateTrust: true });
                        }
                        catch (error) {
                            this.logService.error(error);
                        }
                    }));
                }
                // do not block the overall layout ready flow from potentially
                // slow editors to resolve on startup
                layoutRestoredPromises.push(Promise.all([
                    openEditorsPromise?.finally(() => (0, performance_1.mark)('code/restoreEditors/editorsOpened')),
                    this.editorGroupService.whenRestored.finally(() => (0, performance_1.mark)('code/restoreEditors/editorGroupsRestored'))
                ]).finally(() => {
                    // the `code/didRestoreEditors` perf mark is specifically
                    // for when visible editors have resolved, so we only mark
                    // if when editor group service has restored.
                    (0, performance_1.mark)('code/didRestoreEditors');
                }));
            })());
            // Restore default views (only when `IDefaultLayout` is provided)
            const restoreDefaultViewsPromise = (async () => {
                if (this.state.initialization.views.defaults?.length) {
                    (0, performance_1.mark)('code/willOpenDefaultViews');
                    const locationsRestored = [];
                    const tryOpenView = (view) => {
                        const location = this.viewDescriptorService.getViewLocationById(view.id);
                        if (location !== null) {
                            const container = this.viewDescriptorService.getViewContainerByViewId(view.id);
                            if (container) {
                                if (view.order >= (locationsRestored?.[location]?.order ?? 0)) {
                                    locationsRestored[location] = { id: container.id, order: view.order };
                                }
                                const containerModel = this.viewDescriptorService.getViewContainerModel(container);
                                containerModel.setCollapsed(view.id, false);
                                containerModel.setVisible(view.id, true);
                                return true;
                            }
                        }
                        return false;
                    };
                    const defaultViews = [...this.state.initialization.views.defaults].reverse().map((v, index) => ({ id: v, order: index }));
                    let i = defaultViews.length;
                    while (i) {
                        i--;
                        if (tryOpenView(defaultViews[i])) {
                            defaultViews.splice(i, 1);
                        }
                    }
                    // If we still have views left over, wait until all extensions have been registered and try again
                    if (defaultViews.length) {
                        await this.extensionService.whenInstalledExtensionsRegistered();
                        let i = defaultViews.length;
                        while (i) {
                            i--;
                            if (tryOpenView(defaultViews[i])) {
                                defaultViews.splice(i, 1);
                            }
                        }
                    }
                    // If we opened a view in the sidebar, stop any restore there
                    if (locationsRestored[0 /* ViewContainerLocation.Sidebar */]) {
                        this.state.initialization.views.containerToRestore.sideBar = locationsRestored[0 /* ViewContainerLocation.Sidebar */].id;
                    }
                    // If we opened a view in the panel, stop any restore there
                    if (locationsRestored[1 /* ViewContainerLocation.Panel */]) {
                        this.state.initialization.views.containerToRestore.panel = locationsRestored[1 /* ViewContainerLocation.Panel */].id;
                    }
                    // If we opened a view in the auxiliary bar, stop any restore there
                    if (locationsRestored[2 /* ViewContainerLocation.AuxiliaryBar */]) {
                        this.state.initialization.views.containerToRestore.auxiliaryBar = locationsRestored[2 /* ViewContainerLocation.AuxiliaryBar */].id;
                    }
                    (0, performance_1.mark)('code/didOpenDefaultViews');
                }
            })();
            layoutReadyPromises.push(restoreDefaultViewsPromise);
            // Restore Sidebar
            layoutReadyPromises.push((async () => {
                // Restoring views could mean that sidebar already
                // restored, as such we need to test again
                await restoreDefaultViewsPromise;
                if (!this.state.initialization.views.containerToRestore.sideBar) {
                    return;
                }
                (0, performance_1.mark)('code/willRestoreViewlet');
                const viewlet = await this.paneCompositeService.openPaneComposite(this.state.initialization.views.containerToRestore.sideBar, 0 /* ViewContainerLocation.Sidebar */);
                if (!viewlet) {
                    await this.paneCompositeService.openPaneComposite(this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)?.id, 0 /* ViewContainerLocation.Sidebar */); // fallback to default viewlet as needed
                }
                (0, performance_1.mark)('code/didRestoreViewlet');
            })());
            // Restore Panel
            layoutReadyPromises.push((async () => {
                // Restoring views could mean that panel already
                // restored, as such we need to test again
                await restoreDefaultViewsPromise;
                if (!this.state.initialization.views.containerToRestore.panel) {
                    return;
                }
                (0, performance_1.mark)('code/willRestorePanel');
                const panel = await this.paneCompositeService.openPaneComposite(this.state.initialization.views.containerToRestore.panel, 1 /* ViewContainerLocation.Panel */);
                if (!panel) {
                    await this.paneCompositeService.openPaneComposite(this.viewDescriptorService.getDefaultViewContainer(1 /* ViewContainerLocation.Panel */)?.id, 1 /* ViewContainerLocation.Panel */); // fallback to default panel as needed
                }
                (0, performance_1.mark)('code/didRestorePanel');
            })());
            // Restore Auxiliary Bar
            layoutReadyPromises.push((async () => {
                // Restoring views could mean that panel already
                // restored, as such we need to test again
                await restoreDefaultViewsPromise;
                if (!this.state.initialization.views.containerToRestore.auxiliaryBar) {
                    return;
                }
                (0, performance_1.mark)('code/willRestoreAuxiliaryBar');
                const panel = await this.paneCompositeService.openPaneComposite(this.state.initialization.views.containerToRestore.auxiliaryBar, 2 /* ViewContainerLocation.AuxiliaryBar */);
                if (!panel) {
                    await this.paneCompositeService.openPaneComposite(this.viewDescriptorService.getDefaultViewContainer(2 /* ViewContainerLocation.AuxiliaryBar */)?.id, 2 /* ViewContainerLocation.AuxiliaryBar */); // fallback to default panel as needed
                }
                (0, performance_1.mark)('code/didRestoreAuxiliaryBar');
            })());
            // Restore Zen Mode
            const zenModeWasActive = this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE);
            const restoreZenMode = getZenModeConfiguration(this.configurationService).restore;
            if (zenModeWasActive) {
                this.stateModel.setRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE, !restoreZenMode);
                this.toggleZenMode(false, true);
            }
            // Restore Main Editor Center Mode
            if (this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED)) {
                this.centerMainEditorLayout(true, true);
            }
            // Await for promises that we recorded to update
            // our ready and restored states properly.
            async_1.Promises.settled(layoutReadyPromises).finally(() => {
                this.whenReadyPromise.complete();
                async_1.Promises.settled(layoutRestoredPromises).finally(() => {
                    this.restored = true;
                    this.whenRestoredPromise.complete();
                });
            });
        }
        registerPart(part) {
            const id = part.getId();
            this.parts.set(id, part);
            return (0, lifecycle_1.toDisposable)(() => this.parts.delete(id));
        }
        getPart(key) {
            const part = this.parts.get(key);
            if (!part) {
                throw new Error(`Unknown part ${key}`);
            }
            return part;
        }
        registerNotifications(delegate) {
            this._register(delegate.onDidChangeNotificationsVisibility(visible => this._onDidChangeNotificationsVisibility.fire(visible)));
        }
        hasFocus(part) {
            const container = this.getContainer((0, dom_1.getActiveWindow)(), part);
            if (!container) {
                return false;
            }
            const activeElement = (0, dom_1.getActiveElement)();
            if (!activeElement) {
                return false;
            }
            return (0, dom_1.isAncestorUsingFlowTo)(activeElement, container);
        }
        focusPart(part, targetWindow = window_2.mainWindow) {
            const container = this.getContainer(targetWindow, part) ?? this.mainContainer;
            switch (part) {
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    this.editorGroupService.getPart(container).activeGroup.focus();
                    break;
                case "workbench.parts.panel" /* Parts.PANEL_PART */: {
                    this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)?.focus();
                    break;
                }
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */: {
                    this.paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */)?.focus();
                    break;
                }
                case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                    this.getPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */).focusActivityBar();
                    break;
                case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                    this.statusBarService.getPart(container).focus();
                    break;
                default: {
                    container?.focus();
                }
            }
        }
        getContainer(targetWindow, part) {
            if (typeof part === 'undefined') {
                return this.getContainerFromDocument(targetWindow.document);
            }
            if (targetWindow === window_2.mainWindow) {
                return this.getPart(part).getContainer();
            }
            // Only some parts are supported for auxiliary windows
            let partCandidate;
            if (part === "workbench.parts.editor" /* Parts.EDITOR_PART */) {
                partCandidate = this.editorGroupService.getPart(this.getContainerFromDocument(targetWindow.document));
            }
            else if (part === "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */) {
                partCandidate = this.statusBarService.getPart(this.getContainerFromDocument(targetWindow.document));
            }
            else if (part === "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */) {
                partCandidate = this.titleService.getPart(this.getContainerFromDocument(targetWindow.document));
            }
            if (partCandidate instanceof part_1.Part) {
                return partCandidate.getContainer();
            }
            return undefined;
        }
        isVisible(part, targetWindow = window_2.mainWindow) {
            if (targetWindow !== window_2.mainWindow && part === "workbench.parts.editor" /* Parts.EDITOR_PART */) {
                return true; // cannot hide editor part in auxiliary windows
            }
            if (this.initialized) {
                switch (part) {
                    case "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */:
                        return this.workbenchGrid.isViewVisible(this.titleBarPartView);
                    case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                        return !this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN);
                    case "workbench.parts.panel" /* Parts.PANEL_PART */:
                        return !this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN);
                    case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                        return !this.stateModel.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN);
                    case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                        return !this.stateModel.getRuntimeValue(LayoutStateKeys.STATUSBAR_HIDDEN);
                    case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                        return !this.stateModel.getRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN);
                    case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                        return !this.stateModel.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN);
                    case "workbench.parts.banner" /* Parts.BANNER_PART */:
                        return this.workbenchGrid.isViewVisible(this.bannerPartView);
                    default:
                        return false; // any other part cannot be hidden
                }
            }
            switch (part) {
                case "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */:
                    return (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled);
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                    return !this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN);
                case "workbench.parts.panel" /* Parts.PANEL_PART */:
                    return !this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN);
                case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                    return !this.stateModel.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN);
                case "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */:
                    return !this.stateModel.getRuntimeValue(LayoutStateKeys.STATUSBAR_HIDDEN);
                case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                    return !this.stateModel.getRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN);
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    return !this.stateModel.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN);
                default:
                    return false; // any other part cannot be hidden
            }
        }
        shouldShowBannerFirst() {
            return platform_1.isWeb && !(0, browser_1.isWCOEnabled)();
        }
        focus() {
            this.focusPart("workbench.parts.editor" /* Parts.EDITOR_PART */, (0, dom_1.getWindow)(this.activeContainer));
        }
        focusPanelOrEditor() {
            const activePanel = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if ((this.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */) || !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */)) && activePanel) {
                activePanel.focus(); // prefer panel if it has focus or editor is hidden
            }
            else {
                this.focus(); // otherwise focus editor
            }
        }
        getMaximumEditorDimensions(container) {
            const targetWindow = (0, dom_1.getWindow)(container);
            const containerDimension = this.getContainerDimension(container);
            if (container === this.mainContainer) {
                const panelPosition = this.getPanelPosition();
                const isColumn = panelPosition === 1 /* Position.RIGHT */ || panelPosition === 0 /* Position.LEFT */;
                const takenWidth = (this.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */) ? this.activityBarPartView.minimumWidth : 0) +
                    (this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? this.sideBarPartView.minimumWidth : 0) +
                    (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) && isColumn ? this.panelPartView.minimumWidth : 0) +
                    (this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? this.auxiliaryBarPartView.minimumWidth : 0);
                const takenHeight = (this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, targetWindow) ? this.titleBarPartView.minimumHeight : 0) +
                    (this.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, targetWindow) ? this.statusBarPartView.minimumHeight : 0) +
                    (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) && !isColumn ? this.panelPartView.minimumHeight : 0);
                const availableWidth = containerDimension.width - takenWidth;
                const availableHeight = containerDimension.height - takenHeight;
                return { width: availableWidth, height: availableHeight };
            }
            else {
                const takenHeight = (this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, targetWindow) ? this.titleBarPartView.minimumHeight : 0) +
                    (this.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, targetWindow) ? this.statusBarPartView.minimumHeight : 0);
                return { width: containerDimension.width, height: containerDimension.height - takenHeight };
            }
        }
        toggleZenMode(skipLayout, restoring = false) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE, !this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE));
            this.state.runtime.zenMode.transitionDisposables.clearAndDisposeAll();
            const setLineNumbers = (lineNumbers) => {
                for (const editor of this.mainPartEditorService.visibleTextEditorControls) {
                    // To properly reset line numbers we need to read the configuration for each editor respecting it's uri.
                    if (!lineNumbers && (0, editorBrowser_1.isCodeEditor)(editor) && editor.hasModel()) {
                        const model = editor.getModel();
                        lineNumbers = this.configurationService.getValue('editor.lineNumbers', { resource: model.uri, overrideIdentifier: model.getLanguageId() });
                    }
                    if (!lineNumbers) {
                        lineNumbers = this.configurationService.getValue('editor.lineNumbers');
                    }
                    editor.updateOptions({ lineNumbers });
                }
            };
            // Check if zen mode transitioned to full screen and if now we are out of zen mode
            // -> we need to go out of full screen (same goes for the centered editor layout)
            let toggleMainWindowFullScreen = false;
            const config = getZenModeConfiguration(this.configurationService);
            const zenModeExitInfo = this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_EXIT_INFO);
            // Zen Mode Active
            if (this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE)) {
                toggleMainWindowFullScreen = !this.state.runtime.mainWindowFullscreen && config.fullScreen && !platform_1.isIOS;
                if (!restoring) {
                    zenModeExitInfo.transitionedToFullScreen = toggleMainWindowFullScreen;
                    zenModeExitInfo.transitionedToCenteredEditorLayout = !this.isMainEditorLayoutCentered() && config.centerLayout;
                    zenModeExitInfo.handleNotificationsDoNotDisturbMode = this.notificationService.getFilter() === notification_1.NotificationsFilter.OFF;
                    zenModeExitInfo.wasVisible.sideBar = this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                    zenModeExitInfo.wasVisible.panel = this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */);
                    zenModeExitInfo.wasVisible.auxiliaryBar = this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                    this.stateModel.setRuntimeValue(LayoutStateKeys.ZEN_MODE_EXIT_INFO, zenModeExitInfo);
                }
                this.setPanelHidden(true, true);
                this.setAuxiliaryBarHidden(true, true);
                this.setSideBarHidden(true, true);
                if (config.hideActivityBar) {
                    this.setActivityBarHidden(true, true);
                }
                if (config.hideStatusBar) {
                    this.setStatusBarHidden(true, true);
                }
                if (config.hideLineNumbers) {
                    setLineNumbers('off');
                    this.state.runtime.zenMode.transitionDisposables.set("zenMode.hideLineNumbers" /* ZenModeSettings.HIDE_LINENUMBERS */, this.mainPartEditorService.onDidVisibleEditorsChange(() => setLineNumbers('off')));
                }
                if (config.showTabs !== this.editorGroupService.partOptions.showTabs) {
                    this.state.runtime.zenMode.transitionDisposables.set("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */, this.editorGroupService.mainPart.enforcePartOptions({ showTabs: config.showTabs }));
                }
                if (config.silentNotifications && zenModeExitInfo.handleNotificationsDoNotDisturbMode) {
                    this.notificationService.setFilter(notification_1.NotificationsFilter.ERROR);
                }
                if (config.centerLayout) {
                    this.centerMainEditorLayout(true, true);
                }
                // Zen Mode Configuration Changes
                this.state.runtime.zenMode.transitionDisposables.set('configurationChange', this.configurationService.onDidChangeConfiguration(e => {
                    // Activity Bar
                    if (e.affectsConfiguration("zenMode.hideActivityBar" /* ZenModeSettings.HIDE_ACTIVITYBAR */)) {
                        const zenModeHideActivityBar = this.configurationService.getValue("zenMode.hideActivityBar" /* ZenModeSettings.HIDE_ACTIVITYBAR */);
                        this.setActivityBarHidden(zenModeHideActivityBar, true);
                    }
                    // Status Bar
                    if (e.affectsConfiguration("zenMode.hideStatusBar" /* ZenModeSettings.HIDE_STATUSBAR */)) {
                        const zenModeHideStatusBar = this.configurationService.getValue("zenMode.hideStatusBar" /* ZenModeSettings.HIDE_STATUSBAR */);
                        this.setStatusBarHidden(zenModeHideStatusBar, true);
                    }
                    // Center Layout
                    if (e.affectsConfiguration("zenMode.centerLayout" /* ZenModeSettings.CENTER_LAYOUT */)) {
                        const zenModeCenterLayout = this.configurationService.getValue("zenMode.centerLayout" /* ZenModeSettings.CENTER_LAYOUT */);
                        this.centerMainEditorLayout(zenModeCenterLayout, true);
                    }
                    // Show Tabs
                    if (e.affectsConfiguration("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */)) {
                        const zenModeShowTabs = this.configurationService.getValue("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */) ?? 'multiple';
                        this.state.runtime.zenMode.transitionDisposables.set("zenMode.showTabs" /* ZenModeSettings.SHOW_TABS */, this.editorGroupService.mainPart.enforcePartOptions({ showTabs: zenModeShowTabs }));
                    }
                    // Notifications
                    if (e.affectsConfiguration("zenMode.silentNotifications" /* ZenModeSettings.SILENT_NOTIFICATIONS */)) {
                        const zenModeSilentNotifications = !!this.configurationService.getValue("zenMode.silentNotifications" /* ZenModeSettings.SILENT_NOTIFICATIONS */);
                        if (zenModeExitInfo.handleNotificationsDoNotDisturbMode) {
                            this.notificationService.setFilter(zenModeSilentNotifications ? notification_1.NotificationsFilter.ERROR : notification_1.NotificationsFilter.OFF);
                        }
                    }
                    // Center Layout
                    if (e.affectsConfiguration("zenMode.hideLineNumbers" /* ZenModeSettings.HIDE_LINENUMBERS */)) {
                        const lineNumbersType = this.configurationService.getValue("zenMode.hideLineNumbers" /* ZenModeSettings.HIDE_LINENUMBERS */) ? 'off' : undefined;
                        setLineNumbers(lineNumbersType);
                        this.state.runtime.zenMode.transitionDisposables.set("zenMode.hideLineNumbers" /* ZenModeSettings.HIDE_LINENUMBERS */, this.mainPartEditorService.onDidVisibleEditorsChange(() => setLineNumbers(lineNumbersType)));
                    }
                }));
            }
            // Zen Mode Inactive
            else {
                if (zenModeExitInfo.wasVisible.panel) {
                    this.setPanelHidden(false, true);
                }
                if (zenModeExitInfo.wasVisible.auxiliaryBar) {
                    this.setAuxiliaryBarHidden(false, true);
                }
                if (zenModeExitInfo.wasVisible.sideBar) {
                    this.setSideBarHidden(false, true);
                }
                if (!this.stateModel.getRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN, true)) {
                    this.setActivityBarHidden(false, true);
                }
                if (!this.stateModel.getRuntimeValue(LayoutStateKeys.STATUSBAR_HIDDEN, true)) {
                    this.setStatusBarHidden(false, true);
                }
                if (zenModeExitInfo.transitionedToCenteredEditorLayout) {
                    this.centerMainEditorLayout(false, true);
                }
                if (zenModeExitInfo.handleNotificationsDoNotDisturbMode) {
                    this.notificationService.setFilter(notification_1.NotificationsFilter.OFF);
                }
                setLineNumbers();
                this.focus();
                toggleMainWindowFullScreen = zenModeExitInfo.transitionedToFullScreen && this.state.runtime.mainWindowFullscreen;
            }
            if (!skipLayout) {
                this.layout();
            }
            if (toggleMainWindowFullScreen) {
                this.hostService.toggleFullScreen(window_2.mainWindow);
            }
            // Event
            this._onDidChangeZenMode.fire(this.stateModel.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE));
        }
        setStatusBarHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.STATUSBAR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.mainContainer.classList.add(LayoutClasses.STATUSBAR_HIDDEN);
            }
            else {
                this.mainContainer.classList.remove(LayoutClasses.STATUSBAR_HIDDEN);
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.statusBarPartView, !hidden);
        }
        createWorkbenchLayout() {
            const titleBar = this.getPart("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */);
            const bannerPart = this.getPart("workbench.parts.banner" /* Parts.BANNER_PART */);
            const editorPart = this.getPart("workbench.parts.editor" /* Parts.EDITOR_PART */);
            const activityBar = this.getPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
            const panelPart = this.getPart("workbench.parts.panel" /* Parts.PANEL_PART */);
            const auxiliaryBarPart = this.getPart("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            const sideBar = this.getPart("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const statusBar = this.getPart("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */);
            // View references for all parts
            this.titleBarPartView = titleBar;
            this.bannerPartView = bannerPart;
            this.sideBarPartView = sideBar;
            this.activityBarPartView = activityBar;
            this.editorPartView = editorPart;
            this.panelPartView = panelPart;
            this.auxiliaryBarPartView = auxiliaryBarPart;
            this.statusBarPartView = statusBar;
            const viewMap = {
                ["workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */]: this.activityBarPartView,
                ["workbench.parts.banner" /* Parts.BANNER_PART */]: this.bannerPartView,
                ["workbench.parts.titlebar" /* Parts.TITLEBAR_PART */]: this.titleBarPartView,
                ["workbench.parts.editor" /* Parts.EDITOR_PART */]: this.editorPartView,
                ["workbench.parts.panel" /* Parts.PANEL_PART */]: this.panelPartView,
                ["workbench.parts.sidebar" /* Parts.SIDEBAR_PART */]: this.sideBarPartView,
                ["workbench.parts.statusbar" /* Parts.STATUSBAR_PART */]: this.statusBarPartView,
                ["workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */]: this.auxiliaryBarPartView
            };
            const fromJSON = ({ type }) => viewMap[type];
            const workbenchGrid = grid_1.SerializableGrid.deserialize(this.createGridDescriptor(), { fromJSON }, { proportionalLayout: false });
            this.mainContainer.prepend(workbenchGrid.element);
            this.mainContainer.setAttribute('role', 'application');
            this.workbenchGrid = workbenchGrid;
            this.workbenchGrid.edgeSnapping = this.state.runtime.mainWindowFullscreen;
            for (const part of [titleBar, editorPart, activityBar, panelPart, sideBar, statusBar, auxiliaryBarPart, bannerPart]) {
                this._register(part.onDidVisibilityChange((visible) => {
                    if (part === sideBar) {
                        this.setSideBarHidden(!visible, true);
                    }
                    else if (part === panelPart) {
                        this.setPanelHidden(!visible, true);
                    }
                    else if (part === auxiliaryBarPart) {
                        this.setAuxiliaryBarHidden(!visible, true);
                    }
                    else if (part === editorPart) {
                        this.setEditorHidden(!visible, true);
                    }
                    this._onDidChangePartVisibility.fire();
                    this.handleContainerDidLayout(this.mainContainer, this._mainContainerDimension);
                }));
            }
            this._register(this.storageService.onWillSaveState(willSaveState => {
                if (willSaveState.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    // Side Bar Size
                    const sideBarSize = this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN)
                        ? this.workbenchGrid.getViewCachedVisibleSize(this.sideBarPartView)
                        : this.workbenchGrid.getViewSize(this.sideBarPartView).width;
                    this.stateModel.setInitializationValue(LayoutStateKeys.SIDEBAR_SIZE, sideBarSize);
                    // Panel Size
                    const panelSize = this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN)
                        ? this.workbenchGrid.getViewCachedVisibleSize(this.panelPartView)
                        : (this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_POSITION) === 2 /* Position.BOTTOM */ ? this.workbenchGrid.getViewSize(this.panelPartView).height : this.workbenchGrid.getViewSize(this.panelPartView).width);
                    this.stateModel.setInitializationValue(LayoutStateKeys.PANEL_SIZE, panelSize);
                    // Auxiliary Bar Size
                    const auxiliaryBarSize = this.stateModel.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN)
                        ? this.workbenchGrid.getViewCachedVisibleSize(this.auxiliaryBarPartView)
                        : this.workbenchGrid.getViewSize(this.auxiliaryBarPartView).width;
                    this.stateModel.setInitializationValue(LayoutStateKeys.AUXILIARYBAR_SIZE, auxiliaryBarSize);
                    this.stateModel.save(true, true);
                }
            }));
        }
        layout() {
            if (!this.disposed) {
                this._mainContainerDimension = (0, dom_1.getClientArea)(this.state.runtime.mainWindowFullscreen ?
                    window_2.mainWindow.document.body : // in fullscreen mode, make sure to use <body> element because
                    this.parent // in that case the workbench will span the entire site
                );
                this.logService.trace(`Layout#layout, height: ${this._mainContainerDimension.height}, width: ${this._mainContainerDimension.width}`);
                (0, dom_1.position)(this.mainContainer, 0, 0, 0, 0, 'relative');
                (0, dom_1.size)(this.mainContainer, this._mainContainerDimension.width, this._mainContainerDimension.height);
                // Layout the grid widget
                this.workbenchGrid.layout(this._mainContainerDimension.width, this._mainContainerDimension.height);
                this.initialized = true;
                // Emit as event
                this.handleContainerDidLayout(this.mainContainer, this._mainContainerDimension);
            }
        }
        isMainEditorLayoutCentered() {
            return this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED);
        }
        centerMainEditorLayout(active, skipLayout) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED, active);
            const activeMainEditor = this.mainPartEditorService.activeEditor;
            let isEditorComplex = false;
            if (activeMainEditor instanceof diffEditorInput_1.DiffEditorInput) {
                isEditorComplex = this.configurationService.getValue('diffEditor.renderSideBySide');
            }
            else if (activeMainEditor?.hasCapability(256 /* EditorInputCapabilities.MultipleEditors */)) {
                isEditorComplex = true;
            }
            const isCenteredLayoutAutoResizing = this.configurationService.getValue('workbench.editor.centeredLayoutAutoResize');
            if (isCenteredLayoutAutoResizing &&
                ((this.editorGroupService.mainPart.groups.length > 1 && !this.editorGroupService.mainPart.hasMaximizedGroup()) || isEditorComplex)) {
                active = false; // disable centered layout for complex editors or when there is more than one group
            }
            if (this.editorGroupService.mainPart.isLayoutCentered() !== active) {
                this.editorGroupService.mainPart.centerLayout(active);
                if (!skipLayout) {
                    this.layout();
                }
            }
            this._onDidChangeMainEditorCenteredLayout.fire(this.stateModel.getRuntimeValue(LayoutStateKeys.MAIN_EDITOR_CENTERED));
        }
        resizePart(part, sizeChangeWidth, sizeChangeHeight) {
            const sizeChangePxWidth = Math.sign(sizeChangeWidth) * (0, dom_1.computeScreenAwareSize)((0, dom_1.getActiveWindow)(), Math.abs(sizeChangeWidth));
            const sizeChangePxHeight = Math.sign(sizeChangeHeight) * (0, dom_1.computeScreenAwareSize)((0, dom_1.getActiveWindow)(), Math.abs(sizeChangeHeight));
            let viewSize;
            switch (part) {
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.sideBarPartView);
                    this.workbenchGrid.resizeView(this.sideBarPartView, {
                        width: viewSize.width + sizeChangePxWidth,
                        height: viewSize.height
                    });
                    break;
                case "workbench.parts.panel" /* Parts.PANEL_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.panelPartView);
                    this.workbenchGrid.resizeView(this.panelPartView, {
                        width: viewSize.width + (this.getPanelPosition() !== 2 /* Position.BOTTOM */ ? sizeChangePxWidth : 0),
                        height: viewSize.height + (this.getPanelPosition() !== 2 /* Position.BOTTOM */ ? 0 : sizeChangePxHeight)
                    });
                    break;
                case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.auxiliaryBarPartView);
                    this.workbenchGrid.resizeView(this.auxiliaryBarPartView, {
                        width: viewSize.width + sizeChangePxWidth,
                        height: viewSize.height
                    });
                    break;
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    viewSize = this.workbenchGrid.getViewSize(this.editorPartView);
                    // Single Editor Group
                    if (this.editorGroupService.mainPart.count === 1) {
                        this.workbenchGrid.resizeView(this.editorPartView, {
                            width: viewSize.width + sizeChangePxWidth,
                            height: viewSize.height + sizeChangePxHeight
                        });
                    }
                    else {
                        const activeGroup = this.editorGroupService.mainPart.activeGroup;
                        const { width, height } = this.editorGroupService.mainPart.getSize(activeGroup);
                        this.editorGroupService.mainPart.setSize(activeGroup, { width: width + sizeChangePxWidth, height: height + sizeChangePxHeight });
                        // After resizing the editor group
                        // if it does not change in either direction
                        // try resizing the full editor part
                        const { width: newWidth, height: newHeight } = this.editorGroupService.mainPart.getSize(activeGroup);
                        if ((sizeChangePxHeight && height === newHeight) || (sizeChangePxWidth && width === newWidth)) {
                            this.workbenchGrid.resizeView(this.editorPartView, {
                                width: viewSize.width + (sizeChangePxWidth && width === newWidth ? sizeChangePxWidth : 0),
                                height: viewSize.height + (sizeChangePxHeight && height === newHeight ? sizeChangePxHeight : 0)
                            });
                        }
                    }
                    break;
                default:
                    return; // Cannot resize other parts
            }
        }
        setActivityBarHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN, hidden);
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.activityBarPartView, !hidden);
        }
        setBannerHidden(hidden) {
            this.workbenchGrid.setViewVisible(this.bannerPartView, !hidden);
        }
        setEditorHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.mainContainer.classList.add(LayoutClasses.MAIN_EDITOR_AREA_HIDDEN);
            }
            else {
                this.mainContainer.classList.remove(LayoutClasses.MAIN_EDITOR_AREA_HIDDEN);
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.editorPartView, !hidden);
            // The editor and panel cannot be hidden at the same time
            if (hidden && !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                this.setPanelHidden(false, true);
            }
        }
        getLayoutClasses() {
            return (0, arrays_1.coalesce)([
                !this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? LayoutClasses.SIDEBAR_HIDDEN : undefined,
                !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, window_2.mainWindow) ? LayoutClasses.MAIN_EDITOR_AREA_HIDDEN : undefined,
                !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? LayoutClasses.PANEL_HIDDEN : undefined,
                !this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? LayoutClasses.AUXILIARYBAR_HIDDEN : undefined,
                !this.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */) ? LayoutClasses.STATUSBAR_HIDDEN : undefined,
                this.state.runtime.mainWindowFullscreen ? LayoutClasses.FULLSCREEN : undefined
            ]);
        }
        setSideBarHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.mainContainer.classList.add(LayoutClasses.SIDEBAR_HIDDEN);
            }
            else {
                this.mainContainer.classList.remove(LayoutClasses.SIDEBAR_HIDDEN);
            }
            // If sidebar becomes hidden, also hide the current active Viewlet if any
            if (hidden && this.paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */)) {
                this.paneCompositeService.hideActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
                this.focusPanelOrEditor();
            }
            // If sidebar becomes visible, show last active Viewlet or default viewlet
            else if (!hidden && !this.paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */)) {
                const viewletToOpen = this.paneCompositeService.getLastActivePaneCompositeId(0 /* ViewContainerLocation.Sidebar */);
                if (viewletToOpen) {
                    const viewlet = this.paneCompositeService.openPaneComposite(viewletToOpen, 0 /* ViewContainerLocation.Sidebar */, true);
                    if (!viewlet) {
                        this.paneCompositeService.openPaneComposite(this.viewDescriptorService.getDefaultViewContainer(0 /* ViewContainerLocation.Sidebar */)?.id, 0 /* ViewContainerLocation.Sidebar */, true);
                    }
                }
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.sideBarPartView, !hidden);
        }
        hasViews(id) {
            const viewContainer = this.viewDescriptorService.getViewContainerById(id);
            if (!viewContainer) {
                return false;
            }
            const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
            if (!viewContainerModel) {
                return false;
            }
            return viewContainerModel.activeViewDescriptors.length >= 1;
        }
        adjustPartPositions(sideBarPosition, panelAlignment, panelPosition) {
            // Move activity bar and side bars
            const sideBarSiblingToEditor = panelPosition !== 2 /* Position.BOTTOM */ || !(panelAlignment === 'center' || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'right') || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'left'));
            const auxiliaryBarSiblingToEditor = panelPosition !== 2 /* Position.BOTTOM */ || !(panelAlignment === 'center' || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'right') || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'left'));
            const preMovePanelWidth = !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? grid_1.Sizing.Invisible(this.workbenchGrid.getViewCachedVisibleSize(this.panelPartView) ?? this.panelPartView.minimumWidth) : this.workbenchGrid.getViewSize(this.panelPartView).width;
            const preMovePanelHeight = !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? grid_1.Sizing.Invisible(this.workbenchGrid.getViewCachedVisibleSize(this.panelPartView) ?? this.panelPartView.minimumHeight) : this.workbenchGrid.getViewSize(this.panelPartView).height;
            const preMoveSideBarSize = !this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? grid_1.Sizing.Invisible(this.workbenchGrid.getViewCachedVisibleSize(this.sideBarPartView) ?? this.sideBarPartView.minimumWidth) : this.workbenchGrid.getViewSize(this.sideBarPartView).width;
            const preMoveAuxiliaryBarSize = !this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? grid_1.Sizing.Invisible(this.workbenchGrid.getViewCachedVisibleSize(this.auxiliaryBarPartView) ?? this.auxiliaryBarPartView.minimumWidth) : this.workbenchGrid.getViewSize(this.auxiliaryBarPartView).width;
            if (sideBarPosition === 0 /* Position.LEFT */) {
                this.workbenchGrid.moveViewTo(this.activityBarPartView, [2, 0]);
                this.workbenchGrid.moveView(this.sideBarPartView, preMoveSideBarSize, sideBarSiblingToEditor ? this.editorPartView : this.activityBarPartView, sideBarSiblingToEditor ? 2 /* Direction.Left */ : 3 /* Direction.Right */);
                if (auxiliaryBarSiblingToEditor) {
                    this.workbenchGrid.moveView(this.auxiliaryBarPartView, preMoveAuxiliaryBarSize, this.editorPartView, 3 /* Direction.Right */);
                }
                else {
                    this.workbenchGrid.moveViewTo(this.auxiliaryBarPartView, [2, -1]);
                }
            }
            else {
                this.workbenchGrid.moveViewTo(this.activityBarPartView, [2, -1]);
                this.workbenchGrid.moveView(this.sideBarPartView, preMoveSideBarSize, sideBarSiblingToEditor ? this.editorPartView : this.activityBarPartView, sideBarSiblingToEditor ? 3 /* Direction.Right */ : 2 /* Direction.Left */);
                if (auxiliaryBarSiblingToEditor) {
                    this.workbenchGrid.moveView(this.auxiliaryBarPartView, preMoveAuxiliaryBarSize, this.editorPartView, 2 /* Direction.Left */);
                }
                else {
                    this.workbenchGrid.moveViewTo(this.auxiliaryBarPartView, [2, 0]);
                }
            }
            // We moved all the side parts based on the editor and ignored the panel
            // Now, we need to put the panel back in the right position when it is next to the editor
            if (panelPosition !== 2 /* Position.BOTTOM */) {
                this.workbenchGrid.moveView(this.panelPartView, preMovePanelWidth, this.editorPartView, panelPosition === 0 /* Position.LEFT */ ? 2 /* Direction.Left */ : 3 /* Direction.Right */);
                this.workbenchGrid.resizeView(this.panelPartView, {
                    height: preMovePanelHeight,
                    width: preMovePanelWidth
                });
            }
            // Moving views in the grid can cause them to re-distribute sizing unnecessarily
            // Resize visible parts to the width they were before the operation
            if (this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */)) {
                this.workbenchGrid.resizeView(this.sideBarPartView, {
                    height: this.workbenchGrid.getViewSize(this.sideBarPartView).height,
                    width: preMoveSideBarSize
                });
            }
            if (this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                this.workbenchGrid.resizeView(this.auxiliaryBarPartView, {
                    height: this.workbenchGrid.getViewSize(this.auxiliaryBarPartView).height,
                    width: preMoveAuxiliaryBarSize
                });
            }
        }
        setPanelAlignment(alignment, skipLayout) {
            // Panel alignment only applies to a panel in the bottom position
            if (this.getPanelPosition() !== 2 /* Position.BOTTOM */) {
                this.setPanelPosition(2 /* Position.BOTTOM */);
            }
            // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
            if (alignment !== 'center' && this.isPanelMaximized()) {
                this.toggleMaximizedPanel();
            }
            this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_ALIGNMENT, alignment);
            this.adjustPartPositions(this.getSideBarPosition(), alignment, this.getPanelPosition());
            this._onDidChangePanelAlignment.fire(alignment);
        }
        setPanelHidden(hidden, skipLayout) {
            // Return if not initialized fully #105480
            if (!this.workbenchGrid) {
                return;
            }
            const wasHidden = !this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */);
            this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_HIDDEN, hidden);
            const isPanelMaximized = this.isPanelMaximized();
            const panelOpensMaximized = this.panelOpensMaximized();
            // Adjust CSS
            if (hidden) {
                this.mainContainer.classList.add(LayoutClasses.PANEL_HIDDEN);
            }
            else {
                this.mainContainer.classList.remove(LayoutClasses.PANEL_HIDDEN);
            }
            // If panel part becomes hidden, also hide the current active panel if any
            let focusEditor = false;
            if (hidden && this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)) {
                this.paneCompositeService.hideActivePaneComposite(1 /* ViewContainerLocation.Panel */);
                focusEditor = platform_1.isIOS ? false : true; // Do not auto focus on ios #127832
            }
            // If panel part becomes visible, show last active panel or default panel
            else if (!hidden && !this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */)) {
                let panelToOpen = this.paneCompositeService.getLastActivePaneCompositeId(1 /* ViewContainerLocation.Panel */);
                // verify that the panel we try to open has views before we default to it
                // otherwise fall back to any view that has views still refs #111463
                if (!panelToOpen || !this.hasViews(panelToOpen)) {
                    panelToOpen = this.viewDescriptorService
                        .getViewContainersByLocation(1 /* ViewContainerLocation.Panel */)
                        .find(viewContainer => this.hasViews(viewContainer.id))?.id;
                }
                if (panelToOpen) {
                    const focus = !skipLayout;
                    this.paneCompositeService.openPaneComposite(panelToOpen, 1 /* ViewContainerLocation.Panel */, focus);
                }
            }
            // If maximized and in process of hiding, unmaximize before hiding to allow caching of non-maximized size
            if (hidden && isPanelMaximized) {
                this.toggleMaximizedPanel();
            }
            // Don't proceed if we have already done this before
            if (wasHidden === hidden) {
                return;
            }
            // Propagate layout changes to grid
            this.workbenchGrid.setViewVisible(this.panelPartView, !hidden);
            // If in process of showing, toggle whether or not panel is maximized
            if (!hidden) {
                if (!skipLayout && isPanelMaximized !== panelOpensMaximized) {
                    this.toggleMaximizedPanel();
                }
            }
            else {
                // If in process of hiding, remember whether the panel is maximized or not
                this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_WAS_LAST_MAXIMIZED, isPanelMaximized);
            }
            if (focusEditor) {
                this.editorGroupService.mainPart.activeGroup.focus(); // Pass focus to editor group if panel part is now hidden
            }
        }
        toggleMaximizedPanel() {
            const size = this.workbenchGrid.getViewSize(this.panelPartView);
            const panelPosition = this.getPanelPosition();
            const isMaximized = this.isPanelMaximized();
            if (!isMaximized) {
                if (this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                    if (panelPosition === 2 /* Position.BOTTOM */) {
                        this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT, size.height);
                    }
                    else {
                        this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH, size.width);
                    }
                }
                this.setEditorHidden(true);
            }
            else {
                this.setEditorHidden(false);
                this.workbenchGrid.resizeView(this.panelPartView, {
                    width: panelPosition === 2 /* Position.BOTTOM */ ? size.width : this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH),
                    height: panelPosition === 2 /* Position.BOTTOM */ ? this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT) : size.height
                });
            }
            this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_WAS_LAST_MAXIMIZED, !isMaximized);
        }
        /**
         * Returns whether or not the panel opens maximized
         */
        panelOpensMaximized() {
            // The workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
            if (this.getPanelAlignment() !== 'center' && this.getPanelPosition() === 2 /* Position.BOTTOM */) {
                return false;
            }
            const panelOpensMaximized = (0, layoutService_1.panelOpensMaximizedFromString)(this.configurationService.getValue(WorkbenchLayoutSettings.PANEL_OPENS_MAXIMIZED));
            const panelLastIsMaximized = this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_WAS_LAST_MAXIMIZED);
            return panelOpensMaximized === 0 /* PanelOpensMaximizedOptions.ALWAYS */ || (panelOpensMaximized === 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */ && panelLastIsMaximized);
        }
        setAuxiliaryBarHidden(hidden, skipLayout) {
            this.stateModel.setRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN, hidden);
            // Adjust CSS
            if (hidden) {
                this.mainContainer.classList.add(LayoutClasses.AUXILIARYBAR_HIDDEN);
            }
            else {
                this.mainContainer.classList.remove(LayoutClasses.AUXILIARYBAR_HIDDEN);
            }
            // If auxiliary bar becomes hidden, also hide the current active pane composite if any
            if (hidden && this.paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */)) {
                this.paneCompositeService.hideActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
                this.focusPanelOrEditor();
            }
            // If auxiliary bar becomes visible, show last active pane composite or default pane composite
            else if (!hidden && !this.paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */)) {
                let panelToOpen = this.paneCompositeService.getLastActivePaneCompositeId(2 /* ViewContainerLocation.AuxiliaryBar */);
                // verify that the panel we try to open has views before we default to it
                // otherwise fall back to any view that has views still refs #111463
                if (!panelToOpen || !this.hasViews(panelToOpen)) {
                    panelToOpen = this.viewDescriptorService
                        .getViewContainersByLocation(2 /* ViewContainerLocation.AuxiliaryBar */)
                        .find(viewContainer => this.hasViews(viewContainer.id))?.id;
                }
                if (panelToOpen) {
                    const focus = !skipLayout;
                    this.paneCompositeService.openPaneComposite(panelToOpen, 2 /* ViewContainerLocation.AuxiliaryBar */, focus);
                }
            }
            // Propagate to grid
            this.workbenchGrid.setViewVisible(this.auxiliaryBarPartView, !hidden);
        }
        setPartHidden(hidden, part, targetWindow = window_2.mainWindow) {
            switch (part) {
                case "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */:
                    return this.setActivityBarHidden(hidden);
                case "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */:
                    return this.setSideBarHidden(hidden);
                case "workbench.parts.editor" /* Parts.EDITOR_PART */:
                    return this.setEditorHidden(hidden);
                case "workbench.parts.banner" /* Parts.BANNER_PART */:
                    return this.setBannerHidden(hidden);
                case "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */:
                    return this.setAuxiliaryBarHidden(hidden);
                case "workbench.parts.panel" /* Parts.PANEL_PART */:
                    return this.setPanelHidden(hidden);
            }
        }
        hasMainWindowBorder() {
            return this.state.runtime.mainWindowBorder;
        }
        getMainWindowBorderRadius() {
            return this.state.runtime.mainWindowBorder && platform_1.isMacintosh ? '5px' : undefined;
        }
        isPanelMaximized() {
            // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
            return (this.getPanelAlignment() === 'center' || this.getPanelPosition() !== 2 /* Position.BOTTOM */) && !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, window_2.mainWindow);
        }
        getSideBarPosition() {
            return this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON);
        }
        getPanelAlignment() {
            return this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_ALIGNMENT);
        }
        updateMenubarVisibility(skipLayout) {
            const shouldShowTitleBar = (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled);
            if (!skipLayout && this.workbenchGrid && shouldShowTitleBar !== this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow)) {
                this.workbenchGrid.setViewVisible(this.titleBarPartView, shouldShowTitleBar);
            }
        }
        updateCustomTitleBarVisibility() {
            const shouldShowTitleBar = (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled);
            const titlebarVisible = this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */);
            if (shouldShowTitleBar !== titlebarVisible) {
                this.workbenchGrid.setViewVisible(this.titleBarPartView, shouldShowTitleBar);
            }
        }
        toggleMenuBar() {
            let currentVisibilityValue = (0, window_1.getMenuBarVisibility)(this.configurationService);
            if (typeof currentVisibilityValue !== 'string') {
                currentVisibilityValue = 'classic';
            }
            let newVisibilityValue;
            if (currentVisibilityValue === 'visible' || currentVisibilityValue === 'classic') {
                newVisibilityValue = (0, window_1.hasNativeTitlebar)(this.configurationService) ? 'toggle' : 'compact';
            }
            else {
                newVisibilityValue = 'classic';
            }
            this.configurationService.updateValue('window.menuBarVisibility', newVisibilityValue);
        }
        getPanelPosition() {
            return this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_POSITION);
        }
        setPanelPosition(position) {
            if (!this.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                this.setPanelHidden(false);
            }
            const panelPart = this.getPart("workbench.parts.panel" /* Parts.PANEL_PART */);
            const oldPositionValue = (0, layoutService_1.positionToString)(this.getPanelPosition());
            const newPositionValue = (0, layoutService_1.positionToString)(position);
            // Adjust CSS
            const panelContainer = (0, types_1.assertIsDefined)(panelPart.getContainer());
            panelContainer.classList.remove(oldPositionValue);
            panelContainer.classList.add(newPositionValue);
            // Update Styles
            panelPart.updateStyles();
            // Layout
            const size = this.workbenchGrid.getViewSize(this.panelPartView);
            const sideBarSize = this.workbenchGrid.getViewSize(this.sideBarPartView);
            const auxiliaryBarSize = this.workbenchGrid.getViewSize(this.auxiliaryBarPartView);
            let editorHidden = !this.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */, window_2.mainWindow);
            // Save last non-maximized size for panel before move
            if (newPositionValue !== oldPositionValue && !editorHidden) {
                // Save the current size of the panel for the new orthogonal direction
                // If moving down, save the width of the panel
                // Otherwise, save the height of the panel
                if (position === 2 /* Position.BOTTOM */) {
                    this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH, size.width);
                }
                else if ((0, layoutService_1.positionFromString)(oldPositionValue) === 2 /* Position.BOTTOM */) {
                    this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT, size.height);
                }
            }
            if (position === 2 /* Position.BOTTOM */ && this.getPanelAlignment() !== 'center' && editorHidden) {
                this.toggleMaximizedPanel();
                editorHidden = false;
            }
            this.stateModel.setRuntimeValue(LayoutStateKeys.PANEL_POSITION, position);
            const sideBarVisible = this.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const auxiliaryBarVisible = this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            if (position === 2 /* Position.BOTTOM */) {
                this.workbenchGrid.moveView(this.panelPartView, editorHidden ? size.height : this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_HEIGHT), this.editorPartView, 1 /* Direction.Down */);
            }
            else if (position === 1 /* Position.RIGHT */) {
                this.workbenchGrid.moveView(this.panelPartView, editorHidden ? size.width : this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH), this.editorPartView, 3 /* Direction.Right */);
            }
            else {
                this.workbenchGrid.moveView(this.panelPartView, editorHidden ? size.width : this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_LAST_NON_MAXIMIZED_WIDTH), this.editorPartView, 2 /* Direction.Left */);
            }
            // Reset sidebar to original size before shifting the panel
            this.workbenchGrid.resizeView(this.sideBarPartView, sideBarSize);
            if (!sideBarVisible) {
                this.setSideBarHidden(true);
            }
            this.workbenchGrid.resizeView(this.auxiliaryBarPartView, auxiliaryBarSize);
            if (!auxiliaryBarVisible) {
                this.setAuxiliaryBarHidden(true);
            }
            if (position === 2 /* Position.BOTTOM */) {
                this.adjustPartPositions(this.getSideBarPosition(), this.getPanelAlignment(), position);
            }
            this._onDidChangePanelPosition.fire(newPositionValue);
        }
        isWindowMaximized(targetWindow) {
            return this.state.runtime.maximized.has((0, dom_1.getWindowId)(targetWindow));
        }
        updateWindowMaximizedState(targetWindow, maximized) {
            this.mainContainer.classList.toggle(LayoutClasses.MAXIMIZED, maximized);
            const targetWindowId = (0, dom_1.getWindowId)(targetWindow);
            if (maximized === this.state.runtime.maximized.has(targetWindowId)) {
                return;
            }
            if (maximized) {
                this.state.runtime.maximized.add(targetWindowId);
            }
            else {
                this.state.runtime.maximized.delete(targetWindowId);
            }
            this.updateWindowsBorder();
            this._onDidChangeWindowMaximized.fire({ windowId: targetWindowId, maximized });
        }
        getVisibleNeighborPart(part, direction) {
            if (!this.workbenchGrid) {
                return undefined;
            }
            if (!this.isVisible(part, window_2.mainWindow)) {
                return undefined;
            }
            const neighborViews = this.workbenchGrid.getNeighborViews(this.getPart(part), direction, false);
            if (!neighborViews) {
                return undefined;
            }
            for (const neighborView of neighborViews) {
                const neighborPart = ["workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */, "workbench.parts.editor" /* Parts.EDITOR_PART */, "workbench.parts.panel" /* Parts.PANEL_PART */, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */, "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */]
                    .find(partId => this.getPart(partId) === neighborView && this.isVisible(partId, window_2.mainWindow));
                if (neighborPart !== undefined) {
                    return neighborPart;
                }
            }
            return undefined;
        }
        onDidChangeWCO() {
            const bannerFirst = this.workbenchGrid.getNeighborViews(this.titleBarPartView, 0 /* Direction.Up */, false).length > 0;
            const shouldBannerBeFirst = this.shouldShowBannerFirst();
            if (bannerFirst !== shouldBannerBeFirst) {
                this.workbenchGrid.moveView(this.bannerPartView, grid_1.Sizing.Distribute, this.titleBarPartView, shouldBannerBeFirst ? 0 /* Direction.Up */ : 1 /* Direction.Down */);
            }
            this.workbenchGrid.setViewVisible(this.titleBarPartView, (0, layoutService_1.shouldShowCustomTitleBar)(this.configurationService, window_2.mainWindow, this.state.runtime.menuBar.toggled));
        }
        arrangeEditorNodes(nodes, availableHeight, availableWidth) {
            if (!nodes.sideBar && !nodes.auxiliaryBar) {
                nodes.editor.size = availableHeight;
                return nodes.editor;
            }
            const result = [nodes.editor];
            nodes.editor.size = availableWidth;
            if (nodes.sideBar) {
                if (this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON) === 0 /* Position.LEFT */) {
                    result.splice(0, 0, nodes.sideBar);
                }
                else {
                    result.push(nodes.sideBar);
                }
                nodes.editor.size -= this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN) ? 0 : nodes.sideBar.size;
            }
            if (nodes.auxiliaryBar) {
                if (this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON) === 1 /* Position.RIGHT */) {
                    result.splice(0, 0, nodes.auxiliaryBar);
                }
                else {
                    result.push(nodes.auxiliaryBar);
                }
                nodes.editor.size -= this.stateModel.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN) ? 0 : nodes.auxiliaryBar.size;
            }
            return {
                type: 'branch',
                data: result,
                size: availableHeight
            };
        }
        arrangeMiddleSectionNodes(nodes, availableWidth, availableHeight) {
            const activityBarSize = this.stateModel.getRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN) ? 0 : nodes.activityBar.size;
            const sideBarSize = this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN) ? 0 : nodes.sideBar.size;
            const auxiliaryBarSize = this.stateModel.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN) ? 0 : nodes.auxiliaryBar.size;
            const panelSize = this.stateModel.getInitializationValue(LayoutStateKeys.PANEL_SIZE) ? 0 : nodes.panel.size;
            const result = [];
            if (this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_POSITION) !== 2 /* Position.BOTTOM */) {
                result.push(nodes.editor);
                nodes.editor.size = availableWidth - activityBarSize - sideBarSize - panelSize - auxiliaryBarSize;
                if (this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_POSITION) === 1 /* Position.RIGHT */) {
                    result.push(nodes.panel);
                }
                else {
                    result.splice(0, 0, nodes.panel);
                }
                if (this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON) === 0 /* Position.LEFT */) {
                    result.push(nodes.auxiliaryBar);
                    result.splice(0, 0, nodes.sideBar);
                    result.splice(0, 0, nodes.activityBar);
                }
                else {
                    result.splice(0, 0, nodes.auxiliaryBar);
                    result.push(nodes.sideBar);
                    result.push(nodes.activityBar);
                }
            }
            else {
                const panelAlignment = this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_ALIGNMENT);
                const sideBarPosition = this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON);
                const sideBarNextToEditor = !(panelAlignment === 'center' || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'right') || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'left'));
                const auxiliaryBarNextToEditor = !(panelAlignment === 'center' || (sideBarPosition === 1 /* Position.RIGHT */ && panelAlignment === 'right') || (sideBarPosition === 0 /* Position.LEFT */ && panelAlignment === 'left'));
                const editorSectionWidth = availableWidth - activityBarSize - (sideBarNextToEditor ? 0 : sideBarSize) - (auxiliaryBarNextToEditor ? 0 : auxiliaryBarSize);
                result.push({
                    type: 'branch',
                    data: [this.arrangeEditorNodes({
                            editor: nodes.editor,
                            sideBar: sideBarNextToEditor ? nodes.sideBar : undefined,
                            auxiliaryBar: auxiliaryBarNextToEditor ? nodes.auxiliaryBar : undefined
                        }, availableHeight - panelSize, editorSectionWidth), nodes.panel],
                    size: editorSectionWidth
                });
                if (!sideBarNextToEditor) {
                    if (sideBarPosition === 0 /* Position.LEFT */) {
                        result.splice(0, 0, nodes.sideBar);
                    }
                    else {
                        result.push(nodes.sideBar);
                    }
                }
                if (!auxiliaryBarNextToEditor) {
                    if (sideBarPosition === 1 /* Position.RIGHT */) {
                        result.splice(0, 0, nodes.auxiliaryBar);
                    }
                    else {
                        result.push(nodes.auxiliaryBar);
                    }
                }
                if (sideBarPosition === 0 /* Position.LEFT */) {
                    result.splice(0, 0, nodes.activityBar);
                }
                else {
                    result.push(nodes.activityBar);
                }
            }
            return result;
        }
        createGridDescriptor() {
            const { width, height } = this.stateModel.getInitializationValue(LayoutStateKeys.GRID_SIZE);
            const sideBarSize = this.stateModel.getInitializationValue(LayoutStateKeys.SIDEBAR_SIZE);
            const auxiliaryBarPartSize = this.stateModel.getInitializationValue(LayoutStateKeys.AUXILIARYBAR_SIZE);
            const panelSize = this.stateModel.getInitializationValue(LayoutStateKeys.PANEL_SIZE);
            const titleBarHeight = this.titleBarPartView.minimumHeight;
            const bannerHeight = this.bannerPartView.minimumHeight;
            const statusBarHeight = this.statusBarPartView.minimumHeight;
            const activityBarWidth = this.activityBarPartView.minimumWidth;
            const middleSectionHeight = height - titleBarHeight - statusBarHeight;
            const titleAndBanner = [
                {
                    type: 'leaf',
                    data: { type: "workbench.parts.titlebar" /* Parts.TITLEBAR_PART */ },
                    size: titleBarHeight,
                    visible: this.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow)
                },
                {
                    type: 'leaf',
                    data: { type: "workbench.parts.banner" /* Parts.BANNER_PART */ },
                    size: bannerHeight,
                    visible: false
                }
            ];
            const activityBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */ },
                size: activityBarWidth,
                visible: !this.stateModel.getRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN)
            };
            const sideBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */ },
                size: sideBarSize,
                visible: !this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN)
            };
            const auxiliaryBarNode = {
                type: 'leaf',
                data: { type: "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */ },
                size: auxiliaryBarPartSize,
                visible: this.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)
            };
            const editorNode = {
                type: 'leaf',
                data: { type: "workbench.parts.editor" /* Parts.EDITOR_PART */ },
                size: 0, // Update based on sibling sizes
                visible: !this.stateModel.getRuntimeValue(LayoutStateKeys.EDITOR_HIDDEN)
            };
            const panelNode = {
                type: 'leaf',
                data: { type: "workbench.parts.panel" /* Parts.PANEL_PART */ },
                size: panelSize,
                visible: !this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN)
            };
            const middleSection = this.arrangeMiddleSectionNodes({
                activityBar: activityBarNode,
                auxiliaryBar: auxiliaryBarNode,
                editor: editorNode,
                panel: panelNode,
                sideBar: sideBarNode
            }, width, middleSectionHeight);
            const result = {
                root: {
                    type: 'branch',
                    size: width,
                    data: [
                        ...(this.shouldShowBannerFirst() ? titleAndBanner.reverse() : titleAndBanner),
                        {
                            type: 'branch',
                            data: middleSection,
                            size: middleSectionHeight
                        },
                        {
                            type: 'leaf',
                            data: { type: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */ },
                            size: statusBarHeight,
                            visible: !this.stateModel.getRuntimeValue(LayoutStateKeys.STATUSBAR_HIDDEN)
                        }
                    ]
                },
                orientation: 0 /* Orientation.VERTICAL */,
                width,
                height
            };
            const layoutDescriptor = {
                activityBarVisible: !this.stateModel.getRuntimeValue(LayoutStateKeys.ACTIVITYBAR_HIDDEN),
                sideBarVisible: !this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_HIDDEN),
                auxiliaryBarVisible: !this.stateModel.getRuntimeValue(LayoutStateKeys.AUXILIARYBAR_HIDDEN),
                panelVisible: !this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_HIDDEN),
                statusbarVisible: !this.stateModel.getRuntimeValue(LayoutStateKeys.STATUSBAR_HIDDEN),
                sideBarPosition: (0, layoutService_1.positionToString)(this.stateModel.getRuntimeValue(LayoutStateKeys.SIDEBAR_POSITON)),
                panelPosition: (0, layoutService_1.positionToString)(this.stateModel.getRuntimeValue(LayoutStateKeys.PANEL_POSITION)),
            };
            this.telemetryService.publicLog2('startupLayout', layoutDescriptor);
            return result;
        }
        dispose() {
            super.dispose();
            this.disposed = true;
        }
    }
    exports.Layout = Layout;
    function getZenModeConfiguration(configurationService) {
        return configurationService.getValue(WorkbenchLayoutSettings.ZEN_MODE_CONFIG);
    }
    class WorkbenchLayoutStateKey {
        constructor(name, scope, target, defaultValue) {
            this.name = name;
            this.scope = scope;
            this.target = target;
            this.defaultValue = defaultValue;
        }
    }
    class RuntimeStateKey extends WorkbenchLayoutStateKey {
        constructor(name, scope, target, defaultValue, zenModeIgnore) {
            super(name, scope, target, defaultValue);
            this.zenModeIgnore = zenModeIgnore;
            this.runtime = true;
        }
    }
    class InitializationStateKey extends WorkbenchLayoutStateKey {
        constructor() {
            super(...arguments);
            this.runtime = false;
        }
    }
    const LayoutStateKeys = {
        // Editor
        MAIN_EDITOR_CENTERED: new RuntimeStateKey('editor.centered', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false),
        // Zen Mode
        ZEN_MODE_ACTIVE: new RuntimeStateKey('zenMode.active', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false),
        ZEN_MODE_EXIT_INFO: new RuntimeStateKey('zenMode.exitInfo', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, {
            transitionedToCenteredEditorLayout: false,
            transitionedToFullScreen: false,
            handleNotificationsDoNotDisturbMode: false,
            wasVisible: {
                auxiliaryBar: false,
                panel: false,
                sideBar: false,
            },
        }),
        // Part Sizing
        GRID_SIZE: new InitializationStateKey('grid.size', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */, { width: 800, height: 600 }),
        SIDEBAR_SIZE: new InitializationStateKey('sideBar.size', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */, 200),
        AUXILIARYBAR_SIZE: new InitializationStateKey('auxiliaryBar.size', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */, 200),
        PANEL_SIZE: new InitializationStateKey('panel.size', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */, 300),
        PANEL_LAST_NON_MAXIMIZED_HEIGHT: new RuntimeStateKey('panel.lastNonMaximizedHeight', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */, 300),
        PANEL_LAST_NON_MAXIMIZED_WIDTH: new RuntimeStateKey('panel.lastNonMaximizedWidth', 0 /* StorageScope.PROFILE */, 1 /* StorageTarget.MACHINE */, 300),
        PANEL_WAS_LAST_MAXIMIZED: new RuntimeStateKey('panel.wasLastMaximized', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false),
        // Part Positions
        SIDEBAR_POSITON: new RuntimeStateKey('sideBar.position', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, 0 /* Position.LEFT */),
        PANEL_POSITION: new RuntimeStateKey('panel.position', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, 2 /* Position.BOTTOM */),
        PANEL_ALIGNMENT: new RuntimeStateKey('panel.alignment', 0 /* StorageScope.PROFILE */, 0 /* StorageTarget.USER */, 'center'),
        // Part Visibility
        ACTIVITYBAR_HIDDEN: new RuntimeStateKey('activityBar.hidden', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false, true),
        SIDEBAR_HIDDEN: new RuntimeStateKey('sideBar.hidden', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false),
        EDITOR_HIDDEN: new RuntimeStateKey('editor.hidden', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false),
        PANEL_HIDDEN: new RuntimeStateKey('panel.hidden', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, true),
        AUXILIARYBAR_HIDDEN: new RuntimeStateKey('auxiliaryBar.hidden', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, true),
        STATUSBAR_HIDDEN: new RuntimeStateKey('statusBar.hidden', 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */, false, true)
    };
    var WorkbenchLayoutSettings;
    (function (WorkbenchLayoutSettings) {
        WorkbenchLayoutSettings["PANEL_POSITION"] = "workbench.panel.defaultLocation";
        WorkbenchLayoutSettings["PANEL_OPENS_MAXIMIZED"] = "workbench.panel.opensMaximized";
        WorkbenchLayoutSettings["ZEN_MODE_CONFIG"] = "zenMode";
        WorkbenchLayoutSettings["EDITOR_CENTERED_LAYOUT_AUTO_RESIZE"] = "workbench.editor.centeredLayoutAutoResize";
    })(WorkbenchLayoutSettings || (WorkbenchLayoutSettings = {}));
    var LegacyWorkbenchLayoutSettings;
    (function (LegacyWorkbenchLayoutSettings) {
        LegacyWorkbenchLayoutSettings["STATUSBAR_VISIBLE"] = "workbench.statusBar.visible";
        LegacyWorkbenchLayoutSettings["SIDEBAR_POSITION"] = "workbench.sideBar.location";
    })(LegacyWorkbenchLayoutSettings || (LegacyWorkbenchLayoutSettings = {}));
    class LayoutStateModel extends lifecycle_1.Disposable {
        static { this.STORAGE_PREFIX = 'workbench.'; }
        constructor(storageService, configurationService, contextService, container) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.container = container;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this.stateCache = new Map();
            this._register(this.configurationService.onDidChangeConfiguration(configurationChange => this.updateStateFromLegacySettings(configurationChange)));
        }
        updateStateFromLegacySettings(configurationChangeEvent) {
            const isZenMode = this.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE);
            if (configurationChangeEvent.affectsConfiguration("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) && !isZenMode) {
                this.setRuntimeValueAndFire(LayoutStateKeys.ACTIVITYBAR_HIDDEN, this.isActivityBarHidden());
            }
            if (configurationChangeEvent.affectsConfiguration(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE) && !isZenMode) {
                this.setRuntimeValueAndFire(LayoutStateKeys.STATUSBAR_HIDDEN, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE));
            }
            if (configurationChangeEvent.affectsConfiguration(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION)) {
                this.setRuntimeValueAndFire(LayoutStateKeys.SIDEBAR_POSITON, (0, layoutService_1.positionFromString)(this.configurationService.getValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION) ?? 'left'));
            }
        }
        updateLegacySettingsFromState(key, value) {
            const isZenMode = this.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE);
            if (key.zenModeIgnore && isZenMode) {
                return;
            }
            if (key === LayoutStateKeys.ACTIVITYBAR_HIDDEN) {
                this.configurationService.updateValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */, value ? "hidden" /* ActivityBarPosition.HIDDEN */ : undefined);
            }
            else if (key === LayoutStateKeys.STATUSBAR_HIDDEN) {
                this.configurationService.updateValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE, !value);
            }
            else if (key === LayoutStateKeys.SIDEBAR_POSITON) {
                this.configurationService.updateValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION, (0, layoutService_1.positionToString)(value));
            }
        }
        load() {
            let key;
            // Load stored values for all keys
            for (key in LayoutStateKeys) {
                const stateKey = LayoutStateKeys[key];
                const value = this.loadKeyFromStorage(stateKey);
                if (value !== undefined) {
                    this.stateCache.set(stateKey.name, value);
                }
            }
            // Apply legacy settings
            this.stateCache.set(LayoutStateKeys.ACTIVITYBAR_HIDDEN.name, this.isActivityBarHidden());
            this.stateCache.set(LayoutStateKeys.STATUSBAR_HIDDEN.name, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE));
            this.stateCache.set(LayoutStateKeys.SIDEBAR_POSITON.name, (0, layoutService_1.positionFromString)(this.configurationService.getValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION) ?? 'left'));
            // Set dynamic defaults: part sizing and side bar visibility
            const workbenchDimensions = (0, dom_1.getClientArea)(this.container);
            LayoutStateKeys.PANEL_POSITION.defaultValue = (0, layoutService_1.positionFromString)(this.configurationService.getValue(WorkbenchLayoutSettings.PANEL_POSITION) ?? 'bottom');
            LayoutStateKeys.GRID_SIZE.defaultValue = { height: workbenchDimensions.height, width: workbenchDimensions.width };
            LayoutStateKeys.SIDEBAR_SIZE.defaultValue = Math.min(300, workbenchDimensions.width / 4);
            LayoutStateKeys.AUXILIARYBAR_SIZE.defaultValue = Math.min(300, workbenchDimensions.width / 4);
            LayoutStateKeys.PANEL_SIZE.defaultValue = (this.stateCache.get(LayoutStateKeys.PANEL_POSITION.name) ?? LayoutStateKeys.PANEL_POSITION.defaultValue) === 2 /* Position.BOTTOM */ ? workbenchDimensions.height / 3 : workbenchDimensions.width / 4;
            LayoutStateKeys.SIDEBAR_HIDDEN.defaultValue = this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */;
            // Apply all defaults
            for (key in LayoutStateKeys) {
                const stateKey = LayoutStateKeys[key];
                if (this.stateCache.get(stateKey.name) === undefined) {
                    this.stateCache.set(stateKey.name, stateKey.defaultValue);
                }
            }
            // Register for runtime key changes
            this._register(this.storageService.onDidChangeValue(0 /* StorageScope.PROFILE */, undefined, this._register(new lifecycle_1.DisposableStore()))(storageChangeEvent => {
                let key;
                for (key in LayoutStateKeys) {
                    const stateKey = LayoutStateKeys[key];
                    if (stateKey instanceof RuntimeStateKey && stateKey.scope === 0 /* StorageScope.PROFILE */ && stateKey.target === 0 /* StorageTarget.USER */) {
                        if (`${LayoutStateModel.STORAGE_PREFIX}${stateKey.name}` === storageChangeEvent.key) {
                            const value = this.loadKeyFromStorage(stateKey) ?? stateKey.defaultValue;
                            if (this.stateCache.get(stateKey.name) !== value) {
                                this.stateCache.set(stateKey.name, value);
                                this._onDidChangeState.fire({ key: stateKey, value });
                            }
                        }
                    }
                }
            }));
        }
        save(workspace, global) {
            let key;
            const isZenMode = this.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE);
            for (key in LayoutStateKeys) {
                const stateKey = LayoutStateKeys[key];
                if ((workspace && stateKey.scope === 1 /* StorageScope.WORKSPACE */) ||
                    (global && stateKey.scope === 0 /* StorageScope.PROFILE */)) {
                    if (isZenMode && stateKey instanceof RuntimeStateKey && stateKey.zenModeIgnore) {
                        continue; // Don't write out specific keys while in zen mode
                    }
                    this.saveKeyToStorage(stateKey);
                }
            }
        }
        getInitializationValue(key) {
            return this.stateCache.get(key.name);
        }
        setInitializationValue(key, value) {
            this.stateCache.set(key.name, value);
        }
        getRuntimeValue(key, fallbackToSetting) {
            if (fallbackToSetting) {
                switch (key) {
                    case LayoutStateKeys.ACTIVITYBAR_HIDDEN:
                        this.stateCache.set(key.name, this.isActivityBarHidden());
                        break;
                    case LayoutStateKeys.STATUSBAR_HIDDEN:
                        this.stateCache.set(key.name, !this.configurationService.getValue(LegacyWorkbenchLayoutSettings.STATUSBAR_VISIBLE));
                        break;
                    case LayoutStateKeys.SIDEBAR_POSITON:
                        this.stateCache.set(key.name, this.configurationService.getValue(LegacyWorkbenchLayoutSettings.SIDEBAR_POSITION) ?? 'left');
                        break;
                }
            }
            return this.stateCache.get(key.name);
        }
        setRuntimeValue(key, value) {
            this.stateCache.set(key.name, value);
            const isZenMode = this.getRuntimeValue(LayoutStateKeys.ZEN_MODE_ACTIVE);
            if (key.scope === 0 /* StorageScope.PROFILE */) {
                if (!isZenMode || !key.zenModeIgnore) {
                    this.saveKeyToStorage(key);
                    this.updateLegacySettingsFromState(key, value);
                }
            }
        }
        isActivityBarHidden() {
            const oldValue = this.configurationService.getValue('workbench.activityBar.visible');
            if (oldValue !== undefined) {
                return !oldValue;
            }
            return this.configurationService.getValue("workbench.activityBar.location" /* LayoutSettings.ACTIVITY_BAR_LOCATION */) !== "default" /* ActivityBarPosition.DEFAULT */;
        }
        setRuntimeValueAndFire(key, value) {
            const previousValue = this.stateCache.get(key.name);
            if (previousValue === value) {
                return;
            }
            this.setRuntimeValue(key, value);
            this._onDidChangeState.fire({ key, value });
        }
        saveKeyToStorage(key) {
            const value = this.stateCache.get(key.name);
            this.storageService.store(`${LayoutStateModel.STORAGE_PREFIX}${key.name}`, typeof value === 'object' ? JSON.stringify(value) : value, key.scope, key.target);
        }
        loadKeyFromStorage(key) {
            let value = this.storageService.get(`${LayoutStateModel.STORAGE_PREFIX}${key.name}`, key.scope);
            if (value !== undefined) {
                switch (typeof key.defaultValue) {
                    case 'boolean':
                        value = value === 'true';
                        break;
                    case 'number':
                        value = parseInt(value);
                        break;
                    case 'object':
                        value = JSON.parse(value);
                        break;
                }
            }
            return value;
        }
    }
});
//#endregion
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGF5b3V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvYnJvd3Nlci9sYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBNkZoRyxJQUFLLGFBU0o7SUFURCxXQUFLLGFBQWE7UUFDakIsNkNBQTRCLENBQUE7UUFDNUIsNkRBQTRDLENBQUE7UUFDNUMseUNBQXdCLENBQUE7UUFDeEIsdURBQXNDLENBQUE7UUFDdEMsaURBQWdDLENBQUE7UUFDaEMsMENBQXlCLENBQUE7UUFDekIsd0NBQXVCLENBQUE7UUFDdkIseUNBQXdCLENBQUE7SUFDekIsQ0FBQyxFQVRJLGFBQWEsS0FBYixhQUFhLFFBU2pCO0lBY1ksUUFBQSxrQkFBa0IsR0FBRzs7Ozs7UUFLakMsMEJBQTBCOzs7S0FHMUIsQ0FBQztJQUVGLE1BQXNCLE1BQU8sU0FBUSxzQkFBVTtRQStDOUMsSUFBSSxlQUFlLEtBQUssT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBQSx1QkFBaUIsR0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLElBQUksVUFBVTtZQUNiLE1BQU0sVUFBVSxHQUFrQixFQUFFLENBQUM7WUFDckMsS0FBSyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksSUFBQSxnQkFBVSxHQUFFLEVBQUUsQ0FBQztnQkFDdkMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDakUsQ0FBQztZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ25CLENBQUM7UUFFTyx3QkFBd0IsQ0FBQyxjQUF3QjtZQUN4RCxJQUFJLGNBQWMsS0FBSyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDO2dCQUN6RCxjQUFjO2dCQUNkLE9BQU8s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