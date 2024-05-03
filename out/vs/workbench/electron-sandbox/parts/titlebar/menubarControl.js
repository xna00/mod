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
define(["require", "exports", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/workspaces/common/workspaces", "vs/base/common/platform", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/storage/common/storage", "vs/platform/menubar/electron-sandbox/menubar", "vs/platform/native/common/native", "vs/workbench/services/host/browser/host", "vs/workbench/services/preferences/common/preferences", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/windowActions", "vs/platform/action/common/action", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, actions_1, actions_2, contextkey_1, workspaces_1, platform_1, notification_1, keybinding_1, environmentService_1, accessibility_1, configuration_1, label_1, update_1, menubarControl_1, storage_1, menubar_1, native_1, host_1, preferences_1, commands_1, windowActions_1, action_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeMenubarControl = void 0;
    let NativeMenubarControl = class NativeMenubarControl extends menubarControl_1.MenubarControl {
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, menubarService, hostService, nativeHostService, commandService) {
            super(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService, commandService);
            this.menubarService = menubarService;
            this.nativeHostService = nativeHostService;
            (async () => {
                this.recentlyOpened = await this.workspacesService.getRecentlyOpened();
                this.doUpdateMenubar();
            })();
            this.registerListeners();
        }
        setupMainMenu() {
            super.setupMainMenu();
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    this.mainMenuDisposables.add(menu.onDidChange(() => this.updateMenubar()));
                }
            }
        }
        doUpdateMenubar() {
            // Since the native menubar is shared between windows (main process)
            // only allow the focused window to update the menubar
            if (!this.hostService.hasFocus) {
                return;
            }
            // Send menus to main process to be rendered by Electron
            const menubarData = { menus: {}, keybindings: {} };
            if (this.getMenubarMenus(menubarData)) {
                this.menubarService.updateMenubar(this.nativeHostService.windowId, menubarData);
            }
        }
        getMenubarMenus(menubarData) {
            if (!menubarData) {
                return false;
            }
            menubarData.keybindings = this.getAdditionalKeybindings();
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    const menubarMenu = { items: [] };
                    const menuActions = [];
                    (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, menuActions);
                    this.populateMenuItems(menuActions, menubarMenu, menubarData.keybindings);
                    if (menubarMenu.items.length === 0) {
                        return false; // Menus are incomplete
                    }
                    menubarData.menus[topLevelMenuName] = menubarMenu;
                }
            }
            return true;
        }
        populateMenuItems(menuActions, menuToPopulate, keybindings) {
            for (const menuItem of menuActions) {
                if (menuItem instanceof actions_1.Separator) {
                    menuToPopulate.items.push({ id: 'vscode.menubar.separator' });
                }
                else if (menuItem instanceof actions_2.MenuItemAction || menuItem instanceof actions_2.SubmenuItemAction) {
                    // use mnemonicTitle whenever possible
                    const title = typeof menuItem.item.title === 'string'
                        ? menuItem.item.title
                        : menuItem.item.title.mnemonicTitle ?? menuItem.item.title.value;
                    if (menuItem instanceof actions_2.SubmenuItemAction) {
                        const submenu = { items: [] };
                        this.populateMenuItems(menuItem.actions, submenu, keybindings);
                        if (submenu.items.length > 0) {
                            const menubarSubmenuItem = {
                                id: menuItem.id,
                                label: title,
                                submenu
                            };
                            menuToPopulate.items.push(menubarSubmenuItem);
                        }
                    }
                    else {
                        if (menuItem.id === windowActions_1.OpenRecentAction.ID) {
                            const actions = this.getOpenRecentActions().map(this.transformOpenRecentAction);
                            menuToPopulate.items.push(...actions);
                        }
                        const menubarMenuItem = {
                            id: menuItem.id,
                            label: title
                        };
                        if ((0, action_1.isICommandActionToggleInfo)(menuItem.item.toggled)) {
                            menubarMenuItem.label = menuItem.item.toggled.mnemonicTitle ?? menuItem.item.toggled.title ?? title;
                        }
                        if (menuItem.checked) {
                            menubarMenuItem.checked = true;
                        }
                        if (!menuItem.enabled) {
                            menubarMenuItem.enabled = false;
                        }
                        keybindings[menuItem.id] = this.getMenubarKeybinding(menuItem.id);
                        menuToPopulate.items.push(menubarMenuItem);
                    }
                }
            }
        }
        transformOpenRecentAction(action) {
            if (action instanceof actions_1.Separator) {
                return { id: 'vscode.menubar.separator' };
            }
            return {
                id: action.id,
                uri: action.uri,
                remoteAuthority: action.remoteAuthority,
                enabled: action.enabled,
                label: action.label
            };
        }
        getAdditionalKeybindings() {
            const keybindings = {};
            if (platform_1.isMacintosh) {
                const keybinding = this.getMenubarKeybinding('workbench.action.quit');
                if (keybinding) {
                    keybindings['workbench.action.quit'] = keybinding;
                }
            }
            return keybindings;
        }
        getMenubarKeybinding(id) {
            const binding = this.keybindingService.lookupKeybinding(id);
            if (!binding) {
                return undefined;
            }
            // first try to resolve a native accelerator
            const electronAccelerator = binding.getElectronAccelerator();
            if (electronAccelerator) {
                return { label: electronAccelerator, userSettingsLabel: binding.getUserSettingsLabel() ?? undefined };
            }
            // we need this fallback to support keybindings that cannot show in electron menus (e.g. chords)
            const acceleratorLabel = binding.getLabel();
            if (acceleratorLabel) {
                return { label: acceleratorLabel, isNative: false, userSettingsLabel: binding.getUserSettingsLabel() ?? undefined };
            }
            return undefined;
        }
    };
    exports.NativeMenubarControl = NativeMenubarControl;
    exports.NativeMenubarControl = NativeMenubarControl = __decorate([
        __param(0, actions_2.IMenuService),
        __param(1, workspaces_1.IWorkspacesService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, label_1.ILabelService),
        __param(6, update_1.IUpdateService),
        __param(7, storage_1.IStorageService),
        __param(8, notification_1.INotificationService),
        __param(9, preferences_1.IPreferencesService),
        __param(10, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(11, accessibility_1.IAccessibilityService),
        __param(12, menubar_1.IMenubarService),
        __param(13, host_1.IHostService),
        __param(14, native_1.INativeHostService),
        __param(15, commands_1.ICommandService)
    ], NativeMenubarControl);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhckNvbnRyb2wuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9lbGVjdHJvbi1zYW5kYm94L3BhcnRzL3RpdGxlYmFyL21lbnViYXJDb250cm9sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTBCekYsSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSwrQkFBYztRQUV2RCxZQUNlLFdBQXlCLEVBQ25CLGlCQUFxQyxFQUNyQyxpQkFBcUMsRUFDckMsaUJBQXFDLEVBQ2xDLG9CQUEyQyxFQUNuRCxZQUEyQixFQUMxQixhQUE2QixFQUM1QixjQUErQixFQUMxQixtQkFBeUMsRUFDMUMsa0JBQXVDLEVBQ3hCLGtCQUFzRCxFQUNuRSxvQkFBMkMsRUFDaEMsY0FBK0IsRUFDbkQsV0FBeUIsRUFDRixpQkFBcUMsRUFDekQsY0FBK0I7WUFFaEQsS0FBSyxDQUFDLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsRUFBRSxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFMN04sbUJBQWMsR0FBZCxjQUFjLENBQWlCO1lBRTVCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBb0I7WUFLMUUsQ0FBQyxLQUFLLElBQUksRUFBRTtnQkFDWCxJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBRXZFLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUN4QixDQUFDLENBQUMsRUFBRSxDQUFDO1lBRUwsSUFBSSxDQUFDLGlC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