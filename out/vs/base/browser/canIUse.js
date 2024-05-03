/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/window", "vs/base/common/platform"], function (require, exports, browser, window_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserFeatures = exports.KeyboardSupport = void 0;
    var KeyboardSupport;
    (function (KeyboardSupport) {
        KeyboardSupport[KeyboardSupport["Always"] = 0] = "Always";
        KeyboardSupport[KeyboardSupport["FullScreen"] = 1] = "FullScreen";
        KeyboardSupport[KeyboardSupport["None"] = 2] = "None";
    })(KeyboardSupport || (exports.KeyboardSupport = KeyboardSupport = {}));
    /**
     * Browser feature we can support in current platform, browser and environment.
     */
    exports.BrowserFeatures = {
        clipboard: {
            writeText: (platform.isNative
                || (document.queryCommandSupported && document.queryCommandSupported('copy'))
                || !!(navigator && navigator.clipboard && navigator.clipboard.writeText)),
            readText: (platform.isNative
                || !!(navigator && navigator.clipboard && navigator.clipboard.readText))
        },
        keyboard: (() => {
            if (platform.isNative || browser.isStandalone()) {
                return 0 /* KeyboardSupport.Always */;
            }
            if (navigator.keyboard || browser.isSafari) {
                return 1 /* KeyboardSupport.FullScreen */;
            }
            return 2 /* KeyboardSupport.None */;
        })(),
        // 'ontouchstart' in window always evaluates to true with typescript's modern typings. This causes `window` to be
        // `never` later in `window.navigator`. That's why we need the explicit `window as Window` cast
        touch: 'ontouchstart' in window_1.mainWindow || navigator.maxTouchPoints > 0,
        pointerEvents: window_1.mainWindow.PointerEvent && ('ontouchstart' in window_1.mainWindow || navigator.maxTouchPoints > 0)
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuSVVzZS5qcyIsInNvdXJjZVJvb3QiOiJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvbW9kL21vZC9idWlsZHZzY29kZS92c2NvZGUvc3JjLyIsInNvdXJjZXMiOlsidnMvYmFzZS9icm93c2VyL2NhbklVc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBTWhHLElBQWtCLGVBSWpCO0lBSkQsV0FBa0IsZUFBZTtRQUNoQyx5REFBTSxDQUFBO1FBQ04saUVBQVUsQ0FBQTtRQUNWLHFEQUFJLENBQUE7SUFDTCxDQUFDLEVBSmlCLGVBQWUsK0JBQWYsZUFBZSxRQUloQztJQUVEOztPQUVHO0lBQ1UsUUFBQSxlQUFlLEdBQUc7UUFDOUIsU0FBUyxFQUFFO1lBQ1YsU0FBUyxFQUFFLENBQ1YsUUFBUSxDQUFDLFFBQVE7bUJBQ2QsQ0FBQyxRQUFRLENBQUMscUJBQXFCLElBQUksUUFBUSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO21CQUMxRSxDQUFDLENBQUMsQ0FBQyxTQUFTLElBQUksU0FBUyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUN4RTtZQUNELFFBQVEsRUFBRSxDQUNULFFBQVEsQ0FBQyxRQUFRO21CQUNkLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQ3ZFO1NBQ0Q7UUFDRCxRQUFRLEVBQUUsQ0FBQyxHQUFHLEVBQUU7WUFDZixJQUFJLFFBQVEsQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUM7Z0JBQ2pELHNDQUE4QjtZQUMvQixDQUFDO1lBRUQsSUFBVSxTQUFVLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDbkQsMENBQWtDO1lBQ25DLENBQUM7WUFFRCxvQ0FBNEI7UUFDN0IsQ0FBQyxDQUFDLEVBQUU7UUFFSixpSEFBaUg7UUFDakgsK0ZBQStGO1FBQy9GLEtBQUssRUFBRSxjQUFjLElBQUksbUJBQVUsSUFBSSxTQUFTLENBQUMsY0FBYyxHQUFHLENBQUM7UUFDbkUsYUFBYSxFQUFFLG1CQUFVLENBQUMsWUFBWSxJQUFJLENBQUMsY0FBYyxJQUFJLG1CQUFVLElBQUksU0FBUyxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7S0FDeEcsQ0FBQyJ9