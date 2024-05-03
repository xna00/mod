/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/touch", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/contextview/contextview", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/codiconsUtil", "vs/base/common/themables", "vs/base/common/iconLabels", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings"], function (require, exports, browser_1, touch_1, dom_1, keyboardEvent_1, mouseEvent_1, actionbar_1, actionViewItems_1, contextview_1, scrollableElement_1, actions_1, async_1, codicons_1, codiconsUtil_1, themables_1, iconLabels_1, lifecycle_1, platform_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Menu = exports.unthemedMenuStyles = exports.VerticalDirection = exports.HorizontalDirection = exports.MENU_ESCAPED_MNEMONIC_REGEX = exports.MENU_MNEMONIC_REGEX = void 0;
    exports.cleanMnemonic = cleanMnemonic;
    exports.formatRule = formatRule;
    exports.MENU_MNEMONIC_REGEX = /\(&([^\s&])\)|(^|[^&])&([^\s&])/;
    exports.MENU_ESCAPED_MNEMONIC_REGEX = /(&amp;)?(&amp;)([^\s&])/g;
    var HorizontalDirection;
    (function (HorizontalDirection) {
        HorizontalDirection[HorizontalDirection["Right"] = 0] = "Right";
        HorizontalDirection[HorizontalDirection["Left"] = 1] = "Left";
    })(HorizontalDirection || (exports.HorizontalDirection = HorizontalDirection = {}));
    var VerticalDirection;
    (function (VerticalDirection) {
        VerticalDirection[VerticalDirection["Above"] = 0] = "Above";
        VerticalDirection[VerticalDirection["Below"] = 1] = "Below";
    })(VerticalDirection || (exports.VerticalDirection = VerticalDirection = {}));
    exports.unthemedMenuStyles = {
        shadowColor: undefined,
        borderColor: undefined,
        foregroundColor: undefined,
        backgroundColor: undefined,
        selectionForegroundColor: undefined,
        selectionBackgroundColor: undefined,
        selectionBorderColor: undefined,
        separatorColor: undefined,
        scrollbarShadow: undefined,
        scrollbarSliderBackground: undefined,
        scrollbarSliderHoverBackground: undefined,
        scrollbarSliderActiveBackground: undefined
    };
    class Menu extends actionbar_1.ActionBar {
        constructor(container, actions, options, menuStyles) {
            container.classList.add('monaco-menu-container');
            container.setAttribute('role', 'presentation');
            const menuElement = document.createElement('div');
            menuElement.classList.add('monaco-menu');
            menuElement.setAttribute('role', 'presentation');
            super(menuElement, {
                orientation: 1 /* ActionsOrientation.VERTICAL */,
                actionViewItemProvider: action => this.doGetActionViewItem(action, options, parentData),
                context: options.context,
                actionRunner: options.actionRunner,
                ariaLabel: options.ariaLabel,
                ariaRole: 'menu',
                focusOnlyEnabledItems: true,
                triggerKeys: { keys: [3 /* KeyCode.Enter */, ...(platform_1.isMacintosh || platform_1.isLinux ? [10 /* KeyCode.Space */] : [])], keyDown: true }
            });
            this.menuStyles = menuStyles;
            this.menuElement = menuElement;
            this.actionsList.tabIndex = 0;
            this.initializeOrUpdateStyleSheet(container, menuStyles);
            this._register(touch_1.Gesture.addTarget(menuElement));
            this._register((0, dom_1.addDisposableListener)(menuElement, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                // Stop tab navigation of menus
                if (event.equals(2 /* KeyCode.Tab */)) {
                    e.preventDefault();
                }
            }));
            if (options.enableMnemonics) {
                this._register((0, dom_1.addDisposableListener)(menuElement, dom_1.EventType.KEY_DOWN, (e) => {
                    const key = e.key.toLocaleLowerCase();
                    if (this.mnemonics.has(key)) {
                        dom_1.EventHelper.stop(e, true);
                        const actions = this.mnemonics.get(key);
                        if (actions.length === 1) {
                            if (actions[0] instanceof SubmenuMenuActionViewItem && actions[0].container) {
                                this.focusItemByElement(actions[0].container);
                            }
                            actions[0].onClick(e);
                        }
                        if (actions.length > 1) {
                            const action = actions.shift();
                            if (action && action.container) {
                                this.focusItemByElement(action.container);
                                actions.push(action);
                            }
                            this.mnemonics.set(key, actions);
                        }
                    }
                }));
            }
            if (platform_1.isLinux) {
                this._register((0, dom_1.addDisposableListener)(menuElement, dom_1.EventType.KEY_DOWN, e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(14 /* KeyCode.Home */) || event.equals(11 /* KeyCode.PageUp */)) {
                        this.focusedItem = this.viewItems.length - 1;
                        this.focusNext();
                        dom_1.EventHelper.stop(e, true);
                    }
                    else if (event.equals(13 /* KeyCode.End */) || event.equals(12 /* KeyCode.PageDown */)) {
                        this.focusedItem = 0;
                        this.focusPrevious();
                        dom_1.EventHelper.stop(e, true);
                    }
                }));
            }
            this._register((0, dom_1.addDisposableListener)(this.domNode, dom_1.EventType.MOUSE_OUT, e => {
                const relatedTarget = e.relatedTarget;
                if (!(0, dom_1.isAncestor)(relatedTarget, this.domNode)) {
                    this.focusedItem = undefined;
                    this.updateFocus();
                    e.stopPropagation();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.actionsList, dom_1.EventType.MOUSE_OVER, e => {
                let target = e.target;
                if (!target || !(0, dom_1.isAncestor)(target, this.actionsList) || target === this.actionsList) {
                    return;
                }
                while (target.parentElement !== this.actionsList && target.parentElement !== null) {
                    target = target.parentElement;
                }
                if (target.classList.contains('action-item')) {
                    const lastFocusedItem = this.focusedItem;
                    this.setFocusedItem(target);
                    if (lastFocusedItem !== this.focusedItem) {
                        this.updateFocus();
                    }
                }
            }));
            // Support touch on actions list to focus items (needed for submenus)
            this._register(touch_1.Gesture.addTarget(this.actionsList));
            this._register((0, dom_1.addDisposableListener)(this.actionsList, touch_1.EventType.Tap, e => {
                let target = e.initialTarget;
                if (!target || !(0, dom_1.isAncestor)(target, this.actionsList) || target === this.actionsList) {
                    return;
                }
                while (target.parentElement !== this.actionsList && target.parentElement !== null) {
                    target = target.parentElement;
                }
                if (target.classList.contains('action-item')) {
                    const lastFocusedItem = this.focusedItem;
                    this.setFocusedItem(target);
                    if (lastFocusedItem !== this.focusedItem) {
                        this.updateFocus();
                    }
                }
            }));
            const parentData = {
                parent: this
            };
            this.mnemonics = new Map();
            // Scroll Logic
            this.scrollableElement = this._register(new scrollableElement_1.DomScrollableElement(menuElement, {
                alwaysConsumeMouseWheel: true,
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
                vertical: 3 /* ScrollbarVisibility.Visible */,
                verticalScrollbarSize: 7,
                handleMouseWheel: true,
                useShadows: true
            }));
            const scrollElement = this.scrollableElement.getDomNode();
            scrollElement.style.position = '';
            this.styleScrollElement(scrollElement, menuStyles);
            // Support scroll on menu drag
            this._register((0, dom_1.addDisposableListener)(menuElement, touch_1.EventType.Change, e => {
                dom_1.EventHelper.stop(e, true);
                const scrollTop = this.scrollableElement.getScrollPosition().scrollTop;
                this.scrollableElement.setScrollPosition({ scrollTop: scrollTop - e.translationY });
            }));
            this._register((0, dom_1.addDisposableListener)(scrollElement, dom_1.EventType.MOUSE_UP, e => {
                // Absorb clicks in menu dead space https://github.com/microsoft/vscode/issues/63575
                // We do this on the scroll element so the scroll bar doesn't dismiss the menu either
                e.preventDefault();
            }));
            const window = (0, dom_1.getWindow)(container);
            menuElement.style.maxHeight = `${Math.max(10, window.innerHeight - container.getBoundingClientRect().top - 35)}px`;
            actions = actions.filter((a, idx) => {
                if (options.submenuIds?.has(a.id)) {
                    console.warn(`Found submenu cycle: ${a.id}`);
                    return false;
                }
                // Filter out consecutive or useless separators
                if (a instanceof actions_1.Separator) {
                    if (idx === actions.length - 1 || idx === 0) {
                        return false;
                    }
                    const prevAction = actions[idx - 1];
                    if (prevAction instanceof actions_1.Separator) {
                        return false;
                    }
                }
                return true;
            });
            this.push(actions, { icon: true, label: true, isMenu: true });
            container.appendChild(this.scrollableElement.getDomNode());
            this.scrollableElement.scanDomNode();
            this.viewItems.filter(item => !(item instanceof MenuSeparatorActionViewItem)).forEach((item, index, array) => {
                item.updatePositionInSet(index + 1, array.length);
            });
        }
        initializeOrUpdateStyleSheet(container, style) {
            if (!this.styleSheet) {
                if ((0, dom_1.isInShadowDOM)(container)) {
                    this.styleSheet = (0, dom_1.createStyleSheet)(container);
                }
                else {
                    if (!Menu.globalStyleSheet) {
                        Menu.globalStyleSheet = (0, dom_1.createStyleSheet)();
                    }
                    this.styleSheet = Menu.globalStyleSheet;
                }
            }
            this.styleSheet.textContent = getMenuWidgetCSS(style, (0, dom_1.isInShadowDOM)(container));
        }
        styleScrollElement(scrollElement, style) {
            const fgColor = style.foregroundColor ?? '';
            const bgColor = style.backgroundColor ?? '';
            const border = style.borderColor ? `1px solid ${style.borderColor}` : '';
            const borderRadius = '5px';
            const shadow = style.shadowColor ? `0 2px 8px ${style.shadowColor}` : '';
            scrollElement.style.outline = border;
            scrollElement.style.borderRadius = borderRadius;
            scrollElement.style.color = fgColor;
            scrollElement.style.backgroundColor = bgColor;
            scrollElement.style.boxShadow = shadow;
        }
        getContainer() {
            return this.scrollableElement.getDomNode();
        }
        get onScroll() {
            return this.scrollableElement.onScroll;
        }
        get scrollOffset() {
            return this.menuElement.scrollTop;
        }
        trigger(index) {
            if (index <= this.viewItems.length && index >= 0) {
                const item = this.viewItems[index];
                if (item instanceof SubmenuMenuActionViewItem) {
                    super.focus(index);
                    item.open(true);
                }
                else if (item instanceof BaseMenuActionViewItem) {
                    super.run(item._action, item._context);
                }
                else {
                    return;
                }
            }
        }
        focusItemByElement(element) {
            const lastFocusedItem = this.focusedItem;
            this.setFocusedItem(element);
            if (lastFocusedItem !== this.focusedItem) {
                this.updateFocus();
            }
        }
        setFocusedItem(element) {
            for (let i = 0; i < this.actionsList.children.length; i++) {
                const elem = this.actionsList.children[i];
                if (element === elem) {
                    this.focusedItem = i;
                    break;
                }
            }
        }
        updateFocus(fromRight) {
            super.updateFocus(fromRight, true, true);
            if (typeof this.focusedItem !== 'undefined') {
                // Workaround for #80047 caused by an issue in chromium
                // https://bugs.chromium.org/p/chromium/issues/detail?id=414283
                // When that's fixed, just call this.scrollableElement.scanDomNode()
                this.scrollableElement.setScrollPosition({
                    scrollTop: Math.round(this.menuElement.scrollTop)
                });
            }
        }
        doGetActionViewItem(action, options, parentData) {
            if (action instanceof actions_1.Separator) {
                return new MenuSeparatorActionViewItem(options.context, action, { icon: true }, this.menuStyles);
            }
            else if (action instanceof actions_1.SubmenuAction) {
                const menuActionViewItem = new SubmenuMenuActionViewItem(action, action.actions, parentData, { ...options, submenuIds: new Set([...(options.submenuIds || []), action.id]) }, this.menuStyles);
                if (options.enableMnemonics) {
                    const mnemonic = menuActionViewItem.getMnemonic();
                    if (mnemonic && menuActionViewItem.isEnabled()) {
                        let actionViewItems = [];
                        if (this.mnemonics.has(mnemonic)) {
                            actionViewItems = this.mnemonics.get(mnemonic);
                        }
                        actionViewItems.push(menuActionViewItem);
                        this.mnemonics.set(mnemonic, actionViewItems);
                    }
                }
                return menuActionViewItem;
            }
            else {
                const menuItemOptions = { enableMnemonics: options.enableMnemonics, useEventAsContext: options.useEventAsContext };
                if (options.getKeyBinding) {
                    const keybinding = options.getKeyBinding(action);
                    if (keybinding) {
                        const keybindingLabel = keybinding.getLabel();
                        if (keybindingLabel) {
                            menuItemOptions.keybinding = keybindingLabel;
                        }
                    }
                }
                const menuActionViewItem = new BaseMenuActionViewItem(options.context, action, menuItemOptions, this.menuStyles);
                if (options.enableMnemonics) {
                    const mnemonic = menuActionViewItem.getMnemonic();
                    if (mnemonic && menuActionViewItem.isEnabled()) {
                        let actionViewItems = [];
                        if (this.mnemonics.has(mnemonic)) {
                            actionViewItems = this.mnemonics.get(mnemonic);
                        }
                        actionViewItems.push(menuActionViewItem);
                        this.mnemonics.set(mnemonic, actionViewItems);
                    }
                }
                return menuActionViewItem;
            }
        }
    }
    exports.Menu = Menu;
    class BaseMenuActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(ctx, action, options, menuStyle) {
            options.isMenu = true;
            super(action, action, options);
            this.menuStyle = menuStyle;
            this.options = options;
            this.options.icon = options.icon !== undefined ? options.icon : false;
            this.options.label = options.label !== undefined ? options.label : true;
            this.cssClass = '';
            // Set mnemonic
            if (this.options.label && options.enableMnemonics) {
                const label = this.action.label;
                if (label) {
                    const matches = exports.MENU_MNEMONIC_REGEX.exec(label);
                    if (matches) {
                        this.mnemonic = (!!matches[1] ? matches[1] : matches[3]).toLocaleLowerCase();
                    }
                }
            }
            // Add mouse up listener later to avoid accidental clicks
            this.runOnceToEnableMouseUp = new async_1.RunOnceScheduler(() => {
                if (!this.element) {
                    return;
                }
                this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.MOUSE_UP, e => {
                    // removed default prevention as it conflicts
                    // with BaseActionViewItem #101537
                    // add back if issues arise and link new issue
                    dom_1.EventHelper.stop(e, true);
                    // See https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Interact_with_the_clipboard
                    // > Writing to the clipboard
                    // > You can use the "cut" and "copy" commands without any special
                    // permission if you are using them in a short-lived event handler
                    // for a user action (for example, a click handler).
                    // => to get the Copy and Paste context menu actions working on Firefox,
                    // there should be no timeout here
                    if (browser_1.isFirefox) {
                        const mouseEvent = new mouseEvent_1.StandardMouseEvent((0, dom_1.getWindow)(this.element), e);
                        // Allowing right click to trigger the event causes the issue described below,
                        // but since the solution below does not work in FF, we must disable right click
                        if (mouseEvent.rightButton) {
                            return;
                        }
                        this.onClick(e);
                    }
                    // In all other cases, set timeout to allow context menu cancellation to trigger
                    // otherwise the action will destroy the menu and a second context menu
                    // will still trigger for right click.
                    else {
                        setTimeout(() => {
                            this.onClick(e);
                        }, 0);
                    }
                }));
                this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.CONTEXT_MENU, e => {
                    dom_1.EventHelper.stop(e, true);
                }));
            }, 100);
            this._register(this.runOnceToEnableMouseUp);
        }
        render(container) {
            super.render(container);
            if (!this.element) {
                return;
            }
            this.container = container;
            this.item = (0, dom_1.append)(this.element, (0, dom_1.$)('a.action-menu-item'));
            if (this._action.id === actions_1.Separator.ID) {
                // A separator is a presentation item
                this.item.setAttribute('role', 'presentation');
            }
            else {
                this.item.setAttribute('role', 'menuitem');
                if (this.mnemonic) {
                    this.item.setAttribute('aria-keyshortcuts', `${this.mnemonic}`);
                }
            }
            this.check = (0, dom_1.append)(this.item, (0, dom_1.$)('span.menu-item-check' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.menuSelection)));
            this.check.setAttribute('role', 'none');
            this.label = (0, dom_1.append)(this.item, (0, dom_1.$)('span.action-label'));
            if (this.options.label && this.options.keybinding) {
                (0, dom_1.append)(this.item, (0, dom_1.$)('span.keybinding')).textContent = this.options.keybinding;
            }
            // Adds mouse up listener to actually run the action
            this.runOnceToEnableMouseUp.schedule();
            this.updateClass();
            this.updateLabel();
            this.updateTooltip();
            this.updateEnabled();
            this.updateChecked();
            this.applyStyle();
        }
        blur() {
            super.blur();
            this.applyStyle();
        }
        focus() {
            super.focus();
            this.item?.focus();
            this.applyStyle();
        }
        updatePositionInSet(pos, setSize) {
            if (this.item) {
                this.item.setAttribute('aria-posinset', `${pos}`);
                this.item.setAttribute('aria-setsize', `${setSize}`);
            }
        }
        updateLabel() {
            if (!this.label) {
                return;
            }
            if (this.options.label) {
                (0, dom_1.clearNode)(this.label);
                let label = (0, iconLabels_1.stripIcons)(this.action.label);
                if (label) {
                    const cleanLabel = cleanMnemonic(label);
                    if (!this.options.enableMnemonics) {
                        label = cleanLabel;
                    }
                    this.label.setAttribute('aria-label', cleanLabel.replace(/&&/g, '&'));
                    const matches = exports.MENU_MNEMONIC_REGEX.exec(label);
                    if (matches) {
                        label = strings.escape(label);
                        // This is global, reset it
                        exports.MENU_ESCAPED_MNEMONIC_REGEX.lastIndex = 0;
                        let escMatch = exports.MENU_ESCAPED_MNEMONIC_REGEX.exec(label);
                        // We can't use negative lookbehind so if we match our negative and skip
                        while (escMatch && escMatch[1]) {
                            escMatch = exports.MENU_ESCAPED_MNEMONIC_REGEX.exec(label);
                        }
                        const replaceDoubleEscapes = (str) => str.replace(/&amp;&amp;/g, '&amp;');
                        if (escMatch) {
                            this.label.append(strings.ltrim(replaceDoubleEscapes(label.substr(0, escMatch.index)), ' '), (0, dom_1.$)('u', { 'aria-hidden': 'true' }, escMatch[3]), strings.rtrim(replaceDoubleEscapes(label.substr(escMatch.index + escMatch[0].length)), ' '));
                        }
                        else {
                            this.label.innerText = replaceDoubleEscapes(label).trim();
                        }
                        this.item?.setAttribute('aria-keyshortcuts', (!!matches[1] ? matches[1] : matches[3]).toLocaleLowerCase());
                    }
                    else {
                        this.label.innerText = label.replace(/&&/g, '&').trim();
                    }
                }
            }
        }
        updateTooltip() {
            // menus should function like native menus and they do not have tooltips
        }
        updateClass() {
            if (this.cssClass && this.item) {
                this.item.classList.remove(...this.cssClass.split(' '));
            }
            if (this.options.icon && this.label) {
                this.cssClass = this.action.class || '';
                this.label.classList.add('icon');
                if (this.cssClass) {
                    this.label.classList.add(...this.cssClass.split(' '));
                }
                this.updateEnabled();
            }
            else if (this.label) {
                this.label.classList.remove('icon');
            }
        }
        updateEnabled() {
            if (this.action.enabled) {
                if (this.element) {
                    this.element.classList.remove('disabled');
                    this.element.removeAttribute('aria-disabled');
                }
                if (this.item) {
                    this.item.classList.remove('disabled');
                    this.item.removeAttribute('aria-disabled');
                    this.item.tabIndex = 0;
                }
            }
            else {
                if (this.element) {
                    this.element.classList.add('disabled');
                    this.element.setAttribute('aria-disabled', 'true');
                }
                if (this.item) {
                    this.item.classList.add('disabled');
                    this.item.setAttribute('aria-disabled', 'true');
                }
            }
        }
        updateChecked() {
            if (!this.item) {
                return;
            }
            const checked = this.action.checked;
            this.item.classList.toggle('checked', !!checked);
            if (checked !== undefined) {
                this.item.setAttribute('role', 'menuitemcheckbox');
                this.item.setAttribute('aria-checked', checked ? 'true' : 'false');
            }
            else {
                this.item.setAttribute('role', 'menuitem');
                this.item.setAttribute('aria-checked', '');
            }
        }
        getMnemonic() {
            return this.mnemonic;
        }
        applyStyle() {
            const isSelected = this.element && this.element.classList.contains('focused');
            const fgColor = isSelected && this.menuStyle.selectionForegroundColor ? this.menuStyle.selectionForegroundColor : this.menuStyle.foregroundColor;
            const bgColor = isSelected && this.menuStyle.selectionBackgroundColor ? this.menuStyle.selectionBackgroundColor : undefined;
            const outline = isSelected && this.menuStyle.selectionBorderColor ? `1px solid ${this.menuStyle.selectionBorderColor}` : '';
            const outlineOffset = isSelected && this.menuStyle.selectionBorderColor ? `-1px` : '';
            if (this.item) {
                this.item.style.color = fgColor ?? '';
                this.item.style.backgroundColor = bgColor ?? '';
                this.item.style.outline = outline;
                this.item.style.outlineOffset = outlineOffset;
            }
            if (this.check) {
                this.check.style.color = fgColor ?? '';
            }
        }
    }
    class SubmenuMenuActionViewItem extends BaseMenuActionViewItem {
        constructor(action, submenuActions, parentData, submenuOptions, menuStyles) {
            super(action, action, submenuOptions, menuStyles);
            this.submenuActions = submenuActions;
            this.parentData = parentData;
            this.submenuOptions = submenuOptions;
            this.mysubmenu = null;
            this.submenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.mouseOver = false;
            this.expandDirection = submenuOptions && submenuOptions.expandDirection !== undefined ? submenuOptions.expandDirection : { horizontal: HorizontalDirection.Right, vertical: VerticalDirection.Below };
            this.showScheduler = new async_1.RunOnceScheduler(() => {
                if (this.mouseOver) {
                    this.cleanupExistingSubmenu(false);
                    this.createSubmenu(false);
                }
            }, 250);
            this.hideScheduler = new async_1.RunOnceScheduler(() => {
                if (this.element && (!(0, dom_1.isAncestor)((0, dom_1.getActiveElement)(), this.element) && this.parentData.submenu === this.mysubmenu)) {
                    this.parentData.parent.focus(false);
                    this.cleanupExistingSubmenu(true);
                }
            }, 750);
        }
        render(container) {
            super.render(container);
            if (!this.element) {
                return;
            }
            if (this.item) {
                this.item.classList.add('monaco-submenu-item');
                this.item.tabIndex = 0;
                this.item.setAttribute('aria-haspopup', 'true');
                this.updateAriaExpanded('false');
                this.submenuIndicator = (0, dom_1.append)(this.item, (0, dom_1.$)('span.submenu-indicator' + themables_1.ThemeIcon.asCSSSelector(codicons_1.Codicon.menuSubmenu)));
                this.submenuIndicator.setAttribute('aria-hidden', 'true');
            }
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(17 /* KeyCode.RightArrow */) || event.equals(3 /* KeyCode.Enter */)) {
                    dom_1.EventHelper.stop(e, true);
                    this.createSubmenu(true);
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if ((0, dom_1.getActiveElement)() === this.item) {
                    if (event.equals(17 /* KeyCode.RightArrow */) || event.equals(3 /* KeyCode.Enter */)) {
                        dom_1.EventHelper.stop(e, true);
                    }
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.MOUSE_OVER, e => {
                if (!this.mouseOver) {
                    this.mouseOver = true;
                    this.showScheduler.schedule();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.MOUSE_LEAVE, e => {
                this.mouseOver = false;
            }));
            this._register((0, dom_1.addDisposableListener)(this.element, dom_1.EventType.FOCUS_OUT, e => {
                if (this.element && !(0, dom_1.isAncestor)((0, dom_1.getActiveElement)(), this.element)) {
                    this.hideScheduler.schedule();
                }
            }));
            this._register(this.parentData.parent.onScroll(() => {
                if (this.parentData.submenu === this.mysubmenu) {
                    this.parentData.parent.focus(false);
                    this.cleanupExistingSubmenu(true);
                }
            }));
        }
        updateEnabled() {
            // override on submenu entry
            // native menus do not observe enablement on sumbenus
            // we mimic that behavior
        }
        open(selectFirst) {
            this.cleanupExistingSubmenu(false);
            this.createSubmenu(selectFirst);
        }
        onClick(e) {
            // stop clicking from trying to run an action
            dom_1.EventHelper.stop(e, true);
            this.cleanupExistingSubmenu(false);
            this.createSubmenu(true);
        }
        cleanupExistingSubmenu(force) {
            if (this.parentData.submenu && (force || (this.parentData.submenu !== this.mysubmenu))) {
                // disposal may throw if the submenu has already been removed
                try {
                    this.parentData.submenu.dispose();
                }
                catch { }
                this.parentData.submenu = undefined;
                this.updateAriaExpanded('false');
                if (this.submenuContainer) {
                    this.submenuDisposables.clear();
                    this.submenuContainer = undefined;
                }
            }
        }
        calculateSubmenuMenuLayout(windowDimensions, submenu, entry, expandDirection) {
            const ret = { top: 0, left: 0 };
            // Start with horizontal
            ret.left = (0, contextview_1.layout)(windowDimensions.width, submenu.width, { position: expandDirection.horizontal === HorizontalDirection.Right ? 0 /* LayoutAnchorPosition.Before */ : 1 /* LayoutAnchorPosition.After */, offset: entry.left, size: entry.width });
            // We don't have enough room to layout the menu fully, so we are overlapping the menu
            if (ret.left >= entry.left && ret.left < entry.left + entry.width) {
                if (entry.left + 10 + submenu.width <= windowDimensions.width) {
                    ret.left = entry.left + 10;
                }
                entry.top += 10;
                entry.height = 0;
            }
            // Now that we have a horizontal position, try layout vertically
            ret.top = (0, contextview_1.layout)(windowDimensions.height, submenu.height, { position: 0 /* LayoutAnchorPosition.Before */, offset: entry.top, size: 0 });
            // We didn't have enough room below, but we did above, so we shift down to align the menu
            if (ret.top + submenu.height === entry.top && ret.top + entry.height + submenu.height <= windowDimensions.height) {
                ret.top += entry.height;
            }
            return ret;
        }
        createSubmenu(selectFirstItem = true) {
            if (!this.element) {
                return;
            }
            if (!this.parentData.submenu) {
                this.updateAriaExpanded('true');
                this.submenuContainer = (0, dom_1.append)(this.element, (0, dom_1.$)('div.monaco-submenu'));
                this.submenuContainer.classList.add('menubar-menu-items-holder', 'context-view');
                // Set the top value of the menu container before construction
                // This allows the menu constructor to calculate the proper max height
                const computedStyles = (0, dom_1.getWindow)(this.parentData.parent.domNode).getComputedStyle(this.parentData.parent.domNode);
                const paddingTop = parseFloat(computedStyles.paddingTop || '0') || 0;
                // this.submenuContainer.style.top = `${this.element.offsetTop - this.parentData.parent.scrollOffset - paddingTop}px`;
                this.submenuContainer.style.zIndex = '1';
                this.submenuContainer.style.position = 'fixed';
                this.submenuContainer.style.top = '0';
                this.submenuContainer.style.left = '0';
                this.parentData.submenu = new Menu(this.submenuContainer, this.submenuActions.length ? this.submenuActions : [new actions_1.EmptySubmenuAction()], this.submenuOptions, this.menuStyle);
                // layout submenu
                const entryBox = this.element.getBoundingClientRect();
                const entryBoxUpdated = {
                    top: entryBox.top - paddingTop,
                    left: entryBox.left,
                    height: entryBox.height + 2 * paddingTop,
                    width: entryBox.width
                };
                const viewBox = this.submenuContainer.getBoundingClientRect();
                const window = (0, dom_1.getWindow)(this.element);
                const { top, left } = this.calculateSubmenuMenuLayout(new dom_1.Dimension(window.innerWidth, window.innerHeight), dom_1.Dimension.lift(viewBox), entryBoxUpdated, this.expandDirection);
                // subtract offsets caused by transform parent
                this.submenuContainer.style.left = `${left - viewBox.left}px`;
                this.submenuContainer.style.top = `${top - viewBox.top}px`;
                this.submenuDisposables.add((0, dom_1.addDisposableListener)(this.submenuContainer, dom_1.EventType.KEY_UP, e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(15 /* KeyCode.LeftArrow */)) {
                        dom_1.EventHelper.stop(e, true);
                        this.parentData.parent.focus();
                        this.cleanupExistingSubmenu(true);
                    }
                }));
                this.submenuDisposables.add((0, dom_1.addDisposableListener)(this.submenuContainer, dom_1.EventType.KEY_DOWN, e => {
                    const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (event.equals(15 /* KeyCode.LeftArrow */)) {
                        dom_1.EventHelper.stop(e, true);
                    }
                }));
                this.submenuDisposables.add(this.parentData.submenu.onDidCancel(() => {
                    this.parentData.parent.focus();
                    this.cleanupExistingSubmenu(true);
                }));
                this.parentData.submenu.focus(selectFirstItem);
                this.mysubmenu = this.parentData.submenu;
            }
            else {
                this.parentData.submenu.focus(false);
            }
        }
        updateAriaExpanded(value) {
            if (this.item) {
                this.item?.setAttribute('aria-expanded', value);
            }
        }
        applyStyle() {
            super.applyStyle();
            const isSelected = this.element && this.element.classList.contains('focused');
            const fgColor = isSelected && this.menuStyle.selectionForegroundColor ? this.menuStyle.selectionForegroundColor : this.menuStyle.foregroundColor;
            if (this.submenuIndicator) {
                this.submenuIndicator.style.color = fgColor ?? '';
            }
        }
        dispose() {
            super.dispose();
            this.hideScheduler.dispose();
            if (this.mysubmenu) {
                this.mysubmenu.dispose();
                this.mysubmenu = null;
            }
            if (this.submenuContainer) {
                this.submenuContainer = undefined;
            }
        }
    }
    class MenuSeparatorActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(context, action, options, menuStyles) {
            super(context, action, options);
            this.menuStyles = menuStyles;
        }
        render(container) {
            super.render(container);
            if (this.label) {
                this.label.style.borderBottomColor = this.menuStyles.separatorColor ? `${this.menuStyles.separatorColor}` : '';
            }
        }
    }
    function cleanMnemonic(label) {
        const regex = exports.MENU_MNEMONIC_REGEX;
        const matches = regex.exec(label);
        if (!matches) {
            return label;
        }
        const mnemonicInText = !matches[1];
        return label.replace(regex, mnemonicInText ? '$2$3' : '').trim();
    }
    function formatRule(c) {
        const fontCharacter = (0, codiconsUtil_1.getCodiconFontCharacters)()[c.id];
        return `.codicon-${c.id}:before { content: '\\${fontCharacter.toString(16)}'; }`;
    }
    function getMenuWidgetCSS(style, isForShadowDom) {
        let result = /* css */ `
.monaco-menu {
	font-size: 13px;
	border-radius: 5px;
	min-width: 160px;
}

${formatRule(codicons_1.Codicon.menuSelection)}
${formatRule(codicons_1.Codicon.menuSubmenu)}

.monaco-menu .monaco-action-bar {
	text-align: right;
	overflow: hidden;
	white-space: nowrap;
}

.monaco-menu .monaco-action-bar .actions-container {
	display: flex;
	margin: 0 auto;
	padding: 0;
	width: 100%;
	justify-content: flex-end;
}

.monaco-menu .monaco-action-bar.vertical .actions-container {
	display: inline-block;
}

.monaco-menu .monaco-action-bar.reverse .actions-container {
	flex-direction: row-reverse;
}

.monaco-menu .monaco-action-bar .action-item {
	cursor: pointer;
	display: inline-block;
	transition: transform 50ms ease;
	position: relative;  /* DO NOT REMOVE - this is the key to preventing the ghosting icon bug in Chrome 42 */
}

.monaco-menu .monaco-action-bar .action-item.disabled {
	cursor: default;
}

.monaco-menu .monaco-action-bar .action-item .icon,
.monaco-menu .monaco-action-bar .action-item .codicon {
	display: inline-block;
}

.monaco-menu .monaco-action-bar .action-item .codicon {
	display: flex;
	align-items: center;
}

.monaco-menu .monaco-action-bar .action-label {
	font-size: 11px;
	margin-right: 4px;
}

.monaco-menu .monaco-action-bar .action-item.disabled .action-label,
.monaco-menu .monaco-action-bar .action-item.disabled .action-label:hover {
	color: var(--vscode-disabledForeground);
}

/* Vertical actions */

.monaco-menu .monaco-action-bar.vertical {
	text-align: left;
}

.monaco-menu .monaco-action-bar.vertical .action-item {
	display: block;
}

.monaco-menu .monaco-action-bar.vertical .action-label.separator {
	display: block;
	border-bottom: 1px solid var(--vscode-menu-separatorBackground);
	padding-top: 1px;
	padding: 30px;
}

.monaco-menu .secondary-actions .monaco-action-bar .action-label {
	margin-left: 6px;
}

/* Action Items */
.monaco-menu .monaco-action-bar .action-item.select-container {
	overflow: hidden; /* somehow the dropdown overflows its container, we prevent it here to not push */
	flex: 1;
	max-width: 170px;
	min-width: 60px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 10px;
}

.monaco-menu .monaco-action-bar.vertical {
	margin-left: 0;
	overflow: visible;
}

.monaco-menu .monaco-action-bar.vertical .actions-container {
	display: block;
}

.monaco-menu .monaco-action-bar.vertical .action-item {
	padding: 0;
	transform: none;
	display: flex;
}

.monaco-menu .monaco-action-bar.vertical .action-item.active {
	transform: none;
}

.monaco-menu .monaco-action-bar.vertical .action-menu-item {
	flex: 1 1 auto;
	display: flex;
	height: 2em;
	align-items: center;
	position: relative;
	margin: 0 4px;
	border-radius: 4px;
}

.monaco-menu .monaco-action-bar.vertical .action-menu-item:hover .keybinding,
.monaco-menu .monaco-action-bar.vertical .action-menu-item:focus .keybinding {
	opacity: unset;
}

.monaco-menu .monaco-action-bar.vertical .action-label {
	flex: 1 1 auto;
	text-decoration: none;
	padding: 0 1em;
	background: none;
	font-size: 12px;
	line-height: 1;
}

.monaco-menu .monaco-action-bar.vertical .keybinding,
.monaco-menu .monaco-action-bar.vertical .submenu-indicator {
	display: inline-block;
	flex: 2 1 auto;
	padding: 0 1em;
	text-align: right;
	font-size: 12px;
	line-height: 1;
}

.monaco-menu .monaco-action-bar.vertical .submenu-indicator {
	height: 100%;
}

.monaco-menu .monaco-action-bar.vertical .submenu-indicator.codicon {
	font-size: 16px !important;
	display: flex;
	align-items: center;
}

.monaco-menu .monaco-action-bar.vertical .submenu-indicator.codicon::before {
	margin-left: auto;
	margin-right: -20px;
}

.monaco-menu .monaco-action-bar.vertical .action-item.disabled .keybinding,
.monaco-menu .monaco-action-bar.vertical .action-item.disabled .submenu-indicator {
	opacity: 0.4;
}

.monaco-menu .monaco-action-bar.vertical .action-label:not(.separator) {
	display: inline-block;
	box-sizing: border-box;
	margin: 0;
}

.monaco-menu .monaco-action-bar.vertical .action-item {
	position: static;
	overflow: visible;
}

.monaco-menu .monaco-action-bar.vertical .action-item .monaco-submenu {
	position: absolute;
}

.monaco-menu .monaco-action-bar.vertical .action-label.separator {
	width: 100%;
	height: 0px !important;
	opacity: 1;
}

.monaco-menu .monaco-action-bar.vertical .action-label.separator.text {
	padding: 0.7em 1em 0.1em 1em;
	font-weight: bold;
	opacity: 1;
}

.monaco-menu .monaco-action-bar.vertical .action-label:hover {
	color: inherit;
}

.monaco-menu .monaco-action-bar.vertical .menu-item-check {
	position: absolute;
	visibility: hidden;
	width: 1em;
	height: 100%;
}

.monaco-menu .monaco-action-bar.vertical .action-menu-item.checked .menu-item-check {
	visibility: visible;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* Context Menu */

.context-view.monaco-menu-container {
	outline: 0;
	border: none;
	animation: fadeIn 0.083s linear;
	-webkit-app-region: no-drag;
}

.context-view.monaco-menu-container :focus,
.context-view.monaco-menu-container .monaco-action-bar.vertical:focus,
.context-view.monaco-menu-container .monaco-action-bar.vertical :focus {
	outline: 0;
}

.hc-black .context-view.monaco-menu-container,
.hc-light .context-view.monaco-menu-container,
:host-context(.hc-black) .context-view.monaco-menu-container,
:host-context(.hc-light) .context-view.monaco-menu-container {
	box-shadow: none;
}

.hc-black .monaco-menu .monaco-action-bar.vertical .action-item.focused,
.hc-light .monaco-menu .monaco-action-bar.vertical .action-item.focused,
:host-context(.hc-black) .monaco-menu .monaco-action-bar.vertical .action-item.focused,
:host-context(.hc-light) .monaco-menu .monaco-action-bar.vertical .action-item.focused {
	background: none;
}

/* Vertical Action Bar Styles */

.monaco-menu .monaco-action-bar.vertical {
	padding: 4px 0;
}

.monaco-menu .monaco-action-bar.vertical .action-menu-item {
	height: 2em;
}

.monaco-menu .monaco-action-bar.vertical .action-label:not(.separator),
.monaco-menu .monaco-action-bar.vertical .keybinding {
	font-size: inherit;
	padding: 0 2em;
}

.monaco-menu .monaco-action-bar.vertical .menu-item-check {
	font-size: inherit;
	width: 2em;
}

.monaco-menu .monaco-action-bar.vertical .action-label.separator {
	font-size: inherit;
	margin: 5px 0 !important;
	padding: 0;
	border-radius: 0;
}

.linux .monaco-menu .monaco-action-bar.vertical .action-label.separator,
:host-context(.linux) .monaco-menu .monaco-action-bar.vertical .action-label.separator {
	margin-left: 0;
	margin-right: 0;
}

.monaco-menu .monaco-action-bar.vertical .submenu-indicator {
	font-size: 60%;
	padding: 0 1.8em;
}

.linux .monaco-menu .monaco-action-bar.vertical .submenu-indicator,
:host-context(.linux) .monaco-menu .monaco-action-bar.vertical .submenu-indicator {
	height: 100%;
	mask-size: 10px 10px;
	-webkit-mask-size: 10px 10px;
}

.monaco-menu .action-item {
	cursor: default;
}`;
        if (isForShadowDom) {
            // Only define scrollbar styles when used inside shadow dom,
            // otherwise leave their styling to the global workbench styling.
            result += `
			/* Arrows */
			.monaco-scrollable-element > .scrollbar > .scra {
				cursor: pointer;
				font-size: 11px !important;
			}

			.monaco-scrollable-element > .visible {
				opacity: 1;

				/* Background rule added for IE9 - to allow clicks on dom node */
				background:rgba(0,0,0,0);

				transition: opacity 100ms linear;
			}
			.monaco-scrollable-element > .invisible {
				opacity: 0;
				pointer-events: none;
			}
			.monaco-scrollable-element > .invisible.fade {
				transition: opacity 800ms linear;
			}

			/* Scrollable Content Inset Shadow */
			.monaco-scrollable-element > .shadow {
				position: absolute;
				display: none;
			}
			.monaco-scrollable-element > .shadow.top {
				display: block;
				top: 0;
				left: 3px;
				height: 3px;
				width: 100%;
			}
			.monaco-scrollable-element > .shadow.left {
				display: block;
				top: 3px;
				left: 0;
				height: 100%;
				width: 3px;
			}
			.monaco-scrollable-element > .shadow.top-left-corner {
				display: block;
				top: 0;
				left: 0;
				height: 3px;
				width: 3px;
			}
		`;
            // Scrollbars
            const scrollbarShadowColor = style.scrollbarShadow;
            if (scrollbarShadowColor) {
                result += `
				.monaco-scrollable-element > .shadow.top {
					box-shadow: ${scrollbarShadowColor} 0 6px 6px -6px inset;
				}

				.monaco-scrollable-element > .shadow.left {
					box-shadow: ${scrollbarShadowColor} 6px 0 6px -6px inset;
				}

				.monaco-scrollable-element > .shadow.top.left {
					box-shadow: ${scrollbarShadowColor} 6px 6px 6px -6px inset;
				}
			`;
            }
            const scrollbarSliderBackgroundColor = style.scrollbarSliderBackground;
            if (scrollbarSliderBackgroundColor) {
                result += `
				.monaco-scrollable-element > .scrollbar > .slider {
					background: ${scrollbarSliderBackgroundColor};
				}
			`;
            }
            const scrollbarSliderHoverBackgroundColor = style.scrollbarSliderHoverBackground;
            if (scrollbarSliderHoverBackgroundColor) {
                result += `
				.monaco-scrollable-element > .scrollbar > .slider:hover {
					background: ${scrollbarSliderHoverBackgroundColor};
				}
			`;
            }
            const scrollbarSliderActiveBackgroundColor = style.scrollbarSliderActiveBackground;
            if (scrollbarSliderActiveBackgroundColor) {
                result += `
				.monaco-scrollable-element > .scrollbar > .slider.active {
					background: ${scrollbarSliderActiveBackgroundColor};
				}
			`;
            }
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL21lbnUvbWVudS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE0K0JoRyxzQ0FXQztJQUVELGdDQUdDO0lBbitCWSxRQUFBLG1CQUFtQixHQUFHLGlDQUFpQyxDQUFDO0lBQ3hELFFBQUEsMkJBQTJCLEdBQUcsMEJBQTBCLENBQUM7SUFJdEUsSUFBWSxtQkFHWDtJQUhELFdBQVksbUJBQW1CO1FBQzlCLCtEQUFLLENBQUE7UUFDTCw2REFBSSxDQUFBO0lBQ0wsQ0FBQyxFQUhXLG1CQUFtQixtQ0FBbkIsbUJBQW1CLFFBRzlCO0lBRUQsSUFBWSxpQkFHWDtJQUhELFdBQVksaUJBQWlCO1FBQzVCLDJEQUFLLENBQUE7UUFDTCwyREFBSyxDQUFBO0lBQ04sQ0FBQyxFQUhXLGlCQUFpQixpQ0FBakIsaUJBQWlCLFFBRzVCO0lBbUNZLFFBQUEsa0JBQWtCLEdBQWdCO1FBQzlDLFdBQVcsRUFBRSxTQUFTO1FBQ3RCLFdBQVcsRUFBRSxTQUFTO1FBQ3RCLGVBQWUsRUFBRSxTQUFTO1FBQzFCLGVBQWUsRUFBRSxTQUFTO1FBQzFCLHdCQUF3QixFQUFFLFNBQVM7UUFDbkMsd0JBQXdCLEVBQUUsU0FBUztRQUNuQyxvQkFBb0IsRUFBRSxTQUFTO1FBQy9CLGNBQWMsRUFBRSxTQUFTO1FBQ3pCLGVBQWUsRUFBRSxTQUFTO1FBQzFCLHlCQUF5QixFQUFFLFNBQVM7UUFDcEMsOEJBQThCLEVBQUUsU0FBUztRQUN6QywrQkFBK0IsRUFBRSxTQUFTO0tBQzFDLENBQUM7SUFPRixNQUFhLElBQUssU0FBUSxxQkFBUztRQU9sQyxZQUFZLFNBQXNCLEVBQUUsT0FBK0IsRUFBRSxPQUFxQixFQUFtQixVQUF1QjtZQUNuSSxTQUFTLENBQUMsU0FBUyxD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