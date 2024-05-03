/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/base/common/async", "vs/base/common/platform", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/view/renderingContext", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lines/domReadingContext", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/css!./viewLines"], function (require, exports, mouseCursor_1, async_1, platform, domFontInfo_1, renderingContext_1, viewLayer_1, viewPart_1, domReadingContext_1, viewLine_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLines = void 0;
    class LastRenderedData {
        constructor() {
            this._currentVisibleRange = new range_1.Range(1, 1, 1, 1);
        }
        getCurrentVisibleRange() {
            return this._currentVisibleRange;
        }
        setCurrentVisibleRange(currentVisibleRange) {
            this._currentVisibleRange = currentVisibleRange;
        }
    }
    class HorizontalRevealRangeRequest {
        constructor(minimalReveal, lineNumber, startColumn, endColumn, startScrollTop, stopScrollTop, scrollType) {
            this.minimalReveal = minimalReveal;
            this.lineNumber = lineNumber;
            this.startColumn = startColumn;
            this.endColumn = endColumn;
            this.startScrollTop = startScrollTop;
            this.stopScrollTop = stopScrollTop;
            this.scrollType = scrollType;
            this.type = 'range';
            this.minLineNumber = lineNumber;
            this.maxLineNumber = lineNumber;
        }
    }
    class HorizontalRevealSelectionsRequest {
        constructor(minimalReveal, selections, startScrollTop, stopScrollTop, scrollType) {
            this.minimalReveal = minimalReveal;
            this.selections = selections;
            this.startScrollTop = startScrollTop;
            this.stopScrollTop = stopScrollTop;
            this.scrollType = scrollType;
            this.type = 'selections';
            let minLineNumber = selections[0].startLineNumber;
            let maxLineNumber = selections[0].endLineNumber;
            for (let i = 1, len = selections.length; i < len; i++) {
                const selection = selections[i];
                minLineNumber = Math.min(minLineNumber, selection.startLineNumber);
                maxLineNumber = Math.max(maxLineNumber, selection.endLineNumber);
            }
            this.minLineNumber = minLineNumber;
            this.maxLineNumber = maxLineNumber;
        }
    }
    class ViewLines extends viewPart_1.ViewPart {
        /**
         * Adds this amount of pixels to the right of lines (no-one wants to type near the edge of the viewport)
         */
        static { this.HORIZONTAL_EXTRA_PX = 30; }
        constructor(context, linesContent) {
            super(context);
            this._linesContent = linesContent;
            this._textRangeRestingSpot = document.createElement('div');
            this._visibleLines = new viewLayer_1.VisibleLinesCollection(this);
            this.domNode = this._visibleLines.domNode;
            const conf = this._context.configuration;
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._isViewportWrapping = wrappingInfo.isViewportWrapping;
            this._revealHorizontalRightPadding = options.get(100 /* EditorOption.revealHorizontalRightPadding */);
            this._cursorSurroundingLines = options.get(29 /* EditorOption.cursorSurroundingLines */);
            this._cursorSurroundingLinesStyle = options.get(30 /* EditorOption.cursorSurroundingLinesStyle */);
            this._canUseLayerHinting = !options.get(32 /* EditorOption.disableLayerHinting */);
            this._viewLineOptions = new viewLine_1.ViewLineOptions(conf, this._context.theme.type);
            viewPart_1.PartFingerprints.write(this.domNode, 8 /* PartFingerprint.ViewLines */);
            this.domNode.setClassName(`view-lines ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
            (0, domFontInfo_1.applyFontInfo)(this.domNode, fontInfo);
            // --- width & height
            this._maxLineWidth = 0;
            this._asyncUpdateLineWidths = new async_1.RunOnceScheduler(() => {
                this._updateLineWidthsSlow();
            }, 200);
            this._asyncCheckMonospaceFontAssumptions = new async_1.RunOnceScheduler(() => {
                this._checkMonospaceFontAssumptions();
            }, 2000);
            this._lastRenderedData = new LastRenderedData();
            this._horizontalRevealRequest = null;
            // sticky scroll widget
            this._stickyScrollEnabled = options.get(115 /* EditorOption.stickyScroll */).enabled;
            this._maxNumberStickyLines = options.get(115 /* EditorOption.stickyScroll */).maxLineCount;
        }
        dispose() {
            this._asyncUpdateLineWidths.dispose();
            this._asyncCheckMonospaceFontAssumptions.dispose();
            super.dispose();
        }
        getDomNode() {
            return this.domNode;
        }
        // ---- begin IVisibleLinesHost
        createVisibleLine() {
            return new viewLine_1.ViewLine(this._viewLineOptions);
        }
        // ---- end IVisibleLinesHost
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            this._visibleLines.onConfigurationChanged(e);
            if (e.hasChanged(146 /* EditorOption.wrappingInfo */)) {
                this._maxLineWidth = 0;
            }
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._isViewportWrapping = wrappingInfo.isViewportWrapping;
            this._revealHorizontalRightPadding = options.get(100 /* EditorOption.revealHorizontalRightPadding */);
            this._cursorSurroundingLines = options.get(29 /* EditorOption.cursorSurroundingLines */);
            this._cursorSurroundingLinesStyle = options.get(30 /* EditorOption.cursorSurroundingLinesStyle */);
            this._canUseLayerHinting = !options.get(32 /* EditorOption.disableLayerHinting */);
            // sticky scroll
            this._stickyScrollEnabled = options.get(115 /* EditorOption.stickyScroll */).enabled;
            this._maxNumberStickyLines = options.get(115 /* EditorOption.stickyScroll */).maxLineCount;
            (0, domFontInfo_1.applyFontInfo)(this.domNode, fontInfo);
            this._onOptionsMaybeChanged();
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                this._maxLineWidth = 0;
            }
            return true;
        }
        _onOptionsMaybeChanged() {
            const conf = this._context.configuration;
            const newViewLineOptions = new viewLine_1.ViewLineOptions(conf, this._context.theme.type);
            if (!this._viewLineOptions.equals(newViewLineOptions)) {
                this._viewLineOptions = newViewLineOptions;
                const startLineNumber = this._visibleLines.getStartLineNumber();
                const endLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                    const line = this._visibleLines.getVisibleLine(lineNumber);
                    line.onOptionsChanged(this._viewLineOptions);
                }
                return true;
            }
            return false;
        }
        onCursorStateChanged(e) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            let r = false;
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                r = this._visibleLines.getVisibleLine(lineNumber).onSelectionChanged() || r;
            }
            return r;
        }
        onDecorationsChanged(e) {
            if (true /*e.inlineDecorationsChanged*/) {
                const rendStartLineNumber = this._visibleLines.getStartLineNumber();
                const rendEndLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    this._visibleLines.getVisibleLine(lineNumber).onDecorationsChanged();
                }
            }
            return true;
        }
        onFlushed(e) {
            const shouldRender = this._visibleLines.onFlushed(e);
            this._maxLineWidth = 0;
            return shouldRender;
        }
        onLinesChanged(e) {
            return this._visibleLines.onLinesChanged(e);
        }
        onLinesDeleted(e) {
            return this._visibleLines.onLinesDeleted(e);
        }
        onLinesInserted(e) {
            return this._visibleLines.onLinesInserted(e);
        }
        onRevealRangeRequest(e) {
            // Using the future viewport here in order to handle multiple
            // incoming reveal range requests that might all desire to be animated
            const desiredScrollTop = this._computeScrollTopToRevealRange(this._context.viewLayout.getFutureViewport(), e.source, e.minimalReveal, e.range, e.selections, e.verticalType);
            if (desiredScrollTop === -1) {
                // marker to abort the reveal range request
                return false;
            }
            // validate the new desired scroll top
            let newScrollPosition = this._context.viewLayout.validateScrollPosition({ scrollTop: desiredScrollTop });
            if (e.revealHorizontal) {
                if (e.range && e.range.startLineNumber !== e.range.endLineNumber) {
                    // Two or more lines? => scroll to base (That's how you see most of the two lines)
                    newScrollPosition = {
                        scrollTop: newScrollPosition.scrollTop,
                        scrollLeft: 0
                    };
                }
                else if (e.range) {
                    // We don't necessarily know the horizontal offset of this range since the line might not be in the view...
                    this._horizontalRevealRequest = new HorizontalRevealRangeRequest(e.minimalReveal, e.range.startLineNumber, e.range.startColumn, e.range.endColumn, this._context.viewLayout.getCurrentScrollTop(), newScrollPosition.scrollTop, e.scrollType);
                }
                else if (e.selections && e.selections.length > 0) {
                    this._horizontalRevealRequest = new HorizontalRevealSelectionsRequest(e.minimalReveal, e.selections, this._context.viewLayout.getCurrentScrollTop(), newScrollPosition.scrollTop, e.scrollType);
                }
            }
            else {
                this._horizontalRevealRequest = null;
            }
            const scrollTopDelta = Math.abs(this._context.viewLayout.getCurrentScrollTop() - newScrollPosition.scrollTop);
            const scrollType = (scrollTopDelta <= this._lineHeight ? 1 /* ScrollType.Immediate */ : e.scrollType);
            this._context.viewModel.viewLayout.setScrollPosition(newScrollPosition, scrollType);
            return true;
        }
        onScrollChanged(e) {
            if (this._horizontalRevealRequest && e.scrollLeftChanged) {
                // cancel any outstanding horizontal reveal request if someone else scrolls horizontally.
                this._horizontalRevealRequest = null;
            }
            if (this._horizontalRevealRequest && e.scrollTopChanged) {
                const min = Math.min(this._horizontalRevealRequest.startScrollTop, this._horizontalRevealRequest.stopScrollTop);
                const max = Math.max(this._horizontalRevealRequest.startScrollTop, this._horizontalRevealRequest.stopScrollTop);
                if (e.scrollTop < min || e.scrollTop > max) {
                    // cancel any outstanding horizontal reveal request if someone else scrolls vertically.
                    this._horizontalRevealRequest = null;
                }
            }
            this.domNode.setWidth(e.scrollWidth);
            return this._visibleLines.onScrollChanged(e) || true;
        }
        onTokensChanged(e) {
            return this._visibleLines.onTokensChanged(e);
        }
        onZonesChanged(e) {
            this._context.viewModel.viewLayout.setMaxLineWidth(this._maxLineWidth);
            return this._visibleLines.onZonesChanged(e);
        }
        onThemeChanged(e) {
            return this._onOptionsMaybeChanged();
        }
        // ---- end view event handlers
        // ----------- HELPERS FOR OTHERS
        getPositionFromDOMInfo(spanNode, offset) {
            const viewLineDomNode = this._getViewLineDomNode(spanNode);
            if (viewLineDomNode === null) {
                // Couldn't find view line node
                return null;
            }
            const lineNumber = this._getLineNumberFor(viewLineDomNode);
            if (lineNumber === -1) {
                // Couldn't find view line node
                return null;
            }
            if (lineNumber < 1 || lineNumber > this._context.viewModel.getLineCount()) {
                // lineNumber is outside range
                return null;
            }
            if (this._context.viewModel.getLineMaxColumn(lineNumber) === 1) {
                // Line is empty
                return new position_1.Position(lineNumber, 1);
            }
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                // Couldn't find line
                return null;
            }
            let column = this._visibleLines.getVisibleLine(lineNumber).getColumnOfNodeOffset(spanNode, offset);
            const minColumn = this._context.viewModel.getLineMinColumn(lineNumber);
            if (column < minColumn) {
                column = minColumn;
            }
            return new position_1.Position(lineNumber, column);
        }
        _getViewLineDomNode(node) {
            while (node && node.nodeType === 1) {
                if (node.className === viewLine_1.ViewLine.CLASS_NAME) {
                    return node;
                }
                node = node.parentElement;
            }
            return null;
        }
        /**
         * @returns the line number of this view line dom node.
         */
        _getLineNumberFor(domNode) {
            const startLineNumber = this._visibleLines.getStartLineNumber();
            const endLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const line = this._visibleLines.getVisibleLine(lineNumber);
                if (domNode === line.getDomNode()) {
                    return lineNumber;
                }
            }
            return -1;
        }
        getLineWidth(lineNumber) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                // Couldn't find line
                return -1;
            }
            const context = new domReadingContext_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            const result = this._visibleLines.getVisibleLine(lineNumber).getWidth(context);
            this._updateLineWidthsSlowIfDomDidLayout(context);
            return result;
        }
        linesVisibleRangesForRange(_range, includeNewLines) {
            if (this.shouldRender()) {
                // Cannot read from the DOM because it is dirty
                // i.e. the model & the dom are out of sync, so I'd be reading something stale
                return null;
            }
            const originalEndLineNumber = _range.endLineNumber;
            const range = range_1.Range.intersectRanges(_range, this._lastRenderedData.getCurrentVisibleRange());
            if (!range) {
                return null;
            }
            const visibleRanges = [];
            let visibleRangesLen = 0;
            const domReadingContext = new domReadingContext_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            let nextLineModelLineNumber = 0;
            if (includeNewLines) {
                nextLineModelLineNumber = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(range.startLineNumber, 1)).lineNumber;
            }
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = range.startLineNumber; lineNumber <= range.endLineNumber; lineNumber++) {
                if (lineNumber < rendStartLineNumber || lineNumber > rendEndLineNumber) {
                    continue;
                }
                const startColumn = lineNumber === range.startLineNumber ? range.startColumn : 1;
                const continuesInNextLine = lineNumber !== range.endLineNumber;
                const endColumn = continuesInNextLine ? this._context.viewModel.getLineMaxColumn(lineNumber) : range.endColumn;
                const visibleRangesForLine = this._visibleLines.getVisibleLine(lineNumber).getVisibleRangesForRange(lineNumber, startColumn, endColumn, domReadingContext);
                if (!visibleRangesForLine) {
                    continue;
                }
                if (includeNewLines && lineNumber < originalEndLineNumber) {
                    const currentLineModelLineNumber = nextLineModelLineNumber;
                    nextLineModelLineNumber = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(lineNumber + 1, 1)).lineNumber;
                    if (currentLineModelLineNumber !== nextLineModelLineNumber) {
                        visibleRangesForLine.ranges[visibleRangesForLine.ranges.length - 1].width += this._typicalHalfwidthCharacterWidth;
                    }
                }
                visibleRanges[visibleRangesLen++] = new renderingContext_1.LineVisibleRanges(visibleRangesForLine.outsideRenderedLine, lineNumber, renderingContext_1.HorizontalRange.from(visibleRangesForLine.ranges), continuesInNextLine);
            }
            this._updateLineWidthsSlowIfDomDidLayout(domReadingContext);
            if (visibleRangesLen === 0) {
                return null;
            }
            return visibleRanges;
        }
        _visibleRangesForLineRange(lineNumber, startColumn, endColumn) {
            if (this.shouldRender()) {
                // Cannot read from the DOM because it is dirty
                // i.e. the model & the dom are out of sync, so I'd be reading something stale
                return null;
            }
            if (lineNumber < this._visibleLines.getStartLineNumber() || lineNumber > this._visibleLines.getEndLineNumber()) {
                return null;
            }
            const domReadingContext = new domReadingContext_1.DomReadingContext(this.domNode.domNode, this._textRangeRestingSpot);
            const result = this._visibleLines.getVisibleLine(lineNumber).getVisibleRangesForRange(lineNumber, startColumn, endColumn, domReadingContext);
            this._updateLineWidthsSlowIfDomDidLayout(domReadingContext);
            return result;
        }
        visibleRangeForPosition(position) {
            const visibleRanges = this._visibleRangesForLineRange(position.lineNumber, position.column, position.column);
            if (!visibleRanges) {
                return null;
            }
            return new renderingContext_1.HorizontalPosition(visibleRanges.outsideRenderedLine, visibleRanges.ranges[0].left);
        }
        // --- implementation
        updateLineWidths() {
            this._updateLineWidths(false);
        }
        /**
         * Updates the max line width if it is fast to compute.
         * Returns true if all lines were taken into account.
         * Returns false if some lines need to be reevaluated (in a slow fashion).
         */
        _updateLineWidthsFast() {
            return this._updateLineWidths(true);
        }
        _updateLineWidthsSlow() {
            this._updateLineWidths(false);
        }
        /**
         * Update the line widths using DOM layout information after someone else
         * has caused a synchronous layout.
         */
        _updateLineWidthsSlowIfDomDidLayout(domReadingContext) {
            if (!domReadingContext.didDomLayout) {
                // only proceed if we just did a layout
                return;
            }
            if (this._asyncUpdateLineWidths.isScheduled()) {
                // reading widths is not scheduled => widths are up-to-date
                return;
            }
            this._asyncUpdateLineWidths.cancel();
            this._updateLineWidthsSlow();
        }
        _updateLineWidths(fast) {
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            let localMaxLineWidth = 1;
            let allWidthsComputed = true;
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                if (fast && !visibleLine.getWidthIsFast()) {
                    // Cannot compute width in a fast way for this line
                    allWidthsComputed = false;
                    continue;
                }
                localMaxLineWidth = Math.max(localMaxLineWidth, visibleLine.getWidth(null));
            }
            if (allWidthsComputed && rendStartLineNumber === 1 && rendEndLineNumber === this._context.viewModel.getLineCount()) {
                // we know the max line width for all the lines
                this._maxLineWidth = 0;
            }
            this._ensureMaxLineWidth(localMaxLineWidth);
            return allWidthsComputed;
        }
        _checkMonospaceFontAssumptions() {
            // Problems with monospace assumptions are more apparent for longer lines,
            // as small rounding errors start to sum up, so we will select the longest
            // line for a closer inspection
            let longestLineNumber = -1;
            let longestWidth = -1;
            const rendStartLineNumber = this._visibleLines.getStartLineNumber();
            const rendEndLineNumber = this._visibleLines.getEndLineNumber();
            for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                if (visibleLine.needsMonospaceFontCheck()) {
                    const lineWidth = visibleLine.getWidth(null);
                    if (lineWidth > longestWidth) {
                        longestWidth = lineWidth;
                        longestLineNumber = lineNumber;
                    }
                }
            }
            if (longestLineNumber === -1) {
                return;
            }
            if (!this._visibleLines.getVisibleLine(longestLineNumber).monospaceAssumptionsAreValid()) {
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                    visibleLine.onMonospaceAssumptionsInvalidated();
                }
            }
        }
        prepareRender() {
            throw new Error('Not supported');
        }
        render() {
            throw new Error('Not supported');
        }
        renderText(viewportData) {
            // (1) render lines - ensures lines are in the DOM
            this._visibleLines.renderLines(viewportData);
            this._lastRenderedData.setCurrentVisibleRange(viewportData.visibleRange);
            this.domNode.setWidth(this._context.viewLayout.getScrollWidth());
            this.domNode.setHeight(Math.min(this._context.viewLayout.getScrollHeight(), 1000000));
            // (2) compute horizontal scroll position:
            //  - this must happen after the lines are in the DOM since it might need a line that rendered just now
            //  - it might change `scrollWidth` and `scrollLeft`
            if (this._horizontalRevealRequest) {
                const horizontalRevealRequest = this._horizontalRevealRequest;
                // Check that we have the line that contains the horizontal range in the viewport
                if (viewportData.startLineNumber <= horizontalRevealRequest.minLineNumber && horizontalRevealRequest.maxLineNumber <= viewportData.endLineNumber) {
                    this._horizontalRevealRequest = null;
                    // allow `visibleRangesForRange2` to work
                    this.onDidRender();
                    // compute new scroll position
                    const newScrollLeft = this._computeScrollLeftToReveal(horizontalRevealRequest);
                    if (newScrollLeft) {
                        if (!this._isViewportWrapping) {
                            // ensure `scrollWidth` is large enough
                            this._ensureMaxLineWidth(newScrollLeft.maxHorizontalOffset);
                        }
                        // set `scrollLeft`
                        this._context.viewModel.viewLayout.setScrollPosition({
                            scrollLeft: newScrollLeft.scrollLeft
                        }, horizontalRevealRequest.scrollType);
                    }
                }
            }
            // Update max line width (not so important, it is just so the horizontal scrollbar doesn't get too small)
            if (!this._updateLineWidthsFast()) {
                // Computing the width of some lines would be slow => delay it
                this._asyncUpdateLineWidths.schedule();
            }
            else {
                this._asyncUpdateLineWidths.cancel();
            }
            if (platform.isLinux && !this._asyncCheckMonospaceFontAssumptions.isScheduled()) {
                const rendStartLineNumber = this._visibleLines.getStartLineNumber();
                const rendEndLineNumber = this._visibleLines.getEndLineNumber();
                for (let lineNumber = rendStartLineNumber; lineNumber <= rendEndLineNumber; lineNumber++) {
                    const visibleLine = this._visibleLines.getVisibleLine(lineNumber);
                    if (visibleLine.needsMonospaceFontCheck()) {
                        this._asyncCheckMonospaceFontAssumptions.schedule();
                        break;
                    }
                }
            }
            // (3) handle scrolling
            this._linesContent.setLayerHinting(this._canUseLayerHinting);
            this._linesContent.setContain('strict');
            const adjustedScrollTop = this._context.viewLayout.getCurrentScrollTop() - viewportData.bigNumbersDelta;
            this._linesContent.setTop(-adjustedScrollTop);
            this._linesContent.setLeft(-this._context.viewLayout.getCurrentScrollLeft());
        }
        // --- width
        _ensureMaxLineWidth(lineWidth) {
            const iLineWidth = Math.ceil(lineWidth);
            if (this._maxLineWidth < iLineWidth) {
                this._maxLineWidth = iLineWidth;
                this._context.viewModel.viewLayout.setMaxLineWidth(this._maxLineWidth);
            }
        }
        _computeScrollTopToRevealRange(viewport, source, minimalReveal, range, selections, verticalType) {
            const viewportStartY = viewport.top;
            const viewportHeight = viewport.height;
            const viewportEndY = viewportStartY + viewportHeight;
            let boxIsSingleRange;
            let boxStartY;
            let boxEndY;
            if (selections && selections.length > 0) {
                let minLineNumber = selections[0].startLineNumber;
                let maxLineNumber = selections[0].endLineNumber;
                for (let i = 1, len = selections.length; i < len; i++) {
                    const selection = selections[i];
                    minLineNumber = Math.min(minLineNumber, selection.startLineNumber);
                    maxLineNumber = Math.max(maxLineNumber, selection.endLineNumber);
                }
                boxIsSingleRange = false;
                boxStartY = this._context.viewLayout.getVerticalOffsetForLineNumber(minLineNumber);
                boxEndY = this._context.viewLayout.getVerticalOffsetForLineNumber(maxLineNumber) + this._lineHeight;
            }
            else if (range) {
                boxIsSingleRange = true;
                boxStartY = this._context.viewLayout.getVerticalOffsetForLineNumber(range.startLineNumber);
                boxEndY = this._context.viewLayout.getVerticalOffsetForLineNumber(range.endLineNumber) + this._lineHeight;
            }
            else {
                return -1;
            }
            const shouldIgnoreScrollOff = (source === 'mouse' || minimalReveal) && this._cursorSurroundingLinesStyle === 'default';
            let paddingTop = 0;
            let paddingBottom = 0;
            if (!shouldIgnoreScrollOff) {
                const context = Math.min((viewportHeight / this._lineHeight) / 2, this._cursorSurroundingLines);
                if (this._stickyScrollEnabled) {
                    paddingTop = Math.max(context, this._maxNumberStickyLines) * this._lineHeight;
                }
                else {
                    paddingTop = context * this._lineHeight;
                }
                paddingBottom = Math.max(0, (context - 1)) * this._lineHeight;
            }
            else {
                if (!minimalReveal) {
                    // Reveal one more line above (this case is hit when dragging)
                    paddingTop = this._lineHeight;
                }
            }
            if (!minimalReveal) {
                if (verticalType === 0 /* viewEvents.VerticalRevealType.Simple */ || verticalType === 4 /* viewEvents.VerticalRevealType.Bottom */) {
                    // Reveal one line more when the last line would be covered by the scrollbar - arrow down case or revealing a line explicitly at bottom
                    paddingBottom += this._lineHeight;
                }
            }
            boxStartY -= paddingTop;
            boxEndY += paddingBottom;
            let newScrollTop;
            if (boxEndY - boxStartY > viewportHeight) {
                // the box is larger than the viewport ... scroll to its top
                if (!boxIsSingleRange) {
                    // do not reveal multiple cursors if there are more than fit the viewport
                    return -1;
                }
                newScrollTop = boxStartY;
            }
            else if (verticalType === 5 /* viewEvents.VerticalRevealType.NearTop */ || verticalType === 6 /* viewEvents.VerticalRevealType.NearTopIfOutsideViewport */) {
                if (verticalType === 6 /* viewEvents.VerticalRevealType.NearTopIfOutsideViewport */ && viewportStartY <= boxStartY && boxEndY <= viewportEndY) {
                    // Box is already in the viewport... do nothing
                    newScrollTop = viewportStartY;
                }
                else {
                    // We want a gap that is 20% of the viewport, but with a minimum of 5 lines
                    const desiredGapAbove = Math.max(5 * this._lineHeight, viewportHeight * 0.2);
                    // Try to scroll just above the box with the desired gap
                    const desiredScrollTop = boxStartY - desiredGapAbove;
                    // But ensure that the box is not pushed out of viewport
                    const minScrollTop = boxEndY - viewportHeight;
                    newScrollTop = Math.max(minScrollTop, desiredScrollTop);
                }
            }
            else if (verticalType === 1 /* viewEvents.VerticalRevealType.Center */ || verticalType === 2 /* viewEvents.VerticalRevealType.CenterIfOutsideViewport */) {
                if (verticalType === 2 /* viewEvents.VerticalRevealType.CenterIfOutsideViewport */ && viewportStartY <= boxStartY && boxEndY <= viewportEndY) {
                    // Box is already in the viewport... do nothing
                    newScrollTop = viewportStartY;
                }
                else {
                    // Box is outside the viewport... center it
                    const boxMiddleY = (boxStartY + boxEndY) / 2;
                    newScrollTop = Math.max(0, boxMiddleY - viewportHeight / 2);
                }
            }
            else {
                newScrollTop = this._computeMinimumScrolling(viewportStartY, viewportEndY, boxStartY, boxEndY, verticalType === 3 /* viewEvents.VerticalRevealType.Top */, verticalType === 4 /* viewEvents.VerticalRevealType.Bottom */);
            }
            return newScrollTop;
        }
        _computeScrollLeftToReveal(horizontalRevealRequest) {
            const viewport = this._context.viewLayout.getCurrentViewport();
            const layoutInfo = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */);
            const viewportStartX = viewport.left;
            const viewportEndX = viewportStartX + viewport.width - layoutInfo.verticalScrollbarWidth;
            let boxStartX = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
            let boxEndX = 0;
            if (horizontalRevealRequest.type === 'range') {
                const visibleRanges = this._visibleRangesForLineRange(horizontalRevealRequest.lineNumber, horizontalRevealRequest.startColumn, horizontalRevealRequest.endColumn);
                if (!visibleRanges) {
                    return null;
                }
                for (const visibleRange of visibleRanges.ranges) {
                    boxStartX = Math.min(boxStartX, Math.round(visibleRange.left));
                    boxEndX = Math.max(boxEndX, Math.round(visibleRange.left + visibleRange.width));
                }
            }
            else {
                for (const selection of horizontalRevealRequest.selections) {
                    if (selection.startLineNumber !== selection.endLineNumber) {
                        return null;
                    }
                    const visibleRanges = this._visibleRangesForLineRange(selection.startLineNumber, selection.startColumn, selection.endColumn);
                    if (!visibleRanges) {
                        return null;
                    }
                    for (const visibleRange of visibleRanges.ranges) {
                        boxStartX = Math.min(boxStartX, Math.round(visibleRange.left));
                        boxEndX = Math.max(boxEndX, Math.round(visibleRange.left + visibleRange.width));
                    }
                }
            }
            if (!horizontalRevealRequest.minimalReveal) {
                boxStartX = Math.max(0, boxStartX - ViewLines.HORIZONTAL_EXTRA_PX);
                boxEndX += this._revealHorizontalRightPadding;
            }
            if (horizontalRevealRequest.type === 'selections' && boxEndX - boxStartX > viewport.width) {
                return null;
            }
            const newScrollLeft = this._computeMinimumScrolling(viewportStartX, viewportEndX, boxStartX, boxEndX);
            return {
                scrollLeft: newScrollLeft,
                maxHorizontalOffset: boxEndX
            };
        }
        _computeMinimumScrolling(viewportStart, viewportEnd, boxStart, boxEnd, revealAtStart, revealAtEnd) {
            viewportStart = viewportStart | 0;
            viewportEnd = viewportEnd | 0;
            boxStart = boxStart | 0;
            boxEnd = boxEnd | 0;
            revealAtStart = !!revealAtStart;
            revealAtEnd = !!revealAtEnd;
            const viewportLength = viewportEnd - viewportStart;
            const boxLength = boxEnd - boxStart;
            if (boxLength < viewportLength) {
                // The box would fit in the viewport
                if (revealAtStart) {
                    return boxStart;
                }
                if (revealAtEnd) {
                    return Math.max(0, boxEnd - viewportLength);
                }
                if (boxStart < viewportStart) {
                    // The box is above the viewport
                    return boxStart;
                }
                else if (boxEnd > viewportEnd) {
                    // The box is below the viewport
                    return Math.max(0, boxEnd - viewportLength);
                }
            }
            else {
                // The box would not fit in the viewport
                // Reveal the beginning of the box
                return boxStart;
            }
            return viewportStart;
        }
    }
    exports.ViewLines = ViewLines;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvbGluZXMvdmlld0xpbmVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQXdCaEcsTUFBTSxnQkFBZ0I7UUFJckI7WUFDQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxhQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVNLHNCQUFzQjtZQUM1QixPQUFPLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUNsQyxDQUFDO1FBRU0sc0JBQXNCLENBQUMsbUJBQTBCO1lBQ3ZELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxtQkFBbUIsQ0FBQztRQUNqRCxDQUFDO0tBQ0Q7SUFFRCxNQUFNLDRCQUE0QjtRQUtqQyxZQUNpQixhQUFzQixFQUN0QixVQUFrQixFQUNsQixXQUFtQixFQUNuQixTQUFpQixFQUNqQixjQUFzQixFQUN0QixhQUFxQixFQUNyQixVQUFzQjtZQU50QixrQkFBYSxHQUFiLGFBQWEsQ0FBUztZQUN0QixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsbUJBQWMsR0FBZCxjQUFjLENBQVE7WUFDdEIsa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDckIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtZQVh2QixTQUFJLEdBQUcsT0FBTyxDQUFDO1lBYTlCLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDO1lBQ2hDLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDO1FBQ2pDLENBQUM7S0FDRDtJQUVELE1BQU0saUNBQWlDO1FBS3RDLFlB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