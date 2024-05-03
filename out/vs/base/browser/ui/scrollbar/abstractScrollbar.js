/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/globalPointerMoveMonitor", "vs/base/browser/ui/scrollbar/scrollbarArrow", "vs/base/browser/ui/scrollbar/scrollbarVisibilityController", "vs/base/browser/ui/widget", "vs/base/common/platform"], function (require, exports, dom, fastDomNode_1, globalPointerMoveMonitor_1, scrollbarArrow_1, scrollbarVisibilityController_1, widget_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractScrollbar = void 0;
    /**
     * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
     */
    const POINTER_DRAG_RESET_DISTANCE = 140;
    class AbstractScrollbar extends widget_1.Widget {
        constructor(opts) {
            super();
            this._lazyRender = opts.lazyRender;
            this._host = opts.host;
            this._scrollable = opts.scrollable;
            this._scrollByPage = opts.scrollByPage;
            this._scrollbarState = opts.scrollbarState;
            this._visibilityController = this._register(new scrollbarVisibilityController_1.ScrollbarVisibilityController(opts.visibility, 'visible scrollbar ' + opts.extraScrollbarClassName, 'invisible scrollbar ' + opts.extraScrollbarClassName));
            this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded());
            this._pointerMoveMonitor = this._register(new globalPointerMoveMonitor_1.GlobalPointerMoveMonitor());
            this._shouldRender = true;
            this.domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this._visibilityController.setDomNode(this.domNode);
            this.domNode.setPosition('absolute');
            this._register(dom.addDisposableListener(this.domNode.domNode, dom.EventType.POINTER_DOWN, (e) => this._domNodePointerDown(e)));
        }
        // ----------------- creation
        /**
         * Creates the dom node for an arrow & adds it to the container
         */
        _createArrow(opts) {
            const arrow = this._register(new scrollbarArrow_1.ScrollbarArrow(opts));
            this.domNode.domNode.appendChild(arrow.bgDomNode);
            this.domNode.domNode.appendChild(arrow.domNode);
        }
        /**
         * Creates the slider dom node, adds it to the container & hooks up the events
         */
        _createSlider(top, left, width, height) {
            this.slider = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this.slider.setClassName('slider');
            this.slider.setPosition('absolute');
            this.slider.setTop(top);
            this.slider.setLeft(left);
            if (typeof width === 'number') {
                this.slider.setWidth(width);
            }
            if (typeof height === 'number') {
                this.slider.setHeight(height);
            }
            this.slider.setLayerHinting(true);
            this.slider.setContain('strict');
            this.domNode.domNode.appendChild(this.slider.domNode);
            this._register(dom.addDisposableListener(this.slider.domNode, dom.EventType.POINTER_DOWN, (e) => {
                if (e.button === 0) {
                    e.preventDefault();
                    this._sliderPointerDown(e);
                }
            }));
            this.onclick(this.slider.domNode, e => {
                if (e.leftButton) {
                    e.stopPropagation();
                }
            });
        }
        // ----------------- Update state
        _onElementSize(visibleSize) {
            if (this._scrollbarState.setVisibleSize(visibleSize)) {
                this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded());
                this._shouldRender = true;
                if (!this._lazyRender) {
                    this.render();
                }
            }
            return this._shouldRender;
        }
        _onElementScrollSize(elementScrollSize) {
            if (this._scrollbarState.setScrollSize(elementScrollSize)) {
                this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded());
                this._shouldRender = true;
                if (!this._lazyRender) {
                    this.render();
                }
            }
            return this._shouldRender;
        }
        _onElementScrollPosition(elementScrollPosition) {
            if (this._scrollbarState.setScrollPosition(elementScrollPosition)) {
                this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded());
                this._shouldRender = true;
                if (!this._lazyRender) {
                    this.render();
                }
            }
            return this._shouldRender;
        }
        // ----------------- rendering
        beginReveal() {
            this._visibilityController.setShouldBeVisible(true);
        }
        beginHide() {
            this._visibilityController.setShouldBeVisible(false);
        }
        render() {
            if (!this._shouldRender) {
                return;
            }
            this._shouldRender = false;
            this._renderDomNode(this._scrollbarState.getRectangleLargeSize(), this._scrollbarState.getRectangleSmallSize());
            this._updateSlider(this._scrollbarState.getSliderSize(), this._scrollbarState.getArrowSize() + this._scrollbarState.getSliderPosition());
        }
        // ----------------- DOM events
        _domNodePointerDown(e) {
            if (e.target !== this.domNode.domNode) {
                return;
            }
            this._onPointerDown(e);
        }
        delegatePointerDown(e) {
            const domTop = this.domNode.domNode.getClientRects()[0].top;
            const sliderStart = domTop + this._scrollbarState.getSliderPosition();
            const sliderStop = domTop + this._scrollbarState.getSliderPosition() + this._scrollbarState.getSliderSize();
            const pointerPos = this._sliderPointerPosition(e);
            if (sliderStart <= pointerPos && pointerPos <= sliderStop) {
                // Act as if it was a pointer down on the slider
                if (e.button === 0) {
                    e.preventDefault();
                    this._sliderPointerDown(e);
                }
            }
            else {
                // Act as if it was a pointer down on the scrollbar
                this._onPointerDown(e);
            }
        }
        _onPointerDown(e) {
            let offsetX;
            let offsetY;
            if (e.target === this.domNode.domNode && typeof e.offsetX === 'number' && typeof e.offsetY === 'number') {
                offsetX = e.offsetX;
                offsetY = e.offsetY;
            }
            else {
                const domNodePosition = dom.getDomNodePagePosition(this.domNode.domNode);
                offsetX = e.pageX - domNodePosition.left;
                offsetY = e.pageY - domNodePosition.top;
            }
            const offset = this._pointerDownRelativePosition(offsetX, offsetY);
            this._setDesiredScrollPositionNow(this._scrollByPage
                ? this._scrollbarState.getDesiredScrollPositionFromOffsetPaged(offset)
                : this._scrollbarState.getDesiredScrollPositionFromOffset(offset));
            if (e.button === 0) {
                // left button
                e.preventDefault();
                this._sliderPointerDown(e);
            }
        }
        _sliderPointerDown(e) {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            const initialPointerPosition = this._sliderPointerPosition(e);
            const initialPointerOrthogonalPosition = this._sliderOrthogonalPointerPosition(e);
            const initialScrollbarState = this._scrollbarState.clone();
            this.slider.toggleClassName('active', true);
            this._pointerMoveMonitor.startMonitoring(e.target, e.pointerId, e.buttons, (pointerMoveData) => {
                const pointerOrthogonalPosition = this._sliderOrthogonalPointerPosition(pointerMoveData);
                const pointerOrthogonalDelta = Math.abs(pointerOrthogonalPosition - initialPointerOrthogonalPosition);
                if (platform.isWindows && pointerOrthogonalDelta > POINTER_DRAG_RESET_DISTANCE) {
                    // The pointer has wondered away from the scrollbar => reset dragging
                    this._setDesiredScrollPositionNow(initialScrollbarState.getScrollPosition());
                    return;
                }
                const pointerPosition = this._sliderPointerPosition(pointerMoveData);
                const pointerDelta = pointerPosition - initialPointerPosition;
                this._setDesiredScrollPositionNow(initialScrollbarState.getDesiredScrollPositionFromDelta(pointerDelta));
            }, () => {
                this.slider.toggleClassName('active', false);
                this._host.onDragEnd();
            });
            this._host.onDragStart();
        }
        _setDesiredScrollPositionNow(_desiredScrollPosition) {
            const desiredScrollPosition = {};
            this.writeScrollPosition(desiredScrollPosition, _desiredScrollPosition);
            this._scrollable.setScrollPositionNow(desiredScrollPosition);
        }
        updateScrollbarSize(scrollbarSize) {
            this._updateScrollbarSize(scrollbarSize);
            this._scrollbarState.setScrollbarSize(scrollbarSize);
            this._shouldRender = true;
            if (!this._lazyRender) {
                this.render();
            }
        }
        isNeeded() {
            return this._scrollbarState.isNeeded();
        }
    }
    exports.AbstractScrollbar = AbstractScrollbar;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3RTY3JvbGxiYXIuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zY3JvbGxiYXIvYWJzdHJhY3RTY3JvbGxiYXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBYWhHOztPQUVHO0lBQ0gsTUFBTSwyQkFBMkIsR0FBRyxHQUFHLENBQUM7SUF3QnhDLE1BQXNCLGlCQUFrQixTQUFRLGVBQU07UUFlckQsWUFBWSxJQUE4QjtZQUN6QyxLQUFLLEVBQUUsQ0FBQztZQUNSLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7WUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ25DLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUN2QyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDM0MsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSw2REFBNkIsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLG9CQUFvQixHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxzQkFBc0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDO1lBQzVNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksbURBQXdCLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLElBQUksQ0FBQyxhQUFhLEdB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