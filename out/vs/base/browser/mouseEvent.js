/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/iframe", "vs/base/common/platform"], function (require, exports, browser, iframe_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandardWheelEvent = exports.DragMouseEvent = exports.StandardMouseEvent = void 0;
    class StandardMouseEvent {
        constructor(targetWindow, e) {
            this.timestamp = Date.now();
            this.browserEvent = e;
            this.leftButton = e.button === 0;
            this.middleButton = e.button === 1;
            this.rightButton = e.button === 2;
            this.buttons = e.buttons;
            this.target = e.target;
            this.detail = e.detail || 1;
            if (e.type === 'dblclick') {
                this.detail = 2;
            }
            this.ctrlKey = e.ctrlKey;
            this.shiftKey = e.shiftKey;
            this.altKey = e.altKey;
            this.metaKey = e.metaKey;
            if (typeof e.pageX === 'number') {
                this.posx = e.pageX;
                this.posy = e.pageY;
            }
            else {
                // Probably hit by MSGestureEvent
                this.posx = e.clientX + this.target.ownerDocument.body.scrollLeft + this.target.ownerDocument.documentElement.scrollLeft;
                this.posy = e.clientY + this.target.ownerDocument.body.scrollTop + this.target.ownerDocument.documentElement.scrollTop;
            }
            // Find the position of the iframe this code is executing in relative to the iframe where the event was captured.
            const iframeOffsets = iframe_1.IframeUtils.getPositionOfChildWindowRelativeToAncestorWindow(targetWindow, e.view);
            this.posx -= iframeOffsets.left;
            this.posy -= iframeOffsets.top;
        }
        preventDefault() {
            this.browserEvent.preventDefault();
        }
        stopPropagation() {
            this.browserEvent.stopPropagation();
        }
    }
    exports.StandardMouseEvent = StandardMouseEvent;
    class DragMouseEvent extends StandardMouseEvent {
        constructor(targetWindow, e) {
            super(targetWindow, e);
            this.dataTransfer = e.dataTransfer;
        }
    }
    exports.DragMouseEvent = DragMouseEvent;
    class StandardWheelEvent {
        constructor(e, deltaX = 0, deltaY = 0) {
            this.browserEvent = e || null;
            this.target = e ? (e.target || e.targetNode || e.srcElement) : null;
            this.deltaY = deltaY;
            this.deltaX = deltaX;
            let shouldFactorDPR = false;
            if (browser.isChrome) {
                // Chrome version >= 123 contains the fix to factor devicePixelRatio into the wheel event.
                // See https://chromium.googlesource.com/chromium/src.git/+/be51b448441ff0c9d1f17e0f25c4bf1ab3f11f61
                const chromeVersionMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
                const chromeMajorVersion = chromeVersionMatch ? parseInt(chromeVersionMatch[1]) : 123;
                shouldFactorDPR = chromeMajorVersion <= 122;
            }
            if (e) {
                // Old (deprecated) wheel events
                const e1 = e;
                const e2 = e;
                const devicePixelRatio = e.view?.devicePixelRatio || 1;
                // vertical delta scroll
                if (typeof e1.wheelDeltaY !== 'undefined') {
                    if (shouldFactorDPR) {
                        // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
                        this.deltaY = e1.wheelDeltaY / (120 * devicePixelRatio);
                    }
                    else {
                        this.deltaY = e1.wheelDeltaY / 120;
                    }
                }
                else if (typeof e2.VERTICAL_AXIS !== 'undefined' && e2.axis === e2.VERTICAL_AXIS) {
                    this.deltaY = -e2.detail / 3;
                }
                else if (e.type === 'wheel') {
                    // Modern wheel event
                    // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
                    const ev = e;
                    if (ev.deltaMode === ev.DOM_DELTA_LINE) {
                        // the deltas are expressed in lines
                        if (browser.isFirefox && !platform.isMacintosh) {
                            this.deltaY = -e.deltaY / 3;
                        }
                        else {
                            this.deltaY = -e.deltaY;
                        }
                    }
                    else {
                        this.deltaY = -e.deltaY / 40;
                    }
                }
                // horizontal delta scroll
                if (typeof e1.wheelDeltaX !== 'undefined') {
                    if (browser.isSafari && platform.isWindows) {
                        this.deltaX = -(e1.wheelDeltaX / 120);
                    }
                    else if (shouldFactorDPR) {
                        // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
                        this.deltaX = e1.wheelDeltaX / (120 * devicePixelRatio);
                    }
                    else {
                        this.deltaX = e1.wheelDeltaX / 120;
                    }
                }
                else if (typeof e2.HORIZONTAL_AXIS !== 'undefined' && e2.axis === e2.HORIZONTAL_AXIS) {
                    this.deltaX = -e.detail / 3;
                }
                else if (e.type === 'wheel') {
                    // Modern wheel event
                    // https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
                    const ev = e;
                    if (ev.deltaMode === ev.DOM_DELTA_LINE) {
                        // the deltas are expressed in lines
                        if (browser.isFirefox && !platform.isMacintosh) {
                            this.deltaX = -e.deltaX / 3;
                        }
                        else {
                            this.deltaX = -e.deltaX;
                        }
                    }
                    else {
                        this.deltaX = -e.deltaX / 40;
                    }
                }
                // Assume a vertical scroll if nothing else worked
                if (this.deltaY === 0 && this.deltaX === 0 && e.wheelDelta) {
                    if (shouldFactorDPR) {
                        // Refs https://github.com/microsoft/vscode/issues/146403#issuecomment-1854538928
                        this.deltaY = e.wheelDelta / (120 * devicePixelRatio);
                    }
                    else {
                        this.deltaY = e.wheelDelta / 120;
                    }
                }
            }
        }
        preventDefault() {
            this.browserEvent?.preventDefault();
        }
        stopPropagation() {
            this.browserEvent?.stopPropagation();
        }
    }
    exports.StandardWheelEvent = StandardWheelEvent;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW91c2VFdmVudC5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL21vdXNlRXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBMEJoRyxNQUFhLGtCQUFrQjtRQWtCOUIsWUFBWSxZQUFvQixFQUFFLENBQWE7WUFDOUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO1lBRXpCLElBQUksQ0FBQyxNQUFNLEdBQWdCLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFFcEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2pCLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7WUFDekIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUN2QixJQUFJLENBQUMsT0FBTyxHQUFH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