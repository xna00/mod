/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/abstractScrollbar", "vs/base/browser/ui/scrollbar/scrollbarArrow", "vs/base/browser/ui/scrollbar/scrollbarState", "vs/base/common/codicons"], function (require, exports, mouseEvent_1, abstractScrollbar_1, scrollbarArrow_1, scrollbarState_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HorizontalScrollbar = void 0;
    class HorizontalScrollbar extends abstractScrollbar_1.AbstractScrollbar {
        constructor(scrollable, options, host) {
            const scrollDimensions = scrollable.getScrollDimensions();
            const scrollPosition = scrollable.getCurrentScrollPosition();
            super({
                lazyRender: options.lazyRender,
                host: host,
                scrollbarState: new scrollbarState_1.ScrollbarState((options.horizontalHasArrows ? options.arrowSize : 0), (options.horizontal === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.horizontalScrollbarSize), (options.vertical === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.verticalScrollbarSize), scrollDimensions.width, scrollDimensions.scrollWidth, scrollPosition.scrollLeft),
                visibility: options.horizontal,
                extraScrollbarClassName: 'horizontal',
                scrollable: scrollable,
                scrollByPage: options.scrollByPage
            });
            if (options.horizontalHasArrows) {
                const arrowDelta = (options.arrowSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                const scrollbarDelta = (options.horizontalScrollbarSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                this._createArrow({
                    className: 'scra',
                    icon: codicons_1.Codicon.scrollbarButtonLeft,
                    top: scrollbarDelta,
                    left: arrowDelta,
                    bottom: undefined,
                    right: undefined,
                    bgWidth: options.arrowSize,
                    bgHeight: options.horizontalScrollbarSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 1, 0)),
                });
                this._createArrow({
                    className: 'scra',
                    icon: codicons_1.Codicon.scrollbarButtonRight,
                    top: scrollbarDelta,
                    left: undefined,
                    bottom: undefined,
                    right: arrowDelta,
                    bgWidth: options.arrowSize,
                    bgHeight: options.horizontalScrollbarSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, -1, 0)),
                });
            }
            this._createSlider(Math.floor((options.horizontalScrollbarSize - options.horizontalSliderSize) / 2), 0, undefined, options.horizontalSliderSize);
        }
        _updateSlider(sliderSize, sliderPosition) {
            this.slider.setWidth(sliderSize);
            this.slider.setLeft(sliderPosition);
        }
        _renderDomNode(largeSize, smallSize) {
            this.domNode.setWidth(largeSize);
            this.domNode.setHeight(smallSize);
            this.domNode.setLeft(0);
            this.domNode.setBottom(0);
        }
        onDidScroll(e) {
            this._shouldRender = this._onElementScrollSize(e.scrollWidth) || this._shouldRender;
            this._shouldRender = this._onElementScrollPosition(e.scrollLeft) || this._shouldRender;
            this._shouldRender = this._onElementSize(e.width) || this._shouldRender;
            return this._shouldRender;
        }
        _pointerDownRelativePosition(offsetX, offsetY) {
            return offsetX;
        }
        _sliderPointerPosition(e) {
            return e.pageX;
        }
        _sliderOrthogonalPointerPosition(e) {
            return e.pageY;
        }
        _updateScrollbarSize(size) {
            this.slider.setHeight(size);
        }
        writeScrollPosition(target, scrollPosition) {
            target.scrollLeft = scrollPosition;
        }
        updateOptions(options) {
            this.updateScrollbarSize(options.horizontal === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.horizontalScrollbarSize);
            this._scrollbarState.setOppositeScrollbarSize(options.vertical === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.verticalScrollbarSize);
            this._visibilityController.setVisibility(options.horizontal);
            this._scrollByPage = options.scrollByPage;
        }
    }
    exports.HorizontalScrollbar = HorizontalScrollbar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9yaXpvbnRhbFNjcm9sbGJhci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3Njcm9sbGJhci9ob3Jpem9udGFsU2Nyb2xsYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7OztJQWFoRyxNQUFhLG1CQUFvQixTQUFRLHFDQUFpQjtRQUV6RCxZQUFZLFVBQXNCLEVBQUUsT0FBeUMsRUFBRSxJQUFtQjtZQUNqRyxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzFELE1BQU0sY0FBYyxHQUFHLFVBQVUsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1lBQzdELEtBQUssQ0FBQztnQkFDTCxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVU7Z0JBQzlCLElBQUksRUFBRSxJQUFJO2dCQUNWLGNBQWMsRUFBRSxJQUFJLCtCQUFjLENBQ2pDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDckQsQ0FBQyxPQUFPLENBQUMsVUFBVSx1Q0FBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUMsRUFDekYsQ0FBQyxPQUFPLENBQUMsUUFBUSx1Q0FBK0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsRUFDckYsZ0JBQWdCLENBQUMsS0FBSyxFQUN0QixnQkFBZ0IsQ0FBQyxXQUFXLEVBQzVCLGNBQWMsQ0FBQyxVQUFVLENBQ3pCO2dCQUNELFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtnQkFDOUIsdUJBQXVCLEVBQUUsWUFBWTtnQkFDckMsVUFBVSxFQUFFLFVBQVU7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