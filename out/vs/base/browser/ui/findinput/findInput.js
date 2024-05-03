/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/findinput/findInputToggles", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/ui/hover/hoverDelegateFactory", "vs/css!./findInput"], function (require, exports, dom, findInputToggles_1, inputBox_1, widget_1, event_1, nls, lifecycle_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FindInput = void 0;
    const NLS_DEFAULT_LABEL = nls.localize('defaultLabel', "input");
    class FindInput extends widget_1.Widget {
        static { this.OPTION_CHANGE = 'optionChange'; }
        constructor(parent, contextViewProvider, options) {
            super();
            this.fixFocusOnOptionClickEnabled = true;
            this.imeSessionInProgress = false;
            this.additionalTogglesDisposables = this._register(new lifecycle_1.MutableDisposable());
            this.additionalToggles = [];
            this._onDidOptionChange = this._register(new event_1.Emitter());
            this.onDidOptionChange = this._onDidOptionChange.event;
            this._onKeyDown = this._register(new event_1.Emitter());
            this.onKeyDown = this._onKeyDown.event;
            this._onMouseDown = this._register(new event_1.Emitter());
            this.onMouseDown = this._onMouseDown.event;
            this._onInput = this._register(new event_1.Emitter());
            this.onInput = this._onInput.event;
            this._onKeyUp = this._register(new event_1.Emitter());
            this.onKeyUp = this._onKeyUp.event;
            this._onCaseSensitiveKeyDown = this._register(new event_1.Emitter());
            this.onCaseSensitiveKeyDown = this._onCaseSensitiveKeyDown.event;
            this._onRegexKeyDown = this._register(new event_1.Emitter());
            this.onRegexKeyDown = this._onRegexKeyDown.event;
            this._lastHighlightFindOptions = 0;
            this.placeholder = options.placeholder || '';
            this.validation = options.validation;
            this.label = options.label || NLS_DEFAULT_LABEL;
            this.showCommonFindToggles = !!options.showCommonFindToggles;
            const appendCaseSensitiveLabel = options.appendCaseSensitiveLabel || '';
            const appendWholeWordsLabel = options.appendWholeWordsLabel || '';
            const appendRegexLabel = options.appendRegexLabel || '';
            const history = options.history || [];
            const flexibleHeight = !!options.flexibleHeight;
            const flexibleWidth = !!options.flexibleWidth;
            const flexibleMaxHeight = options.flexibleMaxHeight;
            this.domNode = document.createElement('div');
            this.domNode.classList.add('monaco-findInput');
            this.inputBox = this._register(new inputBox_1.HistoryInputBox(this.domNode, contextViewProvider, {
                placeholder: this.placeholder || '',
                ariaLabel: this.label || '',
                validationOptions: {
                    validation: this.validation
                },
                history,
                showHistoryHint: options.showHistoryHint,
                flexibleHeight,
                flexibleWidth,
                flexibleMaxHeight,
                inputBoxStyles: options.inputBoxStyles,
            }));
            const hoverDelegate = this._register((0, hoverDelegateFactory_1.createInstantHoverDelegate)());
            if (this.showCommonFindToggles) {
                this.regex = this._register(new findInputToggles_1.RegexToggle({
                    appendTitle: appendRegexLabel,
                    isChecked: false,
                    hoverDelegate,
                    ...options.toggleStyles
                }));
                this._register(this.regex.onChange(viaKeyboard => {
                    this._onDidOptionChange.fire(viaKeyboard);
                    if (!viaKeyboard && this.fixFocusOnOptionClickEnabled) {
                        this.inputBox.focus();
                    }
                    this.validate();
                }));
                this._register(this.regex.onKeyDown(e => {
                    this._onRegexKeyDown.fire(e);
                }));
                this.wholeWords = this._register(new findInputToggles_1.WholeWordsToggle({
                    appendTitle: appendWholeWordsLabel,
                    isChecked: false,
                    hoverDelegate,
                    ...options.toggleStyles
                }));
                this._register(this.wholeWords.onChange(viaKeyboard => {
                    this._onDidOptionChange.fire(viaKeyboard);
                    if (!viaKeyboard && this.fixFocusOnOptionClickEnabled) {
                        this.inputBox.focus();
                    }
                    this.validate();
                }));
                this.caseSensitive = this._register(new findInputToggles_1.CaseSensitiveToggle({
                    appendTitle: appendCaseSensitiveLabel,
                    isChecked: false,
                    hoverDelegate,
                    ...options.toggleStyles
                }));
                this._register(this.caseSensitive.onChange(viaKeyboard => {
                    this._onDidOptionChange.fire(viaKeyboard);
                    if (!viaKeyboard && this.fixFocusOnOptionClickEnabled) {
                        this.inputBox.focus();
                    }
                    this.validate();
                }));
                this._register(this.caseSensitive.onKeyDown(e => {
                    this._onCaseSensitiveKeyDown.fire(e);
                }));
                // Arrow-Key support to navigate between options
                const indexes = [this.caseSensitive.domNode, this.wholeWords.domNode, this.regex.domNode];
                this.onkeydown(this.domNode, (event) => {
                    if (event.equals(15 /* KeyCode.LeftArrow */) || event.equals(17 /* KeyCode.RightArrow */) || event.equals(9 /* KeyCode.Escape */)) {
                        const index = indexes.indexOf(this.domNode.ownerDocument.activeElement);
                        if (index >= 0) {
                            let newIndex = -1;
                            if (event.equals(17 /* KeyCode.RightArrow */)) {
                                newIndex = (index + 1) % indexes.length;
                            }
                            else if (event.equals(15 /* KeyCode.LeftArrow */)) {
                                if (index === 0) {
                                    newIndex = indexes.length - 1;
                                }
                                else {
                                    newIndex = index - 1;
                                }
                            }
                            if (event.equals(9 /* KeyCode.Escape */)) {
                                indexes[index].blur();
                                this.inputBox.focus();
                            }
                            else if (newIndex >= 0) {
                                indexes[newIndex].focus();
                            }
                            dom.EventHelper.stop(event, true);
                        }
                    }
                });
            }
            this.controls = document.createElement('div');
            this.controls.className = 'controls';
            this.controls.style.display = this.showCommonFindToggles ? '' : 'none';
            if (this.caseSensitive) {
                this.controls.append(this.caseSensitive.domNode);
            }
            if (this.wholeWords) {
                this.controls.appendChild(this.wholeWords.domNode);
            }
            if (this.regex) {
                this.controls.appendChild(this.regex.domNode);
            }
            this.setAdditionalToggles(options?.additionalToggles);
            if (this.controls) {
                this.domNode.appendChild(this.controls);
            }
            parent?.appendChild(this.domNode);
            this._register(dom.addDisposableListener(this.inputBox.inputElement, 'compositionstart', (e) => {
                this.imeSessionInProgress = true;
            }));
            this._register(dom.addDisposableListener(this.inputBox.inputElement, 'compositionend', (e) => {
                this.imeSessionInProgress = false;
                this._onInput.fire();
            }));
            this.onkeydown(this.inputBox.inputElement, (e) => this._onKeyDown.fire(e));
            this.onkeyup(this.inputBox.inputElement, (e) => this._onKeyUp.fire(e));
            this.oninput(this.inputBox.inputElement, (e) => this._onInput.fire());
            this.onmousedown(this.inputBox.inputElement, (e) => this._onMouseDown.fire(e));
        }
        get isImeSessionInProgress() {
            return this.imeSessionInProgress;
        }
        get onDidChange() {
            return this.inputBox.onDidChange;
        }
        layout(style) {
            this.inputBox.layout();
            this.updateInputBoxPadding(style.collapsedFindWidget);
        }
        enable() {
            this.domNode.classList.remove('disabled');
            this.inputBox.enable();
            this.regex?.enable();
            this.wholeWords?.enable();
            this.caseSensitive?.enable();
            for (const toggle of this.additionalToggles) {
                toggle.enable();
            }
        }
        disable() {
            this.domNode.classList.add('disabled');
            this.inputBox.disable();
            this.regex?.disable();
            this.wholeWords?.disable();
            this.caseSensitive?.disable();
            for (const toggle of this.additionalToggles) {
                toggle.disable();
            }
        }
        setFocusInputOnOptionClick(value) {
            this.fixFocusOnOptionClickEnabled = value;
        }
        setEnabled(enabled) {
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        }
        setAdditionalToggles(toggles) {
            for (const currentToggle of this.additionalToggles) {
                currentToggle.domNode.remove();
            }
            this.additionalToggles = [];
            this.additionalTogglesDisposables.value = new lifecycle_1.DisposableStore();
            for (const toggle of toggles ?? []) {
                this.additionalTogglesDisposables.value.add(toggle);
                this.controls.appendChild(toggle.domNode);
                this.additionalTogglesDisposables.value.add(toggle.onChange(viaKeyboard => {
                    this._onDidOptionChange.fire(viaKeyboard);
                    if (!viaKeyboard && this.fixFocusOnOptionClickEnabled) {
                        this.inputBox.focus();
                    }
                }));
                this.additionalToggles.push(toggle);
            }
            if (this.additionalToggles.length > 0) {
                this.controls.style.display = '';
            }
            this.updateInputBoxPadding();
        }
        updateInputBoxPadding(controlsHidden = false) {
            if (controlsHidden) {
                this.inputBox.paddingRight = 0;
            }
            else {
                this.inputBox.paddingRight =
                    ((this.caseSensitive?.width() ?? 0) + (this.wholeWords?.width() ?? 0) + (this.regex?.width() ?? 0))
                        + this.additionalToggles.reduce((r, t) => r + t.width(), 0);
            }
        }
        clear() {
            this.clearValidation();
            this.setValue('');
            this.focus();
        }
        getValue() {
            return this.inputBox.value;
        }
        setValue(value) {
            if (this.inputBox.value !== value) {
                this.inputBox.value = value;
            }
        }
        onSearchSubmit() {
            this.inputBox.addToHistory();
        }
        select() {
            this.inputBox.select();
        }
        focus() {
            this.inputBox.focus();
        }
        getCaseSensitive() {
            return this.caseSensitive?.checked ?? false;
        }
        setCaseSensitive(value) {
            if (this.caseSensitive) {
                this.caseSensitive.checked = value;
            }
        }
        getWholeWords() {
            return this.wholeWords?.checked ?? false;
        }
        setWholeWords(value) {
            if (this.wholeWords) {
                this.wholeWords.checked = value;
            }
        }
        getRegex() {
            return this.regex?.checked ?? false;
        }
        setRegex(value) {
            if (this.regex) {
                this.regex.checked = value;
                this.validate();
            }
        }
        focusOnCaseSensitive() {
            this.caseSensitive?.focus();
        }
        focusOnRegex() {
            this.regex?.focus();
        }
        highlightFindOptions() {
            this.domNode.classList.remove('highlight-' + (this._lastHighlightFindOptions));
            this._lastHighlightFindOptions = 1 - this._lastHighlightFindOptions;
            this.domNode.classList.add('highlight-' + (this._lastHighlightFindOptions));
        }
        validate() {
            this.inputBox.validate();
        }
        showMessage(message) {
            this.inputBox.showMessage(message);
        }
        clearMessage() {
            this.inputBox.hideMessage();
        }
        clearValidation() {
            this.inputBox.hideMessage();
        }
    }
    exports.FindInput = FindInput;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZElucHV0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvdWkvZmluZGlucHV0L2ZpbmRJbnB1dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFzQ2hHLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFaEUsTUFBYSxTQUFVLFNBQVEsZUFBTTtpQkFFcEIsa0JBQWEsR0FBVyxjQUFjLEFBQXpCLENBQTBCO1FBdUN2RCxZQUFZLE1BQTBCLEVBQUUsbUJBQXFELEVBQUUsT0FBMEI7WUFDeEgsS0FBSyxFQUFFLENBQUM7WUFsQ0QsaUNBQTRCLEdBQUcsSUFBSSxDQUFDO1lBQ3BDLHlCQUFvQixHQUFHLEtBQUssQ0FBQztZQUM3QixpQ0FBNEIsR0FBdUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDZCQUFpQixFQUFFLENBQUMsQ0FBQztZQU16RyxzQkFBaUIsR0FBYSxFQUFFLENBQUM7WUFJMUIsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDN0Qsc0JBQWlCLEdBQXNDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUM7WUFFcEYsZUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQWtCLENBQUMsQ0FBQztZQUM1RCxjQUFTLEdBQTBCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBRXhELGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBZSxDQUFDLENBQUM7WUFDM0QsZ0JBQVcsR0FBdUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFFekQsYUFBUSxHQUFHLElBQUks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