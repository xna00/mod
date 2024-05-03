/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/canIUse", "vs/base/browser/keyboardEvent", "vs/base/browser/mouseEvent", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/browser/dompurify/dompurify", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/hash", "vs/base/browser/window"], function (require, exports, browser, canIUse_1, keyboardEvent_1, mouseEvent_1, async_1, errors_1, event, dompurify, lifecycle_1, network_1, platform, uri_1, hash_1, window_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragAndDropObserver = exports.ModifierKeyEmitter = exports.basicMarkupHtmlTags = exports.DetectedFullscreenMode = exports.Namespace = exports.EventHelper = exports.EventType = exports.sharedMutationObserver = exports.Dimension = exports.WindowIntervalTimer = exports.scheduleAtNextAnimationFrame = exports.runAtThisOrScheduleAtNextAnimationFrame = exports.WindowIdleValue = exports.addStandardDisposableGenericMouseUpListener = exports.addStandardDisposableGenericMouseDownListener = exports.addStandardDisposableListener = exports.onDidUnregisterWindow = exports.onWillUnregisterWindow = exports.onDidRegisterWindow = exports.hasWindow = exports.getWindowById = exports.getWindowId = exports.getWindowsCount = exports.getWindows = exports.getDocument = exports.getWindow = exports.registerWindow = void 0;
    exports.clearNode = clearNode;
    exports.addDisposableListener = addDisposableListener;
    exports.addDisposableGenericMouseDownListener = addDisposableGenericMouseDownListener;
    exports.addDisposableGenericMouseMoveListener = addDisposableGenericMouseMoveListener;
    exports.addDisposableGenericMouseUpListener = addDisposableGenericMouseUpListener;
    exports.runWhenWindowIdle = runWhenWindowIdle;
    exports.disposableWindowInterval = disposableWindowInterval;
    exports.measure = measure;
    exports.modify = modify;
    exports.addDisposableThrottledListener = addDisposableThrottledListener;
    exports.getComputedStyle = getComputedStyle;
    exports.getClientArea = getClientArea;
    exports.getTopLeftOffset = getTopLeftOffset;
    exports.size = size;
    exports.position = position;
    exports.getDomNodePagePosition = getDomNodePagePosition;
    exports.getDomNodeZoomLevel = getDomNodeZoomLevel;
    exports.getTotalWidth = getTotalWidth;
    exports.getContentWidth = getContentWidth;
    exports.getTotalScrollWidth = getTotalScrollWidth;
    exports.getContentHeight = getContentHeight;
    exports.getTotalHeight = getTotalHeight;
    exports.getLargestChildWidth = getLargestChildWidth;
    exports.isAncestor = isAncestor;
    exports.setParentFlowTo = setParentFlowTo;
    exports.isAncestorUsingFlowTo = isAncestorUsingFlowTo;
    exports.findParentWithClass = findParentWithClass;
    exports.hasParentWithClass = hasParentWithClass;
    exports.isShadowRoot = isShadowRoot;
    exports.isInShadowDOM = isInShadowDOM;
    exports.getShadowRoot = getShadowRoot;
    exports.getActiveElement = getActiveElement;
    exports.isActiveElement = isActiveElement;
    exports.isAncestorOfActiveElement = isAncestorOfActiveElement;
    exports.isActiveDocument = isActiveDocument;
    exports.getActiveDocument = getActiveDocument;
    exports.getActiveWindow = getActiveWindow;
    exports.isGlobalStylesheet = isGlobalStylesheet;
    exports.createStyleSheet2 = createStyleSheet2;
    exports.createStyleSheet = createStyleSheet;
    exports.cloneGlobalStylesheets = cloneGlobalStylesheets;
    exports.createMetaElement = createMetaElement;
    exports.createLinkElement = createLinkElement;
    exports.createCSSRule = createCSSRule;
    exports.removeCSSRulesContainingSelector = removeCSSRulesContainingSelector;
    exports.isMouseEvent = isMouseEvent;
    exports.isKeyboardEvent = isKeyboardEvent;
    exports.isPointerEvent = isPointerEvent;
    exports.isDragEvent = isDragEvent;
    exports.isEventLike = isEventLike;
    exports.saveParentsScrollTop = saveParentsScrollTop;
    exports.restoreParentsScrollTop = restoreParentsScrollTop;
    exports.trackFocus = trackFocus;
    exports.after = after;
    exports.append = append;
    exports.prepend = prepend;
    exports.reset = reset;
    exports.$ = $;
    exports.join = join;
    exports.setVisibility = setVisibility;
    exports.show = show;
    exports.hide = hide;
    exports.removeTabIndexAndUpdateFocus = removeTabIndexAndUpdateFocus;
    exports.finalHandler = finalHandler;
    exports.domContentLoaded = domContentLoaded;
    exports.computeScreenAwareSize = computeScreenAwareSize;
    exports.windowOpenNoOpener = windowOpenNoOpener;
    exports.windowOpenPopup = windowOpenPopup;
    exports.windowOpenWithSuccess = windowOpenWithSuccess;
    exports.animate = animate;
    exports.asCSSUrl = asCSSUrl;
    exports.asCSSPropertyValue = asCSSPropertyValue;
    exports.asCssValueWithDefault = asCssValueWithDefault;
    exports.triggerDownload = triggerDownload;
    exports.triggerUpload = triggerUpload;
    exports.detectFullscreen = detectFullscreen;
    exports.hookDomPurifyHrefAndSrcSanitizer = hookDomPurifyHrefAndSrcSanitizer;
    exports.safeInnerHtml = safeInnerHtml;
    exports.multibyteAwareBtoa = multibyteAwareBtoa;
    exports.getCookieValue = getCookieValue;
    exports.h = h;
    exports.copyAttributes = copyAttributes;
    exports.trackAttributes = trackAttributes;
    //# region Multi-Window Support Utilities
    _a = (function () {
        const windows = new Map();
        (0, window_1.ensureCodeWindow)(window_1.mainWindow, 1);
        const mainWindowRegistration = { window: window_1.mainWindow, disposables: new lifecycle_1.DisposableStore() };
        windows.set(window_1.mainWindow.vscodeWindowId, mainWindowRegistration);
        const onDidRegisterWindow = new event.Emitter();
        const onDidUnregisterWindow = new event.Emitter();
        const onWillUnregisterWindow = new event.Emitter();
        function getWindowById(windowId, fallbackToMain) {
            const window = typeof windowId === 'number' ? windows.get(windowId) : undefined;
            return window ?? (fallbackToMain ? mainWindowRegistration : undefined);
        }
        return {
            onDidRegisterWindow: onDidRegisterWindow.event,
            onWillUnregisterWindow: onWillUnregisterWindow.event,
            onDidUnregisterWindow: onDidUnregisterWindow.event,
            registerWindow(window) {
                if (windows.has(window.vscodeWindowId)) {
                    return lifecycle_1.Disposable.None;
                }
                const disposables = new lifecycle_1.DisposableStore();
                const registeredWindow = {
                    window,
                    disposables: disposables.add(new lifecycle_1.DisposableStore())
                };
                windows.set(window.vscodeWindowId, registeredWindow);
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    windows.delete(window.vscodeWindowId);
                    onDidUnregisterWindow.fire(window);
                }));
                disposables.add(addDisposableListener(window, exports.EventType.BEFORE_UNLOAD, () => {
                    onWillUnregisterWindow.fire(window);
                }));
                onDidRegisterWindow.fire(registeredWindow);
                return disposables;
            },
            getWindows() {
                return windows.values();
            },
            getWindowsCount() {
                return windows.size;
            },
            getWindowId(targetWindow) {
                return targetWindow.vscodeWindowId;
            },
            hasWindow(windowId) {
                return windows.has(windowId);
            },
            getWindowById,
            getWindow(e) {
                const candidateNode = e;
                if (candidateNode?.ownerDocument?.defaultView) {
                    return candidateNode.ownerDocument.defaultView.window;
                }
                const candidateEvent = e;
                if (candidateEvent?.view) {
                    return candidateEvent.view.window;
                }
                return window_1.mainWindow;
            },
            getDocument(e) {
                const candidateNode = e;
                return (0, exports.getWindow)(candidateNode).document;
            }
        };
    })(), exports.registerWindow = _a.registerWindow, exports.getWindow = _a.getWindow, exports.getDocument = _a.getDocument, exports.getWindows = _a.getWindows, exports.getWindowsCount = _a.getWindowsCount, exports.getWindowId = _a.getWindowId, exports.getWindowById = _a.getWindowById, exports.hasWindow = _a.hasWindow, exports.onDidRegisterWindow = _a.onDidRegisterWindow, exports.onWillUnregisterWindow = _a.onWillUnregisterWindow, exports.onDidUnregisterWindow = _a.onDidUnregisterWindow;
    //#endregion
    function clearNode(node) {
        while (node.firstChild) {
            node.firstChild.remove();
        }
    }
    class DomListener {
        constructor(node, type, handler, options) {
            this._node = node;
            this._type = type;
            this._handler = handler;
            this._options = (options || false);
            this._node.addEventListener(this._type, this._handler, this._options);
        }
        dispose() {
            if (!this._handler) {
                // Already disposed
                return;
            }
            this._node.removeEventListener(this._type, this._handler, this._options);
            // Prevent leakers from holding on to the dom or handler func
            this._node = null;
            this._handler = null;
        }
    }
    function addDisposableListener(node, type, handler, useCaptureOrOptions) {
        return new DomListener(node, type, handler, useCaptureOrOptions);
    }
    function _wrapAsStandardMouseEvent(targetWindow, handler) {
        return function (e) {
            return handler(new mouseEvent_1.StandardMouseEvent(targetWindow, e));
        };
    }
    function _wrapAsStandardKeyboardEvent(handler) {
        return function (e) {
            return handler(new keyboardEvent_1.StandardKeyboardEvent(e));
        };
    }
    const addStandardDisposableListener = function addStandardDisposableListener(node, type, handler, useCapture) {
        let wrapHandler = handler;
        if (type === 'click' || type === 'mousedown') {
            wrapHandler = _wrapAsStandardMouseEvent((0, exports.getWindow)(node), handler);
        }
        else if (type === 'keydown' || type === 'keypress' || type === 'keyup') {
            wrapHandler = _wrapAsStandardKeyboardEvent(handler);
        }
        return addDisposableListener(node, type, wrapHandler, useCapture);
    };
    exports.addStandardDisposableListener = addStandardDisposableListener;
    const addStandardDisposableGenericMouseDownListener = function addStandardDisposableListener(node, handler, useCapture) {
        const wrapHandler = _wrapAsStandardMouseEvent((0, exports.getWindow)(node), handler);
        return addDisposableGenericMouseDownListener(node, wrapHandler, useCapture);
    };
    exports.addStandardDisposableGenericMouseDownListener = addStandardDisposableGenericMouseDownListener;
    const addStandardDisposableGenericMouseUpListener = function addStandardDisposableListener(node, handler, useCapture) {
        const wrapHandler = _wrapAsStandardMouseEvent((0, exports.getWindow)(node), handler);
        return addDisposableGenericMouseUpListener(node, wrapHandler, useCapture);
    };
    exports.addStandardDisposableGenericMouseUpListener = addStandardDisposableGenericMouseUpListener;
    function addDisposableGenericMouseDownListener(node, handler, useCapture) {
        return addDisposableListener(node, platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? exports.EventType.POINTER_DOWN : exports.EventType.MOUSE_DOWN, handler, useCapture);
    }
    function addDisposableGenericMouseMoveListener(node, handler, useCapture) {
        return addDisposableListener(node, platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? exports.EventType.POINTER_MOVE : exports.EventType.MOUSE_MOVE, handler, useCapture);
    }
    function addDisposableGenericMouseUpListener(node, handler, useCapture) {
        return addDisposableListener(node, platform.isIOS && canIUse_1.BrowserFeatures.pointerEvents ? exports.EventType.POINTER_UP : exports.EventType.MOUSE_UP, handler, useCapture);
    }
    /**
     * Execute the callback the next time the browser is idle, returning an
     * {@link IDisposable} that will cancel the callback when disposed. This wraps
     * [requestIdleCallback] so it will fallback to [setTimeout] if the environment
     * doesn't support it.
     *
     * @param targetWindow The window for which to run the idle callback
     * @param callback The callback to run when idle, this includes an
     * [IdleDeadline] that provides the time alloted for the idle callback by the
     * browser. Not respecting this deadline will result in a degraded user
     * experience.
     * @param timeout A timeout at which point to queue no longer wait for an idle
     * callback but queue it on the regular event loop (like setTimeout). Typically
     * this should not be used.
     *
     * [IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
     * [requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
     * [setTimeout]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
     */
    function runWhenWindowIdle(targetWindow, callback, timeout) {
        return (0, async_1._runWhenIdle)(targetWindow, callback, timeout);
    }
    /**
     * An implementation of the "idle-until-urgent"-strategy as introduced
     * here: https://philipwalton.com/articles/idle-until-urgent/
     */
    class WindowIdleValue extends async_1.AbstractIdleValue {
        constructor(targetWindow, executor) {
            super(targetWindow, executor);
        }
    }
    exports.WindowIdleValue = WindowIdleValue;
    function disposableWindowInterval(targetWindow, handler, interval, iterations) {
        let iteration = 0;
        const timer = targetWindow.setInterval(() => {
            iteration++;
            if ((typeof iterations === 'number' && iteration >= iterations) || handler() === true) {
                disposable.dispose();
            }
        }, interval);
        const disposable = (0, lifecycle_1.toDisposable)(() => {
            targetWindow.clearInterval(timer);
        });
        return disposable;
    }
    class WindowIntervalTimer extends async_1.IntervalTimer {
        /**
         *
         * @param node The optional node from which the target window is determined
         */
        constructor(node) {
            super();
            this.defaultTarget = node && (0, exports.getWindow)(node);
        }
        cancelAndSet(runner, interval, targetWindow) {
            return super.cancelAndSet(runner, interval, targetWindow ?? this.defaultTarget);
        }
    }
    exports.WindowIntervalTimer = WindowIntervalTimer;
    class AnimationFrameQueueItem {
        constructor(runner, priority = 0) {
            this._runner = runner;
            this.priority = priority;
            this._canceled = false;
        }
        dispose() {
            this._canceled = true;
        }
        execute() {
            if (this._canceled) {
                return;
            }
            try {
                this._runner();
            }
            catch (e) {
                (0, errors_1.onUnexpectedError)(e);
            }
        }
        // Sort by priority (largest to lowest)
        static sort(a, b) {
            return b.priority - a.priority;
        }
    }
    (function () {
        /**
         * The runners scheduled at the next animation frame
         */
        const NEXT_QUEUE = new Map();
        /**
         * The runners scheduled at the current animation frame
         */
        const CURRENT_QUEUE = new Map();
        /**
         * A flag to keep track if the native requestAnimationFrame was already called
         */
        const animFrameRequested = new Map();
        /**
         * A flag to indicate if currently handling a native requestAnimationFrame callback
         */
        const inAnimationFrameRunner = new Map();
        const animationFrameRunner = (targetWindowId) => {
            animFrameRequested.set(targetWindowId, false);
            const currentQueue = NEXT_QUEUE.get(targetWindowId) ?? [];
            CURRENT_QUEUE.set(targetWindowId, currentQueue);
            NEXT_QUEUE.set(targetWindowId, []);
            inAnimationFrameRunner.set(targetWindowId, true);
            while (currentQueue.length > 0) {
                currentQueue.sort(AnimationFrameQueueItem.sort);
                const top = currentQueue.shift();
                top.execute();
            }
            inAnimationFrameRunner.set(targetWindowId, false);
        };
        exports.scheduleAtNextAnimationFrame = (targetWindow, runner, priority = 0) => {
            const targetWindowId = (0, exports.getWindowId)(targetWindow);
            const item = new AnimationFrameQueueItem(runner, priority);
            let nextQueue = NEXT_QUEUE.get(targetWindowId);
            if (!nextQueue) {
                nextQueue = [];
                NEXT_QUEUE.set(targetWindowId, nextQueue);
            }
            nextQueue.push(item);
            if (!animFrameRequested.get(targetWindowId)) {
                animFrameRequested.set(targetWindowId, true);
                targetWindow.requestAnimationFrame(() => animationFrameRunner(targetWindowId));
            }
            return item;
        };
        exports.runAtThisOrScheduleAtNextAnimationFrame = (targetWindow, runner, priority) => {
            const targetWindowId = (0, exports.getWindowId)(targetWindow);
            if (inAnimationFrameRunner.get(targetWindowId)) {
                const item = new AnimationFrameQueueItem(runner, priority);
                let currentQueue = CURRENT_QUEUE.get(targetWindowId);
                if (!currentQueue) {
                    currentQueue = [];
                    CURRENT_QUEUE.set(targetWindowId, currentQueue);
                }
                currentQueue.push(item);
                return item;
            }
            else {
                return (0, exports.scheduleAtNextAnimationFrame)(targetWindow, runner, priority);
            }
        };
    })();
    function measure(targetWindow, callback) {
        return (0, exports.scheduleAtNextAnimationFrame)(targetWindow, callback, 10000 /* must be early */);
    }
    function modify(targetWindow, callback) {
        return (0, exports.scheduleAtNextAnimationFrame)(targetWindow, callback, -10000 /* must be late */);
    }
    const MINIMUM_TIME_MS = 8;
    const DEFAULT_EVENT_MERGER = function (lastEvent, currentEvent) {
        return currentEvent;
    };
    class TimeoutThrottledDomListener extends lifecycle_1.Disposable {
        constructor(node, type, handler, eventMerger = DEFAULT_EVENT_MERGER, minimumTimeMs = MINIMUM_TIME_MS) {
            super();
            let lastEvent = null;
            let lastHandlerTime = 0;
            const timeout = this._register(new async_1.TimeoutTimer());
            const invokeHandler = () => {
                lastHandlerTime = (new Date()).getTime();
                handler(lastEvent);
                lastEvent = null;
            };
            this._register(addDisposableListener(node, type, (e) => {
                lastEvent = eventMerger(lastEvent, e);
                const elapsedTime = (new Date()).getTime() - lastHandlerTime;
                if (elapsedTime >= minimumTimeMs) {
                    timeout.cancel();
                    invokeHandler();
                }
                else {
                    timeout.setIfNotSet(invokeHandler, minimumTimeMs - elapsedTime);
                }
            }));
        }
    }
    function addDisposableThrottledListener(node, type, handler, eventMerger, minimumTimeMs) {
        return new TimeoutThrottledDomListener(node, type, handler, eventMerger, minimumTimeMs);
    }
    function getComputedStyle(el) {
        return (0, exports.getWindow)(el).getComputedStyle(el, null);
    }
    function getClientArea(element, fallback) {
        const elWindow = (0, exports.getWindow)(element);
        const elDocument = elWindow.document;
        // Try with DOM clientWidth / clientHeight
        if (element !== elDocument.body) {
            return new Dimension(element.clientWidth, element.clientHeight);
        }
        // If visual view port exits and it's on mobile, it should be used instead of window innerWidth / innerHeight, or document.body.clientWidth / document.body.clientHeight
        if (platform.isIOS && elWindow?.visualViewport) {
            return new Dimension(elWindow.visualViewport.width, elWindow.visualViewport.height);
        }
        // Try innerWidth / innerHeight
        if (elWindow?.innerWidth && elWindow.innerHeight) {
            return new Dimension(elWindow.innerWidth, elWindow.innerHeight);
        }
        // Try with document.body.clientWidth / document.body.clientHeight
        if (elDocument.body && elDocument.body.clientWidth && elDocument.body.clientHeight) {
            return new Dimension(elDocument.body.clientWidth, elDocument.body.clientHeight);
        }
        // Try with document.documentElement.clientWidth / document.documentElement.clientHeight
        if (elDocument.documentElement && elDocument.documentElement.clientWidth && elDocument.documentElement.clientHeight) {
            return new Dimension(elDocument.documentElement.clientWidth, elDocument.documentElement.clientHeight);
        }
        if (fallback) {
            return getClientArea(fallback);
        }
        throw new Error('Unable to figure out browser width and height');
    }
    class SizeUtils {
        // Adapted from WinJS
        // Converts a CSS positioning string for the specified element to pixels.
        static convertToPixels(element, value) {
            return parseFloat(value) || 0;
        }
        static getDimension(element, cssPropertyName, jsPropertyName) {
            const computedStyle = getComputedStyle(element);
            const value = computedStyle ? computedStyle.getPropertyValue(cssPropertyName) : '0';
            return SizeUtils.convertToPixels(element, value);
        }
        static getBorderLeftWidth(element) {
            return SizeUtils.getDimension(element, 'border-left-width', 'borderLeftWidth');
        }
        static getBorderRightWidth(element) {
            return SizeUtils.getDimension(element, 'border-right-width', 'borderRightWidth');
        }
        static getBorderTopWidth(element) {
            return SizeUtils.getDimension(element, 'border-top-width', 'borderTopWidth');
        }
        static getBorderBottomWidth(element) {
            return SizeUtils.getDimension(element, 'border-bottom-width', 'borderBottomWidth');
        }
        static getPaddingLeft(element) {
            return SizeUtils.getDimension(element, 'padding-left', 'paddingLeft');
        }
        static getPaddingRight(element) {
            return SizeUtils.getDimension(element, 'padding-right', 'paddingRight');
        }
        static getPaddingTop(element) {
            return SizeUtils.getDimension(element, 'padding-top', 'paddingTop');
        }
        static getPaddingBottom(element) {
            return SizeUtils.getDimension(element, 'padding-bottom', 'paddingBottom');
        }
        static getMarginLeft(element) {
            return SizeUtils.getDimension(element, 'margin-left', 'marginLeft');
        }
        static getMarginTop(element) {
            return SizeUtils.getDimension(element, 'margin-top', 'marginTop');
        }
        static getMarginRight(element) {
            return SizeUtils.getDimension(element, 'margin-right', 'marginRight');
        }
        static getMarginBottom(element) {
            return SizeUtils.getDimension(element, 'margin-bottom', 'marginBottom');
        }
    }
    class Dimension {
        static { this.None = new Dimension(0, 0); }
        constructor(width, height) {
            this.width = width;
            this.height = height;
        }
        with(width = this.width, height = this.height) {
            if (width !== this.width || height !== this.height) {
                return new Dimension(width, height);
            }
            else {
                return this;
            }
        }
        static is(obj) {
            return typeof obj === 'object' && typeof obj.height === 'number' && typeof obj.width === 'number';
        }
        static lift(obj) {
            if (obj instanceof Dimension) {
                return obj;
            }
            else {
                return new Dimension(obj.width, obj.height);
            }
        }
        static equals(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.width === b.width && a.height === b.height;
        }
    }
    exports.Dimension = Dimension;
    function getTopLeftOffset(element) {
        // Adapted from WinJS.Utilities.getPosition
        // and added borders to the mix
        let offsetParent = element.offsetParent;
        let top = element.offsetTop;
        let left = element.offsetLeft;
        while ((element = element.parentNode) !== null
            && element !== element.ownerDocument.body
            && element !== element.ownerDocument.documentElement) {
            top -= element.scrollTop;
            const c = isShadowRoot(element) ? null : getComputedStyle(element);
            if (c) {
                left -= c.direction !== 'rtl' ? element.scrollLeft : -element.scrollLeft;
            }
            if (element === offsetParent) {
                left += SizeUtils.getBorderLeftWidth(element);
                top += SizeUtils.getBorderTopWidth(element);
                top += element.offsetTop;
                left += element.offsetLeft;
                offsetParent = element.offsetParent;
            }
        }
        return {
            left: left,
            top: top
        };
    }
    function size(element, width, height) {
        if (typeof width === 'number') {
            element.style.width = `${width}px`;
        }
        if (typeof height === 'number') {
            element.style.height = `${height}px`;
        }
    }
    function position(element, top, right, bottom, left, position = 'absolute') {
        if (typeof top === 'number') {
            element.style.top = `${top}px`;
        }
        if (typeof right === 'number') {
            element.style.right = `${right}px`;
        }
        if (typeof bottom === 'number') {
            element.style.bottom = `${bottom}px`;
        }
        if (typeof left === 'number') {
            element.style.left = `${left}px`;
        }
        element.style.position = position;
    }
    /**
     * Returns the position of a dom node relative to the entire page.
     */
    function getDomNodePagePosition(domNode) {
        const bb = domNode.getBoundingClientRect();
        const window = (0, exports.getWindow)(domNode);
        return {
            left: bb.left + window.scrollX,
            top: bb.top + window.scrollY,
            width: bb.width,
            height: bb.height
        };
    }
    /**
     * Returns the effective zoom on a given element before window zoom level is applied
     */
    function getDomNodeZoomLevel(domNode) {
        let testElement = domNode;
        let zoom = 1.0;
        do {
            const elementZoomLevel = getComputedStyle(testElement).zoom;
            if (elementZoomLevel !== null && elementZoomLevel !== undefined && elementZoomLevel !== '1') {
                zoom *= elementZoomLevel;
            }
            testElement = testElement.parentElement;
        } while (testElement !== null && testElement !== testElement.ownerDocument.documentElement);
        return zoom;
    }
    // Adapted from WinJS
    // Gets the width of the element, including margins.
    function getTotalWidth(element) {
        const margin = SizeUtils.getMarginLeft(element) + SizeUtils.getMarginRight(element);
        return element.offsetWidth + margin;
    }
    function getContentWidth(element) {
        const border = SizeUtils.getBorderLeftWidth(element) + SizeUtils.getBorderRightWidth(element);
        const padding = SizeUtils.getPaddingLeft(element) + SizeUtils.getPaddingRight(element);
        return element.offsetWidth - border - padding;
    }
    function getTotalScrollWidth(element) {
        const margin = SizeUtils.getMarginLeft(element) + SizeUtils.getMarginRight(element);
        return element.scrollWidth + margin;
    }
    // Adapted from WinJS
    // Gets the height of the content of the specified element. The content height does not include borders or padding.
    function getContentHeight(element) {
        const border = SizeUtils.getBorderTopWidth(element) + SizeUtils.getBorderBottomWidth(element);
        const padding = SizeUtils.getPaddingTop(element) + SizeUtils.getPaddingBottom(element);
        return element.offsetHeight - border - padding;
    }
    // Adapted from WinJS
    // Gets the height of the element, including its margins.
    function getTotalHeight(element) {
        const margin = SizeUtils.getMarginTop(element) + SizeUtils.getMarginBottom(element);
        return element.offsetHeight + margin;
    }
    // Gets the left coordinate of the specified element relative to the specified parent.
    function getRelativeLeft(element, parent) {
        if (element === null) {
            return 0;
        }
        const elementPosition = getTopLeftOffset(element);
        const parentPosition = getTopLeftOffset(parent);
        return elementPosition.left - parentPosition.left;
    }
    function getLargestChildWidth(parent, children) {
        const childWidths = children.map((child) => {
            return Math.max(getTotalScrollWidth(child), getTotalWidth(child)) + getRelativeLeft(child, parent) || 0;
        });
        const maxWidth = Math.max(...childWidths);
        return maxWidth;
    }
    // ----------------------------------------------------------------------------------------
    function isAncestor(testChild, testAncestor) {
        return Boolean(testAncestor?.contains(testChild));
    }
    const parentFlowToDataKey = 'parentFlowToElementId';
    /**
     * Set an explicit parent to use for nodes that are not part of the
     * regular dom structure.
     */
    function setParentFlowTo(fromChildElement, toParentElement) {
        fromChildElement.dataset[parentFlowToDataKey] = toParentElement.id;
    }
    function getParentFlowToElement(node) {
        const flowToParentId = node.dataset[parentFlowToDataKey];
        if (typeof flowToParentId === 'string') {
            return node.ownerDocument.getElementById(flowToParentId);
        }
        return null;
    }
    /**
     * Check if `testAncestor` is an ancestor of `testChild`, observing the explicit
     * parents set by `setParentFlowTo`.
     */
    function isAncestorUsingFlowTo(testChild, testAncestor) {
        let node = testChild;
        while (node) {
            if (node === testAncestor) {
                return true;
            }
            if (node instanceof HTMLElement) {
                const flowToParentElement = getParentFlowToElement(node);
                if (flowToParentElement) {
                    node = flowToParentElement;
                    continue;
                }
            }
            node = node.parentNode;
        }
        return false;
    }
    function findParentWithClass(node, clazz, stopAtClazzOrNode) {
        while (node && node.nodeType === node.ELEMENT_NODE) {
            if (node.classList.contains(clazz)) {
                return node;
            }
            if (stopAtClazzOrNode) {
                if (typeof stopAtClazzOrNode === 'string') {
                    if (node.classList.contains(stopAtClazzOrNode)) {
                        return null;
                    }
                }
                else {
                    if (node === stopAtClazzOrNode) {
                        return null;
                    }
                }
            }
            node = node.parentNode;
        }
        return null;
    }
    function hasParentWithClass(node, clazz, stopAtClazzOrNode) {
        return !!findParentWithClass(node, clazz, stopAtClazzOrNode);
    }
    function isShadowRoot(node) {
        return (node && !!node.host && !!node.mode);
    }
    function isInShadowDOM(domNode) {
        return !!getShadowRoot(domNode);
    }
    function getShadowRoot(domNode) {
        while (domNode.parentNode) {
            if (domNode === domNode.ownerDocument?.body) {
                // reached the body
                return null;
            }
            domNode = domNode.parentNode;
        }
        return isShadowRoot(domNode) ? domNode : null;
    }
    /**
     * Returns the active element across all child windows
     * based on document focus. Falls back to the main
     * window if no window has focus.
     */
    function getActiveElement() {
        let result = getActiveDocument().activeElement;
        while (result?.shadowRoot) {
            result = result.shadowRoot.activeElement;
        }
        return result;
    }
    /**
     * Returns true if the focused window active element matches
     * the provided element. Falls back to the main window if no
     * window has focus.
     */
    function isActiveElement(element) {
        return getActiveElement() === element;
    }
    /**
     * Returns true if the focused window active element is contained in
     * `ancestor`. Falls back to the main window if no window has focus.
     */
    function isAncestorOfActiveElement(ancestor) {
        return isAncestor(getActiveElement(), ancestor);
    }
    /**
     * Returns whether the element is in the active `document`. The active
     * document has focus or will be the main windows document.
     */
    function isActiveDocument(element) {
        return element.ownerDocument === getActiveDocument();
    }
    /**
     * Returns the active document across main and child windows.
     * Prefers the window with focus, otherwise falls back to
     * the main windows document.
     */
    function getActiveDocument() {
        if ((0, exports.getWindowsCount)() <= 1) {
            return window_1.mainWindow.document;
        }
        const documents = Array.from((0, exports.getWindows)()).map(({ window }) => window.document);
        return documents.find(doc => doc.hasFocus()) ?? window_1.mainWindow.document;
    }
    /**
     * Returns the active window across main and child windows.
     * Prefers the window with focus, otherwise falls back to
     * the main window.
     */
    function getActiveWindow() {
        const document = getActiveDocument();
        return (document.defaultView?.window ?? window_1.mainWindow);
    }
    const globalStylesheets = new Map();
    function isGlobalStylesheet(node) {
        return globalStylesheets.has(node);
    }
    /**
     * A version of createStyleSheet which has a unified API to initialize/set the style content.
     */
    function createStyleSheet2() {
        return new WrappedStyleElement();
    }
    class WrappedStyleElement {
        constructor() {
            this._currentCssStyle = '';
            this._styleSheet = undefined;
        }
        setStyle(cssStyle) {
            if (cssStyle === this._currentCssStyle) {
                return;
            }
            this._currentCssStyle = cssStyle;
            if (!this._styleSheet) {
                this._styleSheet = createStyleSheet(window_1.mainWindow.document.head, (s) => s.innerText = cssStyle);
            }
            else {
                this._styleSheet.innerText = cssStyle;
            }
        }
        dispose() {
            if (this._styleSheet) {
                this._styleSheet.remove();
                this._styleSheet = undefined;
            }
        }
    }
    function createStyleSheet(container = window_1.mainWindow.document.head, beforeAppend, disposableStore) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.media = 'screen';
        beforeAppend?.(style);
        container.appendChild(style);
        if (disposableStore) {
            disposableStore.add((0, lifecycle_1.toDisposable)(() => container.removeChild(style)));
        }
        // With <head> as container, the stylesheet becomes global and is tracked
        // to support auxiliary windows to clone the stylesheet.
        if (container === window_1.mainWindow.document.head) {
            const globalStylesheetClones = new Set();
            globalStylesheets.set(style, globalStylesheetClones);
            for (const { window: targetWindow, disposables } of (0, exports.getWindows)()) {
                if (targetWindow === window_1.mainWindow) {
                    continue; // main window is already tracked
                }
                const cloneDisposable = disposables.add(cloneGlobalStyleSheet(style, globalStylesheetClones, targetWindow));
                disposableStore?.add(cloneDisposable);
            }
        }
        return style;
    }
    function cloneGlobalStylesheets(targetWindow) {
        const disposables = new lifecycle_1.DisposableStore();
        for (const [globalStylesheet, clonedGlobalStylesheets] of globalStylesheets) {
            disposables.add(cloneGlobalStyleSheet(globalStylesheet, clonedGlobalStylesheets, targetWindow));
        }
        return disposables;
    }
    function cloneGlobalStyleSheet(globalStylesheet, globalStylesheetClones, targetWindow) {
        const disposables = new lifecycle_1.DisposableStore();
        const clone = globalStylesheet.cloneNode(true);
        targetWindow.document.head.appendChild(clone);
        disposables.add((0, lifecycle_1.toDisposable)(() => targetWindow.document.head.removeChild(clone)));
        for (const rule of getDynamicStyleSheetRules(globalStylesheet)) {
            clone.sheet?.insertRule(rule.cssText, clone.sheet?.cssRules.length);
        }
        disposables.add(exports.sharedMutationObserver.observe(globalStylesheet, disposables, { childList: true })(() => {
            clone.textContent = globalStylesheet.textContent;
        }));
        globalStylesheetClones.add(clone);
        disposables.add((0, lifecycle_1.toDisposable)(() => globalStylesheetClones.delete(clone)));
        return disposables;
    }
    exports.sharedMutationObserver = new class {
        constructor() {
            this.mutationObservers = new Map();
        }
        observe(target, disposables, options) {
            let mutationObserversPerTarget = this.mutationObservers.get(target);
            if (!mutationObserversPerTarget) {
                mutationObserversPerTarget = new Map();
                this.mutationObservers.set(target, mutationObserversPerTarget);
            }
            const optionsHash = (0, hash_1.hash)(options);
            let mutationObserverPerOptions = mutationObserversPerTarget.get(optionsHash);
            if (!mutationObserverPerOptions) {
                const onDidMutate = new event.Emitter();
                const observer = new MutationObserver(mutations => onDidMutate.fire(mutations));
                observer.observe(target, options);
                const resolvedMutationObserverPerOptions = mutationObserverPerOptions = {
                    users: 1,
                    observer,
                    onDidMutate: onDidMutate.event
                };
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    resolvedMutationObserverPerOptions.users -= 1;
                    if (resolvedMutationObserverPerOptions.users === 0) {
                        onDidMutate.dispose();
                        observer.disconnect();
                        mutationObserversPerTarget?.delete(optionsHash);
                        if (mutationObserversPerTarget?.size === 0) {
                            this.mutationObservers.delete(target);
                        }
                    }
                }));
                mutationObserversPerTarget.set(optionsHash, mutationObserverPerOptions);
            }
            else {
                mutationObserverPerOptions.users += 1;
            }
            return mutationObserverPerOptions.onDidMutate;
        }
    };
    function createMetaElement(container = window_1.mainWindow.document.head) {
        return createHeadElement('meta', container);
    }
    function createLinkElement(container = window_1.mainWindow.document.head) {
        return createHeadElement('link', container);
    }
    function createHeadElement(tagName, container = window_1.mainWindow.document.head) {
        const element = document.createElement(tagName);
        container.appendChild(element);
        return element;
    }
    let _sharedStyleSheet = null;
    function getSharedStyleSheet() {
        if (!_sharedStyleSheet) {
            _sharedStyleSheet = createStyleSheet();
        }
        return _sharedStyleSheet;
    }
    function getDynamicStyleSheetRules(style) {
        if (style?.sheet?.rules) {
            // Chrome, IE
            return style.sheet.rules;
        }
        if (style?.sheet?.cssRules) {
            // FF
            return style.sheet.cssRules;
        }
        return [];
    }
    function createCSSRule(selector, cssText, style = getSharedStyleSheet()) {
        if (!style || !cssText) {
            return;
        }
        style.sheet?.insertRule(`${selector} {${cssText}}`, 0);
        // Apply rule also to all cloned global stylesheets
        for (const clonedGlobalStylesheet of globalStylesheets.get(style) ?? []) {
            createCSSRule(selector, cssText, clonedGlobalStylesheet);
        }
    }
    function removeCSSRulesContainingSelector(ruleName, style = getSharedStyleSheet()) {
        if (!style) {
            return;
        }
        const rules = getDynamicStyleSheetRules(style);
        const toDelete = [];
        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (isCSSStyleRule(rule) && rule.selectorText.indexOf(ruleName) !== -1) {
                toDelete.push(i);
            }
        }
        for (let i = toDelete.length - 1; i >= 0; i--) {
            style.sheet?.deleteRule(toDelete[i]);
        }
        // Remove rules also from all cloned global stylesheets
        for (const clonedGlobalStylesheet of globalStylesheets.get(style) ?? []) {
            removeCSSRulesContainingSelector(ruleName, clonedGlobalStylesheet);
        }
    }
    function isCSSStyleRule(rule) {
        return typeof rule.selectorText === 'string';
    }
    function isMouseEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof MouseEvent || e instanceof (0, exports.getWindow)(e).MouseEvent;
    }
    function isKeyboardEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof KeyboardEvent || e instanceof (0, exports.getWindow)(e).KeyboardEvent;
    }
    function isPointerEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof PointerEvent || e instanceof (0, exports.getWindow)(e).PointerEvent;
    }
    function isDragEvent(e) {
        // eslint-disable-next-line no-restricted-syntax
        return e instanceof DragEvent || e instanceof (0, exports.getWindow)(e).DragEvent;
    }
    exports.EventType = {
        // Mouse
        CLICK: 'click',
        AUXCLICK: 'auxclick',
        DBLCLICK: 'dblclick',
        MOUSE_UP: 'mouseup',
        MOUSE_DOWN: 'mousedown',
        MOUSE_OVER: 'mouseover',
        MOUSE_MOVE: 'mousemove',
        MOUSE_OUT: 'mouseout',
        MOUSE_ENTER: 'mouseenter',
        MOUSE_LEAVE: 'mouseleave',
        MOUSE_WHEEL: 'wheel',
        POINTER_UP: 'pointerup',
        POINTER_DOWN: 'pointerdown',
        POINTER_MOVE: 'pointermove',
        POINTER_LEAVE: 'pointerleave',
        CONTEXT_MENU: 'contextmenu',
        WHEEL: 'wheel',
        // Keyboard
        KEY_DOWN: 'keydown',
        KEY_PRESS: 'keypress',
        KEY_UP: 'keyup',
        // HTML Document
        LOAD: 'load',
        BEFORE_UNLOAD: 'beforeunload',
        UNLOAD: 'unload',
        PAGE_SHOW: 'pageshow',
        PAGE_HIDE: 'pagehide',
        PASTE: 'paste',
        ABORT: 'abort',
        ERROR: 'error',
        RESIZE: 'resize',
        SCROLL: 'scroll',
        FULLSCREEN_CHANGE: 'fullscreenchange',
        WK_FULLSCREEN_CHANGE: 'webkitfullscreenchange',
        // Form
        SELECT: 'select',
        CHANGE: 'change',
        SUBMIT: 'submit',
        RESET: 'reset',
        FOCUS: 'focus',
        FOCUS_IN: 'focusin',
        FOCUS_OUT: 'focusout',
        BLUR: 'blur',
        INPUT: 'input',
        // Local Storage
        STORAGE: 'storage',
        // Drag
        DRAG_START: 'dragstart',
        DRAG: 'drag',
        DRAG_ENTER: 'dragenter',
        DRAG_LEAVE: 'dragleave',
        DRAG_OVER: 'dragover',
        DROP: 'drop',
        DRAG_END: 'dragend',
        // Animation
        ANIMATION_START: browser.isWebKit ? 'webkitAnimationStart' : 'animationstart',
        ANIMATION_END: browser.isWebKit ? 'webkitAnimationEnd' : 'animationend',
        ANIMATION_ITERATION: browser.isWebKit ? 'webkitAnimationIteration' : 'animationiteration'
    };
    function isEventLike(obj) {
        const candidate = obj;
        return !!(candidate && typeof candidate.preventDefault === 'function' && typeof candidate.stopPropagation === 'function');
    }
    exports.EventHelper = {
        stop: (e, cancelBubble) => {
            e.preventDefault();
            if (cancelBubble) {
                e.stopPropagation();
            }
            return e;
        }
    };
    function saveParentsScrollTop(node) {
        const r = [];
        for (let i = 0; node && node.nodeType === node.ELEMENT_NODE; i++) {
            r[i] = node.scrollTop;
            node = node.parentNode;
        }
        return r;
    }
    function restoreParentsScrollTop(node, state) {
        for (let i = 0; node && node.nodeType === node.ELEMENT_NODE; i++) {
            if (node.scrollTop !== state[i]) {
                node.scrollTop = state[i];
            }
            node = node.parentNode;
        }
    }
    class FocusTracker extends lifecycle_1.Disposable {
        static hasFocusWithin(element) {
            if (element instanceof HTMLElement) {
                const shadowRoot = getShadowRoot(element);
                const activeElement = (shadowRoot ? shadowRoot.activeElement : element.ownerDocument.activeElement);
                return isAncestor(activeElement, element);
            }
            else {
                const window = element;
                return isAncestor(window.document.activeElement, window.document);
            }
        }
        constructor(element) {
            super();
            this._onDidFocus = this._register(new event.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            let hasFocus = FocusTracker.hasFocusWithin(element);
            let loosingFocus = false;
            const onFocus = () => {
                loosingFocus = false;
                if (!hasFocus) {
                    hasFocus = true;
                    this._onDidFocus.fire();
                }
            };
            const onBlur = () => {
                if (hasFocus) {
                    loosingFocus = true;
                    (element instanceof HTMLElement ? (0, exports.getWindow)(element) : element).setTimeout(() => {
                        if (loosingFocus) {
                            loosingFocus = false;
                            hasFocus = false;
                            this._onDidBlur.fire();
                        }
                    }, 0);
                }
            };
            this._refreshStateHandler = () => {
                const currentNodeHasFocus = FocusTracker.hasFocusWithin(element);
                if (currentNodeHasFocus !== hasFocus) {
                    if (hasFocus) {
                        onBlur();
                    }
                    else {
                        onFocus();
                    }
                }
            };
            this._register(addDisposableListener(element, exports.EventType.FOCUS, onFocus, true));
            this._register(addDisposableListener(element, exports.EventType.BLUR, onBlur, true));
            if (element instanceof HTMLElement) {
                this._register(addDisposableListener(element, exports.EventType.FOCUS_IN, () => this._refreshStateHandler()));
                this._register(addDisposableListener(element, exports.EventType.FOCUS_OUT, () => this._refreshStateHandler()));
            }
        }
        refreshState() {
            this._refreshStateHandler();
        }
    }
    /**
     * Creates a new `IFocusTracker` instance that tracks focus changes on the given `element` and its descendants.
     *
     * @param element The `HTMLElement` or `Window` to track focus changes on.
     * @returns An `IFocusTracker` instance.
     */
    function trackFocus(element) {
        return new FocusTracker(element);
    }
    function after(sibling, child) {
        sibling.after(child);
        return child;
    }
    function append(parent, ...children) {
        parent.append(...children);
        if (children.length === 1 && typeof children[0] !== 'string') {
            return children[0];
        }
    }
    function prepend(parent, child) {
        parent.insertBefore(child, parent.firstChild);
        return child;
    }
    /**
     * Removes all children from `parent` and appends `children`
     */
    function reset(parent, ...children) {
        parent.innerText = '';
        append(parent, ...children);
    }
    const SELECTOR_REGEX = /([\w\-]+)?(#([\w\-]+))?((\.([\w\-]+))*)/;
    var Namespace;
    (function (Namespace) {
        Namespace["HTML"] = "http://www.w3.org/1999/xhtml";
        Namespace["SVG"] = "http://www.w3.org/2000/svg";
    })(Namespace || (exports.Namespace = Namespace = {}));
    function _$(namespace, description, attrs, ...children) {
        const match = SELECTOR_REGEX.exec(description);
        if (!match) {
            throw new Error('Bad use of emmet');
        }
        const tagName = match[1] || 'div';
        let result;
        if (namespace !== Namespace.HTML) {
            result = document.createElementNS(namespace, tagName);
        }
        else {
            result = document.createElement(tagName);
        }
        if (match[3]) {
            result.id = match[3];
        }
        if (match[4]) {
            result.className = match[4].replace(/\./g, ' ').trim();
        }
        if (attrs) {
            Object.entries(attrs).forEach(([name, value]) => {
                if (typeof value === 'undefined') {
                    return;
                }
                if (/^on\w+$/.test(name)) {
                    result[name] = value;
                }
                else if (name === 'selected') {
                    if (value) {
                        result.setAttribute(name, 'true');
                    }
                }
                else {
                    result.setAttribute(name, value);
                }
            });
        }
        result.append(...children);
        return result;
    }
    function $(description, attrs, ...children) {
        return _$(Namespace.HTML, description, attrs, ...children);
    }
    $.SVG = function (description, attrs, ...children) {
        return _$(Namespace.SVG, description, attrs, ...children);
    };
    function join(nodes, separator) {
        const result = [];
        nodes.forEach((node, index) => {
            if (index > 0) {
                if (separator instanceof Node) {
                    result.push(separator.cloneNode());
                }
                else {
                    result.push(document.createTextNode(separator));
                }
            }
            result.push(node);
        });
        return result;
    }
    function setVisibility(visible, ...elements) {
        if (visible) {
            show(...elements);
        }
        else {
            hide(...elements);
        }
    }
    function show(...elements) {
        for (const element of elements) {
            element.style.display = '';
            element.removeAttribute('aria-hidden');
        }
    }
    function hide(...elements) {
        for (const element of elements) {
            element.style.display = 'none';
            element.setAttribute('aria-hidden', 'true');
        }
    }
    function findParentWithAttribute(node, attribute) {
        while (node && node.nodeType === node.ELEMENT_NODE) {
            if (node instanceof HTMLElement && node.hasAttribute(attribute)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }
    function removeTabIndexAndUpdateFocus(node) {
        if (!node || !node.hasAttribute('tabIndex')) {
            return;
        }
        // If we are the currently focused element and tabIndex is removed,
        // standard DOM behavior is to move focus to the <body> element. We
        // typically never want that, rather put focus to the closest element
        // in the hierarchy of the parent DOM nodes.
        if (node.ownerDocument.activeElement === node) {
            const parentFocusable = findParentWithAttribute(node.parentElement, 'tabIndex');
            parentFocusable?.focus();
        }
        node.removeAttribute('tabindex');
    }
    function finalHandler(fn) {
        return e => {
            e.preventDefault();
            e.stopPropagation();
            fn(e);
        };
    }
    function domContentLoaded(targetWindow) {
        return new Promise(resolve => {
            const readyState = targetWindow.document.readyState;
            if (readyState === 'complete' || (targetWindow.document && targetWindow.document.body !== null)) {
                resolve(undefined);
            }
            else {
                const listener = () => {
                    targetWindow.window.removeEventListener('DOMContentLoaded', listener, false);
                    resolve();
                };
                targetWindow.window.addEventListener('DOMContentLoaded', listener, false);
            }
        });
    }
    /**
     * Find a value usable for a dom node size such that the likelihood that it would be
     * displayed with constant screen pixels size is as high as possible.
     *
     * e.g. We would desire for the cursors to be 2px (CSS px) wide. Under a devicePixelRatio
     * of 1.25, the cursor will be 2.5 screen pixels wide. Depending on how the dom node aligns/"snaps"
     * with the screen pixels, it will sometimes be rendered with 2 screen pixels, and sometimes with 3 screen pixels.
     */
    function computeScreenAwareSize(window, cssPx) {
        const screenPx = window.devicePixelRatio * cssPx;
        return Math.max(1, Math.floor(screenPx)) / window.devicePixelRatio;
    }
    /**
     * Open safely a new window. This is the best way to do so, but you cannot tell
     * if the window was opened or if it was blocked by the browser's popup blocker.
     * If you want to tell if the browser blocked the new window, use {@link windowOpenWithSuccess}.
     *
     * See https://github.com/microsoft/monaco-editor/issues/601
     * To protect against malicious code in the linked site, particularly phishing attempts,
     * the window.opener should be set to null to prevent the linked site from having access
     * to change the location of the current page.
     * See https://mathiasbynens.github.io/rel-noopener/
     */
    function windowOpenNoOpener(url) {
        // By using 'noopener' in the `windowFeatures` argument, the newly created window will
        // not be able to use `window.opener` to reach back to the current page.
        // See https://stackoverflow.com/a/46958731
        // See https://developer.mozilla.org/en-US/docs/Web/API/Window/open#noopener
        // However, this also doesn't allow us to realize if the browser blocked
        // the creation of the window.
        window_1.mainWindow.open(url, '_blank', 'noopener');
    }
    /**
     * Open a new window in a popup. This is the best way to do so, but you cannot tell
     * if the window was opened or if it was blocked by the browser's popup blocker.
     * If you want to tell if the browser blocked the new window, use {@link windowOpenWithSuccess}.
     *
     * Note: this does not set {@link window.opener} to null. This is to allow the opened popup to
     * be able to use {@link window.close} to close itself. Because of this, you should only use
     * this function on urls that you trust.
     *
     * In otherwords, you should almost always use {@link windowOpenNoOpener} instead of this function.
     */
    const popupWidth = 780, popupHeight = 640;
    function windowOpenPopup(url) {
        const left = Math.floor(window_1.mainWindow.screenLeft + window_1.mainWindow.innerWidth / 2 - popupWidth / 2);
        const top = Math.floor(window_1.mainWindow.screenTop + window_1.mainWindow.innerHeight / 2 - popupHeight / 2);
        window_1.mainWindow.open(url, '_blank', `width=${popupWidth},height=${popupHeight},top=${top},left=${left}`);
    }
    /**
     * Attempts to open a window and returns whether it succeeded. This technique is
     * not appropriate in certain contexts, like for example when the JS context is
     * executing inside a sandboxed iframe. If it is not necessary to know if the
     * browser blocked the new window, use {@link windowOpenNoOpener}.
     *
     * See https://github.com/microsoft/monaco-editor/issues/601
     * See https://github.com/microsoft/monaco-editor/issues/2474
     * See https://mathiasbynens.github.io/rel-noopener/
     *
     * @param url the url to open
     * @param noOpener whether or not to set the {@link window.opener} to null. You should leave the default
     * (true) unless you trust the url that is being opened.
     * @returns boolean indicating if the {@link window.open} call succeeded
     */
    function windowOpenWithSuccess(url, noOpener = true) {
        const newTab = window_1.mainWindow.open();
        if (newTab) {
            if (noOpener) {
                // see `windowOpenNoOpener` for details on why this is important
                newTab.opener = null;
            }
            newTab.location.href = url;
            return true;
        }
        return false;
    }
    function animate(targetWindow, fn) {
        const step = () => {
            fn();
            stepDisposable = (0, exports.scheduleAtNextAnimationFrame)(targetWindow, step);
        };
        let stepDisposable = (0, exports.scheduleAtNextAnimationFrame)(targetWindow, step);
        return (0, lifecycle_1.toDisposable)(() => stepDisposable.dispose());
    }
    network_1.RemoteAuthorities.setPreferredWebSchema(/^https:/.test(window_1.mainWindow.location.href) ? 'https' : 'http');
    /**
     * returns url('...')
     */
    function asCSSUrl(uri) {
        if (!uri) {
            return `url('')`;
        }
        return `url('${network_1.FileAccess.uriToBrowserUri(uri).toString(true).replace(/'/g, '%27')}')`;
    }
    function asCSSPropertyValue(value) {
        return `'${value.replace(/'/g, '%27')}'`;
    }
    function asCssValueWithDefault(cssPropertyValue, dflt) {
        if (cssPropertyValue !== undefined) {
            const variableMatch = cssPropertyValue.match(/^\s*var\((.+)\)$/);
            if (variableMatch) {
                const varArguments = variableMatch[1].split(',', 2);
                if (varArguments.length === 2) {
                    dflt = asCssValueWithDefault(varArguments[1].trim(), dflt);
                }
                return `var(${varArguments[0]}, ${dflt})`;
            }
            return cssPropertyValue;
        }
        return dflt;
    }
    function triggerDownload(dataOrUri, name) {
        // If the data is provided as Buffer, we create a
        // blob URL out of it to produce a valid link
        let url;
        if (uri_1.URI.isUri(dataOrUri)) {
            url = dataOrUri.toString(true);
        }
        else {
            const blob = new Blob([dataOrUri]);
            url = URL.createObjectURL(blob);
            // Ensure to free the data from DOM eventually
            setTimeout(() => URL.revokeObjectURL(url));
        }
        // In order to download from the browser, the only way seems
        // to be creating a <a> element with download attribute that
        // points to the file to download.
        // See also https://developers.google.com/web/updates/2011/08/Downloading-resources-in-HTML5-a-download
        const activeWindow = getActiveWindow();
        const anchor = document.createElement('a');
        activeWindow.document.body.appendChild(anchor);
        anchor.download = name;
        anchor.href = url;
        anchor.click();
        // Ensure to remove the element from DOM eventually
        setTimeout(() => activeWindow.document.body.removeChild(anchor));
    }
    function triggerUpload() {
        return new Promise(resolve => {
            // In order to upload to the browser, create a
            // input element of type `file` and click it
            // to gather the selected files
            const activeWindow = getActiveWindow();
            const input = document.createElement('input');
            activeWindow.document.body.appendChild(input);
            input.type = 'file';
            input.multiple = true;
            // Resolve once the input event has fired once
            event.Event.once(event.Event.fromDOMEventEmitter(input, 'input'))(() => {
                resolve(input.files ?? undefined);
            });
            input.click();
            // Ensure to remove the element from DOM eventually
            setTimeout(() => activeWindow.document.body.removeChild(input));
        });
    }
    var DetectedFullscreenMode;
    (function (DetectedFullscreenMode) {
        /**
         * The document is fullscreen, e.g. because an element
         * in the document requested to be fullscreen.
         */
        DetectedFullscreenMode[DetectedFullscreenMode["DOCUMENT"] = 1] = "DOCUMENT";
        /**
         * The browser is fullscreen, e.g. because the user enabled
         * native window fullscreen for it.
         */
        DetectedFullscreenMode[DetectedFullscreenMode["BROWSER"] = 2] = "BROWSER";
    })(DetectedFullscreenMode || (exports.DetectedFullscreenMode = DetectedFullscreenMode = {}));
    function detectFullscreen(targetWindow) {
        // Browser fullscreen: use DOM APIs to detect
        if (targetWindow.document.fullscreenElement || targetWindow.document.webkitFullscreenElement || targetWindow.document.webkitIsFullScreen) {
            return { mode: DetectedFullscreenMode.DOCUMENT, guess: false };
        }
        // There is no standard way to figure out if the browser
        // is using native fullscreen. Via checking on screen
        // height and comparing that to window height, we can guess
        // it though.
        if (targetWindow.innerHeight === targetWindow.screen.height) {
            // if the height of the window matches the screen height, we can
            // safely assume that the browser is fullscreen because no browser
            // chrome is taking height away (e.g. like toolbars).
            return { mode: DetectedFullscreenMode.BROWSER, guess: false };
        }
        if (platform.isMacintosh || platform.isLinux) {
            // macOS and Linux do not properly report `innerHeight`, only Windows does
            if (targetWindow.outerHeight === targetWindow.screen.height && targetWindow.outerWidth === targetWindow.screen.width) {
                // if the height of the browser matches the screen height, we can
                // only guess that we are in fullscreen. It is also possible that
                // the user has turned off taskbars in the OS and the browser is
                // simply able to span the entire size of the screen.
                return { mode: DetectedFullscreenMode.BROWSER, guess: true };
            }
        }
        // Not in fullscreen
        return null;
    }
    // -- sanitize and trusted html
    /**
     * Hooks dompurify using `afterSanitizeAttributes` to check that all `href` and `src`
     * attributes are valid.
     */
    function hookDomPurifyHrefAndSrcSanitizer(allowedProtocols, allowDataImages = false) {
        // https://github.com/cure53/DOMPurify/blob/main/demos/hooks-scheme-allowlist.html
        // build an anchor to map URLs to
        const anchor = document.createElement('a');
        dompurify.addHook('afterSanitizeAttributes', (node) => {
            // check all href/src attributes for validity
            for (const attr of ['href', 'src']) {
                if (node.hasAttribute(attr)) {
                    const attrValue = node.getAttribute(attr);
                    if (attr === 'href' && attrValue.startsWith('#')) {
                        // Allow fragment links
                        continue;
                    }
                    anchor.href = attrValue;
                    if (!allowedProtocols.includes(anchor.protocol.replace(/:$/, ''))) {
                        if (allowDataImages && attr === 'src' && anchor.href.startsWith('data:')) {
                            continue;
                        }
                        node.removeAttribute(attr);
                    }
                }
            }
        });
        return (0, lifecycle_1.toDisposable)(() => {
            dompurify.removeHook('afterSanitizeAttributes');
        });
    }
    const defaultSafeProtocols = [
        network_1.Schemas.http,
        network_1.Schemas.https,
        network_1.Schemas.command,
    ];
    /**
     * List of safe, non-input html tags.
     */
    exports.basicMarkupHtmlTags = Object.freeze([
        'a',
        'abbr',
        'b',
        'bdo',
        'blockquote',
        'br',
        'caption',
        'cite',
        'code',
        'col',
        'colgroup',
        'dd',
        'del',
        'details',
        'dfn',
        'div',
        'dl',
        'dt',
        'em',
        'figcaption',
        'figure',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'hr',
        'i',
        'img',
        'input',
        'ins',
        'kbd',
        'label',
        'li',
        'mark',
        'ol',
        'p',
        'pre',
        'q',
        'rp',
        'rt',
        'ruby',
        'samp',
        'small',
        'small',
        'source',
        'span',
        'strike',
        'strong',
        'sub',
        'summary',
        'sup',
        'table',
        'tbody',
        'td',
        'tfoot',
        'th',
        'thead',
        'time',
        'tr',
        'tt',
        'u',
        'ul',
        'var',
        'video',
        'wbr',
    ]);
    const defaultDomPurifyConfig = Object.freeze({
        ALLOWED_TAGS: ['a', 'button', 'blockquote', 'code', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'input', 'label', 'li', 'p', 'pre', 'select', 'small', 'span', 'strong', 'textarea', 'ul', 'ol'],
        ALLOWED_ATTR: ['href', 'data-href', 'data-command', 'target', 'title', 'name', 'src', 'alt', 'class', 'id', 'role', 'tabindex', 'style', 'data-code', 'width', 'height', 'align', 'x-dispatch', 'required', 'checked', 'placeholder', 'type', 'start'],
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_TRUSTED_TYPE: true
    });
    /**
     * Sanitizes the given `value` and reset the given `node` with it.
     */
    function safeInnerHtml(node, value) {
        const hook = hookDomPurifyHrefAndSrcSanitizer(defaultSafeProtocols);
        try {
            const html = dompurify.sanitize(value, defaultDomPurifyConfig);
            node.innerHTML = html;
        }
        finally {
            hook.dispose();
        }
    }
    /**
     * Convert a Unicode string to a string in which each 16-bit unit occupies only one byte
     *
     * From https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
     */
    function toBinary(str) {
        const codeUnits = new Uint16Array(str.length);
        for (let i = 0; i < codeUnits.length; i++) {
            codeUnits[i] = str.charCodeAt(i);
        }
        let binary = '';
        const uint8array = new Uint8Array(codeUnits.buffer);
        for (let i = 0; i < uint8array.length; i++) {
            binary += String.fromCharCode(uint8array[i]);
        }
        return binary;
    }
    /**
     * Version of the global `btoa` function that handles multi-byte characters instead
     * of throwing an exception.
     */
    function multibyteAwareBtoa(str) {
        return btoa(toBinary(str));
    }
    class ModifierKeyEmitter extends event.Emitter {
        constructor() {
            super();
            this._subscriptions = new lifecycle_1.DisposableStore();
            this._keyStatus = {
                altKey: false,
                shiftKey: false,
                ctrlKey: false,
                metaKey: false
            };
            this._subscriptions.add(event.Event.runAndSubscribe(exports.onDidRegisterWindow, ({ window, disposables }) => this.registerListeners(window, disposables), { window: window_1.mainWindow, disposables: this._subscriptions }));
        }
        registerListeners(window, disposables) {
            disposables.add(addDisposableListener(window, 'keydown', e => {
                if (e.defaultPrevented) {
                    return;
                }
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                // If Alt-key keydown event is repeated, ignore it #112347
                // Only known to be necessary for Alt-Key at the moment #115810
                if (event.keyCode === 6 /* KeyCode.Alt */ && e.repeat) {
                    return;
                }
                if (e.altKey && !this._keyStatus.altKey) {
                    this._keyStatus.lastKeyPressed = 'alt';
                }
                else if (e.ctrlKey && !this._keyStatus.ctrlKey) {
                    this._keyStatus.lastKeyPressed = 'ctrl';
                }
                else if (e.metaKey && !this._keyStatus.metaKey) {
                    this._keyStatus.lastKeyPressed = 'meta';
                }
                else if (e.shiftKey && !this._keyStatus.shiftKey) {
                    this._keyStatus.lastKeyPressed = 'shift';
                }
                else if (event.keyCode !== 6 /* KeyCode.Alt */) {
                    this._keyStatus.lastKeyPressed = undefined;
                }
                else {
                    return;
                }
                this._keyStatus.altKey = e.altKey;
                this._keyStatus.ctrlKey = e.ctrlKey;
                this._keyStatus.metaKey = e.metaKey;
                this._keyStatus.shiftKey = e.shiftKey;
                if (this._keyStatus.lastKeyPressed) {
                    this._keyStatus.event = e;
                    this.fire(this._keyStatus);
                }
            }, true));
            disposables.add(addDisposableListener(window, 'keyup', e => {
                if (e.defaultPrevented) {
                    return;
                }
                if (!e.altKey && this._keyStatus.altKey) {
                    this._keyStatus.lastKeyReleased = 'alt';
                }
                else if (!e.ctrlKey && this._keyStatus.ctrlKey) {
                    this._keyStatus.lastKeyReleased = 'ctrl';
                }
                else if (!e.metaKey && this._keyStatus.metaKey) {
                    this._keyStatus.lastKeyReleased = 'meta';
                }
                else if (!e.shiftKey && this._keyStatus.shiftKey) {
                    this._keyStatus.lastKeyReleased = 'shift';
                }
                else {
                    this._keyStatus.lastKeyReleased = undefined;
                }
                if (this._keyStatus.lastKeyPressed !== this._keyStatus.lastKeyReleased) {
                    this._keyStatus.lastKeyPressed = undefined;
                }
                this._keyStatus.altKey = e.altKey;
                this._keyStatus.ctrlKey = e.ctrlKey;
                this._keyStatus.metaKey = e.metaKey;
                this._keyStatus.shiftKey = e.shiftKey;
                if (this._keyStatus.lastKeyReleased) {
                    this._keyStatus.event = e;
                    this.fire(this._keyStatus);
                }
            }, true));
            disposables.add(addDisposableListener(window.document.body, 'mousedown', () => {
                this._keyStatus.lastKeyPressed = undefined;
            }, true));
            disposables.add(addDisposableListener(window.document.body, 'mouseup', () => {
                this._keyStatus.lastKeyPressed = undefined;
            }, true));
            disposables.add(addDisposableListener(window.document.body, 'mousemove', e => {
                if (e.buttons) {
                    this._keyStatus.lastKeyPressed = undefined;
                }
            }, true));
            disposables.add(addDisposableListener(window, 'blur', () => {
                this.resetKeyStatus();
            }));
        }
        get keyStatus() {
            return this._keyStatus;
        }
        get isModifierPressed() {
            return this._keyStatus.altKey || this._keyStatus.ctrlKey || this._keyStatus.metaKey || this._keyStatus.shiftKey;
        }
        /**
         * Allows to explicitly reset the key status based on more knowledge (#109062)
         */
        resetKeyStatus() {
            this.doResetKeyStatus();
            this.fire(this._keyStatus);
        }
        doResetKeyStatus() {
            this._keyStatus = {
                altKey: false,
                shiftKey: false,
                ctrlKey: false,
                metaKey: false
            };
        }
        static getInstance() {
            if (!ModifierKeyEmitter.instance) {
                ModifierKeyEmitter.instance = new ModifierKeyEmitter();
            }
            return ModifierKeyEmitter.instance;
        }
        dispose() {
            super.dispose();
            this._subscriptions.dispose();
        }
    }
    exports.ModifierKeyEmitter = ModifierKeyEmitter;
    function getCookieValue(name) {
        const match = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)'); // See https://stackoverflow.com/a/25490531
        return match ? match.pop() : undefined;
    }
    class DragAndDropObserver extends lifecycle_1.Disposable {
        constructor(element, callbacks) {
            super();
            this.element = element;
            this.callbacks = callbacks;
            // A helper to fix issues with repeated DRAG_ENTER / DRAG_LEAVE
            // calls see https://github.com/microsoft/vscode/issues/14470
            // when the element has child elements where the events are fired
            // repeadedly.
            this.counter = 0;
            // Allows to measure the duration of the drag operation.
            this.dragStartTime = 0;
            this.registerListeners();
        }
        registerListeners() {
            if (this.callbacks.onDragStart) {
                this._register(addDisposableListener(this.element, exports.EventType.DRAG_START, (e) => {
                    this.callbacks.onDragStart?.(e);
                }));
            }
            if (this.callbacks.onDrag) {
                this._register(addDisposableListener(this.element, exports.EventType.DRAG, (e) => {
                    this.callbacks.onDrag?.(e);
                }));
            }
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_ENTER, (e) => {
                this.counter++;
                this.dragStartTime = e.timeStamp;
                this.callbacks.onDragEnter?.(e);
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_OVER, (e) => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                this.callbacks.onDragOver?.(e, e.timeStamp - this.dragStartTime);
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_LEAVE, (e) => {
                this.counter--;
                if (this.counter === 0) {
                    this.dragStartTime = 0;
                    this.callbacks.onDragLeave?.(e);
                }
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DRAG_END, (e) => {
                this.counter = 0;
                this.dragStartTime = 0;
                this.callbacks.onDragEnd?.(e);
            }));
            this._register(addDisposableListener(this.element, exports.EventType.DROP, (e) => {
                this.counter = 0;
                this.dragStartTime = 0;
                this.callbacks.onDrop?.(e);
            }));
        }
    }
    exports.DragAndDropObserver = DragAndDropObserver;
    const H_REGEX = /(?<tag>[\w\-]+)?(?:#(?<id>[\w\-]+))?(?<class>(?:\.(?:[\w\-]+))*)(?:@(?<name>(?:[\w\_])+))?/;
    function h(tag, ...args) {
        let attributes;
        let children;
        if (Array.isArray(args[0])) {
            attributes = {};
            children = args[0];
        }
        else {
            attributes = args[0] || {};
            children = args[1];
        }
        const match = H_REGEX.exec(tag);
        if (!match || !match.groups) {
            throw new Error('Bad use of h');
        }
        const tagName = match.groups['tag'] || 'div';
        const el = document.createElement(tagName);
        if (match.groups['id']) {
            el.id = match.groups['id'];
        }
        const classNames = [];
        if (match.groups['class']) {
            for (const className of match.groups['class'].split('.')) {
                if (className !== '') {
                    classNames.push(className);
                }
            }
        }
        if (attributes.className !== undefined) {
            for (const className of attributes.className.split('.')) {
                if (className !== '') {
                    classNames.push(className);
                }
            }
        }
        if (classNames.length > 0) {
            el.className = classNames.join(' ');
        }
        const result = {};
        if (match.groups['name']) {
            result[match.groups['name']] = el;
        }
        if (children) {
            for (const c of children) {
                if (c instanceof HTMLElement) {
                    el.appendChild(c);
                }
                else if (typeof c === 'string') {
                    el.append(c);
                }
                else if ('root' in c) {
                    Object.assign(result, c);
                    el.appendChild(c.root);
                }
            }
        }
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                continue;
            }
            else if (key === 'style') {
                for (const [cssKey, cssValue] of Object.entries(value)) {
                    el.style.setProperty(camelCaseToHyphenCase(cssKey), typeof cssValue === 'number' ? cssValue + 'px' : '' + cssValue);
                }
            }
            else if (key === 'tabIndex') {
                el.tabIndex = value;
            }
            else {
                el.setAttribute(camelCaseToHyphenCase(key), value.toString());
            }
        }
        result['root'] = el;
        return result;
    }
    function camelCaseToHyphenCase(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }
    function copyAttributes(from, to, filter) {
        for (const { name, value } of from.attributes) {
            if (!filter || filter.includes(name)) {
                to.setAttribute(name, value);
            }
        }
    }
    function copyAttribute(from, to, name) {
        const value = from.getAttribute(name);
        if (value) {
            to.setAttribute(name, value);
        }
        else {
            to.removeAttribute(name);
        }
    }
    function trackAttributes(from, to, filter) {
        copyAttributes(from, to, filter);
        const disposables = new lifecycle_1.DisposableStore();
        disposables.add(exports.sharedMutationObserver.observe(from, disposables, { attributes: true, attributeFilter: filter })(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName) {
                    copyAttribute(from, to, mutation.attributeName);
                }
            }
        }));
        return disposables;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tLmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9iYXNlL2Jyb3dzZXIvZG9tLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Z0dBR2dHOzs7Ozs7SUF5SGhHLDhCQUlDO0lBa0NELHNEQUVDO0lBOENELHNGQUVDO0lBRUQsc0ZBRUM7SUFFRCxrRkFFQztJQXFCRCw4Q0FFQztJQTJCRCw0REFZQztJQTRIRCwwQkFFQztJQUVELHdCQUVDO0lBNENELHdFQUVDO0lBRUQsNENBRUM7SUFFRCxzQ0FrQ0M7SUE0R0QsNENBZ0NDO0lBU0Qsb0JBUUM7SUFFRCw0QkFrQkM7SUFLRCx3REFTQztJQUtELGtEQWFDO0lBS0Qsc0NBR0M7SUFFRCwwQ0FJQztJQUVELGtEQUdDO0lBSUQsNENBSUM7SUFJRCx3Q0FHQztJQWFELG9EQU1DO0lBSUQsZ0NBRUM7SUFRRCwwQ0FFQztJQWNELHNEQWtCQztJQUVELGtEQXNCQztJQUVELGdEQUVDO0lBRUQsb0NBSUM7SUFFRCxzQ0FFQztJQUVELHNDQVNDO0lBT0QsNENBUUM7SUFPRCwwQ0FFQztJQU1ELDhEQUVDO0lBTUQsNENBRUM7SUFPRCw4Q0FPQztJQU9ELDBDQUdDO0lBSUQsZ0RBRUM7SUFLRCw4Q0FFQztJQTJCRCw0Q0E0QkM7SUFFRCx3REFRQztJQTRFRCw4Q0FFQztJQUVELDhDQUVDO0lBNEJELHNDQVdDO0lBRUQsNEVBc0JDO0lBTUQsb0NBR0M7SUFFRCwwQ0FHQztJQUVELHdDQUdDO0lBRUQsa0NBR0M7SUFxRUQsa0NBSUM7SUFrQkQsb0RBT0M7SUFFRCwwREFPQztJQWdGRCxnQ0FFQztJQUVELHNCQUdDO0lBSUQsd0JBS0M7SUFFRCwwQkFHQztJQUtELHNCQUdDO0lBd0RELGNBRUM7SUFNRCxvQkFnQkM7SUFFRCxzQ0FNQztJQUVELG9CQUtDO0lBRUQsb0JBS0M7SUFjRCxvRUFlQztJQUVE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