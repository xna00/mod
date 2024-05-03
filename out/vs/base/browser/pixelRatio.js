/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, dom_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PixelRatio = void 0;
    /**
     * See https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#monitoring_screen_resolution_or_zoom_level_changes
     */
    class DevicePixelRatioMonitor extends lifecycle_1.Disposable {
        constructor(targetWindow) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._listener = () => this._handleChange(targetWindow, true);
            this._mediaQueryList = null;
            this._handleChange(targetWindow, false);
        }
        _handleChange(targetWindow, fireEvent) {
            this._mediaQueryList?.removeEventListener('change', this._listener);
            this._mediaQueryList = targetWindow.matchMedia(`(resolution: ${targetWindow.devicePixelRatio}dppx)`);
            this._mediaQueryList.addEventListener('change', this._listener);
            if (fireEvent) {
                this._onDidChange.fire();
            }
        }
    }
    class PixelRatioMonitorImpl extends lifecycle_1.Disposable {
        get value() {
            return this._value;
        }
        constructor(targetWindow) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._value = this._getPixelRatio(targetWindow);
            const dprMonitor = this._register(new DevicePixelRatioMonitor(targetWindow));
            this._register(dprMonitor.onDidChange(() => {
                this._value = this._getPixelRatio(targetWindow);
                this._onDidChange.fire(this._value);
            }));
        }
        _getPixelRatio(targetWindow) {
            const ctx = document.createElement('canvas').getContext('2d');
            const dpr = targetWindow.devicePixelRatio || 1;
            const bsr = ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio || 1;
            return dpr / bsr;
        }
    }
    class PixelRatioMonitorFacade {
        constructor() {
            this.mapWindowIdToPixelRatioMonitor = new Map();
        }
        _getOrCreatePixelRatioMonitor(targetWindow) {
            const targetWindowId = (0, dom_1.getWindowId)(targetWindow);
            let pixelRatioMonitor = this.mapWindowIdToPixelRatioMonitor.get(targetWindowId);
            if (!pixelRatioMonitor) {
                pixelRatioMonitor = (0, lifecycle_1.markAsSingleton)(new PixelRatioMonitorImpl(targetWindow));
                this.mapWindowIdToPixelRatioMonitor.set(targetWindowId, pixelRatioMonitor);
                (0, lifecycle_1.markAsSingleton)(event_1.Event.once(dom_1.onDidUnregisterWindow)(({ vscodeWindowId }) => {
                    if (vscodeWindowId === targetWindowId) {
                        pixelRatioMonitor?.dispose();
                        this.mapWindowIdToPixelRatioMonitor.delete(targetWindowId);
                    }
                }));
            }
            return pixelRatioMonitor;
        }
        getInstance(targetWindow) {
            return this._getOrCreatePixelRatioMonitor(targetWindow);
        }
    }
    /**
     * Returns the pixel ratio.
     *
     * This is useful for rendering <canvas> elements at native screen resolution or for being used as
     * a cache key when storing font measurements. Fonts might render differently depending on resolution
     * and any measurements need to be discarded for example when a window is moved from a monitor to another.
     */
    exports.PixelRatio = new PixelRatioMonitorFacade();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGl4ZWxSYXRpby5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL3BpeGVsUmF0aW8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHOztPQUVHO0lBQ0gsTUFBTSx1QkFBd0IsU0FBUSxzQkFBVTtRQVEvQyxZQUFZLFlBQW9CO1lBQy9CLEtBQUssRUFBRSxDQUFDO1lBUFEsaUJBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksZUFBTyxFQUFRLENBQUMsQ0FBQztZQUMzRCxnQkFBVyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBUTlDLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7WUFDNUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekMsQ0FBQztRQUVPLGFBQWEsQ0FBQyxZQUFvQixFQUFFLFNBQWtCO1lBQzdELElBQUksQ0FBQyxlQUFlLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVwRSxJQUFJLENBQUMsZUFBZSxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLFlBQVksQ0FBQyxnQkFBZ0IsT0FBTyxDQUFDLENBQUM7WUFDckcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBRWhFLElBQUksU0FBUyxFQUFFLENBQUM7Z0JBQ2YsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixD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