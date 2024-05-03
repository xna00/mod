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
define(["require", "exports", "vs/base/browser/ui/button/button", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/common/actions", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry"], function (require, exports, button_1, hoverDelegateFactory_1, updatableHoverWidget_1, actions_1, event_1, lifecycle_1, themables_1, nls_1, actions_2, contextkey_1, contextView_1, keybinding_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuWorkbenchButtonBar = exports.WorkbenchButtonBar = void 0;
    let WorkbenchButtonBar = class WorkbenchButtonBar extends button_1.ButtonBar {
        constructor(container, _options, _contextMenuService, _keybindingService, telemetryService) {
            super(container);
            this._options = _options;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._store = new lifecycle_1.DisposableStore();
            this._updateStore = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._actionRunner = this._store.add(new actions_1.ActionRunner());
            if (_options?.telemetrySource) {
                this._actionRunner.onDidRun(e => {
                    telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: _options.telemetrySource });
                }, undefined, this._store);
            }
        }
        dispose() {
            this._onDidChange.dispose();
            this._updateStore.dispose();
            this._store.dispose();
            super.dispose();
        }
        update(actions) {
            const conifgProvider = this._options?.buttonConfigProvider ?? (() => ({ showLabel: true }));
            this._updateStore.clear();
            this.clear();
            // Support instamt hover between buttons
            const hoverDelegate = this._updateStore.add((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            for (let i = 0; i < actions.length; i++) {
                const secondary = i > 0;
                const actionOrSubmenu = actions[i];
                let action;
                let btn;
                if (actionOrSubmenu instanceof actions_1.SubmenuAction && actionOrSubmenu.actions.length > 0) {
                    const [first, ...rest] = actionOrSubmenu.actions;
                    action = first;
                    btn = this.addButtonWithDropdown({
                        secondary: conifgProvider(action)?.isSecondary ?? secondary,
                        actionRunner: this._actionRunner,
                        actions: rest,
                        contextMenuProvider: this._contextMenuService,
                        ariaLabel: action.label
                    });
                }
                else {
                    action = actionOrSubmenu;
                    btn = this.addButton({
                        secondary: conifgProvider(action)?.isSecondary ?? secondary,
                        ariaLabel: action.label
                    });
                }
                btn.enabled = action.enabled;
                btn.element.classList.add('default-colors');
                if (conifgProvider(action)?.showLabel ?? true) {
                    btn.label = action.label;
                }
                else {
                    btn.element.classList.add('monaco-text-button');
                }
                if (conifgProvider(action)?.showIcon) {
                    if (action instanceof actions_2.MenuItemAction && themables_1.ThemeIcon.isThemeIcon(action.item.icon)) {
                        btn.icon = action.item.icon;
                    }
                    else if (action.class) {
                        btn.element.classList.add(...action.class.split(' '));
                    }
                }
                const kb = this._keybindingService.lookupKeybinding(action.id);
                let tooltip;
                if (kb) {
                    tooltip = (0, nls_1.localize)('labelWithKeybinding', "{0} ({1})", action.label, kb.getLabel());
                }
                else {
                    tooltip = action.label;
                }
                this._updateStore.add((0, updatableHoverWidget_1.setupCustomHover)(hoverDelegate, btn.element, tooltip));
                this._updateStore.add(btn.onDidClick(async () => {
                    this._actionRunner.run(action);
                }));
            }
            this._onDidChange.fire(this);
        }
    };
    exports.WorkbenchButtonBar = WorkbenchButtonBar;
    exports.WorkbenchButtonBar = WorkbenchButtonBar = __decorate([
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, telemetry_1.ITelemetryService)
    ], WorkbenchButtonBar);
    let MenuWorkbenchButtonBar = class MenuWorkbenchButtonBar extends WorkbenchButtonBar {
        constructor(container, menuId, options, menuService, contextKeyService, contextMenuService, keybindingService, telemetryService) {
            super(container, options, contextMenuService, keybindingService, telemetryService);
            const menu = menuService.createMenu(menuId, contextKeyService);
            this._store.add(menu);
            const update = () => {
                this.clear();
                const actions = menu
                    .getActions({ renderShortTitle: true })
                    .flatMap(entry => entry[1]);
                super.update(actions);
            };
            this._store.add(menu.onDidChange(update));
            update();
        }
        dispose() {
            super.dispose();
        }
        update(_actions) {
            throw new Error('Use Menu or WorkbenchButtonBar');
        }
    };
    exports.MenuWorkbenchButtonBar = MenuWorkbenchButtonBar;
    exports.MenuWorkbenchButtonBar = MenuWorkbenchButtonBar = __decorate([
        __param(3, actions_2.IMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService)
    ], MenuWorkbenchButtonBar);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV0dG9uYmFyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS9hY3Rpb25zL2Jyb3dzZXIvYnV0dG9uYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7OztJQTJCekYsSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBbUIsU0FBUSxrQkFBUztRQVVoRCxZQUNDLFNBQXNCLEVBQ0wsUUFBZ0QsRUFDNUMsbUJBQXlELEVBQzFELGtCQUF1RCxFQUN4RCxnQkFBbUM7WUFFdEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBTEEsYUFBUSxHQUFSLFFBQVEsQ0FBd0M7WUFDM0Isd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFxQjtZQUN6Qyx1QkFBa0IsR0FBbEIsa0JBQWtCLENBQW9CO1lBWnpELFdBQU0sR0FBRyxJQUFJLDJCQUFlLEVBQUUsQ0FBQztZQUMvQixpQkFBWSxHQUFHLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBR3ZDLGlCQUFZLEdBQUcsSUFBSSxlQUFPLEVBQVEsQ0FBQztZQUMzQyxnQkFBVyxHQUFnQixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQVkzRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksc0JBQVksRUFBRSxDQUFDLENBQUM7WUFDekQsSUFBSSxRQUFRLEVBQUUsZUFBZSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUMvQixnQkFBZ0IsQ0FBQyxVQUFVLENBQzFCLHlCQUF5QixFQUN6QixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGVBQWdCLEVBQUUsQ0FD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