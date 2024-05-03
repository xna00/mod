/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorDom", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/lines/viewLine", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/cursorColumns", "vs/base/browser/dom", "vs/editor/common/cursor/cursorAtomicMoveOperations", "vs/base/common/lazy"], function (require, exports, editorDom_1, viewPart_1, viewLine_1, position_1, range_1, cursorColumns_1, dom, cursorAtomicMoveOperations_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MouseTargetFactory = exports.HitTestContext = exports.MouseTarget = exports.PointerHandlerLastRenderData = void 0;
    var HitTestResultType;
    (function (HitTestResultType) {
        HitTestResultType[HitTestResultType["Unknown"] = 0] = "Unknown";
        HitTestResultType[HitTestResultType["Content"] = 1] = "Content";
    })(HitTestResultType || (HitTestResultType = {}));
    class UnknownHitTestResult {
        constructor(hitTarget = null) {
            this.hitTarget = hitTarget;
            this.type = 0 /* HitTestResultType.Unknown */;
        }
    }
    class ContentHitTestResult {
        get hitTarget() { return this.spanNode; }
        constructor(position, spanNode, injectedText) {
            this.position = position;
            this.spanNode = spanNode;
            this.injectedText = injectedText;
            this.type = 1 /* HitTestResultType.Content */;
        }
    }
    var HitTestResult;
    (function (HitTestResult) {
        function createFromDOMInfo(ctx, spanNode, offset) {
            const position = ctx.getPositionFromDOMInfo(spanNode, offset);
            if (position) {
                return new ContentHitTestResult(position, spanNode, null);
            }
            return new UnknownHitTestResult(spanNode);
        }
        HitTestResult.createFromDOMInfo = createFromDOMInfo;
    })(HitTestResult || (HitTestResult = {}));
    class PointerHandlerLastRenderData {
        constructor(lastViewCursorsRenderData, lastTextareaPosition) {
            this.lastViewCursorsRenderData = lastViewCursorsRenderData;
            this.lastTextareaPosition = lastTextareaPosition;
        }
    }
    exports.PointerHandlerLastRenderData = PointerHandlerLastRenderData;
    class MouseTarget {
        static _deduceRage(position, range = null) {
            if (!range && position) {
                return new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            }
            return range ?? null;
        }
        static createUnknown(element, mouseColumn, position) {
            return { type: 0 /* MouseTargetType.UNKNOWN */, element, mouseColumn, position, range: this._deduceRage(position) };
        }
        static createTextarea(element, mouseColumn) {
            return { type: 1 /* MouseTargetType.TEXTAREA */, element, mouseColumn, position: null, range: null };
        }
        static createMargin(type, element, mouseColumn, position, range, detail) {
            return { type, element, mouseColumn, position, range, detail };
        }
        static createViewZone(type, element, mouseColumn, position, detail) {
            return { type, element, mouseColumn, position, range: this._deduceRage(position), detail };
        }
        static createContentText(element, mouseColumn, position, range, detail) {
            return { type: 6 /* MouseTargetType.CONTENT_TEXT */, element, mouseColumn, position, range: this._deduceRage(position, range), detail };
        }
        static createContentEmpty(element, mouseColumn, position, detail) {
            return { type: 7 /* MouseTargetType.CONTENT_EMPTY */, element, mouseColumn, position, range: this._deduceRage(position), detail };
        }
        static createContentWidget(element, mouseColumn, detail) {
            return { type: 9 /* MouseTargetType.CONTENT_WIDGET */, element, mouseColumn, position: null, range: null, detail };
        }
        static createScrollbar(element, mouseColumn, position) {
            return { type: 11 /* MouseTargetType.SCROLLBAR */, element, mouseColumn, position, range: this._deduceRage(position) };
        }
        static createOverlayWidget(element, mouseColumn, detail) {
            return { type: 12 /* MouseTargetType.OVERLAY_WIDGET */, element, mouseColumn, position: null, range: null, detail };
        }
        static createOutsideEditor(mouseColumn, position, outsidePosition, outsideDistance) {
            return { type: 13 /* MouseTargetType.OUTSIDE_EDITOR */, element: null, mouseColumn, position, range: this._deduceRage(position), outsidePosition, outsideDistance };
        }
        static _typeToString(type) {
            if (type === 1 /* MouseTargetType.TEXTAREA */) {
                return 'TEXTAREA';
            }
            if (type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */) {
                return 'GUTTER_GLYPH_MARGIN';
            }
            if (type === 3 /* MouseTargetType.GUTTER_LINE_NUMBERS */) {
                return 'GUTTER_LINE_NUMBERS';
            }
            if (type === 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                return 'GUTTER_LINE_DECORATIONS';
            }
            if (type === 5 /* MouseTargetType.GUTTER_VIEW_ZONE */) {
                return 'GUTTER_VIEW_ZONE';
            }
            if (type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                return 'CONTENT_TEXT';
            }
            if (type === 7 /* MouseTargetType.CONTENT_EMPTY */) {
                return 'CONTENT_EMPTY';
            }
            if (type === 8 /* MouseTargetType.CONTENT_VIEW_ZONE */) {
                return 'CONTENT_VIEW_ZONE';
            }
            if (type === 9 /* MouseTargetType.CONTENT_WIDGET */) {
                return 'CONTENT_WIDGET';
            }
            if (type === 10 /* MouseTargetType.OVERVIEW_RULER */) {
                return 'OVERVIEW_RULER';
            }
            if (type === 11 /* MouseTargetType.SCROLLBAR */) {
                return 'SCROLLBAR';
            }
            if (type === 12 /* MouseTargetType.OVERLAY_WIDGET */) {
                return 'OVERLAY_WIDGET';
            }
            return 'UNKNOWN';
        }
        static toString(target) {
            return this._typeToString(target.type) + ': ' + target.position + ' - ' + target.range + ' - ' + JSON.stringify(target.detail);
        }
    }
    exports.MouseTarget = MouseTarget;
    class ElementPath {
        static isTextArea(path) {
            return (path.length === 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 7 /* PartFingerprint.TextArea */);
        }
        static isChildOfViewLines(path) {
            return (path.length >= 4
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[3] === 8 /* PartFingerprint.ViewLines */);
        }
        static isStrictChildOfViewLines(path) {
            return (path.length > 4
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[3] === 8 /* PartFingerprint.ViewLines */);
        }
        static isChildOfScrollableElement(path) {
            return (path.length >= 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 6 /* PartFingerprint.ScrollableElement */);
        }
        static isChildOfMinimap(path) {
            return (path.length >= 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 9 /* PartFingerprint.Minimap */);
        }
        static isChildOfContentWidgets(path) {
            return (path.length >= 4
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[3] === 1 /* PartFingerprint.ContentWidgets */);
        }
        static isChildOfOverflowGuard(path) {
            return (path.length >= 1
                && path[0] === 3 /* PartFingerprint.OverflowGuard */);
        }
        static isChildOfOverflowingContentWidgets(path) {
            return (path.length >= 1
                && path[0] === 2 /* PartFingerprint.OverflowingContentWidgets */);
        }
        static isChildOfOverlayWidgets(path) {
            return (path.length >= 2
                && path[0] === 3 /* PartFingerprint.OverflowGuard */
                && path[1] === 4 /* PartFingerprint.OverlayWidgets */);
        }
        static isChildOfOverflowingOverlayWidgets(path) {
            return (path.length >= 1
                && path[0] === 5 /* PartFingerprint.OverflowingOverlayWidgets */);
        }
    }
    class HitTestContext {
        constructor(context, viewHelper, lastRenderData) {
            this.viewModel = context.viewModel;
            const options = context.configuration.options;
            this.layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.viewDomNode = viewHelper.viewDomNode;
            this.lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this.stickyTabStops = options.get(116 /* EditorOption.stickyTabStops */);
            this.typicalHalfwidthCharacterWidth = options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth;
            this.lastRenderData = lastRenderData;
            this._context = context;
            this._viewHelper = viewHelper;
        }
        getZoneAtCoord(mouseVerticalOffset) {
            return HitTestContext.getZoneAtCoord(this._context, mouseVerticalOffset);
        }
        static getZoneAtCoord(context, mouseVerticalOffset) {
            // The target is either a view zone or the empty space after the last view-line
            const viewZoneWhitespace = context.viewLayout.getWhitespaceAtVerticalOffset(mouseVerticalOffset);
            if (viewZoneWhitespace) {
                const viewZoneMiddle = viewZoneWhitespace.verticalOffset + viewZoneWhitespace.height / 2;
                const lineCount = context.viewModel.getLineCount();
                let positionBefore = null;
                let position;
                let positionAfter = null;
                if (viewZoneWhitespace.afterLineNumber !== lineCount) {
                    // There are more lines after this view zone
                    positionAfter = new position_1.Position(viewZoneWhitespace.afterLineNumber + 1, 1);
                }
                if (viewZoneWhitespace.afterLineNumber > 0) {
                    // There are more lines above this view zone
                    positionBefore = new position_1.Position(viewZoneWhitespace.afterLineNumber, context.viewModel.getLineMaxColumn(viewZoneWhitespace.afterLineNumber));
                }
                if (positionAfter === null) {
                    position = positionBefore;
                }
                else if (positionBefore === null) {
                    position = positionAfter;
                }
                else if (mouseVerticalOffset < viewZoneMiddle) {
                    position = positionBefore;
                }
                else {
                    position = positionAfter;
                }
                return {
                    viewZoneId: viewZoneWhitespace.id,
                    afterLineNumber: viewZoneWhitespace.afterLineNumber,
                    positionBefore: positionBefore,
                    positionAfter: positionAfter,
                    position: position
                };
            }
            return null;
        }
        getFullLineRangeAtCoord(mouseVerticalOffset) {
            if (this._context.viewLayout.isAfterLines(mouseVerticalOffset)) {
                // Below the last line
                const lineNumber = this._context.viewModel.getLineCount();
                const maxLineColumn = this._context.viewModel.getLineMaxColumn(lineNumber);
                return {
                    range: new range_1.Range(lineNumber, maxLineColumn, lineNumber, maxLineColumn),
                    isAfterLines: true
                };
            }
            const lineNumber = this._context.viewLayout.getLineNumberAtVerticalOffset(mouseVerticalOffset);
            const maxLineColumn = this._context.viewModel.getLineMaxColumn(lineNumber);
            return {
                range: new range_1.Range(lineNumber, 1, lineNumber, maxLineColumn),
                isAfterLines: false
            };
        }
        getLineNumberAtVerticalOffset(mouseVerticalOffset) {
            return this._context.viewLayout.getLineNumberAtVerticalOffset(mouseVerticalOffset);
        }
        isAfterLines(mouseVerticalOffset) {
            return this._context.viewLayout.isAfterLines(mouseVerticalOffset);
        }
        isInTopPadding(mouseVerticalOffset) {
            return this._context.viewLayout.isInTopPadding(mouseVerticalOffset);
        }
        isInBottomPadding(mouseVerticalOffset) {
            return this._context.viewLayout.isInBottomPadding(mouseVerticalOffset);
        }
        getVerticalOffsetForLineNumber(lineNumber) {
            return this._context.viewLayout.getVerticalOffsetForLineNumber(lineNumber);
        }
        findAttribute(element, attr) {
            return HitTestContext._findAttribute(element, attr, this._viewHelper.viewDomNode);
        }
        static _findAttribute(element, attr, stopAt) {
            while (element && element !== element.ownerDocument.body) {
                if (element.hasAttribute && element.hasAttribute(attr)) {
                    return element.getAttribute(attr);
                }
                if (element === stopAt) {
                    return null;
                }
                element = element.parentNode;
            }
            return null;
        }
        getLineWidth(lineNumber) {
            return this._viewHelper.getLineWidth(lineNumber);
        }
        visibleRangeForPosition(lineNumber, column) {
            return this._viewHelper.visibleRangeForPosition(lineNumber, column);
        }
        getPositionFromDOMInfo(spanNode, offset) {
            return this._viewHelper.getPositionFromDOMInfo(spanNode, offset);
        }
        getCurrentScrollTop() {
            return this._context.viewLayout.getCurrentScrollTop();
        }
        getCurrentScrollLeft() {
            return this._context.viewLayout.getCurrentScrollLeft();
        }
    }
    exports.HitTestContext = HitTestContext;
    class BareHitTestRequest {
        constructor(ctx, editorPos, pos, relativePos) {
            this.editorPos = editorPos;
            this.pos = pos;
            this.relativePos = relativePos;
            this.mouseVerticalOffset = Math.max(0, ctx.getCurrentScrollTop() + this.relativePos.y);
            this.mouseContentHorizontalOffset = ctx.getCurrentScrollLeft() + this.relativePos.x - ctx.layoutInfo.contentLeft;
            this.isInMarginArea = (this.relativePos.x < ctx.layoutInfo.contentLeft && this.relativePos.x >= ctx.layoutInfo.glyphMarginLeft);
            this.isInContentArea = !this.isInMarginArea;
            this.mouseColumn = Math.max(0, MouseTargetFactory._getMouseColumn(this.mouseContentHorizontalOffset, ctx.typicalHalfwidthCharacterWidth));
        }
    }
    class HitTestRequest extends BareHitTestRequest {
        get target() {
            if (this._useHitTestTarget) {
                return this.hitTestResult.value.hitTarget;
            }
            return this._eventTarget;
        }
        get targetPath() {
            if (this._targetPathCacheElement !== this.target) {
                this._targetPathCacheElement = this.target;
                this._targetPathCacheValue = viewPart_1.PartFingerprints.collect(this.target, this._ctx.viewDomNode);
            }
            return this._targetPathCacheValue;
        }
        constructor(ctx, editorPos, pos, relativePos, eventTarget) {
            super(ctx, editorPos, pos, relativePos);
            this.hitTestResult = new lazy_1.Lazy(() => MouseTargetFactory.doHitTest(this._ctx, this));
            this._targetPathCacheElement = null;
            this._targetPathCacheValue = new Uint8Array(0);
            this._ctx = ctx;
            this._eventTarget = eventTarget;
            // If no event target is passed in, we will use the hit test target
            const hasEventTarget = Boolean(this._eventTarget);
            this._useHitTestTarget = !hasEventTarget;
        }
        toString() {
            return `pos(${this.pos.x},${this.pos.y}), editorPos(${this.editorPos.x},${this.editorPos.y}), relativePos(${this.relativePos.x},${this.relativePos.y}), mouseVerticalOffset: ${this.mouseVerticalOffset}, mouseContentHorizontalOffset: ${this.mouseContentHorizontalOffset}\n\ttarget: ${this.target ? this.target.outerHTML : null}`;
        }
        get wouldBenefitFromHitTestTargetSwitch() {
            return (!this._useHitTestTarget
                && this.hitTestResult.value.hitTarget !== null
                && this.target !== this.hitTestResult.value.hitTarget);
        }
        switchToHitTestTarget() {
            this._useHitTestTarget = true;
        }
        _getMouseColumn(position = null) {
            if (position && position.column < this._ctx.viewModel.getLineMaxColumn(position.lineNumber)) {
                // Most likely, the line contains foreign decorations...
                return cursorColumns_1.CursorColumns.visibleColumnFromColumn(this._ctx.viewModel.getLineContent(position.lineNumber), position.column, this._ctx.viewModel.model.getOptions().tabSize) + 1;
            }
            return this.mouseColumn;
        }
        fulfillUnknown(position = null) {
            return MouseTarget.createUnknown(this.target, this._getMouseColumn(position), position);
        }
        fulfillTextarea() {
            return MouseTarget.createTextarea(this.target, this._getMouseColumn());
        }
        fulfillMargin(type, position, range, detail) {
            return MouseTarget.createMargin(type, this.target, this._getMouseColumn(position), position, range, detail);
        }
        fulfillViewZone(type, position, detail) {
            return MouseTarget.createViewZone(type, this.target, this._getMouseColumn(position), position, detail);
        }
        fulfillContentText(position, range, detail) {
            return MouseTarget.createContentText(this.target, this._getMouseColumn(position), position, range, detail);
        }
        fulfillContentEmpty(position, detail) {
            return MouseTarget.createContentEmpty(this.target, this._getMouseColumn(position), position, detail);
        }
        fulfillContentWidget(detail) {
            return MouseTarget.createContentWidget(this.target, this._getMouseColumn(), detail);
        }
        fulfillScrollbar(position) {
            return MouseTarget.createScrollbar(this.target, this._getMouseColumn(position), position);
        }
        fulfillOverlayWidget(detail) {
            return MouseTarget.createOverlayWidget(this.target, this._getMouseColumn(), detail);
        }
    }
    const EMPTY_CONTENT_AFTER_LINES = { isAfterLines: true };
    function createEmptyContentDataInLines(horizontalDistanceToText) {
        return {
            isAfterLines: false,
            horizontalDistanceToText: horizontalDistanceToText
        };
    }
    class MouseTargetFactory {
        constructor(context, viewHelper) {
            this._context = context;
            this._viewHelper = viewHelper;
        }
        mouseTargetIsWidget(e) {
            const t = e.target;
            const path = viewPart_1.PartFingerprints.collect(t, this._viewHelper.viewDomNode);
            // Is it a content widget?
            if (ElementPath.isChildOfContentWidgets(path) || ElementPath.isChildOfOverflowingContentWidgets(path)) {
                return true;
            }
            // Is it an overlay widget?
            if (ElementPath.isChildOfOverlayWidgets(path) || ElementPath.isChildOfOverflowingOverlayWidgets(path)) {
                return true;
            }
            return false;
        }
        createMouseTarget(lastRenderData, editorPos, pos, relativePos, target) {
            const ctx = new HitTestContext(this._context, this._viewHelper, lastRenderData);
            const request = new HitTestRequest(ctx, editorPos, pos, relativePos, target);
            try {
                const r = MouseTargetFactory._createMouseTarget(ctx, request);
                if (r.type === 6 /* MouseTargetType.CONTENT_TEXT */) {
                    // Snap to the nearest soft tab boundary if atomic soft tabs are enabled.
                    if (ctx.stickyTabStops && r.position !== null) {
                        const position = MouseTargetFactory._snapToSoftTabBoundary(r.position, ctx.viewModel);
                        const range = range_1.Range.fromPositions(position, position).plusRange(r.range);
                        return request.fulfillContentText(position, range, r.detail);
                    }
                }
                // console.log(MouseTarget.toString(r));
                return r;
            }
            catch (err) {
                // console.log(err);
                return request.fulfillUnknown();
            }
        }
        static _createMouseTarget(ctx, request) {
            // console.log(`${domHitTestExecuted ? '=>' : ''}CAME IN REQUEST: ${request}`);
            if (request.target === null) {
                // No target
                return request.fulfillUnknown();
            }
            // we know for a fact that request.target is not null
            const resolvedRequest = request;
            let result = null;
            if (!ElementPath.isChildOfOverflowGuard(request.targetPath) && !ElementPath.isChildOfOverflowingContentWidgets(request.targetPath) && !ElementPath.isChildOfOverflowingOverlayWidgets(request.targetPath)) {
                // We only render dom nodes inside the overflow guard or in the overflowing content widgets
                result = result || request.fulfillUnknown();
            }
            result = result || MouseTargetFactory._hitTestContentWidget(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestOverlayWidget(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestMinimap(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestScrollbarSlider(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestViewZone(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestMargin(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestViewCursor(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestTextArea(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestViewLines(ctx, resolvedRequest);
            result = result || MouseTargetFactory._hitTestScrollbar(ctx, resolvedRequest);
            return (result || request.fulfillUnknown());
        }
        static _hitTestContentWidget(ctx, request) {
            // Is it a content widget?
            if (ElementPath.isChildOfContentWidgets(request.targetPath) || ElementPath.isChildOfOverflowingContentWidgets(request.targetPath)) {
                const widgetId = ctx.findAttribute(request.target, 'widgetId');
                if (widgetId) {
                    return request.fulfillContentWidget(widgetId);
                }
                else {
                    return request.fulfillUnknown();
                }
            }
            return null;
        }
        static _hitTestOverlayWidget(ctx, request) {
            // Is it an overlay widget?
            if (ElementPath.isChildOfOverlayWidgets(request.targetPath) || ElementPath.isChildOfOverflowingOverlayWidgets(request.targetPath)) {
                const widgetId = ctx.findAttribute(request.target, 'widgetId');
                if (widgetId) {
                    return request.fulfillOverlayWidget(widgetId);
                }
                else {
                    return request.fulfillUnknown();
                }
            }
            return null;
        }
        static _hitTestViewCursor(ctx, request) {
            if (request.target) {
                // Check if we've hit a painted cursor
                const lastViewCursorsRenderData = ctx.lastRenderData.lastViewCursorsRenderData;
                for (const d of lastViewCursorsRenderData) {
                    if (request.target === d.domNode) {
                        return request.fulfillContentText(d.position, null, { mightBeForeignElement: false, injectedText: null });
                    }
                }
            }
            if (request.isInContentArea) {
                // Edge has a bug when hit-testing the exact position of a cursor,
                // instead of returning the correct dom node, it returns the
                // first or last rendered view line dom node, therefore help it out
                // and first check if we are on top of a cursor
                const lastViewCursorsRenderData = ctx.lastRenderData.lastViewCursorsRenderData;
                const mouseContentHorizontalOffset = request.mouseContentHorizontalOffset;
                const mouseVerticalOffset = request.mouseVerticalOffset;
                for (const d of lastViewCursorsRenderData) {
                    if (mouseContentHorizontalOffset < d.contentLeft) {
                        // mouse position is to the left of the cursor
                        continue;
                    }
                    if (mouseContentHorizontalOffset > d.contentLeft + d.width) {
                        // mouse position is to the right of the cursor
                        continue;
                    }
                    const cursorVerticalOffset = ctx.getVerticalOffsetForLineNumber(d.position.lineNumber);
                    if (cursorVerticalOffset <= mouseVerticalOffset
                        && mouseVerticalOffset <= cursorVerticalOffset + d.height) {
                        return request.fulfillContentText(d.position, null, { mightBeForeignElement: false, injectedText: null });
                    }
                }
            }
            return null;
        }
        static _hitTestViewZone(ctx, request) {
            const viewZoneData = ctx.getZoneAtCoord(request.mouseVerticalOffset);
            if (viewZoneData) {
                const mouseTargetType = (request.isInContentArea ? 8 /* MouseTargetType.CONTENT_VIEW_ZONE */ : 5 /* MouseTargetType.GUTTER_VIEW_ZONE */);
                return request.fulfillViewZone(mouseTargetType, viewZoneData.position, viewZoneData);
            }
            return null;
        }
        static _hitTestTextArea(ctx, request) {
            // Is it the textarea?
            if (ElementPath.isTextArea(request.targetPath)) {
                if (ctx.lastRenderData.lastTextareaPosition) {
                    return request.fulfillContentText(ctx.lastRenderData.lastTextareaPosition, null, { mightBeForeignElement: false, injectedText: null });
                }
                return request.fulfillTextarea();
            }
            return null;
        }
        static _hitTestMargin(ctx, request) {
            if (request.isInMarginArea) {
                const res = ctx.getFullLineRangeAtCoord(request.mouseVerticalOffset);
                const pos = res.range.getStartPosition();
                let offset = Math.abs(request.relativePos.x);
                const detail = {
                    isAfterLines: res.isAfterLines,
                    glyphMarginLeft: ctx.layoutInfo.glyphMarginLeft,
                    glyphMarginWidth: ctx.layoutInfo.glyphMarginWidth,
                    lineNumbersWidth: ctx.layoutInfo.lineNumbersWidth,
                    offsetX: offset
                };
                offset -= ctx.layoutInfo.glyphMarginLeft;
                if (offset <= ctx.layoutInfo.glyphMarginWidth) {
                    // On the glyph margin
                    const modelCoordinate = ctx.viewModel.coordinatesConverter.convertViewPositionToModelPosition(res.range.getStartPosition());
                    const lanes = ctx.viewModel.glyphLanes.getLanesAtLine(modelCoordinate.lineNumber);
                    detail.glyphMarginLane = lanes[Math.floor(offset / ctx.lineHeight)];
                    return request.fulfillMargin(2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */, pos, res.range, detail);
                }
                offset -= ctx.layoutInfo.glyphMarginWidth;
                if (offset <= ctx.layoutInfo.lineNumbersWidth) {
                    // On the line numbers
                    return request.fulfillMargin(3 /* MouseTargetType.GUTTER_LINE_NUMBERS */, pos, res.range, detail);
                }
                offset -= ctx.layoutInfo.lineNumbersWidth;
                // On the line decorations
                return request.fulfillMargin(4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */, pos, res.range, detail);
            }
            return null;
        }
        static _hitTestViewLines(ctx, request) {
            if (!ElementPath.isChildOfViewLines(request.targetPath)) {
                return null;
            }
            if (ctx.isInTopPadding(request.mouseVerticalOffset)) {
                return request.fulfillContentEmpty(new position_1.Position(1, 1), EMPTY_CONTENT_AFTER_LINES);
            }
            // Check if it is below any lines and any view zones
            if (ctx.isAfterLines(request.mouseVerticalOffset) || ctx.isInBottomPadding(request.mouseVerticalOffset)) {
                // This most likely indicates it happened after the last view-line
                const lineCount = ctx.viewModel.getLineCount();
                const maxLineColumn = ctx.viewModel.getLineMaxColumn(lineCount);
                return request.fulfillContentEmpty(new position_1.Position(lineCount, maxLineColumn), EMPTY_CONTENT_AFTER_LINES);
            }
            // Check if we are hitting a view-line (can happen in the case of inline decorations on empty lines)
            // See https://github.com/microsoft/vscode/issues/46942
            if (ElementPath.isStrictChildOfViewLines(request.targetPath)) {
                const lineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                if (ctx.viewModel.getLineLength(lineNumber) === 0) {
                    const lineWidth = ctx.getLineWidth(lineNumber);
                    const detail = createEmptyContentDataInLines(request.mouseContentHorizontalOffset - lineWidth);
                    return request.fulfillContentEmpty(new position_1.Position(lineNumber, 1), detail);
                }
                const lineWidth = ctx.getLineWidth(lineNumber);
                if (request.mouseContentHorizontalOffset >= lineWidth) {
                    // TODO: This is wrong for RTL
                    const detail = createEmptyContentDataInLines(request.mouseContentHorizontalOffset - lineWidth);
                    const pos = new position_1.Position(lineNumber, ctx.viewModel.getLineMaxColumn(lineNumber));
                    return request.fulfillContentEmpty(pos, detail);
                }
            }
            // Do the hit test (if not already done)
            const hitTestResult = request.hitTestResult.value;
            if (hitTestResult.type === 1 /* HitTestResultType.Content */) {
                return MouseTargetFactory.createMouseTargetFromHitTestPosition(ctx, request, hitTestResult.spanNode, hitTestResult.position, hitTestResult.injectedText);
            }
            // We didn't hit content...
            if (request.wouldBenefitFromHitTestTargetSwitch) {
                // We actually hit something different... Give it one last change by trying again with this new target
                request.switchToHitTestTarget();
                return this._createMouseTarget(ctx, request);
            }
            // We have tried everything...
            return request.fulfillUnknown();
        }
        static _hitTestMinimap(ctx, request) {
            if (ElementPath.isChildOfMinimap(request.targetPath)) {
                const possibleLineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                const maxColumn = ctx.viewModel.getLineMaxColumn(possibleLineNumber);
                return request.fulfillScrollbar(new position_1.Position(possibleLineNumber, maxColumn));
            }
            return null;
        }
        static _hitTestScrollbarSlider(ctx, request) {
            if (ElementPath.isChildOfScrollableElement(request.targetPath)) {
                if (request.target && request.target.nodeType === 1) {
                    const className = request.target.className;
                    if (className && /\b(slider|scrollbar)\b/.test(className)) {
                        const possibleLineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                        const maxColumn = ctx.viewModel.getLineMaxColumn(possibleLineNumber);
                        return request.fulfillScrollbar(new position_1.Position(possibleLineNumber, maxColumn));
                    }
                }
            }
            return null;
        }
        static _hitTestScrollbar(ctx, request) {
            // Is it the overview ruler?
            // Is it a child of the scrollable element?
            if (ElementPath.isChildOfScrollableElement(request.targetPath)) {
                const possibleLineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
                const maxColumn = ctx.viewModel.getLineMaxColumn(possibleLineNumber);
                return request.fulfillScrollbar(new position_1.Position(possibleLineNumber, maxColumn));
            }
            return null;
        }
        getMouseColumn(relativePos) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            const mouseContentHorizontalOffset = this._context.viewLayout.getCurrentScrollLeft() + relativePos.x - layoutInfo.contentLeft;
            return MouseTargetFactory._getMouseColumn(mouseContentHorizontalOffset, options.get(50 /* EditorOption.fontInfo */).typicalHalfwidthCharacterWidth);
        }
        static _getMouseColumn(mouseContentHorizontalOffset, typicalHalfwidthCharacterWidth) {
            if (mouseContentHorizontalOffset < 0) {
                return 1;
            }
            const chars = Math.round(mouseContentHorizontalOffset / typicalHalfwidthCharacterWidth);
            return (chars + 1);
        }
        static createMouseTargetFromHitTestPosition(ctx, request, spanNode, pos, injectedText) {
            const lineNumber = pos.lineNumber;
            const column = pos.column;
            const lineWidth = ctx.getLineWidth(lineNumber);
            if (request.mouseContentHorizontalOffset > lineWidth) {
                const detail = createEmptyContentDataInLines(request.mouseContentHorizontalOffset - lineWidth);
                return request.fulfillContentEmpty(pos, detail);
            }
            const visibleRange = ctx.visibleRangeForPosition(lineNumber, column);
            if (!visibleRange) {
                return request.fulfillUnknown(pos);
            }
            const columnHorizontalOffset = visibleRange.left;
            if (Math.abs(request.mouseContentHorizontalOffset - columnHorizontalOffset) < 1) {
                return request.fulfillContentText(pos, null, { mightBeForeignElement: !!injectedText, injectedText });
            }
            const points = [];
            points.push({ offset: visibleRange.left, column: column });
            if (column > 1) {
                const visibleRange = ctx.visibleRangeForPosition(lineNumber, column - 1);
                if (visibleRange) {
                    points.push({ offset: visibleRange.left, column: column - 1 });
                }
            }
            const lineMaxColumn = ctx.viewModel.getLineMaxColumn(lineNumber);
            if (column < lineMaxColumn) {
                const visibleRange = ctx.visibleRangeForPosition(lineNumber, column + 1);
                if (visibleRange) {
                    points.push({ offset: visibleRange.left, column: column + 1 });
                }
            }
            points.sort((a, b) => a.offset - b.offset);
            const mouseCoordinates = request.pos.toClientCoordinates(dom.getWindow(ctx.viewDomNode));
            const spanNodeClientRect = spanNode.getBoundingClientRect();
            const mouseIsOverSpanNode = (spanNodeClientRect.left <= mouseCoordinates.clientX && mouseCoordinates.clientX <= spanNodeClientRect.right);
            let rng = null;
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                if (prev.offset <= request.mouseContentHorizontalOffset && request.mouseContentHorizontalOffset <= curr.offset) {
                    rng = new range_1.Range(lineNumber, prev.column, lineNumber, curr.column);
                    // See https://github.com/microsoft/vscode/issues/152819
                    // Due to the use of zwj, the browser's hit test result is skewed towards the left
                    // Here we try to correct that if the mouse horizontal offset is closer to the right than the left
                    const prevDelta = Math.abs(prev.offset - request.mouseContentHorizontalOffset);
                    const nextDelta = Math.abs(curr.offset - request.mouseContentHorizontalOffset);
                    pos = (prevDelta < nextDelta
                        ? new position_1.Position(lineNumber, prev.column)
                        : new position_1.Position(lineNumber, curr.column));
                    break;
                }
            }
            return request.fulfillContentText(pos, rng, { mightBeForeignElement: !mouseIsOverSpanNode || !!injectedText, injectedText });
        }
        /**
         * Most probably WebKit browsers and Edge
         */
        static _doHitTestWithCaretRangeFromPoint(ctx, request) {
            // In Chrome, especially on Linux it is possible to click between lines,
            // so try to adjust the `hity` below so that it lands in the center of a line
            const lineNumber = ctx.getLineNumberAtVerticalOffset(request.mouseVerticalOffset);
            const lineStartVerticalOffset = ctx.getVerticalOffsetForLineNumber(lineNumber);
            const lineEndVerticalOffset = lineStartVerticalOffset + ctx.lineHeight;
            const isBelowLastLine = (lineNumber === ctx.viewModel.getLineCount()
                && request.mouseVerticalOffset > lineEndVerticalOffset);
            if (!isBelowLastLine) {
                const lineCenteredVerticalOffset = Math.floor((lineStartVerticalOffset + lineEndVerticalOffset) / 2);
                let adjustedPageY = request.pos.y + (lineCenteredVerticalOffset - request.mouseVerticalOffset);
                if (adjustedPageY <= request.editorPos.y) {
                    adjustedPageY = request.editorPos.y + 1;
                }
                if (adjustedPageY >= request.editorPos.y + request.editorPos.height) {
                    adjustedPageY = request.editorPos.y + request.editorPos.height - 1;
                }
                const adjustedPage = new editorDom_1.PageCoordinates(request.pos.x, adjustedPageY);
                const r = this._actualDoHitTestWithCaretRangeFromPoint(ctx, adjustedPage.toClientCoordinates(dom.getWindow(ctx.viewDomNode)));
                if (r.type === 1 /* HitTestResultType.Content */) {
                    return r;
                }
            }
            // Also try to hit test without the adjustment (for the edge cases that we are near the top or bottom)
            return this._actualDoHitTestWithCaretRangeFromPoint(ctx, request.pos.toClientCoordinates(dom.getWindow(ctx.viewDomNode)));
        }
        static _actualDoHitTestWithCaretRangeFromPoint(ctx, coords) {
            const shadowRoot = dom.getShadowRoot(ctx.viewDomNode);
            let range;
            if (shadowRoot) {
                if (typeof shadowRoot.caretRangeFromPoint === 'undefined') {
                    range = shadowCaretRangeFromPoint(shadowRoot, coords.clientX, coords.clientY);
                }
                else {
                    range = shadowRoot.caretRangeFromPoint(coords.clientX, coords.clientY);
                }
            }
            else {
                range = ctx.viewDomNode.ownerDocument.caretRangeFromPoint(coords.clientX, coords.clientY);
            }
            if (!range || !range.startContainer) {
                return new UnknownHitTestResult();
            }
            // Chrome always hits a TEXT_NODE, while Edge sometimes hits a token span
            const startContainer = range.startContainer;
            if (startContainer.nodeType === startContainer.TEXT_NODE) {
                // startContainer is expected to be the token text
                const parent1 = startContainer.parentNode; // expected to be the token span
                const parent2 = parent1 ? parent1.parentNode : null; // expected to be the view line container span
                const parent3 = parent2 ? parent2.parentNode : null; // expected to be the view line div
                const parent3ClassName = parent3 && parent3.nodeType === parent3.ELEMENT_NODE ? parent3.className : null;
                if (parent3ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    return HitTestResult.createFromDOMInfo(ctx, parent1, range.startOffset);
                }
                else {
                    return new UnknownHitTestResult(startContainer.parentNode);
                }
            }
            else if (startContainer.nodeType === startContainer.ELEMENT_NODE) {
                // startContainer is expected to be the token span
                const parent1 = startContainer.parentNode; // expected to be the view line container span
                const parent2 = parent1 ? parent1.parentNode : null; // expected to be the view line div
                const parent2ClassName = parent2 && parent2.nodeType === parent2.ELEMENT_NODE ? parent2.className : null;
                if (parent2ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    return HitTestResult.createFromDOMInfo(ctx, startContainer, startContainer.textContent.length);
                }
                else {
                    return new UnknownHitTestResult(startContainer);
                }
            }
            return new UnknownHitTestResult();
        }
        /**
         * Most probably Gecko
         */
        static _doHitTestWithCaretPositionFromPoint(ctx, coords) {
            const hitResult = ctx.viewDomNode.ownerDocument.caretPositionFromPoint(coords.clientX, coords.clientY);
            if (hitResult.offsetNode.nodeType === hitResult.offsetNode.TEXT_NODE) {
                // offsetNode is expected to be the token text
                const parent1 = hitResult.offsetNode.parentNode; // expected to be the token span
                const parent2 = parent1 ? parent1.parentNode : null; // expected to be the view line container span
                const parent3 = parent2 ? parent2.parentNode : null; // expected to be the view line div
                const parent3ClassName = parent3 && parent3.nodeType === parent3.ELEMENT_NODE ? parent3.className : null;
                if (parent3ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    return HitTestResult.createFromDOMInfo(ctx, hitResult.offsetNode.parentNode, hitResult.offset);
                }
                else {
                    return new UnknownHitTestResult(hitResult.offsetNode.parentNode);
                }
            }
            // For inline decorations, Gecko sometimes returns the `<span>` of the line and the offset is the `<span>` with the inline decoration
            // Some other times, it returns the `<span>` with the inline decoration
            if (hitResult.offsetNode.nodeType === hitResult.offsetNode.ELEMENT_NODE) {
                const parent1 = hitResult.offsetNode.parentNode;
                const parent1ClassName = parent1 && parent1.nodeType === parent1.ELEMENT_NODE ? parent1.className : null;
                const parent2 = parent1 ? parent1.parentNode : null;
                const parent2ClassName = parent2 && parent2.nodeType === parent2.ELEMENT_NODE ? parent2.className : null;
                if (parent1ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    // it returned the `<span>` of the line and the offset is the `<span>` with the inline decoration
                    const tokenSpan = hitResult.offsetNode.childNodes[Math.min(hitResult.offset, hitResult.offsetNode.childNodes.length - 1)];
                    if (tokenSpan) {
                        return HitTestResult.createFromDOMInfo(ctx, tokenSpan, 0);
                    }
                }
                else if (parent2ClassName === viewLine_1.ViewLine.CLASS_NAME) {
                    // it returned the `<span>` with the inline decoration
                    return HitTestResult.createFromDOMInfo(ctx, hitResult.offsetNode, 0);
                }
            }
            return new UnknownHitTestResult(hitResult.offsetNode);
        }
        static _snapToSoftTabBoundary(position, viewModel) {
            const lineContent = viewModel.getLineContent(position.lineNumber);
            const { tabSize } = viewModel.model.getOptions();
            const newPosition = cursorAtomicMoveOperations_1.AtomicTabMoveOperations.atomicPosition(lineContent, position.column - 1, tabSize, 2 /* Direction.Nearest */);
            if (newPosition !== -1) {
                return new position_1.Position(position.lineNumber, newPosition + 1);
            }
            return position;
        }
        static doHitTest(ctx, request) {
            let result = new UnknownHitTestResult();
            if (typeof ctx.viewDomNode.ownerDocument.caretRangeFromPoint === 'function') {
                result = this._doHitTestWithCaretRangeFromPoint(ctx, request);
            }
            else if (ctx.viewDomNode.ownerDocument.caretPositionFromPoint) {
                result = this._doHitTestWithCaretPositionFromPoint(ctx, request.pos.toClientCoordinates(dom.getWindow(ctx.viewDomNode)));
            }
            if (result.type === 1 /* HitTestResultType.Content */) {
                const injectedText = ctx.viewModel.getInjectedTextAt(result.position);
                const normalizedPosition = ctx.viewModel.normalizePosition(result.position, 2 /* PositionAffinity.None */);
                if (injectedText || !normalizedPosition.equals(result.position)) {
                    result = new ContentHitTestResult(normalizedPosition, result.spanNode, injectedText);
                }
            }
            return result;
        }
    }
    exports.MouseTargetFactory = MouseTargetFactory;
    function shadowCaretRangeFromPoint(shadowRoot, x, y) {
        const range = document.createRange();
        // Get the element under the point
        let el = shadowRoot.elementFromPoint(x, y);
        if (el !== null) {
            // Get the last child of the element until its firstChild is a text node
            // This assumes that the pointer is on the right of the line, out of the tokens
            // and that we want to get the offset of the last token of the line
            while (el && el.firstChild && el.firstChild.nodeType !== el.firstChild.TEXT_NODE && el.lastChild && el.lastChild.firstChild) {
                el = el.lastChild;
            }
            // Grab its rect
            const rect = el.getBoundingClientRect();
            // And its font (the computed shorthand font property might be empty, see #3217)
            const elWindow = dom.getWindow(el);
            const fontStyle = elWindow.getComputedStyle(el, null).getPropertyValue('font-style');
            const fontVariant = elWindow.getComputedStyle(el, null).getPropertyValue('font-variant');
            const fontWeight = elWindow.getComputedStyle(el, null).getPropertyValue('font-weight');
            const fontSize = elWindow.getComputedStyle(el, null).getPropertyValue('font-size');
            const lineHeight = elWindow.getComputedStyle(el, null).getPropertyValue('line-height');
            const fontFamily = elWindow.getComputedStyle(el, null).getPropertyValue('font-family');
            const font = `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}/${lineHeight} ${fontFamily}`;
            // And also its txt content
            const text = el.innerText;
            // Position the pixel cursor at the left of the element
            let pixelCursor = rect.left;
            let offset = 0;
            let step;
            // If the point is on the right of the box put the cursor after the last character
            if (x > rect.left + rect.width) {
                offset = text.length;
            }
            else {
                const charWidthReader = CharWidthReader.getInstance();
                // Goes through all the characters of the innerText, and checks if the x of the point
                // belongs to the character.
                for (let i = 0; i < text.length + 1; i++) {
                    // The step is half the width of the character
                    step = charWidthReader.getCharWidth(text.charAt(i), font) / 2;
                    // Move to the center of the character
                    pixelCursor += step;
                    // If the x of the point is smaller that the position of the cursor, the point is over that character
                    if (x < pixelCursor) {
                        offset = i;
                        break;
                    }
                    // Move between the current character and the next
                    pixelCursor += step;
                }
            }
            // Creates a range with the text node of the element and set the offset found
            range.setStart(el.firstChild, offset);
            range.setEnd(el.firstChild, offset);
        }
        return range;
    }
    class CharWidthReader {
        static { this._INSTANCE = null; }
        static getInstance() {
            if (!CharWidthReader._INSTANCE) {
                CharWidthReader._INSTANCE = new CharWidthReader();
            }
            return CharWidthReader._INSTANCE;
        }
        constructor() {
            this._cache = {};
            this._canvas = document.createElement('canvas');
        }
        getCharWidth(char, font) {
            const cacheKey = char + font;
            if (this._cache[cacheKey]) {
                return this._cache[cacheKey];
            }
            const context = this._canvas.getContext('2d');
            context.font = font;
            const metrics = context.measureText(char);
            const width = metrics.width;
            this._cache[cacheKey] = width;
            return width;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW91c2VUYXJnZXQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL2NvbnRyb2xsZXIvbW91c2VUYXJnZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBc0JoRyxJQUFXLGlCQUdWO0lBSEQsV0FBVyxpQkFBaUI7UUFDM0IsK0RBQU8sQ0FBQTtRQUNQLCtEQUFPLENBQUE7SUFDUixDQUFDLEVBSFUsaUJBQWlCLEtBQWpCLGlCQUFpQixRQUczQjtJQUVELE1BQU0sb0JBQW9CO1FBRXpCLFlBQ1UsWUFBZ0MsSUFBSTtZQUFwQyxjQUFTLEdBQVQsU0FBUyxDQUEyQjtZQUZyQyxTQUFJLHFDQUE2QjtRQUd0QyxDQUFDO0tBQ0w7SUFFRCxNQUFNLG9CQUFvQjtRQUd6QixJQUFJLFNBQVMsS0FBa0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUV0RCxZQUNVLFFBQWtCLEVBQ2xCLFFBQXFCLEVBQ3JCLFlBQWlDO1lBRmpDLGFBQVEsR0FBUixRQUFRLENBQVU7WUFDbEIsYUFBUSxHQUFSLFFBQVEsQ0FBYTtZQUNyQixpQkFBWSxHQUFaLFlBQVksQ0FBcUI7WUFQbEMsU0FBSSxxQ0FBNkI7UUFRdEMsQ0FBQztLQUNMO0lBSUQsSUFBVSxhQUFhLENBUXRCO0lBUkQsV0FBVSxhQUFhO1FBQ3RCLFNBQWdCLGlCQUFpQixDQUFDLEdBQW1CLEVBQUUsUUFBcUIsRUFBRSxNQUFjO1lBQzNGLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUQsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDZCxPQUFPLElBQUksb0JBQW9CLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMzRCxDQUFD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