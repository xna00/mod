/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/touch", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/base/browser/ui/hover/updatableHoverWidget", "vs/base/browser/ui/selectBox/selectBox", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/css!./actionbar"], function (require, exports, browser_1, dnd_1, dom_1, touch_1, hoverDelegateFactory_1, updatableHoverWidget_1, selectBox_1, actions_1, lifecycle_1, platform, types, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectActionViewItem = exports.ActionViewItem = exports.BaseActionViewItem = void 0;
    class BaseActionViewItem extends lifecycle_1.Disposable {
        get action() {
            return this._action;
        }
        constructor(context, action, options = {}) {
            super();
            this.options = options;
            this._context = context || this;
            this._action = action;
            if (action instanceof actions_1.Action) {
                this._register(action.onDidChange(event => {
                    if (!this.element) {
                        // we have not been rendered yet, so there
                        // is no point in updating the UI
                        return;
                    }
                    this.handleActionChangeEvent(event);
                }));
            }
        }
        handleActionChangeEvent(event) {
            if (event.enabled !== undefined) {
                this.updateEnabled();
            }
            if (event.checked !== undefined) {
                this.updateChecked();
            }
            if (event.class !== undefined) {
                this.updateClass();
            }
            if (event.label !== undefined) {
                this.updateLabel();
                this.updateTooltip();
            }
            if (event.tooltip !== undefined) {
                this.updateTooltip();
            }
        }
        get actionRunner() {
            if (!this._actionRunner) {
                this._actionRunner = this._register(new actions_1.ActionRunner());
            }
            return this._actionRunner;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        isEnabled() {
            return this._action.enabled;
        }
        setActionContext(newContext) {
            this._context = newContext;
        }
        render(container) {
            const element = this.element = container;
            this._register(touch_1.Gesture.addTarget(container));
            const enableDragging = this.options && this.options.draggable;
            if (enableDragging) {
                container.draggable = true;
                if (browser_1.isFirefox) {
                    // Firefox: requires to set a text data transfer to get going
                    this._register((0, dom_1.addDisposableListener)(container, dom_1.EventType.DRAG_START, e => e.dataTransfer?.setData(dnd_1.DataTransfers.TEXT, this._action.label)));
                }
            }
            this._register((0, dom_1.addDisposableListener)(element, touch_1.EventType.Tap, e => this.onClick(e, true))); // Preserve focus on tap #125470
            this._register((0, dom_1.addDisposableListener)(element, dom_1.EventType.MOUSE_DOWN, e => {
                if (!enableDragging) {
                    dom_1.EventHelper.stop(e, true); // do not run when dragging is on because that would disable it
                }
                if (this._action.enabled && e.button === 0) {
                    element.classList.add('active');
                }
            }));
            if (platform.isMacintosh) {
                // macOS: allow to trigger the button when holding Ctrl+key and pressing the
                // main mouse button. This is for scenarios where e.g. some interaction forces
                // the Ctrl+key to be pressed and hold but the user still wants to interact
                // with the actions (for example quick access in quick navigation mode).
                this._register((0, dom_1.addDisposableListener)(element, dom_1.EventType.CONTEXT_MENU, e => {
                    if (e.button === 0 && e.ctrlKey === true) {
                        this.onClick(e);
                    }
                }));
            }
            this._register((0, dom_1.addDisposableListener)(element, dom_1.EventType.CLICK, e => {
                dom_1.EventHelper.stop(e, true);
                // menus do not use the click event
                if (!(this.options && this.options.isMenu)) {
                    this.onClick(e);
                }
            }));
            this._register((0, dom_1.addDisposableListener)(element, dom_1.EventType.DBLCLICK, e => {
                dom_1.EventHelper.stop(e, true);
            }));
            [dom_1.EventType.MOUSE_UP, dom_1.EventType.MOUSE_OUT].forEach(event => {
                this._register((0, dom_1.addDisposableListener)(element, event, e => {
                    dom_1.EventHelper.stop(e);
                    element.classList.remove('active');
                }));
            });
        }
        onClick(event, preserveFocus = false) {
            dom_1.EventHelper.stop(event, true);
            const context = types.isUndefinedOrNull(this._context) ? this.options?.useEventAsContext ? event : { preserveFocus } : this._context;
            this.actionRunner.run(this._action, context);
        }
        // Only set the tabIndex on the element once it is about to get focused
        // That way this element wont be a tab stop when it is not needed #106441
        focus() {
            if (this.element) {
                this.element.tabIndex = 0;
                this.element.focus();
                this.element.classList.add('focused');
            }
        }
        isFocused() {
            return !!this.element?.classList.contains('focused');
        }
        blur() {
            if (this.element) {
                this.element.blur();
                this.element.tabIndex = -1;
                this.element.classList.remove('focused');
            }
        }
        setFocusable(focusable) {
            if (this.element) {
                this.element.tabIndex = focusable ? 0 : -1;
            }
        }
        get trapsArrowNavigation() {
            return false;
        }
        updateEnabled() {
            // implement in subclass
        }
        updateLabel() {
            // implement in subclass
        }
        getClass() {
            return this.action.class;
        }
        getTooltip() {
            return this.action.tooltip;
        }
        updateTooltip() {
            if (!this.element) {
                return;
            }
            const title = this.getTooltip() ?? '';
            this.updateAriaLabel();
            if (this.options.hoverDelegate?.showNativeHover) {
                /* While custom hover is not inside custom hover */
                this.element.title = title;
            }
            else {
                if (!this.customHover && title !== '') {
                    const hoverDelegate = this.options.hoverDelegate ?? (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element');
                    this.customHover = this._store.add((0, updatableHoverWidget_1.setupCustomHover)(hoverDelegate, this.element, title));
                }
                else if (this.customHover) {
                    this.customHover.update(title);
                }
            }
        }
        updateAriaLabel() {
            if (this.element) {
                const title = this.getTooltip() ?? '';
                this.element.setAttribute('aria-label', title);
            }
        }
        updateClass() {
            // implement in subclass
        }
        updateChecked() {
            // implement in subclass
        }
        dispose() {
            if (this.element) {
                this.element.remove();
                this.element = undefined;
            }
            this._context = undefined;
            super.dispose();
        }
    }
    exports.BaseActionViewItem = BaseActionViewItem;
    class ActionViewItem extends BaseActionViewItem {
        constructor(context, action, options) {
            super(context, action, options);
            this.options = options;
            this.options.icon = options.icon !== undefined ? options.icon : false;
            this.options.label = options.label !== undefined ? options.label : true;
            this.cssClass = '';
        }
        render(container) {
            super.render(container);
            types.assertType(this.element);
            const label = document.createElement('a');
            label.classList.add('action-label');
            label.setAttribute('role', this.getDefaultAriaRole());
            this.label = label;
            this.element.appendChild(label);
            if (this.options.label && this.options.keybinding) {
                const kbLabel = document.createElement('span');
                kbLabel.classList.add('keybinding');
                kbLabel.textContent = this.options.keybinding;
                this.element.appendChild(kbLabel);
            }
            this.updateClass();
            this.updateLabel();
            this.updateTooltip();
            this.updateEnabled();
            this.updateChecked();
        }
        getDefaultAriaRole() {
            if (this._action.id === actions_1.Separator.ID) {
                return 'presentation'; // A separator is a presentation item
            }
            else {
                if (this.options.isMenu) {
                    return 'menuitem';
                }
                else {
                    return 'button';
                }
            }
        }
        // Only set the tabIndex on the element once it is about to get focused
        // That way this element wont be a tab stop when it is not needed #106441
        focus() {
            if (this.label) {
                this.label.tabIndex = 0;
                this.label.focus();
            }
        }
        isFocused() {
            return !!this.label && this.label?.tabIndex === 0;
        }
        blur() {
            if (this.label) {
                this.label.tabIndex = -1;
            }
        }
        setFocusable(focusable) {
            if (this.label) {
                this.label.tabIndex = focusable ? 0 : -1;
            }
        }
        updateLabel() {
            if (this.options.label && this.label) {
                this.label.textContent = this.action.label;
            }
        }
        getTooltip() {
            let title = null;
            if (this.action.tooltip) {
                title = this.action.tooltip;
            }
            else if (!this.options.label && this.action.label && this.options.icon) {
                title = this.action.label;
                if (this.options.keybinding) {
                    title = nls.localize({ key: 'titleLabel', comment: ['action title', 'action keybinding'] }, "{0} ({1})", title, this.options.keybinding);
                }
            }
            return title ?? undefined;
        }
        updateClass() {
            if (this.cssClass && this.label) {
                this.label.classList.remove(...this.cssClass.split(' '));
            }
            if (this.options.icon) {
                this.cssClass = this.getClass();
                if (this.label) {
                    this.label.classList.add('codicon');
                    if (this.cssClass) {
                        this.label.classList.add(...this.cssClass.split(' '));
                    }
                }
                this.updateEnabled();
            }
            else {
                this.label?.classList.remove('codicon');
            }
        }
        updateEnabled() {
            if (this.action.enabled) {
                if (this.label) {
                    this.label.removeAttribute('aria-disabled');
                    this.label.classList.remove('disabled');
                }
                this.element?.classList.remove('disabled');
            }
            else {
                if (this.label) {
                    this.label.setAttribute('aria-disabled', 'true');
                    this.label.classList.add('disabled');
                }
                this.element?.classList.add('disabled');
            }
        }
        updateAriaLabel() {
            if (this.label) {
                const title = this.getTooltip() ?? '';
                this.label.setAttribute('aria-label', title);
            }
        }
        updateChecked() {
            if (this.label) {
                if (this.action.checked !== undefined) {
                    this.label.classList.toggle('checked', this.action.checked);
                    this.label.setAttribute('aria-checked', this.action.checked ? 'true' : 'false');
                    this.label.setAttribute('role', 'checkbox');
                }
                else {
                    this.label.classList.remove('checked');
                    this.label.removeAttribute('aria-checked');
                    this.label.setAttribute('role', this.getDefaultAriaRole());
                }
            }
        }
    }
    exports.ActionViewItem = ActionViewItem;
    class SelectActionViewItem extends BaseActionViewItem {
        constructor(ctx, action, options, selected, contextViewProvider, styles, selectBoxOptions) {
            super(ctx, action);
            this.selectBox = new selectBox_1.SelectBox(options, selected, contextViewProvider, styles, selectBoxOptions);
            this.selectBox.setFocusable(false);
            this._register(this.selectBox);
            this.registerListeners();
        }
        setOptions(options, selected) {
            this.selectBox.setOptions(options, selected);
        }
        select(index) {
            this.selectBox.select(index);
        }
        registerListeners() {
            this._register(this.selectBox.onDidSelect(e => this.runAction(e.selected, e.index)));
        }
        runAction(option, index) {
            this.actionRunner.run(this._action, this.getActionContext(option, index));
        }
        getActionContext(option, index) {
            return option;
        }
        setFocusable(focusable) {
            this.selectBox.setFocusable(focusable);
        }
        focus() {
            this.selectBox?.focus();
        }
        blur() {
            this.selectBox?.blur();
        }
        render(container) {
            this.selectBox.render(container);
        }
    }
    exports.SelectActionViewItem = SelectActionViewItem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uVmlld0l0ZW1zLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvYWN0aW9uYmFyL2FjdGlvblZpZXdJdGVtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUEyQmhHLE1BQWEsa0JBQW1CLFNBQVEsc0JBQVU7UUFTakQsSUFBSSxNQUFNO1lBQ1QsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3JCLENBQUM7UUFJRCxZQUFZLE9BQWdCLEVBQUUsTUFBZSxFQUFZLFVBQXNDLEVBQUU7WUFDaEcsS0FBSyxFQUFFLENBQUM7WUFEZ0QsWUFBTyxHQUFQLE9BQU8sQ0FBaUM7WUFHaEcsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLElBQUksSUFBSSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO1lBRXRCLElBQUksTUFBTSxZQUFZLGdCQUFNLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO3dCQUNuQiwwQ0FBMEM7d0JBQzFDLGlDQUFpQzt3QkFDakMsT0FBTztvQkFDUixDQUFDO29CQUVELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUM7UUFDRixDQUFDO1FBRU8sdUJBQXVCLENBQUMsS0FBeUI7WUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDdEIsQ0FBQztZQUVELElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxT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