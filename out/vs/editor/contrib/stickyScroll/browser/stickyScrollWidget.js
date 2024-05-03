/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/trustedTypes", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/themables", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/browser/widget/codeEditor/embeddedCodeEditorWidget", "vs/editor/common/core/position", "vs/editor/common/core/stringBuilder", "vs/editor/common/viewLayout/lineDecorations", "vs/editor/common/viewLayout/viewLineRenderer", "vs/editor/contrib/folding/browser/foldingDecorations", "vs/css!./stickyScroll"], function (require, exports, dom, trustedTypes_1, arrays_1, lifecycle_1, themables_1, viewLine_1, embeddedCodeEditorWidget_1, position_1, stringBuilder_1, lineDecorations_1, viewLineRenderer_1, foldingDecorations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyScrollWidget = exports.StickyScrollWidgetState = void 0;
    class StickyScrollWidgetState {
        constructor(startLineNumbers, endLineNumbers, lastLineRelativePosition, showEndForLine = null) {
            this.startLineNumbers = startLineNumbers;
            this.endLineNumbers = endLineNumbers;
            this.lastLineRelativePosition = lastLineRelativePosition;
            this.showEndForLine = showEndForLine;
        }
        equals(other) {
            return !!other
                && this.lastLineRelativePosition === other.lastLineRelativePosition
                && this.showEndForLine === other.showEndForLine
                && (0, arrays_1.equals)(this.startLineNumbers, other.startLineNumbers)
                && (0, arrays_1.equals)(this.endLineNumbers, other.endLineNumbers);
        }
    }
    exports.StickyScrollWidgetState = StickyScrollWidgetState;
    const _ttPolicy = (0, trustedTypes_1.createTrustedTypesPolicy)('stickyScrollViewLayer', { createHTML: value => value });
    const STICKY_INDEX_ATTR = 'data-sticky-line-index';
    const STICKY_IS_LINE_ATTR = 'data-sticky-is-line';
    const STICKY_IS_LINE_NUMBER_ATTR = 'data-sticky-is-line-number';
    const STICKY_IS_FOLDING_ICON_ATTR = 'data-sticky-is-folding-icon';
    class StickyScrollWidget extends lifecycle_1.Disposable {
        constructor(_editor) {
            super();
            this._editor = _editor;
            this._foldingIconStore = new lifecycle_1.DisposableStore();
            this._rootDomNode = document.createElement('div');
            this._lineNumbersDomNode = document.createElement('div');
            this._linesDomNodeScrollable = document.createElement('div');
            this._linesDomNode = document.createElement('div');
            this._lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            this._renderedStickyLines = [];
            this._lineNumbers = [];
            this._lastLineRelativePosition = 0;
            this._minContentWidthInPx = 0;
            this._isOnGlyphMargin = false;
            this._lineNumbersDomNode.className = 'sticky-widget-line-numbers';
            this._lineNumbersDomNode.setAttribute('role', 'none');
            this._linesDomNode.className = 'sticky-widget-lines';
            this._linesDomNode.setAttribute('role', 'list');
            this._linesDomNodeScrollable.className = 'sticky-widget-lines-scrollable';
            this._linesDomNodeScrollable.appendChild(this._linesDomNode);
            this._rootDomNode.className = 'sticky-widget';
            this._rootDomNode.classList.toggle('peek', _editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget);
            this._rootDomNode.appendChild(this._lineNumbersDomNode);
            this._rootDomNode.appendChild(this._linesDomNodeScrollable);
            const updateScrollLeftPosition = () => {
                this._linesDomNode.style.left = this._editor.getOption(115 /* EditorOption.stickyScroll */).scrollWithEditor ? `-${this._editor.getScrollLeft()}px` : '0px';
            };
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(115 /* EditorOption.stickyScroll */)) {
                    updateScrollLeftPosition();
                }
                if (e.hasChanged(67 /* EditorOption.lineHeight */)) {
                    this._lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
                }
            }));
            this._register(this._editor.onDidScrollChange((e) => {
                if (e.scrollLeftChanged) {
                    updateScrollLeftPosition();
                }
                if (e.scrollWidthChanged) {
                    this._updateWidgetWidth();
                }
            }));
            this._register(this._editor.onDidChangeModel(() => {
                updateScrollLeftPosition();
                this._updateWidgetWidth();
            }));
            this._register(this._foldingIconStore);
            updateScrollLeftPosition();
            this._register(this._editor.onDidLayoutChange((e) => {
                this._updateWidgetWidth();
            }));
            this._updateWidgetWidth();
        }
        get lineNumbers() {
            return this._lineNumbers;
        }
        get lineNumberCount() {
            return this._lineNumbers.length;
        }
        getRenderedStickyLine(lineNumber) {
            return this._renderedStickyLines.find(stickyLine => stickyLine.lineNumber === lineNumber);
        }
        getCurrentLines() {
            return this._lineNumbers;
        }
        setState(_state, foldingModel, _rebuildFromLine) {
            if (_rebuildFromLine === undefined &&
                ((!this._previousState && !_state) || (this._previousState && this._previousState.equals(_state)))) {
                return;
            }
            const isWidgetHeightZero = this._isWidgetHeightZero(_state);
            const state = isWidgetHeightZero ? undefined : _state;
            const rebuildFromLine = isWidgetHeightZero ? 0 : this._findLineToRebuildWidgetFrom(_state, _rebuildFromLine);
            this._renderRootNode(state, foldingModel, rebuildFromLine);
            this._previousState = _state;
        }
        _isWidgetHeightZero(state) {
            if (!state) {
                return true;
            }
            const futureWidgetHeight = state.startLineNumbers.length * this._lineHeight + state.lastLineRelativePosition;
            if (futureWidgetHeight > 0) {
                this._lastLineRelativePosition = state.lastLineRelativePosition;
                const lineNumbers = [...state.startLineNumbers];
                if (state.showEndForLine !== null) {
                    lineNumbers[state.showEndForLine] = state.endLineNumbers[state.showEndForLine];
                }
                this._lineNumbers = lineNumbers;
            }
            else {
                this._lastLineRelativePosition = 0;
                this._lineNumbers = [];
            }
            return futureWidgetHeight === 0;
        }
        _findLineToRebuildWidgetFrom(state, _rebuildFromLine) {
            if (!state || !this._previousState) {
                return 0;
            }
            if (_rebuildFromLine !== undefined) {
                return _rebuildFromLine;
            }
            const previousState = this._previousState;
            const indexOfLinesAlreadyRendered = state.startLineNumbers.findIndex(startLineNumber => !previousState.startLineNumbers.includes(startLineNumber));
            return (indexOfLinesAlreadyRendered === -1) ? 0 : indexOfLinesAlreadyRendered;
        }
        _updateWidgetWidth() {
            const layoutInfo = this._editor.getLayoutInfo();
            const lineNumbersWidth = layoutInfo.contentLeft;
            this._lineNumbersDomNode.style.width = `${lineNumbersWidth}px`;
            this._linesDomNodeScrollable.style.setProperty('--vscode-editorStickyScroll-scrollableWidth', `${this._editor.getScrollWidth() - layoutInfo.verticalScrollbarWidth}px`);
            this._rootDomNode.style.width = `${layoutInfo.width - layoutInfo.verticalScrollbarWidth}px`;
        }
        _clearStickyLinesFromLine(clearFromLine) {
            this._foldingIconStore.clear();
            // Removing only the lines that need to be rerendered
            for (let i = clearFromLine; i < this._renderedStickyLines.length; i++) {
                const stickyLine = this._renderedStickyLines[i];
                stickyLine.lineNumberDomNode.remove();
                stickyLine.lineDomNode.remove();
            }
            // Keep the lines that need to be updated
            this._renderedStickyLines = this._renderedStickyLines.slice(0, clearFromLine);
            this._rootDomNode.style.display = 'none';
        }
        _useFoldingOpacityTransition(requireTransitions) {
            this._lineNumbersDomNode.style.setProperty('--vscode-editorStickyScroll-foldingOpacityTransition', `opacity ${requireTransitions ? 0.5 : 0}s`);
        }
        _setFoldingIconsVisibility(allVisible) {
            for (const line of this._renderedStickyLines) {
                const foldingIcon = line.foldingIcon;
                if (!foldingIcon) {
                    continue;
                }
                foldingIcon.setVisible(allVisible ? true : foldingIcon.isCollapsed);
            }
        }
        async _renderRootNode(state, foldingModel, rebuildFromLine) {
            this._clearStickyLinesFromLine(rebuildFromLine);
            if (!state) {
                return;
            }
            // For existing sticky lines update the top and z-index
            for (const stickyLine of this._renderedStickyLines) {
                this._updateTopAndZIndexOfStickyLine(stickyLine);
            }
            // For new sticky lines
            const layoutInfo = this._editor.getLayoutInfo();
            const linesToRender = this._lineNumbers.slice(rebuildFromLine);
            for (const [index, line] of linesToRender.entries()) {
                const stickyLine = this._renderChildNode(index + rebuildFromLine, line, foldingModel, layoutInfo);
                if (!stickyLine) {
                    continue;
                }
                this._linesDomNode.appendChild(stickyLine.lineDomNode);
                this._lineNumbersDomNode.appendChild(stickyLine.lineNumberDomNode);
                this._renderedStickyLines.push(stickyLine);
            }
            if (foldingModel) {
                this._setFoldingHoverListeners();
                this._useFoldingOpacityTransition(!this._isOnGlyphMargin);
            }
            const widgetHeight = this._lineNumbers.length * this._lineHeight + this._lastLineRelativePosition;
            this._rootDomNode.style.display = 'block';
            this._lineNumbersDomNode.style.height = `${widgetHeight}px`;
            this._linesDomNodeScrollable.style.height = `${widgetHeight}px`;
            this._rootDomNode.style.height = `${widgetHeight}px`;
            this._rootDomNode.style.marginLeft = '0px';
            this._minContentWidthInPx = Math.max(...this._renderedStickyLines.map(l => l.scrollWidth)) + layoutInfo.verticalScrollbarWidth;
            this._editor.layoutOverlayWidget(this);
        }
        _setFoldingHoverListeners() {
            const showFoldingControls = this._editor.getOption(110 /* EditorOption.showFoldingControls */);
            if (showFoldingControls !== 'mouseover') {
                return;
            }
            this._foldingIconStore.add(dom.addDisposableListener(this._lineNumbersDomNode, dom.EventType.MOUSE_ENTER, () => {
                this._isOnGlyphMargin = true;
                this._setFoldingIconsVisibility(true);
            }));
            this._foldingIconStore.add(dom.addDisposableListener(this._lineNumbersDomNode, dom.EventType.MOUSE_LEAVE, () => {
                this._isOnGlyphMargin = false;
                this._useFoldingOpacityTransition(true);
                this._setFoldingIconsVisibility(false);
            }));
        }
        _renderChildNode(index, line, foldingModel, layoutInfo) {
            const viewModel = this._editor._getViewModel();
            if (!viewModel) {
                return;
            }
            const viewLineNumber = viewModel.coordinatesConverter.convertModelPositionToViewPosition(new position_1.Position(line, 1)).lineNumber;
            const lineRenderingData = viewModel.getViewLineRenderingData(viewLineNumber);
            const lineNumberOption = this._editor.getOption(68 /* EditorOption.lineNumbers */);
            let actualInlineDecorations;
            try {
                actualInlineDecorations = lineDecorations_1.LineDecoration.filter(lineRenderingData.inlineDecorations, viewLineNumber, lineRenderingData.minColumn, lineRenderingData.maxColumn);
            }
            catch (err) {
                actualInlineDecorations = [];
            }
            const renderLineInput = new viewLineRenderer_1.RenderLineInput(true, true, lineRenderingData.content, lineRenderingData.continuesWithWrappedLine, lineRenderingData.isBasicASCII, lineRenderingData.containsRTL, 0, lineRenderingData.tokens, actualInlineDecorations, lineRenderingData.tabSize, lineRenderingData.startVisibleColumn, 1, 1, 1, 500, 'none', true, true, null);
            const sb = new stringBuilder_1.StringBuilder(2000);
            const renderOutput = (0, viewLineRenderer_1.renderViewLine)(renderLineInput, sb);
            let newLine;
            if (_ttPolicy) {
                newLine = _ttPolicy.createHTML(sb.build());
            }
            else {
                newLine = sb.build();
            }
            const lineHTMLNode = document.createElement('span');
            lineHTMLNode.setAttribute(STICKY_INDEX_ATTR, String(index));
            lineHTMLNode.setAttribute(STICKY_IS_LINE_ATTR, '');
            lineHTMLNode.setAttribute('role', 'listitem');
            lineHTMLNode.tabIndex = 0;
            lineHTMLNode.className = 'sticky-line-content';
            lineHTMLNode.classList.add(`stickyLine${line}`);
            lineHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            lineHTMLNode.innerHTML = newLine;
            const lineNumberHTMLNode = document.createElement('span');
            lineNumberHTMLNode.setAttribute(STICKY_INDEX_ATTR, String(index));
            lineNumberHTMLNode.setAttribute(STICKY_IS_LINE_NUMBER_ATTR, '');
            lineNumberHTMLNode.className = 'sticky-line-number';
            lineNumberHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            const lineNumbersWidth = layoutInfo.contentLeft;
            lineNumberHTMLNode.style.width = `${lineNumbersWidth}px`;
            const innerLineNumberHTML = document.createElement('span');
            if (lineNumberOption.renderType === 1 /* RenderLineNumbersType.On */ || lineNumberOption.renderType === 3 /* RenderLineNumbersType.Interval */ && line % 10 === 0) {
                innerLineNumberHTML.innerText = line.toString();
            }
            else if (lineNumberOption.renderType === 2 /* RenderLineNumbersType.Relative */) {
                innerLineNumberHTML.innerText = Math.abs(line - this._editor.getPosition().lineNumber).toString();
            }
            innerLineNumberHTML.className = 'sticky-line-number-inner';
            innerLineNumberHTML.style.lineHeight = `${this._lineHeight}px`;
            innerLineNumberHTML.style.width = `${layoutInfo.lineNumbersWidth}px`;
            innerLineNumberHTML.style.paddingLeft = `${layoutInfo.lineNumbersLeft}px`;
            lineNumberHTMLNode.appendChild(innerLineNumberHTML);
            const foldingIcon = this._renderFoldingIconForLine(foldingModel, line);
            if (foldingIcon) {
                lineNumberHTMLNode.appendChild(foldingIcon.domNode);
            }
            this._editor.applyFontInfo(lineHTMLNode);
            this._editor.applyFontInfo(innerLineNumberHTML);
            lineNumberHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            lineHTMLNode.style.lineHeight = `${this._lineHeight}px`;
            lineNumberHTMLNode.style.height = `${this._lineHeight}px`;
            lineHTMLNode.style.height = `${this._lineHeight}px`;
            const renderedLine = new RenderedStickyLine(index, line, lineHTMLNode, lineNumberHTMLNode, foldingIcon, renderOutput.characterMapping, lineHTMLNode.scrollWidth);
            return this._updateTopAndZIndexOfStickyLine(renderedLine);
        }
        _updateTopAndZIndexOfStickyLine(stickyLine) {
            const index = stickyLine.index;
            const lineHTMLNode = stickyLine.lineDomNode;
            const lineNumberHTMLNode = stickyLine.lineNumberDomNode;
            const isLastLine = index === this._lineNumbers.length - 1;
            const lastLineZIndex = '0';
            const intermediateLineZIndex = '1';
            lineHTMLNode.style.zIndex = isLastLine ? lastLineZIndex : intermediateLineZIndex;
            lineNumberHTMLNode.style.zIndex = isLastLine ? lastLineZIndex : intermediateLineZIndex;
            const lastLineTop = `${index * this._lineHeight + this._lastLineRelativePosition + (stickyLine.foldingIcon?.isCollapsed ? 1 : 0)}px`;
            const intermediateLineTop = `${index * this._lineHeight}px`;
            lineHTMLNode.style.top = isLastLine ? lastLineTop : intermediateLineTop;
            lineNumberHTMLNode.style.top = isLastLine ? lastLineTop : intermediateLineTop;
            return stickyLine;
        }
        _renderFoldingIconForLine(foldingModel, line) {
            const showFoldingControls = this._editor.getOption(110 /* EditorOption.showFoldingControls */);
            if (!foldingModel || showFoldingControls === 'never') {
                return;
            }
            const foldingRegions = foldingModel.regions;
            const indexOfFoldingRegion = foldingRegions.findRange(line);
            const startLineNumber = foldingRegions.getStartLineNumber(indexOfFoldingRegion);
            const isFoldingScope = line === startLineNumber;
            if (!isFoldingScope) {
                return;
            }
            const isCollapsed = foldingRegions.isCollapsed(indexOfFoldingRegion);
            const foldingIcon = new StickyFoldingIcon(isCollapsed, startLineNumber, foldingRegions.getEndLineNumber(indexOfFoldingRegion), this._lineHeight);
            foldingIcon.setVisible(this._isOnGlyphMargin ? true : (isCollapsed || showFoldingControls === 'always'));
            foldingIcon.domNode.setAttribute(STICKY_IS_FOLDING_ICON_ATTR, '');
            return foldingIcon;
        }
        getId() {
            return 'editor.contrib.stickyScrollWidget';
        }
        getDomNode() {
            return this._rootDomNode;
        }
        getPosition() {
            return {
                preference: null
            };
        }
        getMinContentWidthInPx() {
            return this._minContentWidthInPx;
        }
        focusLineWithIndex(index) {
            if (0 <= index && index < this._renderedStickyLines.length) {
                this._renderedStickyLines[index].lineDomNode.focus();
            }
        }
        /**
         * Given a leaf dom node, tries to find the editor position.
         */
        getEditorPositionFromNode(spanDomNode) {
            if (!spanDomNode || spanDomNode.children.length > 0) {
                // This is not a leaf node
                return null;
            }
            const renderedStickyLine = this._getRenderedStickyLineFromChildDomNode(spanDomNode);
            if (!renderedStickyLine) {
                return null;
            }
            const column = (0, viewLine_1.getColumnOfNodeOffset)(renderedStickyLine.characterMapping, spanDomNode, 0);
            return new position_1.Position(renderedStickyLine.lineNumber, column);
        }
        getLineNumberFromChildDomNode(domNode) {
            return this._getRenderedStickyLineFromChildDomNode(domNode)?.lineNumber ?? null;
        }
        _getRenderedStickyLineFromChildDomNode(domNode) {
            const index = this.getLineIndexFromChildDomNode(domNode);
            if (index === null || index < 0 || index >= this._renderedStickyLines.length) {
                return null;
            }
            return this._renderedStickyLines[index];
        }
        /**
         * Given a child dom node, tries to find the line number attribute that was stored in the node.
         * @returns the attribute value or null if none is found.
         */
        getLineIndexFromChildDomNode(domNode) {
            const lineIndex = this._getAttributeValue(domNode, STICKY_INDEX_ATTR);
            return lineIndex ? parseInt(lineIndex, 10) : null;
        }
        /**
         * Given a child dom node, tries to find if it is (contained in) a sticky line.
         * @returns a boolean.
         */
        isInStickyLine(domNode) {
            const isInLine = this._getAttributeValue(domNode, STICKY_IS_LINE_ATTR);
            return isInLine !== undefined;
        }
        /**
         * Given a child dom node, tries to find if this dom node is (contained in) a sticky folding icon.
         * @returns a boolean.
         */
        isInFoldingIconDomNode(domNode) {
            const isInFoldingIcon = this._getAttributeValue(domNode, STICKY_IS_FOLDING_ICON_ATTR);
            return isInFoldingIcon !== undefined;
        }
        /**
         * Given the dom node, finds if it or its parent sequence contains the given attribute.
         * @returns the attribute value or undefined.
         */
        _getAttributeValue(domNode, attribute) {
            while (domNode && domNode !== this._rootDomNode) {
                const line = domNode.getAttribute(attribute);
                if (line !== null) {
                    return line;
                }
                domNode = domNode.parentElement;
            }
            return;
        }
    }
    exports.StickyScrollWidget = StickyScrollWidget;
    class RenderedStickyLine {
        constructor(index, lineNumber, lineDomNode, lineNumberDomNode, foldingIcon, characterMapping, scrollWidth) {
            this.index = index;
            this.lineNumber = lineNumber;
            this.lineDomNode = lineDomNode;
            this.lineNumberDomNode = lineNumberDomNode;
            this.foldingIcon = foldingIcon;
            this.characterMapping = characterMapping;
            this.scrollWidth = scrollWidth;
        }
    }
    class StickyFoldingIcon {
        constructor(isCollapsed, foldingStartLine, foldingEndLine, dimension) {
            this.isCollapsed = isCollapsed;
            this.foldingStartLine = foldingStartLine;
            this.foldingEndLine = foldingEndLine;
            this.dimension = dimension;
            this.domNode = document.createElement('div');
            this.domNode.style.width = `${dimension}px`;
            this.domNode.style.height = `${dimension}px`;
            this.domNode.className = themables_1.ThemeIcon.asClassName(isCollapsed ? foldingDecorations_1.foldingCollapsedIcon : foldingDecorations_1.foldingExpandedIcon);
        }
        setVisible(visible) {
            this.domNode.style.cursor = visible ? 'pointer' : 'default';
            this.domNode.style.opacity = visible ? '1' : '0';
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsV2lkZ2V0LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9zdGlja3lTY3JvbGwvYnJvd3Nlci9zdGlja3lTY3JvbGxXaWRnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBbUJoRyxNQUFhLHVCQUF1QjtRQUNuQyxZQUNVLGdCQUEwQixFQUMxQixjQUF3QixFQUN4Qix3QkFBZ0MsRUFDaEMsaUJBQWdDLElBQUk7WUFIcEMscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFVO1lBQzFCLG1CQUFjLEdBQWQsY0FBYyxDQUFVO1lBQ3hCLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBUTtZQUNoQyxtQkFBYyxHQUFkLGNBQWMsQ0FBc0I7UUFDMUMsQ0FBQztRQUVMLE1BQU0sQ0FBQyxLQUEwQztZQUNoRCxPQUFPLENBQUMsQ0FBQyxLQUFLO21CQUNWLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxLQUFLLENBQUMsd0JBQXdCO21CQUNoRSxJQUFJLENBQUMsY0FBYyxLQUFLLEtBQUssQ0FBQyxjQUFjO21CQUM1QyxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO21CQUNyRCxJQUFBLGVBQU0sRUFBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN2RCxDQUFDO0tBQ0Q7SUFmRCwwREFlQztJQUVELE1BQU0sU0FBUyxHQUFHLElBQUEsdUNBQXdCLEVBQUMsdUJBQXVCLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3BHLE1BQU0saUJBQWlCLEdBQUcsd0JBQXdCLENBQUM7SUFDbkQsTUFBTSxtQkFBbUIsR0FBRyxxQkFB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