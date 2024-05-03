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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/color", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/contrib/colorPicker/browser/color", "vs/editor/contrib/colorPicker/browser/colorDetector", "vs/editor/contrib/colorPicker/browser/colorPickerModel", "vs/editor/contrib/colorPicker/browser/colorPickerWidget", "vs/platform/theme/common/themeService", "vs/base/browser/dom"], function (require, exports, async_1, cancellation_1, color_1, lifecycle_1, range_1, color_2, colorDetector_1, colorPickerModel_1, colorPickerWidget_1, themeService_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneColorPickerParticipant = exports.StandaloneColorPickerHover = exports.ColorHoverParticipant = exports.ColorHover = void 0;
    class ColorHover {
        constructor(owner, range, model, provider) {
            this.owner = owner;
            this.range = range;
            this.model = model;
            this.provider = provider;
            /**
             * Force the hover to always be rendered at this specific range,
             * even in the case of multiple hover parts.
             */
            this.forceShowAtRange = true;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.ColorHover = ColorHover;
    let ColorHoverParticipant = class ColorHoverParticipant {
        constructor(_editor, _themeService) {
            this._editor = _editor;
            this._themeService = _themeService;
            this.hoverOrdinal = 2;
        }
        computeSync(_anchor, _lineDecorations) {
            return [];
        }
        computeAsync(anchor, lineDecorations, token) {
            return async_1.AsyncIterableObject.fromPromise(this._computeAsync(anchor, lineDecorations, token));
        }
        async _computeAsync(_anchor, lineDecorations, _token) {
            if (!this._editor.hasModel()) {
                return [];
            }
            const colorDetector = colorDetector_1.ColorDetector.get(this._editor);
            if (!colorDetector) {
                return [];
            }
            for (const d of lineDecorations) {
                if (!colorDetector.isColorDecoration(d)) {
                    continue;
                }
                const colorData = colorDetector.getColorData(d.range.getStartPosition());
                if (colorData) {
                    const colorHover = await _createColorHover(this, this._editor.getModel(), colorData.colorInfo, colorData.provider);
                    return [colorHover];
                }
            }
            return [];
        }
        renderHoverParts(context, hoverParts) {
            return renderHoverParts(this, this._editor, this._themeService, hoverParts, context);
        }
    };
    exports.ColorHoverParticipant = ColorHoverParticipant;
    exports.ColorHoverParticipant = ColorHoverParticipant = __decorate([
        __param(1, themeService_1.IThemeService)
    ], ColorHoverParticipant);
    class StandaloneColorPickerHover {
        constructor(owner, range, model, provider) {
            this.owner = owner;
            this.range = range;
            this.model = model;
            this.provider = provider;
        }
    }
    exports.StandaloneColorPickerHover = StandaloneColorPickerHover;
    let StandaloneColorPickerParticipant = class StandaloneColorPickerParticipant {
        constructor(_editor, _themeService) {
            this._editor = _editor;
            this._themeService = _themeService;
            this.hoverOrdinal = 2;
            this._color = null;
        }
        async createColorHover(defaultColorInfo, defaultColorProvider, colorProviderRegistry) {
            if (!this._editor.hasModel()) {
                return null;
            }
            const colorDetector = colorDetector_1.ColorDetector.get(this._editor);
            if (!colorDetector) {
                return null;
            }
            const colors = await (0, color_2.getColors)(colorProviderRegistry, this._editor.getModel(), cancellation_1.CancellationToken.None);
            let foundColorInfo = null;
            let foundColorProvider = null;
            for (const colorData of colors) {
                const colorInfo = colorData.colorInfo;
                if (range_1.Range.containsRange(colorInfo.range, defaultColorInfo.range)) {
                    foundColorInfo = colorInfo;
                    foundColorProvider = colorData.provider;
                }
            }
            const colorInfo = foundColorInfo ?? defaultColorInfo;
            const colorProvider = foundColorProvider ?? defaultColorProvider;
            const foundInEditor = !!foundColorInfo;
            return { colorHover: await _createColorHover(this, this._editor.getModel(), colorInfo, colorProvider), foundInEditor: foundInEditor };
        }
        async updateEditorModel(colorHoverData) {
            if (!this._editor.hasModel()) {
                return;
            }
            const colorPickerModel = colorHoverData.model;
            let range = new range_1.Range(colorHoverData.range.startLineNumber, colorHoverData.range.startColumn, colorHoverData.range.endLineNumber, colorHoverData.range.endColumn);
            if (this._color) {
                await _updateColorPresentations(this._editor.getModel(), colorPickerModel, this._color, range, colorHoverData);
                range = _updateEditorModel(this._editor, range, colorPickerModel);
            }
        }
        renderHoverParts(context, hoverParts) {
            return renderHoverParts(this, this._editor, this._themeService, hoverParts, context);
        }
        set color(color) {
            this._color = color;
        }
        get color() {
            return this._color;
        }
    };
    exports.StandaloneColorPickerParticipant = StandaloneColorPickerParticipant;
    exports.StandaloneColorPickerParticipant = StandaloneColorPickerParticipant = __decorate([
        __param(1, themeService_1.IThemeService)
    ], StandaloneColorPickerParticipant);
    async function _createColorHover(participant, editorModel, colorInfo, provider) {
        const originalText = editorModel.getValueInRange(colorInfo.range);
        const { red, green, blue, alpha } = colorInfo.color;
        const rgba = new color_1.RGBA(Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), alpha);
        const color = new color_1.Color(rgba);
        const colorPresentations = await (0, color_2.getColorPresentations)(editorModel, colorInfo, provider, cancellation_1.CancellationToken.None);
        const model = new colorPickerModel_1.ColorPickerModel(color, [], 0);
        model.colorPresentations = colorPresentations || [];
        model.guessColorPresentation(color, originalText);
        if (participant instanceof ColorHoverParticipant) {
            return new ColorHover(participant, range_1.Range.lift(colorInfo.range), model, provider);
        }
        else {
            return new StandaloneColorPickerHover(participant, range_1.Range.lift(colorInfo.range), model, provider);
        }
    }
    function renderHoverParts(participant, editor, themeService, hoverParts, context) {
        if (hoverParts.length === 0 || !editor.hasModel()) {
            return lifecycle_1.Disposable.None;
        }
        if (context.setMinimumDimensions) {
            const minimumHeight = editor.getOption(67 /* EditorOption.lineHeight */) + 8;
            context.setMinimumDimensions(new dom_1.Dimension(302, minimumHeight));
        }
        const disposables = new lifecycle_1.DisposableStore();
        const colorHover = hoverParts[0];
        const editorModel = editor.getModel();
        const model = colorHover.model;
        const widget = disposables.add(new colorPickerWidget_1.ColorPickerWidget(context.fragment, model, editor.getOption(143 /* EditorOption.pixelRatio */), themeService, participant instanceof StandaloneColorPickerParticipant));
        context.setColorPicker(widget);
        let editorUpdatedByColorPicker = false;
        let range = new range_1.Range(colorHover.range.startLineNumber, colorHover.range.startColumn, colorHover.range.endLineNumber, colorHover.range.endColumn);
        if (participant instanceof StandaloneColorPickerParticipant) {
            const color = hoverParts[0].model.color;
            participant.color = color;
            _updateColorPresentations(editorModel, model, color, range, colorHover);
            disposables.add(model.onColorFlushed((color) => {
                participant.color = color;
            }));
        }
        else {
            disposables.add(model.onColorFlushed(async (color) => {
                await _updateColorPresentations(editorModel, model, color, range, colorHover);
                editorUpdatedByColorPicker = true;
                range = _updateEditorModel(editor, range, model);
            }));
        }
        disposables.add(model.onDidChangeColor((color) => {
            _updateColorPresentations(editorModel, model, color, range, colorHover);
        }));
        disposables.add(editor.onDidChangeModelContent((e) => {
            if (editorUpdatedByColorPicker) {
                editorUpdatedByColorPicker = false;
            }
            else {
                context.hide();
                editor.focus();
            }
        }));
        return disposables;
    }
    function _updateEditorModel(editor, range, model) {
        const textEdits = [];
        const edit = model.presentation.textEdit ?? { range, text: model.presentation.label, forceMoveMarkers: false };
        textEdits.push(edit);
        if (model.presentation.additionalTextEdits) {
            textEdits.push(...model.presentation.additionalTextEdits);
        }
        const replaceRange = range_1.Range.lift(edit.range);
        const trackedRange = editor.getModel()._setTrackedRange(null, replaceRange, 3 /* TrackedRangeStickiness.GrowsOnlyWhenTypingAfter */);
        editor.executeEdits('colorpicker', textEdits);
        editor.pushUndoStop();
        return editor.getModel()._getTrackedRange(trackedRange) ?? replaceRange;
    }
    async function _updateColorPresentations(editorModel, colorPickerModel, color, range, colorHover) {
        const colorPresentations = await (0, color_2.getColorPresentations)(editorModel, {
            range: range,
            color: {
                red: color.rgba.r / 255,
                green: color.rgba.g / 255,
                blue: color.rgba.b / 255,
                alpha: color.rgba.a
            }
        }, colorHover.provider, cancellation_1.CancellationToken.None);
        colorPickerModel.colorPresentations = colorPresentations || [];
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JIb3ZlclBhcnRpY2lwYW50LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9jb2xvclBpY2tlci9icm93c2VyL2NvbG9ySG92ZXJQYXJ0aWNpcGFudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUFxQmhHLE1BQWEsVUFBVTtRQVF0QixZQUNpQixLQUEwQyxFQUMxQyxLQUFZLEVBQ1osS0FBdUIsRUFDdkIsUUFBK0I7WUFIL0IsVUFBSyxHQUFMLEtBQUssQ0FBcUM7WUFDMUMsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLFVBQUssR0FBTCxLQUFLLENBQWtCO1lBQ3ZCLGFBQVEsR0FBUixRQUFRLENBQXVCO1lBVmhEOzs7ZUFHRztZQUNhLHFCQUFnQixHQUFZLElBQUksQ0FBQztRQU83QyxDQUFDO1FBRUUscUJBQXFCLENBQUMsTUFBbUI7WUFDL0MsT0FBTyxDQUNOLE1BQU0sQ0FBQyxJQUFJLGtDQUEwQjttQkFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXO21CQUNsRCxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FDakQsQ0FBQztRQUNILENBQUM7S0FDRDtJQXRCRCxnQ0FzQkM7SUFFTSxJQUFNLHFCQUFxQixHQUEzQixNQUFNLHFCQUFxQjtRQUlqQyxZQUNrQixPQUFvQixFQUN0QixhQUE2QztZQUQzQyxZQUFPLEdBQVAsT0FBTyxDQUFhO1lBQ0wsa0JBQWEsR0FBYixhQUFhLENBQWU7WUFKN0MsaUJBQVksR0FBVyxDQUFDLENBQUM7UUFLckMsQ0FBQztRQUVFLFdBQVcsQ0FBQyxPQUFvQixFQUFFLGdCQUFvQztZQUM1RSxPQUFPLEVBQUUs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