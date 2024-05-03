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
define(["require", "exports", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/base/browser/browser", "vs/base/common/labels", "vs/platform/notification/common/notification", "vs/base/common/functional", "vs/base/parts/contextmenu/electron-sandbox/contextmenu", "vs/platform/window/common/window", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextMenuService", "vs/platform/instantiation/common/extensions", "vs/base/common/iconLabels", "vs/base/common/arrays", "vs/base/common/event", "vs/base/browser/ui/contextview/contextview", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle"], function (require, exports, actions_1, dom, contextView_1, telemetry_1, keybinding_1, browser_1, labels_1, notification_1, functional_1, contextmenu_1, window_1, platform_1, configuration_1, contextMenuService_1, extensions_1, iconLabels_1, arrays_1, event_1, contextview_1, actions_2, contextkey_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuService = void 0;
    let ContextMenuService = class ContextMenuService {
        get onDidShowContextMenu() { return this.impl.onDidShowContextMenu; }
        get onDidHideContextMenu() { return this.impl.onDidHideContextMenu; }
        constructor(notificationService, telemetryService, keybindingService, configurationService, contextViewService, menuService, contextKeyService) {
            // Custom context menu: Linux/Windows if custom title is enabled
            if (!platform_1.isMacintosh && !(0, window_1.hasNativeTitlebar)(configurationService)) {
                this.impl = new contextMenuService_1.ContextMenuService(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService);
            }
            // Native context menu: otherwise
            else {
                this.impl = new NativeContextMenuService(notificationService, telemetryService, keybindingService, menuService, contextKeyService);
            }
        }
        dispose() {
            this.impl.dispose();
        }
        showContextMenu(delegate) {
            this.impl.showContextMenu(delegate);
        }
    };
    exports.ContextMenuService = ContextMenuService;
    exports.ContextMenuService = ContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, actions_2.IMenuService),
        __param(6, contextkey_1.IContextKeyService)
    ], ContextMenuService);
    let NativeContextMenuService = class NativeContextMenuService extends lifecycle_1.Disposable {
        constructor(notificationService, telemetryService, keybindingService, menuService, contextKeyService) {
            super();
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._onDidShowContextMenu = this._store.add(new event_1.Emitter());
            this.onDidShowContextMenu = this._onDidShowContextMenu.event;
            this._onDidHideContextMenu = this._store.add(new event_1.Emitter());
            this.onDidHideContextMenu = this._onDidHideContextMenu.event;
        }
        showContextMenu(delegate) {
            delegate = contextMenuService_1.ContextMenuMenuDelegate.transform(delegate, this.menuService, this.contextKeyService);
            const actions = delegate.getActions();
            if (actions.length) {
                const onHide = (0, functional_1.createSingleCallFunction)(() => {
                    delegate.onHide?.(false);
                    dom.ModifierKeyEmitter.getInstance().resetKeyStatus();
                    this._onDidHideContextMenu.fire();
                });
                const menu = this.createMenu(delegate, actions, onHide);
                const anchor = delegate.getAnchor();
                let x;
                let y;
                let zoom = (0, browser_1.getZoomFactor)(anchor instanceof HTMLElement ? dom.getWindow(anchor) : dom.getActiveWindow());
                if (anchor instanceof HTMLElement) {
                    const elementPosition = dom.getDomNodePagePosition(anchor);
                    // When drawing context menus, we adjust the pixel position for native menus using zoom level
                    // In areas where zoom is applied to the element or its ancestors, we need to adjust accordingly
                    // e.g. The title bar has counter zoom behavior meaning it applies the inverse of zoom level.
                    // Window Zoom Level: 1.5, Title Bar Zoom: 1/1.5, Coordinate Multiplier: 1.5 * 1.0 / 1.5 = 1.0
                    zoom *= dom.getDomNodeZoomLevel(anchor);
                    // Position according to the axis alignment and the anchor alignment:
                    // `HORIZONTAL` aligns at the top left or right of the anchor and
                    //  `VERTICAL` aligns at the bottom left of the anchor.
                    if (delegate.anchorAxisAlignment === 1 /* AnchorAxisAlignment.HORIZONTAL */) {
                        if (delegate.anchorAlignment === 0 /* AnchorAlignment.LEFT */) {
                            x = elementPosition.left;
                            y = elementPosition.top;
                        }
                        else {
                            x = elementPosition.left + elementPosition.width;
                            y = elementPosition.top;
                        }
                        if (!platform_1.isMacintosh) {
                            const window = dom.getWindow(anchor);
                            const availableHeightForMenu = window.screen.height - y;
                            if (availableHeightForMenu < actions.length * (platform_1.isWindows ? 45 : 32) /* guess of 1 menu item height */) {
                                // this is a guess to detect whether the context menu would
                                // open to the bottom from this point or to the top. If the
                                // menu opens to the top, make sure to align it to the bottom
                                // of the anchor and not to the top.
                                // this seems to be only necessary for Windows and Linux.
                                y += elementPosition.height;
                            }
                        }
                    }
                    else {
                        if (delegate.anchorAlignment === 0 /* AnchorAlignment.LEFT */) {
                            x = elementPosition.left;
                            y = elementPosition.top + elementPosition.height;
                        }
                        else {
                            x = elementPosition.left + elementPosition.width;
                            y = elementPosition.top + elementPosition.height;
                        }
                    }
                    // Shift macOS menus by a few pixels below elements
                    // to account for extra padding on top of native menu
                    // https://github.com/microsoft/vscode/issues/84231
                    if (platform_1.isMacintosh) {
                        y += 4 / zoom;
                    }
                }
                else if ((0, contextview_1.isAnchor)(anchor)) {
                    x = anchor.x;
                    y = anchor.y;
                }
                else {
                    // We leave x/y undefined in this case which will result in
                    // Electron taking care of opening the menu at the cursor position.
                }
                if (typeof x === 'number') {
                    x = Math.floor(x * zoom);
                }
                if (typeof y === 'number') {
                    y = Math.floor(y * zoom);
                }
                (0, contextmenu_1.popup)(menu, { x, y, positioningItem: delegate.autoSelectFirstItem ? 0 : undefined, }, () => onHide());
                this._onDidShowContextMenu.fire();
            }
        }
        createMenu(delegate, entries, onHide, submenuIds = new Set()) {
            const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
            return (0, arrays_1.coalesce)(entries.map(entry => this.createMenuItem(delegate, entry, actionRunner, onHide, submenuIds)));
        }
        createMenuItem(delegate, entry, actionRunner, onHide, submenuIds) {
            // Separator
            if (entry instanceof actions_1.Separator) {
                return { type: 'separator' };
            }
            // Submenu
            if (entry instanceof actions_1.SubmenuAction) {
                if (submenuIds.has(entry.id)) {
                    console.warn(`Found submenu cycle: ${entry.id}`);
                    return undefined;
                }
                return {
                    label: (0, labels_1.unmnemonicLabel)((0, iconLabels_1.stripIcons)(entry.label)).trim(),
                    submenu: this.createMenu(delegate, entry.actions, onHide, new Set([...submenuIds, entry.id]))
                };
            }
            // Normal Menu Item
            else {
                let type = undefined;
                if (!!entry.checked) {
                    if (typeof delegate.getCheckedActionsRepresentation === 'function') {
                        type = delegate.getCheckedActionsRepresentation(entry);
                    }
                    else {
                        type = 'checkbox';
                    }
                }
                const item = {
                    label: (0, labels_1.unmnemonicLabel)((0, iconLabels_1.stripIcons)(entry.label)).trim(),
                    checked: !!entry.checked,
                    type,
                    enabled: !!entry.enabled,
                    click: event => {
                        // To preserve pre-electron-2.x behaviour, we first trigger
                        // the onHide callback and then the action.
                        // Fixes https://github.com/microsoft/vscode/issues/45601
                        onHide();
                        // Run action which will close the menu
                        this.runAction(actionRunner, entry, delegate, event);
                    }
                };
                const keybinding = !!delegate.getKeyBinding ? delegate.getKeyBinding(entry) : this.keybindingService.lookupKeybinding(entry.id);
                if (keybinding) {
                    const electronAccelerator = keybinding.getElectronAccelerator();
                    if (electronAccelerator) {
                        item.accelerator = electronAccelerator;
                    }
                    else {
                        const label = keybinding.getLabel();
                        if (label) {
                            item.label = `${item.label} [${label}]`;
                        }
                    }
                }
                return item;
            }
        }
        async runAction(actionRunner, actionToRun, delegate, event) {
            if (!delegate.skipTelemetry) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: actionToRun.id, from: 'contextMenu' });
            }
            const context = delegate.getActionsContext ? delegate.getActionsContext(event) : undefined;
            const runnable = actionRunner.run(actionToRun, context);
            try {
                await runnable;
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
    };
    NativeContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService)
    ], NativeContextMenuService);
    (0, extensions_1.registerSingleton)(contextView_1.IContextMenuService, ContextMenuService, 1 /* InstantiationType.Delayed */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dG1lbnVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvc2VydmljZXMvY29udGV4dG1lbnUvZWxlY3Ryb24tc2FuZGJveC9jb250ZXh0bWVudVNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFrQjtRQU05QixJQUFJLG9CQUFvQixLQUFrQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQ2xGLElBQUksb0JBQW9CLEtBQWtCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7UUFFbEYsWUFDdUIsbUJBQXlDLEVBQzVDLGdCQUFtQyxFQUNsQyxpQkFBcUMsRUFDbEMsb0JBQTJDLEVBQzdDLGtCQUF1QyxFQUM5QyxXQUF5QixFQUNuQixpQkFBcUM7WUFHekQsZ0VBQWdFO1lBQ2hFLElBQUksQ0FBQyxzQkFBVyxJQUFJLENBQUMsSUFBQSwwQkFBaUIsRUFBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUM7Z0JBQzlELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSx1Q0FBc0IsQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUN0SixDQUFDO1lBRUQsaUNBQWlDO2lCQUM1QixDQUFDO2dCQUNMLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSx3QkFBd0IsQ0FBQyxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUNwSSxDQUFDO1FBQ0YsQ0FBQztRQUVELE9B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