/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/globalPointerMoveMonitor", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/core/rgba", "vs/editor/common/viewModel/minimapTokensColorTracker", "vs/editor/common/viewModel", "vs/platform/theme/common/colorRegistry", "vs/editor/common/core/selection", "vs/base/browser/touch", "vs/editor/browser/viewParts/minimap/minimapCharRendererFactory", "vs/base/common/functional", "vs/base/common/map", "vs/base/browser/fonts", "vs/css!./minimap"], function (require, exports, dom, fastDomNode_1, globalPointerMoveMonitor_1, lifecycle_1, platform, strings, viewLayer_1, viewPart_1, editorOptions_1, range_1, rgba_1, minimapTokensColorTracker_1, viewModel_1, colorRegistry_1, selection_1, touch_1, minimapCharRendererFactory_1, functional_1, map_1, fonts_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Minimap = void 0;
    /**
     * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
     */
    const POINTER_DRAG_RESET_DISTANCE = 140;
    const GUTTER_DECORATION_WIDTH = 2;
    class MinimapOptions {
        constructor(configuration, theme, tokensColorTracker) {
            const options = configuration.options;
            const pixelRatio = options.get(143 /* EditorOption.pixelRatio */);
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const minimapLayout = layoutInfo.minimap;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const minimapOpts = options.get(73 /* EditorOption.minimap */);
            this.renderMinimap = minimapLayout.renderMinimap;
            this.size = minimapOpts.size;
            this.minimapHeightIsEditorHeight = minimapLayout.minimapHeightIsEditorHeight;
            this.scrollBeyondLastLine = options.get(105 /* EditorOption.scrollBeyondLastLine */);
            this.paddingTop = options.get(84 /* EditorOption.padding */).top;
            this.paddingBottom = options.get(84 /* EditorOption.padding */).bottom;
            this.showSlider = minimapOpts.showSlider;
            this.autohide = minimapOpts.autohide;
            this.pixelRatio = pixelRatio;
            this.typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.minimapLeft = minimapLayout.minimapLeft;
            this.minimapWidth = minimapLayout.minimapWidth;
            this.minimapHeight = layoutInfo.height;
            this.canvasInnerWidth = minimapLayout.minimapCanvasInnerWidth;
            this.canvasInnerHeight = minimapLayout.minimapCanvasInnerHeight;
            this.canvasOuterWidth = minimapLayout.minimapCanvasOuterWidth;
            this.canvasOuterHeight = minimapLayout.minimapCanvasOuterHeight;
            this.isSampling = minimapLayout.minimapIsSampling;
            this.editorHeight = layoutInfo.height;
            this.fontScale = minimapLayout.minimapScale;
            this.minimapLineHeight = minimapLayout.minimapLineHeight;
            this.minimapCharWidth = 1 /* Constants.BASE_CHAR_WIDTH */ * this.fontScale;
            this.sectionHeaderFontFamily = fonts_1.DEFAULT_FONT_FAMILY;
            this.sectionHeaderFontSize = minimapOpts.sectionHeaderFontSize * pixelRatio;
            this.sectionHeaderFontColor = MinimapOptions._getSectionHeaderColor(theme, tokensColorTracker.getColor(1 /* ColorId.DefaultForeground */));
            this.charRenderer = (0, functional_1.createSingleCallFunction)(() => minimapCharRendererFactory_1.MinimapCharRendererFactory.create(this.fontScale, fontInfo.fontFamily));
            this.defaultBackgroundColor = tokensColorTracker.getColor(2 /* ColorId.DefaultBackground */);
            this.backgroundColor = MinimapOptions._getMinimapBackground(theme, this.defaultBackgroundColor);
            this.foregroundAlpha = MinimapOptions._getMinimapForegroundOpacity(theme);
        }
        static _getMinimapBackground(theme, defaultBackgroundColor) {
            const themeColor = theme.getColor(colorRegistry_1.minimapBackground);
            if (themeColor) {
                return new rgba_1.RGBA8(themeColor.rgba.r, themeColor.rgba.g, themeColor.rgba.b, Math.round(255 * themeColor.rgba.a));
            }
            return defaultBackgroundColor;
        }
        static _getMinimapForegroundOpacity(theme) {
            const themeColor = theme.getColor(colorRegistry_1.minimapForegroundOpacity);
            if (themeColor) {
                return rgba_1.RGBA8._clamp(Math.round(255 * themeColor.rgba.a));
            }
            return 255;
        }
        static _getSectionHeaderColor(theme, defaultForegroundColor) {
            const themeColor = theme.getColor(colorRegistry_1.editorForeground);
            if (themeColor) {
                return new rgba_1.RGBA8(themeColor.rgba.r, themeColor.rgba.g, themeColor.rgba.b, Math.round(255 * themeColor.rgba.a));
            }
            return defaultForegroundColor;
        }
        equals(other) {
            return (this.renderMinimap === other.renderMinimap
                && this.size === other.size
                && this.minimapHeightIsEditorHeight === other.minimapHeightIsEditorHeight
                && this.scrollBeyondLastLine === other.scrollBeyondLastLine
                && this.paddingTop === other.paddingTop
                && this.paddingBottom === other.paddingBottom
                && this.showSlider === other.showSlider
                && this.autohide === other.autohide
                && this.pixelRatio === other.pixelRatio
                && this.typicalHalfwidthCharacterWidth === other.typicalHalfwidthCharacterWidth
                && this.lineHeight === other.lineHeight
                && this.minimapLeft === other.minimapLeft
                && this.minimapWidth === other.minimapWidth
                && this.minimapHeight === other.minimapHeight
                && this.canvasInnerWidth === other.canvasInnerWidth
                && this.canvasInnerHeight === other.canvasInnerHeight
                && this.canvasOuterWidth === other.canvasOuterWidth
                && this.canvasOuterHeight === other.canvasOuterHeight
                && this.isSampling === other.isSampling
                && this.editorHeight === other.editorHeight
                && this.fontScale === other.fontScale
                && this.minimapLineHeight === other.minimapLineHeight
                && this.minimapCharWidth === other.minimapCharWidth
                && this.sectionHeaderFontSize === other.sectionHeaderFontSize
                && this.defaultBackgroundColor && this.defaultBackgroundColor.equals(other.defaultBackgroundColor)
                && this.backgroundColor && this.backgroundColor.equals(other.backgroundColor)
                && this.foregroundAlpha === other.foregroundAlpha);
        }
    }
    class MinimapLayout {
        constructor(
        /**
         * The given editor scrollTop (input).
         */
        scrollTop, 
        /**
         * The given editor scrollHeight (input).
         */
        scrollHeight, sliderNeeded, _computedSliderRatio, 
        /**
         * slider dom node top (in CSS px)
         */
        sliderTop, 
        /**
         * slider dom node height (in CSS px)
         */
        sliderHeight, 
        /**
         * empty lines to reserve at the top of the minimap.
         */
        topPaddingLineCount, 
        /**
         * minimap render start line number.
         */
        startLineNumber, 
        /**
         * minimap render end line number.
         */
        endLineNumber) {
            this.scrollTop = scrollTop;
            this.scrollHeight = scrollHeight;
            this.sliderNeeded = sliderNeeded;
            this._computedSliderRatio = _computedSliderRatio;
            this.sliderTop = sliderTop;
            this.sliderHeight = sliderHeight;
            this.topPaddingLineCount = topPaddingLineCount;
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
        }
        /**
         * Compute a desired `scrollPosition` such that the slider moves by `delta`.
         */
        getDesiredScrollTopFromDelta(delta) {
            return Math.round(this.scrollTop + delta / this._computedSliderRatio);
        }
        getDesiredScrollTopFromTouchLocation(pageY) {
            return Math.round((pageY - this.sliderHeight / 2) / this._computedSliderRatio);
        }
        /**
         * Intersect a line range with `this.startLineNumber` and `this.endLineNumber`.
         */
        intersectWithViewport(range) {
            const startLineNumber = Math.max(this.startLineNumber, range.startLineNumber);
            const endLineNumber = Math.min(this.endLineNumber, range.endLineNumber);
            if (startLineNumber > endLineNumber) {
                // entirely outside minimap's viewport
                return null;
            }
            return [startLineNumber, endLineNumber];
        }
        /**
         * Get the inner minimap y coordinate for a line number.
         */
        getYForLineNumber(lineNumber, minimapLineHeight) {
            return +(lineNumber - this.startLineNumber + this.topPaddingLineCount) * minimapLineHeight;
        }
        static create(options, viewportStartLineNumber, viewportEndLineNumber, viewportStartLineNumberVerticalOffset, viewportHeight, viewportContainsWhitespaceGaps, lineCount, realLineCount, scrollTop, scrollHeight, previousLayout) {
            const pixelRatio = options.pixelRatio;
            const minimapLineHeight = options.minimapLineHeight;
            const minimapLinesFitting = Math.floor(options.canvasInnerHeight / minimapLineHeight);
            const lineHeight = options.lineHeight;
            if (options.minimapHeightIsEditorHeight) {
                let logicalScrollHeight = (realLineCount * options.lineHeight
                    + options.paddingTop
                    + options.paddingBottom);
                if (options.scrollBeyondLastLine) {
                    logicalScrollHeight += Math.max(0, viewportHeight - options.lineHeight - options.paddingBottom);
                }
                const sliderHeight = Math.max(1, Math.floor(viewportHeight * viewportHeight / logicalScrollHeight));
                const maxMinimapSliderTop = Math.max(0, options.minimapHeight - sliderHeight);
                // The slider can move from 0 to `maxMinimapSliderTop`
                // in the same way `scrollTop` can move from 0 to `scrollHeight` - `viewportHeight`.
                const computedSliderRatio = (maxMinimapSliderTop) / (scrollHeight - viewportHeight);
                const sliderTop = (scrollTop * computedSliderRatio);
                const sliderNeeded = (maxMinimapSliderTop > 0);
                const maxLinesFitting = Math.floor(options.canvasInnerHeight / options.minimapLineHeight);
                const topPaddingLineCount = Math.floor(options.paddingTop / options.lineHeight);
                return new MinimapLayout(scrollTop, scrollHeight, sliderNeeded, computedSliderRatio, sliderTop, sliderHeight, topPaddingLineCount, 1, Math.min(lineCount, maxLinesFitting));
            }
            // The visible line count in a viewport can change due to a number of reasons:
            //  a) with the same viewport width, different scroll positions can result in partial lines being visible:
            //    e.g. for a line height of 20, and a viewport height of 600
            //          * scrollTop = 0  => visible lines are [1, 30]
            //          * scrollTop = 10 => visible lines are [1, 31] (with lines 1 and 31 partially visible)
            //          * scrollTop = 20 => visible lines are [2, 31]
            //  b) whitespace gaps might make their way in the viewport (which results in a decrease in the visible line count)
            //  c) we could be in the scroll beyond last line case (which also results in a decrease in the visible line count, down to possibly only one line being visible)
            // We must first establish a desirable slider height.
            let sliderHeight;
            if (viewportContainsWhitespaceGaps && viewportEndLineNumber !== lineCount) {
                // case b) from above: there are whitespace gaps in the viewport.
                // In this case, the height of the slider directly reflects the visible line count.
                const viewportLineCount = viewportEndLineNumber - viewportStartLineNumber + 1;
                sliderHeight = Math.floor(viewportLineCount * minimapLineHeight / pixelRatio);
            }
            else {
                // The slider has a stable height
                const expectedViewportLineCount = viewportHeight / lineHeight;
                sliderHeight = Math.floor(expectedViewportLineCount * minimapLineHeight / pixelRatio);
            }
            const extraLinesAtTheTop = Math.floor(options.paddingTop / lineHeight);
            let extraLinesAtTheBottom = Math.floor(options.paddingBottom / lineHeight);
            if (options.scrollBeyondLastLine) {
                const expectedViewportLineCount = viewportHeight / lineHeight;
                extraLinesAtTheBottom = Math.max(extraLinesAtTheBottom, expectedViewportLineCount - 1);
            }
            let maxMinimapSliderTop;
            if (extraLinesAtTheBottom > 0) {
                const expectedViewportLineCount = viewportHeight / lineHeight;
                // The minimap slider, when dragged all the way down, will contain the last line at its top
                maxMinimapSliderTop = (extraLinesAtTheTop + lineCount + extraLinesAtTheBottom - expectedViewportLineCount - 1) * minimapLineHeight / pixelRatio;
            }
            else {
                // The minimap slider, when dragged all the way down, will contain the last line at its bottom
                maxMinimapSliderTop = Math.max(0, (extraLinesAtTheTop + lineCount) * minimapLineHeight / pixelRatio - sliderHeight);
            }
            maxMinimapSliderTop = Math.min(options.minimapHeight - sliderHeight, maxMinimapSliderTop);
            // The slider can move from 0 to `maxMinimapSliderTop`
            // in the same way `scrollTop` can move from 0 to `scrollHeight` - `viewportHeight`.
            const computedSliderRatio = (maxMinimapSliderTop) / (scrollHeight - viewportHeight);
            const sliderTop = (scrollTop * computedSliderRatio);
            if (minimapLinesFitting >= extraLinesAtTheTop + lineCount + extraLinesAtTheBottom) {
                // All lines fit in the minimap
                const sliderNeeded = (maxMinimapSliderTop > 0);
                return new MinimapLayout(scrollTop, scrollHeight, sliderNeeded, computedSliderRatio, sliderTop, sliderHeight, extraLinesAtTheTop, 1, lineCount);
            }
            else {
                let consideringStartLineNumber;
                if (viewportStartLineNumber > 1) {
                    consideringStartLineNumber = viewportStartLineNumber + extraLinesAtTheTop;
                }
                else {
                    consideringStartLineNumber = Math.max(1, scrollTop / lineHeight);
                }
                let topPaddingLineCount;
                let startLineNumber = Math.max(1, Math.floor(consideringStartLineNumber - sliderTop * pixelRatio / minimapLineHeight));
                if (startLineNumber < extraLinesAtTheTop) {
                    topPaddingLineCount = extraLinesAtTheTop - startLineNumber + 1;
                    startLineNumber = 1;
                }
                else {
                    topPaddingLineCount = 0;
                    startLineNumber = Math.max(1, startLineNumber - extraLinesAtTheTop);
                }
                // Avoid flickering caused by a partial viewport start line
                // by being consistent w.r.t. the previous layout decision
                if (previousLayout && previousLayout.scrollHeight === scrollHeight) {
                    if (previousLayout.scrollTop > scrollTop) {
                        // Scrolling up => never increase `startLineNumber`
                        startLineNumber = Math.min(startLineNumber, previousLayout.startLineNumber);
                        topPaddingLineCount = Math.max(topPaddingLineCount, previousLayout.topPaddingLineCount);
                    }
                    if (previousLayout.scrollTop < scrollTop) {
                        // Scrolling down => never decrease `startLineNumber`
                        startLineNumber = Math.max(startLineNumber, previousLayout.startLineNumber);
                        topPaddingLineCount = Math.min(topPaddingLineCount, previousLayout.topPaddingLineCount);
                    }
                }
                const endLineNumber = Math.min(lineCount, startLineNumber - topPaddingLineCount + minimapLinesFitting - 1);
                const partialLine = (scrollTop - viewportStartLineNumberVerticalOffset) / lineHeight;
                let sliderTopAligned;
                if (scrollTop >= options.paddingTop) {
                    sliderTopAligned = (viewportStartLineNumber - startLineNumber + topPaddingLineCount + partialLine) * minimapLineHeight / pixelRatio;
                }
                else {
                    sliderTopAligned = (scrollTop / options.paddingTop) * (topPaddingLineCount + partialLine) * minimapLineHeight / pixelRatio;
                }
                return new MinimapLayout(scrollTop, scrollHeight, true, computedSliderRatio, sliderTopAligned, sliderHeight, topPaddingLineCount, startLineNumber, endLineNumber);
            }
        }
    }
    class MinimapLine {
        static { this.INVALID = new MinimapLine(-1); }
        constructor(dy) {
            this.dy = dy;
        }
        onContentChanged() {
            this.dy = -1;
        }
        onTokensChanged() {
            this.dy = -1;
        }
    }
    class RenderData {
        constructor(renderedLayout, imageData, lines) {
            this.renderedLayout = renderedLayout;
            this._imageData = imageData;
            this._renderedLines = new viewLayer_1.RenderedLinesCollection(() => MinimapLine.INVALID);
            this._renderedLines._set(renderedLayout.startLineNumber, lines);
        }
        /**
         * Check if the current RenderData matches accurately the new desired layout and no painting is needed.
         */
        linesEquals(layout) {
            if (!this.scrollEquals(layout)) {
                return false;
            }
            const tmp = this._renderedLines._get();
            const lines = tmp.lines;
            for (let i = 0, len = lines.length; i < len; i++) {
                if (lines[i].dy === -1) {
                    // This line is invalid
                    return false;
                }
            }
            return true;
        }
        /**
         * Check if the current RenderData matches the new layout's scroll position
         */
        scrollEquals(layout) {
            return this.renderedLayout.startLineNumber === layout.startLineNumber
                && this.renderedLayout.endLineNumber === layout.endLineNumber;
        }
        _get() {
            const tmp = this._renderedLines._get();
            return {
                imageData: this._imageData,
                rendLineNumberStart: tmp.rendLineNumberStart,
                lines: tmp.lines
            };
        }
        onLinesChanged(changeFromLineNumber, changeCount) {
            return this._renderedLines.onLinesChanged(changeFromLineNumber, changeCount);
        }
        onLinesDeleted(deleteFromLineNumber, deleteToLineNumber) {
            this._renderedLines.onLinesDeleted(deleteFromLineNumber, deleteToLineNumber);
        }
        onLinesInserted(insertFromLineNumber, insertToLineNumber) {
            this._renderedLines.onLinesInserted(insertFromLineNumber, insertToLineNumber);
        }
        onTokensChanged(ranges) {
            return this._renderedLines.onTokensChanged(ranges);
        }
    }
    /**
     * Some sort of double buffering.
     *
     * Keeps two buffers around that will be rotated for painting.
     * Always gives a buffer that is filled with the background color.
     */
    class MinimapBuffers {
        constructor(ctx, WIDTH, HEIGHT, background) {
            this._backgroundFillData = MinimapBuffers._createBackgroundFillData(WIDTH, HEIGHT, background);
            this._buffers = [
                ctx.createImageData(WIDTH, HEIGHT),
                ctx.createImageData(WIDTH, HEIGHT)
            ];
            this._lastUsedBuffer = 0;
        }
        getBuffer() {
            // rotate buffers
            this._lastUsedBuffer = 1 - this._lastUsedBuffer;
            const result = this._buffers[this._lastUsedBuffer];
            // fill with background color
            result.data.set(this._backgroundFillData);
            return result;
        }
        static _createBackgroundFillData(WIDTH, HEIGHT, background) {
            const backgroundR = background.r;
            const backgroundG = background.g;
            const backgroundB = background.b;
            const backgroundA = background.a;
            const result = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
            let offset = 0;
            for (let i = 0; i < HEIGHT; i++) {
                for (let j = 0; j < WIDTH; j++) {
                    result[offset] = backgroundR;
                    result[offset + 1] = backgroundG;
                    result[offset + 2] = backgroundB;
                    result[offset + 3] = backgroundA;
                    offset += 4;
                }
            }
            return result;
        }
    }
    class MinimapSamplingState {
        static compute(options, viewLineCount, oldSamplingState) {
            if (options.renderMinimap === 0 /* RenderMinimap.None */ || !options.isSampling) {
                return [null, []];
            }
            // ratio is intentionally not part of the layout to avoid the layout changing all the time
            // so we need to recompute it again...
            const { minimapLineCount } = editorOptions_1.EditorLayoutInfoComputer.computeContainedMinimapLineCount({
                viewLineCount: viewLineCount,
                scrollBeyondLastLine: options.scrollBeyondLastLine,
                paddingTop: options.paddingTop,
                paddingBottom: options.paddingBottom,
                height: options.editorHeight,
                lineHeight: options.lineHeight,
                pixelRatio: options.pixelRatio
            });
            const ratio = viewLineCount / minimapLineCount;
            const halfRatio = ratio / 2;
            if (!oldSamplingState || oldSamplingState.minimapLines.length === 0) {
                const result = [];
                result[0] = 1;
                if (minimapLineCount > 1) {
                    for (let i = 0, lastIndex = minimapLineCount - 1; i < lastIndex; i++) {
                        result[i] = Math.round(i * ratio + halfRatio);
                    }
                    result[minimapLineCount - 1] = viewLineCount;
                }
                return [new MinimapSamplingState(ratio, result), []];
            }
            const oldMinimapLines = oldSamplingState.minimapLines;
            const oldLength = oldMinimapLines.length;
            const result = [];
            let oldIndex = 0;
            let oldDeltaLineCount = 0;
            let minViewLineNumber = 1;
            const MAX_EVENT_COUNT = 10; // generate at most 10 events, if there are more than 10 changes, just flush all previous data
            let events = [];
            let lastEvent = null;
            for (let i = 0; i < minimapLineCount; i++) {
                const fromViewLineNumber = Math.max(minViewLineNumber, Math.round(i * ratio));
                const toViewLineNumber = Math.max(fromViewLineNumber, Math.round((i + 1) * ratio));
                while (oldIndex < oldLength && oldMinimapLines[oldIndex] < fromViewLineNumber) {
                    if (events.length < MAX_EVENT_COUNT) {
                        const oldMinimapLineNumber = oldIndex + 1 + oldDeltaLineCount;
                        if (lastEvent && lastEvent.type === 'deleted' && lastEvent._oldIndex === oldIndex - 1) {
                            lastEvent.deleteToLineNumber++;
                        }
                        else {
                            lastEvent = { type: 'deleted', _oldIndex: oldIndex, deleteFromLineNumber: oldMinimapLineNumber, deleteToLineNumber: oldMinimapLineNumber };
                            events.push(lastEvent);
                        }
                        oldDeltaLineCount--;
                    }
                    oldIndex++;
                }
                let selectedViewLineNumber;
                if (oldIndex < oldLength && oldMinimapLines[oldIndex] <= toViewLineNumber) {
                    // reuse the old sampled line
                    selectedViewLineNumber = oldMinimapLines[oldIndex];
                    oldIndex++;
                }
                else {
                    if (i === 0) {
                        selectedViewLineNumber = 1;
                    }
                    else if (i + 1 === minimapLineCount) {
                        selectedViewLineNumber = viewLineCount;
                    }
                    else {
                        selectedViewLineNumber = Math.round(i * ratio + halfRatio);
                    }
                    if (events.length < MAX_EVENT_COUNT) {
                        const oldMinimapLineNumber = oldIndex + 1 + oldDeltaLineCount;
                        if (lastEvent && lastEvent.type === 'inserted' && lastEvent._i === i - 1) {
                            lastEvent.insertToLineNumber++;
                        }
                        else {
                            lastEvent = { type: 'inserted', _i: i, insertFromLineNumber: oldMinimapLineNumber, insertToLineNumber: oldMinimapLineNumber };
                            events.push(lastEvent);
                        }
                        oldDeltaLineCount++;
                    }
                }
                result[i] = selectedViewLineNumber;
                minViewLineNumber = selectedViewLineNumber;
            }
            if (events.length < MAX_EVENT_COUNT) {
                while (oldIndex < oldLength) {
                    const oldMinimapLineNumber = oldIndex + 1 + oldDeltaLineCount;
                    if (lastEvent && lastEvent.type === 'deleted' && lastEvent._oldIndex === oldIndex - 1) {
                        lastEvent.deleteToLineNumber++;
                    }
                    else {
                        lastEvent = { type: 'deleted', _oldIndex: oldIndex, deleteFromLineNumber: oldMinimapLineNumber, deleteToLineNumber: oldMinimapLineNumber };
                        events.push(lastEvent);
                    }
                    oldDeltaLineCount--;
                    oldIndex++;
                }
            }
            else {
                // too many events, just give up
                events = [{ type: 'flush' }];
            }
            return [new MinimapSamplingState(ratio, result), events];
        }
        constructor(samplingRatio, minimapLines // a map of 0-based minimap line indexes to 1-based view line numbers
        ) {
            this.samplingRatio = samplingRatio;
            this.minimapLines = minimapLines;
        }
        modelLineToMinimapLine(lineNumber) {
            return Math.min(this.minimapLines.length, Math.max(1, Math.round(lineNumber / this.samplingRatio)));
        }
        /**
         * Will return null if the model line ranges are not intersecting with a sampled model line.
         */
        modelLineRangeToMinimapLineRange(fromLineNumber, toLineNumber) {
            let fromLineIndex = this.modelLineToMinimapLine(fromLineNumber) - 1;
            while (fromLineIndex > 0 && this.minimapLines[fromLineIndex - 1] >= fromLineNumber) {
                fromLineIndex--;
            }
            let toLineIndex = this.modelLineToMinimapLine(toLineNumber) - 1;
            while (toLineIndex + 1 < this.minimapLines.length && this.minimapLines[toLineIndex + 1] <= toLineNumber) {
                toLineIndex++;
            }
            if (fromLineIndex === toLineIndex) {
                const sampledLineNumber = this.minimapLines[fromLineIndex];
                if (sampledLineNumber < fromLineNumber || sampledLineNumber > toLineNumber) {
                    // This line is not part of the sampled lines ==> nothing to do
                    return null;
                }
            }
            return [fromLineIndex + 1, toLineIndex + 1];
        }
        /**
         * Will always return a range, even if it is not intersecting with a sampled model line.
         */
        decorationLineRangeToMinimapLineRange(startLineNumber, endLineNumber) {
            let minimapLineStart = this.modelLineToMinimapLine(startLineNumber);
            let minimapLineEnd = this.modelLineToMinimapLine(endLineNumber);
            if (startLineNumber !== endLineNumber && minimapLineEnd === minimapLineStart) {
                if (minimapLineEnd === this.minimapLines.length) {
                    if (minimapLineStart > 1) {
                        minimapLineStart--;
                    }
                }
                else {
                    minimapLineEnd++;
                }
            }
            return [minimapLineStart, minimapLineEnd];
        }
        onLinesDeleted(e) {
            // have the mapping be sticky
            const deletedLineCount = e.toLineNumber - e.fromLineNumber + 1;
            let changeStartIndex = this.minimapLines.length;
            let changeEndIndex = 0;
            for (let i = this.minimapLines.length - 1; i >= 0; i--) {
                if (this.minimapLines[i] < e.fromLineNumber) {
                    break;
                }
                if (this.minimapLines[i] <= e.toLineNumber) {
                    // this line got deleted => move to previous available
                    this.minimapLines[i] = Math.max(1, e.fromLineNumber - 1);
                    changeStartIndex = Math.min(changeStartIndex, i);
                    changeEndIndex = Math.max(changeEndIndex, i);
                }
                else {
                    this.minimapLines[i] -= deletedLineCount;
                }
            }
            return [changeStartIndex, changeEndIndex];
        }
        onLinesInserted(e) {
            // have the mapping be sticky
            const insertedLineCount = e.toLineNumber - e.fromLineNumber + 1;
            for (let i = this.minimapLines.length - 1; i >= 0; i--) {
                if (this.minimapLines[i] < e.fromLineNumber) {
                    break;
                }
                this.minimapLines[i] += insertedLineCount;
            }
        }
    }
    class Minimap extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._sectionHeaderCache = new map_1.LRUCache(10, 1.5);
            this.tokensColorTracker = minimapTokensColorTracker_1.MinimapTokensColorTracker.getInstance();
            this._selections = [];
            this._minimapSelections = null;
            this.options = new MinimapOptions(this._context.configuration, this._context.theme, this.tokensColorTracker);
            const [samplingState,] = MinimapSamplingState.compute(this.options, this._context.viewModel.getLineCount(), null);
            this._samplingState = samplingState;
            this._shouldCheckSampling = false;
            this._actual = new InnerMinimap(context.theme, this);
        }
        dispose() {
            this._actual.dispose();
            super.dispose();
        }
        getDomNode() {
            return this._actual.getDomNode();
        }
        _onOptionsMaybeChanged() {
            const opts = new MinimapOptions(this._context.configuration, this._context.theme, this.tokensColorTracker);
            if (this.options.equals(opts)) {
                return false;
            }
            this.options = opts;
            this._recreateLineSampling();
            this._actual.onDidChangeOptions();
            return true;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            return this._onOptionsMaybeChanged();
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            this._minimapSelections = null;
            return this._actual.onSelectionChanged();
        }
        onDecorationsChanged(e) {
            if (e.affectsMinimap) {
                return this._actual.onDecorationsChanged();
            }
            return false;
        }
        onFlushed(e) {
            if (this._samplingState) {
                this._shouldCheckSampling = true;
            }
            return this._actual.onFlushed();
        }
        onLinesChanged(e) {
            if (this._samplingState) {
                const minimapLineRange = this._samplingState.modelLineRangeToMinimapLineRange(e.fromLineNumber, e.fromLineNumber + e.count - 1);
                if (minimapLineRange) {
                    return this._actual.onLinesChanged(minimapLineRange[0], minimapLineRange[1] - minimapLineRange[0] + 1);
                }
                else {
                    return false;
                }
            }
            else {
                return this._actual.onLinesChanged(e.fromLineNumber, e.count);
            }
        }
        onLinesDeleted(e) {
            if (this._samplingState) {
                const [changeStartIndex, changeEndIndex] = this._samplingState.onLinesDeleted(e);
                if (changeStartIndex <= changeEndIndex) {
                    this._actual.onLinesChanged(changeStartIndex + 1, changeEndIndex - changeStartIndex + 1);
                }
                this._shouldCheckSampling = true;
                return true;
            }
            else {
                return this._actual.onLinesDeleted(e.fromLineNumber, e.toLineNumber);
            }
        }
        onLinesInserted(e) {
            if (this._samplingState) {
                this._samplingState.onLinesInserted(e);
                this._shouldCheckSampling = true;
                return true;
            }
            else {
                return this._actual.onLinesInserted(e.fromLineNumber, e.toLineNumber);
            }
        }
        onScrollChanged(e) {
            return this._actual.onScrollChanged();
        }
        onThemeChanged(e) {
            this._actual.onThemeChanged();
            this._onOptionsMaybeChanged();
            return true;
        }
        onTokensChanged(e) {
            if (this._samplingState) {
                const ranges = [];
                for (const range of e.ranges) {
                    const minimapLineRange = this._samplingState.modelLineRangeToMinimapLineRange(range.fromLineNumber, range.toLineNumber);
                    if (minimapLineRange) {
                        ranges.push({ fromLineNumber: minimapLineRange[0], toLineNumber: minimapLineRange[1] });
                    }
                }
                if (ranges.length) {
                    return this._actual.onTokensChanged(ranges);
                }
                else {
                    return false;
                }
            }
            else {
                return this._actual.onTokensChanged(e.ranges);
            }
        }
        onTokensColorsChanged(e) {
            this._onOptionsMaybeChanged();
            return this._actual.onTokensColorsChanged();
        }
        onZonesChanged(e) {
            return this._actual.onZonesChanged();
        }
        // --- end event handlers
        prepareRender(ctx) {
            if (this._shouldCheckSampling) {
                this._shouldCheckSampling = false;
                this._recreateLineSampling();
            }
        }
        render(ctx) {
            let viewportStartLineNumber = ctx.visibleRange.startLineNumber;
            let viewportEndLineNumber = ctx.visibleRange.endLineNumber;
            if (this._samplingState) {
                viewportStartLineNumber = this._samplingState.modelLineToMinimapLine(viewportStartLineNumber);
                viewportEndLineNumber = this._samplingState.modelLineToMinimapLine(viewportEndLineNumber);
            }
            const minimapCtx = {
                viewportContainsWhitespaceGaps: (ctx.viewportData.whitespaceViewportData.length > 0),
                scrollWidth: ctx.scrollWidth,
                scrollHeight: ctx.scrollHeight,
                viewportStartLineNumber: viewportStartLineNumber,
                viewportEndLineNumber: viewportEndLineNumber,
                viewportStartLineNumberVerticalOffset: ctx.getVerticalOffsetForLineNumber(viewportStartLineNumber),
                scrollTop: ctx.scrollTop,
                scrollLeft: ctx.scrollLeft,
                viewportWidth: ctx.viewportWidth,
                viewportHeight: ctx.viewportHeight,
            };
            this._actual.render(minimapCtx);
        }
        //#region IMinimapModel
        _recreateLineSampling() {
            this._minimapSelections = null;
            const wasSampling = Boolean(this._samplingState);
            const [samplingState, events] = MinimapSamplingState.compute(this.options, this._context.viewModel.getLineCount(), this._samplingState);
            this._samplingState = samplingState;
            if (wasSampling && this._samplingState) {
                // was sampling, is sampling
                for (const event of events) {
                    switch (event.type) {
                        case 'deleted':
                            this._actual.onLinesDeleted(event.deleteFromLineNumber, event.deleteToLineNumber);
                            break;
                        case 'inserted':
                            this._actual.onLinesInserted(event.insertFromLineNumber, event.insertToLineNumber);
                            break;
                        case 'flush':
                            this._actual.onFlushed();
                            break;
                    }
                }
            }
        }
        getLineCount() {
            if (this._samplingState) {
                return this._samplingState.minimapLines.length;
            }
            return this._context.viewModel.getLineCount();
        }
        getRealLineCount() {
            return this._context.viewModel.getLineCount();
        }
        getLineContent(lineNumber) {
            if (this._samplingState) {
                return this._context.viewModel.getLineContent(this._samplingState.minimapLines[lineNumber - 1]);
            }
            return this._context.viewModel.getLineContent(lineNumber);
        }
        getLineMaxColumn(lineNumber) {
            if (this._samplingState) {
                return this._context.viewModel.getLineMaxColumn(this._samplingState.minimapLines[lineNumber - 1]);
            }
            return this._context.viewModel.getLineMaxColumn(lineNumber);
        }
        getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed) {
            if (this._samplingState) {
                const result = [];
                for (let lineIndex = 0, lineCount = endLineNumber - startLineNumber + 1; lineIndex < lineCount; lineIndex++) {
                    if (needed[lineIndex]) {
                        result[lineIndex] = this._context.viewModel.getViewLineData(this._samplingState.minimapLines[startLineNumber + lineIndex - 1]);
                    }
                    else {
                        result[lineIndex] = null;
                    }
                }
                return result;
            }
            return this._context.viewModel.getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed).data;
        }
        getSelections() {
            if (this._minimapSelections === null) {
                if (this._samplingState) {
                    this._minimapSelections = [];
                    for (const selection of this._selections) {
                        const [minimapLineStart, minimapLineEnd] = this._samplingState.decorationLineRangeToMinimapLineRange(selection.startLineNumber, selection.endLineNumber);
                        this._minimapSelections.push(new selection_1.Selection(minimapLineStart, selection.startColumn, minimapLineEnd, selection.endColumn));
                    }
                }
                else {
                    this._minimapSelections = this._selections;
                }
            }
            return this._minimapSelections;
        }
        getMinimapDecorationsInViewport(startLineNumber, endLineNumber) {
            const decorations = this._getMinimapDecorationsInViewport(startLineNumber, endLineNumber)
                .filter(decoration => !decoration.options.minimap?.sectionHeaderStyle);
            if (this._samplingState) {
                const result = [];
                for (const decoration of decorations) {
                    if (!decoration.options.minimap) {
                        continue;
                    }
                    const range = decoration.range;
                    const minimapStartLineNumber = this._samplingState.modelLineToMinimapLine(range.startLineNumber);
                    const minimapEndLineNumber = this._samplingState.modelLineToMinimapLine(range.endLineNumber);
                    result.push(new viewModel_1.ViewModelDecoration(new range_1.Range(minimapStartLineNumber, range.startColumn, minimapEndLineNumber, range.endColumn), decoration.options));
                }
                return result;
            }
            return decorations;
        }
        getSectionHeaderDecorationsInViewport(startLineNumber, endLineNumber) {
            const minimapLineHeight = this.options.minimapLineHeight;
            const sectionHeaderFontSize = this.options.sectionHeaderFontSize;
            const headerHeightInMinimapLines = sectionHeaderFontSize / minimapLineHeight;
            startLineNumber = Math.floor(Math.max(1, startLineNumber - headerHeightInMinimapLines));
            return this._getMinimapDecorationsInViewport(startLineNumber, endLineNumber)
                .filter(decoration => !!decoration.options.minimap?.sectionHeaderStyle);
        }
        _getMinimapDecorationsInViewport(startLineNumber, endLineNumber) {
            let visibleRange;
            if (this._samplingState) {
                const modelStartLineNumber = this._samplingState.minimapLines[startLineNumber - 1];
                const modelEndLineNumber = this._samplingState.minimapLines[endLineNumber - 1];
                visibleRange = new range_1.Range(modelStartLineNumber, 1, modelEndLineNumber, this._context.viewModel.getLineMaxColumn(modelEndLineNumber));
            }
            else {
                visibleRange = new range_1.Range(startLineNumber, 1, endLineNumber, this._context.viewModel.getLineMaxColumn(endLineNumber));
            }
            return this._context.viewModel.getMinimapDecorationsInRange(visibleRange);
        }
        getSectionHeaderText(decoration, fitWidth) {
            const headerText = decoration.options.minimap?.sectionHeaderText;
            if (!headerText) {
                return null;
            }
            const cachedText = this._sectionHeaderCache.get(headerText);
            if (cachedText) {
                return cachedText;
            }
            const fittedText = fitWidth(headerText);
            this._sectionHeaderCache.set(headerText, fittedText);
            return fittedText;
        }
        getOptions() {
            return this._context.viewModel.model.getOptions();
        }
        revealLineNumber(lineNumber) {
            if (this._samplingState) {
                lineNumber = this._samplingState.minimapLines[lineNumber - 1];
            }
            this._context.viewModel.revealRange('mouse', false, new range_1.Range(lineNumber, 1, lineNumber, 1), 1 /* viewEvents.VerticalRevealType.Center */, 0 /* ScrollType.Smooth */);
        }
        setScrollTop(scrollTop) {
            this._context.viewModel.viewLayout.setScrollPosition({
                scrollTop: scrollTop
            }, 1 /* ScrollType.Immediate */);
        }
    }
    exports.Minimap = Minimap;
    class InnerMinimap extends lifecycle_1.Disposable {
        constructor(theme, model) {
            super();
            this._renderDecorations = false;
            this._gestureInProgress = false;
            this._theme = theme;
            this._model = model;
            this._lastRenderData = null;
            this._buffers = null;
            this._selectionColor = this._theme.getColor(colorRegistry_1.minimapSelection);
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._domNode, 9 /* PartFingerprint.Minimap */);
            this._domNode.setClassName(this._getMinimapDomNodeClassName());
            this._domNode.setPosition('absolute');
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._shadow = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._shadow.setClassName('minimap-shadow-hidden');
            this._domNode.appendChild(this._shadow);
            this._canvas = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._canvas.setPosition('absolute');
            this._canvas.setLeft(0);
            this._domNode.appendChild(this._canvas);
            this._decorationsCanvas = (0, fastDomNode_1.createFastDomNode)(document.createElement('canvas'));
            this._decorationsCanvas.setPosition('absolute');
            this._decorationsCanvas.setClassName('minimap-decorations-layer');
            this._decorationsCanvas.setLeft(0);
            this._domNode.appendChild(this._decorationsCanvas);
            this._slider = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._slider.setPosition('absolute');
            this._slider.setClassName('minimap-slider');
            this._slider.setLayerHinting(true);
            this._slider.setContain('strict');
            this._domNode.appendChild(this._slider);
            this._sliderHorizontal = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._sliderHorizontal.setPosition('absolute');
            this._sliderHorizontal.setClassName('minimap-slider-horizontal');
            this._slider.appendChild(this._sliderHorizontal);
            this._applyLayout();
            this._pointerDownListener = dom.addStandardDisposableListener(this._domNode.domNode, dom.EventType.POINTER_DOWN, (e) => {
                e.preventDefault();
                const renderMinimap = this._model.options.renderMinimap;
                if (renderMinimap === 0 /* RenderMinimap.None */) {
                    return;
                }
                if (!this._lastRenderData) {
                    return;
                }
                if (this._model.options.size !== 'proportional') {
                    if (e.button === 0 && this._lastRenderData) {
                        // pretend the click occurred in the center of the slider
                        const position = dom.getDomNodePagePosition(this._slider.domNode);
                        const initialPosY = position.top + position.height / 2;
                        this._startSliderDragging(e, initialPosY, this._lastRenderData.renderedLayout);
                    }
                    return;
                }
                const minimapLineHeight = this._model.options.minimapLineHeight;
                const internalOffsetY = (this._model.options.canvasInnerHeight / this._model.options.canvasOuterHeight) * e.offsetY;
                const lineIndex = Math.floor(internalOffsetY / minimapLineHeight);
                let lineNumber = lineIndex + this._lastRenderData.renderedLayout.startLineNumber - this._lastRenderData.renderedLayout.topPaddingLineCount;
                lineNumber = Math.min(lineNumber, this._model.getLineCount());
                this._model.revealLineNumber(lineNumber);
            });
            this._sliderPointerMoveMonitor = new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor();
            this._sliderPointerDownListener = dom.addStandardDisposableListener(this._slider.domNode, dom.EventType.POINTER_DOWN, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.button === 0 && this._lastRenderData) {
                    this._startSliderDragging(e, e.pageY, this._lastRenderData.renderedLayout);
                }
            });
            this._gestureDisposable = touch_1.Gesture.addTarget(this._domNode.domNode);
            this._sliderTouchStartListener = dom.addDisposableListener(this._domNode.domNode, touch_1.EventType.Start, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this._lastRenderData) {
                    this._slider.toggleClassName('active', true);
                    this._gestureInProgress = true;
                    this.scrollDueToTouchEvent(e);
                }
            }, { passive: false });
            this._sliderTouchMoveListener = dom.addDisposableListener(this._domNode.domNode, touch_1.EventType.Change, (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this._lastRenderData && this._gestureInProgress) {
                    this.scrollDueToTouchEvent(e);
                }
            }, { passive: false });
            this._sliderTouchEndListener = dom.addStandardDisposableListener(this._domNode.domNode, touch_1.EventType.End, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._gestureInProgress = false;
                this._slider.toggleClassName('active', false);
            });
        }
        _startSliderDragging(e, initialPosY, initialSliderState) {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            const initialPosX = e.pageX;
            this._slider.toggleClassName('active', true);
            const handlePointerMove = (posy, posx) => {
                const minimapPosition = dom.getDomNodePagePosition(this._domNode.domNode);
                const pointerOrthogonalDelta = Math.min(Math.abs(posx - initialPosX), Math.abs(posx - minimapPosition.left), Math.abs(posx - minimapPosition.left - minimapPosition.width));
                if (platform.isWindows && pointerOrthogonalDelta > POINTER_DRAG_RESET_DISTANCE) {
                    // The pointer has wondered away from the scrollbar => reset dragging
                    this._model.setScrollTop(initialSliderState.scrollTop);
                    return;
                }
                const pointerDelta = posy - initialPosY;
                this._model.setScrollTop(initialSliderState.getDesiredScrollTopFromDelta(pointerDelta));
            };
            if (e.pageY !== initialPosY) {
                handlePointerMove(e.pageY, initialPosX);
            }
            this._sliderPointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, pointerMoveData => handlePointerMove(pointerMoveData.pageY, pointerMoveData.pageX), () => {
                this._slider.toggleClassName('active', false);
            });
        }
        scrollDueToTouchEvent(touch) {
            const startY = this._domNode.domNode.getBoundingClientRect().top;
            const scrollTop = this._lastRenderData.renderedLayout.getDesiredScrollTopFromTouchLocation(touch.pageY - startY);
            this._model.setScrollTop(scrollTop);
        }
        dispose() {
            this._pointerDownListener.dispose();
            this._sliderPointerMoveMonitor.dispose();
            this._sliderPointerDownListener.dispose();
            this._gestureDisposable.dispose();
            this._sliderTouchStartListener.dispose();
            this._sliderTouchMoveListener.dispose();
            this._sliderTouchEndListener.dispose();
            super.dispose();
        }
        _getMinimapDomNodeClassName() {
            const class_ = ['minimap'];
            if (this._model.options.showSlider === 'always') {
                class_.push('slider-always');
            }
            else {
                class_.push('slider-mouseover');
            }
            if (this._model.options.autohide) {
                class_.push('autohide');
            }
            return class_.join(' ');
        }
        getDomNode() {
            return this._domNode;
        }
        _applyLayout() {
            this._domNode.setLeft(this._model.options.minimapLeft);
            this._domNode.setWidth(this._model.options.minimapWidth);
            this._domNode.setHeight(this._model.options.minimapHeight);
            this._shadow.setHeight(this._model.options.minimapHeight);
            this._canvas.setWidth(this._model.options.canvasOuterWidth);
            this._canvas.setHeight(this._model.options.canvasOuterHeight);
            this._canvas.domNode.width = this._model.options.canvasInnerWidth;
            this._canvas.domNode.height = this._model.options.canvasInnerHeight;
            this._decorationsCanvas.setWidth(this._model.options.canvasOuterWidth);
            this._decorationsCanvas.setHeight(this._model.options.canvasOuterHeight);
            this._decorationsCanvas.domNode.width = this._model.options.canvasInnerWidth;
            this._decorationsCanvas.domNode.height = this._model.options.canvasInnerHeight;
            this._slider.setWidth(this._model.options.minimapWidth);
        }
        _getBuffer() {
            if (!this._buffers) {
                if (this._model.options.canvasInnerWidth > 0 && this._model.options.canvasInnerHeight > 0) {
                    this._buffers = new MinimapBuffers(this._canvas.domNode.getContext('2d'), this._model.options.canvasInnerWidth, this._model.options.canvasInnerHeight, this._model.options.backgroundColor);
                }
            }
            return this._buffers ? this._buffers.getBuffer() : null;
        }
        // ---- begin view event handlers
        onDidChangeOptions() {
            this._lastRenderData = null;
            this._buffers = null;
            this._applyLayout();
            this._domNode.setClassName(this._getMinimapDomNodeClassName());
        }
        onSelectionChanged() {
            this._renderDecorations = true;
            return true;
        }
        onDecorationsChanged() {
            this._renderDecorations = true;
            return true;
        }
        onFlushed() {
            this._lastRenderData = null;
            return true;
        }
        onLinesChanged(changeFromLineNumber, changeCount) {
            if (this._lastRenderData) {
                return this._lastRenderData.onLinesChanged(changeFromLineNumber, changeCount);
            }
            return false;
        }
        onLinesDeleted(deleteFromLineNumber, deleteToLineNumber) {
            this._lastRenderData?.onLinesDeleted(deleteFromLineNumber, deleteToLineNumber);
            return true;
        }
        onLinesInserted(insertFromLineNumber, insertToLineNumber) {
            this._lastRenderData?.onLinesInserted(insertFromLineNumber, insertToLineNumber);
            return true;
        }
        onScrollChanged() {
            this._renderDecorations = true;
            return true;
        }
        onThemeChanged() {
            this._selectionColor = this._theme.getColor(colorRegistry_1.minimapSelection);
            this._renderDecorations = true;
            return true;
        }
        onTokensChanged(ranges) {
            if (this._lastRenderData) {
                return this._lastRenderData.onTokensChanged(ranges);
            }
            return false;
        }
        onTokensColorsChanged() {
            this._lastRenderData = null;
            this._buffers = null;
            return true;
        }
        onZonesChanged() {
            this._lastRenderData = null;
            return true;
        }
        // --- end event handlers
        render(renderingCtx) {
            const renderMinimap = this._model.options.renderMinimap;
            if (renderMinimap === 0 /* RenderMinimap.None */) {
                this._shadow.setClassName('minimap-shadow-hidden');
                this._sliderHorizontal.setWidth(0);
                this._sliderHorizontal.setHeight(0);
                return;
            }
            if (renderingCtx.scrollLeft + renderingCtx.viewportWidth >= renderingCtx.scrollWidth) {
                this._shadow.setClassName('minimap-shadow-hidden');
            }
            else {
                this._shadow.setClassName('minimap-shadow-visible');
            }
            const layout = MinimapLayout.create(this._model.options, renderingCtx.viewportStartLineNumber, renderingCtx.viewportEndLineNumber, renderingCtx.viewportStartLineNumberVerticalOffset, renderingCtx.viewportHeight, renderingCtx.viewportContainsWhitespaceGaps, this._model.getLineCount(), this._model.getRealLineCount(), renderingCtx.scrollTop, renderingCtx.scrollHeight, this._lastRenderData ? this._lastRenderData.renderedLayout : null);
            this._slider.setDisplay(layout.sliderNeeded ? 'block' : 'none');
            this._slider.setTop(layout.sliderTop);
            this._slider.setHeight(layout.sliderHeight);
            // Compute horizontal slider coordinates
            this._sliderHorizontal.setLeft(0);
            this._sliderHorizontal.setWidth(this._model.options.minimapWidth);
            this._sliderHorizontal.setTop(0);
            this._sliderHorizontal.setHeight(layout.sliderHeight);
            this.renderDecorations(layout);
            this._lastRenderData = this.renderLines(layout);
        }
        renderDecorations(layout) {
            if (this._renderDecorations) {
                this._renderDecorations = false;
                const selections = this._model.getSelections();
                selections.sort(range_1.Range.compareRangesUsingStarts);
                const decorations = this._model.getMinimapDecorationsInViewport(layout.startLineNumber, layout.endLineNumber);
                decorations.sort((a, b) => (a.options.zIndex || 0) - (b.options.zIndex || 0));
                const { canvasInnerWidth, canvasInnerHeight } = this._model.options;
                const minimapLineHeight = this._model.options.minimapLineHeight;
                const minimapCharWidth = this._model.options.minimapCharWidth;
                const tabSize = this._model.getOptions().tabSize;
                const canvasContext = this._decorationsCanvas.domNode.getContext('2d');
                canvasContext.clearRect(0, 0, canvasInnerWidth, canvasInnerHeight);
                // We first need to render line highlights and then render decorations on top of those.
                // But we need to pick a single color for each line, and use that as a line highlight.
                // This needs to be the color of the decoration with the highest `zIndex`, but priority
                // is given to the selection.
                const highlightedLines = new ContiguousLineMap(layout.startLineNumber, layout.endLineNumber, false);
                this._renderSelectionLineHighlights(canvasContext, selections, highlightedLines, layout, minimapLineHeight);
                this._renderDecorationsLineHighlights(canvasContext, decorations, highlightedLines, layout, minimapLineHeight);
                const lineOffsetMap = new ContiguousLineMap(layout.startLineNumber, layout.endLineNumber, null);
                this._renderSelectionsHighlights(canvasContext, selections, lineOffsetMap, layout, minimapLineHeight, tabSize, minimapCharWidth, canvasInnerWidth);
                this._renderDecorationsHighlights(canvasContext, decorations, lineOffsetMap, layout, minimapLineHeight, tabSize, minimapCharWidth, canvasInnerWidth);
                this._renderSectionHeaders(layout);
            }
        }
        _renderSelectionLineHighlights(canvasContext, selections, highlightedLines, layout, minimapLineHeight) {
            if (!this._selectionColor || this._selectionColor.isTransparent()) {
                return;
            }
            canvasContext.fillStyle = this._selectionColor.transparent(0.5).toString();
            let y1 = 0;
            let y2 = 0;
            for (const selection of selections) {
                const intersection = layout.intersectWithViewport(selection);
                if (!intersection) {
                    // entirely outside minimap's viewport
                    continue;
                }
                const [startLineNumber, endLineNumber] = intersection;
                for (let line = startLineNumber; line <= endLineNumber; line++) {
                    highlightedLines.set(line, true);
                }
                const yy1 = layout.getYForLineNumber(startLineNumber, minimapLineHeight);
                const yy2 = layout.getYForLineNumber(endLineNumber, minimapLineHeight);
                if (y2 >= yy1) {
                    // merge into previous
                    y2 = yy2;
                }
                else {
                    if (y2 > y1) {
                        // flush
                        canvasContext.fillRect(editorOptions_1.MINIMAP_GUTTER_WIDTH, y1, canvasContext.canvas.width, y2 - y1);
                    }
                    y1 = yy1;
                    y2 = yy2;
                }
            }
            if (y2 > y1) {
                // flush
                canvasContext.fillRect(editorOptions_1.MINIMAP_GUTTER_WIDTH, y1, canvasContext.canvas.width, y2 - y1);
            }
        }
        _renderDecorationsLineHighlights(canvasContext, decorations, highlightedLines, layout, minimapLineHeight) {
            const highlightColors = new Map();
            // Loop backwards to hit first decorations with higher `zIndex`
            for (let i = decorations.length - 1; i >= 0; i--) {
                const decoration = decorations[i];
                const minimapOptions = decoration.options.minimap;
                if (!minimapOptions || minimapOptions.position !== 1 /* MinimapPosition.Inline */) {
                    continue;
                }
                const intersection = layout.intersectWithViewport(decoration.range);
                if (!intersection) {
                    // entirely outside minimap's viewport
                    continue;
                }
                const [startLineNumber, endLineNumber] = intersection;
                const decorationColor = minimapOptions.getColor(this._theme.value);
                if (!decorationColor || decorationColor.isTransparent()) {
                    continue;
                }
                let highlightColor = highlightColors.get(decorationColor.toString());
                if (!highlightColor) {
                    highlightColor = decorationColor.transparent(0.5).toString();
                    highlightColors.set(decorationColor.toString(), highlightColor);
                }
                canvasContext.fillStyle = highlightColor;
                for (let line = startLineNumber; line <= endLineNumber; line++) {
                    if (highlightedLines.has(line)) {
                        continue;
                    }
                    highlightedLines.set(line, true);
                    const y = layout.getYForLineNumber(startLineNumber, minimapLineHeight);
                    canvasContext.fillRect(editorOptions_1.MINIMAP_GUTTER_WIDTH, y, canvasContext.canvas.width, minimapLineHeight);
                }
            }
        }
        _renderSelectionsHighlights(canvasContext, selections, lineOffsetMap, layout, lineHeight, tabSize, characterWidth, canvasInnerWidth) {
            if (!this._selectionColor || this._selectionColor.isTransparent()) {
                return;
            }
            for (const selection of selections) {
                const intersection = layout.intersectWithViewport(selection);
                if (!intersection) {
                    // entirely outside minimap's viewport
                    continue;
                }
                const [startLineNumber, endLineNumber] = intersection;
                for (let line = startLineNumber; line <= endLineNumber; line++) {
                    this.renderDecorationOnLine(canvasContext, lineOffsetMap, selection, this._selectionColor, layout, line, lineHeight, lineHeight, tabSize, characterWidth, canvasInnerWidth);
                }
            }
        }
        _renderDecorationsHighlights(canvasContext, decorations, lineOffsetMap, layout, minimapLineHeight, tabSize, characterWidth, canvasInnerWidth) {
            // Loop forwards to hit first decorations with lower `zIndex`
            for (const decoration of decorations) {
                const minimapOptions = decoration.options.minimap;
                if (!minimapOptions) {
                    continue;
                }
                const intersection = layout.intersectWithViewport(decoration.range);
                if (!intersection) {
                    // entirely outside minimap's viewport
                    continue;
                }
                const [startLineNumber, endLineNumber] = intersection;
                const decorationColor = minimapOptions.getColor(this._theme.value);
                if (!decorationColor || decorationColor.isTransparent()) {
                    continue;
                }
                for (let line = startLineNumber; line <= endLineNumber; line++) {
                    switch (minimapOptions.position) {
                        case 1 /* MinimapPosition.Inline */:
                            this.renderDecorationOnLine(canvasContext, lineOffsetMap, decoration.range, decorationColor, layout, line, minimapLineHeight, minimapLineHeight, tabSize, characterWidth, canvasInnerWidth);
                            continue;
                        case 2 /* MinimapPosition.Gutter */: {
                            const y = layout.getYForLineNumber(line, minimapLineHeight);
                            const x = 2;
                            this.renderDecoration(canvasContext, decorationColor, x, y, GUTTER_DECORATION_WIDTH, minimapLineHeight);
                            continue;
                        }
                    }
                }
            }
        }
        renderDecorationOnLine(canvasContext, lineOffsetMap, decorationRange, decorationColor, layout, lineNumber, height, minimapLineHeight, tabSize, charWidth, canvasInnerWidth) {
            const y = layout.getYForLineNumber(lineNumber, minimapLineHeight);
            // Skip rendering the line if it's vertically outside our viewport
            if (y + height < 0 || y > this._model.options.canvasInnerHeight) {
                return;
            }
            const { startLineNumber, endLineNumber } = decorationRange;
            const startColumn = (startLineNumber === lineNumber ? decorationRange.startColumn : 1);
            const endColumn = (endLineNumber === lineNumber ? decorationRange.endColumn : this._model.getLineMaxColumn(lineNumber));
            const x1 = this.getXOffsetForPosition(lineOffsetMap, lineNumber, startColumn, tabSize, charWidth, canvasInnerWidth);
            const x2 = this.getXOffsetForPosition(lineOffsetMap, lineNumber, endColumn, tabSize, charWidth, canvasInnerWidth);
            this.renderDecoration(canvasContext, decorationColor, x1, y, x2 - x1, height);
        }
        getXOffsetForPosition(lineOffsetMap, lineNumber, column, tabSize, charWidth, canvasInnerWidth) {
            if (column === 1) {
                return editorOptions_1.MINIMAP_GUTTER_WIDTH;
            }
            const minimumXOffset = (column - 1) * charWidth;
            if (minimumXOffset >= canvasInnerWidth) {
                // there is no need to look at actual characters,
                // as this column is certainly after the minimap width
                return canvasInnerWidth;
            }
            // Cache line offset data so that it is only read once per line
            let lineIndexToXOffset = lineOffsetMap.get(lineNumber);
            if (!lineIndexToXOffset) {
                const lineData = this._model.getLineContent(lineNumber);
                lineIndexToXOffset = [editorOptions_1.MINIMAP_GUTTER_WIDTH];
                let prevx = editorOptions_1.MINIMAP_GUTTER_WIDTH;
                for (let i = 1; i < lineData.length + 1; i++) {
                    const charCode = lineData.charCodeAt(i - 1);
                    const dx = charCode === 9 /* CharCode.Tab */
                        ? tabSize * charWidth
                        : strings.isFullWidthCharacter(charCode)
                            ? 2 * charWidth
                            : charWidth;
                    const x = prevx + dx;
                    if (x >= canvasInnerWidth) {
                        // no need to keep on going, as we've hit the canvas width
                        lineIndexToXOffset[i] = canvasInnerWidth;
                        break;
                    }
                    lineIndexToXOffset[i] = x;
                    prevx = x;
                }
                lineOffsetMap.set(lineNumber, lineIndexToXOffset);
            }
            if (column - 1 < lineIndexToXOffset.length) {
                return lineIndexToXOffset[column - 1];
            }
            // goes over the canvas width
            return canvasInnerWidth;
        }
        renderDecoration(canvasContext, decorationColor, x, y, width, height) {
            canvasContext.fillStyle = decorationColor && decorationColor.toString() || '';
            canvasContext.fillRect(x, y, width, height);
        }
        _renderSectionHeaders(layout) {
            const minimapLineHeight = this._model.options.minimapLineHeight;
            const sectionHeaderFontSize = this._model.options.sectionHeaderFontSize;
            const backgroundFillHeight = sectionHeaderFontSize * 1.5;
            const { canvasInnerWidth } = this._model.options;
            const backgroundColor = this._model.options.backgroundColor;
            const backgroundFill = `rgb(${backgroundColor.r} ${backgroundColor.g} ${backgroundColor.b} / .7)`;
            const foregroundColor = this._model.options.sectionHeaderFontColor;
            const foregroundFill = `rgb(${foregroundColor.r} ${foregroundColor.g} ${foregroundColor.b})`;
            const separatorStroke = foregroundFill;
            const canvasContext = this._decorationsCanvas.domNode.getContext('2d');
            canvasContext.font = sectionHeaderFontSize + 'px ' + this._model.options.sectionHeaderFontFamily;
            canvasContext.strokeStyle = separatorStroke;
            canvasContext.lineWidth = 0.2;
            const decorations = this._model.getSectionHeaderDecorationsInViewport(layout.startLineNumber, layout.endLineNumber);
            decorations.sort((a, b) => a.range.startLineNumber - b.range.startLineNumber);
            const fitWidth = InnerMinimap._fitSectionHeader.bind(null, canvasContext, canvasInnerWidth - editorOptions_1.MINIMAP_GUTTER_WIDTH);
            for (const decoration of decorations) {
                const y = layout.getYForLineNumber(decoration.range.startLineNumber, minimapLineHeight) + sectionHeaderFontSize;
                const backgroundFillY = y - sectionHeaderFontSize;
                const separatorY = backgroundFillY + 2;
                const headerText = this._model.getSectionHeaderText(decoration, fitWidth);
                InnerMinimap._renderSectionLabel(canvasContext, headerText, decoration.options.minimap?.sectionHeaderStyle === 2 /* MinimapSectionHeaderStyle.Underlined */, backgroundFill, foregroundFill, canvasInnerWidth, backgroundFillY, backgroundFillHeight, y, separatorY);
            }
        }
        static _fitSectionHeader(target, maxWidth, headerText) {
            if (!headerText) {
                return headerText;
            }
            const ellipsis = '…';
            const width = target.measureText(headerText).width;
            const ellipsisWidth = target.measureText(ellipsis).width;
            if (width <= maxWidth || width <= ellipsisWidth) {
                return headerText;
            }
            const len = headerText.length;
            const averageCharWidth = width / headerText.length;
            const maxCharCount = Math.floor((maxWidth - ellipsisWidth) / averageCharWidth) - 1;
            // Find a halfway point that isn't after whitespace
            let halfCharCount = Math.ceil(maxCharCount / 2);
            while (halfCharCount > 0 && /\s/.test(headerText[halfCharCount - 1])) {
                --halfCharCount;
            }
            // Split with ellipsis
            return headerText.substring(0, halfCharCount)
                + ellipsis + headerText.substring(len - (maxCharCount - halfCharCount));
        }
        static _renderSectionLabel(target, headerText, hasSeparatorLine, backgroundFill, foregroundFill, minimapWidth, backgroundFillY, backgroundFillHeight, textY, separatorY) {
            if (headerText) {
                target.fillStyle = backgroundFill;
                target.fillRect(0, backgroundFillY, minimapWidth, backgroundFillHeight);
                target.fillStyle = foregroundFill;
                target.fillText(headerText, editorOptions_1.MINIMAP_GUTTER_WIDTH, textY);
            }
            if (hasSeparatorLine) {
                target.beginPath();
                target.moveTo(0, separatorY);
                target.lineTo(minimapWidth, separatorY);
                target.closePath();
                target.stroke();
            }
        }
        renderLines(layout) {
            const startLineNumber = layout.startLineNumber;
            const endLineNumber = layout.endLineNumber;
            const minimapLineHeight = this._model.options.minimapLineHeight;
            // Check if nothing changed w.r.t. lines from last frame
            if (this._lastRenderData && this._lastRenderData.linesEquals(layout)) {
                const _lastData = this._lastRenderData._get();
                // Nice!! Nothing changed from last frame
                return new RenderData(layout, _lastData.imageData, _lastData.lines);
            }
            // Oh well!! We need to repaint some lines...
            const imageData = this._getBuffer();
            if (!imageData) {
                // 0 width or 0 height canvas, nothing to do
                return null;
            }
            // Render untouched lines by using last rendered data.
            const [_dirtyY1, _dirtyY2, needed] = InnerMinimap._renderUntouchedLines(imageData, layout.topPaddingLineCount, startLineNumber, endLineNumber, minimapLineHeight, this._lastRenderData);
            // Fetch rendering info from view model for rest of lines that need rendering.
            const lineInfo = this._model.getMinimapLinesRenderingData(startLineNumber, endLineNumber, needed);
            const tabSize = this._model.getOptions().tabSize;
            const defaultBackground = this._model.options.defaultBackgroundColor;
            const background = this._model.options.backgroundColor;
            const foregroundAlpha = this._model.options.foregroundAlpha;
            const tokensColorTracker = this._model.tokensColorTracker;
            const useLighterFont = tokensColorTracker.backgroundIsLight();
            const renderMinimap = this._model.options.renderMinimap;
            const charRenderer = this._model.options.charRenderer();
            const fontScale = this._model.options.fontScale;
            const minimapCharWidth = this._model.options.minimapCharWidth;
            const baseCharHeight = (renderMinimap === 1 /* RenderMinimap.Text */ ? 2 /* Constants.BASE_CHAR_HEIGHT */ : 2 /* Constants.BASE_CHAR_HEIGHT */ + 1);
            const renderMinimapLineHeight = baseCharHeight * fontScale;
            const innerLinePadding = (minimapLineHeight > renderMinimapLineHeight ? Math.floor((minimapLineHeight - renderMinimapLineHeight) / 2) : 0);
            // Render the rest of lines
            const backgroundA = background.a / 255;
            const renderBackground = new rgba_1.RGBA8(Math.round((background.r - defaultBackground.r) * backgroundA + defaultBackground.r), Math.round((background.g - defaultBackground.g) * backgroundA + defaultBackground.g), Math.round((background.b - defaultBackground.b) * backgroundA + defaultBackground.b), 255);
            let dy = layout.topPaddingLineCount * minimapLineHeight;
            const renderedLines = [];
            for (let lineIndex = 0, lineCount = endLineNumber - startLineNumber + 1; lineIndex < lineCount; lineIndex++) {
                if (needed[lineIndex]) {
                    InnerMinimap._renderLine(imageData, renderBackground, background.a, useLighterFont, renderMinimap, minimapCharWidth, tokensColorTracker, foregroundAlpha, charRenderer, dy, innerLinePadding, tabSize, lineInfo[lineIndex], fontScale, minimapLineHeight);
                }
                renderedLines[lineIndex] = new MinimapLine(dy);
                dy += minimapLineHeight;
            }
            const dirtyY1 = (_dirtyY1 === -1 ? 0 : _dirtyY1);
            const dirtyY2 = (_dirtyY2 === -1 ? imageData.height : _dirtyY2);
            const dirtyHeight = dirtyY2 - dirtyY1;
            // Finally, paint to the canvas
            const ctx = this._canvas.domNode.getContext('2d');
            ctx.putImageData(imageData, 0, 0, 0, dirtyY1, imageData.width, dirtyHeight);
            // Save rendered data for reuse on next frame if possible
            return new RenderData(layout, imageData, renderedLines);
        }
        static _renderUntouchedLines(target, topPaddingLineCount, startLineNumber, endLineNumber, minimapLineHeight, lastRenderData) {
            const needed = [];
            if (!lastRenderData) {
                for (let i = 0, len = endLineNumber - startLineNumber + 1; i < len; i++) {
                    needed[i] = true;
                }
                return [-1, -1, needed];
            }
            const _lastData = lastRenderData._get();
            const lastTargetData = _lastData.imageData.data;
            const lastStartLineNumber = _lastData.rendLineNumberStart;
            const lastLines = _lastData.lines;
            const lastLinesLength = lastLines.length;
            const WIDTH = target.width;
            const targetData = target.data;
            const maxDestPixel = (endLineNumber - startLineNumber + 1) * minimapLineHeight * WIDTH * 4;
            let dirtyPixel1 = -1; // the pixel offset up to which all the data is equal to the prev frame
            let dirtyPixel2 = -1; // the pixel offset after which all the data is equal to the prev frame
            let copySourceStart = -1;
            let copySourceEnd = -1;
            let copyDestStart = -1;
            let copyDestEnd = -1;
            let dest_dy = topPaddingLineCount * minimapLineHeight;
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineIndex = lineNumber - startLineNumber;
                const lastLineIndex = lineNumber - lastStartLineNumber;
                const source_dy = (lastLineIndex >= 0 && lastLineIndex < lastLinesLength ? lastLines[lastLineIndex].dy : -1);
                if (source_dy === -1) {
                    needed[lineIndex] = true;
                    dest_dy += minimapLineHeight;
                    continue;
                }
                const sourceStart = source_dy * WIDTH * 4;
                const sourceEnd = (source_dy + minimapLineHeight) * WIDTH * 4;
                const destStart = dest_dy * WIDTH * 4;
                const destEnd = (dest_dy + minimapLineHeight) * WIDTH * 4;
                if (copySourceEnd === sourceStart && copyDestEnd === destStart) {
                    // contiguous zone => extend copy request
                    copySourceEnd = sourceEnd;
                    copyDestEnd = destEnd;
                }
                else {
                    if (copySourceStart !== -1) {
                        // flush existing copy request
                        targetData.set(lastTargetData.subarray(copySourceStart, copySourceEnd), copyDestStart);
                        if (dirtyPixel1 === -1 && copySourceStart === 0 && copySourceStart === copyDestStart) {
                            dirtyPixel1 = copySourceEnd;
                        }
                        if (dirtyPixel2 === -1 && copySourceEnd === maxDestPixel && copySourceStart === copyDestStart) {
                            dirtyPixel2 = copySourceStart;
                        }
                    }
                    copySourceStart = sourceStart;
                    copySourceEnd = sourceEnd;
                    copyDestStart = destStart;
                    copyDestEnd = destEnd;
                }
                needed[lineIndex] = false;
                dest_dy += minimapLineHeight;
            }
            if (copySourceStart !== -1) {
                // flush existing copy request
                targetData.set(lastTargetData.subarray(copySourceStart, copySourceEnd), copyDestStart);
                if (dirtyPixel1 === -1 && copySourceStart === 0 && copySourceStart === copyDestStart) {
                    dirtyPixel1 = copySourceEnd;
                }
                if (dirtyPixel2 === -1 && copySourceEnd === maxDestPixel && copySourceStart === copyDestStart) {
                    dirtyPixel2 = copySourceStart;
                }
            }
            const dirtyY1 = (dirtyPixel1 === -1 ? -1 : dirtyPixel1 / (WIDTH * 4));
            const dirtyY2 = (dirtyPixel2 === -1 ? -1 : dirtyPixel2 / (WIDTH * 4));
            return [dirtyY1, dirtyY2, needed];
        }
        static _renderLine(target, backgroundColor, backgroundAlpha, useLighterFont, renderMinimap, charWidth, colorTracker, foregroundAlpha, minimapCharRenderer, dy, innerLinePadding, tabSize, lineData, fontScale, minimapLineHeight) {
            const content = lineData.content;
            const tokens = lineData.tokens;
            const maxDx = target.width - charWidth;
            const force1pxHeight = (minimapLineHeight === 1);
            let dx = editorOptions_1.MINIMAP_GUTTER_WIDTH;
            let charIndex = 0;
            let tabsCharDelta = 0;
            for (let tokenIndex = 0, tokensLen = tokens.getCount(); tokenIndex < tokensLen; tokenIndex++) {
                const tokenEndIndex = tokens.getEndOffset(tokenIndex);
                const tokenColorId = tokens.getForeground(tokenIndex);
                const tokenColor = colorTracker.getColor(tokenColorId);
                for (; charIndex < tokenEndIndex; charIndex++) {
                    if (dx > maxDx) {
                        // hit edge of minimap
                        return;
                    }
                    const charCode = content.charCodeAt(charIndex);
                    if (charCode === 9 /* CharCode.Tab */) {
                        const insertSpacesCount = tabSize - (charIndex + tabsCharDelta) % tabSize;
                        tabsCharDelta += insertSpacesCount - 1;
                        // No need to render anything since tab is invisible
                        dx += insertSpacesCount * charWidth;
                    }
                    else if (charCode === 32 /* CharCode.Space */) {
                        // No need to render anything since space is invisible
                        dx += charWidth;
                    }
                    else {
                        // Render twice for a full width character
                        const count = strings.isFullWidthCharacter(charCode) ? 2 : 1;
                        for (let i = 0; i < count; i++) {
                            if (renderMinimap === 2 /* RenderMinimap.Blocks */) {
                                minimapCharRenderer.blockRenderChar(target, dx, dy + innerLinePadding, tokenColor, foregroundAlpha, backgroundColor, backgroundAlpha, force1pxHeight);
                            }
                            else { // RenderMinimap.Text
                                minimapCharRenderer.renderChar(target, dx, dy + innerLinePadding, charCode, tokenColor, foregroundAlpha, backgroundColor, backgroundAlpha, fontScale, useLighterFont, force1pxHeight);
                            }
                            dx += charWidth;
                            if (dx > maxDx) {
                                // hit edge of minimap
                                return;
                            }
                        }
                    }
                }
            }
        }
    }
    class ContiguousLineMap {
        constructor(startLineNumber, endLineNumber, defaultValue) {
            this._startLineNumber = startLineNumber;
            this._endLineNumber = endLineNumber;
            this._defaultValue = defaultValue;
            this._values = [];
            for (let i = 0, count = this._endLineNumber - this._startLineNumber + 1; i < count; i++) {
                this._values[i] = defaultValue;
            }
        }
        has(lineNumber) {
            return (this.get(lineNumber) !== this._defaultValue);
        }
        set(lineNumber, value) {
            if (lineNumber < this._startLineNumber || lineNumber > this._endLineNumber) {
                return;
            }
            this._values[lineNumber - this._startLineNumber] = value;
        }
        get(lineNumber) {
            if (lineNumber < this._startLineNumber || lineNumber > this._endLineNumber) {
                return this._defaultValue;
            }
            return this._values[lineNumber - this._startLineNumber];
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWluaW1hcC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlld1BhcnRzL21pbmltYXAvbWluaW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFxQ2hHOztPQUVHO0lBQ0gsTUFBTSwyQkFBMkIsR0FBRyxHQUFHLENBQUM7SUFFeEMsTUFBTSx1QkFBdUIsR0FBRyxDQUFDLENBQUM7SUFFbEMsTUFBTSxjQUFjO1FBMkRuQixZQUFZLGFBQW1DLEVBQUUsS0FBa0IsRUFBRSxrQkFBNkM7WUFDakgsTUFBTSxPQUFPLEdBQUcsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUN0QyxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQztZQUN4RCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQztZQUN4RCxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLGdDQUF1QixDQUFDO1lBQ3BELE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLCtCQUFzQixDQUFDO1lBRXRELElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQztZQUNqRCxJQUFJLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUM7WUFDN0IsSUFBSSxDQUFDLDJCQUEyQixHQUFHLGFBQWEsQ0FBQywyQkFBMkIsQ0FBQztZQUM3RSxJQUFJLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLEdBQUcsNkNBQW1DLENBQUM7WUFDM0UsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRywrQkFBc0IsQ0FBQyxHQUFHLENBQUM7WUFDeEQsSUFBSSxDQUFDLGFBQWEsR0FB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