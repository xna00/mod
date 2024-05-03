/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdown", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./dropdown"], function (require, exports, nls, dom_1, keyboardEvent_1, actionViewItems_1, dropdown_1, actions_1, codicons_1, themables_1, event_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionWithDropdownActionViewItem = exports.DropdownMenuActionViewItem = void 0;
    class DropdownMenuActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(action, menuActionsOrProvider, contextMenuProvider, options = Object.create(null)) {
            super(null, action, options);
            this.actionItem = null;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.menuActionsOrProvider = menuActionsOrProvider;
            this.contextMenuProvider = contextMenuProvider;
            this.options = options;
            if (this.options.actionRunner) {
                this.actionRunner = this.options.actionRunner;
            }
        }
        render(container) {
            this.actionItem = container;
            const labelRenderer = (el) => {
                this.element = (0, dom_1.append)(el, (0, dom_1.$)('a.action-label'));
                let classNames = [];
                if (typeof this.options.classNames === 'string') {
                    classNames = this.options.classNames.split(/\s+/g).filter(s => !!s);
                }
                else if (this.options.classNames) {
                    classNames = this.options.classNames;
                }
                // todo@aeschli: remove codicon, should come through `this.options.classNames`
                if (!classNames.find(c => c === 'icon')) {
                    classNames.push('codicon');
                }
                this.element.classList.add(...classNames);
                this.element.setAttribute('role', 'button');
                this.element.setAttribute('aria-haspopup', 'true');
                this.element.setAttribute('aria-expanded', 'false');
                if (this._action.label) {
                    this._register((0, updatableHoverWidget_1.setupCustomHover)(this.options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.element, this._action.label));
                }
                this.element.ariaLabel = this._action.label || '';
                return null;
            };
            const isActionsArray = Array.isArray(this.menuActionsOrProvider);
            const options = {
                contextMenuProvider: this.contextMenuProvider,
                labelRenderer: labelRenderer,
                menuAsChild: this.options.menuAsChild,
                actions: isActionsArray ? this.menuActionsOrProvider : undefined,
                actionProvider: isActionsArray ? undefined : this.menuActionsOrProvider,
                skipTelemetry: this.options.skipTelemetry
            };
            this.dropdownMenu = this._register(new dropdown_1.DropdownMenu(container, options));
            this._register(this.dropdownMenu.onDidChangeVisibility(visible => {
                this.element?.setAttribute('aria-expanded', `${visible}`);
                this._onDidChangeVisibility.fire(visible);
            }));
            this.dropdownMenu.menuOptions = {
                actionViewItemProvider: this.options.actionViewItemProvider,
                actionRunner: this.actionRunner,
                getKeyBinding: this.options.keybindingProvider,
                context: this._context
            };
            if (this.options.anchorAlignmentProvider) {
                const that = this;
                this.dropdownMenu.menuOptions = {
                    ...this.dropdownMenu.menuOptions,
                    get anchorAlignment() {
                        return that.options.anchorAlignmentProvider();
                    }
                };
            }
            this.updateTooltip();
            this.updateEnabled();
        }
        getTooltip() {
            let title = null;
            if (this.action.tooltip) {
                title = this.action.tooltip;
            }
            else if (this.action.label) {
                title = this.action.label;
            }
            return title ?? undefined;
        }
        setActionContext(newContext) {
            super.setActionContext(newContext);
            if (this.dropdownMenu) {
                if (this.dropdownMenu.menuOptions) {
                    this.dropdownMenu.menuOptions.context = newContext;
                }
                else {
                    this.dropdownMenu.menuOptions = { context: newContext };
                }
            }
        }
        show() {
            this.dropdownMenu?.show();
        }
        updateEnabled() {
            const disabled = !this.action.enabled;
            this.actionItem?.classList.toggle('disabled', disabled);
            this.element?.classList.toggle('disabled', disabled);
        }
    }
    exports.DropdownMenuActionViewItem = DropdownMenuActionViewItem;
    class ActionWithDropdownActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(context, action, options, contextMenuProvider) {
            super(context, action, options);
            this.contextMenuProvider = contextMenuProvider;
        }
        render(container) {
            super.render(container);
            if (this.element) {
                this.element.classList.add('action-dropdown-item');
                const menuActionsProvider = {
                    getActions: () => {
                        const actionsProvider = this.options.menuActionsOrProvider;
                        return Array.isArray(actionsProvider) ? actionsProvider : actionsProvider.getActions(); // TODO: microsoft/TypeScript#42768
                    }
                };
                const menuActionClassNames = this.options.menuActionClassNames || [];
                const separator = (0, dom_1.h)('div.action-dropdown-item-separator', [(0, dom_1.h)('div', {})]).root;
                separator.classList.toggle('prominent', menuActionClassNames.includes('prominent'));
                (0, dom_1.append)(this.element, separator);
                this.dropdownMenuActionViewItem = this._register(new DropdownMenuActionViewItem(this._register(new actions_1.Action('dropdownAction', nls.localize('moreActions', "More Actions..."))), menuActionsProvider, this.contextMenuProvider, { classNames: ['dropdown', ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dropDownButton), ...menuActionClassNames], hoverDelegate: this.options.hoverDelegate }));
                this.dropdownMenuActionViewItem.render(this.element);
                this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.KEY_DOWN, e => {
                    // If we don't have any actions then the dropdown is hidden so don't try to focus it #164050
                    if (menuActionsProvider.getActions().length === 0) {
                        return;
                    }
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    let handled = false;
                    if (this.dropdownMenuActionViewItem?.isFocused() && event.equals(15 /* KeyCode.LeftArrow */)) {
                        handled = true;
                        this.dropdownMenuActionViewItem?.blur();
                        this.focus();
                    }
                    else if (this.isFocused() && event.equals(17 /* KeyCode.RightArrow */)) {
                        handled = true;
                        this.blur();
                        this.dropdownMenuActionViewItem?.focus();
                    }
                    if (handled) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }));
            }
        }
        blur() {
            super.blur();
            this.dropdownMenuActionViewItem?.blur();
        }
        setFocusable(focusable) {
            super.setFocusable(focusable);
            this.dropdownMenuActionViewItem?.setFocusable(focusable);
        }
    }
    exports.ActionWithDropdownActionViewItem = ActionWithDropdownActionViewItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJvcGRvd25BY3Rpb25WaWV3SXRlbS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL2Ryb3Bkb3duL2Ryb3Bkb3duQWN0aW9uVmlld0l0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBdUNoRyxNQUFhLDBCQUEyQixTQUFRLG9DQUFrQjtRQVdqRSxZQUNDLE1BQWUsRUFDZixxQkFBMkQsRUFDM0QsbUJBQXlDLEVBQ3pDLFVBQThDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBRWpFLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBYnRCLGVBQVUsR0FBdUIsSUFBSSxDQUFDO1lBRXRDLDJCQUFzQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVcsQ0FBQyxDQUFDO1lBQy9ELDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFZbEUsSUFBSSxDQUFDLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDO1lBQ25ELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxtQkFBbUIsQ0FBQztZQUMvQyxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUV2QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7WUFDL0MsQ0FBQztRQUNGLENBQUM7UUFFUSxNQUFNLENBQUMsU0FBc0I7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7WUFFNUIsTUFBTSxhQUFhLEdBQW1CLENBQUMsRUFBZSxFQUFzQixFQUFFO2dCQUM3RSxJQUFJLENBQUMsT0FBTyxHQUFH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