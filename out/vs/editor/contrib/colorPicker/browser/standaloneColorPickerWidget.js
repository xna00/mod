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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/contrib/colorPicker/browser/colorHoverParticipant", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/hover/browser/contentHover", "vs/platform/keybinding/common/keybinding", "vs/base/common/event", "vs/editor/common/services/languageFeatures", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/editor/common/services/model", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/contrib/colorPicker/browser/defaultDocumentColorProvider", "vs/base/browser/dom", "vs/css!./colorPicker"], function (require, exports, lifecycle_1, colorHoverParticipant_1, instantiation_1, contentHover_1, keybinding_1, event_1, languageFeatures_1, editorExtensions_1, editorContextKeys_1, contextkey_1, model_1, languageConfigurationRegistry_1, defaultDocumentColorProvider_1, dom) {
    "use strict";
    var StandaloneColorPickerController_1, StandaloneColorPickerWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneColorPickerWidget = exports.StandaloneColorPickerController = void 0;
    let StandaloneColorPickerController = class StandaloneColorPickerController extends lifecycle_1.Disposable {
        static { StandaloneColorPickerController_1 = this; }
        static { this.ID = 'editor.contrib.standaloneColorPickerController'; }
        constructor(_editor, _contextKeyService, _modelService, _keybindingService, _instantiationService, _languageFeatureService, _languageConfigurationService) {
            super();
            this._editor = _editor;
            this._modelService = _modelService;
            this._keybindingService = _keybindingService;
            this._instantiationService = _instantiationService;
            this._languageFeatureService = _languageFeatureService;
            this._languageConfigurationService = _languageConfigurationService;
            this._standaloneColorPickerWidget = null;
            this._standaloneColorPickerVisible = editorContextKeys_1.EditorContextKeys.standaloneColorPickerVisible.bindTo(_contextKeyService);
            this._standaloneColorPickerFocused = editorContextKeys_1.EditorContextKeys.standaloneColorPickerFocused.bindTo(_contextKeyService);
        }
        showOrFocus() {
            if (!this._editor.hasModel()) {
                return;
            }
            if (!this._standaloneColorPickerVisible.get()) {
                this._standaloneColorPickerWidget = new StandaloneColorPickerWidget(this._editor, this._standaloneColorPickerVisible, this._standaloneColorPickerFocused, this._instantiationService, this._modelService, this._keybindingService, this._languageFeatureService, this._languageConfigurationService);
            }
            else if (!this._standaloneColorPickerFocused.get()) {
                this._standaloneColorPickerWidget?.focus();
            }
        }
        hide() {
            this._standaloneColorPickerFocused.set(false);
            this._standaloneColorPickerVisible.set(false);
            this._standaloneColorPickerWidget?.hide();
            this._editor.focus();
        }
        insertColor() {
            this._standaloneColorPickerWidget?.updateEditor();
            this.hide();
        }
        static get(editor) {
            return editor.getContribution(StandaloneColorPickerController_1.ID);
        }
    };
    exports.StandaloneColorPickerController = StandaloneColorPickerController;
    exports.StandaloneColorPickerController = StandaloneColorPickerController = StandaloneColorPickerController_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, model_1.IModelService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, languageFeatures_1.ILanguageFeaturesService),
        __param(6, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], StandaloneColorPickerController);
    (0, editorExtensions_1.registerEditorContribution)(StandaloneColorPickerController.ID, StandaloneColorPickerController, 1 /* EditorContributionInstantiation.AfterFirstRender */);
    const PADDING = 8;
    const CLOSE_BUTTON_WIDTH = 22;
    let StandaloneColorPickerWidget = class StandaloneColorPickerWidget extends lifecycle_1.Disposable {
        static { StandaloneColorPickerWidget_1 = this; }
        static { this.ID = 'editor.contrib.standaloneColorPickerWidget'; }
        constructor(_editor, _standaloneColorPickerVisible, _standaloneColorPickerFocused, _instantiationService, _modelService, _keybindingService, _languageFeaturesService, _languageConfigurationService) {
            super();
            this._editor = _editor;
            this._standaloneColorPickerVisible = _standaloneColorPickerVisible;
            this._standaloneColorPickerFocused = _standaloneColorPickerFocused;
            this._modelService = _modelService;
            this._keybindingService = _keybindingService;
            this._languageFeaturesService = _languageFeaturesService;
            this._languageConfigurationService = _languageConfigurationService;
            this.allowEditorOverflow = true;
            this._position = undefined;
            this._body = document.createElement('div');
            this._colorHover = null;
            this._selectionSetInEditor = false;
            this._onResult = this._register(new event_1.Emitter());
            this.onResult = this._onResult.event;
            this._standaloneColorPickerVisible.set(true);
            this._standaloneColorPickerParticipant = _instantiationService.createInstance(colorHoverParticipant_1.StandaloneColorPickerParticipant, this._editor);
            this._position = this._editor._getViewModel()?.getPrimaryCursorState().modelState.position;
            const editorSelection = this._editor.getSelection();
            const selection = editorSelection ?
                {
                    startLineNumber: editorSelection.startLineNumber,
                    startColumn: editorSelection.startColumn,
                    endLineNumber: editorSelection.endLineNumber,
                    endColumn: editorSelection.endColumn
                } : { startLineNumber: 0, endLineNumber: 0, endColumn: 0, startColumn: 0 };
            const focusTracker = this._register(dom.trackFocus(this._body));
            this._register(focusTracker.onDidBlur(_ => {
                this.hide();
            }));
            this._register(focusTracker.onDidFocus(_ => {
                this.focus();
            }));
            // When the cursor position changes, hide the color picker
            this._register(this._editor.onDidChangeCursorPosition(() => {
                // Do not hide the color picker when the cursor changes position due to the keybindings
                if (!this._selectionSetInEditor) {
                    this.hide();
                }
                else {
                    this._selectionSetInEditor = false;
                }
            }));
            this._register(this._editor.onMouseMove((e) => {
                const classList = e.target.element?.classList;
                if (classList && classList.contains('colorpicker-color-decoration')) {
                    this.hide();
                }
            }));
            this._register(this.onResult((result) => {
                this._render(result.value, result.foundInEditor);
            }));
            this._start(selection);
            this._body.style.zIndex = '50';
            this._editor.addContentWidget(this);
        }
        updateEditor() {
            if (this._colorHover) {
                this._standaloneColorPickerParticipant.updateEditorModel(this._colorHover);
            }
        }
        getId() {
            return StandaloneColorPickerWidget_1.ID;
        }
        getDomNode() {
            return this._body;
        }
        getPosition() {
            if (!this._position) {
                return null;
            }
            const positionPreference = this._editor.getOption(60 /* EditorOption.hover */).above;
            return {
                position: this._position,
                secondaryPosition: this._position,
                preference: positionPreference ? [1 /* ContentWidgetPositionPreference.ABOVE */, 2 /* ContentWidgetPositionPreference.BELOW */] : [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */],
                positionAffinity: 2 /* PositionAffinity.None */
            };
        }
        hide() {
            this.dispose();
            this._standaloneColorPickerVisible.set(false);
            this._standaloneColorPickerFocused.set(false);
            this._editor.removeContentWidget(this);
            this._editor.focus();
        }
        focus() {
            this._standaloneColorPickerFocused.set(true);
            this._body.focus();
        }
        async _start(selection) {
            const computeAsyncResult = await this._computeAsync(selection);
            if (!computeAsyncResult) {
                return;
            }
            this._onResult.fire(new StandaloneColorPickerResult(computeAsyncResult.result, computeAsyncResult.foundInEditor));
        }
        async _computeAsync(range) {
            if (!this._editor.hasModel()) {
                return null;
            }
            const colorInfo = {
                range: range,
                color: { red: 0, green: 0, blue: 0, alpha: 1 }
            };
            const colorHoverResult = await this._standaloneColorPickerParticipant.createColorHover(colorInfo, new defaultDocumentColorProvider_1.DefaultDocumentColorProvider(this._modelService, this._languageConfigurationService), this._languageFeaturesService.colorProvider);
            if (!colorHoverResult) {
                return null;
            }
            return { result: colorHoverResult.colorHover, foundInEditor: colorHoverResult.foundInEditor };
        }
        _render(colorHover, foundInEditor) {
            const fragment = document.createDocumentFragment();
            const statusBar = this._register(new contentHover_1.EditorHoverStatusBar(this._keybindingService));
            let colorPickerWidget;
            const context = {
                fragment,
                statusBar,
                setColorPicker: (widget) => colorPickerWidget = widget,
                onContentsChanged: () => { },
                hide: () => this.hide()
            };
            this._colorHover = colorHover;
            this._register(this._standaloneColorPickerParticipant.renderHoverParts(context, [colorHover]));
            if (colorPickerWidget === undefined) {
                return;
            }
            this._body.classList.add('standalone-colorpicker-body');
            this._body.style.maxHeight = Math.max(this._editor.getLayoutInfo().height / 4, 250) + 'px';
            this._body.style.maxWidth = Math.max(this._editor.getLayoutInfo().width * 0.66, 500) + 'px';
            this._body.tabIndex = 0;
            this._body.appendChild(fragment);
            colorPickerWidget.layout();
            const colorPickerBody = colorPickerWidget.body;
            const saturationBoxWidth = colorPickerBody.saturationBox.domNode.clientWidth;
            const widthOfOriginalColorBox = colorPickerBody.domNode.clientWidth - saturationBoxWidth - CLOSE_BUTTON_WIDTH - PADDING;
            const enterButton = colorPickerWidget.body.enterButton;
            enterButton?.onClicked(() => {
                this.updateEditor();
                this.hide();
            });
            const colorPickerHeader = colorPickerWidget.header;
            const pickedColorNode = colorPickerHeader.pickedColorNode;
            pickedColorNode.style.width = saturationBoxWidth + PADDING + 'px';
            const originalColorNode = colorPickerHeader.originalColorNode;
            originalColorNode.style.width = widthOfOriginalColorBox + 'px';
            const closeButton = colorPickerWidget.header.closeButton;
            closeButton?.onClicked(() => {
                this.hide();
            });
            // When found in the editor, highlight the selection in the editor
            if (foundInEditor) {
                if (enterButton) {
                    enterButton.button.textContent = 'Replace';
                }
                this._selectionSetInEditor = true;
                this._editor.setSelection(colorHover.range);
            }
            this._editor.layoutContentWidget(this);
        }
    };
    exports.StandaloneColorPickerWidget = StandaloneColorPickerWidget;
    exports.StandaloneColorPickerWidget = StandaloneColorPickerWidget = StandaloneColorPickerWidget_1 = __decorate([
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, languageFeatures_1.ILanguageFeaturesService),
        __param(7, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], StandaloneColorPickerWidget);
    class StandaloneColorPickerResult {
        // The color picker result consists of: an array of color results and a boolean indicating if the color was found in the editor
        constructor(value, foundInEditor) {
            this.value = value;
            this.foundInEditor = foundInEditor;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhbmRhbG9uZUNvbG9yUGlja2VyV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2xvclBpY2tlci9icm93c2VyL3N0YW5kYWxvbmVDb2xvclBpY2tlcldpZGdldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMkJ6RixJQUFNLCtCQUErQixHQUFyQyxNQUFNLCtCQUFnQyxTQUFRLHNCQUFVOztpQkFFaEQsT0FBRSxHQUFHLGdEQUFnRCxBQUFuRCxDQUFvRDtRQUtwRSxZQUNrQixPQUFvQixFQUNqQixrQkFBc0MsRUFDM0MsYUFBNkMsRUFDeEMsa0JBQXVELEVBQ3BELHFCQUE2RCxFQUMxRCx1QkFBa0UsRUFDN0QsNkJBQTZFO1lBRTVHLEtBQUssRUFBRSxDQUFDO1lBUlMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUVMLGtCQUFhLEdBQWIsYUFBYSxDQUFlO1lBQ3ZCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUFDbkMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF1QjtZQUN6Qyw0QkFBdUIsR0FBdkIsdUJBQXVCLENBQTBCO1lBQzVDLGtDQUE2QixHQUE3Qiw2QkFBNkIsQ0FBK0I7WUFYckcsaUNBQTRCLEdBQXVDLElBQUksQ0FBQztZQWMvRSxJQUFJLENBQUMsNkJBQTZCLEdBQUcscUNBQWlCLENBQUMsNEJBQTRCLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDL0csSUFBSSxDQUFDLDZCQUE2QixHQUFHLHFDQUFpQixDQUFDLDRCQUE0QixDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hILENBQUM7UUFFTSxXQUFXO1lBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENB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