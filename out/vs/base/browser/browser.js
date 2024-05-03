/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/window", "vs/base/common/event"], function (require, exports, window_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAndroid = exports.isElectron = exports.isWebkitWebView = exports.isSafari = exports.isChrome = exports.isWebKit = exports.isFirefox = exports.onDidChangeFullscreen = exports.onDidChangeZoomLevel = void 0;
    exports.addMatchMediaChangeListener = addMatchMediaChangeListener;
    exports.setZoomLevel = setZoomLevel;
    exports.getZoomLevel = getZoomLevel;
    exports.getZoomFactor = getZoomFactor;
    exports.setZoomFactor = setZoomFactor;
    exports.setFullscreen = setFullscreen;
    exports.isFullscreen = isFullscreen;
    exports.isStandalone = isStandalone;
    exports.isWCOEnabled = isWCOEnabled;
    class WindowManager {
        constructor() {
            // --- Zoom Level
            this.mapWindowIdToZoomLevel = new Map();
            this._onDidChangeZoomLevel = new event_1.Emitter();
            this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event;
            // --- Zoom Factor
            this.mapWindowIdToZoomFactor = new Map();
            // --- Fullscreen
            this._onDidChangeFullscreen = new event_1.Emitter();
            this.onDidChangeFullscreen = this._onDidChangeFullscreen.event;
            this.mapWindowIdToFullScreen = new Map();
        }
        static { this.INSTANCE = new WindowManager(); }
        getZoomLevel(targetWindow) {
            return this.mapWindowIdToZoomLevel.get(this.getWindowId(targetWindow)) ?? 0;
        }
        setZoomLevel(zoomLevel, targetWindow) {
            if (this.getZoomLevel(targetWindow) === zoomLevel) {
                return;
            }
            const targetWindowId = this.getWindowId(targetWindow);
            this.mapWindowIdToZoomLevel.set(targetWindowId, zoomLevel);
            this._onDidChangeZoomLevel.fire(targetWindowId);
        }
        getZoomFactor(targetWindow) {
            return this.mapWindowIdToZoomFactor.get(this.getWindowId(targetWindow)) ?? 1;
        }
        setZoomFactor(zoomFactor, targetWindow) {
            this.mapWindowIdToZoomFactor.set(this.getWindowId(targetWindow), zoomFactor);
        }
        setFullscreen(fullscreen, targetWindow) {
            if (this.isFullscreen(targetWindow) === fullscreen) {
                return;
            }
            const windowId = this.getWindowId(targetWindow);
            this.mapWindowIdToFullScreen.set(windowId, fullscreen);
            this._onDidChangeFullscreen.fire(windowId);
        }
        isFullscreen(targetWindow) {
            return !!this.mapWindowIdToFullScreen.get(this.getWindowId(targetWindow));
        }
        getWindowId(targetWindow) {
            return targetWindow.vscodeWindowId;
        }
    }
    function addMatchMediaChangeListener(targetWindow, query, callback) {
        if (typeof query === 'string') {
            query = targetWindow.matchMedia(query);
        }
        query.addEventListener('change', callback);
    }
    /** A zoom index, e.g. 1, 2, 3 */
    function setZoomLevel(zoomLevel, targetWindow) {
        WindowManager.INSTANCE.setZoomLevel(zoomLevel, targetWindow);
    }
    function getZoomLevel(targetWindow) {
        return WindowManager.INSTANCE.getZoomLevel(targetWindow);
    }
    exports.onDidChangeZoomLevel = WindowManager.INSTANCE.onDidChangeZoomLevel;
    /** The zoom scale for an index, e.g. 1, 1.2, 1.4 */
    function getZoomFactor(targetWindow) {
        return WindowManager.INSTANCE.getZoomFactor(targetWindow);
    }
    function setZoomFactor(zoomFactor, targetWindow) {
        WindowManager.INSTANCE.setZoomFactor(zoomFactor, targetWindow);
    }
    function setFullscreen(fullscreen, targetWindow) {
        WindowManager.INSTANCE.setFullscreen(fullscreen, targetWindow);
    }
    function isFullscreen(targetWindow) {
        return WindowManager.INSTANCE.isFullscreen(targetWindow);
    }
    exports.onDidChangeFullscreen = WindowManager.INSTANCE.onDidChangeFullscreen;
    const userAgent = navigator.userAgent;
    exports.isFirefox = (userAgent.indexOf('Firefox') >= 0);
    exports.isWebKit = (userAgent.indexOf('AppleWebKit') >= 0);
    exports.isChrome = (userAgent.indexOf('Chrome') >= 0);
    exports.isSafari = (!exports.isChrome && (userAgent.indexOf('Safari') >= 0));
    exports.isWebkitWebView = (!exports.isChrome && !exports.isSafari && exports.isWebKit);
    exports.isElectron = (userAgent.indexOf('Electron/') >= 0);
    exports.isAndroid = (userAgent.indexOf('Android') >= 0);
    let standalone = false;
    if (typeof window_1.mainWindow.matchMedia === 'function') {
        const standaloneMatchMedia = window_1.mainWindow.matchMedia('(display-mode: standalone) or (display-mode: window-controls-overlay)');
        const fullScreenMatchMedia = window_1.mainWindow.matchMedia('(display-mode: fullscreen)');
        standalone = standaloneMatchMedia.matches;
        addMatchMediaChangeListener(window_1.mainWindow, standaloneMatchMedia, ({ matches }) => {
            // entering fullscreen would change standaloneMatchMedia.matches to false
            // if standalone is true (running as PWA) and entering fullscreen, skip this change
            if (standalone && fullScreenMatchMedia.matches) {
                return;
            }
            // otherwise update standalone (browser to PWA or PWA to browser)
            standalone = matches;
        });
    }
    function isStandalone() {
        return standalone;
    }
    // Visible means that the feature is enabled, not necessarily being rendered
    // e.g. visible is true even in fullscreen mode where the controls are hidden
    // See docs at https://developer.mozilla.org/en-US/docs/Web/API/WindowControlsOverlay/visible
    function isWCOEnabled() {
        return navigator?.windowControlsOverlay?.visible;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnJvd3Nlci5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2Jyb3dzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBaUVoRyxrRUFLQztJQUdELG9DQUVDO0lBQ0Qsb0NBRUM7SUFJRCxzQ0FFQztJQUNELHNDQUVDO0lBRUQsc0NBRUM7SUFDRCxvQ0FFQztJQTRCRCxvQ0FFQztJQUtELG9DQUVDO0lBOUhELE1BQU0sYUFBYTtRQUFuQjtZQUlDLGlCQUFpQjtZQUVBLDJCQUFzQixHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBRW5ELDBCQUFxQixHQUFHLElBQUksZUFBTyxFQUFVLENBQUM7WUFDdEQseUJBQW9CLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQztZQWVqRSxrQkFBa0I7WUFFRCw0QkFBdUIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQVNyRSxpQkFBaUI7WUFFQSwyQkFBc0IsR0FBRyxJQUFJLGVBQU8sRUFBVSxDQUFDO1lBQ3ZELDBCQUFxQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUM7WUFFbEQsNEJBQXVCLEdBQUcsSUFBSSxHQUFHLEVBQW1CLENBQUM7UUFrQnZFLENBQUM7aUJBeERnQixhQUFRLEdBQUcsSUFBSSxhQUFhLEVBQUUsQUFBdEIsQ0FBdUI7UUFTL0MsWUFBWSxDQUFDLFlBQW9CO1lBQ2hDLE9BQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdFLENBQUM7UUFDRCxZQUFZLENBQUMsU0FBaUIsRUFBRSxZQUFvQjtZQUNuRCxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEtBQUss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