/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom"], function (require, exports, lifecycle_1, event_1, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElementSizeObserver = void 0;
    class ElementSizeObserver extends lifecycle_1.Disposable {
        constructor(referenceDomElement, dimension) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._referenceDomElement = referenceDomElement;
            this._width = -1;
            this._height = -1;
            this._resizeObserver = null;
            this.measureReferenceDomElement(false, dimension);
        }
        dispose() {
            this.stopObserving();
            super.dispose();
        }
        getWidth() {
            return this._width;
        }
        getHeight() {
            return this._height;
        }
        startObserving() {
            if (!this._resizeObserver && this._referenceDomElement) {
                // We want to react to the resize observer only once per animation frame
                // The first time the resize observer fires, we will react to it immediately.
                // Otherwise we will postpone to the next animation frame.
                // We'll use `observeContentRect` to store the content rect we received.
                let observedDimenstion = null;
                const observeNow = () => {
                    if (observedDimenstion) {
                        this.observe({ width: observedDimenstion.width, height: observedDimenstion.height });
                    }
                    else {
                        this.observe();
                    }
                };
                let shouldObserve = false;
                let alreadyObservedThisAnimationFrame = false;
                const update = () => {
                    if (shouldObserve && !alreadyObservedThisAnimationFrame) {
                        try {
                            shouldObserve = false;
                            alreadyObservedThisAnimationFrame = true;
                            observeNow();
                        }
                        finally {
                            (0, dom_1.scheduleAtNextAnimationFrame)((0, dom_1.getWindow)(this._referenceDomElement), () => {
                                alreadyObservedThisAnimationFrame = false;
                                update();
                            });
                        }
                    }
                };
                this._resizeObserver = new ResizeObserver((entries) => {
                    if (entries && entries[0] && entries[0].contentRect) {
                        observedDimenstion = { width: entries[0].contentRect.width, height: entries[0].contentRect.height };
                    }
                    else {
                        observedDimenstion = null;
                    }
                    shouldObserve = true;
                    update();
                });
                this._resizeObserver.observe(this._referenceDomElement);
            }
        }
        stopObserving() {
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
        }
        observe(dimension) {
            this.measureReferenceDomElement(true, dimension);
        }
        measureReferenceDomElement(emitEvent, dimension) {
            let observedWidth = 0;
            let observedHeight = 0;
            if (dimension) {
                observedWidth = dimension.width;
                observedHeight = dimension.height;
            }
            else if (this._referenceDomElement) {
                observedWidth = this._referenceDomElement.clientWidth;
                observedHeight = this._referenceDomElement.clientHeight;
            }
            observedWidth = Math.max(5, observedWidth);
            observedHeight = Math.max(5, observedHeight);
            if (this._width !== observedWidth || this._height !== observedHeight) {
                this._width = observedWidth;
                this._height = observedHeight;
                if (emitEvent) {
                    this._onDidChange.fire();
                }
            }
        }
    }
    exports.ElementSizeObserver = ElementSizeObserver;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxlbWVudFNpemVPYnNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvZWRpdG9yL2Jyb3dzZXIvY29uZmlnL2VsZW1lbnRTaXplT2JzZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBT2hHLE1BQWEsbUJBQW9CLFNBQVEsc0JBQVU7UUFVbEQsWUFBWSxtQkFBdUMsRUFBRSxTQUFpQztZQUNyRixLQUFLLEVBQUUsQ0FBQztZQVRELGlCQUFZLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLGVBQU8sRUFBUSxDQUFDLENBQUM7WUFDM0MsZ0JBQVcsR0FBZ0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFTbEUsSUFBSSxDQUFDLG9CQUFvQixHQUFHLG1CQUFtQixDQUFDO1lBQ2hELElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztZQUM1QixJQUFJLENBQUMsMEJBQTBCLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFFZSxPQUFPO1lBQ3RCLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUVNLFFBQVE7WUFDZCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDcEIsQ0FBQztRQUVNLFNBQVM7WUFDZixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDckIsQ0FBQztRQUVNLGNBQWM7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3hELHdFQUF3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