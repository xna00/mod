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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/types", "vs/base/browser/touch", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/themables", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService"], function (require, exports, DOM, types, touch_1, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1, themables_1, menuEntryActionViewItem_1, actions_1, contextView_1, keybinding_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnifiedSubmenuActionView = exports.ActionViewWithLabel = exports.CodiconActionViewItem = void 0;
    class CodiconActionViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        updateLabel() {
            if (this.options.label && this.label) {
                DOM.reset(this.label, ...(0, iconLabels_1.renderLabelWithIcons)(this._commandAction.label ?? ''));
            }
        }
    }
    exports.CodiconActionViewItem = CodiconActionViewItem;
    class ActionViewWithLabel extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        render(container) {
            super.render(container);
            container.classList.add('notebook-action-view-item');
            this._actionLabel = document.createElement('a');
            container.appendChild(this._actionLabel);
            this.updateLabel();
        }
        updateLabel() {
            if (this._actionLabel) {
                this._actionLabel.classList.add('notebook-label');
                this._actionLabel.innerText = this._action.label;
            }
        }
    }
    exports.ActionViewWithLabel = ActionViewWithLabel;
    let UnifiedSubmenuActionView = class UnifiedSubmenuActionView extends menuEntryActionViewItem_1.SubmenuEntryActionViewItem {
        constructor(action, options, renderLabel, subActionProvider, subActionViewItemProvider, _keybindingService, _contextMenuService, _themeService) {
            super(action, { ...options, hoverDelegate: options?.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element') }, _keybindingService, _contextMenuService, _themeService);
            this.renderLabel = renderLabel;
            this.subActionProvider = subActionProvider;
            this.subActionViewItemProvider = subActionViewItemProvider;
        }
        render(container) {
            super.render(container);
            container.classList.add('notebook-action-view-item');
            container.classList.add('notebook-action-view-item-unified');
            this._actionLabel = document.createElement('a');
            container.appendChild(this._actionLabel);
            this._hover = this._register((0, updatableHoverWidget_1.setupCustomHover)(this.options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'), this._actionLabel, ''));
            this.updateLabel();
            for (const event of [DOM.EventType.CLICK, DOM.EventType.MOUSE_DOWN, touch_1.EventType.Tap]) {
                this._register(DOM.addDisposableListener(container, event, e => this.onClick(e, true)));
            }
        }
        onClick(event, preserveFocus = false) {
            DOM.EventHelper.stop(event, true);
            const context = types.isUndefinedOrNull(this._context) ? this.options?.useEventAsContext ? event : { preserveFocus } : this._context;
            this.actionRunner.run(this._primaryAction ?? this._action, context);
        }
        updateLabel() {
            const actions = this.subActionProvider.getActions();
            if (this._actionLabel) {
                const primaryAction = actions[0];
                this._primaryAction = primaryAction;
                if (primaryAction && primaryAction instanceof actions_1.MenuItemAction) {
                    const element = this.element;
                    if (element && primaryAction.item.icon && themables_1.ThemeIcon.isThemeIcon(primaryAction.item.icon)) {
                        const iconClasses = themables_1.ThemeIcon.asClassNameArray(primaryAction.item.icon);
                        // remove all classes started with 'codicon-'
                        element.classList.forEach((cl) => {
                            if (cl.startsWith('codicon-')) {
                                element.classList.remove(cl);
                            }
                        });
                        element.classList.add(...iconClasses);
                    }
                    if (this.renderLabel) {
                        this._actionLabel.classList.add('notebook-label');
                        this._actionLabel.innerText = this._action.label;
                        this._hover?.update(primaryAction.tooltip.length ? primaryAction.tooltip : primaryAction.label);
                    }
                }
                else {
                    if (this.renderLabel) {
                        this._actionLabel.classList.add('notebook-label');
                        this._actionLabel.innerText = this._action.label;
                        this._hover?.update(this._action.tooltip.length ? this._action.tooltip : this._action.label);
                    }
                }
            }
        }
    };
    exports.UnifiedSubmenuActionView = UnifiedSubmenuActionView;
    exports.UnifiedSubmenuActionView = UnifiedSubmenuActionView = __decorate([
        __param(5, keybinding_1.IKeybindingService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, themeService_1.IThemeService)
    ], UnifiedSubmenuActionView);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2VsbEFjdGlvblZpZXcuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL25vdGVib29rL2Jyb3dzZXIvdmlldy9jZWxsUGFydHMvY2VsbEFjdGlvblZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0JoRyxNQUFhLHFCQUFzQixTQUFRLGlEQUF1QjtRQUU5QyxXQUFXO1lBQzdCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUN0QyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFBLGlDQUFvQixFQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDakYsQ0FBQztRQUNGLENBQUM7S0FDRDtJQVBELHNEQU9DO0lBRUQsTUFBYSxtQkFBb0IsU0FBUSxpREFBdUI7UUFHdEQsTUFBTSxDQUFDLFNBQXNCO1lBQ3JDLEtBQUssQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDeEIsU0FBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUNyRCxJQUFJLENBQUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDaEQsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3BCLENBQUM7UUFFa0IsV0FBVztZQUM3QixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDdkIsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsR0FBRyxD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