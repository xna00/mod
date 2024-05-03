/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverviewZoneManager = exports.OverviewRulerZone = exports.ColorZone = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["MINIMUM_HEIGHT"] = 4] = "MINIMUM_HEIGHT";
    })(Constants || (Constants = {}));
    class ColorZone {
        constructor(from, to, colorId) {
            this._colorZoneBrand = undefined;
            this.from = from | 0;
            this.to = to | 0;
            this.colorId = colorId | 0;
        }
        static compare(a, b) {
            if (a.colorId === b.colorId) {
                if (a.from === b.from) {
                    return a.to - b.to;
                }
                return a.from - b.from;
            }
            return a.colorId - b.colorId;
        }
    }
    exports.ColorZone = ColorZone;
    /**
     * A zone in the overview ruler
     */
    class OverviewRulerZone {
        constructor(startLineNumber, endLineNumber, heightInLines, color) {
            this._overviewRulerZoneBrand = undefined;
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
            this.heightInLines = heightInLines;
            this.color = color;
            this._colorZone = null;
        }
        static compare(a, b) {
            if (a.color === b.color) {
                if (a.startLineNumber === b.startLineNumber) {
                    if (a.heightInLines === b.heightInLines) {
                        return a.endLineNumber - b.endLineNumber;
                    }
                    return a.heightInLines - b.heightInLines;
                }
                return a.startLineNumber - b.startLineNumber;
            }
            return a.color < b.color ? -1 : 1;
        }
        setColorZone(colorZone) {
            this._colorZone = colorZone;
        }
        getColorZones() {
            return this._colorZone;
        }
    }
    exports.OverviewRulerZone = OverviewRulerZone;
    class OverviewZoneManager {
        constructor(getVerticalOffsetForLine) {
            this._getVerticalOffsetForLine = getVerticalOffsetForLine;
            this._zones = [];
            this._colorZonesInvalid = false;
            this._lineHeight = 0;
            this._domWidth = 0;
            this._domHeight = 0;
            this._outerHeight = 0;
            this._pixelRatio = 1;
            this._lastAssignedId = 0;
            this._color2Id = Object.create(null);
            this._id2Color = [];
        }
        getId2Color() {
            return this._id2Color;
        }
        setZones(newZones) {
            this._zones = newZones;
            this._zones.sort(OverviewRulerZone.compare);
        }
        setLineHeight(lineHeight) {
            if (this._lineHeight === lineHeight) {
                return false;
            }
            this._lineHeight = lineHeight;
            this._colorZonesInvalid = true;
            return true;
        }
        setPixelRatio(pixelRatio) {
            this._pixelRatio = pixelRatio;
            this._colorZonesInvalid = true;
        }
        getDOMWidth() {
            return this._domWidth;
        }
        getCanvasWidth() {
            return this._domWidth * this._pixelRatio;
        }
        setDOMWidth(width) {
            if (this._domWidth === width) {
                return false;
            }
            this._domWidth = width;
            this._colorZonesInvalid = true;
            return true;
        }
        getDOMHeight() {
            return this._domHeight;
        }
        getCanvasHeight() {
            return this._domHeight * this._pixelRatio;
        }
        setDOMHeight(height) {
            if (this._domHeight === height) {
                return false;
            }
            this._domHeight = height;
            this._colorZonesInvalid = true;
            return true;
        }
        getOuterHeight() {
            return this._outerHeight;
        }
        setOuterHeight(outerHeight) {
            if (this._outerHeight === outerHeight) {
                return false;
            }
            this._outerHeight = outerHeight;
            this._colorZonesInvalid = true;
            return true;
        }
        resolveColorZones() {
            const colorZonesInvalid = this._colorZonesInvalid;
            const lineHeight = Math.floor(this._lineHeight);
            const totalHeight = Math.floor(this.getCanvasHeight());
            const outerHeight = Math.floor(this._outerHeight);
            const heightRatio = totalHeight / outerHeight;
            const halfMinimumHeight = Math.floor(4 /* Constants.MINIMUM_HEIGHT */ * this._pixelRatio / 2);
            const allColorZones = [];
            for (let i = 0, len = this._zones.length; i < len; i++) {
                const zone = this._zones[i];
                if (!colorZonesInvalid) {
                    const colorZone = zone.getColorZones();
                    if (colorZone) {
                        allColorZones.push(colorZone);
                        continue;
                    }
                }
                const offset1 = this._getVerticalOffsetForLine(zone.startLineNumber);
                const offset2 = (zone.heightInLines === 0
                    ? this._getVerticalOffsetForLine(zone.endLineNumber) + lineHeight
                    : offset1 + zone.heightInLines * lineHeight);
                const y1 = Math.floor(heightRatio * offset1);
                const y2 = Math.floor(heightRatio * offset2);
                let ycenter = Math.floor((y1 + y2) / 2);
                let halfHeight = (y2 - ycenter);
                if (halfHeight < halfMinimumHeight) {
                    halfHeight = halfMinimumHeight;
                }
                if (ycenter - halfHeight < 0) {
                    ycenter = halfHeight;
                }
                if (ycenter + halfHeight > totalHeight) {
                    ycenter = totalHeight - halfHeight;
                }
                const color = zone.color;
                let colorId = this._color2Id[color];
                if (!colorId) {
                    colorId = (++this._lastAssignedId);
                    this._color2Id[color] = colorId;
                    this._id2Color[colorId] = color;
                }
                const colorZone = new ColorZone(ycenter - halfHeight, ycenter + halfHeight, colorId);
                zone.setColorZone(colorZone);
                allColorZones.push(colorZone);
            }
            this._colorZonesInvalid = false;
            allColorZones.sort(ColorZone.compare);
            return allColorZones;
        }
    }
    exports.OverviewZoneManager = OverviewZoneManager;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcnZpZXdab25lTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TW9kZWwvb3ZlcnZpZXdab25lTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFFaEcsSUFBVyxTQUVWO0lBRkQsV0FBVyxTQUFTO1FBQ25CLDZEQUFrQixDQUFBO0lBQ25CLENBQUMsRUFGVSxTQUFTLEtBQVQsU0FBUyxRQUVuQjtJQUVELE1BQWEsU0FBUztRQU9yQixZQUFZLElBQVksRUFBRSxFQUFVLEVBQUUsT0FBZTtZQU5yRCxvQkFBZSxHQUFTLFNBQVMsQ0FBQztZQU9qQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7WUFDckIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBRU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFZLEVBQUUsQ0FBWTtZQUMvQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM3QixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN2QixPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEIsQ0FBQztnQkFDRCxPQUFPLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUN4QixDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDOUIsQ0FBQztLQUNEO0lBdEJELDhCQXNCQztJQUVEOztP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