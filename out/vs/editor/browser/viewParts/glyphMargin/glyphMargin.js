/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/arrays", "vs/editor/browser/view/dynamicViewOverlay", "vs/editor/browser/view/viewPart", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model", "vs/css!./glyphMargin"], function (require, exports, fastDomNode_1, arrays_1, dynamicViewOverlay_1, viewPart_1, position_1, range_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlyphMarginWidgets = exports.DedupOverlay = exports.VisibleLineDecorationsToRender = exports.LineDecorationToRender = exports.DecorationToRender = void 0;
    /**
     * Represents a decoration that should be shown along the lines from `startLineNumber` to `endLineNumber`.
     * This can end up producing multiple `LineDecorationToRender`.
     */
    class DecorationToRender {
        constructor(startLineNumber, endLineNumber, className, tooltip, zIndex) {
            this.startLineNumber = startLineNumber;
            this.endLineNumber = endLineNumber;
            this.className = className;
            this.tooltip = tooltip;
            this._decorationToRenderBrand = undefined;
            this.zIndex = zIndex ?? 0;
        }
    }
    exports.DecorationToRender = DecorationToRender;
    /**
     * A decoration that should be shown along a line.
     */
    class LineDecorationToRender {
        constructor(className, zIndex, tooltip) {
            this.className = className;
            this.zIndex = zIndex;
            this.tooltip = tooltip;
        }
    }
    exports.LineDecorationToRender = LineDecorationToRender;
    /**
     * Decorations to render on a visible line.
     */
    class VisibleLineDecorationsToRender {
        constructor() {
            this.decorations = [];
        }
        add(decoration) {
            this.decorations.push(decoration);
        }
        getDecorations() {
            return this.decorations;
        }
    }
    exports.VisibleLineDecorationsToRender = VisibleLineDecorationsToRender;
    class DedupOverlay extends dynamicViewOverlay_1.DynamicViewOverlay {
        /**
         * Returns an array with an element for each visible line number.
         */
        _render(visibleStartLineNumber, visibleEndLineNumber, decorations) {
            const output = [];
            for (let lineNumber = visibleStartLineNumber; lineNumber <= visibleEndLineNumber; lineNumber++) {
                const lineIndex = lineNumber - visibleStartLineNumber;
                output[lineIndex] = new VisibleLineDecorationsToRender();
            }
            if (decorations.length === 0) {
                return output;
            }
            // Sort decorations by className, then by startLineNumber and then by endLineNumber
            decorations.sort((a, b) => {
                if (a.className === b.className) {
                    if (a.startLineNumber === b.startLineNumber) {
                        return a.endLineNumber - b.endLineNumber;
                    }
                    return a.startLineNumber - b.startLineNumber;
                }
                return (a.className < b.className ? -1 : 1);
            });
            let prevClassName = null;
            let prevEndLineIndex = 0;
            for (let i = 0, len = decorations.length; i < len; i++) {
                const d = decorations[i];
                const className = d.className;
                const zIndex = d.zIndex;
                let startLineIndex = Math.max(d.startLineNumber, visibleStartLineNumber) - visibleStartLineNumber;
                const endLineIndex = Math.min(d.endLineNumber, visibleEndLineNumber) - visibleStartLineNumber;
                if (prevClassName === className) {
                    // Here we avoid rendering the same className multiple times on the same line
                    startLineIndex = Math.max(prevEndLineIndex + 1, startLineIndex);
                    prevEndLineIndex = Math.max(prevEndLineIndex, endLineIndex);
                }
                else {
                    prevClassName = className;
                    prevEndLineIndex = endLineIndex;
                }
                for (let i = startLineIndex; i <= prevEndLineIndex; i++) {
                    output[i].add(new LineDecorationToRender(className, zIndex, d.tooltip));
                }
            }
            return output;
        }
    }
    exports.DedupOverlay = DedupOverlay;
    class GlyphMarginWidgets extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._widgets = {};
            this._context = context;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setClassName('glyph-margin-widgets');
            this.domNode.setPosition('absolute');
            this.domNode.setTop(0);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._glyphMargin = options.get(57 /* EditorOption.glyphMargin */);
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            this._glyphMarginDecorationLaneCount = layoutInfo.glyphMarginDecorationLaneCount;
            this._managedDomNodes = [];
            this._decorationGlyphsToRender = [];
        }
        dispose() {
            this._managedDomNodes = [];
            this._decorationGlyphsToRender = [];
            this._widgets = {};
            super.dispose();
        }
        getWidgets() {
            return Object.values(this._widgets);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._lineHeight = options.get(67 /* EditorOption.lineHeight */);
            this._glyphMargin = options.get(57 /* EditorOption.glyphMargin */);
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            this._glyphMarginDecorationLaneCount = layoutInfo.glyphMarginDecorationLaneCount;
            return true;
        }
        onDecorationsChanged(e) {
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return e.scrollTopChanged;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // --- begin widget management
        addWidget(widget) {
            const domNode = (0, fastDomNode_1.createFastDomNode)(widget.getDomNode());
            this._widgets[widget.getId()] = {
                widget: widget,
                preference: widget.getPosition(),
                domNode: domNode,
                renderInfo: null
            };
            domNode.setPosition('absolute');
            domNode.setDisplay('none');
            domNode.setAttribute('widgetId', widget.getId());
            this.domNode.appendChild(domNode);
            this.setShouldRender();
        }
        setWidgetPosition(widget, preference) {
            const myWidget = this._widgets[widget.getId()];
            if (myWidget.preference.lane === preference.lane
                && myWidget.preference.zIndex === preference.zIndex
                && range_1.Range.equalsRange(myWidget.preference.range, preference.range)) {
                return false;
            }
            myWidget.preference = preference;
            this.setShouldRender();
            return true;
        }
        removeWidget(widget) {
            const widgetId = widget.getId();
            if (this._widgets[widgetId]) {
                const widgetData = this._widgets[widgetId];
                const domNode = widgetData.domNode.domNode;
                delete this._widgets[widgetId];
                domNode.parentNode?.removeChild(domNode);
                this.setShouldRender();
            }
        }
        // --- end widget management
        _collectDecorationBasedGlyphRenderRequest(ctx, requests) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            const decorations = ctx.getDecorationsInViewport();
            for (const d of decorations) {
                const glyphMarginClassName = d.options.glyphMarginClassName;
                if (!glyphMarginClassName) {
                    continue;
                }
                const startLineNumber = Math.max(d.range.startLineNumber, visibleStartLineNumber);
                const endLineNumber = Math.min(d.range.endLineNumber, visibleEndLineNumber);
                const lane = d.options.glyphMargin?.position ?? model_1.GlyphMarginLane.Center;
                const zIndex = d.options.zIndex ?? 0;
                for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                    const modelPosition = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(lineNumber, 0));
                    const laneIndex = this._context.viewModel.glyphLanes.getLanesAtLine(modelPosition.lineNumber).indexOf(lane);
                    requests.push(new DecorationBasedGlyphRenderRequest(lineNumber, laneIndex, zIndex, glyphMarginClassName));
                }
            }
        }
        _collectWidgetBasedGlyphRenderRequest(ctx, requests) {
            const visibleStartLineNumber = ctx.visibleRange.startLineNumber;
            const visibleEndLineNumber = ctx.visibleRange.endLineNumber;
            for (const widget of Object.values(this._widgets)) {
                const range = widget.preference.range;
                const { startLineNumber, endLineNumber } = this._context.viewModel.coordinatesConverter.convertModelRangeToViewRange(range_1.Range.lift(range));
                if (!startLineNumber || !endLineNumber || endLineNumber < visibleStartLineNumber || startLineNumber > visibleEndLineNumber) {
                    // The widget is not in the viewport
                    continue;
                }
                // The widget is in the viewport, find a good line for it
                const widgetLineNumber = Math.max(startLineNumber, visibleStartLineNumber);
                const modelPosition = this._context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(new position_1.Position(widgetLineNumber, 0));
                const laneIndex = this._context.viewModel.glyphLanes.getLanesAtLine(modelPosition.lineNumber).indexOf(widget.preference.lane);
                requests.push(new WidgetBasedGlyphRenderRequest(widgetLineNumber, laneIndex, widget.preference.zIndex, widget));
            }
        }
        _collectSortedGlyphRenderRequests(ctx) {
            const requests = [];
            this._collectDecorationBasedGlyphRenderRequest(ctx, requests);
            this._collectWidgetBasedGlyphRenderRequest(ctx, requests);
            // sort requests by lineNumber ASC, lane  ASC, zIndex DESC, type DESC (widgets first), className ASC
            // don't change this sort unless you understand `prepareRender` below.
            requests.sort((a, b) => {
                if (a.lineNumber === b.lineNumber) {
                    if (a.laneIndex === b.laneIndex) {
                        if (a.zIndex === b.zIndex) {
                            if (b.type === a.type) {
                                if (a.type === 0 /* GlyphRenderRequestType.Decoration */ && b.type === 0 /* GlyphRenderRequestType.Decoration */) {
                                    return (a.className < b.className ? -1 : 1);
                                }
                                return 0;
                            }
                            return b.type - a.type;
                        }
                        return b.zIndex - a.zIndex;
                    }
                    return a.laneIndex - b.laneIndex;
                }
                return a.lineNumber - b.lineNumber;
            });
            return requests;
        }
        /**
         * Will store render information in each widget's renderInfo and in `_decorationGlyphsToRender`.
         */
        prepareRender(ctx) {
            if (!this._glyphMargin) {
                this._decorationGlyphsToRender = [];
                return;
            }
            for (const widget of Object.values(this._widgets)) {
                widget.renderInfo = null;
            }
            const requests = new arrays_1.ArrayQueue(this._collectSortedGlyphRenderRequests(ctx));
            const decorationGlyphsToRender = [];
            while (requests.length > 0) {
                const first = requests.peek();
                if (!first) {
                    // not possible
                    break;
                }
                // Requests are sorted by lineNumber and lane, so we read all requests for this particular location
                const requestsAtLocation = requests.takeWhile((el) => el.lineNumber === first.lineNumber && el.laneIndex === first.laneIndex);
                if (!requestsAtLocation || requestsAtLocation.length === 0) {
                    // not possible
                    break;
                }
                const winner = requestsAtLocation[0];
                if (winner.type === 0 /* GlyphRenderRequestType.Decoration */) {
                    // combine all decorations with the same z-index
                    const classNames = [];
                    // requests are sorted by zIndex, type, and className so we can dedup className by looking at the previous one
                    for (const request of requestsAtLocation) {
                        if (request.zIndex !== winner.zIndex || request.type !== winner.type) {
                            break;
                        }
                        if (classNames.length === 0 || classNames[classNames.length - 1] !== request.className) {
                            classNames.push(request.className);
                        }
                    }
                    decorationGlyphsToRender.push(winner.accept(classNames.join(' '))); // TODO@joyceerhl Implement overflow for remaining decorations
                }
                else {
                    // widgets cannot be combined
                    winner.widget.renderInfo = {
                        lineNumber: winner.lineNumber,
                        laneIndex: winner.laneIndex,
                    };
                }
            }
            this._decorationGlyphsToRender = decorationGlyphsToRender;
        }
        render(ctx) {
            if (!this._glyphMargin) {
                for (const widget of Object.values(this._widgets)) {
                    widget.domNode.setDisplay('none');
                }
                while (this._managedDomNodes.length > 0) {
                    const domNode = this._managedDomNodes.pop();
                    domNode?.domNode.remove();
                }
                return;
            }
            const width = (Math.round(this._glyphMarginWidth / this._glyphMarginDecorationLaneCount));
            // Render widgets
            for (const widget of Object.values(this._widgets)) {
                if (!widget.renderInfo) {
                    // this widget is not visible
                    widget.domNode.setDisplay('none');
                }
                else {
                    const top = ctx.viewportData.relativeVerticalOffset[widget.renderInfo.lineNumber - ctx.viewportData.startLineNumber];
                    const left = this._glyphMarginLeft + widget.renderInfo.laneIndex * this._lineHeight;
                    widget.domNode.setDisplay('block');
                    widget.domNode.setTop(top);
                    widget.domNode.setLeft(left);
                    widget.domNode.setWidth(width);
                    widget.domNode.setHeight(this._lineHeight);
                }
            }
            // Render decorations, reusing previous dom nodes as possible
            for (let i = 0; i < this._decorationGlyphsToRender.length; i++) {
                const dec = this._decorationGlyphsToRender[i];
                const top = ctx.viewportData.relativeVerticalOffset[dec.lineNumber - ctx.viewportData.startLineNumber];
                const left = this._glyphMarginLeft + dec.laneIndex * this._lineHeight;
                let domNode;
                if (i < this._managedDomNodes.length) {
                    domNode = this._managedDomNodes[i];
                }
                else {
                    domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                    this._managedDomNodes.push(domNode);
                    this.domNode.appendChild(domNode);
                }
                domNode.setClassName(`cgmr codicon ` + dec.combinedClassName);
                domNode.setPosition(`absolute`);
                domNode.setTop(top);
                domNode.setLeft(left);
                domNode.setWidth(width);
                domNode.setHeight(this._lineHeight);
            }
            // remove extra dom nodes
            while (this._managedDomNodes.length > this._decorationGlyphsToRender.length) {
                const domNode = this._managedDomNodes.pop();
                domNode?.domNode.remove();
            }
        }
    }
    exports.GlyphMarginWidgets = GlyphMarginWidgets;
    var GlyphRenderRequestType;
    (function (GlyphRenderRequestType) {
        GlyphRenderRequestType[GlyphRenderRequestType["Decoration"] = 0] = "Decoration";
        GlyphRenderRequestType[GlyphRenderRequestType["Widget"] = 1] = "Widget";
    })(GlyphRenderRequestType || (GlyphRenderRequestType = {}));
    /**
     * A request to render a decoration in the glyph margin at a certain location.
     */
    class DecorationBasedGlyphRenderRequest {
        constructor(lineNumber, laneIndex, zIndex, className) {
            this.lineNumber = lineNumber;
            this.laneIndex = laneIndex;
            this.zIndex = zIndex;
            this.className = className;
            this.type = 0 /* GlyphRenderRequestType.Decoration */;
        }
        accept(combinedClassName) {
            return new DecorationBasedGlyph(this.lineNumber, this.laneIndex, combinedClassName);
        }
    }
    /**
     * A request to render a widget in the glyph margin at a certain location.
     */
    class WidgetBasedGlyphRenderRequest {
        constructor(lineNumber, laneIndex, zIndex, widget) {
            this.lineNumber = lineNumber;
            this.laneIndex = laneIndex;
            this.zIndex = zIndex;
            this.widget = widget;
            this.type = 1 /* GlyphRenderRequestType.Widget */;
        }
    }
    class DecorationBasedGlyph {
        constructor(lineNumber, laneIndex, combinedClassName) {
            this.lineNumber = lineNumber;
            this.laneIndex = laneIndex;
            this.combinedClassName = combinedClassName;
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2x5cGhNYXJnaW4uanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9nbHlwaE1hcmdpbi9nbHlwaE1hcmdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFnQmhHOzs7T0FHRztJQUNILE1BQWEsa0JBQWtCO1FBSzlCLFlBQ2lCLGVBQXVCLEVBQ3ZCLGFBQXFCLEVBQ3JCLFNBQWlCLEVBQ2pCLE9BQXNCLEVBQ3RDLE1BQTBCO1lBSlYsb0JBQWUsR0FBZixlQUFlLENBQVE7WUFDdkIsa0JBQWEsR0FBYixhQUFhLENBQVE7WUFDckIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixZQUFPLEdBQVAsT0FBTyxDQUFlO1lBUnZCLDZCQUF3QixHQUFTLFNBQVMsQ0FBQztZQVcxRCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLENBQUM7UUFDM0IsQ0FBQztLQUNEO0lBZEQsZ0RBY0M7SUFFRDs7T0FFRztJQUNILE1BQWEsc0JBQXNCO1FBQ2xDLFlBQ2lCLFNBQWlCLEVBQ2pCLE1BQWMsRUFDZCxPQUFzQjtZQUZ0QixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLFdBQU0sR0FBTixNQUFNLENBQVE7WUFDZCxZQUFPLEdBQVAsT0FBTyxDQUFlO1FBQ25DLENBQUM7S0FDTDtJQU5ELHdEQU1DO0lBRUQ7O09BRUc7SUFDSCxNQUFhLDhCQUE4QjtRQUEzQztZQUVrQixnQkFBVyxHQUE2QixFQUFFLENBQUM7UUFTN0QsQ0FBQztRQVBPLEdBQUcsQ0FBQyxVQUFrQztZQUM1QyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBRU0sY0FBYztZQUNwQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDekIsQ0FBQztLQUNEO0lBWEQsd0VBV0M7SUFFRCxNQUFzQixZQUFhLFNBQVEsdUNBQWtCO1FBRTVEOztXQUVHO1FBQ08sT0FBTyxDQUFDLHNCQUE4QixFQUFFLG9CQUE0QixFQUFFLFdBQWlDO1lBRWhILE1BQU0sTUFBTSxHQUFxQyxFQUFFLENBQUM7WUFDcEQsS0FBSyxJQUFJLFVBQVUsR0FBRyxzQkFBc0IsRUFBRSxVQUFVLElBQUksb0JBQW9CLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztnQkFDaEcsTUFBTSxTQUFTLEdBQUcsVUFBVSxHQUFHLHNCQUFzQixDQUFDO2dCQUN0RCxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSw4QkFBOEIsRUFBRSxDQUFDO1lBQzFELENBQUM7WUFFRCxJQUFJLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQzlCLE9BQU8sTUFBTSxDQUFDO1lBQ2YsQ0FBQztZQUVELG1GQUFtRjtZQUNuRixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN6QixJQUFJLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO29CQUNqQyxJQUFJLENBQUMsQ0FBQyxlQUFlLEtBQUssQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO3dCQUM3QyxPQUFPLENBQUMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLGFBQWEsQ0FBQztvQkFDMUMsQ0FBQztvQkFDRCxPQUFPLENBQUMsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLGVBQWUsQ0FBQztnQkFDOUMsQ0FBQztnQkFDRCxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0MsQ0FBQyxDQUFDLENBQUM7WUFFSCxJQUFJLGFBQWEsR0FBa0IsSUFBSSxDQUFDO1lBQ3hDLElBQUksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUM5QixNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO2dCQUN4QixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsc0JBQXNCLENBQUMsR0FBRyxzQkFBc0IsQ0FBQztnQkFDbEcsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxFQUFFLG9CQUFvQixDQUFDLEdBQUcsc0JBQXNCLENBQUM7Z0JBRTlGLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUNqQyw2RUFBNkU7b0JBQzdFLGNBQWMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztvQkFDaEUsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDN0QsQ0FBQztxQkFBTSxDQUFDO29CQUNQLGFBQWEsR0FBRyxTQUFTLENBQUM7b0JBQzFCLGdCQUFnQixHQUFHLFlBQVksQ0FBQztnQkFDakMsQ0FBQztnQkFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLGNBQWMsRUFBRSxDQUFDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDekQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLHNCQUFzQixDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3pFLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxNQUFNLENBQUM7UUFDZixDQUFDO0tBQ0Q7SUFyREQsb0NBcURDO0lBRUQsTUFBYSxrQkFBbUIsU0FBUSxtQkFBUTtRQWUvQyxZQUFZLE9BQW9CO1lBQy9CLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUhSLGFBQVEsR0FBbUMsRUFBRSxDQUFDO1lBSXJELElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBRXhCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQztZQUV4RCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxrQ0FBeUIsQ0FBQztZQUN4RCxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUEwQixDQUFDO1lBQzFELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO1lBQ25ELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUM7WUFDckQsSUFBSSxDQUFDLCtCQUErQixHQUFHLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNqRixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxFQUFFLENBQUM7UUFDckMsQ0FBQztRQUVlLE9BQU87WUFDdEIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUMseUJBQXlCLEdBQUcsRUFBRSxDQUFDO1lBQ3BDLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ25CLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFFRCwyQkFBMkI7UUFDWCxzQkFBc0IsQ0FBQyxDQUEyQztZQUNqRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFDcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsbUNBQXlCLENBQUM7WUFFeEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxrQ0FBeUIsQ0FBQztZQUN4RCxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUEwQixDQUFDO1lBQzFELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO1lBQ25ELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUM7WUFDckQsSUFBSSxDQUFDLCtCQUErQixHQUFHLFVBQVUsQ0FBQyw4QkFBOEIsQ0FBQztZQUNqRixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDZSxvQkFBb0IsQ0FBQyxDQUF5QztZQUM3RSxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDZSxTQUFTLENBQUMsQ0FBOEI7WUFDdkQsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ2UsY0FBYyxDQUFDLENBQW1DO1lBQ2pFLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNlLGNBQWMsQ0FBQyxDQUFtQztZQUNqRSxPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFDZSxlQUFlLENBQUMsQ0FBb0M7WUFDbkUsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBQ2UsZUFBZSxDQUFDLENBQW9DO1lBQ25FLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBQzNCLENBQUM7UUFDZSxjQUFjLENBQUMsQ0FBbUM7WUFDakUsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRUQseUJBQXlCO1FBRXpCLDhCQUE4QjtRQUV2QixTQUFTLENBQUMsTUFBMEI7WUFDMUMsTUFBTSxPQUFPLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUV2RCxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHO2dCQUMvQixNQUFNLEVBQUUsTUFBTTtnQkFDZCxVQUFVLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRTtnQkFDaEMsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2FBQ2hCLENBQUM7WUFFRixPQUFPLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDM0IsT0FBTyxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbEMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3hCLENBQUM7UUFFTSxpQkFBaUIsQ0FBQyxNQUEwQixFQUFFLFVBQXNDO1lBQzFGLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDL0MsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsSUFBSTttQkFDNUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssVUFBVSxDQUFDLE1BQU07bUJBQ2hELGFBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3BFLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZQUVELFFBQVEsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQ2pDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUV2QixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFTSxZQUFZLENBQUMsTUFBMEI7WUFDN0MsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2hDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM3QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztnQkFDM0MsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUUvQixPQUFPLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3hCLENBQUM7UUFDRixDQUFDO1FBRUQsNEJBQTRCO1FBRXBCLHlDQUF5QyxDQUFDLEdBQXFCLEVBQUUsUUFBOEI7WUFDdEcsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQztZQUNoRSxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDO1lBQzVELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBRW5ELEtBQUssTUFBTSxDQUFDLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQzdCLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQztnQkFDNUQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7b0JBQzNCLFNBQVM7Z0JBQ1YsQ0FBQztnQkFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLHNCQUFzQixDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztnQkFDNUUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxJQUFJLHVCQUFlLENBQUMsTUFBTSxDQUFDO2dCQUN2RSxNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7Z0JBRXJDLEtBQUssSUFBSSxVQUFVLEdBQUcsZUFBZSxFQUFFLFVBQVUsSUFBSSxhQUFhLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQztvQkFDbEYsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsa0NBQWtDLENBQUMsSUFBSSxtQkFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNuSSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzVHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxpQ0FBaUMsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7Z0JBQzNHLENBQUM7WUFDRixDQUFDO1FBQ0YsQ0FBQztRQUVPLHFDQUFxQyxDQUFDLEdBQXFCLEVBQUUsUUFBOEI7WUFDbEcsTUFBTSxzQkFBc0IsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQztZQUNoRSxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDO1lBRTVELEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQ3RDLE1BQU0sRUFBRSxlQUFlLEVBQUUsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsNEJBQTRCLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN4SSxJQUFJLENBQUMsZUFBZSxJQUFJLENBQUMsYUFBYSxJQUFJLGFBQWEsR0FBRyxzQkFBc0IsSUFBSSxlQUFlLEdBQUcsb0JBQW9CLEVBQUUsQ0FBQztvQkFDNUgsb0NBQW9DO29CQUNwQyxTQUFTO2dCQUNWLENBQUM7Z0JBRUQseURBQXlEO2dCQUN6RCxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLHNCQUFzQixDQUFDLENBQUM7Z0JBQzNFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLGtDQUFrQyxDQUFDLElBQUksbUJBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6SSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUgsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLDZCQUE2QixDQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pILENBQUM7UUFDRixDQUFDO1FBRU8saUNBQWlDLENBQUMsR0FBcUI7WUFFOUQsTUFBTSxRQUFRLEdBQXlCLEVBQUUsQ0FBQztZQUUxQyxJQUFJLENBQUMseUNBQXlDLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxxQ0FBcUMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFMUQsb0dBQW9HO1lBQ3BHLHNFQUFzRTtZQUN0RSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN0QixJQUFJLENBQUMsQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO29CQUNuQyxJQUFJLENBQUMsQ0FBQyxTQUFTLEtBQUssQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO3dCQUNqQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDOzRCQUMzQixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO2dDQUN2QixJQUFJLENBQUMsQ0FBQyxJQUFJLDhDQUFzQyxJQUFJLENBQUMsQ0FBQyxJQUFJLDhDQUFzQyxFQUFFLENBQUM7b0NBQ2xHLE9BQU8sQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDN0MsQ0FBQztnQ0FDRCxPQUFPLENBQUMsQ0FBQzs0QkFDVixDQUFDOzRCQUNELE9BQU8sQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUN4QixDQUFDO3dCQUNELE9BQU8sQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO29CQUM1QixDQUFDO29CQUNELE9BQU8sQ0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUNsQyxDQUFDO2dCQUNELE9BQU8sQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO1lBQ3BDLENBQUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxRQUFRLENBQUM7UUFDakIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksYUFBYSxDQUFDLEdBQXFCO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hCLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxFQUFFLENBQUM7Z0JBQ3BDLE9BQU87WUFDUixDQUFDO1lBRUQsS0FBSyxNQUFNLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztZQUMxQixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBVSxDQUFxQixJQUFJLENBQUMsaUNBQWlDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRyxNQUFNLHdCQUF3QixHQUEyQixFQUFFLENBQUM7WUFDNUQsT0FBTyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDWixlQUFlO29CQUNmLE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxtR0FBbUc7Z0JBQ25HLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxTQUFTLEtBQUssS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUM5SCxJQUFJLENBQUMsa0JBQWtCLElBQUksa0JBQWtCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUM1RCxlQUFlO29CQUNmLE1BQU07Z0JBQ1AsQ0FBQztnQkFFRCxNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDckMsSUFBSSxNQUFNLENBQUMsSUFBSSw4Q0FBc0MsRUFBRSxDQUFDO29CQUN2RCxnREFBZ0Q7b0JBRWhELE1BQU0sVUFBVSxHQUFhLEVBQUUsQ0FBQztvQkFDaEMsOEdBQThHO29CQUM5RyxLQUFLLE1BQU0sT0FBTyxJQUFJLGtCQUFrQixFQUFFLENBQUM7d0JBQzFDLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUN0RSxNQUFNO3dCQUNQLENBQUM7d0JBQ0QsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7NEJBQ3hGLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNwQyxDQUFDO29CQUNGLENBQUM7b0JBRUQsd0JBQXdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyw4REFBOEQ7Z0JBQ25JLENBQUM7cUJBQU0sQ0FBQztvQkFDUCw2QkFBNkI7b0JBQzdCLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHO3dCQUMxQixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7d0JBQzdCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztxQkFDM0IsQ0FBQztnQkFDSCxDQUFDO1lBQ0YsQ0FBQztZQUNELElBQUksQ0FBQyx5QkFBeUIsR0FBRyx3QkFBd0IsQ0FBQztRQUMzRCxDQUFDO1FBRU0sTUFBTSxDQUFDLEdBQStCO1lBQzVDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3hCLEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztvQkFDbkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ25DLENBQUM7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO29CQUN6QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQzVDLE9BQU8sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzNCLENBQUM7Z0JBQ0QsT0FBTztZQUNSLENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUM7WUFFMUYsaUJBQWlCO1lBQ2pCLEtBQUssTUFBTSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztvQkFDeEIsNkJBQTZCO29CQUM3QixNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztxQkFBTSxDQUFDO29CQUNQLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDckgsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7b0JBRXBGLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNuQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztvQkFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzdCLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMvQixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzVDLENBQUM7WUFDRixDQUFDO1lBRUQsNkRBQTZEO1lBQzdELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2hFLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3ZHLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBRXRFLElBQUksT0FBaUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUN0QyxPQUFPLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxDQUFDO3FCQUFNLENBQUM7b0JBQ1AsT0FBTyxHQUFHLElBQUEsK0JBQWlCLEVBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMzRCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDbkMsQ0FBQztnQkFFRCxPQUFPLENBQUMsWUFBWSxDQUFDLGVBQWUsR0FBRyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFDOUQsT0FBTyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDaEMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUVELHlCQUF5QjtZQUN6QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUM3RSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQzVDLE9BQU8sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDM0IsQ0FBQztRQUNGLENBQUM7S0FDRDtJQWxVRCxnREFrVUM7SUFrQkQsSUFBVyxzQkFHVjtJQUhELFdBQVcsc0JBQXNCO1FBQ2hDLCtFQUFjLENBQUE7UUFDZCx1RUFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUhVLHNCQUFzQixLQUF0QixzQkFBc0IsUUFHaEM7SUFFRDs7T0FFRztJQUNILE1BQU0saUNBQWlDO1FBR3RDLFlBQ2lCLFVBQWtCLEVBQ2xCLFNBQWlCLEVBQ2pCLE1BQWMsRUFDZCxTQUFpQjtZQUhqQixlQUFVLEdBQVYsVUFBVSxDQUFRO1lBQ2xCLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFDakIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUNkLGNBQVMsR0FBVCxTQUFTLENBQVE7WUFObEIsU0FBSSw2Q0FBcUM7UUFPckQsQ0FBQztRQUVMLE1BQU0sQ0FBQyxpQkFBeUI7WUFDL0IsT0FBTyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JGLENBQUM7S0FDRDtJQUVEOztPQUVHO0lBQ0gsTUFBTSw2QkFBNkI7UUFHbEMsWUFDaUIsVUFBa0IsRUFDbEIsU0FBaUIsRUFDakIsTUFBYyxFQUNkLE1BQW1CO1lBSG5CLGVBQVUsR0FBVixVQUFVLENBQVE7WUFDbEIsY0FBUyxHQUFULFNBQVMsQ0FBUTtZQUNqQixXQUFNLEdBQU4sTUFBTSxDQUFRO1lBQ2QsV0FBTSxHQUFOLE1BQU0sQ0FBYTtZQU5wQixTQUFJLHlDQUFpQztRQU9qRCxDQUFDO0tBQ0w7SUFJRCxNQUFNLG9CQUFvQjtRQUN6QixZQUNpQixVQUFrQixFQUNsQixTQUFpQixFQUNqQixpQkFBeUI7WUFGekIsZUFBVSxHQUFWLFVBQVUsQ0FBUTtZQUNsQixjQUFTLEdBQVQsU0FBUyxDQUFRO1lBQ2pCLHNCQUFpQixHQUFqQixpQkFBaUIsQ0FBUTtRQUN0QyxDQUFDO0tBQ0wifQ==