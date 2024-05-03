/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/editor/common/config/editorOptions", "vs/editor/common/config/editorZoom"], function (require, exports, platform, editorOptions_1, editorZoom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FontInfo = exports.SERIALIZED_FONT_INFO_VERSION = exports.BareFontInfo = void 0;
    /**
     * Determined from empirical observations.
     * @internal
     */
    const GOLDEN_LINE_HEIGHT_RATIO = platform.isMacintosh ? 1.5 : 1.35;
    /**
     * @internal
     */
    const MINIMUM_LINE_HEIGHT = 8;
    class BareFontInfo {
        /**
         * @internal
         */
        static createFromValidatedSettings(options, pixelRatio, ignoreEditorZoom) {
            const fontFamily = options.get(49 /* EditorOption.fontFamily */);
            const fontWeight = options.get(53 /* EditorOption.fontWeight */);
            const fontSize = options.get(52 /* EditorOption.fontSize */);
            const fontFeatureSettings = options.get(51 /* EditorOption.fontLigatures */);
            const fontVariationSettings = options.get(54 /* EditorOption.fontVariations */);
            const lineHeight = options.get(67 /* EditorOption.lineHeight */);
            const letterSpacing = options.get(64 /* EditorOption.letterSpacing */);
            return BareFontInfo._create(fontFamily, fontWeight, fontSize, fontFeatureSettings, fontVariationSettings, lineHeight, letterSpacing, pixelRatio, ignoreEditorZoom);
        }
        /**
         * @internal
         */
        static createFromRawSettings(opts, pixelRatio, ignoreEditorZoom = false) {
            const fontFamily = editorOptions_1.EditorOptions.fontFamily.validate(opts.fontFamily);
            const fontWeight = editorOptions_1.EditorOptions.fontWeight.validate(opts.fontWeight);
            const fontSize = editorOptions_1.EditorOptions.fontSize.validate(opts.fontSize);
            const fontFeatureSettings = editorOptions_1.EditorOptions.fontLigatures2.validate(opts.fontLigatures);
            const fontVariationSettings = editorOptions_1.EditorOptions.fontVariations.validate(opts.fontVariations);
            const lineHeight = editorOptions_1.EditorOptions.lineHeight.validate(opts.lineHeight);
            const letterSpacing = editorOptions_1.EditorOptions.letterSpacing.validate(opts.letterSpacing);
            return BareFontInfo._create(fontFamily, fontWeight, fontSize, fontFeatureSettings, fontVariationSettings, lineHeight, letterSpacing, pixelRatio, ignoreEditorZoom);
        }
        /**
         * @internal
         */
        static _create(fontFamily, fontWeight, fontSize, fontFeatureSettings, fontVariationSettings, lineHeight, letterSpacing, pixelRatio, ignoreEditorZoom) {
            if (lineHeight === 0) {
                lineHeight = GOLDEN_LINE_HEIGHT_RATIO * fontSize;
            }
            else if (lineHeight < MINIMUM_LINE_HEIGHT) {
                // Values too small to be line heights in pixels are in ems.
                lineHeight = lineHeight * fontSize;
            }
            // Enforce integer, minimum constraints
            lineHeight = Math.round(lineHeight);
            if (lineHeight < MINIMUM_LINE_HEIGHT) {
                lineHeight = MINIMUM_LINE_HEIGHT;
            }
            const editorZoomLevelMultiplier = 1 + (ignoreEditorZoom ? 0 : editorZoom_1.EditorZoom.getZoomLevel() * 0.1);
            fontSize *= editorZoomLevelMultiplier;
            lineHeight *= editorZoomLevelMultiplier;
            if (fontVariationSettings === editorOptions_1.EditorFontVariations.TRANSLATE) {
                if (fontWeight === 'normal' || fontWeight === 'bold') {
                    fontVariationSettings = editorOptions_1.EditorFontVariations.OFF;
                }
                else {
                    const fontWeightAsNumber = parseInt(fontWeight, 10);
                    fontVariationSettings = `'wght' ${fontWeightAsNumber}`;
                    fontWeight = 'normal';
                }
            }
            return new BareFontInfo({
                pixelRatio: pixelRatio,
                fontFamily: fontFamily,
                fontWeight: fontWeight,
                fontSize: fontSize,
                fontFeatureSettings: fontFeatureSettings,
                fontVariationSettings,
                lineHeight: lineHeight,
                letterSpacing: letterSpacing
            });
        }
        /**
         * @internal
         */
        constructor(opts) {
            this._bareFontInfoBrand = undefined;
            this.pixelRatio = opts.pixelRatio;
            this.fontFamily = String(opts.fontFamily);
            this.fontWeight = String(opts.fontWeight);
            this.fontSize = opts.fontSize;
            this.fontFeatureSettings = opts.fontFeatureSettings;
            this.fontVariationSettings = opts.fontVariationSettings;
            this.lineHeight = opts.lineHeight | 0;
            this.letterSpacing = opts.letterSpacing;
        }
        /**
         * @internal
         */
        getId() {
            return `${this.pixelRatio}-${this.fontFamily}-${this.fontWeight}-${this.fontSize}-${this.fontFeatureSettings}-${this.fontVariationSettings}-${this.lineHeight}-${this.letterSpacing}`;
        }
        /**
         * @internal
         */
        getMassagedFontFamily() {
            const fallbackFontFamily = editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const fontFamily = BareFontInfo._wrapInQuotes(this.fontFamily);
            if (fallbackFontFamily && this.fontFamily !== fallbackFontFamily) {
                return `${fontFamily}, ${fallbackFontFamily}`;
            }
            return fontFamily;
        }
        static _wrapInQuotes(fontFamily) {
            if (/[,"']/.test(fontFamily)) {
                // Looks like the font family might be already escaped
                return fontFamily;
            }
            if (/[+ ]/.test(fontFamily)) {
                // Wrap a font family using + or <space> with quotes
                return `"${fontFamily}"`;
            }
            return fontFamily;
        }
    }
    exports.BareFontInfo = BareFontInfo;
    // change this whenever `FontInfo` members are changed
    exports.SERIALIZED_FONT_INFO_VERSION = 2;
    class FontInfo extends BareFontInfo {
        /**
         * @internal
         */
        constructor(opts, isTrusted) {
            super(opts);
            this._editorStylingBrand = undefined;
            this.version = exports.SERIALIZED_FONT_INFO_VERSION;
            this.isTrusted = isTrusted;
            this.isMonospace = opts.isMonospace;
            this.typicalHalfwidthCharacterWidth = opts.typicalHalfwidthCharacterWidth;
            this.typicalFullwidthCharacterWidth = opts.typicalFullwidthCharacterWidth;
            this.canUseHalfwidthRightwardsArrow = opts.canUseHalfwidthRightwardsArrow;
            this.spaceWidth = opts.spaceWidth;
            this.middotWidth = opts.middotWidth;
            this.wsmiddotWidth = opts.wsmiddotWidth;
            this.maxDigitWidth = opts.maxDigitWidth;
        }
        /**
         * @internal
         */
        equals(other) {
            return (this.fontFamily === other.fontFamily
                && this.fontWeight === other.fontWeight
                && this.fontSize === other.fontSize
                && this.fontFeatureSettings === other.fontFeatureSettings
                && this.fontVariationSettings === other.fontVariationSettings
                && this.lineHeight === other.lineHeight
                && this.letterSpacing === other.letterSpacing
                && this.typicalHalfwidthCharacterWidth === other.typicalHalfwidthCharacterWidth
                && this.typicalFullwidthCharacterWidth === other.typicalFullwidthCharacterWidth
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.spaceWidth === other.spaceWidth
                && this.middotWidth === other.middotWidth
                && this.wsmiddotWidth === other.wsmiddotWidth
                && this.maxDigitWidth === other.maxDigitWidth);
        }
    }
    exports.FontInfo = FontInfo;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udEluZm8uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9jb21tb24vY29uZmlnL2ZvbnRJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRzs7O09BR0c7SUFDSCxNQUFNLHdCQUF3QixHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRW5FOztPQUVHO0lBQ0gsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLENBQUM7SUFTOUIsTUFBYSxZQUFZO1FBR3hCOztXQUVHO1FBQ0ksTUFBTSxDQUFDLDJCQUEyQixDQUFDLE9BQWdDLEVBQUUsVUFBa0IsRUFBRSxnQkFBeUI7WUFDeEgsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsa0NBQXlCLENBQUM7WUFDeEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsa0NBQXlCLENBQUM7WUFDeEQsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFDcEQsTUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsR0FBRyxxQ0FBNEIsQ0FBQztZQUNwRSxNQUFNLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyxHQUFHLHNDQUE2QixDQUFDO1lBQ3ZFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLGtDQUF5QixDQUFDO1lBQ3hELE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLHFDQUE0QixDQUFDO1lBQzlELE9BQU8sWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BLLENB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