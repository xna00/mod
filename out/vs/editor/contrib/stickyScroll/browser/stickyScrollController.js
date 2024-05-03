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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/services/languageFeatures", "./stickyScrollWidget", "./stickyScrollProvider", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/common/core/range", "vs/editor/contrib/gotoSymbol/browser/goToSymbol", "vs/editor/contrib/inlayHints/browser/inlayHintsLocations", "vs/editor/common/core/position", "vs/base/common/cancellation", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/base/browser/dom", "vs/editor/contrib/stickyScroll/browser/stickyScrollElement", "vs/base/browser/mouseEvent", "vs/editor/contrib/folding/browser/folding", "vs/editor/contrib/folding/browser/foldingModel"], function (require, exports, lifecycle_1, languageFeatures_1, stickyScrollWidget_1, stickyScrollProvider_1, instantiation_1, contextView_1, actions_1, contextkey_1, editorContextKeys_1, clickLinkGesture_1, range_1, goToSymbol_1, inlayHintsLocations_1, position_1, cancellation_1, languageConfigurationRegistry_1, languageFeatureDebounce_1, dom, stickyScrollElement_1, mouseEvent_1, folding_1, foldingModel_1) {
    "use strict";
    var StickyScrollController_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StickyScrollController = void 0;
    let StickyScrollController = class StickyScrollController extends lifecycle_1.Disposable {
        static { StickyScrollController_1 = this; }
        static { this.ID = 'store.contrib.stickyScrollController'; }
        constructor(_editor, _contextMenuService, _languageFeaturesService, _instaService, _languageConfigurationService, _languageFeatureDebounceService, _contextKeyService) {
            super();
            this._editor = _editor;
            this._contextMenuService = _contextMenuService;
            this._languageFeaturesService = _languageFeaturesService;
            this._instaService = _instaService;
            this._contextKeyService = _contextKeyService;
            this._sessionStore = new lifecycle_1.DisposableStore();
            this._foldingModel = null;
            this._maxStickyLines = Number.MAX_SAFE_INTEGER;
            this._candidateDefinitionsLength = -1;
            this._focusedStickyElementIndex = -1;
            this._enabled = false;
            this._focused = false;
            this._positionRevealed = false;
            this._onMouseDown = false;
            this._endLineNumbers = [];
            this._showEndForLine = null;
            this._stickyScrollWidget = new stickyScrollWidget_1.StickyScrollWidget(this._editor);
            this._stickyLineCandidateProvider = new stickyScrollProvider_1.StickyLineCandidateProvider(this._editor, _languageFeaturesService, _languageConfigurationService);
            this._register(this._stickyScrollWidget);
            this._register(this._stickyLineCandidateProvider);
            this._widgetState = new stickyScrollWidget_1.StickyScrollWidgetState([], [], 0);
            this._onDidResize();
            this._readConfiguration();
            const stickyScrollDomNode = this._stickyScrollWidget.getDomNode();
            this._register(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(115 /* EditorOption.stickyScroll */)
                    || e.hasChanged(73 /* EditorOption.minimap */)
                    || e.hasChanged(67 /* EditorOption.lineHeight */)
                    || e.hasChanged(110 /* EditorOption.showFoldingControls */)) {
                    this._readConfiguration();
                }
            }));
            this._register(dom.addDisposableListener(stickyScrollDomNode, dom.EventType.CONTEXT_MENU, async (event) => {
                this._onContextMenu(dom.getWindow(stickyScrollDomNode), event);
            }));
            this._stickyScrollFocusedContextKey = editorContextKeys_1.EditorContextKeys.stickyScrollFocused.bindTo(this._contextKeyService);
            this._stickyScrollVisibleContextKey = editorContextKeys_1.EditorContextKeys.stickyScrollVisible.bindTo(this._contextKeyService);
            const focusTracker = this._register(dom.trackFocus(stickyScrollDomNode));
            this._register(focusTracker.onDidBlur(_ => {
                // Suppose that the blurring is caused by scrolling, then keep the focus on the sticky scroll
                // This is determined by the fact that the height of the widget has become zero and there has been no position revealing
                if (this._positionRevealed === false && stickyScrollDomNode.clientHeight === 0) {
                    this._focusedStickyElementIndex = -1;
                    this.focus();
                }
                // In all other casees, dispose the focus on the sticky scroll
                else {
                    this._disposeFocusStickyScrollStore();
                }
            }));
            this._register(focusTracker.onDidFocus(_ => {
                this.focus();
            }));
            this._registerMouseListeners();
            // Suppose that mouse down on the sticky scroll, then do not focus on the sticky scroll because this will be followed by the revealing of a position
            this._register(dom.addDisposableListener(stickyScrollDomNode, dom.EventType.MOUSE_DOWN, (e) => {
                this._onMouseDown = true;
            }));
        }
        get stickyScrollCandidateProvider() {
            return this._stickyLineCandidateProvider;
        }
        get stickyScrollWidgetState() {
            return this._widgetState;
        }
        static get(editor) {
            return editor.getContribution(StickyScrollController_1.ID);
        }
        _disposeFocusStickyScrollStore() {
            this._stickyScrollFocusedContextKey.set(false);
            this._focusDisposableStore?.dispose();
            this._focused = false;
            this._positionRevealed = false;
            this._onMouseDown = false;
        }
        focus() {
            // If the mouse is down, do not focus on the sticky scroll
            if (this._onMouseDown) {
                this._onMouseDown = false;
                this._editor.focus();
                return;
            }
            const focusState = this._stickyScrollFocusedContextKey.get();
            if (focusState === true) {
                return;
            }
            this._focused = true;
            this._focusDisposableStore = new lifecycle_1.DisposableStore();
            this._stickyScrollFocusedContextKey.set(true);
            this._focusedStickyElementIndex = this._stickyScrollWidget.lineNumbers.length - 1;
            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
        }
        focusNext() {
            if (this._focusedStickyElementIndex < this._stickyScrollWidget.lineNumberCount - 1) {
                this._focusNav(true);
            }
        }
        focusPrevious() {
            if (this._focusedStickyElementIndex > 0) {
                this._focusNav(false);
            }
        }
        selectEditor() {
            this._editor.focus();
        }
        // True is next, false is previous
        _focusNav(direction) {
            this._focusedStickyElementIndex = direction ? this._focusedStickyElementIndex + 1 : this._focusedStickyElementIndex - 1;
            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
        }
        goToFocused() {
            const lineNumbers = this._stickyScrollWidget.lineNumbers;
            this._disposeFocusStickyScrollStore();
            this._revealPosition({ lineNumber: lineNumbers[this._focusedStickyElementIndex], column: 1 });
        }
        _revealPosition(position) {
            this._reveaInEditor(position, () => this._editor.revealPosition(position));
        }
        _revealLineInCenterIfOutsideViewport(position) {
            this._reveaInEditor(position, () => this._editor.revealLineInCenterIfOutsideViewport(position.lineNumber, 0 /* ScrollType.Smooth */));
        }
        _reveaInEditor(position, revealFunction) {
            if (this._focused) {
                this._disposeFocusStickyScrollStore();
            }
            this._positionRevealed = true;
            revealFunction();
            this._editor.setSelection(range_1.Range.fromPositions(position));
            this._editor.focus();
        }
        _registerMouseListeners() {
            const sessionStore = this._register(new lifecycle_1.DisposableStore());
            const gesture = this._register(new clickLinkGesture_1.ClickLinkGesture(this._editor, {
                extractLineNumberFromMouseEvent: (e) => {
                    const position = this._stickyScrollWidget.getEditorPositionFromNode(e.target.element);
                    return position ? position.lineNumber : 0;
                }
            }));
            const getMouseEventTarget = (mouseEvent) => {
                if (!this._editor.hasModel()) {
                    return null;
                }
                if (mouseEvent.target.type !== 12 /* MouseTargetType.OVERLAY_WIDGET */ || mouseEvent.target.detail !== this._stickyScrollWidget.getId()) {
                    // not hovering over our widget
                    return null;
                }
                const mouseTargetElement = mouseEvent.target.element;
                if (!mouseTargetElement || mouseTargetElement.innerText !== mouseTargetElement.innerHTML) {
                    // not on a span element rendering text
                    return null;
                }
                const position = this._stickyScrollWidget.getEditorPositionFromNode(mouseTargetElement);
                if (!position) {
                    // not hovering a sticky scroll line
                    return null;
                }
                return {
                    range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + mouseTargetElement.innerText.length),
                    textElement: mouseTargetElement
                };
            };
            const stickyScrollWidgetDomNode = this._stickyScrollWidget.getDomNode();
            this._register(dom.addStandardDisposableListener(stickyScrollWidgetDomNode, dom.EventType.CLICK, (mouseEvent) => {
                if (mouseEvent.ctrlKey || mouseEvent.altKey || mouseEvent.metaKey) {
                    // modifier pressed
                    return;
                }
                if (!mouseEvent.leftButton) {
                    // not left click
                    return;
                }
                if (mouseEvent.shiftKey) {
                    // shift click
                    const lineIndex = this._stickyScrollWidget.getLineIndexFromChildDomNode(mouseEvent.target);
                    if (lineIndex === null) {
                        return;
                    }
                    const position = new position_1.Position(this._endLineNumbers[lineIndex], 1);
                    this._revealLineInCenterIfOutsideViewport(position);
                    return;
                }
                const isInFoldingIconDomNode = this._stickyScrollWidget.isInFoldingIconDomNode(mouseEvent.target);
                if (isInFoldingIconDomNode) {
                    // clicked on folding icon
                    const lineNumber = this._stickyScrollWidget.getLineNumberFromChildDomNode(mouseEvent.target);
                    this._toggleFoldingRegionForLine(lineNumber);
                    return;
                }
                const isInStickyLine = this._stickyScrollWidget.isInStickyLine(mouseEvent.target);
                if (!isInStickyLine) {
                    return;
                }
                // normal click
                let position = this._stickyScrollWidget.getEditorPositionFromNode(mouseEvent.target);
                if (!position) {
                    const lineNumber = this._stickyScrollWidget.getLineNumberFromChildDomNode(mouseEvent.target);
                    if (lineNumber === null) {
                        // not hovering a sticky scroll line
                        return;
                    }
                    position = new position_1.Position(lineNumber, 1);
                }
                this._revealPosition(position);
            }));
            this._register(dom.addStandardDisposableListener(stickyScrollWidgetDomNode, dom.EventType.MOUSE_MOVE, (mouseEvent) => {
                if (mouseEvent.shiftKey) {
                    const currentEndForLineIndex = this._stickyScrollWidget.getLineIndexFromChildDomNode(mouseEvent.target);
                    if (currentEndForLineIndex === null || this._showEndForLine !== null && this._showEndForLine === currentEndForLineIndex) {
                        return;
                    }
                    this._showEndForLine = currentEndForLineIndex;
                    this._renderStickyScroll();
                    return;
                }
                if (this._showEndForLine !== null) {
                    this._showEndForLine = null;
                    this._renderStickyScroll();
                }
            }));
            this._register(dom.addDisposableListener(stickyScrollWidgetDomNode, dom.EventType.MOUSE_LEAVE, (e) => {
                if (this._showEndForLine !== null) {
                    this._showEndForLine = null;
                    this._renderStickyScroll();
                }
            }));
            this._register(gesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, _keyboardEvent]) => {
                const mouseTarget = getMouseEventTarget(mouseEvent);
                if (!mouseTarget || !mouseEvent.hasTriggerModifier || !this._editor.hasModel()) {
                    sessionStore.clear();
                    return;
                }
                const { range, textElement } = mouseTarget;
                if (!range.equalsRange(this._stickyRangeProjectedOnEditor)) {
                    this._stickyRangeProjectedOnEditor = range;
                    sessionStore.clear();
                }
                else if (textElement.style.textDecoration === 'underline') {
                    return;
                }
                const cancellationToken = new cancellation_1.CancellationTokenSource();
                sessionStore.add((0, lifecycle_1.toDisposable)(() => cancellationToken.dispose(true)));
                let currentHTMLChild;
                (0, goToSymbol_1.getDefinitionsAtPosition)(this._languageFeaturesService.definitionProvider, this._editor.getModel(), new position_1.Position(range.startLineNumber, range.startColumn + 1), cancellationToken.token).then((candidateDefinitions => {
                    if (cancellationToken.token.isCancellationRequested) {
                        return;
                    }
                    if (candidateDefinitions.length !== 0) {
                        this._candidateDefinitionsLength = candidateDefinitions.length;
                        const childHTML = textElement;
                        if (currentHTMLChild !== childHTML) {
                            sessionStore.clear();
                            currentHTMLChild = childHTML;
                            currentHTMLChild.style.textDecoration = 'underline';
                            sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                                currentHTMLChild.style.textDecoration = 'none';
                            }));
                        }
                        else if (!currentHTMLChild) {
                            currentHTMLChild = childHTML;
                            currentHTMLChild.style.textDecoration = 'underline';
                            sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                                currentHTMLChild.style.textDecoration = 'none';
                            }));
                        }
                    }
                    else {
                        sessionStore.clear();
                    }
                }));
            }));
            this._register(gesture.onCancel(() => {
                sessionStore.clear();
            }));
            this._register(gesture.onExecute(async (e) => {
                if (e.target.type !== 12 /* MouseTargetType.OVERLAY_WIDGET */ || e.target.detail !== this._stickyScrollWidget.getId()) {
                    // not hovering over our widget
                    return;
                }
                const position = this._stickyScrollWidget.getEditorPositionFromNode(e.target.element);
                if (!position) {
                    // not hovering a sticky scroll line
                    return;
                }
                if (!this._editor.hasModel() || !this._stickyRangeProjectedOnEditor) {
                    return;
                }
                if (this._candidateDefinitionsLength > 1) {
                    if (this._focused) {
                        this._disposeFocusStickyScrollStore();
                    }
                    this._revealPosition({ lineNumber: position.lineNumber, column: 1 });
                }
                this._instaService.invokeFunction(inlayHintsLocations_1.goToDefinitionWithLocation, e, this._editor, { uri: this._editor.getModel().uri, range: this._stickyRangeProjectedOnEditor });
            }));
        }
        _onContextMenu(targetWindow, e) {
            const event = new mouseEvent_1.StandardMouseEvent(targetWindow, e);
            this._contextMenuService.showContextMenu({
                menuId: actions_1.MenuId.StickyScrollContext,
                getAnchor: () => event,
            });
        }
        _toggleFoldingRegionForLine(line) {
            if (!this._foldingModel || line === null) {
                return;
            }
            const stickyLine = this._stickyScrollWidget.getRenderedStickyLine(line);
            const foldingIcon = stickyLine?.foldingIcon;
            if (!foldingIcon) {
                return;
            }
            (0, foldingModel_1.toggleCollapseState)(this._foldingModel, Number.MAX_VALUE, [line]);
            foldingIcon.isCollapsed = !foldingIcon.isCollapsed;
            const scrollTop = (foldingIcon.isCollapsed ?
                this._editor.getTopForLineNumber(foldingIcon.foldingEndLine)
                : this._editor.getTopForLineNumber(foldingIcon.foldingStartLine))
                - this._editor.getOption(67 /* EditorOption.lineHeight */) * stickyLine.index + 1;
            this._editor.setScrollTop(scrollTop);
            this._renderStickyScroll(line);
        }
        _readConfiguration() {
            const options = this._editor.getOption(115 /* EditorOption.stickyScroll */);
            if (options.enabled === false) {
                this._editor.removeOverlayWidget(this._stickyScrollWidget);
                this._sessionStore.clear();
                this._enabled = false;
                return;
            }
            else if (options.enabled && !this._enabled) {
                // When sticky scroll was just enabled, add the listeners on the sticky scroll
                this._editor.addOverlayWidget(this._stickyScrollWidget);
                this._sessionStore.add(this._editor.onDidScrollChange((e) => {
                    if (e.scrollTopChanged) {
                        this._showEndForLine = null;
                        this._renderStickyScroll();
                    }
                }));
                this._sessionStore.add(this._editor.onDidLayoutChange(() => this._onDidResize()));
                this._sessionStore.add(this._editor.onDidChangeModelTokens((e) => this._onTokensChange(e)));
                this._sessionStore.add(this._stickyLineCandidateProvider.onDidChangeStickyScroll(() => {
                    this._showEndForLine = null;
                    this._renderStickyScroll();
                }));
                this._enabled = true;
            }
            const lineNumberOption = this._editor.getOption(68 /* EditorOption.lineNumbers */);
            if (lineNumberOption.renderType === 2 /* RenderLineNumbersType.Relative */) {
                this._sessionStore.add(this._editor.onDidChangeCursorPosition(() => {
                    this._showEndForLine = null;
                    this._renderStickyScroll(0);
                }));
            }
        }
        _needsUpdate(event) {
            const stickyLineNumbers = this._stickyScrollWidget.getCurrentLines();
            for (const stickyLineNumber of stickyLineNumbers) {
                for (const range of event.ranges) {
                    if (stickyLineNumber >= range.fromLineNumber && stickyLineNumber <= range.toLineNumber) {
                        return true;
                    }
                }
            }
            return false;
        }
        _onTokensChange(event) {
            if (this._needsUpdate(event)) {
                // Rebuilding the whole widget from line 0
                this._renderStickyScroll(0);
            }
        }
        _onDidResize() {
            const layoutInfo = this._editor.getLayoutInfo();
            // Make sure sticky scroll doesn't take up more than 25% of the editor
            const theoreticalLines = layoutInfo.height / this._editor.getOption(67 /* EditorOption.lineHeight */);
            this._maxStickyLines = Math.round(theoreticalLines * .25);
        }
        async _renderStickyScroll(rebuildFromLine) {
            const model = this._editor.getModel();
            if (!model || model.isTooLargeForTokenization()) {
                this._foldingModel = null;
                this._stickyScrollWidget.setState(undefined, null);
                return;
            }
            const stickyLineVersion = this._stickyLineCandidateProvider.getVersionId();
            if (stickyLineVersion === undefined || stickyLineVersion === model.getVersionId()) {
                this._foldingModel = await folding_1.FoldingController.get(this._editor)?.getFoldingModel() ?? null;
                this._widgetState = this.findScrollWidgetState();
                this._stickyScrollVisibleContextKey.set(!(this._widgetState.startLineNumbers.length === 0));
                if (!this._focused) {
                    this._stickyScrollWidget.setState(this._widgetState, this._foldingModel, rebuildFromLine);
                }
                else {
                    // Suppose that previously the sticky scroll widget had height 0, then if there are visible lines, set the last line as focused
                    if (this._focusedStickyElementIndex === -1) {
                        this._stickyScrollWidget.setState(this._widgetState, this._foldingModel, rebuildFromLine);
                        this._focusedStickyElementIndex = this._stickyScrollWidget.lineNumberCount - 1;
                        if (this._focusedStickyElementIndex !== -1) {
                            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
                        }
                    }
                    else {
                        const focusedStickyElementLineNumber = this._stickyScrollWidget.lineNumbers[this._focusedStickyElementIndex];
                        this._stickyScrollWidget.setState(this._widgetState, this._foldingModel, rebuildFromLine);
                        // Suppose that after setting the state, there are no sticky lines, set the focused index to -1
                        if (this._stickyScrollWidget.lineNumberCount === 0) {
                            this._focusedStickyElementIndex = -1;
                        }
                        else {
                            const previousFocusedLineNumberExists = this._stickyScrollWidget.lineNumbers.includes(focusedStickyElementLineNumber);
                            // If the line number is still there, do not change anything
                            // If the line number is not there, set the new focused line to be the last line
                            if (!previousFocusedLineNumberExists) {
                                this._focusedStickyElementIndex = this._stickyScrollWidget.lineNumberCount - 1;
                            }
                            this._stickyScrollWidget.focusLineWithIndex(this._focusedStickyElementIndex);
                        }
                    }
                }
            }
        }
        findScrollWidgetState() {
            const lineHeight = this._editor.getOption(67 /* EditorOption.lineHeight */);
            const maxNumberStickyLines = Math.min(this._maxStickyLines, this._editor.getOption(115 /* EditorOption.stickyScroll */).maxLineCount);
            const scrollTop = this._editor.getScrollTop();
            let lastLineRelativePosition = 0;
            const startLineNumbers = [];
            const endLineNumbers = [];
            const arrayVisibleRanges = this._editor.getVisibleRanges();
            if (arrayVisibleRanges.length !== 0) {
                const fullVisibleRange = new stickyScrollElement_1.StickyRange(arrayVisibleRanges[0].startLineNumber, arrayVisibleRanges[arrayVisibleRanges.length - 1].endLineNumber);
                const candidateRanges = this._stickyLineCandidateProvider.getCandidateStickyLinesIntersecting(fullVisibleRange);
                for (const range of candidateRanges) {
                    const start = range.startLineNumber;
                    const end = range.endLineNumber;
                    const depth = range.nestingDepth;
                    if (end - start > 0) {
                        const topOfElementAtDepth = (depth - 1) * lineHeight;
                        const bottomOfElementAtDepth = depth * lineHeight;
                        const bottomOfBeginningLine = this._editor.getBottomForLineNumber(start) - scrollTop;
                        const topOfEndLine = this._editor.getTopForLineNumber(end) - scrollTop;
                        const bottomOfEndLine = this._editor.getBottomForLineNumber(end) - scrollTop;
                        if (topOfElementAtDepth > topOfEndLine && topOfElementAtDepth <= bottomOfEndLine) {
                            startLineNumbers.push(start);
                            endLineNumbers.push(end + 1);
                            lastLineRelativePosition = bottomOfEndLine - bottomOfElementAtDepth;
                            break;
                        }
                        else if (bottomOfElementAtDepth > bottomOfBeginningLine && bottomOfElementAtDepth <= bottomOfEndLine) {
                            startLineNumbers.push(start);
                            endLineNumbers.push(end + 1);
                        }
                        if (startLineNumbers.length === maxNumberStickyLines) {
                            break;
                        }
                    }
                }
            }
            this._endLineNumbers = endLineNumbers;
            return new stickyScrollWidget_1.StickyScrollWidgetState(startLineNumbers, endLineNumbers, lastLineRelativePosition, this._showEndForLine);
        }
        dispose() {
            super.dispose();
            this._sessionStore.dispose();
        }
    };
    exports.StickyScrollController = StickyScrollController;
    exports.StickyScrollController = StickyScrollController = StickyScrollController_1 = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(5, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(6, contextkey_1.IContextKeyService)
    ], StickyScrollController);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RpY2t5U2Nyb2xsQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvc3RpY2t5U2Nyb2xsL2Jyb3dzZXIvc3RpY2t5U2Nyb2xsQ29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7O0lBeUN6RixJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFVOztpQkFFckMsT0FBRSxHQUFHLHNDQUFzQyxBQUF6QyxDQUEwQztRQXlCNUQsWUFDa0IsT0FBb0IsRUFDaEIsbUJBQXlELEVBQ3BELHdCQUFtRSxFQUN0RSxhQUFxRCxFQUM3Qyw2QkFBNEQsRUFDMUQsK0JBQWdFLEVBQzdFLGtCQUF1RDtZQUUzRSxLQUFLLEVBQUUsQ0FBQztZQVJTLFlBQU8sR0FBUCxPQUFPLENBQWE7WUFDQyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1lBQ25DLDZCQUF3QixHQUF4Qix3QkFBd0IsQ0FBMEI7WUFDckQsa0JBQWEsR0FBYixhQUFhLENBQXVCO1lBR3ZDLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBb0I7WUE1QjNELGtCQUFhLEdBQW9CLElBQUksMkJBQWUsRUFBRSxDQUFDO1lBR2hFLGtCQUFhLEdBQXdCLElBQUksQ0FBQztZQUMxQyxvQkFBZSxHQUFXLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUdsRCxnQ0FBMkIsR0FBVyxDQUFDLENBQUMsQ0FBQztZQU16QywrQkFBMEIsR0FBVyxDQUFDLENBQUMsQ0FBQztZQUN4QyxhQUFRLEdBQUcsS0FBSyxDQUFDO1lBQ2pCLGFBQVEsR0FBRyxLQUFLLENBQUM7WUFDakIsc0JBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQzFCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLG9CQUFlLEdBQWEsRUFB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