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
define(["require", "exports", "electron", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/labels", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/auxiliaryWindow/electron-main/auxiliaryWindows", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/menubar/common/menubar", "vs/platform/native/electron-main/nativeHostMainService", "vs/platform/product/common/productService", "vs/platform/state/node/state", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/window/common/window", "vs/platform/windows/electron-main/windows", "vs/platform/workspaces/electron-main/workspacesHistoryMainService"], function (require, exports, electron_1, async_1, cancellation_1, labels_1, platform_1, uri_1, nls, auxiliaryWindows_1, configuration_1, environmentMainService_1, lifecycleMainService_1, log_1, menubar_1, nativeHostMainService_1, productService_1, state_1, telemetry_1, update_1, window_1, windows_1, workspacesHistoryMainService_1) {
    "use strict";
    var Menubar_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Menubar = void 0;
    const telemetryFrom = 'menu';
    let Menubar = class Menubar {
        static { Menubar_1 = this; }
        static { this.lastKnownMenubarStorageKey = 'lastKnownMenubarData'; }
        constructor(updateService, configurationService, windowsMainService, environmentMainService, telemetryService, workspacesHistoryMainService, stateService, lifecycleMainService, logService, nativeHostMainService, productService, auxiliaryWindowsMainService) {
            this.updateService = updateService;
            this.configurationService = configurationService;
            this.windowsMainService = windowsMainService;
            this.environmentMainService = environmentMainService;
            this.telemetryService = telemetryService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.stateService = stateService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.nativeHostMainService = nativeHostMainService;
            this.productService = productService;
            this.auxiliaryWindowsMainService = auxiliaryWindowsMainService;
            this.fallbackMenuHandlers = Object.create(null);
            this.menuUpdater = new async_1.RunOnceScheduler(() => this.doUpdateMenu(), 0);
            this.menuGC = new async_1.RunOnceScheduler(() => { this.oldMenus = []; }, 10000);
            this.menubarMenus = Object.create(null);
            this.keybindings = Object.create(null);
            if (platform_1.isMacintosh || (0, window_1.hasNativeTitlebar)(configurationService)) {
                this.restoreCachedMenubarData();
            }
            this.addFallbackHandlers();
            this.closedLastWindow = false;
            this.noActiveMainWindow = false;
            this.oldMenus = [];
            this.install();
            this.registerListeners();
        }
        restoreCachedMenubarData() {
            const menubarData = this.stateService.getItem(Menubar_1.lastKnownMenubarStorageKey);
            if (menubarData) {
                if (menubarData.menus) {
                    this.menubarMenus = menubarData.menus;
                }
                if (menubarData.keybindings) {
                    this.keybindings = menubarData.keybindings;
                }
            }
        }
        addFallbackHandlers() {
            // File Menu Items
            this.fallbackMenuHandlers['workbench.action.files.newUntitledFile'] = (menuItem, win, event) => {
                if (!this.runActionInRenderer({ type: 'commandId', commandId: 'workbench.action.files.newUntitledFile' })) { // this is one of the few supported actions when aux window has focus
                    this.windowsMainService.openEmptyWindow({ context: 2 /* OpenContext.MENU */, contextWindowId: win?.id });
                }
            };
            this.fallbackMenuHandlers['workbench.action.newWindow'] = (menuItem, win, event) => this.windowsMainService.openEmptyWindow({ context: 2 /* OpenContext.MENU */, contextWindowId: win?.id });
            this.fallbackMenuHandlers['workbench.action.files.openFileFolder'] = (menuItem, win, event) => this.nativeHostMainService.pickFileFolderAndOpen(undefined, { forceNewWindow: this.isOptionClick(event), telemetryExtraData: { from: telemetryFrom } });
            this.fallbackMenuHandlers['workbench.action.files.openFolder'] = (menuItem, win, event) => this.nativeHostMainService.pickFolderAndOpen(undefined, { forceNewWindow: this.isOptionClick(event), telemetryExtraData: { from: telemetryFrom } });
            this.fallbackMenuHandlers['workbench.action.openWorkspace'] = (menuItem, win, event) => this.nativeHostMainService.pickWorkspaceAndOpen(undefined, { forceNewWindow: this.isOptionClick(event), telemetryExtraData: { from: telemetryFrom } });
            // Recent Menu Items
            this.fallbackMenuHandlers['workbench.action.clearRecentFiles'] = () => this.workspacesHistoryMainService.clearRecentlyOpened({ confirm: true /* ask for confirmation */ });
            // Help Menu Items
            const youTubeUrl = this.productService.youTubeUrl;
            if (youTubeUrl) {
                this.fallbackMenuHandlers['workbench.action.openYouTubeUrl'] = () => this.openUrl(youTubeUrl, 'openYouTubeUrl');
            }
            const requestFeatureUrl = this.productService.requestFeatureUrl;
            if (requestFeatureUrl) {
                this.fallbackMenuHandlers['workbench.action.openRequestFeatureUrl'] = () => this.openUrl(requestFeatureUrl, 'openUserVoiceUrl');
            }
            const reportIssueUrl = this.productService.reportIssueUrl;
            if (reportIssueUrl) {
                this.fallbackMenuHandlers['workbench.action.openIssueReporter'] = () => this.openUrl(reportIssueUrl, 'openReportIssues');
            }
            const licenseUrl = this.productService.licenseUrl;
            if (licenseUrl) {
                this.fallbackMenuHandlers['workbench.action.openLicenseUrl'] = () => {
                    if (platform_1.language) {
                        const queryArgChar = licenseUrl.indexOf('?') > 0 ? '&' : '?';
                        this.openUrl(`${licenseUrl}${queryArgChar}lang=${platform_1.language}`, 'openLicenseUrl');
                    }
                    else {
                        this.openUrl(licenseUrl, 'openLicenseUrl');
                    }
                };
            }
            const privacyStatementUrl = this.productService.privacyStatementUrl;
            if (privacyStatementUrl && licenseUrl) {
                this.fallbackMenuHandlers['workbench.action.openPrivacyStatementUrl'] = () => {
                    this.openUrl(privacyStatementUrl, 'openPrivacyStatement');
                };
            }
        }
        registerListeners() {
            // Keep flag when app quits
            this.lifecycleMainService.onWillShutdown(() => this.willShutdown = true);
            // Listen to some events from window service to update menu
            this.windowsMainService.onDidChangeWindowsCount(e => this.onDidChangeWindowsCount(e));
            this.nativeHostMainService.onDidBlurMainWindow(() => this.onDidChangeWindowFocus());
            this.nativeHostMainService.onDidFocusMainWindow(() => this.onDidChangeWindowFocus());
        }
        get currentEnableMenuBarMnemonics() {
            const enableMenuBarMnemonics = this.configurationService.getValue('window.enableMenuBarMnemonics');
            if (typeof enableMenuBarMnemonics !== 'boolean') {
                return true;
            }
            return enableMenuBarMnemonics;
        }
        get currentEnableNativeTabs() {
            if (!platform_1.isMacintosh) {
                return false;
            }
            const enableNativeTabs = this.configurationService.getValue('window.nativeTabs');
            if (typeof enableNativeTabs !== 'boolean') {
                return false;
            }
            return enableNativeTabs;
        }
        updateMenu(menubarData, windowId) {
            this.menubarMenus = menubarData.menus;
            this.keybindings = menubarData.keybindings;
            // Save off new menu and keybindings
            this.stateService.setItem(Menubar_1.lastKnownMenubarStorageKey, menubarData);
            this.scheduleUpdateMenu();
        }
        scheduleUpdateMenu() {
            this.menuUpdater.schedule(); // buffer multiple attempts to update the menu
        }
        doUpdateMenu() {
            // Due to limitations in Electron, it is not possible to update menu items dynamically. The suggested
            // workaround from Electron is to set the application menu again.
            // See also https://github.com/electron/electron/issues/846
            //
            // Run delayed to prevent updating menu while it is open
            if (!this.willShutdown) {
                setTimeout(() => {
                    if (!this.willShutdown) {
                        this.install();
                    }
                }, 10 /* delay this because there is an issue with updating a menu when it is open */);
            }
        }
        onDidChangeWindowsCount(e) {
            if (!platform_1.isMacintosh) {
                return;
            }
            // Update menu if window count goes from N > 0 or 0 > N to update menu item enablement
            if ((e.oldCount === 0 && e.newCount > 0) || (e.oldCount > 0 && e.newCount === 0)) {
                this.closedLastWindow = e.newCount === 0;
                this.scheduleUpdateMenu();
            }
        }
        onDidChangeWindowFocus() {
            if (!platform_1.isMacintosh) {
                return;
            }
            const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
            this.noActiveMainWindow = !focusedWindow || !!this.auxiliaryWindowsMainService.getWindowById(focusedWindow.id);
            this.scheduleUpdateMenu();
        }
        install() {
            // Store old menu in our array to avoid GC to collect the menu and crash. See #55347
            // TODO@sbatten Remove this when fixed upstream by Electron
            const oldMenu = electron_1.Menu.getApplicationMenu();
            if (oldMenu) {
                this.oldMenus.push(oldMenu);
            }
            // If we don't have a menu yet, set it to null to avoid the electron menu.
            // This should only happen on the first launch ever
            if (Object.keys(this.menubarMenus).length === 0) {
                this.doSetApplicationMenu(platform_1.isMacintosh ? new electron_1.Menu() : null);
                return;
            }
            // Menus
            const menubar = new electron_1.Menu();
            // Mac: Application
            let macApplicationMenuItem;
            if (platform_1.isMacintosh) {
                const applicationMenu = new electron_1.Menu();
                macApplicationMenuItem = new electron_1.MenuItem({ label: this.productService.nameShort, submenu: applicationMenu });
                this.setMacApplicationMenu(applicationMenu);
                menubar.append(macApplicationMenuItem);
            }
            // Mac: Dock
            if (platform_1.isMacintosh && !this.appMenuInstalled) {
                this.appMenuInstalled = true;
                const dockMenu = new electron_1.Menu();
                dockMenu.append(new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'miNewWindow', comment: ['&& denotes a mnemonic'] }, "New &&Window")), click: () => this.windowsMainService.openEmptyWindow({ context: 1 /* OpenContext.DOCK */ }) }));
                electron_1.app.dock.setMenu(dockMenu);
            }
            // File
            if (this.shouldDrawMenu('File')) {
                const fileMenu = new electron_1.Menu();
                const fileMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mFile', comment: ['&& denotes a mnemonic'] }, "&&File")), submenu: fileMenu });
                this.setMenuById(fileMenu, 'File');
                menubar.append(fileMenuItem);
            }
            // Edit
            if (this.shouldDrawMenu('Edit')) {
                const editMenu = new electron_1.Menu();
                const editMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mEdit', comment: ['&& denotes a mnemonic'] }, "&&Edit")), submenu: editMenu });
                this.setMenuById(editMenu, 'Edit');
                menubar.append(editMenuItem);
            }
            // Selection
            if (this.shouldDrawMenu('Selection')) {
                const selectionMenu = new electron_1.Menu();
                const selectionMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mSelection', comment: ['&& denotes a mnemonic'] }, "&&Selection")), submenu: selectionMenu });
                this.setMenuById(selectionMenu, 'Selection');
                menubar.append(selectionMenuItem);
            }
            // View
            if (this.shouldDrawMenu('View')) {
                const viewMenu = new electron_1.Menu();
                const viewMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mView', comment: ['&& denotes a mnemonic'] }, "&&View")), submenu: viewMenu });
                this.setMenuById(viewMenu, 'View');
                menubar.append(viewMenuItem);
            }
            // Go
            if (this.shouldDrawMenu('Go')) {
                const gotoMenu = new electron_1.Menu();
                const gotoMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mGoto', comment: ['&& denotes a mnemonic'] }, "&&Go")), submenu: gotoMenu });
                this.setMenuById(gotoMenu, 'Go');
                menubar.append(gotoMenuItem);
            }
            // Debug
            if (this.shouldDrawMenu('Run')) {
                const debugMenu = new electron_1.Menu();
                const debugMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mRun', comment: ['&& denotes a mnemonic'] }, "&&Run")), submenu: debugMenu });
                this.setMenuById(debugMenu, 'Run');
                menubar.append(debugMenuItem);
            }
            // Terminal
            if (this.shouldDrawMenu('Terminal')) {
                const terminalMenu = new electron_1.Menu();
                const terminalMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal")), submenu: terminalMenu });
                this.setMenuById(terminalMenu, 'Terminal');
                menubar.append(terminalMenuItem);
            }
            // Mac: Window
            let macWindowMenuItem;
            if (this.shouldDrawMenu('Window')) {
                const windowMenu = new electron_1.Menu();
                macWindowMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize('mWindow', "Window")), submenu: windowMenu, role: 'window' });
                this.setMacWindowMenu(windowMenu);
            }
            if (macWindowMenuItem) {
                menubar.append(macWindowMenuItem);
            }
            // Help
            if (this.shouldDrawMenu('Help')) {
                const helpMenu = new electron_1.Menu();
                const helpMenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'mHelp', comment: ['&& denotes a mnemonic'] }, "&&Help")), submenu: helpMenu, role: 'help' });
                this.setMenuById(helpMenu, 'Help');
                menubar.append(helpMenuItem);
            }
            if (menubar.items && menubar.items.length > 0) {
                this.doSetApplicationMenu(menubar);
            }
            else {
                this.doSetApplicationMenu(null);
            }
            // Dispose of older menus after some time
            this.menuGC.schedule();
        }
        doSetApplicationMenu(menu) {
            // Setting the application menu sets it to all opened windows,
            // but we currently do not support a menu in auxiliary windows,
            // so we need to unset it there.
            //
            // This is a bit ugly but `setApplicationMenu()` has some nice
            // behaviour we want:
            // - on macOS it is required because menus are application set
            // - we use `getApplicationMenu()` to access the current state
            // - new windows immediately get the same menu when opening
            //   reducing overall flicker for these
            electron_1.Menu.setApplicationMenu(menu);
            if (menu) {
                for (const window of this.auxiliaryWindowsMainService.getWindows()) {
                    window.win?.setMenu(null);
                }
            }
        }
        setMacApplicationMenu(macApplicationMenu) {
            const about = this.createMenuItem(nls.localize('mAbout', "About {0}", this.productService.nameLong), 'workbench.action.showAboutDialog');
            const checkForUpdates = this.getUpdateMenuItems();
            let preferences;
            if (this.shouldDrawMenu('Preferences')) {
                const preferencesMenu = new electron_1.Menu();
                this.setMenuById(preferencesMenu, 'Preferences');
                preferences = new electron_1.MenuItem({ label: this.mnemonicLabel(nls.localize({ key: 'miPreferences', comment: ['&& denotes a mnemonic'] }, "&&Preferences")), submenu: preferencesMenu });
            }
            const servicesMenu = new electron_1.Menu();
            const services = new electron_1.MenuItem({ label: nls.localize('mServices', "Services"), role: 'services', submenu: servicesMenu });
            const hide = new electron_1.MenuItem({ label: nls.localize('mHide', "Hide {0}", this.productService.nameLong), role: 'hide', accelerator: 'Command+H' });
            const hideOthers = new electron_1.MenuItem({ label: nls.localize('mHideOthers', "Hide Others"), role: 'hideOthers', accelerator: 'Command+Alt+H' });
            const showAll = new electron_1.MenuItem({ label: nls.localize('mShowAll', "Show All"), role: 'unhide' });
            const quit = new electron_1.MenuItem(this.likeAction('workbench.action.quit', {
                label: nls.localize('miQuit', "Quit {0}", this.productService.nameLong), click: async (item, window, event) => {
                    const lastActiveWindow = this.windowsMainService.getLastActiveWindow();
                    if (this.windowsMainService.getWindowCount() === 0 || // allow to quit when no more windows are open
                        !!electron_1.BrowserWindow.getFocusedWindow() || // allow to quit when window has focus (fix for https://github.com/microsoft/vscode/issues/39191)
                        lastActiveWindow?.win?.isMinimized() // allow to quit when window has no focus but is minimized (https://github.com/microsoft/vscode/issues/63000)
                    ) {
                        const confirmed = await this.confirmBeforeQuit(event);
                        if (confirmed) {
                            this.nativeHostMainService.quit(undefined);
                        }
                    }
                }
            }));
            const actions = [about];
            actions.push(...checkForUpdates);
            if (preferences) {
                actions.push(...[
                    __separator__(),
                    preferences
                ]);
            }
            actions.push(...[
                __separator__(),
                services,
                __separator__(),
                hide,
                hideOthers,
                showAll,
                __separator__(),
                quit
            ]);
            actions.forEach(i => macApplicationMenu.append(i));
        }
        async confirmBeforeQuit(event) {
            if (this.windowsMainService.getWindowCount() === 0) {
                return true; // never confirm when no windows are opened
            }
            const confirmBeforeClose = this.configurationService.getValue('window.confirmBeforeClose');
            if (confirmBeforeClose === 'always' || (confirmBeforeClose === 'keyboardOnly' && this.isKeyboardEvent(event))) {
                const { response } = await this.nativeHostMainService.showMessageBox(this.windowsMainService.getFocusedWindow()?.id, {
                    type: 'question',
                    buttons: [
                        nls.localize({ key: 'quit', comment: ['&& denotes a mnemonic'] }, "&&Quit"),
                        nls.localize('cancel', "Cancel")
                    ],
                    message: nls.localize('quitMessage', "Are you sure you want to quit?")
                });
                return response === 0;
            }
            return true;
        }
        shouldDrawMenu(menuId) {
            // We need to draw an empty menu to override the electron default
            if (!platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                return false;
            }
            switch (menuId) {
                case 'File':
                case 'Help':
                    if (platform_1.isMacintosh) {
                        return (this.windowsMainService.getWindowCount() === 0 && this.closedLastWindow) || (this.windowsMainService.getWindowCount() > 0 && this.noActiveMainWindow) || (!!this.menubarMenus && !!this.menubarMenus[menuId]);
                    }
                case 'Window':
                    if (platform_1.isMacintosh) {
                        return (this.windowsMainService.getWindowCount() === 0 && this.closedLastWindow) || (this.windowsMainService.getWindowCount() > 0 && this.noActiveMainWindow) || !!this.menubarMenus;
                    }
                default:
                    return this.windowsMainService.getWindowCount() > 0 && (!!this.menubarMenus && !!this.menubarMenus[menuId]);
            }
        }
        setMenu(menu, items) {
            items.forEach((item) => {
                if ((0, menubar_1.isMenubarMenuItemSeparator)(item)) {
                    menu.append(__separator__());
                }
                else if ((0, menubar_1.isMenubarMenuItemSubmenu)(item)) {
                    const submenu = new electron_1.Menu();
                    const submenuItem = new electron_1.MenuItem({ label: this.mnemonicLabel(item.label), submenu });
                    this.setMenu(submenu, item.submenu.items);
                    menu.append(submenuItem);
                }
                else if ((0, menubar_1.isMenubarMenuItemRecentAction)(item)) {
                    menu.append(this.createOpenRecentMenuItem(item));
                }
                else if ((0, menubar_1.isMenubarMenuItemAction)(item)) {
                    if (item.id === 'workbench.action.showAboutDialog') {
                        this.insertCheckForUpdatesItems(menu);
                    }
                    if (platform_1.isMacintosh) {
                        if ((this.windowsMainService.getWindowCount() === 0 && this.closedLastWindow) ||
                            (this.windowsMainService.getWindowCount() > 0 && this.noActiveMainWindow)) {
                            // In the fallback scenario, we are either disabled or using a fallback handler
                            if (this.fallbackMenuHandlers[item.id]) {
                                menu.append(new electron_1.MenuItem(this.likeAction(item.id, { label: this.mnemonicLabel(item.label), click: this.fallbackMenuHandlers[item.id] })));
                            }
                            else {
                                menu.append(this.createMenuItem(item.label, item.id, false, item.checked));
                            }
                        }
                        else {
                            menu.append(this.createMenuItem(item.label, item.id, item.enabled === false ? false : true, !!item.checked));
                        }
                    }
                    else {
                        menu.append(this.createMenuItem(item.label, item.id, item.enabled === false ? false : true, !!item.checked));
                    }
                }
            });
        }
        setMenuById(menu, menuId) {
            if (this.menubarMenus && this.menubarMenus[menuId]) {
                this.setMenu(menu, this.menubarMenus[menuId].items);
            }
        }
        insertCheckForUpdatesItems(menu) {
            const updateItems = this.getUpdateMenuItems();
            if (updateItems.length) {
                updateItems.forEach(i => menu.append(i));
                menu.append(__separator__());
            }
        }
        createOpenRecentMenuItem(item) {
            const revivedUri = uri_1.URI.revive(item.uri);
            const commandId = item.id;
            const openable = (commandId === 'openRecentFile') ? { fileUri: revivedUri } :
                (commandId === 'openRecentWorkspace') ? { workspaceUri: revivedUri } : { folderUri: revivedUri };
            return new electron_1.MenuItem(this.likeAction(commandId, {
                label: item.label,
                click: async (menuItem, win, event) => {
                    const openInNewWindow = this.isOptionClick(event);
                    const success = (await this.windowsMainService.open({
                        context: 2 /* OpenContext.MENU */,
                        cli: this.environmentMainService.args,
                        urisToOpen: [openable],
                        forceNewWindow: openInNewWindow,
                        gotoLineMode: false,
                        remoteAuthority: item.remoteAuthority
                    })).length > 0;
                    if (!success) {
                        await this.workspacesHistoryMainService.removeRecentlyOpened([revivedUri]);
                    }
                }
            }, false));
        }
        isOptionClick(event) {
            return !!(event && ((!platform_1.isMacintosh && (event.ctrlKey || event.shiftKey)) || (platform_1.isMacintosh && (event.metaKey || event.altKey))));
        }
        isKeyboardEvent(event) {
            return !!(event.triggeredByAccelerator || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
        }
        createRoleMenuItem(label, commandId, role) {
            const options = {
                label: this.mnemonicLabel(label),
                role,
                enabled: true
            };
            return new electron_1.MenuItem(this.withKeybinding(commandId, options));
        }
        setMacWindowMenu(macWindowMenu) {
            const minimize = new electron_1.MenuItem({ label: nls.localize('mMinimize', "Minimize"), role: 'minimize', accelerator: 'Command+M', enabled: this.windowsMainService.getWindowCount() > 0 });
            const zoom = new electron_1.MenuItem({ label: nls.localize('mZoom', "Zoom"), role: 'zoom', enabled: this.windowsMainService.getWindowCount() > 0 });
            const bringAllToFront = new electron_1.MenuItem({ label: nls.localize('mBringToFront', "Bring All to Front"), role: 'front', enabled: this.windowsMainService.getWindowCount() > 0 });
            const switchWindow = this.createMenuItem(nls.localize({ key: 'miSwitchWindow', comment: ['&& denotes a mnemonic'] }, "Switch &&Window..."), 'workbench.action.switchWindow');
            const nativeTabMenuItems = [];
            if (this.currentEnableNativeTabs) {
                nativeTabMenuItems.push(__separator__());
                nativeTabMenuItems.push(this.createMenuItem(nls.localize('mNewTab', "New Tab"), 'workbench.action.newWindowTab'));
                nativeTabMenuItems.push(this.createRoleMenuItem(nls.localize('mShowPreviousTab', "Show Previous Tab"), 'workbench.action.showPreviousWindowTab', 'selectPreviousTab'));
                nativeTabMenuItems.push(this.createRoleMenuItem(nls.localize('mShowNextTab', "Show Next Tab"), 'workbench.action.showNextWindowTab', 'selectNextTab'));
                nativeTabMenuItems.push(this.createRoleMenuItem(nls.localize('mMoveTabToNewWindow', "Move Tab to New Window"), 'workbench.action.moveWindowTabToNewWindow', 'moveTabToNewWindow'));
                nativeTabMenuItems.push(this.createRoleMenuItem(nls.localize('mMergeAllWindows', "Merge All Windows"), 'workbench.action.mergeAllWindowTabs', 'mergeAllWindows'));
            }
            [
                minimize,
                zoom,
                __separator__(),
                switchWindow,
                ...nativeTabMenuItems,
                __separator__(),
                bringAllToFront
            ].forEach(item => macWindowMenu.append(item));
        }
        getUpdateMenuItems() {
            const state = this.updateService.state;
            switch (state.type) {
                case "idle" /* StateType.Idle */:
                    return [new electron_1.MenuItem({
                            label: this.mnemonicLabel(nls.localize('miCheckForUpdates', "Check for &&Updates...")), click: () => setTimeout(() => {
                                this.reportMenuActionTelemetry('CheckForUpdate');
                                this.updateService.checkForUpdates(true);
                            }, 0)
                        })];
                case "checking for updates" /* StateType.CheckingForUpdates */:
                    return [new electron_1.MenuItem({ label: nls.localize('miCheckingForUpdates', "Checking for Updates..."), enabled: false })];
                case "available for download" /* StateType.AvailableForDownload */:
                    return [new electron_1.MenuItem({
                            label: this.mnemonicLabel(nls.localize('miDownloadUpdate', "D&&ownload Available Update")), click: () => {
                                this.updateService.downloadUpdate();
                            }
                        })];
                case "downloading" /* StateType.Downloading */:
                    return [new electron_1.MenuItem({ label: nls.localize('miDownloadingUpdate', "Downloading Update..."), enabled: false })];
                case "downloaded" /* StateType.Downloaded */:
                    return platform_1.isMacintosh ? [] : [new electron_1.MenuItem({
                            label: this.mnemonicLabel(nls.localize('miInstallUpdate', "Install &&Update...")), click: () => {
                                this.reportMenuActionTelemetry('InstallUpdate');
                                this.updateService.applyUpdate();
                            }
                        })];
                case "updating" /* StateType.Updating */:
                    return [new electron_1.MenuItem({ label: nls.localize('miInstallingUpdate', "Installing Update..."), enabled: false })];
                case "ready" /* StateType.Ready */:
                    return [new electron_1.MenuItem({
                            label: this.mnemonicLabel(nls.localize('miRestartToUpdate', "Restart to &&Update")), click: () => {
                                this.reportMenuActionTelemetry('RestartToUpdate');
                                this.updateService.quitAndInstall();
                            }
                        })];
                default:
                    return [];
            }
        }
        createMenuItem(arg1, arg2, arg3, arg4) {
            const label = this.mnemonicLabel(arg1);
            const click = (typeof arg2 === 'function') ? arg2 : (menuItem, win, event) => {
                const userSettingsLabel = menuItem ? menuItem.userSettingsLabel : null;
                let commandId = arg2;
                if (Array.isArray(arg2)) {
                    commandId = this.isOptionClick(event) ? arg2[1] : arg2[0]; // support alternative action if we got multiple action Ids and the option key was pressed while invoking
                }
                if (userSettingsLabel && event.triggeredByAccelerator) {
                    this.runActionInRenderer({ type: 'keybinding', userSettingsLabel });
                }
                else {
                    this.runActionInRenderer({ type: 'commandId', commandId });
                }
            };
            const enabled = typeof arg3 === 'boolean' ? arg3 : this.windowsMainService.getWindowCount() > 0;
            const checked = typeof arg4 === 'boolean' ? arg4 : false;
            const options = {
                label,
                click,
                enabled
            };
            if (checked) {
                options.type = 'checkbox';
                options.checked = checked;
            }
            let commandId;
            if (typeof arg2 === 'string') {
                commandId = arg2;
            }
            else if (Array.isArray(arg2)) {
                commandId = arg2[0];
            }
            if (platform_1.isMacintosh) {
                // Add role for special case menu items
                if (commandId === 'editor.action.clipboardCutAction') {
                    options.role = 'cut';
                }
                else if (commandId === 'editor.action.clipboardCopyAction') {
                    options.role = 'copy';
                }
                else if (commandId === 'editor.action.clipboardPasteAction') {
                    options.role = 'paste';
                }
                // Add context aware click handlers for special case menu items
                if (commandId === 'undo') {
                    options.click = this.makeContextAwareClickHandler(click, {
                        inDevTools: devTools => devTools.undo(),
                        inNoWindow: () => electron_1.Menu.sendActionToFirstResponder('undo:')
                    });
                }
                else if (commandId === 'redo') {
                    options.click = this.makeContextAwareClickHandler(click, {
                        inDevTools: devTools => devTools.redo(),
                        inNoWindow: () => electron_1.Menu.sendActionToFirstResponder('redo:')
                    });
                }
                else if (commandId === 'editor.action.selectAll') {
                    options.click = this.makeContextAwareClickHandler(click, {
                        inDevTools: devTools => devTools.selectAll(),
                        inNoWindow: () => electron_1.Menu.sendActionToFirstResponder('selectAll:')
                    });
                }
            }
            return new electron_1.MenuItem(this.withKeybinding(commandId, options));
        }
        makeContextAwareClickHandler(click, contextSpecificHandlers) {
            return (menuItem, win, event) => {
                // No Active Window
                const activeWindow = electron_1.BrowserWindow.getFocusedWindow();
                if (!activeWindow) {
                    return contextSpecificHandlers.inNoWindow();
                }
                // DevTools focused
                if (activeWindow.webContents.isDevToolsFocused() &&
                    activeWindow.webContents.devToolsWebContents) {
                    return contextSpecificHandlers.inDevTools(activeWindow.webContents.devToolsWebContents);
                }
                // Finally execute command in Window
                click(menuItem, win || activeWindow, event);
            };
        }
        runActionInRenderer(invocation) {
            // We want to support auxililary windows that may have focus by
            // returning their parent windows as target to support running
            // actions via the main window.
            let activeBrowserWindow = electron_1.BrowserWindow.getFocusedWindow();
            if (activeBrowserWindow) {
                const auxiliaryWindowCandidate = this.auxiliaryWindowsMainService.getWindowById(activeBrowserWindow.id);
                if (auxiliaryWindowCandidate) {
                    activeBrowserWindow = this.windowsMainService.getWindowById(auxiliaryWindowCandidate.parentId)?.win ?? null;
                }
            }
            // We make sure to not run actions when the window has no focus, this helps
            // for https://github.com/microsoft/vscode/issues/25907 and specifically for
            // https://github.com/microsoft/vscode/issues/11928
            // Still allow to run when the last active window is minimized though for
            // https://github.com/microsoft/vscode/issues/63000
            if (!activeBrowserWindow) {
                const lastActiveWindow = this.windowsMainService.getLastActiveWindow();
                if (lastActiveWindow?.win?.isMinimized()) {
                    activeBrowserWindow = lastActiveWindow.win;
                }
            }
            const activeWindow = activeBrowserWindow ? this.windowsMainService.getWindowById(activeBrowserWindow.id) : undefined;
            if (activeWindow) {
                this.logService.trace('menubar#runActionInRenderer', invocation);
                if (platform_1.isMacintosh && !this.environmentMainService.isBuilt && !activeWindow.isReady) {
                    if ((invocation.type === 'commandId' && invocation.commandId === 'workbench.action.toggleDevTools') || (invocation.type !== 'commandId' && invocation.userSettingsLabel === 'alt+cmd+i')) {
                        // prevent this action from running twice on macOS (https://github.com/microsoft/vscode/issues/62719)
                        // we already register a keybinding in bootstrap-window.js for opening developer tools in case something
                        // goes wrong and that keybinding is only removed when the application has loaded (= window ready).
                        return false;
                    }
                }
                if (invocation.type === 'commandId') {
                    const runActionPayload = { id: invocation.commandId, from: 'menu' };
                    activeWindow.sendWhenReady('vscode:runAction', cancellation_1.CancellationToken.None, runActionPayload);
                }
                else {
                    const runKeybindingPayload = { userSettingsLabel: invocation.userSettingsLabel };
                    activeWindow.sendWhenReady('vscode:runKeybinding', cancellation_1.CancellationToken.None, runKeybindingPayload);
                }
                return true;
            }
            else {
                this.logService.trace('menubar#runActionInRenderer: no active window found', invocation);
                return false;
            }
        }
        withKeybinding(commandId, options) {
            const binding = typeof commandId === 'string' ? this.keybindings[commandId] : undefined;
            // Apply binding if there is one
            if (binding?.label) {
                // if the binding is native, we can just apply it
                if (binding.isNative !== false) {
                    options.accelerator = binding.label;
                    options.userSettingsLabel = binding.userSettingsLabel;
                }
                // the keybinding is not native so we cannot show it as part of the accelerator of
                // the menu item. we fallback to a different strategy so that we always display it
                else if (typeof options.label === 'string') {
                    const bindingIndex = options.label.indexOf('[');
                    if (bindingIndex >= 0) {
                        options.label = `${options.label.substr(0, bindingIndex)} [${binding.label}]`;
                    }
                    else {
                        options.label = `${options.label} [${binding.label}]`;
                    }
                }
            }
            // Unset bindings if there is none
            else {
                options.accelerator = undefined;
            }
            return options;
        }
        likeAction(commandId, options, setAccelerator = !options.accelerator) {
            if (setAccelerator) {
                options = this.withKeybinding(commandId, options);
            }
            const originalClick = options.click;
            options.click = (item, window, event) => {
                this.reportMenuActionTelemetry(commandId);
                originalClick?.(item, window, event);
            };
            return options;
        }
        openUrl(url, id) {
            this.nativeHostMainService.openExternal(undefined, url);
            this.reportMenuActionTelemetry(id);
        }
        reportMenuActionTelemetry(id) {
            this.telemetryService.publicLog2('workbenchActionExecuted', { id, from: telemetryFrom });
        }
        mnemonicLabel(label) {
            return (0, labels_1.mnemonicMenuLabel)(label, !this.currentEnableMenuBarMnemonics);
        }
    };
    exports.Menubar = Menubar;
    exports.Menubar = Menubar = Menubar_1 = __decorate([
        __param(0, update_1.IUpdateService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, windows_1.IWindowsMainService),
        __param(3, environmentMainService_1.IEnvironmentMainService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(6, state_1.IStateService),
        __param(7, lifecycleMainService_1.ILifecycleMainService),
        __param(8, log_1.ILogService),
        __param(9, nativeHostMainService_1.INativeHostMainService),
        __param(10, productService_1.IProductService),
        __param(11, auxiliaryWindows_1.IAuxiliaryWindowsMainService)
    ], Menubar);
    function __separator__() {
        return new electron_1.MenuItem({ type: 'separator' });
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvcGxhdGZvcm0vbWVudWJhci9lbGVjdHJvbi1tYWluL21lbnViYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQXlCaEcsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBZ0J0QixJQUFNLE9BQU8sR0FBYixNQUFNLE9BQU87O2lCQUVLLCtCQUEwQixHQUFHLHNCQUFzQixBQUF6QixDQUEwQjtRQW9CNUUsWUFDaUIsYUFBOEMsRUFDdkMsb0JBQTRELEVBQzlELGtCQUF3RCxFQUNwRCxzQkFBZ0UsRUFDdEUsZ0JBQW9ELEVBQ3hDLDRCQUE0RSxFQUM1RixZQUE0QyxFQUNwQyxvQkFBNEQsRUFDdEUsVUFBd0MsRUFDN0IscUJBQThELEVBQ3JFLGNBQWdELEVBQ25DLDJCQUEwRTtZQVh2RSxrQkFBYSxHQUFiLGFBQWEsQ0FBZ0I7WUFDdEIseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtZQUM3Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQXFCO1lBQ25DLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBeUI7WUFDckQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUN2QixpQ0FBNEIsR0FBNUIsNEJBQTRCLENBQStCO1lBQzNFLGlCQUFZLEdBQVosWUFBWSxDQUFlO1lBQ25CLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDckQsZUFBVSxHQUFWLFVBQVUsQ0FBYTtZQUNaLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBd0I7WUFDcEQsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBQ2xCLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFkeEYseUJBQW9CLEdBQW1ILE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFnQjNL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