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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/touch", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/css!./sash"], function (require, exports, dom_1, event_1, touch_1, async_1, decorators_1, event_2, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sash = exports.SashState = exports.Orientation = exports.OrthogonalEdge = void 0;
    exports.setGlobalSashSize = setGlobalSashSize;
    exports.setGlobalHoverDelay = setGlobalHoverDelay;
    /**
     * Allow the sashes to be visible at runtime.
     * @remark Use for development purposes only.
     */
    const DEBUG = false;
    var OrthogonalEdge;
    (function (OrthogonalEdge) {
        OrthogonalEdge["North"] = "north";
        OrthogonalEdge["South"] = "south";
        OrthogonalEdge["East"] = "east";
        OrthogonalEdge["West"] = "west";
    })(OrthogonalEdge || (exports.OrthogonalEdge = OrthogonalEdge = {}));
    var Orientation;
    (function (Orientation) {
        Orientation[Orientation["VERTICAL"] = 0] = "VERTICAL";
        Orientation[Orientation["HORIZONTAL"] = 1] = "HORIZONTAL";
    })(Orientation || (exports.Orientation = Orientation = {}));
    var SashState;
    (function (SashState) {
        /**
         * Disable any UI interaction.
         */
        SashState[SashState["Disabled"] = 0] = "Disabled";
        /**
         * Allow dragging down or to the right, depending on the sash orientation.
         *
         * Some OSs allow customizing the mouse cursor differently whenever
         * some resizable component can't be any smaller, but can be larger.
         */
        SashState[SashState["AtMinimum"] = 1] = "AtMinimum";
        /**
         * Allow dragging up or to the left, depending on the sash orientation.
         *
         * Some OSs allow customizing the mouse cursor differently whenever
         * some resizable component can't be any larger, but can be smaller.
         */
        SashState[SashState["AtMaximum"] = 2] = "AtMaximum";
        /**
         * Enable dragging.
         */
        SashState[SashState["Enabled"] = 3] = "Enabled";
    })(SashState || (exports.SashState = SashState = {}));
    let globalSize = 4;
    const onDidChangeGlobalSize = new event_2.Emitter();
    function setGlobalSashSize(size) {
        globalSize = size;
        onDidChangeGlobalSize.fire(size);
    }
    let globalHoverDelay = 300;
    const onDidChangeHoverDelay = new event_2.Emitter();
    function setGlobalHoverDelay(size) {
        globalHoverDelay = size;
        onDidChangeHoverDelay.fire(size);
    }
    class MouseEventFactory {
        constructor(el) {
            this.el = el;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        get onPointerMove() {
            return this.disposables.add(new event_1.DomEmitter((0, dom_1.getWindow)(this.el), 'mousemove')).event;
        }
        get onPointerUp() {
            return this.disposables.add(new event_1.DomEmitter((0, dom_1.getWindow)(this.el), 'mouseup')).event;
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], MouseEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], MouseEventFactory.prototype, "onPointerUp", null);
    class GestureEventFactory {
        get onPointerMove() {
            return this.disposables.add(new event_1.DomEmitter(this.el, touch_1.EventType.Change)).event;
        }
        get onPointerUp() {
            return this.disposables.add(new event_1.DomEmitter(this.el, touch_1.EventType.End)).event;
        }
        constructor(el) {
            this.el = el;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        dispose() {
            this.disposables.dispose();
        }
    }
    __decorate([
        decorators_1.memoize
    ], GestureEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], GestureEventFactory.prototype, "onPointerUp", null);
    class OrthogonalPointerEventFactory {
        get onPointerMove() {
            return this.factory.onPointerMove;
        }
        get onPointerUp() {
            return this.factory.onPointerUp;
        }
        constructor(factory) {
            this.factory = factory;
        }
        dispose() {
            // noop
        }
    }
    __decorate([
        decorators_1.memoize
    ], OrthogonalPointerEventFactory.prototype, "onPointerMove", null);
    __decorate([
        decorators_1.memoize
    ], OrthogonalPointerEventFactory.prototype, "onPointerUp", null);
    const PointerEventsDisabledCssClass = 'pointer-events-disabled';
    /**
     * The {@link Sash} is the UI component which allows the user to resize other
     * components. It's usually an invisible horizontal or vertical line which, when
     * hovered, becomes highlighted and can be dragged along the perpendicular dimension
     * to its direction.
     *
     * Features:
     * - Touch event handling
     * - Corner sash support
     * - Hover with different mouse cursor support
     * - Configurable hover size
     * - Linked sash support, for 2x2 corner sashes
     */
    class Sash extends lifecycle_1.Disposable {
        get state() { return this._state; }
        get orthogonalStartSash() { return this._orthogonalStartSash; }
        get orthogonalEndSash() { return this._orthogonalEndSash; }
        /**
         * The state of a sash defines whether it can be interacted with by the user
         * as well as what mouse cursor to use, when hovered.
         */
        set state(state) {
            if (this._state === state) {
                return;
            }
            this.el.classList.toggle('disabled', state === 0 /* SashState.Disabled */);
            this.el.classList.toggle('minimum', state === 1 /* SashState.AtMinimum */);
            this.el.classList.toggle('maximum', state === 2 /* SashState.AtMaximum */);
            this._state = state;
            this.onDidEnablementChange.fire(state);
        }
        /**
         * A reference to another sash, perpendicular to this one, which
         * aligns at the start of this one. A corner sash will be created
         * automatically at that location.
         *
         * The start of a horizontal sash is its left-most position.
         * The start of a vertical sash is its top-most position.
         */
        set orthogonalStartSash(sash) {
            if (this._orthogonalStartSash === sash) {
                return;
            }
            this.orthogonalStartDragHandleDisposables.clear();
            this.orthogonalStartSashDisposables.clear();
            if (sash) {
                const onChange = (state) => {
                    this.orthogonalStartDragHandleDisposables.clear();
                    if (state !== 0 /* SashState.Disabled */) {
                        this._orthogonalStartDragHandle = (0, dom_1.append)(this.el, (0, dom_1.$)('.orthogonal-drag-handle.start'));
                        this.orthogonalStartDragHandleDisposables.add((0, lifecycle_1.toDisposable)(() => this._orthogonalStartDragHandle.remove()));
                        this.orthogonalStartDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalStartDragHandle, 'mouseenter')).event(() => Sash.onMouseEnter(sash), undefined, this.orthogonalStartDragHandleDisposables);
                        this.orthogonalStartDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalStartDragHandle, 'mouseleave')).event(() => Sash.onMouseLeave(sash), undefined, this.orthogonalStartDragHandleDisposables);
                    }
                };
                this.orthogonalStartSashDisposables.add(sash.onDidEnablementChange.event(onChange, this));
                onChange(sash.state);
            }
            this._orthogonalStartSash = sash;
        }
        /**
         * A reference to another sash, perpendicular to this one, which
         * aligns at the end of this one. A corner sash will be created
         * automatically at that location.
         *
         * The end of a horizontal sash is its right-most position.
         * The end of a vertical sash is its bottom-most position.
         */
        set orthogonalEndSash(sash) {
            if (this._orthogonalEndSash === sash) {
                return;
            }
            this.orthogonalEndDragHandleDisposables.clear();
            this.orthogonalEndSashDisposables.clear();
            if (sash) {
                const onChange = (state) => {
                    this.orthogonalEndDragHandleDisposables.clear();
                    if (state !== 0 /* SashState.Disabled */) {
                        this._orthogonalEndDragHandle = (0, dom_1.append)(this.el, (0, dom_1.$)('.orthogonal-drag-handle.end'));
                        this.orthogonalEndDragHandleDisposables.add((0, lifecycle_1.toDisposable)(() => this._orthogonalEndDragHandle.remove()));
                        this.orthogonalEndDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalEndDragHandle, 'mouseenter')).event(() => Sash.onMouseEnter(sash), undefined, this.orthogonalEndDragHandleDisposables);
                        this.orthogonalEndDragHandleDisposables.add(new event_1.DomEmitter(this._orthogonalEndDragHandle, 'mouseleave')).event(() => Sash.onMouseLeave(sash), undefined, this.orthogonalEndDragHandleDisposables);
                    }
                };
                this.orthogonalEndSashDisposables.add(sash.onDidEnablementChange.event(onChange, this));
                onChange(sash.state);
            }
            this._orthogonalEndSash = sash;
        }
        constructor(container, layoutProvider, options) {
            super();
            this.hoverDelay = globalHoverDelay;
            this.hoverDelayer = this._register(new async_1.Delayer(this.hoverDelay));
            this._state = 3 /* SashState.Enabled */;
            this.onDidEnablementChange = this._register(new event_2.Emitter());
            this._onDidStart = this._register(new event_2.Emitter());
            this._onDidChange = this._register(new event_2.Emitter());
            this._onDidReset = this._register(new event_2.Emitter());
            this._onDidEnd = this._register(new event_2.Emitter());
            this.orthogonalStartSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalStartDragHandleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndSashDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orthogonalEndDragHandleDisposables = this._register(new lifecycle_1.DisposableStore());
            /**
             * An event which fires whenever the user starts dragging this sash.
             */
            this.onDidStart = this._onDidStart.event;
            /**
             * An event which fires whenever the user moves the mouse while
             * dragging this sash.
             */
            this.onDidChange = this._onDidChange.event;
            /**
             * An event which fires whenever the user double clicks this sash.
             */
            this.onDidReset = this._onDidReset.event;
            /**
             * An event which fires whenever the user stops dragging this sash.
             */
            this.onDidEnd = this._onDidEnd.event;
            /**
             * A linked sash will be forwarded the same user interactions and events
             * so it moves exactly the same way as this sash.
             *
             * Useful in 2x2 grids. Not meant for widespread usage.
             */
            this.linkedSash = undefined;
            this.el = (0, dom_1.append)(container, (0, dom_1.$)('.monaco-sash'));
            if (options.orthogonalEdge) {
                this.el.classList.add(`orthogonal-edge-${options.orthogonalEdge}`);
            }
            if (platform_1.isMacintosh) {
                this.el.classList.add('mac');
            }
            const onMouseDown = this._register(new event_1.DomEmitter(this.el, 'mousedown')).event;
            this._register(onMouseDown(e => this.onPointerStart(e, new MouseEventFactory(container)), this));
            const onMouseDoubleClick = this._register(new event_1.DomEmitter(this.el, 'dblclick')).event;
            this._register(onMouseDoubleClick(this.onPointerDoublePress, this));
            const onMouseEnter = this._register(new event_1.DomEmitter(this.el, 'mouseenter')).event;
            this._register(onMouseEnter(() => Sash.onMouseEnter(this)));
            const onMouseLeave = this._register(new event_1.DomEmitter(this.el, 'mouseleave')).event;
            this._register(onMouseLeave(() => Sash.onMouseLeave(this)));
            this._register(touch_1.Gesture.addTarget(this.el));
            const onTouchStart = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Start)).event;
            this._register(onTouchStart(e => this.onPointerStart(e, new GestureEventFactory(this.el)), this));
            const onTap = this._register(new event_1.DomEmitter(this.el, touch_1.EventType.Tap)).event;
            let doubleTapTimeout = undefined;
            this._register(onTap(event => {
                if (doubleTapTimeout) {
                    clearTimeout(doubleTapTimeout);
                    doubleTapTimeout = undefined;
                    this.onPointerDoublePress(event);
                    return;
                }
                clearTimeout(doubleTapTimeout);
                doubleTapTimeout = setTimeout(() => doubleTapTimeout = undefined, 250);
            }, this));
            if (typeof options.size === 'number') {
                this.size = options.size;
                if (options.orientation === 0 /* Orientation.VERTICAL */) {
                    this.el.style.width = `${this.size}px`;
                }
                else {
                    this.el.style.height = `${this.size}px`;
                }
            }
            else {
                this.size = globalSize;
                this._register(onDidChangeGlobalSize.event(size => {
                    this.size = size;
                    this.layout();
                }));
            }
            this._register(onDidChangeHoverDelay.event(delay => this.hoverDelay = delay));
            this.layoutProvider = layoutProvider;
            this.orthogonalStartSash = options.orthogonalStartSash;
            this.orthogonalEndSash = options.orthogonalEndSash;
            this.orientation = options.orientation || 0 /* Orientation.VERTICAL */;
            if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                this.el.classList.add('horizontal');
                this.el.classList.remove('vertical');
            }
            else {
                this.el.classList.remove('horizontal');
                this.el.classList.add('vertical');
            }
            this.el.classList.toggle('debug', DEBUG);
            this.layout();
        }
        onPointerStart(event, pointerEventFactory) {
            dom_1.EventHelper.stop(event);
            let isMultisashResize = false;
            if (!event.__orthogonalSashEvent) {
                const orthogonalSash = this.getOrthogonalSash(event);
                if (orthogonalSash) {
                    isMultisashResize = true;
                    event.__orthogonalSashEvent = true;
                    orthogonalSash.onPointerStart(event, new OrthogonalPointerEventFactory(pointerEventFactory));
                }
            }
            if (this.linkedSash && !event.__linkedSashEvent) {
                event.__linkedSashEvent = true;
                this.linkedSash.onPointerStart(event, new OrthogonalPointerEventFactory(pointerEventFactory));
            }
            if (!this.state) {
                return;
            }
            const iframes = this.el.ownerDocument.getElementsByTagName('iframe');
            for (const iframe of iframes) {
                iframe.classList.add(PointerEventsDisabledCssClass); // disable mouse events on iframes as long as we drag the sash
            }
            const startX = event.pageX;
            const startY = event.pageY;
            const altKey = event.altKey;
            const startEvent = { startX, currentX: startX, startY, currentY: startY, altKey };
            this.el.classList.add('active');
            this._onDidStart.fire(startEvent);
            // fix https://github.com/microsoft/vscode/issues/21675
            const style = (0, dom_1.createStyleSheet)(this.el);
            const updateStyle = () => {
                let cursor = '';
                if (isMultisashResize) {
                    cursor = 'all-scroll';
                }
                else if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                    if (this.state === 1 /* SashState.AtMinimum */) {
                        cursor = 's-resize';
                    }
                    else if (this.state === 2 /* SashState.AtMaximum */) {
                        cursor = 'n-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'row-resize' : 'ns-resize';
                    }
                }
                else {
                    if (this.state === 1 /* SashState.AtMinimum */) {
                        cursor = 'e-resize';
                    }
                    else if (this.state === 2 /* SashState.AtMaximum */) {
                        cursor = 'w-resize';
                    }
                    else {
                        cursor = platform_1.isMacintosh ? 'col-resize' : 'ew-resize';
                    }
                }
                style.textContent = `* { cursor: ${cursor} !important; }`;
            };
            const disposables = new lifecycle_1.DisposableStore();
            updateStyle();
            if (!isMultisashResize) {
                this.onDidEnablementChange.event(updateStyle, null, disposables);
            }
            const onPointerMove = (e) => {
                dom_1.EventHelper.stop(e, false);
                const event = { startX, currentX: e.pageX, startY, currentY: e.pageY, altKey };
                this._onDidChange.fire(event);
            };
            const onPointerUp = (e) => {
                dom_1.EventHelper.stop(e, false);
                this.el.removeChild(style);
                this.el.classList.remove('active');
                this._onDidEnd.fire();
                disposables.dispose();
                for (const iframe of iframes) {
                    iframe.classList.remove(PointerEventsDisabledCssClass);
                }
            };
            pointerEventFactory.onPointerMove(onPointerMove, null, disposables);
            pointerEventFactory.onPointerUp(onPointerUp, null, disposables);
            disposables.add(pointerEventFactory);
        }
        onPointerDoublePress(e) {
            const orthogonalSash = this.getOrthogonalSash(e);
            if (orthogonalSash) {
                orthogonalSash._onDidReset.fire();
            }
            if (this.linkedSash) {
                this.linkedSash._onDidReset.fire();
            }
            this._onDidReset.fire();
        }
        static onMouseEnter(sash, fromLinkedSash = false) {
            if (sash.el.classList.contains('active')) {
                sash.hoverDelayer.cancel();
                sash.el.classList.add('hover');
            }
            else {
                sash.hoverDelayer.trigger(() => sash.el.classList.add('hover'), sash.hoverDelay).then(undefined, () => { });
            }
            if (!fromLinkedSash && sash.linkedSash) {
                Sash.onMouseEnter(sash.linkedSash, true);
            }
        }
        static onMouseLeave(sash, fromLinkedSash = false) {
            sash.hoverDelayer.cancel();
            sash.el.classList.remove('hover');
            if (!fromLinkedSash && sash.linkedSash) {
                Sash.onMouseLeave(sash.linkedSash, true);
            }
        }
        /**
         * Forcefully stop any user interactions with this sash.
         * Useful when hiding a parent component, while the user is still
         * interacting with the sash.
         */
        clearSashHoverState() {
            Sash.onMouseLeave(this);
        }
        /**
         * Layout the sash. The sash will size and position itself
         * based on its provided {@link ISashLayoutProvider layout provider}.
         */
        layout() {
            if (this.orientation === 0 /* Orientation.VERTICAL */) {
                const verticalProvider = this.layoutProvider;
                this.el.style.left = verticalProvider.getVerticalSashLeft(this) - (this.size / 2) + 'px';
                if (verticalProvider.getVerticalSashTop) {
                    this.el.style.top = verticalProvider.getVerticalSashTop(this) + 'px';
                }
                if (verticalProvider.getVerticalSashHeight) {
                    this.el.style.height = verticalProvider.getVerticalSashHeight(this) + 'px';
                }
            }
            else {
                const horizontalProvider = this.layoutProvider;
                this.el.style.top = horizontalProvider.getHorizontalSashTop(this) - (this.size / 2) + 'px';
                if (horizontalProvider.getHorizontalSashLeft) {
                    this.el.style.left = horizontalProvider.getHorizontalSashLeft(this) + 'px';
                }
                if (horizontalProvider.getHorizontalSashWidth) {
                    this.el.style.width = horizontalProvider.getHorizontalSashWidth(this) + 'px';
                }
            }
        }
        getOrthogonalSash(e) {
            const target = e.initialTarget ?? e.target;
            if (!target || !(target instanceof HTMLElement)) {
                return undefined;
            }
            if (target.classList.contains('orthogonal-drag-handle')) {
                return target.classList.contains('start') ? this.orthogonalStartSash : this.orthogonalEndSash;
            }
            return undefined;
        }
        dispose() {
            super.dispose();
            this.el.remove();
        }
    }
    exports.Sash = Sash;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2FzaC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3VpL3Nhc2gvc2FzaC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O2dHQUdnRzs7Ozs7Ozs7Ozs7SUFnSmhHLDhDQUdDO0lBSUQsa0RBR0M7SUE5SUQ7OztPQUdHO0lBQ0gsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBK0JwQixJQUFZLGNBS1g7SUFMRCxXQUFZLGNBQWM7UUFDekIsaUNBQWUsQ0FBQTtRQUNmLGlDQUFlLENBQUE7UUFDZiwrQkFBYSxDQUFBO1FBQ2IsK0JBQWEsQ0FBQTtJQUNkLENBQUMsRUFMVyxjQUFjLDhCQUFkLGNBQWMsUUFLekI7SUF3REQsSUFBa0IsV0FHakI7SUFIRCxXQUFrQixXQUFXO1FBQzVCLHFEQUFRLENBQUE7UUFDUix5REFBVSxDQUFBO0lBQ1gsQ0FBQyxFQUhpQixXQUFXLDJCQUFYLFdBQVcsUUFHNUI7SUFFRCxJQUFrQixTQTJCakI7SUEzQkQsV0FBa0IsU0FBUztRQUUxQjs7V0FFRztRQUNILGlEQUFRLENBQUE7UUFFUjs7Ozs7V0FLRztRQUNILG1EQUFTLENBQUE7UUFFVDs7Ozs7V0FLRztRQUNILG1EQUFTLENBQUE7UUFFVDs7V0FFRztRQUNILCtDQUFPLENBQUE7SUFDUixDQUFDLEVBM0JpQixTQUFTLHlCQUFULFNBQVMsUUEyQjFCO0lBRUQsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxlQUFPLEVBQVUsQ0FBQztJQUNwRCxTQUFnQixpQkFBaUIsQ0FBQyxJQUFZO1FBQzdDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDbEIscUJBQXFCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxJQUFJLGdCQUFnQixHQUFHLEdBQUcs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