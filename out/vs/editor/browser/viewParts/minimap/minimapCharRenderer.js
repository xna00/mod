/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./minimapCharSheet", "vs/base/common/uint"], function (require, exports, minimapCharSheet_1, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapCharRenderer = void 0;
    class MinimapCharRenderer {
        constructor(charData, scale) {
            this.scale = scale;
            this._minimapCharRendererBrand = undefined;
            this.charDataNormal = MinimapCharRenderer.soften(charData, 12 / 15);
            this.charDataLight = MinimapCharRenderer.soften(charData, 50 / 60);
        }
        static soften(input, ratio) {
            const result = new Uint8ClampedArray(input.length);
            for (let i = 0, len = input.length; i < len; i++) {
                result[i] = (0, uint_1.toUint8)(input[i] * ratio);
            }
            return result;
        }
        renderChar(target, dx, dy, chCode, color, foregroundAlpha, backgroundColor, backgroundAlpha, fontScale, useLighterFont, force1pxHeight) {
            const charWidth = 1 /* Constants.BASE_CHAR_WIDTH */ * this.scale;
            const charHeight = 2 /* Constants.BASE_CHAR_HEIGHT */ * this.scale;
            const renderHeight = (force1pxHeight ? 1 : charHeight);
            if (dx + charWidth > target.width || dy + renderHeight > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const charData = useLighterFont ? this.charDataLight : this.charDataNormal;
            const charIndex = (0, minimapCharSheet_1.getCharIndex)(chCode, fontScale);
            const destWidth = target.width * 4 /* Constants.RGBA_CHANNELS_CNT */;
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const destAlpha = Math.max(foregroundAlpha, backgroundAlpha);
            const dest = target.data;
            let sourceOffset = charIndex * charWidth * charHeight;
            let row = dy * destWidth + dx * 4 /* Constants.RGBA_CHANNELS_CNT */;
            for (let y = 0; y < renderHeight; y++) {
                let column = row;
                for (let x = 0; x < charWidth; x++) {
                    const c = (charData[sourceOffset++] / 255) * (foregroundAlpha / 255);
                    dest[column++] = backgroundR + deltaR * c;
                    dest[column++] = backgroundG + deltaG * c;
                    dest[column++] = backgroundB + deltaB * c;
                    dest[column++] = destAlpha;
                }
                row += destWidth;
            }
        }
        blockRenderChar(target, dx, dy, color, foregroundAlpha, backgroundColor, backgroundAlpha, force1pxHeight) {
            const charWidth = 1 /* Constants.BASE_CHAR_WIDTH */ * this.scale;
            const charHeight = 2 /* Constants.BASE_CHAR_HEIGHT */ * this.scale;
            const renderHeight = (force1pxHeight ? 1 : charHeight);
            if (dx + charWidth > target.width || dy + renderHeight > target.height) {
                console.warn('bad render request outside image data');
                return;
            }
            const destWidth = target.width * 4 /* Constants.RGBA_CHANNELS_CNT */;
            const c = 0.5 * (foregroundAlpha / 255);
            const backgroundR = backgroundColor.r;
            const backgroundG = backgroundColor.g;
            const backgroundB = backgroundColor.b;
            const deltaR = color.r - backgroundR;
            const deltaG = color.g - backgroundG;
            const deltaB = color.b - backgroundB;
            const colorR = backgroundR + deltaR * c;
            const colorG = backgroundG + deltaG * c;
            const colorB = backgroundB + deltaB * c;
            const destAlpha = Math.max(foregroundAlpha, backgroundAlpha);
            const dest = target.data;
            let row = dy * destWidth + dx * 4 /* Constants.RGBA_CHANNELS_CNT */;
            for (let y = 0; y < renderHeight; y++) {
                let column = row;
                for (let x = 0; x < charWidth; x++) {
                    dest[column++] = colorR;
                    dest[column++] = colorG;
                    dest[column++] = colorB;
                    dest[column++] = destAlpha;
                }
                row += destWidth;
            }
        }
    }
    exports.MinimapCharRenderer = MinimapCharRenderer;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcENoYXJSZW5kZXJlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL21pbmltYXAvbWluaW1hcENoYXJSZW5kZXJlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFNaEcsTUFBYSxtQkFBbUI7UUFNL0IsWUFBWSxRQUEyQixFQUFrQixLQUFhO1lBQWIsVUFBSyxHQUFMLEtBQUssQ0FBUTtZQUx0RSw4QkFBeUIsR0FBUyxTQUFTLENBQUM7WUFNM0MsSUFBSSxDQUFDLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNwRSxJQUFJLENBQUMsYUFBYSxHQUFHLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFTyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQXdCLEVBQUUsS0FBYTtZQUM1RCxNQUFNLE1BQU0sR0FBRyxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xELE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFBLGNBQU8sRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELE9BQU8sTUFBTSxDQUFDO1FBQ2YsQ0FBQztRQUVNLFVBQVUsQ0FDaEIsTUFBaUIsRUFDakIsRUFBVSxFQUNWLEVBQVUsRUFDVixNQUFjLEVB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