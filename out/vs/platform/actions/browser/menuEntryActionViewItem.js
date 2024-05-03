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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/keybindingLabels", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/action/common/action", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/base/common/themables", "vs/platform/theme/common/theme", "vs/base/common/types", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/browser/defaultStyles", "vs/platform/accessibility/common/accessibility", "vs/css!./menuEntryActionViewItem"], function (require, exports, dom_1, keyboardEvent_1, actionViewItems_1, dropdownActionViewItem_1, actions_1, keybindingLabels_1, lifecycle_1, platform_1, nls_1, actions_2, action_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, storage_1, themeService_1, themables_1, theme_1, types_1, colorRegistry_1, defaultStyles_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropdownWithDefaultActionViewItem = exports.SubmenuEntryActionViewItem = exports.MenuEntryActionViewItem = void 0;
    exports.createAndFillInContextMenuActions = createAndFillInContextMenuActions;
    exports.createAndFillInActionBarActions = createAndFillInActionBarActions;
    exports.createActionViewItem = createActionViewItem;
    function createAndFillInContextMenuActions(menu, options, target, primaryGroup) {
        const groups = menu.getActions(options);
        const modifierKeyEmitter = dom_1.ModifierKeyEmitter.getInstance();
        const useAlternativeActions = modifierKeyEmitter.keyStatus.altKey || ((platform_1.isWindows || platform_1.isLinux) && modifierKeyEmitter.keyStatus.shiftKey);
        fillInActions(groups, target, useAlternativeActions, primaryGroup ? actionGroup => actionGroup === primaryGroup : actionGroup => actionGroup === 'navigation');
    }
    function createAndFillInActionBarActions(menu, options, target, primaryGroup, shouldInlineSubmenu, useSeparatorsInPrimaryActions) {
        const groups = menu.getActions(options);
        const isPrimaryAction = typeof primaryGroup === 'string' ? (actionGroup) => actionGroup === primaryGroup : primaryGroup;
        // Action bars handle alternative actions on their own so the alternative actions should be ignored
        fillInActions(groups, target, false, isPrimaryAction, shouldInlineSubmenu, useSeparatorsInPrimaryActions);
    }
    function fillInActions(groups, target, useAlternativeActions, isPrimaryAction = actionGroup => actionGroup === 'navigation', shouldInlineSubmenu = () => false, useSeparatorsInPrimaryActions = false) {
        let primaryBucket;
        let secondaryBucket;
        if (Array.isArray(target)) {
            primaryBucket = target;
            secondaryBucket = target;
        }
        else {
            primaryBucket = target.primary;
            secondaryBucket = target.secondary;
        }
        const submenuInfo = new Set();
        for (const [group, actions] of groups) {
            let target;
            if (isPrimaryAction(group)) {
                target = primaryBucket;
                if (target.length > 0 && useSeparatorsInPrimaryActions) {
                    target.push(new actions_1.Separator());
                }
            }
            else {
                target = secondaryBucket;
                if (target.length > 0) {
                    target.push(new actions_1.Separator());
                }
            }
            for (let action of actions) {
                if (useAlternativeActions) {
                    action = action instanceof actions_2.MenuItemAction && action.alt ? action.alt : action;
                }
                const newLen = target.push(action);
                // keep submenu info for later inlining
                if (action instanceof actions_1.SubmenuAction) {
                    submenuInfo.add({ group, action, index: newLen - 1 });
                }
            }
        }
        // ask the outside if submenu should be inlined or not. only ask when
        // there would be enough space
        for (const { group, action, index } of submenuInfo) {
            const target = isPrimaryAction(group) ? primaryBucket : secondaryBucket;
            // inlining submenus with length 0 or 1 is easy,
            // larger submenus need to be checked with the overall limit
            const submenuActions = action.actions;
            if (shouldInlineSubmenu(action, group, target.length)) {
                target.splice(index, 1, ...submenuActions);
            }
        }
    }
    let MenuEntryActionViewItem = class MenuEntryActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(action, options, _keybindingService, _notificationService, _contextKeyService, _themeService, _contextMenuService, _accessibilityService) {
            super(undefined, action, { icon: !!(action.class || action.item.icon), label: !action.class && !action.item.icon, draggable: options?.draggable, keybinding: options?.keybinding, hoverDelegate: options?.hoverDelegate });
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._contextKeyService = _contextKeyService;
            this._themeService = _themeService;
            this._contextMenuService = _contextMenuService;
            this._accessibilityService = _accessibilityService;
            this._wantsAltCommand = false;
            this._itemClassDispose = this._register(new lifecycle_1.MutableDisposable());
            this._altKey = dom_1.ModifierKeyEmitter.getInstance();
        }
        get _menuItemAction() {
            return this._action;
        }
        get _commandAction() {
            return this._wantsAltCommand && this._menuItemAction.alt || this._menuItemAction;
        }
        async onClick(event) {
            event.preventDefault();
            event.stopPropagation();
            try {
                await this.actionRunner.run(this._commandAction, this._context);
            }
            catch (err) {
                this._notificationService.error(err);
            }
        }
        render(container) {
            super.render(container);
            container.classList.add('menu-entry');
            if (this.options.icon) {
                this._updateItemClass(this._menuItemAction.item);
            }
            if (this._menuItemAction.alt) {
                let isMouseOver = false;
                const updateAltState = () => {
                    const wantsAltCommand = !!this._menuItemAction.alt?.enabled &&
                        (!this._accessibilityService.isMotionReduced() || isMouseOver) && (this._altKey.keyStatus.altKey ||
                        (this._altKey.keyStatus.shiftKey && isMouseOver));
                    if (wantsAltCommand !== this._wantsAltCommand) {
                        this._wantsAltCommand = wantsAltCommand;
                        this.updateLabel();
                        this.updateTooltip();
                        this.updateClass();
                    }
                };
                this._register(this._altKey.event(updateAltState));
                this._register((0, dom_1.addDisposableListener)(container, 'mouseleave', _ => {
                    isMouseOver = false;
                    updateAltState();
                }));
                this._register((0, dom_1.addDisposableListener)(container, 'mouseenter', _ => {
                    isMouseOver = true;
                    updateAltState();
                }));
                updateAltState();
            }
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.textContent = this._commandAction.label;
            }
        }
        getTooltip() {
            const keybinding = this._keybindingService.lookupKeybinding(this._commandAction.id, this._contextKeyService);
            const keybindingLabel = keybinding && keybinding.getLabel();
            const tooltip = this._commandAction.tooltip || this._commandAction.label;
            let title = keybindingLabel
                ? (0, nls_1.localize)('titleAndKb', "{0} ({1})", tooltip, keybindingLabel)
                : tooltip;
            if (!this._wantsAltCommand && this._menuItemAction.alt?.enabled) {
                const altTooltip = this._menuItemAction.alt.tooltip || this._menuItemAction.alt.label;
                const altKeybinding = this._keybindingService.lookupKeybinding(this._menuItemAction.alt.id, this._contextKeyService);
                const altKeybindingLabel = altKeybinding && altKeybinding.getLabel();
                const altTitleSection = altKeybindingLabel
                    ? (0, nls_1.localize)('titleAndKb', "{0} ({1})", altTooltip, altKeybindingLabel)
                    : altTooltip;
                title = (0, nls_1.localize)('titleAndKbAndAlt', "{0}\n[{1}] {2}", title, keybindingLabels_1.UILabelProvider.modifierLabels[platform_1.OS].altKey, altTitleSection);
            }
            return title;
        }
        updateClass() {
            if (this.options.icon) {
                if (this._commandAction !== this._menuItemAction) {
                    if (this._menuItemAction.alt) {
                        this._updateItemClass(this._menuItemAction.alt.item);
                    }
                }
                else {
                    this._updateItemClass(this._menuItemAction.item);
                }
            }
        }
        _updateItemClass(item) {
            this._itemClassDispose.value = undefined;
            const { element, label } = this;
            if (!element || !label) {
                return;
            }
            const icon = this._commandAction.checked && (0, action_1.isICommandActionToggleInfo)(item.toggled) && item.toggled.icon ? item.toggled.icon : item.icon;
            if (!icon) {
                return;
            }
            if (themables_1.ThemeIcon.isThemeIcon(icon)) {
                // theme icons
                const iconClasses = themables_1.ThemeIcon.asClassNameArray(icon);
                label.classList.add(...iconClasses);
                this._itemClassDispose.value = (0, lifecycle_1.toDisposable)(() => {
                    label.classList.remove(...iconClasses);
                });
            }
            else {
                // icon path/url
                label.style.backgroundImage = ((0, theme_1.isDark)(this._themeService.getColorTheme().type)
                    ? (0, dom_1.asCSSUrl)(icon.dark)
                    : (0, dom_1.asCSSUrl)(icon.light));
                label.classList.add('icon');
                this._itemClassDispose.value = (0, lifecycle_1.combinedDisposable)((0, lifecycle_1.toDisposable)(() => {
                    label.style.backgroundImage = '';
                    label.classList.remove('icon');
                }), this._themeService.onDidColorThemeChange(() => {
                    // refresh when the theme changes in case we go between dark <-> light
                    this.updateClass();
                }));
            }
        }
    };
    exports.MenuEntryActionViewItem = MenuEntryActionViewItem;
    exports.MenuEntryActionViewItem = MenuEntryActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, themeService_1.IThemeService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, accessibility_1.IAccessibilityService)
    ], MenuEntryActionViewItem);
    let SubmenuEntryActionViewItem = class SubmenuEntryActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, options, _keybindingService, _contextMenuService, _themeService) {
            const dropdownOptions = {
                ...options,
                menuAsChild: options?.menuAsChild ?? false,
                classNames: options?.classNames ?? (themables_1.ThemeIcon.isThemeIcon(action.item.icon) ? themables_1.ThemeIcon.asClassName(action.item.icon) : undefined),
                keybindingProvider: options?.keybindingProvider ?? (action => _keybindingService.lookupKeybinding(action.id))
            };
            super(action, { getActions: () => action.actions }, _contextMenuService, dropdownOptions);
            this._keybindingService = _keybindingService;
            this._contextMenuService = _contextMenuService;
            this._themeService = _themeService;
        }
        render(container) {
            super.render(container);
            (0, types_1.assertType)(this.element);
            container.classList.add('menu-entry');
            const action = this._action;
            const { icon } = action.item;
            if (icon && !themables_1.ThemeIcon.isThemeIcon(icon)) {
                this.element.classList.add('icon');
                const setBackgroundImage = () => {
                    if (this.element) {
                        this.element.style.backgroundImage = ((0, theme_1.isDark)(this._themeService.getColorTheme().type)
                            ? (0, dom_1.asCSSUrl)(icon.dark)
                            : (0, dom_1.asCSSUrl)(icon.light));
                    }
                };
                setBackgroundImage();
                this._register(this._themeService.onDidColorThemeChange(() => {
                    // refresh when the theme changes in case we go between dark <-> light
                    setBackgroundImage();
                }));
            }
        }
    };
    exports.SubmenuEntryActionViewItem = SubmenuEntryActionViewItem;
    exports.SubmenuEntryActionViewItem = SubmenuEntryActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, themeService_1.IThemeService)
    ], SubmenuEntryActionViewItem);
    let DropdownWithDefaultActionViewItem = class DropdownWithDefaultActionViewItem extends actionViewItems_1.BaseActionViewItem {
        get onDidChangeDropdownVisibility() {
            return this._dropdown.onDidChangeVisibility;
        }
        constructor(submenuAction, options, _keybindingService, _notificationService, _contextMenuService, _menuService, _instaService, _storageService) {
            super(null, submenuAction);
            this._keybindingService = _keybindingService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._menuService = _menuService;
            this._instaService = _instaService;
            this._storageService = _storageService;
            this._container = null;
            this._options = options;
            this._storageKey = `${submenuAction.item.submenu.id}_lastActionId`;
            // determine default action
            let defaultAction;
            const defaultActionId = options?.persistLastActionId ? _storageService.get(this._storageKey, 1 /* StorageScope.WORKSPACE */) : undefined;
            if (defaultActionId) {
                defaultAction = submenuAction.actions.find(a => defaultActionId === a.id);
            }
            if (!defaultAction) {
                defaultAction = submenuAction.actions[0];
            }
            this._defaultAction = this._instaService.createInstance(MenuEntryActionViewItem, defaultAction, { keybinding: this._getDefaultActionKeybindingLabel(defaultAction) });
            const dropdownOptions = {
                keybindingProvider: action => this._keybindingService.lookupKeybinding(action.id),
                ...options,
                menuAsChild: options?.menuAsChild ?? true,
                classNames: options?.classNames ?? ['codicon', 'codicon-chevron-down'],
                actionRunner: options?.actionRunner ?? new actions_1.ActionRunner(),
            };
            this._dropdown = new dropdownActionViewItem_1.DropdownMenuActionViewItem(submenuAction, submenuAction.actions, this._contextMenuService, dropdownOptions);
            this._register(this._dropdown.actionRunner.onDidRun((e) => {
                if (e.action instanceof actions_2.MenuItemAction) {
                    this.update(e.action);
                }
            }));
        }
        update(lastAction) {
            if (this._options?.persistLastActionId) {
                this._storageService.store(this._storageKey, lastAction.id, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            this._defaultAction.dispose();
            this._defaultAction = this._instaService.createInstance(MenuEntryActionViewItem, lastAction, { keybinding: this._getDefaultActionKeybindingLabel(lastAction) });
            this._defaultAction.actionRunner = new class extends actions_1.ActionRunner {
                async runAction(action, context) {
                    await action.run(undefined);
                }
            }();
            if (this._container) {
                this._defaultAction.render((0, dom_1.prepend)(this._container, (0, dom_1.$)('.action-container')));
            }
        }
        _getDefaultActionKeybindingLabel(defaultAction) {
            let defaultActionKeybinding;
            if (this._options?.renderKeybindingWithDefaultActionLabel) {
                const kb = this._keybindingService.lookupKeybinding(defaultAction.id);
                if (kb) {
                    defaultActionKeybinding = `(${kb.getLabel()})`;
                }
            }
            return defaultActionKeybinding;
        }
        setActionContext(newContext) {
            super.setActionContext(newContext);
            this._defaultAction.setActionContext(newContext);
            this._dropdown.setActionContext(newContext);
        }
        render(container) {
            this._container = container;
            super.render(this._container);
            this._container.classList.add('monaco-dropdown-with-default');
            const primaryContainer = (0, dom_1.$)('.action-container');
            this._defaultAction.render((0, dom_1.append)(this._container, primaryContainer));
            this._register((0, dom_1.addDisposableListener)(primaryContainer, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(17 /* KeyCode.RightArrow */)) {
                    this._defaultAction.element.tabIndex = -1;
                    this._dropdown.focus();
                    event.stopPropagation();
                }
            }));
            const dropdownContainer = (0, dom_1.$)('.dropdown-action-container');
            this._dropdown.render((0, dom_1.append)(this._container, dropdownContainer));
            this._register((0, dom_1.addDisposableListener)(dropdownContainer, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(15 /* KeyCode.LeftArrow */)) {
                    this._defaultAction.element.tabIndex = 0;
                    this._dropdown.setFocusable(false);
                    this._defaultAction.element?.focus();
                    event.stopPropagation();
                }
            }));
        }
        focus(fromRight) {
            if (fromRight) {
                this._dropdown.focus();
            }
            else {
                this._defaultAction.element.tabIndex = 0;
                this._defaultAction.element.focus();
            }
        }
        blur() {
            this._defaultAction.element.tabIndex = -1;
            this._dropdown.blur();
            this._container.blur();
        }
        setFocusable(focusable) {
            if (focusable) {
                this._defaultAction.element.tabIndex = 0;
            }
            else {
                this._defaultAction.element.tabIndex = -1;
                this._dropdown.setFocusable(false);
            }
        }
        dispose() {
            this._defaultAction.dispose();
            this._dropdown.dispose();
            super.dispose();
        }
    };
    exports.DropdownWithDefaultActionViewItem = DropdownWithDefaultActionViewItem;
    exports.DropdownWithDefaultActionViewItem = DropdownWithDefaultActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, actions_2.IMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, storage_1.IStorageService)
    ], DropdownWithDefaultActionViewItem);
    let SubmenuEntrySelectActionViewItem = class SubmenuEntrySelectActionViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, contextViewService) {
            super(null, action, action.actions.map(a => ({
                text: a.id === actions_1.Separator.ID ? '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500' : a.label,
                isDisabled: !a.enabled,
            })), 0, contextViewService, defaultStyles_1.defaultSelectBoxStyles, { ariaLabel: action.tooltip, optionsAsChildren: true });
            this.select(Math.max(0, action.actions.findIndex(a => a.checked)));
        }
        render(container) {
            super.render(container);
            container.style.borderColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.selectBorder);
        }
        runAction(option, index) {
            const action = this.action.actions[index];
            if (action) {
                this.actionRunner.run(action);
            }
        }
    };
    SubmenuEntrySelectActionViewItem = __decorate([
        __param(1, contextView_1.IContextViewService)
    ], SubmenuEntrySelectActionViewItem);
    /**
     * Creates action view items for menu actions or submenu actions.
     */
    function createActionViewItem(instaService, action, options) {
        if (action instanceof actions_2.MenuItemAction) {
            return instaService.createInstance(MenuEntryActionViewItem, action, options);
        }
        else if (action instanceof actions_2.SubmenuItemAction) {
            if (action.item.isSelection) {
                return instaService.createInstance(SubmenuEntrySelectActionViewItem, action);
            }
            else {
                if (action.item.rememberDefaultAction) {
                    return instaService.createInstance(DropdownWithDefaultActionViewItem, action, { ...options, persistLastActionId: true });
                }
                else {
                    return instaService.createInstance(SubmenuEntryActionViewItem, action, options);
                }
            }
        }
        else {
            return undefined;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudUVudHJ5QWN0aW9uVmlld0l0ZW0uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3BsYXRmb3JtL2FjdGlvbnMvYnJvd3Nlci9tZW51RW50cnlBY3Rpb25WaWV3SXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUErQmhHLDhFQUtDO0lBRUQsMEVBYUM7SUErY0Qsb0RBZ0JDO0lBbmZELFNBQWdCLGlDQUFpQyxDQUFDLElBQVcsRUFBRSxPQUF1QyxFQUFFLE1BQWdFLEVBQUUsWUFBcUI7UUFDOUwsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QyxNQUFNLGtCQUFrQixHQUFHLHdCQUFrQixDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzVELE1BQU0scUJBQXFCLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsb0JBQVMsSUFBSSxrQkFBTyxDQUFDLElBQUksa0JBQWtCLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLHFCQUFxQixFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEtBQUssWUFBWSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsS0FBSyxZQUFZLENBQUMsQ0FBQztJQUNoSyxDQUFDO0lBRUQsU0FBZ0IsK0JBQStCLENBQzlDLElBQVcsRUFDWCxPQUF1QyxFQUN2QyxNQUFnRSxFQUNoRSxZQUEwRCxFQUMxRCxtQkFBMEYsRUFDMUYsNkJBQXVDO1FBRXZDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMs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