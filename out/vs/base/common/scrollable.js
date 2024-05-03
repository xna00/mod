/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SmoothScrollingOperation = exports.SmoothScrollingUpdate = exports.Scrollable = exports.ScrollState = exports.ScrollbarVisibility = void 0;
    var ScrollbarVisibility;
    (function (ScrollbarVisibility) {
        ScrollbarVisibility[ScrollbarVisibility["Auto"] = 1] = "Auto";
        ScrollbarVisibility[ScrollbarVisibility["Hidden"] = 2] = "Hidden";
        ScrollbarVisibility[ScrollbarVisibility["Visible"] = 3] = "Visible";
    })(ScrollbarVisibility || (exports.ScrollbarVisibility = ScrollbarVisibility = {}));
    class ScrollState {
        constructor(_forceIntegerValues, width, scrollWidth, scrollLeft, height, scrollHeight, scrollTop) {
            this._forceIntegerValues = _forceIntegerValues;
            this._scrollStateBrand = undefined;
            if (this._forceIntegerValues) {
                width = width | 0;
                scrollWidth = scrollWidth | 0;
                scrollLeft = scrollLeft | 0;
                height = height | 0;
                scrollHeight = scrollHeight | 0;
                scrollTop = scrollTop | 0;
            }
            this.rawScrollLeft = scrollLeft; // before validation
            this.rawScrollTop = scrollTop; // before validation
            if (width < 0) {
                width = 0;
            }
            if (scrollLeft + width > scrollWidth) {
                scrollLeft = scrollWidth - width;
            }
            if (scrollLeft < 0) {
                scrollLeft = 0;
            }
            if (height < 0) {
                height = 0;
            }
            if (scrollTop + height > scrollHeight) {
                scrollTop = scrollHeight - height;
            }
            if (scrollTop < 0) {
                scrollTop = 0;
            }
            this.width = width;
            this.scrollWidth = scrollWidth;
            this.scrollLeft = scrollLeft;
            this.height = height;
            this.scrollHeight = scrollHeight;
            this.scrollTop = scrollTop;
        }
        equals(other) {
            return (this.rawScrollLeft === other.rawScrollLeft
                && this.rawScrollTop === other.rawScrollTop
                && this.width === other.width
                && this.scrollWidth === other.scrollWidth
                && this.scrollLeft === other.scrollLeft
                && this.height === other.height
                && this.scrollHeight === other.scrollHeight
                && this.scrollTop === other.scrollTop);
        }
        withScrollDimensions(update, useRawScrollPositions) {
            return new ScrollState(this._forceIntegerValues, (typeof update.width !== 'undefined' ? update.width : this.width), (typeof update.scrollWidth !== 'undefined' ? update.scrollWidth : this.scrollWidth), useRawScrollPositions ? this.rawScrollLeft : this.scrollLeft, (typeof update.height !== 'undefined' ? update.height : this.height), (typeof update.scrollHeight !== 'undefined' ? update.scrollHeight : this.scrollHeight), useRawScrollPositions ? this.rawScrollTop : this.scrollTop);
        }
        withScrollPosition(update) {
            return new ScrollState(this._forceIntegerValues, this.width, this.scrollWidth, (typeof update.scrollLeft !== 'undefined' ? update.scrollLeft : this.rawScrollLeft), this.height, this.scrollHeight, (typeof update.scrollTop !== 'undefined' ? update.scrollTop : this.rawScrollTop));
        }
        createScrollEvent(previous, inSmoothScrolling) {
            const widthChanged = (this.width !== previous.width);
            const scrollWidthChanged = (this.scrollWidth !== previous.scrollWidth);
            const scrollLeftChanged = (this.scrollLeft !== previous.scrollLeft);
            const heightChanged = (this.height !== previous.height);
            const scrollHeightChanged = (this.scrollHeight !== previous.scrollHeight);
            const scrollTopChanged = (this.scrollTop !== previous.scrollTop);
            return {
                inSmoothScrolling: inSmoothScrolling,
                oldWidth: previous.width,
                oldScrollWidth: previous.scrollWidth,
                oldScrollLeft: previous.scrollLeft,
                width: this.width,
                scrollWidth: this.scrollWidth,
                scrollLeft: this.scrollLeft,
                oldHeight: previous.height,
                oldScrollHeight: previous.scrollHeight,
                oldScrollTop: previous.scrollTop,
                height: this.height,
                scrollHeight: this.scrollHeight,
                scrollTop: this.scrollTop,
                widthChanged: widthChanged,
                scrollWidthChanged: scrollWidthChanged,
                scrollLeftChanged: scrollLeftChanged,
                heightChanged: heightChanged,
                scrollHeightChanged: scrollHeightChanged,
                scrollTopChanged: scrollTopChanged,
            };
        }
    }
    exports.ScrollState = ScrollState;
    class Scrollable extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this._scrollableBrand = undefined;
            this._onScroll = this._register(new event_1.Emitter());
            this.onScroll = this._onScroll.event;
            this._smoothScrollDuration = options.smoothScrollDuration;
            this._scheduleAtNextAnimationFrame = options.scheduleAtNextAnimationFrame;
            this._state = new ScrollState(options.forceIntegerValues, 0, 0, 0, 0, 0, 0);
            this._smoothScrolling = null;
        }
        dispose() {
            if (this._smoothScrolling) {
                this._smoothScrolling.dispose();
                this._smoothScrolling = null;
            }
            super.dispose();
        }
        setSmoothScrollDuration(smoothScrollDuration) {
            this._smoothScrollDuration = smoothScrollDuration;
        }
        validateScrollPosition(scrollPosition) {
            return this._state.withScrollPosition(scrollPosition);
        }
        getScrollDimensions() {
            return this._state;
        }
        setScrollDimensions(dimensions, useRawScrollPositions) {
            const newState = this._state.withScrollDimensions(dimensions, useRawScrollPositions);
            this._setState(newState, Boolean(this._smoothScrolling));
            // Validate outstanding animated scroll position target
            this._smoothScrolling?.acceptScrollDimensions(this._state);
        }
        /**
         * Returns the final scroll position that the instance will have once the smooth scroll animation concludes.
         * If no scroll animation is occurring, it will return the current scroll position instead.
         */
        getFutureScrollPosition() {
            if (this._smoothScrolling) {
                return this._smoothScrolling.to;
            }
            return this._state;
        }
        /**
         * Returns the current scroll position.
         * Note: This result might be an intermediate scroll position, as there might be an ongoing smooth scroll animation.
         */
        getCurrentScrollPosition() {
            return this._state;
        }
        setScrollPositionNow(update) {
            // no smooth scrolling requested
            const newState = this._state.withScrollPosition(update);
            // Terminate any outstanding smooth scrolling
            if (this._smoothScrolling) {
                this._smoothScrolling.dispose();
                this._smoothScrolling = null;
            }
            this._setState(newState, false);
        }
        setScrollPositionSmooth(update, reuseAnimation) {
            if (this._smoothScrollDuration === 0) {
                // Smooth scrolling not supported.
                return this.setScrollPositionNow(update);
            }
            if (this._smoothScrolling) {
                // Combine our pending scrollLeft/scrollTop with incoming scrollLeft/scrollTop
                update = {
                    scrollLeft: (typeof update.scrollLeft === 'undefined' ? this._smoothScrolling.to.scrollLeft : update.scrollLeft),
                    scrollTop: (typeof update.scrollTop === 'undefined' ? this._smoothScrolling.to.scrollTop : update.scrollTop)
                };
                // Validate `update`
                const validTarget = this._state.withScrollPosition(update);
                if (this._smoothScrolling.to.scrollLeft === validTarget.scrollLeft && this._smoothScrolling.to.scrollTop === validTarget.scrollTop) {
                    // No need to interrupt or extend the current animation since we're going to the same place
                    return;
                }
                let newSmoothScrolling;
                if (reuseAnimation) {
                    newSmoothScrolling = new SmoothScrollingOperation(this._smoothScrolling.from, validTarget, this._smoothScrolling.startTime, this._smoothScrolling.duration);
                }
                else {
                    newSmoothScrolling = this._smoothScrolling.combine(this._state, validTarget, this._smoothScrollDuration);
                }
                this._smoothScrolling.dispose();
                this._smoothScrolling = newSmoothScrolling;
            }
            else {
                // Validate `update`
                const validTarget = this._state.withScrollPosition(update);
                this._smoothScrolling = SmoothScrollingOperation.start(this._state, validTarget, this._smoothScrollDuration);
            }
            // Begin smooth scrolling animation
            this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
                if (!this._smoothScrolling) {
                    return;
                }
                this._smoothScrolling.animationFrameDisposable = null;
                this._performSmoothScrolling();
            });
        }
        hasPendingScrollAnimation() {
            return Boolean(this._smoothScrolling);
        }
        _performSmoothScrolling() {
            if (!this._smoothScrolling) {
                return;
            }
            const update = this._smoothScrolling.tick();
            const newState = this._state.withScrollPosition(update);
            this._setState(newState, true);
            if (!this._smoothScrolling) {
                // Looks like someone canceled the smooth scrolling
                // from the scroll event handler
                return;
            }
            if (update.isDone) {
                this._smoothScrolling.dispose();
                this._smoothScrolling = null;
                return;
            }
            // Continue smooth scrolling animation
            this._smoothScrolling.animationFrameDisposable = this._scheduleAtNextAnimationFrame(() => {
                if (!this._smoothScrolling) {
                    return;
                }
                this._smoothScrolling.animationFrameDisposable = null;
                this._performSmoothScrolling();
            });
        }
        _setState(newState, inSmoothScrolling) {
            const oldState = this._state;
            if (oldState.equals(newState)) {
                // no change
                return;
            }
            this._state = newState;
            this._onScroll.fire(this._state.createScrollEvent(oldState, inSmoothScrolling));
        }
    }
    exports.Scrollable = Scrollable;
    class SmoothScrollingUpdate {
        constructor(scrollLeft, scrollTop, isDone) {
            this.scrollLeft = scrollLeft;
            this.scrollTop = scrollTop;
            this.isDone = isDone;
        }
    }
    exports.SmoothScrollingUpdate = SmoothScrollingUpdate;
    function createEaseOutCubic(from, to) {
        const delta = to - from;
        return function (completion) {
            return from + delta * easeOutCubic(completion);
        };
    }
    function createComposed(a, b, cut) {
        return function (completion) {
            if (completion < cut) {
                return a(completion / cut);
            }
            return b((completion - cut) / (1 - cut));
        };
    }
    class SmoothScrollingOperation {
        constructor(from, to, startTime, duration) {
            this.from = from;
            this.to = to;
            this.duration = duration;
            this.startTime = startTime;
            this.animationFrameDisposable = null;
            this._initAnimations();
        }
        _initAnimations() {
            this.scrollLeft = this._initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width);
            this.scrollTop = this._initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
        }
        _initAnimation(from, to, viewportSize) {
            const delta = Math.abs(from - to);
            if (delta > 2.5 * viewportSize) {
                let stop1, stop2;
                if (from < to) {
                    // scroll to 75% of the viewportSize
                    stop1 = from + 0.75 * viewportSize;
                    stop2 = to - 0.75 * viewportSize;
                }
                else {
                    stop1 = from - 0.75 * viewportSize;
                    stop2 = to + 0.75 * viewportSize;
                }
                return createComposed(createEaseOutCubic(from, stop1), createEaseOutCubic(stop2, to), 0.33);
            }
            return createEaseOutCubic(from, to);
        }
        dispose() {
            if (this.animationFrameDisposable !== null) {
                this.animationFrameDisposable.dispose();
                this.animationFrameDisposable = null;
            }
        }
        acceptScrollDimensions(state) {
            this.to = state.withScrollPosition(this.to);
            this._initAnimations();
        }
        tick() {
            return this._tick(Date.now());
        }
        _tick(now) {
            const completion = (now - this.startTime) / this.duration;
            if (completion < 1) {
                const newScrollLeft = this.scrollLeft(completion);
                const newScrollTop = this.scrollTop(completion);
                return new SmoothScrollingUpdate(newScrollLeft, newScrollTop, false);
            }
            return new SmoothScrollingUpdate(this.to.scrollLeft, this.to.scrollTop, true);
        }
        combine(from, to, duration) {
            return SmoothScrollingOperation.start(from, to, duration);
        }
        static start(from, to, duration) {
            // +10 / -10 : pretend the animation already started for a quicker response to a scroll request
            duration = duration + 10;
            const startTime = Date.now() - 10;
            return new SmoothScrollingOperation(from, to, startTime, duration);
        }
    }
    exports.SmoothScrollingOperation = SmoothScrollingOperation;
    function easeInCubic(t) {
        return Math.pow(t, 3);
    }
    function easeOutCubic(t) {
        return 1 - easeInCubic(1 - t);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9jb21tb24vc2Nyb2xsYWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7SUFLaEcsSUFBa0IsbUJBSWpCO0lBSkQsV0FBa0IsbUJBQW1CO1FBQ3BDLDZEQUFRLENBQUE7UUFDUixpRUFBVSxDQUFBO1FBQ1YsbUVBQVcsQ0FBQTtJQUNaLENBQUMsRUFKaUIsbUJBQW1CLG1DQUFuQixtQkFBbUIsUUFJcEM7SUE4QkQsTUFBYSxXQUFXO1FBYXZCLFlBQ2tCLG1CQUE0QixFQUM3QyxLQUFhLEVBQ2IsV0FBbUIsRUFDbkIsVUFBa0IsRUFDbEIsTUFBYyxFQUNkLFlBQW9CLEVBQ3BCLFNBQWlCO1lBTkEsd0JBQW1CLEdBQW5CLG1CQUFtQixDQUFTO1lBYjlDLHNCQUFpQixHQUFTLFNBQVMsQ0FBQztZQXFCbkMsSUFBSSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztnQkFDOUIsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBQ2xCLFdBQVcsR0FBRyxXQUFXLEdBQUcsQ0FBQyxDQUFDO2dCQUM5QixVQUFVLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQztnQkFDNUIsTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7Z0JBQ3BCLFlBQVksR0FBRyxZQUFZLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxTQUFTLEdBQUcsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUMzQixDQUFDO1lBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsQ0FBQyxvQkFBb0I7WUFDckQsSUFBSSxDQUFDLFlBQVksR0FBRyxTQUFTLENBQUMsQ0FBQyxvQkFBb0I7WUFFbkQsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ2YsS0FBSyxHQUFH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