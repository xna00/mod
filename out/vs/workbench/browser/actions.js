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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, lifecycle_1, event_1, actions_1, contextkey_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositeMenuActions = void 0;
    class MenuActions extends lifecycle_1.Disposable {
        get primaryActions() { return this._primaryActions; }
        get secondaryActions() { return this._secondaryActions; }
        constructor(menuId, options, menuService, contextKeyService) {
            super();
            this.options = options;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this._primaryActions = [];
            this._secondaryActions = [];
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.disposables = this._register(new lifecycle_1.DisposableStore());
            this.menu = this._register(menuService.createMenu(menuId, contextKeyService));
            this._register(this.menu.onDidChange(() => this.updateActions()));
            this.updateActions();
        }
        updateActions() {
            this.disposables.clear();
            this._primaryActions = [];
            this._secondaryActions = [];
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, this.options, { primary: this._primaryActions, secondary: this._secondaryActions });
            this.disposables.add(this.updateSubmenus([...this._primaryActions, ...this._secondaryActions], {}));
            this._onDidChange.fire();
        }
        updateSubmenus(actions, submenus) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const action of actions) {
                if (action instanceof actions_1.SubmenuItemAction && !submenus[action.item.submenu.id]) {
                    const menu = submenus[action.item.submenu.id] = disposables.add(this.menuService.createMenu(action.item.submenu, this.contextKeyService));
                    disposables.add(menu.onDidChange(() => this.updateActions()));
                    disposables.add(this.updateSubmenus(action.actions, submenus));
                }
            }
            return disposables;
        }
    }
    let CompositeMenuActions = class CompositeMenuActions extends lifecycle_1.Disposable {
        constructor(menuId, contextMenuId, options, contextKeyService, menuService) {
            super();
            this.menuId = menuId;
            this.contextMenuId = contextMenuId;
            this.options = options;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this.menuActions = this._register(new MenuActions(menuId, this.options, menuService, contextKeyService));
            this._register(this.menuActions.onDidChange(() => this._onDidChange.fire()));
        }
        getPrimaryActions() {
            return this.menuActions.primaryActions;
        }
        getSecondaryActions() {
            return this.menuActions.secondaryActions;
        }
        getContextMenuActions() {
            const actions = [];
            if (this.contextMenuId) {
                const menu = this.menuService.createMenu(this.contextMenuId, this.contextKeyService);
                (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, this.options, { primary: [], secondary: actions });
                menu.dispose();
            }
            return actions;
        }
    };
    exports.CompositeMenuActions = CompositeMenuActions;
    exports.CompositeMenuActions = CompositeMenuActions = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService)
    ], CompositeMenuActions);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvYWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFTaEcsTUFBTSxXQUFZLFNBQVEsc0JBQVU7UUFLbkMsSUFBSSxjQUFjLEtBQUssT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUdyRCxJQUFJLGdCQUFnQixLQUFLLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQU96RCxZQUNDLE1BQWMsRUFDRyxPQUF1QyxFQUN2QyxXQUF5QixFQUN6QixpQkFBcUM7WUFFdEQsS0FBSyxFQUFFLENBQUM7WUFKUyxZQUFPLEdBQVAsT0FBTyxDQUFnQztZQUN2QyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztZQUN6QixzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBZi9DLG9CQUFlLEdBQWMsRUFBRSxDQUFDO1lBR2hDLHNCQUFpQixHQUFjLEVBQUUsQ0FBQztZQUd6QixpQkFBWSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzNELGdCQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFdkMsZ0JBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFVM0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUU5RSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLElB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