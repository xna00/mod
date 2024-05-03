/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/controller/mouseTarget", "vs/editor/browser/editorDom", "vs/editor/common/config/editorZoom", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/viewEventHandler", "vs/base/browser/ui/scrollbar/scrollableElement"], function (require, exports, dom, mouseEvent_1, lifecycle_1, platform, mouseTarget_1, editorDom_1, editorZoom_1, position_1, selection_1, viewEventHandler_1, scrollableElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MouseHandler = void 0;
    class MouseHandler extends viewEventHandler_1.ViewEventHandler {
        constructor(context, viewController, viewHelper) {
            super();
            this._mouseLeaveMonitor = null;
            this._context = context;
            this.viewController = viewController;
            this.viewHelper = viewHelper;
            this.mouseTargetFactory = new mouseTarget_1.MouseTargetFactory(this._context, viewHelper);
            this._mouseDownOperation = this._register(new MouseDownOperation(this._context, this.viewController, this.viewHelper, this.mouseTargetFactory, (e, testEventTarget) => this._createMouseTarget(e, testEventTarget), (e) => this._getMouseColumn(e)));
            this.lastMouseLeaveTime = -1;
            this._height = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).height;
            const mouseEvents = new editorDom_1.EditorMouseEventFactory(this.viewHelper.viewDomNode);
            this._register(mouseEvents.onContextMenu(this.viewHelper.viewDomNode, (e) => this._onContextMenu(e, true)));
            this._register(mouseEvents.onMouseMove(this.viewHelper.viewDomNode, (e) => {
                this._onMouseMove(e);
                // See https://github.com/microsoft/vscode/issues/138789
                // When moving the mouse really quickly, the browser sometimes forgets to
                // send us a `mouseleave` or `mouseout` event. We therefore install here
                // a global `mousemove` listener to manually recover if the mouse goes outside
                // the editor. As soon as the mouse leaves outside of the editor, we
                // remove this listener
                if (!this._mouseLeaveMonitor) {
                    this._mouseLeaveMonitor = dom.addDisposableListener(this.viewHelper.viewDomNode.ownerDocument, 'mousemove', (e) => {
                        if (!this.viewHelper.viewDomNode.contains(e.target)) {
                            // went outside the editor!
                            this._onMouseLeave(new editorDom_1.EditorMouseEvent(e, false, this.viewHelper.viewDomNode));
                        }
                    });
                }
            }));
            this._register(mouseEvents.onMouseUp(this.viewHelper.viewDomNode, (e) => this._onMouseUp(e)));
            this._register(mouseEvents.onMouseLeave(this.viewHelper.viewDomNode, (e) => this._onMouseLeave(e)));
            // `pointerdown` events can't be used to determine if there's a double click, or triple click
            // because their `e.detail` is always 0.
            // We will therefore save the pointer id for the mouse and then reuse it in the `mousedown` event
            // for `element.setPointerCapture`.
            let capturePointerId = 0;
            this._register(mouseEvents.onPointerDown(this.viewHelper.viewDomNode, (e, pointerId) => {
                capturePointerId = pointerId;
            }));
            // The `pointerup` listener registered by `GlobalEditorPointerMoveMonitor` does not get invoked 100% of the times.
            // I speculate that this is because the `pointerup` listener is only registered during the `mousedown` event, and perhaps
            // the `pointerup` event is already queued for dispatching, which makes it that the new listener doesn't get fired.
            // See https://github.com/microsoft/vscode/issues/146486 for repro steps.
            // To compensate for that, we simply register here a `pointerup` listener and just communicate it.
            this._register(dom.addDisposableListener(this.viewHelper.viewDomNode, dom.EventType.POINTER_UP, (e) => {
                this._mouseDownOperation.onPointerUp();
            }));
            this._register(mouseEvents.onMouseDown(this.viewHelper.viewDomNode, (e) => this._onMouseDown(e, capturePointerId)));
            this._setupMouseWheelZoomListener();
            this._context.addEventHandler(this);
        }
        _setupMouseWheelZoomListener() {
            const classifier = scrollableElement_1.MouseWheelClassifier.INSTANCE;
            let prevMouseWheelTime = 0;
            let gestureStartZoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
            let gestureHasZoomModifiers = false;
            let gestureAccumulatedDelta = 0;
            const onMouseWheel = (browserEvent) => {
                this.viewController.emitMouseWheel(browserEvent);
                if (!this._context.configuration.options.get(76 /* EditorOption.mouseWheelZoom */)) {
                    return;
                }
                const e = new mouseEvent_1.StandardWheelEvent(browserEvent);
                classifier.acceptStandardWheelEvent(e);
                if (classifier.isPhysicalMouseWheel()) {
                    if (hasMouseWheelZoomModifiers(browserEvent)) {
                        const zoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
                        const delta = e.deltaY > 0 ? 1 : -1;
                        editorZoom_1.EditorZoom.setZoomLevel(zoomLevel + delta);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
                else {
                    // we consider mousewheel events that occur within 50ms of each other to be part of the same gesture
                    // we don't want to consider mouse wheel events where ctrl/cmd is pressed during the inertia phase
                    // we also want to accumulate deltaY values from the same gesture and use that to set the zoom level
                    if (Date.now() - prevMouseWheelTime > 50) {
                        // reset if more than 50ms have passed
                        gestureStartZoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
                        gestureHasZoomModifiers = hasMouseWheelZoomModifiers(browserEvent);
                        gestureAccumulatedDelta = 0;
                    }
                    prevMouseWheelTime = Date.now();
                    gestureAccumulatedDelta += e.deltaY;
                    if (gestureHasZoomModifiers) {
                        editorZoom_1.EditorZoom.setZoomLevel(gestureStartZoomLevel + gestureAccumulatedDelta / 5);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            };
            this._register(dom.addDisposableListener(this.viewHelper.viewDomNode, dom.EventType.MOUSE_WHEEL, onMouseWheel, { capture: true, passive: false }));
            function hasMouseWheelZoomModifiers(browserEvent) {
                return (platform.isMacintosh
                    // on macOS we support cmd + two fingers scroll (`metaKey` set)
                    // and also the two fingers pinch gesture (`ctrKey` set)
                    ? ((browserEvent.metaKey || browserEvent.ctrlKey) && !browserEvent.shiftKey && !browserEvent.altKey)
                    : (browserEvent.ctrlKey && !browserEvent.metaKey && !browserEvent.shiftKey && !browserEvent.altKey));
            }
        }
        dispose() {
            this._context.removeEventHandler(this);
            if (this._mouseLeaveMonitor) {
                this._mouseLeaveMonitor.dispose();
                this._mouseLeaveMonitor = null;
            }
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                // layout change
                const height = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).height;
                if (this._height !== height) {
                    this._height = height;
                    this._mouseDownOperation.onHeightChanged();
                }
            }
            return false;
        }
        onCursorStateChanged(e) {
            this._mouseDownOperation.onCursorStateChanged(e);
            return false;
        }
        onFocusChanged(e) {
            return false;
        }
        // --- end event handlers
        getTargetAtClientPoint(clientX, clientY) {
            const clientPos = new editorDom_1.ClientCoordinates(clientX, clientY);
            const pos = clientPos.toPageCoordinates(dom.getWindow(this.viewHelper.viewDomNode));
            const editorPos = (0, editorDom_1.createEditorPagePosition)(this.viewHelper.viewDomNode);
            if (pos.y < editorPos.y || pos.y > editorPos.y + editorPos.height || pos.x < editorPos.x || pos.x > editorPos.x + editorPos.width) {
                return null;
            }
            const relativePos = (0, editorDom_1.createCoordinatesRelativeToEditor)(this.viewHelper.viewDomNode, editorPos, pos);
            return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), editorPos, pos, relativePos, null);
        }
        _createMouseTarget(e, testEventTarget) {
            let target = e.target;
            if (!this.viewHelper.viewDomNode.contains(target)) {
                const shadowRoot = dom.getShadowRoot(this.viewHelper.viewDomNode);
                if (shadowRoot) {
                    target = shadowRoot.elementsFromPoint(e.posx, e.posy).find((el) => this.viewHelper.viewDomNode.contains(el));
                }
            }
            return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, e.relativePos, testEventTarget ? target : null);
        }
        _getMouseColumn(e) {
            return this.mouseTargetFactory.getMouseColumn(e.relativePos);
        }
        _onContextMenu(e, testEventTarget) {
            this.viewController.emitContextMenu({
                event: e,
                target: this._createMouseTarget(e, testEventTarget)
            });
        }
        _onMouseMove(e) {
            const targetIsWidget = this.mouseTargetFactory.mouseTargetIsWidget(e);
            if (!targetIsWidget) {
                e.preventDefault();
            }
            if (this._mouseDownOperation.isActive()) {
                // In selection/drag operation
                return;
            }
            const actualMouseMoveTime = e.timestamp;
            if (actualMouseMoveTime < this.lastMouseLeaveTime) {
                // Due to throttling, this event occurred before the mouse left the editor, therefore ignore it.
                return;
            }
            this.viewController.emitMouseMove({
                event: e,
                target: this._createMouseTarget(e, true)
            });
        }
        _onMouseLeave(e) {
            if (this._mouseLeaveMonitor) {
                this._mouseLeaveMonitor.dispose();
                this._mouseLeaveMonitor = null;
            }
            this.lastMouseLeaveTime = (new Date()).getTime();
            this.viewController.emitMouseLeave({
                event: e,
                target: null
            });
        }
        _onMouseUp(e) {
            this.viewController.emitMouseUp({
                event: e,
                target: this._createMouseTarget(e, true)
            });
        }
        _onMouseDown(e, pointerId) {
            const t = this._createMouseTarget(e, true);
            const targetIsContent = (t.type === 6 /* MouseTargetType.CONTENT_TEXT */ || t.type === 7 /* MouseTargetType.CONTENT_EMPTY */);
            const targetIsGutter = (t.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ || t.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */ || t.type === 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */);
            const targetIsLineNumbers = (t.type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */);
            const selectOnLineNumbers = this._context.configuration.options.get(109 /* EditorOption.selectOnLineNumbers */);
            const targetIsViewZone = (t.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || t.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */);
            const targetIsWidget = (t.type === 9 /* MouseTargetType.CONTENT_WIDGET */);
            let shouldHandle = e.leftButton || e.middleButton;
            if (platform.isMacintosh && e.leftButton && e.ctrlKey) {
                shouldHandle = false;
            }
            const focus = () => {
                e.preventDefault();
                this.viewHelper.focusTextArea();
            };
            if (shouldHandle && (targetIsContent || (targetIsLineNumbers && selectOnLineNumbers))) {
                focus();
                this._mouseDownOperation.start(t.type, e, pointerId);
            }
            else if (targetIsGutter) {
                // Do not steal focus
                e.preventDefault();
            }
            else if (targetIsViewZone) {
                const viewZoneData = t.detail;
                if (shouldHandle && this.viewHelper.shouldSuppressMouseDownOnViewZone(viewZoneData.viewZoneId)) {
                    focus();
                    this._mouseDownOperation.start(t.type, e, pointerId);
                    e.preventDefault();
                }
            }
            else if (targetIsWidget && this.viewHelper.shouldSuppressMouseDownOnWidget(t.detail)) {
                focus();
                e.preventDefault();
            }
            this.viewController.emitMouseDown({
                event: e,
                target: t
            });
        }
        _onMouseWheel(e) {
            this.viewController.emitMouseWheel(e);
        }
    }
    exports.MouseHandler = MouseHandler;
    class MouseDownOperation extends lifecycle_1.Disposable {
        constructor(_context, _viewController, _viewHelper, _mouseTargetFactory, createMouseTarget, getMouseColumn) {
            super();
            this._context = _context;
            this._viewController = _viewController;
            this._viewHelper = _viewHelper;
            this._mouseTargetFactory = _mouseTargetFactory;
            this._createMouseTarget = createMouseTarget;
            this._getMouseColumn = getMouseColumn;
            this._mouseMoveMonitor = this._register(new editorDom_1.GlobalEditorPointerMoveMonitor(this._viewHelper.viewDomNode));
            this._topBottomDragScrolling = this._register(new TopBottomDragScrolling(this._context, this._viewHelper, this._mouseTargetFactory, (position, inSelectionMode, revealType) => this._dispatchMouse(position, inSelectionMode, revealType)));
            this._mouseState = new MouseDownState();
            this._currentSelection = new selection_1.Selection(1, 1, 1, 1);
            this._isActive = false;
            this._lastMouseEvent = null;
        }
        dispose() {
            super.dispose();
        }
        isActive() {
            return this._isActive;
        }
        _onMouseDownThenMove(e) {
            this._lastMouseEvent = e;
            this._mouseState.setModifiers(e);
            const position = this._findMousePosition(e, false);
            if (!position) {
                // Ignoring because position is unknown
                return;
            }
            if (this._mouseState.isDragAndDrop) {
                this._viewController.emitMouseDrag({
                    event: e,
                    target: position
                });
            }
            else {
                if (position.type === 13 /* MouseTargetType.OUTSIDE_EDITOR */ && (position.outsidePosition === 'above' || position.outsidePosition === 'below')) {
                    this._topBottomDragScrolling.start(position, e);
                }
                else {
                    this._topBottomDragScrolling.stop();
                    this._dispatchMouse(position, true, 1 /* NavigationCommandRevealType.Minimal */);
                }
            }
        }
        start(targetType, e, pointerId) {
            this._lastMouseEvent = e;
            this._mouseState.setStartedOnLineNumbers(targetType === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */);
            this._mouseState.setStartButtons(e);
            this._mouseState.setModifiers(e);
            const position = this._findMousePosition(e, true);
            if (!position || !position.position) {
                // Ignoring because position is unknown
                return;
            }
            this._mouseState.trySetCount(e.detail, position.position);
            // Overwrite the detail of the MouseEvent, as it will be sent out in an event and contributions might rely on it.
            e.detail = this._mouseState.count;
            const options = this._context.configuration.options;
            if (!options.get(91 /* EditorOption.readOnly */)
                && options.get(35 /* EditorOption.dragAndDrop */)
                && !options.get(22 /* EditorOption.columnSelection */)
                && !this._mouseState.altKey // we don't support multiple mouse
                && e.detail < 2 // only single click on a selection can work
                && !this._isActive // the mouse is not down yet
                && !this._currentSelection.isEmpty() // we don't drag single cursor
                && (position.type === 6 /* MouseTargetType.CONTENT_TEXT */) // single click on text
                && position.position && this._currentSelection.containsPosition(position.position) // single click on a selection
            ) {
                this._mouseState.isDragAndDrop = true;
                this._isActive = true;
                this._mouseMoveMonitor.startMonitoring(this._viewHelper.viewLinesDomNode, pointerId, e.buttons, (e) => this._onMouseDownThenMove(e), (browserEvent) => {
                    const position = this._findMousePosition(this._lastMouseEvent, false);
                    if (dom.isKeyboardEvent(browserEvent)) {
                        // cancel
                        this._viewController.emitMouseDropCanceled();
                    }
                    else {
                        this._viewController.emitMouseDrop({
                            event: this._lastMouseEvent,
                            target: (position ? this._createMouseTarget(this._lastMouseEvent, true) : null) // Ignoring because position is unknown, e.g., Content View Zone
                        });
                    }
                    this._stop();
                });
                return;
            }
            this._mouseState.isDragAndDrop = false;
            this._dispatchMouse(position, e.shiftKey, 1 /* NavigationCommandRevealType.Minimal */);
            if (!this._isActive) {
                this._isActive = true;
                this._mouseMoveMonitor.startMonitoring(this._viewHelper.viewLinesDomNode, pointerId, e.buttons, (e) => this._onMouseDownThenMove(e), () => this._stop());
            }
        }
        _stop() {
            this._isActive = false;
            this._topBottomDragScrolling.stop();
        }
        onHeightChanged() {
            this._mouseMoveMonitor.stopMonitoring();
        }
        onPointerUp() {
            this._mouseMoveMonitor.stopMonitoring();
        }
        onCursorStateChanged(e) {
            this._currentSelection = e.selections[0];
        }
        _getPositionOutsideEditor(e) {
            const editorContent = e.editorPos;
            const model = this._context.viewModel;
            const viewLayout = this._context.viewLayout;
            const mouseColumn = this._getMouseColumn(e);
            if (e.posy < editorContent.y) {
                const outsideDistance = editorContent.y - e.posy;
                const verticalOffset = Math.max(viewLayout.getCurrentScrollTop() - outsideDistance, 0);
                const viewZoneData = mouseTarget_1.HitTestContext.getZoneAtCoord(this._context, verticalOffset);
                if (viewZoneData) {
                    const newPosition = this._helpPositionJumpOverViewZone(viewZoneData);
                    if (newPosition) {
                        return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, newPosition, 'above', outsideDistance);
                    }
                }
                const aboveLineNumber = viewLayout.getLineNumberAtVerticalOffset(verticalOffset);
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(aboveLineNumber, 1), 'above', outsideDistance);
            }
            if (e.posy > editorContent.y + editorContent.height) {
                const outsideDistance = e.posy - editorContent.y - editorContent.height;
                const verticalOffset = viewLayout.getCurrentScrollTop() + e.relativePos.y;
                const viewZoneData = mouseTarget_1.HitTestContext.getZoneAtCoord(this._context, verticalOffset);
                if (viewZoneData) {
                    const newPosition = this._helpPositionJumpOverViewZone(viewZoneData);
                    if (newPosition) {
                        return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, newPosition, 'below', outsideDistance);
                    }
                }
                const belowLineNumber = viewLayout.getLineNumberAtVerticalOffset(verticalOffset);
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(belowLineNumber, model.getLineMaxColumn(belowLineNumber)), 'below', outsideDistance);
            }
            const possibleLineNumber = viewLayout.getLineNumberAtVerticalOffset(viewLayout.getCurrentScrollTop() + e.relativePos.y);
            if (e.posx < editorContent.x) {
                const outsideDistance = editorContent.x - e.posx;
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(possibleLineNumber, 1), 'left', outsideDistance);
            }
            if (e.posx > editorContent.x + editorContent.width) {
                const outsideDistance = e.posx - editorContent.x - editorContent.width;
                return mouseTarget_1.MouseTarget.createOutsideEditor(mouseColumn, new position_1.Position(possibleLineNumber, model.getLineMaxColumn(possibleLineNumber)), 'right', outsideDistance);
            }
            return null;
        }
        _findMousePosition(e, testEventTarget) {
            const positionOutsideEditor = this._getPositionOutsideEditor(e);
            if (positionOutsideEditor) {
                return positionOutsideEditor;
            }
            const t = this._createMouseTarget(e, testEventTarget);
            const hintedPosition = t.position;
            if (!hintedPosition) {
                return null;
            }
            if (t.type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ || t.type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) {
                const newPosition = this._helpPositionJumpOverViewZone(t.detail);
                if (newPosition) {
                    return mouseTarget_1.MouseTarget.createViewZone(t.type, t.element, t.mouseColumn, newPosition, t.detail);
                }
            }
            return t;
        }
        _helpPositionJumpOverViewZone(viewZoneData) {
            // Force position on view zones to go above or below depending on where selection started from
            const selectionStart = new position_1.Position(this._currentSelection.selectionStartLineNumber, this._currentSelection.selectionStartColumn);
            const positionBefore = viewZoneData.positionBefore;
            const positionAfter = viewZoneData.positionAfter;
            if (positionBefore && positionAfter) {
                if (positionBefore.isBefore(selectionStart)) {
                    return positionBefore;
                }
                else {
                    return positionAfter;
                }
            }
            return null;
        }
        _dispatchMouse(position, inSelectionMode, revealType) {
            if (!position.position) {
                return;
            }
            this._viewController.dispatchMouse({
                position: position.position,
                mouseColumn: position.mouseColumn,
                startedOnLineNumbers: this._mouseState.startedOnLineNumbers,
                revealType,
                inSelectionMode: inSelectionMode,
                mouseDownCount: this._mouseState.count,
                altKey: this._mouseState.altKey,
                ctrlKey: this._mouseState.ctrlKey,
                metaKey: this._mouseState.metaKey,
                shiftKey: this._mouseState.shiftKey,
                leftButton: this._mouseState.leftButton,
                middleButton: this._mouseState.middleButton,
                onInjectedText: position.type === 6 /* MouseTargetType.CONTENT_TEXT */ && position.detail.injectedText !== null
            });
        }
    }
    class TopBottomDragScrolling extends lifecycle_1.Disposable {
        constructor(_context, _viewHelper, _mouseTargetFactory, _dispatchMouse) {
            super();
            this._context = _context;
            this._viewHelper = _viewHelper;
            this._mouseTargetFactory = _mouseTargetFactory;
            this._dispatchMouse = _dispatchMouse;
            this._operation = null;
        }
        dispose() {
            super.dispose();
            this.stop();
        }
        start(position, mouseEvent) {
            if (this._operation) {
                this._operation.setPosition(position, mouseEvent);
            }
            else {
                this._operation = new TopBottomDragScrollingOperation(this._context, this._viewHelper, this._mouseTargetFactory, this._dispatchMouse, position, mouseEvent);
            }
        }
        stop() {
            if (this._operation) {
                this._operation.dispose();
                this._operation = null;
            }
        }
    }
    class TopBottomDragScrollingOperation extends lifecycle_1.Disposable {
        constructor(_context, _viewHelper, _mouseTargetFactory, _dispatchMouse, position, mouseEvent) {
            super();
            this._context = _context;
            this._viewHelper = _viewHelper;
            this._mouseTargetFactory = _mouseTargetFactory;
            this._dispatchMouse = _dispatchMouse;
            this._position = position;
            this._mouseEvent = mouseEvent;
            this._lastTime = Date.now();
            this._animationFrameDisposable = dom.scheduleAtNextAnimationFrame(dom.getWindow(mouseEvent.browserEvent), () => this._execute());
        }
        dispose() {
            this._animationFrameDisposable.dispose();
            super.dispose();
        }
        setPosition(position, mouseEvent) {
            this._position = position;
            this._mouseEvent = mouseEvent;
        }
        /**
         * update internal state and return elapsed ms since last time
         */
        _tick() {
            const now = Date.now();
            const elapsed = now - this._lastTime;
            this._lastTime = now;
            return elapsed;
        }
        /**
         * get the number of lines per second to auto-scroll
         */
        _getScrollSpeed() {
            const lineHeight = this._context.configuration.options.get(67 /* EditorOption.lineHeight */);
            const viewportInLines = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).height / lineHeight;
            const outsideDistanceInLines = this._position.outsideDistance / lineHeight;
            if (outsideDistanceInLines <= 1.5) {
                return Math.max(30, viewportInLines * (1 + outsideDistanceInLines));
            }
            if (outsideDistanceInLines <= 3) {
                return Math.max(60, viewportInLines * (2 + outsideDistanceInLines));
            }
            return Math.max(200, viewportInLines * (7 + outsideDistanceInLines));
        }
        _execute() {
            const lineHeight = this._context.configuration.options.get(67 /* EditorOption.lineHeight */);
            const scrollSpeedInLines = this._getScrollSpeed();
            const elapsed = this._tick();
            const scrollInPixels = scrollSpeedInLines * (elapsed / 1000) * lineHeight;
            const scrollValue = (this._position.outsidePosition === 'above' ? -scrollInPixels : scrollInPixels);
            this._context.viewModel.viewLayout.deltaScrollNow(0, scrollValue);
            this._viewHelper.renderNow();
            const viewportData = this._context.viewLayout.getLinesViewportData();
            const edgeLineNumber = (this._position.outsidePosition === 'above' ? viewportData.startLineNumber : viewportData.endLineNumber);
            // First, try to find a position that matches the horizontal position of the mouse
            let mouseTarget;
            {
                const editorPos = (0, editorDom_1.createEditorPagePosition)(this._viewHelper.viewDomNode);
                const horizontalScrollbarHeight = this._context.configuration.options.get(145 /* EditorOption.layoutInfo */).horizontalScrollbarHeight;
                const pos = new editorDom_1.PageCoordinates(this._mouseEvent.pos.x, editorPos.y + editorPos.height - horizontalScrollbarHeight - 0.1);
                const relativePos = (0, editorDom_1.createCoordinatesRelativeToEditor)(this._viewHelper.viewDomNode, editorPos, pos);
                mouseTarget = this._mouseTargetFactory.createMouseTarget(this._viewHelper.getLastRenderData(), editorPos, pos, relativePos, null);
            }
            if (!mouseTarget.position || mouseTarget.position.lineNumber !== edgeLineNumber) {
                if (this._position.outsidePosition === 'above') {
                    mouseTarget = mouseTarget_1.MouseTarget.createOutsideEditor(this._position.mouseColumn, new position_1.Position(edgeLineNumber, 1), 'above', this._position.outsideDistance);
                }
                else {
                    mouseTarget = mouseTarget_1.MouseTarget.createOutsideEditor(this._position.mouseColumn, new position_1.Position(edgeLineNumber, this._context.viewModel.getLineMaxColumn(edgeLineNumber)), 'below', this._position.outsideDistance);
                }
            }
            this._dispatchMouse(mouseTarget, true, 2 /* NavigationCommandRevealType.None */);
            this._animationFrameDisposable = dom.scheduleAtNextAnimationFrame(dom.getWindow(mouseTarget.element), () => this._execute());
        }
    }
    class MouseDownState {
        static { this.CLEAR_MOUSE_DOWN_COUNT_TIME = 400; } // ms
        get altKey() { return this._altKey; }
        get ctrlKey() { return this._ctrlKey; }
        get metaKey() { return this._metaKey; }
        get shiftKey() { return this._shiftKey; }
        get leftButton() { return this._leftButton; }
        get middleButton() { return this._middleButton; }
        get startedOnLineNumbers() { return this._startedOnLineNumbers; }
        constructor() {
            this._altKey = false;
            this._ctrlKey = false;
            this._metaKey = false;
            this._shiftKey = false;
            this._leftButton = false;
            this._middleButton = false;
            this._startedOnLineNumbers = false;
            this._lastMouseDownPosition = null;
            this._lastMouseDownPositionEqualCount = 0;
            this._lastMouseDownCount = 0;
            this._lastSetMouseDownCountTime = 0;
            this.isDragAndDrop = false;
        }
        get count() {
            return this._lastMouseDownCount;
        }
        setModifiers(source) {
            this._altKey = source.altKey;
            this._ctrlKey = source.ctrlKey;
            this._metaKey = source.metaKey;
            this._shiftKey = source.shiftKey;
        }
        setStartButtons(source) {
            this._leftButton = source.leftButton;
            this._middleButton = source.middleButton;
        }
        setStartedOnLineNumbers(startedOnLineNumbers) {
            this._startedOnLineNumbers = startedOnLineNumbers;
        }
        trySetCount(setMouseDownCount, newMouseDownPosition) {
            // a. Invalidate multiple clicking if too much time has passed (will be hit by IE because the detail field of mouse events contains garbage in IE10)
            const currentTime = (new Date()).getTime();
            if (currentTime - this._lastSetMouseDownCountTime > MouseDownState.CLEAR_MOUSE_DOWN_COUNT_TIME) {
                setMouseDownCount = 1;
            }
            this._lastSetMouseDownCountTime = currentTime;
            // b. Ensure that we don't jump from single click to triple click in one go (will be hit by IE because the detail field of mouse events contains garbage in IE10)
            if (setMouseDownCount > this._lastMouseDownCount + 1) {
                setMouseDownCount = this._lastMouseDownCount + 1;
            }
            // c. Invalidate multiple clicking if the logical position is different
            if (this._lastMouseDownPosition && this._lastMouseDownPosition.equals(newMouseDownPosition)) {
                this._lastMouseDownPositionEqualCount++;
            }
            else {
                this._lastMouseDownPositionEqualCount = 1;
            }
            this._lastMouseDownPosition = newMouseDownPosition;
            // Finally set the lastMouseDownCount
            this._lastMouseDownCount = Math.min(setMouseDownCount, this._lastMouseDownPositionEqualCount);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW91c2VIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci9jb250cm9sbGVyL21vdXNlSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFtRGhHLE1BQWEsWUFBYSxTQUFRLG1DQUFnQjtRQVdqRCxZQUFZLE9BQW9CLEVBQUUsY0FBOEIsRUFBRSxVQUFpQztZQUNsRyxLQUFLLEVBQUUsQ0FBQztZQUhELHVCQUFrQixHQUF1QixJQUFJLENBQUM7WUFLckQsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDeEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7WUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDN0IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksZ0NBQWtCLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUU1RSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGtCQUFrQixDQUMvRCxJQUFJLENBQUMsUUFBUSxFQUNiLElBQUksQ0FBQyxjQUFjLEVBQ25CLElBQUksQ0FBQyxVQUFVLEVBQ2YsSUFBSSxDQUFDLGtCQUFrQixFQUN2QixDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLEVBQ25FLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUM5QixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFB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