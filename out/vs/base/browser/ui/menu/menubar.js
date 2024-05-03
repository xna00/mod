/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/touch", "vs/base/browser/ui/menu/menu", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/base/browser/window", "vs/css!./menubar"], function (require, exports, browser, DOM, keyboardEvent_1, mouseEvent_1, touch_1, menu_1, actions_1, arrays_1, async_1, codicons_1, themables_1, event_1, keyCodes_1, lifecycle_1, platform_1, strings, nls, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuBar = void 0;
    const $ = DOM.$;
    var MenubarState;
    (function (MenubarState) {
        MenubarState[MenubarState["HIDDEN"] = 0] = "HIDDEN";
        MenubarState[MenubarState["VISIBLE"] = 1] = "VISIBLE";
        MenubarState[MenubarState["FOCUSED"] = 2] = "FOCUSED";
        MenubarState[MenubarState["OPEN"] = 3] = "OPEN";
    })(MenubarState || (MenubarState = {}));
    class MenuBar extends lifecycle_1.Disposable {
        static { this.OVERFLOW_INDEX = -1; }
        constructor(container, options, menuStyle) {
            super();
            this.container = container;
            this.options = options;
            this.menuStyle = menuStyle;
            // Input-related
            this._mnemonicsInUse = false;
            this.openedViaKeyboard = false;
            this.awaitingAltRelease = false;
            this.ignoreNextMouseUp = false;
            this.updatePending = false;
            this.numMenusShown = 0;
            this.overflowLayoutScheduled = undefined;
            this.menuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.container.setAttribute('role', 'menubar');
            if (this.isCompact) {
                this.container.classList.add('compact');
            }
            this.menus = [];
            this.mnemonics = new Map();
            this._focusState = MenubarState.VISIBLE;
            this._onVisibilityChange = this._register(new event_1.Emitter());
            this._onFocusStateChange = this._register(new event_1.Emitter());
            this.createOverflowMenu();
            this.menuUpdater = this._register(new async_1.RunOnceScheduler(() => this.update(), 200));
            this.actionRunner = this.options.actionRunner ?? this._register(new actions_1.ActionRunner());
            this._register(this.actionRunner.onWillRun(() => {
                this.setUnfocusedState();
            }));
            this._register(DOM.ModifierKeyEmitter.getInstance().event(this.onModifierKeyToggled, this));
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let eventHandled = true;
                const key = !!e.key ? e.key.toLocaleLowerCase() : '';
                const tabNav = platform_1.isMacintosh && !this.isCompact;
                if (event.equals(15 /* KeyCode.LeftArrow */) || (tabNav && event.equals(2 /* KeyCode.Tab */ | 1024 /* KeyMod.Shift */))) {
                    this.focusPrevious();
                }
                else if (event.equals(17 /* KeyCode.RightArrow */) || (tabNav && event.equals(2 /* KeyCode.Tab */))) {
                    this.focusNext();
                }
                else if (event.equals(9 /* KeyCode.Escape */) && this.isFocused && !this.isOpen) {
                    this.setUnfocusedState();
                }
                else if (!this.isOpen && !event.ctrlKey && this.options.enableMnemonics && this.mnemonicsInUse && this.mnemonics.has(key)) {
                    const menuIndex = this.mnemonics.get(key);
                    this.onMenuTriggered(menuIndex, false);
                }
                else {
                    eventHandled = false;
                }
                // Never allow default tab behavior when not compact
                if (!this.isCompact && (event.equals(2 /* KeyCode.Tab */ | 1024 /* KeyMod.Shift */) || event.equals(2 /* KeyCode.Tab */))) {
                    event.preventDefault();
                }
                if (eventHandled) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }));
            const window = DOM.getWindow(this.container);
            this._register(DOM.addDisposableListener(window, DOM.EventType.MOUSE_DOWN, () => {
                // This mouse event is outside the menubar so it counts as a focus out
                if (this.isFocused) {
                    this.setUnfocusedState();
                }
            }));
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.FOCUS_IN, (e) => {
                const event = e;
                if (event.relatedTarget) {
                    if (!this.container.contains(event.relatedTarget)) {
                        this.focusToReturn = event.relatedTarget;
                    }
                }
            }));
            this._register(DOM.addDisposableListener(this.container, DOM.EventType.FOCUS_OUT, (e) => {
                const event = e;
                // We are losing focus and there is no related target, e.g. webview case
                if (!event.relatedTarget) {
                    this.setUnfocusedState();
                }
                // We are losing focus and there is a target, reset focusToReturn value as not to redirect
                else if (event.relatedTarget && !this.container.contains(event.relatedTarget)) {
                    this.focusToReturn = undefined;
                    this.setUnfocusedState();
                }
            }));
            this._register(DOM.addDisposableListener(window, DOM.EventType.KEY_DOWN, (e) => {
                if (!this.options.enableMnemonics || !e.altKey || e.ctrlKey || e.defaultPrevented) {
                    return;
                }
                const key = e.key.toLocaleLowerCase();
                if (!this.mnemonics.has(key)) {
                    return;
                }
                this.mnemonicsInUse = true;
                this.updateMnemonicVisibility(true);
                const menuIndex = this.mnemonics.get(key);
                this.onMenuTriggered(menuIndex, false);
            }));
            this.setUnfocusedState();
        }
        push(arg) {
            const menus = (0, arrays_1.asArray)(arg);
            menus.forEach((menuBarMenu) => {
                const menuIndex = this.menus.length;
                const cleanMenuLabel = (0, menu_1.cleanMnemonic)(menuBarMenu.label);
                const mnemonicMatches = menu_1.MENU_MNEMONIC_REGEX.exec(menuBarMenu.label);
                // Register mnemonics
                if (mnemonicMatches) {
                    const mnemonic = !!mnemonicMatches[1] ? mnemonicMatches[1] : mnemonicMatches[3];
                    this.registerMnemonic(this.menus.length, mnemonic);
                }
                if (this.isCompact) {
                    this.menus.push(menuBarMenu);
                }
                else {
                    const buttonElement = $('div.menubar-menu-button', { 'role': 'menuitem', 'tabindex': -1, 'aria-label': cleanMenuLabel, 'aria-haspopup': true });
                    const titleElement = $('div.menubar-menu-title', { 'role': 'none', 'aria-hidden': true });
                    buttonElement.appendChild(titleElement);
                    this.container.insertBefore(buttonElement, this.overflowMenu.buttonElement);
                    this.updateLabels(titleElement, buttonElement, menuBarMenu.label);
                    this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.KEY_UP, (e) => {
                        const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                        let eventHandled = true;
                        if ((event.equals(18 /* KeyCode.DownArrow */) || event.equals(3 /* KeyCode.Enter */)) && !this.isOpen) {
                            this.focusedMenu = { index: menuIndex };
                            this.openedViaKeyboard = true;
                            this.focusState = MenubarState.OPEN;
                        }
                        else {
                            eventHandled = false;
                        }
                        if (eventHandled) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }));
                    this._register(touch_1.Gesture.addTarget(buttonElement));
                    this._register(DOM.addDisposableListener(buttonElement, touch_1.EventType.Tap, (e) => {
                        // Ignore this touch if the menu is touched
                        if (this.isOpen && this.focusedMenu && this.focusedMenu.holder && DOM.isAncestor(e.initialTarget, this.focusedMenu.holder)) {
                            return;
                        }
                        this.ignoreNextMouseUp = false;
                        this.onMenuTriggered(menuIndex, true);
                        e.preventDefault();
                        e.stopPropagation();
                    }));
                    this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.MOUSE_DOWN, (e) => {
                        // Ignore non-left-click
                        const mouseEvent = new mouseEvent_1.StandardMouseEvent(DOM.getWindow(buttonElement), e);
                        if (!mouseEvent.leftButton) {
                            e.preventDefault();
                            return;
                        }
                        if (!this.isOpen) {
                            // Open the menu with mouse down and ignore the following mouse up event
                            this.ignoreNextMouseUp = true;
                            this.onMenuTriggered(menuIndex, true);
                        }
                        else {
                            this.ignoreNextMouseUp = false;
                        }
                        e.preventDefault();
                        e.stopPropagation();
                    }));
                    this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.MOUSE_UP, (e) => {
                        if (e.defaultPrevented) {
                            return;
                        }
                        if (!this.ignoreNextMouseUp) {
                            if (this.isFocused) {
                                this.onMenuTriggered(menuIndex, true);
                            }
                        }
                        else {
                            this.ignoreNextMouseUp = false;
                        }
                    }));
                    this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.MOUSE_ENTER, () => {
                        if (this.isOpen && !this.isCurrentMenu(menuIndex)) {
                            buttonElement.focus();
                            this.cleanupCustomMenu();
                            this.showCustomMenu(menuIndex, false);
                        }
                        else if (this.isFocused && !this.isOpen) {
                            this.focusedMenu = { index: menuIndex };
                            buttonElement.focus();
                        }
                    }));
                    this.menus.push({
                        label: menuBarMenu.label,
                        actions: menuBarMenu.actions,
                        buttonElement: buttonElement,
                        titleElement: titleElement
                    });
                }
            });
        }
        createOverflowMenu() {
            const label = this.isCompact ? nls.localize('mAppMenu', 'Application Menu') : nls.localize('mMore', 'More');
            const buttonElement = $('div.menubar-menu-button', { 'role': 'menuitem', 'tabindex': this.isCompact ? 0 : -1, 'aria-label': label, 'aria-haspopup': true });
            const titleElement = $('div.menubar-menu-title.toolbar-toggle-more' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.menuBarMore), { 'role': 'none', 'aria-hidden': true });
            buttonElement.appendChild(titleElement);
            this.container.appendChild(buttonElement);
            buttonElement.style.visibility = 'hidden';
            this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let eventHandled = true;
                const triggerKeys = [3 /* KeyCode.Enter */];
                if (!this.isCompact) {
                    triggerKeys.push(18 /* KeyCode.DownArrow */);
                }
                else {
                    triggerKeys.push(10 /* KeyCode.Space */);
                    if (this.options.compactMode?.horizontal === menu_1.HorizontalDirection.Right) {
                        triggerKeys.push(17 /* KeyCode.RightArrow */);
                    }
                    else if (this.options.compactMode?.horizontal === menu_1.HorizontalDirection.Left) {
                        triggerKeys.push(15 /* KeyCode.LeftArrow */);
                    }
                }
                if ((triggerKeys.some(k => event.equals(k)) && !this.isOpen)) {
                    this.focusedMenu = { index: MenuBar.OVERFLOW_INDEX };
                    this.openedViaKeyboard = true;
                    this.focusState = MenubarState.OPEN;
                }
                else {
                    eventHandled = false;
                }
                if (eventHandled) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }));
            this._register(touch_1.Gesture.addTarget(buttonElement));
            this._register(DOM.addDisposableListener(buttonElement, touch_1.EventType.Tap, (e) => {
                // Ignore this touch if the menu is touched
                if (this.isOpen && this.focusedMenu && this.focusedMenu.holder && DOM.isAncestor(e.initialTarget, this.focusedMenu.holder)) {
                    return;
                }
                this.ignoreNextMouseUp = false;
                this.onMenuTriggered(MenuBar.OVERFLOW_INDEX, true);
                e.preventDefault();
                e.stopPropagation();
            }));
            this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.MOUSE_DOWN, (e) => {
                // Ignore non-left-click
                const mouseEvent = new mouseEvent_1.StandardMouseEvent(DOM.getWindow(buttonElement), e);
                if (!mouseEvent.leftButton) {
                    e.preventDefault();
                    return;
                }
                if (!this.isOpen) {
                    // Open the menu with mouse down and ignore the following mouse up event
                    this.ignoreNextMouseUp = true;
                    this.onMenuTriggered(MenuBar.OVERFLOW_INDEX, true);
                }
                else {
                    this.ignoreNextMouseUp = false;
                }
                e.preventDefault();
                e.stopPropagation();
            }));
            this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.MOUSE_UP, (e) => {
                if (e.defaultPrevented) {
                    return;
                }
                if (!this.ignoreNextMouseUp) {
                    if (this.isFocused) {
                        this.onMenuTriggered(MenuBar.OVERFLOW_INDEX, true);
                    }
                }
                else {
                    this.ignoreNextMouseUp = false;
                }
            }));
            this._register(DOM.addDisposableListener(buttonElement, DOM.EventType.MOUSE_ENTER, () => {
                if (this.isOpen && !this.isCurrentMenu(MenuBar.OVERFLOW_INDEX)) {
                    this.overflowMenu.buttonElement.focus();
                    this.cleanupCustomMenu();
                    this.showCustomMenu(MenuBar.OVERFLOW_INDEX, false);
                }
                else if (this.isFocused && !this.isOpen) {
                    this.focusedMenu = { index: MenuBar.OVERFLOW_INDEX };
                    buttonElement.focus();
                }
            }));
            this.overflowMenu = {
                buttonElement: buttonElement,
                titleElement: titleElement,
                label: 'More',
                actions: []
            };
        }
        updateMenu(menu) {
            const menuToUpdate = this.menus.filter(menuBarMenu => menuBarMenu.label === menu.label);
            if (menuToUpdate && menuToUpdate.length) {
                menuToUpdate[0].actions = menu.actions;
            }
        }
        dispose() {
            super.dispose();
            this.menus.forEach(menuBarMenu => {
                menuBarMenu.titleElement?.remove();
                menuBarMenu.buttonElement?.remove();
            });
            this.overflowMenu.titleElement.remove();
            this.overflowMenu.buttonElement.remove();
            (0, lifecycle_1.dispose)(this.overflowLayoutScheduled);
            this.overflowLayoutScheduled = undefined;
        }
        blur() {
            this.setUnfocusedState();
        }
        getWidth() {
            if (!this.isCompact && this.menus) {
                const left = this.menus[0].buttonElement.getBoundingClientRect().left;
                const right = this.hasOverflow ? this.overflowMenu.buttonElement.getBoundingClientRect().right : this.menus[this.menus.length - 1].buttonElement.getBoundingClientRect().right;
                return right - left;
            }
            return 0;
        }
        getHeight() {
            return this.container.clientHeight;
        }
        toggleFocus() {
            if (!this.isFocused && this.options.visibility !== 'hidden') {
                this.mnemonicsInUse = true;
                this.focusedMenu = { index: this.numMenusShown > 0 ? 0 : MenuBar.OVERFLOW_INDEX };
                this.focusState = MenubarState.FOCUSED;
            }
            else if (!this.isOpen) {
                this.setUnfocusedState();
            }
        }
        updateOverflowAction() {
            if (!this.menus || !this.menus.length) {
                return;
            }
            const overflowMenuOnlyClass = 'overflow-menu-only';
            // Remove overflow only restriction to allow the most space
            this.container.classList.toggle(overflowMenuOnlyClass, false);
            const sizeAvailable = this.container.offsetWidth;
            let currentSize = 0;
            let full = this.isCompact;
            const prevNumMenusShown = this.numMenusShown;
            this.numMenusShown = 0;
            const showableMenus = this.menus.filter(menu => menu.buttonElement !== undefined && menu.titleElement !== undefined);
            for (const menuBarMenu of showableMenus) {
                if (!full) {
                    const size = menuBarMenu.buttonElement.offsetWidth;
                    if (currentSize + size > sizeAvailable) {
                        full = true;
                    }
                    else {
                        currentSize += size;
                        this.numMenusShown++;
                        if (this.numMenusShown > prevNumMenusShown) {
                            menuBarMenu.buttonElement.style.visibility = 'visible';
                        }
                    }
                }
                if (full) {
                    menuBarMenu.buttonElement.style.visibility = 'hidden';
                }
            }
            // If below minimium menu threshold, show the overflow menu only as hamburger menu
            if (this.numMenusShown - 1 <= showableMenus.length / 4) {
                for (const menuBarMenu of showableMenus) {
                    menuBarMenu.buttonElement.style.visibility = 'hidden';
                }
                full = true;
                this.numMenusShown = 0;
                currentSize = 0;
            }
            // Overflow
            if (this.isCompact) {
                this.overflowMenu.actions = [];
                for (let idx = this.numMenusShown; idx < this.menus.length; idx++) {
                    this.overflowMenu.actions.push(new actions_1.SubmenuAction(`menubar.submenu.${this.menus[idx].label}`, this.menus[idx].label, this.menus[idx].actions || []));
                }
                const compactMenuActions = this.options.getCompactMenuActions?.();
                if (compactMenuActions && compactMenuActions.length) {
                    this.overflowMenu.actions.push(new actions_1.Separator());
                    this.overflowMenu.actions.push(...compactMenuActions);
                }
                this.overflowMenu.buttonElement.style.visibility = 'visible';
            }
            else if (full) {
                // Can't fit the more button, need to remove more menus
                while (currentSize + this.overflowMenu.buttonElement.offsetWidth > sizeAvailable && this.numMenusShown > 0) {
                    this.numMenusShown--;
                    const size = showableMenus[this.numMenusShown].buttonElement.offsetWidth;
                    showableMenus[this.numMenusShown].buttonElement.style.visibility = 'hidden';
                    currentSize -= size;
                }
                this.overflowMenu.actions = [];
                for (let idx = this.numMenusShown; idx < showableMenus.length; idx++) {
                    this.overflowMenu.actions.push(new actions_1.SubmenuAction(`menubar.submenu.${showableMenus[idx].label}`, showableMenus[idx].label, showableMenus[idx].actions || []));
                }
                if (this.overflowMenu.buttonElement.nextElementSibling !== showableMenus[this.numMenusShown].buttonElement) {
                    this.overflowMenu.buttonElement.remove();
                    this.container.insertBefore(this.overflowMenu.buttonElement, showableMenus[this.numMenusShown].buttonElement);
                }
                this.overflowMenu.buttonElement.style.visibility = 'visible';
            }
            else {
                this.overflowMenu.buttonElement.remove();
                this.container.appendChild(this.overflowMenu.buttonElement);
                this.overflowMenu.buttonElement.style.visibility = 'hidden';
            }
            // If we are only showing the overflow, add this class to avoid taking up space
            this.container.classList.toggle(overflowMenuOnlyClass, this.numMenusShown === 0);
        }
        updateLabels(titleElement, buttonElement, label) {
            const cleanMenuLabel = (0, menu_1.cleanMnemonic)(label);
            // Update the button label to reflect mnemonics
            if (this.options.enableMnemonics) {
                const cleanLabel = strings.escape(label);
                // This is global so reset it
                menu_1.MENU_ESCAPED_MNEMONIC_REGEX.lastIndex = 0;
                let escMatch = menu_1.MENU_ESCAPED_MNEMONIC_REGEX.exec(cleanLabel);
                // We can't use negative lookbehind so we match our negative and skip
                while (escMatch && escMatch[1]) {
                    escMatch = menu_1.MENU_ESCAPED_MNEMONIC_REGEX.exec(cleanLabel);
                }
                const replaceDoubleEscapes = (str) => str.replace(/&amp;&amp;/g, '&amp;');
                if (escMatch) {
                    titleElement.innerText = '';
                    titleElement.append(strings.ltrim(replaceDoubleEscapes(cleanLabel.substr(0, escMatch.index)), ' '), $('mnemonic', { 'aria-hidden': 'true' }, escMatch[3]), strings.rtrim(replaceDoubleEscapes(cleanLabel.substr(escMatch.index + escMatch[0].length)), ' '));
                }
                else {
                    titleElement.innerText = replaceDoubleEscapes(cleanLabel).trim();
                }
            }
            else {
                titleElement.innerText = cleanMenuLabel.replace(/&&/g, '&');
            }
            const mnemonicMatches = menu_1.MENU_MNEMONIC_REGEX.exec(label);
            // Register mnemonics
            if (mnemonicMatches) {
                const mnemonic = !!mnemonicMatches[1] ? mnemonicMatches[1] : mnemonicMatches[3];
                if (this.options.enableMnemonics) {
                    buttonElement.setAttribute('aria-keyshortcuts', 'Alt+' + mnemonic.toLocaleLowerCase());
                }
                else {
                    buttonElement.removeAttribute('aria-keyshortcuts');
                }
            }
        }
        update(options) {
            if (options) {
                this.options = options;
            }
            // Don't update while using the menu
            if (this.isFocused) {
                this.updatePending = true;
                return;
            }
            this.menus.forEach(menuBarMenu => {
                if (!menuBarMenu.buttonElement || !menuBarMenu.titleElement) {
                    return;
                }
                this.updateLabels(menuBarMenu.titleElement, menuBarMenu.buttonElement, menuBarMenu.label);
            });
            if (!this.overflowLayoutScheduled) {
                this.overflowLayoutScheduled = DOM.scheduleAtNextAnimationFrame(DOM.getWindow(this.container), () => {
                    this.updateOverflowAction();
                    this.overflowLayoutScheduled = undefined;
                });
            }
            this.setUnfocusedState();
        }
        registerMnemonic(menuIndex, mnemonic) {
            this.mnemonics.set(mnemonic.toLocaleLowerCase(), menuIndex);
        }
        hideMenubar() {
            if (this.container.style.display !== 'none') {
                this.container.style.display = 'none';
                this._onVisibilityChange.fire(false);
            }
        }
        showMenubar() {
            if (this.container.style.display !== 'flex') {
                this.container.style.display = 'flex';
                this._onVisibilityChange.fire(true);
                this.updateOverflowAction();
            }
        }
        get focusState() {
            return this._focusState;
        }
        set focusState(value) {
            if (this._focusState >= MenubarState.FOCUSED && value < MenubarState.FOCUSED) {
                // Losing focus, update the menu if needed
                if (this.updatePending) {
                    this.menuUpdater.schedule();
                    this.updatePending = false;
                }
            }
            if (value === this._focusState) {
                return;
            }
            const isVisible = this.isVisible;
            const isOpen = this.isOpen;
            const isFocused = this.isFocused;
            this._focusState = value;
            switch (value) {
                case MenubarState.HIDDEN:
                    if (isVisible) {
                        this.hideMenubar();
                    }
                    if (isOpen) {
                        this.cleanupCustomMenu();
                    }
                    if (isFocused) {
                        this.focusedMenu = undefined;
                        if (this.focusToReturn) {
                            this.focusToReturn.focus();
                            this.focusToReturn = undefined;
                        }
                    }
                    break;
                case MenubarState.VISIBLE:
                    if (!isVisible) {
                        this.showMenubar();
                    }
                    if (isOpen) {
                        this.cleanupCustomMenu();
                    }
                    if (isFocused) {
                        if (this.focusedMenu) {
                            if (this.focusedMenu.index === MenuBar.OVERFLOW_INDEX) {
                                this.overflowMenu.buttonElement.blur();
                            }
                            else {
                                this.menus[this.focusedMenu.index].buttonElement?.blur();
                            }
                        }
                        this.focusedMenu = undefined;
                        if (this.focusToReturn) {
                            this.focusToReturn.focus();
                            this.focusToReturn = undefined;
                        }
                    }
                    break;
                case MenubarState.FOCUSED:
                    if (!isVisible) {
                        this.showMenubar();
                    }
                    if (isOpen) {
                        this.cleanupCustomMenu();
                    }
                    if (this.focusedMenu) {
                        if (this.focusedMenu.index === MenuBar.OVERFLOW_INDEX) {
                            this.overflowMenu.buttonElement.focus();
                        }
                        else {
                            this.menus[this.focusedMenu.index].buttonElement?.focus();
                        }
                    }
                    break;
                case MenubarState.OPEN:
                    if (!isVisible) {
                        this.showMenubar();
                    }
                    if (this.focusedMenu) {
                        this.cleanupCustomMenu();
                        this.showCustomMenu(this.focusedMenu.index, this.openedViaKeyboard);
                    }
                    break;
            }
            this._focusState = value;
            this._onFocusStateChange.fire(this.focusState >= MenubarState.FOCUSED);
        }
        get isVisible() {
            return this.focusState >= MenubarState.VISIBLE;
        }
        get isFocused() {
            return this.focusState >= MenubarState.FOCUSED;
        }
        get isOpen() {
            return this.focusState >= MenubarState.OPEN;
        }
        get hasOverflow() {
            return this.isCompact || this.numMenusShown < this.menus.length;
        }
        get isCompact() {
            return this.options.compactMode !== undefined;
        }
        setUnfocusedState() {
            if (this.options.visibility === 'toggle' || this.options.visibility === 'hidden') {
                this.focusState = MenubarState.HIDDEN;
            }
            else if (this.options.visibility === 'classic' && browser.isFullscreen(window_1.mainWindow)) {
                this.focusState = MenubarState.HIDDEN;
            }
            else {
                this.focusState = MenubarState.VISIBLE;
            }
            this.ignoreNextMouseUp = false;
            this.mnemonicsInUse = false;
            this.updateMnemonicVisibility(false);
        }
        focusPrevious() {
            if (!this.focusedMenu || this.numMenusShown === 0) {
                return;
            }
            let newFocusedIndex = (this.focusedMenu.index - 1 + this.numMenusShown) % this.numMenusShown;
            if (this.focusedMenu.index === MenuBar.OVERFLOW_INDEX) {
                newFocusedIndex = this.numMenusShown - 1;
            }
            else if (this.focusedMenu.index === 0 && this.hasOverflow) {
                newFocusedIndex = MenuBar.OVERFLOW_INDEX;
            }
            if (newFocusedIndex === this.focusedMenu.index) {
                return;
            }
            if (this.isOpen) {
                this.cleanupCustomMenu();
                this.showCustomMenu(newFocusedIndex);
            }
            else if (this.isFocused) {
                this.focusedMenu.index = newFocusedIndex;
                if (newFocusedIndex === MenuBar.OVERFLOW_INDEX) {
                    this.overflowMenu.buttonElement.focus();
                }
                else {
                    this.menus[newFocusedIndex].buttonElement?.focus();
                }
            }
        }
        focusNext() {
            if (!this.focusedMenu || this.numMenusShown === 0) {
                return;
            }
            let newFocusedIndex = (this.focusedMenu.index + 1) % this.numMenusShown;
            if (this.focusedMenu.index === MenuBar.OVERFLOW_INDEX) {
                newFocusedIndex = 0;
            }
            else if (this.focusedMenu.index === this.numMenusShown - 1) {
                newFocusedIndex = MenuBar.OVERFLOW_INDEX;
            }
            if (newFocusedIndex === this.focusedMenu.index) {
                return;
            }
            if (this.isOpen) {
                this.cleanupCustomMenu();
                this.showCustomMenu(newFocusedIndex);
            }
            else if (this.isFocused) {
                this.focusedMenu.index = newFocusedIndex;
                if (newFocusedIndex === MenuBar.OVERFLOW_INDEX) {
                    this.overflowMenu.buttonElement.focus();
                }
                else {
                    this.menus[newFocusedIndex].buttonElement?.focus();
                }
            }
        }
        updateMnemonicVisibility(visible) {
            if (this.menus) {
                this.menus.forEach(menuBarMenu => {
                    if (menuBarMenu.titleElement && menuBarMenu.titleElement.children.length) {
                        const child = menuBarMenu.titleElement.children.item(0);
                        if (child) {
                            child.style.textDecoration = (this.options.alwaysOnMnemonics || visible) ? 'underline' : '';
                        }
                    }
                });
            }
        }
        get mnemonicsInUse() {
            return this._mnemonicsInUse;
        }
        set mnemonicsInUse(value) {
            this._mnemonicsInUse = value;
        }
        get shouldAltKeyFocus() {
            if (platform_1.isMacintosh) {
                return false;
            }
            if (!this.options.disableAltFocus) {
                return true;
            }
            if (this.options.visibility === 'toggle') {
                return true;
            }
            return false;
        }
        get onVisibilityChange() {
            return this._onVisibilityChange.event;
        }
        get onFocusStateChange() {
            return this._onFocusStateChange.event;
        }
        onMenuTriggered(menuIndex, clicked) {
            if (this.isOpen) {
                if (this.isCurrentMenu(menuIndex)) {
                    this.setUnfocusedState();
                }
                else {
                    this.cleanupCustomMenu();
                    this.showCustomMenu(menuIndex, this.openedViaKeyboard);
                }
            }
            else {
                this.focusedMenu = { index: menuIndex };
                this.openedViaKeyboard = !clicked;
                this.focusState = MenubarState.OPEN;
            }
        }
        onModifierKeyToggled(modifierKeyStatus) {
            const allModifiersReleased = !modifierKeyStatus.altKey && !modifierKeyStatus.ctrlKey && !modifierKeyStatus.shiftKey && !modifierKeyStatus.metaKey;
            if (this.options.visibility === 'hidden') {
                return;
            }
            // Prevent alt-key default if the menu is not hidden and we use alt to focus
            if (modifierKeyStatus.event && this.shouldAltKeyFocus) {
                if (keyCodes_1.ScanCodeUtils.toEnum(modifierKeyStatus.event.code) === 159 /* ScanCode.AltLeft */) {
                    modifierKeyStatus.event.preventDefault();
                }
            }
            // Alt key pressed while menu is focused. This should return focus away from the menubar
            if (this.isFocused && modifierKeyStatus.lastKeyPressed === 'alt' && modifierKeyStatus.altKey) {
                this.setUnfocusedState();
                this.mnemonicsInUse = false;
                this.awaitingAltRelease = true;
            }
            // Clean alt key press and release
            if (allModifiersReleased && modifierKeyStatus.lastKeyPressed === 'alt' && modifierKeyStatus.lastKeyReleased === 'alt') {
                if (!this.awaitingAltRelease) {
                    if (!this.isFocused && this.shouldAltKeyFocus) {
                        this.mnemonicsInUse = true;
                        this.focusedMenu = { index: this.numMenusShown > 0 ? 0 : MenuBar.OVERFLOW_INDEX };
                        this.focusState = MenubarState.FOCUSED;
                    }
                    else if (!this.isOpen) {
                        this.setUnfocusedState();
                    }
                }
            }
            // Alt key released
            if (!modifierKeyStatus.altKey && modifierKeyStatus.lastKeyReleased === 'alt') {
                this.awaitingAltRelease = false;
            }
            if (this.options.enableMnemonics && this.menus && !this.isOpen) {
                this.updateMnemonicVisibility((!this.awaitingAltRelease && modifierKeyStatus.altKey) || this.mnemonicsInUse);
            }
        }
        isCurrentMenu(menuIndex) {
            if (!this.focusedMenu) {
                return false;
            }
            return this.focusedMenu.index === menuIndex;
        }
        cleanupCustomMenu() {
            if (this.focusedMenu) {
                // Remove focus from the menus first
                if (this.focusedMenu.index === MenuBar.OVERFLOW_INDEX) {
                    this.overflowMenu.buttonElement.focus();
                }
                else {
                    this.menus[this.focusedMenu.index].buttonElement?.focus();
                }
                if (this.focusedMenu.holder) {
                    this.focusedMenu.holder.parentElement?.classList.remove('open');
                    this.focusedMenu.holder.remove();
                }
                this.focusedMenu.widget?.dispose();
                this.focusedMenu = { index: this.focusedMenu.index };
            }
            this.menuDisposables.clear();
        }
        showCustomMenu(menuIndex, selectFirst = true) {
            const actualMenuIndex = menuIndex >= this.numMenusShown ? MenuBar.OVERFLOW_INDEX : menuIndex;
            const customMenu = actualMenuIndex === MenuBar.OVERFLOW_INDEX ? this.overflowMenu : this.menus[actualMenuIndex];
            if (!customMenu.actions || !customMenu.buttonElement || !customMenu.titleElement) {
                return;
            }
            const menuHolder = $('div.menubar-menu-items-holder', { 'title': '' });
            customMenu.buttonElement.classList.add('open');
            const titleBoundingRect = customMenu.titleElement.getBoundingClientRect();
            const titleBoundingRectZoom = DOM.getDomNodeZoomLevel(customMenu.titleElement);
            if (this.options.compactMode?.horizontal === menu_1.HorizontalDirection.Right) {
                menuHolder.style.left = `${titleBoundingRect.left + this.container.clientWidth}px`;
            }
            else if (this.options.compactMode?.horizontal === menu_1.HorizontalDirection.Left) {
                menuHolder.style.top = `${titleBoundingRect.top}px`;
                menuHolder.style.right = `${this.container.clientWidth}px`;
                menuHolder.style.left = 'auto';
            }
            else {
                menuHolder.style.left = `${titleBoundingRect.left * titleBoundingRectZoom}px`;
            }
            if (this.options.compactMode?.vertical === menu_1.VerticalDirection.Above) {
                // TODO@benibenj Do not hardcode the height of the menu holder
                menuHolder.style.top = `${titleBoundingRect.top - this.menus.length * 30 + this.container.clientHeight}px`;
            }
            else if (this.options.compactMode?.vertical === menu_1.VerticalDirection.Below) {
                menuHolder.style.top = `${titleBoundingRect.top}px`;
            }
            else {
                menuHolder.style.top = `${titleBoundingRect.bottom * titleBoundingRectZoom}px`;
            }
            customMenu.buttonElement.appendChild(menuHolder);
            const menuOptions = {
                getKeyBinding: this.options.getKeybinding,
                actionRunner: this.actionRunner,
                enableMnemonics: this.options.alwaysOnMnemonics || (this.mnemonicsInUse && this.options.enableMnemonics),
                ariaLabel: customMenu.buttonElement.getAttribute('aria-label') ?? undefined,
                expandDirection: this.isCompact ? this.options.compactMode : { horizontal: menu_1.HorizontalDirection.Right, vertical: menu_1.VerticalDirection.Below },
                useEventAsContext: true
            };
            const menuWidget = this.menuDisposables.add(new menu_1.Menu(menuHolder, customMenu.actions, menuOptions, this.menuStyle));
            this.menuDisposables.add(menuWidget.onDidCancel(() => {
                this.focusState = MenubarState.FOCUSED;
            }));
            if (actualMenuIndex !== menuIndex) {
                menuWidget.trigger(menuIndex - this.numMenusShown);
            }
            else {
                menuWidget.focus(selectFirst);
            }
            this.focusedMenu = {
                index: actualMenuIndex,
                holder: menuHolder,
                widget: menuWidget
            };
        }
    }
    exports.MenuBar = MenuBar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudWJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL21lbnUvbWVudWJhci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUF1QmhCLElBQUssWUFLSjtJQUxELFdBQUssWUFBWTtRQUNoQixtREFBTSxDQUFBO1FBQ04scURBQU8sQ0FBQTtRQUNQLHFEQUFPLENBQUE7UUFDUCwrQ0FBSSxDQUFBO0lBQ0wsQ0FBQyxFQUxJLFlBQVksS0FBWixZQUFZLFFBS2hCO0lBRUQsTUFBYSxPQUFRLFNBQVEsc0JBQVU7aUJBRXRCLG1CQUFjLEdBQVcsQ0FBQyxDQUFDLEFBQWIsQ0FBYztRQWtDNUMsWUFBb0IsU0FBc0IsRUFBVSxPQUF3QixFQUFVLFNBQXNCO1lBQzNHLEtBQUssRUFBRSxDQUFDO1lBRFcsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQUFVLFlBQU8sR0FBUCxPQUFPLENBQWlCO1lBQVUsY0FBUyxHQUFULFNBQVMsQ0FBYTtZQW5CNUcsZ0JBQWdCO1lBQ1Isb0JBQWUsR0FBWSxLQUFLLENBQUM7WUFDakMsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1lBQ25DLHVCQUFrQixHQUFZLEtBQUssQ0FBQztZQUNwQyxzQkFBaUIsR0FBWSxLQUFLLENBQUM7WUFHbkMsa0JBQWEsR0FBWSxLQUFLLENBQUM7WUFPL0Isa0JBQWEsR0FBVyxDQUFDLENBQUM7WUFDMUIsNEJBQXVCLEdBQTRCLFNBQVMsQ0FBQztZQUVwRCxvQkFBZSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSwyQkFBZSxFQUFFLENBQUMsQ0FBQztZQUt4RSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENB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