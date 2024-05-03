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
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/editor/browser/config/elementSizeObserver", "vs/editor/browser/config/fontMeasurements", "vs/editor/browser/config/migrateOptions", "vs/editor/browser/config/tabFocus", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom", "vs/editor/common/config/fontInfo", "vs/platform/accessibility/common/accessibility", "vs/base/browser/dom", "vs/base/browser/pixelRatio"], function (require, exports, browser, arrays, event_1, lifecycle_1, objects, platform, elementSizeObserver_1, fontMeasurements_1, migrateOptions_1, tabFocus_1, editorOptions_1, editorZoom_1, fontInfo_1, accessibility_1, dom_1, pixelRatio_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ComputedEditorOptions = exports.EditorConfiguration = void 0;
    let EditorConfiguration = class EditorConfiguration extends lifecycle_1.Disposable {
        constructor(isSimpleWidget, options, container, _accessibilityService) {
            super();
            this._accessibilityService = _accessibilityService;
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._onDidChangeFast = this._register(new event_1.Emitter());
            this.onDidChangeFast = this._onDidChangeFast.event;
            this._isDominatedByLongLines = false;
            this._viewLineCount = 1;
            this._lineNumbersDigitCount = 1;
            this._reservedHeight = 0;
            this._glyphMarginDecorationLaneCount = 1;
            this._computeOptionsMemory = new editorOptions_1.ComputeOptionsMemory();
            this.isSimpleWidget = isSimpleWidget;
            this._containerObserver = this._register(new elementSizeObserver_1.ElementSizeObserver(container, options.dimension));
            this._targetWindowId = (0, dom_1.getWindow)(container).vscodeWindowId;
            this._rawOptions = deepCloneAndMigrateOptions(options);
            this._validatedOptions = EditorOptionsUtil.validateOptions(this._rawOptions);
            this.options = this._computeOptions();
            if (this.options.get(13 /* EditorOption.automaticLayout */)) {
                this._containerObserver.startObserving();
            }
            this._register(editorZoom_1.EditorZoom.onDidChangeZoomLevel(() => this._recomputeOptions()));
            this._register(tabFocus_1.TabFocus.onDidChangeTabFocus(() => this._recomputeOptions()));
            this._register(this._containerObserver.onDidChange(() => this._recomputeOptions()));
            this._register(fontMeasurements_1.FontMeasurements.onDidChange(() => this._recomputeOptions()));
            this._register(pixelRatio_1.PixelRatio.getInstance((0, dom_1.getWindow)(container)).onDidChange(() => this._recomputeOptions()));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => this._recomputeOptions()));
        }
        _recomputeOptions() {
            const newOptions = this._computeOptions();
            const changeEvent = EditorOptionsUtil.checkEquals(this.options, newOptions);
            if (changeEvent === null) {
                // nothing changed!
                return;
            }
            this.options = newOptions;
            this._onDidChangeFast.fire(changeEvent);
            this._onDidChange.fire(changeEvent);
        }
        _computeOptions() {
            const partialEnv = this._readEnvConfiguration();
            const bareFontInfo = fontInfo_1.BareFontInfo.createFromValidatedSettings(this._validatedOptions, partialEnv.pixelRatio, this.isSimpleWidget);
            const fontInfo = this._readFontInfo(bareFontInfo);
            const env = {
                memory: this._computeOptionsMemory,
                outerWidth: partialEnv.outerWidth,
                outerHeight: partialEnv.outerHeight - this._reservedHeight,
                fontInfo: fontInfo,
                extraEditorClassName: partialEnv.extraEditorClassName,
                isDominatedByLongLines: this._isDominatedByLongLines,
                viewLineCount: this._viewLineCount,
                lineNumbersDigitCount: this._lineNumbersDigitCount,
                emptySelectionClipboard: partialEnv.emptySelectionClipboard,
                pixelRatio: partialEnv.pixelRatio,
                tabFocusMode: tabFocus_1.TabFocus.getTabFocusMode(),
                accessibilitySupport: partialEnv.accessibilitySupport,
                glyphMarginDecorationLaneCount: this._glyphMarginDecorationLaneCount
            };
            return EditorOptionsUtil.computeOptions(this._validatedOptions, env);
        }
        _readEnvConfiguration() {
            return {
                extraEditorClassName: getExtraEditorClassName(),
                outerWidth: this._containerObserver.getWidth(),
                outerHeight: this._containerObserver.getHeight(),
                emptySelectionClipboard: browser.isWebKit || browser.isFirefox,
                pixelRatio: pixelRatio_1.PixelRatio.getInstance((0, dom_1.getWindowById)(this._targetWindowId, true).window).value,
                accessibilitySupport: (this._accessibilityService.isScreenReaderOptimized()
                    ? 2 /* AccessibilitySupport.Enabled */
                    : this._accessibilityService.getAccessibilitySupport())
            };
        }
        _readFontInfo(bareFontInfo) {
            return fontMeasurements_1.FontMeasurements.readFontInfo((0, dom_1.getWindowById)(this._targetWindowId, true).window, bareFontInfo);
        }
        getRawOptions() {
            return this._rawOptions;
        }
        updateOptions(_newOptions) {
            const newOptions = deepCloneAndMigrateOptions(_newOptions);
            const didChange = EditorOptionsUtil.applyUpdate(this._rawOptions, newOptions);
            if (!didChange) {
                return;
            }
            this._validatedOptions = EditorOptionsUtil.validateOptions(this._rawOptions);
            this._recomputeOptions();
        }
        observeContainer(dimension) {
            this._containerObserver.observe(dimension);
        }
        setIsDominatedByLongLines(isDominatedByLongLines) {
            if (this._isDominatedByLongLines === isDominatedByLongLines) {
                return;
            }
            this._isDominatedByLongLines = isDominatedByLongLines;
            this._recomputeOptions();
        }
        setModelLineCount(modelLineCount) {
            const lineNumbersDigitCount = digitCount(modelLineCount);
            if (this._lineNumbersDigitCount === lineNumbersDigitCount) {
                return;
            }
            this._lineNumbersDigitCount = lineNumbersDigitCount;
            this._recomputeOptions();
        }
        setViewLineCount(viewLineCount) {
            if (this._viewLineCount === viewLineCount) {
                return;
            }
            this._viewLineCount = viewLineCount;
            this._recomputeOptions();
        }
        setReservedHeight(reservedHeight) {
            if (this._reservedHeight === reservedHeight) {
                return;
            }
            this._reservedHeight = reservedHeight;
            this._recomputeOptions();
        }
        setGlyphMarginDecorationLaneCount(decorationLaneCount) {
            if (this._glyphMarginDecorationLaneCount === decorationLaneCount) {
                return;
            }
            this._glyphMarginDecorationLaneCount = decorationLaneCount;
            this._recomputeOptions();
        }
    };
    exports.EditorConfiguration = EditorConfiguration;
    exports.EditorConfiguration = EditorConfiguration = __decorate([
        __param(3, accessibility_1.IAccessibilityService)
    ], EditorConfiguration);
    function digitCount(n) {
        let r = 0;
        while (n) {
            n = Math.floor(n / 10);
            r++;
        }
        return r ? r : 1;
    }
    function getExtraEditorClassName() {
        let extra = '';
        if (!browser.isSafari && !browser.isWebkitWebView) {
            // Use user-select: none in all browsers except Safari and native macOS WebView
            extra += 'no-user-select ';
        }
        if (browser.isSafari) {
            // See https://github.com/microsoft/vscode/issues/108822
            extra += 'no-minimap-shadow ';
            extra += 'enable-user-select ';
        }
        if (platform.isMacintosh) {
            extra += 'mac ';
        }
        return extra;
    }
    class ValidatedEditorOptions {
        constructor() {
            this._values = [];
        }
        _read(option) {
            return this._values[option];
        }
        get(id) {
            return this._values[id];
        }
        _write(option, value) {
            this._values[option] = value;
        }
    }
    class ComputedEditorOptions {
        constructor() {
            this._values = [];
        }
        _read(id) {
            if (id >= this._values.length) {
                throw new Error('Cannot read uninitialized value');
            }
            return this._values[id];
        }
        get(id) {
            return this._read(id);
        }
        _write(id, value) {
            this._values[id] = value;
        }
    }
    exports.ComputedEditorOptions = ComputedEditorOptions;
    class EditorOptionsUtil {
        static validateOptions(options) {
            const result = new ValidatedEditorOptions();
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                const value = (editorOption.name === '_never_' ? undefined : options[editorOption.name]);
                result._write(editorOption.id, editorOption.validate(value));
            }
            return result;
        }
        static computeOptions(options, env) {
            const result = new ComputedEditorOptions();
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                result._write(editorOption.id, editorOption.compute(env, result, options._read(editorOption.id)));
            }
            return result;
        }
        static _deepEquals(a, b) {
            if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
                return a === b;
            }
            if (Array.isArray(a) || Array.isArray(b)) {
                return (Array.isArray(a) && Array.isArray(b) ? arrays.equals(a, b) : false);
            }
            if (Object.keys(a).length !== Object.keys(b).length) {
                return false;
            }
            for (const key in a) {
                if (!EditorOptionsUtil._deepEquals(a[key], b[key])) {
                    return false;
                }
            }
            return true;
        }
        static checkEquals(a, b) {
            const result = [];
            let somethingChanged = false;
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                const changed = !EditorOptionsUtil._deepEquals(a._read(editorOption.id), b._read(editorOption.id));
                result[editorOption.id] = changed;
                if (changed) {
                    somethingChanged = true;
                }
            }
            return (somethingChanged ? new editorOptions_1.ConfigurationChangedEvent(result) : null);
        }
        /**
         * Returns true if something changed.
         * Modifies `options`.
        */
        static applyUpdate(options, update) {
            let changed = false;
            for (const editorOption of editorOptions_1.editorOptionsRegistry) {
                if (update.hasOwnProperty(editorOption.name)) {
                    const result = editorOption.applyUpdate(options[editorOption.name], update[editorOption.name]);
                    options[editorOption.name] = result.newValue;
                    changed = changed || result.didChange;
                }
            }
            return changed;
        }
    }
    function deepCloneAndMigrateOptions(_options) {
        const options = objects.deepClone(_options);
        (0, migrateOptions_1.migrateOptions)(options);
        return options;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWRpdG9yQ29uZmlndXJhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29uZmlnL2VkaXRvckNvbmZpZ3VyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7Ozs7Ozs7Ozs7O0lBaUN6RixJQUFNLG1CQUFtQixHQUF6QixNQUFNLG1CQUFvQixTQUFRLHNCQUFVO1FBZ0NsRCxZQUNDLGNBQXVCLEVBQ3ZCLE9BQTZDLEVBQzdDLFNBQTZCLEVBQ04scUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBRmdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFsQzdFLGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBNkIsQ0FBQyxDQUFDO1lBQ2hFLGdCQUFXLEdBQXFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBRWhGLHFCQUFnQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxlQUFPLEVBQTZCLENBQUMsQ0FBQztZQUNwRSxvQkFBZSxHQUFxQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO1lBS3hGLDRCQUF1QixHQUFZLEtBQUssQ0FBQztZQUN6QyxtQkFBYyxHQUFXLENBQUMsQ0FBQztZQUMzQiwyQkFBc0IsR0FBVyxDQUFDLENBQUM7WUFDbkMsb0JBQWUsR0FBVyxDQUFDLENBQUM7WUFDNUIsb0NBQStCLEdBQVcsQ0FBQyxDQUFDO1lBR25DLDBCQUFxQixHQUF5QixJQUFJLG9DQUFvQixFQUFFLENBQUM7WUFxQnpGLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUkseUNBQW1CLENBQUMsU0FBUyxFQUFF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