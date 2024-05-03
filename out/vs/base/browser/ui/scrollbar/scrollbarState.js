/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollbarState = void 0;
    /**
     * The minimal size of the slider (such that it can still be clickable) -- it is artificially enlarged.
     */
    const MINIMUM_SLIDER_SIZE = 20;
    class ScrollbarState {
        constructor(arrowSize, scrollbarSize, oppositeScrollbarSize, visibleSize, scrollSize, scrollPosition) {
            this._scrollbarSize = Math.round(scrollbarSize);
            this._oppositeScrollbarSize = Math.round(oppositeScrollbarSize);
            this._arrowSize = Math.round(arrowSize);
            this._visibleSize = visibleSize;
            this._scrollSize = scrollSize;
            this._scrollPosition = scrollPosition;
            this._computedAvailableSize = 0;
            this._computedIsNeeded = false;
            this._computedSliderSize = 0;
            this._computedSliderRatio = 0;
            this._computedSliderPosition = 0;
            this._refreshComputedValues();
        }
        clone() {
            return new ScrollbarState(this._arrowSize, this._scrollbarSize, this._oppositeScrollbarSize, this._visibleSize, this._scrollSize, this._scrollPosition);
        }
        setVisibleSize(visibleSize) {
            const iVisibleSize = Math.round(visibleSize);
            if (this._visibleSize !== iVisibleSize) {
                this._visibleSize = iVisibleSize;
                this._refreshComputedValues();
                return true;
            }
            return false;
        }
        setScrollSize(scrollSize) {
            const iScrollSize = Math.round(scrollSize);
            if (this._scrollSize !== iScrollSize) {
                this._scrollSize = iScrollSize;
                this._refreshComputedValues();
                return true;
            }
            return false;
        }
        setScrollPosition(scrollPosition) {
            const iScrollPosition = Math.round(scrollPosition);
            if (this._scrollPosition !== iScrollPosition) {
                this._scrollPosition = iScrollPosition;
                this._refreshComputedValues();
                return true;
            }
            return false;
        }
        setScrollbarSize(scrollbarSize) {
            this._scrollbarSize = Math.round(scrollbarSize);
        }
        setOppositeScrollbarSize(oppositeScrollbarSize) {
            this._oppositeScrollbarSize = Math.round(oppositeScrollbarSize);
        }
        static _computeValues(oppositeScrollbarSize, arrowSize, visibleSize, scrollSize, scrollPosition) {
            const computedAvailableSize = Math.max(0, visibleSize - oppositeScrollbarSize);
            const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * arrowSize);
            const computedIsNeeded = (scrollSize > 0 && scrollSize > visibleSize);
            if (!computedIsNeeded) {
                // There is no need for a slider
                return {
                    computedAvailableSize: Math.round(computedAvailableSize),
                    computedIsNeeded: computedIsNeeded,
                    computedSliderSize: Math.round(computedRepresentableSize),
                    computedSliderRatio: 0,
                    computedSliderPosition: 0,
                };
            }
            // We must artificially increase the size of the slider if needed, since the slider would be too small to grab with the mouse otherwise
            const computedSliderSize = Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(visibleSize * computedRepresentableSize / scrollSize)));
            // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
            // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
            const computedSliderRatio = (computedRepresentableSize - computedSliderSize) / (scrollSize - visibleSize);
            const computedSliderPosition = (scrollPosition * computedSliderRatio);
            return {
                computedAvailableSize: Math.round(computedAvailableSize),
                computedIsNeeded: computedIsNeeded,
                computedSliderSize: Math.round(computedSliderSize),
                computedSliderRatio: computedSliderRatio,
                computedSliderPosition: Math.round(computedSliderPosition),
            };
        }
        _refreshComputedValues() {
            const r = ScrollbarState._computeValues(this._oppositeScrollbarSize, this._arrowSize, this._visibleSize, this._scrollSize, this._scrollPosition);
            this._computedAvailableSize = r.computedAvailableSize;
            this._computedIsNeeded = r.computedIsNeeded;
            this._computedSliderSize = r.computedSliderSize;
            this._computedSliderRatio = r.computedSliderRatio;
            this._computedSliderPosition = r.computedSliderPosition;
        }
        getArrowSize() {
            return this._arrowSize;
        }
        getScrollPosition() {
            return this._scrollPosition;
        }
        getRectangleLargeSize() {
            return this._computedAvailableSize;
        }
        getRectangleSmallSize() {
            return this._scrollbarSize;
        }
        isNeeded() {
            return this._computedIsNeeded;
        }
        getSliderSize() {
            return this._computedSliderSize;
        }
        getSliderPosition() {
            return this._computedSliderPosition;
        }
        /**
         * Compute a desired `scrollPosition` such that `offset` ends up in the center of the slider.
         * `offset` is based on the same coordinate system as the `sliderPosition`.
         */
        getDesiredScrollPositionFromOffset(offset) {
            if (!this._computedIsNeeded) {
                // no need for a slider
                return 0;
            }
            const desiredSliderPosition = offset - this._arrowSize - this._computedSliderSize / 2;
            return Math.round(desiredSliderPosition / this._computedSliderRatio);
        }
        /**
         * Compute a desired `scrollPosition` from if offset is before or after the slider position.
         * If offset is before slider, treat as a page up (or left).  If after, page down (or right).
         * `offset` and `_computedSliderPosition` are based on the same coordinate system.
         * `_visibleSize` corresponds to a "page" of lines in the returned coordinate system.
         */
        getDesiredScrollPositionFromOffsetPaged(offset) {
            if (!this._computedIsNeeded) {
                // no need for a slider
                return 0;
            }
            const correctedOffset = offset - this._arrowSize; // compensate if has arrows
            let desiredScrollPosition = this._scrollPosition;
            if (correctedOffset < this._computedSliderPosition) {
                desiredScrollPosition -= this._visibleSize; // page up/left
            }
            else {
                desiredScrollPosition += this._visibleSize; // page down/right
            }
            return desiredScrollPosition;
        }
        /**
         * Compute a desired `scrollPosition` such that the slider moves by `delta`.
         */
        getDesiredScrollPositionFromDelta(delta) {
            if (!this._computedIsNeeded) {
                // no need for a slider
                return 0;
            }
            const desiredSliderPosition = this._computedSliderPosition + delta;
            return Math.round(desiredSliderPosition / this._computedSliderRatio);
        }
    }
    exports.ScrollbarState = ScrollbarState;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYmFyU3RhdGUuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zY3JvbGxiYXIvc2Nyb2xsYmFyU3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBRWhHOztPQUVHO0lBQ0gsTUFBTSxtQkFBbUIsR0FBRyxFQUFFLENBQUM7SUFFL0IsTUFBYSxjQUFjO1FBc0QxQixZQUFZLFNBQWlCLEVBQUUsYUFBcUIsRUFBRSxxQkFBNkIsRUFBRSxXQUFtQixFQUFFLFVBQWtCLEVBQUUsY0FBc0I7WUFDbkosSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDaEUsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRXhDLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO1lBQzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsY0FBYyxDQUFDO1lBRXRDLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLENBQUM7WUFDaEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEtBQUssQ0FBQztZQUMvQixJQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQztZQUVqQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUMvQixDQUFDO1FBRU0sS0FBSztZQUNYLE9BQU8sSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3pKLENBQUM7UUFFTSxjQUFjLENBQUMsV0FBbUI7WUFDeEMsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM3QyxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztnQkFDOUIsT0FBTyxJQUFJLENBQUM7WUFDYixDQUFDO1lBQ0QsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO1FBRU0sYUFBYSxDQUFDLFVBQWtCO1lBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0MsSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLGlCQUFpQixDQUFDLGNBQXNCO1lBQzlDLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDbkQsSUFBSSxJQUFJLENBQUMsZUFBZSxLQUFLLGVBQWUsRUFBRSxDQUFDO2dCQUM5QyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7Z0JBQzlCLE9BQU8sSUFBSSxDQUFDO1lBQ2IsQ0FBQztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztRQUVNLGdCQUFnQixDQUFDLGFBQXFCO1lBQzVDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRU0sd0JBQXdCLENBQUMscUJBQTZCO1lBQzVELElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVPLE1BQU0sQ0FBQyxjQUFjLENBQUMscUJBQTZCLEVBQUUsU0FBaUIsRUFBRSxXQUFtQixFQUFFLFVBQWtCLEVBQUUsY0FBc0I7WUFDOUksTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxXQUFXLEdBQUcscUJBQXFCLENBQUMsQ0FBQztZQUMvRSxNQUFNLHlCQUF5QixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLHFCQUFxQixHQUFHLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUNyRixNQUFNLGdCQUFnQixHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsSUFBSSxVQUFVLEdBQUcsV0FBVyxDQUFDLENBQUM7WUFFdEUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7Z0JBQ3ZCLGdDQUFnQztnQkFDaEMsT0FBTztvQkFDTixxQkFBcUIsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixDQUFDO29CQUN4RCxnQkFBZ0IsRUFBRSxnQkFBZ0I7b0JBQ2xDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUM7b0JBQ3pELG1CQUFtQixFQUFFLENBQUM7b0JBQ3RCLHNCQUFzQixFQUFFLENBQUM7aUJBQ3pCLENBQUM7WUFDSCxDQUFDO1lBRUQsdUlBQXVJO1lBQ3ZJLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxHQUFHLHlCQUF5QixHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV2SSxtRkFBbUY7WUFDbkYsb0ZBQW9GO1lBQ3BGLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyx5QkFBeUIsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDO1lBQzFHLE1BQU0sc0JBQXNCLEdBQUcsQ0FBQyxjQUFjLEdBQUcsbUJBQW1CLENBQUMsQ0FBQztZQUV0RSxPQUFPO2dCQUNOLHFCQUFxQixFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUM7Z0JBQ3hELGdCQUFnQixFQUFFLGdCQUFnQjtnQkFDbEMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztnQkFDbEQsbUJBQW1CLEVBQUUsbUJBQW1CO2dCQUN4QyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDO2FBQzFELENBQUM7UUFDSCxDQUFDO1FBRU8sc0JBQXNCO1lBQzdCLE1BQU0sQ0FBQyxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNqSixJQUFJLENBQUMsc0JBQXNCLEdBQUcsQ0FBQyxDQUFDLHFCQUFxQixDQUFDO1lBQ3RELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLENBQUM7WUFDNUMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQztZQUNoRCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLG1CQUFtQixDQUFDO1lBQ2xELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxDQUFDLENBQUMsc0JBQXNCLENBQUM7UUFDekQsQ0FBQztRQUVNLFlBQVk7WUFDbEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ3hCLENBQUM7UUFFTSxpQkFBaUI7WUFDdkIsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDO1FBQzdCLENBQUM7UUFFTSxxQkFBcUI7WUFDM0IsT0FBTyxJQUFJLENBQUMsc0JBQXNCLENBQUM7UUFDcEMsQ0FBQztRQUVNLHFCQUFxQjtZQUMzQixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztRQUMvQixDQUFDO1FBRU0sYUFBYTtZQUNuQixPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztRQUNqQyxDQUFDO1FBRU0saUJBQWlCO1lBQ3ZCLE9BQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDO1FBQ3JDLENBQUM7UUFFRDs7O1dBR0c7UUFDSSxrQ0FBa0MsQ0FBQyxNQUFjO1lBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDN0IsdUJBQXVCO2dCQUN2QixPQUFPLENBQUMsQ0FBQztZQUNWLENBQUM7WUFFRCxNQUFNLHFCQUFxQixHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxDQUFDLENBQUM7WUFDdEYsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNJLHVDQUF1QyxDQUFDLE1BQWM7WUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUM3Qix1QkFBdUI7Z0JBQ3ZCLE9BQU8sQ0FBQyxDQUFDO1lBQ1YsQ0FBQztZQUVELE1BQU0sZUFBZSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUUsMkJBQTJCO1lBQzlFLElBQUkscUJBQXFCLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNqRCxJQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDcEQscUJBQXFCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFFLGVBQWU7WUFDN0QsQ0FBQztpQkFBTSxDQUFDO2dCQUNQLHFCQUFxQixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBRSxrQkFBa0I7WUFDaEUsQ0FBQztZQUNELE9BQU8scUJBQXFCLENBQUM7UUFDOUIsQ0FBQztRQUVEOztXQUVHO1FBQ0ksaUNBQWlDLENBQUMsS0FBYTtZQUNyRCxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7Z0JBQzdCLHVCQUF1QjtnQkFDdkIsT0FBTyxDQUFDLENBQUM7WUFDVixDQUFDO1lBRUQsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO1lBQ25FLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN0RSxDQUFDO0tBQ0Q7SUF4T0Qsd0NBd09DIn0=