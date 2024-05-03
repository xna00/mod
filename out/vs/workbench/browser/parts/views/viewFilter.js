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
define(["require", "exports", "vs/base/common/async", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/contextkey/common/contextkey", "vs/base/common/codicons", "vs/platform/keybinding/common/keybinding", "vs/platform/history/browser/historyWidgetKeybindingHint", "vs/platform/actions/common/actions", "vs/platform/actions/browser/toolbar", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/platform/theme/browser/defaultStyles"], function (require, exports, async_1, DOM, contextView_1, lifecycle_1, colorRegistry_1, nls_1, instantiation_1, contextScopedHistoryWidget_1, contextkey_1, codicons_1, keybinding_1, historyWidgetKeybindingHint_1, actions_1, toolbar_1, menuEntryActionViewItem_1, widget_1, event_1, defaultStyles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FilterWidget = exports.viewFilterSubmenu = void 0;
    const viewFilterMenu = new actions_1.MenuId('menu.view.filter');
    exports.viewFilterSubmenu = new actions_1.MenuId('submenu.view.filter');
    actions_1.MenuRegistry.appendMenuItem(viewFilterMenu, {
        submenu: exports.viewFilterSubmenu,
        title: (0, nls_1.localize)('more filters', "More Filters..."),
        group: 'navigation',
        icon: codicons_1.Codicon.filter,
    });
    class MoreFiltersActionViewItem extends menuEntryActionViewItem_1.SubmenuEntryActionViewItem {
        constructor() {
            super(...arguments);
            this._checked = false;
        }
        set checked(checked) {
            if (this._checked !== checked) {
                this._checked = checked;
                this.updateChecked();
            }
        }
        updateChecked() {
            if (this.element) {
                this.element.classList.toggle('checked', this._checked);
            }
        }
        render(container) {
            super.render(container);
            this.updateChecked();
        }
    }
    let FilterWidget = class FilterWidget extends widget_1.Widget {
        get onDidFocus() { return this.focusTracker.onDidFocus; }
        get onDidBlur() { return this.focusTracker.onDidBlur; }
        constructor(options, instantiationService, contextViewService, contextKeyService, keybindingService) {
            super();
            this.options = options;
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.keybindingService = keybindingService;
            this._onDidChangeFilterText = this._register(new event_1.Emitter());
            this.onDidChangeFilterText = this._onDidChangeFilterText.event;
            this.isMoreFiltersChecked = false;
            this.delayedFilterUpdate = new async_1.Delayer(400);
            this._register((0, lifecycle_1.toDisposable)(() => this.delayedFilterUpdate.cancel()));
            if (options.focusContextKey) {
                this.focusContextKey = new contextkey_1.RawContextKey(options.focusContextKey, false).bindTo(contextKeyService);
            }
            this.element = DOM.$('.viewpane-filter');
            [this.filterInputBox, this.focusTracker] = this.createInput(this.element);
            this._register(this.filterInputBox);
            this._register(this.focusTracker);
            const controlsContainer = DOM.append(this.element, DOM.$('.viewpane-filter-controls'));
            this.filterBadge = this.createBadge(controlsContainer);
            this.toolbar = this._register(this.createToolBar(controlsContainer));
            this.adjustInputBox();
        }
        hasFocus() {
            return this.filterInputBox.hasFocus();
        }
        focus() {
            this.filterInputBox.focus();
        }
        blur() {
            this.filterInputBox.blur();
        }
        updateBadge(message) {
            this.filterBadge.classList.toggle('hidden', !message);
            this.filterBadge.textContent = message || '';
            this.adjustInputBox();
        }
        setFilterText(filterText) {
            this.filterInputBox.value = filterText;
        }
        getFilterText() {
            return this.filterInputBox.value;
        }
        getHistory() {
            return this.filterInputBox.getHistory();
        }
        layout(width) {
            this.element.parentElement?.classList.toggle('grow', width > 700);
            this.element.classList.toggle('small', width < 400);
            this.adjustInputBox();
        }
        checkMoreFilters(checked) {
            this.isMoreFiltersChecked = checked;
            if (this.moreFiltersActionViewItem) {
                this.moreFiltersActionViewItem.checked = checked;
            }
        }
        createInput(container) {
            const inputBox = this._register(this.instantiationService.createInstance(contextScopedHistoryWidget_1.ContextScopedHistoryInputBox, container, this.contextViewService, {
                placeholder: this.options.placeholder,
                ariaLabel: this.options.ariaLabel,
                history: this.options.history || [],
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this.keybindingService),
                inputBoxStyles: defaultStyles_1.defaultInputBoxStyles
            }));
            if (this.options.text) {
                inputBox.value = this.options.text;
            }
            this._register(inputBox.onDidChange(filter => this.delayedFilterUpdate.trigger(() => this.onDidInputChange(inputBox))));
            this._register(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => this.onInputKeyDown(e, inputBox)));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_DOWN, this.handleKeyboardEvent));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_UP, this.handleKeyboardEvent));
            this._register(DOM.addStandardDisposableListener(inputBox.inputElement, DOM.EventType.CLICK, (e) => {
                e.stopPropagation();
                e.preventDefault();
            }));
            const focusTracker = this._register(DOM.trackFocus(inputBox.inputElement));
            if (this.focusContextKey) {
                this._register(focusTracker.onDidFocus(() => this.focusContextKey.set(true)));
                this._register(focusTracker.onDidBlur(() => this.focusContextKey.set(false)));
                this._register((0, lifecycle_1.toDisposable)(() => this.focusContextKey.reset()));
            }
            return [inputBox, focusTracker];
        }
        createBadge(container) {
            const filterBadge = DOM.append(container, DOM.$('.viewpane-filter-badge.hidden'));
            filterBadge.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeBackground);
            filterBadge.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.badgeForeground);
            filterBadge.style.border = `1px solid ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.contrastBorder)}`;
            return filterBadge;
        }
        createToolBar(container) {
            return this.instantiationService.createInstance(toolbar_1.MenuWorkbenchToolBar, container, viewFilterMenu, {
                hiddenItemStrategy: -1 /* HiddenItemStrategy.NoHide */,
                actionViewItemProvider: (action, options) => {
                    if (action instanceof actions_1.SubmenuItemAction && action.item.submenu.id === exports.viewFilterSubmenu.id) {
                        this.moreFiltersActionViewItem = this.instantiationService.createInstance(MoreFiltersActionViewItem, action, options);
                        this.moreFiltersActionViewItem.checked = this.isMoreFiltersChecked;
                        return this.moreFiltersActionViewItem;
                    }
                    return undefined;
                }
            });
        }
        onDidInputChange(inputbox) {
            inputbox.addToHistory();
            this._onDidChangeFilterText.fire(inputbox.value);
        }
        adjustInputBox() {
            this.filterInputBox.inputElement.style.paddingRight = this.element.classList.contains('small') || this.filterBadge.classList.contains('hidden') ? '25px' : '150px';
        }
        // Action toolbar is swallowing some keys for action items which should not be for an input box
        handleKeyboardEvent(event) {
            if (event.equals(10 /* KeyCode.Space */)
                || event.equals(15 /* KeyCode.LeftArrow */)
                || event.equals(17 /* KeyCode.RightArrow */)) {
                event.stopPropagation();
            }
        }
        onInputKeyDown(event, filterInputBox) {
            let handled = false;
            if (event.equals(2 /* KeyCode.Tab */) && !this.toolbar.isEmpty()) {
                this.toolbar.focus();
                handled = true;
            }
            if (handled) {
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };
    exports.FilterWidget = FilterWidget;
    exports.FilterWidget = FilterWidget = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService)
    ], FilterWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0ZpbHRlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvd29ya2JlbmNoL2Jyb3dzZXIvcGFydHMvdmlld3Mvdmlld0ZpbHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUEwQmhHLE1BQU0sY0FBYyxHQUFHLElBQUksZ0JBQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3pDLFFBQUEsaUJBQWlCLEdBQUcsSUFBSSxnQkFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDbkUsc0JBQVksQ0FBQyxjQUFjLENBQUMsY0FBYyxFQUFFO1FBQzNDLE9BQU8sRUFBRSx5QkFBaUI7UUFDMUIsS0FBSyxFQUFFLElBQUEsY0FBUSxFQUFDLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQztRQUNsRCxLQUFLLEVBQUUsWUFBWTtRQUNuQixJQUFJLEVBQUUsa0JBQU8sQ0FBQyxNQUFNO0tBQ3BCLENBQUMsQ0FBQztJQUVILE1BQU0seUJBQTBCLFNBQVEsb0RBQTBCO1FBQWxFOztZQUVTLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFtQm5DLENBQUM7UUFsQkEsSUFBSSxPQUFPLENBQUMsT0FBZ0I7WUFDM0IsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDO2dCQUMvQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztnQkFDeEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3RCLENBQUM7UUFDRixDQUFDO1FBRWtCLGFBQWE7WUFDL0IsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pELENBQUM7UUFDRixDQUFDO1FB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