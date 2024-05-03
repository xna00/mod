/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/scrollable", "vs/editor/common/viewLayout/linesLayout", "vs/editor/common/viewModel", "vs/editor/common/viewModelEventDispatcher"], function (require, exports, event_1, lifecycle_1, scrollable_1, linesLayout_1, viewModel_1, viewModelEventDispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLayout = void 0;
    const SMOOTH_SCROLLING_TIME = 125;
    class EditorScrollDimensions {
        constructor(width, contentWidth, height, contentHeight) {
            width = width | 0;
            contentWidth = contentWidth | 0;
            height = height | 0;
            contentHeight = contentHeight | 0;
            if (width < 0) {
                width = 0;
            }
            if (contentWidth < 0) {
                contentWidth = 0;
            }
            if (height < 0) {
                height = 0;
            }
            if (contentHeight < 0) {
                contentHeight = 0;
            }
            this.width = width;
            this.contentWidth = contentWidth;
            this.scrollWidth = Math.max(width, contentWidth);
            this.height = height;
            this.contentHeight = contentHeight;
            this.scrollHeight = Math.max(height, contentHeight);
        }
        equals(other) {
            return (this.width === other.width
                && this.contentWidth === other.contentWidth
                && this.height === other.height
                && this.contentHeight === other.contentHeight);
        }
    }
    class EditorScrollable extends lifecycle_1.Disposable {
        constructor(smoothScrollDuration, scheduleAtNextAnimationFrame) {
            super();
            this._onDidContentSizeChange = this._register(new event_1.Emitter());
            this.onDidContentSizeChange = this._onDidContentSizeChange.event;
            this._dimensions = new EditorScrollDimensions(0, 0, 0, 0);
            this._scrollable = this._register(new scrollable_1.Scrollable({
                forceIntegerValues: true,
                smoothScrollDuration,
                scheduleAtNextAnimationFrame
            }));
            this.onDidScroll = this._scrollable.onScroll;
        }
        getScrollable() {
            return this._scrollable;
        }
        setSmoothScrollDuration(smoothScrollDuration) {
            this._scrollable.setSmoothScrollDuration(smoothScrollDuration);
        }
        validateScrollPosition(scrollPosition) {
            return this._scrollable.validateScrollPosition(scrollPosition);
        }
        getScrollDimensions() {
            return this._dimensions;
        }
        setScrollDimensions(dimensions) {
            if (this._dimensions.equals(dimensions)) {
                return;
            }
            const oldDimensions = this._dimensions;
            this._dimensions = dimensions;
            this._scrollable.setScrollDimensions({
                width: dimensions.width,
                scrollWidth: dimensions.scrollWidth,
                height: dimensions.height,
                scrollHeight: dimensions.scrollHeight
            }, true);
            const contentWidthChanged = (oldDimensions.contentWidth !== dimensions.contentWidth);
            const contentHeightChanged = (oldDimensions.contentHeight !== dimensions.contentHeight);
            if (contentWidthChanged || contentHeightChanged) {
                this._onDidContentSizeChange.fire(new viewModelEventDispatcher_1.ContentSizeChangedEvent(oldDimensions.contentWidth, oldDimensions.contentHeight, dimensions.contentWidth, dimensions.contentHeight));
            }
        }
        getFutureScrollPosition() {
            return this._scrollable.getFutureScrollPosition();
        }
        getCurrentScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
        setScrollPositionNow(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        setScrollPositionSmooth(update) {
            this._scrollable.setScrollPositionSmooth(update);
        }
        hasPendingScrollAnimation() {
            return this._scrollable.hasPendingScrollAnimation();
        }
    }
    class ViewLayout extends lifecycle_1.Disposable {
        constructor(configuration, lineCount, scheduleAtNextAnimationFrame) {
            super();
            this._configuration = configuration;
            const options = this._configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const padding = options.get(84 /* EditorOption.padding */);
            this._linesLayout = new linesLayout_1.LinesLayout(lineCount, options.get(67 /* EditorOption.lineHeight */), padding.top, padding.bottom);
            this._maxLineWidth = 0;
            this._overlayWidgetsMinWidth = 0;
            this._scrollable = this._register(new EditorScrollable(0, scheduleAtNextAnimationFrame));
            this._configureSmoothScrollDuration();
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(layoutInfo.contentWidth, 0, layoutInfo.height, 0));
            this.onDidScroll = this._scrollable.onDidScroll;
            this.onDidContentSizeChange = this._scrollable.onDidContentSizeChange;
            this._updateHeight();
        }
        dispose() {
            super.dispose();
        }
        getScrollable() {
            return this._scrollable.getScrollable();
        }
        onHeightMaybeChanged() {
            this._updateHeight();
        }
        _configureSmoothScrollDuration() {
            this._scrollable.setSmoothScrollDuration(this._configuration.options.get(114 /* EditorOption.smoothScrolling */) ? SMOOTH_SCROLLING_TIME : 0);
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._configuration.options;
            if (e.hasChanged(67 /* EditorOption.lineHeight */)) {
                this._linesLayout.setLineHeight(options.get(67 /* EditorOption.lineHeight */));
            }
            if (e.hasChanged(84 /* EditorOption.padding */)) {
                const padding = options.get(84 /* EditorOption.padding */);
                this._linesLayout.setPadding(padding.top, padding.bottom);
            }
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
                const width = layoutInfo.contentWidth;
                const height = layoutInfo.height;
                const scrollDimensions = this._scrollable.getScrollDimensions();
                const contentWidth = scrollDimensions.contentWidth;
                this._scrollable.setScrollDimensions(new EditorScrollDimensions(width, scrollDimensions.contentWidth, height, this._getContentHeight(width, height, contentWidth)));
            }
            else {
                this._updateHeight();
            }
            if (e.hasChanged(114 /* EditorOption.smoothScrolling */)) {
                this._configureSmoothScrollDuration();
            }
        }
        onFlushed(lineCount) {
            this._linesLayout.onFlushed(lineCount);
        }
        onLinesDeleted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesDeleted(fromLineNumber, toLineNumber);
        }
        onLinesInserted(fromLineNumber, toLineNumber) {
            this._linesLayout.onLinesInserted(fromLineNumber, toLineNumber);
        }
        // ---- end view event handlers
        _getHorizontalScrollbarHeight(width, scrollWidth) {
            const options = this._configuration.options;
            const scrollbar = options.get(103 /* EditorOption.scrollbar */);
            if (scrollbar.horizontal === 2 /* ScrollbarVisibility.Hidden */) {
                // horizontal scrollbar not visible
                return 0;
            }
            if (width >= scrollWidth) {
                // horizontal scrollbar not visible
                return 0;
            }
            return scrollbar.horizontalScrollbarSize;
        }
        _getContentHeight(width, height, contentWidth) {
            const options = this._configuration.options;
            let result = this._linesLayout.getLinesTotalHeight();
            if (options.get(105 /* EditorOption.scrollBeyondLastLine */)) {
                result += Math.max(0, height - options.get(67 /* EditorOption.lineHeight */) - options.get(84 /* EditorOption.padding */).bottom);
            }
            else if (!options.get(103 /* EditorOption.scrollbar */).ignoreHorizontalScrollbarInContentHeight) {
                result += this._getHorizontalScrollbarHeight(width, contentWidth);
            }
            return result;
        }
        _updateHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const width = scrollDimensions.width;
            const height = scrollDimensions.height;
            const contentWidth = scrollDimensions.contentWidth;
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(width, scrollDimensions.contentWidth, height, this._getContentHeight(width, height, contentWidth)));
        }
        // ---- Layouting logic
        getCurrentViewport() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        getFutureViewport() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            const currentScrollPosition = this._scrollable.getFutureScrollPosition();
            return new viewModel_1.Viewport(currentScrollPosition.scrollTop, currentScrollPosition.scrollLeft, scrollDimensions.width, scrollDimensions.height);
        }
        _computeContentWidth() {
            const options = this._configuration.options;
            const maxLineWidth = this._maxLineWidth;
            const wrappingInfo = options.get(146 /* EditorOption.wrappingInfo */);
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            if (wrappingInfo.isViewportWrapping) {
                const minimap = options.get(73 /* EditorOption.minimap */);
                if (maxLineWidth > layoutInfo.contentWidth + fontInfo.typicalHalfwidthCharacterWidth) {
                    // This is a case where viewport wrapping is on, but the line extends above the viewport
                    if (minimap.enabled && minimap.side === 'right') {
                        // We need to accomodate the scrollbar width
                        return maxLineWidth + layoutInfo.verticalScrollbarWidth;
                    }
                }
                return maxLineWidth;
            }
            else {
                const extraHorizontalSpace = options.get(104 /* EditorOption.scrollBeyondLastColumn */) * fontInfo.typicalHalfwidthCharacterWidth;
                const whitespaceMinWidth = this._linesLayout.getWhitespaceMinWidth();
                return Math.max(maxLineWidth + extraHorizontalSpace + layoutInfo.verticalScrollbarWidth, whitespaceMinWidth, this._overlayWidgetsMinWidth);
            }
        }
        setMaxLineWidth(maxLineWidth) {
            this._maxLineWidth = maxLineWidth;
            this._updateContentWidth();
        }
        setOverlayWidgetsMinWidth(maxMinWidth) {
            this._overlayWidgetsMinWidth = maxMinWidth;
            this._updateContentWidth();
        }
        _updateContentWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            this._scrollable.setScrollDimensions(new EditorScrollDimensions(scrollDimensions.width, this._computeContentWidth(), scrollDimensions.height, scrollDimensions.contentHeight));
            // The height might depend on the fact that there is a horizontal scrollbar or not
            this._updateHeight();
        }
        // ---- view state
        saveState() {
            const currentScrollPosition = this._scrollable.getFutureScrollPosition();
            const scrollTop = currentScrollPosition.scrollTop;
            const firstLineNumberInViewport = this._linesLayout.getLineNumberAtOrAfterVerticalOffset(scrollTop);
            const whitespaceAboveFirstLine = this._linesLayout.getWhitespaceAccumulatedHeightBeforeLineNumber(firstLineNumberInViewport);
            return {
                scrollTop: scrollTop,
                scrollTopWithoutViewZones: scrollTop - whitespaceAboveFirstLine,
                scrollLeft: currentScrollPosition.scrollLeft
            };
        }
        // ----
        changeWhitespace(callback) {
            const hadAChange = this._linesLayout.changeWhitespace(callback);
            if (hadAChange) {
                this.onHeightMaybeChanged();
            }
            return hadAChange;
        }
        getVerticalOffsetForLineNumber(lineNumber, includeViewZones = false) {
            return this._linesLayout.getVerticalOffsetForLineNumber(lineNumber, includeViewZones);
        }
        getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones = false) {
            return this._linesLayout.getVerticalOffsetAfterLineNumber(lineNumber, includeViewZones);
        }
        isAfterLines(verticalOffset) {
            return this._linesLayout.isAfterLines(verticalOffset);
        }
        isInTopPadding(verticalOffset) {
            return this._linesLayout.isInTopPadding(verticalOffset);
        }
        isInBottomPadding(verticalOffset) {
            return this._linesLayout.isInBottomPadding(verticalOffset);
        }
        getLineNumberAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getLineNumberAtOrAfterVerticalOffset(verticalOffset);
        }
        getWhitespaceAtVerticalOffset(verticalOffset) {
            return this._linesLayout.getWhitespaceAtVerticalOffset(verticalOffset);
        }
        getLinesViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getLinesViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getLinesViewportDataAtScrollTop(scrollTop) {
            // do some minimal validations on scrollTop
            const scrollDimensions = this._scrollable.getScrollDimensions();
            if (scrollTop + scrollDimensions.height > scrollDimensions.scrollHeight) {
                scrollTop = scrollDimensions.scrollHeight - scrollDimensions.height;
            }
            if (scrollTop < 0) {
                scrollTop = 0;
            }
            return this._linesLayout.getLinesViewportData(scrollTop, scrollTop + scrollDimensions.height);
        }
        getWhitespaceViewportData() {
            const visibleBox = this.getCurrentViewport();
            return this._linesLayout.getWhitespaceViewportData(visibleBox.top, visibleBox.top + visibleBox.height);
        }
        getWhitespaces() {
            return this._linesLayout.getWhitespaces();
        }
        // ----
        getContentWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.contentWidth;
        }
        getScrollWidth() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.scrollWidth;
        }
        getContentHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.contentHeight;
        }
        getScrollHeight() {
            const scrollDimensions = this._scrollable.getScrollDimensions();
            return scrollDimensions.scrollHeight;
        }
        getCurrentScrollLeft() {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollLeft;
        }
        getCurrentScrollTop() {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            return currentScrollPosition.scrollTop;
        }
        validateScrollPosition(scrollPosition) {
            return this._scrollable.validateScrollPosition(scrollPosition);
        }
        setScrollPosition(position, type) {
            if (type === 1 /* ScrollType.Immediate */) {
                this._scrollable.setScrollPositionNow(position);
            }
            else {
                this._scrollable.setScrollPositionSmooth(position);
            }
        }
        hasPendingScrollAnimation() {
            return this._scrollable.hasPendingScrollAnimation();
        }
        deltaScrollNow(deltaScrollLeft, deltaScrollTop) {
            const currentScrollPosition = this._scrollable.getCurrentScrollPosition();
            this._scrollable.setScrollPositionNow({
                scrollLeft: currentScrollPosition.scrollLeft + deltaScrollLeft,
                scrollTop: currentScrollPosition.scrollTop + deltaScrollTop
            });
        }
    }
    exports.ViewLayout = ViewLayout;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xheW91dC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbW1vbi92aWV3TGF5b3V0L3ZpZXdMYXlvdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDO0lBRWxDLE1BQU0sc0JBQXNCO1FBVTNCLFlBQ0MsS0FBYSxFQUNiLFlBQW9CLEVBQ3BCLE1BQWMsRUFDZCxhQUFxQjtZQUVyQixLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUNsQixZQUFZLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQztZQUNoQyxNQUFNLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNwQixhQUFhLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUVsQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUNELElBQUksWUFBWSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUN0QixZQUFZLEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLENBQUM7WUFFRCxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNaLENBQUM7WUFDRCxJQUFJLGFBQWEsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUNuQixDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7WUFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztZQUVqRCxJQUFJLENBQUMsTUFB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