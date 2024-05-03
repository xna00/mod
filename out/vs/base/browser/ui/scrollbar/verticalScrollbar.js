/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/abstractScrollbar", "vs/base/browser/ui/scrollbar/scrollbarArrow", "vs/base/browser/ui/scrollbar/scrollbarState", "vs/base/common/codicons"], function (require, exports, mouseEvent_1, abstractScrollbar_1, scrollbarArrow_1, scrollbarState_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VerticalScrollbar = void 0;
    class VerticalScrollbar extends abstractScrollbar_1.AbstractScrollbar {
        constructor(scrollable, options, host) {
            const scrollDimensions = scrollable.getScrollDimensions();
            const scrollPosition = scrollable.getCurrentScrollPosition();
            super({
                lazyRender: options.lazyRender,
                host: host,
                scrollbarState: new scrollbarState_1.ScrollbarState((options.verticalHasArrows ? options.arrowSize : 0), (options.vertical === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.verticalScrollbarSize), 
                // give priority to vertical scroll bar over horizontal and let it scroll all the way to the bottom
                0, scrollDimensions.height, scrollDimensions.scrollHeight, scrollPosition.scrollTop),
                visibility: options.vertical,
                extraScrollbarClassName: 'vertical',
                scrollable: scrollable,
                scrollByPage: options.scrollByPage
            });
            if (options.verticalHasArrows) {
                const arrowDelta = (options.arrowSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                const scrollbarDelta = (options.verticalScrollbarSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                this._createArrow({
                    className: 'scra',
                    icon: codicons_1.Codicon.scrollbarButtonUp,
                    top: arrowDelta,
                    left: scrollbarDelta,
                    bottom: undefined,
                    right: undefined,
                    bgWidth: options.verticalScrollbarSize,
                    bgHeight: options.arrowSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 0, 1)),
                });
                this._createArrow({
                    className: 'scra',
                    icon: codicons_1.Codicon.scrollbarButtonDown,
                    top: undefined,
                    left: scrollbarDelta,
                    bottom: arrowDelta,
                    right: undefined,
                    bgWidth: options.verticalScrollbarSize,
                    bgHeight: options.arrowSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 0, -1)),
                });
            }
            this._createSlider(0, Math.floor((options.verticalScrollbarSize - options.verticalSliderSize) / 2), options.verticalSliderSize, undefined);
        }
        _updateSlider(sliderSize, sliderPosition) {
            this.slider.setHeight(sliderSize);
            this.slider.setTop(sliderPosition);
        }
        _renderDomNode(largeSize, smallSize) {
            this.domNode.setWidth(smallSize);
            this.domNode.setHeight(largeSize);
            this.domNode.setRight(0);
            this.domNode.setTop(0);
        }
        onDidScroll(e) {
            this._shouldRender = this._onElementScrollSize(e.scrollHeight) || this._shouldRender;
            this._shouldRender = this._onElementScrollPosition(e.scrollTop) || this._shouldRender;
            this._shouldRender = this._onElementSize(e.height) || this._shouldRender;
            return this._shouldRender;
        }
        _pointerDownRelativePosition(offsetX, offsetY) {
            return offsetY;
        }
        _sliderPointerPosition(e) {
            return e.pageY;
        }
        _sliderOrthogonalPointerPosition(e) {
            return e.pageX;
        }
        _updateScrollbarSize(size) {
            this.slider.setWidth(size);
        }
        writeScrollPosition(target, scrollPosition) {
            target.scrollTop = scrollPosition;
        }
        updateOptions(options) {
            this.updateScrollbarSize(options.vertical === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.verticalScrollbarSize);
            // give priority to vertical scroll bar over horizontal and let it scroll all the way to the bottom
            this._scrollbarState.setOppositeScrollbarSize(0);
            this._visibilityController.setVisibility(options.vertical);
            this._scrollByPage = options.scrollByPage;
        }
    }
    exports.VerticalScrollbar = VerticalScrollbar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVydGljYWxTY3JvbGxiYXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zY3JvbGxiYXIvdmVydGljYWxTY3JvbGxiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBWWhHLE1BQWEsaUJBQWtCLFNBQVEscUNBQWlCO1FBRXZELFlBQVksVUFBc0IsRUFBRSxPQUF5QyxFQUFFLElBQW1CO1lBQ2pHLE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFDMUQsTUFBTSxjQUFjLEdBQUcsVUFBVSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDN0QsS0FBSyxDQUFDO2dCQUNMLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtnQkFDOUIsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsY0FBYyxFQUFFLElBQUksK0JBQWMsQ0FDakMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNuRCxDQUFDLE9BQU8sQ0FBQyxRQUFRLHVDQUErQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQztnQkFDckYsbUdBQW1HO2dCQUNuRyxDQUFDLEVBQ0QsZ0JBQWdCLENBQUMsTUFBTSxFQUN2QixnQkFBZ0IsQ0FBQyxZQUFZLEVBQzdCLGNBQWMsQ0FBQyxTQUFTLENBQ3hCO2dCQUNELFVBQVUsRUFBRSxPQUFPLENBQUMsUUFBUTtnQkFDNUIsdUJBQXVCLEVBQUUsVUFBVTtnQkFDbkMsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLFlBQVksRUFBRSxPQUFPLENBQUMsWUFBWTthQUNsQyxDQUFDLENBQUM7WUFFSCxJQUFJLE9BQU8sQ0FBQyxp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