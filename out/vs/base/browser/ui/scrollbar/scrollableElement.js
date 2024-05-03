/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/horizontalScrollbar", "vs/base/browser/ui/scrollbar/verticalScrollbar", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/scrollable", "vs/css!./media/scrollbars"], function (require, exports, browser_1, dom, fastDomNode_1, mouseEvent_1, horizontalScrollbar_1, verticalScrollbar_1, widget_1, async_1, event_1, lifecycle_1, platform, scrollable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DomScrollableElement = exports.SmoothScrollableElement = exports.ScrollableElement = exports.AbstractScrollableElement = exports.MouseWheelClassifier = void 0;
    const HIDE_TIMEOUT = 500;
    const SCROLL_WHEEL_SENSITIVITY = 50;
    const SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED = true;
    class MouseWheelClassifierItem {
        constructor(timestamp, deltaX, deltaY) {
            this.timestamp = timestamp;
            this.deltaX = deltaX;
            this.deltaY = deltaY;
            this.score = 0;
        }
    }
    class MouseWheelClassifier {
        static { this.INSTANCE = new MouseWheelClassifier(); }
        constructor() {
            this._capacity = 5;
            this._memory = [];
            this._front = -1;
            this._rear = -1;
        }
        isPhysicalMouseWheel() {
            if (this._front === -1 && this._rear === -1) {
                // no elements
                return false;
            }
            // 0.5 * last + 0.25 * 2nd last + 0.125 * 3rd last + ...
            let remainingInfluence = 1;
            let score = 0;
            let iteration = 1;
            let index = this._rear;
            do {
                const influence = (index === this._front ? remainingInfluence : Math.pow(2, -iteration));
                remainingInfluence -= influence;
                score += this._memory[index].score * influence;
                if (index === this._front) {
                    break;
                }
                index = (this._capacity + index - 1) % this._capacity;
                iteration++;
            } while (true);
            return (score <= 0.5);
        }
        acceptStandardWheelEvent(e) {
            if (browser_1.isChrome) {
                const targetWindow = dom.getWindow(e.browserEvent);
                const pageZoomFactor = (0, browser_1.getZoomFactor)(targetWindow);
                // On Chrome, the incoming delta events are multiplied with the OS zoom factor.
                // The OS zoom factor can be reverse engineered by using the device pixel ratio and the configured zoom factor into account.
                this.accept(Date.now(), e.deltaX * pageZoomFactor, e.deltaY * pageZoomFactor);
            }
            else {
                this.accept(Date.now(), e.deltaX, e.deltaY);
            }
        }
        accept(timestamp, deltaX, deltaY) {
            let previousItem = null;
            const item = new MouseWheelClassifierItem(timestamp, deltaX, deltaY);
            if (this._front === -1 && this._rear === -1) {
                this._memory[0] = item;
                this._front = 0;
                this._rear = 0;
            }
            else {
                previousItem = this._memory[this._rear];
                this._rear = (this._rear + 1) % this._capacity;
                if (this._rear === this._front) {
                    // Drop oldest
                    this._front = (this._front + 1) % this._capacity;
                }
                this._memory[this._rear] = item;
            }
            item.score = this._computeScore(item, previousItem);
        }
        /**
         * A score between 0 and 1 for `item`.
         *  - a score towards 0 indicates that the source appears to be a physical mouse wheel
         *  - a score towards 1 indicates that the source appears to be a touchpad or magic mouse, etc.
         */
        _computeScore(item, previousItem) {
            if (Math.abs(item.deltaX) > 0 && Math.abs(item.deltaY) > 0) {
                // both axes exercised => definitely not a physical mouse wheel
                return 1;
            }
            let score = 0.5;
            if (!this._isAlmostInt(item.deltaX) || !this._isAlmostInt(item.deltaY)) {
                // non-integer deltas => indicator that this is not a physical mouse wheel
                score += 0.25;
            }
            // Non-accelerating scroll => indicator that this is a physical mouse wheel
            // These can be identified by seeing whether they are the module of one another.
            if (previousItem) {
                const absDeltaX = Math.abs(item.deltaX);
                const absDeltaY = Math.abs(item.deltaY);
                const absPreviousDeltaX = Math.abs(previousItem.deltaX);
                const absPreviousDeltaY = Math.abs(previousItem.deltaY);
                // Min 1 to avoid division by zero, module 1 will still be 0.
                const minDeltaX = Math.max(Math.min(absDeltaX, absPreviousDeltaX), 1);
                const minDeltaY = Math.max(Math.min(absDeltaY, absPreviousDeltaY), 1);
                const maxDeltaX = Math.max(absDeltaX, absPreviousDeltaX);
                const maxDeltaY = Math.max(absDeltaY, absPreviousDeltaY);
                const isSameModulo = (maxDeltaX % minDeltaX === 0 && maxDeltaY % minDeltaY === 0);
                if (isSameModulo) {
                    score -= 0.5;
                }
            }
            return Math.min(Math.max(score, 0), 1);
        }
        _isAlmostInt(value) {
            const delta = Math.abs(Math.round(value) - value);
            return (delta < 0.01);
        }
    }
    exports.MouseWheelClassifier = MouseWheelClassifier;
    class AbstractScrollableElement extends widget_1.Widget {
        get options() {
            return this._options;
        }
        constructor(element, options, scrollable) {
            super();
            this._onScroll = this._register(new event_1.Emitter());
            this.onScroll = this._onScroll.event;
            this._onWillScroll = this._register(new event_1.Emitter());
            this.onWillScroll = this._onWillScroll.event;
            element.style.overflow = 'hidden';
            this._options = resolveOptions(options);
            this._scrollable = scrollable;
            this._register(this._scrollable.onScroll((e) => {
                this._onWillScroll.fire(e);
                this._onDidScroll(e);
                this._onScroll.fire(e);
            }));
            const scrollbarHost = {
                onMouseWheel: (mouseWheelEvent) => this._onMouseWheel(mouseWheelEvent),
                onDragStart: () => this._onDragStart(),
                onDragEnd: () => this._onDragEnd(),
            };
            this._verticalScrollbar = this._register(new verticalScrollbar_1.VerticalScrollbar(this._scrollable, this._options, scrollbarHost));
            this._horizontalScrollbar = this._register(new horizontalScrollbar_1.HorizontalScrollbar(this._scrollable, this._options, scrollbarHost));
            this._domNode = document.createElement('div');
            this._domNode.className = 'monaco-scrollable-element ' + this._options.className;
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.style.position = 'relative';
            this._domNode.style.overflow = 'hidden';
            this._domNode.appendChild(element);
            this._domNode.appendChild(this._horizontalScrollbar.domNode.domNode);
            this._domNode.appendChild(this._verticalScrollbar.domNode.domNode);
            if (this._options.useShadows) {
                this._leftShadowDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                this._leftShadowDomNode.setClassName('shadow');
                this._domNode.appendChild(this._leftShadowDomNode.domNode);
                this._topShadowDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                this._topShadowDomNode.setClassName('shadow');
                this._domNode.appendChild(this._topShadowDomNode.domNode);
                this._topLeftShadowDomNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
                this._topLeftShadowDomNode.setClassName('shadow');
                this._domNode.appendChild(this._topLeftShadowDomNode.domNode);
            }
            else {
                this._leftShadowDomNode = null;
                this._topShadowDomNode = null;
                this._topLeftShadowDomNode = null;
            }
            this._listenOnDomNode = this._options.listenOnDomNode || this._domNode;
            this._mouseWheelToDispose = [];
            this._setListeningToMouseWheel(this._options.handleMouseWheel);
            this.onmouseover(this._listenOnDomNode, (e) => this._onMouseOver(e));
            this.onmouseleave(this._listenOnDomNode, (e) => this._onMouseLeave(e));
            this._hideTimeout = this._register(new async_1.TimeoutTimer());
            this._isDragging = false;
            this._mouseIsOver = false;
            this._shouldRender = true;
            this._revealOnScroll = true;
        }
        dispose() {
            this._mouseWheelToDispose = (0, lifecycle_1.dispose)(this._mouseWheelToDispose);
            super.dispose();
        }
        /**
         * Get the generated 'scrollable' dom node
         */
        getDomNode() {
            return this._domNode;
        }
        getOverviewRulerLayoutInfo() {
            return {
                parent: this._domNode,
                insertBefore: this._verticalScrollbar.domNode.domNode,
            };
        }
        /**
         * Delegate a pointer down event to the vertical scrollbar.
         * This is to help with clicking somewhere else and having the scrollbar react.
         */
        delegateVerticalScrollbarPointerDown(browserEvent) {
            this._verticalScrollbar.delegatePointerDown(browserEvent);
        }
        getScrollDimensions() {
            return this._scrollable.getScrollDimensions();
        }
        setScrollDimensions(dimensions) {
            this._scrollable.setScrollDimensions(dimensions, false);
        }
        /**
         * Update the class name of the scrollable element.
         */
        updateClassName(newClassName) {
            this._options.className = newClassName;
            // Defaults are different on Macs
            if (platform.isMacintosh) {
                this._options.className += ' mac';
            }
            this._domNode.className = 'monaco-scrollable-element ' + this._options.className;
        }
        /**
         * Update configuration options for the scrollbar.
         */
        updateOptions(newOptions) {
            if (typeof newOptions.handleMouseWheel !== 'undefined') {
                this._options.handleMouseWheel = newOptions.handleMouseWheel;
                this._setListeningToMouseWheel(this._options.handleMouseWheel);
            }
            if (typeof newOptions.mouseWheelScrollSensitivity !== 'undefined') {
                this._options.mouseWheelScrollSensitivity = newOptions.mouseWheelScrollSensitivity;
            }
            if (typeof newOptions.fastScrollSensitivity !== 'undefined') {
                this._options.fastScrollSensitivity = newOptions.fastScrollSensitivity;
            }
            if (typeof newOptions.scrollPredominantAxis !== 'undefined') {
                this._options.scrollPredominantAxis = newOptions.scrollPredominantAxis;
            }
            if (typeof newOptions.horizontal !== 'undefined') {
                this._options.horizontal = newOptions.horizontal;
            }
            if (typeof newOptions.vertical !== 'undefined') {
                this._options.vertical = newOptions.vertical;
            }
            if (typeof newOptions.horizontalScrollbarSize !== 'undefined') {
                this._options.horizontalScrollbarSize = newOptions.horizontalScrollbarSize;
            }
            if (typeof newOptions.verticalScrollbarSize !== 'undefined') {
                this._options.verticalScrollbarSize = newOptions.verticalScrollbarSize;
            }
            if (typeof newOptions.scrollByPage !== 'undefined') {
                this._options.scrollByPage = newOptions.scrollByPage;
            }
            this._horizontalScrollbar.updateOptions(this._options);
            this._verticalScrollbar.updateOptions(this._options);
            if (!this._options.lazyRender) {
                this._render();
            }
        }
        setRevealOnScroll(value) {
            this._revealOnScroll = value;
        }
        delegateScrollFromMouseWheelEvent(browserEvent) {
            this._onMouseWheel(new mouseEvent_1.StandardWheelEvent(browserEvent));
        }
        // -------------------- mouse wheel scrolling --------------------
        _setListeningToMouseWheel(shouldListen) {
            const isListening = (this._mouseWheelToDispose.length > 0);
            if (isListening === shouldListen) {
                // No change
                return;
            }
            // Stop listening (if necessary)
            this._mouseWheelToDispose = (0, lifecycle_1.dispose)(this._mouseWheelToDispose);
            // Start listening (if necessary)
            if (shouldListen) {
                const onMouseWheel = (browserEvent) => {
                    this._onMouseWheel(new mouseEvent_1.StandardWheelEvent(browserEvent));
                };
                this._mouseWheelToDispose.push(dom.addDisposableListener(this._listenOnDomNode, dom.EventType.MOUSE_WHEEL, onMouseWheel, { passive: false }));
            }
        }
        _onMouseWheel(e) {
            if (e.browserEvent?.defaultPrevented) {
                return;
            }
            const classifier = MouseWheelClassifier.INSTANCE;
            if (SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED) {
                classifier.acceptStandardWheelEvent(e);
            }
            // useful for creating unit tests:
            // console.log(`${Date.now()}, ${e.deltaY}, ${e.deltaX}`);
            let didScroll = false;
            if (e.deltaY || e.deltaX) {
                let deltaY = e.deltaY * this._options.mouseWheelScrollSensitivity;
                let deltaX = e.deltaX * this._options.mouseWheelScrollSensitivity;
                if (this._options.scrollPredominantAxis) {
                    if (this._options.scrollYToX && deltaX + deltaY === 0) {
                        // when configured to map Y to X and we both see
                        // no dominant axis and X and Y are competing with
                        // identical values into opposite directions, we
                        // ignore the delta as we cannot make a decision then
                        deltaX = deltaY = 0;
                    }
                    else if (Math.abs(deltaY) >= Math.abs(deltaX)) {
                        deltaX = 0;
                    }
                    else {
                        deltaY = 0;
                    }
                }
                if (this._options.flipAxes) {
                    [deltaY, deltaX] = [deltaX, deltaY];
                }
                // Convert vertical scrolling to horizontal if shift is held, this
                // is handled at a higher level on Mac
                const shiftConvert = !platform.isMacintosh && e.browserEvent && e.browserEvent.shiftKey;
                if ((this._options.scrollYToX || shiftConvert) && !deltaX) {
                    deltaX = deltaY;
                    deltaY = 0;
                }
                if (e.browserEvent && e.browserEvent.altKey) {
                    // fastScrolling
                    deltaX = deltaX * this._options.fastScrollSensitivity;
                    deltaY = deltaY * this._options.fastScrollSensitivity;
                }
                const futureScrollPosition = this._scrollable.getFutureScrollPosition();
                let desiredScrollPosition = {};
                if (deltaY) {
                    const deltaScrollTop = SCROLL_WHEEL_SENSITIVITY * deltaY;
                    // Here we convert values such as -0.3 to -1 or 0.3 to 1, otherwise low speed scrolling will never scroll
                    const desiredScrollTop = futureScrollPosition.scrollTop - (deltaScrollTop < 0 ? Math.floor(deltaScrollTop) : Math.ceil(deltaScrollTop));
                    this._verticalScrollbar.writeScrollPosition(desiredScrollPosition, desiredScrollTop);
                }
                if (deltaX) {
                    const deltaScrollLeft = SCROLL_WHEEL_SENSITIVITY * deltaX;
                    // Here we convert values such as -0.3 to -1 or 0.3 to 1, otherwise low speed scrolling will never scroll
                    const desiredScrollLeft = futureScrollPosition.scrollLeft - (deltaScrollLeft < 0 ? Math.floor(deltaScrollLeft) : Math.ceil(deltaScrollLeft));
                    this._horizontalScrollbar.writeScrollPosition(desiredScrollPosition, desiredScrollLeft);
                }
                // Check that we are scrolling towards a location which is valid
                desiredScrollPosition = this._scrollable.validateScrollPosition(desiredScrollPosition);
                if (futureScrollPosition.scrollLeft !== desiredScrollPosition.scrollLeft || futureScrollPosition.scrollTop !== desiredScrollPosition.scrollTop) {
                    const canPerformSmoothScroll = (SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED
                        && this._options.mouseWheelSmoothScroll
                        && classifier.isPhysicalMouseWheel());
                    if (canPerformSmoothScroll) {
                        this._scrollable.setScrollPositionSmooth(desiredScrollPosition);
                    }
                    else {
                        this._scrollable.setScrollPositionNow(desiredScrollPosition);
                    }
                    didScroll = true;
                }
            }
            let consumeMouseWheel = didScroll;
            if (!consumeMouseWheel && this._options.alwaysConsumeMouseWheel) {
                consumeMouseWheel = true;
            }
            if (!consumeMouseWheel && this._options.consumeMouseWheelIfScrollbarIsNeeded && (this._verticalScrollbar.isNeeded() || this._horizontalScrollbar.isNeeded())) {
                consumeMouseWheel = true;
            }
            if (consumeMouseWheel) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        _onDidScroll(e) {
            this._shouldRender = this._horizontalScrollbar.onDidScroll(e) || this._shouldRender;
            this._shouldRender = this._verticalScrollbar.onDidScroll(e) || this._shouldRender;
            if (this._options.useShadows) {
                this._shouldRender = true;
            }
            if (this._revealOnScroll) {
                this._reveal();
            }
            if (!this._options.lazyRender) {
                this._render();
            }
        }
        /**
         * Render / mutate the DOM now.
         * Should be used together with the ctor option `lazyRender`.
         */
        renderNow() {
            if (!this._options.lazyRender) {
                throw new Error('Please use `lazyRender` together with `renderNow`!');
            }
            this._render();
        }
        _render() {
            if (!this._shouldRender) {
                return;
            }
            this._shouldRender = false;
            this._horizontalScrollbar.render();
            this._verticalScrollbar.render();
            if (this._options.useShadows) {
                const scrollState = this._scrollable.getCurrentScrollPosition();
                const enableTop = scrollState.scrollTop > 0;
                const enableLeft = scrollState.scrollLeft > 0;
                const leftClassName = (enableLeft ? ' left' : '');
                const topClassName = (enableTop ? ' top' : '');
                const topLeftClassName = (enableLeft || enableTop ? ' top-left-corner' : '');
                this._leftShadowDomNode.setClassName(`shadow${leftClassName}`);
                this._topShadowDomNode.setClassName(`shadow${topClassName}`);
                this._topLeftShadowDomNode.setClassName(`shadow${topLeftClassName}${topClassName}${leftClassName}`);
            }
        }
        // -------------------- fade in / fade out --------------------
        _onDragStart() {
            this._isDragging = true;
            this._reveal();
        }
        _onDragEnd() {
            this._isDragging = false;
            this._hide();
        }
        _onMouseLeave(e) {
            this._mouseIsOver = false;
            this._hide();
        }
        _onMouseOver(e) {
            this._mouseIsOver = true;
            this._reveal();
        }
        _reveal() {
            this._verticalScrollbar.beginReveal();
            this._horizontalScrollbar.beginReveal();
            this._scheduleHide();
        }
        _hide() {
            if (!this._mouseIsOver && !this._isDragging) {
                this._verticalScrollbar.beginHide();
                this._horizontalScrollbar.beginHide();
            }
        }
        _scheduleHide() {
            if (!this._mouseIsOver && !this._isDragging) {
                this._hideTimeout.cancelAndSet(() => this._hide(), HIDE_TIMEOUT);
            }
        }
    }
    exports.AbstractScrollableElement = AbstractScrollableElement;
    class ScrollableElement extends AbstractScrollableElement {
        constructor(element, options) {
            options = options || {};
            options.mouseWheelSmoothScroll = false;
            const scrollable = new scrollable_1.Scrollable({
                forceIntegerValues: true,
                smoothScrollDuration: 0,
                scheduleAtNextAnimationFrame: (callback) => dom.scheduleAtNextAnimationFrame(dom.getWindow(element), callback)
            });
            super(element, options, scrollable);
            this._register(scrollable);
        }
        setScrollPosition(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        getScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
    }
    exports.ScrollableElement = ScrollableElement;
    class SmoothScrollableElement extends AbstractScrollableElement {
        constructor(element, options, scrollable) {
            super(element, options, scrollable);
        }
        setScrollPosition(update) {
            if (update.reuseAnimation) {
                this._scrollable.setScrollPositionSmooth(update, update.reuseAnimation);
            }
            else {
                this._scrollable.setScrollPositionNow(update);
            }
        }
        getScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
    }
    exports.SmoothScrollableElement = SmoothScrollableElement;
    class DomScrollableElement extends AbstractScrollableElement {
        constructor(element, options) {
            options = options || {};
            options.mouseWheelSmoothScroll = false;
            const scrollable = new scrollable_1.Scrollable({
                forceIntegerValues: false, // See https://github.com/microsoft/vscode/issues/139877
                smoothScrollDuration: 0,
                scheduleAtNextAnimationFrame: (callback) => dom.scheduleAtNextAnimationFrame(dom.getWindow(element), callback)
            });
            super(element, options, scrollable);
            this._register(scrollable);
            this._element = element;
            this._register(this.onScroll((e) => {
                if (e.scrollTopChanged) {
                    this._element.scrollTop = e.scrollTop;
                }
                if (e.scrollLeftChanged) {
                    this._element.scrollLeft = e.scrollLeft;
                }
            }));
            this.scanDomNode();
        }
        setScrollPosition(update) {
            this._scrollable.setScrollPositionNow(update);
        }
        getScrollPosition() {
            return this._scrollable.getCurrentScrollPosition();
        }
        scanDomNode() {
            // width, scrollLeft, scrollWidth, height, scrollTop, scrollHeight
            this.setScrollDimensions({
                width: this._element.clientWidth,
                scrollWidth: this._element.scrollWidth,
                height: this._element.clientHeight,
                scrollHeight: this._element.scrollHeight
            });
            this.setScrollPosition({
                scrollLeft: this._element.scrollLeft,
                scrollTop: this._element.scrollTop,
            });
        }
    }
    exports.DomScrollableElement = DomScrollableElement;
    function resolveOptions(opts) {
        const result = {
            lazyRender: (typeof opts.lazyRender !== 'undefined' ? opts.lazyRender : false),
            className: (typeof opts.className !== 'undefined' ? opts.className : ''),
            useShadows: (typeof opts.useShadows !== 'undefined' ? opts.useShadows : true),
            handleMouseWheel: (typeof opts.handleMouseWheel !== 'undefined' ? opts.handleMouseWheel : true),
            flipAxes: (typeof opts.flipAxes !== 'undefined' ? opts.flipAxes : false),
            consumeMouseWheelIfScrollbarIsNeeded: (typeof opts.consumeMouseWheelIfScrollbarIsNeeded !== 'undefined' ? opts.consumeMouseWheelIfScrollbarIsNeeded : false),
            alwaysConsumeMouseWheel: (typeof opts.alwaysConsumeMouseWheel !== 'undefined' ? opts.alwaysConsumeMouseWheel : false),
            scrollYToX: (typeof opts.scrollYToX !== 'undefined' ? opts.scrollYToX : false),
            mouseWheelScrollSensitivity: (typeof opts.mouseWheelScrollSensitivity !== 'undefined' ? opts.mouseWheelScrollSensitivity : 1),
            fastScrollSensitivity: (typeof opts.fastScrollSensitivity !== 'undefined' ? opts.fastScrollSensitivity : 5),
            scrollPredominantAxis: (typeof opts.scrollPredominantAxis !== 'undefined' ? opts.scrollPredominantAxis : true),
            mouseWheelSmoothScroll: (typeof opts.mouseWheelSmoothScroll !== 'undefined' ? opts.mouseWheelSmoothScroll : true),
            arrowSize: (typeof opts.arrowSize !== 'undefined' ? opts.arrowSize : 11),
            listenOnDomNode: (typeof opts.listenOnDomNode !== 'undefined' ? opts.listenOnDomNode : null),
            horizontal: (typeof opts.horizontal !== 'undefined' ? opts.horizontal : 1 /* ScrollbarVisibility.Auto */),
            horizontalScrollbarSize: (typeof opts.horizontalScrollbarSize !== 'undefined' ? opts.horizontalScrollbarSize : 10),
            horizontalSliderSize: (typeof opts.horizontalSliderSize !== 'undefined' ? opts.horizontalSliderSize : 0),
            horizontalHasArrows: (typeof opts.horizontalHasArrows !== 'undefined' ? opts.horizontalHasArrows : false),
            vertical: (typeof opts.vertical !== 'undefined' ? opts.vertical : 1 /* ScrollbarVisibility.Auto */),
            verticalScrollbarSize: (typeof opts.verticalScrollbarSize !== 'undefined' ? opts.verticalScrollbarSize : 10),
            verticalHasArrows: (typeof opts.verticalHasArrows !== 'undefined' ? opts.verticalHasArrows : false),
            verticalSliderSize: (typeof opts.verticalSliderSize !== 'undefined' ? opts.verticalSliderSize : 0),
            scrollByPage: (typeof opts.scrollByPage !== 'undefined' ? opts.scrollByPage : false)
        };
        result.horizontalSliderSize = (typeof opts.horizontalSliderSize !== 'undefined' ? opts.horizontalSliderSize : result.horizontalScrollbarSize);
        result.verticalSliderSize = (typeof opts.verticalSliderSize !== 'undefined' ? opts.verticalSliderSize : result.verticalScrollbarSize);
        // Defaults are different on Macs
        if (platform.isMacintosh) {
            result.className += ' mac';
        }
        return result;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsYWJsZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci91aS9zY3JvbGxiYXIvc2Nyb2xsYWJsZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBa0JoRyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUM7SUFDekIsTUFBTSx3QkFBd0IsR0FBRyxFQUFFLENBQUM7SUFDcEMsTUFBTSxrQ0FBa0MsR0FBRyxJQUFJLENBQUM7SUFPaEQsTUFBTSx3QkFBd0I7UUFNN0IsWUFBWSxTQUFpQixFQUFFLE1BQWMsRUFBRSxNQUFjO1lBQzVELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLENBQUM7S0FDRDtJQUVELE1BQWEsb0JBQW9CO2lCQUVULGFBQVEsR0FBRyxJQUFJLG9CQUFvQixFQUFFLENBQUM7UUFPN0Q7WUFDQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQztRQUVNLG9CQUFvQjtZQUMxQixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUM3QyxjQUFjO2dCQUNkLE9BQU8sS0FBSyxDQUFDO1lBQ2QsQ0FBQztZ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