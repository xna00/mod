/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/dompurify/dompurify", "vs/base/browser/keyboardEvent", "vs/base/browser/markdownRenderer", "vs/base/browser/touch", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/nls", "vs/css!./button"], function (require, exports, dom_1, dompurify_1, keyboardEvent_1, markdownRenderer_1, touch_1, hoverDelegateFactory_1, updatableHoverWidget_1, iconLabels_1, actions_1, codicons_1, color_1, event_1, htmlContent_1, lifecycle_1, themables_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ButtonBar = exports.ButtonWithDescription = exports.ButtonWithDropdown = exports.Button = exports.unthemedButtonStyles = void 0;
    exports.unthemedButtonStyles = {
        buttonBackground: '#0E639C',
        buttonHoverBackground: '#006BB3',
        buttonSeparator: color_1.Color.white.toString(),
        buttonForeground: color_1.Color.white.toString(),
        buttonBorder: undefined,
        buttonSecondaryBackground: undefined,
        buttonSecondaryForeground: undefined,
        buttonSecondaryHoverBackground: undefined
    };
    class Button extends lifecycle_1.Disposable {
        get onDidClick() { return this._onDidClick.event; }
        get onDidEscape() { return this._onDidEscape.event; }
        constructor(container, options) {
            super();
            this._label = '';
            this._onDidClick = this._register(new event_1.Emitter());
            this._onDidEscape = this._register(new event_1.Emitter());
            this.options = options;
            this._element = document.createElement('a');
            this._element.classList.add('monaco-button');
            this._element.tabIndex = 0;
            this._element.setAttribute('role', 'button');
            this._element.classList.toggle('secondary', !!options.secondary);
            const background = options.secondary ? options.buttonSecondaryBackground : options.buttonBackground;
            const foreground = options.secondary ? options.buttonSecondaryForeground : options.buttonForeground;
            this._element.style.color = foreground || '';
            this._element.style.backgroundColor = background || '';
            if (options.supportShortLabel) {
                this._labelShortElement = document.createElement('div');
                this._labelShortElement.classList.add('monaco-button-label-short');
                this._element.appendChild(this._labelShortElement);
                this._labelElement = document.createElement('div');
                this._labelElement.classList.add('monaco-button-label');
                this._element.appendChild(this._labelElement);
                this._element.classList.add('monaco-text-button-with-short-label');
            }
            if (typeof options.title === 'string') {
                this.setTitle(options.title);
            }
            if (typeof options.ariaLabel === 'string') {
                this._element.setAttribute('aria-label', options.ariaLabel);
            }
            container.appendChild(this._element);
            this._register(touch_1.Gesture.addTarget(this._element));
            [dom_1.EventType.CLICK, touch_1.EventType.Tap].forEach(eventType => {
                this._register((0, dom_1.addDisposableListener)(this._element, eventType, e => {
                    if (!this.enabled) {
                        dom_1.EventHelper.stop(e);
                        return;
                    }
                    this._onDidClick.fire(e);
                }));
            });
            this._register((0, dom_1.addDisposableListener)(this._element, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let eventHandled = false;
                if (this.enabled && (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */))) {
                    this._onDidClick.fire(e);
                    eventHandled = true;
                }
                else if (event.equals(9 /* KeyCode.Escape */)) {
                    this._onDidEscape.fire(e);
                    this._element.blur();
                    eventHandled = true;
                }
                if (eventHandled) {
                    dom_1.EventHelper.stop(event, true);
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this._element, dom_1.EventType.MOUSE_OVER, e => {
                if (!this._element.classList.contains('disabled')) {
                    this.updateBackground(true);
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this._element, dom_1.EventType.MOUSE_OUT, e => {
                this.updateBackground(false); // restore standard styles
            }));
            // Also set hover background when button is focused for feedback
            this.focusTracker = this._register((0, dom_1.trackFocus)(this._element));
            this._register(this.focusTracker.onDidFocus(() => { if (this.enabled) {
                this.updateBackground(true);
            } }));
            this._register(this.focusTracker.onDidBlur(() => { if (this.enabled) {
                this.updateBackground(false);
            } }));
        }
        dispose() {
            super.dispose();
            this._element.remove();
        }
        getContentElements(content) {
            const elements = [];
            for (let segment of (0, iconLabels_1.renderLabelWithIcons)(content)) {
                if (typeof (segment) === 'string') {
                    segment = segment.trim();
                    // Ignore empty segment
                    if (segment === '') {
                        continue;
                    }
                    // Convert string segments to <span> nodes
                    const node = document.createElement('span');
                    node.textContent = segment;
                    elements.push(node);
                }
                else {
                    elements.push(segment);
                }
            }
            return elements;
        }
        updateBackground(hover) {
            let background;
            if (this.options.secondary) {
                background = hover ? this.options.buttonSecondaryHoverBackground : this.options.buttonSecondaryBackground;
            }
            else {
                background = hover ? this.options.buttonHoverBackground : this.options.buttonBackground;
            }
            if (background) {
                this._element.style.backgroundColor = background;
            }
        }
        get element() {
            return this._element;
        }
        set label(value) {
            if (this._label === value) {
                return;
            }
            if ((0, htmlContent_1.isMarkdownString)(this._label) && (0, htmlContent_1.isMarkdownString)(value) && (0, htmlContent_1.markdownStringEqual)(this._label, value)) {
                return;
            }
            this._element.classList.add('monaco-text-button');
            const labelElement = this.options.supportShortLabel ? this._labelElement : this._element;
            if ((0, htmlContent_1.isMarkdownString)(value)) {
                const rendered = (0, markdownRenderer_1.renderMarkdown)(value, { inline: true });
                rendered.dispose();
                // Don't include outer `<p>`
                const root = rendered.element.querySelector('p')?.innerHTML;
                if (root) {
                    // Only allow a very limited set of inline html tags
                    const sanitized = (0, dompurify_1.sanitize)(root, { ADD_TAGS: ['b', 'i', 'u', 'code', 'span'], ALLOWED_ATTR: ['class'], RETURN_TRUSTED_TYPE: true });
                    labelElement.innerHTML = sanitized;
                }
                else {
                    (0, dom_1.reset)(labelElement);
                }
            }
            else {
                if (this.options.supportIcons) {
                    (0, dom_1.reset)(labelElement, ...this.getContentElements(value));
                }
                else {
                    labelElement.textContent = value;
                }
            }
            let title = '';
            if (typeof this.options.title === 'string') {
                title = this.options.title;
            }
            else if (this.options.title) {
                title = (0, markdownRenderer_1.renderStringAsPlaintext)(value);
            }
            this.setTitle(title);
            if (typeof this.options.ariaLabel === 'string') {
                this._element.setAttribute('aria-label', this.options.ariaLabel);
            }
            else if (this.options.ariaLabel) {
                this._element.setAttribute('aria-label', title);
            }
            this._label = value;
        }
        get label() {
            return this._label;
        }
        set labelShort(value) {
            if (!this.options.supportShortLabel || !this._labelShortElement) {
                return;
            }
            if (this.options.supportIcons) {
                (0, dom_1.reset)(this._labelShortElement, ...this.getContentElements(value));
            }
            else {
                this._labelShortElement.textContent = value;
            }
        }
        set icon(icon) {
            this._element.classList.add(...themables_1.ThemeIcon.asClassNameArray(icon));
        }
        set enabled(value) {
            if (value) {
                this._element.classList.remove('disabled');
                this._element.setAttribute('aria-disabled', String(false));
                this._element.tabIndex = 0;
            }
            else {
                this._element.classList.add('disabled');
                this._element.setAttribute('aria-disabled', String(true));
            }
        }
        get enabled() {
            return !this._element.classList.contains('disabled');
        }
        setTitle(title) {
            if (!this._hover && title !== '') {
                this._hover = this._register((0, updatableHoverWidget_1.setupCustomHover)(this.options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this._element, title));
            }
            else if (this._hover) {
                this._hover.update(title);
            }
        }
        focus() {
            this._element.focus();
        }
        hasFocus() {
            return (0, dom_1.isActiveElement)(this._element);
        }
    }
    exports.Button = Button;
    class ButtonWithDropdown extends lifecycle_1.Disposable {
        constructor(container, options) {
            super();
            this._onDidClick = this._register(new event_1.Emitter());
            this.onDidClick = this._onDidClick.event;
            this.element = document.createElement('div');
            this.element.classList.add('monaco-button-dropdown');
            container.appendChild(this.element);
            this.button = this._register(new Button(this.element, options));
            this._register(this.button.onDidClick(e => this._onDidClick.fire(e)));
            this.action = this._register(new actions_1.Action('primaryAction', (0, markdownRenderer_1.renderStringAsPlaintext)(this.button.label), undefined, true, async () => this._onDidClick.fire(undefined)));
            this.separatorContainer = document.createElement('div');
            this.separatorContainer.classList.add('monaco-button-dropdown-separator');
            this.separator = document.createElement('div');
            this.separatorContainer.appendChild(this.separator);
            this.element.appendChild(this.separatorContainer);
            // Separator styles
            const border = options.buttonBorder;
            if (border) {
                this.separatorContainer.style.borderTop = '1px solid ' + border;
                this.separatorContainer.style.borderBottom = '1px solid ' + border;
            }
            const buttonBackground = options.secondary ? options.buttonSecondaryBackground : options.buttonBackground;
            this.separatorContainer.style.backgroundColor = buttonBackground ?? '';
            this.separator.style.backgroundColor = options.buttonSeparator ?? '';
            this.dropdownButton = this._register(new Button(this.element, { ...options, title: false, supportIcons: true }));
            this._register((0, updatableHoverWidget_1.setupCustomHover)((0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.dropdownButton.element, (0, nls_1.localize)("button dropdown more actions", 'More Actions...')));
            this.dropdownButton.element.setAttribute('aria-haspopup', 'true');
            this.dropdownButton.element.setAttribute('aria-expanded', 'false');
            this.dropdownButton.element.classList.add('monaco-dropdown-button');
            this.dropdownButton.icon = codicons_1.Codicon.dropDownButton;
            this._register(this.dropdownButton.onDidClick(e => {
                options.contextMenuProvider.showContextMenu({
                    getAnchor: () => this.dropdownButton.element,
                    getActions: () => options.addPrimaryActionToDropdown === false ? [...options.actions] : [this.action, ...options.actions],
                    actionRunner: options.actionRunner,
                    onHide: () => this.dropdownButton.element.setAttribute('aria-expanded', 'false')
                });
                this.dropdownButton.element.setAttribute('aria-expanded', 'true');
            }));
        }
        dispose() {
            super.dispose();
            this.element.remove();
        }
        set label(value) {
            this.button.label = value;
            this.action.label = value;
        }
        set icon(icon) {
            this.button.icon = icon;
        }
        set enabled(enabled) {
            this.button.enabled = enabled;
            this.dropdownButton.enabled = enabled;
            this.element.classList.toggle('disabled', !enabled);
        }
        get enabled() {
            return this.button.enabled;
        }
        focus() {
            this.button.focus();
        }
        hasFocus() {
            return this.button.hasFocus() || this.dropdownButton.hasFocus();
        }
    }
    exports.ButtonWithDropdown = ButtonWithDropdown;
    class ButtonWithDescription {
        constructor(container, options) {
            this.options = options;
            this._element = document.createElement('div');
            this._element.classList.add('monaco-description-button');
            this._button = new Button(this._element, options);
            this._descriptionElement = document.createElement('div');
            this._descriptionElement.classList.add('monaco-button-description');
            this._element.appendChild(this._descriptionElement);
            container.appendChild(this._element);
        }
        get onDidClick() {
            return this._button.onDidClick;
        }
        get element() {
            return this._element;
        }
        set label(value) {
            this._button.label = value;
        }
        set icon(icon) {
            this._button.icon = icon;
        }
        get enabled() {
            return this._button.enabled;
        }
        set enabled(enabled) {
            this._button.enabled = enabled;
        }
        focus() {
            this._button.focus();
        }
        hasFocus() {
            return this._button.hasFocus();
        }
        dispose() {
            this._button.dispose();
        }
        set description(value) {
            if (this.options.supportIcons) {
                (0, dom_1.reset)(this._descriptionElement, ...(0, iconLabels_1.renderLabelWithIcons)(value));
            }
            else {
                this._descriptionElement.textContent = value;
            }
        }
    }
    exports.ButtonWithDescription = ButtonWithDescription;
    class ButtonBar {
        constructor(container) {
            this.container = container;
            this._buttons = [];
            this._buttonStore = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this._buttonStore.dispose();
        }
        get buttons() {
            return this._buttons;
        }
        clear() {
            this._buttonStore.clear();
            this._buttons.length = 0;
        }
        addButton(options) {
            const button = this._buttonStore.add(new Button(this.container, options));
            this.pushButton(button);
            return button;
        }
        addButtonWithDescription(options) {
            const button = this._buttonStore.add(new ButtonWithDescription(this.container, options));
            this.pushButton(button);
            return button;
        }
        addButtonWithDropdown(options) {
            const button = this._buttonStore.add(new ButtonWithDropdown(this.container, options));
            this.pushButton(button);
            return button;
        }
        pushButton(button) {
            this._buttons.push(button);
            const index = this._buttons.length - 1;
            this._buttonStore.add((0, dom_1.addDisposableListener)(button.element, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let eventHandled = true;
                // Next / Previous Button
                let buttonIndexToFocus;
                if (event.equals(15 /* KeyCode.LeftArrow */)) {
                    buttonIndexToFocus = index > 0 ? index - 1 : this._buttons.length - 1;
                }
                else if (event.equals(17 /* KeyCode.RightArrow */)) {
                    buttonIndexToFocus = index === this._buttons.length - 1 ? 0 : index + 1;
                }
                else {
                    eventHandled = false;
                }
                if (eventHandled && typeof buttonIndexToFocus === 'number') {
                    this._buttons[buttonIndexToFocus].focus();
                    dom_1.EventHelper.stop(e, true);
                }
            }));
        }
    }
    exports.ButtonBar = ButtonBar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnV0dG9uLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvYnV0dG9uL2J1dHRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQ25GLFFBQUEsb0JBQW9CLEdBQWtCO1FBQ2xELGdCQUFnQixFQUFFLFNBQVM7UUFDM0IscUJBQXFCLEVBQUUsU0FBUztRQUNoQyxlQUFlLEVBQUUsYUFBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7UUFDdkMsZ0JBQWdCLEVBQUUsYUFBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7UUFDeEMsWUFBWSxFQUFFLFNBQVM7UUFDdkIseUJBQXlCLEVBQUUsU0FBUztRQUNwQyx5QkFBeUIsRUFBRSxTQUFTO1FBQ3BDLDhCQUE4QixFQUFFLFNBQVM7S0FDekMsQ0FBQztJQWtCRixNQUFhLE1BQU8sU0FBUSxzQkFBVTtRQVVyQyxJQUFJLFVBQVUsS0FBdUIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFHckUsSUFBSSxXQUFXLEtBQXVCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBSXZFLFlBQVksU0FBc0IsRUFBRSxPQUF1QjtZQUMxRCxLQUFLLEVBQUUsQ0FBQztZQWRDLFdBQU0sR0FBNkIsRUFBRSxDQUFDO1lBS3hDLGdCQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUyxDQUFDLENBQUM7WUFHbkQsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFTLENBQUMsQ0FBQztZQVEzRCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztZQUV2QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENB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