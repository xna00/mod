/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/common/arrays", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/linkedList"], function (require, exports, DomUtils, window_1, arrays, decorators_1, event_1, lifecycle_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Gesture = exports.EventType = void 0;
    var EventType;
    (function (EventType) {
        EventType.Tap = '-monaco-gesturetap';
        EventType.Change = '-monaco-gesturechange';
        EventType.Start = '-monaco-gesturestart';
        EventType.End = '-monaco-gesturesend';
        EventType.Contextmenu = '-monaco-gesturecontextmenu';
    })(EventType || (exports.EventType = EventType = {}));
    class Gesture extends lifecycle_1.Disposable {
        static { this.SCROLL_FRICTION = -0.005; }
        static { this.HOLD_DELAY = 700; }
        static { this.CLEAR_TAP_COUNT_TIME = 400; } // ms
        constructor() {
            super();
            this.dispatched = false;
            this.targets = new linkedList_1.LinkedList();
            this.ignoreTargets = new linkedList_1.LinkedList();
            this.activeTouches = {};
            this.handle = null;
            this._lastSetTapCountTime = 0;
            this._register(event_1.Event.runAndSubscribe(DomUtils.onDidRegisterWindow, ({ window, disposables }) => {
                disposables.add(DomUtils.addDisposableListener(window.document, 'touchstart', (e) => this.onTouchStart(e), { passive: false }));
                disposables.add(DomUtils.addDisposableListener(window.document, 'touchend', (e) => this.onTouchEnd(window, e)));
                disposables.add(DomUtils.addDisposableListener(window.document, 'touchmove', (e) => this.onTouchMove(e), { passive: false }));
            }, { window: window_1.mainWindow, disposables: this._store }));
        }
        static addTarget(element) {
            if (!Gesture.isTouchDevice()) {
                return lifecycle_1.Disposable.None;
            }
            if (!Gesture.INSTANCE) {
                Gesture.INSTANCE = (0, lifecycle_1.markAsSingleton)(new Gesture());
            }
            const remove = Gesture.INSTANCE.targets.push(element);
            return (0, lifecycle_1.toDisposable)(remove);
        }
        static ignoreTarget(element) {
            if (!Gesture.isTouchDevice()) {
                return lifecycle_1.Disposable.None;
            }
            if (!Gesture.INSTANCE) {
                Gesture.INSTANCE = (0, lifecycle_1.markAsSingleton)(new Gesture());
            }
            const remove = Gesture.INSTANCE.ignoreTargets.push(element);
            return (0, lifecycle_1.toDisposable)(remove);
        }
        static isTouchDevice() {
            // `'ontouchstart' in window` always evaluates to true with typescript's modern typings. This causes `window` to be
            // `never` later in `window.navigator`. That's why we need the explicit `window as Window` cast
            return 'ontouchstart' in window_1.mainWindow || navigator.maxTouchPoints > 0;
        }
        dispose() {
            if (this.handle) {
                this.handle.dispose();
                this.handle = null;
            }
            super.dispose();
        }
        onTouchStart(e) {
            const timestamp = Date.now(); // use Date.now() because on FF e.timeStamp is not epoch based.
            if (this.handle) {
                this.handle.dispose();
                this.handle = null;
            }
            for (let i = 0, len = e.targetTouches.length; i < len; i++) {
                const touch = e.targetTouches.item(i);
                this.activeTouches[touch.identifier] = {
                    id: touch.identifier,
                    initialTarget: touch.target,
                    initialTimeStamp: timestamp,
                    initialPageX: touch.pageX,
                    initialPageY: touch.pageY,
                    rollingTimestamps: [timestamp],
                    rollingPageX: [touch.pageX],
                    rollingPageY: [touch.pageY]
                };
                const evt = this.newGestureEvent(EventType.Start, touch.target);
                evt.pageX = touch.pageX;
                evt.pageY = touch.pageY;
                this.dispatchEvent(evt);
            }
            if (this.dispatched) {
                e.preventDefault();
                e.stopPropagation();
                this.dispatched = false;
            }
        }
        onTouchEnd(targetWindow, e) {
            const timestamp = Date.now(); // use Date.now() because on FF e.timeStamp is not epoch based.
            const activeTouchCount = Object.keys(this.activeTouches).length;
            for (let i = 0, len = e.changedTouches.length; i < len; i++) {
                const touch = e.changedTouches.item(i);
                if (!this.activeTouches.hasOwnProperty(String(touch.identifier))) {
                    console.warn('move of an UNKNOWN touch', touch);
                    continue;
                }
                const data = this.activeTouches[touch.identifier], holdTime = Date.now() - data.initialTimeStamp;
                if (holdTime < Gesture.HOLD_DELAY
                    && Math.abs(data.initialPageX - arrays.tail(data.rollingPageX)) < 30
                    && Math.abs(data.initialPageY - arrays.tail(data.rollingPageY)) < 30) {
                    const evt = this.newGestureEvent(EventType.Tap, data.initialTarget);
                    evt.pageX = arrays.tail(data.rollingPageX);
                    evt.pageY = arrays.tail(data.rollingPageY);
                    this.dispatchEvent(evt);
                }
                else if (holdTime >= Gesture.HOLD_DELAY
                    && Math.abs(data.initialPageX - arrays.tail(data.rollingPageX)) < 30
                    && Math.abs(data.initialPageY - arrays.tail(data.rollingPageY)) < 30) {
                    const evt = this.newGestureEvent(EventType.Contextmenu, data.initialTarget);
                    evt.pageX = arrays.tail(data.rollingPageX);
                    evt.pageY = arrays.tail(data.rollingPageY);
                    this.dispatchEvent(evt);
                }
                else if (activeTouchCount === 1) {
                    const finalX = arrays.tail(data.rollingPageX);
                    const finalY = arrays.tail(data.rollingPageY);
                    const deltaT = arrays.tail(data.rollingTimestamps) - data.rollingTimestamps[0];
                    const deltaX = finalX - data.rollingPageX[0];
                    const deltaY = finalY - data.rollingPageY[0];
                    // We need to get all the dispatch targets on the start of the inertia event
                    const dispatchTo = [...this.targets].filter(t => data.initialTarget instanceof Node && t.contains(data.initialTarget));
                    this.inertia(targetWindow, dispatchTo, timestamp, // time now
                    Math.abs(deltaX) / deltaT, // speed
                    deltaX > 0 ? 1 : -1, // x direction
                    finalX, // x now
                    Math.abs(deltaY) / deltaT, // y speed
                    deltaY > 0 ? 1 : -1, // y direction
                    finalY // y now
                    );
                }
                this.dispatchEvent(this.newGestureEvent(EventType.End, data.initialTarget));
                // forget about this touch
                delete this.activeTouches[touch.identifier];
            }
            if (this.dispatched) {
                e.preventDefault();
                e.stopPropagation();
                this.dispatched = false;
            }
        }
        newGestureEvent(type, initialTarget) {
            const event = document.createEvent('CustomEvent');
            event.initEvent(type, false, true);
            event.initialTarget = initialTarget;
            event.tapCount = 0;
            return event;
        }
        dispatchEvent(event) {
            if (event.type === EventType.Tap) {
                const currentTime = (new Date()).getTime();
                let setTapCount = 0;
                if (currentTime - this._lastSetTapCountTime > Gesture.CLEAR_TAP_COUNT_TIME) {
                    setTapCount = 1;
                }
                else {
                    setTapCount = 2;
                }
                this._lastSetTapCountTime = currentTime;
                event.tapCount = setTapCount;
            }
            else if (event.type === EventType.Change || event.type === EventType.Contextmenu) {
                // tap is canceled by scrolling or context menu
                this._lastSetTapCountTime = 0;
            }
            if (event.initialTarget instanceof Node) {
                for (const ignoreTarget of this.ignoreTargets) {
                    if (ignoreTarget.contains(event.initialTarget)) {
                        return;
                    }
                }
                const targets = [];
                for (const target of this.targets) {
                    if (target.contains(event.initialTarget)) {
                        let depth = 0;
                        let now = event.initialTarget;
                        while (now && now !== target) {
                            depth++;
                            now = now.parentElement;
                        }
                        targets.push([depth, target]);
                    }
                }
                targets.sort((a, b) => a[0] - b[0]);
                for (const [_, target] of targets) {
                    target.dispatchEvent(event);
                    this.dispatched = true;
                }
            }
        }
        inertia(targetWindow, dispatchTo, t1, vX, dirX, x, vY, dirY, y) {
            this.handle = DomUtils.scheduleAtNextAnimationFrame(targetWindow, () => {
                const now = Date.now();
                // velocity: old speed + accel_over_time
                const deltaT = now - t1;
                let delta_pos_x = 0, delta_pos_y = 0;
                let stopped = true;
                vX += Gesture.SCROLL_FRICTION * deltaT;
                vY += Gesture.SCROLL_FRICTION * deltaT;
                if (vX > 0) {
                    stopped = false;
                    delta_pos_x = dirX * vX * deltaT;
                }
                if (vY > 0) {
                    stopped = false;
                    delta_pos_y = dirY * vY * deltaT;
                }
                // dispatch translation event
                const evt = this.newGestureEvent(EventType.Change);
                evt.translationX = delta_pos_x;
                evt.translationY = delta_pos_y;
                dispatchTo.forEach(d => d.dispatchEvent(evt));
                if (!stopped) {
                    this.inertia(targetWindow, dispatchTo, now, vX, dirX, x + delta_pos_x, vY, dirY, y + delta_pos_y);
                }
            });
        }
        onTouchMove(e) {
            const timestamp = Date.now(); // use Date.now() because on FF e.timeStamp is not epoch based.
            for (let i = 0, len = e.changedTouches.length; i < len; i++) {
                const touch = e.changedTouches.item(i);
                if (!this.activeTouches.hasOwnProperty(String(touch.identifier))) {
                    console.warn('end of an UNKNOWN touch', touch);
                    continue;
                }
                const data = this.activeTouches[touch.identifier];
                const evt = this.newGestureEvent(EventType.Change, data.initialTarget);
                evt.translationX = touch.pageX - arrays.tail(data.rollingPageX);
                evt.translationY = touch.pageY - arrays.tail(data.rollingPageY);
                evt.pageX = touch.pageX;
                evt.pageY = touch.pageY;
                this.dispatchEvent(evt);
                // only keep a few data points, to average the final speed
                if (data.rollingPageX.length > 3) {
                    data.rollingPageX.shift();
                    data.rollingPageY.shift();
                    data.rollingTimestamps.shift();
                }
                data.rollingPageX.push(touch.pageX);
                data.rollingPageY.push(touch.pageY);
                data.rollingTimestamps.push(timestamp);
            }
            if (this.dispatched) {
                e.preventDefault();
                e.stopPropagation();
                this.dispatched = false;
            }
        }
    }
    exports.Gesture = Gesture;
    __decorate([
        decorators_1.memoize
    ], Gesture, "isTouchDevice", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG91Y2guanMiLCJzb3VyY2VSb290IjoiZmlsZTovLy9ob21lL3J1bm5lci93b3JrL21vZC9tb2QvYnVpbGR2c2NvZGUvdnNjb2RlL3NyYy8iLCJzb3VyY2VzIjpbInZzL2Jhc2UvYnJvd3Nlci90b3VjaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFVaEcsSUFBaUIsU0FBUyxDQU16QjtJQU5ELFdBQWlCLFNBQVM7UUFDWixhQUFHLEdBQUcsb0JBQW9CLENBQUM7UUFDM0IsZ0JBQU0sR0FBRyx1QkFBdUIsQ0FBQztRQUNqQyxlQUFLLEdBQUcsc0JBQXNCLENBQUM7UUFDL0IsYUFBRyxHQUFHLHFCQUFxQixDQUFDO1FBQzVCLHFCQUFXLEdBQUcsNEJBQTRCLENBQUM7SUFDekQsQ0FBQyxFQU5nQixTQUFTLHlCQUFULFNBQVMsUUFNekI7SUFrREQsTUFBYSxPQUFRLFNBQVEsc0JBQVU7aUJBRWQsb0JBQWUsR0FBRyxDQUFDLEtBQUssQUFBVCxDQUFVO2lCQUV6QixlQUFVLEdBQUcsR0FBRyxBQUFOLENBQU87aUJBV2pCLHlCQUFvQixHQUFHLEdBQUcsQUFBTixDQUFPLEdBQUMsS0FBSztRQUd6RDtZQUNDLEtBQUssRUFBRSxDQUFDO1lBYkQsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNWLFlBQU8sR0FBRyxJQUFJLHVCQUFVLEVBQWUsQ0FBQztZQUN4QyxrQkFBYSxHQUFHLElBQUksdUJBQVUsRUFBZSxDQUFDO1lBYTlELElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ25CLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxDQUFDLENBQUM7WUFFOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7Z0JBQ25HLFdB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