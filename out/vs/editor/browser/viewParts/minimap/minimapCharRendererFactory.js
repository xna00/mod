/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/viewParts/minimap/minimapCharRenderer", "vs/editor/browser/viewParts/minimap/minimapCharSheet", "vs/editor/browser/viewParts/minimap/minimapPreBaked", "vs/base/common/uint"], function (require, exports, minimapCharRenderer_1, minimapCharSheet_1, minimapPreBaked_1, uint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapCharRendererFactory = void 0;
    /**
     * Creates character renderers. It takes a 'scale' that determines how large
     * characters should be drawn. Using this, it draws data into a canvas and
     * then downsamples the characters as necessary for the current display.
     * This makes rendering more efficient, rather than drawing a full (tiny)
     * font, or downsampling in real-time.
     */
    class MinimapCharRendererFactory {
        /**
         * Creates a new character renderer factory with the given scale.
         */
        static create(scale, fontFamily) {
            // renderers are immutable. By default we'll 'create' a new minimap
            // character renderer whenever we switch editors, no need to do extra work.
            if (this.lastCreated && scale === this.lastCreated.scale && fontFamily === this.lastFontFamily) {
                return this.lastCreated;
            }
            let factory;
            if (minimapPreBaked_1.prebakedMiniMaps[scale]) {
                factory = new minimapCharRenderer_1.MinimapCharRenderer(minimapPreBaked_1.prebakedMiniMaps[scale](), scale);
            }
            else {
                factory = MinimapCharRendererFactory.createFromSampleData(MinimapCharRendererFactory.createSampleData(fontFamily).data, scale);
            }
            this.lastFontFamily = fontFamily;
            this.lastCreated = factory;
            return factory;
        }
        /**
         * Creates the font sample data, writing to a canvas.
         */
        static createSampleData(fontFamily) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.style.height = `${16 /* Constants.SAMPLED_CHAR_HEIGHT */}px`;
            canvas.height = 16 /* Constants.SAMPLED_CHAR_HEIGHT */;
            canvas.width = 96 /* Constants.CHAR_COUNT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */;
            canvas.style.width = 96 /* Constants.CHAR_COUNT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */ + 'px';
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${16 /* Constants.SAMPLED_CHAR_HEIGHT */}px ${fontFamily}`;
            ctx.textBaseline = 'middle';
            let x = 0;
            for (const code of minimapCharSheet_1.allCharCodes) {
                ctx.fillText(String.fromCharCode(code), x, 16 /* Constants.SAMPLED_CHAR_HEIGHT */ / 2);
                x += 10 /* Constants.SAMPLED_CHAR_WIDTH */;
            }
            return ctx.getImageData(0, 0, 96 /* Constants.CHAR_COUNT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */, 16 /* Constants.SAMPLED_CHAR_HEIGHT */);
        }
        /**
         * Creates a character renderer from the canvas sample data.
         */
        static createFromSampleData(source, scale) {
            const expectedLength = 16 /* Constants.SAMPLED_CHAR_HEIGHT */ * 10 /* Constants.SAMPLED_CHAR_WIDTH */ * 4 /* Constants.RGBA_CHANNELS_CNT */ * 96 /* Constants.CHAR_COUNT */;
            if (source.length !== expectedLength) {
                throw new Error('Unexpected source in MinimapCharRenderer');
            }
            const charData = MinimapCharRendererFactory._downsample(source, scale);
            return new minimapCharRenderer_1.MinimapCharRenderer(charData, scale);
        }
        static _downsampleChar(source, sourceOffset, dest, destOffset, scale) {
            const width = 1 /* Constants.BASE_CHAR_WIDTH */ * scale;
            const height = 2 /* Constants.BASE_CHAR_HEIGHT */ * scale;
            let targetIndex = destOffset;
            let brightest = 0;
            // This is essentially an ad-hoc rescaling algorithm. Standard approaches
            // like bicubic interpolation are awesome for scaling between image sizes,
            // but don't work so well when scaling to very small pixel values, we end
            // up with blurry, indistinct forms.
            //
            // The approach taken here is simply mapping each source pixel to the target
            // pixels, and taking the weighted values for all pixels in each, and then
            // averaging them out. Finally we apply an intensity boost in _downsample,
            // since when scaling to the smallest pixel sizes there's more black space
            // which causes characters to be much less distinct.
            for (let y = 0; y < height; y++) {
                // 1. For this destination pixel, get the source pixels we're sampling
                // from (x1, y1) to the next pixel (x2, y2)
                const sourceY1 = (y / height) * 16 /* Constants.SAMPLED_CHAR_HEIGHT */;
                const sourceY2 = ((y + 1) / height) * 16 /* Constants.SAMPLED_CHAR_HEIGHT */;
                for (let x = 0; x < width; x++) {
                    const sourceX1 = (x / width) * 10 /* Constants.SAMPLED_CHAR_WIDTH */;
                    const sourceX2 = ((x + 1) / width) * 10 /* Constants.SAMPLED_CHAR_WIDTH */;
                    // 2. Sample all of them, summing them up and weighting them. Similar
                    // to bilinear interpolation.
                    let value = 0;
                    let samples = 0;
                    for (let sy = sourceY1; sy < sourceY2; sy++) {
                        const sourceRow = sourceOffset + Math.floor(sy) * 3840 /* Constants.RGBA_SAMPLED_ROW_WIDTH */;
                        const yBalance = 1 - (sy - Math.floor(sy));
                        for (let sx = sourceX1; sx < sourceX2; sx++) {
                            const xBalance = 1 - (sx - Math.floor(sx));
                            const sourceIndex = sourceRow + Math.floor(sx) * 4 /* Constants.RGBA_CHANNELS_CNT */;
                            const weight = xBalance * yBalance;
                            samples += weight;
                            value += ((source[sourceIndex] * source[sourceIndex + 3]) / 255) * weight;
                        }
                    }
                    const final = value / samples;
                    brightest = Math.max(brightest, final);
                    dest[targetIndex++] = (0, uint_1.toUint8)(final);
                }
            }
            return brightest;
        }
        static _downsample(data, scale) {
            const pixelsPerCharacter = 2 /* Constants.BASE_CHAR_HEIGHT */ * scale * 1 /* Constants.BASE_CHAR_WIDTH */ * scale;
            const resultLen = pixelsPerCharacter * 96 /* Constants.CHAR_COUNT */;
            const result = new Uint8ClampedArray(resultLen);
            let resultOffset = 0;
            let sourceOffset = 0;
            let brightest = 0;
            for (let charIndex = 0; charIndex < 96 /* Constants.CHAR_COUNT */; charIndex++) {
                brightest = Math.max(brightest, this._downsampleChar(data, sourceOffset, result, resultOffset, scale));
                resultOffset += pixelsPerCharacter;
                sourceOffset += 10 /* Constants.SAMPLED_CHAR_WIDTH */ * 4 /* Constants.RGBA_CHANNELS_CNT */;
            }
            if (brightest > 0) {
                const adjust = 255 / brightest;
                for (let i = 0; i < resultLen; i++) {
                    result[i] *= adjust;
                }
            }
            return result;
        }
    }
    exports.MinimapCharRendererFactory = MinimapCharRendererFactory;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcENoYXJSZW5kZXJlckZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9taW5pbWFwL21pbmltYXBDaGFyUmVuZGVyZXJGYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU9oRzs7Ozs7O09BTUc7SUFDSCxNQUFhLDBCQUEwQjtRQUl0Qzs7V0FFRztRQUNJLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBYSxFQUFFLFVBQWtCO1lBQ3JELG1FQUFtRTtZQUNuRSwyRUFBMkU7WUFDM0UsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssSUFBSSxVQUFVLEtBQUssSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUNoRyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDekIsQ0FBQztZQUVELElBQUksT0FBNEIsQ0FBQztZQUNqQyxJQUFJLGtDQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzdCLE9BQU8sR0FBRyxJQUFJLHlDQUFtQixDQUFDLGtDQUFnQixDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLE9BQU8sR0FBRywwQkFBMEIsQ0FBQyxvQkFBb0IsQ0FDeEQsMEJBQTBCLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUM1RCxLQUFLLENBQ0wsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQztZQUNqQyxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztZQUMzQixPQUFPLE9BQU8sQ0FBQztRQUNoQixDQUFDO1FBRUQ7O1dB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