/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart"], function (require, exports, dom, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewContentWidgets = void 0;
    class ViewContentWidgets extends viewPart_1.ViewPart {
        constructor(context, viewDomNode) {
            super(context);
            this._viewDomNode = viewDomNode;
            this._widgets = {};
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.domNode, 1 /* PartFingerprint.ContentWidgets */);
            this.domNode.setClassName('contentWidgets');
            this.domNode.setPosition('absolute');
            this.domNode.setTop(0);
            this.overflowingContentWidgetsDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.overflowingContentWidgetsDomNode, 2 /* PartFingerprint.OverflowingContentWidgets */);
            this.overflowingContentWidgetsDomNode.setClassName('overflowingContentWidgets');
        }
        dispose() {
            super.dispose();
            this._widgets = {};
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].onConfigurationChanged(e);
            }
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLineMappingChanged(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onLinesChanged(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onLinesDeleted(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onLinesInserted(e) {
            this._updateAnchorsViewPositions();
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onZonesChanged(e) {
            return true;
        }
        // ---- end view event handlers
        _updateAnchorsViewPositions() {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].updateAnchorViewPosition();
            }
        }
        addWidget(_widget) {
            const myWidget = new Widget(this._context, this._viewDomNode, _widget);
            this._widgets[myWidget.id] = myWidget;
            if (myWidget.allowEditorOverflow) {
                this.overflowingContentWidgetsDomNode.appendChild(myWidget.domNode);
            }
            else {
                this.domNode.appendChild(myWidget.domNode);
            }
            this.setShouldRender();
        }
        setWidgetPosition(widget, primaryAnchor, secondaryAnchor, preference, affinity) {
            const myWidget = this._widgets[widget.getId()];
            myWidget.setPosition(primaryAnchor, secondaryAnchor, preference, affinity);
            this.setShouldRender();
        }
        removeWidget(widget) {
            const widgetId = widget.getId();
            if (this._widgets.hasOwnProperty(widgetId)) {
                const myWidget = this._widgets[widgetId];
                delete this._widgets[widgetId];
                const domNode = myWidget.domNode.domNode;
                domNode.parentNode.removeChild(domNode);
                domNode.removeAttribute('monaco-visible-content-widget');
                this.setShouldRender();
            }
        }
        shouldSuppressMouseDownOnWidget(widgetId) {
            if (this._widgets.hasOwnProperty(widgetId)) {
                return this._widgets[widgetId].suppressMouseDown;
            }
            return false;
        }
        onBeforeRender(viewportData) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].onBeforeRender(viewportData);
            }
        }
        prepareRender(ctx) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].prepareRender(ctx);
            }
        }
        render(ctx) {
            const keys = Object.keys(this._widgets);
            for (const widgetId of keys) {
                this._widgets[widgetId].render(ctx);
            }
        }
    }
    exports.ViewContentWidgets = ViewContentWidgets;
    class Widget {
        constructor(context, viewDomNode, actual) {
            this._primaryAnchor = new PositionPair(null, null);
            this._secondaryAnchor = new PositionPair(null, null);
            this._context = context;
            this._viewDomNode = viewDomNode;
            this._actual = actual;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(this._actual.getDomNode());
            this.id = this._actual.getId();
            this.allowEditorOverflow = this._actual.allowEditorOverflow || false;
            this.suppressMouseDown = this._actual.suppressMouseDown || false;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._fixedOverflowWidgets = options.get(42 /* EditorOption.fixedOverflowWidgets */);
            this._contentWidth = layoutInfo.contentWidth;
            this._contentLeft = layoutInfo.contentLeft;
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._affinity = null;
            this._preference = [];
            this._cachedDomNodeOffsetWidth = -1;
            this._cachedDomNodeOffsetHeight = -1;
            this._maxWidth = this._getMaxWidth();
            this._isVisible = false;
            this._renderData = null;
            this.domNode.setPosition((this._fixedOverflowWidgets && this.allowEditorOverflow) ? 'fixed' : 'absolute');
            this.domNode.setDisplay('none');
            this.domNode.setVisibility('hidden');
            this.domNode.setAttribute('widgetId', this.id);
            this.domNode.setMaxWidth(this._maxWidth);
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            if (e.hasChanged(145 /* EditorOption.layoutInfo */)) {
                const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
                this._contentLeft = layoutInfo.contentLeft;
                this._contentWidth = layoutInfo.contentWidth;
                this._maxWidth = this._getMaxWidth();
            }
        }
        updateAnchorViewPosition() {
            this._setPosition(this._affinity, this._primaryAnchor.modelPosition, this._secondaryAnchor.modelPosition);
        }
        _setPosition(affinity, primaryAnchor, secondaryAnchor) {
            this._affinity = affinity;
            this._primaryAnchor = getValidPositionPair(primaryAnchor, this._context.viewModel, this._affinity);
            this._secondaryAnchor = getValidPositionPair(secondaryAnchor, this._context.viewModel, this._affinity);
            function getValidPositionPair(position, viewModel, affinity) {
                if (!position) {
                    return new PositionPair(null, null);
                }
                // Do not trust that widgets give a valid position
                const validModelPosition = viewModel.model.validatePosition(position);
                if (viewModel.coordinatesConverter.modelPositionIsVisible(validModelPosition)) {
                    const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(validModelPosition, affinity ?? undefined);
                    return new PositionPair(position, viewPosition);
                }
                return new PositionPair(position, null);
            }
        }
        _getMaxWidth() {
            const elDocument = this.domNode.domNode.ownerDocument;
            const elWindow = elDocument.defaultView;
            return (this.allowEditorOverflow
                ? elWindow?.innerWidth || elDocument.documentElement.offsetWidth || elDocument.body.offsetWidth
                : this._contentWidth);
        }
        setPosition(primaryAnchor, secondaryAnchor, preference, affinity) {
            this._setPosition(affinity, primaryAnchor, secondaryAnchor);
            this._preference = preference;
            if (this._primaryAnchor.viewPosition && this._preference && this._preference.length > 0) {
                // this content widget would like to be visible if possible
                // we change it from `display:none` to `display:block` even if it
                // might be outside the viewport such that we can measure its size
                // in `prepareRender`
                this.domNode.setDisplay('block');
            }
            else {
                this.domNode.setDisplay('none');
            }
            this._cachedDomNodeOffsetWidth = -1;
            this._cachedDomNodeOffsetHeight = -1;
        }
        _layoutBoxInViewport(anchor, width, height, ctx) {
            // Our visible box is split horizontally by the current line => 2 boxes
            // a) the box above the line
            const aboveLineTop = anchor.top;
            const heightAvailableAboveLine = aboveLineTop;
            // b) the box under the line
            const underLineTop = anchor.top + anchor.height;
            const heightAvailableUnderLine = ctx.viewportHeight - underLineTop;
            const aboveTop = aboveLineTop - height;
            const fitsAbove = (heightAvailableAboveLine >= height);
            const belowTop = underLineTop;
            const fitsBelow = (heightAvailableUnderLine >= height);
            // And its left
            let left = anchor.left;
            if (left + width > ctx.scrollLeft + ctx.viewportWidth) {
                left = ctx.scrollLeft + ctx.viewportWidth - width;
            }
            if (left < ctx.scrollLeft) {
                left = ctx.scrollLeft;
            }
            return { fitsAbove, aboveTop, fitsBelow, belowTop, left };
        }
        _layoutHorizontalSegmentInPage(windowSize, domNodePosition, left, width) {
            // Leave some clearance to the left/right
            const LEFT_PADDING = 15;
            const RIGHT_PADDING = 15;
            // Initially, the limits are defined as the dom node limits
            const MIN_LIMIT = Math.max(LEFT_PADDING, domNodePosition.left - width);
            const MAX_LIMIT = Math.min(domNodePosition.left + domNodePosition.width + width, windowSize.width - RIGHT_PADDING);
            const elDocument = this._viewDomNode.domNode.ownerDocument;
            const elWindow = elDocument.defaultView;
            let absoluteLeft = domNodePosition.left + left - (elWindow?.scrollX ?? 0);
            if (absoluteLeft + width > MAX_LIMIT) {
                const delta = absoluteLeft - (MAX_LIMIT - width);
                absoluteLeft -= delta;
                left -= delta;
            }
            if (absoluteLeft < MIN_LIMIT) {
                const delta = absoluteLeft - MIN_LIMIT;
                absoluteLeft -= delta;
                left -= delta;
            }
            return [left, absoluteLeft];
        }
        _layoutBoxInPage(anchor, width, height, ctx) {
            const aboveTop = anchor.top - height;
            const belowTop = anchor.top + anchor.height;
            const domNodePosition = dom.getDomNodePagePosition(this._viewDomNode.domNode);
            const elDocument = this._viewDomNode.domNode.ownerDocument;
            const elWindow = elDocument.defaultView;
            const absoluteAboveTop = domNodePosition.top + aboveTop - (elWindow?.scrollY ?? 0);
            const absoluteBelowTop = domNodePosition.top + belowTop - (elWindow?.scrollY ?? 0);
            const windowSize = dom.getClientArea(elDocument.body);
            const [left, absoluteAboveLeft] = this._layoutHorizontalSegmentInPage(windowSize, domNodePosition, anchor.left - ctx.scrollLeft + this._contentLeft, width);
            // Leave some clearance to the top/bottom
            const TOP_PADDING = 22;
            const BOTTOM_PADDING = 22;
            const fitsAbove = (absoluteAboveTop >= TOP_PADDING);
            const fitsBelow = (absoluteBelowTop + height <= windowSize.height - BOTTOM_PADDING);
            if (this._fixedOverflowWidgets) {
                return {
                    fitsAbove,
                    aboveTop: Math.max(absoluteAboveTop, TOP_PADDING),
                    fitsBelow,
                    belowTop: absoluteBelowTop,
                    left: absoluteAboveLeft
                };
            }
            return { fitsAbove, aboveTop, fitsBelow, belowTop, left };
        }
        _prepareRenderWidgetAtExactPositionOverflowing(topLeft) {
            return new Coordinate(topLeft.top, topLeft.left + this._contentLeft);
        }
        /**
         * Compute the coordinates above and below the primary and secondary anchors.
         * The content widget *must* touch the primary anchor.
         * The content widget should touch if possible the secondary anchor.
         */
        _getAnchorsCoordinates(ctx) {
            const primary = getCoordinates(this._primaryAnchor.viewPosition, this._affinity, this._lineHeight);
            const secondaryViewPosition = (this._secondaryAnchor.viewPosition?.lineNumber === this._primaryAnchor.viewPosition?.lineNumber ? this._secondaryAnchor.viewPosition : null);
            const secondary = getCoordinates(secondaryViewPosition, this._affinity, this._lineHeight);
            return { primary, secondary };
            function getCoordinates(position, affinity, lineHeight) {
                if (!position) {
                    return null;
                }
                const horizontalPosition = ctx.visibleRangeForPosition(position);
                if (!horizontalPosition) {
                    return null;
                }
                // Left-align widgets that should appear :before content
                const left = (position.column === 1 && affinity === 3 /* PositionAffinity.LeftOfInjectedText */ ? 0 : horizontalPosition.left);
                const top = ctx.getVerticalOffsetForLineNumber(position.lineNumber) - ctx.scrollTop;
                return new AnchorCoordinate(top, left, lineHeight);
            }
        }
        _reduceAnchorCoordinates(primary, secondary, width) {
            if (!secondary) {
                return primary;
            }
            const fontInfo = this._context.configuration.options.get(50 /* EditorOption.fontInfo */);
            let left = secondary.left;
            if (left < primary.left) {
                left = Math.max(left, primary.left - width + fontInfo.typicalFullwidthCharacterWidth);
            }
            else {
                left = Math.min(left, primary.left + width - fontInfo.typicalFullwidthCharacterWidth);
            }
            return new AnchorCoordinate(primary.top, left, primary.height);
        }
        _prepareRenderWidget(ctx) {
            if (!this._preference || this._preference.length === 0) {
                return null;
            }
            const { primary, secondary } = this._getAnchorsCoordinates(ctx);
            if (!primary) {
                return null;
            }
            if (this._cachedDomNodeOffsetWidth === -1 || this._cachedDomNodeOffsetHeight === -1) {
                let preferredDimensions = null;
                if (typeof this._actual.beforeRender === 'function') {
                    preferredDimensions = safeInvoke(this._actual.beforeRender, this._actual);
                }
                if (preferredDimensions) {
                    this._cachedDomNodeOffsetWidth = preferredDimensions.width;
                    this._cachedDomNodeOffsetHeight = preferredDimensions.height;
                }
                else {
                    const domNode = this.domNode.domNode;
                    const clientRect = domNode.getBoundingClientRect();
                    this._cachedDomNodeOffsetWidth = Math.round(clientRect.width);
                    this._cachedDomNodeOffsetHeight = Math.round(clientRect.height);
                }
            }
            const anchor = this._reduceAnchorCoordinates(primary, secondary, this._cachedDomNodeOffsetWidth);
            let placement;
            if (this.allowEditorOverflow) {
                placement = this._layoutBoxInPage(anchor, this._cachedDomNodeOffsetWidth, this._cachedDomNodeOffsetHeight, ctx);
            }
            else {
                placement = this._layoutBoxInViewport(anchor, this._cachedDomNodeOffsetWidth, this._cachedDomNodeOffsetHeight, ctx);
            }
            // Do two passes, first for perfect fit, second picks first option
            for (let pass = 1; pass <= 2; pass++) {
                for (const pref of this._preference) {
                    // placement
                    if (pref === 1 /* ContentWidgetPositionPreference.ABOVE */) {
                        if (!placement) {
                            // Widget outside of viewport
                            return null;
                        }
                        if (pass === 2 || placement.fitsAbove) {
                            return { coordinate: new Coordinate(placement.aboveTop, placement.left), position: 1 /* ContentWidgetPositionPreference.ABOVE */ };
                        }
                    }
                    else if (pref === 2 /* ContentWidgetPositionPreference.BELOW */) {
                        if (!placement) {
                            // Widget outside of viewport
                            return null;
                        }
                        if (pass === 2 || placement.fitsBelow) {
                            return { coordinate: new Coordinate(placement.belowTop, placement.left), position: 2 /* ContentWidgetPositionPreference.BELOW */ };
                        }
                    }
                    else {
                        if (this.allowEditorOverflow) {
                            return { coordinate: this._prepareRenderWidgetAtExactPositionOverflowing(new Coordinate(anchor.top, anchor.left)), position: 0 /* ContentWidgetPositionPreference.EXACT */ };
                        }
                        else {
                            return { coordinate: new Coordinate(anchor.top, anchor.left), position: 0 /* ContentWidgetPositionPreference.EXACT */ };
                        }
                    }
                }
            }
            return null;
        }
        /**
         * On this first pass, we ensure that the content widget (if it is in the viewport) has the max width set correctly.
         */
        onBeforeRender(viewportData) {
            if (!this._primaryAnchor.viewPosition || !this._preference) {
                return;
            }
            if (this._primaryAnchor.viewPosition.lineNumber < viewportData.startLineNumber || this._primaryAnchor.viewPosition.lineNumber > viewportData.endLineNumber) {
                // Outside of viewport
                return;
            }
            this.domNode.setMaxWidth(this._maxWidth);
        }
        prepareRender(ctx) {
            this._renderData = this._prepareRenderWidget(ctx);
        }
        render(ctx) {
            if (!this._renderData) {
                // This widget should be invisible
                if (this._isVisible) {
                    this.domNode.removeAttribute('monaco-visible-content-widget');
                    this._isVisible = false;
                    this.domNode.setVisibility('hidden');
                }
                if (typeof this._actual.afterRender === 'function') {
                    safeInvoke(this._actual.afterRender, this._actual, null);
                }
                return;
            }
            // This widget should be visible
            if (this.allowEditorOverflow) {
                this.domNode.setTop(this._renderData.coordinate.top);
                this.domNode.setLeft(this._renderData.coordinate.left);
            }
            else {
                this.domNode.setTop(this._renderData.coordinate.top + ctx.scrollTop - ctx.bigNumbersDelta);
                this.domNode.setLeft(this._renderData.coordinate.left);
            }
            if (!this._isVisible) {
                this.domNode.setVisibility('inherit');
                this.domNode.setAttribute('monaco-visible-content-widget', 'true');
                this._isVisible = true;
            }
            if (typeof this._actual.afterRender === 'function') {
                safeInvoke(this._actual.afterRender, this._actual, this._renderData.position);
            }
        }
    }
    class PositionPair {
        constructor(modelPosition, viewPosition) {
            this.modelPosition = modelPosition;
            this.viewPosition = viewPosition;
        }
    }
    class Coordinate {
        constructor(top, left) {
            this.top = top;
            this.left = left;
            this._coordinateBrand = undefined;
        }
    }
    class AnchorCoordinate {
        constructor(top, left, height) {
            this.top = top;
            this.left = left;
            this.height = height;
            this._anchorCoordinateBrand = undefined;
        }
    }
    function safeInvoke(fn, thisArg, ...args) {
        try {
            return fn.call(thisArg, ...args);
        }
        catch {
            // ignore
            return null;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudFdpZGdldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9jb250ZW50V2lkZ2V0cy9jb250ZW50V2lkZ2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVE7UUFRL0MsWUFBWSxPQUFvQixFQUFFLFdBQXFDO1lBQ3RFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBRW5CLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDaEUsMkJBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLHlDQUFpQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkIsSUFBSSxDQUFDLGdDQUFnQyxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ3pGLDJCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLG9EQUE0QyxDQUFDO1lBQ3pHLElBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxZQUFZLENBQUMsMkJBQTJCLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBRWUsT0FBTztZ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