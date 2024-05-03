/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/renderingContext"], function (require, exports, renderingContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeUtil = void 0;
    class RangeUtil {
        static _createRange() {
            if (!this._handyReadyRange) {
                this._handyReadyRange = document.createRange();
            }
            return this._handyReadyRange;
        }
        static _detachRange(range, endNode) {
            // Move range out of the span node, IE doesn't like having many ranges in
            // the same spot and will act badly for lines containing dashes ('-')
            range.selectNodeContents(endNode);
        }
        static _readClientRects(startElement, startOffset, endElement, endOffset, endNode) {
            const range = this._createRange();
            try {
                range.setStart(startElement, startOffset);
                range.setEnd(endElement, endOffset);
                return range.getClientRects();
            }
            catch (e) {
                // This is life ...
                return null;
            }
            finally {
                this._detachRange(range, endNode);
            }
        }
        static _mergeAdjacentRanges(ranges) {
            if (ranges.length === 1) {
                // There is nothing to merge
                return ranges;
            }
            ranges.sort(renderingContext_1.FloatHorizontalRange.compare);
            const result = [];
            let resultLen = 0;
            let prev = ranges[0];
            for (let i = 1, len = ranges.length; i < len; i++) {
                const range = ranges[i];
                if (prev.left + prev.width + 0.9 /* account for browser's rounding errors*/ >= range.left) {
                    prev.width = Math.max(prev.width, range.left + range.width - prev.left);
                }
                else {
                    result[resultLen++] = prev;
                    prev = range;
                }
            }
            result[resultLen++] = prev;
            return result;
        }
        static _createHorizontalRangesFromClientRects(clientRects, clientRectDeltaLeft, clientRectScale) {
            if (!clientRects || clientRects.length === 0) {
                return null;
            }
            // We go through FloatHorizontalRange because it has been observed in bi-di text
            // that the clientRects are not coming in sorted from the browser
            const result = [];
            for (let i = 0, len = clientRects.length; i < len; i++) {
                const clientRect = clientRects[i];
                result[i] = new renderingContext_1.FloatHorizontalRange(Math.max(0, (clientRect.left - clientRectDeltaLeft) / clientRectScale), clientRect.width / clientRectScale);
            }
            return this._mergeAdjacentRanges(result);
        }
        static readHorizontalRanges(domNode, startChildIndex, startOffset, endChildIndex, endOffset, context) {
            // Panic check
            const min = 0;
            const max = domNode.children.length - 1;
            if (min > max) {
                return null;
            }
            startChildIndex = Math.min(max, Math.max(min, startChildIndex));
            endChildIndex = Math.min(max, Math.max(min, endChildIndex));
            if (startChildIndex === endChildIndex && startOffset === endOffset && startOffset === 0 && !domNode.children[startChildIndex].firstChild) {
                // We must find the position at the beginning of a <span>
                // To cover cases of empty <span>s, avoid using a range and use the <span>'s bounding box
                const clientRects = domNode.children[startChildIndex].getClientRects();
                context.markDidDomLayout();
                return this._createHorizontalRangesFromClientRects(clientRects, context.clientRectDeltaLeft, context.clientRectScale);
            }
            // If crossing over to a span only to select offset 0, then use the previous span's maximum offset
            // Chrome is buggy and doesn't handle 0 offsets well sometimes.
            if (startChildIndex !== endChildIndex) {
                if (endChildIndex > 0 && endOffset === 0) {
                    endChildIndex--;
                    endOffset = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                }
            }
            let startElement = domNode.children[startChildIndex].firstChild;
            let endElement = domNode.children[endChildIndex].firstChild;
            if (!startElement || !endElement) {
                // When having an empty <span> (without any text content), try to move to the previous <span>
                if (!startElement && startOffset === 0 && startChildIndex > 0) {
                    startElement = domNode.children[startChildIndex - 1].firstChild;
                    startOffset = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                }
                if (!endElement && endOffset === 0 && endChildIndex > 0) {
                    endElement = domNode.children[endChildIndex - 1].firstChild;
                    endOffset = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
                }
            }
            if (!startElement || !endElement) {
                return null;
            }
            startOffset = Math.min(startElement.textContent.length, Math.max(0, startOffset));
            endOffset = Math.min(endElement.textContent.length, Math.max(0, endOffset));
            const clientRects = this._readClientRects(startElement, startOffset, endElement, endOffset, context.endNode);
            context.markDidDomLayout();
            return this._createHorizontalRangesFromClientRects(clientRects, context.clientRectDeltaLeft, context.clientRectScale);
        }
    }
    exports.RangeUtil = RangeUtil;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmFuZ2VVdGlsLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvbGluZXMvcmFuZ2VVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQU1oRyxNQUFhLFNBQVM7UUFTYixNQUFNLENBQUMsWUFBWTtZQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDaEQsQ0FBQztZQUNELE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDO1FBQzlCLENBQUM7UUFFTyxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQVksRUFBRSxPQUFvQjtZQUM3RCx5RUFBeUU7WUFDekUscUVBQXFFO1lBQ3JFLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU8sTUFBTSxDQUFDLGdCQUFnQixDQUFDLFlBQWtCLEVBQUUsV0FBbUIsRUFBRSxVQUFnQixFQUFFLFNBQWlCLEVBQUUsT0FBb0I7WUFDakksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2xDLElBQUksQ0FBQztnQkFDSixLQUFLLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDMUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBRXBDLE9BQU8sS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQy9CLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNaLG1CQUFtQjtnQkFDbkIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO29CQUFTLENBQUM7Z0JBQ1YsSUFBSSxD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