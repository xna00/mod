/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/config/domFontInfo", "vs/editor/browser/view/viewLayer", "vs/editor/browser/view/viewPart"], function (require, exports, fastDomNode_1, domFontInfo_1, viewLayer_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarginViewOverlays = exports.ContentViewOverlays = exports.ViewOverlayLine = exports.ViewOverlays = void 0;
    class ViewOverlays extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._visibleLines = new viewLayer_1.VisibleLinesCollection(this);
            this.domNode = this._visibleLines.domNode;
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            (0, domFontInfo_1.applyFontInfo)(this.domNode, fontInfo);
            this._dynamicOverlays = [];
            this._isFocused = false;
            this.domNode.setClassName('view-overlays');
        }
        shouldRender() {
            if (super.shouldRender()) {
                return true;
            }
            for (let i = 0, len = this._dynamicOverlays.length; i < len; i++) {
                const dynamicOverlay = this._dynamicOverlays[i];
                if (dynamicOverlay.shouldRender()) {
                    return true;
                }
            }
            return false;
        }
        dispose() {
            super.dispose();
            for (let i = 0, len = this._dynamicOverlays.length; i < len; i++) {
                const dynamicOverlay = this._dynamicOverlays[i];
                dynamicOverlay.dispose();
            }
            this._dynamicOverlays = [];
        }
        getDomNode() {
            return this.domNode;
        }
        // ---- begin IVisibleLinesHost
        createVisibleLine() {
            return new ViewOverlayLine(this._dynamicOverlays);
        }
        // ---- end IVisibleLinesHost
        addDynamicOverlay(overlay) {
            this._dynamicOverlays.push(overlay);
        }
        // ----- event handlers
        onConfigurationChanged(e) {
            this._visibleLines.onConfigurationChanged(e);
            const options = this._context.configuration.options;
            const fontInfo = options.get(50 /* EditorOption.fontInfo */);
            (0, domFontInfo_1.applyFontInfo)(this.domNode, fontInfo);
            return true;
        }
        onFlushed(e) {
            return this._visibleLines.onFlushed(e);
        }
        onFocusChanged(e) {
            this._isFocused = e.isFocused;
            return true;
        }
        onLinesChanged(e) {
            return this._visibleLines.onLinesChanged(e);
        }
        onLinesDeleted(e) {
            return this._visibleLines.onLinesDeleted(e);
        }
        onLinesInserted(e) {
            return this._visibleLines.onLinesInserted(e);
        }
        onScrollChanged(e) {
            return this._visibleLines.onScrollChanged(e) || true;
        }
        onTokensChanged(e) {
            return this._visibleLines.onTokensChanged(e);
        }
        onZonesChanged(e) {
            return this._visibleLines.onZonesChanged(e);
        }
        // ----- end event handlers
        prepareRender(ctx) {
            const toRender = this._dynamicOverlays.filter(overlay => overlay.shouldRender());
            for (let i = 0, len = toRender.length; i < len; i++) {
                const dynamicOverlay = toRender[i];
                dynamicOverlay.prepareRender(ctx);
                dynamicOverlay.onDidRender();
            }
        }
        render(ctx) {
            // Overwriting to bypass `shouldRender` flag
            this._viewOverlaysRender(ctx);
            this.domNode.toggleClassName('focused', this._isFocused);
        }
        _viewOverlaysRender(ctx) {
            this._visibleLines.renderLines(ctx.viewportData);
        }
    }
    exports.ViewOverlays = ViewOverlays;
    class ViewOverlayLine {
        constructor(dynamicOverlays) {
            this._dynamicOverlays = dynamicOverlays;
            this._domNode = null;
            this._renderedContent = null;
        }
        getDomNode() {
            if (!this._domNode) {
                return null;
            }
            return this._domNode.domNode;
        }
        setDomNode(domNode) {
            this._domNode = (0, fastDomNode_1.createFastDomNode)(domNode);
        }
        onContentChanged() {
            // Nothing
        }
        onTokensChanged() {
            // Nothing
        }
        renderLine(lineNumber, deltaTop, lineHeight, viewportData, sb) {
            let result = '';
            for (let i = 0, len = this._dynamicOverlays.length; i < len; i++) {
                const dynamicOverlay = this._dynamicOverlays[i];
                result += dynamicOverlay.render(viewportData.startLineNumber, lineNumber);
            }
            if (this._renderedContent === result) {
                // No rendering needed
                return false;
            }
            this._renderedContent = result;
            sb.appendString('<div style="top:');
            sb.appendString(String(deltaTop));
            sb.appendString('px;height:');
            sb.appendString(String(lineHeight));
            sb.appendString('px;">');
            sb.appendString(result);
            sb.appendString('</div>');
            return true;
        }
        layoutLine(lineNumber, deltaTop, lineHeight) {
            if (this._domNode) {
                this._domNode.setTop(deltaTop);
                this._domNode.setHeight(lineHeight);
            }
        }
    }
    exports.ViewOverlayLine = ViewOverlayLine;
    class ContentViewOverlays extends ViewOverlays {
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._contentWidth = layoutInfo.contentWidth;
            this.domNode.setHeight(0);
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._contentWidth = layoutInfo.contentWidth;
            return super.onConfigurationChanged(e) || true;
        }
        onScrollChanged(e) {
            return super.onScrollChanged(e) || e.scrollWidthChanged;
        }
        // --- end event handlers
        _viewOverlaysRender(ctx) {
            super._viewOverlaysRender(ctx);
            this.domNode.setWidth(Math.max(ctx.scrollWidth, this._contentWidth));
        }
    }
    exports.ContentViewOverlays = ContentViewOverlays;
    class MarginViewOverlays extends ViewOverlays {
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._contentLeft = layoutInfo.contentLeft;
            this.domNode.setClassName('margin-view-overlays');
            this.domNode.setWidth(1);
            (0, domFontInfo_1.applyFontInfo)(this.domNode, options.get(50 /* EditorOption.fontInfo */));
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            (0, domFontInfo_1.applyFontInfo)(this.domNode, options.get(50 /* EditorOption.fontInfo */));
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._contentLeft = layoutInfo.contentLeft;
            return super.onConfigurationChanged(e) || true;
        }
        onScrollChanged(e) {
            return super.onScrollChanged(e) || e.scrollHeightChanged;
        }
        _viewOverlaysRender(ctx) {
            super._viewOverlaysRender(ctx);
            const height = Math.min(ctx.scrollHeight, 1000000);
            this.domNode.setHeight(height);
            this.domNode.setWidth(this._contentLeft);
        }
    }
    exports.MarginViewOverlays = MarginViewOverlays;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld092ZXJsYXlzLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9lZGl0b3IvYnJvd3Nlci92aWV3L3ZpZXdPdmVybGF5cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFjaEcsTUFBYSxZQUFhLFNBQVEsbUJBQVE7UUFPekMsWUFBWSxPQUFvQjtZQUMvQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFZixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksa0NBQXNCLENBQWtCLElBQUksQ0FBQyxDQUFDO1lBQ3ZFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7WUFFMUMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLGdDQUF1QixDQUFDO1lBQ3BELElBQUEsMkJBQWEsRUFBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7WUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7WUFFeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDNUMsQ0FBQztRQUVlLFlBQVk7WUFDM0IsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELElBQUksY0FBYyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7b0JBQ25DLE9BQU8sSUFBSSxDQUFDO2dCQUNiLENBQUM7WUFDRixDQUFDO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRWUsT0FBTztZQUN0QixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUNsRSxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQixDQUFDO1lBQ0QsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztRQUM1QixDQUFDO1FBRU0sVUFBVTtZQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVELCtCQUErQjtRQUV4QixpQkFBaUI7WUFDdkIsT0FBTyxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNuRCxDQUFDO1FBRUQsNkJBQTZCO1FBRXRCLGlCQUFpQixDQUFDLE9BQTJCO1lBQ25ELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUVELHVCQUF1QjtRQUVQLHNCQUFzQixDQUFDLENBQTJDO1lBQ2pGLElBQUksQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFN0MsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLGdDQUF1QixDQUFDO1lBQ3BELElBQUEsMkJBQWEsRUFBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRXRDLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNlLFNBQVMsQ0FBQyxDQUE4QjtZQUN2RCxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFDZSxjQUFjLENBQUMsQ0FBbUM7WUFDakUsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQzlCLE9BQU8sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNlLGNBQWMsQ0FBQyxDQUFtQztZQUNqRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFDZSxjQUFjLENBQUMsQ0FBbUM7WUFDakUsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQ2UsZUFBZSxDQUFDLENBQW9DO1lBQ25FLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUNlLGVBQWUsQ0FBQyxDQUFvQztZQUNuRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztRQUN0RCxDQUFDO1FBQ2UsZUFBZSxDQUFDLENBQW9DO1lBQ25FLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUNlLGNBQWMsQ0FBQyxDQUFtQztZQUNqRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdDLENBQUM7UUFFRCwyQkFBMkI7UUFFcEIsYUFBYSxDQUFDLEdBQXFCO1lBQ3pDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUVqRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3JELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDbEMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlCLENBQUM7UUFDRixDQUFDO1FBRU0sTUFBTSxDQUFDLEdBQStCO1lBQzVDLDRDQUE0QztZQUM1QyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxRCxDQUFDO1FBRUQsbUJBQW1CLENBQUMsR0FBK0I7WUFDbEQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FDRDtJQTNIRCxvQ0EySEM7SUFFRCxNQUFhLGVBQWU7UUFNM0IsWUFBWSxlQUFxQztZQUNoRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZUFBZSxDQUFDO1lBRXhDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDOUIsQ0FBQztRQUVNLFVBQVU7WUFDaEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDcEIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUM5QixDQUFDO1FBQ00sVUFBVSxDQUFDLE9BQW9CO1lBQ3JDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBQSwrQkFBaUIsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBRU0sZ0JBQWdCO1lBQ3RCLFVBQVU7UUFDWCxDQUFDO1FBQ00sZUFBZTtZQUNyQixVQUFVO1FBQ1gsQ0FBQztRQUVNLFVBQVUsQ0FBQyxVQUFrQixFQUFFLFFBQWdCLEVBQUUsVUFBa0IsRUFBRSxZQUEwQixFQUFFLEVBQWlCO1lBQ3hILElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2xFLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsTUFBTSxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUMzRSxDQUFDO1lBRUQsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ3RDLHNCQUFzQjtnQkFDdEIsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztZQUUvQixFQUFFLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDcEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNsQyxFQUFFLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlCLEVBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixFQUFFLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hCLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFMUIsT0FBTyxJQUFJLENBQUM7UUFDYixDQUFDO1FBRU0sVUFBVSxDQUFDLFVBQWtCLEVBQUUsUUFBZ0IsRUFBRSxVQUFrQjtZQUN6RSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDRixDQUFDO0tBQ0Q7SUE3REQsMENBNkRDO0lBRUQsTUFBYSxtQkFBb0IsU0FBUSxZQUFZO1FBSXBELFlBQVksT0FBb0I7WUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2YsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUU3QyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsMkJBQTJCO1FBRVgsc0JBQXNCLENBQUMsQ0FBMkM7WUFDakYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQztZQUM3QyxPQUFPLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDaEQsQ0FBQztRQUNlLGVBQWUsQ0FBQyxDQUFvQztZQUNuRSxPQUFPLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGtCQUFrQixDQUFDO1FBQ3pELENBQUM7UUFFRCx5QkFBeUI7UUFFaEIsbUJBQW1CLENBQUMsR0FBK0I7WUFDM0QsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRS9CLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUN0RSxDQUFDO0tBQ0Q7SUFoQ0Qsa0RBZ0NDO0lBRUQsTUFBYSxrQkFBbUIsU0FBUSxZQUFZO1FBSW5ELFlBQVksT0FBb0I7WUFDL0IsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWYsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUUzQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpCLElBQUEsMkJBQWEsRUFBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLGdDQUF1QixDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVlLHNCQUFzQixDQUFDLENBQTJDO1lBQ2pGLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxJQUFBLDJCQUFhLEVBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxnQ0FBdUIsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLG1DQUF5QixDQUFDO1lBQ3hELElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztZQUMzQyxPQUFPLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDaEQsQ0FBQztRQUVlLGVBQWUsQ0FBQyxDQUFvQztZQUNuRSxPQUFPLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLG1CQUFtQixDQUFDO1FBQzFELENBQUM7UUFFUSxtQkFBbUIsQ0FBQyxHQUErQjtZQUMzRCxLQUFLLENBQUMsbUJBQW1CLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxQyxDQUFDO0tBQ0Q7SUFuQ0QsZ0RBbUNDIn0=