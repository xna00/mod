/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/view/dynamicViewOverlay", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./selections"], function (require, exports, dynamicViewOverlay_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionsOverlay = void 0;
    var CornerStyle;
    (function (CornerStyle) {
        CornerStyle[CornerStyle["EXTERN"] = 0] = "EXTERN";
        CornerStyle[CornerStyle["INTERN"] = 1] = "INTERN";
        CornerStyle[CornerStyle["FLAT"] = 2] = "FLAT";
    })(CornerStyle || (CornerStyle = {}));
    class HorizontalRangeWithStyle {
        constructor(other) {
            this.left = other.left;
            this.width = other.width;
            this.startStyle = null;
            this.endStyle = null;
        }
    }
    class LineVisibleRangesWithStyle {
        constructor(lineNumber, ranges) {
            this.lineNumber = lineNumber;
            this.ranges = ranges;
        }
    }
    function toStyledRange(item) {
        return new HorizontalRangeWithStyle(item);
    }
    function toStyled(item) {
        return new LineVisibleRangesWithStyle(item.lineNumber, item.ranges.map(toStyledRange));
    }
    class SelectionsOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        static { this.SELECTION_CLASS_NAME = 'selected-text'; }
        static { this.SELECTION_TOP_LEFT = 'top-left-radius'; }
        static { this.SELECTION_BOTTOM_LEFT = 'bottom-left-radius'; }
        static { this.SELECTION_TOP_RIGHT = 'top-right-radius'; }
        static { this.SELECTION_BOTTOM_RIGHT = 'bottom-right-radius'; }
        static { this.EDITOR_BACKGROUND_CLASS_NAME = 'monaco-editor-background'; }
        static { this.ROUNDED_PIECE_WIDTH = 10; }
        constructor(context) {
            super();
            this._previousFrameVisibleRangesWithStyle = [];
            this._context = context;
            const options = this._context.configuration.options;
            this._roundedSelection = options.get(101 /* EditorOption.roundedSelection */);
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            this._selections = [];
            this._renderResult = null;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            this._renderResult = null;
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._roundedSelection = options.get(101 /* EditorOption.roundedSelection */);
            this._typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            return true;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections.slice(0);
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true; //e.inlineDecorationsChanged;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        _visibleRangesHaveGaps(linesVisibleRanges) {
            for (let i = 0, len = linesVisibleRanges.length; i < len; i++) {
                const lineVisibleRanges = linesVisibleRanges[i];
                if (lineVisibleRanges.ranges.length > 1) {
                    // There are two ranges on the same line
                    return true;
                }
            }
            return false;
        }
        _enrichVisibleRangesWithStyle(viewport, linesVisibleRanges, previousFrame) {
            const epsilon = this._typicalHalfwidthCharacterWidth / 4;
            let previousFrameTop = null;
            let previousFrameBottom = null;
            if (previousFrame && previousFrame.length > 0 && linesVisibleRanges.length > 0) {
                const topLineNumber = linesVisibleRanges[0].lineNumber;
                if (topLineNumber === viewport.startLineNumber) {
                    for (let i = 0; !previousFrameTop && i < previousFrame.length; i++) {
                        if (previousFrame[i].lineNumber === topLineNumber) {
                            previousFrameTop = previousFrame[i].ranges[0];
                        }
                    }
                }
                const bottomLineNumber = linesVisibleRanges[linesVisibleRanges.length - 1].lineNumber;
                if (bottomLineNumber === viewport.endLineNumber) {
                    for (let i = previousFrame.length - 1; !previousFrameBottom && i >= 0; i--) {
                        if (previousFrame[i].lineNumber === bottomLineNumber) {
                            previousFrameBottom = previousFrame[i].ranges[0];
                        }
                    }
                }
                if (previousFrameTop && !previousFrameTop.startStyle) {
                    previousFrameTop = null;
                }
                if (previousFrameBottom && !previousFrameBottom.startStyle) {
                    previousFrameBottom = null;
                }
            }
            for (let i = 0, len = linesVisibleRanges.length; i < len; i++) {
                // We know for a fact that there is precisely one range on each line
                const curLineRange = linesVisibleRanges[i].ranges[0];
                const curLeft = curLineRange.left;
                const curRight = curLineRange.left + curLineRange.width;
                const startStyle = {
                    top: 0 /* CornerStyle.EXTERN */,
                    bottom: 0 /* CornerStyle.EXTERN */
                };
                const endStyle = {
                    top: 0 /* CornerStyle.EXTERN */,
                    bottom: 0 /* CornerStyle.EXTERN */
                };
                if (i > 0) {
                    // Look above
                    const prevLeft = linesVisibleRanges[i - 1].ranges[0].left;
                    const prevRight = linesVisibleRanges[i - 1].ranges[0].left + linesVisibleRanges[i - 1].ranges[0].width;
                    if (abs(curLeft - prevLeft) < epsilon) {
                        startStyle.top = 2 /* CornerStyle.FLAT */;
                    }
                    else if (curLeft > prevLeft) {
                        startStyle.top = 1 /* CornerStyle.INTERN */;
                    }
                    if (abs(curRight - prevRight) < epsilon) {
                        endStyle.top = 2 /* CornerStyle.FLAT */;
                    }
                    else if (prevLeft < curRight && curRight < prevRight) {
                        endStyle.top = 1 /* CornerStyle.INTERN */;
                    }
                }
                else if (previousFrameTop) {
                    // Accept some hiccups near the viewport edges to save on repaints
                    startStyle.top = previousFrameTop.startStyle.top;
                    endStyle.top = previousFrameTop.endStyle.top;
                }
                if (i + 1 < len) {
                    // Look below
                    const nextLeft = linesVisibleRanges[i + 1].ranges[0].left;
                    const nextRight = linesVisibleRanges[i + 1].ranges[0].left + linesVisibleRanges[i + 1].ranges[0].width;
                    if (abs(curLeft - nextLeft) < epsilon) {
                        startStyle.bottom = 2 /* CornerStyle.FLAT */;
                    }
                    else if (nextLeft < curLeft && curLeft < nextRight) {
                        startStyle.bottom = 1 /* CornerStyle.INTERN */;
                    }
                    if (abs(curRight - nextRight) < epsilon) {
                        endStyle.bottom = 2 /* CornerStyle.FLAT */;
                    }
                    else if (curRight < nextRight) {
                        endStyle.bottom = 1 /* CornerStyle.INTERN */;
                    }
                }
                else if (previousFrameBottom) {
                    // Accept some hiccups near the viewport edges to save on repaints
                    startStyle.bottom = previousFrameBottom.startStyle.bottom;
                    endStyle.bottom = previousFrameBottom.endStyle.bottom;
                }
                curLineRange.startStyle = startStyle;
                curLineRange.endStyle = endStyle;
            }
        }
        _getVisibleRangesWithStyle(selection, ctx, previousFrame) {
            const _linesVisibleRanges = ctx.linesVisibleRangesForRange(selection, true) || [];
            const linesVisibleRanges = _linesVisibleRanges.map(toStyled);
            const visibleRangesHaveGaps = this._visibleRangesHaveGaps(linesVisibleRanges);
            if (!visibleRangesHaveGaps && this._roundedSelection) {
                this._enrichVisibleRangesWithStyle(ctx.visibleRange, linesVisibleRanges, previousFrame);
            }
            // The visible ranges are sorted TOP-BOTTOM and LEFT-RIGHT
            return linesVisibleRanges;
        }
        _createSelectionPiece(top, bottom, className, left, width) {
            return ('<div class="cslr '
                + className
                + '" style="'
                + 'top:' + top.toString() + 'px;'
                + 'bottom:' + bottom.toString() + 'px;'
                + 'left:' + left.toString() + 'px;'
                + 'width:' + width.toString() + 'px;'
                + '"></div>');
        }
        _actualRenderOneSelection(output2, visibleStartLineNumber, hasMultipleSelections, visibleRanges) {
            if (visibleRanges.length === 0) {
                return;
            }
            const visibleRangesHaveStyle = !!visibleRanges[0].ranges[0].startStyle;
            const firstLineNumber = visibleRanges[0].lineNumber;
            const lastLineNumber = visibleRanges[visibleRanges.length - 1].lineNumber;
            for (let i = 0, len = visibleRanges.length; i < len; i++) {
                const lineVisibleRanges = visibleRanges[i];
                const lineNumber = lineVisibleRanges.lineNumber;
                const lineIndex = lineNumber - visibleStartLineNumber;
                const top = hasMultipleSelections ? (lineNumber === firstLineNumber ? 1 : 0) : 0;
                const bottom = hasMultipleSelections ? (lineNumber !== firstLineNumber && lineNumber === lastLineNumber ? 1 : 0) : 0;
                let innerCornerOutput = '';
                let restOfSelectionOutput = '';
                for (let j = 0, lenJ = lineVisibleRanges.ranges.length; j < lenJ; j++) {
                    const visibleRange = lineVisibleRanges.ranges[j];
                    if (visibleRangesHaveStyle) {
                        const startStyle = visibleRange.startStyle;
                        const endStyle = visibleRange.endStyle;
                        if (startStyle.top === 1 /* CornerStyle.INTERN */ || startStyle.bottom === 1 /* CornerStyle.INTERN */) {
                            // Reverse rounded corner to the left
                            // First comes the selection (blue layer)
                            innerCornerOutput += this._createSelectionPiece(top, bottom, SelectionsOverlay.SELECTION_CLASS_NAME, visibleRange.left - SelectionsOverlay.ROUNDED_PIECE_WIDTH, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                            // Second comes the background (white layer) with inverse border radius
                            let className = SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME;
                            if (startStyle.top === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_TOP_RIGHT;
                            }
                            if (startStyle.bottom === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_RIGHT;
                            }
                            innerCornerOutput += this._createSelectionPiece(top, bottom, className, visibleRange.left - SelectionsOverlay.ROUNDED_PIECE_WIDTH, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                        }
                        if (endStyle.top === 1 /* CornerStyle.INTERN */ || endStyle.bottom === 1 /* CornerStyle.INTERN */) {
                            // Reverse rounded corner to the right
                            // First comes the selection (blue layer)
                            innerCornerOutput += this._createSelectionPiece(top, bottom, SelectionsOverlay.SELECTION_CLASS_NAME, visibleRange.left + visibleRange.width, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                            // Second comes the background (white layer) with inverse border radius
                            let className = SelectionsOverlay.EDITOR_BACKGROUND_CLASS_NAME;
                            if (endStyle.top === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_TOP_LEFT;
                            }
                            if (endStyle.bottom === 1 /* CornerStyle.INTERN */) {
                                className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_LEFT;
                            }
                            innerCornerOutput += this._createSelectionPiece(top, bottom, className, visibleRange.left + visibleRange.width, SelectionsOverlay.ROUNDED_PIECE_WIDTH);
                        }
                    }
                    let className = SelectionsOverlay.SELECTION_CLASS_NAME;
                    if (visibleRangesHaveStyle) {
                        const startStyle = visibleRange.startStyle;
                        const endStyle = visibleRange.endStyle;
                        if (startStyle.top === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_TOP_LEFT;
                        }
                        if (startStyle.bottom === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_LEFT;
                        }
                        if (endStyle.top === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_TOP_RIGHT;
                        }
                        if (endStyle.bottom === 0 /* CornerStyle.EXTERN */) {
                            className += ' ' + SelectionsOverlay.SELECTION_BOTTOM_RIGHT;
                        }
                    }
                    restOfSelectionOutput += this._createSelectionPiece(top, bottom, className, visibleRange.left, visibleRange.width);
                }
                output2[lineIndex][0] += innerCornerOutput;
                output2[lineIndex][1] += restOfSelectionOutput;
            }
        }
        prepareRender(ctx) {
            // Build HTML for inner corners separate from HTML for the rest of selections,
            // as the inner corner HTML can interfere with that of other selections.
            // In final render, make sure to place the inner corner HTML before the rest of selection HTML. See issue #77777.
            const output = [];
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = ['', ''];
            }
            const thisFrameVisibleRangesWithStyle = [];
            for (let i = 0, len = this._selections.length; i < len; i++) {
                const selection = this._selections[i];
                if (selection.isEmpty()) {
                    thisFrameVisibleRangesWithStyle[i] = null;
                    continue;
                }
                const visibleRangesWithStyle = this._getVisibleRangesWithStyle(selection, ctx, this._previousFrameVisibleRangesWithStyle[i]);
                thisFrameVisibleRangesWithStyle[i] = visibleRangesWithStyle;
                this._actualRenderOneSelection(output, visibleStartLineNumber, this._selections.length > 1, visibleRangesWithStyle);
            }
            this._previousFrameVisibleRangesWithStyle = thisFrameVisibleRangesWithStyle;
            this._renderResult = output.map(([internalCorners, restOfSelection]) => internalCorners + restOfSelection);
        }
        render(startLineNumber, lineNumber) {
            if (!this._renderResult) {
                return '';
            }
            const lineIndex = lineNumber - startLineNumber;
            if (lineIndex < 0 || lineIndex >= this._renderResult.length) {
                return '';
            }
            return this._renderResult[lineIndex];
        }
    }
    exports.SelectionsOverlay = SelectionsOverlay;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorSelectionForegroundColor = theme.getColor(colorRegistry_1.editorSelectionForeground);
        if (editorSelectionForegroundColor && !editorSelectionForegroundColor.isTransparent()) {
            collector.addRule(`.monaco-editor .view-line span.inline-selected-text { color: ${editorSelectionForegroundColor}; }`);
        }
    });
    function abs(n) {
        return n < 0 ? -n : n;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL3NlbGVjdGlvbnMvc2VsZWN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFZaEcsSUFBVyxXQUlWO0lBSkQsV0FBVyxXQUFXO1FBQ3JCLGlEQUFNLENBQUE7UUFDTixpREFBTSxDQUFBO1FBQ04sNkNBQUksQ0FBQTtJQUNMLENBQUMsRUFKVSxXQUFXLEtBQVgsV0FBVyxRQUlyQjtJQU9ELE1BQU0sd0JBQXdCO1FBTTdCLFlBQVksS0FBc0I7WUFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN0QixDQUFDO0tBQ0Q7SUFFRCxNQUFNLDBCQUEwQjtRQUkvQixZQUFZLFVBQWtCLEVBQUUsTUFBa0M7WUFDakUsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDdEIsQ0FBQztLQUNEO0lBRUQsU0FBUyxhQUFhLENBQUMsSUFBcUI7UUFDM0MsT0FBTyxJQUFJLHdCQUF3QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUF1QjtRQUN4QyxPQUFPLElBQUksMEJBQTBCLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFFRCxN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