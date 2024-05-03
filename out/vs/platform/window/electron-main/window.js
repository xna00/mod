/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron"], function (require, exports, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WindowError = exports.WindowMode = exports.defaultAuxWindowState = exports.defaultWindowState = exports.UnloadReason = exports.LoadReason = void 0;
    var LoadReason;
    (function (LoadReason) {
        /**
         * The window is loaded for the first time.
         */
        LoadReason[LoadReason["INITIAL"] = 1] = "INITIAL";
        /**
         * The window is loaded into a different workspace context.
         */
        LoadReason[LoadReason["LOAD"] = 2] = "LOAD";
        /**
         * The window is reloaded.
         */
        LoadReason[LoadReason["RELOAD"] = 3] = "RELOAD";
    })(LoadReason || (exports.LoadReason = LoadReason = {}));
    var UnloadReason;
    (function (UnloadReason) {
        /**
         * The window is closed.
         */
        UnloadReason[UnloadReason["CLOSE"] = 1] = "CLOSE";
        /**
         * All windows unload because the application quits.
         */
        UnloadReason[UnloadReason["QUIT"] = 2] = "QUIT";
        /**
         * The window is reloaded.
         */
        UnloadReason[UnloadReason["RELOAD"] = 3] = "RELOAD";
        /**
         * The window is loaded into a different workspace context.
         */
        UnloadReason[UnloadReason["LOAD"] = 4] = "LOAD";
    })(UnloadReason || (exports.UnloadReason = UnloadReason = {}));
    const defaultWindowState = function (mode = 1 /* WindowMode.Normal */) {
        return {
            width: 1024,
            height: 768,
            mode
        };
    };
    exports.defaultWindowState = defaultWindowState;
    const defaultAuxWindowState = function () {
        // Auxiliary windows are being created from a `window.open` call
        // that sets `windowFeatures` that encode the desired size and
        // position of the new window (`top`, `left`).
        // In order to truly override this to a good default window state
        // we need to set not only width and height but also x and y to
        // a good location on the primary display.
        const width = 800;
        const height = 600;
        const workArea = electron_1.screen.getPrimaryDisplay().workArea;
        const x = Math.max(workArea.x + (workArea.width / 2) - (width / 2), 0);
        const y = Math.max(workArea.y + (workArea.height / 2) - (height / 2), 0);
        return {
            x,
            y,
            width,
            height,
            mode: 1 /* WindowMode.Normal */
        };
    };
    exports.defaultAuxWindowState = defaultAuxWindowState;
    var WindowMode;
    (function (WindowMode) {
        WindowMode[WindowMode["Maximized"] = 0] = "Maximized";
        WindowMode[WindowMode["Normal"] = 1] = "Normal";
        WindowMode[WindowMode["Minimized"] = 2] = "Minimized";
        WindowMode[WindowMode["Fullscreen"] = 3] = "Fullscreen";
    })(WindowMode || (exports.WindowMode = WindowMode = {}));
    var WindowError;
    (function (WindowError) {
        /**
         * Maps to the `unresponsive` event on a `BrowserWindow`.
         */
        WindowError[WindowError["UNRESPONSIVE"] = 1] = "UNRESPONSIVE";
        /**
         * Maps to the `render-process-gone` event on a `WebContents`.
         */
        WindowError[WindowError["PROCESS_GONE"] = 2] = "PROCESS_GONE";
        /**
         * Maps to the `did-fail-load` event on a `WebContents`.
         */
        WindowError[WindowError["LOAD"] = 3] = "LOAD";
    })(WindowError || (exports.WindowError = WindowError = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlUm9vdCI6ImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9tb2QvbW9kL2J1aWxkdnNjb2RlL3ZzY29kZS9zcmMvIiwic291cmNlcyI6WyJ2cy9wbGF0Zm9ybS93aW5kb3cvZWxlY3Ryb24tbWFpbi93aW5kb3cudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7Ozs7O0lBcUZoRyxJQUFrQixVQWdCakI7SUFoQkQsV0FBa0IsVUFBVTtRQUUzQjs7V0FFRztRQUNILGlEQUFXLENBQUE7UUFFWDs7V0FFRztRQUNILDJDQUFJLENBQUE7UUFFSjs7V0FFRztRQUNILCtDQUFNLENBQUE7SUFDUCxDQUFDLEVBaEJpQixVQUFVLDBCQUFWLFVBQVUsUUFnQjNCO0lBRUQsSUFBa0IsWUFxQmpCO0lBckJELFdBQWtCLFlBQVk7UUFFN0I7O1dBRUc7UUFDSCxpREFBUyxDQUFBO1FBRVQ7O1dBRUc7UUFDSCwrQ0FBSSxDQUFBO1FBRUo7O1dBRUc7UUFDSCxtREFBTSxDQUFBO1FBRU47O1dBRUc7UUFDSCwrQ0FBSSxDQUFBO0lBQ0wsQ0FBQyxFQXJCaUIsWUFBWSw0QkFBWixZQUFZLFFBcUI3QjtJQVlNLE1BQU0sa0JBQWtCLEdBQUcsVUFBVSxJQUFJLDRCQUFvQjtRQUNuRSxPQUFPO1lBQ04sS0FBSyxFQUFFLElBQUk7WUFDWCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUk7U0FDSixDQUFDO0lBQ0gsQ0FBQyxDQUFDO0lBTlcsUUFBQSxrQkFBa0Isc0JBTTdCO0lBRUssTUFBTSxxQkFBcUIsR0FBRztRQUVwQyxnRUFBZ0U7UUFDaEUsOERBQThEO1FBQzlELDhDQUE4QztRQUM5QyxpRUFBaUU7UUFDakUsK0RBQStEO1FBQy9ELDBDQUEwQztRQUUxQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUM7UUFDbEIsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ25CLE1BQU0sUUFBUSxHQUFHLGlCQUFNLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxRQUFRLENBQUM7UUFDckQsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXpFLE9BQU87WUFDTixDQUFDO1lBQ0QsQ0FBQztZQUNELEtBQUs7WUFDTCxNQUFNO1lBQ04sSUFBSSwyQkFBbUI7U0FDdkIsQ0FBQztJQUNILENBQUMsQ0FBQztJQXRCVyxRQUFBLHFCQUFxQix5QkFzQmhDO0lBRUYsSUFBa0IsVUFLakI7SUFMRCxXQUFrQixVQUFVO1FBQzNCLHFEQUFTLENBQUE7UUFDVCwrQ0FBTSxDQUFBO1FBQ04scURBQVMsQ0FBQTtRQUNULHVEQUFVLENBQUE7SUFDWCxDQUFDLEVBTGlCLFVBQVUsMEJBQVYsVUFBVSxRQUszQjtJQU9ELElBQWtCLFdBZ0JqQjtJQWhCRCxXQUFrQixXQUFXO1FBRTVCOztXQUVHO1FBQ0gsNkRBQWdCLENBQUE7UUFFaEI7O1dBRUc7UUFDSCw2REFBZ0IsQ0FBQTtRQUVoQjs7V0FFRztRQUNILDZDQUFRLENBQUE7SUFDVCxDQUFDLEVBaEJpQixXQUFXLDJCQUFYLFdBQVcsUUFnQjVCIn0=