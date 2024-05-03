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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "./contextMenuHandler", "./contextView"], function (require, exports, dom_1, actions_1, event_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, contextkey_1, keybinding_1, notification_1, telemetry_1, contextMenuHandler_1, contextView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuMenuDelegate = exports.ContextMenuService = void 0;
    let ContextMenuService = class ContextMenuService extends lifecycle_1.Disposable {
        get contextMenuHandler() {
            if (!this._contextMenuHandler) {
                this._contextMenuHandler = new contextMenuHandler_1.ContextMenuHandler(this.contextViewService, this.telemetryService, this.notificationService, this.keybindingService);
            }
            return this._contextMenuHandler;
        }
        constructor(telemetryService, notificationService, contextViewService, keybindingService, menuService, contextKeyService) {
            super();
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.contextViewService = contextViewService;
            this.keybindingService = keybindingService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._contextMenuHandler = undefined;
            this._onDidShowContextMenu = this._store.add(new event_1.Emitter());
            this.onDidShowContextMenu = this._onDidShowContextMenu.event;
            this._onDidHideContextMenu = this._store.add(new event_1.Emitter());
            this.onDidHideContextMenu = this._onDidHideContextMenu.event;
        }
        configure(options) {
            this.contextMenuHandler.configure(options);
        }
        // ContextMenu
        showContextMenu(delegate) {
            delegate = ContextMenuMenuDelegate.transform(delegate, this.menuService, this.contextKeyService);
            this.contextMenuHandler.showContextMenu({
                ...delegate,
                onHide: (didCancel) => {
                    delegate.onHide?.(didCancel);
                    this._onDidHideContextMenu.fire();
                }
            });
            dom_1.ModifierKeyEmitter.getInstance().resetKeyStatus();
            this._onDidShowContextMenu.fire();
        }
    };
    exports.ContextMenuService = ContextMenuService;
    exports.ContextMenuService = ContextMenuService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], ContextMenuService);
    var ContextMenuMenuDelegate;
    (function (ContextMenuMenuDelegate) {
        function is(thing) {
            return thing && thing.menuId instanceof actions_2.MenuId;
        }
        function transform(delegate, menuService, globalContextKeyService) {
            if (!is(delegate)) {
                return delegate;
            }
            const { menuId, menuActionOptions, contextKeyService } = delegate;
            return {
                ...delegate,
                getActions: () => {
                    const target = [];
                    if (menuId) {
                        const menu = menuService.createMenu(menuId, contextKeyService ?? globalContextKeyService);
                        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, menuActionOptions, target);
                        menu.dispose();
                    }
                    if (!delegate.getActions) {
                        return target;
                    }
                    else {
                        return actions_1.Separator.join(delegate.getActions(), target);
                    }
                }
            };
        }
        ContextMenuMenuDelegate.transform = transform;
    })(ContextMenuMenuDelegate || (exports.ContextMenuMenuDelegate = ContextMenuMenuDelegate = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dE1lbnVTZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9jb250ZXh0dmlldy9icm93c2VyL2NvbnRleHRNZW51U2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFnQnpGLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVU7UUFLakQsSUFBWSxrQkFBa0I7WUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSx1Q0FBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNySixDQUFDO1lBRUQsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUM7UUFDakMsQ0FBQztRQVFELFlBQ29CLGdCQUFvRCxFQUNqRCxtQkFBMEQsRUFDM0Qsa0JBQXdELEVBQ3pELGlCQUFzRCxFQUM1RCxXQUEwQyxFQUNwQyxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFQNEIscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFtQjtZQUNoQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXNCO1lBQzFDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBcUI7WUFDeEMsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQUMzQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUNuQixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBckJuRSx3QkFBbUIsR0FBbUMsU0FBUyxDQUFDO1lBU3ZELDBCQUFxQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxD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