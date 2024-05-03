/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/window", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/window/common/window"], function (require, exports, browser_1, dom_1, window_1, globals_1, window_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MIN_ZOOM_LEVEL = exports.MAX_ZOOM_LEVEL = exports.ApplyZoomTarget = void 0;
    exports.applyZoom = applyZoom;
    exports.zoomIn = zoomIn;
    exports.zoomOut = zoomOut;
    var ApplyZoomTarget;
    (function (ApplyZoomTarget) {
        ApplyZoomTarget[ApplyZoomTarget["ACTIVE_WINDOW"] = 1] = "ACTIVE_WINDOW";
        ApplyZoomTarget[ApplyZoomTarget["ALL_WINDOWS"] = 2] = "ALL_WINDOWS";
    })(ApplyZoomTarget || (exports.ApplyZoomTarget = ApplyZoomTarget = {}));
    exports.MAX_ZOOM_LEVEL = 8;
    exports.MIN_ZOOM_LEVEL = -8;
    /**
     * Apply a zoom level to the window. Also sets it in our in-memory
     * browser helper so that it can be accessed in non-electron layers.
     */
    function applyZoom(zoomLevel, target) {
        zoomLevel = Math.min(Math.max(zoomLevel, exports.MIN_ZOOM_LEVEL), exports.MAX_ZOOM_LEVEL); // cap zoom levels between -8 and 8
        const targetWindows = [];
        if (target === ApplyZoomTarget.ACTIVE_WINDOW) {
            targetWindows.push((0, dom_1.getActiveWindow)());
        }
        else if (target === ApplyZoomTarget.ALL_WINDOWS) {
            targetWindows.push(...Array.from((0, dom_1.getWindows)()).map(({ window }) => window));
        }
        else {
            targetWindows.push(target);
        }
        for (const targetWindow of targetWindows) {
            getGlobals(targetWindow)?.webFrame?.setZoomLevel(zoomLevel);
            (0, browser_1.setZoomFactor)((0, window_2.zoomLevelToZoomFactor)(zoomLevel), targetWindow);
            (0, browser_1.setZoomLevel)(zoomLevel, targetWindow);
        }
    }
    function getGlobals(win) {
        if (win === window_1.mainWindow) {
            // main window
            return { ipcRenderer: globals_1.ipcRenderer, webFrame: globals_1.webFrame };
        }
        else {
            // auxiliary window
            const auxiliaryWindow = win;
            if (auxiliaryWindow?.vscode?.ipcRenderer && auxiliaryWindow?.vscode?.webFrame) {
                return auxiliaryWindow.vscode;
            }
        }
        return undefined;
    }
    function zoomIn(target) {
        applyZoom((0, browser_1.getZoomLevel)(typeof target === 'number' ? (0, dom_1.getActiveWindow)() : target) + 1, target);
    }
    function zoomOut(target) {
        applyZoom((0, browser_1.getZoomLevel)(typeof target === 'number' ? (0, dom_1.getActiveWindow)() : target) - 1, target);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93aW5kb3cvZWxlY3Ryb24tc2FuZGJveC93aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBb0JoRyw4QkFpQkM7SUFpQkQsd0JBRUM7SUFFRCwwQkFFQztJQXBERCxJQUFZLGVBR1g7SUFIRCxXQUFZLGVBQWU7UUFDMUIsdUVBQWlCLENBQUE7UUFDakIsbUVBQVcsQ0FBQTtJQUNaLENBQUMsRUFIVyxlQUFlLCtCQUFmLGVBQWUsUUFHMUI7SUFFWSxRQUFBLGNBQWMsR0FBRyxDQUFDLENBQUM7SUFDbkIsUUFBQSxjQUFjLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFakM7OztPQUdHO0lBQ0gsU0FBZ0IsU0FBUyxDQUFDLFNBQWlCLEVBQUUsTUFBZ0M7UUFDNUUsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsc0JBQWMsQ0FBQyxFQUFFLHNCQUFjLENBQUMsQ0FBQyxDQUFDLG1DQUFtQztRQUU5RyxNQUFNLGFBQWEsR0FBYSxFQUFFLENBQUM7UUFDbkMsSUFBSSxNQUFNLEtBQUssZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzlDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBQSxxQkFBZSxHQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO2FBQU0sSUFBSSxNQUFNLEtBQUssZUFBZSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25ELGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUEsZ0JBQVUsR0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDO2FBQU0sQ0FBQztZQUNQLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELEtBQUssTUFBTSxZQUFZLElBQUksYUFBYSxFQUFFLENBQUM7WUFDMUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsSUFBQSx1QkFBYSxFQUFDLElBQUEsOEJBQXFCLEVBQUMsU0FBUyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDOUQsSUFBQSxzQkFBWSxFQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN2QyxDQUFDO0lBQ0YsQ0FBQztJQUVELFNBQVMsVUFBVSxDQUFDLEdBQVc7UUFDOUIsSUFBSSxHQUFHLEtBQUssbUJBQVUsRUFBRSxDQUFDO1lBQ3hCLGNBQWM7WUFDZCxPQUFPLEVBQUUsV0FBVyxFQUFYLHFCQUFXLEVBQUUsUUFBUSxFQUFSLGtCQUFRLEVBQUUsQ0FBQztRQUNsQyxDQUFDO2FBQU0sQ0FBQztZQUNQLG1CQUFtQjtZQUNuQixNQUFNLGVBQWUsR0FBRyxHQUE2QyxDQUFDO1lBQ3RFLElBQUksZUFBZSxFQUFFLE1BQU0sRUFBRSxXQUFXLElBQUksZUFBZSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQztnQkFDL0UsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDO1lBQy9CLENBQUM7UUFDRixDQUFDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbEIsQ0FBQztJQUVELFNBQWdCLE1BQU0sQ0FBQyxNQUFnQztRQUN0RCxTQUFTLENBQUMsSUFBQSxzQkFBWSxFQUFDLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBQSxxQkFBZSxHQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5RixDQUFDO0lBRUQsU0FBZ0IsT0FBTyxDQUFDLE1BQWdDO1FBQ3ZELFNBQVMsQ0FBQyxJQUFBLHNCQUFZLEVBQUMsT0FBTyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFBLHFCQUFlLEdBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzlGLENBQUMifQ==