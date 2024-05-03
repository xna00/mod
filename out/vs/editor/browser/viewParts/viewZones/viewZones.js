/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/errors", "vs/editor/browser/view/viewPart", "vs/editor/common/core/position"], function (require, exports, fastDomNode_1, errors_1, viewPart_1, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewZones = void 0;
    const invalidFunc = () => { throw new Error(`Invalid change accessor`); };
    class ViewZones extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._contentWidth = layoutInfo.contentWidth;
            this._contentLeft = layoutInfo.contentLeft;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName('view-zones');
            this.domNode.setPosition('absolute');
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.marginDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.marginDomNode.setClassName('margin-view-zones');
            this.marginDomNode.setPosition('absolute');
            this.marginDomNode.setAttribute('role', 'presentation');
            this.marginDomNode.setAttribute('aria-hidden', 'true');
            this._zones = {};
        }
        dispose() {
            super.dispose();
            this._zones = {};
        }
        // ---- begin view event handlers
        _recomputeWhitespacesProps() {
            const whitespaces = this._context.viewLayout.getWhitespaces();
            const oldWhitespaces = new Map();
            for (const whitespace of whitespaces) {
                oldWhitespaces.set(whitespace.id, whitespace);
            }
            let hadAChange = false;
            this._context.viewModel.changeWhitespace((whitespaceAccessor) => {
                const keys = Object.keys(this._zones);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const id = keys[i];
                    const zone = this._zones[id];
                    const props = this._computeWhitespaceProps(zone.delegate);
                    zone.isInHiddenArea = props.isInHiddenArea;
                    const oldWhitespace = oldWhitespaces.get(id);
                    if (oldWhitespace && (oldWhitespace.afterLineNumber !== props.afterViewLineNumber || oldWhitespace.height !== props.heightInPx)) {
                        whitespaceAccessor.changeOneWhitespace(id, props.afterViewLineNumber, props.heightInPx);
                        this._safeCallOnComputedHeight(zone.delegate, props.heightInPx);
                        hadAChange = true;
                    }
                }
            });
            return hadAChange;
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._contentWidth = layoutInfo.contentWidth;
            this._contentLeft = layoutInfo.contentLeft;
            if (e.hasChanged(67 /* EditorOption.lineHeight */)) {
                this._recomputeWhitespacesProps();
            }
            return true;
        }
        onLineMappingChanged(e) {
            return this._recomputeWhitespacesProps();
        }
        onLinesDeleted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged || e.scrollWidthChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        // ---- end view event handlers
        _getZoneOrdinal(zone) {
            return zone.ordinal ?? zone.afterColumn ?? 10000;
        }
        _computeWhitespaceProps(zone) {
            if (zone.afterLineNumber === 0) {
                return {
                    isInHiddenArea: false,
                    afterViewLineNumber: 0,
                    heightInPx: this._heightInPixels(zone),
                    minWidthInPx: this._minWidthInPixels(zone)
                };
            }
            let zoneAfterModelPosition;
            if (typeof zone.afterColumn !== 'undefined') {
                zoneAfterModelPosition = this._context.viewModel.model.validatePosition({
                    lineNumber: zone.afterLineNumber,
                    column: zone.afterColumn
                });
            }
            else {
                const validAfterLineNumber = this._context.viewModel.model.validatePosition({
                    lineNumber: zone.afterLineNumber,
                    column: 1
                }).lineNumber;
                zoneAfterModelPosition = new position_1.Position(validAfterLineNumber, this._context.viewModel.model.getLineMaxColumn(validAfterLineNumber));
            }
            let zoneBeforeModelPosition;
            if (zoneAfterModelPosition.column === this._context.viewModel.model.getLineMaxColumn(zoneAfterModelPosition.lineNumber)) {
                zoneBeforeModelPosition = this._context.viewModel.model.validatePosition({
                    lineNumber: zoneAfterModelPosition.lineNumber + 1,
                    column: 1
                });
            }
            else {
                zoneBeforeModelPosition = this._context.viewModel.model.validatePosition({
                    lineNumber: zoneAfterModelPosition.lineNumber,
                    column: zoneAfterModelPosition.column + 1
                });
            }
            const viewPosition = this._context.viewModel.coordinatesConverter.convertModelPositionToViewPosition(zoneAfterModelPosition, zone.afterColumnAffinity, true);
            const isVisible = zone.showInHiddenAreas || this._context.viewModel.coordinatesConverter.modelPositionIsVisible(zoneBeforeModelPosition);
            return {
                isInHiddenArea: !isVisible,
                afterViewLineNumber: viewPosition.lineNumber,
                heightInPx: (isVisible ? this._heightInPixels(zone) : 0),
                minWidthInPx: this._minWidthInPixels(zone)
            };
        }
        changeViewZones(callback) {
            let zonesHaveChanged = false;
            this._context.viewModel.changeWhitespace((whitespaceAccessor) => {
                const changeAccessor = {
                    addZone: (zone) => {
                        zonesHaveChanged = true;
                        return this._addZone(whitespaceAccessor, zone);
                    },
                    removeZone: (id) => {
                        if (!id) {
                            return;
                        }
                        zonesHaveChanged = this._removeZone(whitespaceAccessor, id) || zonesHaveChanged;
                    },
                    layoutZone: (id) => {
                        if (!id) {
                            return;
                        }
                        zonesHaveChanged = this._layoutZone(whitespaceAccessor, id) || zonesHaveChanged;
                    }
                };
                safeInvoke1Arg(callback, changeAccessor);
                // Invalidate changeAccessor
                changeAccessor.addZone = invalidFunc;
                changeAccessor.removeZone = invalidFunc;
                changeAccessor.layoutZone = invalidFunc;
            });
            return zonesHaveChanged;
        }
        _addZone(whitespaceAccessor, zone) {
            const props = this._computeWhitespaceProps(zone);
            const whitespaceId = whitespaceAccessor.insertWhitespace(props.afterViewLineNumber, this._getZoneOrdinal(zone), props.heightInPx, props.minWidthInPx);
            const myZone = {
                whitespaceId: whitespaceId,
                delegate: zone,
                isInHiddenArea: props.isInHiddenArea,
                isVisible: false,
                domNode: (0, fastDomNode_1.createFastDomNode)(zone.domNode),
                marginDomNode: zone.marginDomNode ? (0, fastDomNode_1.createFastDomNode)(zone.marginDomNode) : null
            };
            this._safeCallOnComputedHeight(myZone.delegate, props.heightInPx);
            myZone.domNode.setPosition('absolute');
            myZone.domNode.domNode.style.width = '100%';
            myZone.domNode.setDisplay('none');
            myZone.domNode.setAttribute('monaco-view-zone', myZone.whitespaceId);
            this.domNode.appendChild(myZone.domNode);
            if (myZone.marginDomNode) {
                myZone.marginDomNode.setPosition('absolute');
                myZone.marginDomNode.domNode.style.width = '100%';
                myZone.marginDomNode.setDisplay('none');
                myZone.marginDomNode.setAttribute('monaco-view-zone', myZone.whitespaceId);
                this.marginDomNode.appendChild(myZone.marginDomNode);
            }
            this._zones[myZone.whitespaceId] = myZone;
            this.setShouldRender();
            return myZone.whitespaceId;
        }
        _removeZone(whitespaceAccessor, id) {
            if (this._zones.hasOwnProperty(id)) {
                const zone = this._zones[id];
                delete this._zones[id];
                whitespaceAccessor.removeWhitespace(zone.whitespaceId);
                zone.domNode.removeAttribute('monaco-visible-view-zone');
                zone.domNode.removeAttribute('monaco-view-zone');
                zone.domNode.domNode.parentNode.removeChild(zone.domNode.domNode);
                if (zone.marginDomNode) {
                    zone.marginDomNode.removeAttribute('monaco-visible-view-zone');
                    zone.marginDomNode.removeAttribute('monaco-view-zone');
                    zone.marginDomNode.domNode.parentNode.removeChild(zone.marginDomNode.domNode);
                }
                this.setShouldRender();
                return true;
            }
            return false;
        }
        _layoutZone(whitespaceAccessor, id) {
            if (this._zones.hasOwnProperty(id)) {
                const zone = this._zones[id];
                const props = this._computeWhitespaceProps(zone.delegate);
                zone.isInHiddenArea = props.isInHiddenArea;
                // const newOrdinal = this._getZoneOrdinal(zone.delegate);
                whitespaceAccessor.changeOneWhitespace(zone.whitespaceId, props.afterViewLineNumber, props.heightInPx);
                // TODO@Alex: change `newOrdinal` too
                this._safeCallOnComputedHeight(zone.delegate, props.heightInPx);
                this.setShouldRender();
                return true;
            }
            return false;
        }
        shouldSuppressMouseDownOnViewZone(id) {
            if (this._zones.hasOwnProperty(id)) {
                const zone = this._zones[id];
                return Boolean(zone.delegate.suppressMouseDown);
            }
            return false;
        }
        _heightInPixels(zone) {
            if (typeof zone.heightInPx === 'number') {
                return zone.heightInPx;
            }
            if (typeof zone.heightInLines === 'number') {
                return this._lineHeight * zone.heightInLines;
            }
            return this._lineHeight;
        }
        _minWidthInPixels(zone) {
            if (typeof zone.minWidthInPx === 'number') {
                return zone.minWidthInPx;
            }
            return 0;
        }
        _safeCallOnComputedHeight(zone, height) {
            if (typeof zone.onComputedHeight === 'function') {
                try {
                    zone.onComputedHeight(height);
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                }
            }
        }
        _safeCallOnDomNodeTop(zone, top) {
            if (typeof zone.onDomNodeTop === 'function') {
                try {
                    zone.onDomNodeTop(top);
                }
                catch (e) {
                    (0, errors_1.onUnexpectedError)(e);
                }
            }
        }
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            const visibleWhitespaces = ctx.viewportData.whitespaceViewportData;
            const visibleZones = {};
            let hasVisibleZone = false;
            for (const visibleWhitespace of visibleWhitespaces) {
                if (this._zones[visibleWhitespace.id].isInHiddenArea) {
                    continue;
                }
                visibleZones[visibleWhitespace.id] = visibleWhitespace;
                hasVisibleZone = true;
            }
            const keys = Object.keys(this._zones);
            for (let i = 0, len = keys.length; i < len; i++) {
                const id = keys[i];
                const zone = this._zones[id];
                let newTop = 0;
                let newHeight = 0;
                let newDisplay = 'none';
                if (visibleZones.hasOwnProperty(id)) {
                    newTop = visibleZones[id].verticalOffset - ctx.bigNumbersDelta;
                    newHeight = visibleZones[id].height;
                    newDisplay = 'block';
                    // zone is visible
                    if (!zone.isVisible) {
                        zone.domNode.setAttribute('monaco-visible-view-zone', 'true');
                        zone.isVisible = true;
                    }
                    this._safeCallOnDomNodeTop(zone.delegate, ctx.getScrolledTopFromAbsoluteTop(visibleZones[id].verticalOffset));
                }
                else {
                    if (zone.isVisible) {
                        zone.domNode.removeAttribute('monaco-visible-view-zone');
                        zone.isVisible = false;
                    }
                    this._safeCallOnDomNodeTop(zone.delegate, ctx.getScrolledTopFromAbsoluteTop(-1000000));
                }
                zone.domNode.setTop(newTop);
                zone.domNode.setHeight(newHeight);
                zone.domNode.setDisplay(newDisplay);
                if (zone.marginDomNode) {
                    zone.marginDomNode.setTop(newTop);
                    zone.marginDomNode.setHeight(newHeight);
                    zone.marginDomNode.setDisplay(newDisplay);
                }
            }
            if (hasVisibleZone) {
                this.domNode.setWidth(Math.max(ctx.scrollWidth, this._contentWidth));
                this.marginDomNode.setWidth(this._contentLeft);
            }
        }
    }
    exports.ViewZones = ViewZones;
    function safeInvoke1Arg(func, arg1) {
        try {
            return func(arg1);
        }
        catch (e) {
            (0, errors_1.onUnexpectedError)(e);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld1pvbmVzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3UGFydHMvdmlld1pvbmVzL3ZpZXdab25lcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUE2QmhHLE1BQU0sV0FBVyxHQUFHLEdBQUcsRUFBRSxHQUFHLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUUxRSxNQUFhLFNBQVUsU0FBUSxtQkFBUTtRQVd0QyxZQUFZLE9BQW9CO1lBQy9CLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNmLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQztZQUV4RCxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLGtDQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUM3QyxJQUFJLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUM7WUFFM0MsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLCtCQUFpQixFQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUN4QyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FB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