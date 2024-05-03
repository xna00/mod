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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/performance", "vs/base/common/errors", "vs/editor/browser/controller/mouseTarget", "vs/editor/browser/controller/pointerHandler", "vs/editor/browser/controller/textAreaHandler", "vs/editor/browser/view/renderingContext", "vs/editor/browser/view/viewController", "vs/editor/browser/view/viewOverlays", "vs/editor/browser/view/viewPart", "vs/editor/browser/view/viewUserInputEvents", "vs/editor/browser/viewParts/blockDecorations/blockDecorations", "vs/editor/browser/viewParts/contentWidgets/contentWidgets", "vs/editor/browser/viewParts/currentLineHighlight/currentLineHighlight", "vs/editor/browser/viewParts/decorations/decorations", "vs/editor/browser/viewParts/editorScrollbar/editorScrollbar", "vs/editor/browser/viewParts/glyphMargin/glyphMargin", "vs/editor/browser/viewParts/indentGuides/indentGuides", "vs/editor/browser/viewParts/lineNumbers/lineNumbers", "vs/editor/browser/viewParts/lines/viewLines", "vs/editor/browser/viewParts/linesDecorations/linesDecorations", "vs/editor/browser/viewParts/margin/margin", "vs/editor/browser/viewParts/marginDecorations/marginDecorations", "vs/editor/browser/viewParts/minimap/minimap", "vs/editor/browser/viewParts/overlayWidgets/overlayWidgets", "vs/editor/browser/viewParts/overviewRuler/decorationsOverviewRuler", "vs/editor/browser/viewParts/overviewRuler/overviewRuler", "vs/editor/browser/viewParts/rulers/rulers", "vs/editor/browser/viewParts/scrollDecoration/scrollDecoration", "vs/editor/browser/viewParts/selections/selections", "vs/editor/browser/viewParts/viewCursors/viewCursors", "vs/editor/browser/viewParts/viewZones/viewZones", "vs/editor/browser/viewParts/whitespace/whitespace", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model", "vs/editor/common/viewEventHandler", "vs/editor/common/viewLayout/viewLinesViewportData", "vs/editor/common/viewModel/viewContext", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService"], function (require, exports, dom, fastDomNode_1, performance_1, errors_1, mouseTarget_1, pointerHandler_1, textAreaHandler_1, renderingContext_1, viewController_1, viewOverlays_1, viewPart_1, viewUserInputEvents_1, blockDecorations_1, contentWidgets_1, currentLineHighlight_1, decorations_1, editorScrollbar_1, glyphMargin_1, indentGuides_1, lineNumbers_1, viewLines_1, linesDecorations_1, margin_1, marginDecorations_1, minimap_1, overlayWidgets_1, decorationsOverviewRuler_1, overviewRuler_1, rulers_1, scrollDecoration_1, selections_1, viewCursors_1, viewZones_1, whitespace_1, position_1, range_1, selection_1, model_1, viewEventHandler_1, viewLinesViewportData_1, viewContext_1, instantiation_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.View = void 0;
    let View = class View extends viewEventHandler_1.ViewEventHandler {
        constructor(commandDelegate, configuration, colorTheme, model, userInputEvents, overflowWidgetsDomNode, _instantiationService) {
            super();
            this._instantiationService = _instantiationService;
            // Actual mutable state
            this._shouldRecomputeGlyphMarginLanes = false;
            this._selections = [new selection_1.Selection(1, 1, 1, 1)];
            this._renderAnimationFrame = null;
            const viewController = new viewController_1.ViewController(configuration, model, userInputEvents, commandDelegate);
            // The view context is passed on to most classes (basically to reduce param. counts in ctors)
            this._context = new viewContext_1.ViewContext(configuration, colorTheme, model);
            // Ensure the view is the first event handler in order to update the layout
            this._context.addEventHandler(this);
            this._viewParts = [];
            // Keyboard handler
            this._textAreaHandler = this._instantiationService.createInstance(textAreaHandler_1.TextAreaHandler, this._context, viewController, this._createTextAreaHandlerHelper());
            this._viewParts.push(this._textAreaHandler);
            // These two dom nodes must be constructed up front, since references are needed in the layout provider (scrolling & co.)
            this._linesContent = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._linesContent.setClassName('lines-content' + ' monaco-editor-background');
            this._linesContent.setPosition('absolute');
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName(this._getEditorClassName());
            // Set role 'code' for better screen reader support https://github.com/microsoft/vscode/issues/93438
            this.domNode.setAttribute('role', 'code');
            this._overflowGuardContainer = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._overflowGuardContainer, 3 /* PartFingerprint.OverflowGuard */);
            this._overflowGuardContainer.setClassName('overflow-guard');
            this._scrollbar = new editorScrollbar_1.EditorScrollbar(this._context, this._linesContent, this.domNode, this._overflowGuardContainer);
            this._viewParts.push(this._scrollbar);
            // View Lines
            this._viewLines = new viewLines_1.ViewLines(this._context, this._linesContent);
            // View Zones
            this._viewZones = new viewZones_1.ViewZones(this._context);
            this._viewParts.push(this._viewZones);
            // Decorations overview ruler
            const decorationsOverviewRuler = new decorationsOverviewRuler_1.DecorationsOverviewRuler(this._context);
            this._viewParts.push(decorationsOverviewRuler);
            const scrollDecoration = new scrollDecoration_1.ScrollDecorationViewPart(this._context);
            this._viewParts.push(scrollDecoration);
            const contentViewOverlays = new viewOverlays_1.ContentViewOverlays(this._context);
            this._viewParts.push(contentViewOverlays);
            contentViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineHighlightOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new selections_1.SelectionsOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new indentGuides_1.IndentGuidesOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new decorations_1.DecorationsOverlay(this._context));
            contentViewOverlays.addDynamicOverlay(new whitespace_1.WhitespaceOverlay(this._context));
            const marginViewOverlays = new viewOverlays_1.MarginViewOverlays(this._context);
            this._viewParts.push(marginViewOverlays);
            marginViewOverlays.addDynamicOverlay(new currentLineHighlight_1.CurrentLineMarginHighlightOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new marginDecorations_1.MarginViewLineDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new linesDecorations_1.LinesDecorationsOverlay(this._context));
            marginViewOverlays.addDynamicOverlay(new lineNumbers_1.LineNumbersOverlay(this._context));
            // Glyph margin widgets
            this._glyphMarginWidgets = new glyphMargin_1.GlyphMarginWidgets(this._context);
            this._viewParts.push(this._glyphMarginWidgets);
            const margin = new margin_1.Margin(this._context);
            margin.getDomNode().appendChild(this._viewZones.marginDomNode);
            margin.getDomNode().appendChild(marginViewOverlays.getDomNode());
            margin.getDomNode().appendChild(this._glyphMarginWidgets.domNode);
            this._viewParts.push(margin);
            // Content widgets
            this._contentWidgets = new contentWidgets_1.ViewContentWidgets(this._context, this.domNode);
            this._viewParts.push(this._contentWidgets);
            this._viewCursors = new viewCursors_1.ViewCursors(this._context);
            this._viewParts.push(this._viewCursors);
            // Overlay widgets
            this._overlayWidgets = new overlayWidgets_1.ViewOverlayWidgets(this._context, this.domNode);
            this._viewParts.push(this._overlayWidgets);
            const rulers = new rulers_1.Rulers(this._context);
            this._viewParts.push(rulers);
            const blockOutline = new blockDecorations_1.BlockDecorations(this._context);
            this._viewParts.push(blockOutline);
            const minimap = new minimap_1.Minimap(this._context);
            this._viewParts.push(minimap);
            // -------------- Wire dom nodes up
            if (decorationsOverviewRuler) {
                const overviewRulerData = this._scrollbar.getOverviewRulerLayoutInfo();
                overviewRulerData.parent.insertBefore(decorationsOverviewRuler.getDomNode(), overviewRulerData.insertBefore);
            }
            this._linesContent.appendChild(contentViewOverlays.getDomNode());
            this._linesContent.appendChild(rulers.domNode);
            this._linesContent.appendChild(this._viewZones.domNode);
            this._linesContent.appendChild(this._viewLines.getDomNode());
            this._linesContent.appendChild(this._contentWidgets.domNode);
            this._linesContent.appendChild(this._viewCursors.getDomNode());
            this._overflowGuardContainer.appendChild(margin.getDomNode());
            this._overflowGuardContainer.appendChild(this._scrollbar.getDomNode());
            this._overflowGuardContainer.appendChild(scrollDecoration.getDomNode());
            this._overflowGuardContainer.appendChild(this._textAreaHandler.textArea);
            this._overflowGuardContainer.appendChild(this._textAreaHandler.textAreaCover);
            this._overflowGuardContainer.appendChild(this._overlayWidgets.getDomNode());
            this._overflowGuardContainer.appendChild(minimap.getDomNode());
            this._overflowGuardContainer.appendChild(blockOutline.domNode);
            this.domNode.appendChild(this._overflowGuardContainer);
            if (overflowWidgetsDomNode) {
                overflowWidgetsDomNode.appendChild(this._contentWidgets.overflowingContentWidgetsDomNode.domNode);
                overflowWidgetsDomNode.appendChild(this._overlayWidgets.overflowingOverlayWidgetsDomNode.domNode);
            }
            else {
                this.domNode.appendChild(this._contentWidgets.overflowingContentWidgetsDomNode);
                this.domNode.appendChild(this._overlayWidgets.overflowingOverlayWidgetsDomNode);
            }
            this._applyLayout();
            // Pointer handler
            this._pointerHandler = this._register(new pointerHandler_1.PointerHandler(this._context, viewController, this._createPointerHandlerHelper()));
        }
        _computeGlyphMarginLanes() {
            const model = this._context.viewModel.model;
            const laneModel = this._context.viewModel.glyphLanes;
            let glyphs = [];
            let maxLineNumber = 0;
            // Add all margin decorations
            glyphs = glyphs.concat(model.getAllMarginDecorations().map((decoration) => {
                const lane = decoration.options.glyphMargin?.position ?? model_1.GlyphMarginLane.Center;
                maxLineNumber = Math.max(maxLineNumber, decoration.range.endLineNumber);
                return { range: decoration.range, lane, persist: decoration.options.glyphMargin?.persistLane };
            }));
            // Add all glyph margin widgets
            glyphs = glyphs.concat(this._glyphMarginWidgets.getWidgets().map((widget) => {
                const range = model.validateRange(widget.preference.range);
                maxLineNumber = Math.max(maxLineNumber, range.endLineNumber);
                return { range, lane: widget.preference.lane };
            }));
            // Sorted by their start position
            glyphs.sort((a, b) => range_1.Range.compareRangesUsingStarts(a.range, b.range));
            laneModel.reset(maxLineNumber);
            for (const glyph of glyphs) {
                laneModel.push(glyph.lane, glyph.range, glyph.persist);
            }
            return laneModel;
        }
        _createPointerHandlerHelper() {
            return {
                viewDomNode: this.domNode.domNode,
                linesContentDomNode: this._linesContent.domNode,
                viewLinesDomNode: this._viewLines.getDomNode().domNode,
                focusTextArea: () => {
                    this.focus();
                },
                dispatchTextAreaEvent: (event) => {
                    this._textAreaHandler.textArea.domNode.dispatchEvent(event);
                },
                getLastRenderData: () => {
                    const lastViewCursorsRenderData = this._viewCursors.getLastRenderData() || [];
                    const lastTextareaPosition = this._textAreaHandler.getLastRenderData();
                    return new mouseTarget_1.PointerHandlerLastRenderData(lastViewCursorsRenderData, lastTextareaPosition);
                },
                renderNow: () => {
                    this.render(true, false);
                },
                shouldSuppressMouseDownOnViewZone: (viewZoneId) => {
                    return this._viewZones.shouldSuppressMouseDownOnViewZone(viewZoneId);
                },
                shouldSuppressMouseDownOnWidget: (widgetId) => {
                    return this._contentWidgets.shouldSuppressMouseDownOnWidget(widgetId);
                },
                getPositionFromDOMInfo: (spanNode, offset) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.getPositionFromDOMInfo(spanNode, offset);
                },
                visibleRangeForPosition: (lineNumber, column) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.visibleRangeForPosition(new position_1.Position(lineNumber, column));
                },
                getLineWidth: (lineNumber) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.getLineWidth(lineNumber);
                }
            };
        }
        _createTextAreaHandlerHelper() {
            return {
                visibleRangeForPosition: (position) => {
                    this._flushAccumulatedAndRenderNow();
                    return this._viewLines.visibleRangeForPosition(position);
                }
            };
        }
        _applyLayout() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.domNode.setWidth(layoutInfo.width);
            this.domNode.setHeight(layoutInfo.height);
            this._overflowGuardContainer.setWidth(layoutInfo.width);
            this._overflowGuardContainer.setHeight(layoutInfo.height);
            // https://stackoverflow.com/questions/38905916/content-in-google-chrome-larger-than-16777216-px-not-being-rendered
            this._linesContent.setWidth(16777216);
            this._linesContent.setHeight(16777216);
        }
        _getEditorClassName() {
            const focused = this._textAreaHandler.isFocused() ? ' focused' : '';
            return this._context.configuration.options.get(142 /* EditorOption.editorClassName */) + ' ' + (0, themeService_1.getThemeTypeSelector)(this._context.theme.type) + focused;
        }
        // --- begin event handlers
        handleEvents(events) {
            super.handleEvents(events);
            this._scheduleRender();
        }
        onConfigurationChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            this._applyLayout();
            return false;
        }
        onCursorStateChanged(e) {
            this._selections = e.selections;
            return false;
        }
        onDecorationsChanged(e) {
            if (e.affectsGlyphMargin) {
                this._shouldRecomputeGlyphMarginLanes = true;
            }
            return false;
        }
        onFocusChanged(e) {
            this.domNode.setClassName(this._getEditorClassName());
            return false;
        }
        onThemeChanged(e) {
            this._context.theme.update(e.theme);
            this.domNode.setClassName(this._getEditorClassName());
            return false;
        }
        // --- end event handlers
        dispose() {
            if (this._renderAnimationFrame !== null) {
                this._renderAnimationFrame.dispose();
                this._renderAnimationFrame = null;
            }
            this._contentWidgets.overflowingContentWidgetsDomNode.domNode.remove();
            this._context.removeEventHandler(this);
            this._viewLines.dispose();
            // Destroy view parts
            for (const viewPart of this._viewParts) {
                viewPart.dispose();
            }
            super.dispose();
        }
        _scheduleRender() {
            if (this._store.isDisposed) {
                throw new errors_1.BugIndicatingError();
            }
            if (this._renderAnimationFrame === null) {
                const rendering = this._createCoordinatedRendering();
                this._renderAnimationFrame = EditorRenderingCoordinator.INSTANCE.scheduleCoordinatedRendering({
                    window: dom.getWindow(this.domNode.domNode),
                    prepareRenderText: () => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        try {
                            return rendering.prepareRenderText();
                        }
                        finally {
                            this._renderAnimationFrame = null;
                        }
                    },
                    renderText: () => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        return rendering.renderText();
                    },
                    prepareRender: (viewParts, ctx) => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        return rendering.prepareRender(viewParts, ctx);
                    },
                    render: (viewParts, ctx) => {
                        if (this._store.isDisposed) {
                            throw new errors_1.BugIndicatingError();
                        }
                        return rendering.render(viewParts, ctx);
                    }
                });
            }
        }
        _flushAccumulatedAndRenderNow() {
            const rendering = this._createCoordinatedRendering();
            safeInvokeNoArg(() => rendering.prepareRenderText());
            const data = safeInvokeNoArg(() => rendering.renderText());
            if (data) {
                const [viewParts, ctx] = data;
                safeInvokeNoArg(() => rendering.prepareRender(viewParts, ctx));
                safeInvokeNoArg(() => rendering.render(viewParts, ctx));
            }
        }
        _getViewPartsToRender() {
            const result = [];
            let resultLen = 0;
            for (const viewPart of this._viewParts) {
                if (viewPart.shouldRender()) {
                    result[resultLen++] = viewPart;
                }
            }
            return result;
        }
        _createCoordinatedRendering() {
            return {
                prepareRenderText: () => {
                    if (this._shouldRecomputeGlyphMarginLanes) {
                        this._shouldRecomputeGlyphMarginLanes = false;
                        const model = this._computeGlyphMarginLanes();
                        this._context.configuration.setGlyphMarginDecorationLaneCount(model.requiredLanes);
                    }
                    performance_1.inputLatency.onRenderStart();
                },
                renderText: () => {
                    if (!this.domNode.domNode.isConnected) {
                        return null;
                    }
                    let viewPartsToRender = this._getViewPartsToRender();
                    if (!this._viewLines.shouldRender() && viewPartsToRender.length === 0) {
                        // Nothing to render
                        return null;
                    }
                    const partialViewportData = this._context.viewLayout.getLinesViewportData();
                    this._context.viewModel.setViewport(partialViewportData.startLineNumber, partialViewportData.endLineNumber, partialViewportData.centeredLineNumber);
                    const viewportData = new viewLinesViewportData_1.ViewportData(this._selections, partialViewportData, this._context.viewLayout.getWhitespaceViewportData(), this._context.viewModel);
                    if (this._contentWidgets.shouldRender()) {
                        // Give the content widgets a chance to set their max width before a possible synchronous layout
                        this._contentWidgets.onBeforeRender(viewportData);
                    }
                    if (this._viewLines.shouldRender()) {
                        this._viewLines.renderText(viewportData);
                        this._viewLines.onDidRender();
                        // Rendering of viewLines might cause scroll events to occur, so collect view parts to render again
                        viewPartsToRender = this._getViewPartsToRender();
                    }
                    return [viewPartsToRender, new renderingContext_1.RenderingContext(this._context.viewLayout, viewportData, this._viewLines)];
                },
                prepareRender: (viewPartsToRender, ctx) => {
                    for (const viewPart of viewPartsToRender) {
                        viewPart.prepareRender(ctx);
                    }
                },
                render: (viewPartsToRender, ctx) => {
                    for (const viewPart of viewPartsToRender) {
                        viewPart.render(ctx);
                        viewPart.onDidRender();
                    }
                }
            };
        }
        // --- BEGIN CodeEditor helpers
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this._scrollbar.delegateVerticalScrollbarPointerDown(browserEvent);
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            this._scrollbar.delegateScrollFromMouseWheelEvent(browserEvent);
        }
        restoreState(scrollPosition) {
            this._context.viewModel.viewLayout.setScrollPosition({
                scrollTop: scrollPosition.scrollTop,
                scrollLeft: scrollPosition.scrollLeft
            }, 1 /* ScrollType.Immediate */);
            this._context.viewModel.visibleLinesStabilized();
        }
        getOffsetForColumn(modelLineNumber, modelColumn) {
            const modelPosition = this._context.viewModel.model.validatePosition({
                lineNumber: modelLineNumber,
                column: modelColumn
            });
            const viewPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(modelPosition);
            this._flushAccumulatedAndRenderNow();
            const visibleRange = this._viewLines.visibleRangeForPosition(new position_1.Position(viewPosition.lineNumber, viewPosition.column));
            if (!visibleRange) {
                return -1;
            }
            return visibleRange.left;
        }
        getTargetAtClientPoint(clientX, clientY) {
            const mouseTarget = this._pointerHandler.getTargetAtClientPoint(clientX, clientY);
            if (!mouseTarget) {
                return null;
            }
            return viewUserInputEvents_1.ViewUserInputEvents.convertViewToModelMouseTarget(mouseTarget, this._context.viewModel.coordinatesConverter);
        }
        createOverviewRuler(cssClassName) {
            return new overviewRuler_1.OverviewRuler(this._context, cssClassName);
        }
        change(callback) {
            this._viewZones.changeViewZones(callback);
            this._scheduleRender();
        }
        render(now, everything) {
            if (everything) {
                // Force everything to render...
                this._viewLines.forceShouldRender();
                for (const viewPart of this._viewParts) {
                    viewPart.forceShouldRender();
                }
            }
            if (now) {
                this._flushAccumulatedAndRenderNow();
            }
            else {
                this._scheduleRender();
            }
        }
        writeScreenReaderContent(reason) {
            this._textAreaHandler.writeScreenReaderContent(reason);
        }
        focus() {
            this._textAreaHandler.focusTextArea();
        }
        isFocused() {
            return this._textAreaHandler.isFocused();
        }
        refreshFocusState() {
            this._textAreaHandler.refreshFocusState();
        }
        setAriaOptions(options) {
            this._textAreaHandler.setAriaOptions(options);
        }
        addContentWidget(widgetData) {
            this._contentWidgets.addWidget(widgetData.widget);
            this.layoutContentWidget(widgetData);
            this._scheduleRender();
        }
        layoutContentWidget(widgetData) {
            this._contentWidgets.setWidgetPosition(widgetData.widget, widgetData.position?.position ?? null, widgetData.position?.secondaryPosition ?? null, widgetData.position?.preference ?? null, widgetData.position?.positionAffinity ?? null);
            this._scheduleRender();
        }
        removeContentWidget(widgetData) {
            this._contentWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
        addOverlayWidget(widgetData) {
            this._overlayWidgets.addWidget(widgetData.widget);
            this.layoutOverlayWidget(widgetData);
            this._scheduleRender();
        }
        layoutOverlayWidget(widgetData) {
            const newPreference = widgetData.position ? widgetData.position.preference : null;
            const shouldRender = this._overlayWidgets.setWidgetPosition(widgetData.widget, newPreference);
            if (shouldRender) {
                this._scheduleRender();
            }
        }
        removeOverlayWidget(widgetData) {
            this._overlayWidgets.removeWidget(widgetData.widget);
            this._scheduleRender();
        }
        addGlyphMarginWidget(widgetData) {
            this._glyphMarginWidgets.addWidget(widgetData.widget);
            this._shouldRecomputeGlyphMarginLanes = true;
            this._scheduleRender();
        }
        layoutGlyphMarginWidget(widgetData) {
            const newPreference = widgetData.position;
            const shouldRender = this._glyphMarginWidgets.setWidgetPosition(widgetData.widget, newPreference);
            if (shouldRender) {
                this._shouldRecomputeGlyphMarginLanes = true;
                this._scheduleRender();
            }
        }
        removeGlyphMarginWidget(widgetData) {
            this._glyphMarginWidgets.removeWidget(widgetData.widget);
            this._shouldRecomputeGlyphMarginLanes = true;
            this._scheduleRender();
        }
    };
    exports.View = View;
    exports.View = View = __decorate([
        __param(6, instantiation_1.IInstantiationService)
    ], View);
    function safeInvokeNoArg(func) {
        try {
            return func();
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
            return null;
        }
    }
    class EditorRenderingCoordinator {
        static { this.INSTANCE = new EditorRenderingCoordinator(); }
        constructor() {
            this._coordinatedRenderings = [];
            this._animationFrameRunners = new Map();
        }
        scheduleCoordinatedRendering(rendering) {
            this._coordinatedRenderings.push(rendering);
            this._scheduleRender(rendering.window);
            return {
                dispose: () => {
                    const renderingIndex = this._coordinatedRenderings.indexOf(rendering);
                    if (renderingIndex === -1) {
                        return;
                    }
                    this._coordinatedRenderings.splice(renderingIndex, 1);
                    if (this._coordinatedRenderings.length === 0) {
                        // There are no more renderings to coordinate => cancel animation frames
                        for (const [_, disposable] of this._animationFrameRunners) {
                            disposable.dispose();
                        }
                        this._animationFrameRunners.clear();
                    }
                }
            };
        }
        _scheduleRender(window) {
            if (!this._animationFrameRunners.has(window)) {
                const runner = () => {
                    this._animationFrameRunners.delete(window);
                    this._onRenderScheduled();
                };
                this._animationFrameRunners.set(window, dom.runAtThisOrScheduleAtNextAnimationFrame(window, runner, 100));
            }
        }
        _onRenderScheduled() {
            const coordinatedRenderings = this._coordinatedRenderings.slice(0);
            this._coordinatedRenderings = [];
            for (const rendering of coordinatedRenderings) {
                safeInvokeNoArg(() => rendering.prepareRenderText());
            }
            const datas = [];
            for (let i = 0, len = coordinatedRenderings.length; i < len; i++) {
                const rendering = coordinatedRenderings[i];
                datas[i] = safeInvokeNoArg(() => rendering.renderText());
            }
            for (let i = 0, len = coordinatedRenderings.length; i < len; i++) {
                const rendering = coordinatedRenderings[i];
                const data = datas[i];
                if (!data) {
                    continue;
                }
                const [viewParts, ctx] = data;
                safeInvokeNoArg(() => rendering.prepareRender(viewParts, ctx));
            }
            for (let i = 0, len = coordinatedRenderings.length; i < len; i++) {
                const rendering = coordinatedRenderings[i];
                const data = datas[i];
                if (!data) {
                    continue;
                }
                const [viewParts, ctx] = data;
                safeInvokeNoArg(() => rendering.render(viewParts, ctx));
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7Ozs7SUF3RXpGLElBQU0sSUFBSSxHQUFWLE1BQU0sSUFBSyxTQUFRLG1DQUFnQjtRQTZCekMsWUFDQyxlQUFpQyxFQUNqQyxhQUFtQyxFQUNuQyxVQUF1QixFQUN2QixLQUFpQixFQUNqQixlQUFvQyxFQUNwQyxzQkFBK0MsRUFDeEIscUJBQTZEO1lBRXBGLEtBQUssRUFBRSxDQUFDO1lBRmdDLDBCQUFxQixHQUFyQixxQkFBcUIsQ0FBdUI7WUFYckYsdUJBQXVCO1lBQ2YscUNBQWdDLEdBQVksS0FBSyxDQUFDO1lBYXpELElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxJQUFJLHFCQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDO1lBRWxDLE1BQU0sY0FBYyxHQUFHLElBQUksK0JBQWMsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUVsRyw2RkFBNkY7WUFDN0YsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLHlCQUFXLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUVsRSwyRUFBMkU7WUFDM0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFFckIsbUJBQW1CO1lBQ25CLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsY0FBYyxDQUFD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