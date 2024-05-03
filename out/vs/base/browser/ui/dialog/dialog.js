/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/themables", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/nls", "vs/css!./dialog"], function (require, exports, dom_1, keyboardEvent_1, actionbar_1, button_1, toggle_1, inputBox_1, actions_1, codicons_1, themables_1, labels_1, lifecycle_1, platform_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dialog = void 0;
    class Dialog extends lifecycle_1.Disposable {
        constructor(container, message, buttons, options) {
            super();
            this.container = container;
            this.message = message;
            this.options = options;
            this.modalElement = this.container.appendChild((0, dom_1.$)(`.monaco-dialog-modal-block.dimmed`));
            this.shadowElement = this.modalElement.appendChild((0, dom_1.$)('.dialog-shadow'));
            this.element = this.shadowElement.appendChild((0, dom_1.$)('.monaco-dialog-box'));
            this.element.setAttribute('role', 'dialog');
            this.element.tabIndex = -1;
            (0, dom_1.hide)(this.element);
            this.buttonStyles = options.buttonStyles;
            if (Array.isArray(buttons) && buttons.length > 0) {
                this.buttons = buttons;
            }
            else if (!this.options.disableDefaultAction) {
                this.buttons = [nls.localize('ok', "OK")];
            }
            else {
                this.buttons = [];
            }
            const buttonsRowElement = this.element.appendChild((0, dom_1.$)('.dialog-buttons-row'));
            this.buttonsContainer = buttonsRowElement.appendChild((0, dom_1.$)('.dialog-buttons'));
            const messageRowElement = this.element.appendChild((0, dom_1.$)('.dialog-message-row'));
            this.iconElement = messageRowElement.appendChild((0, dom_1.$)('#monaco-dialog-icon.dialog-icon'));
            this.iconElement.setAttribute('aria-label', this.getIconAriaLabel());
            this.messageContainer = messageRowElement.appendChild((0, dom_1.$)('.dialog-message-container'));
            if (this.options.detail || this.options.renderBody) {
                const messageElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-message'));
                const messageTextElement = messageElement.appendChild((0, dom_1.$)('#monaco-dialog-message-text.dialog-message-text'));
                messageTextElement.innerText = this.message;
            }
            this.messageDetailElement = this.messageContainer.appendChild((0, dom_1.$)('#monaco-dialog-message-detail.dialog-message-detail'));
            if (this.options.detail || !this.options.renderBody) {
                this.messageDetailElement.innerText = this.options.detail ? this.options.detail : message;
            }
            else {
                this.messageDetailElement.style.display = 'none';
            }
            if (this.options.renderBody) {
                const customBody = this.messageContainer.appendChild((0, dom_1.$)('#monaco-dialog-message-body.dialog-message-body'));
                this.options.renderBody(customBody);
                for (const el of this.messageContainer.querySelectorAll('a')) {
                    el.tabIndex = 0;
                }
            }
            if (this.options.inputs) {
                this.inputs = this.options.inputs.map(input => {
                    const inputRowElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-message-input'));
                    const inputBox = this._register(new inputBox_1.InputBox(inputRowElement, undefined, {
                        placeholder: input.placeholder,
                        type: input.type ?? 'text',
                        inputBoxStyles: options.inputBoxStyles
                    }));
                    if (input.value) {
                        inputBox.value = input.value;
                    }
                    return inputBox;
                });
            }
            else {
                this.inputs = [];
            }
            if (this.options.checkboxLabel) {
                const checkboxRowElement = this.messageContainer.appendChild((0, dom_1.$)('.dialog-checkbox-row'));
                const checkbox = this.checkbox = this._register(new toggle_1.Checkbox(this.options.checkboxLabel, !!this.options.checkboxChecked, options.checkboxStyles));
                checkboxRowElement.appendChild(checkbox.domNode);
                const checkboxMessageElement = checkboxRowElement.appendChild((0, dom_1.$)('.dialog-checkbox-message'));
                checkboxMessageElement.innerText = this.options.checkboxLabel;
                this._register((0, dom_1.addDisposableListener)(checkboxMessageElement, dom_1.EventType.CLICK, () => checkbox.checked = !checkbox.checked));
            }
            const toolbarRowElement = this.element.appendChild((0, dom_1.$)('.dialog-toolbar-row'));
            this.toolbarContainer = toolbarRowElement.appendChild((0, dom_1.$)('.dialog-toolbar'));
            this.applyStyles();
        }
        getIconAriaLabel() {
            let typeLabel = nls.localize('dialogInfoMessage', 'Info');
            switch (this.options.type) {
                case 'error':
                    typeLabel = nls.localize('dialogErrorMessage', 'Error');
                    break;
                case 'warning':
                    typeLabel = nls.localize('dialogWarningMessage', 'Warning');
                    break;
                case 'pending':
                    typeLabel = nls.localize('dialogPendingMessage', 'In Progress');
                    break;
                case 'none':
                case 'info':
                case 'question':
                default:
                    break;
            }
            return typeLabel;
        }
        updateMessage(message) {
            this.messageDetailElement.innerText = message;
        }
        async show() {
            this.focusToReturn = this.container.ownerDocument.activeElement;
            return new Promise((resolve) => {
                (0, dom_1.clearNode)(this.buttonsContainer);
                const buttonBar = this.buttonBar = this._register(new button_1.ButtonBar(this.buttonsContainer));
                const buttonMap = this.rearrangeButtons(this.buttons, this.options.cancelId);
                // Handle button clicks
                buttonMap.forEach((entry, index) => {
                    const primary = buttonMap[index].index === 0;
                    const button = this.options.buttonDetails ? this._register(buttonBar.addButtonWithDescription({ title: true, secondary: !primary, ...this.buttonStyles })) : this._register(buttonBar.addButton({ title: true, secondary: !primary, ...this.buttonStyles }));
                    button.label = (0, labels_1.mnemonicButtonLabel)(buttonMap[index].label, true);
                    if (button instanceof button_1.ButtonWithDescription) {
                        button.description = this.options.buttonDetails[buttonMap[index].index];
                    }
                    this._register(button.onDidClick(e => {
                        if (e) {
                            dom_1.EventHelper.stop(e);
                        }
                        resolve({
                            button: buttonMap[index].index,
                            checkboxChecked: this.checkbox ? this.checkbox.checked : undefined,
                            values: this.inputs.length > 0 ? this.inputs.map(input => input.value) : undefined
                        });
                    }));
                });
                // Handle keyboard events globally: Tab, Arrow-Left/Right
                const window = (0, dom_1.getWindow)(this.container);
                this._register((0, dom_1.addDisposableListener)(window, 'keydown', e => {
                    const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (evt.equals(512 /* KeyMod.Alt */)) {
                        evt.preventDefault();
                    }
                    if (evt.equals(3 /* KeyCode.Enter */)) {
                        // Enter in input field should OK the dialog
                        if (this.inputs.some(input => input.hasFocus())) {
                            dom_1.EventHelper.stop(e);
                            resolve({
                                button: buttonMap.find(button => button.index !== this.options.cancelId)?.index ?? 0,
                                checkboxChecked: this.checkbox ? this.checkbox.checked : undefined,
                                values: this.inputs.length > 0 ? this.inputs.map(input => input.value) : undefined
                            });
                        }
                        return; // leave default handling
                    }
                    if (evt.equals(10 /* KeyCode.Space */)) {
                        return; // leave default handling
                    }
                    let eventHandled = false;
                    // Focus: Next / Previous
                    if (evt.equals(2 /* KeyCode.Tab */) || evt.equals(17 /* KeyCode.RightArrow */) || evt.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */) || evt.equals(15 /* KeyCode.LeftArrow */)) {
                        // Build a list of focusable elements in their visual order
                        const focusableElements = [];
                        let focusedIndex = -1;
                        if (this.messageContainer) {
                            const links = this.messageContainer.querySelectorAll('a');
                            for (const link of links) {
                                focusableElements.push(link);
                                if ((0, dom_1.isActiveElement)(link)) {
                                    focusedIndex = focusableElements.length - 1;
                                }
                            }
                        }
                        for (const input of this.inputs) {
                            focusableElements.push(input);
                            if (input.hasFocus()) {
                                focusedIndex = focusableElements.length - 1;
                            }
                        }
                        if (this.checkbox) {
                            focusableElements.push(this.checkbox);
                            if (this.checkbox.hasFocus()) {
                                focusedIndex = focusableElements.length - 1;
                            }
                        }
                        if (this.buttonBar) {
                            for (const button of this.buttonBar.buttons) {
                                focusableElements.push(button);
                                if (button.hasFocus()) {
                                    focusedIndex = focusableElements.length - 1;
                                }
                            }
                        }
                        // Focus next element (with wrapping)
                        if (evt.equals(2 /* KeyCode.Tab */) || evt.equals(17 /* KeyCode.RightArrow */)) {
                            if (focusedIndex === -1) {
                                focusedIndex = 0; // default to focus first element if none have focus
                            }
                            const newFocusedIndex = (focusedIndex + 1) % focusableElements.length;
                            focusableElements[newFocusedIndex].focus();
                        }
                        // Focus previous element (with wrapping)
                        else {
                            if (focusedIndex === -1) {
                                focusedIndex = focusableElements.length; // default to focus last element if none have focus
                            }
                            let newFocusedIndex = focusedIndex - 1;
                            if (newFocusedIndex === -1) {
                                newFocusedIndex = focusableElements.length - 1;
                            }
                            focusableElements[newFocusedIndex].focus();
                        }
                        eventHandled = true;
                    }
                    if (eventHandled) {
                        dom_1.EventHelper.stop(e, true);
                    }
                    else if (this.options.keyEventProcessor) {
                        this.options.keyEventProcessor(evt);
                    }
                }, true));
                this._register((0, dom_1.addDisposableListener)(window, 'keyup', e => {
                    dom_1.EventHelper.stop(e, true);
                    const evt = new keyboardEvent_1.StandardKeyboardEvent(e);
                    if (!this.options.disableCloseAction && evt.equals(9 /* KeyCode.Escape */)) {
                        resolve({
                            button: this.options.cancelId || 0,
                            checkboxChecked: this.checkbox ? this.checkbox.checked : undefined
                        });
                    }
                }, true));
                // Detect focus out
                this._register((0, dom_1.addDisposableListener)(this.element, 'focusout', e => {
                    if (!!e.relatedTarget && !!this.element) {
                        if (!(0, dom_1.isAncestor)(e.relatedTarget, this.element)) {
                            this.focusToReturn = e.relatedTarget;
                            if (e.target) {
                                e.target.focus();
                                dom_1.EventHelper.stop(e, true);
                            }
                        }
                    }
                }, false));
                const spinModifierClassName = 'codicon-modifier-spin';
                this.iconElement.classList.remove(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogError), ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogWarning), ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogInfo), ...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), spinModifierClassName);
                if (this.options.icon) {
                    this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(this.options.icon));
                }
                else {
                    switch (this.options.type) {
                        case 'error':
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogError));
                            break;
                        case 'warning':
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogWarning));
                            break;
                        case 'pending':
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.loading), spinModifierClassName);
                            break;
                        case 'none':
                            this.iconElement.classList.add('no-codicon');
                            break;
                        case 'info':
                        case 'question':
                        default:
                            this.iconElement.classList.add(...themables_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.dialogInfo));
                            break;
                    }
                }
                if (!this.options.disableCloseAction) {
                    const actionBar = this._register(new actionbar_1.ActionBar(this.toolbarContainer, {}));
                    const action = this._register(new actions_1.Action('dialog.close', nls.localize('dialogClose', "Close Dialog"), themables_1.ThemeIcon.asClassName(codicons_1.Codicon.dialogClose), true, async () => {
                        resolve({
                            button: this.options.cancelId || 0,
                            checkboxChecked: this.checkbox ? this.checkbox.checked : undefined
                        });
                    }));
                    actionBar.push(action, { icon: true, label: false });
                }
                this.applyStyles();
                this.element.setAttribute('aria-modal', 'true');
                this.element.setAttribute('aria-labelledby', 'monaco-dialog-icon monaco-dialog-message-text');
                this.element.setAttribute('aria-describedby', 'monaco-dialog-icon monaco-dialog-message-text monaco-dialog-message-detail monaco-dialog-message-body');
                (0, dom_1.show)(this.element);
                // Focus first element (input or button)
                if (this.inputs.length > 0) {
                    this.inputs[0].focus();
                    this.inputs[0].select();
                }
                else {
                    buttonMap.forEach((value, index) => {
                        if (value.index === 0) {
                            buttonBar.buttons[index].focus();
                        }
                    });
                }
            });
        }
        applyStyles() {
            const style = this.options.dialogStyles;
            const fgColor = style.dialogForeground;
            const bgColor = style.dialogBackground;
            const shadowColor = style.dialogShadow ? `0 0px 8px ${style.dialogShadow}` : '';
            const border = style.dialogBorder ? `1px solid ${style.dialogBorder}` : '';
            const linkFgColor = style.textLinkForeground;
            this.shadowElement.style.boxShadow = shadowColor;
            this.element.style.color = fgColor ?? '';
            this.element.style.backgroundColor = bgColor ?? '';
            this.element.style.border = border;
            // TODO fix
            // if (fgColor && bgColor) {
            // 	const messageDetailColor = fgColor.transparent(.9);
            // 	this.messageDetailElement.style.mixBlendMode = messageDetailColor.makeOpaque(bgColor).toString();
            // }
            if (linkFgColor) {
                for (const el of this.messageContainer.getElementsByTagName('a')) {
                    el.style.color = linkFgColor;
                }
            }
            let color;
            switch (this.options.type) {
                case 'error':
                    color = style.errorIconForeground;
                    break;
                case 'warning':
                    color = style.warningIconForeground;
                    break;
                default:
                    color = style.infoIconForeground;
                    break;
            }
            if (color) {
                this.iconElement.style.color = color;
            }
        }
        dispose() {
            super.dispose();
            if (this.modalElement) {
                this.modalElement.remove();
                this.modalElement = undefined;
            }
            if (this.focusToReturn && (0, dom_1.isAncestor)(this.focusToReturn, this.container.ownerDocument.body)) {
                this.focusToReturn.focus();
                this.focusToReturn = undefined;
            }
        }
        rearrangeButtons(buttons, cancelId) {
            // Maps each button to its current label and old index
            // so that when we move them around it's not a problem
            const buttonMap = buttons.map((label, index) => ({ label, index }));
            if (buttons.length < 2) {
                return buttonMap; // only need to rearrange if there are 2+ buttons
            }
            if (platform_1.isMacintosh || platform_1.isLinux) {
                // Linux: the GNOME HIG (https://developer.gnome.org/hig/patterns/feedback/dialogs.html?highlight=dialog)
                // recommend the following:
                // "Always ensure that the cancel button appears first, before the affirmative button. In left-to-right
                //  locales, this is on the left. This button order ensures that users become aware of, and are reminded
                //  of, the ability to cancel prior to encountering the affirmative button."
                // macOS: the HIG (https://developer.apple.com/design/human-interface-guidelines/components/presentation/alerts)
                // recommend the following:
                // "Place buttons where people expect. In general, place the button people are most likely to choose on the trailing side in a
                //  row of buttons or at the top in a stack of buttons. Always place the default button on the trailing side of a row or at the
                //  top of a stack. Cancel buttons are typically on the leading side of a row or at the bottom of a stack."
                if (typeof cancelId === 'number' && buttonMap[cancelId]) {
                    const cancelButton = buttonMap.splice(cancelId, 1)[0];
                    buttonMap.splice(1, 0, cancelButton);
                }
                buttonMap.reverse();
            }
            else if (platform_1.isWindows) {
                // Windows: the HIG (https://learn.microsoft.com/en-us/windows/win32/uxguide/win-dialog-box)
                // recommend the following:
                // "One of the following sets of concise commands: Yes/No, Yes/No/Cancel, [Do it]/Cancel,
                //  [Do it]/[Don't do it], [Do it]/[Don't do it]/Cancel."
                if (typeof cancelId === 'number' && buttonMap[cancelId]) {
                    const cancelButton = buttonMap.splice(cancelId, 1)[0];
                    buttonMap.push(cancelButton);
                }
            }
            return buttonMap;
        }
    }
    exports.Dialog = Dialog;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlhbG9nLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvZGlhbG9nL2RpYWxvZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFpRWhHLE1BQWEsTUFBTyxTQUFRLHNCQUFVO1FBZ0JyQyxZQUFvQixTQUFzQixFQUFVLE9BQWUsRUFBRSxPQUE2QixFQUFtQixPQUF1QjtZQUMzSSxLQUFLLEVBQUUsQ0FBQztZQURXLGNBQVMsR0FBVCxTQUFTLENBQWE7WUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFRO1lBQWtELFlBQU8sR0FBUCxPQUFPLENBQWdCO1lBRzNJLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBQSxPQUFDLEVBQUMsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO1lBQ3ZGLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsSUFBQSxPQUFDLEVBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsSUFBQSxPQUFDLEVBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFBLFVBQUksRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO1lBRXpDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFB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