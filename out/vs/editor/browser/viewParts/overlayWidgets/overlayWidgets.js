/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/base/browser/dom", "vs/css!./overlayWidgets"], function (require, exports, fastDomNode_1, viewPart_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewOverlayWidgets = void 0;
    class ViewOverlayWidgets extends viewPart_1.ViewPart {
        constructor(context, viewDomNode) {
            super(context);
            this._viewDomNode = viewDomNode;
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._widgets = {};
            this._verticalScrollbarWidth = layoutInfo.verticalScrollbarWidth;
            this._minimapWidth = layoutInfo.minimap.minimapWidth;
            this._horizontalScrollbarHeight = layoutInfo.horizontalScrollbarHeight;
            this._editorHeight = layoutInfo.height;
            this._editorWidth = layoutInfo.width;
            this._viewDomNodeRect = { top: 0, left: 0, width: 0, height: 0 };
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this._domNode, 4 /* PartFingerprint.OverlayWidgets */);
            this._domNode.setClassName('overlayWidgets');
            this.overflowingOverlayWidgetsDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            viewPart_1.PartFingerprints.write(this.overflowingOverlayWidgetsDomNode, 5 /* PartFingerprint.OverflowingOverlayWidgets */);
            this.overflowingOverlayWidgetsDomNode.setClassName('overflowingOverlayWidgets');
        }
        dispose() {
            super.dispose();
            this._widgets = {};
        }
        getDomNode() {
            return this._domNode;
        }
        // ---- begin view event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(145 /* EditorOption.layoutInfo */);
            this._verticalScrollbarWidth = layoutInfo.verticalScrollbarWidth;
            this._minimapWidth = layoutInfo.minimap.minimapWidth;
            this._horizontalScrollbarHeight = layoutInfo.horizontalScrollbarHeight;
            this._editorHeight = layoutInfo.height;
            this._editorWidth = layoutInfo.width;
            return true;
        }
        // ---- end view event handlers
        addWidget(widget) {
            const domNode = (0, fastDomNode_1.createFastDomNode)(widget.getDomNode());
            this._widgets[widget.getId()] = {
                widget: widget,
                preference: null,
                domNode: domNode
            };
            // This is sync because a widget wants to be in the dom
            domNode.setPosition('absolute');
            domNode.setAttribute('widgetId', widget.getId());
            if (widget.allowEditorOverflow) {
                this.overflowingOverlayWidgetsDomNode.appendChild(domNode);
            }
            else {
                this._domNode.appendChild(domNode);
            }
            this.setShouldRender();
            this._updateMaxMinWidth();
        }
        setWidgetPosition(widget, preference) {
            const widgetData = this._widgets[widget.getId()];
            if (widgetData.preference === preference) {
                this._updateMaxMinWidth();
                return false;
            }
            widgetData.preference = preference;
            this.setShouldRender();
            this._updateMaxMinWidth();
            return true;
        }
        removeWidget(widget) {
            const widgetId = widget.getId();
            if (this._widgets.hasOwnProperty(widgetId)) {
                const widgetData = this._widgets[widgetId];
                const domNode = widgetData.domNode.domNode;
                delete this._widgets[widgetId];
                domNode.remove();
                this.setShouldRender();
                this._updateMaxMinWidth();
            }
        }
        _updateMaxMinWidth() {
            let maxMinWidth = 0;
            const keys = Object.keys(this._widgets);
            for (let i = 0, len = keys.length; i < len; i++) {
                const widgetId = keys[i];
                const widget = this._widgets[widgetId];
                const widgetMinWidthInPx = widget.widget.getMinContentWidthInPx?.();
                if (typeof widgetMinWidthInPx !== 'undefined') {
                    maxMinWidth = Math.max(maxMinWidth, widgetMinWidthInPx);
                }
            }
            this._context.viewLayout.setOverlayWidgetsMinWidth(maxMinWidth);
        }
        _renderWidget(widgetData) {
            const domNode = widgetData.domNode;
            if (widgetData.preference === null) {
                domNode.setTop('');
                return;
            }
            if (widgetData.preference === 0 /* OverlayWidgetPositionPreference.TOP_RIGHT_CORNER */) {
                domNode.setTop(0);
                domNode.setRight((2 * this._verticalScrollbarWidth) + this._minimapWidth);
            }
            else if (widgetData.preference === 1 /* OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER */) {
                const widgetHeight = domNode.domNode.clientHeight;
                domNode.setTop((this._editorHeight - widgetHeight - 2 * this._horizontalScrollbarHeight));
                domNode.setRight((2 * this._verticalScrollbarWidth) + this._minimapWidth);
            }
            else if (widgetData.preference === 2 /* OverlayWidgetPositionPreference.TOP_CENTER */) {
                domNode.setTop(0);
                domNode.domNode.style.right = '50%';
            }
            else {
                const { top, left } = widgetData.preference;
                const fixedOverflowWidgets = this._context.configuration.options.get(42 /* EditorOption.fixedOverflowWidgets */);
                if (fixedOverflowWidgets && widgetData.widget.allowEditorOverflow) {
                    // top, left are computed relative to the editor and we need them relative to the page
                    const editorBoundingBox = this._viewDomNodeRect;
                    domNode.setTop(top + editorBoundingBox.top);
                    domNode.setLeft(left + editorBoundingBox.left);
                    domNode.setPosition('fixed');
                }
                else {
                    domNode.setTop(top);
                    domNode.setLeft(left);
                    domNode.setPosition('absolute');
                }
            }
        }
        prepareRender(ctx) {
            this._viewDomNodeRect = dom.getDomNodePagePosition(this._viewDomNode.domNode);
        }
        render(ctx) {
            this._domNode.setWidth(this._editorWidth);
            const keys = Object.keys(this._widgets);
            for (let i = 0, len = keys.length; i < len; i++) {
                const widgetId = keys[i];
                this._renderWidget(this._widgets[widgetId]);
            }
        }
    }
    exports.ViewOverlayWidgets = ViewOverlayWidgets;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3ZlcmxheVdpZGdldHMuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2VkaXRvci9icm93c2VyL3ZpZXdQYXJ0cy9vdmVybGF5V2lkZ2V0cy9vdmVybGF5V2lkZ2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUF1QmhHLE1BQWEsa0JBQW1CLFNBQVEsbUJBQVE7UUFhL0MsWUFBWSxPQUFvQixFQUFFLFdBQXFDO1lBQ3RFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNmLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBRWhDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxtQ0FBeUIsQ0FBQztZQUV4RCxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsdUJBQXVCLEdBQUcsVUFBVSxDQUFDLHNCQUFzQixDQUFDO1lBQ2pFLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7WUFDckQsSUFBSSxDQUFDLDBCQUEwQixHQUFHLFVBQVUsQ0FBQyx5QkFBeUIsQ0FBQztZQUN2RSxJQUFJLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUM7WUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQ3JDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUVqRSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUEsK0JBQWlC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