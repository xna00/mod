/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/fastDomNode", "vs/base/common/platform", "vs/editor/browser/viewParts/lines/rangeUtil", "vs/editor/browser/view/renderingContext", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/platform/theme/common/theme", "vs/editor/common/config/editorOptions"], function (require, exports, browser, fastDomNode_1, platform, rangeUtil_1, renderingContext_1, lineDecorations_1, viewLineRenderer_1, theme_1, editorOptions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewLine = exports.ViewLineOptions = void 0;
    exports.getColumnOfNodeOffset = getColumnOfNodeOffset;
    const canUseFastRenderedViewLine = (function () {
        if (platform.isNative) {
            // In VSCode we know very well when the zoom level changes
            return true;
        }
        if (platform.isLinux || browser.isFirefox || browser.isSafari) {
            // On Linux, it appears that zooming affects char widths (in pixels), which is unexpected.
            // --
            // Even though we read character widths correctly, having read them at a specific zoom level
            // does not mean they are the same at the current zoom level.
            // --
            // This could be improved if we ever figure out how to get an event when browsers zoom,
            // but until then we have to stick with reading client rects.
            // --
            // The same has been observed with Firefox on Windows7
            // --
            // The same has been oversved with Safari
            return false;
        }
        return true;
    })();
    let monospaceAssumptionsAreValid = true;
    class ViewLineOptions {
        constructor(config, themeType) {
            this.themeType = themeType;
            const options = config.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            const experimentalWhitespaceRendering = options.get(38 /* EditorOption.experimentalWhitespaceRendering */);
            if (experimentalWhitespaceRendering === 'off') {
                this.renderWhitespace = options.get(99 /* EditorOption.renderWhitespace */);
            }
            else {
                // whitespace is rendered in a different layer
                this.renderWhitespace = 'none';
            }
            this.renderControlCharacters = options.get(94 /* EditorOption.renderControlCharacters */);
            this.spaceWidth = fontInfo.spaceWidth;
            this.middotWidth = fontInfo.middotWidth;
            this.wsmiddotWidth = fontInfo.wsmiddotWidth;
            this.useMonospaceOptimizations = (fontInfo.isMonospace
                && !options.get(33 /* EditorOption.disableMonospaceOptimizations */));
            this.canUseHalfwidthRightwardsArrow = fontInfo.canUseHalfwidthRightwardsArrow;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.stopRenderingLineAfter = options.get(117 /* EditorOption.stopRenderingLineAfter */);
            this.fontLigatures = options.get(51 /* EditorOption.fontLigatures */);
        }
        equals(other) {
            return (this.themeType === other.themeType
                && this.renderWhitespace === other.renderWhitespace
                && this.renderControlCharacters === other.renderControlCharacters
                && this.spaceWidth === other.spaceWidth
                && this.middotWidth === other.middotWidth
                && this.wsmiddotWidth === other.wsmiddotWidth
                && this.useMonospaceOptimizations === other.useMonospaceOptimizations
                && this.canUseHalfwidthRightwardsArrow === other.canUseHalfwidthRightwardsArrow
                && this.lineHeight === other.lineHeight
                && this.stopRenderingLineAfter === other.stopRenderingLineAfter
                && this.fontLigatures === other.fontLigatures);
        }
    }
    exports.ViewLineOptions = ViewLineOptions;
    class ViewLine {
        static { this.CLASS_NAME = 'view-line'; }
        constructor(options) {
            this._options = options;
            this._isMaybeInvalid = true;
            this._renderedViewLine = null;
        }
        // --- begin IVisibleLineData
        getDomNode() {
            if (this._renderedViewLine && this._renderedViewLine.domNode) {
                return this._renderedViewLine.domNode.domNode;
            }
            return null;
        }
        setDomNode(domNode) {
            if (this._renderedViewLine) {
                this._renderedViewLine.domNode = (0, fastDomNode_1.createFastDomNode)(domNode);
            }
            else {
                throw new Error('I have no rendered view line to set the dom node to...');
            }
        }
        onContentChanged() {
            this._isMaybeInvalid = true;
        }
        onTokensChanged() {
            this._isMaybeInvalid = true;
        }
        onDecorationsChanged() {
            this._isMaybeInvalid = true;
        }
        onOptionsChanged(newOptions) {
            this._isMaybeInvalid = true;
            this._options = newOptions;
        }
        onSelectionChanged() {
            if ((0, theme_1.isHighContrast)(this._options.themeType) || this._options.renderWhitespace === 'selection') {
                this._isMaybeInvalid = true;
                return true;
            }
            return false;
        }
        renderLine(lineNumber, deltaTop, lineHeight, viewportData, sb) {
            if (this._isMaybeInvalid === false) {
                // it appears that nothing relevant has changed
                return false;
            }
            this._isMaybeInvalid = false;
            const lineData = viewportData.getViewLineRenderingData(lineNumber);
            const options = this._options;
            const actualInlineDecorations = lineDecorations_1.LineDecoration.filter(lineData.inlineDecorations, lineNumber, lineData.minColumn, lineData.maxColumn);
            // Only send selection information when needed for rendering whitespace
            let selectionsOnLine = null;
            if ((0, theme_1.isHighContrast)(options.themeType) || this._options.renderWhitespace === 'selection') {
                const selections = viewportData.selections;
                for (const selection of selections) {
                    if (selection.endLineNumber < lineNumber || selection.startLineNumber > lineNumber) {
                        // Selection does not intersect line
                        continue;
                    }
                    const startColumn = (selection.startLineNumber === lineNumber ? selection.startColumn : lineData.minColumn);
                    const endColumn = (selection.endLineNumber === lineNumber ? selection.endColumn : lineData.maxColumn);
                    if (startColumn < endColumn) {
                        if ((0, theme_1.isHighContrast)(options.themeType)) {
                            actualInlineDecorations.push(new lineDecorations_1.LineDecoration(startColumn, endColumn, 'inline-selected-text', 0 /* InlineDecorationType.Regular */));
                        }
                        if (this._options.renderWhitespace === 'selection') {
                            if (!selectionsOnLine) {
                                selectionsOnLine = [];
                            }
                            selectionsOnLine.push(new viewLineRenderer_1.LineRange(startColumn - 1, endColumn - 1));
                        }
                    }
                }
            }
            const renderLineInput = new viewLineRenderer_1.RenderLineInput(options.useMonospaceOptimizations, options.canUseHalfwidthRightwardsArrow, lineData.content, lineData.continuesWithWrappedLine, lineData.isBasicASCII, lineData.containsRTL, lineData.minColumn - 1, lineData.tokens, actualInlineDecorations, lineData.tabSize, lineData.startVisibleColumn, options.spaceWidth, options.middotWidth, options.wsmiddotWidth, options.stopRenderingLineAfter, options.renderWhitespace, options.renderControlCharacters, options.fontLigatures !== editorOptions_1.EditorFontLigatures.OFF, selectionsOnLine);
            if (this._renderedViewLine && this._renderedViewLine.input.equals(renderLineInput)) {
                // no need to do anything, we have the same render input
                return false;
            }
            sb.appendString('<div style="top:');
            sb.appendString(String(deltaTop));
            sb.appendString('px;height:');
            sb.appendString(String(lineHeight));
            sb.appendString('px;" class="');
            sb.appendString(ViewLine.CLASS_NAME);
            sb.appendString('">');
            const output = (0, viewLineRenderer_1.renderViewLine)(renderLineInput, sb);
            sb.appendString('</div>');
            let renderedViewLine = null;
            if (monospaceAssumptionsAreValid && canUseFastRenderedViewLine && lineData.isBasicASCII && options.useMonospaceOptimizations && output.containsForeignElements === 0 /* ForeignElementType.None */) {
                renderedViewLine = new FastRenderedViewLine(this._renderedViewLine ? this._renderedViewLine.domNode : null, renderLineInput, output.characterMapping);
            }
            if (!renderedViewLine) {
                renderedViewLine = createRenderedLine(this._renderedViewLine ? this._renderedViewLine.domNode : null, renderLineInput, output.characterMapping, output.containsRTL, output.containsForeignElements);
            }
            this._renderedViewLine = renderedViewLine;
            return true;
        }
        layoutLine(lineNumber, deltaTop, lineHeight) {
            if (this._renderedViewLine && this._renderedViewLine.domNode) {
                this._renderedViewLine.domNode.setTop(deltaTop);
                this._renderedViewLine.domNode.setHeight(lineHeight);
            }
        }
        // --- end IVisibleLineData
        getWidth(context) {
            if (!this._renderedViewLine) {
                return 0;
            }
            return this._renderedViewLine.getWidth(context);
        }
        getWidthIsFast() {
            if (!this._renderedViewLine) {
                return true;
            }
            return this._renderedViewLine.getWidthIsFast();
        }
        needsMonospaceFontCheck() {
            if (!this._renderedViewLine) {
                return false;
            }
            return (this._renderedViewLine instanceof FastRenderedViewLine);
        }
        monospaceAssumptionsAreValid() {
            if (!this._renderedViewLine) {
                return monospaceAssumptionsAreValid;
            }
            if (this._renderedViewLine instanceof FastRenderedViewLine) {
                return this._renderedViewLine.monospaceAssumptionsAreValid();
            }
            return monospaceAssumptionsAreValid;
        }
        onMonospaceAssumptionsInvalidated() {
            if (this._renderedViewLine && this._renderedViewLine instanceof FastRenderedViewLine) {
                this._renderedViewLine = this._renderedViewLine.toSlowRenderedLine();
            }
        }
        getVisibleRangesForRange(lineNumber, startColumn, endColumn, context) {
            if (!this._renderedViewLine) {
                return null;
            }
            startColumn = Math.min(this._renderedViewLine.input.lineContent.length + 1, Math.max(1, startColumn));
            endColumn = Math.min(this._renderedViewLine.input.lineContent.length + 1, Math.max(1, endColumn));
            const stopRenderingLineAfter = this._renderedViewLine.input.stopRenderingLineAfter;
            if (stopRenderingLineAfter !== -1 && startColumn > stopRenderingLineAfter + 1 && endColumn > stopRenderingLineAfter + 1) {
                // This range is obviously not visible
                return new renderingContext_1.VisibleRanges(true, [new renderingContext_1.FloatHorizontalRange(this.getWidth(context), 0)]);
            }
            if (stopRenderingLineAfter !== -1 && startColumn > stopRenderingLineAfter + 1) {
                startColumn = stopRenderingLineAfter + 1;
            }
            if (stopRenderingLineAfter !== -1 && endColumn > stopRenderingLineAfter + 1) {
                endColumn = stopRenderingLineAfter + 1;
            }
            const horizontalRanges = this._renderedViewLine.getVisibleRangesForRange(lineNumber, startColumn, endColumn, context);
            if (horizontalRanges && horizontalRanges.length > 0) {
                return new renderingContext_1.VisibleRanges(false, horizontalRanges);
            }
            return null;
        }
        getColumnOfNodeOffset(spanNode, offset) {
            if (!this._renderedViewLine) {
                return 1;
            }
            return this._renderedViewLine.getColumnOfNodeOffset(spanNode, offset);
        }
    }
    exports.ViewLine = ViewLine;
    var Constants;
    (function (Constants) {
        /**
         * It seems that rounding errors occur with long lines, so the purely multiplication based
         * method is only viable for short lines. For longer lines, we look up the real position of
         * every 300th character and use multiplication based on that.
         *
         * See https://github.com/microsoft/vscode/issues/33178
         */
        Constants[Constants["MaxMonospaceDistance"] = 300] = "MaxMonospaceDistance";
    })(Constants || (Constants = {}));
    /**
     * A rendered line which is guaranteed to contain only regular ASCII and is rendered with a monospace font.
     */
    class FastRenderedViewLine {
        constructor(domNode, renderLineInput, characterMapping) {
            this._cachedWidth = -1;
            this.domNode = domNode;
            this.input = renderLineInput;
            const keyColumnCount = Math.floor(renderLineInput.lineContent.length / 300 /* Constants.MaxMonospaceDistance */);
            if (keyColumnCount > 0) {
                this._keyColumnPixelOffsetCache = new Float32Array(keyColumnCount);
                for (let i = 0; i < keyColumnCount; i++) {
                    this._keyColumnPixelOffsetCache[i] = -1;
                }
            }
            else {
                this._keyColumnPixelOffsetCache = null;
            }
            this._characterMapping = characterMapping;
            this._charWidth = renderLineInput.spaceWidth;
        }
        getWidth(context) {
            if (!this.domNode || this.input.lineContent.length < 300 /* Constants.MaxMonospaceDistance */) {
                const horizontalOffset = this._characterMapping.getHorizontalOffset(this._characterMapping.length);
                return Math.round(this._charWidth * horizontalOffset);
            }
            if (this._cachedWidth === -1) {
                this._cachedWidth = this._getReadingTarget(this.domNode).offsetWidth;
                context?.markDidDomLayout();
            }
            return this._cachedWidth;
        }
        getWidthIsFast() {
            return (this.input.lineContent.length < 300 /* Constants.MaxMonospaceDistance */) || this._cachedWidth !== -1;
        }
        monospaceAssumptionsAreValid() {
            if (!this.domNode) {
                return monospaceAssumptionsAreValid;
            }
            if (this.input.lineContent.length < 300 /* Constants.MaxMonospaceDistance */) {
                const expectedWidth = this.getWidth(null);
                const actualWidth = this.domNode.domNode.firstChild.offsetWidth;
                if (Math.abs(expectedWidth - actualWidth) >= 2) {
                    // more than 2px off
                    console.warn(`monospace assumptions have been violated, therefore disabling monospace optimizations!`);
                    monospaceAssumptionsAreValid = false;
                }
            }
            return monospaceAssumptionsAreValid;
        }
        toSlowRenderedLine() {
            return createRenderedLine(this.domNode, this.input, this._characterMapping, false, 0 /* ForeignElementType.None */);
        }
        getVisibleRangesForRange(lineNumber, startColumn, endColumn, context) {
            const startPosition = this._getColumnPixelOffset(lineNumber, startColumn, context);
            const endPosition = this._getColumnPixelOffset(lineNumber, endColumn, context);
            return [new renderingContext_1.FloatHorizontalRange(startPosition, endPosition - startPosition)];
        }
        _getColumnPixelOffset(lineNumber, column, context) {
            if (column <= 300 /* Constants.MaxMonospaceDistance */) {
                const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
                return this._charWidth * horizontalOffset;
            }
            const keyColumnOrdinal = Math.floor((column - 1) / 300 /* Constants.MaxMonospaceDistance */) - 1;
            const keyColumn = (keyColumnOrdinal + 1) * 300 /* Constants.MaxMonospaceDistance */ + 1;
            let keyColumnPixelOffset = -1;
            if (this._keyColumnPixelOffsetCache) {
                keyColumnPixelOffset = this._keyColumnPixelOffsetCache[keyColumnOrdinal];
                if (keyColumnPixelOffset === -1) {
                    keyColumnPixelOffset = this._actualReadPixelOffset(lineNumber, keyColumn, context);
                    this._keyColumnPixelOffsetCache[keyColumnOrdinal] = keyColumnPixelOffset;
                }
            }
            if (keyColumnPixelOffset === -1) {
                // Could not read actual key column pixel offset
                const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
                return this._charWidth * horizontalOffset;
            }
            const keyColumnHorizontalOffset = this._characterMapping.getHorizontalOffset(keyColumn);
            const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
            return keyColumnPixelOffset + this._charWidth * (horizontalOffset - keyColumnHorizontalOffset);
        }
        _getReadingTarget(myDomNode) {
            return myDomNode.domNode.firstChild;
        }
        _actualReadPixelOffset(lineNumber, column, context) {
            if (!this.domNode) {
                return -1;
            }
            const domPosition = this._characterMapping.getDomPosition(column);
            const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(this.domNode), domPosition.partIndex, domPosition.charIndex, domPosition.partIndex, domPosition.charIndex, context);
            if (!r || r.length === 0) {
                return -1;
            }
            return r[0].left;
        }
        getColumnOfNodeOffset(spanNode, offset) {
            return getColumnOfNodeOffset(this._characterMapping, spanNode, offset);
        }
    }
    /**
     * Every time we render a line, we save what we have rendered in an instance of this class.
     */
    class RenderedViewLine {
        constructor(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
            this.domNode = domNode;
            this.input = renderLineInput;
            this._characterMapping = characterMapping;
            this._isWhitespaceOnly = /^\s*$/.test(renderLineInput.lineContent);
            this._containsForeignElements = containsForeignElements;
            this._cachedWidth = -1;
            this._pixelOffsetCache = null;
            if (!containsRTL || this._characterMapping.length === 0 /* the line is empty */) {
                this._pixelOffsetCache = new Float32Array(Math.max(2, this._characterMapping.length + 1));
                for (let column = 0, len = this._characterMapping.length; column <= len; column++) {
                    this._pixelOffsetCache[column] = -1;
                }
            }
        }
        // --- Reading from the DOM methods
        _getReadingTarget(myDomNode) {
            return myDomNode.domNode.firstChild;
        }
        /**
         * Width of the line in pixels
         */
        getWidth(context) {
            if (!this.domNode) {
                return 0;
            }
            if (this._cachedWidth === -1) {
                this._cachedWidth = this._getReadingTarget(this.domNode).offsetWidth;
                context?.markDidDomLayout();
            }
            return this._cachedWidth;
        }
        getWidthIsFast() {
            if (this._cachedWidth === -1) {
                return false;
            }
            return true;
        }
        /**
         * Visible ranges for a model range
         */
        getVisibleRangesForRange(lineNumber, startColumn, endColumn, context) {
            if (!this.domNode) {
                return null;
            }
            if (this._pixelOffsetCache !== null) {
                // the text is LTR
                const startOffset = this._readPixelOffset(this.domNode, lineNumber, startColumn, context);
                if (startOffset === -1) {
                    return null;
                }
                const endOffset = this._readPixelOffset(this.domNode, lineNumber, endColumn, context);
                if (endOffset === -1) {
                    return null;
                }
                return [new renderingContext_1.FloatHorizontalRange(startOffset, endOffset - startOffset)];
            }
            return this._readVisibleRangesForRange(this.domNode, lineNumber, startColumn, endColumn, context);
        }
        _readVisibleRangesForRange(domNode, lineNumber, startColumn, endColumn, context) {
            if (startColumn === endColumn) {
                const pixelOffset = this._readPixelOffset(domNode, lineNumber, startColumn, context);
                if (pixelOffset === -1) {
                    return null;
                }
                else {
                    return [new renderingContext_1.FloatHorizontalRange(pixelOffset, 0)];
                }
            }
            else {
                return this._readRawVisibleRangesForRange(domNode, startColumn, endColumn, context);
            }
        }
        _readPixelOffset(domNode, lineNumber, column, context) {
            if (this._characterMapping.length === 0) {
                // This line has no content
                if (this._containsForeignElements === 0 /* ForeignElementType.None */) {
                    // We can assume the line is really empty
                    return 0;
                }
                if (this._containsForeignElements === 2 /* ForeignElementType.After */) {
                    // We have foreign elements after the (empty) line
                    return 0;
                }
                if (this._containsForeignElements === 1 /* ForeignElementType.Before */) {
                    // We have foreign elements before the (empty) line
                    return this.getWidth(context);
                }
                // We have foreign elements before & after the (empty) line
                const readingTarget = this._getReadingTarget(domNode);
                if (readingTarget.firstChild) {
                    context.markDidDomLayout();
                    return readingTarget.firstChild.offsetWidth;
                }
                else {
                    return 0;
                }
            }
            if (this._pixelOffsetCache !== null) {
                // the text is LTR
                const cachedPixelOffset = this._pixelOffsetCache[column];
                if (cachedPixelOffset !== -1) {
                    return cachedPixelOffset;
                }
                const result = this._actualReadPixelOffset(domNode, lineNumber, column, context);
                this._pixelOffsetCache[column] = result;
                return result;
            }
            return this._actualReadPixelOffset(domNode, lineNumber, column, context);
        }
        _actualReadPixelOffset(domNode, lineNumber, column, context) {
            if (this._characterMapping.length === 0) {
                // This line has no content
                const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(domNode), 0, 0, 0, 0, context);
                if (!r || r.length === 0) {
                    return -1;
                }
                return r[0].left;
            }
            if (column === this._characterMapping.length && this._isWhitespaceOnly && this._containsForeignElements === 0 /* ForeignElementType.None */) {
                // This branch helps in the case of whitespace only lines which have a width set
                return this.getWidth(context);
            }
            const domPosition = this._characterMapping.getDomPosition(column);
            const r = rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(domNode), domPosition.partIndex, domPosition.charIndex, domPosition.partIndex, domPosition.charIndex, context);
            if (!r || r.length === 0) {
                return -1;
            }
            const result = r[0].left;
            if (this.input.isBasicASCII) {
                const horizontalOffset = this._characterMapping.getHorizontalOffset(column);
                const expectedResult = Math.round(this.input.spaceWidth * horizontalOffset);
                if (Math.abs(expectedResult - result) <= 1) {
                    return expectedResult;
                }
            }
            return result;
        }
        _readRawVisibleRangesForRange(domNode, startColumn, endColumn, context) {
            if (startColumn === 1 && endColumn === this._characterMapping.length) {
                // This branch helps IE with bidi text & gives a performance boost to other browsers when reading visible ranges for an entire line
                return [new renderingContext_1.FloatHorizontalRange(0, this.getWidth(context))];
            }
            const startDomPosition = this._characterMapping.getDomPosition(startColumn);
            const endDomPosition = this._characterMapping.getDomPosition(endColumn);
            return rangeUtil_1.RangeUtil.readHorizontalRanges(this._getReadingTarget(domNode), startDomPosition.partIndex, startDomPosition.charIndex, endDomPosition.partIndex, endDomPosition.charIndex, context);
        }
        /**
         * Returns the column for the text found at a specific offset inside a rendered dom node
         */
        getColumnOfNodeOffset(spanNode, offset) {
            return getColumnOfNodeOffset(this._characterMapping, spanNode, offset);
        }
    }
    class WebKitRenderedViewLine extends RenderedViewLine {
        _readVisibleRangesForRange(domNode, lineNumber, startColumn, endColumn, context) {
            const output = super._readVisibleRangesForRange(domNode, lineNumber, startColumn, endColumn, context);
            if (!output || output.length === 0 || startColumn === endColumn || (startColumn === 1 && endColumn === this._characterMapping.length)) {
                return output;
            }
            // WebKit is buggy and returns an expanded range (to contain words in some cases)
            // The last client rect is enlarged (I think)
            if (!this.input.containsRTL) {
                // This is an attempt to patch things up
                // Find position of last column
                const endPixelOffset = this._readPixelOffset(domNode, lineNumber, endColumn, context);
                if (endPixelOffset !== -1) {
                    const lastRange = output[output.length - 1];
                    if (lastRange.left < endPixelOffset) {
                        // Trim down the width of the last visible range to not go after the last column's position
                        lastRange.width = endPixelOffset - lastRange.left;
                    }
                }
            }
            return output;
        }
    }
    const createRenderedLine = (function () {
        if (browser.isWebKit) {
            return createWebKitRenderedLine;
        }
        return createNormalRenderedLine;
    })();
    function createWebKitRenderedLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
        return new WebKitRenderedViewLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements);
    }
    function createNormalRenderedLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements) {
        return new RenderedViewLine(domNode, renderLineInput, characterMapping, containsRTL, containsForeignElements);
    }
    function getColumnOfNodeOffset(characterMapping, spanNode, offset) {
        const spanNodeTextContentLength = spanNode.textContent.length;
        let spanIndex = -1;
        while (spanNode) {
            spanNode = spanNode.previousSibling;
            spanIndex++;
        }
        return characterMapping.getColumn(new viewLineRenderer_1.DomPosition(spanIndex, offset), spanNodeTextContentLength);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld0xpbmUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9saW5lcy92aWV3TGluZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2c0JoRyxzREFVQztJQXJzQkQsTUFBTSwwQkFBMEIsR0FBRyxDQUFDO1FBQ25DLElBQUksUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3ZCLDBEQUEwRDtZQUMxRCxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDL0QsMEZBQTBGO1lBQzFGLEtBQUs7WUFDTCw0RkFBNEY7WUFDNUYsNkRBQTZEO1lBQzdELEtBQUs7WUFDTCx1RkFBdUY7WUFDdkYsNkRBQTZEO1lBQzdELEtBQUs7WUFDTCxzREFBc0Q7WUFDdEQsS0FBSztZQUNMLHlDQUF5QztZQUN6QyxPQUFPLEtBQUssQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNiLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFFTCxJQUFJLDRCQUE0QixHQUFHLElBQUksQ0FBQztJQUV4QyxNQUFhLGVBQWU7UUFhM0IsWUFBWSxNQUE0QixFQUFFLFNBQXNCO1lBQy9ELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDL0IsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsZ0NBQXVCLENBQUM7WUFDcEQsTUFBTSwrQkFBK0IsR0FBRyxPQUFPLENBQUMsR0FBRyx1REFBOEMsQ0FBQztZQUNsRyxJQUFJLCtCQUErQixLQUFLLEtBQUssRUFBRSxDQUFD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