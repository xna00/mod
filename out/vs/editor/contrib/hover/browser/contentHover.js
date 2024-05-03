/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/hover/hoverWidget", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/editor/contrib/hover/browser/hoverOperation", "vs/editor/contrib/hover/browser/hoverTypes", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/base/common/async", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/editor/contrib/hover/browser/resizableContentWidget", "vs/platform/configuration/common/configuration", "vs/platform/accessibility/common/accessibility"], function (require, exports, dom, hoverWidget_1, arrays_1, lifecycle_1, position_1, range_1, textModel_1, languages_1, hoverOperation_1, hoverTypes_1, instantiation_1, keybinding_1, async_1, editorContextKeys_1, contextkey_1, resizableContentWidget_1, configuration_1, accessibility_1) {
    "use strict";
    var ContentHoverController_1, ContentHoverWidget_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorHoverStatusBar = exports.ContentHoverWidget = exports.ContentHoverController = void 0;
    const $ = dom.$;
    let ContentHoverController = class ContentHoverController extends lifecycle_1.Disposable {
        static { ContentHoverController_1 = this; }
        constructor(_editor, _instantiationService, _keybindingService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._keybindingService = _keybindingService;
            this._currentResult = null;
            this._widget = this._register(this._instantiationService.createInstance(ContentHoverWidget, this._editor));
            // Instantiate participants and sort them by `hoverOrdinal` which is relevant for rendering order.
            this._participants = [];
            for (const participant of hoverTypes_1.HoverParticipantRegistry.getAll()) {
                this._participants.push(this._instantiationService.createInstance(participant, this._editor));
            }
            this._participants.sort((p1, p2) => p1.hoverOrdinal - p2.hoverOrdinal);
            this._computer = new ContentHoverComputer(this._editor, this._participants);
            this._hoverOperation = this._register(new hoverOperation_1.HoverOperation(this._editor, this._computer));
            this._register(this._hoverOperation.onResult((result) => {
                if (!this._computer.anchor) {
                    // invalid state, ignore result
                    return;
                }
                const messages = (result.hasLoadingMessage ? this._addLoadingMessage(result.value) : result.value);
                this._withResult(new HoverResult(this._computer.anchor, messages, result.isComplete));
            }));
            this._register(dom.addStandardDisposableListener(this._widget.getDomNode(), 'keydown', (e) => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                }
            }));
            this._register(languages_1.TokenizationRegistry.onDidChange(() => {
                if (this._widget.position && this._currentResult) {
                    this._setCurrentResult(this._currentResult); // render again
                }
            }));
        }
        /**
         * Returns true if the hover shows now or will show.
         */
        _startShowingOrUpdateHover(anchor, mode, source, focus, mouseEvent) {
            if (!this._widget.position || !this._currentResult) {
                // The hover is not visible
                if (anchor) {
                    this._startHoverOperationIfNecessary(anchor, mode, source, focus, false);
                    return true;
                }
                return false;
            }
            // The hover is currently visible
            const isHoverSticky = this._editor.getOption(60 /* EditorOption.hover */).sticky;
            const isGettingCloser = (isHoverSticky
                && mouseEvent
                && this._widget.isMouseGettingCloser(mouseEvent.event.posx, mouseEvent.event.posy));
            if (isGettingCloser) {
                // The mouse is getting closer to the hover, so we will keep the hover untouched
                // But we will kick off a hover update at the new anchor, insisting on keeping the hover visible.
                if (anchor) {
                    this._startHoverOperationIfNecessary(anchor, mode, source, focus, true);
                }
                return true;
            }
            if (!anchor) {
                this._setCurrentResult(null);
                return false;
            }
            if (anchor && this._currentResult.anchor.equals(anchor)) {
                // The widget is currently showing results for the exact same anchor, so no update is needed
                return true;
            }
            if (!anchor.canAdoptVisibleHover(this._currentResult.anchor, this._widget.position)) {
                // The new anchor is not compatible with the previous anchor
                this._setCurrentResult(null);
                this._startHoverOperationIfNecessary(anchor, mode, source, focus, false);
                return true;
            }
            // We aren't getting any closer to the hover, so we will filter existing results
            // and keep those which also apply to the new anchor.
            this._setCurrentResult(this._currentResult.filter(anchor));
            this._startHoverOperationIfNecessary(anchor, mode, source, focus, false);
            return true;
        }
        _startHoverOperationIfNecessary(anchor, mode, source, focus, insistOnKeepingHoverVisible) {
            if (this._computer.anchor && this._computer.anchor.equals(anchor)) {
                // We have to start a hover operation at the exact same anchor as before, so no work is needed
                return;
            }
            this._hoverOperation.cancel();
            this._computer.anchor = anchor;
            this._computer.shouldFocus = focus;
            this._computer.source = source;
            this._computer.insistOnKeepingHoverVisible = insistOnKeepingHoverVisible;
            this._hoverOperation.start(mode);
        }
        _setCurrentResult(hoverResult) {
            if (this._currentResult === hoverResult) {
                // avoid updating the DOM to avoid resetting the user selection
                return;
            }
            if (hoverResult && hoverResult.messages.length === 0) {
                hoverResult = null;
            }
            this._currentResult = hoverResult;
            if (this._currentResult) {
                this._renderMessages(this._currentResult.anchor, this._currentResult.messages);
            }
            else {
                this._widget.hide();
            }
        }
        _addLoadingMessage(result) {
            if (this._computer.anchor) {
                for (const participant of this._participants) {
                    if (participant.createLoadingMessage) {
                        const loadingMessage = participant.createLoadingMessage(this._computer.anchor);
                        if (loadingMessage) {
                            return result.slice(0).concat([loadingMessage]);
                        }
                    }
                }
            }
            return result;
        }
        _withResult(hoverResult) {
            if (this._widget.position && this._currentResult && this._currentResult.isComplete) {
                // The hover is visible with a previous complete result.
                if (!hoverResult.isComplete) {
                    // Instead of rendering the new partial result, we wait for the result to be complete.
                    return;
                }
                if (this._computer.insistOnKeepingHoverVisible && hoverResult.messages.length === 0) {
                    // The hover would now hide normally, so we'll keep the previous messages
                    return;
                }
            }
            this._setCurrentResult(hoverResult);
        }
        _renderMessages(anchor, messages) {
            const { showAtPosition, showAtSecondaryPosition, highlightRange } = ContentHoverController_1.computeHoverRanges(this._editor, anchor.range, messages);
            const disposables = new lifecycle_1.DisposableStore();
            const statusBar = disposables.add(new EditorHoverStatusBar(this._keybindingService));
            const fragment = document.createDocumentFragment();
            let colorPicker = null;
            const context = {
                fragment,
                statusBar,
                setColorPicker: (widget) => colorPicker = widget,
                onContentsChanged: () => this._widget.onContentsChanged(),
                setMinimumDimensions: (dimensions) => this._widget.setMinimumDimensions(dimensions),
                hide: () => this.hide()
            };
            for (const participant of this._participants) {
                const hoverParts = messages.filter(msg => msg.owner === participant);
                if (hoverParts.length > 0) {
                    disposables.add(participant.renderHoverParts(context, hoverParts));
                }
            }
            const isBeforeContent = messages.some(m => m.isBeforeContent);
            if (statusBar.hasContent) {
                fragment.appendChild(statusBar.hoverElement);
            }
            if (fragment.hasChildNodes()) {
                if (highlightRange) {
                    const highlightDecoration = this._editor.createDecorationsCollection();
                    highlightDecoration.set([{
                            range: highlightRange,
                            options: ContentHoverController_1._DECORATION_OPTIONS
                        }]);
                    disposables.add((0, lifecycle_1.toDisposable)(() => {
                        highlightDecoration.clear();
                    }));
                }
                this._widget.showAt(fragment, new ContentHoverVisibleData(anchor.initialMousePosX, anchor.initialMousePosY, colorPicker, showAtPosition, showAtSecondaryPosition, this._editor.getOption(60 /* EditorOption.hover */).above, this._computer.shouldFocus, this._computer.source, isBeforeContent, disposables));
            }
            else {
                disposables.dispose();
            }
        }
        static { this._DECORATION_OPTIONS = textModel_1.ModelDecorationOptions.register({
            description: 'content-hover-highlight',
            className: 'hoverHighlight'
        }); }
        static computeHoverRanges(editor, anchorRange, messages) {
            let startColumnBoundary = 1;
            if (editor.hasModel()) {
                // Ensure the range is on the current view line
                const viewModel = editor._getViewModel();
                const coordinatesConverter = viewModel.coordinatesConverter;
                const anchorViewRange = coordinatesConverter.convertModelRangeToViewRange(anchorRange);
                const anchorViewRangeStart = new position_1.Position(anchorViewRange.startLineNumber, viewModel.getLineMinColumn(anchorViewRange.startLineNumber));
                startColumnBoundary = coordinatesConverter.convertViewPositionToModelPosition(anchorViewRangeStart).column;
            }
            // The anchor range is always on a single line
            const anchorLineNumber = anchorRange.startLineNumber;
            let renderStartColumn = anchorRange.startColumn;
            let highlightRange = messages[0].range;
            let forceShowAtRange = null;
            for (const msg of messages) {
                highlightRange = range_1.Range.plusRange(highlightRange, msg.range);
                if (msg.range.startLineNumber === anchorLineNumber && msg.range.endLineNumber === anchorLineNumber) {
                    // this message has a range that is completely sitting on the line of the anchor
                    renderStartColumn = Math.max(Math.min(renderStartColumn, msg.range.startColumn), startColumnBoundary);
                }
                if (msg.forceShowAtRange) {
                    forceShowAtRange = msg.range;
                }
            }
            const showAtPosition = forceShowAtRange ? forceShowAtRange.getStartPosition() : new position_1.Position(anchorLineNumber, anchorRange.startColumn);
            const showAtSecondaryPosition = forceShowAtRange ? forceShowAtRange.getStartPosition() : new position_1.Position(anchorLineNumber, renderStartColumn);
            return {
                showAtPosition,
                showAtSecondaryPosition,
                highlightRange
            };
        }
        /**
         * Returns true if the hover shows now or will show.
         */
        showsOrWillShow(mouseEvent) {
            if (this._widget.isResizing) {
                return true;
            }
            const anchorCandidates = [];
            for (const participant of this._participants) {
                if (participant.suggestHoverAnchor) {
                    const anchor = participant.suggestHoverAnchor(mouseEvent);
                    if (anchor) {
                        anchorCandidates.push(anchor);
                    }
                }
            }
            const target = mouseEvent.target;
            if (target.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                anchorCandidates.push(new hoverTypes_1.HoverRangeAnchor(0, target.range, mouseEvent.event.posx, mouseEvent.event.posy));
            }
            if (target.type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                const epsilon = this._editor.getOption(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth / 2;
                if (!target.detail.isAfterLines
                    && typeof target.detail.horizontalDistanceToText === 'number'
                    && target.detail.horizontalDistanceToText < epsilon) {
                    // Let hover kick in even when the mouse is technically in the empty area after a line, given the distance is small enough
                    anchorCandidates.push(new hoverTypes_1.HoverRangeAnchor(0, target.range, mouseEvent.event.posx, mouseEvent.event.posy));
                }
            }
            if (anchorCandidates.length === 0) {
                return this._startShowingOrUpdateHover(null, 0 /* HoverStartMode.Delayed */, 0 /* HoverStartSource.Mouse */, false, mouseEvent);
            }
            anchorCandidates.sort((a, b) => b.priority - a.priority);
            return this._startShowingOrUpdateHover(anchorCandidates[0], 0 /* HoverStartMode.Delayed */, 0 /* HoverStartSource.Mouse */, false, mouseEvent);
        }
        startShowingAtRange(range, mode, source, focus) {
            this._startShowingOrUpdateHover(new hoverTypes_1.HoverRangeAnchor(0, range, undefined, undefined), mode, source, focus, null);
        }
        getWidgetContent() {
            const node = this._widget.getDomNode();
            if (!node.textContent) {
                return undefined;
            }
            return node.textContent;
        }
        containsNode(node) {
            return (node ? this._widget.getDomNode().contains(node) : false);
        }
        focus() {
            this._widget.focus();
        }
        scrollUp() {
            this._widget.scrollUp();
        }
        scrollDown() {
            this._widget.scrollDown();
        }
        scrollLeft() {
            this._widget.scrollLeft();
        }
        scrollRight() {
            this._widget.scrollRight();
        }
        pageUp() {
            this._widget.pageUp();
        }
        pageDown() {
            this._widget.pageDown();
        }
        goToTop() {
            this._widget.goToTop();
        }
        goToBottom() {
            this._widget.goToBottom();
        }
        hide() {
            this._computer.anchor = null;
            this._hoverOperation.cancel();
            this._setCurrentResult(null);
        }
        get isColorPickerVisible() {
            return this._widget.isColorPickerVisible;
        }
        get isVisibleFromKeyboard() {
            return this._widget.isVisibleFromKeyboard;
        }
        get isVisible() {
            return this._widget.isVisible;
        }
        get isFocused() {
            return this._widget.isFocused;
        }
        get isResizing() {
            return this._widget.isResizing;
        }
        get widget() {
            return this._widget;
        }
    };
    exports.ContentHoverController = ContentHoverController;
    exports.ContentHoverController = ContentHoverController = ContentHoverController_1 = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService)
    ], ContentHoverController);
    class HoverResult {
        constructor(anchor, messages, isComplete) {
            this.anchor = anchor;
            this.messages = messages;
            this.isComplete = isComplete;
        }
        filter(anchor) {
            const filteredMessages = this.messages.filter((m) => m.isValidForHoverAnchor(anchor));
            if (filteredMessages.length === this.messages.length) {
                return this;
            }
            return new FilteredHoverResult(this, this.anchor, filteredMessages, this.isComplete);
        }
    }
    class FilteredHoverResult extends HoverResult {
        constructor(original, anchor, messages, isComplete) {
            super(anchor, messages, isComplete);
            this.original = original;
        }
        filter(anchor) {
            return this.original.filter(anchor);
        }
    }
    class ContentHoverVisibleData {
        constructor(initialMousePosX, initialMousePosY, colorPicker, showAtPosition, showAtSecondaryPosition, preferAbove, stoleFocus, source, isBeforeContent, disposables) {
            this.initialMousePosX = initialMousePosX;
            this.initialMousePosY = initialMousePosY;
            this.colorPicker = colorPicker;
            this.showAtPosition = showAtPosition;
            this.showAtSecondaryPosition = showAtSecondaryPosition;
            this.preferAbove = preferAbove;
            this.stoleFocus = stoleFocus;
            this.source = source;
            this.isBeforeContent = isBeforeContent;
            this.disposables = disposables;
            this.closestMouseDistance = undefined;
        }
    }
    const HORIZONTAL_SCROLLING_BY = 30;
    const SCROLLBAR_WIDTH = 10;
    const CONTAINER_HEIGHT_PADDING = 6;
    let ContentHoverWidget = class ContentHoverWidget extends resizableContentWidget_1.ResizableContentWidget {
        static { ContentHoverWidget_1 = this; }
        static { this.ID = 'editor.contrib.resizableContentHoverWidget'; }
        static { this._lastDimensions = new dom.Dimension(0, 0); }
        get isColorPickerVisible() {
            return Boolean(this._visibleData?.colorPicker);
        }
        get isVisibleFromKeyboard() {
            return (this._visibleData?.source === 1 /* HoverStartSource.Keyboard */);
        }
        get isVisible() {
            return this._hoverVisibleKey.get() ?? false;
        }
        get isFocused() {
            return this._hoverFocusedKey.get() ?? false;
        }
        constructor(editor, contextKeyService, _configurationService, _accessibilityService, _keybindingService) {
            const minimumHeight = editor.getOption(67 /* EditorOption.lineHeight */) + 8;
            const minimumWidth = 150;
            const minimumSize = new dom.Dimension(minimumWidth, minimumHeight);
            super(editor, minimumSize);
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._keybindingService = _keybindingService;
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._minimumSize = minimumSize;
            this._hoverVisibleKey = editorContextKeys_1.EditorContextKeys.hoverVisible.bindTo(contextKeyService);
            this._hoverFocusedKey = editorContextKeys_1.EditorContextKeys.hoverFocused.bindTo(contextKeyService);
            dom.append(this._resizableNode.domNode, this._hover.containerDomNode);
            this._resizableNode.domNode.style.zIndex = '50';
            this._register(this._editor.onDidLayoutChange(() => {
                if (this.isVisible) {
                    this._updateMaxDimensions();
                }
            }));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(50 /* EditorOption.fontInfo */)) {
                    this._updateFont();
                }
            }));
            const focusTracker = this._register(dom.trackFocus(this._resizableNode.domNode));
            this._register(focusTracker.onDidFocus(() => {
                this._hoverFocusedKey.set(true);
            }));
            this._register(focusTracker.onDidBlur(() => {
                this._hoverFocusedKey.set(false);
            }));
            this._setHoverData(undefined);
            this._editor.addContentWidget(this);
        }
        dispose() {
            super.dispose();
            this._visibleData?.disposables.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return ContentHoverWidget_1.ID;
        }
        static _applyDimensions(container, width, height) {
            const transformedWidth = typeof width === 'number' ? `${width}px` : width;
            const transformedHeight = typeof height === 'number' ? `${height}px` : height;
            container.style.width = transformedWidth;
            container.style.height = transformedHeight;
        }
        _setContentsDomNodeDimensions(width, height) {
            const contentsDomNode = this._hover.contentsDomNode;
            return ContentHoverWidget_1._applyDimensions(contentsDomNode, width, height);
        }
        _setContainerDomNodeDimensions(width, height) {
            const containerDomNode = this._hover.containerDomNode;
            return ContentHoverWidget_1._applyDimensions(containerDomNode, width, height);
        }
        _setHoverWidgetDimensions(width, height) {
            this._setContentsDomNodeDimensions(width, height);
            this._setContainerDomNodeDimensions(width, height);
            this._layoutContentWidget();
        }
        static _applyMaxDimensions(container, width, height) {
            const transformedWidth = typeof width === 'number' ? `${width}px` : width;
            const transformedHeight = typeof height === 'number' ? `${height}px` : height;
            container.style.maxWidth = transformedWidth;
            container.style.maxHeight = transformedHeight;
        }
        _setHoverWidgetMaxDimensions(width, height) {
            ContentHoverWidget_1._applyMaxDimensions(this._hover.contentsDomNode, width, height);
            ContentHoverWidget_1._applyMaxDimensions(this._hover.containerDomNode, width, height);
            this._hover.containerDomNode.style.setProperty('--vscode-hover-maxWidth', typeof width === 'number' ? `${width}px` : width);
            this._layoutContentWidget();
        }
        _hasHorizontalScrollbar() {
            const scrollDimensions = this._hover.scrollbar.getScrollDimensions();
            const hasHorizontalScrollbar = scrollDimensions.scrollWidth > scrollDimensions.width;
            return hasHorizontalScrollbar;
        }
        _adjustContentsBottomPadding() {
            const contentsDomNode = this._hover.contentsDomNode;
            const extraBottomPadding = `${this._hover.scrollbar.options.horizontalScrollbarSize}px`;
            if (contentsDomNode.style.paddingBottom !== extraBottomPadding) {
                contentsDomNode.style.paddingBottom = extraBottomPadding;
            }
        }
        _setAdjustedHoverWidgetDimensions(size) {
            this._setHoverWidgetMaxDimensions('none', 'none');
            const width = size.width;
            const height = size.height;
            this._setHoverWidgetDimensions(width, height);
            // measure if widget has horizontal scrollbar after setting the dimensions
            if (this._hasHorizontalScrollbar()) {
                this._adjustContentsBottomPadding();
                this._setContentsDomNodeDimensions(width, height - SCROLLBAR_WIDTH);
            }
        }
        _updateResizableNodeMaxDimensions() {
            const maxRenderingWidth = this._findMaximumRenderingWidth() ?? Infinity;
            const maxRenderingHeight = this._findMaximumRenderingHeight() ?? Infinity;
            this._resizableNode.maxSize = new dom.Dimension(maxRenderingWidth, maxRenderingHeight);
            this._setHoverWidgetMaxDimensions(maxRenderingWidth, maxRenderingHeight);
        }
        _resize(size) {
            ContentHoverWidget_1._lastDimensions = new dom.Dimension(size.width, size.height);
            this._setAdjustedHoverWidgetDimensions(size);
            this._resizableNode.layout(size.height, size.width);
            this._updateResizableNodeMaxDimensions();
            this._hover.scrollbar.scanDomNode();
            this._editor.layoutContentWidget(this);
            this._visibleData?.colorPicker?.layout();
        }
        _findAvailableSpaceVertically() {
            const position = this._visibleData?.showAtPosition;
            if (!position) {
                return;
            }
            return this._positionPreference === 1 /* ContentWidgetPositionPreference.ABOVE */ ?
                this._availableVerticalSpaceAbove(position)
                : this._availableVerticalSpaceBelow(position);
        }
        _findMaximumRenderingHeight() {
            const availableSpace = this._findAvailableSpaceVertically();
            if (!availableSpace) {
                return;
            }
            // Padding needed in order to stop the resizing down to a smaller height
            let maximumHeight = CONTAINER_HEIGHT_PADDING;
            Array.from(this._hover.contentsDomNode.children).forEach((hoverPart) => {
                maximumHeight += hoverPart.clientHeight;
            });
            if (this._hasHorizontalScrollbar()) {
                maximumHeight += SCROLLBAR_WIDTH;
            }
            return Math.min(availableSpace, maximumHeight);
        }
        _isHoverTextOverflowing() {
            // To find out if the text is overflowing, we will disable wrapping, check the widths, and then re-enable wrapping
            this._hover.containerDomNode.style.setProperty('--vscode-hover-whiteSpace', 'nowrap');
            this._hover.containerDomNode.style.setProperty('--vscode-hover-sourceWhiteSpace', 'nowrap');
            const overflowing = Array.from(this._hover.contentsDomNode.children).some((hoverElement) => {
                return hoverElement.scrollWidth > hoverElement.clientWidth;
            });
            this._hover.containerDomNode.style.removeProperty('--vscode-hover-whiteSpace');
            this._hover.containerDomNode.style.removeProperty('--vscode-hover-sourceWhiteSpace');
            return overflowing;
        }
        _findMaximumRenderingWidth() {
            if (!this._editor || !this._editor.hasModel()) {
                return;
            }
            const overflowing = this._isHoverTextOverflowing();
            const initialWidth = (typeof this._contentWidth === 'undefined'
                ? 0
                : this._contentWidth - 2 // - 2 for the borders
            );
            if (overflowing || this._hover.containerDomNode.clientWidth < initialWidth) {
                const bodyBoxWidth = dom.getClientArea(this._hover.containerDomNode.ownerDocument.body).width;
                const horizontalPadding = 14;
                return bodyBoxWidth - horizontalPadding;
            }
            else {
                return this._hover.containerDomNode.clientWidth + 2;
            }
        }
        isMouseGettingCloser(posx, posy) {
            if (!this._visibleData) {
                return false;
            }
            if (typeof this._visibleData.initialMousePosX === 'undefined'
                || typeof this._visibleData.initialMousePosY === 'undefined') {
                this._visibleData.initialMousePosX = posx;
                this._visibleData.initialMousePosY = posy;
                return false;
            }
            const widgetRect = dom.getDomNodePagePosition(this.getDomNode());
            if (typeof this._visibleData.closestMouseDistance === 'undefined') {
                this._visibleData.closestMouseDistance = computeDistanceFromPointToRectangle(this._visibleData.initialMousePosX, this._visibleData.initialMousePosY, widgetRect.left, widgetRect.top, widgetRect.width, widgetRect.height);
            }
            const distance = computeDistanceFromPointToRectangle(posx, posy, widgetRect.left, widgetRect.top, widgetRect.width, widgetRect.height);
            if (distance > this._visibleData.closestMouseDistance + 4 /* tolerance of 4 pixels */) {
                // The mouse is getting farther away
                return false;
            }
            this._visibleData.closestMouseDistance = Math.min(this._visibleData.closestMouseDistance, distance);
            return true;
        }
        _setHoverData(hoverData) {
            this._visibleData?.disposables.dispose();
            this._visibleData = hoverData;
            this._hoverVisibleKey.set(!!hoverData);
            this._hover.containerDomNode.classList.toggle('hidden', !hoverData);
        }
        _updateFont() {
            const { fontSize, lineHeight } = this._editor.getOption(50 /* EditorOption.fontInfo */);
            const contentsDomNode = this._hover.contentsDomNode;
            contentsDomNode.style.fontSize = `${fontSize}px`;
            contentsDomNode.style.lineHeight = `${lineHeight / fontSize}`;
            const codeClasses = Array.prototype.slice.call(this._hover.contentsDomNode.getElementsByClassName('code'));
            codeClasses.forEach(node => this._editor.applyFontInfo(node));
        }
        _updateContent(node) {
            const contentsDomNode = this._hover.contentsDomNode;
            contentsDomNode.style.paddingBottom = '';
            contentsDomNode.textContent = '';
            contentsDomNode.appendChild(node);
        }
        _layoutContentWidget() {
            this._editor.layoutContentWidget(this);
            this._hover.onContentsChanged();
        }
        _updateMaxDimensions() {
            const height = Math.max(this._editor.getLayoutInfo().height / 4, 250, ContentHoverWidget_1._lastDimensions.height);
            const width = Math.max(this._editor.getLayoutInfo().width * 0.66, 500, ContentHoverWidget_1._lastDimensions.width);
            this._setHoverWidgetMaxDimensions(width, height);
        }
        _render(node, hoverData) {
            this._setHoverData(hoverData);
            this._updateFont();
            this._updateContent(node);
            this._updateMaxDimensions();
            this.onContentsChanged();
            // Simply force a synchronous render on the editor
            // such that the widget does not really render with left = '0px'
            this._editor.render();
        }
        getPosition() {
            if (!this._visibleData) {
                return null;
            }
            return {
                position: this._visibleData.showAtPosition,
                secondaryPosition: this._visibleData.showAtSecondaryPosition,
                positionAffinity: this._visibleData.isBeforeContent ? 3 /* PositionAffinity.LeftOfInjectedText */ : undefined,
                preference: [this._positionPreference ?? 1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
        showAt(node, hoverData) {
            if (!this._editor || !this._editor.hasModel()) {
                return;
            }
            this._render(node, hoverData);
            const widgetHeight = dom.getTotalHeight(this._hover.containerDomNode);
            const widgetPosition = hoverData.showAtPosition;
            this._positionPreference = this._findPositionPreference(widgetHeight, widgetPosition) ?? 1 /* ContentWidgetPositionPreference.ABOVE */;
            // See https://github.com/microsoft/vscode/issues/140339
            // TODO: Doing a second layout of the hover after force rendering the editor
            this.onContentsChanged();
            if (hoverData.stoleFocus) {
                this._hover.containerDomNode.focus();
            }
            hoverData.colorPicker?.layout();
            // The aria label overrides the label, so if we add to it, add the contents of the hover
            const hoverFocused = this._hover.containerDomNode.ownerDocument.activeElement === this._hover.containerDomNode;
            const accessibleViewHint = hoverFocused && (0, hoverWidget_1.getHoverAccessibleViewHint)(this._configurationService.getValue('accessibility.verbosity.hover') === true && this._accessibilityService.isScreenReaderOptimized(), this._keybindingService.lookupKeybinding('editor.action.accessibleView')?.getAriaLabel() ?? '');
            if (accessibleViewHint) {
                this._hover.contentsDomNode.ariaLabel = this._hover.contentsDomNode.textContent + ', ' + accessibleViewHint;
            }
        }
        hide() {
            if (!this._visibleData) {
                return;
            }
            const stoleFocus = this._visibleData.stoleFocus || this._hoverFocusedKey.get();
            this._setHoverData(undefined);
            this._resizableNode.maxSize = new dom.Dimension(Infinity, Infinity);
            this._resizableNode.clearSashHoverState();
            this._hoverFocusedKey.set(false);
            this._editor.layoutContentWidget(this);
            if (stoleFocus) {
                this._editor.focus();
            }
        }
        _removeConstraintsRenderNormally() {
            // Added because otherwise the initial size of the hover content is smaller than should be
            const layoutInfo = this._editor.getLayoutInfo();
            this._resizableNode.layout(layoutInfo.height, layoutInfo.width);
            this._setHoverWidgetDimensions('auto', 'auto');
        }
        _adjustHoverHeightForScrollbar(height) {
            const containerDomNode = this._hover.containerDomNode;
            const contentsDomNode = this._hover.contentsDomNode;
            const maxRenderingHeight = this._findMaximumRenderingHeight() ?? Infinity;
            this._setContainerDomNodeDimensions(dom.getTotalWidth(containerDomNode), Math.min(maxRenderingHeight, height));
            this._setContentsDomNodeDimensions(dom.getTotalWidth(contentsDomNode), Math.min(maxRenderingHeight, height - SCROLLBAR_WIDTH));
        }
        setMinimumDimensions(dimensions) {
            // We combine the new minimum dimensions with the previous ones
            this._minimumSize = new dom.Dimension(Math.max(this._minimumSize.width, dimensions.width), Math.max(this._minimumSize.height, dimensions.height));
            this._updateMinimumWidth();
        }
        _updateMinimumWidth() {
            const width = (typeof this._contentWidth === 'undefined'
                ? this._minimumSize.width
                : Math.min(this._contentWidth, this._minimumSize.width));
            // We want to avoid that the hover is artificially large, so we use the content width as minimum width
            this._resizableNode.minSize = new dom.Dimension(width, this._minimumSize.height);
        }
        onContentsChanged() {
            this._removeConstraintsRenderNormally();
            const containerDomNode = this._hover.containerDomNode;
            let height = dom.getTotalHeight(containerDomNode);
            let width = dom.getTotalWidth(containerDomNode);
            this._resizableNode.layout(height, width);
            this._setHoverWidgetDimensions(width, height);
            height = dom.getTotalHeight(containerDomNode);
            width = dom.getTotalWidth(containerDomNode);
            this._contentWidth = width;
            this._updateMinimumWidth();
            this._resizableNode.layout(height, width);
            if (this._hasHorizontalScrollbar()) {
                this._adjustContentsBottomPadding();
                this._adjustHoverHeightForScrollbar(height);
            }
            if (this._visibleData?.showAtPosition) {
                const widgetHeight = dom.getTotalHeight(this._hover.containerDomNode);
                this._positionPreference = this._findPositionPreference(widgetHeight, this._visibleData.showAtPosition);
            }
            this._layoutContentWidget();
        }
        focus() {
            this._hover.containerDomNode.focus();
        }
        scrollUp() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop - fontInfo.lineHeight });
        }
        scrollDown() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const fontInfo = this._editor.getOption(50 /* EditorOption.fontInfo */);
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop + fontInfo.lineHeight });
        }
        scrollLeft() {
            const scrollLeft = this._hover.scrollbar.getScrollPosition().scrollLeft;
            this._hover.scrollbar.setScrollPosition({ scrollLeft: scrollLeft - HORIZONTAL_SCROLLING_BY });
        }
        scrollRight() {
            const scrollLeft = this._hover.scrollbar.getScrollPosition().scrollLeft;
            this._hover.scrollbar.setScrollPosition({ scrollLeft: scrollLeft + HORIZONTAL_SCROLLING_BY });
        }
        pageUp() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const scrollHeight = this._hover.scrollbar.getScrollDimensions().height;
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop - scrollHeight });
        }
        pageDown() {
            const scrollTop = this._hover.scrollbar.getScrollPosition().scrollTop;
            const scrollHeight = this._hover.scrollbar.getScrollDimensions().height;
            this._hover.scrollbar.setScrollPosition({ scrollTop: scrollTop + scrollHeight });
        }
        goToTop() {
            this._hover.scrollbar.setScrollPosition({ scrollTop: 0 });
        }
        goToBottom() {
            this._hover.scrollbar.setScrollPosition({ scrollTop: this._hover.scrollbar.getScrollDimensions().scrollHeight });
        }
    };
    exports.ContentHoverWidget = ContentHoverWidget;
    exports.ContentHoverWidget = ContentHoverWidget = ContentHoverWidget_1 = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, accessibility_1.IAccessibilityService),
        __param(4, keybinding_1.IKeybindingService)
    ], ContentHoverWidget);
    let EditorHoverStatusBar = class EditorHoverStatusBar extends lifecycle_1.Disposable {
        get hasContent() {
            return this._hasContent;
        }
        constructor(_keybindingService) {
            super();
            this._keybindingService = _keybindingService;
            this._hasContent = false;
            this.hoverElement = $('div.hover-row.status-bar');
            this.actionsElement = dom.append(this.hoverElement, $('div.actions'));
        }
        addAction(actionOptions) {
            const keybinding = this._keybindingService.lookupKeybinding(actionOptions.commandId);
            const keybindingLabel = keybinding ? keybinding.getLabel() : null;
            this._hasContent = true;
            return this._register(hoverWidget_1.HoverAction.render(this.actionsElement, actionOptions, keybindingLabel));
        }
        append(element) {
            const result = dom.append(this.actionsElement, element);
            this._hasContent = true;
            return result;
        }
    };
    exports.EditorHoverStatusBar = EditorHoverStatusBar;
    exports.EditorHoverStatusBar = EditorHoverStatusBar = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], EditorHoverStatusBar);
    class ContentHoverComputer {
        get anchor() { return this._anchor; }
        set anchor(value) { this._anchor = value; }
        get shouldFocus() { return this._shouldFocus; }
        set shouldFocus(value) { this._shouldFocus = value; }
        get source() { return this._source; }
        set source(value) { this._source = value; }
        get insistOnKeepingHoverVisible() { return this._insistOnKeepingHoverVisible; }
        set insistOnKeepingHoverVisible(value) { this._insistOnKeepingHoverVisible = value; }
        constructor(_editor, _participants) {
            this._editor = _editor;
            this._participants = _participants;
            this._anchor = null;
            this._shouldFocus = false;
            this._source = 0 /* HoverStartSource.Mouse */;
            this._insistOnKeepingHoverVisible = false;
        }
        static _getLineDecorations(editor, anchor) {
            if (anchor.type !== 1 /* HoverAnchorType.Range */ && !anchor.supportsMarkerHover) {
                return [];
            }
            const model = editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            if (lineNumber > model.getLineCount()) {
                // invalid line
                return [];
            }
            const maxColumn = model.getLineMaxColumn(lineNumber);
            return editor.getLineDecorations(lineNumber).filter((d) => {
                if (d.options.isWholeLine) {
                    return true;
                }
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                if (d.options.showIfCollapsed) {
                    // Relax check around `showIfCollapsed` decorations to also include +/- 1 character
                    if (startColumn > anchor.range.startColumn + 1 || anchor.range.endColumn - 1 > endColumn) {
                        return false;
                    }
                }
                else {
                    if (startColumn > anchor.range.startColumn || anchor.range.endColumn > endColumn) {
                        return false;
                    }
                }
                return true;
            });
        }
        computeAsync(token) {
            const anchor = this._anchor;
            if (!this._editor.hasModel() || !anchor) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const lineDecorations = ContentHoverComputer._getLineDecorations(this._editor, anchor);
            return async_1.AsyncIterableObject.merge(this._participants.map((participant) => {
                if (!participant.computeAsync) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                return participant.computeAsync(anchor, lineDecorations, token);
            }));
        }
        computeSync() {
            if (!this._editor.hasModel() || !this._anchor) {
                return [];
            }
            const lineDecorations = ContentHoverComputer._getLineDecorations(this._editor, this._anchor);
            let result = [];
            for (const participant of this._participants) {
                result = result.concat(participant.computeSync(this._anchor, lineDecorations));
            }
            return (0, arrays_1.coalesce)(result);
        }
    }
    function computeDistanceFromPointToRectangle(pointX, pointY, left, top, width, height) {
        const x = (left + width / 2); // x center of rectangle
        const y = (top + height / 2); // y center of rectangle
        const dx = Math.max(Math.abs(pointX - x) - width / 2, 0);
        const dy = Math.max(Math.abs(pointY - y) - height / 2, 0);
        return Math.sqrt(dx * dx + dy * dy);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudEhvdmVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvY29udHJpYi9ob3Zlci9icm93c2VyL2NvbnRlbnRIb3Zlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBMEJoRyxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRVQsSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBVTs7UUFTckQsWUFDa0IsT0FBb0IsRUFDZCxxQkFBNkQsRUFDaEUsa0JBQXVEO1lBRTNFLEtBQUssRUFBRSxDQUFDO1lBSlMsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQUNHLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFDL0MsdUJBQWtCLEdBQWxCLGtCQUFrQixDQUFvQjtZQVZwRSxtQkFBYyxHQUF1QixJQUFJLENBQUM7WUFjakQsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFFM0csa0dBQWtHO1lBQ2xHLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLEtBQUssTUFBTSxXQUFXLElBQUkscUNBQXdCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDN0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDL0YsQ0FBQztZQUNELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxF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