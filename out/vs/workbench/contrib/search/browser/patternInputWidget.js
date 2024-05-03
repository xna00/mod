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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/widget", "vs/base/common/codicons", "vs/base/common/event", "vs/nls", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/history/browser/historyWidgetKeybindingHint", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/browser/defaultStyles", "vs/base/browser/ui/hover/hoverDelegateFactory"], function (require, exports, dom, toggle_1, widget_1, codicons_1, event_1, nls, contextScopedHistoryWidget_1, historyWidgetKeybindingHint_1, configuration_1, contextkey_1, keybinding_1, defaultStyles_1, hoverDelegateFactory_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExcludePatternInputWidget = exports.IncludePatternInputWidget = exports.PatternInputWidget = void 0;
    let PatternInputWidget = class PatternInputWidget extends widget_1.Widget {
        static { this.OPTION_CHANGE = 'optionChange'; }
        constructor(parent, contextViewProvider, options, contextKeyService, configurationService, keybindingService) {
            super();
            this.contextViewProvider = contextViewProvider;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this._onSubmit = this._register(new event_1.Emitter());
            this.onSubmit = this._onSubmit.event;
            this._onCancel = this._register(new event_1.Emitter());
            this.onCancel = this._onCancel.event;
            options = {
                ...{
                    ariaLabel: nls.localize('defaultLabel', "input")
                },
                ...options,
            };
            this.width = options.width ?? 100;
            this.render(options);
            parent.appendChild(this.domNode);
        }
        dispose() {
            super.dispose();
            this.inputFocusTracker?.dispose();
        }
        setWidth(newWidth) {
            this.width = newWidth;
            this.contextViewProvider.layout();
            this.setInputWidth();
        }
        getValue() {
            return this.inputBox.value;
        }
        setValue(value) {
            if (this.inputBox.value !== value) {
                this.inputBox.value = value;
            }
        }
        select() {
            this.inputBox.select();
        }
        focus() {
            this.inputBox.focus();
        }
        inputHasFocus() {
            return this.inputBox.hasFocus();
        }
        setInputWidth() {
            this.inputBox.width = this.width - this.getSubcontrolsWidth() - 2; // 2 for input box border
        }
        getSubcontrolsWidth() {
            return 0;
        }
        getHistory() {
            return this.inputBox.getHistory();
        }
        clearHistory() {
            this.inputBox.clearHistory();
        }
        prependHistory(history) {
            this.inputBox.prependHistory(history);
        }
        clear() {
            this.setValue('');
        }
        onSearchSubmit() {
            this.inputBox.addToHistory();
        }
        showNextTerm() {
            this.inputBox.showNextValue();
        }
        showPreviousTerm() {
            this.inputBox.showPreviousValue();
        }
        render(options) {
            this.domNode = document.createElement('div');
            this.domNode.classList.add('monaco-findInput');
            this.inputBox = new contextScopedHistoryWidget_1.ContextScopedHistoryInputBox(this.domNode, this.contextViewProvider, {
                placeholder: options.placeholder,
                showPlaceholderOnFocus: options.showPlaceholderOnFocus,
                tooltip: options.tooltip,
                ariaLabel: options.ariaLabel,
                validationOptions: {
                    validation: undefined
                },
                history: options.history || [],
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this.keybindingService),
                inputBoxStyles: options.inputBoxStyles
            }, this.contextKeyService);
            this._register(this.inputBox.onDidChange(() => this._onSubmit.fire(true)));
            this.inputFocusTracker = dom.trackFocus(this.inputBox.inputElement);
            this.onkeyup(this.inputBox.inputElement, (keyboardEvent) => this.onInputKeyUp(keyboardEvent));
            const controls = document.createElement('div');
            controls.className = 'controls';
            this.renderSubcontrols(controls);
            this.domNode.appendChild(controls);
            this.setInputWidth();
        }
        renderSubcontrols(_controlsDiv) {
        }
        onInputKeyUp(keyboardEvent) {
            switch (keyboardEvent.keyCode) {
                case 3 /* KeyCode.Enter */:
                    this.onSearchSubmit();
                    this._onSubmit.fire(false);
                    return;
                case 9 /* KeyCode.Escape */:
                    this._onCancel.fire();
                    return;
            }
        }
    };
    exports.PatternInputWidget = PatternInputWidget;
    exports.PatternInputWidget = PatternInputWidget = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, keybinding_1.IKeybindingService)
    ], PatternInputWidget);
    let IncludePatternInputWidget = class IncludePatternInputWidget extends PatternInputWidget {
        constructor(parent, contextViewProvider, options, contextKeyService, configurationService, keybindingService) {
            super(parent, contextViewProvider, options, contextKeyService, configurationService, keybindingService);
            this._onChangeSearchInEditorsBoxEmitter = this._register(new event_1.Emitter());
            this.onChangeSearchInEditorsBox = this._onChangeSearchInEditorsBoxEmitter.event;
        }
        dispose() {
            super.dispose();
            this.useSearchInEditorsBox.dispose();
        }
        onlySearchInOpenEditors() {
            return this.useSearchInEditorsBox.checked;
        }
        setOnlySearchInOpenEditors(value) {
            this.useSearchInEditorsBox.checked = value;
            this._onChangeSearchInEditorsBoxEmitter.fire();
        }
        getSubcontrolsWidth() {
            return super.getSubcontrolsWidth() + this.useSearchInEditorsBox.width();
        }
        renderSubcontrols(controlsDiv) {
            this.useSearchInEditorsBox = this._register(new toggle_1.Toggle({
                icon: codicons_1.Codicon.book,
                title: nls.localize('onlySearchInOpenEditors', "Search only in Open Editors"),
                isChecked: false,
                hoverDelegate: (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                ...defaultStyles_1.defaultToggleStyles
            }));
            this._register(this.useSearchInEditorsBox.onChange(viaKeyboard => {
                this._onChangeSearchInEditorsBoxEmitter.fire();
                if (!viaKeyboard) {
                    this.inputBox.focus();
                }
            }));
            controlsDiv.appendChild(this.useSearchInEditorsBox.domNode);
            super.renderSubcontrols(controlsDiv);
        }
    };
    exports.IncludePatternInputWidget = IncludePatternInputWidget;
    exports.IncludePatternInputWidget = IncludePatternInputWidget = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, keybinding_1.IKeybindingService)
    ], IncludePatternInputWidget);
    let ExcludePatternInputWidget = class ExcludePatternInputWidget extends PatternInputWidget {
        constructor(parent, contextViewProvider, options, contextKeyService, configurationService, keybindingService) {
            super(parent, contextViewProvider, options, contextKeyService, configurationService, keybindingService);
            this._onChangeIgnoreBoxEmitter = this._register(new event_1.Emitter());
            this.onChangeIgnoreBox = this._onChangeIgnoreBoxEmitter.event;
        }
        dispose() {
            super.dispose();
            this.useExcludesAndIgnoreFilesBox.dispose();
        }
        useExcludesAndIgnoreFiles() {
            return this.useExcludesAndIgnoreFilesBox.checked;
        }
        setUseExcludesAndIgnoreFiles(value) {
            this.useExcludesAndIgnoreFilesBox.checked = value;
            this._onChangeIgnoreBoxEmitter.fire();
        }
        getSubcontrolsWidth() {
            return super.getSubcontrolsWidth() + this.useExcludesAndIgnoreFilesBox.width();
        }
        renderSubcontrols(controlsDiv) {
            this.useExcludesAndIgnoreFilesBox = this._register(new toggle_1.Toggle({
                icon: codicons_1.Codicon.exclude,
                actionClassName: 'useExcludesAndIgnoreFiles',
                title: nls.localize('useExcludesAndIgnoreFilesDescription', "Use Exclude Settings and Ignore Files"),
                isChecked: true,
                hoverDelegate: (0, hoverDelegateFactory_1.getDefaultHoverDelegate)('element'),
                ...defaultStyles_1.defaultToggleStyles
            }));
            this._register(this.useExcludesAndIgnoreFilesBox.onChange(viaKeyboard => {
                this._onChangeIgnoreBoxEmitter.fire();
                if (!viaKeyboard) {
                    this.inputBox.focus();
                }
            }));
            controlsDiv.appendChild(this.useExcludesAndIgnoreFilesBox.domNode);
            super.renderSubcontrols(controlsDiv);
        }
    };
    exports.ExcludePatternInputWidget = ExcludePatternInputWidget;
    exports.ExcludePatternInputWidget = ExcludePatternInputWidget = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, keybinding_1.IKeybindingService)
    ], ExcludePatternInputWidget);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0dGVybklucHV0V2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy93b3JrYmVuY2gvY29udHJpYi9zZWFyY2gvYnJvd3Nlci9wYXR0ZXJuSW5wdXRXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBOEJ6RixJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLGVBQU07aUJBRXRDLGtCQUFhLEdBQVcsY0FBYyxBQUF6QixDQUEwQjtRQWU5QyxZQUFZLE1BQW1CLEVBQVUsbUJBQXlDLEVBQUUsT0FBaUIsRUFDaEYsaUJBQXNELEVBQ25ELG9CQUE4RCxFQUNqRSxpQkFBc0Q7WUFFMUUsS0FBSyxFQUFFLENBQUM7WUFMZ0Msd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFzQjtZQUM1QyxzQkFBaUIsR0FBakIsaUJBQWlCLENBQW9CO1lBQ2hDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7WUFDaEQsc0JBQWlCLEdBQWpCLGlCQUFpQixDQUFvQjtZQVRuRSxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBVyxDQUFDLENBQUM7WUFDM0QsYUFBUSxHQUErQyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQUVwRSxjQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDeEQsYUFBUSxHQUFzQixJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztZQVFsRCxPQUFPLEdBQUc7Z0JBQ1QsR0FBRztvQkFDRixTQUFTLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDO2lCQUNoRDtnQkFDRCxHQUFHLE9BQU87YUFDVixDQUFDO1lBQ0YsSUFBSSxDQUFDLEtBQUss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