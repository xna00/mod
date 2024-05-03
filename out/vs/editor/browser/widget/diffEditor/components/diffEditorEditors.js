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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/observable", "vs/editor/browser/widget/diffEditor/features/overviewRulerFeature", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding"], function (require, exports, event_1, lifecycle_1, observable_1, overviewRulerFeature_1, editorOptions_1, position_1, nls_1, instantiation_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorEditors = void 0;
    let DiffEditorEditors = class DiffEditorEditors extends lifecycle_1.Disposable {
        get onDidContentSizeChange() { return this._onDidContentSizeChange.event; }
        constructor(originalEditorElement, modifiedEditorElement, _options, _argCodeEditorWidgetOptions, _createInnerEditor, _instantiationService, _keybindingService) {
            super();
            this.originalEditorElement = originalEditorElement;
            this.modifiedEditorElement = modifiedEditorElement;
            this._options = _options;
            this._argCodeEditorWidgetOptions = _argCodeEditorWidgetOptions;
            this._createInnerEditor = _createInnerEditor;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this.original = this._register(this._createLeftHandSideEditor(this._options.editorOptions.get(), this._argCodeEditorWidgetOptions.originalEditor || {}));
            this.modified = this._register(this._createRightHandSideEditor(this._options.editorOptions.get(), this._argCodeEditorWidgetOptions.modifiedEditor || {}));
            this._onDidContentSizeChange = this._register(new event_1.Emitter());
            this.modifiedScrollTop = (0, observable_1.observableFromEvent)(this.modified.onDidScrollChange, () => /** @description modified.getScrollTop */ this.modified.getScrollTop());
            this.modifiedScrollHeight = (0, observable_1.observableFromEvent)(this.modified.onDidScrollChange, () => /** @description modified.getScrollHeight */ this.modified.getScrollHeight());
            this.modifiedModel = (0, observable_1.observableFromEvent)(this.modified.onDidChangeModel, () => /** @description modified.model */ this.modified.getModel());
            this.modifiedSelections = (0, observable_1.observableFromEvent)(this.modified.onDidChangeCursorSelection, () => this.modified.getSelections() ?? []);
            this.modifiedCursor = (0, observable_1.derivedOpts)({ owner: this, equalityComparer: position_1.Position.equals }, reader => this.modifiedSelections.read(reader)[0]?.getPosition() ?? new position_1.Position(1, 1));
            this.originalCursor = (0, observable_1.observableFromEvent)(this.original.onDidChangeCursorPosition, () => this.original.getPosition() ?? new position_1.Position(1, 1));
            this.isOriginalFocused = (0, observable_1.observableFromEvent)(event_1.Event.any(this.original.onDidFocusEditorWidget, this.original.onDidBlurEditorWidget), () => this.original.hasWidgetFocus());
            this.isModifiedFocused = (0, observable_1.observableFromEvent)(event_1.Event.any(this.modified.onDidFocusEditorWidget, this.modified.onDidBlurEditorWidget), () => this.modified.hasWidgetFocus());
            this.isFocused = (0, observable_1.derived)(this, reader => this.isOriginalFocused.read(reader) || this.isModifiedFocused.read(reader));
            this._argCodeEditorWidgetOptions = null;
            this._register((0, observable_1.autorunHandleChanges)({
                createEmptyChangeSummary: () => ({}),
                handleChange: (ctx, changeSummary) => {
                    if (ctx.didChange(_options.editorOptions)) {
                        Object.assign(changeSummary, ctx.change.changedOptions);
                    }
                    return true;
                }
            }, (reader, changeSummary) => {
                /** @description update editor options */
                _options.editorOptions.read(reader);
                this._options.renderSideBySide.read(reader);
                this.modified.updateOptions(this._adjustOptionsForRightHandSide(reader, changeSummary));
                this.original.updateOptions(this._adjustOptionsForLeftHandSide(reader, changeSummary));
            }));
        }
        _createLeftHandSideEditor(options, codeEditorWidgetOptions) {
            const leftHandSideOptions = this._adjustOptionsForLeftHandSide(undefined, options);
            const editor = this._constructInnerEditor(this._instantiationService, this.originalEditorElement, leftHandSideOptions, codeEditorWidgetOptions);
            editor.setContextValue('isInDiffLeftEditor', true);
            return editor;
        }
        _createRightHandSideEditor(options, codeEditorWidgetOptions) {
            const rightHandSideOptions = this._adjustOptionsForRightHandSide(undefined, options);
            const editor = this._constructInnerEditor(this._instantiationService, this.modifiedEditorElement, rightHandSideOptions, codeEditorWidgetOptions);
            editor.setContextValue('isInDiffRightEditor', true);
            return editor;
        }
        _constructInnerEditor(instantiationService, container, options, editorWidgetOptions) {
            const editor = this._createInnerEditor(instantiationService, container, options, editorWidgetOptions);
            this._register(editor.onDidContentSizeChange(e => {
                const width = this.original.getContentWidth() + this.modified.getContentWidth() + overviewRulerFeature_1.OverviewRulerFeature.ENTIRE_DIFF_OVERVIEW_WIDTH;
                const height = Math.max(this.modified.getContentHeight(), this.original.getContentHeight());
                this._onDidContentSizeChange.fire({
                    contentHeight: height,
                    contentWidth: width,
                    contentHeightChanged: e.contentHeightChanged,
                    contentWidthChanged: e.contentWidthChanged
                });
            }));
            return editor;
        }
        _adjustOptionsForLeftHandSide(_reader, changedOptions) {
            const result = this._adjustOptionsForSubEditor(changedOptions);
            if (!this._options.renderSideBySide.get()) {
                // never wrap hidden editor
                result.wordWrapOverride1 = 'off';
                result.wordWrapOverride2 = 'off';
                result.stickyScroll = { enabled: false };
                // Disable unicode highlighting for the original side in inline mode, as they are not shown anyway.
                result.unicodeHighlight = { nonBasicASCII: false, ambiguousCharacters: false, invisibleCharacters: false };
            }
            else {
                result.unicodeHighlight = this._options.editorOptions.get().unicodeHighlight || {};
                result.wordWrapOverride1 = this._options.diffWordWrap.get();
            }
            result.glyphMargin = this._options.renderSideBySide.get();
            if (changedOptions.originalAriaLabel) {
                result.ariaLabel = changedOptions.originalAriaLabel;
            }
            result.ariaLabel = this._updateAriaLabel(result.ariaLabel);
            result.readOnly = !this._options.originalEditable.get();
            result.dropIntoEditor = { enabled: !result.readOnly };
            result.extraEditorClassName = 'original-in-monaco-diff-editor';
            return result;
        }
        _adjustOptionsForRightHandSide(reader, changedOptions) {
            const result = this._adjustOptionsForSubEditor(changedOptions);
            if (changedOptions.modifiedAriaLabel) {
                result.ariaLabel = changedOptions.modifiedAriaLabel;
            }
            result.ariaLabel = this._updateAriaLabel(result.ariaLabel);
            result.wordWrapOverride1 = this._options.diffWordWrap.get();
            result.revealHorizontalRightPadding = editorOptions_1.EditorOptions.revealHorizontalRightPadding.defaultValue + overviewRulerFeature_1.OverviewRulerFeature.ENTIRE_DIFF_OVERVIEW_WIDTH;
            result.scrollbar.verticalHasArrows = false;
            result.extraEditorClassName = 'modified-in-monaco-diff-editor';
            return result;
        }
        _adjustOptionsForSubEditor(options) {
            const clonedOptions = {
                ...options,
                dimension: {
                    height: 0,
                    width: 0
                },
            };
            clonedOptions.inDiffEditor = true;
            clonedOptions.automaticLayout = false;
            // Clone scrollbar options before changing them
            clonedOptions.scrollbar = { ...(clonedOptions.scrollbar || {}) };
            clonedOptions.folding = false;
            clonedOptions.codeLens = this._options.diffCodeLens.get();
            clonedOptions.fixedOverflowWidgets = true;
            // Clone minimap options before changing them
            clonedOptions.minimap = { ...(clonedOptions.minimap || {}) };
            clonedOptions.minimap.enabled = false;
            if (this._options.hideUnchangedRegions.get()) {
                clonedOptions.stickyScroll = { enabled: false };
            }
            else {
                clonedOptions.stickyScroll = this._options.editorOptions.get().stickyScroll;
            }
            return clonedOptions;
        }
        _updateAriaLabel(ariaLabel) {
            if (!ariaLabel) {
                ariaLabel = '';
            }
            const ariaNavigationTip = (0, nls_1.localize)('diff-aria-navigation-tip', ' use {0} to open the accessibility help.', this._keybindingService.lookupKeybinding('editor.action.accessibilityHelp')?.getAriaLabel());
            if (this._options.accessibilityVerbose.get()) {
                return ariaLabel + ariaNavigationTip;
            }
            else if (ariaLabel) {
                return ariaLabel.replaceAll(ariaNavigationTip, '');
            }
            return '';
        }
    };
    exports.DiffEditorEditors = DiffEditorEditors;
    exports.DiffEditorEditors = DiffEditorEditors = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, keybinding_1.IKeybindingService)
    ], DiffEditorEditors);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkVkaXRvckVkaXRvcnMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3dpZGdldC9kaWZmRWRpdG9yL2NvbXBvbmVudHMvZGlmZkVkaXRvckVkaXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBa0J6RixJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFVO1FBS2hELElBQVcsc0JBQXNCLEtBQUssT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQWlCbEYsWUFDa0IscUJBQWtDLEVBQ2xDLHFCQUFrQyxFQUNsQyxRQUEyQixFQUNwQywyQkFBeUQsRUFDaEQsa0JBQStMLEVBQ3pMLHFCQUE2RCxFQUNoRSxrQkFBdUQ7WUFFM0UsS0FBSyxFQUFFLENBQUM7WUFSUywwQkFBcUIsR0FBckIscUJBQXFCLENBQWE7WUFDbEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFhO1lBQ2xDLGFBQVEsR0FBUixRQUFRLENBQW1CO1lBQ3BDLGdDQUEyQixHQUEzQiwyQkFBMkIsQ0FBOEI7WUFDaEQsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUE2SztZQUN4SywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQy9DLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUE1QjVELGFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsMkJBQTJCLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEosYUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFD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