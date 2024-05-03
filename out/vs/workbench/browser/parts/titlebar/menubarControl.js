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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/window/common/window", "vs/platform/contextkey/common/contextkey", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/workspaces/common/workspaces", "vs/base/common/async", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/environment/common/environmentService", "vs/base/browser/ui/menu/menubar", "vs/base/browser/ui/menu/menu", "vs/base/common/labels", "vs/platform/accessibility/common/accessibility", "vs/base/browser/browser", "vs/workbench/services/host/browser/host", "vs/base/browser/canIUse", "vs/platform/contextkey/common/contextkeys", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/actions/windowActions", "vs/platform/action/common/action", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/window", "vs/css!./media/menubarControl"], function (require, exports, nls_1, actions_1, window_1, contextkey_1, actions_2, dom_1, keybinding_1, platform_1, configuration_1, event_1, lifecycle_1, workspaces_1, async_1, label_1, update_1, storage_1, notification_1, preferences_1, environmentService_1, menubar_1, menu_1, labels_1, accessibility_1, browser_1, host_1, canIUse_1, contextkeys_1, commands_1, telemetry_1, windowActions_1, action_1, menuEntryActionViewItem_1, defaultStyles_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomMenubarControl = exports.MenubarControl = void 0;
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarFileMenu,
        title: {
            value: 'File',
            original: 'File',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mFile', comment: ['&& denotes a mnemonic'] }, "&&File"),
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarEditMenu,
        title: {
            value: 'Edit',
            original: 'Edit',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mEdit', comment: ['&& denotes a mnemonic'] }, "&&Edit")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarSelectionMenu,
        title: {
            value: 'Selection',
            original: 'Selection',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mSelection', comment: ['&& denotes a mnemonic'] }, "&&Selection")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarViewMenu,
        title: {
            value: 'View',
            original: 'View',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mView', comment: ['&& denotes a mnemonic'] }, "&&View")
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarGoMenu,
        title: {
            value: 'Go',
            original: 'Go',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mGoto', comment: ['&& denotes a mnemonic'] }, "&&Go")
        },
        order: 5
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarTerminalMenu,
        title: {
            value: 'Terminal',
            original: 'Terminal',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal")
        },
        order: 7
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarHelpMenu,
        title: {
            value: 'Help',
            original: 'Help',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mHelp', comment: ['&& denotes a mnemonic'] }, "&&Help")
        },
        order: 8
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarPreferencesMenu,
        title: {
            value: 'Preferences',
            original: 'Preferences',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mPreferences', comment: ['&& denotes a mnemonic'] }, "Preferences")
        },
        when: contextkeys_1.IsMacNativeContext,
        order: 9
    });
    class MenubarControl extends lifecycle_1.Disposable {
        static { this.MAX_MENU_RECENT_ENTRIES = 10; }
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService, commandService) {
            super();
            this.menuService = menuService;
            this.workspacesService = workspacesService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.updateService = updateService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.preferencesService = preferencesService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.hostService = hostService;
            this.commandService = commandService;
            this.keys = [
                'window.menuBarVisibility',
                'window.enableMenuBarMnemonics',
                'window.customMenuBarAltFocus',
                'workbench.sideBar.location',
                'window.nativeTabs'
            ];
            this.menus = {};
            this.topLevelTitles = {};
            this.recentlyOpened = { files: [], workspaces: [] };
            this.mainMenu = this._register(this.menuService.createMenu(actions_1.MenuId.MenubarMainMenu, this.contextKeyService));
            this.mainMenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.setupMainMenu();
            this.menuUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateMenubar(false), 200));
            this.notifyUserOfCustomMenubarAccessibility();
        }
        registerListeners() {
            // Listen for window focus changes
            this._register(this.hostService.onDidChangeFocus(e => this.onDidChangeWindowFocus(e)));
            // Update when config changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            // Listen to update service
            this._register(this.updateService.onStateChange(() => this.onUpdateStateChange()));
            // Listen for changes in recently opened menu
            this._register(this.workspacesService.onDidChangeRecentlyOpened(() => { this.onDidChangeRecentlyOpened(); }));
            // Listen to keybindings change
            this._register(this.keybindingService.onDidUpdateKeybindings(() => this.updateMenubar()));
            // Update recent menu items on formatter registration
            this._register(this.labelService.onDidChangeFormatters(() => { this.onDidChangeRecentlyOpened(); }));
            // Listen for changes on the main menu
            this._register(this.mainMenu.onDidChange(() => { this.setupMainMenu(); this.doUpdateMenubar(true); }));
        }
        setupMainMenu() {
            this.mainMenuDisposables.clear();
            this.menus = {};
            this.topLevelTitles = {};
            const [, mainMenuActions] = this.mainMenu.getActions()[0];
            for (const mainMenuAction of mainMenuActions) {
                if (mainMenuAction instanceof actions_1.SubmenuItemAction && typeof mainMenuAction.item.title !== 'string') {
                    this.menus[mainMenuAction.item.title.original] = this.mainMenuDisposables.add(this.menuService.createMenu(mainMenuAction.item.submenu, this.contextKeyService, { emitEventsForSubmenuChanges: true }));
                    this.topLevelTitles[mainMenuAction.item.title.original] = mainMenuAction.item.title.mnemonicTitle ?? mainMenuAction.item.title.value;
                }
            }
        }
        updateMenubar() {
            this.menuUpdater.schedule();
        }
        calculateActionLabel(action) {
            const label = action.label;
            switch (action.id) {
                default:
                    break;
            }
            return label;
        }
        onUpdateStateChange() {
            this.updateMenubar();
        }
        onUpdateKeybindings() {
            this.updateMenubar();
        }
        getOpenRecentActions() {
            if (!this.recentlyOpened) {
                return [];
            }
            const { workspaces, files } = this.recentlyOpened;
            const result = [];
            if (workspaces.length > 0) {
                for (let i = 0; i < MenubarControl.MAX_MENU_RECENT_ENTRIES && i < workspaces.length; i++) {
                    result.push(this.createOpenRecentMenuAction(workspaces[i]));
                }
                result.push(new actions_2.Separator());
            }
            if (files.length > 0) {
                for (let i = 0; i < MenubarControl.MAX_MENU_RECENT_ENTRIES && i < files.length; i++) {
                    result.push(this.createOpenRecentMenuAction(files[i]));
                }
                result.push(new actions_2.Separator());
            }
            return result;
        }
        onDidChangeWindowFocus(hasFocus) {
            // When we regain focus, update the recent menu items
            if (hasFocus) {
                this.onDidChangeRecentlyOpened();
            }
        }
        onConfigurationUpdated(event) {
            if (this.keys.some(key => event.affectsConfiguration(key))) {
                this.updateMenubar();
            }
            if (event.affectsConfiguration('editor.accessibilitySupport')) {
                this.notifyUserOfCustomMenubarAccessibility();
            }
            // Since we try not update when hidden, we should
            // try to update the recently opened list on visibility changes
            if (event.affectsConfiguration('window.menuBarVisibility')) {
                this.onDidChangeRecentlyOpened();
            }
        }
        get menubarHidden() {
            return platform_1.isMacintosh && platform_1.isNative ? false : (0, window_1.getMenuBarVisibility)(this.configurationService) === 'hidden';
        }
        onDidChangeRecentlyOpened() {
            // Do not update recently opened when the menubar is hidden #108712
            if (!this.menubarHidden) {
                this.workspacesService.getRecentlyOpened().then(recentlyOpened => {
                    this.recentlyOpened = recentlyOpened;
                    this.updateMenubar();
                });
            }
        }
        createOpenRecentMenuAction(recent) {
            let label;
            let uri;
            let commandId;
            let openable;
            const remoteAuthority = recent.remoteAuthority;
            if ((0, workspaces_1.isRecentFolder)(recent)) {
                uri = recent.folderUri;
                label = recent.label || this.labelService.getWorkspaceLabel(uri, { verbose: 2 /* Verbosity.LONG */ });
                commandId = 'openRecentFolder';
                openable = { folderUri: uri };
            }
            else if ((0, workspaces_1.isRecentWorkspace)(recent)) {
                uri = recent.workspace.configPath;
                label = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: 2 /* Verbosity.LONG */ });
                commandId = 'openRecentWorkspace';
                openable = { workspaceUri: uri };
            }
            else {
                uri = recent.fileUri;
                label = recent.label || this.labelService.getUriLabel(uri);
                commandId = 'openRecentFile';
                openable = { fileUri: uri };
            }
            const ret = (0, actions_2.toAction)({
                id: commandId, label: (0, labels_1.unmnemonicLabel)(label), run: (browserEvent) => {
                    const openInNewWindow = browserEvent && ((!platform_1.isMacintosh && (browserEvent.ctrlKey || browserEvent.shiftKey)) || (platform_1.isMacintosh && (browserEvent.metaKey || browserEvent.altKey)));
                    return this.hostService.openWindow([openable], {
                        forceNewWindow: !!openInNewWindow,
                        remoteAuthority: remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                    });
                }
            });
            return Object.assign(ret, { uri, remoteAuthority });
        }
        notifyUserOfCustomMenubarAccessibility() {
            if (platform_1.isWeb || platform_1.isMacintosh) {
                return;
            }
            const hasBeenNotified = this.storageService.getBoolean('menubar/accessibleMenubarNotified', -1 /* StorageScope.APPLICATION */, false);
            const usingCustomMenubar = !(0, window_1.hasNativeTitlebar)(this.configurationService);
            if (hasBeenNotified || usingCustomMenubar || !this.accessibilityService.isScreenReaderOptimized()) {
                return;
            }
            const message = (0, nls_1.localize)('menubar.customTitlebarAccessibilityNotification', "Accessibility support is enabled for you. For the most accessible experience, we recommend the custom title bar style.");
            this.notificationService.prompt(notification_1.Severity.Info, message, [
                {
                    label: (0, nls_1.localize)('goToSetting', "Open Settings"),
                    run: () => {
                        return this.preferencesService.openUserSettings({ query: "window.titleBarStyle" /* TitleBarSetting.TITLE_BAR_STYLE */ });
                    }
                }
            ]);
            this.storageService.store('menubar/accessibleMenubarNotified', true, -1 /* StorageScope.APPLICATION */, 0 /* StorageTarget.USER */);
        }
    }
    exports.MenubarControl = MenubarControl;
    let CustomMenubarControl = class CustomMenubarControl extends MenubarControl {
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, telemetryService, hostService, commandService) {
            super(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService, commandService);
            this.telemetryService = telemetryService;
            this.alwaysOnMnemonics = false;
            this.focusInsideMenubar = false;
            this.pendingFirstTimeUpdate = false;
            this.visible = true;
            this.webNavigationMenu = this._register(this.menuService.createMenu(actions_1.MenuId.MenubarHomeMenu, this.contextKeyService));
            this.reinstallDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onVisibilityChange = this._register(new event_1.Emitter());
            this._onFocusStateChange = this._register(new event_1.Emitter());
            this.actionRunner = this._register(new actions_2.ActionRunner());
            this.actionRunner.onDidRun(e => {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'menu' });
            });
            this.workspacesService.getRecentlyOpened().then((recentlyOpened) => {
                this.recentlyOpened = recentlyOpened;
            });
            this.registerListeners();
            this.registerActions();
        }
        doUpdateMenubar(firstTime) {
            if (!this.focusInsideMenubar) {
                this.setupCustomMenubar(firstTime);
            }
            if (firstTime) {
                this.pendingFirstTimeUpdate = true;
            }
        }
        registerActions() {
            const that = this;
            if (platform_1.isWeb) {
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `workbench.actions.menubar.focus`,
                            title: (0, nls_1.localize2)('focusMenu', 'Focus Application Menu'),
                            keybinding: {
                                primary: 512 /* KeyMod.Alt */ | 68 /* KeyCode.F10 */,
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: contextkeys_1.IsWebContext
                            },
                            f1: true
                        });
                    }
                    async run() {
                        that.menubar?.toggleFocus();
                    }
                }));
            }
        }
        getUpdateAction() {
            const state = this.updateService.state;
            switch (state.type) {
                case "idle" /* StateType.Idle */:
                    return new actions_2.Action('update.check', (0, nls_1.localize)({ key: 'checkForUpdates', comment: ['&& denotes a mnemonic'] }, "Check for &&Updates..."), undefined, true, () => this.updateService.checkForUpdates(true));
                case "checking for updates" /* StateType.CheckingForUpdates */:
                    return new actions_2.Action('update.checking', (0, nls_1.localize)('checkingForUpdates', "Checking for Updates..."), undefined, false);
                case "available for download" /* StateType.AvailableForDownload */:
                    return new actions_2.Action('update.downloadNow', (0, nls_1.localize)({ key: 'download now', comment: ['&& denotes a mnemonic'] }, "D&&ownload Update"), undefined, true, () => this.updateService.downloadUpdate());
                case "downloading" /* StateType.Downloading */:
                    return new actions_2.Action('update.downloading', (0, nls_1.localize)('DownloadingUpdate', "Downloading Update..."), undefined, false);
                case "downloaded" /* StateType.Downloaded */:
                    return platform_1.isMacintosh ? null : new actions_2.Action('update.install', (0, nls_1.localize)({ key: 'installUpdate...', comment: ['&& denotes a mnemonic'] }, "Install &&Update..."), undefined, true, () => this.updateService.applyUpdate());
                case "updating" /* StateType.Updating */:
                    return new actions_2.Action('update.updating', (0, nls_1.localize)('installingUpdate', "Installing Update..."), undefined, false);
                case "ready" /* StateType.Ready */:
                    return new actions_2.Action('update.restart', (0, nls_1.localize)({ key: 'restartToUpdate', comment: ['&& denotes a mnemonic'] }, "Restart to &&Update"), undefined, true, () => this.updateService.quitAndInstall());
                default:
                    return null;
            }
        }
        get currentMenubarVisibility() {
            return (0, window_1.getMenuBarVisibility)(this.configurationService);
        }
        get currentDisableMenuBarAltFocus() {
            const settingValue = this.configurationService.getValue('window.customMenuBarAltFocus');
            let disableMenuBarAltBehavior = false;
            if (typeof settingValue === 'boolean') {
                disableMenuBarAltBehavior = !settingValue;
            }
            return disableMenuBarAltBehavior;
        }
        insertActionsBefore(nextAction, target) {
            switch (nextAction.id) {
                case windowActions_1.OpenRecentAction.ID:
                    target.push(...this.getOpenRecentActions());
                    break;
                case 'workbench.action.showAboutDialog':
                    if (!platform_1.isMacintosh && !platform_1.isWeb) {
                        const updateAction = this.getUpdateAction();
                        if (updateAction) {
                            updateAction.label = (0, labels_1.mnemonicMenuLabel)(updateAction.label);
                            target.push(updateAction);
                            target.push(new actions_2.Separator());
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        get currentEnableMenuBarMnemonics() {
            let enableMenuBarMnemonics = this.configurationService.getValue('window.enableMenuBarMnemonics');
            if (typeof enableMenuBarMnemonics !== 'boolean') {
                enableMenuBarMnemonics = true;
            }
            return enableMenuBarMnemonics && (!platform_1.isWeb || (0, browser_1.isFullscreen)(window_2.mainWindow));
        }
        get currentCompactMenuMode() {
            if (this.currentMenubarVisibility !== 'compact') {
                return undefined;
            }
            // Menu bar lives in activity bar and should flow based on its location
            const currentSidebarLocation = this.configurationService.getValue('workbench.sideBar.location');
            const horizontalDirection = currentSidebarLocation === 'right' ? menu_1.HorizontalDirection.Left : menu_1.HorizontalDirection.Right;
            const activityBarLocation = this.configurationService.getValue('workbench.activityBar.location');
            const verticalDirection = activityBarLocation === "bottom" /* ActivityBarPosition.BOTTOM */ ? menu_1.VerticalDirection.Above : menu_1.VerticalDirection.Below;
            return { horizontal: horizontalDirection, vertical: verticalDirection };
        }
        onDidVisibilityChange(visible) {
            this.visible = visible;
            this.onDidChangeRecentlyOpened();
            this._onVisibilityChange.fire(visible);
        }
        toActionsArray(menu) {
            const result = [];
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, result);
            return result;
        }
        setupCustomMenubar(firstTime) {
            // If there is no container, we cannot setup the menubar
            if (!this.container) {
                return;
            }
            if (firstTime) {
                // Reset and create new menubar
                if (this.menubar) {
                    this.reinstallDisposables.clear();
                }
                this.menubar = this.reinstallDisposables.add(new menubar_1.MenuBar(this.container, this.getMenuBarOptions(), defaultStyles_1.defaultMenuStyles));
                this.accessibilityService.alwaysUnderlineAccessKeys().then(val => {
                    this.alwaysOnMnemonics = val;
                    this.menubar?.update(this.getMenuBarOptions());
                });
                this.reinstallDisposables.add(this.menubar.onFocusStateChange(focused => {
                    this._onFocusStateChange.fire(focused);
                    // When the menubar loses focus, update it to clear any pending updates
                    if (!focused) {
                        if (this.pendingFirstTimeUpdate) {
                            this.setupCustomMenubar(true);
                            this.pendingFirstTimeUpdate = false;
                        }
                        else {
                            this.updateMenubar();
                        }
                        this.focusInsideMenubar = false;
                    }
                }));
                this.reinstallDisposables.add(this.menubar.onVisibilityChange(e => this.onDidVisibilityChange(e)));
                // Before we focus the menubar, stop updates to it so that focus-related context keys will work
                this.reinstallDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.FOCUS_IN, () => {
                    this.focusInsideMenubar = true;
                }));
                this.reinstallDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.FOCUS_OUT, () => {
                    this.focusInsideMenubar = false;
                }));
                // Fire visibility change for the first install if menu is shown
                if (this.menubar.isVisible) {
                    this.onDidVisibilityChange(true);
                }
            }
            else {
                this.menubar?.update(this.getMenuBarOptions());
            }
            // Update the menu actions
            const updateActions = (menuActions, target, topLevelTitle) => {
                target.splice(0);
                for (const menuItem of menuActions) {
                    this.insertActionsBefore(menuItem, target);
                    if (menuItem instanceof actions_2.Separator) {
                        target.push(menuItem);
                    }
                    else if (menuItem instanceof actions_1.SubmenuItemAction || menuItem instanceof actions_1.MenuItemAction) {
                        // use mnemonicTitle whenever possible
                        let title = typeof menuItem.item.title === 'string'
                            ? menuItem.item.title
                            : menuItem.item.title.mnemonicTitle ?? menuItem.item.title.value;
                        if (menuItem instanceof actions_1.SubmenuItemAction) {
                            const submenuActions = [];
                            updateActions(menuItem.actions, submenuActions, topLevelTitle);
                            if (submenuActions.length > 0) {
                                target.push(new actions_2.SubmenuAction(menuItem.id, (0, labels_1.mnemonicMenuLabel)(title), submenuActions));
                            }
                        }
                        else {
                            if ((0, action_1.isICommandActionToggleInfo)(menuItem.item.toggled)) {
                                title = menuItem.item.toggled.mnemonicTitle ?? menuItem.item.toggled.title ?? title;
                            }
                            const newAction = new actions_2.Action(menuItem.id, (0, labels_1.mnemonicMenuLabel)(title), menuItem.class, menuItem.enabled, () => this.commandService.executeCommand(menuItem.id));
                            newAction.tooltip = menuItem.tooltip;
                            newAction.checked = menuItem.checked;
                            target.push(newAction);
                        }
                    }
                }
                // Append web navigation menu items to the file menu when not compact
                if (topLevelTitle === 'File' && this.currentCompactMenuMode === undefined) {
                    const webActions = this.getWebNavigationActions();
                    if (webActions.length) {
                        target.push(...webActions);
                    }
                }
            };
            for (const title of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[title];
                if (firstTime && menu) {
                    this.reinstallDisposables.add(menu.onDidChange(() => {
                        if (!this.focusInsideMenubar) {
                            const actions = [];
                            updateActions(this.toActionsArray(menu), actions, title);
                            this.menubar?.updateMenu({ actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                        }
                    }));
                    // For the file menu, we need to update if the web nav menu updates as well
                    if (menu === this.menus.File) {
                        this.reinstallDisposables.add(this.webNavigationMenu.onDidChange(() => {
                            if (!this.focusInsideMenubar) {
                                const actions = [];
                                updateActions(this.toActionsArray(menu), actions, title);
                                this.menubar?.updateMenu({ actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                            }
                        }));
                    }
                }
                const actions = [];
                if (menu) {
                    updateActions(this.toActionsArray(menu), actions, title);
                }
                if (this.menubar) {
                    if (!firstTime) {
                        this.menubar.updateMenu({ actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                    }
                    else {
                        this.menubar.push({ actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                    }
                }
            }
        }
        getWebNavigationActions() {
            if (!platform_1.isWeb) {
                return []; // only for web
            }
            const webNavigationActions = [];
            for (const groups of this.webNavigationMenu.getActions()) {
                const [, actions] = groups;
                for (const action of actions) {
                    if (action instanceof actions_1.MenuItemAction) {
                        const title = typeof action.item.title === 'string'
                            ? action.item.title
                            : action.item.title.mnemonicTitle ?? action.item.title.value;
                        webNavigationActions.push(new actions_2.Action(action.id, (0, labels_1.mnemonicMenuLabel)(title), action.class, action.enabled, async (event) => {
                            this.commandService.executeCommand(action.id, event);
                        }));
                    }
                }
                webNavigationActions.push(new actions_2.Separator());
            }
            if (webNavigationActions.length) {
                webNavigationActions.pop();
            }
            return webNavigationActions;
        }
        getMenuBarOptions() {
            return {
                enableMnemonics: this.currentEnableMenuBarMnemonics,
                disableAltFocus: this.currentDisableMenuBarAltFocus,
                visibility: this.currentMenubarVisibility,
                actionRunner: this.actionRunner,
                getKeybinding: (action) => this.keybindingService.lookupKeybinding(action.id),
                alwaysOnMnemonics: this.alwaysOnMnemonics,
                compactMode: this.currentCompactMenuMode,
                getCompactMenuActions: () => {
                    if (!platform_1.isWeb) {
                        return []; // only for web
                    }
                    return this.getWebNavigationActions();
                }
            };
        }
        onDidChangeWindowFocus(hasFocus) {
            if (!this.visible) {
                return;
            }
            super.onDidChangeWindowFocus(hasFocus);
            if (this.container) {
                if (hasFocus) {
                    this.container.classList.remove('inactive');
                }
                else {
                    this.container.classList.add('inactive');
                    this.menubar?.blur();
                }
            }
        }
        onUpdateStateChange() {
            if (!this.visible) {
                return;
            }
            super.onUpdateStateChange();
        }
        onDidChangeRecentlyOpened() {
            if (!this.visible) {
                return;
            }
            super.onDidChangeRecentlyOpened();
        }
        onUpdateKeybindings() {
            if (!this.visible) {
                return;
            }
            super.onUpdateKeybindings();
        }
        registerListeners() {
            super.registerListeners();
            this._register((0, dom_1.addDisposableListener)(window_2.mainWindow, dom_1.EventType.RESIZE, () => {
                if (this.menubar && !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)) {
                    this.menubar.blur();
                }
            }));
            // Mnemonics require fullscreen in web
            if (platform_1.isWeb) {
                this._register((0, browser_1.onDidChangeFullscreen)(windowId => {
                    if (windowId === window_2.mainWindow.vscodeWindowId) {
                        this.updateMenubar();
                    }
                }));
                this._register(this.webNavigationMenu.onDidChange(() => this.updateMenubar()));
            }
        }
        get onVisibilityChange() {
            return this._onVisibilityChange.event;
        }
        get onFocusStateChange() {
            return this._onFocusStateChange.event;
        }
        getMenubarItemsDimensions() {
            if (this.menubar) {
                return new dom_1.Dimension(this.menubar.getWidth(), this.menubar.getHeight());
            }
            return new dom_1.Dimension(0, 0);
        }
        create(parent) {
            this.container = parent;
            // Build the menubar
            if (this.container) {
                this.doUpdateMenubar(true);
            }
            return this.container;
        }
        layout(dimension) {
            this.menubar?.update(this.getMenuBarOptions());
        }
        toggleFocus() {
            this.menubar?.toggleFocus();
        }
    };
    exports.CustomMenubarControl = CustomMenubarControl;
    exports.CustomMenubarControl = CustomMenubarControl = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, workspaces_1.IWorkspacesService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, label_1.ILabelService),
        __param(6, update_1.IUpdateService),
        __param(7, storage_1.IStorageService),
        __param(8, notification_1.INotificationService),
        __param(9, preferences_1.IPreferencesService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, accessibility_1.IAccessibilityService),
        __param(12, telemetry_1.ITelemetryService),
        __param(13, host_1.IHostService),
        __param(14, commands_1.ICommandService)
    ], CustomMenubarControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhckNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9icm93c2VyL3BhcnRzL3RpdGxlYmFyL21lbnViYXJDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTRDaEcsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxlQUFlLEVBQUU7UUFDbkQsT0FBTyxFQUFFLGdCQUFNLENBQUMsZUFBZTtRQUMvQixLQUFLLEVBQUU7WUFDTixLQUFLLEVBQUUsTUFBTTtZQUNiLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQztTQUN2RjtRQUNELEtBQUssRUFBRSxDQUFDO0tBQ1IsQ0FBQyxDQUFDO0lBRUgsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxlQUFlLEVBQUU7UUFDbkQsT0FBTyxFQUFFLGdCQUFNLENBQUMsZUFBZTtRQUMvQixLQUFLLEVBQUU7WUFDTixLQUFLLEVBQUUsTUFBTTtZQUNiLFFBQVEsRUFBRSxNQUFNO1lBQ2hCLGFBQWEsRUFBRSxJQUFBLGNBQVEsRUFBQyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQztTQUN2RjtRQUNELEtBQUssRUFBRSxDQUFDO0tBQ1IsQ0FBQyxDQUFDO0lBRUgsc0JBQVksQ0FBQyxjQUFjLENBQUMsZ0JBQU0sQ0FBQyxlQUFlLEVBQUU7UUFDbkQsT0FBTyxFQUFFLGdCQUFNLENBQUMsb0JBQW9CO1FBQ3BDLEtBQUssRUFBRTtZQUNOLEtBQUssRUFB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