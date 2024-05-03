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
define(["require", "exports", "vs/base/common/event", "vs/base/browser/browser", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/host/browser/host", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/titlebar/titlebarPart", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/themeService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/native/common/native", "vs/platform/window/common/window", "vs/platform/instantiation/common/instantiation", "vs/base/common/codicons", "vs/base/common/themables", "vs/workbench/electron-sandbox/parts/titlebar/menubarControl", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/keybinding/common/keybinding", "vs/base/browser/window"], function (require, exports, event_1, browser_1, dom_1, contextkey_1, configuration_1, storage_1, environmentService_1, host_1, platform_1, actions_1, titlebarPart_1, contextView_1, themeService_1, layoutService_1, native_1, window_1, instantiation_1, codicons_1, themables_1, menubarControl_1, editorGroupsService_1, editorService_1, keybinding_1, window_2) {
    "use strict";
    var AuxiliaryNativeTitlebarPart_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeTitleService = exports.AuxiliaryNativeTitlebarPart = exports.MainNativeTitlebarPart = exports.NativeTitlebarPart = void 0;
    let NativeTitlebarPart = class NativeTitlebarPart extends titlebarPart_1.BrowserTitlebarPart {
        //#region IView
        get minimumHeight() {
            if (!platform_1.isMacintosh) {
                return super.minimumHeight;
            }
            return (this.isCommandCenterVisible ? 35 : this.macTitlebarSize) / (this.preventZoom ? (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) : 1);
        }
        get maximumHeight() { return this.minimumHeight; }
        get macTitlebarSize() {
            if (this.bigSurOrNewer) {
                return 28; // macOS Big Sur increases title bar height
            }
            return 22;
        }
        constructor(id, targetWindow, editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService) {
            super(id, targetWindow, editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, editorGroupService, editorService, menuService, keybindingService);
            this.nativeHostService = nativeHostService;
            this.bigSurOrNewer = (0, platform_1.isBigSurOrNewer)(environmentService.os.release);
        }
        onMenubarVisibilityChanged(visible) {
            // Hide title when toggling menu bar
            if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility === 'toggle' && visible) {
                // Hack to fix issue #52522 with layered webkit-app-region elements appearing under cursor
                if (this.dragRegion) {
                    (0, dom_1.hide)(this.dragRegion);
                    setTimeout(() => (0, dom_1.show)(this.dragRegion), 50);
                }
            }
            super.onMenubarVisibilityChanged(visible);
        }
        onConfigurationChanged(event) {
            super.onConfigurationChanged(event);
            if (event.affectsConfiguration('window.doubleClickIconToClose')) {
                if (this.appIcon) {
                    this.onUpdateAppIconDragBehavior();
                }
            }
        }
        onUpdateAppIconDragBehavior() {
            const setting = this.configurationService.getValue('window.doubleClickIconToClose');
            if (setting && this.appIcon) {
                this.appIcon.style['-webkit-app-region'] = 'no-drag';
            }
            else if (this.appIcon) {
                this.appIcon.style['-webkit-app-region'] = 'drag';
            }
        }
        installMenubar() {
            super.installMenubar();
            if (this.menubar) {
                return;
            }
            if (this.customMenubar) {
                this._register(this.customMenubar.onFocusStateChange(e => this.onMenubarFocusChanged(e)));
            }
        }
        onMenubarFocusChanged(focused) {
            if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility !== 'compact' && this.dragRegion) {
                if (focused) {
                    (0, dom_1.hide)(this.dragRegion);
                }
                else {
                    (0, dom_1.show)(this.dragRegion);
                }
            }
        }
        createContentArea(parent) {
            const result = super.createContentArea(parent);
            const targetWindow = (0, dom_1.getWindow)(parent);
            const targetWindowId = (0, dom_1.getWindowId)(targetWindow);
            // Native menu controller
            if (platform_1.isMacintosh || (0, window_1.hasNativeTitlebar)(this.configurationService)) {
                this._register(this.instantiationService.createInstance(menubarControl_1.NativeMenubarControl));
            }
            // App Icon (Native Windows/Linux)
            if (this.appIcon) {
                this.onUpdateAppIconDragBehavior();
                this._register((0, dom_1.addDisposableListener)(this.appIcon, dom_1.EventType.DBLCLICK, (() => {
                    this.nativeHostService.closeWindow({ targetWindowId });
                })));
            }
            // Window Controls (Native Windows/Linux)
            if (!platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(this.configurationService) && !(0, browser_1.isWCOEnabled)() && this.primaryWindowControls) {
                // Minimize
                const minimizeIcon = (0, dom_1.append)(this.primaryWindowControls, (0, dom_1.$)('div.window-icon.window-minimize' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.chromeMinimize)));
                this._register((0, dom_1.addDisposableListener)(minimizeIcon, dom_1.EventType.CLICK, () => {
                    this.nativeHostService.minimizeWindow({ targetWindowId });
                }));
                // Restore
                this.maxRestoreControl = (0, dom_1.append)(this.primaryWindowControls, (0, dom_1.$)('div.window-icon.window-max-restore'));
                this._register((0, dom_1.addDisposableListener)(this.maxRestoreControl, dom_1.EventType.CLICK, async () => {
                    const maximized = await this.nativeHostService.isMaximized({ targetWindowId });
                    if (maximized) {
                        return this.nativeHostService.unmaximizeWindow({ targetWindowId });
                    }
                    return this.nativeHostService.maximizeWindow({ targetWindowId });
                }));
                // Close
                const closeIcon = (0, dom_1.append)(this.primaryWindowControls, (0, dom_1.$)('div.window-icon.window-close' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.chromeClose)));
                this._register((0, dom_1.addDisposableListener)(closeIcon, dom_1.EventType.CLICK, () => {
                    this.nativeHostService.closeWindow({ targetWindowId });
                }));
                // Resizer
                this.resizer = (0, dom_1.append)(this.rootContainer, (0, dom_1.$)('div.resizer'));
                this._register(event_1.Event.runAndSubscribe(this.layoutService.onDidChangeWindowMaximized, ({ windowId, maximized }) => {
                    if (windowId === targetWindowId) {
                        this.onDidChangeWindowMaximized(maximized);
                    }
                }, { windowId: targetWindowId, maximized: this.layoutService.isWindowMaximized(targetWindow) }));
            }
            // Window System Context Menu
            // See https://github.com/electron/electron/issues/24893
            if (platform_1.isWindows && !(0, window_1.hasNativeTitlebar)(this.configurationService)) {
                this._register(this.nativeHostService.onDidTriggerWindowSystemContextMenu(({ windowId, x, y }) => {
                    if (targetWindowId !== windowId) {
                        return;
                    }
                    const zoomFactor = (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element));
                    this.onContextMenu(new MouseEvent('mouseup', { clientX: x / zoomFactor, clientY: y / zoomFactor }), actions_1.MenuId.TitleBarContext);
                }));
            }
            return result;
        }
        onDidChangeWindowMaximized(maximized) {
            if (this.maxRestoreControl) {
                if (maximized) {
                    this.maxRestoreControl.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeMaximize));
                    this.maxRestoreControl.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeRestore));
                }
                else {
                    this.maxRestoreControl.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeRestore));
                    this.maxRestoreControl.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.chromeMaximize));
                }
            }
            if (this.resizer) {
                if (maximized) {
                    (0, dom_1.hide)(this.resizer);
                }
                else {
                    (0, dom_1.show)(this.resizer);
                }
            }
        }
        updateStyles() {
            super.updateStyles();
            // WCO styles only supported on Windows currently
            if ((0, window_1.useWindowControlsOverlay)(this.configurationService)) {
                if (!this.cachedWindowControlStyles ||
                    this.cachedWindowControlStyles.bgColor !== this.element.style.backgroundColor ||
                    this.cachedWindowControlStyles.fgColor !== this.element.style.color) {
                    this.nativeHostService.updateWindowControls({
                        targetWindowId: (0, dom_1.getWindowId)((0, dom_1.getWindow)(this.element)),
                        backgroundColor: this.element.style.backgroundColor,
                        foregroundColor: this.element.style.color
                    });
                }
            }
        }
        layout(width, height) {
            super.layout(width, height);
            if ((0, window_1.useWindowControlsOverlay)(this.configurationService) ||
                (platform_1.isMacintosh && platform_1.isNative && !(0, window_1.hasNativeTitlebar)(this.configurationService))) {
                // When the user goes into full screen mode, the height of the title bar becomes 0.
                // Instead, set it back to the default titlebar height for Catalina users
                // so that they can have the traffic lights rendered at the proper offset.
                // Ref https://github.com/microsoft/vscode/issues/159862
                const newHeight = (height > 0 || this.bigSurOrNewer) ? Math.round(height * (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element))) : this.macTitlebarSize;
                if (newHeight !== this.cachedWindowControlHeight) {
                    this.cachedWindowControlHeight = newHeight;
                    this.nativeHostService.updateWindowControls({
                        targetWindowId: (0, dom_1.getWindowId)((0, dom_1.getWindow)(this.element)),
                        height: newHeight
                    });
                }
            }
        }
    };
    exports.NativeTitlebarPart = NativeTitlebarPart;
    exports.NativeTitlebarPart = NativeTitlebarPart = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, host_1.IHostService),
        __param(12, native_1.INativeHostService),
        __param(13, editorGroupsService_1.IEditorGroupsService),
        __param(14, editorService_1.IEditorService),
        __param(15, actions_1.IMenuService),
        __param(16, keybinding_1.IKeybindingService)
    ], NativeTitlebarPart);
    let MainNativeTitlebarPart = class MainNativeTitlebarPart extends NativeTitlebarPart {
        constructor(contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService) {
            super("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */, window_2.mainWindow, 'main', contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService);
        }
    };
    exports.MainNativeTitlebarPart = MainNativeTitlebarPart;
    exports.MainNativeTitlebarPart = MainNativeTitlebarPart = __decorate([
        __param(0, contextView_1.IContextMenuService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, themeService_1.IThemeService),
        __param(5, storage_1.IStorageService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, host_1.IHostService),
        __param(9, native_1.INativeHostService),
        __param(10, editorGroupsService_1.IEditorGroupsService),
        __param(11, editorService_1.IEditorService),
        __param(12, actions_1.IMenuService),
        __param(13, keybinding_1.IKeybindingService)
    ], MainNativeTitlebarPart);
    let AuxiliaryNativeTitlebarPart = class AuxiliaryNativeTitlebarPart extends NativeTitlebarPart {
        static { AuxiliaryNativeTitlebarPart_1 = this; }
        static { this.COUNTER = 1; }
        get height() { return this.minimumHeight; }
        constructor(container, editorGroupsContainer, mainTitlebar, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService) {
            const id = AuxiliaryNativeTitlebarPart_1.COUNTER++;
            super(`workbench.parts.auxiliaryTitle.${id}`, (0, dom_1.getWindow)(container), editorGroupsContainer, contextMenuService, configurationService, environmentService, instantiationService, themeService, storageService, layoutService, contextKeyService, hostService, nativeHostService, editorGroupService, editorService, menuService, keybindingService);
            this.container = container;
            this.mainTitlebar = mainTitlebar;
        }
        get preventZoom() {
            // Prevent zooming behavior if any of the following conditions are met:
            // 1. Shrinking below the window control size (zoom < 1)
            // 2. No custom items are present in the main title bar
            // The auxiliary title bar never contains any zoomable items itself,
            // but we want to match the behavior of the main title bar.
            return (0, browser_1.getZoomFactor)((0, dom_1.getWindow)(this.element)) < 1 || !this.mainTitlebar.hasZoomableElements;
        }
    };
    exports.AuxiliaryNativeTitlebarPart = AuxiliaryNativeTitlebarPart;
    exports.AuxiliaryNativeTitlebarPart = AuxiliaryNativeTitlebarPart = AuxiliaryNativeTitlebarPart_1 = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, storage_1.IStorageService),
        __param(9, layoutService_1.IWorkbenchLayoutService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, host_1.IHostService),
        __param(12, native_1.INativeHostService),
        __param(13, editorGroupsService_1.IEditorGroupsService),
        __param(14, editorService_1.IEditorService),
        __param(15, actions_1.IMenuService),
        __param(16, keybinding_1.IKeybindingService)
    ], AuxiliaryNativeTitlebarPart);
    class NativeTitleService extends titlebarPart_1.BrowserTitleService {
        createMainTitlebarPart() {
            return this.instantiationService.createInstance(MainNativeTitlebarPart);
        }
        doCreateAuxiliaryTitlebarPart(container, editorGroupsContainer) {
            return this.instantiationService.createInstance(AuxiliaryNativeTitlebarPart, container, editorGroupsContainer, this.mainPart);
        }
    }
    exports.NativeTitleService = NativeTitleService;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGl0bGViYXJQYXJ0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvZWxlY3Ryb24tc2FuZGJveC9wYXJ0cy90aXRsZWJhci90aXRsZWJhclBhcnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxrQ0FBbUI7UUFFMUQsZUFBZTtRQUVmLElBQWEsYUFBYTtZQUN6QixJQUFJLENBQUMsc0JBQVcsRUFBRSxDQUFDO2dCQUNsQixPQUFPLEtBQUssQ0FBQyxhQUFhLENBQUM7WUFDNUIsQ0FBQztZQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBQSx1QkFBYSxFQUFDLElBQUEsZUFBUyxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwSSxDQUFDO1FBQ0QsSUFBYSxhQUFhLEtBQWEsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUduRSxJQUFZLGVBQWU7WUFDMUIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sRUFBRSxDQUFDLENBQUMsMkNBQTJDO1lBQ3ZELENBQUM7WUFFRCxPQUFPLEVBQUUsQ0FBQztRQUNYLENBQUM7UUFTRCxZQUNDLEVBQVUsRUFDVixZQUF3QixFQUN4QixxQkFBc0QsRUFDakMsa0JBQXVDLEVBQ3JDLG9CQUEyQyxFQUM5QixrQkFBc0QsRUFDbkUsb0JBQTJDLEVBQ25ELFlBQTJCLEVBQ3pC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