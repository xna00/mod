/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisibleRanges = exports.HorizontalPosition = exports.FloatHorizontalRange = exports.HorizontalRange = exports.LineVisibleRanges = exports.RenderingContext = exports.RestrictedRenderingContext = void 0;
    class RestrictedRenderingContext {
        constructor(viewLayout, viewportData) {
            this._restrictedRenderingContextBrand = undefined;
            this._viewLayout = viewLayout;
            this.viewportData = viewportData;
            this.scrollWidth = this._viewLayout.getScrollWidth();
            this.scrollHeight = this._viewLayout.getScrollHeight();
            this.visibleRange = this.viewportData.visibleRange;
            this.bigNumbersDelta = this.viewportData.bigNumbersDelta;
            const vInfo = this._viewLayout.getCurrentViewport();
            this.scrollTop = vInfo.top;
            this.scrollLeft = vInfo.left;
            this.viewportWidth = vInfo.width;
            this.viewportHeight = vInfo.height;
        }
        getScrolledTopFromAbsoluteTop(absoluteTop) {
            return absoluteTop - this.scrollTop;
        }
        getVerticalOffsetForLineNumber(lineNumber, includeViewZones) {
            return this._viewLayout.getVerticalOffsetForLineNumber(lineNumber, includeViewZones);
        }
        getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones) {
            return this._viewLayout.getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones);
        }
        getDecorationsInViewport() {
            return this.viewportData.getDecorationsInViewport();
        }
    }
    exports.RestrictedRenderingContext = RestrictedRenderingContext;
    class RenderingContext extends RestrictedRenderingContext {
        constructor(viewLayout, viewportData, viewLines) {
            super(viewLayout, viewportData);
            this._renderingContextBrand = undefined;
            this._viewLines = viewLines;
        }
        linesVisibleRangesForRange(range, includeNewLines) {
            return this._viewLines.linesVisibleRangesForRange(range, includeNewLines);
        }
        visibleRangeForPosition(position) {
            return this._viewLines.visibleRangeForPosition(position);
        }
    }
    exports.RenderingContext = RenderingContext;
    class LineVisibleRanges {
        /**
         * Returns the element with the smallest `lineNumber`.
         */
        static firstLine(ranges) {
            if (!ranges) {
                return null;
            }
            let result = null;
            for (const range of ranges) {
                if (!result || range.lineNumber < result.lineNumber) {
                    result = range;
                }
            }
            return result;
        }
        /**
         * Returns the element with the largest `lineNumber`.
         */
        static lastLine(ranges) {
            if (!ranges) {
                return null;
            }
            let result = null;
            for (const range of ranges) {
                if (!result || range.lineNumber > result.lineNumber) {
                    result = range;
                }
            }
            return result;
        }
        constructor(outsideRenderedLine, lineNumber, ranges, 
        /**
         * Indicates if the requested range does not end in this line, but continues on the next line.
         */
        continuesOnNextLine) {
            this.outsideRenderedLine = outsideRenderedLine;
            this.lineNumber = lineNumber;
            this.ranges = ranges;
            this.continuesOnNextLine = continuesOnNextLine;
        }
    }
    exports.LineVisibleRanges = LineVisibleRanges;
    class HorizontalRange {
        static from(ranges) {
            const result = new Array(ranges.length);
            for (let i = 0, len = ranges.length; i < len; i++) {
                const range = ranges[i];
                result[i] = new HorizontalRange(range.left, range.width);
            }
            return result;
        }
        constructor(left, width) {
            this._horizontalRangeBrand = undefined;
            this.left = Math.round(left);
            this.width = Math.round(width);
        }
        toString() {
            return `[${this.left},${this.width}]`;
        }
    }
    exports.HorizontalRange = HorizontalRange;
    class FloatHorizontalRange {
        constructor(left, width) {
            this._floatHorizontalRangeBrand = undefined;
            this.left = left;
            this.width = width;
        }
        toString() {
            return `[${this.left},${this.width}]`;
        }
        static compare(a, b) {
            return a.left - b.left;
        }
    }
    exports.FloatHorizontalRange = FloatHorizontalRange;
    class HorizontalPosition {
        constructor(outsideRenderedLine, left) {
            this.outsideRenderedLine = outsideRenderedLine;
            this.originalLeft = left;
            this.left = Math.round(this.originalLeft);
        }
    }
    exports.HorizontalPosition = HorizontalPosition;
    class VisibleRanges {
        constructor(outsideRenderedLine, ranges) {
            this.outsideRenderedLine = outsideRenderedLine;
            this.ranges = ranges;
        }
    }
    exports.VisibleRanges = VisibleRanges;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyaW5nQ29udGV4dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlldy9yZW5kZXJpbmdDb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVloRyxNQUFzQiwwQkFBMEI7UUFtQi9DLFlBQVksVUFBdUIsRUFBRSxZQUEwQjtZQWxCL0QscUNBQWdDLEdBQVMsU0FBUyxDQUFDO1lBbUJsRCxJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQztZQUM5QixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztZQUVqQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDckQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRXZELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUM7WUFDbkQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQztZQUV6RCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUM7WUFDcEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1lBQzNCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztZQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDakMsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQ3BDLENBQUM7UUFFTSw2QkFBNkIsQ0FBQyxXQUFtQjtZQUN2RCxPQUFPLFdBQVcsR0FBRyxJQUFJLENB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