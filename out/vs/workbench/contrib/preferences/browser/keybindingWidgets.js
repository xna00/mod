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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/browser/ui/widget", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/keyboardEvent", "vs/base/browser/fastDomNode", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/base/common/async", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/browser/defaultStyles", "vs/css!./media/keybindings"], function (require, exports, nls, platform_1, lifecycle_1, event_1, keybindingLabel_1, widget_1, dom, aria, keyboardEvent_1, fastDomNode_1, keybinding_1, contextView_1, instantiation_1, colorRegistry_1, preferencesWidgets_1, async_1, contextkey_1, defaultStyles_1) {
    "use strict";
    var DefineKeybindingWidget_1, DefineKeybindingOverlayWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DefineKeybindingOverlayWidget = exports.DefineKeybindingWidget = exports.KeybindingsSearchWidget = void 0;
    let KeybindingsSearchWidget = class KeybindingsSearchWidget extends preferencesWidgets_1.SearchWidget {
        constructor(parent, options, contextViewService, instantiationService, contextKeyService, keybindingService) {
            super(parent, options, contextViewService, instantiationService, contextKeyService, keybindingService);
            this.recordDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onKeybinding = this._register(new event_1.Emitter());
            this.onKeybinding = this._onKeybinding.event;
            this._onEnter = this._register(new event_1.Emitter());
            this.onEnter = this._onEnter.event;
            this._onEscape = this._register(new event_1.Emitter());
            this.onEscape = this._onEscape.event;
            this._onBlur = this._register(new event_1.Emitter());
            this.onBlur = this._onBlur.event;
            this._register((0, lifecycle_1.toDisposable)(() => this.stopRecordingKeys()));
            this._chords = null;
            this._inputValue = '';
        }
        clear() {
            this._chords = null;
            super.clear();
        }
        startRecordingKeys() {
            this.recordDisposables.add(dom.addDisposableListener(this.inputBox.inputElement, dom.EventType.KEY_DOWN, (e) => this._onKeyDown(new keyboardEvent_1.StandardKeyboardEvent(e))));
            this.recordDisposables.add(dom.addDisposableListener(this.inputBox.inputElement, dom.EventType.BLUR, () => this._onBlur.fire()));
            this.recordDisposables.add(dom.addDisposableListener(this.inputBox.inputElement, dom.EventType.INPUT, () => {
                // Prevent other characters from showing up
                this.setInputValue(this._inputValue);
            }));
        }
        stopRecordingKeys() {
            this._chords = null;
            this.recordDisposables.clear();
        }
        setInputValue(value) {
            this._inputValue = value;
            this.inputBox.value = this._inputValue;
        }
        _onKeyDown(keyboardEvent) {
            keyboardEvent.preventDefault();
            keyboardEvent.stopPropagation();
            const options = this.options;
            if (!options.recordEnter && keyboardEvent.equals(3 /* KeyCode.Enter */)) {
                this._onEnter.fire();
                return;
            }
            if (keyboardEvent.equals(9 /* KeyCode.Escape */)) {
                this._onEscape.fire();
                return;
            }
            this.printKeybinding(keyboardEvent);
        }
        printKeybinding(keyboardEvent) {
            const keybinding = this.keybindingService.resolveKeyboardEvent(keyboardEvent);
            const info = `code: ${keyboardEvent.browserEvent.code}, keyCode: ${keyboardEvent.browserEvent.keyCode}, key: ${keyboardEvent.browserEvent.key} => UI: ${keybinding.getAriaLabel()}, user settings: ${keybinding.getUserSettingsLabel()}, dispatch: ${keybinding.getDispatchChords()[0]}`;
            const options = this.options;
            if (!this._chords) {
                this._chords = [];
            }
            // TODO: note that we allow a keybinding "shift shift", but this widget doesn't allow input "shift shift" because the first "shift" will be incomplete - this is _not_ a regression
            const hasIncompleteChord = this._chords.length > 0 && this._chords[this._chords.length - 1].getDispatchChords()[0] === null;
            if (hasIncompleteChord) {
                this._chords[this._chords.length - 1] = keybinding;
            }
            else {
                if (this._chords.length === 2) { // TODO: limit chords # to 2 for now
                    this._chords = [];
                }
                this._chords.push(keybinding);
            }
            const value = this._chords.map((keybinding) => keybinding.getUserSettingsLabel() || '').join(' ');
            this.setInputValue(options.quoteRecordedKeys ? `"${value}"` : value);
            this.inputBox.inputElement.title = info;
            this._onKeybinding.fire(this._chords);
        }
    };
    exports.KeybindingsSearchWidget = KeybindingsSearchWidget;
    exports.KeybindingsSearchWidget = KeybindingsSearchWidget = __decorate([
        __param(2, contextView_1.IContextViewService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, keybinding_1.IKeybindingService)
    ], KeybindingsSearchWidget);
    let DefineKeybindingWidget = class DefineKeybindingWidget extends widget_1.Widget {
        static { DefineKeybindingWidget_1 = this; }
        static { this.WIDTH = 400; }
        static { this.HEIGHT = 110; }
        constructor(parent, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this._keybindingDisposables = this._register(new lifecycle_1.DisposableStore());
            this._chords = null;
            this._isVisible = false;
            this._onHide = this._register(new event_1.Emitter());
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onShowExistingKeybindings = this._register(new event_1.Emitter());
            this.onShowExistingKeybidings = this._onShowExistingKeybindings.event;
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setDisplay('none');
            this._domNode.setClassName('defineKeybindingWidget');
            this._domNode.setWidth(DefineKeybindingWidget_1.WIDTH);
            this._domNode.setHeight(DefineKeybindingWidget_1.HEIGHT);
            const message = nls.localize('defineKeybinding.initial', "Press desired key combination and then press ENTER.");
            dom.append(this._domNode.domNode, dom.$('.message', undefined, message));
            this._domNode.domNode.style.backgroundColor = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetBackground);
            this._domNode.domNode.style.color = (0, colorRegistry_1.asCssVariable)(colorRegistry_1.editorWidgetForeground);
            this._domNode.domNode.style.boxShadow = `0 2px 8px ${(0, colorRegistry_1.asCssVariable)(colorRegistry_1.widgetShadow)}`;
            this._keybindingInputWidget = this._register(this.instantiationService.createInstance(KeybindingsSearchWidget, this._domNode.domNode, { ariaLabel: message, history: [], inputBoxStyles: defaultStyles_1.defaultInputBoxStyles }));
            this._keybindingInputWidget.startRecordingKeys();
            this._register(this._keybindingInputWidget.onKeybinding(keybinding => this.onKeybinding(keybinding)));
            this._register(this._keybindingInputWidget.onEnter(() => this.hide()));
            this._register(this._keybindingInputWidget.onEscape(() => this.clearOrHide()));
            this._register(this._keybindingInputWidget.onBlur(() => this.onCancel()));
            this._outputNode = dom.append(this._domNode.domNode, dom.$('.output'));
            this._showExistingKeybindingsNode = dom.append(this._domNode.domNode, dom.$('.existing'));
            if (parent) {
                dom.append(parent, this._domNode.domNode);
            }
        }
        get domNode() {
            return this._domNode.domNode;
        }
        define() {
            this._keybindingInputWidget.clear();
            return async_1.Promises.withAsyncBody(async (c) => {
                if (!this._isVisible) {
                    this._isVisible = true;
                    this._domNode.setDisplay('block');
                    this._chords = null;
                    this._keybindingInputWidget.setInputValue('');
                    dom.clearNode(this._outputNode);
                    dom.clearNode(this._showExistingKeybindingsNode);
                    // Input is not getting focus without timeout in safari
                    // https://github.com/microsoft/vscode/issues/108817
                    await (0, async_1.timeout)(0);
                    this._keybindingInputWidget.focus();
                }
                const disposable = this._onHide.event(() => {
                    c(this.getUserSettingsLabel());
                    disposable.dispose();
                });
            });
        }
        layout(layout) {
            const top = Math.round((layout.height - DefineKeybindingWidget_1.HEIGHT) / 2);
            this._domNode.setTop(top);
            const left = Math.round((layout.width - DefineKeybindingWidget_1.WIDTH) / 2);
            this._domNode.setLeft(left);
        }
        printExisting(numberOfExisting) {
            if (numberOfExisting > 0) {
                const existingElement = dom.$('span.existingText');
                const text = numberOfExisting === 1 ? nls.localize('defineKeybinding.oneExists', "1 existing command has this keybinding", numberOfExisting) : nls.localize('defineKeybinding.existing', "{0} existing commands have this keybinding", numberOfExisting);
                dom.append(existingElement, document.createTextNode(text));
                aria.alert(text);
                this._showExistingKeybindingsNode.appendChild(existingElement);
                existingElement.onmousedown = (e) => { e.preventDefault(); };
                existingElement.onmouseup = (e) => { e.preventDefault(); };
                existingElement.onclick = () => { this._onShowExistingKeybindings.fire(this.getUserSettingsLabel()); };
            }
        }
        onKeybinding(keybinding) {
            this._keybindingDisposables.clear();
            this._chords = keybinding;
            dom.clearNode(this._outputNode);
            dom.clearNode(this._showExistingKeybindingsNode);
            const firstLabel = this._keybindingDisposables.add(new keybindingLabel_1.KeybindingLabel(this._outputNode, platform_1.OS, defaultStyles_1.defaultKeybindingLabelStyles));
            firstLabel.set(this._chords?.[0] ?? undefined);
            if (this._chords) {
                for (let i = 1; i < this._chords.length; i++) {
                    this._outputNode.appendChild(document.createTextNode(nls.localize('defineKeybinding.chordsTo', "chord to")));
                    const chordLabel = this._keybindingDisposables.add(new keybindingLabel_1.KeybindingLabel(this._outputNode, platform_1.OS, defaultStyles_1.defaultKeybindingLabelStyles));
                    chordLabel.set(this._chords[i]);
                }
            }
            const label = this.getUserSettingsLabel();
            if (label) {
                this._onDidChange.fire(label);
            }
        }
        getUserSettingsLabel() {
            let label = null;
            if (this._chords) {
                label = this._chords.map(keybinding => keybinding.getUserSettingsLabel()).join(' ');
            }
            return label;
        }
        onCancel() {
            this._chords = null;
            this.hide();
        }
        clearOrHide() {
            if (this._chords === null) {
                this.hide();
            }
            else {
                this._chords = null;
                this._keybindingInputWidget.clear();
                dom.clearNode(this._outputNode);
                dom.clearNode(this._showExistingKeybindingsNode);
            }
        }
        hide() {
            this._domNode.setDisplay('none');
            this._isVisible = false;
            this._onHide.fire();
        }
    };
    exports.DefineKeybindingWidget = DefineKeybindingWidget;
    exports.DefineKeybindingWidget = DefineKeybindingWidget = DefineKeybindingWidget_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], DefineKeybindingWidget);
    let DefineKeybindingOverlayWidget = class DefineKeybindingOverlayWidget extends lifecycle_1.Disposable {
        static { DefineKeybindingOverlayWidget_1 = this; }
        static { this.ID = 'editor.contrib.defineKeybindingWidget'; }
        constructor(_editor, instantiationService) {
            super();
            this._editor = _editor;
            this._widget = this._register(instantiationService.createInstance(DefineKeybindingWidget, null));
            this._editor.addOverlayWidget(this);
        }
        getId() {
            return DefineKeybindingOverlayWidget_1.ID;
        }
        getDomNode() {
            return this._widget.domNode;
        }
        getPosition() {
            return {
                preference: null
            };
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        start() {
            if (this._editor.hasModel()) {
                this._editor.revealPositionInCenterIfOutsideViewport(this._editor.getPosition(), 0 /* ScrollType.Smooth */);
            }
            const layoutInfo = this._editor.getLayoutInfo();
            this._widget.layout(new dom.Dimension(layoutInfo.width, layoutInfo.height));
            return this._widget.define();
        }
    };
    exports.DefineKeybindingOverlayWidget = DefineKeybindingOverlayWidget;
    exports.DefineKeybindingOverlayWidget = DefineKeybindingOverlayWidget = DefineKeybindingOverlayWidget_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], DefineKeybindingOverlayWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2V5YmluZGluZ1dpZGdldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL3dvcmtiZW5jaC9jb250cmliL3ByZWZlcmVuY2VzL2Jyb3dzZXIva2V5YmluZGluZ1dpZGdldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7OztJQStCekYsSUFBTSx1QkFBdUIsR0FBN0IsTUFBTSx1QkFBd0IsU0FBUSxpQ0FBWTtRQW1CeEQsWUFBWSxNQUFtQixFQUFFLE9BQWlDLEVBQzVDLGtCQUF1QyxFQUNyQyxvQkFBMkMsRUFDOUMsaUJBQXFDLEVBQ3JDLGlCQUFxQztZQUV6RCxLQUFLLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1lBcEJ2RixzQkFBaUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksMkJBQWUsRUFBRSxDQUFDLENBQUM7WUFFbkUsa0JBQWEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUErQixDQUFDLENBQUM7WUFDMUUsaUJBQVksR0FBdUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7WUFFN0UsYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQzlDLFlBQU8sR0FBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFFNUMsY0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQVEsQ0FBQyxDQUFDO1lBQy9DLGFBQVEsR0FBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7WUFFOUMsWUFBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVB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