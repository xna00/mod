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
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stopwatch", "vs/base/common/strings", "vs/editor/browser/editorDom", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/colorPicker/browser/color", "vs/platform/configuration/common/configuration"], function (require, exports, async_1, color_1, errors_1, event_1, lifecycle_1, stopwatch_1, strings_1, editorDom_1, editorExtensions_1, range_1, textModel_1, languageFeatureDebounce_1, languageFeatures_1, color_2, configuration_1) {
    "use strict";
    var ColorDetector_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DecoratorLimitReporter = exports.ColorDetector = exports.ColorDecorationInjectedTextMarker = void 0;
    exports.ColorDecorationInjectedTextMarker = Object.create({});
    let ColorDetector = class ColorDetector extends lifecycle_1.Disposable {
        static { ColorDetector_1 = this; }
        static { this.ID = 'editor.contrib.colorDetector'; }
        static { this.RECOMPUTE_TIME = 1000; } // ms
        constructor(_editor, _configurationService, _languageFeaturesService, languageFeatureDebounceService) {
            super();
            this._editor = _editor;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this._localToDispose = this._register(new lifecycle_1.DisposableStore());
            this._decorationsIds = [];
            this._colorDatas = new Map();
            this._colorDecoratorIds = this._editor.createDecorationsCollection();
            this._ruleFactory = new editorDom_1.DynamicCssRules(this._editor);
            this._decoratorLimitReporter = new DecoratorLimitReporter();
            this._colorDecorationClassRefs = this._register(new lifecycle_1.DisposableStore());
            this._debounceInformation = languageFeatureDebounceService.for(_languageFeaturesService.colorProvider, 'Document Colors', { min: ColorDetector_1.RECOMPUTE_TIME });
            this._register(_editor.onDidChangeModel(() => {
                this._isColorDecoratorsEnabled = this.isEnabled();
                this.updateColors();
            }));
            this._register(_editor.onDidChangeModelLanguage(() => this.updateColors()));
            this._register(_languageFeaturesService.colorProvider.onDidChange(() => this.updateColors()));
            this._register(_editor.onDidChangeConfiguration((e) => {
                const prevIsEnabled = this._isColorDecoratorsEnabled;
                this._isColorDecoratorsEnabled = this.isEnabled();
                this._isDefaultColorDecoratorsEnabled = this._editor.getOption(147 /* EditorOption.defaultColorDecorators */);
                const updatedColorDecoratorsSetting = prevIsEnabled !== this._isColorDecoratorsEnabled || e.hasChanged(21 /* EditorOption.colorDecoratorsLimit */);
                const updatedDefaultColorDecoratorsSetting = e.hasChanged(147 /* EditorOption.defaultColorDecorators */);
                if (updatedColorDecoratorsSetting || updatedDefaultColorDecoratorsSetting) {
                    if (this._isColorDecoratorsEnabled) {
                        this.updateColors();
                    }
                    else {
                        this.removeAllDecorations();
                    }
                }
            }));
            this._timeoutTimer = null;
            this._computePromise = null;
            this._isColorDecoratorsEnabled = this.isEnabled();
            this._isDefaultColorDecoratorsEnabled = this._editor.getOption(147 /* EditorOption.defaultColorDecorators */);
            this.updateColors();
        }
        isEnabled() {
            const model = this._editor.getModel();
            if (!model) {
                return false;
            }
            const languageId = model.getLanguageId();
            // handle deprecated settings. [languageId].colorDecorators.enable
            const deprecatedConfig = this._configurationService.getValue(languageId);
            if (deprecatedConfig && typeof deprecatedConfig === 'object') {
                const colorDecorators = deprecatedConfig['colorDecorators']; // deprecatedConfig.valueOf('.colorDecorators.enable');
                if (colorDecorators && colorDecorators['enable'] !== undefined && !colorDecorators['enable']) {
                    return colorDecorators['enable'];
                }
            }
            return this._editor.getOption(20 /* EditorOption.colorDecorators */);
        }
        get limitReporter() {
            return this._decoratorLimitReporter;
        }
        static get(editor) {
            return editor.getContribution(this.ID);
        }
        dispose() {
            this.stop();
            this.removeAllDecorations();
            super.dispose();
        }
        updateColors() {
            this.stop();
            if (!this._isColorDecoratorsEnabled) {
                return;
            }
            const model = this._editor.getModel();
            if (!model || !this._languageFeaturesService.colorProvider.has(model)) {
                return;
            }
            this._localToDispose.add(this._editor.onDidChangeModelContent(() => {
                if (!this._timeoutTimer) {
                    this._timeoutTimer = new async_1.TimeoutTimer();
                    this._timeoutTimer.cancelAndSet(() => {
                        this._timeoutTimer = null;
                        this.beginCompute();
                    }, this._debounceInformation.get(model));
                }
            }));
            this.beginCompute();
        }
        async beginCompute() {
            this._computePromise = (0, async_1.createCancelablePromise)(async (token) => {
                const model = this._editor.getModel();
                if (!model) {
                    return [];
                }
                const sw = new stopwatch_1.StopWatch(false);
                const colors = await (0, color_2.getColors)(this._languageFeaturesService.colorProvider, model, token, this._isDefaultColorDecoratorsEnabled);
                this._debounceInformation.update(model, sw.elapsed());
                return colors;
            });
            try {
                const colors = await this._computePromise;
                this.updateDecorations(colors);
                this.updateColorDecorators(colors);
                this._computePromise = null;
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        stop() {
            if (this._timeoutTimer) {
                this._timeoutTimer.cancel();
                this._timeoutTimer = null;
            }
            if (this._computePromise) {
                this._computePromise.cancel();
                this._computePromise = null;
            }
            this._localToDispose.clear();
        }
        updateDecorations(colorDatas) {
            const decorations = colorDatas.map(c => ({
                range: {
                    startLineNumber: c.colorInfo.range.startLineNumber,
                    startColumn: c.colorInfo.range.startColumn,
                    endLineNumber: c.colorInfo.range.endLineNumber,
                    endColumn: c.colorInfo.range.endColumn
                },
                options: textModel_1.ModelDecorationOptions.EMPTY
            }));
            this._editor.changeDecorations((changeAccessor) => {
                this._decorationsIds = changeAccessor.deltaDecorations(this._decorationsIds, decorations);
                this._colorDatas = new Map();
                this._decorationsIds.forEach((id, i) => this._colorDatas.set(id, colorDatas[i]));
            });
        }
        updateColorDecorators(colorData) {
            this._colorDecorationClassRefs.clear();
            const decorations = [];
            const limit = this._editor.getOption(21 /* EditorOption.colorDecoratorsLimit */);
            for (let i = 0; i < colorData.length && decorations.length < limit; i++) {
                const { red, green, blue, alpha } = colorData[i].colorInfo.color;
                const rgba = new color_1.RGBA(Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), alpha);
                const color = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
                const ref = this._colorDecorationClassRefs.add(this._ruleFactory.createClassNameRef({
                    backgroundColor: color
                }));
                decorations.push({
                    range: {
                        startLineNumber: colorData[i].colorInfo.range.startLineNumber,
                        startColumn: colorData[i].colorInfo.range.startColumn,
                        endLineNumber: colorData[i].colorInfo.range.endLineNumber,
                        endColumn: colorData[i].colorInfo.range.endColumn
                    },
                    options: {
                        description: 'colorDetector',
                        before: {
                            content: strings_1.noBreakWhitespace,
                            inlineClassName: `${ref.className} colorpicker-color-decoration`,
                            inlineClassNameAffectsLetterSpacing: true,
                            attachedData: exports.ColorDecorationInjectedTextMarker
                        }
                    }
                });
            }
            const limited = limit < colorData.length ? limit : false;
            this._decoratorLimitReporter.update(colorData.length, limited);
            this._colorDecoratorIds.set(decorations);
        }
        removeAllDecorations() {
            this._editor.removeDecorations(this._decorationsIds);
            this._decorationsIds = [];
            this._colorDecoratorIds.clear();
            this._colorDecorationClassRefs.clear();
        }
        getColorData(position) {
            const model = this._editor.getModel();
            if (!model) {
                return null;
            }
            const decorations = model
                .getDecorationsInRange(range_1.Range.fromPositions(position, position))
                .filter(d => this._colorDatas.has(d.id));
            if (decorations.length === 0) {
                return null;
            }
            return this._colorDatas.get(decorations[0].id);
        }
        isColorDecoration(decoration) {
            return this._colorDecoratorIds.has(decoration);
        }
    };
    exports.ColorDetector = ColorDetector;
    exports.ColorDetector = ColorDetector = ColorDetector_1 = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, languageFeatureDebounce_1.ILanguageFeatureDebounceService)
    ], ColorDetector);
    class DecoratorLimitReporter {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._computed = 0;
            this._limited = false;
        }
        get computed() {
            return this._computed;
        }
        get limited() {
            return this._limited;
        }
        update(computed, limited) {
            if (computed !== this._computed || limited !== this._limited) {
                this._computed = computed;
                this._limited = limited;
                this._onDidChange.fire();
            }
        }
    }
    exports.DecoratorLimitReporter = DecoratorLimitReporter;
    (0, editorExtensions_1.registerEditorContribution)(ColorDetector.ID, ColorDetector, 1 /* EditorContributionInstantiation.AfterFirstRender */);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sb3JEZXRlY3Rvci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvY29sb3JQaWNrZXIvYnJvd3Nlci9jb2xvckRldGVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7Ozs7Ozs7Ozs7SUF1Qm5GLFFBQUEsaUNBQWlDLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUc1RCxJQUFNLGFBQWEsR0FBbkIsTUFBTSxhQUFjLFNBQVEsc0JBQVU7O2lCQUVyQixPQUFFLEdBQVcsOEJBQThCLEFBQXpDLENBQTBDO2lCQUVuRCxtQkFBYyxHQUFHLElBQUksQUFBUCxDQUFRLEdBQUMsS0FBSztRQW1CNUMsWUFDa0IsT0FBb0IsRUFDZCxxQkFBNkQsRUFDMUQsd0JBQW1FLEVBQzVELDhCQUErRDtZQUVoRyxLQUFLLEVBQUUsQ0FBQztZQUxTLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDRywwQkFBcUIsR0FBckIscUJBQXFCLENBQXVCO1lBQ3pDLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFwQjdFLG9CQUFlLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLDJCQUFlLEVBQUUsQ0FBQyxDQUFDO1lBS2pFLG9CQUFlLEdBQWEsRUFBRSxDQUFDO1lBQy9CLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQXNCLENBQUM7WUFFbkMsdUJBQWtCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1lBS2hFLGlCQUFZLEdBQUcsSUFBSSwyQkFBZSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqRCw0QkFBdUIsR0FBRyxJQUFJLHNCQUFzQixFQUFFLENBQUM7WUFtSmhFLDhCQUF5QixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMs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