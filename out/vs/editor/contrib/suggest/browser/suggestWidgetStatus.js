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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, dom, actionbar_1, lifecycle_1, nls_1, menuEntryActionViewItem_1, actions_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestWidgetStatus = void 0;
    class StatusBarViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        updateLabel() {
            const kb = this._keybindingService.lookupKeybinding(this._action.id, this._contextKeyService);
            if (!kb) {
                return super.updateLabel();
            }
            if (this.label) {
                this.label.textContent = (0, nls_1.localize)({ key: 'content', comment: ['A label', 'A keybinding'] }, '{0} ({1})', this._action.label, StatusBarViewItem.symbolPrintEnter(kb));
            }
        }
        static symbolPrintEnter(kb) {
            return kb.getLabel()?.replace(/\benter\b/gi, '\u23CE');
        }
    }
    let SuggestWidgetStatus = class SuggestWidgetStatus {
        constructor(container, _menuId, instantiationService, _menuService, _contextKeyService) {
            this._menuId = _menuId;
            this._menuService = _menuService;
            this._contextKeyService = _contextKeyService;
            this._menuDisposables = new lifecycle_1.DisposableStore();
            this.element = dom.append(container, dom.$('.suggest-status-bar'));
            const actionViewItemProvider = (action => {
                return action instanceof actions_1.MenuItemAction ? instantiationService.createInstance(StatusBarViewItem, action, undefined) : undefined;
            });
            this._leftActions = new actionbar_1.ActionBar(this.element, { actionViewItemProvider });
            this._rightActions = new actionbar_1.ActionBar(this.element, { actionViewItemProvider });
            this._leftActions.domNode.classList.add('left');
            this._rightActions.domNode.classList.add('right');
        }
        dispose() {
            this._menuDisposables.dispose();
            this._leftActions.dispose();
            this._rightActions.dispose();
            this.element.remove();
        }
        show() {
            const menu = this._menuService.createMenu(this._menuId, this._contextKeyService);
            const renderMenu = () => {
                const left = [];
                const right = [];
                for (const [group, actions] of menu.getActions()) {
                    if (group === 'left') {
                        left.push(...actions);
                    }
                    else {
                        right.push(...actions);
                    }
                }
                this._leftActions.clear();
                this._leftActions.push(left);
                this._rightActions.clear();
                this._rightActions.push(right);
            };
            this._menuDisposables.add(menu.onDidChange(() => renderMenu()));
            this._menuDisposables.add(menu);
        }
        hide() {
            this._menuDisposables.clear();
        }
    };
    exports.SuggestWidgetStatus = SuggestWidgetStatus;
    exports.SuggestWidgetStatus = SuggestWidgetStatus = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, actions_1.IMenuService),
        __param(4, contextkey_1.IContextKeyService)
    ], SuggestWidgetStatus);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VnZ2VzdFdpZGdldFN0YXR1cy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3VnZ2VzdC9icm93c2VyL3N1Z2dlc3RXaWRnZXRTdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBYWhHLE1BQU0saUJBQWtCLFNBQVEsaURBQXVCO1FBRW5DLFdBQVc7WUFDN0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDVCxPQUFPLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM1QixDQUFDO1lBQ0QsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLElBQUEsY0FBUSxFQUFDLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0SyxDQUFDO1FBQ0YsQ0FBQztRQUVELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFzQjtZQUM3QyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELENBQUM7S0FDRDtJQUVNLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW1CO1FBUS9CLFlBQ0MsU0FB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