/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/widget", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/event", "vs/base/browser/dom", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./toggle"], function (require, exports, actionViewItems_1, widget_1, codicons_1, themables_1, event_1, dom_1, updatableHoverWidget_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckboxActionViewItem = exports.Checkbox = exports.Toggle = exports.ToggleActionViewItem = exports.unthemedToggleStyles = void 0;
    exports.unthemedToggleStyles = {
        inputActiveOptionBorder: '#007ACC00',
        inputActiveOptionForeground: '#FFFFFF',
        inputActiveOptionBackground: '#0E639C50'
    };
    class ToggleActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(context, action, options) {
            super(context, action, options);
            this.toggle = this._register(new Toggle({
                actionClassName: this._action.class,
                isChecked: !!this._action.checked,
                title: this.options.keybinding ? `${this._action.label} (${this.options.keybinding})` : this._action.label,
                notFocusable: true,
                inputActiveOptionBackground: options.toggleStyles?.inputActiveOptionBackground,
                inputActiveOptionBorder: options.toggleStyles?.inputActiveOptionBorder,
                inputActiveOptionForeground: options.toggleStyles?.inputActiveOptionForeground,
                hoverDelegate: options.hoverDelegate
            }));
            this._register(this.toggle.onChange(() => this._action.checked = !!this.toggle && this.toggle.checked));
        }
        render(container) {
            this.element = container;
            this.element.appendChild(this.toggle.domNode);
        }
        updateEnabled() {
            if (this.toggle) {
                if (this.isEnabled()) {
                    this.toggle.enable();
                }
                else {
                    this.toggle.disable();
                }
            }
        }
        updateChecked() {
            this.toggle.checked = !!this._action.checked;
        }
        focus() {
            this.toggle.domNode.tabIndex = 0;
            this.toggle.focus();
        }
        blur() {
            this.toggle.domNode.tabIndex = -1;
            this.toggle.domNode.blur();
        }
        setFocusable(focusable) {
            this.toggle.domNode.tabIndex = focusable ? 0 : -1;
        }
    }
    exports.ToggleActionViewItem = ToggleActionViewItem;
    class Toggle extends widget_1.Widget {
        constructor(opts) {
            super();
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this._onKeyDown = this._register(new event_1.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._opts = opts;
            this._checked = this._opts.isChecked;
            const classes = ['monaco-custom-toggle'];
            if (this._opts.icon) {
                this._icon = this._opts.icon;
                classes.push(...themables_1.ThemeIcon.asClassNameArray(this._icon));
            }
            if (this._opts.actionClassName) {
                classes.push(...this._opts.actionClassName.split(' '));
            }
            if (this._checked) {
                classes.push('checked');
            }
            this.domNode = document.createElement('div');
            this._hover = this._register((0, updatableHoverWidget_1.setupCustomHover)(opts.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('mouse'), this.domNode, this._opts.title));
            this.domNode.classList.add(...classes);
            if (!this._opts.notFocusable) {
                this.domNode.tabIndex = 0;
            }
            this.domNode.setAttribute('role', 'checkbox');
            this.domNode.setAttribute('aria-checked', String(this._checked));
            this.domNode.setAttribute('aria-label', this._opts.title);
            this.applyStyles();
            this.onclick(this.domNode, (ev) => {
                if (this.enabled) {
                    this.checked = !this._checked;
                    this._onChange.fire(false);
                    ev.preventDefault();
                }
            });
            this._register(this.ignoreGesture(this.domNode));
            this.onkeydown(this.domNode, (keyboardEvent) => {
                if (keyboardEvent.keyCode === 10 /* KeyCode.Space */ || keyboardEvent.keyCode === 3 /* KeyCode.Enter */) {
                    this.checked = !this._checked;
                    this._onChange.fire(true);
                    keyboardEvent.preventDefault();
                    keyboardEvent.stopPropagation();
                    return;
                }
                this._onKeyDown.fire(keyboardEvent);
            });
        }
        get enabled() {
            return this.domNode.getAttribute('aria-disabled') !== 'true';
        }
        focus() {
            this.domNode.focus();
        }
        get checked() {
            return this._checked;
        }
        set checked(newIsChecked) {
            this._checked = newIsChecked;
            this.domNode.setAttribute('aria-checked', String(this._checked));
            this.domNode.classList.toggle('checked', this._checked);
            this.applyStyles();
        }
        setIcon(icon) {
            if (this._icon) {
                this.domNode.classList.remove(...themables_1.ThemeIcon.asClassNameArray(this._icon));
            }
            this._icon = icon;
            if (this._icon) {
                this.domNode.classList.add(...themables_1.ThemeIcon.asClassNameArray(this._icon));
            }
        }
        width() {
            return 2 /*margin left*/ + 2 /*border*/ + 2 /*padding*/ + 16 /* icon width */;
        }
        applyStyles() {
            if (this.domNode) {
                this.domNode.style.borderColor = (this._checked && this._opts.inputActiveOptionBorder) || '';
                this.domNode.style.color = (this._checked && this._opts.inputActiveOptionForeground) || 'inherit';
                this.domNode.style.backgroundColor = (this._checked && this._opts.inputActiveOptionBackground) || '';
            }
        }
        enable() {
            this.domNode.setAttribute('aria-disabled', String(false));
        }
        disable() {
            this.domNode.setAttribute('aria-disabled', String(true));
        }
        setTitle(newTitle) {
            this._hover.update(newTitle);
            this.domNode.setAttribute('aria-label', newTitle);
        }
    }
    exports.Toggle = Toggle;
    class Checkbox extends widget_1.Widget {
        constructor(title, isChecked, styles) {
            super();
            this.title = title;
            this.isChecked = isChecked;
            this._onChange = this._register(new event_1.Emitter());
            this.onChange = this._onChange.event;
            this.checkbox = this._register(new Toggle({ title: this.title, isChecked: this.isChecked, icon: codicons_1.Codicon.check, actionClassName: 'monaco-checkbox', ...exports.unthemedToggleStyles }));
            this.domNode = this.checkbox.domNode;
            this.styles = styles;
            this.applyStyles();
            this._register(this.checkbox.onChange(keyboard => {
                this.applyStyles();
                this._onChange.fire(keyboard);
            }));
        }
        get checked() {
            return this.checkbox.checked;
        }
        set checked(newIsChecked) {
            this.checkbox.checked = newIsChecked;
            this.applyStyles();
        }
        focus() {
            this.domNode.focus();
        }
        hasFocus() {
            return (0, dom_1.isActiveElement)(this.domNode);
        }
        enable() {
            this.checkbox.enable();
        }
        disable() {
            this.checkbox.disable();
        }
        applyStyles() {
            this.domNode.style.color = this.styles.checkboxForeground || '';
            this.domNode.style.backgroundColor = this.styles.checkboxBackground || '';
            this.domNode.style.borderColor = this.styles.checkboxBorder || '';
        }
    }
    exports.Checkbox = Checkbox;
    class CheckboxActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(context, action, options) {
            super(context, action, options);
            this.toggle = this._register(new Checkbox(this._action.label, !!this._action.checked, options.checkboxStyles));
            this._register(this.toggle.onChange(() => this.onChange()));
        }
        render(container) {
            this.element = container;
            this.element.classList.add('checkbox-action-item');
            this.element.appendChild(this.toggle.domNode);
            if (this.options.label && this._action.label) {
                const label = this.element.appendChild((0, dom_1.$)('span.checkbox-label', undefined, this._action.label));
                this._register((0, dom_1.addDisposableListener)(label, dom_1.EventType.CLICK, (e) => {
                    this.toggle.checked = !this.toggle.checked;
                    e.stopPropagation();
                    e.preventDefault();
                    this.onChange();
                }));
            }
            this.updateEnabled();
            this.updateClass();
            this.updateChecked();
        }
        onChange() {
            this._action.checked = !!this.toggle && this.toggle.checked;
            this.actionRunner.run(this._action, this._context);
        }
        updateEnabled() {
            if (this.isEnabled()) {
                this.toggle.enable();
            }
            else {
                this.toggle.disable();
            }
            if (this.action.enabled) {
                this.element?.classList.remove('disabled');
            }
            else {
                this.element?.classList.add('disabled');
            }
        }
        updateChecked() {
            this.toggle.checked = !!this._action.checked;
        }
        updateClass() {
            if (this.cssClass) {
                this.toggle.domNode.classList.remove(...this.cssClass.split(' '));
            }
            this.cssClass = this.getClass();
            if (this.cssClass) {
                this.toggle.domNode.classList.add(...this.cssClass.split(' '));
            }
        }
        focus() {
            this.toggle.domNode.tabIndex = 0;
            this.toggle.focus();
        }
        blur() {
            this.toggle.domNode.tabIndex = -1;
            this.toggle.domNode.blur();
        }
        setFocusable(focusable) {
            this.toggle.domNode.tabIndex = focusable ? 0 : -1;
        }
    }
    exports.CheckboxActionViewItem = CheckboxActionViewItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvdG9nZ2xlL3RvZ2dsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQ25GLFFBQUEsb0JBQW9CLEdBQUc7UUFDbkMsdUJBQXVCLEVBQUUsV0FBVztRQUNwQywyQkFBMkIsRUFBRSxTQUFTO1FBQ3RDLDJCQUEyQixFQUFFLFdBQVc7S0FDeEMsQ0FBQztJQUVGLE1BQWEsb0JBQXFCLFNBQVEsb0NBQWtCO1FBSTNELFlBQVksT0FBWSxFQUFFLE1BQWUsRUFBRSxPQUErQjtZQUN6RSxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVoQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUM7Z0JBQ3ZDLGVBQWUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUs7Z0JBQ25DLFNBQVMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPO2dCQUNqQyxLQUFLLEVBQTJCLElBQUksQ0FBQyxPQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUE4QixJQUFJLENBQUMsT0FBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUs7Z0JBQzlKLFlBQVksRUFBRSxJQUFJO2dCQUNsQiwyQkFBMkIsRUFBRSxPQUFPLENBQUMsWUFBWSxFQUFFLDJCQUEyQjtnQkFDOUUsdUJBQXVCLEVBQUUsT0FBTyxDQUFDLFlBQVksRUFBRSx1QkFBdUI7Z0JBQ3RFLDJCQUEyQixFQUFFLE9BQU8sQ0FBQyxZQUFZLEVBQUUsMkJBQTJCO2dCQUM5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