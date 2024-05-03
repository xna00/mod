/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/resizable/resizable", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/base/browser/dom"], function (require, exports, resizable_1, lifecycle_1, position_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResizableContentWidget = void 0;
    const TOP_HEIGHT = 30;
    const BOTTOM_HEIGHT = 24;
    class ResizableContentWidget extends lifecycle_1.Disposable {
        constructor(_editor, minimumSize = new dom.Dimension(10, 10)) {
            super();
            this._editor = _editor;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._resizableNode = this._register(new resizable_1.ResizableHTMLElement());
            this._contentPosition = null;
            this._isResizing = false;
            this._resizableNode.domNode.style.position = 'absolute';
            this._resizableNode.minSize = dom.Dimension.lift(minimumSize);
            this._resizableNode.layout(minimumSize.height, minimumSize.width);
            this._resizableNode.enableSashes(true, true, true, true);
            this._register(this._resizableNode.onDidResize(e => {
                this._resize(new dom.Dimension(e.dimension.width, e.dimension.height));
                if (e.done) {
                    this._isResizing = false;
                }
            }));
            this._register(this._resizableNode.onDidWillResize(() => {
                this._isResizing = true;
            }));
        }
        get isResizing() {
            return this._isResizing;
        }
        getDomNode() {
            return this._resizableNode.domNode;
        }
        getPosition() {
            return this._contentPosition;
        }
        get position() {
            return this._contentPosition?.position ? position_1.Position.lift(this._contentPosition.position) : undefined;
        }
        _availableVerticalSpaceAbove(position) {
            const editorDomNode = this._editor.getDomNode();
            const mouseBox = this._editor.getScrolledVisiblePosition(position);
            if (!editorDomNode || !mouseBox) {
                return;
            }
            const editorBox = dom.getDomNodePagePosition(editorDomNode);
            return editorBox.top + mouseBox.top - TOP_HEIGHT;
        }
        _availableVerticalSpaceBelow(position) {
            const editorDomNode = this._editor.getDomNode();
            const mouseBox = this._editor.getScrolledVisiblePosition(position);
            if (!editorDomNode || !mouseBox) {
                return;
            }
            const editorBox = dom.getDomNodePagePosition(editorDomNode);
            const bodyBox = dom.getClientArea(editorDomNode.ownerDocument.body);
            const mouseBottom = editorBox.top + mouseBox.top + mouseBox.height;
            return bodyBox.height - mouseBottom - BOTTOM_HEIGHT;
        }
        _findPositionPreference(widgetHeight, showAtPosition) {
            const maxHeightBelow = Math.min(this._availableVerticalSpaceBelow(showAtPosition) ?? Infinity, widgetHeight);
            const maxHeightAbove = Math.min(this._availableVerticalSpaceAbove(showAtPosition) ?? Infinity, widgetHeight);
            const maxHeight = Math.min(Math.max(maxHeightAbove, maxHeightBelow), widgetHeight);
            const height = Math.min(widgetHeight, maxHeight);
            let renderingAbove;
            if (this._editor.getOption(60 /* EditorOption.hover */).above) {
                renderingAbove = height <= maxHeightAbove ? 1 /* ContentWidgetPositionPreference.ABOVE */ : 2 /* ContentWidgetPositionPreference.BELOW */;
            }
            else {
                renderingAbove = height <= maxHeightBelow ? 2 /* ContentWidgetPositionPreference.BELOW */ : 1 /* ContentWidgetPositionPreference.ABOVE */;
            }
            if (renderingAbove === 1 /* ContentWidgetPositionPreference.ABOVE */) {
                this._resizableNode.enableSashes(true, true, false, false);
            }
            else {
                this._resizableNode.enableSashes(false, true, true, false);
            }
            return renderingAbove;
        }
        _resize(dimension) {
            this._resizableNode.layout(dimension.height, dimension.width);
        }
    }
    exports.ResizableContentWidget = ResizableContentWidget;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzaXphYmxlQ29udGVudFdpZGdldC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2NvbnRyaWIvaG92ZXIvYnJvd3Nlci9yZXNpemFibGVDb250ZW50V2lkZ2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQVNoRyxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFDdEIsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0lBRXpCLE1BQXNCLHNCQUF1QixTQUFRLHNCQUFVO1FBVTlELFlBQ29CLE9BQW9CLEVBQ3ZDLGNBQThCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBRXZELEtBQUssRUFBRSxDQUFDO1lBSFcsWUFBTyxHQUFQLE9BQU8sQ0FBYTtZQVQvQix3QkFBbUIsR0FBWSxJQUFJLENBQUM7WUFDcEMsc0JBQWlCLEdBQVksS0FBSyxDQUFDO1lBRXpCLG1CQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGdDQUFvQixFQUFFLENBQUMsQ0FBQztZQUNyRSxxQkFBZ0IsR0FBa0MsSUFBSSxDQUFDO1lBRXpELGdCQUFXLEdBQVksS0FBSyxDQUFDO1lBT3BDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1lBQ3hELElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzlELElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xFLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJ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